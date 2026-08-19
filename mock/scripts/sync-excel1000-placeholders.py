#!/usr/bin/env python3
"""Create placeholder ing_*.jpg for Excel 1000 additions only."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"
SLUGS_PATH = Path(__file__).resolve().parent / "ingredient-excel1000-slugs.json"
MAX_BYTES = 120 * 1024
TARGET = (512, 512)

CATEGORY_COLORS = {
    "grain": ("#F5E6C8", "#C4A35A"),
    "vegetable": ("#E8F5E9", "#4CAF50"),
    "meat": ("#FFEBEE", "#E57373"),
    "seafood": ("#E3F2FD", "#64B5F6"),
    "soy_dairy": ("#FFF8E1", "#FFB74D"),
    "fruit": ("#FCE4EC", "#F06292"),
    "調味料": ("#FFF3E0", "#FB8C00"),
    "スパイス": ("#FBE9E7", "#D84315"),
    "油脂": ("#FFFDE7", "#F9A825"),
    "乾物": ("#EFEBE9", "#8D6E63"),
    "缶詰": ("#ECEFF1", "#607D8B"),
    "加工食品": ("#F3E5F5", "#8E24AA"),
    "漬物": ("#F1F8E9", "#7CB342"),
    "菓子・デザート材料": ("#FCE4EC", "#EC407A"),
    "きのこ": ("#EFEBE9", "#6D4C41"),
    "海藻": ("#E0F2F1", "#00897B"),
    "ナッツ・種": ("#FFF3E0", "#EF6C00"),
    "豆類": ("#FFFDE7", "#C0CA33"),
    "乳製品": ("#FFF8E1", "#FFB74D"),
    "穀物・麺": ("#F5E6C8", "#C4A35A"),
    "肉類": ("#FFEBEE", "#E57373"),
    "魚介類": ("#E3F2FD", "#64B5F6"),
    "野菜": ("#E8F5E9", "#4CAF50"),
    "果物": ("#FCE4EC", "#F06292"),
}


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


def make_placeholder(name: str, excel_category: str) -> Image.Image:
    bg, accent = CATEGORY_COLORS.get(excel_category, ("#EEEEEE", "#888888"))
    img = Image.new("RGB", TARGET, bg)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((60, 60, 452, 452), radius=32, fill=accent)
    draw.ellipse((100, 100, 412, 412), fill=bg)
    label = name if len(name) <= 8 else name[:7] + "…"
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/meiryo.ttc", 36)
    except OSError:
        font = ImageFont.load_default()
    draw.text((256, 256), label, fill=accent, anchor="mm", font=font)
    return img


def main() -> None:
    slugs = json.loads(SLUGS_PATH.read_text(encoding="utf-8"))
    FOOD_DIR.mkdir(parents=True, exist_ok=True)
    created = 0
    skipped = 0

    for row in slugs:
        slug = row["slug"]
        dest = FOOD_DIR / f"ing_{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 35_000:
            skipped += 1
            continue
        name = row["name"]
        excel_category = row.get("excelCategory") or "野菜"
        img = make_placeholder(name, excel_category)
        size = save_under_limit(img, dest)
        created += 1
        if created <= 5 or created % 100 == 0:
            print(f"OK {dest.name} {size/1024:.1f}KB ({name})")

    print(f"created {created}, skipped {skipped}, total {len(slugs)}")


if __name__ == "__main__":
    main()
