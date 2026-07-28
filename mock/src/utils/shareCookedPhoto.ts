import { Alert } from 'react-native';
import i18n from '../i18n';
import type { CookedDishPhoto } from '../types';
import { buildCookedPhotoShareMessage } from './share/buildShareMessage';
import { hasNativeRNShare, isShareCancelled, shareCookedPhotoWithMessage } from './share/sharePlatforms';

export type ShareCookedPhotoOptions = {
  compositeUri?: string | null;
};

export { buildCookedPhotoShareMessage } from './share/buildShareMessage';
export { hasNativeRNShare } from './share/sharePlatforms';

export async function shareCookedPhoto(
  photo: Pick<CookedDishPhoto, 'recipeTitle' | 'imageUri' | 'createdAt'>,
  options?: ShareCookedPhotoOptions
): Promise<void> {
  const message = buildCookedPhotoShareMessage(photo.recipeTitle);

  try {
    await shareCookedPhotoWithMessage(
      photo.imageUri,
      message,
      photo.recipeTitle,
      options?.compositeUri
    );
  } catch (error) {
    if (isShareCancelled(error)) return;
    if (error instanceof Error && error.message === 'composite required') {
      Alert.alert(i18n.t('common.shareTitle'), i18n.t('share.cookedPhotoCompositeRequired'));
      return;
    }
    if (error instanceof Error && error.message === 'image unavailable') {
      Alert.alert(i18n.t('common.shareTitle'), i18n.t('common.imageLoadFailed'));
      return;
    }
    Alert.alert(i18n.t('common.shareTitle'), i18n.t('common.shareFailed'));
  }
}
