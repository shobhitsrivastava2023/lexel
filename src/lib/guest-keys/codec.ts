import type { GuestKeys } from "@/lib/guest-keys/types";

export const GUEST_MODE_STORAGE_KEY = "lexel_guest_mode";
export const GUEST_KEYS_STORAGE_KEY = "lexel_guest_keys";
export const GUEST_COOKIE_NAME = "lexel_guest";
export const GUEST_KEYS_HEADER = "x-lexel-guest-keys";

const GUEST_KEY_NAMES = new Set<string>([
  "CHATTERBOX_API_URL",
  "CHATTERBOX_API_KEY",
  "CHATTERBOX_MULTILINGUAL_API_URL",
  "TRANSLATE_PROVIDER",
  "GOOGLE_TRANSLATE_API_KEY",
  "TRANSLATE_DEEPL_API_KEY",
  "LIBRETRANSLATE_URL",
  "LIBRETRANSLATE_API_KEY",
  "LIBRETRANSLATE_LANGUAGE_IDS",
  "FISH_API_KEY",
  "VOICE_AGENT_LLM_PROVIDER",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "FISH_TTS_BACKEND",
  "FISH_TTS_PCM_SAMPLE_RATE",
  "FISH_TTS_CHUNK_LENGTH",
]);

export function sanitizeGuestKeys(
  input: Record<string, unknown> | null | undefined,
): Partial<GuestKeys> {
  if (!input || typeof input !== "object") return {};

  const out: Partial<GuestKeys> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!GUEST_KEY_NAMES.has(key)) continue;
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    (out as Record<string, string>)[key] = trimmed;
  }
  return out;
}

export function encodeGuestKeys(keys: Partial<GuestKeys>): string {
  return Buffer.from(JSON.stringify(keys), "utf8").toString("base64");
}

export function decodeGuestKeysHeader(
  headerValue: string | null | undefined,
): Partial<GuestKeys> {
  if (!headerValue?.trim()) return {};
  try {
    const json = Buffer.from(headerValue, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return sanitizeGuestKeys(parsed);
  } catch {
    return {};
  }
}

export function parseGuestKeysFromHeaders(
  headers: Headers | { get(name: string): string | null },
): Partial<GuestKeys> {
  return decodeGuestKeysHeader(headers.get(GUEST_KEYS_HEADER));
}
