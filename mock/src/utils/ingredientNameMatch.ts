/** 括弧付き表記を除いた食材名の正規化 */
export function normalizeIngredientName(name: string): string {
  return name.split('（')[0]?.trim() ?? name.trim();
}

/** レシピの材料名と冷蔵庫食材名が同一品目か（部分一致ではなく正規化名の一致） */
export function ingredientNamesMatch(fridgeName: string, recipeName: string): boolean {
  const a = normalizeIngredientName(fridgeName);
  const b = normalizeIngredientName(recipeName);
  if (!a || !b) return false;
  return a === b;
}
