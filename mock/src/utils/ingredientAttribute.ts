import type { IngredientAttribute } from '../types';
import type { IngredientCatalogEntry, IngredientCategory } from '../data/ingredientCatalog';
import { resolveCatalogEntry } from './resolveIngredientImage';

export const INGREDIENT_ATTRIBUTES: IngredientAttribute[] = [
  'fresh',
  'processed',
  'other',
];

export function getDefaultIngredientAttribute(): IngredientAttribute {
  return 'fresh';
}

export function normalizeIngredientAttribute(value: unknown): IngredientAttribute {
  if (value === 'fresh' || value === 'processed' || value === 'other') return value;
  return getDefaultIngredientAttribute();
}

/** ソート: 生鮮 → 加工品 → その他 */
export function attributeSortPriority(attribute: IngredientAttribute): number {
  switch (attribute) {
    case 'fresh':
      return 0;
    case 'processed':
      return 1;
    case 'other':
      return 2;
    default:
      return 0;
  }
}

export function attributeI18nKey(attribute: IngredientAttribute): string {
  return `ingredientAttribute.${attribute}`;
}

export function attributeShortI18nKey(attribute: IngredientAttribute): string {
  return `ingredientAttribute.short.${attribute}`;
}

const PROCESSED_KEYWORDS = [
  '缶',
  'ハム',
  'ベーコン',
  'ソーセージ',
  'ウインナー',
  'チーズ',
  'バター',
  '油揚',
  '竹輪',
  'ちくわ',
  '納豆',
  'ヨーグルト',
  '冷凍',
  'パン',
  'パスタ',
  'うどん',
  'そば',
  '中華麺',
  '麺',
  'ツナ',
];

const OTHER_KEYWORDS = [
  '米',
  'こめ',
  '小麦粉',
  '薄力粉',
  '強力粉',
  '醤油',
  '味噌',
  '塩',
  '胡椒',
  'だし',
  '調味',
  'スパイス',
  'オイル',
  '食用油',
  'サラダ油',
  'ごま油',
  '砂糖',
  '酢',
];

function catalogEntryToAttribute(entry: IngredientCatalogEntry): IngredientAttribute {
  return mapCatalogCategoryToAttribute(entry.category, entry.id);
}

function mapCatalogCategoryToAttribute(
  category: IngredientCategory,
  id: string
): IngredientAttribute {
  if (id === 'canned_tuna' || id === 'chikuwa') return 'processed';
  if (category === 'grain') return 'other';
  if (category === 'soy_dairy') {
    return id === 'tofu' ? 'fresh' : 'processed';
  }
  return 'fresh';
}

/** モック: 名称から属性を推定 */
export function guessIngredientAttribute(name: string): IngredientAttribute {
  const entry = resolveCatalogEntry(name);
  if (entry) return catalogEntryToAttribute(entry);

  const normalized = name.trim();
  if (!normalized) return getDefaultIngredientAttribute();

  if (PROCESSED_KEYWORDS.some((kw) => normalized.includes(kw))) return 'processed';
  if (OTHER_KEYWORDS.some((kw) => normalized.includes(kw))) return 'other';
  return 'fresh';
}

/** カタログ優先で属性を解決 */
export function resolveIngredientAttribute(name: string): IngredientAttribute {
  return guessIngredientAttribute(name);
}

/** @deprecated 旧 storageType からの移行用（読み込み時のみ） */
export function attributeFromLegacyStorageType(
  storageType: unknown
): IngredientAttribute | null {
  if (storageType === 'frozen') return 'processed';
  if (storageType === 'room') return 'other';
  if (storageType === 'fridge' || storageType === 'refrigerated') return 'fresh';
  return null;
}
