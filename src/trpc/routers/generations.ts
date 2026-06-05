import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { isPersistenceConfigured } from "@/lib/app-config";
import {
  getChatterboxClient,
  getChatterboxMultilingualClient,
} from "@/lib/chatterbox-client";
import { getDemoVoiceById } from "@/lib/demo-voices";
import { getPrismaClient } from "@/lib/db";
import { buildEphemeralAudioDataUrl } from "@/lib/ephemeral-generation";
import { env } from "@/lib/env";
import { getPolarClient } from "@/lib/polar";
import { uploadAudio } from "@/lib/r2";
import { isSubscriptionBypassedForRequest } from "@/lib/subscription-access";
import { TEXT_MAX_LENGTH } from "@/features/text-to-speech/data/constants";
import { MULTILINGUAL_LANGUAGE_IDS } from "@/features/text-to-speech/data/multilingual-languages";
import { MULTILINGUAL_VOICE_NAME } from "@/features/voices/data/voice-scoping";
import type { GuestKeys } from "@/lib/guest-keys/types";
import { createTRPCRouter, orgProcedure } from "../init";

type ResolvedVoice = {
  id: string;
  name: string;
  r2ObjectKey: string;
};

async function resolveVoice(
  voiceId: string,
  orgId: string,
): Promise<ResolvedVoice | null> {
  const demoVoice = getDemoVoiceById(voiceId);
  if (demoVoice) {
    return {
      id: demoVoice.id,
      name: demoVoice.name,
      r2ObjectKey: demoVoice.r2ObjectKey,
    };
  }

  const prisma = getPrismaClient();
  if (!prisma) return null;

  return prisma.voice.findUnique({
    where: {
      id: voiceId,
      OR: [{ variant: "SYSTEM" }, { variant: "CUSTOM", orgId }],
    },
    select: {
      id: true,
      name: true,
      r2ObjectKey: true,
    },
  }).then((voice) =>
    voice?.r2ObjectKey
      ? {
          id: voice.id,
          name: voice.name,
          r2ObjectKey: voice.r2ObjectKey,
        }
      : null,
  );
}

async function synthesizeAudio({
  input,
  voice,
  guestKeys,
}: {
  input: {
    text: string;
    temperature: number;
    topP: number;
    topK: number;
    repetitionPenalty: number;
    languageId?: string;
  };
  voice: ResolvedVoice;
  guestKeys: Partial<GuestKeys>;
}) {
  const isMultilingual = voice.name === MULTILINGUAL_VOICE_NAME;

  if (isMultilingual) {
    if (!input.languageId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Language is required for the Multilingual voice. Please select a language.",
      });
    }
    const lang = input.languageId.toLowerCase();
    if (
      !MULTILINGUAL_LANGUAGE_IDS.includes(
        lang as (typeof MULTILINGUAL_LANGUAGE_IDS)[number],
      )
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Unsupported language: ${input.languageId}. Choose one of the 23 supported languages.`,
      });
    }
    const chatterboxMultilingual = getChatterboxMultilingualClient(guestKeys);
    if (!chatterboxMultilingual) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Multilingual TTS is not configured. Add CHATTERBOX_MULTILINGUAL_API_URL in guest keys.",
      });
    }

    const res = await chatterboxMultilingual.POST("/generate", {
      body: {
        prompt: input.text,
        voice_key: voice.r2ObjectKey,
        language_id: lang,
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

    return Buffer.from(res.data as ArrayBuffer);
  }

  const chatterbox = getChatterboxClient(guestKeys);
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

  return Buffer.from(result.data as ArrayBuffer);
}

export const generationsRouter = createTRPCRouter({
  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const prisma = getPrismaClient();
      if (!prisma) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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
    const prisma = getPrismaClient();
    if (!prisma) {
      return [];
    }

    return prisma.generation.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      omit: {
        orgId: true,
        r2ObjectKey: true,
      },
    });
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
        languageId: z.string().min(2).max(10).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!(await isSubscriptionBypassedForRequest())) {
        const polar = getPolarClient();
        if (!polar) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "SUBSCRIPTION_REQUIRED",
          });
        }

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
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "SUBSCRIPTION_REQUIRED",
          });
        }
      }

      const voice = await resolveVoice(input.voiceId, ctx.orgId);
      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voice not found",
        });
      }

      let buffer: Buffer;
      try {
        buffer = await synthesizeAudio({
          input,
          voice,
          guestKeys: ctx.guestKeys,
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        const message =
          error instanceof Error ? error.message : "Failed to generate audio";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }

      if (!isPersistenceConfigured()) {
        const ephemeralId = `ephemeral-${crypto.randomUUID()}`;
        return {
          id: ephemeralId,
          ephemeral: true as const,
          audioDataUrl: buildEphemeralAudioDataUrl(buffer),
          voiceName: voice.name,
          text: input.text,
          temperature: input.temperature,
          topP: input.topP,
          topK: input.topK,
          repetitionPenalty: input.repetitionPenalty,
        };
      }

      Sentry.logger.info("Generation started", {
        orgId: ctx.orgId,
        voiceId: input.voiceId,
        textLength: input.text.length,
      });

      const prisma = getPrismaClient()!;
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
          where: { id: generation.id },
          data: { r2ObjectKey },
        });

        Sentry.logger.info("Audio generated", {
          orgId: ctx.orgId,
          generationId: generation.id,
        });
      } catch {
        if (generationId) {
          await prisma.generation
            .delete({ where: { id: generationId } })
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

      const polar = getPolarClient();
      polar?.events
        .ingest({
          events: [
            {
              name: env.POLAR_METER_TTS_GENERATION ?? "tts_generation",
              externalCustomerId: ctx.orgId,
              metadata: {
                [env.POLAR_METER_TTS_PROPERTY ?? "characters"]:
                  input.text.length,
              },
              timestamp: new Date(),
            },
          ],
        })
        .catch(() => {});

      return {
        id: generationId!,
        ephemeral: false as const,
      };
    }),
});
