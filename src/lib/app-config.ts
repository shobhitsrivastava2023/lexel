import { env } from "@/lib/env";

export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

/** True when this deployment is a public BYOK demo (no Clerk keys on the host). */
export function isByokDemoDeployment() {
  return !isClerkConfigured();
}

export function getAppUrl() {
  if (env.APP_URL?.trim()) {
    return env.APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  return "http://localhost:3000";
}

export function isDatabaseConfigured() {
  return Boolean(env.DATABASE_URL?.trim());
}

export function isR2Configured() {
  return Boolean(
    env.R2_ACCOUNT_ID?.trim() &&
      env.R2_ACCESS_KEY_ID?.trim() &&
      env.R2_SECRET_ACCESS_KEY?.trim() &&
      env.R2_BUCKET_NAME?.trim(),
  );
}

export function isPersistenceConfigured() {
  return isDatabaseConfigured() && isR2Configured();
}

export function isPolarConfigured() {
  return Boolean(
    env.POLAR_ACCESS_TOKEN?.trim() && env.POLAR_PRODUCT_ID?.trim(),
  );
}

export function isServerChatterboxConfigured() {
  return Boolean(env.CHATTERBOX_API_URL?.trim() && env.CHATTERBOX_API_KEY?.trim());
}

export function hasGuestOrServerChatterbox(
  guestKeys?: { CHATTERBOX_API_URL?: string; CHATTERBOX_API_KEY?: string } | null,
) {
  const guestUrl = guestKeys?.CHATTERBOX_API_URL?.trim();
  const guestKey = guestKeys?.CHATTERBOX_API_KEY?.trim();
  if (guestUrl && guestKey) return true;
  return isServerChatterboxConfigured();
}
