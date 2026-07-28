/** 分析結果の数量文字列を冷蔵庫の残量比率 (0–1) に変換（モック用ヒューリスティック） */
export function parseQuantityRatio(quantity: string): number {
  const s = quantity.trim();
  if (!s) return 1;
  if (/半|half/i.test(s)) return 0.5;

  const fraction = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (fraction) {
    const num = parseFloat(fraction[1]);
    const den = parseFloat(fraction[2]);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den > 0) {
      return Math.min(1, Math.max(0, num / den));
    }
  }

  const withUnit = s.match(/(\d+(?:\.\d+)?)\s*(g|グラム|kg|キロ|ml|m[lL]|リットル|l|L|ℓ)/i);
  if (withUnit) {
    return 1;
  }

  const countUnit = s.match(/(\d+(?:\.\d+)?)\s*(個|本|袋|パック|束|枚)/);
  if (countUnit) {
    const n = parseFloat(countUnit[1]);
    if (!Number.isNaN(n) && n > 0) {
      return 1;
    }
  }

  const match = s.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 1;

  const n = parseFloat(match[1]);
  if (Number.isNaN(n) || n <= 0) return 1;
  if (n <= 1) return n;
  return 1;
}
