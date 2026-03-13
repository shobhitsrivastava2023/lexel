/** System voice used for 23-language TTS (Chatterbox Multilingual). Use a female WAV (e.g. copy Abigail.wav to Multilingual.wav). */
export const MULTILINGUAL_VOICE_NAME = "Multilingual" as const;

export const CANONICAL_SYSTEM_VOICE_NAMES = [
  "Aaron",
  "Abigail",
  "Anaya",
  "Andy",
  "Archer",
  "Brian",
  "Chloe",
  "Dylan",
  "Emmanuel",
  "Ethan",
  "Evelyn",
  "Gavin",
  "Gordon",
  "Ivan",
  "Laura",
  "Lucy",
  "Madison",
  "Marisol",
  "Meera",
  "Walter",
  MULTILINGUAL_VOICE_NAME,
] as const;
