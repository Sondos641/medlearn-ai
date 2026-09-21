
import os
import chromadb
from dotenv import load_dotenv
from groq import Groq
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from .env
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Connect to ChromaDB
client = chromadb.PersistentClient(path="data/chroma_db")

collection = client.get_collection(
    name="medical_textbook"
)

# Connect to Groq
groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


# Request format
class QuestionRequest(BaseModel):
    question: str


# Basic test endpoint
@app.get("/")
def home():
    return {"message": "MedLearn AI backend is running!"}


# RAG question endpoint
@app.post("/ask")
def ask_question(request: QuestionRequest):

    question = request.question

    # Search the textbook
    results = collection.query(
        query_texts=[question],
        n_results=5
    )

    # Combine retrieved textbook pages
    context = ""

    for i in range(len(results["documents"][0])):
        page = results["metadatas"][0][i]["page"]
        text = results["documents"][0][i]

        context += f"\n--- TEXTBOOK PAGE {page} ---\n{text}\n"

    # Ask Groq using only the retrieved textbook information
    prompt = f"""
You are MedLearn AI, a medical learning assistant.

Your job is to answer the student's question using ONLY the textbook information provided below.

STRICT RULES:
1. Use only information explicitly supported by the provided textbook context.
2. Do not add medical knowledge from your own knowledge.
3. Do not make assumptions or fill in missing information.
4. If the textbook context does not contain enough information to answer the question, say:
"I couldn't find this information in the provided textbook."
5. Do not use information from outside the textbook.
6. Keep the answer clear and appropriate for medical students.
7. When possible, mention the textbook page number that supports the information.

Student question:
{question}

Textbook information:
{context}
"""

    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response.choices[0].message.content

    # Return answer and sources to the frontend
    sources = []

    for i in range(len(results["documents"][0])):
        page = results["metadatas"][0][i]["page"]

        sources.append({
            "page": page,
            "source": "Medical book.pdf"
        })

    return {
        "question": question,
        "answer": answer,
        "sources": sources
    }
