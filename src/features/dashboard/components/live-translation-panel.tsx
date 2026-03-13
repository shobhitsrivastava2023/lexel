"use client";

import { useEffect, useMemo, useState } from "react";
import { Languages, Mic, MicOff, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MULTILINGUAL_LANGUAGE_OPTIONS,
  type MultilingualLanguageId,
} from "@/features/text-to-speech/data/multilingual-languages";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

type LanguageOption = {
  value: MultilingualLanguageId;
  label: string;
};

const languageOptions: LanguageOption[] = MULTILINGUAL_LANGUAGE_OPTIONS;

export function LiveTranslationPanel() {
  const router = useRouter();

  const [sourceLanguage, setSourceLanguage] = useState<string>("auto");
  const [targetLanguage, setTargetLanguage] =
    useState<MultilingualLanguageId>("ja");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const sttLanguage = useMemo(() => {
    if (sourceLanguage === "auto") {
      return undefined;
    }
    // Map base language code to a locale string, e.g. "en" -> "en-US"
    const base = sourceLanguage.slice(0, 2).toLowerCase();
    switch (base) {
      case "en":
        return "en-US";
      case "ja":
        return "ja-JP";
      case "fr":
        return "fr-FR";
      case "de":
        return "de-DE";
      case "es":
        return "es-ES";
      case "pt":
        return "pt-PT";
      case "zh":
        return "zh-CN";
      default:
        return base;
    }
  }, [sourceLanguage]);

  const {
    isSupported,
    isRecording,
    error: sttError,
    transcript,
    start,
    stop,
  } = useSpeechRecognition({ language: sttLanguage });

  // Keep local sourceText in sync with speech transcript when recording.
  useEffect(() => {
    if (isRecording) {
      setSourceText(transcript);
    }
  }, [isRecording, transcript]);

  // Debounced translation when source text or target language changes.
  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText("");
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsTranslating(true);
      setTranslateError(null);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: sourceText,
            sourceLang: sourceLanguage === "auto" ? undefined : sourceLanguage,
            targetLang: targetLanguage,
          }),
        });

        const json = (await res.json()) as {
          translatedText?: string;
          error?: string;
        };

        if (!res.ok || !json.translatedText) {
          if (!cancelled) {
            setTranslateError(
              json.error ??
                "Failed to translate text. Please try again in a moment.",
            );
          }
          return;
        }

        if (!cancelled) {
          setTranslatedText(json.translatedText);
        }
      } catch (err) {
        if (!cancelled) {
          setTranslateError(
            err instanceof Error
              ? err.message
              : "Unexpected error while translating text.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [sourceText, sourceLanguage, targetLanguage]);

  const handleToggleRecording = () => {
    if (!isSupported) return;
    if (isRecording) {
      stop();
    } else {
      start();
    }
  };

  const handleSendToTTS = () => {
    if (!translatedText.trim()) return;

    const params = new URLSearchParams();
    params.set("text", translatedText);
    params.set("languageId", targetLanguage);

    router.push(`/text-to-speech?${params.toString()}`);
  };

  const showManualFallback = !isSupported;

  return (
    <div className="rounded-3xl bg-linear-to-br from-[#1f1f1f] via-[#121212] to-black p-0.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
      <div className="rounded-[22px] bg-[#181818] p-4 lg:p-5 border border-white/5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Languages className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                Live translation
              </h2>
              <p className="text-xs text-muted-foreground">
                Speak once, translate across 23 languages.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 border-dashed border-white/15 bg-white/5 text-[10px]"
          >
            <Sparkles className="size-3 text-primary" />
            <span>Experimental</span>
          </Badge>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                From
              </span>
              <select
                className="h-7 rounded-md border border-white/10 bg-black/40 px-2 text-xs text-foreground outline-none"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
              >
                <option value="auto">Auto-detect</option>
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                To
              </span>
              <select
                className="h-7 rounded-md border border-white/10 bg-black/40 px-2 text-xs text-foreground outline-none"
                value={targetLanguage}
                onChange={(e) =>
                  setTargetLanguage(e.target.value as MultilingualLanguageId)
                }
              >
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                You speak
              </span>
              {!showManualFallback && (
                <span className="text-[11px] text-muted-foreground">
                  {isRecording
                    ? "Listening…"
                    : "Tap the mic to start speaking"}
                </span>
              )}
            </div>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={
                showManualFallback
                  ? "Type or paste text to translate…"
                  : "Your speech will appear here…"
              }
              className="min-h-[96px] resize-none border border-white/10 bg-black/40 text-xs shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Translated
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isTranslating ? "Translating…" : "\u00A0"}
              </span>
            </div>
            <Textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              placeholder="Your translation will appear here…"
              className="min-h-[96px] resize-none border border-white/10 bg-black/40 text-xs shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        {(sttError || translateError) && (
          <p className="text-[11px] text-destructive">
            {sttError ?? translateError}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              disabled={!isSupported}
              onClick={handleToggleRecording}
              className="rounded-full"
            >
              {isRecording ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {isSupported
                ? "Browser speech recognition (best in Chrome)."
                : "Speech recognition not supported in this browser. Type instead."}
            </span>
          </div>
          <div className="flex items-center gap-2 lg:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!translatedText.trim()}
              onClick={handleSendToTTS}
              className="rounded-full px-4 text-xs"
            >
              Send to TTS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

