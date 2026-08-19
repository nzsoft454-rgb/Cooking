#!/usr/bin/env python3
"""List ingredients still needing Cursor Composer-generated photos."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"
META_PATH = Path(__file__).resolve().parent / "ingredient-catalog-full.json"
EXCEL1000_PATH = Path(__file__).resolve().parent / "ingredient-excel1000-slugs.json"
OUT_PATH = Path(__file__).resolve().parent / "ingredient-pending-cursor.json"
PLACEHOLDER_MAX = 35_000

CATEGORY_HINTS: dict[str, str] = {
    "野菜": "Whole fresh vegetable as sold at a Japanese supermarket.",
    "肉類": "Raw uncooked meat only, fresh butcher cut.",
    "魚介類": "Fresh raw seafood for cooking, not sashimi platter.",
    "調味料": "Condiment in a small plain bowl, no branded bottle.",
    "きのこ": "Fresh mushroom, whole or clustered, raw uncooked.",
    "果物": "Whole fresh fruit as sold at a Japanese supermarket.",
    "豆類": "Raw beans or legumes, dried or fresh, uncooked.",
    "乳製品": "Plain dairy product without branded packaging.",
    "穀物・麺": "Raw grain, rice, or uncooked noodles on a plate.",
    "スパイス": "Spice or herb, loose in a small plain bowl.",
    "油脂": "Cooking oil or fat in a small plain dish.",
    "乾物": "Dried food ingredient, loose on a plate.",
    "海藻": "Raw or dried seaweed for cooking.",
    "ナッツ・種": "Nuts or seeds, loose on a plain plate.",
    "漬物": "Japanese pickled vegetable, small portion on plate.",
    "菓子・デザート材料": "Baking or dessert ingredient, raw uncooked.",
    "加工食品": "Processed food ingredient without branded packaging.",
    "缶詰": "Canned food contents on a plate, no visible can label.",
}

PROMPT = (
    "Professional food photography of raw {name} ({category_hint}). "
    "Japanese cooking ingredient. Single ingredient only, no dish, no recipe. "
    "Centered on clean white plate or light marble. Soft natural lighting, photorealistic. "
    "No text, no logo, no people, no packaging. "
    "Avoid cooked meal, soup, bento, illustration."
)


def build_prompt(name: str, excel_category: str) -> str:
    hint = CATEGORY_HINTS.get(excel_category, "Japanese cooking ingredient as sold for home cooking.")
    return PROMPT.format(name=name, category_hint=hint)


def needs_image(dest: Path) -> bool:
    return not dest.exists() or dest.stat().st_size <= PLACEHOLDER_MAX


def main() -> None:
    pending: list[dict] = []

    if "--excel1000" in sys.argv:
        rows = json.loads(EXCEL1000_PATH.read_text(encoding="utf-8"))
        for row in rows:
            slug = row["slug"]
            dest = FOOD_DIR / f"ing_{slug}.jpg"
            if not needs_image(dest):
                continue
            excel_category = row.get("excelCategory") or "野菜"
            pending.append(
                {
                    "slug": slug,
                    "name": row["name"],
                    "excelCategory": excel_category,
                    "prompt": build_prompt(row["name"], excel_category),
                    "dest": f"mock/assets/food/ing_{slug}.jpg",
                }
            )
    else:
        meta = json.loads(META_PATH.read_text(encoding="utf-8"))
        for entry in meta:
            slug = entry["imageFile"].replace("ing_", "").replace(".jpg", "")
            dest = FOOD_DIR / f"ing_{slug}.jpg"
            if not needs_image(dest):
                continue
            excel_category = entry.get("excelCategory") or "野菜"
            pending.append(
                {
                    "slug": slug,
                    "name": entry["name"],
                    "excelCategory": excel_category,
                    "prompt": build_prompt(entry["name"], excel_category),
                    "dest": f"mock/assets/food/ing_{slug}.jpg",
                }
            )

    OUT_PATH.write_text(json.dumps(pending, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"pending {len(pending)} -> {OUT_PATH.name}")


if __name__ == "__main__":
    main()
