import { INGREDIENT_CATALOG, type IngredientCatalogEntry } from '../data/ingredientCatalog';

const aliasIndex = new Map<string, IngredientCatalogEntry>();

for (const entry of INGREDIENT_CATALOG) {
  aliasIndex.set(normalizeKey(entry.name), entry);
  for (const alias of entry.aliases) {
    aliasIndex.set(normalizeKey(alias), entry);
  }
}

/** 比較用に名前を正規化 */
export function normalizeIngredientKey(name: string): string {
  return normalizeKey(name);
}

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[(*\d).,円¥￥/\\-]+/g, '')
    .trim();
}

/** レシート品名からカタログエントリを解決 */
export function resolveCatalogEntry(name: string): IngredientCatalogEntry | null {
  const key = normalizeKey(name);
  if (!key) return null;

  const exact = aliasIndex.get(key);
  if (exact) return exact;

  for (const entry of INGREDIENT_CATALOG) {
    const entryKey = normalizeKey(entry.name);
    if (key.includes(entryKey) || entryKey.includes(key)) return entry;
    for (const alias of entry.aliases) {
      const aliasKey = normalizeKey(alias);
      if (key.includes(aliasKey) || aliasKey.includes(key)) return entry;
    }
  }

  return null;
}

/** 冷蔵庫表示用 imageUrl（asset://ing_tomato 形式） */
export function resolveIngredientImageUrl(name: string): string {
  const entry = resolveCatalogEntry(name);
  if (!entry) return '';
  return `asset://ing_${entry.id}`;
}

export function isKnownReceiptIngredient(name: string): boolean {
  return resolveCatalogEntry(name) != null;
}
