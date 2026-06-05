import { parseGuestKeysFromHeaders } from "@/lib/guest-keys/codec";
import { runWithGuestKeys } from "@/lib/guest-keys/runtime";
import { getLibreTranslateAllowedLanguageIds } from "@/lib/translate-config";

/**
 * Lets the Live Translation panel match language dropdowns to LibreTranslate `--load-only`.
 */
export async function GET(request: Request) {
  const guestKeys = parseGuestKeysFromHeaders(request.headers);
  const allowedTargetLanguageIds = runWithGuestKeys(guestKeys, () =>
    getLibreTranslateAllowedLanguageIds(guestKeys),
  );
  return Response.json({ allowedTargetLanguageIds });
}
