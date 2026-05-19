from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from app.db.connection import get_connection
from app.db.service import get_audit_log

router = APIRouter(tags=["audit"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


@router.get("/audit")
def fetch_audit(upload_id: str = Query(...)) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        return {"entries": get_audit_log(conn, upload_id)}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()
