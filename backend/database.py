
import sqlite3
import json
import uuid
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = Path(__file__).resolve().parent / "data" / "medlearn.db"


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
                # Add faculty_id to existing users table if it does not exist
        user_columns = [
            row[1]
            for row in conn.execute(
                "PRAGMA table_info(users)"
            ).fetchall()
        ]

        if "faculty_id" not in user_columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN faculty_id TEXT"
            )
        conn.execute("""
            CREATE TABLE IF NOT EXISTS practice_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT,
                session_data TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS learning_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                message_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)


        # Add user_id to existing databases if it does not exist
        columns = [
            row[1]
            for row in conn.execute(
                "PRAGMA table_info(practice_sessions)"
            ).fetchall()
        ]

        if "user_id" not in columns:
            conn.execute(
                "ALTER TABLE practice_sessions ADD COLUMN user_id TEXT"
            )


def save_session(session_id, session):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO practice_sessions (
                session_id,
                user_id,
                session_data
            )
            VALUES (?, ?, ?)
            ON CONFLICT(session_id)
            DO UPDATE SET
                user_id = excluded.user_id,
                session_data = excluded.session_data,
                updated_at = CURRENT_TIMESTAMP
        """, (
            session_id,
            session.get("user_id"),
            json.dumps(session, ensure_ascii=False)
        ))


def load_sessions():
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute("""
            SELECT session_id, session_data
            FROM practice_sessions
        """).fetchall()

    return {
        session_id: json.loads(session_data)
        for session_id, session_data in rows
    }

def create_learning_session(session_id, user_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT OR IGNORE INTO learning_sessions (session_id, user_id)
            VALUES (?, ?)
        """, (session_id, user_id)) 


def update_learning_session(session_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            UPDATE learning_sessions
            SET message_count = message_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_id = ?
        """, (session_id,))

def register_user(name, email, password):
    user_id = str(uuid.uuid4())
    password_hash = generate_password_hash(password)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO users (id, name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, name, email, password_hash, "student"))

    return {
        "id": user_id,
        "name": name,
        "email": email,
        "role": "student"
    }


def get_user_by_email(email):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row

        user = conn.execute("""
            SELECT * FROM users
            WHERE email = ?
        """, (email,)).fetchone()

    return dict(user) if user else None


def verify_password(password, password_hash):
    return check_password_hash(password_hash, password)
    
