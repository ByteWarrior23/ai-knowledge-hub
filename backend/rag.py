import json
from google import genai
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

DB_PATH = "./chroma_db"
MODEL_NAME = "gemini-3.6-flash"

embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_db = Chroma(persist_directory=DB_PATH, embedding_function=embedding_function)


def get_llm(api_key):
    return ChatGoogleGenerativeAI(
        model=MODEL_NAME,
        temperature=0.3,
        google_api_key=api_key,
        convert_system_message_to_human=True,
    )


def validate_api_key(api_key):
    try:
        client = genai.Client(api_key=api_key)
        client.models.get(model=MODEL_NAME)
        return {"valid": True}
    except Exception as e:
        return {"valid": False, "error": str(e)}


def process_pdf(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    if not documents:
        raise ValueError("Empty PDF")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    vector_db.add_documents(chunks)
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
        res = llm.invoke(prompt).content
        if isinstance(res, list):
            res = "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in res)

        clean_json = res.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        return {
            "summary": f"Error generating summary: {str(e)}",
            "flashcards": [],
        }


def query_documents(query, api_key):
    try:
        results = vector_db.similarity_search(query, k=5)
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