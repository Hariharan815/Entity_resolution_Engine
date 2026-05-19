import numpy as np
from sklearn.metrics import precision_recall_curve


def apply_threshold(score, high=0.85, low=0.5):
    if score >= high:
        return "High Match"
    elif score >= low:
        return "Possible Match"
    else:
        return "No Match"


def calibrate_threshold(y_true, y_prob):
    precision, recall, thresholds = precision_recall_curve(y_true, y_prob)
    if thresholds.size == 0:
        print("Best threshold by F1: 0.5")
        return 0.5

    f1_scores = (2 * precision[:-1] * recall[:-1]) / np.clip(precision[:-1] + recall[:-1], 1e-12, None)
    best_idx = int(np.argmax(f1_scores))
    best_threshold = float(thresholds[best_idx])
    print(f"Best threshold by F1: {best_threshold:.4f}")
    return best_threshold
