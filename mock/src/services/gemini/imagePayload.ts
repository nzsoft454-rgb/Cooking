import * as FileSystem from 'expo-file-system/legacy';

import { isRemoteImageUri } from '../../utils/resolveImageSource';
import { GeminiImageReadError } from './errors';

function guessMimeType(uri: string): string {
  const lower = uri.split('?')[0]?.toLowerCase() ?? '';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

export type GeminiInlineImage = {
  mimeType: string;
  data: string;
};

/** file:// / content:// / https:// 等を Gemini 用 base64 に変換 */
export async function readImageAsInlineData(
  imageUrl: string,
): Promise<GeminiInlineImage | null> {
  if (!isRemoteImageUri(imageUrl)) return null;

  if (imageUrl.startsWith('data:image')) {
    const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mimeType: match[1], data: match[2] };
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new GeminiImageReadError(`Failed to fetch image (${response.status})`);
    }
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return { mimeType: blob.type || guessMimeType(imageUrl), data: base64 };
  }

  const info = await FileSystem.getInfoAsync(imageUrl);
  if (!info.exists) return null;

  const data = await FileSystem.readAsStringAsync(imageUrl, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { mimeType: guessMimeType(imageUrl), data };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new GeminiImageReadError('Failed to encode image'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new GeminiImageReadError('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
}
