import {
  GeminiApiError,
  GeminiImageReadError,
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
  if (error instanceof GeminiParseError) {
    return 'common.geminiApiParseError';
  }
  if (error instanceof GeminiApiError) {
    return 'common.geminiApiError';
  }
  return 'common.geminiApiError';
}
