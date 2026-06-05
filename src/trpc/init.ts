import * as Sentry from "@sentry/node";
import { initTRPC, TRPCError } from '@trpc/server';
import { getAppAuth } from "@/lib/clerk-app-auth";
import { parseGuestKeysFromHeaders } from "@/lib/guest-keys/codec";
import { runWithGuestKeys } from "@/lib/guest-keys/runtime";
import type { GuestKeys } from "@/lib/guest-keys/types";
import superjson from "superjson";

export type TRPCContext = {
  guestKeys: Partial<GuestKeys>;
};

export async function createTRPCContext(opts?: {
  req?: Request;
}): Promise<TRPCContext> {
  const guestKeys = opts?.req
    ? parseGuestKeysFromHeaders(opts.req.headers)
    : {};
  return { guestKeys };
}
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<TRPCContext>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({
    attachRpcInput: true,
  }),
);

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

const guestKeysMiddleware = t.middleware(async ({ ctx, next }) => {
  return runWithGuestKeys(ctx.guestKeys, () => next({ ctx }));
});

export const baseProcedure = t.procedure
  .use(sentryMiddleware)
  .use(guestKeysMiddleware);

// Authenticated procedure - calls auth() only when needed
export const authProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const { userId } = await getAppAuth();

  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: { ...ctx, userId },
  });
});

// Organization procedure - requires userId and orgId
export const orgProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const { userId, orgId } = await getAppAuth();

  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization required",
    });
  }

  return next({ ctx: { ...ctx, userId, orgId } });
});
