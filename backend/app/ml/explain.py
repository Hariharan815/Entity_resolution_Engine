from pathlib import Path

import joblib
import numpy as np
import shap

MODEL_FILE = Path(__file__).parent.parent.parent / "data" / "models" / "model.pkl"


def get_feature_names():
    return ["name_sim", "addr_sim", "phone_match", "city_match", "email_match", "email_domain"]


def _load_rf_model():
    if not MODEL_FILE.exists():
        raise FileNotFoundError("Model not found. Run ml/train.py first.")
    rf, _ = joblib.load(MODEL_FILE)
    return rf


def explain_model(X_sample):
    rf = _load_rf_model()
    explainer = shap.TreeExplainer(rf)
    shap_values = explainer.shap_values(X_sample)
    values = shap_values[1] if isinstance(shap_values, list) and len(shap_values) > 1 else shap_values
    shap.summary_plot(values, X_sample, feature_names=get_feature_names())


def explain_single(X_sample):
    rf = _load_rf_model()
    explainer = shap.TreeExplainer(rf)
    arr = np.array(X_sample, dtype=float)
    if arr.ndim == 1:
        arr = arr.reshape(1, -1)

    shap_values = explainer.shap_values(arr)
    values = shap_values[1] if isinstance(shap_values, list) and len(shap_values) > 1 else shap_values
    one_row = values[0]

    names = get_feature_names()
    return {names[idx]: float(one_row[idx]) for idx in range(min(len(names), len(one_row)))}
