import os
import shutil
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag import (
    analyze_full_document,
    chat_with_context,
    delete_document_data,
    generate_debate,
    generate_flashcards,
    generate_graph,
    generate_podcast_script,
    generate_quiz,
    generate_vault_audit,
    process_pdf,
    query_documents,
    validate_api_key,
)

DEFAULT_API_KEY = os.getenv("GOOGLE_API_KEY", "")

app = FastAPI(title="NoteWave + AI Knowledge Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "documents"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def resolve_api_key(api_key: Optional[str]) -> str:
    key = (api_key or "").strip()
    if key:
        return key
    if DEFAULT_API_KEY:
        return DEFAULT_API_KEY
    raise HTTPException(status_code=401, detail="Missing API Key. Please provide your Google Gemini API key.")


@app.get("/")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "NoteWave Knowledge Hub"}


# --- REQUEST MODELS ---
class KeyValidationRequest(BaseModel):
    api_key: str


class SearchQuery(BaseModel):
    query: str
    api_key: Optional[str] = None
    filename: Optional[str] = None


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    api_key: Optional[str] = None
    fileId: Optional[str] = None
    filename: Optional[str] = None


class StudioRequest(BaseModel):
    fileId: Optional[str] = None
    filename: Optional[str] = None
    api_key: Optional[str] = None
    count: Optional[int] = 5


# --- KEY VALIDATION ---
@app.post("/validate-key")
@app.post("/api/validate-key")
def validate_key_endpoint(request: KeyValidationRequest):
    result = validate_api_key(request.api_key)
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=result.get("error", "Invalid API Key."))
    return {"status": "Connected"}


# --- UPLOAD & INGEST ---
@app.post("/upload")
@app.post("/api/upload")
@app.post("/api/ingest")
async def upload_document(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    resolved_key = resolve_api_key(api_key)
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        num_chunks = process_pdf(file_path, resolved_key)
        analysis_result = analyze_full_document(file_path, resolved_key)

        return {
            "success": True,
            "filename": file.filename,
            "name": file.filename,
            "status": "Processed",
            "chunks": num_chunks,
            "summary": analysis_result.get("summary", "Summary completed."),
            "flashcards": analysis_result.get("flashcards", []),
            "graph": analysis_result.get("graph", {"nodes": [], "links": []}),
        }

    except Exception as e:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


# --- DOCUMENTS MANAGEMENT ---
@app.get("/documents")
@app.get("/api/documents")
def list_documents():
    docs = []
    if os.path.exists(UPLOAD_FOLDER):
        for f in os.listdir(UPLOAD_FOLDER):
            if f.lower().endswith(".pdf"):
                fp = os.path.join(UPLOAD_FOLDER, f)
                stat = os.stat(fp)
                docs.append({
                    "id": int(stat.st_mtime * 1000),
                    "name": f,
                    "filename": f,
                    "size": stat.st_size,
                    "date": "Uploaded",
                    "mastery": 85,
                })
    return {"documents": docs}


@app.delete("/documents/{filename}")
@app.delete("/api/documents/{filename}")
@app.post("/api/delete")
def delete_document_endpoint(filename: Optional[str] = None, request: Optional[StudioRequest] = None):
    target = filename
    if not target and request:
        target = request.fileId or request.filename
    if not target:
        raise HTTPException(status_code=400, detail="Filename required.")

    delete_document_data(target)
    return {"success": True, "deleted": target}


# --- SEARCH & CHAT ---
@app.post("/search")
@app.post("/api/search")
def search_knowledge_base(request: SearchQuery):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.filename
    answer = query_documents(request.query, resolved_key, filename=target_file)
    return {"results": [answer]}


@app.post("/chat")
@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename
    reply = chat_with_context(request.messages, resolved_key, filename=target_file)
    return {"role": "assistant", "content": reply, "text": reply}


# --- STUDIOS ---
@app.post("/podcast")
@app.post("/api/podcast")
def podcast_endpoint(request: StudioRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename or ""
    script = generate_podcast_script(target_file, resolved_key)
    return {"script": script}


@app.post("/debate")
@app.post("/api/debate")
def debate_endpoint(request: StudioRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename or ""
    transcript = generate_debate(target_file, resolved_key)
    return {"transcript": transcript}


@app.post("/vault")
@app.post("/api/vault")
@app.post("/api/vault/audit")
def vault_endpoint(request: StudioRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename or ""
    audit = generate_vault_audit(target_file, resolved_key)
    return audit


@app.post("/quiz")
@app.post("/api/quiz")
def quiz_endpoint(request: StudioRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename or ""
    questions = generate_quiz(target_file, resolved_key, count=request.count or 5)
    return {"questions": questions}


@app.post("/flashcards")
@app.post("/api/flashcards")
def flashcards_endpoint(request: StudioRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename or ""
    cards = generate_flashcards(target_file, resolved_key)
    return {"flashcards": cards}


@app.post("/graph")
@app.post("/api/graph")
@app.post("/api/graph/extract")
def graph_endpoint(request: StudioRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename or ""
    graph_data = generate_graph(target_file, resolved_key)
    return graph_data


@app.post("/summary")
@app.post("/api/summary")
def summary_endpoint(request: StudioRequest):
    resolved_key = resolve_api_key(request.api_key)
    target_file = request.fileId or request.filename or ""
    analysis = analyze_full_document(target_file, resolved_key)
    return {"summary": analysis.get("summary", "")}