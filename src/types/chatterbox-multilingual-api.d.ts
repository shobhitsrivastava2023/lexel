/**
 * Types for the Chatterbox Multilingual TTS API (Modal app: chatterbox_multilingual_tts.py).
 * POST /generate returns audio/wav. Optional GET /languages returns supported language_ids.
 */
export interface ChatterboxMultilingualPaths {
  "/generate": {
    post: {
      requestBody: {
        content: {
          "application/json": {
            prompt: string;
            voice_key: string;
            language_id: string;
            temperature?: number;
            cfg_weight?: number;
            exaggeration?: number;
          };
        };
      };
      responses: {
        200: { content: { "audio/wav": unknown } };
        400: { content: { "application/json": { detail?: string } } };
        422: { content: { "application/json": { detail?: unknown } } };
      };
    };
  };
}
