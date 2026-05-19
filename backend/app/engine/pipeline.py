from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

from app.utils.normalise import harmonise_columns

from app.engine.blocker import candidate_pairs
from app.engine.classifier import classify_pair
from app.engine.canonical import build_golden_record


def merge_dataframes(file_paths: List[str]) -> pd.DataFrame:
    frames = []
    for file_path in file_paths:
        path = Path(file_path)
        df = pd.read_csv(path)
        df.columns = [str(c).strip().lower() for c in df.columns]
        source_name = path.name.split("_", 1)[1] if "_" in path.name else path.name
        df["source"] = source_name
        frames.append(df)

    if not frames:
        return pd.DataFrame()

    frames = harmonise_columns(frames)
    all_columns = sorted({col for frame in frames for col in frame.columns})

    aligned = []
    for frame in frames:
        for col in all_columns:
            if col not in frame.columns:
                frame[col] = pd.NA
        aligned.append(frame[all_columns])

    return pd.concat(aligned, ignore_index=True)


def run_pipeline(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not rows:
        return {
            "clean_records": [],
            "duplicates": [],
            "conflicts": [],
            "accuracy": 0.0,
            "total_records": 0,
        }

    pairs = candidate_pairs(rows)
    grouped = defaultdict(list)
    conflicts = []

    for i, j in pairs:
        left = rows[i]
        right = rows[j]
        verdict = classify_pair(left, right)

        if verdict["label"] == "duplicate":
            group_id = f"cluster-{i}"
            grouped[group_id].append({**left, "confidence": verdict["score"]})
            grouped[group_id].append({**right, "confidence": verdict["score"]})
        elif verdict["label"] == "possible":
            conflicts.append({"id": f"cf-{i}-{j}", "left": left, "right": right})

    duplicates = []
    clean_records = []
    used_rows = set()

    for cluster_id, records in grouped.items():
        seen = []
        for rec in records:
            marker = tuple(sorted(rec.items()))
            if marker not in used_rows:
                used_rows.add(marker)
                seen.append(rec)
        duplicates.append({"clusterId": cluster_id, "records": seen})
        clean_records.append(build_golden_record(seen))

    for row in rows:
        marker = tuple(sorted(row.items()))
        if marker not in used_rows:
            clean_records.append({**row, "confidence": 1.0})

    total = len(rows)
    resolved = len(clean_records)
    accuracy = resolved / total if total else 0.0

    return {
        "clean_records": clean_records,
        "duplicates": duplicates,
        "conflicts": conflicts,
        "accuracy": round(accuracy, 4),
        "total_records": total,
    }
