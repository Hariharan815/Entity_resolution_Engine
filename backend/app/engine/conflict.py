from datetime import datetime
from typing import Any, Dict, Tuple


def _safe_dt(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return datetime.min


def resolve_conflict(left: Dict[str, Any], right: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    left_trust = float(left.get("trust", 0))
    right_trust = float(right.get("trust", 0))

    if left_trust > right_trust:
        return left, right
    if right_trust > left_trust:
        return right, left

    left_recent = _safe_dt(str(left.get("updated_at", "")))
    right_recent = _safe_dt(str(right.get("updated_at", "")))
    return (left, right) if left_recent >= right_recent else (right, left)
