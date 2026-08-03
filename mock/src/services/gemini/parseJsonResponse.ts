import { GeminiParseError } from './errors';

export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }
  return trimmed;
}

export function parseJsonResponse<T>(raw: string): T {
  const jsonText = extractJsonText(raw);
  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new GeminiParseError('Invalid JSON in Gemini response');
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

/** 食材解析: items / ingredients 等の揺れを吸収 */
export function extractItemArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;

  const record = asRecord(parsed);
  if (!record) return [];

  for (const key of ['items', 'ingredients', 'detectedItems', 'food_items', 'foods']) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

/** レシート解析: rawName / raw_name 等の揺れを吸収 */
export function normalizeReceiptFields(raw: unknown): { rawName?: string; quantity?: string } {
  const record = asRecord(raw);
  if (!record) return {};

  return {
    rawName: pickString(record, ['rawName', 'raw_name', 'name', 'productName', 'product_name', 'item']),
    quantity: pickString(record, ['quantity', 'qty', 'amount', 'count']),
  };
}

/** 食材写真: name / ingredient 等の揺れを吸収 */
export function normalizeFoodFields(raw: unknown): {
  name?: string;
  quantity?: string;
  confidence?: string;
  attribute?: string;
  box2d?: unknown;
} {
  const record = asRecord(raw);
  if (!record) return {};

  return {
    name: pickString(record, ['name', 'ingredient', 'food', 'label', 'item']),
    quantity: pickString(record, ['quantity', 'qty', 'amount']),
    confidence: pickString(record, ['confidence', 'certainty']),
    attribute: pickString(record, ['attribute', 'category', 'type']),
    box2d: record.box_2d ?? record.box2d ?? record.box,
  };
}
