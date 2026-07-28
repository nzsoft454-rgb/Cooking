import { Alert, Share } from 'react-native';
import i18n from '../i18n';
import type { Recipe } from '../types';

/** レシピ本文を SNS 等にシェア */
export async function shareRecipeText(recipe: Recipe): Promise<void> {
  const t = i18n.t.bind(i18n);
  const text = [
    recipe.title,
    '',
    ...recipe.ingredientsList.map((i) =>
      t('recipe.detail.ingredientLine', { name: i.name, amount: i.amount })
    ),
    '',
    ...recipe.steps.map((s) =>
      t('recipe.detail.stepLine', { number: s.stepNumber, instruction: s.instruction })
    ),
    '',
    t('recipe.detail.shareFooter'),
  ].join('\n');

  try {
    await Share.share({ message: text, title: recipe.title });
  } catch {
    Alert.alert(t('common.shareTitle'), t('common.shareCancelled'));
  }
}
