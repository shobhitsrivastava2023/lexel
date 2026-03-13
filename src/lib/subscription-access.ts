export function isSubscriptionBypassEnabled() {
  return process.env.NODE_ENV !== "production";
}
