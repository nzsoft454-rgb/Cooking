import { getGeminiVisionModel } from '../../config/gemini';
import type { DetectedItem, IngredientAttribute } from '../../types';
import { attachFoodPhotoThumbnails, parseBox2d } from '../../utils/cropFoodThumbnails';
import { isRetryableGeminiError, needsCropRetry, sleep } from '../../utils/geminiRetry';
import { sanitizeDetectedFoodName } from '../../utils/sanitizeDetectedFoodName';
import { sanitizeDetectedFoodQuantity } from '../../utils/sanitizeDetectedFoodQuantity';
import { normalizeIngredientAttribute } from '../../utils/ingredientAttribute';
import { generateGeminiContent } from './client';
import { GeminiEmptyResultError, GeminiImageReadError, GeminiParseError } from './errors';
import { readImageAsInlineData } from './imagePayload';
import {
  extractItemArray,
  normalizeFoodFields,
  parseJsonResponse,
} from './parseJsonResponse';
import { FOOD_PHOTO_PROMPT } from './prompts';
import { FOOD_PHOTO_RESPONSE_SCHEMA } from './schemas';

const MAX_ANALYSIS_ATTEMPTS = 2;
const RETRY_BOX_PROMPT_SUFFIX =
  '\n\n重要: 各 item に必ず box_2d を含めてください。座標は 0-1000 の [ymin, xmin, ymax, xmax] です。';

function normalizeConfidence(value: unknown): string {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

function normalizeItem(raw: unknown): DetectedItem | null {
  const fields = normalizeFoodFields(raw);
  if (!fields.name) return null;

  const name =
    sanitizeDetectedFoodName(fields.name) ??
    (/[\u3040-\u9fff]/u.test(fields.name)
      ? fields.name.trim().slice(0, 12)
      : null);
  if (!name) return null;

  const box2d = parseBox2d(fields.box2d);
  return {
    name,
    quantity: sanitizeDetectedFoodQuantity(fields.quantity),
    confidence: normalizeConfidence(fields.confidence),
    attribute: normalizeIngredientAttribute(fields.attribute) as IngredientAttribute,
    ...(box2d ? { box2d } : {}),
  };
}

function parseDetectedItems(text: string): DetectedItem[] {
  const parsed = parseJsonResponse<unknown>(text);
  return extractItemArray(parsed)
    .map(normalizeItem)
    .filter((item): item is DetectedItem => item != null);
}

async function requestFoodDetection(
  inline: { mimeType: string; data: string },
  emphasizeBoxes: boolean,
): Promise<DetectedItem[]> {
  const text = await generateGeminiContent({
    model: getGeminiVisionModel(),
    jsonMode: true,
    responseSchema: FOOD_PHOTO_RESPONSE_SCHEMA,
    temperature: 0,
    parts: [
      { text: emphasizeBoxes ? FOOD_PHOTO_PROMPT + RETRY_BOX_PROMPT_SUFFIX : FOOD_PHOTO_PROMPT },
      { inlineData: { mimeType: inline.mimeType, data: inline.data } },
    ],
  });

  const items = parseDetectedItems(text);
  if (items.length === 0) {
    throw new GeminiEmptyResultError('No food items detected in Gemini response');
  }
  return items;
}

export async function analyzeFoodPhotoWithGemini(
  imageUrl: string,
): Promise<DetectedItem[]> {
  const inline = await readImageAsInlineData(imageUrl);
  if (!inline) {
    throw new GeminiImageReadError('Image URI is not readable for Gemini');
  }

  const cropSource = inline.normalizedUri ?? imageUrl;
  const cropSize =
    inline.width && inline.height
      ? { width: inline.width, height: inline.height }
      : undefined;

  let lastError: unknown;
  let emphasizeBoxes = false;

  for (let attempt = 0; attempt < MAX_ANALYSIS_ATTEMPTS; attempt += 1) {
    try {
      const items = await requestFoodDetection(inline, emphasizeBoxes);
      const withThumbs = await attachFoodPhotoThumbnails(
        cropSource,
        items,
        imageUrl,
        cropSize,
      );

      const shouldRetryCrop =
        attempt < MAX_ANALYSIS_ATTEMPTS - 1 && needsCropRetry(withThumbs, imageUrl);

      if (shouldRetryCrop) {
        if (__DEV__) {
          console.warn('[analyzeFoodPhoto] crop retry', attempt + 1, {
            items: withThumbs.length,
            withBox: withThumbs.filter((i) => i.box2d).length,
          });
        }
        emphasizeBoxes = true;
        await sleep(600 * (attempt + 1));
        continue;
      }

      return withThumbs;
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt >= MAX_ANALYSIS_ATTEMPTS - 1) {
        throw error;
      }
      if (__DEV__) {
        console.warn('[analyzeFoodPhoto] api retry', attempt + 1, error);
      }
      await sleep(800 * (attempt + 1));
    }
  }

  throw lastError ?? new GeminiParseError('Food photo analysis failed');
}
