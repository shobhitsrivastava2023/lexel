import { env } from "@/lib/env";
import {
  MULTILINGUAL_LANGUAGE_IDS,
  type MultilingualLanguageId,
} from "@/features/text-to-speech/data/multilingual-languages";

/**
 * When using LibreTranslate with `--load-only` (e.g. en,es,fr), set
 * `LIBRETRANSLATE_LANGUAGE_IDS=en,es,fr` so the API and UI only offer those codes.
 * Returns `null` when there is no restriction (all multilingual IDs allowed).
 */
export function getLibreTranslateAllowedLanguageIds(): MultilingualLanguageId[] | null {
  if (env.TRANSLATE_PROVIDER !== "libretranslate") {
    return null;
  }
  const raw = env.LIBRETRANSLATE_LANGUAGE_IDS?.trim();
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
