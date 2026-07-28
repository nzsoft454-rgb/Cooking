import type { Ingredient } from '../types';
import { attributeSortPriority } from './ingredientAttribute';

export type FridgeSortKey =
  | 'addedAsc'
  | 'addedDesc'
  | 'addedAscFreshFirst'
  | 'addedDescFreshFirst'
  | 'nameAsc'
  | 'nameDesc'
  | 'qtyAsc'
  | 'qtyDesc';

export const FRIDGE_SORT_KEYS: FridgeSortKey[] = [
  'addedAscFreshFirst',
  'addedDescFreshFirst',
  'addedAsc',
  'addedDesc',
  'nameAsc',
  'nameDesc',
  'qtyAsc',
  'qtyDesc',
];

function addedKey(addedDate: string, missing: string): string {
  return addedDate || missing;
}

function compareAttributeFirst(a: Ingredient, b: Ingredient): number {
  return attributeSortPriority(a.attribute) - attributeSortPriority(b.attribute);
}

export function sortFridgeIngredients(
  items: Ingredient[],
  sortKey: FridgeSortKey,
  locale: string = 'ja'
): Ingredient[] {
  const copy = [...items];

  switch (sortKey) {
    case 'addedAscFreshFirst':
      return copy.sort((a, b) => {
        const byAttr = compareAttributeFirst(a, b);
        if (byAttr !== 0) return byAttr;
        return addedKey(a.addedDate, '9999-12-31').localeCompare(
          addedKey(b.addedDate, '9999-12-31')
        );
      });
    case 'addedDescFreshFirst':
      return copy.sort((a, b) => {
        const byAttr = compareAttributeFirst(a, b);
        if (byAttr !== 0) return byAttr;
        return addedKey(b.addedDate, '0000-01-01').localeCompare(
          addedKey(a.addedDate, '0000-01-01')
        );
      });
    case 'addedAsc':
      return copy.sort((a, b) =>
        addedKey(a.addedDate, '9999-12-31').localeCompare(addedKey(b.addedDate, '9999-12-31'))
      );
    case 'addedDesc':
      return copy.sort((a, b) =>
        addedKey(b.addedDate, '0000-01-01').localeCompare(addedKey(a.addedDate, '0000-01-01'))
      );
    case 'nameAsc':
      return copy.sort((a, b) => a.name.localeCompare(b.name, locale));
    case 'nameDesc':
      return copy.sort((a, b) => b.name.localeCompare(a.name, locale));
    case 'qtyAsc':
      return copy.sort((a, b) => a.quantity - b.quantity);
    case 'qtyDesc':
      return copy.sort((a, b) => b.quantity - a.quantity);
    default:
      return copy;
  }
}

export function filterFridgeIngredientsByQuery(
  items: Ingredient[],
  query: string
): Ingredient[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items.filter((item) => item.name.toLowerCase().includes(q));
}
