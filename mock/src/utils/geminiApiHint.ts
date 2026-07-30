import { isGeminiConfigured } from '../config/gemini';

/** 解析・生成画面のヒント文言キー */
export function getGeminiApiHintKey(): 'common.geminiApiHint' | 'common.geminiApiMockHint' {
  return isGeminiConfigured() ? 'common.geminiApiHint' : 'common.geminiApiMockHint';
}
