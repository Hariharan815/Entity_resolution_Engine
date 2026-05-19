from difflib import SequenceMatcher
from typing import Any, Dict

from app.utils.normalise import clean_address, clean_name, clean_phone


def _sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def score_pair(left: Dict[str, Any], right: Dict[str, Any]) -> float:
    name_score = _sim(clean_name(str(left.get("name", ""))), clean_name(str(right.get("name", ""))))
    addr_score = _sim(
        clean_address(str(left.get("address", ""))),
        clean_address(str(right.get("address", ""))),
    )
    phone_score = _sim(clean_phone(str(left.get("phone", ""))), clean_phone(str(right.get("phone", ""))))
    return (0.5 * name_score) + (0.3 * addr_score) + (0.2 * phone_score)
