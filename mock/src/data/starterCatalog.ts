import { INGREDIENT_CATALOG, type IngredientCatalogEntry } from './ingredientCatalog';

/** 初回用の定番食材（カタログ id） */
export const STARTER_CATALOG_IDS = [
  'onion',
  'potato',
  'carrot',
  'green_onion',
  'cabbage',
  'tomato',
  'bean_sprout',
  'spinach',
  'egg',
  'cotton_tofu',
  'natto',
  'chicken_thigh',
  'pork',
  'garlic',
  'white_rice',
] as const;

const catalogById = new Map(INGREDIENT_CATALOG.map((entry) => [entry.id, entry]));

export function getCatalogEntryById(id: string): IngredientCatalogEntry | undefined {
  return catalogById.get(id);
}

export function getStarterCatalogEntries(): IngredientCatalogEntry[] {
  return STARTER_CATALOG_IDS.map((id) => catalogById.get(id)).filter(
    (entry): entry is IngredientCatalogEntry => entry != null
  );
}
