import csv
from io import BytesIO, StringIO
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from openpyxl import Workbook

from app.db.connection import get_connection
from app.db.service import get_golden_records

router = APIRouter(tags=["export"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"
CLUSTERED_CSV_PATH = Path(__file__).resolve().parents[2] / "output" / "clustered_dataset.csv"


def _clean_records(conn, upload_id: str) -> List[Dict[str, Any]]:
    rows = get_golden_records(conn, upload_id)
    cleaned = []
    for row in rows:
        payload = row.get("raw_data") or {}
        if payload:
            cleaned.append(payload)
        else:
            cleaned.append(row)
    return cleaned


@router.get("/export")
def export_results(upload_id: str = Query(...), fmt: str = Query("csv", pattern="^(csv|xlsx)$")):
    conn = None
    try:
        conn = get_connection()
        rows = _clean_records(conn, upload_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()

    headers = list(rows[0].keys()) if rows else []

    if fmt == "xlsx":
        wb = Workbook()
        ws = wb.active
        ws.title = "results"

        if headers:
            ws.append(headers)
            for row in rows:
                ws.append([row.get(h, "") for h in headers])

        stream = BytesIO()
        wb.save(stream)
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=results.xlsx"},
        )

    csv_stream = StringIO()
    writer = csv.DictWriter(csv_stream, fieldnames=headers)
    if headers:
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    byte_stream = BytesIO(csv_stream.getvalue().encode("utf-8"))
    return StreamingResponse(
        byte_stream,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )


@router.get("/export/clustered")
def export_clustered_dataset():
    if not CLUSTERED_CSV_PATH.exists():
        raise HTTPException(status_code=404, detail="clustered_dataset.csv not found. Run pipeline first.")

    return FileResponse(
        path=CLUSTERED_CSV_PATH,
        media_type="text/csv",
        filename="clustered_dataset.csv",
    )
