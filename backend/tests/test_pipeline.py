from app.engine.pipeline import run_pipeline


def test_pipeline_empty():
    result = run_pipeline([])
    assert result["total_records"] == 0
    assert result["clean_records"] == []
