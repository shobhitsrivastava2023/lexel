import createClient from "openapi-fetch";
import type { paths } from "@/types/chatterbox-api";
import type { ChatterboxMultilingualPaths } from "@/types/chatterbox-multilingual-api";
import { effectiveGuestValue } from "@/lib/guest-keys/runtime";
import type { GuestKeys } from "@/lib/guest-keys/types";
import { env } from "./env";

function resolveChatterboxBaseUrl(guestKeys?: Partial<GuestKeys> | null) {
  return effectiveGuestValue(
    "CHATTERBOX_API_URL",
    env.CHATTERBOX_API_URL,
    guestKeys,
  );
}

function resolveChatterboxApiKey(guestKeys?: Partial<GuestKeys> | null) {
  return effectiveGuestValue(
    "CHATTERBOX_API_KEY",
    env.CHATTERBOX_API_KEY,
    guestKeys,
  );
}

export function getChatterboxClient(guestKeys?: Partial<GuestKeys> | null) {
  const baseUrl = resolveChatterboxBaseUrl(guestKeys);
  const apiKey = resolveChatterboxApiKey(guestKeys);

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Chatterbox is not configured. Add CHATTERBOX_API_URL and CHATTERBOX_API_KEY via Continue as guest.",
    );
  }

  return createClient<paths>({
    baseUrl,
    headers: {
      "x-api-key": apiKey,
    },
  });
}

export function getChatterboxMultilingualClient(
  guestKeys?: Partial<GuestKeys> | null,
) {
  const multilingualUrl = effectiveGuestValue(
    "CHATTERBOX_MULTILINGUAL_API_URL",
    env.CHATTERBOX_MULTILINGUAL_API_URL,
    guestKeys,
  );

  if (!multilingualUrl) return null;

  const apiKey = resolveChatterboxApiKey(guestKeys);
  if (!apiKey) {
    throw new Error(
      "Chatterbox API key is required for multilingual TTS.",
    );
  }

  return createClient<ChatterboxMultilingualPaths>({
    baseUrl: multilingualUrl,
    headers: {
      "x-api-key": apiKey,
    },
  });
}
