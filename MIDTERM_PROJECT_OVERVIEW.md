# LEXEL Mid-Term Project Overview

## 1) Project Vision

LEXEL is an AI-powered speech platform that makes high-quality voice generation and voice cloning accessible to creators, teams, and organizations.

The long-term vision is to become a reliable "voice OS" for content workflows: from writing text, to selecting or cloning voices, to generating production-ready audio at scale.

Core vision pillars:

- **Creativity first**: turn written ideas into expressive audio quickly.
- **Personalization**: let users build and reuse custom cloned voices.
- **Quality feedback loop**: improve voice quality using MOS-based ratings.
- **Scalable productization**: support organizations, subscriptions, and metered usage.

---

## 2) Scope (Mid-Term Deliverables)

Current implementation scope includes:

- **Text-to-Speech generation**
  - Input text + voice selection + inference controls.
  - Generate speech using external TTS backend.
- **Voice cloning / custom voice creation**
  - Record or upload voice samples.
  - Store custom voices for organization-specific reuse.
- **Generation history and playback**
  - Persist generated outputs and play them in-app.
- **Quality rating (MOS)**
  - Users submit overall and dimension-based quality scores.
- **Organization-based access**
  - Multi-tenant structure using Clerk organizations.
- **Billing integration**
  - Subscription and metering support via Polar.
- **Live translation (voice-to-text)**
  - Capture spoken input and transcribe to text in near real-time.
  - Display translated/transcribed text in the dashboard experience.
- **Agentic voice feature**
  - Conversational voice-agent flow powered by external LLM/voice services.
  - Supports interactive, multi-turn voice-first user experiences.

Out-of-scope for this milestone:

- Production-grade multilingual translation at enterprise SLA levels.
- Advanced model training/fine-tuning hosted directly inside this app.

---

## 3) Problem Statement

Creating high-quality voice content usually requires multiple tools, technical setup, and expensive manual editing.

LEXEL solves this by providing a single workflow:

1. Write text.
2. Select (or create) a voice.
3. Generate audio.
4. Optionally use live voice input and translation.
5. Interact through agentic voice conversations.
6. Review quality.
7. Iterate quickly.

---

## 4) High-Level Architecture

LEXEL is a full-stack Next.js application with a feature-based architecture.

- **Frontend**: Next.js App Router + TypeScript + Tailwind + shadcn/ui.
- **API Layer**: tRPC v11 procedures for typed client/server communication.
- **Auth**: Clerk (user identity + organization context).
- **Data Layer**: PostgreSQL via Prisma ORM.
- **File Storage**: R2 (S3-compatible) for generated and sample audio.
- **AI Inference Integrations**:
  - Chatterbox API for text-to-speech generation.
  - Speech/translation pipeline for live voice-to-text experiences.
  - Voice-agent integrations (Fish + Gemini) for conversational/agentic capabilities.
- **Billing**: Polar for subscriptions and usage metering.

---

## 5) Internal Working (End-to-End Flows)

### A) Text-to-Speech Flow

1. User enters text and inference parameters in dashboard/TTS page.
2. Client calls `generations.create` (tRPC).
3. Server validates org/auth and checks subscription rules.
4. Server sends request to external TTS provider (Chatterbox).
5. Audio response is uploaded to R2.
6. `Generation` record is stored in PostgreSQL.
7. UI redirects to generation details page with playable audio.

### B) Voice Cloning Flow

1. User records/uploads sample in voice creation UI.
2. Server uploads sample to R2.
3. New `Voice` row is created with org scope and metadata.
4. Voice appears in selection lists for future generation requests.

### C) MOS Rating Flow

1. User opens generated result page.
2. User submits MOS scores (overall, naturalness, clarity, intelligibility) + optional comment.
3. Backend upserts a single rating per user per generation.
4. Ratings become quality signals for product and model tuning decisions.

### D) Live Translation (Voice-to-Text) Flow

1. User speaks through the browser microphone in live translation mode.
2. Client streams/captures audio chunks and sends them to the translation/transcription backend.
3. Backend processes speech input and returns incremental or final text output.
4. UI renders translated/transcribed text in near real-time for user feedback.

### E) Agentic Voice Feature Flow

1. User provides voice or text prompt to start a conversational task.
2. Voice-agent route orchestrates model calls (LLM + voice services).
3. Agent generates context-aware responses across multi-turn interaction.
4. Response is returned as text and/or synthesized audio depending on mode.

---

## 6) Technical Aspects

### Framework and Language

- Next.js 16 (App Router)
- TypeScript end-to-end
- Client/server boundaries with server-safe modules

### API and Data

- tRPC for typed API contracts
- Prisma with PostgreSQL
- Key entities: `Voice`, `Generation`, `GenerationRating`
- Organization-based data isolation

### Security and Access

- Clerk authentication and organization checks
- Protected procedures (`orgProcedure`) for dashboard actions
- Env-driven secret management in `src/lib/env.ts`

### Storage and Media

- Audio binaries stored in R2
- Database stores object keys/metadata, not large media blobs
- Generated audio streamed via API route endpoints

### Realtime and Agentic AI

- Live voice-to-text path for translation/transcription interactions
- Agent orchestration using external AI services (Fish + Gemini stack)
- Modular route design for adding future voice/LLM providers

### Billing and Product Controls

- Polar subscription + metering integration
- Production gating for generation access
- Non-production bypass mode for development/testing

### UX and Frontend Engineering

- Feature-driven module organization under `src/features`
- Reusable design primitives under `src/components/ui`
- Dark, creator-focused dashboard design

---

## 7) Why This Architecture Works

- **Typed reliability**: tRPC + TypeScript reduce integration mismatches.
- **Scalable modularity**: feature-based folders keep domain logic maintainable.
- **Cloud-ready storage**: R2 offloads large binary audio from primary DB.
- **Multi-tenant support**: org scoping enables team and enterprise use-cases.
- **Extensible AI layer**: new models/providers can be integrated behind service boundaries.

---

## 8) Risks and Mitigations

- **External API dependency risk**  
  Mitigation: retry/error handling, provider abstraction, graceful UI feedback.

- **Audio storage growth**  
  Mitigation: lifecycle policies, metering, archival/deletion policies.

- **Generation latency variability**  
  Mitigation: async UX states, queueing options, caching where applicable.

- **Cost control for inference**  
  Mitigation: subscriptions, usage caps, monitoring, and metering.

---

## 9) Future Roadmap (Post Mid-Term)

- Real-time low-latency voice interactions.
- Stronger live translation accuracy, latency, and language coverage.
- Better voice persona controls and presets.
- Team collaboration features for content pipelines.
- Advanced analytics for quality, usage, and conversion.
- Model/provider fallback routing for higher reliability.

---

## 10) Suggested Presentation Narrative (Short)

1. **Problem**: voice generation workflows are fragmented and costly.
2. **Solution**: LEXEL unifies TTS, live voice translation, agentic interaction, cloning, evaluation, and delivery.
3. **Architecture**: typed full-stack app with AI provider integration.
4. **Demo flow**: speak or write -> translate/transcribe -> generate/agent response -> rate.
5. **Impact**: faster creator workflows with scalable SaaS foundations.
