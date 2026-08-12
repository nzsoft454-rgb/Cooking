#!/usr/bin/env python3
"""List ingredients still needing Cursor-generated photos."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"
META_PATH = Path(__file__).resolve().parent / "ingredient-catalog-full.json"
OUT_PATH = Path(__file__).resolve().parent / "ingredient-pending-cursor.json"
PLACEHOLDER_MAX = 35_000


def main() -> None:
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    pending: list[dict] = []
    for entry in meta:
        slug = entry["imageFile"].replace("ing_", "").replace(".jpg", "")
        dest = FOOD_DIR / f"ing_{slug}.jpg"
        if not dest.exists() or dest.stat().st_size <= PLACEHOLDER_MAX:
            pending.append({"slug": slug, "name": entry["name"]})
    OUT_PATH.write_text(json.dumps(pending, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"pending {len(pending)} -> {OUT_PATH.name}")


if __name__ == "__main__":
    main()
