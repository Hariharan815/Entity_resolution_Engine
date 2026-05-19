from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors

from app.engine.scorer import score_pair
from app.ml.features import build_features
from app.ml.threshold import apply_threshold

MODEL_FILE = Path(__file__).parent.parent.parent / "data" / "models" / "model.pkl"
FEATURE_NAMES = [
    "name_similarity",
    "address_similarity",
    "phone_match",
    "city_match",
    "email_match",
    "email_domain_match",
]


def predict_match(left: Dict[str, Any], right: Dict[str, Any]) -> float:
    return float(round(score_pair(left, right), 4))


def _row_payload(df: pd.DataFrame, idx: int, score: float) -> Dict[str, Any]:
    payload = df.iloc[idx].to_dict()
    payload["row_index"] = int(idx)
    payload["score"] = float(round(score, 4))
    return payload


def run_prediction(df: pd.DataFrame, cols: Tuple[str, ...]):
    if not MODEL_FILE.exists():
        raise FileNotFoundError("Model not found. Run ml/train.py first.")

    rf, xgb = joblib.load(MODEL_FILE)

    embeddings = None
    try:
        from sentence_transformers import SentenceTransformer
        embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        text_data = df.fillna("").astype(str).agg(" ".join, axis=1)
        embeddings = embed_model.encode(text_data.tolist())
    except Exception:
        # Graceful fallback when sentence-transformers is unavailable.
        anchor_idx = 0
        embeddings = np.array(
            [build_features(df, i, anchor_idx, cols) for i in range(len(df))],
            dtype=float,
        )

    n_neighbors = min(5, len(df))
    nn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine")
    nn.fit(embeddings)

    _, indices = nn.kneighbors(embeddings)

    groups = []
    visited = set()

    for i in range(len(df)):
        if i in visited:
            continue

        primary_record = _row_payload(df, i, 1.0)
        primary_record["row_index"] = int(i)
        primary_record["score"] = 1.0
        members = [primary_record]
        visited.add(i)
        evidence = {name: 0.0 for name in FEATURE_NAMES}
        evidence_count = 0
        member_scores = [1.0]

        for j in indices[i][1:]:
            j_idx = int(j)
            features = [build_features(df, i, j_idx, cols)]

            rf_pred = rf.predict(features)[0]
            xgb_pred = xgb.predict(features)[0]

            rf_prob = rf.predict_proba(features)[0][1]
            xgb_prob = xgb.predict_proba(features)[0][1]

            score = float((rf_prob + xgb_prob) / 2)

            final_pred = 1 if (rf_pred == 1 and xgb_pred == 1) else 0

            if final_pred == 1:
                matched_record = _row_payload(df, j_idx, score)
                matched_record["row_index"] = int(j_idx)
                matched_record["score"] = float(score)
                members.append(matched_record)
                visited.add(j_idx)
                member_scores.append(score)
                for idx, name in enumerate(FEATURE_NAMES):
                    evidence[name] += float(features[0][idx])
                evidence_count += 1

        if evidence_count > 0:
            evidence = {k: round(v / evidence_count, 4) for k, v in evidence.items()}

        confidence = float(round(sum(member_scores) / len(member_scores), 4))
        groups.append(
            {
                "group_id": str(i),
                "confidence": confidence,
                "label": apply_threshold(confidence),
                "records": members,
                "evidence": evidence,
            }
        )

    return groups
