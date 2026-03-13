import createClient from "openapi-fetch";
import type { paths } from "@/types/chatterbox-api";
import type { ChatterboxMultilingualPaths } from "@/types/chatterbox-multilingual-api";
import { env } from "./env";

export const chatterbox = createClient<paths>({
  baseUrl: env.CHATTERBOX_API_URL,
  headers: {
    "x-api-key": env.CHATTERBOX_API_KEY,
  },
});

/** Only set when CHATTERBOX_MULTILINGUAL_API_URL is configured. Use for the Multilingual voice (23 languages). */
const multilingualUrl = env.CHATTERBOX_MULTILINGUAL_API_URL;
export const chatterboxMultilingual = multilingualUrl
  ? createClient<ChatterboxMultilingualPaths>({
      baseUrl: multilingualUrl,
      headers: {
        "x-api-key": env.CHATTERBOX_API_KEY,
      },
    })
  : null;
