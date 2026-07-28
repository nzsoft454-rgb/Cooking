#!/usr/bin/env python3
"""Generate ing_*.jpg placeholders for ingredient catalog (<=300KB each)."""
from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"
CATALOG_PATH = ROOT / "src" / "data" / "ingredientCatalog.ts"

CATEGORY_COLORS = {
    "grain": ("#F5E6C8", "#C4A35A"),
    "vegetable": ("#E8F5E9", "#4CAF50"),
    "meat": ("#FFEBEE", "#E57373"),
    "seafood": ("#E3F2FD", "#64B5F6"),
    "soy_dairy": ("#FFF8E1", "#FFB74D"),
    "fruit": ("#FCE4EC", "#F06292"),
}

EXISTING_MAP = {
    "onion": "tamanegi_onion.png",
    "cucumber": "kyuuri_cucumber.png",
    "eggplant": "nasu_eggplant.png",
    "green_pepper": "piman_greenpepper.png",
    "spinach": "hourensou_spinach.png",
    "komatsuna": "hourensou_spinach.png",
    "daikon": "kabu_turnip.png",
    "carrot": "kabu_turnip.png",
    "potato": "kabu_turnip.png",
    "tomato": "sample_ingredient_300kb.jpg",
    "shiitake": "capture-erungi.png",
    "shimeji": "capture-erungi.png",
    "enoki": "capture-erungi.png",
}

MAX_BYTES = 300 * 1024


def parse_catalog_ids() -> list[tuple[str, str]]:
    text = CATALOG_PATH.read_text(encoding="utf-8")
    entries: list[tuple[str, str]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("{ id:"):
            continue
        id_part = line.split("id:")[1].split(",")[0].strip().strip("'\"")
        cat = "vegetable"
        for key in CATEGORY_COLORS:
            if f"category: '{key}'" in line or f'category: "{key}"' in line:
                cat = key
                break
        if "category:" in line:
            cat = line.split("category:")[1].split("}")[0].strip().strip("'\",")
        entries.append((id_part, cat))
    return entries


def save_under_limit(img: Image.Image, dest: Path) -> int:
    img = img.convert("RGB")
    if img.size[0] != 800:
        img = img.resize((800, 800), Image.Resampling.LANCZOS)
    best_size = 0
    best_q = 85
    for q in range(50, 96):
        img.save(dest, "JPEG", quality=q, optimize=True)
        size = dest.stat().st_size
        if size <= MAX_BYTES and size > best_size:
            best_size = size
            best_q = q
    img.save(dest, "JPEG", quality=best_q, optimize=True)
    return dest.stat().st_size


def make_placeholder(ing_id: str, category: str, label: str) -> Image.Image:
    bg, accent = CATEGORY_COLORS.get(category, ("#EEEEEE", "#888888"))
    img = Image.new("RGB", (800, 800), bg)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((80, 80, 720, 720), radius=48, fill=accent)
    draw.ellipse((180, 180, 620, 620), fill=bg)
    try:
        font = ImageFont.truetype("arial.ttf", 52)
    except OSError:
        font = ImageFont.load_default()
    draw.text((400, 400), label[:6], fill=accent, anchor="mm", font=font)
    return img


def main() -> None:
    FOOD_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    sizes: dict[str, int] = {}

    for ing_id, category in parse_catalog_ids():
        dest = FOOD_DIR / f"ing_{ing_id}.jpg"
        source_name = EXISTING_MAP.get(ing_id)
        if source_name and (FOOD_DIR / source_name).exists():
            src = Image.open(FOOD_DIR / source_name)
            size = save_under_limit(src, dest)
        else:
            label = ing_id.replace("_", " ")
            img = make_placeholder(ing_id, category, label)
            size = save_under_limit(img, dest)
        manifest[ing_id] = f"ing_{ing_id}.jpg"
        sizes[ing_id] = size
        kb = size / 1024
        flag = "OK" if size <= MAX_BYTES else "OVER"
        print(f"{flag} ing_{ing_id}.jpg {kb:.1f}KB")

    (FOOD_DIR / "ingredient_manifest.json").write_text(
        json.dumps({"files": manifest, "sizes": sizes}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
