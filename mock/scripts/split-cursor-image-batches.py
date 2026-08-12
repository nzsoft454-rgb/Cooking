#!/usr/bin/env python3
"""Split pending list into batch JSON files for Cursor image generation."""
from __future__ import annotations

import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PENDING = SCRIPT_DIR / "ingredient-pending-cursor.json"
BATCH_DIR = SCRIPT_DIR / "cursor-image-batches"


def main() -> None:
    batch_size = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    pending = json.loads(PENDING.read_text(encoding="utf-8"))
    BATCH_DIR.mkdir(exist_ok=True)
    for old in BATCH_DIR.glob("batch-*.json"):
        old.unlink()
    for i in range(0, len(pending), batch_size):
        chunk = pending[i : i + batch_size]
        n = i // batch_size + 1
        (BATCH_DIR / f"batch-{n:03d}.json").write_text(
            json.dumps(chunk, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    total = (len(pending) + batch_size - 1) // batch_size
    print(f"batches {total} x {batch_size} ({len(pending)} items)")


if __name__ == "__main__":
    main()
