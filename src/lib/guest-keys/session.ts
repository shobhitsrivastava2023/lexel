import "server-only";

import { cookies } from "next/headers";

import { GUEST_COOKIE_NAME } from "@/lib/guest-keys/codec";

export async function isGuestSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE_NAME)?.value === "1";
}
