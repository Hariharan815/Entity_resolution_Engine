import json
from pathlib import Path
from typing import Any, Dict, List

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
GOLDEN_DIR = DATA_DIR / "golden"
LAST_UPLOAD_JSON = UPLOADS_DIR / "last_upload.json"
RESULTS_JSON = GOLDEN_DIR / "results.json"


def ensure_dirs() -> None:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    GOLDEN_DIR.mkdir(parents=True, exist_ok=True)


def save_uploaded_rows(rows: List[Dict[str, Any]]) -> None:
    ensure_dirs()
    LAST_UPLOAD_JSON.write_text(json.dumps(rows, indent=2), encoding="utf-8")


def load_uploaded_rows() -> List[Dict[str, Any]]:
    if not LAST_UPLOAD_JSON.exists():
        return []
    return json.loads(LAST_UPLOAD_JSON.read_text(encoding="utf-8"))


def save_results(payload: Dict[str, Any]) -> None:
    ensure_dirs()
    RESULTS_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def load_results() -> Dict[str, Any]:
    if not RESULTS_JSON.exists():
        return {
            "golden_records": [],
            "duplicate_groups": [],
            "stats": {
                "original": 0,
                "golden": 0,
                "duplicates_found": 0,
                "accuracy": 0.0,
                "pending_review": 0,
                "sources": [],
            },
            "review_queue": [],
        }
    return json.loads(RESULTS_JSON.read_text(encoding="utf-8"))
