import { getAppUrl } from "@/lib/app-config";

/**
 * Restrict post-auth redirects to same origin as APP_URL (open-redirect hardening).
 */
export function safePostAuthRedirectPath(redirectUrl: string | undefined): string {
  if (!redirectUrl?.trim()) return "/";
  try {
    const appUrl = getAppUrl();
    const resolved = new URL(redirectUrl, appUrl);
    const app = new URL(appUrl);
    if (resolved.origin !== app.origin) return "/";
    const path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
    return path === "" ? "/" : path;
  } catch {
    return "/";
  }
}
