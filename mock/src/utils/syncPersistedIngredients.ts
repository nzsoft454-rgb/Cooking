import type { NewIngredientInput } from '../store/AppContext';
import type { Ingredient } from '../types';

/** 初回は追加、2回目以降は既存 ID を更新（編集後の二重登録を防ぐ） */
export function syncPersistedIngredients(
  payloads: NewIngredientInput[],
  saved: Ingredient[] | null,
  addIngredients: (items: NewIngredientInput[]) => Ingredient[],
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void,
  softDeleteIngredient: (id: string) => void
): Ingredient[] {
  if (!saved?.length) {
    return addIngredients(payloads);
  }

  const now = new Date().toISOString();
  const next: Ingredient[] = [];

  for (let i = 0; i < payloads.length; i++) {
    if (i < saved.length) {
      updateIngredient(saved[i].id, payloads[i]);
      next.push({ ...saved[i], ...payloads[i], updatedAt: now });
    }
  }

  if (payloads.length > saved.length) {
    next.push(...addIngredients(payloads.slice(saved.length)));
  }

  for (let i = payloads.length; i < saved.length; i++) {
    softDeleteIngredient(saved[i].id);
  }

  return next;
}
