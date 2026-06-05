import "server-only";

import { auth as clerkAuth } from "@clerk/nextjs/server";

import { env } from "@/lib/env";
import { isGuestSession } from "@/lib/guest-keys/session";

/** Fixed ids when bypassing Clerk — data is org-scoped in Prisma. */
export const DEV_AUTH_BYPASS_USER_ID = "dev_user_lexel";
export const DEV_AUTH_BYPASS_ORG_ID = "dev_org_lexel";

export function isClerkAuthBypassed() {
  return (
    process.env.NODE_ENV !== "production" && Boolean(env.DISABLE_CLERK_AUTH)
  );
}

export async function isGuestAuthActive() {
  return isGuestSession();
}

/**
 * Clerk session, a stable dev user/org when `DISABLE_CLERK_AUTH` is set
 * (development only), or guest cookie session when continuing without sign-in.
 */
export async function getAppAuth() {
  if (isClerkAuthBypassed() || (await isGuestSession())) {
    return {
      userId: DEV_AUTH_BYPASS_USER_ID,
      orgId: DEV_AUTH_BYPASS_ORG_ID,
    };
  }
  return clerkAuth();
}
