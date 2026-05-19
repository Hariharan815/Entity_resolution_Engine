from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

MODEL_FILE = Path(__file__).parent.parent.parent / "data" / "models" / "model.pkl"
LABELS_FILE = Path(__file__).parent.parent.parent / "data" / "labels" / "labels.csv"
FEATURE_COLS = [
    "name_sim",
    "addr_sim",
    "phone_match",
    "city_match",
    "email_match",
    "email_domain",
]


def _decision_to_features(decision: str) -> List[float]:
    if decision == "approve":
        return [0.94, 0.91, 1.0, 1.0, 0.88, 1.0]
    return [0.27, 0.31, 0.0, 0.0, 0.0, 0.0]


def retrain(new_data):
    print("Retraining with feedback data...")
    if not MODEL_FILE.exists():
        raise FileNotFoundError("Model not found. Run ml/train.py first.")

    rf, xgb = joblib.load(MODEL_FILE)

    if LABELS_FILE.exists():
        labels_df = pd.read_csv(LABELS_FILE)
    else:
        labels_df = pd.DataFrame(columns=["group_id", *FEATURE_COLS, "label"])

    feedback = new_data or []
    rows = []
    for item in feedback:
        decision = str(item.get("decision", "")).strip().lower()
        if decision not in {"approve", "reject"}:
            continue
        feats = _decision_to_features(decision)
        rows.append(
            {
                "group_id": item.get("group_id", "unknown"),
                "name_sim": feats[0],
                "addr_sim": feats[1],
                "phone_match": feats[2],
                "city_match": feats[3],
                "email_match": feats[4],
                "email_domain": feats[5],
                "label": 1 if decision == "approve" else 0,
            }
        )

    if rows:
        labels_df = pd.concat([labels_df, pd.DataFrame(rows)], ignore_index=True)

    if labels_df.empty:
        raise ValueError("No retraining samples available in feedback or labels.csv")

    X = labels_df[FEATURE_COLS].fillna(0.0).to_numpy(dtype=float)
    y = labels_df["label"].fillna(0).to_numpy(dtype=int)

    if np.unique(y).size < 2:
        raise ValueError("Need both positive and negative labels for retraining")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    before_rf = rf.predict(X_test)
    before_xgb = xgb.predict(X_test)
    before_pred = ((before_rf + before_xgb) == 2).astype(int)
    before_acc = accuracy_score(y_test, before_pred)

    rf.fit(X_train, y_train)
    xgb.fit(X_train, y_train)

    after_rf = rf.predict(X_test)
    after_xgb = xgb.predict(X_test)
    after_pred = ((after_rf + after_xgb) == 2).astype(int)
    after_acc = accuracy_score(y_test, after_pred)

    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    LABELS_FILE.parent.mkdir(parents=True, exist_ok=True)
    labels_df.to_csv(LABELS_FILE, index=False)
    joblib.dump((rf, xgb), MODEL_FILE)

    print(f"Before accuracy: {before_acc:.4f}")
    print(f"After accuracy: {after_acc:.4f}")

    return {
        "status": "retrained",
        "model_path": str(MODEL_FILE),
        "before_accuracy": float(before_acc),
        "after_accuracy": float(after_acc),
    }


def retrain_from_feedback() -> Dict[str, str]:
    result = retrain(new_data=[])
    return {"status": "retrained", "model_path": result["model_path"]}


if __name__ == "__main__":
    demo_feedback = [
        {"group_id": "demo_1", "decision": "approve"},
        {"group_id": "demo_2", "decision": "reject"},
    ]
    retrain(demo_feedback)
