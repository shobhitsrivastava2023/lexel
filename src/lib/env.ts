import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  server: {
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
    POLAR_PRODUCT_ID: z.string().min(1),
    POLAR_METER_VOICE_CREATION: z.string().min(1),
    POLAR_METER_TTS_GENERATION: z.string().min(1),
    POLAR_METER_TTS_PROPERTY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    APP_URL: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    CHATTERBOX_API_URL: z.url(),
    CHATTERBOX_API_KEY: z.string().min(1),
    /** Optional. When set, the Multilingual voice uses this endpoint (23 languages, one voice). */
    CHATTERBOX_MULTILINGUAL_API_URL: z.url().optional(),
    /**
     * Optional translation config.
     * When configured, the dashboard Live Translation panel will call this provider.
     * Example: TRANSLATE_PROVIDER=deepl with TRANSLATE_DEEPL_API_KEY set.
     */
    TRANSLATE_PROVIDER: z.enum(["deepl"]).optional(),
    TRANSLATE_DEEPL_API_KEY: z.string().min(1).optional(),
    /** Fish Audio API (voice agent realtime TTS). */
    FISH_API_KEY: z.string().min(1).optional(),
    /** Google AI Studio key for Gemini (voice agent). */
    GEMINI_API_KEY: z.string().min(1).optional(),
    /** Fish realtime TTS backend header (`model`). See fish-audio SDK `Backends`. */
    FISH_TTS_BACKEND: z
      .enum(["speech-1.5", "speech-1.6", "agent-x0", "s1", "s1-mini"])
      .optional(),
    /**
     * PCM sample rate (Hz) for Fish live TTS. Default 24000; set if audio plays at wrong speed.
     */
    FISH_TTS_PCM_SAMPLE_RATE: z.coerce.number().int().min(8000).max(96000).optional(),
    /**
     * Fish live TTS buffer size (chars) before synthesizing; lower = lower latency.
     * Fish WebSocket buffers until chunk_length unless you flush (SDK streams text only).
     */
    FISH_TTS_CHUNK_LENGTH: z.coerce.number().int().min(24).max(400).optional(),
    /** Gemini model id (default cheap/efficient: gemini-2.0-flash). */
    GEMINI_MODEL: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
