"use client";

import { useStore } from "@tanstack/react-form";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTypedAppFormContext } from "@/hooks/use-app-form";
import { MULTILINGUAL_LANGUAGE_OPTIONS } from "@/features/text-to-speech/data/multilingual-languages";
import { MULTILINGUAL_VOICE_NAME } from "@/features/voices/data/voice-scoping";
import { useTTSVoices } from "../contexts/tts-voices-context";
import { ttsFormOptions } from "./text-to-speech-form";

/**
 * Shown when the selected voice is Multilingual. Lets the user pick one of 23 languages for TTS.
 */
export function MultilingualLanguageSelector() {
  const form = useTypedAppFormContext(ttsFormOptions);
  const voiceId = useStore(form.store, (s) => s.values.voiceId);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);
  const { allVoices } = useTTSVoices();
  const selectedVoice = allVoices.find((v) => v.id === voiceId);
  const isMultilingual = selectedVoice?.name === MULTILINGUAL_VOICE_NAME;

  if (!isMultilingual) return null;

  return (
    <form.Field name="languageId">
      {(field) => (
        <Field>
          <FieldLabel>Language (23 languages)</FieldLabel>
          <Select
            value={field.state.value ?? "en"}
            onValueChange={(v) => field.handleChange(v)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full rounded-lg bg-white">
              <SelectValue placeholder="Select language..." />
            </SelectTrigger>
            <SelectContent>
              {MULTILINGUAL_LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    </form.Field>
  );
}
