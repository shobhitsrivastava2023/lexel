import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

export function LandingHero() {
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(env.APP_URL + "/")}`;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-radial-[circle_at_top,rgba(250,250,250,0.06),transparent_50%]" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="relative h-14 w-32">
            <Image
              src="/lexel/logo.jpg"
              alt="LEXEL"
              fill
              className="rounded-lg object-cover"
              priority
            />
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              AI-powered voice
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Turn scripts into finished voiceovers
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Generate studio-grade audio, clone your voice, and translate live across 23 languages—all in one place.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-8">
              <Link href={signInUrl}>Sign in</Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              New here?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </span>
          </div>
        </div>

        <div className="animate-dashboard-card-in w-full max-w-xl rounded-2xl border border-border/60 bg-[#0f0f0f]/95 px-5 py-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] sm:px-6 sm:py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
            What you can do
          </p>
          <ul className="mt-4 space-y-3 text-left text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary">·</span>
              Text-to-speech with system or custom cloned voices
            </li>
            <li className="flex gap-3">
              <span className="text-primary">·</span>
              Live translation: speak once, output in 23 languages
            </li>
            <li className="flex gap-3">
              <span className="text-primary">·</span>
              Rate and refine with MOS scores; reuse settings across projects
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
