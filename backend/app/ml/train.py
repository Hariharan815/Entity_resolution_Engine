from pathlib import Path
from typing import Dict, Iterable, Optional

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import RandomOverSampler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from app.ml.evaluate import compare_models, evaluate
from app.ml.labels import build_label_matrix

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
PRIMARY_CSV_PATH = Path(__file__).parent.parent / "data" / "restaurants.csv"
FALLBACK_CSV_PATH = DATA_DIR / "restaurants.csv"
MODEL_FILE = Path(__file__).parent.parent.parent / "data" / "models" / "model.pkl"


def _pick_column(columns: Iterable[str], key: str) -> Optional[str]:
    return next((c for c in columns if key in c), None)


def _resolve_csv_path(data_file: Optional[str]) -> Path:
    if data_file:
        path = Path(data_file)
        if path.exists():
            return path
        raise FileNotFoundError(f"Training CSV not found: {path}")

    if PRIMARY_CSV_PATH.exists():
        return PRIMARY_CSV_PATH
    if FALLBACK_CSV_PATH.exists():
        return FALLBACK_CSV_PATH
    raise FileNotFoundError(
        f"Training CSV not found. Checked {PRIMARY_CSV_PATH} and {FALLBACK_CSV_PATH}"
    )


def train_models(data_file: Optional[str] = None) -> Dict[str, str]:
    csv_path = _resolve_csv_path(data_file)

    df = pd.read_csv(csv_path)
    if len(df) < 2:
        raise ValueError("Training dataset must contain at least 2 rows")

    df.columns = df.columns.str.lower()
    columns = df.columns.tolist()

    name_col = _pick_column(columns, "name")
    address_col = _pick_column(columns, "address")
    phone_col = _pick_column(columns, "phone")
    city_col = _pick_column(columns, "city")
    email_col = _pick_column(columns, "email")
    cols = (name_col, address_col, phone_col, city_col, email_col)

    X_arr, y_arr = build_label_matrix(df, cols)
    if X_arr.size == 0:
        raise ValueError("Could not build pairwise training samples")
    if np.unique(y_arr).size < 2:
        raise ValueError("Training labels contain only one class; provide richer data")

    pos_count = int(np.sum(y_arr == 1))
    neg_count = int(np.sum(y_arr == 0))
    pos_ratio = pos_count / max(len(y_arr), 1)
    scale_pos_weight = neg_count / max(pos_count, 1)

    X_balanced, y_balanced = X_arr, y_arr
    if pos_ratio < 0.10:
        sampler = RandomOverSampler(random_state=42)
        X_balanced, y_balanced = sampler.fit_resample(X_arr, y_arr)

    X_train, X_test, y_train, y_test = train_test_split(
        X_balanced,
        y_balanced,
        test_size=0.2,
        random_state=42,
        stratify=y_balanced,
    )

    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    xgb = XGBClassifier(
        eval_metric="logloss",
        random_state=42,
        scale_pos_weight=scale_pos_weight,
    )

    rf.fit(X_train, y_train)
    xgb.fit(X_train, y_train)

    rf_pred = rf.predict(X_test)
    xgb_pred = xgb.predict(X_test)
    final_pred = (rf_pred + xgb_pred) == 2

    print("RF Accuracy:", accuracy_score(y_test, rf_pred))
    print("XGB Accuracy:", accuracy_score(y_test, xgb_pred))
    print("Final Accuracy:", accuracy_score(y_test, final_pred))
    evaluate(y_test, final_pred)
    compare_models(y_test, rf_pred, xgb_pred, final_pred)

    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump((rf, xgb), MODEL_FILE)
    return {"status": "trained", "model_path": str(MODEL_FILE)}


if __name__ == "__main__":
    train_models()
