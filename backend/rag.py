import json
from google import genai
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

DB_PATH = "./chroma_db"
MODEL_NAME = "gemini-3.6-flash"
EMBED_MODEL = "models/gemini-embedding-001"


def get_llm(api_key):
    return ChatGoogleGenerativeAI(
        model=MODEL_NAME,
        temperature=0.3,
        google_api_key=api_key,
        convert_system_message_to_human=True,
    )


def get_embeddings(api_key):
    return GoogleGenerativeAIEmbeddings(model=EMBED_MODEL, google_api_key=api_key)


def get_vector_db(api_key):
    return Chroma(persist_directory=DB_PATH, embedding_function=get_embeddings(api_key))


def _content_to_text(content):
    if isinstance(content, list):
        return "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in content)
    return content


def validate_api_key(api_key):
    try:
        client = genai.Client(api_key=api_key)
        client.models.get(model=MODEL_NAME)
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}


def process_pdf(file_path, api_key):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    if not documents:
        raise ValueError("Empty PDF")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    get_vector_db(api_key).add_documents(chunks)
    return len(chunks)


def analyze_full_document(file_path, api_key):
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    full_text = "\n".join([d.page_content for d in docs])[:50000]

    prompt = f"""
    Analyze the text below. Return ONLY raw JSON.
    Structure:
    {{
      "summary": "markdown summary with 5 bullet points",
      "flashcards": [
         {{"question": "Q1", "answer": "A1"}},
         {{"question": "Q2", "answer": "A2"}},
         {{"question": "Q3", "answer": "A3"}},
         {{"question": "Q4", "answer": "A4"}},
         {{"question": "Q5", "answer": "A5"}}
      ]
    }}

    Document Text:
    {full_text}
    """

    try:
        llm = get_llm(api_key)
        res = _content_to_text(llm.invoke(prompt).content)

        clean_json = res.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        return {
            "summary": f"Error generating summary: {str(e)}",
            "flashcards": [],
        }


def extract_graph(file_path, api_key):
    try:
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        full_text = "\n".join([d.page_content for d in docs])[:12000]

        prompt = f"""
        You are a Knowledge Graph Architect. Extract the most important concepts and their relationships from the text.
        Return ONLY raw JSON with this exact structure:
        {{"nodes": [{{"id": "n1", "name": "Label", "group": 1, "val": 10}}], "links": [{{"source": "n1", "target": "n2", "label": "Relation"}}]}}
        Groups: 1 = Main Concept, 2 = Supporting Detail, 3 = Technical Term, 4 = Person/Organization.
        Importance (val): 1-20 based on how central the concept is.
        Use distinct simple ids. Limit to 12-16 nodes for clarity.

        Document Text:
        {full_text}
        """

        llm = get_llm(api_key)
        res = _content_to_text(llm.invoke(prompt).content)

        clean_json = res.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        return {"nodes": data.get("nodes", []), "links": data.get("links", [])}
    except Exception as e:
        return {"nodes": [], "links": []}


def query_documents(query, api_key):
    try:
        results = get_vector_db(api_key).similarity_search(query, k=5)
        if not results:
            return "No info found in document."

        context = "\n---\n".join([doc.page_content for doc in results])
        synthesis_prompt = PromptTemplate.from_template(
            """
            Answer the question based ONLY on the context below.
            Context: {context}
            Question: {query}
            """
        )
        llm = get_llm(api_key)
        chain = synthesis_prompt | llm | StrOutputParser()
        return chain.invoke({"query": query, "context": context})
    except Exception as e:
        return f"Error: {str(e)}"