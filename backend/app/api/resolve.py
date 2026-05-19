from typing import Any, Dict, List

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.api.upload import upload_registry
from app.db.connection import get_connection
from app.db.service import (
    insert_duplicate_groups,
    insert_golden_records,
    update_session_status,
)
from app.engine.pipeline import merge_dataframes
from app.ml.predict import run_prediction
from app.models.schemas import ResolveRequest

router = APIRouter(tags=["resolve"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


@router.post("/resolve")
def resolve_records(payload: ResolveRequest) -> Dict[str, Any]:
    upload_id = payload.upload_id
    if not upload_id:
        raise HTTPException(status_code=400, detail="upload_id is required")

    file_paths = upload_registry.get(upload_id, [])
    if not file_paths:
        raise HTTPException(status_code=404, detail="No uploaded files found for upload_id")

    df = merge_dataframes(file_paths)
    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded files are empty")

    df.columns = [str(c).strip().lower() for c in df.columns]
    columns = list(df.columns)

    name_col = next((c for c in columns if "name" in c), None)
    address_col = next((c for c in columns if "address" in c), None)
    phone_col = next((c for c in columns if "phone" in c), None)
    city_col = next((c for c in columns if "city" in c), None)
    email_col = next((c for c in columns if "email" in c), None)
    cols = (name_col, address_col, phone_col, city_col, email_col)

    conn = None
    duplicate_groups = run_prediction(df, cols)
    golden_records: List[Dict[str, Any]] = []

    for group in duplicate_groups:
        group_records = group.get("records", [])
        if not group_records:
            continue

        row_indices = [int(item.get("row_index", -1)) for item in group_records if item.get("row_index", -1) >= 0]
        if not row_indices:
            continue

        records = df.iloc[row_indices]
        golden = {}
        for col in df.columns:
            non_null = records[col].dropna()
            if non_null.empty:
                golden[col] = None
                continue
            mode_values = non_null.mode(dropna=True)
            golden[col] = mode_values.iloc[0] if not mode_values.empty else non_null.iloc[0]

        source_files = sorted({str(src) for src in records.get("source", pd.Series(dtype=str)).dropna().tolist()})
        score_values = [float(item.get("score", 0.0)) for item in group_records]
        confidence = round(sum(score_values) / max(len(score_values), 1), 4)
        duplicate_count = max(len(group_records) - 1, 0)

        golden["source_files"] = ", ".join(source_files)
        golden["confidence"] = confidence
        golden["duplicate_count"] = duplicate_count
        golden_records.append(golden)

    sources = sorted({str(s) for s in df.get("source", pd.Series(dtype=str)).dropna().tolist()})
    duplicates_found = max(len(df) - len(golden_records), 0)
    pending_review = len([g for g in duplicate_groups if 0.5 <= float(g.get("confidence", 0.0)) <= 0.84])
    accuracy = round(len(golden_records) / max(len(df), 1), 4)

    result = {
        "golden_records": golden_records,
        "duplicate_groups": duplicate_groups,
        "stats": {
            "original": int(len(df)),
            "golden": int(len(golden_records)),
            "duplicates_found": int(duplicates_found),
            "accuracy": accuracy,
            "pending_review": pending_review,
            "sources": sources,
        },
        "review_queue": [g for g in duplicate_groups if 0.5 <= float(g.get("confidence", 0.0)) <= 0.84],
    }

    try:
        conn = get_connection()
        update_session_status(conn, upload_id, "resolving")
        insert_golden_records(conn, upload_id, golden_records)
        insert_duplicate_groups(conn, upload_id, duplicate_groups)
        update_session_status(conn, upload_id, "complete", summary=result["stats"])
    except Exception as exc:
        if conn is not None:
            try:
                update_session_status(conn, upload_id, "failed")
            except Exception:
                pass
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()

    return result
