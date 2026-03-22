import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RealtimeEvents } from "fish-audio";
import { z } from "zod";

import { env } from "@/lib/env";
import { assertVoiceAgentSubscription, VoiceAgentSubscriptionError } from "@/lib/voice-agent-access";
import {
  getFishTtsBackend,
  getFishTtsChunkLength,
  getFishTtsPcmSampleRate,
  getFishVoiceAgentClient,
} from "@/lib/voice-agent/fish";

export const runtime = "nodejs";
export const maxDuration = 120;

const bodySchema = z.object({
  userText: z.string().min(1).max(2_000),
  referenceId: z.string().min(1).max(128),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8_000),
      }),
    )
    .max(24)
    .default([]),
  fishTemperature: z.number().min(0).max(1).optional(),
  geminiTemperature: z.number().min(0).max(2).optional(),
});

class TextPhraseQueue {
  private readonly buf: string[] = [];
  private waiter: ((r: IteratorResult<string>) => void) | null = null;
  private done = false;

  push(chunk: string) {
    if (this.done || !chunk) return;
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      w({ value: chunk, done: false });
    } else {
      this.buf.push(chunk);
    }
  }

  close() {
    if (this.done) return;
    this.done = true;
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      w({ value: undefined, done: true });
    }
  }

  private async next(): Promise<IteratorResult<string>> {
    if (this.buf.length > 0) {
      return { value: this.buf.shift()!, done: false };
    }
    if (this.done) {
      return { value: undefined, done: true };
    }
    return new Promise((resolve) => {
      this.waiter = resolve;
    });
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<string> {
    for (;;) {
      const n = await this.next();
      if (n.done) return;
      yield n.value!;
    }
  }
}

function toGeminiHistory(
  history: z.infer<typeof bodySchema>["history"],
): { role: "user" | "model"; parts: { text: string }[] }[] {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/** Avoid dumping multi-kB API payloads into the UI / logs. */
function formatVoiceAgentError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    /429|Too Many Requests|quota|RESOURCE_EXHAUSTED|Resource has been exhausted|free_tier|GenerateContent/i.test(
      raw,
    )
  ) {
    return (
      "Gemini quota exceeded (429). Free tier limits were hit for this model. " +
      "Wait and retry, set GEMINI_MODEL to another model (e.g. gemini-1.5-flash-8b), " +
      "or enable billing / upgrade in Google AI Studio."
    );
  }
  if (raw.length > 400) {
    return `${raw.slice(0, 400)}…`;
  }
  return raw;
}

