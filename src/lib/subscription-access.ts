import { isPolarConfigured } from "@/lib/app-config";
import { isGuestSession } from "@/lib/guest-keys/session";

export function isSubscriptionBypassEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function isSubscriptionBypassedForRequest() {
  if (!isPolarConfigured()) return true;
  if (isSubscriptionBypassEnabled()) return true;
  return isGuestSession();
}
