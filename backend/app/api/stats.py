from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from app.db.connection import get_connection
from app.db.service import get_audit_log, get_duplicate_groups, get_session_summary

router = APIRouter(tags=["stats"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


@router.get("/stats")
def fetch_stats(upload_id: str = Query(...)) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        session = get_session_summary(conn, upload_id) or {}
        stats = session.get("summary", {})
        groups = get_duplicate_groups(conn, upload_id)
        conflicts = len([g for g in groups if g.get("status") == "pending"])
        return {
            "totalRecords": stats.get("original", 0),
            "accuracy": stats.get("accuracy", 0.0),
            "duplicates": stats.get("duplicates_found", 0),
            "conflicts": conflicts,
            "sources": stats.get("sources", []),
            "decisions": len(get_audit_log(conn, upload_id)),
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()
