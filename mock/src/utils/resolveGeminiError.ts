import {
  GeminiApiError,
  GeminiEmptyResultError,
  GeminiImageReadError,
  GeminiNetworkError,
  GeminiNotConfiguredError,
  GeminiParseError,
} from '../services/gemini/errors';

export function resolveGeminiErrorKey(error: unknown): string {
  if (error instanceof GeminiNotConfiguredError) {
    return 'common.geminiApiNotConfigured';
  }
  if (error instanceof GeminiImageReadError) {
    return 'common.geminiApiImageReadError';
  }
  if (error instanceof GeminiNetworkError) {
    return 'common.geminiApiNetworkError';
  }
  if (error instanceof GeminiEmptyResultError) {
    return 'common.geminiApiEmptyResult';
  }
  if (error instanceof GeminiParseError) {
    if (/No food items|No receipt lines|Empty/i.test(error.message)) {
      return 'common.geminiApiEmptyResult';
    }
    return 'common.geminiApiParseError';
  }
  if (error instanceof GeminiApiError) {
    if (error.status === 429) return 'common.geminiApiQuotaError';
    if (error.status === 408) return 'common.geminiApiTimeout';
    if (__DEV__ && error.detail) {
      console.warn('[Gemini API]', error.status, error.detail);
    }
    return 'common.geminiApiError';
  }
  return 'common.geminiApiError';
}
