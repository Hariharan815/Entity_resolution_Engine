from app.engine.scorer import score_pair


def test_score_pair_range():
    left = {"name": "A", "address": "X Road", "phone": "9999999999"}
    right = {"name": "A", "address": "X Rd", "phone": "9999999999"}
    score = score_pair(left, right)
    assert 0.0 <= score <= 1.0
