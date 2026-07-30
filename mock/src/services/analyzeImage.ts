import { isGeminiConfigured } from '../config/gemini';
import { mockAnalyzeImage } from '../data/dummy';
import { mockParseReceipt } from '../data/receiptMock';
import type { ReceiptLineItem } from '../data/receiptMock';
import type { DetectedItem } from '../types';
import { analyzeFoodPhotoWithGemini } from './gemini/analyzeFoodPhoto';
import { parseReceiptImageWithGemini } from './gemini/parseReceiptImage';

export type AnalysisMode = 'photo' | 'receipt';

export type AnalyzeImageResult =
  | { mode: 'photo'; items: DetectedItem[] }
  | { mode: 'receipt'; items: ReceiptLineItem[] };

/** 食材写真 / レシート解析（Gemini 設定時は API、未設定時はモック） */
export async function analyzeImage(
  imageUrl: string,
  mode: AnalysisMode,
): Promise<AnalyzeImageResult> {
  if (!isGeminiConfigured()) {
    if (mode === 'receipt') {
      const items = await mockParseReceipt(imageUrl);
      return { mode: 'receipt', items };
    }
    const items = await mockAnalyzeImage();
    return { mode: 'photo', items };
  }

  if (mode === 'receipt') {
    const items = await parseReceiptImageWithGemini(imageUrl);
    return { mode: 'receipt', items };
  }

  const items = await analyzeFoodPhotoWithGemini(imageUrl);
  return { mode: 'photo', items };
}
