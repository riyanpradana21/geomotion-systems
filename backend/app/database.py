import sqlite3
import os
from contextlib import contextmanager

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "geometry_learning.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Shapes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shapes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                dimension TEXT NOT NULL,
                description TEXT NOT NULL,
                properties TEXT NOT NULL,
                tips TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                icon_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Lessons table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                shape_id TEXT NOT NULL,
                title TEXT NOT NULL,
                dimension TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                estimated_minutes INTEGER NOT NULL,
                instructions TEXT NOT NULL,
                steps TEXT NOT NULL,
                fun_fact TEXT NOT NULL,
                criteria TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE CASCADE
            );
        """)

        # Learning History table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learning_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shape_name TEXT NOT NULL,
                recognized_shape TEXT NOT NULL,
                similarity_score REAL NOT NULL,
                status TEXT NOT NULL,
                characteristics TEXT NOT NULL,
                feedback TEXT NOT NULL,
                duration_seconds INTEGER DEFAULT 0,
                thumbnail_data TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
