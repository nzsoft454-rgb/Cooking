import { INGREDIENT_CATALOG, type IngredientCatalogEntry } from '../data/ingredientCatalog';

const aliasIndex = new Map<string, IngredientCatalogEntry>();

for (const entry of INGREDIENT_CATALOG) {
  registerAlias(entry.name, entry);
  for (const alias of entry.aliases) {
    registerAlias(alias, entry);
  }
}

function registerAlias(label: string, entry: IngredientCatalogEntry) {
  const key = normalizeKey(label);
  if (!key) return;
  const existing = aliasIndex.get(key);
  if (!existing || entry.name.length >= existing.name.length) {
    aliasIndex.set(key, entry);
  }
}

/** 比較用に名前を正規化 */
export function normalizeIngredientKey(name: string): string {
  return normalizeKey(stripReceiptNoise(name));
}

const RECEIPT_PREFIXES = [
  '国産',
  '国内',
  '輸入',
  '冷凍',
  '解凍',
  '有機',
  '特選',
  '厳選',
  '新鮮',
  '新',
  '特',
  '大',
  '中',
  '小',
  '約',
  'カット',
  '切',
  'スライス',
  '袋',
  'パック',
  '束',
  '株',
  '枚',
];

/** レシート表記のノイズを除去 */
export function stripReceiptNoise(raw: string): string {
  let text = raw.normalize('NFKC').trim();
  for (let i = 0; i < 3; i += 1) {
    const next = RECEIPT_PREFIXES.reduce(
      (value, prefix) => (value.startsWith(prefix) ? value.slice(prefix.length).trim() : value),
      text
    );
    if (next === text) break;
    text = next;
  }
  return text.replace(/[（(].*?[）)]/g, '').trim();
}

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[(*\d).,円¥￥/\\\-×x×ｇｋｇｍｌ％%]+/gi, '')
    .replace(/[pPkKｐＰ]/g, '')
    .replace(/[コ個本枚尾匹杯束株]/g, '')
    .trim();
}

function matchScore(queryKey: string, candidate: string): number {
  const candidateKey = normalizeKey(candidate);
  if (!candidateKey || candidateKey.length < 2) return 0;
  if (queryKey === candidateKey) return candidateKey.length + 1000;
  if (queryKey.includes(candidateKey)) return candidateKey.length;
  if (candidateKey.includes(queryKey) && queryKey.length >= 2) return queryKey.length;
  return 0;
}

/** レシート品名からカタログエントリを解決（最長一致優先） */
export function resolveCatalogEntry(name: string): IngredientCatalogEntry | null {
  const key = normalizeIngredientKey(name);
  if (!key) return null;

  const exact = aliasIndex.get(key);
  if (exact) return exact;

  let best: { entry: IngredientCatalogEntry; score: number } | null = null;
  for (const entry of INGREDIENT_CATALOG) {
    for (const candidate of [entry.name, ...entry.aliases]) {
      const score = matchScore(key, candidate);
      if (score > 0 && (!best || score > best.score)) {
        best = { entry, score };
      }
    }
  }

  return best?.entry ?? null;
}

/** 画像ファイル id（カタログ id からのエイリアス） */
const IMAGE_ID_ALIASES: Record<string, string> = {
  edamame_dup: 'edamame',
  pork_offcuts: 'pork',
  fish_fillet: 'salmon',
  dango: 'mochi_rice',
};

export function catalogEntryToImageId(catalogId: string): string {
  return IMAGE_ID_ALIASES[catalogId] ?? catalogId;
}

/** 冷蔵庫表示用 imageUrl（asset://ing_tomato 形式） */
export function resolveIngredientImageUrl(name: string): string {
  const entry = resolveCatalogEntry(name);
  if (!entry) return '';
  return `asset://ing_${catalogEntryToImageId(entry.id)}`;
}

export function isKnownReceiptIngredient(name: string): boolean {
  return resolveCatalogEntry(name) != null;
}

export type ReceiptMatchResult = {
  rawName: string;
  entry: IngredientCatalogEntry | null;
  resolvedName: string;
  imageUrl: string;
  known: boolean;
};

/** レシート1行をカタログに照合 */
export function matchReceiptLine(rawName: string): ReceiptMatchResult {
  const entry = resolveCatalogEntry(rawName);
  const resolvedName = entry?.name ?? rawName.trim();
  const imageUrl = entry ? resolveIngredientImageUrl(rawName) : '';
  return {
    rawName,
    entry,
    resolvedName,
    imageUrl,
    known: entry != null,
  };
}
