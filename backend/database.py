
import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "data" / "medlearn.db"


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS practice_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT,
                session_data TEXT NOT NULL,
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
