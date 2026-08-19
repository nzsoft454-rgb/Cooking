#!/usr/bin/env python3
"""Resize/compress a generated image into assets/food/ing_{slug}.jpg."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOOD = ROOT / "assets" / "food"
MAX_BYTES = 120 * 1024
TARGET = (512, 512)


def save_under_limit(img: Image.Image, dest: Path) -> int:
    img = img.convert("RGB")
    if img.size != TARGET:
        img = img.resize(TARGET, Image.Resampling.LANCZOS)
    best_q = 85
    for q in range(85, 40, -3):
        img.save(dest, "JPEG", quality=q, optimize=True)
        if dest.stat().st_size <= MAX_BYTES:
            best_q = q
            break
    img.save(dest, "JPEG", quality=best_q, optimize=True)
    return dest.stat().st_size


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: import-ingredient-image.py <source> <slug>")
    src = Path(sys.argv[1])
    slug = sys.argv[2]
    dest = FOOD / f"ing_{slug}.jpg"
    size = save_under_limit(Image.open(src), dest)
    print(f"OK {dest.name} {size/1024:.1f}KB")


if __name__ == "__main__":
    main()
