# NoteWave + AI Knowledge Hub — Full Project Documentation

> Hey Harsh — this is the complete walkthrough you asked for: what the project is, why it
> exists, how it works, the tech stack, every concept it uses, and a file-by-file /
> line-by-line tour of both the backend and the frontend. No page limit was requested, so
> nothing important is left out.

---

## Table of Contents

1. [What the project is](#1-what-the-project-is)
2. [Why it exists / the problems it solves](#2-why-it-exists)
3. [Tech stack](#3-tech-stack)
4. [Overall architecture](#4-overall-architecture)
5. [Core concepts explained](#5-core-concepts-explained)
6. [Backend — folder by folder](#6-backend--folder-by-folder)
7. [Backend — file by file, line by line](#7-backend--file-by-file-line-by-line)
8. [Frontend — folder by folder](#8-frontend--folder-by-folder)
9. [Frontend — file by file](#9-frontend--file-by-file)
10. [API reference (all endpoints)](#10-api-reference)
11. [End-to-end: how chat works right now](#11-end-to-end-how-chat-works-right-now)
12. [Local Ollama setup (this machine)](#12-local-ollama-setup)
13. [Configuration (.env)](#13-configuration-env)
14. [Deployment guide](#14-deployment-guide)
15. [Troubleshooting](#15-troubleshooting)
16. [Ideas for the next steps](#16-ideas-for-next-steps)

---

## 1. What the project is

**NoteWave** is a single-page "AI Research Copilot" web app. A user uploads a PDF and the app
builds a searchable knowledge base out of it, then lets the user interact with that document
through:

- a **chat copilot** (RAG: retrieve relevant chunks, ask the LLM, get a Markdown answer with the
  document as context),
- one-click **studios** that turn the document into:
  - a **podcast** script (Host + Expert dialogue),
  - a **3-agent debate** (Skeptic / Weaver / Veritas),
  - a **vault audit** (truth/bias scores, unsupported claims),
  - a **quiz** (multiple-choice, with explanations and difficulty),
  - **flashcards** (active-recall Q&A),
  - a **3D / 2D knowledge graph** and concept map,
  - an executive **summary**, and
  - **voice** playback (ElevenLabs TTS) of the chat podcast.

Two runtime components talk to each other over HTTP:

- **Backend** — FastAPI + Python 3.13 (this is the brain: embedding, storage, retrieval,
  LLM calling, studios).
- **Frontend** — Next.js 16 (App Router) + React 19 + Tailwind + framer-motion (this is the
  face: the landing page, the dashboard, the studios, the 3D graph).

The special part of this build: because every Google **Gemini API key was exhausted** (daily
free-tier quota, HTTP 429 `RESOURCE_EXHAUSTED`), the backend was re-architected to be
**provider-agnostic** and to **fail over to a local Ollama model** running on this PC, with a
polling status system in the UI so the user always sees what the server is doing.

---

## 2. Why it exists

The project started as a "dump your PDF into a nice app" demo but was pushed forward for three
reasons:

1. **Real failure to fix:** chat hung for minutes or returned "API quota exceeded" because all 5
   Gemini keys were burned for the day. The fix is layered:
   - rotate through the key pool on rate limits,
   - fall back to a **local** model (Ollama) so the app always answers,
   - and make Gemini the first choice again in `auto` mode so quality stays high when quota is
     available.
2. **UX requirement from the user:** "I want to see the status during chat." So chat switched from
   a blocking request to a **job queue + polling** model where the UI reports live progress
   (`Searching your knowledge base...` → `Synthesizing your answer...`).
3. **Resume-grade pet project:** NoteWave is the flagship project on the resume (replacing the
   older task-scheduler project) — this documentation doubles as the "ho-written, I-wrote-it-all"
   proof.

---

## 3. Tech stack

| Layer      | Technology |
|------------|------------|
| Language   | Python 3.13 (backend), TypeScript (frontend) |
| API layer  | FastAPI, uvicorn, pydantic v2 |
| RAG        | LangChain, LangChain-Google-GenAI (`GeminiEmbeddings`), `RecursiveCharacterTextSplitter` |
| Vector DB  | ChromaDB (`chromadb`, `langchain-chroma`), persisted on disk |
| LLM        | Google Gemini (`google-genai`) + local Ollama (`qwen3:1.7b`) |
| PDF parsing| `pypdf` (PyPDFLoader) |
| HTTP client| httpx |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 3, framer-motion |
| 3D graph   | `three`, `react-force-graph-3d` (dynamic import, `ssr:false`) |
| Markdown   | `react-markdown` + `remark-gfm` |
| UI kit     | Radix primitives + shadcn-style components (`components/ui/*`) |
| TTS        | ElevenLabs REST API (optional; frontend falls back to browser speech synthesis) |
| Other      | python-dotenv, CORS middleware (wide-open for dev), threading for the job queue |

Requirements files: `backend/requirements.txt` (backend) and `frontend/package.json` (frontend).

---

## 4. Overall architecture

```
                    ┌──────────────────────────────┐
                    │      Next.js Frontend        │
                    │  page.tsx (dashboard shell)  │
                    │  studios/*  lib/*  ui/*      │
                    └──────────────┬───────────────┘
                                   │  HTTP (axios), CORS wide open
                                   ▼
                    ┌──────────────────────────────┐
                    │         FastAPI (main.py)    │
                    │  /api/chat  /chat/status/:id │
                    │  /api/upload /api/documents  │
                    │  /api/podcast /debate /quiz  │
                    │  /api/flashcards /graph ...  │
                    └──────┬───────────┬───────────┘
                           │           │
            ┌──────────────▼──┐   ┌────▼───────────────────┐
            │  rag.py         │   │  key_pool.py (KEY_POOL)│
            │  embeddings     │   │  tts.py (ElevenLabs)   │
            │  vector search  │   └────────────────────────┘
            │  Gemini/Ollama  │
            │  studios        │
            └──────┬──────────┘
                   │
        ┌──────────┼──────────────────┐
        ▼          ▼                  ▼
   ChromaDB   Gemini (google-     Ollama local
   ./chroma_db genai, 5 keys)    :11434 qwen3:1.7b
```

**Where the generation happens (decision tree):**

```
Chat/studio request
   └─ resolve_api_key() → pick a Gemini key (user's or round-robin)
        └─ _invoke_with_retry()
             ├─ provider == "ollama"  → generate_ollama()   (local only)
             └─ provider in (auto, gemini)
                  ├─ try Gemini with key rotation (3 attempts/key, 0.5s–30s backoff)
                  └─ on ANY failure, if provider == "auto" and Ollama is up
                       └─ fall back to local qwen3:1.7b
```

---

## 5. Core concepts explained

### 5.1 RAG (Retrieval-Augmented Generation)
Rather than stuffing an entire PDF into the prompt (too big, too slow, too expensive), the
document is **chunked** into overlapping slices, **embedded** into vectors, and stored in a
vector database. At query time the top-k most similar chunks are fetched and injected into the
prompt as "DOCUMENT CONTEXT". The model answers *using* that context only — that's what makes the
chat "grounded" in the document instead of hallucinating from the model's general knowledge.

### 5.2 Embeddings
`GeminiEmbeddings` (from `langchain-google-genai`) turns text into a numeric vector where
semantically-similar sentences land close together. Because Gemini embeddings require a (valid,
non-exhausted) key, the **upload/embed step also uses the rotating key pool**.

### 5.3 Chunking
`RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)`:
- breaks on paragraph/character boundaries when possible (recursive),
- keeps ~1000 chars per chunk with 150 chars of overlap so a concept split across a boundary
  is still retrievable from either neighbor.

### 5.4 Vector DB (Chroma)
- Persisted on disk at `backend/chroma_db`.
- Each document chunk is a vector with metadata (`source_filename`), which allows filtering
  retrieval to a specific file (`where={"source_filename": ...}`).
- Chroma auto-creates collections; the app just calls `similarity_search`.

### 5.5 Key pool + rotation
All 5 Gemini keys are read from `GOOGLE_API_KEYS` (comma-separated) into `KEY_POOL`. On a rate
limit (`429` / `quota` / `resource_exhausted` in the message):
- `is_quota_exhausted()` → daily quota blown → **skip immediately** to next key (no long sleep),
- otherwise exponential backoff `2^attempt * 2` seconds capped at 30s, then rotate after 3
  attempts.

### 5.6 Provider fallback (`auto`)
The killer feature of this build: chat and every studio go through `_invoke_with_retry`, which
tries **Gemini first** and, on *any* Gemini failure, transparently calls local Ollama. Result:
the loop "all keys exhausted" → app still answers from the local model. `LLM_PROVIDER=ollama`
forces local-only mode for testing without network/keys. `_ollama_up()` pings
`http://localhost:11434/api/tags` (short timeout) so we never stall on a dead server.

### 5.7 Streaming vs job/polling
Two chat transports exist:
- **`POST /api/chat` → `job_id` → `GET /api/chat/status/{job_id}`** (the one the UI uses today):
  the request returns instantly with a job id; a background `threading.Thread` runs
  `chat_with_context`, updating status strings; the frontend polls the status every 1.2s.
  This gives the user *visible progress* (per their requirement).
- **`POST /api/chat/stream` (SSE)**: kept as an alternative; yields `event: status`, `data:
  {type:token|error|done}` events. The frontend was reverted to polling at the user's request,
  but the endpoint is still there and works.

### 5.8 Greetings vs. retrieval
A UX bug: asking "hello" dumped the whole resume back because it triggered retrieval + the
document-context system prompt. `_should_retrieve()` now skips retrieval for greetings,
thank-yous, and messages of ≤2 words, so the assistant replies conversationally
(`_build_chat_prompt` then uses a "friendly assistant" system prompt and empty context).

### 5.9 Local model quirk: `think:false`
`qwen3:1.7b` (Ollama) defaults to a "thinking" mode where the answer tokens only arrive at the
very end inside `response`. That looked broken when streaming. Sending top-level
`"think": false` in `POST /api/generate` makes it emit final tokens directly.

### 5.10 Studios are just structured prompts
Every studio is a single prompt that says "return ONLY valid JSON of this exact shape", then
`_clean_json_string()` strips ```json fences and `json.loads` parses it. There are graceful
fallbacks (hand-written JSON) if parsing fails, so a studio never 500s on bad model output.

### 5.11 Job queue
`_chat_jobs: Dict[str, Dict]` keyed by uuid, guarded by `threading.Lock`; jobs are daemon
threads that update `status`, `message`, `reply`. Status endpoint maps: `done` → 200 with
content; `error` → 500 with detail; else `working` with the live message. Jobs are kept in
memory (lost on restart) — fine for a demo.

---

## 6. Backend — folder by folder

```
backend/
├── main.py            → FastAPI app: routes, CORS, auth-lite, job queue, TTS & studio endpoints
├── rag.py             → the brain: embeddings, vector DB, retrieval, Gemini/Ollama, chatbots, all studios
├── key_pool.py        → KeyPool class + rate-limit detectors + shared KEY_POOL singleton
├── tts.py             → ElevenLabs TTS synthesis (Host/Expert voices), audio→base64
├── requirements.txt   → Python dependencies
├── .env               → secrets & config (LLM_PROVIDER, OLLAMA_MODEL, GOOGLE_API_KEYS, ELEVENLABS_API_KEY)
├── chroma_db/         → Chroma vector store (auto-created, persisted)
└── documents/         → uploaded PDFs (also where the resume copy lives)
```

---

## 7. Backend — file by file, line by line

### 7.1 `key_pool.py` (63 lines)

- **`KeyPool` class**: a tiny thread-safe round-robin over the API keys.
  - `__init__` (lines 9–22): reads either `GOOGLE_API_KEYS` (comma-separated list, split and
    stripped) or falls back to `GOOGLE_API_KEY` (single). Empty list if neither.
  - `keys` (L24–26): a defensive copy of the list.
  - `has_keys()` (L28–29): whether we have any.
  - `primary()` (L31–34): the first key — used by the delete path.
  - `next_key()` (L36–42): round-robin with a lock; `% len(keys)` so it wraps forever.
  - `resolve(user_key)` (L44–47): prefer an explicitly supplied key, else `next_key()`.
- **`is_rate_limit_error(exc)`** (L50–52): string-sniffs the exception for `429`, `quota`,
  `rate`, `resource_exhausted`. Cheap and dependency-free.
- **`is_quota_exhausted(exc)`** (L55–60): stricter — only true when sitting it out is pointless
  (`resource_exhausted`, `429 + quota exceeded`, or the free-tier error code). This is what lets
  `_call_with_key_rotation` rotate *fast* instead of sleeping seconds.
- **`KEY_POOL = KeyPool()`** (L63): module-level singleton imported everywhere.

### 7.2 `rag.py` (781 lines)

**Constants & imports (L1–120).**
- Reads `DB_PATH` (Chroma persist dir), `MODEL_NAME` (`gemini-2.0-flash`), Gemini client
  creation via `_client_for_key(api_key)`, `GOOGLE_API_KEYS` via `KEY_POOL`.
- `LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto")`, `OLLAMA_MODEL =
  os.getenv("OLLAMA_MODEL", "qwen3:1.7b")`, `OLLAMA_BASE_URL = http://localhost:11434`.
- `_ollama_up()` (L~105): GET `/api/tags` with a short `httpx` timeout → bool.

**Embeddings & vector DB (L122–127)**
- `get_embeddings(api_key)` → `GeminiEmbeddings(api_key)`.
- `get_vector_db(api_key)` → `Chroma(persist_directory=DB_PATH, embedding_function=...)`.

**Key rotation driver (L130–163) `_call_with_key_rotation(fn, preferred_key)`**
- Builds `keys_to_try`: preferred key first, then every pool key not already tried.
- For each key, up to 3 attempts:
  - success → return.
  - on exception: remember it; if *quota exhausted* and more keys remain → sleep 0.5s, move to
    next key; if it was the last key → re-raise.
  - if merely rate-limited → exponential backoff `2^attempt*2` s (cap 30), rotate after attempt 2.
  - non-rate-limit errors → re-raise immediately (nothing to rotate).
- If we ran out of everything → raise `last_error`.

**Ollama calls (L166–195)**
- `_generate_ollama(prompt, temperature)`: POST `/api/generate` with `{"model", "prompt",
  "stream": False, "think": False, "options":{"temperature"}}`; 300s timeout; returns
  `resp.json().get("response","")`. `think:False` forces direct answer tokens.
- `_stream_ollama(...)`: same but `stream: True` and iterates the NDJSON lines, yielding each
  `data["response"]` token until `data.get("done")`.

**Unified invoke (L198–217) `_invoke_with_retry(api_key, prompt, temperature=0.3)`**
- `LLM_PROVIDER == "ollama"` → straight to `_generate_ollama` (no Gemini attempt, no network).
- Else define `_call(key)` → `client.models.generate_content(model, contents, temperature)`.
- Try `_call_with_key_rotation(_call, preferred_key=api_key)`.
- **On ANY exception**, when provider is `auto` and Ollama is reachable → return
  `_generate_ollama(...)`. This is *the* fallback guarantee that makes chat always answer.
- Re-raise if not auto / Ollama down.

**JSON hygiene (L220–228)**
- `_clean_json_string`: strips ```json / ``` fences and surrounding whitespace so `json.loads`
  always gets clean payloads from models that love adding fences.

**Key validation (L231–241)**
- `validate_api_key`: `client.models.get(model=MODEL_NAME)`; returns `{valid, model}` or
  `{valid:False, error}`. Used by the Settings studio + `/api/validate-key`.

**PDF processing (L244–257) `process_pdf(file_path, api_key)`**
- `PyPDFLoader.load()` → pages as Documents; tag each page with `source_filename` (the uploaded
  filename).
- Split with `RecursiveCharacterTextSplitter(1000, 150)`.
- `get_vector_db(api_key).add_documents(chunks)` → embeds via Gemini (rotating keys) and persists.
- Returns chunk count for the upload response.

**Raw document text (L260–271) `_get_document_text(file_path_or_name, max_chars=50000)`**
- Tries the path as-is, then `documents/<name>`, then `documents/<basename>`; loads with
  PyPDFLoader and joins page text, truncated to `max_chars`. This is what feeds the studios when
  we want *whole-document* content (they don't need vector search).

**Full-document analysis (L274–332) `analyze_full_document(file_path, api_key)`**
- Pulls up to 50k chars, prompts Gemini for `{summary, flashcards[5], graph{nodes,links}}`
  (graph groups: 1 Core, 2 Evidence, 3 Methodology, 4 Outcomes; 10–16 nodes).
- On success parses JSON; on any failure returns a graceful fallback with a summary string, one
  generic flashcard, and a single-node graph — so the Summary studio never crashes on a bad model.

**Search (L335–368) `query_documents(query, api_key, filename)`**
- Vector search top-6 (filtered by `source_filename` when requested; falls back to unfiltered k=5
  if nothing), joins context with `\n---\n`, builds a "Research Copilot" prompt with
  `PromptTemplate`, calls `_invoke_with_retry`. Handles rate limit with a friendly message.

**Retrieval gate (L371–399) `_should_retrieve(messages)`**
- Finds the last user message; normalizes whitespace/lowercase.
- Returns False for empty, for a fixed casual set (hi, hello, hey, thanks, ok, who are you, …),
  for ≤2-word messages, and for short "please/can you/…" prefixes (≤3 words). Otherwise True.
- This stopped the "hello → resume dump" embarrassment.

**Context builder (L402–431) `_build_chat_context(messages, api_key, filename)`**
- If `_should_retrieve` is False → return `""` (conversation mode).
- Else vector-search top-6 (filtered), and if nothing found *and* a filename exists → fall back
  to raw text (12k chars). Swallows DB errors with `except Exception: pass`.

**Prompt builder (L434–464) `_build_chat_prompt(messages, context)`**
- Renders the last 6 messages as `User:/Assistant:` lines for the "CONVERSATION HISTORY".
- Context present → "high-integrity AI Research Copilot" system + `DOCUMENT CONTEXT` block.
- No context → "friendly AI assistant, normal conversation, reply naturally and concisely" +
  `(no context retrieved for this message)`. Both end with "Provide the assistant's next
  response:".

**Chat (L467–484) `chat_with_context(...)` (used by the polling job)**
- Empty messages → canned line. Reports "Searching your knowledge base..." via `status_cb`,
  builds context, reports "Synthesizing your answer (Gemini first)...", builds prompt, returns
  `_invoke_with_retry(api_key, prompt, temperature=0.4)`.

**SSE streaming chat (L487–542) `stream_chat_answer(...)` (used by /api/chat/stream)**
- Yields `{"status": ...}` → `{"token": ...}` ×N → `{"done": True}`, or `{"error": msg}`.
- Ollama-only provider: streams `_stream_ollama` directly.
- Gemini path: `_gemini_tokens()` uses `generate_content_stream`, and if a rate limit hits in
  `auto` mode it logs a status arrow and seamlessly continues streaming from Ollama.

**Studios (L545–763)** — every one: `_get_document_text(…, max_chars=16000–18000)` → structured
prompt → `_invoke_with_retry` → `_clean_json_string` → `json.loads` → **fallback objects**:
- `generate_podcast_script` (L545–581): 6–10 exchanges Host(Alex)/Expert(Dr. Taylor), 2-minute
  deep-dive, temp 0.7.
- `generate_debate` (L584–618): CRITIC/SYNTHESIZER/FACT_CHECKER 6-turn debate, temp 0.6.
- `generate_vault_audit` (L621–654): `{truthScore, biasScore, provenance, unsupportedClaims[]}`,
  temp 0.2.
- `generate_quiz` (L657–698): `count` MCQs with options/answer/explanation/concept/difficulty,
  temp 0.3.
- `generate_flashcards` (L701–723): 6–10 active-recall cards, temp 0.3.
- `generate_graph` (L726–763): 12–18 nodes grouped 1–4 with labeled links, temp 0.3 — feeds the
  3D concept map.

**Deletion (L766–781) `delete_document_data(filename, api_key)`**
- Removes the file from `documents/`, then purges its vectors from Chroma with
  `vector_db._collection.delete(where={"source_filename": ...})`. Swallows errors — best-effort.

### 7.3 `main.py` (407 lines) — FastAPI app

- **L1–14**: imports, `load_dotenv()`, imports everything needed from `rag` / `key_pool` /
  `tts`.
- **L38–46**: creates the app + a fully-open CORS middleware (dev-friendly; lock this down for
  prod).
- **L48–49**: `UPLOAD_FOLDER = "documents"`, mkdir on boot.
- **L52–60 `resolve_api_key`**: user-provided key wins; else round-robin pool; else the single
  default key; else 401.
- **L63–69 `handle_api_error`**: converts rate limits to HTTP 429 with a clear message, else 500.
- **L72–80 health**: `/` and `/api/health` → `{status, service, keys_configured, provider}`.
- **L84–111 request models**: `KeyValidationRequest`, `SearchQuery`, `ChatRequest`,
  `StudioRequest`, `TTSRequest` (fileId/filename/api_key/count).
- **L115–121 `/api/validate-key`**.
- **L125–159 upload**: rejects non-PDF; streams to disk; `process_pdf` (embeds); on error deletes
  the partial file then `handle_api_error`. Response: `{success, filename, status:"Indexed",
  chunks, message}`.
- **L163–180 `/api/documents`**: lists `documents/*.pdf` with id from mtime, size, and a hard-coded
  `mastery: 85` (placeholder score).
- **L183–204 delete**: DELETE `/documents/{filename}` (or POST `/api/delete`) → deletes file +
  vectors.
- **L208–216 `/api/search`** → `query_documents`.
- **L219–228 `/api/chat`**: validates key, starts a background job with `start_chat_job`, returns
  `{job_id, status:"queued"}` **immediately**.
- **L232–266 job queue**: `_chat_jobs` dict + `threading.Lock`; `start_chat_job` creates a job and
  a daemon worker thread that updates status via a nested `_set_status`, runs
  `chat_with_context`, and writes `reply` on success or a friendly `error` on failure.
- **L269–280 `/api/chat/status/{job_id}`**: done → 200 `{status:"done", content, text}`; error →
  500 with detail; else 200 `{status:"working", message}`.
- **L283–305 `/api/chat/stream`**: SSE (`text/event-stream`) — status/token/error/done events
  from `stream_chat_answer`. Kept as a fallback transport.
- **L308–320 `/api/tts`**: ElevenLabs synthesize → base64 audio, else 503 (frontend then uses
  browser speech).
- **L322–406 studios**: `/api/podcast`, `/api/debate`, `/api/vault` (+`/vault/audit`),
  `/api/quiz`, `/api/flashcards`, `/api/graph` (+`/graph/extract`), `/api/summary`. Each resolves
  the key, picks the target file, calls the `rag` generator, and returns its payload.

### 7.4 `tts.py` (48 lines)
- Two ElevenLabs voice IDs: Adam (Host) and Bella (Expert).
- `_pick_voice(speaker)`: "host"/"alex" → Adam, anything else → Bella.
- `synthesize_line(text, speaker)`: async httpx POST; `eleven_turbo_v2_5`; stability 0.5 /
  similarity 0.75; returns bytes on 200 else None.
- `audio_to_base64(bytes)` → data-URI-ready string.

---

## 8. Frontend — folder by folder

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          → html shell, fonts, <Providers/>
│   │   ├── page.tsx            → THE app: landing + dashboard + chat + studios (843 lines)
│   │   ├── providers.tsx       → theme provider (next-themes)
│   │   ├── globals.css         → Tailwind + design tokens (dark-first)
│   │   └── api/[...path]/route.ts → Next backend route that proxies to FastAPI
│   ├── components/
│   │   ├── ui/                 → shadcn/Radix primitives (button, card, dialog, tabs, …)
│   │   ├── landing/LandingPage.tsx → hero + upload + enter dashboard
│   │   ├── knowledge-graph.tsx → 2D fallback graph component
│   │   └── dashboard/
│   │       ├── SidebarLeft.tsx → sources/library + theme + upload + delete
│   │       ├── SidebarRight.tsx → studios panel + active studio
│   │       ├── CommandPalette.tsx → "/" command menu
│   │       └── studios/        → Debate, Flashcards, Podcast, Graph, Quiz, Summary,
│   │                              Settings, Vault, Voice studios
│   ├── lib/
│   │   ├── api.ts              → API_BASE + axios error prettifier
│   │   ├── agents.ts           → RESEARCH_AGENTS metadata (Skeptic/Weaver/Veritas)
│   │   ├── commands.ts         → "/command" registry for the palette
│   │   └── utils.ts            → cn() tailwind-merge helper
│   └── types/force-graph.d.ts  → TS declarations for react-force-graph-3d
```

---

## 9. Frontend — file by file

### 9.1 `app/layout.tsx`
Root layout; imports `globals.css`; wraps children in `<Providers>`; sets the `<html lang>`, and
fonts. No layout shift hacks needed — mostly a pass-through shell.

### 9.2 `app/providers.tsx`
Thin wrapper around `next-themes` so the darkness toggle works across the tree.

### 9.3 `app/globals.css`
Tailwind directives + CSS variables for the shadcn theme tokens (background, foreground,
primary, border, etc.) in `:root` and `.dark`, plus the typography/scrollbar niceties.

### 9.4 `app/page.tsx` (843 lines) — the heart of the UI
High-level flow:

- **State**: `mounted`, `hasEntered` (landing vs dashboard), `documents`, `activeDoc`,
  `messages` (ChatMessage[]), `isLoading`, `chatStatus`, `apiKey`, studios payloads
  (`summaryText`, `quizQuestions`, `flashcards`, `graphData`, `podcastScript`,
  `debateTranscript`, `vaultAudit`), UI toggles (`showLeftSidebar`, `leftSidebarWide`,
  `showRightSidebar`, `activeStudio`, `theme`, `appSettings{focusMode}`).

- **`processUpload(fileOrEvent)`**: POSTs to `/api/upload` with the file, refreshes the document
  list, auto-selects the new file as `activeDoc`.

- **`handleSwitchFile` / `handleDeleteFile`**: set active / call `/api/delete` + refresh + clear
  studio payloads.

- **Chat — `handleSubmit` (L489–553)**, the polling implementation:
  1. Append user message + an empty assistant bubble.
  2. `POST /api/chat` with `{messages, fileId: activeDoc.name, api_key}`.
  3. Response is `{job_id}` → **poll**: `for(;;)` loop with `await sleep(1200)`, 5-minute deadline.
  4. Each poll: `GET /api/chat/status/{job_id}`.
     - `status === "done"` → fill the assistant bubble with `content`/`text`, break.
     - else → `setChatStatus(response.message)` (this is the "Searching your knowledge
       base..." / "Synthesizing your answer..." live text) — the *always-visible status* the user
       wanted.
     - HTTP 500 from the status endpoint → throw with `detail` (shown as an error bubble).
     - network error → `setChatStatus("Contacting server...")`.
  5. `finally` → `setIsLoading(false); setChatStatus("")`.
  - Greeting messages work because the backend's `_should_retrieve` gate + conversational prompt
    are doing their job (verified with "hello" → a friendly reply, no resume dump).

- **Command palette** (L~430–486): typing `/` filters `COMMANDS`; arrows + Enter run
  `executeCommand`, which sets `activeStudio` and triggers the corresponding generator if empty.

- **Render**: if not `hasEntered` → `<LandingPage .../>`. Otherwise the three-pane dashboard:
  - `SidebarLeft` (sources + upload + theme + delete),
  - center stage: header bar, message list (Markdown-rendered via `react-markdown`), typing
    indicator + `chatStatus` line during `isLoading`, and the chat input,
  - `SidebarRight` with the card-based studios (`PodcastStudio`, `DebateStudio`, `GraphStudio`,
    `QuizStudio`, `FlashcardsStudio`, `VaultStudio`, `SummaryStudio`, `VoiceStudio`, `SettingsStudio`).

- **Focus mode** applies `grayscale-[0.8] brightness-90` to the whole shell.

### 9.5 `app/api/[...path]/route.ts`
A Next.js catch-all server route that proxies requests to `NEXT_PUBLIC_API_URL` (defaults to
`http://127.0.0.1:8000`). This lets the browser avoid CORS/host mismatch issues when the FastAPI
origin differs from the frontend origin, and is the deployment hook for wiring the backend URL.

### 9.6 `lib/api.ts`
`API_BASE` from `NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"`; `getApiErrorMessage(err)`
normalizes axios/knowledge errors and special-cases 429 → "API quota exceeded…".

### 9.7 `lib/agents.ts`
`RESEARCH_AGENTS`: CRITIC ("Dr. Skeptic", red), SYNTHESIZER ("The Weaver", violet),
FACT_CHECKER ("Veritas", green) with personality blurbs — consumed by the Debate studio.

### 9.8 `lib/commands.ts`
The `/` command registry: `podcast, flashcards, graph, debate, vault, quiz, summary, voice,
settings` with labels, descriptions, and lucide icons.

### 9.9 `lib/utils.ts`
`cn(...inputs)` = `twMerge(clsx(inputs))` — the standard shadcn class combiner.

### 9.10 `components/ui/*`
Radix/shadcn primitives hand-tuned: `button, card, input, textarea, dialog, tabs, select, switch,
badge, avatar, progress, scroll-area, separator, toast`. Nothing special — they're the building
blocks.

### 9.11 `components/landing/LandingPage.tsx`
Gradient hero, app pitch, API-key input, and upload drop-zone that calls `onUploadFile`. The
"Enter NoteWave" button flips `hasEntered`.

### 9.12 `components/knowledge-graph.tsx`
A 2D canvas/SVG knowledge-graph rendering used as a lighter fallback to the 3D force graph.

### 9.13 `components/dashboard/SidebarLeft.tsx`
- Library list (`documents` from `/api/documents`) with active highlight, upload button, delete.
- Theme toggle, sidebar collapse + width controls, settings shortcut.

### 9.14 `components/dashboard/SidebarRight.tsx`
The studios rail: 8–9 cards (Podcast / Debate / Vault / Quiz / Flashcards / Graph / Summary /
Voice / Settings), each showing its payload or a "Generate" button → triggers the parent handler.

### 9.15 `components/dashboard/CommandPalette.tsx`
A Radix Dialog command menu: filters `COMMANDS` by label/id, keyboard nav (↑↓/Enter/Esc).

### 9.16 `components/dashboard/studios/*`

- **PodcastStudio** — shows the Host/Expert script, plays each line with TTS (`/api/tts`) or
  falls back to `speechSynthesis`.
- **DebateStudio** — renders agent turns with per-agent colors from `agents.ts`.
- **VaultStudio** — truth/bias bars + unsupported claims list.
- **QuizStudio** — MCQ flow with selectable answers, then explanation + score.
- **FlashcardsStudio** — flip-card deck with 3D rotate transition.
- **GraphStudio** — the 3D concept map (see below) + a 2D SVG `ConceptMap2D` fallback so the
  feature renders even without WebGL.
- **SummaryStudio** — rendered executive summary.
- **SettingsStudio** — API-key management (uses `/api/validate-key`), focus mode toggle, theme.
- **VoiceStudio** — a mic/browser-SpeechRecognition UI to "talk to your document".

### 9.17 `studios/GraphStudio.tsx` (the 3D map — made resilient)
- **L9–12**: `ForceGraph3D` is dynamically loaded with `ssr:false` — React Force Graph uses
  `three`/WebGL and breaks during server-side rendering, so Next's `dynamic()` defers it to the
  browser.
- **L21**: `GROUP_COLORS` map for node groups 1–4 (with 2 spares).
- **L23–38 `resolveNodePos`**: if the model ever fails to return positions, it pre-computes a
  circle layout (`rad=150`, centered at 300,220) so nodes never pile up.
- **L40 `ConceptMap2D`**: an SVG rendering that draws radial-gradient nodes at `pos`, labeled
  links at their midpoints — used as a **guaranteed-render fallback** when WebGL is unavailable,
  which is why the concept map now "always works" after a hard refresh instead of showing a blank
  canvas.
- Rest: the 3D `ForceGraph3D` view with node labels, tooltip on hover, zoom/refresh controls, and
  an error boundary so a WebGL failure shows the 2D map instead of crashing the studio.

### 9.18 `types/force-graph.d.ts`
Ambient TS declarations for `react-force-graph-3d` (no official types), so `import` type-checks.

---

## 10. API reference

All routes are mirrored under `/api/*` (and the raw paths) for convenience.

| Method | Path                                          | Purpose |
|--------|-----------------------------------------------|---------|
| GET    | `/`, `/api/health`                            | health + keys_configured + provider |
| POST   | `/api/validate-key`                           | test a Gemini key |
| POST   | `/api/upload`, `/api/ingest`                  | upload PDF → embed into Chroma |
| GET    | `/api/documents`                              | list uploaded PDFs |
| DELETE | `/api/documents/{filename}` (or POST `/api/delete`) | delete file + vectors |
| POST   | `/api/search`                                 | RAG answer to a query |
| POST   | `/api/chat`                                   | start async chat job → `{job_id}` |
| GET    | `/api/chat/status/{job_id}`                   | poll job: working/done/error |
| POST   | `/api/chat/stream`                            | SSE streaming chat (alt) |
| POST   | `/api/podcast`                                | Host/Expert script |
| POST   | `/api/debate`                                 | 3-agent debate transcript |
| POST   | `/api/vault` (+ `/api/vault/audit`)           | truth/bias audit |
| POST   | `/api/quiz`                                   | quiz questions `{count}` |
| POST   | `/api/flashcards`                             | flashcards |
| POST   | `/api/graph` (+ `/api/graph/extract`)         | knowledge-graph JSON |
| POST   | `/api/summary`                                | executive summary |
| POST   | `/api/tts`                                    | ElevenLabs audio (base64) |

Studio requests share `StudioRequest {fileId?, filename?, api_key?, count?}`; chat requests use
`{messages[], fileId?, filename?, api_key?}`; upload uses multipart `file` + optional `api_key`.

---

## 11. End-to-end: how chat works right now

1. User types "what does the resume say about my internship" → `handleSubmit`.
2. Frontend POSTs `/api/chat` `{messages:[…], fileId, api_key}`.
3. Backend resolves a Gemini key (user's, or round-robin) and immediately returns
   `{job_id}`; a daemon thread starts:
   - `_set_status("Searching your knowledge base...")`
   - `_build_chat_context` → `_should_retrieve` passes (real question, >2 words) →
     Chroma top-6 (filtered by filename) → context.
   - `_set_status("Synthesizing your answer (Gemini first)...")`
   - `_invoke_with_retry` → tries Gemini (with key rotation); on failure → Ollama
     `qwen3:1.7b` (`think:false`) if provider is `auto`.
   - job becomes `done` with `reply`.
4. Frontend polls `GET /api/chat/status/{job_id}` every 1.2 s, showing each backend status
   message in the status line under the input.
5. `done` → assistant bubble fills with the Markdown answer; the chat renders it.

Greetings skip step 3's retrieval entirely and get a friendly conversational reply.

---

## 12. Local Ollama setup (this machine)

- **Win**: Ollama v0.33.3 at `C:\Users\HP\AppData\Local\Programs\Ollama\ollama.exe`, daemon on
  `http://localhost:11434`.
- **Model**: `qwen3:1.7b` (≈1.1 GB on disk, ~8.1 tok/s). Bigger ones don't fit: this PC has
  **7.7 GB RAM total**; `qwen3:8b` OOMs and `qwen3:4b` thrashes.
- **Storage**: the model store was relocated to `E:\ollama\models` (8.46 GB) because C: was full
  — set via user-scope env `OLLAMA_MODELS=E:\ollama\models` in Windows registry. It takes effect
  for the tray app after the next login. For the current session, `ollama serve` must be started
  with `$env:OLLAMA_MODELS="E:\ollama\models"` (a detached `ollama serve` is currently running).
- **Why `think:false`**: qwen3's stock tag streams its inner monologue into the `thinking` field
  and only fills `response` at the end; `"think": false` in `/api/generate` makes it emit final
  tokens directly so streaming/polling shows real text.
- **RAM check**: `ollama ps` shows loaded models; if a larger model is stuck resident, unload it
  with `ollama stop <model>` (the backend also stops/kills a stuck `llama-server` if needed).

---

## 13. Configuration (.env)

```
GOOGLE_API_KEY=...            # single key (fallback when no pool)
GOOGLE_API_KEYS=k1,k2,k3,...  # the pool (rotated on rate limits)
LLM_PROVIDER=auto             # auto | gemini | ollama
OLLAMA_MODEL=qwen3:1.7b
ELEVENLABS_API_KEY=...        # optional; voice studio falls back to browser TTS
```

`auto` = Gemini first with Ollama fallback on any Gemini error; `ollama` = local only (useful for
testing without keys).

---

## 14. Deployment guide

The missing piece — decide where things run, then:

### Option A — Everything on one VPS/Render/Railway box
- Backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000`.
- Frontend: `cd frontend && npm install && npm run build && npm start`, with
  `NEXT_PUBLIC_API_URL` pointed at the backend's public URL.
- **Critical caveat**: a cloud box has no local Ollama (and no GPU). The `auto` provider needs at
  least one *working* Gemini key on the server, otherwise every request falls back to… nothing.
  So for prod either (a) supply a paid Gemini API key, or (b) deploy an Ollama container/sidecar
  (works on Render/Railway with enough RAM for qwen3:1.7b) and keep `LLM_PROVIDER=auto` so it
  answers even when the Gemini key is exhausted.

### Option B — Frontend on Vercel + backend on Render/Railway/Fly
- Vercel: the `app/api/[...path]/route.ts` proxy already forwards to `NEXT_PUBLIC_API_URL`; set
  that env var on Vercel to the hosted backend.
- Backend host: same caveat as above (Gemini key + optionally Ollama sidecar). Disable the CORS
  wildcard or restrict it to the Vercel domain. The in-memory chat job queue resets on every
  server redeploy/instance — acceptable for a demo; add Redis if you need persistence.

### Option C — Coolest demo: local preview via cloudflare tunnel
- `cloudflared tunnel --url http://localhost:8000` (backend) and another for the frontend, then
  share the links from this PC so Ollama stays local. Interesting but not "real" hosting.

Recommended next step: I'd ask you which platform you want, then I'll wire it up (Dockerfile +
`.env` guide + CI script), because a free cloud box can't run Ollama reliably and needs a working
Gemini key.

---

## 15. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Chat hangs at "Connecting..." | Backend down → start uvicorn; job timeout is 5 min on the client |
| "API quota exceeded" everywhere | All Gemini keys exhausted → `auto` is your friend (Ollama fallback). Check `/api/health` shows `provider: ollama` |
| Ollama "model not found" | Wrong `OLLAMA_MODEL` or model store env not applied; verify with `ollama list` |
| Extremely slow local answers | qwen3:1.7b on 7.7 GB RAM is compute-bound; use `think:false`, keep prompts short |
| Graph studio blank | Hard refresh (Ctrl+Shift+R); WebGL off → 2D `ConceptMap2D` fallback renders |
| Chat replies dump the document for "hi" | `_should_retrieve` gate handles greetings; confirm the backend is the new build (restart uvicorn) |
| Streaming vs polling mismatch | UI uses polling by design; `/api/chat/stream` is a separate opt-in SSE path |
| Chroma "collection already exists" style errors | Delete `chroma_db/` and re-upload the PDF |
| CORS errors in browser | `NEXT_PUBLIC_API_URL` must point at the real backend; CORS is `*` in dev |

---

## 16. Ideas for the next steps

1. **Deploy it** (see §14) — needs a platform decision + a live Gemini key.
2. **Persist chat jobs** (SQLite/Redis) so status survives restarts.
3. **Stream chat** from Ollama to the UI for true token-by-token UX while keeping the status line.
4. **Auth + per-user collections** (right now data is shared/global).
5. **Re-rank** retrieved chunks (Cohere/BBP-style rerank) for sharper grounding.
6. **Focus-mode prompt** tuning for the resume use-case specifically.
7. **Wire the NoteWave grid-item** on the resume to a live demo URL once deployed.