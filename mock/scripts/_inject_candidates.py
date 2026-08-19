#!/usr/bin/env python3
"""Build candidate lines, inject into generate-ingredient-list-1000.py, validate count."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / "generate-ingredient-list-1000.py"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s).strip()
    return re.sub(r"[（(].*?[）)]", "", s)


def load_existing() -> set[str]:
    names: set[str] = set()
    for path in ("ingredient-list-200.json", "ingredient-list-800-additions-full.json"):
        for item in json.loads((ROOT / path).read_text(encoding="utf-8")):
            names.add(norm(item["name"]))
    return names


def load_pool() -> list[tuple[str, str]]:
    from _candidates_data import CANDIDATES  # noqa: WPS433

    return CANDIDATES


def main() -> None:
    existing = load_existing()
    pool = load_pool()
    seen: set[str] = set()
    lines: list[str] = []
    for name, cat in pool:
        key = norm(name)
        if not key or key in existing or key in seen:
            continue
        seen.add(key)
        lines.append(f"{name}|{cat}")

    print(f"pool={len(pool)} unique_new={len(lines)} existing={len(existing)}")
    if len(lines) < 1000:
        raise SystemExit(f"Need at least 1000 new candidates, got {len(lines)}")

    text = TARGET.read_text(encoding="utf-8")
    block = "\n".join(lines)
    text = text.replace("__CANDIDATES_PLACEHOLDER__", block)
    TARGET.write_text(text, encoding="utf-8")
    print(f"Injected {len(lines)} candidate lines into {TARGET.name}")


if __name__ == "__main__":
    main()
