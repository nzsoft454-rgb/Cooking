/** Gemini API 設定（キーは EXPO_PUBLIC_GEMINI_API_KEY で注入） */

const DEFAULT_VISION_MODEL = 'gemini-3.6-flash';
const DEFAULT_TEXT_MODEL = 'gemini-3.6-flash';

/** 404 時に順に試すフォールバックモデル */
export const GEMINI_MODEL_FALLBACKS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
] as const;

const DEFAULT_FETCH_TIMEOUT_MS = 180_000;

export function getGeminiFetchTimeoutMs(): number {
  const raw = process.env.EXPO_PUBLIC_GEMINI_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_FETCH_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 30_000 ? parsed : DEFAULT_FETCH_TIMEOUT_MS;
}

/** Gemini 3.x は thinkingLevel、2.5 系は thinkingBudget=0 で応答を高速化 */
export function buildGeminiThinkingConfig(
  model: string,
): Record<string, unknown> | undefined {
  const lower = model.toLowerCase();
  if (/gemini-3(?:\.\d+)?-/.test(lower) || lower.includes('gemini-3-flash')) {
    return { thinkingLevel: 'minimal' };
  }
  if (lower.includes('gemini-2.5')) {
    return { thinkingBudget: 0 };
  }
  return undefined;
}

export function getGeminiApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  return key || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiVisionModel(): string {
  return process.env.EXPO_PUBLIC_GEMINI_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;
}

export function getGeminiTextModel(): string {
  return process.env.EXPO_PUBLIC_GEMINI_TEXT_MODEL?.trim() || DEFAULT_TEXT_MODEL;
}

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
