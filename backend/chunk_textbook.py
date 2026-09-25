import re
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent

input_path = (
    BACKEND_DIR
    / "data"
    / "textbook"
    / "medical_book_text.txt"
)

output_path = (
    BACKEND_DIR
    / "data"
    / "textbook"
    / "medical_book_chunks.txt"
)

with open(input_path, "r", encoding="utf-8") as file:
    text = file.read()

pages = re.split(r"--- PAGE (\d+) ---", text)

chunks = []

for i in range(1, len(pages), 2):
    page_number = pages[i]
    page_text = pages[i + 1].strip()

    if page_text:
        chunks.append(
            f"--- PAGE {page_number} ---\n"
            f"{page_text}\n"
        )

with open(output_path, "w", encoding="utf-8") as file:
    file.write("\n".join(chunks))

print("Chunking complete!")
print(f"Created {len(chunks)} page-based chunks.")
print(f"Saved to: {output_path}")