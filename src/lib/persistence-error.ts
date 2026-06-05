import { TRPCError } from "@trpc/server";

export class PersistenceNotConfiguredError extends TRPCError {
  constructor() {
    super({
      code: "PRECONDITION_FAILED",
      message:
        "This demo host has no database or storage configured. Use Continue as guest with your Chatterbox keys for ephemeral TTS.",
    });
  }
}
