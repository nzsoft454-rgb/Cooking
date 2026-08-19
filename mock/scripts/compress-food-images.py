#!/usr/bin/env python3
"""Batch-compress assets/food images for smaller APK size."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"

ING_TARGET = (512, 512)
ING_MAX_BYTES = 120 * 1024

HERO_TARGET = (1024, 1024)
HERO_MAX_BYTES = 280 * 1024

LEGACY_PNG_TO_JPG = [
    "kabu_turnip",
    "kyuuri_cucumber",
    "nasu_eggplant",
    "okura_gombo",
    "tamanegi_onion",
    "capture-erungi",
    "cooked_spinach_stirfry",
    "cooked_eggplant_salad",
    "cooked_gacha_pot",
    "cooked_cucumber_salad",
]

LEGACY_JPG = [
    "hourensou_spinach",
    "piman_greenpepper",
    "receipt_sample",
]


def save_jpeg_under_limit(
    img: Image.Image,
    dest: Path,
    target: tuple[int, int],
    max_bytes: int,
) -> int:
    img = img.convert("RGB")
    if img.size != target:
        img = img.resize(target, Image.Resampling.LANCZOS)

    best_q = 82
    for q in range(82, 38, -3):
        img.save(dest, "JPEG", quality=q, optimize=True)
        size = dest.stat().st_size
        if size <= max_bytes:
            best_q = q
            break

    img.save(dest, "JPEG", quality=best_q, optimize=True)
    return dest.stat().st_size


def compress_ingredient(path: Path, dry_run: bool) -> tuple[int, int]:
    before = path.stat().st_size
    if dry_run:
        return before, before

    tmp = path.with_suffix(".jpg.tmp")
    after = save_jpeg_under_limit(Image.open(path), tmp, ING_TARGET, ING_MAX_BYTES)
    tmp.replace(path)
    return before, after


def compress_legacy_png(stem: str, dry_run: bool) -> tuple[int, int]:
    src = FOOD_DIR / f"{stem}.png"
    dest = FOOD_DIR / f"{stem}.jpg"
    if not src.exists():
        return 0, 0

    before = src.stat().st_size
    if dry_run:
        return before, before // 8

    after = save_jpeg_under_limit(Image.open(src), dest, HERO_TARGET, HERO_MAX_BYTES)
    src.unlink()
    return before, after


def compress_legacy_jpg(stem: str, dry_run: bool) -> tuple[int, int]:
    path = FOOD_DIR / f"{stem}.jpg"
    if not path.exists():
        return 0, 0

    before = path.stat().st_size
    if dry_run:
        return before, before

    tmp = path.with_suffix(".jpg.tmp")
    after = save_jpeg_under_limit(Image.open(path), tmp, HERO_TARGET, HERO_MAX_BYTES)
    tmp.replace(path)
    return before, after


def dir_bytes(pattern: str) -> int:
    return sum(p.stat().st_size for p in FOOD_DIR.glob(pattern))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    before_ing = dir_bytes("ing_*.jpg")
    ing_files = sorted(FOOD_DIR.glob("ing_*.jpg"))
    ing_saved = 0
    ing_over = 0

    for path in ing_files:
        before, after = compress_ingredient(path, args.dry_run)
        ing_saved += before - after
        if after > ING_MAX_BYTES:
            ing_over += 1

    legacy_saved = 0
    for stem in LEGACY_PNG_TO_JPG:
        before, after = compress_legacy_png(stem, args.dry_run)
        legacy_saved += before - after

    for stem in LEGACY_JPG:
        before, after = compress_legacy_jpg(stem, args.dry_run)
        legacy_saved += before - after

    after_ing = before_ing - ing_saved if not args.dry_run else before_ing - ing_saved

    print(f"ingredient images: {len(ing_files)} files")
    print(f"  before: {before_ing / 1024 / 1024:.1f} MB")
    print(f"  after:  {after_ing / 1024 / 1024:.1f} MB")
    print(f"  saved:  {ing_saved / 1024 / 1024:.1f} MB")
    if ing_over:
        print(f"  warning: {ing_over} files still over {ING_MAX_BYTES // 1024} KB")
    print(f"legacy images saved: {legacy_saved / 1024 / 1024:.1f} MB")
    print(f"total saved: {(ing_saved + legacy_saved) / 1024 / 1024:.1f} MB")
    if args.dry_run:
        print("(dry run — no files written)")


if __name__ == "__main__":
    main()
