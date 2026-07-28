import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
text = (root / "src/data/ingredientCatalog.ts").read_text(encoding="utf-8")
ids = re.findall(r"id: '([^']+)'", text)
lines = [
    "import { ImageSourcePropType } from 'react-native';",
    "",
    "/** レシート対応食材画像（ing_*.jpg） */",
    "export const INGREDIENT_IMAGES: Record<string, ImageSourcePropType> = {",
]
for i in ids:
    lines.append(f"  'asset://ing_{i}': require('../../assets/food/ing_{i}.jpg'),")
lines.append("};")
lines.append("")
(root / "src/data/ingredientImages.ts").write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {len(ids)} entries")
