import chromadb
import re

input_path = "data/textbook/medical_book_chunks.txt"

client = chromadb.PersistentClient(path="data/chroma_db")

collection = client.get_or_create_collection(
    name="medical_textbook"
)

with open(input_path, "r", encoding="utf-8") as file:
    text = file.read()

parts = re.split(r"--- PAGE (\d+) ---", text)

ids = []
documents = []
metadatas = []

for i in range(1, len(parts), 2):
    page_number = parts[i]
    page_text = parts[i + 1].strip()

    if page_text:
        ids.append(f"page_{page_number}")
        documents.append(page_text)
        metadatas.append({
            "source": "Medical book.pdf",
            "page": int(page_number)
        })

collection.add(
    ids=ids,
    documents=documents,
    metadatas=metadatas
)

print("Database creation complete!")
print("Documents stored:", collection.count())