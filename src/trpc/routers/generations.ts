import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { polar } from "@/lib/polar";
import { env } from "@/lib/env";
import { TRPCError } from "@trpc/server";
import { chatterbox, chatterboxMultilingual } from "@/lib/chatterbox-client";
import { prisma } from "@/lib/db";
import { uploadAudio } from "@/lib/r2";
import { isSubscriptionBypassEnabled } from "@/lib/subscription-access";
import { TEXT_MAX_LENGTH } from "@/features/text-to-speech/data/constants";
import { MULTILINGUAL_LANGUAGE_IDS } from "@/features/text-to-speech/data/multilingual-languages";
import { MULTILINGUAL_VOICE_NAME } from "@/features/voices/data/voice-scoping";
import { createTRPCRouter, orgProcedure } from "../init";

export const generationsRouter = createTRPCRouter({
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const generation = await prisma.generation.findUnique({
        where: { id: input.id, orgId: ctx.orgId },
        omit: {
          orgId: true,
          r2ObjectKey: true,
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        ...generation,
        audioUrl: `/api/audio/${generation.id}`,
      };
    }),
  
  getAll: orgProcedure.query(async ({ ctx }) => {
    const generations = await prisma.generation.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      omit: {
        orgId: true,
        r2ObjectKey: true,
      },
    });

    return generations;
  }),

  create: orgProcedure
    .input(
      z.object({
        text: z.string().min(1).max(TEXT_MAX_LENGTH),
        voiceId: z.string().min(1),
        temperature: z.number().min(0).max(2).default(0.8),
        topP: z.number().min(0).max(1).default(0.95),
        topK: z.number().min(1).max(10000).default(1000),
        repetitionPenalty: z.number().min(1).max(2).default(1.2),
        /** Required when voice is Multilingual (23-language TTS). ISO 639-1 code. */
        languageId: z.string().min(2).max(10).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!isSubscriptionBypassEnabled()) {
        // Check for active subscription before generation
        try {
          const customerState = await polar.customers.getStateExternal({
            externalId: ctx.orgId,
          });
          const hasActiveSubscription =
            (customerState.activeSubscriptions ?? []).length > 0;
          if (!hasActiveSubscription) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "SUBSCRIPTION_REQUIRED",
            });
          }
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          // Customer doesn't exist in Polar yet -> no subscription
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "SUBSCRIPTION_REQUIRED",
          });
        }
      }

      const voice = await prisma.voice.findUnique({
        where: {
          id: input.voiceId,
          OR: [
            { variant: "SYSTEM" },
            { variant: "CUSTOM", orgId: ctx.orgId, }
          ],
        },
        select: {
          id: true,
          name: true,
          r2ObjectKey: true,
        },
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voice not found",
        });
      }

      if (!voice.r2ObjectKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Voice audio not available",
        });
      }

      const isMultilingual = voice.name === MULTILINGUAL_VOICE_NAME;
      if (isMultilingual) {
        if (!input.languageId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Language is required for the Multilingual voice. Please select a language.",
          });
        }
        const lang = input.languageId.toLowerCase();
        if (!MULTILINGUAL_LANGUAGE_IDS.includes(lang as (typeof MULTILINGUAL_LANGUAGE_IDS)[number])) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unsupported language: ${input.languageId}. Choose one of the 23 supported languages.`,
          });
        }
        if (!chatterboxMultilingual) {
          throw new TRPCError({
            code: "FAILED_PRECONDITION",
            message: "Multilingual TTS is not configured. Set CHATTERBOX_MULTILINGUAL_API_URL to enable 23-language support.",
          });
        }
      }

      let data: ArrayBuffer;
      if (isMultilingual && chatterboxMultilingual) {
        const res = await chatterboxMultilingual.POST("/generate", {
          body: {
            prompt: input.text,
            voice_key: voice.r2ObjectKey,
            language_id: input.languageId!.toLowerCase(),
            temperature: input.temperature,
            cfg_weight: 0.5,
            exaggeration: 0.5,
          },
          parseAs: "arrayBuffer",
        });
        if (res.error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate audio",
          });
        }
        data = res.data as ArrayBuffer;
      } else {
        const result = await chatterbox.POST("/generate", {
          body: {
            prompt: input.text,
            voice_key: voice.r2ObjectKey,
            temperature: input.temperature,
            top_p: input.topP,
            top_k: input.topK,
            repetition_penalty: input.repetitionPenalty,
            norm_loudness: true,
          },
          parseAs: "arrayBuffer",
        });
        if (result.error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate audio",
          });
        }
        data = result.data as ArrayBuffer;
      }

      Sentry.logger.info("Generation started", {
        orgId: ctx.orgId,
        voiceId: input.voiceId,
        textLength: input.text.length,
      });

      const buffer = Buffer.from(data);
      let generationId: string | null = null;
      let r2ObjectKey: string | null = null;

      try {
        const generation = await prisma.generation.create({
          data: {
            orgId: ctx.orgId,
            text: input.text,
            voiceName: voice.name,
            voiceId: voice.id,
            temperature: input.temperature,
            topP: input.topP,
            topK: input.topK,
            repetitionPenalty: input.repetitionPenalty,
          },
          select: {
            id: true,
          },
        });

        generationId = generation.id;
        r2ObjectKey = `generations/orgs/${ctx.orgId}/${generation.id}`;

        await uploadAudio({ buffer, key: r2ObjectKey });

        await prisma.generation.update({
          where: {
            id: generation.id,
          },
          data: {
            r2ObjectKey,
          },
        });

        Sentry.logger.info("Audio generated", {
          orgId: ctx.orgId,
          generationId: generation.id,
        });
      } catch {
        if (generationId) {
          await prisma.generation
            .delete({
              where: {
                id: generationId,
              },
            })
            .catch(() => {});
        }

        Sentry.logger.error("Generation failed", {
          orgId: ctx.orgId,
          voiceId: input.voiceId,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to store generated audio",
        });
      }

      if (!generationId || !r2ObjectKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to store generated audio",
        });
      }

      // Ingest usage event to Polar (fire-and-forget, don't block response)
      polar.events
        .ingest({
          events: [
            {
              name: env.POLAR_METER_TTS_GENERATION,
              externalCustomerId: ctx.orgId,
              metadata: { [env.POLAR_METER_TTS_PROPERTY]: input.text.length },
              timestamp: new Date(),
            },
          ],
        })
        .catch(() => {
          // Silently fail - don't break the user experience for metering errors
        });

      return {
        id: generationId,
      };
    }),
});
