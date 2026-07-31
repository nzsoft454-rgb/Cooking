/** Gemini API 設定（キーは EXPO_PUBLIC_GEMINI_API_KEY で注入） */

const DEFAULT_VISION_MODEL = 'gemini-3.6-flash';
const DEFAULT_TEXT_MODEL = 'gemini-3.6-flash';

/** 404 時に順に試すフォールバックモデル */
export const GEMINI_MODEL_FALLBACKS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
] as const;

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
