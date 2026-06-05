export type GuestKeys = {
  CHATTERBOX_API_URL: string;
  CHATTERBOX_API_KEY: string;
  CHATTERBOX_MULTILINGUAL_API_URL?: string;
  TRANSLATE_PROVIDER?: "deepl" | "google" | "libretranslate";
  GOOGLE_TRANSLATE_API_KEY?: string;
  TRANSLATE_DEEPL_API_KEY?: string;
  LIBRETRANSLATE_URL?: string;
  LIBRETRANSLATE_API_KEY?: string;
  LIBRETRANSLATE_LANGUAGE_IDS?: string;
  FISH_API_KEY?: string;
  VOICE_AGENT_LLM_PROVIDER?: "openai" | "gemini";
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  FISH_TTS_BACKEND?: string;
  FISH_TTS_PCM_SAMPLE_RATE?: string;
  FISH_TTS_CHUNK_LENGTH?: string;
};

export type GuestKeyField = {
  key: keyof GuestKeys;
  label: string;
  description: string;
  required?: boolean;
  type?: "text" | "password" | "url" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  feature: "tts" | "translation" | "voice-agent";
};
