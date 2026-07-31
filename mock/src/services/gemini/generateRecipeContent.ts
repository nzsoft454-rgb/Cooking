import { getGeminiTextModel } from '../../config/gemini';
import type { Recipe, RecipeConditions } from '../../types';
import { generateGeminiContent } from './client';
import { GeminiParseError } from './errors';
import { parseJsonResponse } from './parseJsonResponse';
import { buildRecipePrompt } from './prompts';
import { RECIPE_RESPONSE_SCHEMA } from './schemas';

type RawRecipeStep = {
  stepNumber?: number;
  instruction?: string;
  timerSeconds?: number;
};

type RawRecipeIngredient = {
  name?: string;
  amount?: string;
};

type RawRecipeResponse = {
  title?: string;
  cookingTime?: number;
  ingredientsList?: RawRecipeIngredient[];
  steps?: RawRecipeStep[];
  tips?: string;
  buyAssistText?: string;
};

export type GeneratedRecipePayload = Omit<
  Recipe,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'userMemo'
>;

export async function generateRecipeWithGemini(
  sourceIngredients: string[],
  conditions: RecipeConditions,
  gacha: boolean,
): Promise<GeneratedRecipePayload> {
  const text = await generateGeminiContent({
    model: getGeminiTextModel(),
    jsonMode: true,
    responseSchema: RECIPE_RESPONSE_SCHEMA,
    parts: [{ text: buildRecipePrompt(sourceIngredients, conditions, gacha) }],
  });

  const parsed = parseJsonResponse<RawRecipeResponse>(text);
  const title = parsed.title?.trim();
  if (!title) throw new GeminiParseError('Recipe title missing in Gemini response');

  const ingredientsList = (parsed.ingredientsList ?? [])
    .map((item) => ({
      name: item.name?.trim() ?? '',
      amount: item.amount?.trim() || '適量',
    }))
    .filter((item) => item.name.length > 0);

  const steps = (parsed.steps ?? [])
    .map((step, index) => ({
      stepNumber: step.stepNumber ?? index + 1,
      instruction: step.instruction?.trim() ?? '',
      ...(typeof step.timerSeconds === 'number' && step.timerSeconds > 0
        ? { timerSeconds: step.timerSeconds }
        : {}),
    }))
    .filter((step) => step.instruction.length > 0);

  if (ingredientsList.length === 0 || steps.length === 0) {
    throw new GeminiParseError('Incomplete recipe in Gemini response');
  }

  return {
    title,
    sourceIngredients: sourceIngredients.length ? sourceIngredients : ['おまかせ'],
    servings: Math.max(1, conditions.servings),
    cookingTime: Math.max(1, Math.round(parsed.cookingTime ?? 15)),
    difficulty: conditions.difficulty,
    genre: conditions.genre,
    ingredientsList,
    steps,
    tips: parsed.tips?.trim(),
    buyAssistText: parsed.buyAssistText?.trim(),
  };
}
