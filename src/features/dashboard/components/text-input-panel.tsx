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
    <div className="space-y-5">
      <div className="rounded-xl border border-white/6 bg-black/30 focus-within:border-white/10 transition-colors">
        <Textarea
          placeholder="Start typing or paste your text here..."
          className="min-h-36 resize-none border-0 bg-transparent px-4 py-3.5 text-sm leading-relaxed placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0 lg:min-h-40"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={TEXT_MAX_LENGTH}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge
          variant="outline"
          className="gap-1.5 border-border/50 bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground/90"
        >
          <Coins className="size-3 text-primary" />
          {text.length === 0 ? (
            "Start typing to estimate"
          ) : (
            <>
              <span className="tabular-nums text-foreground/90">
                ${(text.length * COST_PER_UNIT).toFixed(4)}
              </span>
              <span className="text-muted-foreground/80">estimated</span>
            </>
          )}
        </Badge>
        <span className="text-[11px] tabular-nums text-muted-foreground/70">
          {text.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()}
        </span>
      </div>

      <div className="pt-1">
        <Button
          size="sm"
          disabled={!text.trim()}
          onClick={handleGenerate}
          className="w-full rounded-full px-6 font-medium transition-opacity hover:opacity-95 lg:w-auto"
        >
          Generate speech
        </Button>
      </div>
    </div>
  )
}