/** ローカルタイムゾーンの YYYY-MM-DD（Gemini 日次リセット・賞味期限判定で共用） */
export function localTodayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addLocalDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return localTodayKey(d);
}
