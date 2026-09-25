import fitz
from pathlib import Path

# Backend folder
BACKEND_DIR = Path(__file__).resolve().parent

# File paths
pdf_path = BACKEND_DIR / "data" / "textbook" / "Medical book.pdf"
output_path = BACKEND_DIR / "data" / "textbook" / "medical_book_text.txt"

doc = fitz.open(pdf_path)

with open(output_path, "w", encoding="utf-8") as output_file:

    for page_number, page in enumerate(doc):

        text = page.get_text()

        output_file.write(
            f"\n--- PAGE {page_number + 1} ---\n"
        )

        output_file.write(text)

doc.close()

print("Text extraction complete!")
print(f"Saved to: {output_path}")