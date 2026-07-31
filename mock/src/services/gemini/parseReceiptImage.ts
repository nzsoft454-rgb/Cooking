import { getGeminiVisionModel } from '../../config/gemini';
import type { ReceiptLineItem } from '../../data/receiptMock';
import { generateGeminiContent } from './client';
import { GeminiImageReadError, GeminiParseError } from './errors';
import { readImageAsInlineData } from './imagePayload';
import {
  extractItemArray,
  normalizeReceiptFields,
  parseJsonResponse,
} from './parseJsonResponse';
import { RECEIPT_PROMPT } from './prompts';
import { RECEIPT_RESPONSE_SCHEMA } from './schemas';

function normalizeReceiptItem(raw: unknown): ReceiptLineItem | null {
  const fields = normalizeReceiptFields(raw);
  if (!fields.rawName) return null;
  return {
    rawName: fields.rawName,
    quantity: fields.quantity || '1',
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
    responseSchema: RECEIPT_RESPONSE_SCHEMA,
    parts: [
      { text: RECEIPT_PROMPT },
      { inlineData: { mimeType: inline.mimeType, data: inline.data } },
    ],
  });

  const parsed = parseJsonResponse<unknown>(text);
  const items = extractItemArray(parsed)
    .map(normalizeReceiptItem)
    .filter((item): item is ReceiptLineItem => item != null);

  if (items.length === 0) {
    throw new GeminiParseError('No receipt lines detected in Gemini response');
  }

  return items;
}
