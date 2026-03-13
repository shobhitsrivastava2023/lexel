# LEXEL – Codebase context for LLMs and agents

Use this file to quickly understand what the app does, how it’s structured, and where to look when making changes.

---

## What this app is

**LEXEL** is an **AI-powered text-to-speech (TTS) and voice cloning platform**. Users can:

- **Generate speech** from text using selected voices (system or custom/cloned).
- **Clone voices** by recording samples; custom voices are stored and used for TTS.
- **Rate generations** with MOS (Mean Opinion Score) scores (overall, naturalness, clarity, intelligibility) and optional comments.
- **Manage usage and billing** via Polar (subscription + metering); subscription is required for generation in production.

The UI is a **dark, Spotify-style dashboard**: sidebar nav, main content with text input, quick-action cards, and feature pages for TTS and voice management.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma (client in `src/generated/prisma`) |
| API | tRPC v11 (React Query integration) |
| Auth | Clerk (userId + orgId; org required for dashboard) |
| Billing | Polar (products, subscriptions, meters) |
| Storage | R2 (S3-compatible) for audio files and voice samples |
| TTS backend | External “Chatterbox” API (OpenAPI client in `src/lib/chatterbox-client.ts`) |
| Styling | Tailwind CSS v4, shadcn/ui, dark theme by default |
| Fonts | Inter, Geist Mono (from Next.js) |

---

## Project structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root: Clerk, tRPC, Toaster, dark body
│   ├── globals.css               # Theme (Spotify-like dark), Tailwind
│   ├── (dashboard)/              # Authenticated app shell
│   │   ├── layout.tsx            # SidebarProvider + DashboardSidebar + main
│   │   ├── page.tsx              # Dashboard home → DashboardView
│   │   ├── voices/               # Voice library (list, create)
│   │   └── text-to-speech/       # TTS form + generation detail
│   │       ├── page.tsx          # TTS form (voice, text, sliders)
│   │       └── [generationId]/page.tsx  # Single generation: audio + MOS card
│   ├── sign-in/ sign-up/ org-selection/
│   └── api/                      # Next route handlers (e.g. /api/audio/[id], /api/voices/create)
├── features/                     # Feature-based modules
│   ├── dashboard/                # Home: header, text input panel, quick actions
│   ├── billing/                  # Usage display, checkout (Polar)
│   ├── voices/                   # Voice list, create dialog, recorder, voice-card
│   └── text-to-speech/           # TTS form, voice selector, generation detail, MOS card
├── components/                   # Shared UI
│   ├── ui/                       # shadcn-style primitives (button, card, sidebar, etc.)
│   ├── page-header.tsx
│   └── voice-avatar/             # Avatar for voices (DiceBear seed)
├── trpc/                         # tRPC API
│   ├── routers/                  # voices, generations, billing, ratings
│   ├── init.ts                   # Context, authProcedure, orgProcedure
│   ├── client.tsx, server.tsx, query-client
│   └── client.ts                  # useTRPC()
├── lib/                          # Shared utilities and env
│   ├── env.ts                    # T3 env schema (required server vars)
│   ├── db.ts                     # Prisma client
│   ├── r2.ts                     # R2 upload/presign
│   ├── polar.ts                  # Polar SDK
│   ├── chatterbox-client.ts      # OpenAPI client for TTS API
│   └── subscription-access.ts    # isSubscriptionBypassEnabled (non-prod bypass)
├── hooks/                        # use-mobile, use-app-form, use-audio-playback
├── generated/prisma/             # Prisma client (do not edit by hand)
└── types/                        # chatterbox-api.d.ts (OpenAPI types)
```

---

## Data model (Prisma)

- **Voice** – Name, description, category, language, variant (SYSTEM | CUSTOM), optional `r2ObjectKey` for custom/cloned audio. `orgId` null = system voice.
- **Generation** – One TTS result: `orgId`, `voiceId`, `text`, `voiceName`, `r2ObjectKey`, and inference params (temperature, topP, topK, repetitionPenalty). Audio is served via `/api/audio/[generationId]`.
- **GenerationRating** – One per user per generation: overall, naturalness, clarity, intelligibility, optional comment. Unique on (generationId, userId).

All dashboard data is **org-scoped** (orgId from Clerk).

---

## tRPC routers

- **voices** – List (system + org’s custom), get by id, create (upload to R2, create Voice).
- **generations** – create (call Chatterbox, upload audio to R2, create Generation; checks Polar subscription in prod), getById, getAll (org).
- **ratings** – getForGeneration, upsertForGeneration (MOS scores + comment).
- **billing** – Usage/meters, createCheckout, etc. (Polar).

Procedures use **orgProcedure** (requires Clerk userId + orgId) for dashboard operations.

---

## Auth and billing

- **Clerk** – Sign-in, sign-up, org selection. Dashboard layout requires an org; `orgId` is in tRPC context.
- **Polar** – Subscriptions and metering (e.g. voice creation, TTS generation). In **production**, generation is gated on active subscription; **outside production**, subscription checks are bypassed (`subscription-access.ts`).

---

## Key flows

1. **Dashboard** – User lands on `/`; sees greeting, text input panel (character limit 5000), and quick-action cards (each links to TTS with preset text). Submitting text navigates to `/text-to-speech?text=...`.
2. **Text-to-speech** – User picks a voice, edits text, adjusts sliders (temperature, topP, topK, repetitionPenalty). “Generate” calls `generations.create`; on success, redirect to `/text-to-speech/[generationId]`.
3. **Generation detail** – Audio player, optional waveform (wavesurfer), and **GenerationMosCard** for viewing/editing MOS ratings (and submitting new ratings).
4. **Voices** – List/browse voices; “Voice cloning” opens a dialog to record and create a custom voice (stored in R2, Voice record with variant CUSTOM).

---

## Environment and config

- **Required env** (see `src/lib/env.ts`): `DATABASE_URL`, `APP_URL`, Clerk keys (via Clerk env), `POLAR_*`, `R2_*`, `CHATTERBOX_API_URL`, `CHATTERBOX_API_KEY`. Optional: `SKIP_ENV_VALIDATION`.
- **Path alias** – `@/` → `src/`.
- **Public assets** – `public/` (e.g. `public/lexel/` for logo and quick-action card images; logo at `public/lexel/logo.jpg`).

---

## Conventions

- **Feature code** lives under `src/features/<feature>/` (views, components, data, hooks as needed).
- **Server-only** – Use `server-only` and tRPC for server logic; avoid importing server code into client components.
- **Forms** – TanStack Form + Zod where applicable (e.g. TTS form).
- **Styling** – Prefer Tailwind and existing design tokens (e.g. `background`, `card`, `primary` from `globals.css`); sidebar uses `sidebar` tokens.

---

## Where to look for common tasks

| Task | Location |
|------|----------|
| Change dashboard layout or sidebar | `src/features/dashboard/`, `src/components/ui/sidebar.tsx` |
| TTS form, voice selector, generation params | `src/features/text-to-speech/` |
| MOS ratings UI and submission | `src/features/text-to-speech/components/generation-mos-card.tsx` |
| Generation API (create, get, list) | `src/trpc/routers/generations.ts` |
| Voice CRUD and R2 upload | `src/trpc/routers/voices.ts`, `src/app/api/voices/create/` |
| Billing / subscription / usage | `src/features/billing/`, `src/trpc/routers/billing.ts`, `src/lib/polar.ts` |
| TTS backend call | `src/lib/chatterbox-client.ts`, types in `src/types/chatterbox-api.d.ts` |
| DB schema and migrations | `prisma/schema.prisma` |
