import { isGeminiConfigured } from '../config/gemini';
import {
  mockGenerateGachaRecipe,
  mockGenerateRecipe,
} from '../data/dummy';
import type { Recipe, RecipeConditions } from '../types';
import {
  generateRecipeWithGemini,
  type GeneratedRecipePayload,
} from './gemini/generateRecipeContent';

export type GenerateRecipeMode = 'normal' | 'gacha';

/** レシピ生成（Gemini 設定時は API、未設定時はモック） */
export async function generateRecipe(
  sourceIngredients: string[],
  conditions: RecipeConditions,
  mode: GenerateRecipeMode = 'normal',
): Promise<GeneratedRecipePayload> {
  const gacha = mode === 'gacha';

  if (!isGeminiConfigured()) {
    return gacha
      ? mockGenerateGachaRecipe(sourceIngredients)
      : mockGenerateRecipe(sourceIngredients, conditions);
  }

  return generateRecipeWithGemini(sourceIngredients, conditions, gacha);
}

export type { GeneratedRecipePayload };

export type SavedRecipePayload = Omit<
  Recipe,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;
