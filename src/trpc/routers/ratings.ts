import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

import { createTRPCRouter, orgProcedure } from "../init";

const mosScoreSchema = z.number().int().min(1).max(5);

export const ratingsRouter = createTRPCRouter({
  getForGeneration: orgProcedure
    .input(z.object({ generationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const generation = await prisma.generation.findFirst({
        where: {
          id: input.generationId,
          orgId: ctx.orgId,
        },
        select: {
          id: true,
        },
      });

      if (!generation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Generation not found",
        });
      }

      const [viewerRating, aggregate] = await Promise.all([
        prisma.generationRating.findUnique({
          where: {
            generationId_userId: {
              generationId: input.generationId,
              userId: ctx.userId,
            },
          },
          select: {
            id: true,
            overall: true,
            naturalness: true,
            clarity: true,
            intelligibility: true,
            comment: true,
            updatedAt: true,
          },
        }),
        prisma.generationRating.aggregate({
          where: {
            generationId: input.generationId,
            orgId: ctx.orgId,
          },
          _count: {
            _all: true,
          },
          _avg: {
            overall: true,
            naturalness: true,
            clarity: true,
            intelligibility: true,
          },
        }),
      ]);

      return {
        viewerRating,
        summary: {
          count: aggregate._count._all,
          overall: aggregate._avg.overall,
          naturalness: aggregate._avg.naturalness,
          clarity: aggregate._avg.clarity,
          intelligibility: aggregate._avg.intelligibility,
        },
      };
    }),

  upsertForGeneration: orgProcedure
    .input(
      z.object({
        generationId: z.string(),
        overall: mosScoreSchema,
        naturalness: mosScoreSchema,
        clarity: mosScoreSchema,
        intelligibility: mosScoreSchema,
        comment: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const generation = await prisma.generation.findFirst({
        where: {
          id: input.generationId,
          orgId: ctx.orgId,
        },
        select: {
          id: true,
        },
      });

      if (!generation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Generation not found",
        });
      }

      return prisma.generationRating.upsert({
        where: {
          generationId_userId: {
            generationId: input.generationId,
            userId: ctx.userId,
          },
        },
        create: {
          generationId: input.generationId,
          orgId: ctx.orgId,
          userId: ctx.userId,
          overall: input.overall,
          naturalness: input.naturalness,
          clarity: input.clarity,
          intelligibility: input.intelligibility,
          comment: input.comment?.length ? input.comment : null,
        },
        update: {
          overall: input.overall,
          naturalness: input.naturalness,
          clarity: input.clarity,
          intelligibility: input.intelligibility,
          comment: input.comment?.length ? input.comment : null,
        },
        select: {
          id: true,
          overall: true,
          naturalness: true,
          clarity: true,
          intelligibility: true,
          comment: true,
          updatedAt: true,
        },
      });
    }),
});
