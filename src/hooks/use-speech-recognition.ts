"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseSpeechRecognitionOptions = {
  language?: string;
};

type UseSpeechRecognitionResult = {
  isSupported: boolean;
  isRecording: boolean;
  error: string | null;
  transcript: string;
  start: () => void;
  stop: () => void;
};

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionResult {
  const { language } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language ?? navigator.language ?? "en-US";

    recognition.onresult = (event: any) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i += 1) {
        combined += event.results[i][0].transcript;
        if (!event.results[i].isFinal) {
          combined += " ";
        }
      }
      setTranscript(combined.trim());
    };

    recognition.onerror = (event: any) => {
      setError(event.error ?? "Speech recognition error");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [language]);

  const start = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    setError(null);
    setTranscript("");
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch {
      // Ignore repeated start errors
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  return {
    isSupported,
    isRecording,
    error,
    transcript,
    start,
    stop,
  };
}

