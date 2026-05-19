import json
from itertools import combinations
from pathlib import Path
from typing import Dict, List

import numpy as np

from app.ml.features import build_features

LABELS_FILE = Path(__file__).resolve().parents[2] / "data" / "labels" / "ground_truth.json"


def load_labels() -> List[Dict]:
    if not LABELS_FILE.exists():
        return []
    return json.loads(LABELS_FILE.read_text(encoding="utf-8"))


def save_label(entry: Dict) -> Dict:
    labels = load_labels()
    labels.append(entry)
    LABELS_FILE.parent.mkdir(parents=True, exist_ok=True)
    LABELS_FILE.write_text(json.dumps(labels, indent=2), encoding="utf-8")
    return entry


def generate_label(df, i, j, cols=None):
    if "cluster" in df.columns:
        return 1 if df.iloc[i]["cluster"] == df.iloc[j]["cluster"] else 0

    if cols is None:
        columns = [str(c).strip().lower() for c in df.columns]
        name_col = next((c for c in columns if "name" in c), None)
        address_col = next((c for c in columns if "address" in c), None)
        phone_col = next((c for c in columns if "phone" in c), None)
        city_col = next((c for c in columns if "city" in c), None)
        email_col = next((c for c in columns if "email" in c), None)
        cols = (name_col, address_col, phone_col, city_col, email_col)

    feats = build_features(df, i, j, cols)
    avg_score = float(sum(feats) / len(feats)) if feats else 0.0
    return 1 if avg_score > 0.85 else 0


def build_label_matrix(df, cols):
    X, y = [], []
    for i, j in combinations(range(len(df)), 2):
        X.append(build_features(df, i, j, cols))
        y.append(generate_label(df, i, j, cols))
    return np.array(X, dtype=float), np.array(y, dtype=int)
