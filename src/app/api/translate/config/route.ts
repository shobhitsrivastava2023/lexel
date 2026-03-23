import { getLibreTranslateAllowedLanguageIds } from "@/lib/translate-config";

/**
 * Lets the Live Translation panel match language dropdowns to LibreTranslate `--load-only`.
 */
export async function GET() {
  const allowedTargetLanguageIds = getLibreTranslateAllowedLanguageIds();
  return Response.json({ allowedTargetLanguageIds });
}
