"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { VoicePreviewPanel } from "@/features/text-to-speech/components/voice-preview-panel";
import { VoicePreviewMobile } from "@/features/text-to-speech/components/voice-preview-mobile";
import {
  EPHEMERAL_GENERATION_STORAGE_KEY,
  type EphemeralGenerationPayload,
} from "@/lib/ephemeral-generation";

export function TextToSpeechEphemeralView() {
  const [payload, setPayload] = useState<EphemeralGenerationPayload | null>(
    null,
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(EPHEMERAL_GENERATION_STORAGE_KEY);
      if (!raw) return;
      setPayload(JSON.parse(raw) as EphemeralGenerationPayload);
    } catch {
      setPayload(null);
    }
  }, []);

  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader title="Preview" className="lg:hidden" />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            No ephemeral preview found. Generate speech from the dashboard while
            in guest mode.
          </p>
          <Button asChild>
            <Link href="/">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader title="Preview" className="lg:hidden" />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Ephemeral generation
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {payload.voiceName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Audio is stored only in this browser session — this demo host has no
            database or file storage.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {payload.text}
        </div>

        <div className="hidden lg:block">
          <VoicePreviewPanel
            audioUrl={payload.audioDataUrl}
            voice={{ name: payload.voiceName }}
            text={payload.text}
          />
        </div>
        <div className="lg:hidden">
          <VoicePreviewMobile
            audioUrl={payload.audioDataUrl}
            voice={{ name: payload.voiceName }}
            text={payload.text}
          />
        </div>
      </div>
    </div>
  );
}
