#!/usr/bin/env python3
"""Merge existing ingredient catalog with Excel additions (食材一覧1000_追加.xlsx)."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import openpyxl
import pykakasi

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
EXISTING_META = SCRIPTS / "ingredient-catalog-full.json"
EXISTING_FALLBACK = SCRIPTS / "ingredient-catalog-200.json"
EXCEL_PATH = Path(r"C:\Users\akiyama\OneDrive\Desktop\食材一覧1000_追加.xlsx")
OUT_META = SCRIPTS / "ingredient-catalog-full.json"
OUT_NEW_SLUGS = SCRIPTS / "ingredient-excel1000-slugs.json"
OUT_CATALOG_TS = ROOT / "src" / "data" / "ingredientCatalog.ts"

KKS = pykakasi.kakasi()

EXCEL_CATEGORY_MAP: dict[str, str] = {
    "野菜": "vegetable",
    "きのこ": "vegetable",
    "海藻": "vegetable",
    "果物": "fruit",
    "ナッツ・種": "fruit",
    "肉類": "meat",
    "魚介類": "seafood",
    "豆類": "soy_dairy",
    "乳製品": "soy_dairy",
    "穀物・麺": "grain",
    "調味料": "grain",
    "スパイス": "grain",
    "油脂": "grain",
    "乾物": "grain",
    "菓子・デザート材料": "grain",
    "飲料": "grain",
    "缶詰": "grain",
    "加工食品": "grain",
    "冷凍食品": "grain",
    "ベーカリー": "grain",
    "漬物": "grain",
}

IMAGE_ID_ALIASES: dict[str, str] = {
    "edamame_dup": "edamame",
    "pork_offcuts": "pork",
    "fish_fillet": "salmon",
    "dango": "mochi_rice",
}


def strip_paren(name: str) -> str:
    return re.sub(r"[（(].*?[）)]", "", name).strip()


def normalize_name(name: str) -> str:
    return unicodedata.normalize("NFKC", strip_paren(name)).strip()


def katakana_to_hiragana(text: str) -> str:
    out: list[str] = []
    for ch in text:
        code = ord(ch)
        if 0x30A1 <= code <= 0x30F6:
            out.append(chr(code - 0x60))
        else:
            out.append(ch)
    return "".join(out)


def hiragana_to_katakana(text: str) -> str:
    out: list[str] = []
    for ch in text:
        code = ord(ch)
        if 0x3041 <= code <= 0x3096:
            out.append(chr(code + 0x60))
        else:
            out.append(ch)
    return "".join(out)


def alias_variants(name: str) -> list[str]:
    base = strip_paren(name)
    variants = {name, base}
    for text in list(variants):
        variants.add(katakana_to_hiragana(text))
        variants.add(hiragana_to_katakana(text))
        variants.add(unicodedata.normalize("NFKC", text))
    variants.discard(name)
    return sorted(v for v in variants if v and v != name)


def slugify(name: str, used: set[str]) -> str:
    hepburn = "".join(item["hepburn"] for item in KKS.convert(name))
    base = re.sub(r"[^a-z0-9]+", "_", hepburn.lower()).strip("_")
    if not base:
        base = "item"
    slug = base[:48].strip("_") or "item"
    candidate = slug
    n = 2
    while candidate in used:
        candidate = f"{slug}_{n}"
        n += 1
    used.add(candidate)
    return candidate


def image_source_slug(slug: str) -> str:
    return IMAGE_ID_ALIASES.get(slug, slug)


def map_excel_category(label: str) -> str:
    return EXCEL_CATEGORY_MAP.get(label.strip(), "grain")


def load_excel_rows() -> list[dict]:
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
    rows = list(wb.active.iter_rows(values_only=True))[1:]
    wb.close()
    items: list[dict] = []
    for row in rows:
        if not row or row[1] is None:
            continue
        items.append(
            {
                "no": row[0],
                "name": str(row[1]).strip(),
                "excelCategory": str(row[2]).strip() if row[2] else "",
            }
        )
    return items


def write_catalog_ts(entries: list[dict]) -> None:
    lines = [
        "/** レシート読み取り対応食材カタログ（既存 + Excel追加1000件） */",
        "export type IngredientCategory =",
        "  | 'grain'",
        "  | 'vegetable'",
        "  | 'meat'",
        "  | 'seafood'",
        "  | 'soy_dairy'",
        "  | 'fruit';",
        "",
        "export type IngredientCatalogEntry = {",
        "  /** asset ファイル名（ing_rice.jpg 等） */",
        "  id: string;",
        "  /** 表示名（正規名） */",
        "  name: string;",
        "  /** レシート表記ゆれ */",
        "  aliases: string[];",
        "  category: IngredientCategory;",
        "};",
        "",
        "export const INGREDIENT_CATALOG: IngredientCatalogEntry[] = [",
    ]
    for e in entries:
        alias_json = json.dumps(e["aliases"], ensure_ascii=False)
        name = e["name"].replace("'", "\\'")
        lines.append(
            f"  {{ id: '{e['id']}', name: '{name}', aliases: {alias_json}, category: '{e['category']}' }},"
        )
    lines.append("];")
    lines.append("")
    OUT_CATALOG_TS.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    if not EXCEL_PATH.exists():
        raise SystemExit(f"Excel not found: {EXCEL_PATH}")
    meta_path = EXISTING_META if EXISTING_META.exists() else EXISTING_FALLBACK
    if not meta_path.exists():
        raise SystemExit("Run build-ingredient-catalog-200.py first")

    existing = json.loads(meta_path.read_text(encoding="utf-8"))
    excel_rows = load_excel_rows()

    known_names = {normalize_name(e["name"]) for e in existing}
    used_slugs = {e["id"] for e in existing}

    merged = list(existing)
    skipped = 0
    added = 0
    new_slugs: list[dict] = []

    for row in excel_rows:
        raw_name = row["name"]
        name = normalize_name(raw_name)
        if not name:
            continue
        if name in known_names:
            skipped += 1
            continue

        slug = slugify(name, used_slugs)
        aliases = alias_variants(raw_name)
        category = map_excel_category(row["excelCategory"])
        img_slug = image_source_slug(slug)

        entry = {
            "no": len(merged) + 1,
            "id": slug,
            "name": name,
            "aliases": aliases,
            "category": category,
            "excelCategory": row["excelCategory"],
            "imageFile": f"ing_{img_slug}.jpg",
            "imageKey": f"asset://ing_{img_slug}",
        }
        merged.append(entry)
        new_slugs.append(
            {
                "slug": img_slug,
                "name": name,
                "excelCategory": row["excelCategory"],
            }
        )
        known_names.add(name)
        added += 1

    for i, entry in enumerate(merged, start=1):
        entry["no"] = i

    OUT_META.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_NEW_SLUGS.write_text(json.dumps(new_slugs, ensure_ascii=False, indent=2), encoding="utf-8")
    write_catalog_ts(
        [
            {
                "id": e["id"],
                "name": e["name"],
                "aliases": e["aliases"],
                "category": e["category"],
            }
            for e in merged
        ]
    )

    print(f"existing: {len(existing)}")
    print(f"excel rows: {len(excel_rows)}")
    print(f"skipped duplicates: {skipped}")
    print(f"added: {added}")
    print(f"total: {len(merged)}")
    print(f"wrote {OUT_META.name}")
    print(f"wrote {OUT_CATALOG_TS.name}")


if __name__ == "__main__":
    main()
