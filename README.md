# AI Knowledge Hub

Retrieval-Augmented Generation (RAG) platform that turns PDF documents into summaries, study flashcards, and a context-aware Q&A chat.

## Features

- PDF ingestion with chunking and vector embeddings
- 5-point executive summary generation
- AI-generated study flashcards
- Semantic search over the document content
- Bring-your-own-key: the Google Gemini API key is used per request and never stored

## Tech Stack

- Frontend: Next.js, Tailwind CSS, Framer Motion
- Backend: FastAPI, LangChain, ChromaDB
- LLM: Google Gemini 2.5 Flash
- Vector Store: ChromaDB (local, persistent)
- Orchestration: Docker Compose

## Prerequisites

- Docker Desktop
- Google Gemini API key (https://aistudio.google.com/apikey)

## Getting Started

```bash
git clone <your-repo-url>
cd ai-knowledge-hub
```

Set your API key:

```bash
export GOOGLE_API_KEY=your_key_here
```

Run the full stack:

```bash
docker compose up --build
```

Open:
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

## Run Without Docker

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## How It Works

1. User uploads a PDF and provides a Gemini API key.
2. The backend parses the PDF, splits it into chunks, and stores embeddings in ChromaDB.
3. Gemini generates a summary and flashcards from the full document.
4. Chat queries run similarity search against ChromaDB and pass the retrieved context to Gemini for grounded answers.

## Project Structure

```bash
ai-knowledge-hub/
|-- backend/
|   |-- Dockerfile
|   |-- main.py
|   |-- rag.py
|   `-- requirements.txt
|-- frontend/
|   |-- Dockerfile
|   `-- src/
|       |-- app/
|       |-- components/
|       `-- lib/
|-- docker-compose.yml
`-- README.md
```

## License

MIT