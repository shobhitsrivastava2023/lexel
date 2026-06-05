import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { isDatabaseConfigured } from "@/lib/app-config";
import { DEMO_SYSTEM_VOICES } from "@/lib/demo-voices";
import { getPrismaClient } from "@/lib/db";
import { deleteAudio } from "@/lib/r2";
import { createTRPCRouter, orgProcedure } from "../init";

export const voicesRouter = createTRPCRouter({
  getAll: orgProcedure
    .input(
      z
        .object({
          query: z.string().trim().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const searchFilter = input?.query
        ? {
            OR: [
              {
                name: {
                  contains: input.query,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: input.query,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {};

      if (!isDatabaseConfigured()) {
        const query = input?.query?.toLowerCase();
        const system = DEMO_SYSTEM_VOICES.filter((voice) => {
          if (!query) return true;
          return (
            voice.name.toLowerCase().includes(query) ||
            voice.description.toLowerCase().includes(query)
          );
        }).map(({ r2ObjectKey: _r2, ...voice }) => voice);

        return { custom: [], system };
      }

      const prisma = getPrismaClient()!;

      const [custom, system] = await Promise.all([
        prisma.voice.findMany({
          where: {
            variant: "CUSTOM",
            orgId: ctx.orgId,
            ...searchFilter,
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            language: true,
            variant: true,
          },
        }),
        prisma.voice.findMany({
          where: {
            variant: "SYSTEM",
            ...searchFilter,
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            language: true,
            variant: true,
          },
        }),
      ]);

      if (system.length === 0 && custom.length === 0) {
        const demo = DEMO_SYSTEM_VOICES.map(({ r2ObjectKey: _r2, ...voice }) => voice);
        return { custom: [], system: demo };
      }

      return { custom, system };
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!isDatabaseConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Voice management requires a configured database.",
        });
      }

      const prisma = getPrismaClient()!;

      const voice = await prisma.voice.findUnique({
        where: {
          id: input.id,
          variant: "CUSTOM",
          orgId: ctx.orgId,
        },
      });

      if (!voice) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (voice.r2ObjectKey) {
        await deleteAudio(voice.r2ObjectKey).catch(() => {});
      }

      await prisma.voice.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
