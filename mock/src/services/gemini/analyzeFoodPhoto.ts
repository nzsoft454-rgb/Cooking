import { getGeminiVisionModel } from '../../config/gemini';
import type { DetectedItem, IngredientAttribute } from '../../types';
import { normalizeIngredientAttribute } from '../../utils/ingredientAttribute';
import { generateGeminiContent } from './client';
import { GeminiImageReadError, GeminiParseError } from './errors';
import { readImageAsInlineData } from './imagePayload';
import {
  extractItemArray,
  normalizeFoodFields,
  parseJsonResponse,
} from './parseJsonResponse';
import { FOOD_PHOTO_PROMPT } from './prompts';
import { FOOD_PHOTO_RESPONSE_SCHEMA } from './schemas';

function normalizeConfidence(value: unknown): string {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

function normalizeItem(raw: unknown): DetectedItem | null {
  const fields = normalizeFoodFields(raw);
  if (!fields.name) return null;
  return {
    name: fields.name,
    quantity: fields.quantity || '適量',
    confidence: normalizeConfidence(fields.confidence),
    attribute: normalizeIngredientAttribute(fields.attribute) as IngredientAttribute,
  };
}

export async function analyzeFoodPhotoWithGemini(
  imageUrl: string,
): Promise<DetectedItem[]> {
  const inline = await readImageAsInlineData(imageUrl);
  if (!inline) {
    throw new GeminiImageReadError('Image URI is not readable for Gemini');
  }

  const text = await generateGeminiContent({
    model: getGeminiVisionModel(),
    jsonMode: true,
    responseSchema: FOOD_PHOTO_RESPONSE_SCHEMA,
    parts: [
      { text: FOOD_PHOTO_PROMPT },
      { inlineData: { mimeType: inline.mimeType, data: inline.data } },
    ],
  });

  const parsed = parseJsonResponse<unknown>(text);
  const items = extractItemArray(parsed)
    .map(normalizeItem)
    .filter((item): item is DetectedItem => item != null);

  if (items.length === 0) {
    throw new GeminiParseError('No food items detected in Gemini response');
  }

  return items;
}
