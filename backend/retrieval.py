import chromadb
from pathlib import Path


# Get the backend folder automatically
BACKEND_DIR = Path(__file__).resolve().parent

# Chroma database location
CHROMA_PATH = BACKEND_DIR / "data" / "chroma_db"


# Connect to existing ChromaDB
client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)

print("CHROMA PATH:", CHROMA_PATH)
print("AVAILABLE COLLECTIONS:", client.list_collections())

collection = client.get_collection(
    name="medical_textbook"
)


def retrieve_textbook_context(query, n_results=5):
    """
    Search the medical textbook and return relevant
    textbook sections for the AI.
    """

    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    context_parts = []

    for document, metadata in zip(documents, metadatas):

        page = metadata.get("page", "Unknown")

        context_parts.append(
            f"[Textbook Page {page}]\n{document}"
        )

    return "\n\n".join(context_parts)


# Test this file directly
if __name__ == "__main__":

    query = """
    Cardiovascular health assessment:
    history taking, chest pain, cardiovascular symptoms,
    physical examination, inspection, palpation,
    percussion, auscultation, and normal and abnormal findings.
    """

    context = retrieve_textbook_context(
        query,
        n_results=5
    )

    print("\nRETRIEVED TEXTBOOK CONTEXT:\n")
    print(context)