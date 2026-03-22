"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Bot, Mic, MicOff, PhoneOff, Radio } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { PcmStreamPlayer, base64ToUint8Array } from "../lib/pcm-player";

type ChatTurn = { role: "user" | "assistant"; content: string };

type FishVoiceItem = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  tags?: string[];
};

type AgentStatus = "idle" | "listening" | "thinking" | "speaking";

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  return (
    window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
  );
}

export function VoiceAgentView() {
  const [sessionActive, setSessionActive] = useState(false);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [voices, setVoices] = useState<FishVoiceItem[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string>("");
  const [lines, setLines] = useState<{ role: "user" | "assistant"; text: string }[]>(
    [],
  );
  /** Live transcript from the speech engine (final + interim segments for this utterance). */
  const [sttLiveText, setSttLiveText] = useState("");
  /** Fires when the browser speech engine has actually started (may be after Initialize). */
  const [speechEngineStarted, setSpeechEngineStarted] = useState(false);
  /** User-visible hint when STT is quiet or errors (mic, HTTPS, network). */
  const [sttHint, setSttHint] = useState<string | null>(null);

  const historyRef = useRef<ChatTurn[]>([]);
  const busyRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const playerRef = useRef<PcmStreamPlayer | null>(null);
  const lastDupRef = useRef<{ t: string; at: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  /** Must mirror sessionActive before recognition fires — useEffect runs too late for first results. */
  const silenceCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSttLineRef = useRef("");
  /** Mic stream from permission prompt; tracks are stopped so Web Speech can capture audio. */
  const micStreamRef = useRef<MediaStream | null>(null);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) {
      playerRef.current = new PcmStreamPlayer();
    }
    return playerRef.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/voice-agent/voices");
        const data = (await res.json()) as {
          items?: FishVoiceItem[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          if (data.error === "SUBSCRIPTION_REQUIRED") {
            setVoicesError("Active subscription required for the voice agent.");
          } else {
            setVoicesError(data.error ?? "Could not load Fish voices.");
          }
          setVoices([]);
          return;
        }
        const items = data.items ?? [];
        setVoices(items);
        setVoicesError(null);
        if (items.length > 0) {
          setReferenceId((id) => id || items[0]!.id);
        }
      } catch {
        if (!cancelled) {
          setVoicesError("Could not load voices.");
        }
      } finally {
        if (!cancelled) setVoicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lines, sttLiveText]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceCommitTimerRef.current) {
      clearTimeout(silenceCommitTimerRef.current);
      silenceCommitTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSilenceTimer(), [clearSilenceTimer]);

  const hangUp = useCallback(async () => {
    clearSilenceTimer();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setSpeechEngineStarted(false);
    setSttHint(null);
    sessionActiveRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;

    const r = recognitionRef.current;
    if (r) {
      try {
        r.onend = null;
        r.stop();
      } catch {
        /* ignore */
      }
      try {
        r.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    await playerRef.current?.dispose();
    playerRef.current = null;

    setSessionActive(false);
    setStatus("idle");
    setSttLiveText("");
    latestSttLineRef.current = "";
    busyRef.current = false;
  }, [clearSilenceTimer]);

  const runTurn = useCallback(
    async (userText: string) => {
      if (!referenceId) {
        busyRef.current = false;
        return;
      }

      setStatus("thinking");

      const player = getPlayer();
      await player.ensureRunning();
      player.flushSchedule();

      const ac = new AbortController();
      abortRef.current = ac;

      let assistantAccum = "";
      let sawDone = false;

      flushSync(() => {
        setLines((prev) => [...prev, { role: "user", text: userText }]);
      });

      const handleEvent = async (msg: Record<string, unknown>) => {
        const type = msg.type as string;
        if (type === "meta" && typeof msg.pcmSampleRate === "number") {
          player.setSampleRate(msg.pcmSampleRate as number);
        } else if (type === "assistant_delta" && typeof msg.text === "string") {
          const delta = msg.text as string;
          assistantAccum += delta;
          setLines((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = {
                role: "assistant",
                text: assistantAccum,
              };
              return next;
            }
            return [...next, { role: "assistant", text: assistantAccum }];
          });
        } else if (type === "audio" && typeof msg.b64 === "string") {
          await player.ensureRunning();
          const bytes = base64ToUint8Array(msg.b64 as string);
          player.pushPcmBytes(bytes);
        } else if (type === "error") {
          toast.error(
            typeof msg.message === "string"
              ? msg.message
              : "Voice agent error",
          );
        } else if (type === "done") {
          sawDone = true;
          historyRef.current = [
            ...historyRef.current,
            { role: "user" as const, content: userText },
            { role: "assistant" as const, content: assistantAccum },
          ].slice(-24);
        }
      };

      try {
        const res = await fetch("/api/voice-agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ac.signal,
          body: JSON.stringify({
            userText,
            referenceId,
            history: historyRef.current,
          }),
        });

        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          if (res.status === 403 && errBody.error === "SUBSCRIPTION_REQUIRED") {
            toast.error("Subscription required to use the voice agent.");
          } else if (res.status === 503) {
            toast.error(
              errBody.error ??
                "Voice agent is not configured (Fish / Gemini keys).",
            );
          } else {
            toast.error(errBody.error ?? "Request failed.");
          }
          setLines((prev) => prev.slice(0, -1));
          setStatus(sessionActiveRef.current ? "listening" : "idle");
          return;
        }

        if (!res.body) {
          toast.error("No response stream.");
          setLines((prev) => prev.slice(0, -1));
          setStatus(sessionActiveRef.current ? "listening" : "idle");
          return;
        }

        flushSync(() => {
          setLines((prev) => [
            ...prev,
            { role: "assistant", text: "" },
          ]);
        });
        setStatus("speaking");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            let msg: Record<string, unknown>;
            try {
              msg = JSON.parse(line) as Record<string, unknown>;
            } catch {
              continue;
            }
            await handleEvent(msg);
          }
        }

        const tail = buf.trim();
        if (tail) {
          try {
            await handleEvent(JSON.parse(tail) as Record<string, unknown>);
          } catch {
            /* ignore */
          }
        }

        if (!sawDone && assistantAccum) {
          historyRef.current = [
            ...historyRef.current,
            { role: "user" as const, content: userText },
            { role: "assistant" as const, content: assistantAccum },
          ].slice(-24);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setLines((prev) => {
            const next = [...prev];
            if (next[next.length - 1]?.role === "assistant") {
              next.pop();
            }
            if (next[next.length - 1]?.role === "user") {
              next.pop();
            }
            return next;
          });
        } else {
          toast.error(
            e instanceof Error ? e.message : "Something went wrong.",
          );
          setLines((prev) => {
            if (prev[prev.length - 1]?.role === "assistant") {
              return prev.slice(0, -1);
            }
            if (prev[prev.length - 1]?.role === "user") {
              return prev.slice(0, -1);
            }
            return prev;
          });
        }
      } finally {
        abortRef.current = null;
        busyRef.current = false;
        if (sessionActiveRef.current) {
          setStatus("listening");
          const existing = recognitionRef.current;
          if (existing) {
            try {
              existing.start();
            } catch {
              /* onend will restart */
            }
          }
        } else {
          setStatus("idle");
        }
      }
    },
    [getPlayer, referenceId],
  );

  const trySendUtterance = useCallback(
    (raw: string): boolean => {
      const trimmed = raw.trim();
      if (trimmed.length < 1) return false;
      if (!sessionActiveRef.current) return false;
      if (busyRef.current) return false;
      const now = Date.now();
      const dup = lastDupRef.current;
      if (dup && dup.t === trimmed && now - dup.at < 2_500) {
        return false;
      }
      lastDupRef.current = { t: trimmed, at: now };
      busyRef.current = true;
      clearSilenceTimer();
      setSttLiveText("");
      latestSttLineRef.current = "";
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      void runTurn(trimmed);
      return true;
    },
    [runTurn, clearSilenceTimer],
  );

  const startSession = useCallback(async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error(
        "Speech recognition needs a secure page (HTTPS or localhost). Open the app over HTTPS.",
      );
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast.error(
        "Speech recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }
    if (!referenceId) {
      toast.error("Select a Fish voice first.");
      return;
    }
    if (voicesError && voices.length === 0) {
      toast.error(voicesError);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      /**
       * Stop this stream immediately so the browser can hand the mic to Web Speech.
       * Keeping both open often yields no `onresult` events in Chrome (silent failure).
       */
      stream.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    } catch {
      toast.error("Microphone permission is required.");
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";

    setSpeechEngineStarted(false);
    setSttHint(
      "Starting speech recognition… Allow the mic if prompted again for the speech service.",
    );

    recognition.onstart = () => {
      setSpeechEngineStarted(true);
      setSttHint(
        "Listening — speak clearly. Text appears as Chrome sends partial results (requires network).",
      );
    };

    recognition.onaudiostart = () => {
      setSttHint("Microphone audio is reaching the speech engine…");
    };

    recognition.onaudioend = () => {
      setSttHint((prev) =>
        prev?.includes("reaching the speech engine")
          ? "Processing… speak again or wait for a pause to send."
          : prev,
      );
    };

    recognition.onresult = (ev: SpeechRecognitionEvent) => {
      if (!sessionActiveRef.current) {
        return;
      }

      let fullLine = "";
      for (let i = 0; i < ev.results.length; i++) {
        fullLine += ev.results[i]?.[0]?.transcript ?? "";
      }
      const trimmedFull = fullLine.trim();
      latestSttLineRef.current = trimmedFull;
      setSttLiveText(fullLine.trimEnd());
      if (trimmedFull.length > 0) {
        setSttHint(null);
      }

      let newFinal = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) {
          newFinal += res[0]?.transcript ?? "";
        }
      }
      const trimmedFinal = newFinal.trim();

      if (trimmedFinal.length >= 1 && !busyRef.current) {
        clearSilenceTimer();
        if (trySendUtterance(trimmedFinal)) {
          return;
        }
      }

      clearSilenceTimer();
      silenceCommitTimerRef.current = setTimeout(() => {
        silenceCommitTimerRef.current = null;
        const pending = latestSttLineRef.current.trim();
        if (pending.length < 1) return;
        if (busyRef.current || !sessionActiveRef.current) return;
        void trySendUtterance(pending);
      }, 1800);
    };

    recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === "aborted") return;
      if (ev.error === "no-speech") {
        setSttHint(
          "No speech detected. Check your mic and input level, then speak again.",
        );
        return;
      }
      if (ev.error === "not-allowed") {
        toast.error("Microphone access denied.");
        setSttHint("Microphone blocked — allow mic for this site in the browser lock icon.");
        void hangUp();
        return;
      }
      const human: Record<string, string> = {
        network:
          "Speech service network error. Check internet / VPN / firewall (Chrome sends audio to Google).",
        "service-not-allowed":
          "Speech recognition is disabled or blocked (policy, extension, or unsupported region).",
        "audio-capture":
          "No microphone capture — check system mic and that another app isn’t using it exclusively.",
        "bad-grammar": "Speech engine error — try again or switch browser.",
      };
      const msg = human[ev.error] ?? `Speech recognition error: ${ev.error}`;
      setSttHint(msg);
      toast.error(msg);
      console.warn("Speech recognition:", ev.error);
    };

    recognition.onend = () => {
      if (!sessionActiveRef.current || busyRef.current) return;
      try {
        recognition.start();
      } catch {
        /* already running */
      }
    };

    recognitionRef.current = recognition;

    sessionActiveRef.current = true;
    setSessionActive(true);

    try {
      recognition.start();
    } catch {
      sessionActiveRef.current = false;
      setSessionActive(false);
      toast.error("Could not start speech recognition.");
      return;
    }

    setStatus("listening");
  }, [
    hangUp,
    referenceId,
    trySendUtterance,
    clearSilenceTimer,
    voices.length,
    voicesError,
  ]);

  const configured =
    !voicesLoading &&
    !voicesError &&
    voices.length > 0 &&
    Boolean(referenceId);

  const statusLabel =
    status === "listening"
      ? "Listening"
      : status === "thinking"
        ? "Thinking"
        : status === "speaking"
          ? "Speaking"
          : "Idle";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Voice agent" />
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
        <Card
          className={cn(
            "rounded-2xl border border-border/60 bg-[#0f0f0f]/95 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
          )}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Experimental
              </p>
              <h2 className="text-lg font-semibold tracking-tight">
                Fish Audio + Gemini
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Continuous speech recognition streams your words to Gemini
                (2.0 Flash), then Fish Audio realtime TTS speaks the reply.
                Recognition pauses while the agent speaks to reduce echo—use
                headphones for the best experience.
              </p>
            </div>
            <div
              className={cn(
                "mt-2 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:mt-0",
                status === "listening" &&
                  "border-[#1db954]/40 bg-[#1db954]/10 text-[#1db954]",
                status === "thinking" && "border-amber-500/40 bg-amber-500/10",
                status === "speaking" && "border-sky-500/40 bg-sky-500/10",
                status === "idle" && "border-border/60 text-muted-foreground",
              )}
            >
              <Radio className="size-3.5 shrink-0" />
              {statusLabel}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Fish voice</span>
              {voicesLoading ? (
                <Skeleton className="h-9 w-[220px]" />
              ) : (
                <Select
                  value={referenceId}
                  onValueChange={setReferenceId}
                  disabled={sessionActive || voices.length === 0}
                >
                  <SelectTrigger className="w-[min(100%,280px)] bg-background/50">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="flex flex-col gap-0.5 text-left">
                          <span className="truncate">{v.title}</span>
                          {v.tags && v.tags.length > 0 ? (
                            <span className="truncate text-[10px] font-normal text-muted-foreground">
                              {v.tags.slice(0, 3).join(" · ")}
                            </span>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-[#1db954] text-black hover:bg-[#1ed760]"
                disabled={
                  sessionActive || voicesLoading || !referenceId || Boolean(voicesError)
                }
                onClick={() => void startSession()}
              >
                <Mic className="size-4" />
                Initialize
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!sessionActive}
                onClick={() => void hangUp()}
              >
                <PhoneOff className="size-4" />
                Hang up
              </Button>
            </div>
          </div>

          {voicesError && (
            <p className="mt-3 text-sm text-amber-500/90">{voicesError}</p>
          )}
          {!voicesLoading && voices.length === 0 && !voicesError && (
            <p className="mt-3 text-sm text-muted-foreground">
              No trained TTS voices found for your Fish account. Create or
              train a voice at{" "}
              <a
                className="text-[#1db954] underline-offset-2 hover:underline"
                href="https://fish.audio"
                target="_blank"
                rel="noreferrer"
              >
                fish.audio
              </a>
              , then refresh this page.
            </p>
          )}
        </Card>

        {sessionActive ? (
          <Card
            className={cn(
              "rounded-2xl border border-border/60 bg-[#0f0f0f]/95 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              What the mic heard
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Live text from your browser&apos;s speech recognition (in Chrome this uses
              Google&apos;s service — you must be online). After a short pause (~1.8s),
              your words are sent even if the browser never marks them &quot;final&quot;.
            </p>
            {sttHint ? (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
                {sttHint}
              </p>
            ) : null}
            <Textarea
              readOnly
              value={sttLiveText}
              placeholder={
                speechEngineStarted
                  ? "Speak — your words will appear here…"
                  : "Waiting for the speech engine to start…"
              }
              className="mt-3 min-h-[88px] resize-y border-white/10 bg-black/40 text-sm"
              aria-label="Live speech transcript"
            />
          </Card>
        ) : null}

        <Card
          className={cn(
            "flex min-h-[320px] flex-1 flex-col rounded-2xl border border-border/60 bg-[#0f0f0f]/95 p-0 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
          )}
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <Bot className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Conversation</span>
            {!sessionActive && (
              <span className="ml-auto text-xs text-muted-foreground">
                <MicOff className="mr-1 inline size-3" />
                Session off
              </span>
            )}
          </div>
          <div
            ref={scrollRef}
            className="min-h-[260px] flex-1 overflow-y-auto px-4 py-3"
          >
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {configured
                  ? "Press Initialize and start talking."
                  : "Configure FISH_API_KEY and GEMINI_API_KEY, then load voices."}
              </p>
            ) : (
              <ul className="space-y-3">
                {lines.map((line, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      line.role === "user"
                        ? "ml-8 bg-white/5 text-foreground"
                        : "mr-8 bg-[#1db954]/10 text-foreground",
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {line.role === "user" ? "You" : "Agent"}
                    </span>
                    <p className="mt-1 whitespace-pre-wrap">{line.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
