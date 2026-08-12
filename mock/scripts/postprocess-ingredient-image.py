#!/usr/bin/env python3
"""Resize/compress a source image to ing_{slug}.jpg (800x800, <=300KB)."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"
MAX_BYTES = 300 * 1024
TARGET = (800, 800)


def save_under_limit(img: Image.Image, dest: Path) -> int:
    img = img.convert("RGB")
    if img.size != TARGET:
        img = img.resize(TARGET, Image.Resampling.LANCZOS)
    best_q = 85
    for q in range(85, 40, -3):
        img.save(dest, "JPEG", quality=q, optimize=True)
        size = dest.stat().st_size
        if size <= MAX_BYTES:
            best_q = q
            break
    img.save(dest, "JPEG", quality=best_q, optimize=True)
    return dest.stat().st_size


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: postprocess-ingredient-image.py <source> <slug>")

    src = Path(sys.argv[1])
    slug = sys.argv[2]
    dest = FOOD_DIR / f"ing_{slug}.jpg"
    FOOD_DIR.mkdir(parents=True, exist_ok=True)
    size = save_under_limit(Image.open(src), dest)
    flag = "OK" if size <= MAX_BYTES else "OVER"
    print(f"{flag} {dest.name} {size/1024:.1f}KB")


if __name__ == "__main__":
    main()
