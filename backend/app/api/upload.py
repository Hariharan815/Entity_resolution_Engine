import csv
import uuid
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.db.connection import get_connection
from app.db.service import insert_records_bulk, insert_session

router = APIRouter(tags=["upload"])
upload_registry: Dict[str, List[str]] = {}
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


@router.post("/upload")
async def upload_csv(files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    upload_id = f"up_{uuid.uuid4().hex[:10]}"
    upload_dir = Path(__file__).resolve().parents[2] / "data" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    all_rows: List[Dict[str, Any]] = []
    saved_paths: List[str] = []
    filenames: List[str] = []
    total_rows = 0

    for file in files:
        filename = file.filename or "uploaded.csv"
        if not filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail=f"Invalid file type for {filename}. Only CSV allowed.")

        content = (await file.read()).decode("utf-8", errors="ignore")
        target = upload_dir / f"{upload_id}_{filename}"
        target.write_text(content, encoding="utf-8")

        reader = csv.DictReader(StringIO(content))
        rows = [dict(row) for row in reader]
        for row in rows:
            row["source"] = filename
        total_rows += len(rows)
        all_rows.extend(rows)
        saved_paths.append(str(target))
        filenames.append(filename)

    upload_registry[upload_id] = saved_paths

    conn = None
    try:
        conn = get_connection()
        insert_session(
            conn,
            upload_id=upload_id,
            user_email=None,
            name=(filenames[0] if len(filenames) == 1 else f"{filenames[0]} + {len(filenames) - 1} more"),
            file_count=len(files),
            filenames=filenames,
        )
        if all_rows:
            df = pd.DataFrame(all_rows)
            df.columns = [str(c).strip().lower() for c in df.columns]
            insert_records_bulk(conn, upload_id, df)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()

    return {
        "upload_id": upload_id,
        "file_count": len(files),
        "filenames": filenames,
        "total_rows": total_rows,
    }
