#!/usr/bin/env python3
"""Analyze overlap between existing catalog and Excel additions."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
EXCEL = Path(r"C:\Users\akiyama\OneDrive\Desktop\食材一覧800_追加.xlsx")
CATALOG_TS = ROOT / "src" / "data" / "ingredientCatalog.ts"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s).strip()
    s = re.sub(r"[（(].*?[）)]", "", s)
    return s


def main() -> None:
    existing_names = {
        norm(n) for n in re.findall(r"name: '([^']+)'", CATALOG_TS.read_text(encoding="utf-8"))
    }
    wb = openpyxl.load_workbook(EXCEL, read_only=True, data_only=True)
    rows = list(wb.active.iter_rows(values_only=True))[1:]
    wb.close()

    dup: list[str] = []
    new_items: list[dict] = []
    for row in rows:
        name = norm(str(row[1]))
        cat = str(row[2]).strip() if row[2] else ""
        if name in existing_names:
            dup.append(name)
        else:
            new_items.append({"no": row[0], "name": name, "category": cat})

    out = Path(__file__).resolve().parent / "ingredient-list-800-additions-full.json"
    out.write_text(json.dumps(new_items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"existing: {len(existing_names)}")
    print(f"excel rows: {len(rows)}")
    print(f"duplicates: {len(dup)}")
    print(f"new unique: {len(new_items)}")
    print(f"wrote {out.name}")


if __name__ == "__main__":
    main()
