import { env } from "@/lib/env";
import { getLibreTranslateAllowedLanguageIds } from "@/lib/translate-config";
import {
  MULTILINGUAL_LANGUAGE_IDS,
  type MultilingualLanguageId,
} from "@/features/text-to-speech/data/multilingual-languages";

type TranslateParams = {
  text: string;
  sourceLang?: string | null;
  targetLang: MultilingualLanguageId;
};

export class TranslationConfigError extends Error {}

export async function translateText({
  text,
  sourceLang,
  targetLang,
}: TranslateParams): Promise<string> {
  const provider = env.TRANSLATE_PROVIDER;

  if (!provider) {
    throw new TranslationConfigError(
      "Translation provider is not configured. Set TRANSLATE_PROVIDER in the environment (and the matching API key if required).",
    );
  }

  if (!MULTILINGUAL_LANGUAGE_IDS.includes(targetLang)) {
    throw new Error(`Unsupported target language: ${targetLang}`);
  }

  const libreAllowed = getLibreTranslateAllowedLanguageIds();
  if (libreAllowed && !libreAllowed.includes(targetLang)) {
    throw new Error(
      `Target language "${targetLang}" is not enabled for LibreTranslate. Update LIBRETRANSLATE_LANGUAGE_IDS or load more language models.`,
    );
  }

  switch (provider) {
    case "deepl":
      return translateWithDeepL({ text, sourceLang, targetLang });
    case "google":
      return translateWithGoogle({ text, sourceLang, targetLang });
    case "libretranslate":
      return translateWithLibreTranslate({ text, sourceLang, targetLang });
    default:
      // Type guard, should never happen due to zod enum
      throw new TranslationConfigError(
        `Unsupported translation provider configured: ${provider}`,
      );
  }
}

const DEEPL_ENDPOINT_DEFAULT = "https://api-free.deepl.com/v2/translate";

const deeplLangMap: Record<MultilingualLanguageId, string> = {
  ar: "AR",
  da: "DA",
  de: "DE",
  el: "EL",
  en: "EN",
  es: "ES",
  fi: "FI",
  fr: "FR",
  he: "HE",
  hi: "HI",
  it: "IT",
  ja: "JA",
  ko: "KO",
  ms: "MS",
  nl: "NL",
  no: "NB", // Norwegian Bokmål
  pl: "PL",
  pt: "PT",
  ru: "RU",
  sv: "SV",
  sw: "SW",
  tr: "TR",
  zh: "ZH",
};

async function translateWithDeepL({
  text,
  sourceLang,
  targetLang,
}: TranslateParams): Promise<string> {
  const apiKey = env.TRANSLATE_DEEPL_API_KEY;

  if (!apiKey) {
    throw new TranslationConfigError(
      "TRANSLATE_DEEPL_API_KEY is not set. Add it to your environment to enable translation.",
    );
  }

  const endpoint = DEEPL_ENDPOINT_DEFAULT;

  const params = new URLSearchParams();
  params.append("text", text);

  const targetCode = deeplLangMap[targetLang];
  params.append("target_lang", targetCode);

  const normalizedSource = sourceLang?.trim();
  if (normalizedSource) {
    // If the caller passes e.g. "en" or "en-US", normalize to base code
    const base = normalizedSource.slice(0, 2).toLowerCase();
    const maybeId = MULTILINGUAL_LANGUAGE_IDS.find((id) => id === base);
    if (maybeId) {
      const sourceCode = deeplLangMap[maybeId];
      params.append("source_lang", sourceCode);
    }
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `DeepL-Auth-Key ${apiKey}`,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(
      `DeepL translation failed: ${res.status} ${res.statusText}${
        bodyText ? ` - ${bodyText}` : ""
      }`,
    );
  }

  const json = (await res.json()) as {
    translations?: { text: string }[];
  };

  if (!json.translations?.length) {
    throw new Error("DeepL translation returned no results.");
  }

  return json.translations[0]?.text ?? text;
}

