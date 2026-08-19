#!/usr/bin/env python3
"""Generate ing_*.jpg food photos via Gemini Image API (<=300KB, 800x800)."""
from __future__ import annotations

import base64
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOOD_DIR = ROOT / "assets" / "food"
META_PATH = Path(__file__).resolve().parent / "ingredient-catalog-full.json"
META_FALLBACK = Path(__file__).resolve().parent / "ingredient-catalog-200.json"
ENV_PATH = ROOT / ".env"
PROGRESS_PATH = Path(__file__).resolve().parent / "ingredient-image-progress.json"

MAX_BYTES = 300 * 1024
TARGET_SIZE = (800, 800)

IMAGE_MODELS = [
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-preview-image-generation",
]

PROMPT = (
    "Professional food photography of raw {name} ({category_hint}). "
    "Japanese cooking ingredient. Single ingredient only, no dish, no recipe. "
    "Centered on clean white plate or light marble. Soft natural lighting, photorealistic. "
    "No text, no logo, no people, no packaging. "
    "Avoid cooked meal, soup, bento, illustration."
)

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

INTERNAL_CATEGORY_HINTS: dict[str, str] = {
    "vegetable": CATEGORY_HINTS["野菜"],
    "meat": CATEGORY_HINTS["肉類"],
    "seafood": CATEGORY_HINTS["魚介類"],
    "fruit": CATEGORY_HINTS["果物"],
    "soy_dairy": "Soy or dairy ingredient without branded packaging.",
    "grain": CATEGORY_HINTS["穀物・麺"],
}

DEFAULT_CATEGORY_HINT = "Japanese cooking ingredient as sold for home cooking."


def category_hint_for(entry: dict) -> str:
    excel_cat = (entry.get("excelCategory") or "").strip()
    if excel_cat in CATEGORY_HINTS:
        return CATEGORY_HINTS[excel_cat]
    internal = (entry.get("category") or "").strip()
    return INTERNAL_CATEGORY_HINTS.get(internal, DEFAULT_CATEGORY_HINT)


def build_prompt(entry: dict) -> str:
    return PROMPT.format(name=entry["name"], category_hint=category_hint_for(entry))


