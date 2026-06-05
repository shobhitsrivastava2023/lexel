import type { VoiceCategory } from "@/generated/prisma/client";
import { MULTILINGUAL_VOICE_NAME } from "@/features/voices/data/voice-scoping";

export type DemoVoice = {
  id: string;
  name: string;
  description: string;
  category: VoiceCategory;
  language: string;
  variant: "SYSTEM";
  /** Path on the visitor's Chatterbox / R2 mount */
  r2ObjectKey: string;
};

/**
 * Static voices for BYOK demo deployments without a host database.
 * Visitors must have matching audio at these paths on their Chatterbox service.
 */
export const DEMO_SYSTEM_VOICES: DemoVoice[] = [
  {
    id: "demo-default",
    name: "Default",
    description: "Default reference voice (voices/system/default.wav on your TTS host)",
    category: "GENERAL",
    language: "en-US",
    variant: "SYSTEM",
    r2ObjectKey: "voices/system/default.wav",
  },
  {
    id: "demo-multilingual",
    name: MULTILINGUAL_VOICE_NAME,
    description: "23-language voice — requires your multilingual Chatterbox URL in guest keys",
    category: "GENERAL",
    language: "multi",
    variant: "SYSTEM",
    r2ObjectKey: "voices/system/default.wav",
  },
];

export function getDemoVoiceById(id: string) {
  return DEMO_SYSTEM_VOICES.find((voice) => voice.id === id) ?? null;
}
