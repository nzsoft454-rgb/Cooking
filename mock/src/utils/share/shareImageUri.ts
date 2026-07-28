import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { FOOD_IMAGES } from '../../data/images';

export async function resolveShareableUri(imageUri: string): Promise<string | null> {
  if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
    return imageUri;
  }
  if (imageUri.startsWith('asset://')) {
    const source = FOOD_IMAGES[imageUri];
    if (!source || typeof source !== 'number') return null;
    const asset = Asset.fromModule(source);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    return asset.localUri ?? null;
  }
  if (imageUri.startsWith('http')) {
    const dest = `${FileSystem.cacheDirectory}share_${Date.now()}.jpg`;
    const downloaded = await FileSystem.downloadAsync(imageUri, dest);
    return downloaded.uri;
  }
  return null;
}

export async function ensureLocalFileUri(imageUri: string): Promise<string | null> {
  const resolved = await resolveShareableUri(imageUri);
  if (!resolved) return null;

  if (resolved.startsWith('file://') && Platform.OS !== 'android') {
    const info = await FileSystem.getInfoAsync(resolved);
    return info.exists ? resolved : null;
  }

  const ext = resolved.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const dest = `${FileSystem.cacheDirectory}cooked_share_${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: resolved, to: dest });
  return dest;
}

export function mimeTypeForUri(fileUri: string): string {
  return fileUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
}

export function shareFilename(fileUri: string): string {
  const ext = fileUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
  return `cooked_${Date.now()}.${ext}`;
}
