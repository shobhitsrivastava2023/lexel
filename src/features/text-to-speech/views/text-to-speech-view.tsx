"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { TextInputPanel } from "@/features/text-to-speech/components/text-input-panel";
import { VoicePreviewPlaceholder } from "@/features/text-to-speech/components/voice-preview-placeholder";
import { SettingsPanel } from "@/features/text-to-speech/components/settings-panel";
import {
  TextToSpeechForm,
  defaultTTSValues,
  type TTSFormValues
} from "@/features/text-to-speech/components/text-to-speech-form";
import { TTSVoicesProvider } from "../contexts/tts-voices-context";
import { MULTILINGUAL_VOICE_NAME } from "@/features/voices/data/voice-scoping";

export function TextToSpeechView({
  initialValues,
}: {
  initialValues?: Partial<TTSFormValues>;
}) {
  const trpc = useTRPC();
  const { 
    data: voices,
  } = useSuspenseQuery(trpc.voices.getAll.queryOptions());

  const { custom: customVoices, system: systemVoices } = voices;

  const allVoices = [...customVoices, ...systemVoices];
  const fallbackVoiceId = allVoices[0]?.id ?? "";

  const multilingualVoice = systemVoices.find(
    (v) => v.name === MULTILINGUAL_VOICE_NAME,
  );

  // Requested voice may no longer exist (deleted); fall back to first available
  const resolvedVoiceId = (() => {
    if (
      initialValues?.voiceId &&
      allVoices.some((v) => v.id === initialValues.voiceId)
    ) {
      return initialValues.voiceId;
    }

    // If we were given a languageId and the Multilingual voice exists, prefer it.
    if (initialValues?.languageId && multilingualVoice) {
      return multilingualVoice.id;
    }

    return fallbackVoiceId;
  })();

  const defaultValues: TTSFormValues = {
    ...defaultTTSValues,
    ...initialValues,
    voiceId: resolvedVoiceId,
  };

  return (
    <TTSVoicesProvider value={{ customVoices, systemVoices, allVoices }}>
      <TextToSpeechForm defaultValues={defaultValues}>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <TextInputPanel />
            <VoicePreviewPlaceholder />
          </div>
          <SettingsPanel />
        </div>
      </TextToSpeechForm>
    </TTSVoicesProvider>
  );
};
