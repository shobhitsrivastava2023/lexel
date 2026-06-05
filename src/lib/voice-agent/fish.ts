import "server-only";

import { FishAudioClient, type Backends } from "fish-audio";

import { env } from "@/lib/env";
import { effectiveGuestValue } from "@/lib/guest-keys/runtime";

export function getFishVoiceAgentClient() {
  const apiKey = effectiveGuestValue("FISH_API_KEY", env.FISH_API_KEY);
  if (!apiKey) {
    throw new Error("FISH_API_KEY is not configured");
  }
  return new FishAudioClient({ apiKey });
}

const FISH_BACKENDS = [
  "speech-1.5",
  "speech-1.6",
  "agent-x0",
  "s1",
  "s1-mini",
] as const satisfies readonly Backends[];

export function getFishTtsBackend(): Backends {
  const raw =
    effectiveGuestValue("FISH_TTS_BACKEND", env.FISH_TTS_BACKEND) ?? "s1";
  return FISH_BACKENDS.includes(raw as Backends) ? (raw as Backends) : "s1";
}

/** Fish live PCM output sample rate (must match Fish output for correct playback). */
export function getFishTtsPcmSampleRate() {
  const raw = effectiveGuestValue(
    "FISH_TTS_PCM_SAMPLE_RATE",
    env.FISH_TTS_PCM_SAMPLE_RATE?.toString(),
  );
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 24_000;
}

/** Align with Fish `chunk_length` so audio starts without waiting for huge buffers. */
export function getFishTtsChunkLength() {
  const raw = effectiveGuestValue(
    "FISH_TTS_CHUNK_LENGTH",
    env.FISH_TTS_CHUNK_LENGTH?.toString(),
  );
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 72;
}
