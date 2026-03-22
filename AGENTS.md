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
| Voice agent (Fish + Gemini) | `src/app/(dashboard)/voice-agent/`, `src/app/api/voice-agent/`, `src/features/voice-agent/` — requires `FISH_API_KEY`, `GEMINI_API_KEY`; optional `FISH_TTS_BACKEND`, `FISH_TTS_PCM_SAMPLE_RATE`, `FISH_TTS_CHUNK_LENGTH` |
| DB schema and migrations | `prisma/schema.prisma` |

---

## Recent changes (for context)

Summary of layout, dashboard, and branding changes made to the codebase. Use this when reading context or making further edits.

### Sidebar

- **Sidebar on the right** – `DashboardSidebar` renders `<Sidebar side="right" collapsible="icon">` (in `src/features/dashboard/components/dashboard-sidebar.tsx`). The shared `Sidebar` component in `src/components/ui/sidebar.tsx` supports `side="left" | "right"`.
- **Content resizes when sidebar opens** – In `src/app/(dashboard)/layout.tsx`, the order is **SidebarInset first, then DashboardSidebar**. That way the sidebar’s “gap” reserves space on the right and the main content shrinks when the sidebar is open instead of being overlayed. Do not revert to Sidebar-then-Inset or the overlay behavior returns.

### Dashboard layout

- **Hero row** – Two columns with `items-start`: **left** = TTS card + Live Translation card stacked (`flex flex-col gap-6`); **right** = Creator tours card + Quick actions card. `DashboardHeader` is full-width **above** this grid so both columns align from the same top.
- **Secondary row** – **Left** = `UserInfoCard` (usage/activity with Recharts). **Right** = Workflow overview card. Both use the same card style as the TTS card for consistency.

### Dashboard cards (shared style)

Cards that should stay visually consistent use:

- `rounded-2xl border border-border/60 bg-[#0f0f0f]/95 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]`
- Same typography pattern: small uppercase label (`text-[11px]`, tracking), then title, then muted description.

Used for: TTS card, User Info card, Workflow overview card. Creator tours and Quick actions use slightly different wrappers (`rounded-3xl`, different borders) for hierarchy. Live Translation keeps its own gradient-border card style.

### Text-to-speech card (dashboard home)

- **Single surface** – No nested card-in-card. One outer card; the textarea sits in a simple `rounded-xl border border-white/6` container with `focus-within:border-white/10`.
- **Component** – `src/features/dashboard/components/text-input-panel.tsx`: textarea, estimate badge, character count, and “Generate speech” button. No extra gradient wrapper.

### Live Translation

- **Position** – Rendered **directly below** the TTS card in the left column of the hero row (in `src/features/dashboard/views/dashboard-view.tsx`). No gap between TTS and Live Translation.
- **Component** – `src/features/dashboard/components/live-translation-panel.tsx`; styling is unchanged (its own gradient border and “Experimental” badge).

### User Info card

- **New component** – `src/features/dashboard/components/user-info-card.tsx`.
- **Data** – `generations.getAll` and `billing.getStatus` (tRPC). Shows total generations count, estimated cost this period (or “—” when subscription is bypassed), and a Recharts **area chart** for generations per day over the last 7 days.
- **UI** – Same card style as TTS/Workflow; uses existing `ChartContainer` and Recharts (`AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`). Loading state uses `Skeleton`.

### Quick actions card

- **Location** – Bottom of the right column in the hero row, below the Creator tours card. Wrapper: `rounded-3xl border border-border/70 bg-[#0c0c0c]/90`. To make its height match the Live Translation card, give the Quick actions **wrapper** a `min-h-*` that matches the Live Translation card height, or use a CSS grid/flex strategy so both columns in that row share the same height.

### README and branding

- **README.md** – LEXEL-focused: hero image `./public/lexel/logo.jpg`, clone URL `https://github.com/code-with-antonio/lexel.git`, `cd lexel`, tutorial badge link `https://cwa.run/lexel-gh-yt`. No “Resonance” references.
- **Base colors** – Not changed; dark theme and green accent (e.g. `#1db954`) are kept as-is.
