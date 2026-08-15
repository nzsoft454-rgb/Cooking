import { isGeminiConfigured } from '../config/gemini';
import {
  mockGenerateGachaRecipe,
  mockGenerateRecipe,
} from '../data/dummy';
import type { Recipe, RecipeConditions } from '../types';
import { isRetryableGeminiError, sleep } from '../utils/geminiRetry';
import {
  generateRecipeWithGemini,
  type GeneratedRecipePayload,
} from './gemini/generateRecipeContent';
import type { DishGenerationContext } from './gemini/prompts';

export type GenerateRecipeMode = 'normal' | 'gacha';

const MAX_RECIPE_ATTEMPTS = 2;

async function generateSingleRecipe(
  sourceIngredients: string[],
  conditions: RecipeConditions,
  mode: GenerateRecipeMode,
  dishContext?: DishGenerationContext,
): Promise<GeneratedRecipePayload> {
  const gacha = mode === 'gacha';
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RECIPE_ATTEMPTS; attempt += 1) {
    try {
      if (!isGeminiConfigured()) {
        return gacha
          ? mockGenerateGachaRecipe(sourceIngredients)
          : mockGenerateRecipe(sourceIngredients, conditions, dishContext);
      }

      return await generateRecipeWithGemini(
        sourceIngredients,
        conditions,
        gacha,
        dishContext,
      );
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt >= MAX_RECIPE_ATTEMPTS - 1) {
        throw error;
      }
      if (__DEV__) {
        console.warn('[generateRecipe] retry', attempt + 1, error);
      }
      await sleep(1000 * (attempt + 1));
    }
  }

  throw lastError ?? new Error('Recipe generation failed');
}

/** レシピ生成（Gemini 設定時は API、未設定時はモック） */
export async function generateRecipe(
  sourceIngredients: string[],
  conditions: RecipeConditions,
  mode: GenerateRecipeMode = 'normal',
): Promise<GeneratedRecipePayload> {
  const recipes = await generateRecipes(sourceIngredients, conditions, mode);
  return recipes[0];
}

/** 指定品数分のレシピを生成（食材候補の範囲で各品を独立生成） */
export async function generateRecipes(
  sourceIngredients: string[],
  conditions: RecipeConditions,
  mode: GenerateRecipeMode = 'normal',
): Promise<GeneratedRecipePayload[]> {
  const dishTotal = Math.max(1, conditions.dishCount);
  if (dishTotal === 1) {
    return [await generateSingleRecipe(sourceIngredients, conditions, mode)];
  }

  const recipes: GeneratedRecipePayload[] = [];
  for (let dishIndex = 1; dishIndex <= dishTotal; dishIndex += 1) {
    const dishContext: DishGenerationContext = {
      dishIndex,
      dishTotal,
      previousDishes: recipes.map((recipe) => ({
        title: recipe.title,
        ingredients: recipe.ingredientsList.map((item) => item.name),
      })),
    };
    recipes.push(
      await generateSingleRecipe(sourceIngredients, conditions, mode, dishContext),
    );
  }
  return recipes;
}

export type { GeneratedRecipePayload };

export type SavedRecipePayload = Omit<
  Recipe,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;
