import re
from pathlib import Path

# catalog id -> image file slug (when image is shared)
IMAGE_ID_ALIASES = {
    "edamame_dup": "edamame",
}

root = Path(__file__).resolve().parents[1]
text = (root / "src/data/ingredientCatalog.ts").read_text(encoding="utf-8")
ids = re.findall(r"id: '([^']+)'", text)
lines = [
    "import { ImageSourcePropType } from 'react-native';",
    "",
    "/** レシート対応食材画像（ing_*.jpg） */",
    "export const INGREDIENT_IMAGES: Record<string, ImageSourcePropType> = {",
]
seen_files: set[str] = set()
for i in ids:
    file_slug = IMAGE_ID_ALIASES.get(i, i)
    asset_key = f"asset://ing_{file_slug}"
    if asset_key in seen_files:
        continue
    seen_files.add(asset_key)
    lines.append(
        f"  '{asset_key}': require('../../assets/food/ing_{file_slug}.jpg'),"
    )
lines.append("};")
lines.append("")
(root / "src/data/ingredientImages.ts").write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {len(seen_files)} entries")
