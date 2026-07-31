#!/usr/bin/env python3
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
meta = json.loads((root / "scripts/ingredient-catalog-200.json").read_text("utf-8"))
food = root / "assets" / "food"
seen = set()
for e in meta:
    slug = e["imageFile"].replace("ing_", "").replace(".jpg", "")
    if slug in seen:
        continue
    seen.add(slug)
    p = food / f"ing_{slug}.jpg"
    if p.exists() and p.stat().st_size < 35000:
        print(f"{slug}\t{e['name']}")
