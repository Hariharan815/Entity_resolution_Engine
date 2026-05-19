from typing import Any, Dict, Iterable


def build_golden_record(records: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    best_conf = 0.0

    for record in records:
        for key, value in record.items():
            if value not in (None, "") and key not in result:
                result[key] = value
        best_conf = max(best_conf, float(record.get("confidence", 0) or 0))

    result["confidence"] = best_conf
    return result
