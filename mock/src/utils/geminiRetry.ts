import {
  GeminiApiError,
  GeminiImageReadError,
  GeminiParseError,
} from '../services/gemini/errors';

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableGeminiError(error: unknown): boolean {
  if (error instanceof GeminiApiError) {
    return RETRYABLE_STATUS.has(error.status);
  }
  if (error instanceof GeminiParseError) return true;
  if (error instanceof GeminiImageReadError) {
    return /timed out/i.test(error.message);
  }
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 切り抜き成功率が低い場合に再解析する */
export function needsCropRetry(
  items: Array<{ imageUrl?: string; box2d?: unknown }>,
  fallbackImageUrl: string,
): boolean {
  if (items.length === 0) return false;
  const withBox = items.filter((item) => item.box2d != null).length;
  if (withBox === 0) return true;

  const cropped = items.filter(
    (item) =>
      item.box2d != null &&
      item.imageUrl &&
      item.imageUrl !== fallbackImageUrl,
  ).length;

  return cropped / items.length < 0.5;
}
