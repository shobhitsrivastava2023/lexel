"use client";

/** Client-safe check — mirrors server `isClerkConfigured()`. */
export function isClerkConfiguredClient() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}
