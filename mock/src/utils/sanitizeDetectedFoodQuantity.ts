const MAX_QUANTITY_LEN = 12;
const DEFAULT_QUANTITY = '適量';

/** 「1束1束1束…」のような繰り返しを1単位に畳む */
function collapseRepetition(text: string): string {
  const compact = text.replace(/\s+/g, '');
  const match = compact.match(/^(.{1,8}?)\1{2,}$/);
  return match ? match[1] : compact;
}

/** 長文から最初の数量表現を抽出 */
function extractQuantityToken(text: string): string | null {
  const match = text.match(
    /(\d+(?:\.\d+)?\s*(?:個|本|袋|パック|束|枚|g|グラム|kg|キロ|ml|m[lL]|リットル|l|L|ℓ)|適量|半分|少量)/,
  );
  if (!match) return null;
  return match[1].replace(/\s+/g, '');
}

function isReasonableQuantity(text: string): boolean {
  if (!text || text.length > MAX_QUANTITY_LEN) return false;
  if (/[a-zA-Z]{4,}/.test(text)) return false;
  if (/[。、・\n\r]/.test(text)) return false;
  return /^[\d./適量半分少量個本袋パック束枚gグラムkgキロmlリットルlLℓ]+$/u.test(text);
}

/** Gemini 返却 quantity を短い表示用に整形 */
export function sanitizeDetectedFoodQuantity(
  raw: string | undefined,
  fallback: string = DEFAULT_QUANTITY,
): string {
  if (!raw?.trim()) return fallback;

  let text = raw.trim().replace(/\s+/g, ' ');
  text = text.split(/[\n\r]+/)[0]?.trim() ?? text;

  if (text.length > MAX_QUANTITY_LEN * 3) {
    const token = extractQuantityToken(text);
    if (token) return token.slice(0, MAX_QUANTITY_LEN);
    return fallback;
  }

  text = collapseRepetition(text.replace(/\s+/g, ''));

  if (isReasonableQuantity(text)) return text;

  const token = extractQuantityToken(text);
  if (token && isReasonableQuantity(token)) return token;

  return fallback;
}

/** UI 表示用（二重の安全策） */
export function displayQuantity(raw: string, fallback: string = DEFAULT_QUANTITY): string {
  return sanitizeDetectedFoodQuantity(raw, fallback);
}
