export const EPHEMERAL_GENERATION_STORAGE_KEY = "lexel_ephemeral_generation";

export type EphemeralGenerationPayload = {
  id: string;
  text: string;
  voiceName: string;
  audioDataUrl: string;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
  createdAt: string;
};

export function buildEphemeralAudioDataUrl(buffer: Buffer) {
  return `data:audio/wav;base64,${buffer.toString("base64")}`;
}
