import Image from "next/image";

import { PageHeader } from "@/components/page-header";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LiveTranslationPanel } from "@/features/dashboard/components/live-translation-panel";
import { TextInputPanel } from "@/features/dashboard/components/text-input-panel";
import { QuickActionsPanel } from "@/features/dashboard/components/quick-actions-panel";
import { UserInfoCard } from "@/features/dashboard/components/user-info-card";
import { DashboardBelowUsageSection } from "@/features/dashboard/components/dashboard-below-usage-section";

export function DashboardView() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Subtle radial glow behind content */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-radial-[circle_at_top,rgba(250,250,250,0.08),transparent_60%]" />

      <PageHeader title="Dashboard" className="lg:hidden" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
        <DashboardHeader />

        {/* Hero row: cards aligned from same top */}
        <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)] xl:gap-12">
          {/* Left column: TTS card + Live Translation stacked */}
          <div className="flex flex-col gap-6">
            {/* Primary text-to-speech card */}
            <div
              className="animate-dashboard-card-in rounded-2xl border border-border/60 bg-[#0f0f0f]/95 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
              style={{ animationDelay: "0ms" }}
            >
              <div className="px-5 py-5 lg:px-6 lg:py-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
                      Text to speech
                    </p>
                    <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground lg:text-xl">
                      Turn your script into a finished voiceover
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground/90 lg:text-sm">
                      Paste your lines once, pick a voice, and generate studio-grade audio in a single flow.
                    </p>
                  </div>
                  <span className="hidden shrink-0 rounded-full border border-border/50 bg-background/80 px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground/80 lg:inline-flex">
                    Built for creators
                  </span>
                </div>
                <TextInputPanel />
              </div>
            </div>

            {/* Live Translation: directly below TTS */}
            <div
              className="animate-dashboard-card-in"
              style={{ animationDelay: "100ms" }}
            >
              <LiveTranslationPanel />
            </div>
          </div>

          {/* Right column: hero media + quick actions */}
          <div className="flex flex-col gap-5">
            <div
              className="animate-dashboard-card-in overflow-hidden rounded-3xl border border-border/70 bg-[#111111] shadow-[0_18px_60px_rgba(0,0,0,0.85)]"
              style={{ animationDelay: "200ms" }}
            >
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src="/lexel/dashboard-hero.jpg"
                  alt="Creator workspace with waveform and recording session"
                  fill
                  priority
                  className="object-cover opacity-90"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              </div>
              <div className="space-y-2 px-5 pb-5 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/80">
                  Creator tours
                </p>
                <h2 className="text-base font-semibold tracking-tight text-foreground lg:text-lg">
                  Design your own narration journeys
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground lg:text-sm">
                  Save time on every video, ad, or podcast intro with reusable voices and ready-to-trigger scripts.
                </p>
              </div>
            </div>

            <div
              className="animate-dashboard-card-in rounded-3xl border border-border/70 bg-[#0c0c0c]/90 px-4 py-4 lg:px-5 lg:py-5"
              style={{ animationDelay: "300ms" }}
            >
              <QuickActionsPanel />
            </div>
          </div>
        </section>

        {/* Secondary row: User info (with charts) + Workflow overview */}
        <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,2.6fr)]">
          <div
            className="animate-dashboard-card-in"
            style={{ animationDelay: "400ms" }}
          >
            <UserInfoCard />
          </div>
          <div
            className="animate-dashboard-card-in rounded-2xl border border-border/60 bg-[#0f0f0f]/95 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] px-5 py-5 lg:px-6 lg:py-6"
            style={{ animationDelay: "500ms" }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Workflow overview
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                  From script to mastered voice in three steps
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                  1 · Write
                </p>
                <p className="text-sm font-medium text-foreground">
                  Draft or paste any script up to 5k characters.
                </p>
                <p className="text-xs text-muted-foreground">
                  Keep each section focused—LEXEL handles pacing and breathing.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                  2 · Choose a voice
                </p>
                <p className="text-sm font-medium text-foreground">
                  Pick a system voice or your own clone.
                </p>
                <p className="text-xs text-muted-foreground">
                  Swap between tones without re-recording a single line.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                  3 · Generate
                </p>
                <p className="text-sm font-medium text-foreground">
                  Render high-quality audio and refine with ratings.
                </p>
                <p className="text-xs text-muted-foreground">
                  Reuse your best settings across scripts and projects.
                </p>
              </div>
            </div>
          </div>
        </section>

        <DashboardBelowUsageSection />
      </div>
    </div>
  );
};