async function bufferGeminiIntoPhrases(
  fullStream: AsyncIterable<{ text: () => string }>,
  signal: AbortSignal,
  phraseCharTarget: number,
  onPhrase: (phrase: string) => void,
  onTokenDelta: (delta: string) => void,
) {
  let buffer = "";
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  const flush = (force: boolean) => {
    clearTimer();
    const t = buffer.trim();
    if (!t) {
      buffer = "";
      return;
    }
    if (
      force ||
      buffer.length >= phraseCharTarget ||
      /[.!?。？！]["')\]]?\s*$/.test(buffer)
    ) {
      onPhrase(buffer);
      buffer = "";
    }
  };

  const schedule = () => {
    clearTimer();
    flushTimer = setTimeout(() => flush(true), 220);
  };

  try {
    for await (const chunk of fullStream) {
      if (signal.aborted) break;
      const t = chunk.text();
      if (!t) continue;
      onTokenDelta(t);
      buffer += t;
      if (buffer.length >= 160) flush(false);
      else schedule();
    }
    flush(true);
  } finally {
    clearTimer();
  }
}

export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const geminiKey = env.GEMINI_API_KEY;
  if (!env.FISH_API_KEY || !geminiKey) {
    return Response.json(
      {
        error:
          "Voice agent is not configured. Set FISH_API_KEY and GEMINI_API_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    await assertVoiceAgentSubscription(orgId);
  } catch (e) {
    if (e instanceof VoiceAgentSubscriptionError) {
      return Response.json({ error: "SUBSCRIPTION_REQUIRED" }, { status: 403 });
    }
    throw e;
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    body = bodySchema.parse(json);
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const signal = request.signal;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamEnded = false;
      const write = (obj: Record<string, unknown>) => {
        if (streamEnded || signal.aborted) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      const fishClient = getFishVoiceAgentClient();
      const backend = getFishTtsBackend();
      const pcmSampleRate = getFishTtsPcmSampleRate();
      const chunkLength = getFishTtsChunkLength();
      const phraseQueue = new TextPhraseQueue();

      const ttsRequest = {
        text: "",
        reference_id: body.referenceId,
        format: "pcm" as const,
        sample_rate: pcmSampleRate,
        chunk_length: chunkLength,
        normalize: true,
        latency: "balanced" as const,
        temperature: body.fishTemperature ?? 0.65,
      };

      const endHttp = () => {
        if (streamEnded) return;
        streamEnded = true;
        controller.close();
      };

      try {
        write({ type: "meta", pcmSampleRate });

        const connection = await fishClient.textToSpeech.convertRealtime(
          ttsRequest,
          phraseQueue,
          backend,
        );

        const onAbort = () => {
          phraseQueue.close();
          connection.close();
        };
        signal.addEventListener("abort", onAbort);

        const fishDone = new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            resolve();
          };
          connection.on(RealtimeEvents.CLOSE, finish);
          connection.on(RealtimeEvents.ERROR, finish);
        });

        const onAudio = (audio: unknown) => {
          if (signal.aborted) return;
          let buf: Buffer;
          if (audio instanceof Uint8Array) {
            buf = Buffer.from(audio);
          } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(audio)) {
            buf = audio as Buffer;
          } else {
            return;
          }
          write({
            type: "audio",
            b64: buf.toString("base64"),
          });
        };

        const onFishError = (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Fish Audio connection error";
          write({ type: "error", message });
        };

        connection.on(RealtimeEvents.AUDIO_CHUNK, onAudio);
        connection.on(RealtimeEvents.ERROR, onFishError);

        const genAI = new GoogleGenerativeAI(geminiKey);
        const modelId = env.GEMINI_MODEL ?? "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({
          model: modelId,
          systemInstruction: [
            "You are a voice assistant: replies are spoken aloud via TTS.",
            "Keep answers SHORT by default: at most 2 sentences, or roughly 40 words.",
            "For simple questions, one short sentence is enough.",
            "Only give longer explanations if the user clearly asks for detail, steps, or a list.",
            "No markdown, bullets, or headings unless the user explicitly wants a list.",
            "Sound natural and conversational.",
          ].join(" "),
          generationConfig: {
            temperature: body.geminiTemperature ?? 0.7,
            /** Hard cap so replies stay cheap and quick to speak (raise in code if you need more). */
            maxOutputTokens: 256,
          },
        });

        const geminiHistory = toGeminiHistory(body.history);
        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessageStream(body.userText);

        await bufferGeminiIntoPhrases(
          result.stream,
          signal,
          chunkLength,
          (phrase) => phraseQueue.push(phrase),
          (delta) => write({ type: "assistant_delta", text: delta }),
        );

        phraseQueue.close();

        await Promise.race([
          fishDone,
          new Promise<void>((r) => setTimeout(r, 90_000)),
        ]);

        signal.removeEventListener("abort", onAbort);
        connection.off(RealtimeEvents.AUDIO_CHUNK, onAudio);
        connection.off(RealtimeEvents.ERROR, onFishError);

        if (!signal.aborted) {
          write({ type: "done" });
        }
      } catch (e) {
        phraseQueue.close();
        write({ type: "error", message: formatVoiceAgentError(e) });
      } finally {
        endHttp();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
