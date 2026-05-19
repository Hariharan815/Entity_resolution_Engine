from typing import Dict

from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score


def evaluate(y_true, y_pred):
    print("Precision:", precision_score(y_true, y_pred, zero_division=0))
    print("Recall:", recall_score(y_true, y_pred, zero_division=0))
    print("F1 Score:", f1_score(y_true, y_pred, zero_division=0))


def full_report(y_true, y_pred, y_prob=None):
    p = precision_score(y_true, y_pred, zero_division=0)
    r = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    print("Precision:", round(float(p), 4))
    print("Recall:", round(float(r), 4))
    print("F1 Score:", round(float(f1), 4))

    if y_prob is not None:
        auc = roc_auc_score(y_true, y_prob)
        print("ROC AUC:", round(float(auc), 4))


def compare_models(y_test, rf_pred, xgb_pred, final_pred):
    rows = [
        ("RF", rf_pred),
        ("XGB", xgb_pred),
        ("Ensemble", final_pred),
    ]

    print("\nModel Comparison")
    print("{:<10} {:>10} {:>10} {:>10}".format("Model", "Precision", "Recall", "F1"))
    for name, pred in rows:
        p = precision_score(y_test, pred, zero_division=0)
        r = recall_score(y_test, pred, zero_division=0)
        f1 = f1_score(y_test, pred, zero_division=0)
        print("{:<10} {:>10.4f} {:>10.4f} {:>10.4f}".format(name, p, r, f1))


def evaluate_metrics(tp: int, fp: int, fn: int) -> Dict[str, float]:
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return {"precision": round(precision, 4), "recall": round(recall, 4), "f1": round(f1, 4)}
