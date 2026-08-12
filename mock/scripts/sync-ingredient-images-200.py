#!/usr/bin/env python3
"""Fetch or compose ing_*.jpg for 200-item catalog (800x800, <=300KB)."""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"
META_PATH = Path(__file__).resolve().parent / "ingredient-catalog-full.json"
META_FALLBACK = Path(__file__).resolve().parent / "ingredient-catalog-200.json"

MAX_BYTES = 300 * 1024
TARGET = (800, 800)

CATEGORY_COLORS = {
    "grain": ("#F5E6C8", "#C4A35A"),
    "vegetable": ("#E8F5E9", "#4CAF50"),
    "meat": ("#FFEBEE", "#E57373"),
    "seafood": ("#E3F2FD", "#64B5F6"),
    "soy_dairy": ("#FFF8E1", "#FFB74D"),
    "fruit": ("#FCE4EC", "#F06292"),
    # Excel カテゴリ（プレースホルダー色）
    "調味料": ("#FFF3E0", "#FB8C00"),
    "スパイス": ("#FBE9E7", "#D84315"),
    "油脂": ("#FFFDE7", "#F9A825"),
    "乾物": ("#EFEBE9", "#8D6E63"),
    "缶詰": ("#ECEFF1", "#607D8B"),
    "加工食品": ("#F3E5F5", "#8E24AA"),
    "冷凍食品": ("#E1F5FE", "#039BE5"),
    "ベーカリー": ("#FFF8E1", "#FFB300"),
    "漬物": ("#F1F8E9", "#7CB342"),
    "飲料": ("#E0F7FA", "#00838F"),
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

# Reuse legacy assets when slug matches old catalog file
LEGACY_JPG = {
    "cabbage", "lettuce", "napa", "komatsuna", "spinach", "broccoli", "tomato",
    "cucumber", "eggplant", "green_pepper", "carrot", "daikon", "potato", "onion",
    "green_onion", "bean_sprout", "shiitake", "shimeji", "enoki", "apple", "banana",
    "mikan", "kiwi", "beef", "pork", "egg", "salmon", "tuna", "mackerel", "aji",
    "squid", "shrimp", "milk", "yogurt", "butter", "natto", "aburaage", "bread",
    "udon", "soba", "chinese_noodle", "pasta", "flour", "white_rice",
}

LEGACY_PNG = {
    "onion": "tamanegi_onion.png",
    "cucumber": "kyuuri_cucumber.png",
    "eggplant": "nasu_eggplant.png",
    "green_pepper": "piman_greenpepper.jpg",
    "spinach": "hourensou_spinach.jpg",
    "komatsuna": "hourensou_spinach.jpg",
    "daikon": "kabu_turnip.png",
    "carrot": "kabu_turnip.png",
    "potato": "kabu_turnip.png",
    "tomato": "sample_ingredient_300kb.jpg",
    "shiitake": "capture-erungi.png",
    "shimeji": "capture-erungi.png",
    "enoki": "capture-erungi.png",
    "okra": "okura_gombo.png",
}

# English search hints for Wikimedia (Japanese name appended in query)
SEARCH_HINTS: dict[str, str] = {
    "cabbage": "cabbage vegetable",
    "lettuce": "lettuce vegetable",
    "napa": "napa cabbage",
    "mini_tomato": "cherry tomato",
    "green_onion": "green onion scallion",
    "sweet_potato": "sweet potato",
    "lotus_root": "lotus root",
    "salmon_en": "salmon fish",
    "mixed_ground_meat": "ground meat",
    "white_rice": "white rice grain",
    "brown_rice": "brown rice",
    "mochi_rice": "glutinous rice",
    "french_bread": "baguette bread",
    "rice_noodle": "rice vermicelli",
    "harusame": "cellophane noodles",
    "rice_flour": "rice flour",
    "cream_cheese": "cream cheese",
    "cotton_tofu": "tofu block",
    "silken_tofu": "silken tofu",
    "koyadofu": "freeze dried tofu",
    "quail_egg": "quail eggs",
    "soy_milk": "soy milk",
    "fresh_cream": "whipping cream",
    "water_spinach": "water spinach",
    "shiitake": "shiitake mushroom",
    "shimeji": "shimeji mushroom",
    "enoki": "enoki mushroom",
    "eringi": "king oyster mushroom",
    "maitake": "maitake mushroom",
    "nameko": "nameko mushroom",
    "wood_ear": "wood ear mushroom",
    "matsutake": "matsutake mushroom",
    "edamame": "edamame",
    "mentaiko": "mentaiko",
    "kazunoko": "herring roe",
    "shirasu": "whitebait fish",
    "shishamo": "shishamo smelt",
    "sanma": "pacific saury",
    "kinmedai": "splendid alfonsino",
    "hamaguri": "clam",
    "mussel": "mussel shellfish",
    "wakame": "wakame seaweed",
    "kombu": "kombu kelp",
    "nori": "nori seaweed",
}


def unique_targets(meta: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []
    for e in meta:
        slug = e["imageFile"].replace("ing_", "").replace(".jpg", "")
        if slug in seen:
            continue
        seen.add(slug)
        out.append({**e, "slug": slug})
    return out


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


def center_crop_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def wikimedia_fetch(query: str, *, with_food_suffix: bool = True) -> Image.Image | None:
    search = f"{query} food" if with_food_suffix else query
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": search,
            "gsrnamespace": 6,
            "prop": "imageinfo",
            "iiprop": "url",
            "iiurlwidth": 900,
            "format": "json",
        }
    )
    api = f"https://commons.wikimedia.org/w/api.php?{params}"
    req = urllib.request.Request(api, headers={"User-Agent": "CookingMockIngredientBot/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        url = infos[0].get("thumburl") or infos[0].get("url")
        if not url:
            continue
        if not re.search(r"\.(jpg|jpeg|png|webp)($|\?)", url, re.I):
            continue
        img_req = urllib.request.Request(url, headers={"User-Agent": "CookingMockIngredientBot/1.0"})
        with urllib.request.urlopen(img_req, timeout=40) as img_resp:
            return Image.open(BytesIO(img_resp.read()))
    return None


def make_placeholder(name: str, entry: dict) -> Image.Image:
    label_category = entry.get("excelCategory") or entry.get("category") or "grain"
    bg, accent = CATEGORY_COLORS.get(label_category, ("#EEEEEE", "#888888"))
    img = Image.new("RGB", TARGET, bg)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((60, 60, 740, 740), radius=40, fill=accent)
    draw.ellipse((140, 140, 660, 660), fill=bg)
    label = name if len(name) <= 8 else name[:7] + "…"
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/meiryo.ttc", 56)
    except OSError:
        font = ImageFont.load_default()
    draw.text((400, 400), label, fill=accent, anchor="mm", font=font)
    return img


def resolve_source(slug: str, entry: dict) -> Image.Image | None:
    if slug in LEGACY_JPG:
        legacy = FOOD_DIR / f"ing_{slug}.jpg"
        if legacy.exists():
            return Image.open(legacy)

    png_name = LEGACY_PNG.get(slug)
    if png_name:
        p = FOOD_DIR / png_name
        if p.exists():
            return Image.open(p)

    queries = [
        SEARCH_HINTS.get(slug, slug.replace("_", " ")),
        entry["name"],
        f"{entry['name']} 食材",
    ]
    for q in queries:
        for with_suffix in (True, False):
            try:
                img = wikimedia_fetch(q, with_food_suffix=with_suffix)
                if img:
                    return center_crop_square(img)
            except Exception:
                pass
    return None


def main() -> None:
    import sys

    placeholders_only = "--placeholders-only" in sys.argv
    only_missing = "--only-missing" in sys.argv
    meta_path = META_PATH if META_PATH.exists() else META_FALLBACK
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    targets = unique_targets(meta)
    FOOD_DIR.mkdir(parents=True, exist_ok=True)
    sizes: dict[str, int] = {}
    stats = {"legacy": 0, "wiki": 0, "placeholder": 0, "skipped": 0}

    for i, entry in enumerate(targets, 1):
        slug = entry["slug"]
        dest = FOOD_DIR / f"ing_{slug}.jpg"
        if only_missing and dest.exists() and dest.stat().st_size > 35_000:
            sizes[slug] = dest.stat().st_size
            stats["skipped"] += 1
            continue
        if placeholders_only and dest.exists() and dest.stat().st_size > 35_000:
            sizes[slug] = dest.stat().st_size
            stats["skipped"] += 1
            continue

        src_img = resolve_source(slug, entry)
        source_type = "legacy"

        if src_img is None:
            try:
                src_img = wikimedia_fetch(entry["name"], with_food_suffix=False)
                source_type = "wiki"
            except Exception:
                src_img = None

        if src_img is None:
            src_img = make_placeholder(entry["name"], entry)
            source_type = "placeholder"

        size = save_under_limit(src_img, dest)
        sizes[slug] = size
        stats[source_type] += 1
        flag = "OK" if size <= MAX_BYTES else "OVER"
        print(f"[{i}/{len(targets)}] {flag} {dest.name} {size/1024:.1f}KB ({source_type})")
        time.sleep(0.35)

    manifest = {
        "files": {t["slug"]: t["imageFile"] for t in targets},
        "sizes": sizes,
    }
    (FOOD_DIR / "ingredient_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("stats", stats)


if __name__ == "__main__":
    main()
