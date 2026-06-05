const {
    Document, Packer, Paragraph, TextRun, PageBreak,
    AlignmentType, HeadingLevel, LevelFormat,
    Header, Footer, PageNumber, NumberFormat,
    TableOfContents, SectionType, BorderStyle
  } = require('docx');
  const fs = require('fs');
  
  // ── helpers ──────────────────────────────────────────────────────────────────
  
  const FONT = "Times New Roman";
  const BODY_SIZE = 24;   // 12 pt
  const H1_SIZE   = 28;   // 14 pt
  const H2_SIZE   = 24;   // 12 pt italic
  
  function body(text, opts = {}) {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 276, after: 120 }, // 1.15 line spacing, small gap after
      children: [
        new TextRun({
          text,
          font: FONT,
          size: BODY_SIZE,
          bold: opts.bold || false,
          italics: opts.italics || false,
        })
      ]
    });
  }
  
  function heading1(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { before: 240, after: 240, line: 276 },
      children: [new TextRun({ text, font: FONT, size: H1_SIZE, bold: true })]
    });
  }
  
  function heading2(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { before: 180, after: 120, line: 276 },
      children: [new TextRun({ text, font: FONT, size: H2_SIZE, bold: true, italics: true })]
    });
  }
  
  function centered(text, opts = {}) {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: opts.after ?? 120, line: 276 },
      children: [
        new TextRun({
          text,
          font: FONT,
          size: opts.size || BODY_SIZE,
          bold: opts.bold || false,
        })
      ]
    });
  }
  
  function blankLine() {
    return new Paragraph({
      children: [new TextRun({ text: "", font: FONT, size: BODY_SIZE })]
    });
  }
  
  function pageBreak() {
    return new Paragraph({
      children: [new PageBreak()]
    });
  }
  
  function signatureLine(label, subtitle) {
    return new Paragraph({
      spacing: { before: 480, after: 60, line: 276 },
      children: [
        new TextRun({ text: label, font: FONT, size: BODY_SIZE, bold: true }),
        new TextRun({ text: "\t" + (subtitle || ""), font: FONT, size: BODY_SIZE })
      ]
    });
  }
  
  // ── A4 page properties ───────────────────────────────────────────────────────
  // Left = 1.0" = 1440 DXA; Right/Top/Bottom = 0.7" = 1008 DXA
  const PAGE_MARGINS = { top: 1008, right: 1008, bottom: 1008, left: 1440 };
  const A4_SIZE = { width: 11906, height: 16838 };
  
  // ── Section builders ─────────────────────────────────────────────────────────
  
  // FRONT MATTER (cover, cert, ack, abstract, lists, TOC) – no page numbers
  function frontSection() {
    return {
      properties: {
        page: { size: A4_SIZE, margin: PAGE_MARGINS },
        type: SectionType.NEXT_PAGE,
      },
      children: [
        // ── Cover Page ──────────────────────────────────────────────────────
        blankLine(), blankLine(),
        centered("LEXEL: An AI-Powered Voice Agent and TTS Engine", { size: 28, bold: true, after: 240 }),
        blankLine(),
        centered("A PROJECT REPORT", { bold: true, size: 26, after: 120 }),
        blankLine(),
        centered("Submitted in partial fulfilment of the requirement for the award of the degree of", { after: 60 }),
        centered("BACHELOR OF TECHNOLOGY (B.Tech)", { bold: true, after: 60 }),
        centered("in", { after: 60 }),
        centered("Information Technology", { after: 60 }),
        centered("by", { after: 60 }),
        blankLine(),
        centered("Shobhit Srivastava", { bold: true, size: 26, after: 60 }),
        centered("Registration No. 229302512", { after: 60 }),
        blankLine(), blankLine(), blankLine(),
        centered("Department of Information Technology", { after: 60 }),
        centered("MANIPAL UNIVERSITY JAIPUR", { bold: true, after: 60 }),
        centered("Jaipur – 303007, Rajasthan, India", { after: 60 }),
        blankLine(),
        centered("May 2026", { after: 60 }),
  
        pageBreak(),
  
        // ── MUJ Certificate ─────────────────────────────────────────────────
        blankLine(),
        centered("Manipal University Jaipur", { bold: true, size: 28, after: 240 }),
        blankLine(),
        centered("CERTIFICATE", { bold: true, size: 28, after: 240 }),
        blankLine(),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, after: 120 },
          children: [
            new TextRun({
              text: "This is to certify that the project titled ",
              font: FONT, size: BODY_SIZE
            }),
            new TextRun({
              text: "LEXEL: An AI-Powered Voice Agent and TTS Engine",
              font: FONT, size: BODY_SIZE, bold: true
            }),
            new TextRun({
              text: " is a record of the bonafide work done by ",
              font: FONT, size: BODY_SIZE
            }),
            new TextRun({
              text: "Shobhit Srivastava (Reg. No. 229302512)",
              font: FONT, size: BODY_SIZE, bold: true
            }),
            new TextRun({
              text: " submitted in partial fulfilment of the requirements for the award of the Degree of Bachelor of Technology (B.Tech) in ",
              font: FONT, size: BODY_SIZE
            }),
            new TextRun({
              text: "Information Technology of Manipal University Jaipur, during the academic year 2025–26.",
              font: FONT, size: BODY_SIZE, bold: true
            }),
          ]
        }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({
          spacing: { before: 480, after: 60, line: 276 },
          children: [new TextRun({ text: "Venketesh Gauri Shankar", font: FONT, size: BODY_SIZE, bold: true })]
        }),
        new Paragraph({
          spacing: { after: 60, line: 276 },
          children: [new TextRun({ text: "Project Guide, Dept. of Information Technology", font: FONT, size: BODY_SIZE, italics: true })]
        }),
        new Paragraph({
          spacing: { after: 480, line: 276 },
          children: [new TextRun({ text: "Manipal University Jaipur", font: FONT, size: BODY_SIZE })]
        }),
        new Paragraph({
          spacing: { before: 60, after: 60, line: 276 },
          children: [new TextRun({ text: "Head of Department", font: FONT, size: BODY_SIZE, bold: true })]
        }),
        new Paragraph({
          spacing: { after: 60, line: 276 },
          children: [new TextRun({ text: "HOD, Dept. of Information Technology", font: FONT, size: BODY_SIZE, italics: true })]
        }),
        new Paragraph({
          spacing: { after: 60, line: 276 },
          children: [new TextRun({ text: "Manipal University Jaipur", font: FONT, size: BODY_SIZE })]
        }),
        blankLine(),
        new Paragraph({
          spacing: { after: 60, line: 276 },
          children: [new TextRun({ text: "Date: ____________________", font: FONT, size: BODY_SIZE })]
        }),
  
        pageBreak(),
  
        // ── Acknowledgement ─────────────────────────────────────────────────
        centered("ACKNOWLEDGEMENT", { bold: true, size: 28, after: 240 }),
        blankLine(),
        body("The author expresses sincere gratitude to project guide Venketesh Gauri Shankar for continuous mentorship, technical feedback, and guidance throughout the full lifecycle of this project. The sustained engagement from the initial design phase through to implementation, testing, and report preparation has been indispensable in shaping both the quality of the platform and the depth of academic understanding derived from it."),
        blankLine(),
        body("The faculty members of the Department of Information Technology, Manipal University Jaipur, are thanked for their valuable suggestions and timely academic support during planning, implementation, and evaluation. Their constructive observations during periodic reviews helped refine the project scope and maintain academic rigour throughout the development process."),
        blankLine(),
        body("The institutional resources and computing environment made available by Manipal University Jaipur enabled iterative development, controlled testing, and systematic analysis of voice generation and voice agent behavior under realistic operational scenarios. The availability of these resources was essential to completing the experimental validation described in this report."),
        blankLine(),
        body("Sincere thanks are also due to peers and family for the encouragement and motivation that helped sustain focus through the challenges of completing an individual major project. Their consistent support throughout the academic year contributed meaningfully to the successful conclusion of this work."),
  
        pageBreak(),
  
        // ── Abstract ────────────────────────────────────────────────────────
        centered("ABSTRACT", { bold: true, size: 28, after: 240 }),
        blankLine(),
        body("The increasing adoption of voice-first interfaces has made speech technologies central to intelligent human-computer interaction. Standalone voice demonstrations, however, often obscure real implementation constraints, making it difficult for students and practitioners to understand genuine system behaviour under production-like conditions. LEXEL addresses this gap by presenting an integrated platform focused on Text-to-Speech synthesis, voice cloning workflows, and real-time voice agentic interaction, designed as an academic exploration of AI capabilities and practical limitations in voice-enabled environments."),
        blankLine(),
        body("The implemented methodology follows a modular architecture wherein frontend interaction, typed backend procedures, database persistence, and object storage are combined with speech and language model APIs. Users provide text prompts, choose from system or custom voices, adjust synthesis controls including temperature, top-P, top-K, and repetition penalty, and obtain generated audio while preserving generation metadata for subsequent analysis. The voice agent module extends this flow with continuous speech recognition, short-turn response generation, and streaming audio playback coordinated through a session state machine."),
        blankLine(),
        body("Observed outcomes indicate that the platform supports stable end-to-end generation for common text lengths, workable interaction latency during interactive sessions, and useful quality assessment through Mean Opinion Score dimensions covering naturalness, clarity, intelligibility, and overall rating. The analysis also surfaces realistic constraints including pronunciation drift on rare terms, variable prosody on long inputs, and context sensitivity in extended conversational loops."),
        blankLine(),
        body("The project employs Next.js, TypeScript, React, Prisma ORM, PostgreSQL, tRPC, and Zod schema validation, with cloud object storage and API integrations for synthesis, multilingual handling, and real-time voice agent output. The resulting system provides a practical testbed for studying advanced voice AI behaviour through a structured and reproducible engineering workflow."),
  
        pageBreak(),
  
        // ── List of Tables ───────────────────────────────────────────────────
        centered("LIST OF TABLES", { bold: true, size: 28, after: 240 }),
        blankLine(),
        body("No formal data tables are included in this report. All results are presented through descriptive analysis and observational narrative as appropriate to the qualitative evaluation methodology adopted."),
  
        pageBreak(),
  
        // ── List of Figures ──────────────────────────────────────────────────
        centered("LIST OF FIGURES", { bold: true, size: 28, after: 240 }),
        blankLine(),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, after: 120 },
          children: [
            new TextRun({ text: "Figure 5.1\t", font: FONT, size: BODY_SIZE, bold: true }),
            new TextRun({ text: "System Architecture Diagram – Frontend, Backend, Model APIs, Database, and Storage", font: FONT, size: BODY_SIZE }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, after: 120 },
          children: [
            new TextRun({ text: "Figure 5.2\t", font: FONT, size: BODY_SIZE, bold: true }),
            new TextRun({ text: "Text-to-Speech Interface – Input Controls and Generation Parameters", font: FONT, size: BODY_SIZE }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, after: 120 },
          children: [
            new TextRun({ text: "Figure 5.3\t", font: FONT, size: BODY_SIZE, bold: true }),
            new TextRun({ text: "Generation Detail View – Audio Playback and MOS Scoring Panel", font: FONT, size: BODY_SIZE }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, after: 120 },
          children: [
            new TextRun({ text: "Figure 5.4\t", font: FONT, size: BODY_SIZE, bold: true }),
            new TextRun({ text: "Voice Agent Session – Live Transcript and Conversation State Display", font: FONT, size: BODY_SIZE }),
          ]
        }),
  
        pageBreak(),
  
        // ── Table of Contents ────────────────────────────────────────────────
        centered("TABLE OF CONTENTS", { bold: true, size: 28, after: 240 }),
        blankLine(),
        ...generateTOC(),
  
        pageBreak(),
      ]
    };
  }
  
  function generateTOC() {
    const entries = [
      ["Acknowledgement", "i"],
      ["Abstract", "ii"],
      ["List of Tables", "iii"],
      ["List of Figures", "iv"],
      ["Chapter 1: Introduction", "1"],
      ["  1.1  Introduction and Motivation", "1"],
      ["  1.2  Project Objectives", "2"],
      ["  1.3  Organisation of the Report", "2"],
      ["Chapter 2: Background Material", "3"],
      ["  2.1  Text-to-Speech Synthesis", "3"],
      ["  2.2  Voice Cloning", "3"],
      ["  2.3  Voice Agentic Interaction", "4"],
      ["  2.4  Project Technology Stack", "4"],
      ["Chapter 3: Methodology", "5"],
      ["  3.1  Modular Decomposition", "5"],
      ["  3.2  Request Validation Strategy", "5"],
      ["  3.3  Generation Flow", "6"],
      ["  3.4  Rating Methodology", "6"],
      ["  3.5  Voice Agent Methodology", "7"],
      ["  3.6  Error Resilience", "7"],
      ["Chapter 4: Implementation", "8"],
      ["  4.1  Feature-Based Architecture", "8"],
      ["  4.2  Text-to-Speech Interface", "8"],
      ["  4.3  Backend Generation Logic", "9"],
      ["  4.4  Voice Module Implementation", "9"],
      ["  4.5  Rating Module Implementation", "9"],
      ["  4.6  Voice Agent Implementation", "10"],
      ["  4.7  Translation Route", "10"],
      ["Chapter 5: Results and Analysis", "11"],
      ["  5.1  Functional Testing Outcomes", "11"],
      ["  5.2  Voice Agent Testing", "11"],
      ["  5.3  Latency Behaviour", "12"],
      ["  5.4  Observational Constraints", "12"],
      ["Conclusions and Future Scope", "13"],
      ["References", "14"],
      ["Annexures", "15"],
    ];
    return entries.map(([title, page]) =>
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 276, after: 80 },
        tabStops: [{ type: "right", position: 8600, leader: "dot" }],
        children: [
          new TextRun({ text: title, font: FONT, size: BODY_SIZE }),
          new TextRun({ text: "\t" + page, font: FONT, size: BODY_SIZE }),
        ]
      })
    );
  }
  
  // BODY SECTION – numbered pages from 1
  function bodySection() {
    return {
      properties: {
        page: {
          size: A4_SIZE,
          margin: PAGE_MARGINS,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL }
        },
        type: SectionType.NEXT_PAGE,
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: BODY_SIZE }),
              ]
            })
          ]
        })
      },
      children: [
  
        // ════════════════════════════════════════════════════════════════════
        // CHAPTER 1: INTRODUCTION
        // ════════════════════════════════════════════════════════════════════
        heading1("CHAPTER 1: INTRODUCTION"),
        heading2("1.1  Introduction and Motivation"),
        body("Recent progress in foundation models has accelerated interest in natural interfaces where users communicate through speech rather than keyboard input. The growing adoption of voice-first systems across consumer devices, accessibility tools, and enterprise applications has made speech synthesis, voice cloning, and conversational AI increasingly important subjects for academic study and engineering practice. Despite the rapid pace of development, standalone voice demonstrations available in the public domain often conceal the implementation constraints, latency trade-offs, and quality limitations that emerge under realistic usage conditions."),
        blankLine(),
        body("LEXEL addresses this gap by exposing complete pipelines from request creation to audio output within a single, coherent platform. Rather than isolating individual components, the project integrates Text-to-Speech generation, custom voice management, quality evaluation, and agentic conversational interaction under a unified architecture. This integration allows practical observation of how the individual components interact, degrade, and recover under varying input conditions, making LEXEL a suitable testbed for academic study of voice AI behaviour."),
        blankLine(),
        heading2("1.2  Project Objectives"),
        body("The primary objective of this project is to design and implement a reliable architecture capable of generating speech from text, supporting custom voice usage, and running voice agent sessions with controlled state handling. The platform is intended to demonstrate that typed API boundaries, schema validation, and modular feature design are practical strategies for maintaining reliability while integrating multiple external model services."),
        blankLine(),
        body("A second objective is to evaluate observed limitations under practical testing conditions such as varied prompt lengths, language differences, and device-level audio variability. Through systematic testing and Mean Opinion Score based feedback collection, the project aims to produce meaningful observations about the quality characteristics and failure modes of contemporary voice AI systems."),
        blankLine(),
        body("A third objective is to build a reproducible engineering baseline that allows future students to extend the system with additional voice models, evaluation metrics, and deployment strategies without rewriting the core architecture. This objective influenced the decision to separate frontend features, server procedures, and data contracts using strongly typed interfaces and stable folder conventions."),
        blankLine(),
        body("A fourth objective is to connect research style inquiry with practical software delivery. Instead of limiting the scope to theoretical analysis, the project intentionally includes complete user journeys covering voice selection, synthesis parameter configuration, generation playback, quality scoring, and conversational voice interaction. This ensures that observations made in the report are grounded in an executable implementation."),
        blankLine(),
        heading2("1.3  Organisation of the Report"),
        body("The remainder of this report is structured as follows. Chapter 2 provides background material covering the key concepts and technologies that inform the project. Chapter 3 describes the methodology adopted for system design, validation, generation flow, and quality evaluation. Chapter 4 details the implementation of each functional module. Chapter 5 presents the results and analysis derived from testing. The final chapter states the conclusions drawn from the work and outlines directions for future development. References and annexures are provided at the end of the document."),
  
        pageBreak(),
  
        // ════════════════════════════════════════════════════════════════════
        // CHAPTER 2: BACKGROUND MATERIAL
        // ════════════════════════════════════════════════════════════════════
        heading1("CHAPTER 2: BACKGROUND MATERIAL"),
        heading2("2.1  Text-to-Speech Synthesis"),
        body("Text-to-Speech synthesis converts textual input into waveform output by combining linguistic processing and acoustic generation. Classical concatenative and parametric approaches have been largely supplanted by neural architectures that produce perceptually natural speech through end-to-end learning. WaveNet and its successors established the viability of autoregressive waveform modelling, while subsequent non-autoregressive approaches achieved comparable quality at significantly reduced inference latency. Modern neural TTS systems typically operate in two stages: a sequence-to-sequence acoustic model that maps text to spectral representations, followed by a vocoder that converts those representations into time-domain audio."),
        blankLine(),
        body("Despite these advances, neural TTS systems continue to exhibit stability challenges under uncommon vocabulary, domain-specific terminology, and long-context prompts. Pronunciation inconsistency on rare terms, prosodic drift in extended passages, and reduced intelligibility under domain mismatch remain active areas of research. LEXEL provides a practical environment for observing these phenomena under controlled conditions."),
        blankLine(),
        heading2("2.2  Voice Cloning"),
        body("Voice cloning workflows aim to preserve the identity features of a reference voice while maintaining intelligibility and expressive control across synthesised outputs. Speaker-adaptive and speaker-conditioned TTS architectures extract speaker embeddings from a reference audio sample and condition the synthesis model on these embeddings during generation. Practical implementations require careful management of voice references, metadata consistency, and robust retrieval paths to ensure the selected voice remains available and correctly applied across generation requests."),
        blankLine(),
        body("LEXEL supports custom voice workflows through a dedicated voice management module that handles listing, search, and deletion of uploaded voice references. Generation requests that specify a custom voice fetch the associated metadata and pass the voice identifier to the synthesis API, enabling consistent speaker identity across multiple generation runs."),
        blankLine(),
        heading2("2.3  Voice Agentic Interaction"),
        body("Voice agentic interaction extends beyond synthesis by integrating speech recognition, conversational memory, language model inference, and low-latency audio playback into a continuous turn-taking loop. Interaction quality depends on the accuracy of turn segmentation, the responsiveness of interruption handling, the robustness of error recovery mechanisms, and the synchronisation of streaming output between the language and speech layers. State management is particularly critical, as the agent must coordinate idle, listening, thinking, and speaking phases while remaining responsive to user input at each stage."),
        blankLine(),
        body("The LEXEL voice agent module implements these requirements through a session controller that governs state transitions, a speech recognition capture loop that provides incremental transcript updates, and a streaming synthesis pipeline that begins audio playback as soon as sufficient text has been buffered for phrase-level synthesis."),
        blankLine(),
        heading2("2.4  Project Technology Stack"),
        body("The project stack combines Next.js App Router for interface and API routing, TypeScript for type safety across client and server, tRPC for typed remote procedure calls, Prisma for structured data access, PostgreSQL for durable persistence, and Zod for runtime schema validation. This combination enables reproducible development and controlled expansion of the system boundary. Cloud object storage manages audio asset persistence, with generation identifiers used as storage keys to maintain a consistent link between database records and stored audio files. Fish Audio provides the real-time synthesis capability for the voice agent module, with streamed PCM playback enabling near-immediate audio output. Language model inference for conversational response generation is handled through integration with Gemini API endpoints."),
        blankLine(),
        body("The frontend layer is implemented using React and feature-oriented component boundaries, with dedicated modules for dashboard, voices, text-to-speech, and voice-agent interaction views. This structure minimizes coupling between unrelated UI features and supports targeted iteration when modifying either generation workflows or conversational interfaces."),
        blankLine(),
        body("The server layer combines typed tRPC procedures with dedicated REST route handlers for streaming and media operations. This hybrid strategy is used because conventional request response mutations are ideal for structured operations such as create and list actions, while streaming voice agent interactions require low latency event delivery over newline delimited JSON."),
        blankLine(),
        body("The data model is intentionally compact and research-oriented. The Voice model stores identity and reference metadata, the Generation model captures input text and inference configuration for each synthesis run, and the GenerationRating model captures user-level quality judgments with uniqueness constraints to prevent duplicate ratings for the same generation and evaluator."),
  
        pageBreak(),
  
        // ════════════════════════════════════════════════════════════════════
        // CHAPTER 3: METHODOLOGY
        // ════════════════════════════════════════════════════════════════════
        heading1("CHAPTER 3: METHODOLOGY"),
        heading2("3.1  Modular Decomposition"),
        body("The methodology begins with modular decomposition of the platform into four primary functional areas. The first module handles voice inventory and selection behaviour, providing access to both system voices and user-uploaded custom voices. The second module handles Text-to-Speech generation with parameterised synthesis controls. The third module handles retrieval, playback, and subjective rating for completed generations. The fourth module handles voice agent sessions with streaming speech recognition input and streaming audio synthesis output. This decomposition ensures that each module can be developed, tested, and extended independently while remaining integrated through shared database state and typed API boundaries."),
        blankLine(),
        heading2("3.2  Request Validation Strategy"),
        body("Request validation is applied at procedure boundaries using Zod schemas to ensure that text length, parameter limits, and required fields are checked before any model invocation is attempted. This approach reduces invalid compute calls by rejecting malformed requests at the API boundary before they reach synthesis services, and improves deterministic error feedback by producing structured exceptions that can be surfaced to the client without ambiguity. Validation schemas are co-located with the procedure definitions to ensure that input requirements remain visible and maintainable as the API evolves."),
        blankLine(),
        heading2("3.3  Generation Flow"),
        body("The generation flow begins when a user submits text with a selected voice and synthesis controls. The backend validates access credentials and payload shape, fetches the selected voice metadata from the database, invokes the model generation endpoint with the validated parameters, stores the resulting audio in cloud object storage under a key derived from the generation identifier, and writes the generation metadata into the database to enable subsequent retrieval and rating. This sequence is implemented as a single tRPC mutation that coordinates all steps within a single request boundary, ensuring that partial failures result in structured error responses rather than inconsistent database state."),
        blankLine(),
        body("The generation flow also includes multilingual branching logic for a dedicated multilingual voice path. When this path is selected, the request requires a language identifier, validates it against a supported language set, and routes synthesis to the multilingual endpoint. This design allows one voice profile to produce output across multiple language targets while retaining predictable validation semantics."),
        blankLine(),
        heading2("3.4  Rating Methodology"),
        body("Quality evaluation uses Mean Opinion Score dimensions mapped to individual generation records. Users submit ratings for naturalness, clarity, intelligibility, and overall quality on a standard five-point scale. The rating module implements upsert behaviour to ensure that each user can submit and revise a single rating record per generation without creating duplicate entries. Aggregation procedures compute summary averages across all submitted ratings for each generation, providing a concise quality signal that can be compared across parameter settings and voice configurations. This methodology enables iterative quality comparison and supports observation of how synthesis parameters influence perceived output quality."),
        blankLine(),
        body("To strengthen interpretability, each rating event is associated with a concrete generated sample and timestamp. This enables temporal comparison and facilitates controlled retesting where identical prompt content is re-generated under altered parameter values. The methodology therefore supports both cross-sample comparison and within-sample reassessment over repeated sessions."),
        blankLine(),
        heading2("3.5  Voice Agent Methodology"),
        body("The voice agent methodology integrates several concurrent processes to produce a coherent interactive session. Speech recognition capture provides incremental transcript updates as the user speaks, with turn commit timing determined by silence detection. Upon turn commit, the accumulated transcript is submitted to the language model for response generation. The response text is accumulated in a phrase buffer, and phrases are dispatched to the synthesis API as they are completed. The synthesised audio is streamed back to the client and played through the Web Audio API. The session controller coordinates the idle, listening, thinking, and speaking states to maintain a comprehensible interaction model for the user."),
        blankLine(),
        body("The voice agent methodology also includes practical handling of microphone permission checks, secure-context constraints for browser speech recognition, duplicate utterance suppression, and restart behavior when recognition sessions end unexpectedly. These safeguards were added to improve robustness during real user interaction rather than controlled lab-like playback."),
        blankLine(),
        heading2("3.6  Error Resilience"),
        body("Error resilience is implemented through structured exceptions at procedure boundaries, fallback synthesis behaviour when the real-time synthesis channel encounters faults, and cleanup actions for partial failures in the generation pipeline. When real-time streaming synthesis fails, the voice agent falls back to one-shot synthesis of the buffered response text, ensuring that a spoken response is produced even under temporary upstream faults. Cleanup actions remove storage objects and database records created during a failed generation to prevent the accumulation of inconsistent state. This approach preserves user experience continuity and maintains database integrity under transient service degradation."),
        blankLine(),
        body("In addition, service configuration failures are surfaced as explicit user-facing errors rather than silent failures. Missing API keys, unsupported language requests, inaccessible voices, and malformed request payloads each map to deterministic error categories. This allows users to recover faster and also improves the research value of the platform because failure causes are clearly attributable."),
  
        pageBreak(),
  
        // ════════════════════════════════════════════════════════════════════
        // CHAPTER 4: IMPLEMENTATION
        // ════════════════════════════════════════════════════════════════════
        heading1("CHAPTER 4: IMPLEMENTATION"),
        heading2("4.1  Feature-Based Architecture"),
        body("The implementation uses a feature-based directory structure that separates dashboard, voices, Text-to-Speech, and voice agent capabilities into distinct module boundaries. This organisation keeps UI composition maintainable by limiting cross-module dependencies while allowing backend routes and typed procedures to evolve with clear ownership. Each feature directory contains its client components, server actions or tRPC router definitions, and associated type declarations, enabling the module to be understood and modified without navigating the entire codebase."),
        blankLine(),
        body("The dashboard includes specialized panels for rapid workflow entry, recent interaction context, and navigation to core generation and voice modules. This reduces friction during repeated testing and makes it easier to compare outcomes across multiple runs without reconfiguring the entire interface each time."),
        blankLine(),
        heading2("4.2  Text-to-Speech Interface"),
        body("The Text-to-Speech interface supports prompt input, voice selection from the available system and custom voice inventory, and synthesis controls including temperature, top-P, top-K, and repetition penalty. The interface also exposes a multilingual language selector when the multilingual voice path is chosen, enabling cross-language synthesis from a single interface. Parameter inputs are validated client-side before submission to provide immediate feedback on out-of-range values, with server-side validation applied as a second layer of enforcement at the procedure boundary."),
        blankLine(),
        body("The interface is designed to preserve user intent during iterative testing. If a previously selected voice is no longer available, controlled fallback logic selects an available alternative and maintains continuity of form state. This prevents user sessions from failing due to stale references after voice deletion or environment changes."),
        blankLine(),
        heading2("4.3  Backend Generation Logic"),
        body("Backend generation logic validates the incoming payload, confirms voice availability by fetching the voice record from the database, invokes the synthesis endpoint with the selected parameters, and persists the resulting audio to cloud object storage. The storage key is constructed from the generation identifier to maintain a deterministic and retrievable link between the database record and the stored audio file. Retrieval APIs construct signed URLs for stored audio objects and expose these to the frontend detail view, enabling authenticated playback without exposing storage credentials to the client."),
        blankLine(),
        body("The backend generation module further applies consistency protection by creating metadata first, storing generated audio next, and updating storage keys after successful upload. In failure cases, compensating delete actions remove partial records. This pattern keeps the generation table aligned with actual storage state and avoids orphaned entries."),
        blankLine(),
        heading2("4.4  Voice Module Implementation"),
        body("The voice module implementation provides listing, search, and deletion behaviour for both custom and system voices. The query path returns voices grouped by type to support faster client rendering and cleaner selector logic in the generation interface. Deletion logic removes the associated metadata record from the database and attempts cleanup of the corresponding audio reference from storage, preventing the accumulation of stale storage objects over time. Project-scoped identity behaviour ensures that custom voices are visible only within the relevant user context."),
        blankLine(),
        body("Search behavior in the voice module is implemented with case-insensitive matching across both voice name and description fields. This allows users to retrieve relevant voices faster when running repeated comparative experiments and reduces dependency on exact naming conventions."),
        blankLine(),
        heading2("4.5  Rating Module Implementation"),
        body("The rating module implements upsert behaviour using a composite unique constraint on user identifier and generation identifier, ensuring that each user can submit at most one active rating record per generation. Aggregate queries compute average values for overall score, naturalness, clarity, and intelligibility across all submitted ratings for a given generation. These summary values are displayed alongside the individual rating submission interface, enabling users to compare their own assessment against the aggregate and to observe how their parameter choices relate to the quality perceptions of other users."),
        blankLine(),
        body("The rating module also supports optional textual comments, allowing qualitative observations to be attached to numerical scores. This mixed quantitative and qualitative design is useful in academic projects where narrative insights often explain score shifts better than metrics alone."),
        blankLine(),
        heading2("4.6  Voice Agent Implementation"),
        body("Voice agent implementation provides session controls, voice selection from the available real-time capable models, live transcript display, conversational turn rendering, and streamed assistant audio output. The client reads newline-delimited JSON events from the backend streaming response and updates the transcript display and audio output in near real time. The backend voice agent chat route validates the incoming payload, checks service configuration, initialises the TTS connection, streams language model response deltas, buffers phrases for synthesis, and writes audio events back to the client as they become available. When the real-time output path encounters a fault, the route falls back to one-shot synthesis to ensure that a spoken response is always delivered."),
        blankLine(),
        body("Implementation details include event classes for metadata, partial assistant text deltas, audio chunks, tool status events, error events, and completion notifications. This event schema allows granular UI updates while preserving a deterministic stream protocol that can be inspected during debugging and future benchmarking."),
        blankLine(),
        body("The voice selection endpoint for the agent retrieves trained voices from the external provider, applies filtering rules, de-duplicates paginated results, and returns a sorted list for the client dropdown. This improves reliability of the interactive experience by ensuring users only see voices that are usable for the configured agent pipeline."),
        blankLine(),
        heading2("4.7  Translation Route"),
        body("The translation route validates source and target language fields and enforces the set of supported multilingual language identifiers before invoking the provider-specific translation logic. This validation step prevents unsupported language codes from reaching the translation provider and ensures that error responses are informative rather than opaque. The translation module supports cross-language experiments by enabling users to translate their input text into a target language before synthesising speech, extending the platform's utility for multilingual voice generation research."),
        blankLine(),
        body("Translation support is integrated as an optional augmentation layer rather than a mandatory preprocessing stage, allowing researchers to compare direct synthesis prompts against translated prompts and observe quality differences in multilingual output paths."),
  
        pageBreak(),
  
        // ════════════════════════════════════════════════════════════════════
        // CHAPTER 5: RESULTS AND ANALYSIS
        // ════════════════════════════════════════════════════════════════════
        heading1("CHAPTER 5: RESULTS AND ANALYSIS"),
        heading2("5.1  Functional Testing Outcomes"),
        body("Functional testing confirms that the platform can execute end-to-end synthesis from prompt submission through audio playback to persisted history retrieval. Voice selection behaviour remains consistent across refreshed sessions when voice records remain valid in the database. The generation pipeline successfully handles both system voices and custom voice references, with storage key resolution and URL generation operating reliably across all tested configurations."),
        blankLine(),
        body("Mean Opinion Score based feedback collection enables practical comparison of generated outputs under different parameter settings. Short and moderately long prompts consistently achieve stronger intelligibility scores than highly complex, domain-specific prompts containing rare technical vocabulary. Synthesis temperature and repetition penalty settings show observable influence on prosodic variation and repetition artefacts in longer outputs, supporting their inclusion as user-adjustable parameters. A placeholder is reserved below for the architecture diagram screenshot illustrating the frontend, backend, model APIs, database, and storage component relationships."),
        blankLine(),
        body("Regression-oriented testing across repeated sessions shows that stored generation records remain retrievable and playable through the dedicated audio route. No structural mismatch was observed between persisted synthesis metadata and returned playback resources during standard and multilingual test runs."),
        blankLine(),
        body("[Figure 5.1 – System Architecture Diagram: Insert screenshot here showing frontend, backend, model APIs, database, and storage components.]"),
        blankLine(),
        body("[Figure 5.2 – Text-to-Speech Interface: Insert screenshot here showing input controls and generation parameters.]"),
        blankLine(),
        heading2("5.2  Voice Agent Testing"),
        body("Voice agent testing shows that interactive sessions are feasible with clear state transitions and user-visible status indicators. Listening and speaking phases remain comprehensible to users when microphone permissions and network conditions are stable. The session state machine successfully coordinates transitions between idle, listening, thinking, and speaking states, and the live transcript display provides useful feedback on speech recognition accuracy during interaction."),
        blankLine(),
        body("Turn segmentation behaves reliably for short to moderate utterances under clean acoustic conditions. Longer utterances with embedded pauses occasionally trigger premature turn commits due to silence detection thresholds, resulting in partial transcript submissions to the language model. This behaviour is consistent with the limitations of client-side voice activity detection and represents a known area for future improvement."),
        blankLine(),
        body("[Figure 5.3 – Generation Detail View: Insert screenshot here showing audio playback and MOS scoring panel.]"),
        blankLine(),
        body("[Figure 5.4 – Voice Agent Session: Insert screenshot here showing live transcript and conversation state display.]"),
        blankLine(),
        heading2("5.3  Latency Behaviour"),
        body("Latency behaviour is influenced by network quality, language model response speed, and real-time synthesis channel conditions. Phrase buffering in the voice agent pipeline improves spoken output continuity by allowing the synthesis API to begin generating audio before the complete response text is available, reducing the perceived delay between turn commit and first audio output. However, phrase buffering may introduce slight additional delay for very short responses where the buffer accumulation wait exceeds the time required for one-shot synthesis."),
        blankLine(),
        body("Under stable network conditions with a low-latency language model endpoint, the observed time from turn commit to first audio output is consistent with practical interactive use. Under degraded network conditions or elevated model inference latency, this interval increases noticeably, and the fallback to one-shot synthesis provides a more predictable response delivery at the cost of slightly reduced naturalness in longer outputs."),
        blankLine(),
        body("From an engineering perspective, the latency profile indicates that end-user perception depends not only on model speed but also on interface-level feedback design. Status indicators and live transcript updates reduce perceived waiting time by making intermediate processing visible, which improves usability even when absolute latency is unchanged."),
        blankLine(),
        heading2("5.4  Observational Constraints"),
        body("Observational analysis identifies several limitations consistent with the current generation of voice AI systems. Pronunciation inconsistency arises occasionally on rare technical terms, proper nouns, and domain-specific vocabulary that is underrepresented in the synthesis model's training distribution. Reduced emotional coherence is observed in long responses, where prosodic variation tends to flatten over extended passages, producing output that is intelligible but less expressive than shorter segments. Transcript noise under adverse microphone environments, including background sound, reverberation, and device-level input variability, degrades speech recognition accuracy and consequently affects the quality of language model responses generated from noisy transcripts."),
        blankLine(),
        body("The project successfully demonstrates an academically useful environment for evaluating voice AI behaviour through reproducible workflows rather than isolated demonstrations. The integration of generation, rating, and conversational modules provides meaningful insights into practical system constraints and contributes a structured platform for future investigation of voice AI quality dimensions."),
        blankLine(),
        body("Another observed constraint is the interaction between response brevity and conversational continuity in agent sessions. Short response policies improve latency and speech intelligibility, yet sometimes reduce contextual richness for complex user intents. This trade-off suggests that adaptive response-length policies, conditioned on user intent confidence, could improve both usability and technical performance."),
  
        pageBreak(),
  
        // ════════════════════════════════════════════════════════════════════
        // CONCLUSIONS AND FUTURE SCOPE
        // ════════════════════════════════════════════════════════════════════
        heading1("CONCLUSIONS AND FUTURE SCOPE"),
        heading2("Conclusions"),
        body("LEXEL demonstrates that a unified architecture can combine Text-to-Speech generation, voice workflow management, quality evaluation, and voice agentic interaction in one coherent platform suitable for major-project-level research and engineering demonstration. The implementation confirms that typed API boundaries, schema validation, and modular feature design are effective strategies for maintaining reliability while integrating multiple external model services operating under varying performance characteristics."),
        blankLine(),
        body("The project also confirms that practical limitations remain significant in contemporary voice AI systems, particularly under noisy input conditions, long conversational contexts, and low-stability network environments. The Mean Opinion Score evaluation framework provides a useful mechanism for systematically observing these limitations and comparing output quality across parameter configurations. The observational findings presented in Chapter 5 contribute to a grounded understanding of where current voice AI systems succeed and where they require further development."),
        blankLine(),
        heading2("Future Scope"),
        body("Several directions present themselves as meaningful extensions of the current work. The first priority is the implementation of stronger voice activity detection and interruption control mechanisms to improve conversational turn precision, reducing the occurrence of premature turn commits caused by pauses within utterances. This would require integrating a more sophisticated endpoint detection model at the client side, potentially using a lightweight neural voice activity detector that can distinguish between pauses and turn endings more reliably than energy-threshold methods."),
        blankLine(),
        body("The second direction involves expanded multilingual pronunciation tuning and accent adaptation logic, which would allow the platform to serve a wider range of linguistic communities without the pronunciation degradation currently observed on less common language targets. This extension would benefit from integration with language-specific phoneme correction pipelines and accent-conditioned synthesis models."),
        blankLine(),
        body("The third direction is the development of automated benchmark suites for latency and Mean Opinion Score trend reporting across repeated experiments. Automated benchmarks would enable systematic comparison of synthesis quality and response latency across model versions and parameter configurations, reducing the reliance on manual testing for quality assessment. The fourth direction involves deeper context memory and persona control for longer multi-turn voice sessions, allowing the agent to maintain consistent conversational identity and recall across extended interactions. The fifth direction is the implementation of local fallback strategies using on-device synthesis models to reduce dependency on network availability and external API uptime, improving reliability in low-connectivity deployment contexts."),
        blankLine(),
        body("A sixth direction is the introduction of reproducible experiment bundles that capture prompt sets, synthesis configuration snapshots, expected quality bands, and observed anomalies. Such bundles would make it easier to compare results across semesters, contributors, and model upgrades while preserving methodological consistency."),
        blankLine(),
        body("A seventh direction is stronger observability instrumentation for event streams, including timings for speech recognition completion, language model first token latency, first audio chunk latency, and total response duration. This instrumentation would convert qualitative impressions into measurable evidence and support data-driven optimization of the entire voice interaction path."),
  
        pageBreak(),
  
        // ════════════════════════════════════════════════════════════════════
        // REFERENCES
        // ════════════════════════════════════════════════════════════════════
        heading1("REFERENCES"),
        body("[1] A. van den Oord et al., \"WaveNet: A Generative Model for Raw Audio,\" arXiv preprint arXiv:1609.03499, 2016."),
        body("[2] Y. Ren et al., \"FastSpeech 2: Fast and High-Quality End-to-End Text to Speech,\" in Proc. International Conference on Learning Representations (ICLR), 2021."),
        body("[3] ITU-T Recommendation P.800, \"Methods for Subjective Determination of Transmission Quality,\" International Telecommunication Union, 1996."),
        body("[4] Next.js Team, \"Next.js App Router Architecture,\" Vercel Documentation, https://nextjs.org/docs, Last accessed May 2026."),
        body("[5] Prisma Team, \"Prisma ORM Documentation,\" https://www.prisma.io/docs, Last accessed May 2026."),
        body("[6] tRPC Contributors, \"tRPC v11 Documentation,\" https://trpc.io/docs, Last accessed May 2026. C. Colby et al., \"Zod: TypeScript-first Schema Validation,\" https://zod.dev, Last accessed May 2026."),
        body("[7] Fish Audio, \"Fish Audio Real-time TTS Streaming API Documentation,\" https://docs.fish.audio, Last accessed May 2026."),
        body("[8] Google DeepMind, \"Gemini API Reference,\" https://ai.google.dev/docs, Last accessed May 2026."),
  
        pageBreak(),
  
        // ════════════════════════════════════════════════════════════════════
        // ANNEXURES
        // ════════════════════════════════════════════════════════════════════
        heading1("ANNEXURES"),
        heading2("Annexure A – Database Schema"),
        body("The database schema consists of three primary entities. The Voice entity stores voice identifier, name, type, reference audio storage key, and creation timestamp. The Generation entity stores generation identifier, associated voice identifier, input text, synthesis parameters as a JSON object, output audio storage key, creation timestamp, and user identifier. The GenerationRating entity stores rating identifier, generation identifier, user identifier, naturalness score, clarity score, intelligibility score, and overall score, with a composite unique constraint on generation identifier and user identifier to enforce the single-rating-per-user-per-generation invariant. An entity relationship diagram mapping these three entities and their foreign key relationships should be inserted at this position."),
        blankLine(),
        heading2("Annexure B – API Flow Sequences"),
        body("The generation create flow begins with a client mutation call, proceeds through Zod payload validation, voice metadata fetch, synthesis API invocation, object storage write, and database record creation, and concludes with the generation identifier returned to the client. The generation fetch flow retrieves the generation record and constructs a signed URL for the audio object. The rating upsert flow performs an atomic upsert on the composite unique constraint to ensure idempotent rating submission. API sequence diagrams for each of these flows should be inserted at this position."),
        blankLine(),
        heading2("Annexure C – Selected Source Code Excerpts"),
        body("Selected source code excerpts covering the generation router, rating router, and voice agent chat route are to be inserted at this position. The generation router excerpt illustrates the tRPC mutation procedure, Zod schema validation, and the sequence of synthesis, storage, and database operations. The rating router excerpt illustrates the upsert procedure and aggregation query. The voice agent chat route excerpt illustrates the streaming response architecture, phrase buffering logic, and fallback synthesis behaviour."),
        blankLine(),
        heading2("Annexure D – Test Log Summary"),
        body("A test log summary recording date-wise verification runs and outcome observations is to be inserted at this position. The log covers end-to-end generation tests across system and custom voices, voice agent session tests under varying network conditions, rating submission and aggregation tests, and translation route tests for each supported language pair."),
        blankLine(),
        heading2("Annexure E – Module Mapping to Source Structure"),
        body("A module mapping table should be inserted at this position to connect report chapters with concrete source directories. Suggested mapping includes dashboard views under src/features/dashboard, synthesis interface and detail modules under src/features/text-to-speech, voice management under src/features/voices, voice agent components under src/features/voice-agent, typed procedures under src/trpc/routers, and route handlers under src/app/api."),
  
      ]
    };
  }
  
  // ── Build document ────────────────────────────────────────────────────────────
  
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE }
        }
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: H1_SIZE, bold: true, font: FONT },
          paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 }
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: H2_SIZE, bold: true, italics: true, font: FONT },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
        }
      ]
    },
    sections: [
      frontSection(),
      bodySection()
    ]
  });
  
Packer.toBuffer(doc).then(buffer => {
  const primaryPath = "D:/DEVELOPMENT/lexel/generated/LEXEL_Major_Project_Report.docx";
  try {
    fs.writeFileSync(primaryPath, buffer);
    console.log("Done - LEXEL_Project_Report.docx written");
  } catch (error) {
    if (error && error.code === "EBUSY") {
      const fallbackPath = `D:/DEVELOPMENT/lexel/generated/LEXEL_Major_Project_Report_${Date.now()}.docx`;
      fs.writeFileSync(fallbackPath, buffer);
      console.log(`Primary file was locked, wrote fallback report to: ${fallbackPath}`);
      return;
    }
    throw error;
  }
});