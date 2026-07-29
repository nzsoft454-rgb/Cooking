import { ImageSourcePropType } from 'react-native';
import { FOOD_IMAGES } from '../data/images';

const REMOTE_URI_PATTERN = /^(file:|content:|https?:|blob:|data:image)/;

/** asset:// キーまたは端末上の URI を Image source に変換 */
export function resolveImageSource(imageUrl: string): ImageSourcePropType | null {
  const asset = FOOD_IMAGES[imageUrl];
  if (asset) return asset;
  if (REMOTE_URI_PATTERN.test(imageUrl)) {
    return { uri: imageUrl };
  }
  return null;
}

export function isRemoteImageUri(imageUrl: string): boolean {
  return REMOTE_URI_PATTERN.test(imageUrl);
}
