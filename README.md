# NoteWave | AI Research Copilot & Knowledge Hub

An AI-powered "Second Brain" and research ecosystem with a solid pitch-black design. Turns any PDF document into interactive research chats, audio-synced podcast deep-dives, 3D concept flashcards, agentic research debates, 3D knowledge graphs, adaptive quizzes, and bias integrity audits.

Powered by **Google Gemini 2.5 Flash**, **ChromaDB**, **Next.js 16 (Turbopack)**, and **FastAPI**.

---

## 🌟 The Intelligence Studios

NoteWave organizes research into specialized cognitive studios:

- **Conversational RAG Copilot**: Multi-turn chat with semantic source citing and context retrieval over ChromaDB.
- **🎙️ Podcast Studio**: Generates an engaging 2-host audio conversation between AI hosts ("Alex" & "Dr. Taylor"). Includes real-time equalizer wave visualizer, Web Speech playback, and script export.
- **🗂️ 3D Flashcards Studio**: AI-driven concept extraction with interactive 3D card flips, active recall mastery tracking, and Creator Mode for custom cards.
- **⚡ 3D Knowledge Graph**: Interactive 3D Force-Directed Graph (`react-force-graph-3d`) visualizing relationships between core concepts.
- **⚔️ Agentic Debate**: Multi-persona research arena where **Dr. Skeptic** (Critic), **The Weaver** (Synthesizer), and **Veritas** (Fact-Checker) debate the core thesis of your documents.
- **🛡️ Verified Vault**: Integrity auditor that calculates Truth Score %, Bias Index %, provenance signature, and detects unsupported claims or hallucinations.
- **🧠 Adaptive Quiz Studio**: Generates custom multiple-choice assessments with real-time grading, conceptual difficulty tagging, and mastery reports.
- **🎙️ Voice Immersion**: Real-time microphone listening with audio waveform aura and hands-free document query.
- **📖 Executive Summary**: Structured 5-point executive synthesis and takeaway extraction.
- **⌨️ Command Orchestration**: Global `/` command palette with keyboard navigation (`↑`, `↓`, `Enter`) for instant studio launching.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide Icons, Radix UI Primitives, React Force Graph 3D
- **Backend**: FastAPI, LangChain, ChromaDB, Google GenAI SDK
- **LLM**: Google Gemini 2.5 Flash
- **Embeddings**: Google Gemini Embedding (`models/gemini-embedding-001`, 768-dim)
- **Vector Store**: ChromaDB (local, persistent)

---

## 🚀 Getting Started

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

FastAPI will start on `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

### 2. Frontend (Next.js)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend will run on `http://localhost:3000`.

---

## 🐳 Docker Compose

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 📁 Project Structure

```bash
ai-knowledge-hub/
├── backend/
│   ├── main.py          # FastAPI endpoints (chat, ingest, podcast, debate, quiz, vault, graph)
│   ├── rag.py           # Gemini 2.5 Flash RAG engine + ChromaDB vector storage
│   ├── documents/       # Uploaded PDF document store
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css   # Pitch-black aesthetic & markdown styling
│   │   │   ├── layout.tsx    # Root metadata and theme provider
│   │   │   └── page.tsx      # Dual-mode (Landing + 3-Column Dashboard)
│   │   ├── components/
│   │   │   ├── dashboard/    # SidebarLeft, SidebarRight, CommandPalette
│   │   │   │   └── studios/  # Podcast, Flashcards, Graph, Debate, Vault, Quiz, Voice, Summary, Settings
│   │   │   ├── landing/      # Drag & Drop Landing page
│   │   │   └── ui/           # Radix & Tailwind UI primitives
│   │   └── lib/              # Commands and research agent definitions
│   ├── next.config.ts        # API rewrites proxying /api to FastAPI
│   └── package.json
└── README.md
```

---

## 📄 License

MIT