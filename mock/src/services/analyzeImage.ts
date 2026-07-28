import { mockAnalyzeImage } from '../data/dummy';
import { mockParseReceipt } from '../data/receiptMock';
import type { DetectedItem } from '../types';

export type AnalysisMode = 'photo' | 'receipt';

export type AnalyzeImageResult =
  | { mode: 'photo'; items: DetectedItem[] }
  | { mode: 'receipt'; items: Awaited<ReturnType<typeof mockParseReceipt>> };

/** 外部 API のモック（実写 / レシート共通エントリポイント） */
export async function analyzeImage(
  imageUrl: string,
  mode: AnalysisMode
): Promise<AnalyzeImageResult> {
  if (mode === 'receipt') {
    const items = await mockParseReceipt(imageUrl);
    return { mode: 'receipt', items };
  }
  const items = await mockAnalyzeImage();
  return { mode: 'photo', items };
}
