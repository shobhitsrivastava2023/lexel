"use client";

import { encodeGuestKeys, GUEST_KEYS_HEADER } from "@/lib/guest-keys/codec";
import {
  loadGuestKeysFromStorage,
  loadGuestModeFromStorage,
} from "@/lib/guest-keys/client-storage";

export function buildGuestRequestHeaders(
  init?: HeadersInit,
): Headers {
  const headers = new Headers(init);

  if (loadGuestModeFromStorage()) {
    const keys = loadGuestKeysFromStorage();
    if (Object.keys(keys).length > 0) {
      headers.set(GUEST_KEYS_HEADER, encodeGuestKeys(keys));
    }
  }

  return headers;
}

export async function guestFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: buildGuestRequestHeaders(init?.headers),
  });
}
