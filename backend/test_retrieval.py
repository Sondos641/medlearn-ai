import chromadb

client = chromadb.PersistentClient(path="backend/data/chroma_db")

collection = client.get_collection(
    name="medical_textbook"
)

question = "What are the normal findings when assessing the abdomen?"

results = collection.query(
    query_texts=[question],
    n_results=5
)

print("\nSEARCH RESULTS:\n")

for i in range(len(results["documents"][0])):
    print(f"--- RESULT {i + 1} ---")
    print("Page:", results["metadatas"][0][i]["page"])
    print("Text:")
    print(results["documents"][0][i][:1000])
    print()