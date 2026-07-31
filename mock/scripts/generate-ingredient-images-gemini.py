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
META_PATH = Path(__file__).resolve().parent / "ingredient-catalog-200.json"
ENV_PATH = ROOT / ".env"
PROGRESS_PATH = Path(__file__).resolve().parent / "ingredient-image-progress.json"

MAX_BYTES = 300 * 1024
TARGET_SIZE = (800, 800)

IMAGE_MODELS = [
    "gemini-2.0-flash-preview-image-generation",
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
]

PROMPT = (
    "Professional food product photo of {name} (Japanese ingredient). "
    "Single ingredient only, centered on a clean white plate or neutral surface. "
    "Soft natural lighting, realistic, appetizing, no text, no watermark, no people, no packaging labels."
)


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


def request_image(api_key: str, model: str, name: str) -> bytes | None:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    body = {
        "contents": [{"role": "user", "parts": [{"text": PROMPT.format(name=name)}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
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


def generate_with_fallback(api_key: str, name: str) -> tuple[bytes | None, str | None]:
    last_err = None
    for model in IMAGE_MODELS:
        try:
            data = request_image(api_key, model, name)
            if data:
                return data, model
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            last_err = f"{model}: HTTP {exc.code} {detail[:200]}"
        except Exception as exc:  # noqa: BLE001
            last_err = f"{model}: {exc}"
        time.sleep(1.5)
    return None, last_err


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


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    limit = int(args[0]) if args else 0
    force = "--force" in sys.argv
    placeholders_only = "--all" not in sys.argv

    api_key = load_api_key()
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    targets = unique_image_targets(meta)
    progress = load_progress()
    sizes: dict[str, int] = {}

    if not META_PATH.exists():
        raise SystemExit("Run build-ingredient-catalog-200.py first")

    attempted = 0
    for entry in targets:
        slug = entry["imageSlug"]
        dest = FOOD_DIR / f"ing_{slug}.jpg"

        if placeholders_only and not is_placeholder(dest) and not force:
            if dest.exists():
                sizes[slug] = dest.stat().st_size
            continue

        if dest.exists() and not force and slug in progress.get("done", {}):
            sizes[slug] = dest.stat().st_size
            continue
        if limit and attempted >= limit:
            break

        name = entry["name"]
        print(f"generating {slug} ({name})...", flush=True)
        raw, info = generate_with_fallback(api_key, name)
        attempted += 1
        if not raw:
            progress.setdefault("errors", {})[slug] = info or "unknown"
            save_progress(progress)
            print(f"  FAIL {info}", flush=True)
            if "429" in (info or ""):
                print("quota exceeded; stopping batch", flush=True)
                break
            continue

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
