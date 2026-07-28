/** 冷蔵庫カード初回入場アニメーション済み ID（デモリセット時にクリア） */
const enteredCardIds = new Set<string>();

export function markFridgeCardEntered(id: string): boolean {
  if (enteredCardIds.has(id)) return false;
  enteredCardIds.add(id);
  return true;
}

export function hasFridgeCardEntered(id: string): boolean {
  return enteredCardIds.has(id);
}

export function resetFridgeCardEnterAnimation(): void {
  enteredCardIds.clear();
}
