from collections import defaultdict
from typing import Any, Dict, List, Tuple

from app.utils.normalise import clean_name


def phonetic_key(text: str) -> str:
    cleaned = clean_name(text)
    if not cleaned:
        return ""
    return f"{cleaned[:1]}{len(cleaned)}{cleaned[-1:]}"


def build_blocks(rows: List[Dict[str, Any]], name_field: str = "name") -> Dict[str, List[int]]:
    blocks: Dict[str, List[int]] = defaultdict(list)
    for idx, row in enumerate(rows):
        key = phonetic_key(str(row.get(name_field, "")))
        blocks[key].append(idx)
    return dict(blocks)


def candidate_pairs(rows: List[Dict[str, Any]], name_field: str = "name") -> List[Tuple[int, int]]:
    blocks = build_blocks(rows, name_field=name_field)
    pairs: List[Tuple[int, int]] = []
    for idxs in blocks.values():
        for i in range(len(idxs)):
            for j in range(i + 1, len(idxs)):
                pairs.append((idxs[i], idxs[j]))
    return pairs
