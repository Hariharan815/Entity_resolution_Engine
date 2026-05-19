from app.engine.blocker import build_blocks, candidate_pairs


def test_blocks_are_generated():
    rows = [{"name": "Ravi"}, {"name": "Ravi K"}, {"name": "Maya"}]
    blocks = build_blocks(rows)
    assert isinstance(blocks, dict)
    assert len(blocks) >= 1


def test_candidate_pairs_returns_list():
    rows = [{"name": "Ravi"}, {"name": "Ravi"}]
    pairs = candidate_pairs(rows)
    assert pairs == [(0, 1)]
