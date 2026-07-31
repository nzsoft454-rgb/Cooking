import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image, Platform } from 'react-native';

import { isRemoteImageUri } from '../../utils/resolveImageSource';
import { GeminiImageReadError } from './errors';

/** Gemini 送信用: 長辺の上限（px） */
const GEMINI_MAX_LONG_EDGE = 1280;
/** Gemini 送信用: 目標ファイルサイズ上限 */
const GEMINI_MAX_BYTES = 512 * 1024;
const GEMINI_COMPRESS_LEVELS = [0.72, 0.65, 0.58, 0.5] as const;

function guessMimeType(uri: string): string {
  const lower = uri.split('?')[0]?.toLowerCase() ?? '';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

function base64ByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export type GeminiInlineImage = {
  mimeType: string;
  data: string;
};

async function resolveLocalImageUri(imageUrl: string): Promise<string | null> {
  if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
    const info = await FileSystem.getInfoAsync(imageUrl);
    return info.exists ? imageUrl : null;
  }

  if (imageUrl.startsWith('data:image')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const dest = `${FileSystem.cacheDirectory}gemini_src_${Date.now()}.jpg`;
    const downloaded = await FileSystem.downloadAsync(imageUrl, dest);
    return downloaded.uri;
  }

  if (imageUrl.startsWith('blob:')) {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const mime = blob.type || 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  }

  return null;
}

function buildResizeAction(
  width: number,
  height: number,
): { resize: { width?: number; height?: number } }[] {
  const longEdge = Math.max(width, height);
  if (longEdge <= GEMINI_MAX_LONG_EDGE) return [];
  if (width >= height) {
    return [{ resize: { width: GEMINI_MAX_LONG_EDGE } }];
  }
  return [{ resize: { height: GEMINI_MAX_LONG_EDGE } }];
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

/** 端末上の画像を Gemini 向けにリサイズ・JPEG 圧縮 */
async function compressImageForGemini(sourceUri: string): Promise<GeminiInlineImage> {
  const { width, height } = await getImageSize(sourceUri);
  const resizeActions = buildResizeAction(width, height);

  let lastBase64: string | undefined;
  for (const compress of GEMINI_COMPRESS_LEVELS) {
    const result = await manipulateAsync(sourceUri, resizeActions, {
      compress,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (!result.base64) continue;
    lastBase64 = result.base64;
    if (base64ByteLength(result.base64) <= GEMINI_MAX_BYTES) {
      return { mimeType: 'image/jpeg', data: result.base64 };
    }
  }

  if (!lastBase64) {
    throw new GeminiImageReadError('Failed to compress image for Gemini');
  }
  return { mimeType: 'image/jpeg', data: lastBase64 };
}

async function readUncompressedInlineData(imageUrl: string): Promise<GeminiInlineImage | null> {
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

/** file:// / content:// / https:// 等を Gemini 用 base64 に変換（送信前に圧縮） */
export async function readImageAsInlineData(
  imageUrl: string,
): Promise<GeminiInlineImage | null> {
  if (!isRemoteImageUri(imageUrl)) return null;

  const canCompress = Platform.OS !== 'web';
  if (canCompress) {
    try {
      const localUri = await resolveLocalImageUri(imageUrl);
      if (localUri) {
        return await compressImageForGemini(localUri);
      }
    } catch {
      // 圧縮に失敗した場合は原寸読み込みへフォールバック
    }
  }

  return readUncompressedInlineData(imageUrl);
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
