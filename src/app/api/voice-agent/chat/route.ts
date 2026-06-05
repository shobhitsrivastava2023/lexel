import { getAppAuth } from "@/lib/clerk-app-auth";
import { RealtimeEvents } from "fish-audio";
import OpenAI from "openai";
import { z } from "zod";

import { env } from "@/lib/env";
import { parseGuestKeysFromHeaders } from "@/lib/guest-keys/codec";
import { effectiveGuestValue, runWithGuestKeys } from "@/lib/guest-keys/runtime";
import { assertVoiceAgentSubscription, VoiceAgentSubscriptionError } from "@/lib/voice-agent-access";
import {
  executeComposioToolWithRetry,
  OPENAI_COMPOSIO_TOOL,
  parseExecuteToolArgs,
} from "@/lib/voice-agent/composio";
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

function toOpenAiMessages(
  history: z.infer<typeof bodySchema>["history"],
  userText: string,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const base: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = history.map(
    (m) => ({
      role: m.role,
      content: m.content,
    }),
  );
  base.push({
    role: "user",
    content: userText,
  });
  return base;
}

async function runOpenAiToolLoop({
  client,
  model,
  messages,
  userId,
  maxSteps,
  temperature,
  write,
}: {
  client: OpenAI;
  model: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  userId: string;
  maxSteps: number;
  temperature: number;
  write: (obj: Record<string, unknown>) => void;
}) {
  const working = [...messages];

  for (let step = 1; step <= maxSteps; step++) {
    const result = await client.chat.completions.create({
      model,
      messages: working,
      tools: [OPENAI_COMPOSIO_TOOL],
      tool_choice: "auto",
      temperature,
      max_completion_tokens: 512,
    });

    const msg = result.choices[0]?.message;
    const toolCalls =
      msg?.tool_calls?.filter(
        (call) =>
          call.type === "function" &&
          call.function?.name === OPENAI_COMPOSIO_TOOL.function.name,
      ) ?? [];

    if (!msg || toolCalls.length === 0) {
      return working;
    }

    working.push({
      role: "assistant",
      content: msg.content ?? "",
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function" || !toolCall.function) continue;
      const toolCallId = toolCall.id;
      const rawArgs = toolCall.function.arguments ?? "{}";

      let toolContent: string;
      try {
        const parsedArgs = parseExecuteToolArgs(rawArgs);
        write({
          type: "tool_status",
          status: "start",
          tool: parsedArgs.slug,
          step,
        });

        const toolResult = await executeComposioToolWithRetry(userId, parsedArgs);
        toolContent = JSON.stringify({
          successful: toolResult.successful,
          error: toolResult.error,
          data: toolResult.data,
        });

        write({
          type: "tool_status",
          status: toolResult.successful ? "success" : "error",
          tool: parsedArgs.slug,
          step,
          message: toolResult.error ?? null,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Tool execution failed unexpectedly.";
        toolContent = JSON.stringify({
          successful: false,
          error: message,
        });
        write({
          type: "tool_status",
          status: "error",
          tool: "composio_execute_tool",
          step,
          message,
        });
      }

      working.push({
        role: "tool",
        tool_call_id: toolCallId,
        content: toolContent,
      });
    }
  }

  write({
    type: "tool_status",
    status: "error",
    tool: "composio_execute_tool",
    message: "Reached maximum tool-call steps; finalizing answer with current context.",
  });
  return working;
}

/** Avoid dumping multi-kB API payloads into the UI / logs. */
function formatVoiceAgentError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    /429|Too Many Requests|quota|RESOURCE_EXHAUSTED|Resource has been exhausted|free_tier|GenerateContent|insufficient_quota|rate limit/i.test(
      raw,
    )
  ) {
    return (
      "LLM quota exceeded (429). Wait and retry, switch to a cheaper model, " +
      "or enable billing on your provider."
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

function toBufferChunk(chunk: unknown): Buffer | null {
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);
  if (chunk instanceof ArrayBuffer) return Buffer.from(chunk);
  if (ArrayBuffer.isView(chunk)) {
    const view = chunk as ArrayBufferView;
    return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
  }
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(chunk)) {
    return chunk as Buffer;
  }
  return null;
}

export async function POST(request: Request) {
  const guestKeys = parseGuestKeysFromHeaders(request.headers);

  return runWithGuestKeys(guestKeys, async () => {
  const { userId, orgId } = await getAppAuth();
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const llmProvider =
    (effectiveGuestValue(
      "VOICE_AGENT_LLM_PROVIDER",
      env.VOICE_AGENT_LLM_PROVIDER,
    ) as "openai" | "gemini" | undefined) ?? "openai";
  const openAiKey = effectiveGuestValue("OPENAI_API_KEY", env.OPENAI_API_KEY);
  const geminiKey = effectiveGuestValue("GEMINI_API_KEY", env.GEMINI_API_KEY);
  const fishApiKey = effectiveGuestValue("FISH_API_KEY", env.FISH_API_KEY);
  const hasProviderKey =
    llmProvider === "openai" ? Boolean(openAiKey) : Boolean(geminiKey);
  if (!fishApiKey || !hasProviderKey) {
    return Response.json(
      {
        error: `Voice agent is not configured. Set FISH_API_KEY and ${
          llmProvider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"
        }.`,
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
          const buf = toBufferChunk(audio);
          if (!buf || buf.length === 0) return;
          realtimeAudioChunks += 1;
          write({
            type: "audio",
            b64: buf.toString("base64"),
          });
        };

        let realtimeAudioChunks = 0;
        let realtimeErrorMessage: string | null = null;
        const onFishError = (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Fish Audio connection error";
          realtimeErrorMessage = message;
          write({ type: "error", message });
        };

        connection.on(RealtimeEvents.AUDIO_CHUNK, onAudio);
        connection.on(RealtimeEvents.ERROR, onFishError);

        const systemInstruction = [
          "You are a voice assistant: replies are spoken aloud via TTS.",
          "Keep answers SHORT by default: at most 2 sentences, or roughly 40 words.",
          "For simple questions, one short sentence is enough.",
          "Only give longer explanations if the user clearly asks for detail, steps, or a list.",
          "No markdown, bullets, or headings unless the user explicitly wants a list.",
          "Sound natural and conversational.",
        ].join(" ");
        let assistantText = "";

        if (llmProvider === "openai") {
          const client = new OpenAI({ apiKey: openAiKey! });
          const modelId =
            effectiveGuestValue("OPENAI_MODEL", env.OPENAI_MODEL) ??
            "gpt-4o-mini";

          const baseMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
              role: "system",
              content: [
                systemInstruction,
                "You can use tools through Composio for Notion, Google Docs, and Google Drive.",
                "Use tools only when they are required to complete the user request.",
                "Support multi-step execution: if one tool's output is needed for the next action, call tools in sequence.",
              ].join(" "),
            },
            ...toOpenAiMessages(body.history, body.userText),
          ];

          const temperature = body.geminiTemperature ?? 0.7;
          const maxToolSteps = env.VOICE_AGENT_TOOL_MAX_STEPS ?? 4;

          const toolMessages = env.COMPOSIO_API_KEY
            ? await runOpenAiToolLoop({
              client,
              model: modelId,
              messages: baseMessages,
              userId,
              maxSteps: maxToolSteps,
              temperature,
              write,
            })
            : baseMessages;

          const stream = await client.chat.completions.create({
            model: modelId,
            messages: toolMessages,
            temperature,
            max_completion_tokens: 256,
            stream: true,
          });

          async function* openAiTextStream() {
            for await (const chunk of stream) {
              const t = chunk.choices[0]?.delta?.content;
              if (!t) continue;
              yield { text: () => t };
            }
          }

          await bufferGeminiIntoPhrases(
            openAiTextStream(),
            signal,
            chunkLength,
            (phrase) => phraseQueue.push(phrase),
            (delta) => {
              assistantText += delta;
              write({ type: "assistant_delta", text: delta });
            },
          );
        } else {
          // Gemini path kept for compatibility if explicitly selected.
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(geminiKey!);
          const modelId =
            effectiveGuestValue("GEMINI_MODEL", env.GEMINI_MODEL) ??
            "gemini-2.0-flash";
          const model = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction,
            generationConfig: {
              temperature: body.geminiTemperature ?? 0.7,
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
            (delta) => {
              assistantText += delta;
              write({ type: "assistant_delta", text: delta });
            },
          );
        }

        phraseQueue.close();

        await Promise.race([
          fishDone,
          new Promise<void>((r) => setTimeout(r, 90_000)),
        ]);

        signal.removeEventListener("abort", onAbort);
        connection.off(RealtimeEvents.AUDIO_CHUNK, onAudio);
        connection.off(RealtimeEvents.ERROR, onFishError);

        // WebSocket can fail with proxy redirects (e.g. 302) while text still streams.
        // Fallback to one-shot TTS so users still hear audio.
        if (!signal.aborted && assistantText.trim() && realtimeAudioChunks === 0) {
          try {
            if (realtimeErrorMessage) {
              write({
                type: "error",
                message:
                  "Realtime Fish audio failed; using fallback synthesis. " +
                  realtimeErrorMessage,
              });
            }

            const fallbackAudio = await fishClient.textToSpeech.convert(
              {
                text: assistantText,
                reference_id: body.referenceId,
                format: "pcm",
                sample_rate: pcmSampleRate,
                chunk_length: chunkLength,
                normalize: true,
                latency: "balanced",
                temperature: body.fishTemperature ?? 0.65,
              },
              backend,
            );

            if (fallbackAudio instanceof ReadableStream) {
              const reader = fallbackAudio.getReader();
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                const buf = toBufferChunk(value);
                if (!buf || buf.length === 0) continue;
                write({ type: "audio", b64: buf.toString("base64") });
              }
            } else if (
              fallbackAudio &&
              typeof fallbackAudio === "object" &&
              Symbol.asyncIterator in fallbackAudio
            ) {
              for await (const chunk of fallbackAudio as AsyncIterable<unknown>) {
                const buf = toBufferChunk(chunk);
                if (!buf || buf.length === 0) continue;
                write({ type: "audio", b64: buf.toString("base64") });
              }
            } else {
              const buf = toBufferChunk(fallbackAudio);
              if (buf && buf.length > 0) {
                write({ type: "audio", b64: buf.toString("base64") });
              }
            }
          } catch (fallbackErr) {
            write({ type: "error", message: formatVoiceAgentError(fallbackErr) });
          }
        }

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
  });
}
