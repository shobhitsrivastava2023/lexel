import { env } from "@/lib/env";
import { effectiveGuestValue } from "@/lib/guest-keys/runtime";
import type { GuestKeys } from "@/lib/guest-keys/types";
import {
  MULTILINGUAL_LANGUAGE_IDS,
  type MultilingualLanguageId,
} from "@/features/text-to-speech/data/multilingual-languages";

function resolveTranslateProvider(guestKeys?: Partial<GuestKeys> | null) {
  const raw = effectiveGuestValue(
    "TRANSLATE_PROVIDER",
    env.TRANSLATE_PROVIDER,
    guestKeys,
  );
  if (raw === "deepl" || raw === "google" || raw === "libretranslate") {
    return raw;
  }
  return undefined;
}

/**
 * When using LibreTranslate with `--load-only` (e.g. en,es,fr), set
 * `LIBRETRANSLATE_LANGUAGE_IDS=en,es,fr` so the API and UI only offer those codes.
 * Returns `null` when there is no restriction (all multilingual IDs allowed).
 */
export function getLibreTranslateAllowedLanguageIds(
  guestKeys?: Partial<GuestKeys> | null,
): MultilingualLanguageId[] | null {
  if (resolveTranslateProvider(guestKeys) !== "libretranslate") {
    return null;
  }
  const raw = effectiveGuestValue(
    "LIBRETRANSLATE_LANGUAGE_IDS",
    env.LIBRETRANSLATE_LANGUAGE_IDS,
    guestKeys,
  )?.trim();
  if (!raw) return null;
  const parts = raw.split(/[\s,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const allowed: MultilingualLanguageId[] = [];
  for (const p of parts) {
    if (MULTILINGUAL_LANGUAGE_IDS.includes(p as MultilingualLanguageId)) {
      allowed.push(p as MultilingualLanguageId);
    }
  }
  return allowed.length > 0 ? allowed : null;
}
