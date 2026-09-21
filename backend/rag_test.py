import os
import chromadb
from dotenv import load_dotenv
from groq import Groq

# Load API key from .env
load_dotenv()

# Connect to ChromaDB
client = chromadb.PersistentClient(path="data/chroma_db")

collection = client.get_collection(
    name="medical_textbook"
)

# Connect to Groq
groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# The student's question
question = "What are the normal findings when assessing the abdomen?"

# Search the textbook
results = collection.query(
    query_texts=[question],
    n_results=5
)

# Combine the retrieved textbook pages
context = ""

for i in range(len(results["documents"][0])):
    page = results["metadatas"][0][i]["page"]
    text = results["documents"][0][i]

    context += f"\n--- TEXTBOOK PAGE {page} ---\n{text}\n"

# Ask Groq to answer using only the textbook information
prompt = f"""
You are MedLearn AI, a medical learning assistant.

Answer the student's question using ONLY the textbook information provided below.

If the answer cannot be found in the provided textbook information, say:
"I couldn't find this information in the provided textbook."

Do not use outside medical knowledge.

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

print("\n===== MEDLEARN AI ANSWER =====\n")
print(answer)

print("\n===== SOURCES =====\n")

for i in range(len(results["documents"][0])):
    page = results["metadatas"][0][i]["page"]
    print(f"Textbook page: {page}")