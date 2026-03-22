import "server-only";

import { FishAudioClient } from "fish-audio";

import { env } from "@/lib/env";

export function getFishVoiceAgentClient() {
  const apiKey = env.FISH_API_KEY;
  if (!apiKey) {
    throw new Error("FISH_API_KEY is not configured");
  }
  return new FishAudioClient({ apiKey });
}

export function getFishTtsBackend() {
  return env.FISH_TTS_BACKEND ?? "s1";
}

/** Fish live PCM output sample rate (must match Fish output for correct playback). */
export function getFishTtsPcmSampleRate() {
  return env.FISH_TTS_PCM_SAMPLE_RATE ?? 24_000;
}

/** Align with Fish `chunk_length` so audio starts without waiting for huge buffers. */
export function getFishTtsChunkLength() {
  return env.FISH_TTS_CHUNK_LENGTH ?? 72;
}
