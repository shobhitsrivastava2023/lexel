"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { 
  COST_PER_UNIT, 
  TEXT_MAX_LENGTH
} from "@/features/text-to-speech/data/constants";

export function TextInputPanel() {
  const [text, setText] = useState("");
  const router = useRouter();

  const handleGenerate = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    router.push(`/text-to-speech?text=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="rounded-3xl bg-linear-to-br from-[#1f1f1f] via-[#121212] to-black p-0.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
      <div className="rounded-[22px] bg-[#181818] p-4 lg:p-5 border border-white/5">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
            <Textarea
              placeholder="Start typing or paste your text here..."
              className="min-h-35 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/70"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={TEXT_MAX_LENGTH}
            />
          </div>

          {/* Bottom info */}

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1.5 border-dashed border-white/15 bg-white/5 text-xs">
              <Coins className="size-3 text-primary" />
              <span className="text-xs text-muted-foreground">
                {text.length === 0 ? (
                  "Start typing to estimate"
                ) : (
                  <>
                    <span className="tabular-nums">
                      ${(text.length * COST_PER_UNIT).toFixed(4)}
                    </span>{" "}
                    estimated
                  </>
                )}
              </span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              {text.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()} characters
            </span>
          </div>
        </div>

        {/* Action bar */}

        <div className="flex items-center justify-end pt-4">
          <Button
            size="sm"
            disabled={!text.trim()}
            onClick={handleGenerate}
            className="w-full lg:w-auto rounded-full px-6 font-medium"
          >
            Generate speech
          </Button>
        </div>
      </div>
    </div>
  )
}