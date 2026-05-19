from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from app.db.connection import get_connection
from app.db.service import delete_session_cascade, get_sessions_by_user

router = APIRouter(tags=["sessions"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


@router.get("/sessions")
def list_sessions(user_email: str = Query(...)) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        return {"sessions": get_sessions_by_user(conn, user_email)}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()


@router.delete("/sessions/{upload_id}")
def delete_session(upload_id: str) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        delete_session_cascade(conn, upload_id)

        return {"success": True, "upload_id": upload_id}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()
