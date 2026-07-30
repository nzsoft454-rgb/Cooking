import { getGeminiVisionModel } from '../../config/gemini';
import type { DetectedItem, IngredientAttribute } from '../../types';
import { normalizeIngredientAttribute } from '../../utils/ingredientAttribute';
import { generateGeminiContent } from './client';
import { GeminiImageReadError, GeminiParseError } from './errors';
import { readImageAsInlineData } from './imagePayload';
import { parseJsonResponse } from './parseJsonResponse';
import { FOOD_PHOTO_PROMPT } from './prompts';

type RawFoodItem = {
  name?: string;
  quantity?: string;
  confidence?: string;
  attribute?: string;
};

type FoodPhotoResponse = {
  items?: RawFoodItem[];
};

function normalizeConfidence(value: unknown): string {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

function normalizeItem(raw: RawFoodItem): DetectedItem | null {
  const name = raw.name?.trim();
  if (!name) return null;
  return {
    name,
    quantity: raw.quantity?.trim() || '適量',
    confidence: normalizeConfidence(raw.confidence),
    attribute: normalizeIngredientAttribute(raw.attribute) as IngredientAttribute,
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
    parts: [
      { text: FOOD_PHOTO_PROMPT },
      { inlineData: { mimeType: inline.mimeType, data: inline.data } },
    ],
  });

  const parsed = parseJsonResponse<FoodPhotoResponse>(text);
  const items = (parsed.items ?? [])
    .map(normalizeItem)
    .filter((item): item is DetectedItem => item != null);

  if (items.length === 0) {
    throw new GeminiParseError('No food items detected in Gemini response');
  }

  return items;
}
