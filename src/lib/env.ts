import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  server: {
    /**
     * Development only: skip Clerk redirects (see `src/proxy.ts`) and treat API/tRPC
     * as signed in with stable mock user/org ids. Ignored when NODE_ENV is production.
     */
    DISABLE_CLERK_AUTH: z.coerce.boolean().optional().default(false),
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
    POLAR_PRODUCT_ID: z.string().optional(),
    POLAR_METER_VOICE_CREATION: z
      .string()
      .optional()
      .default("voice_creation"),
    POLAR_METER_TTS_GENERATION: z
      .string()
      .optional()
      .default("tts_generation"),
    POLAR_METER_TTS_PROPERTY: z.string().optional().default("characters"),
    DATABASE_URL: z.string().optional(),
    APP_URL: z.string().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    CHATTERBOX_API_URL: z.string().url().optional(),
    CHATTERBOX_API_KEY: z.string().optional(),
    CHATTERBOX_MULTILINGUAL_API_URL: z.string().url().optional(),
    TRANSLATE_PROVIDER: z.enum(["deepl", "google", "libretranslate"]).optional(),
    TRANSLATE_DEEPL_API_KEY: z.string().optional(),
    GOOGLE_TRANSLATE_API_KEY: z.string().optional(),
    LIBRETRANSLATE_URL: z
      .string()
      .url()
      .optional()
      .default("http://localhost:5000"),
    LIBRETRANSLATE_API_KEY: z.string().optional(),
    LIBRETRANSLATE_LANGUAGE_IDS: z.string().optional(),
    FISH_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().optional(),
    COMPOSIO_API_KEY: z.string().optional(),
    COMPOSIO_CONNECTED_ACCOUNT_ID: z.string().optional(),
    VOICE_AGENT_TOOL_MAX_STEPS: z.coerce.number().int().min(1).max(8).optional(),
    GEMINI_API_KEY: z.string().optional(),
    VOICE_AGENT_LLM_PROVIDER: z.enum(["openai", "gemini"]).optional().default("openai"),
    FISH_TTS_BACKEND: z
      .enum(["speech-1.5", "speech-1.6", "agent-x0", "s1", "s1-mini"])
      .optional(),
    FISH_TTS_PCM_SAMPLE_RATE: z.coerce.number().int().min(8000).max(96000).optional(),
    FISH_TTS_CHUNK_LENGTH: z.coerce.number().int().min(24).max(400).optional(),
    GEMINI_MODEL: z.string().optional(),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
