# LEXEL Mid-Term Diagrams

Use these diagrams directly in your presentation slides (Mermaid-compatible tools: GitHub Markdown, Mermaid Live Editor, many slide plugins).

---

## 1) System Context Diagram

```mermaid
flowchart LR
    U[End User] --> FE[LEXEL Web App<br/>Next.js + TypeScript]
    FE --> API[tRPC API Layer]
    API --> AUTH[Clerk Auth + Org Context]
    API --> DB[(PostgreSQL<br/>Prisma)]
    API --> R2[(R2 Object Storage)]
    API --> TTS[Chatterbox TTS API]
    API --> BILL[Polar Billing + Metering]

    FE -. Voice Agent Feature .-> VA[Voice Agent Routes]
    VA --> FISH[Fish API]
    VA --> GEM[Gemini API]
```

---

## 2) Layered Architecture Diagram

```mermaid
flowchart TB
    subgraph Presentation[Presentation Layer]
        UI[Dashboard UI / TTS UI / Voices UI]
    end

    subgraph Application[Application Layer]
        TRPC[tRPC Routers<br/>voices, generations, ratings, billing]
        ROUTES[Next.js API Routes]
    end

    subgraph Domain[Domain Logic]
        GEN[Generation Service Logic]
        VOICE[Voice Management Logic]
        MOS[MOS Rating Logic]
        ACCESS[Subscription + Access Checks]
    end

    subgraph Infrastructure[Infrastructure Layer]
        PRISMA[Prisma ORM]
        POSTGRES[(PostgreSQL)]
        R2[(R2 Storage)]
        CLERK[Clerk]
        POLAR[Polar]
        CHATTERBOX[Chatterbox API]
    end

    UI --> TRPC
    UI --> ROUTES
    TRPC --> GEN
    TRPC --> VOICE
    TRPC --> MOS
    TRPC --> ACCESS
    GEN --> CHATTERBOX
    GEN --> R2
    GEN --> PRISMA
    VOICE --> R2
    VOICE --> PRISMA
    MOS --> PRISMA
    ACCESS --> POLAR
    ACCESS --> CLERK
    PRISMA --> POSTGRES
```

---

## 3) Text-to-Speech Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant UI as Frontend (TTS Form)
    participant TRPC as tRPC generations.create
    participant Access as Auth/Billing Check
    participant TTS as Chatterbox API
    participant Store as R2 Storage
    participant DB as PostgreSQL (Prisma)

    User->>UI: Enter text + select voice + params
    UI->>TRPC: create(text, voiceId, inferenceParams)
    TRPC->>Access: Validate org + subscription
    Access-->>TRPC: Allowed
    TRPC->>TTS: Request speech synthesis
    TTS-->>TRPC: Return audio bytes
    TRPC->>Store: Upload audio file
    Store-->>TRPC: Return object key
    TRPC->>DB: Insert Generation record
    DB-->>TRPC: generationId
    TRPC-->>UI: Success + generationId
    UI-->>User: Redirect to generation detail page
```

---

## 4) Voice Cloning Flow Diagram

```mermaid
flowchart TD
    A[User records or uploads sample] --> B[Voice create UI]
    B --> C[API endpoint / tRPC call]
    C --> D[Upload sample to R2]
    D --> E[Create Voice row in DB<br/>variant=CUSTOM, org-scoped]
    E --> F[Voice appears in voice selector]
    F --> G[Usable for future TTS generations]
```

---

## 5) Data Model (ER-style) Diagram

```mermaid
erDiagram
    VOICE {
      string id PK
      string name
      string description
      string category
      string language
      string variant
      string orgId
      string r2ObjectKey
    }

    GENERATION {
      string id PK
      string orgId
      string voiceId FK
      string text
      string voiceName
      string r2ObjectKey
      float temperature
      float topP
      int topK
      float repetitionPenalty
      datetime createdAt
    }

    GENERATION_RATING {
      string id PK
      string generationId FK
      string userId
      int overall
      int naturalness
      int clarity
      int intelligibility
      string comment
      datetime createdAt
      datetime updatedAt
    }

    VOICE ||--o{ GENERATION : "used in"
    GENERATION ||--o{ GENERATION_RATING : "rated by users"
```

---

## 6) Deployment / Runtime View

```mermaid
flowchart LR
    Browser[Client Browser] --> Next[Next.js App Server]
    Next --> TRPC[tRPC Procedures]
    TRPC --> PG[(PostgreSQL)]
    TRPC --> OBJ[(R2 Storage)]
    TRPC --> EXT1[Chatterbox API]
    TRPC --> EXT2[Polar API]
    TRPC --> EXT3[Clerk API]
```

---

## 7) Diagram Usage Tips for Slides

- Use **System Context** first (big picture).
- Then use **TTS Sequence** for "internal working".
- Use **ER diagram** when discussing technical depth.
- End with **Layered Architecture** to justify design decisions.
