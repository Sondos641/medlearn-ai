
import sqlite3
import uuid

from werkzeug.security import generate_password_hash
from database import DB_PATH, init_db

TEMP_PASSWORD = "Faculty@2026"

faculty_members = [
    ("Dr. Zainab", "zainab@uob.edu.bh"),
    ("Dr. Sondos", "sondos@uob.edu.bh"),
    ("Dr. Marwan", "marwan@uob.edu.bh"),
    ("Dr. Riadh", "riadh@uob.edu.bh"),
]

init_db()

with sqlite3.connect(DB_PATH) as conn:
    for name, email in faculty_members:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if existing:
            print(f"Already exists: {email}")
            continue

        conn.execute("""
            INSERT INTO users (id, name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()),
            name,
            email,
            generate_password_hash(TEMP_PASSWORD),
            "faculty"
        ))

        print(f"Created: {name} - {email}")

print("\nFaculty dataset setup completed.")