/** Google Cloud Translation API v2 language codes (mostly ISO 639-1; Chinese uses zh-CN). */
const googleLangMap: Record<MultilingualLanguageId, string> = {
  ar: "ar",
  da: "da",
  de: "de",
  el: "el",
  en: "en",
  es: "es",
  fi: "fi",
  fr: "fr",
  he: "he",
  hi: "hi",
  it: "it",
  ja: "ja",
  ko: "ko",
  ms: "ms",
  nl: "nl",
  no: "no",
  pl: "pl",
  pt: "pt",
  ru: "ru",
  sv: "sv",
  sw: "sw",
  tr: "tr",
  zh: "zh-CN",
};

const GOOGLE_TRANSLATE_V2_URL =
  "https://translation.googleapis.com/language/translate/v2";

async function translateWithGoogle({
  text,
  sourceLang,
  targetLang,
}: TranslateParams): Promise<string> {
  const apiKey = env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    throw new TranslationConfigError(
      "GOOGLE_TRANSLATE_API_KEY is not set. Create an API key in Google Cloud (Translation API enabled) and add it to your environment.",
    );
  }

  const targetCode = googleLangMap[targetLang];

  const body: {
    q: string;
    target: string;
    format: "text";
    source?: string;
  } = {
    q: text,
    target: targetCode,
    format: "text",
  };

  const normalizedSource = sourceLang?.trim();
  if (normalizedSource) {
    const base = normalizedSource.slice(0, 2).toLowerCase();
    const maybeId = MULTILINGUAL_LANGUAGE_IDS.find((id) => id === base);
    if (maybeId) {
      body.source = googleLangMap[maybeId];
    }
  }

  const url = `${GOOGLE_TRANSLATE_V2_URL}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    data?: { translations?: { translatedText: string }[] };
    error?: { message?: string; code?: number };
  };

  if (!res.ok) {
    const apiMsg = json.error?.message ?? res.statusText;
    throw new Error(
      `Google Cloud Translation failed: ${res.status} ${apiMsg}`,
    );
  }

  const translated = json.data?.translations?.[0]?.translatedText;
  if (translated == null || translated === "") {
    throw new Error("Google Cloud Translation returned no results.");
  }

  return translated;
}

/** LibreTranslate /translate API uses ISO-style codes (see https://docs.libretranslate.com/guides/api_usage/). */
const libreTranslateLangMap: Record<MultilingualLanguageId, string> = {
  ar: "ar",
  da: "da",
  de: "de",
  el: "el",
  en: "en",
  es: "es",
  fi: "fi",
  fr: "fr",
  he: "he",
  hi: "hi",
  it: "it",
  ja: "ja",
  ko: "ko",
  ms: "ms",
  nl: "nl",
  no: "no",
  pl: "pl",
  pt: "pt",
  ru: "ru",
  sv: "sv",
  sw: "sw",
  tr: "tr",
  zh: "zh",
};

function libreTranslateEndpoint(): string {
  const base = env.LIBRETRANSLATE_URL.replace(/\/+$/, "");
  return `${base}/translate`;
}

async function translateWithLibreTranslate({
  text,
  sourceLang,
  targetLang,
}: TranslateParams): Promise<string> {
  const targetCode = libreTranslateLangMap[targetLang];

  const body: {
    q: string;
    source: string;
    target: string;
    format: "text";
    api_key?: string;
  } = {
    q: text,
    target: targetCode,
    format: "text",
    source: "auto",
  };

  const normalizedSource = sourceLang?.trim();
  if (normalizedSource) {
    const base = normalizedSource.slice(0, 2).toLowerCase();
    const maybeId = MULTILINGUAL_LANGUAGE_IDS.find((id) => id === base);
    if (maybeId) {
      body.source = libreTranslateLangMap[maybeId];
    }
  }

  const apiKey = env.LIBRETRANSLATE_API_KEY;
  if (apiKey) {
    body.api_key = apiKey;
  }

  const res = await fetch(libreTranslateEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawBody = await res.text();
  let json: { translatedText?: string; error?: string } = {};
  try {
    json = JSON.parse(rawBody) as typeof json;
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    const detail = json.error ?? rawBody;
    throw new Error(
      `LibreTranslate failed: ${res.status} ${res.statusText}${
        detail ? ` — ${detail}` : ""
      }`,
    );
  }

  const translated = json.translatedText;
  if (translated == null || translated === "") {
    throw new Error("LibreTranslate returned no translation.");
  }

  return translated;
}

