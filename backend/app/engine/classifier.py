from typing import Any, Dict

from app.ml.predict import predict_match


def classify_pair(left: Dict[str, Any], right: Dict[str, Any]) -> Dict[str, Any]:
    score = predict_match(left, right)
    label = "duplicate" if score >= 0.8 else "possible" if score >= 0.6 else "distinct"
    return {"score": score, "label": label}
