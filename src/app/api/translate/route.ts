import { z } from "zod";

import { translateText, TranslationConfigError } from "@/lib/translate";
import {
  MULTILINGUAL_LANGUAGE_IDS,
  type MultilingualLanguageId,
} from "@/features/text-to-speech/data/multilingual-languages";

const bodySchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().min(2).max(10).optional(),
  targetLang: z.string().min(2).max(10),
});

export async function POST(request: Request) {
  let parsedBody: z.infer<typeof bodySchema>;

  try {
    const json = await request.json();
    parsedBody = bodySchema.parse(json);
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { text, sourceLang, targetLang } = parsedBody;

  const normalizedTarget = targetLang.toLowerCase() as MultilingualLanguageId;
  if (!MULTILINGUAL_LANGUAGE_IDS.includes(normalizedTarget)) {
    return Response.json(
      {
        error: "Unsupported target language",
        supportedLanguages: MULTILINGUAL_LANGUAGE_IDS,
      },
      { status: 400 },
    );
  }

  try {
    const translatedText = await translateText({
      text,
      sourceLang,
      targetLang: normalizedTarget,
    });

    return Response.json({ translatedText });
  } catch (error) {
    if (error instanceof TranslationConfigError) {
      return Response.json(
        { error: error.message },
        { status: 503 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error during translation";

    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}

