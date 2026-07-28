import i18n from '../../i18n';

const DEFAULT_HASHTAGS = ['#自炊', '#おうちごはん', '#料理記録', '#CookingMock'];

function pickShareHashtags(count = 5): string {
  const pool = i18n.t('share.cookedPhotoHashtagPool', { returnObjects: true });
  const tags = Array.isArray(pool) ? pool.filter((t): t is string => typeof t === 'string') : [];
  const source = tags.length > 0 ? tags : DEFAULT_HASHTAGS;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).join(' ');
}

export function buildCookedPhotoShareMessage(recipeTitle: string): string {
  const tags = pickShareHashtags();
  return [
    i18n.t('share.cookedPhotoMessage', { title: recipeTitle }),
    i18n.t('share.cookedPhotoLine2'),
    tags,
  ].join('\n');
}
