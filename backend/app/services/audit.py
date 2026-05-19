import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
AUDIT_FILE = DATA_DIR / "golden" / "audit_log.json"


def _load_logs() -> List[Dict[str, Any]]:
    if not AUDIT_FILE.exists():
        return []
    return json.loads(AUDIT_FILE.read_text(encoding="utf-8"))


def _save_logs(logs: List[Dict[str, Any]]) -> None:
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    AUDIT_FILE.write_text(json.dumps(logs, indent=2), encoding="utf-8")


def log_decision(entry: Dict[str, Any]) -> Dict[str, Any]:
    logs = _load_logs()
    enriched = {
        "timestamp": entry.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        "actor": entry.get("actor", "reviewer"),
        "action": entry.get("action", "unknown"),
        "details": entry.get("details", ""),
    }
    logs.append(enriched)
    _save_logs(logs)
    return enriched


def get_logs() -> List[Dict[str, Any]]:
    return _load_logs()
