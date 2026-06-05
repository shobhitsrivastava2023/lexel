"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGuestKeys } from "@/features/guest/components/guest-keys-provider";
import {
  GUEST_HOSTED_KEYS_INFO,
  GUEST_KEY_FIELDS,
} from "@/lib/guest-keys/fields";
import { sanitizeGuestKeys } from "@/lib/guest-keys/codec";
import type { GuestKeys } from "@/lib/guest-keys/types";

const FEATURE_LABELS = {
  tts: "Text to speech",
  translation: "Live translation",
  "voice-agent": "Voice agent",
} as const;

type GuestContinueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When false, saving keys only updates storage (e.g. from dashboard banner). */
  redirectOnSave?: boolean;
};

export function GuestContinueDialog({
  open,
  onOpenChange,
  redirectOnSave = true,
}: GuestContinueDialogProps) {
  const router = useRouter();
  const { guestKeys, enableGuestMode } = useGuestKeys();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const groupedFields = useMemo(() => {
    const groups: Record<
      keyof typeof FEATURE_LABELS,
      typeof GUEST_KEY_FIELDS
    > = {
      tts: [],
      translation: [],
      "voice-agent": [],
    };
    for (const field of GUEST_KEY_FIELDS) {
      groups[field.feature].push(field);
    }
    return groups;
  }, []);

  const hydrateFromStored = () => {
    const next: Record<string, string> = {};
    for (const field of GUEST_KEY_FIELDS) {
      const stored = guestKeys[field.key];
      if (stored) next[field.key] = stored;
    }
    setValues(next);
  };

  const updateValue = (key: keyof GuestKeys, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const finishGuestFlow = (sanitized: Partial<GuestKeys>) => {
    enableGuestMode(sanitized);
    onOpenChange(false);
    if (redirectOnSave) {
      router.push("/");
      router.refresh();
    } else {
      window.location.reload();
    }
  };

  const handleContinue = (requireTtsKeys: boolean) => {
    setError(null);
    const sanitized = sanitizeGuestKeys(values);

    if (requireTtsKeys) {
      if (!sanitized.CHATTERBOX_API_URL || !sanitized.CHATTERBOX_API_KEY) {
        setError(
          "Chatterbox API URL and API key are required to generate speech.",
        );
        return;
      }
    }

    finishGuestFlow(sanitized);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) hydrateFromStored();
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-2 border-b border-border/60 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-4" />
            </span>
            <DialogTitle className="text-left text-lg">
              Continue as guest
            </DialogTitle>
          </div>
          <DialogDescription className="text-left text-sm leading-relaxed">
            Optional: paste your own API keys. They are stored only in this
            browser and sent with each request when guest mode is on. If you
            leave a field blank, LEXEL uses the server&apos;s configured value
            (when available).
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4 sm:px-6">
          {(Object.keys(FEATURE_LABELS) as Array<keyof typeof FEATURE_LABELS>).map(
            (feature) => (
              <section key={feature} className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {FEATURE_LABELS[feature]}
                </h3>
                <div className="space-y-3">
                  {groupedFields[feature].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={field.key} className="text-sm">
                          {field.label}
                          {field.required ? (
                            <span className="ml-1 text-destructive">*</span>
                          ) : null}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                      {field.type === "select" ? (
                        <Select
                          value={values[field.key] || "__none__"}
                          onValueChange={(value) =>
                            updateValue(
                              field.key,
                              value === "__none__" ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger id={field.key} className="w-full">
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem
                                key={option.value || "__none__"}
                                value={option.value || "__none__"}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type === "password" ? "password" : "text"}
                          placeholder={field.placeholder}
                          value={values[field.key] ?? ""}
                          onChange={(e) =>
                            updateValue(field.key, e.target.value)
                          }
                          autoComplete="off"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ),
          )}

          <section className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hosted by this deployment (no key needed)
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {GUEST_HOSTED_KEYS_INFO.map((item) => (
                <li key={item} className="font-mono leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => handleContinue(false)}
          >
            Skip keys for now
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => handleContinue(true)}
          >
            Save keys & continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
