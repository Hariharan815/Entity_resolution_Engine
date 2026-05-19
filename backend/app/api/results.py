from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from app.db.connection import get_connection
from app.db.service import get_duplicate_groups, get_golden_records, get_session_summary

router = APIRouter(tags=["results"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


@router.get("/results")
def get_results(upload_id: str = Query(...)) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        golden_records = get_golden_records(conn, upload_id)
        duplicate_groups = get_duplicate_groups(conn, upload_id)
        session = get_session_summary(conn, upload_id) or {}
        stats = session.get("summary", {})
        review_queue = [g for g in duplicate_groups if 0.5 <= float(g.get("confidence", 0.0)) <= 0.84]
        return {
            "golden_records": golden_records,
            "duplicate_groups": duplicate_groups,
            "stats": stats,
            "review_queue": review_queue,
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()