def load_api_key() -> str:
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"].strip()
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("EXPO_PUBLIC_GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("GEMINI_API_KEY not found (.env or env var)")


def unique_image_targets(meta: list[dict]) -> list[dict]:
    seen: set[str] = set()
    targets: list[dict] = []
    for entry in meta:
        slug = entry["imageFile"].replace("ing_", "").replace(".jpg", "")
        if slug in seen:
            continue
        seen.add(slug)
        targets.append({**entry, "imageSlug": slug})
    return targets


def save_under_limit(img: Image.Image, dest: Path) -> int:
    img = img.convert("RGB")
    if img.size != TARGET_SIZE:
        img = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

    best_q = 85
    best_size = 0
    for q in range(45, 96):
        img.save(dest, "JPEG", quality=q, optimize=True)
        size = dest.stat().st_size
        if size <= MAX_BYTES:
            best_q = q
            best_size = size
        elif best_size:
            break

    if not best_size:
        for q in range(44, 24, -5):
            img.save(dest, "JPEG", quality=q, optimize=True)
            size = dest.stat().st_size
            if size <= MAX_BYTES:
                best_q = q
                best_size = size
                break

    img.save(dest, "JPEG", quality=best_q, optimize=True)
    return dest.stat().st_size


def request_image(api_key: str, model: str, prompt: str) -> bytes | None:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {"aspectRatio": "1:1"},
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if not inline:
            continue
        data = inline.get("data")
        if data:
            return base64.b64decode(data)
    return None


def generate_with_fallback(api_key: str, prompt: str) -> tuple[bytes | None, str | None]:
    errors: list[str] = []
    for model in IMAGE_MODELS:
        for attempt in range(4):
            try:
                data = request_image(api_key, model, prompt)
                if data:
                    return data, model
                errors.append(f"{model}: no image in response")
                break
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")
                msg = f"{model}: HTTP {exc.code} {detail[:160]}"
                errors.append(msg)
                if exc.code == 429 and attempt < 3:
                    wait = 30 * (2**attempt)
                    print(f"    rate limit, retry in {wait}s...", flush=True)
                    time.sleep(wait)
                    continue
                break
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{model}: {exc}")
                break
            time.sleep(1.5)
    return None, "; ".join(errors[-2:])


def load_progress() -> dict:
    if PROGRESS_PATH.exists():
        return json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
    return {"done": {}, "errors": {}}


def save_progress(progress: dict) -> None:
    PROGRESS_PATH.write_text(
        json.dumps(progress, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def write_manifest(targets: list[dict], sizes: dict[str, int]) -> None:
    files = {t["imageSlug"]: t["imageFile"] for t in targets}
    manifest = {"files": files, "sizes": sizes}
    (FOOD_DIR / "ingredient_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )


PLACEHOLDER_MAX_BYTES = 35_000


def is_placeholder(path: Path) -> bool:
    return path.exists() and path.stat().st_size <= PLACEHOLDER_MAX_BYTES


def needs_generation(dest: Path, *, force: bool) -> bool:
    if force:
        return True
    if not dest.exists():
        return True
    return is_placeholder(dest)


def check_quota(api_key: str) -> bool:
    print("checking image generation quota...", flush=True)
    raw, info = generate_with_fallback(api_key, build_prompt({"name": "りんご", "excelCategory": "果物"}))
    if raw:
        print("quota OK (test image generated)", flush=True)
        return True
    print(f"quota check failed: {info}", flush=True)
    return False


def load_slug_filter() -> set[str] | None:
    if "--excel1000" in sys.argv:
        slug_path = Path(__file__).resolve().parent / "ingredient-excel1000-slugs.json"
        if not slug_path.exists():
            raise SystemExit("Run build-ingredient-catalog-merge-excel.py first")
        rows = json.loads(slug_path.read_text(encoding="utf-8"))
        return {row["slug"] for row in rows}
    for arg in sys.argv[1:]:
        if arg.startswith("--slugs-file="):
            slug_path = Path(arg.split("=", 1)[1])
            rows = json.loads(slug_path.read_text(encoding="utf-8"))
            if rows and isinstance(rows[0], dict):
                return {row["slug"] for row in rows}
            return set(rows)
    return None


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    limit = int(args[0]) if args else 0
    force = "--force" in sys.argv
    # デフォルト: プレースホルダー + 未生成のみ（既存の実写真はスキップ）
    replace_only = "--all" not in sys.argv

    api_key = load_api_key()
    if "--check-quota" in sys.argv:
        raise SystemExit(0 if check_quota(api_key) else 1)
    meta_path = META_PATH if META_PATH.exists() else META_FALLBACK
    if not meta_path.exists():
        raise SystemExit("Run build-ingredient-catalog-merge-excel.py first")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    slug_filter = load_slug_filter()
    if slug_filter is not None:
        meta = [e for e in meta if e["imageFile"].replace("ing_", "").replace(".jpg", "") in slug_filter]
        print(f"slug filter: {len(slug_filter)} -> {len(meta)} targets", flush=True)
    targets = unique_image_targets(meta)
    progress = load_progress()
    sizes: dict[str, int] = {}

    pending = [
        e
        for e in targets
        if needs_generation(FOOD_DIR / f"ing_{e['imageSlug']}.jpg", force=force)
        and (
            force
            or e["imageSlug"] not in progress.get("done", {})
            or is_placeholder(FOOD_DIR / f"ing_{e['imageSlug']}.jpg")
        )
    ]
    if replace_only:
        pending = [
            e
            for e in pending
            if needs_generation(FOOD_DIR / f"ing_{e['imageSlug']}.jpg", force=force)
        ]
    print(f"targets: {len(targets)}, pending gemini: {len(pending)}", flush=True)

    attempted = 0
    consecutive_429 = 0
    for entry in targets:
        slug = entry["imageSlug"]
        dest = FOOD_DIR / f"ing_{slug}.jpg"

        if replace_only and not needs_generation(dest, force=force):
            if dest.exists():
                sizes[slug] = dest.stat().st_size
            continue

        if dest.exists() and not force and slug in progress.get("done", {}):
            if not is_placeholder(dest):
                sizes[slug] = dest.stat().st_size
                continue
        if limit and attempted >= limit:
            break

        name = entry["name"]
        prompt = build_prompt(entry)
        print(f"[{attempted + 1}/{len(pending) if limit else '?'}] generating {slug} ({name})...", flush=True)
        raw, info = generate_with_fallback(api_key, prompt)
        attempted += 1
        if not raw:
            progress.setdefault("errors", {})[slug] = info or "unknown"
            save_progress(progress)
            print(f"  FAIL {info}", flush=True)
            if "429" in (info or ""):
                consecutive_429 += 1
                if consecutive_429 >= 5:
                    print("too many 429 errors; stopping batch (quota or rate limit)", flush=True)
                    break
                print("waiting 60s before next item...", flush=True)
                time.sleep(60)
            else:
                consecutive_429 = 0
            continue

        consecutive_429 = 0
        img = Image.open(BytesIO(raw))
        size = save_under_limit(img, dest)
        sizes[slug] = size
        progress.setdefault("done", {})[slug] = {
            "model": info,
            "bytes": size,
            "name": name,
        }
        progress.get("errors", {}).pop(slug, None)
        save_progress(progress)
        flag = "OK" if size <= MAX_BYTES else "OVER"
        print(f"  {flag} {dest.name} {size/1024:.1f}KB via {info}", flush=True)
        time.sleep(2)

    # fill sizes for existing files
    for entry in targets:
        slug = entry["imageSlug"]
        dest = FOOD_DIR / f"ing_{slug}.jpg"
        if dest.exists():
            sizes[slug] = dest.stat().st_size

    write_manifest(targets, sizes)
    done = len([s for s in sizes if (FOOD_DIR / f"ing_{s}.jpg").exists()])
    print(f"manifest updated ({done}/{len(targets)} images)")


if __name__ == "__main__":
    main()
