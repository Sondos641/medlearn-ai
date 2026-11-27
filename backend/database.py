
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
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                title TEXT DEFAULT 'New Conversation'
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS learning_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id)
                    REFERENCES learning_sessions(session_id),
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
            )
        """)

         # Add title to existing learning sessions if it does not exist
        columns = [
            row[1]
            for row in conn.execute(
                "PRAGMA table_info(learning_sessions)"
            ).fetchall()
        ]

        if "title" not in columns:
            conn.execute(
                "ALTER TABLE learning_sessions ADD COLUMN title TEXT DEFAULT 'New Conversation'"
            )


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

def update_learning_session_title(session_id, title):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            UPDATE learning_sessions
            SET title = ?
            WHERE session_id = ?
              AND (title IS NULL OR title = 'New Conversation')
        """, (title, session_id))       

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

def save_learning_message(session_id, user_id, role, content):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            INSERT INTO learning_messages (
                session_id,
                user_id,
                role,
                content
            )
            VALUES (?, ?, ?, ?)
        """, (session_id, user_id, role, content))
    
def get_learning_sessions(user_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row

        rows = conn.execute("""
            SELECT session_id, title, message_count, created_at, updated_at
            FROM learning_sessions
            WHERE user_id = ?
            ORDER BY updated_at DESC
        """, (user_id,)).fetchall()

    return [dict(row) for row in rows]
 
def get_learning_messages(session_id, user_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row

        rows = conn.execute("""
            SELECT id, role, content, created_at
            FROM learning_messages
            WHERE session_id = ? AND user_id = ?
            ORDER BY id ASC
        """, (session_id, user_id)).fetchall()

    return [dict(row) for row in rows]
    