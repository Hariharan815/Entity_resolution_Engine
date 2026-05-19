from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.db.connection import get_connection
from app.db.service import insert_feedback
from app.models.schemas import FeedbackRequest

router = APIRouter(tags=["feedback"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


@router.post("/feedback")
def submit_feedback(payload: FeedbackRequest) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        insert_feedback(
            conn,
            group_id=payload.group_id,
            upload_id=payload.upload_id,
            decision=payload.decision,
            notes=payload.notes,
            reviewer=payload.reviewer,
        )
        return {
            "success": True,
            "group_id": payload.group_id,
            "decision": payload.decision,
            "message": "Feedback recorded. Model will retrain on next session.",
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()
