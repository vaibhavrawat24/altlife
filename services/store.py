import sqlite3
import json
import uuid
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "shares.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS shares (
            id   TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    return conn


def save_share(data: dict) -> str:
    share_id = uuid.uuid4().hex[:10]
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO shares (id, data) VALUES (?, ?)",
            (share_id, json.dumps(data))
        )
    return share_id


def get_share(share_id: str) -> dict | None:
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT data FROM shares WHERE id = ?", (share_id,)
        ).fetchone()
    return json.loads(row[0]) if row else None
