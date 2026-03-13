/**
 * Languages supported by Chatterbox Multilingual (23). ISO 639-1 codes.
 * Used for the Multilingual voice language dropdown.
 */
export const MULTILINGUAL_LANGUAGE_IDS = [
  "ar",
  "da",
  "de",
  "el",
  "en",
  "es",
  "fi",
  "fr",
  "he",
  "hi",
  "it",
  "ja",
  "ko",
  "ms",
  "nl",
  "no",
  "pl",
  "pt",
  "ru",
  "sv",
  "sw",
  "tr",
  "zh",
] as const;

export type MultilingualLanguageId = (typeof MULTILINGUAL_LANGUAGE_IDS)[number];

export const MULTILINGUAL_LANGUAGE_LABELS: Record<MultilingualLanguageId, string> =
  {
    ar: "Arabic",
    da: "Danish",
    de: "German",
    el: "Greek",
    en: "English",
    es: "Spanish",
    fi: "Finnish",
    fr: "French",
    he: "Hebrew",
    hi: "Hindi",
    it: "Italian",
    ja: "Japanese",
    ko: "Korean",
    ms: "Malay",
    nl: "Dutch",
    no: "Norwegian",
    pl: "Polish",
    pt: "Portuguese",
    ru: "Russian",
    sv: "Swedish",
    sw: "Swahili",
    tr: "Turkish",
    zh: "Chinese",
  };

export const MULTILINGUAL_LANGUAGE_OPTIONS = MULTILINGUAL_LANGUAGE_IDS.map(
  (id) => ({
    value: id,
    label: MULTILINGUAL_LANGUAGE_LABELS[id],
  }),
);
