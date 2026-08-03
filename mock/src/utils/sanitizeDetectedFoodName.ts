const MAX_FOOD_NAME_LEN = 20;

/** 英語ラベル・OCR ノイズとみなす短い単語（プロンプト漏れ等） */
const GARBAGE_TOKENS = new Set([
  'bundle',
  'span',
  'boundary',
  'text',
  'field',
  'fill',
  'type',
  'match',
  'output',
  'requirement',
  'specify',
  'standard',
  'parse',
  'pattern',
  'count',
  'label',
  'tag',
  'clear',
  'list',
  'map',
  'format',
  'style',
  'name',
  'base',
  'area',
  'group',
]);

function latinRatio(text: string): number {
  if (!text) return 0;
  const latin = text.match(/[a-zA-Z]/g)?.length ?? 0;
  return latin / text.length;
}

function isLikelyLabelNoise(name: string): boolean {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  const garbageHits = words.filter((w) =>
    GARBAGE_TOKENS.has(w.toLowerCase().replace(/[^a-z]/g, '')),
  ).length;

  if (garbageHits >= 2) return true;

  const allShortLatin =
    words.length >= 5 &&
    words.every((w) => w.length <= 14 && /^[a-zA-Z0-9_-]+$/.test(w));

  return allShortLatin && latinRatio(name) > 0.85;
}

/** Gemini 返却 name を表示・保存向けに整形。ノイズなら null */
export function sanitizeDetectedFoodName(raw: string): string | null {
  let name = raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[\n\r|/\\]+/)[0]
    ?.trim();

  if (!name) return null;
  if (isLikelyLabelNoise(name)) return null;

  if (latinRatio(name) > 0.6 && name.length > 16) {
    name = name.split(/\s+/).slice(0, 2).join(' ').trim();
  }

  if (name.length > MAX_FOOD_NAME_LEN) {
    name = `${name.slice(0, MAX_FOOD_NAME_LEN).trim()}…`;
  }

  return name || null;
}
