import os
from contextlib import contextmanager

import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "entity_resolution"),
        autocommit=False,
    )


@contextmanager
def get_cursor(conn):
    cursor = conn.cursor(dictionary=True)
    try:
        yield cursor
    finally:
        cursor.close()


def test_connection() -> bool:
    conn = None
    try:
        conn = get_connection()
        with get_cursor(conn) as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        print("MySQL connection successful")
        return True
    except Exception as exc:
        print(f"MySQL connection failed: {exc}")
        return False
    finally:
        if conn is not None:
            conn.close()
