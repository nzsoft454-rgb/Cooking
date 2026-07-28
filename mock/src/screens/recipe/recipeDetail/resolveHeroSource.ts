import { ImageSourcePropType } from 'react-native';
import { FOOD_IMAGES } from '../../../data/images';

export function resolveHeroSource(latestPhoto?: { imageUri: string }): ImageSourcePropType {
  const fallback = FOOD_IMAGES['asset://capture-erungi'];
  if (!latestPhoto) return fallback;

  if (latestPhoto.imageUri.startsWith('asset://')) {
    return FOOD_IMAGES[latestPhoto.imageUri] ?? fallback;
  }
  if (
    latestPhoto.imageUri.startsWith('file://') ||
    latestPhoto.imageUri.startsWith('content://') ||
    latestPhoto.imageUri.startsWith('http')
  ) {
    return { uri: latestPhoto.imageUri };
  }
  return fallback;
}
