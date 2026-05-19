from app.ml.evaluate import evaluate_metrics
from app.ml.features import build_feature_vector


def test_features_vector_shape():
    vec = build_feature_vector({"name": "A"}, {"name": "B"})
    assert len(vec) == 2


def test_metrics_values():
    metrics = evaluate_metrics(tp=8, fp=2, fn=1)
    assert metrics["precision"] > 0
    assert metrics["recall"] > 0
    assert metrics["f1"] > 0
