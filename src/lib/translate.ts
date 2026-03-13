import { env } from "@/lib/env";
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
      "Translation provider is not configured. Set TRANSLATE_PROVIDER and its API key in the environment.",
    );
  }

  if (!MULTILINGUAL_LANGUAGE_IDS.includes(targetLang)) {
    throw new Error(`Unsupported target language: ${targetLang}`);
  }

  switch (provider) {
    case "deepl":
      return translateWithDeepL({ text, sourceLang, targetLang });
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

