import Link from "next/link";
import { Mic, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardBelowUsageSection() {
  return (
    <section
      className="animate-dashboard-card-in rounded-2xl border border-border/60 bg-[#0f0f0f]/95 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] px-5 py-5 lg:px-6 lg:py-6"
      style={{ animationDelay: "600ms" }}
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Next steps
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground lg:text-lg">
            Go beyond a single generation
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground lg:text-sm">
            You&apos;ve got usage and workflow above—here are a few ways to get
            more from LEXEL this week.
          </p>
        </div>
        <Button
          asChild
          className="mt-2 w-full shrink-0 bg-[#1db954] text-black hover:bg-[#1ed760] sm:mt-0 sm:w-auto"
        >
          <Link href="/voice-agent">Open voice agent</Link>
        </Button>
      </div>

      <div className="grid gap-4 border-t border-border/50 pt-5 md:grid-cols-3">
        <div className="flex gap-3 rounded-xl border border-white/6 bg-black/25 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1db954]/15 text-[#1db954]">
            <Mic className="size-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">
              Talk to your assistant
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use the voice agent for quick, hands-free answers—perfect when
              you&apos;re away from the keyboard.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-white/6 bg-black/25 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-foreground">
            <Wand2 className="size-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">
              Clone once, reuse everywhere
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Save a custom voice from the sidebar, then pick it on Text to
              speech for consistent brand sound.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-white/6 bg-black/25 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">
              Rate what you hear
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              After each generation, leave MOS-style feedback so you can spot
              which voices and settings work best.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
