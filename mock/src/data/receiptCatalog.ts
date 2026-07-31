import { INGREDIENT_CATALOG } from './ingredientCatalog';

/** レシート照合対象の正規食材名一覧（200件） */
export const RECEIPT_CATALOG_NAMES = INGREDIENT_CATALOG.map((entry) => entry.name);

export const RECEIPT_CATALOG_COUNT = INGREDIENT_CATALOG.length;
