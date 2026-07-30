import { getGeminiVisionModel } from '../../config/gemini';
import type { ReceiptLineItem } from '../../data/receiptMock';
import { generateGeminiContent } from './client';
import { GeminiImageReadError, GeminiParseError } from './errors';
import { readImageAsInlineData } from './imagePayload';
import { parseJsonResponse } from './parseJsonResponse';
import { RECEIPT_PROMPT } from './prompts';

type RawReceiptItem = {
  rawName?: string;
  quantity?: string;
};

type ReceiptResponse = {
  items?: RawReceiptItem[];
};

function normalizeReceiptItem(raw: RawReceiptItem): ReceiptLineItem | null {
  const rawName = raw.rawName?.trim();
  if (!rawName) return null;
  return {
    rawName,
    quantity: raw.quantity?.trim() || '1',
  };
}

export async function parseReceiptImageWithGemini(
  imageUrl: string,
): Promise<ReceiptLineItem[]> {
  const inline = await readImageAsInlineData(imageUrl);
  if (!inline) {
    throw new GeminiImageReadError('Image URI is not readable for Gemini');
  }

  const text = await generateGeminiContent({
    model: getGeminiVisionModel(),
    jsonMode: true,
    parts: [
      { text: RECEIPT_PROMPT },
      { inlineData: { mimeType: inline.mimeType, data: inline.data } },
    ],
  });

  const parsed = parseJsonResponse<ReceiptResponse>(text);
  const items = (parsed.items ?? [])
    .map(normalizeReceiptItem)
    .filter((item): item is ReceiptLineItem => item != null);

  if (items.length === 0) {
    throw new GeminiParseError('No receipt lines detected in Gemini response');
  }

  return items;
}
