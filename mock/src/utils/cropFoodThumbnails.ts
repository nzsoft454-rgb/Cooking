import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image, Platform } from 'react-native';

import type { DetectedItem } from '../types';

/** bbox 長辺の最小スパン（0-1000 スケール）— 小さい bbox は中心から拡張 */
const MIN_BOX_LONG_SPAN = 35;
/** bbox 短辺の最小スパン（細長い食材も許容） */
const MIN_BOX_SHORT_SPAN = 8;
/** 切り抜き時の余白比率（bbox 周囲） */
const CROP_PADDING_RATIO = 0.18;
/** 出力サムネ辺長（px）— crop 後に統一リサイズ（拡大・縮小可） */
const THUMB_OUTPUT_SIZE = 400;
/** 切り抜き最小辺（px） */
const MIN_CROP_PX = 32;

export type NormalizedBox2d = [number, number, number, number];

/** Gemini が 0-1 / 0-100 / 0-1000 のいずれで返しても 0-1000 に統一 */
function normalizeBox2dScale(raw: number[]): number[] {
  const max = Math.max(...raw.map(Math.abs));
  if (max <= 1.5) return raw.map((n) => n * 1000);
  if (max <= 100) return raw.map((n) => n * 10);
  return raw;
}

function clampBox2d(box: NormalizedBox2d): NormalizedBox2d {
  let [ymin, xmin, ymax, xmax] = box;
  ymin = Math.max(0, Math.min(1000, ymin));
  xmin = Math.max(0, Math.min(1000, xmin));
  ymax = Math.max(0, Math.min(1000, ymax));
  xmax = Math.max(0, Math.min(1000, xmax));
  if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
  if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
  return [ymin, xmin, ymax, xmax];
}

/** 小さすぎる bbox を中心固定で拡張 */
function expandSmallBox2d(box: NormalizedBox2d): NormalizedBox2d {
  let [ymin, xmin, ymax, xmax] = box;
  const spanY = ymax - ymin;
  const spanX = xmax - xmin;

  if (Math.max(spanY, spanX) >= MIN_BOX_LONG_SPAN && Math.min(spanY, spanX) >= MIN_BOX_SHORT_SPAN) {
    return box;
  }

  const side = Math.max(spanY, spanX, MIN_BOX_LONG_SPAN);
  const cy = (ymin + ymax) / 2;
  const cx = (xmin + xmax) / 2;

  ymin = cy - side / 2;
  ymax = cy + side / 2;
  xmin = cx - side / 2;
  xmax = cx + side / 2;

  return clampBox2d([ymin, xmin, ymax, xmax]);
}

/** box_2d [ymin, xmin, ymax, xmax]（0-1000）を検証 */
export function parseBox2d(raw: unknown): NormalizedBox2d | null {
  if (!Array.isArray(raw) || raw.length < 4) return null;

  const nums = raw.slice(0, 4).map((value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) return Number(value);
    return Number.NaN;
  });

  if (nums.some((n) => !Number.isFinite(n))) return null;

  const scaled = normalizeBox2dScale(nums);
  let box = clampBox2d(scaled as NormalizedBox2d);
  box = expandSmallBox2d(box);

  const [ymin, xmin, ymax, xmax] = box;
  if (ymax - ymin < MIN_BOX_SHORT_SPAN || xmax - xmin < MIN_BOX_SHORT_SPAN) return null;
  if (ymin >= ymax || xmin >= xmax) return null;

  return box;
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

async function resolveLocalImageUri(imageUrl: string): Promise<string | null> {
  if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
    const info = await FileSystem.getInfoAsync(imageUrl);
    return info.exists ? imageUrl : null;
  }

  if (imageUrl.startsWith('data:image')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const dest = `${FileSystem.cacheDirectory}food_crop_src_${Date.now()}.jpg`;
    const downloaded = await FileSystem.downloadAsync(imageUrl, dest);
    return downloaded.uri;
  }

  return null;
}

/** 正規化 bbox → 正方形 crop（bbox 中心固定・拡大縮小で画像内に収める） */
export function box2dToSquareCrop(
  box: NormalizedBox2d,
  imageWidth: number,
  imageHeight: number,
): { originX: number; originY: number; width: number; height: number } {
  const [ymin, xmin, ymax, xmax] = box;

  const x1 = (xmin / 1000) * imageWidth;
  const y1 = (ymin / 1000) * imageHeight;
  const x2 = (xmax / 1000) * imageWidth;
  const y2 = (ymax / 1000) * imageHeight;

  const boxW = x2 - x1;
  const boxH = y2 - y1;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  const paddedSize = Math.max(boxW, boxH) * (1 + 2 * CROP_PADDING_RATIO);

  // bbox 中心を維持したまま収まる最大正方形
  const maxCenteredSize = Math.min(
    Math.min(cx, imageWidth - cx) * 2,
    Math.min(cy, imageHeight - cy) * 2,
  );

  // はみ出す場合は縮小（= 拡大表示）、収まる場合は padded サイズを使用
  let size = Math.min(paddedSize, maxCenteredSize);
  size = Math.max(MIN_CROP_PX, size);

  const originX = cx - size / 2;
  const originY = cy - size / 2;

  return {
    originX: Math.round(Math.max(0, originX)),
    originY: Math.round(Math.max(0, originY)),
    width: Math.round(size),
    height: Math.round(size),
  };
}

async function cropThumbnail(
  sourceUri: string,
  box: NormalizedBox2d,
  imageWidth: number,
  imageHeight: number,
  index: number,
): Promise<string | null> {
  const crop = box2dToSquareCrop(box, imageWidth, imageHeight);
  if (crop.width < MIN_CROP_PX || crop.height < MIN_CROP_PX) return null;

  const result = await manipulateAsync(
    sourceUri,
    [
      { crop },
      { resize: { width: THUMB_OUTPUT_SIZE } },
    ],
    {
      compress: 0.82,
      format: SaveFormat.JPEG,
    },
  );

  if (!result.uri) return null;

  const dest = `${FileSystem.cacheDirectory}food_thumb_${Date.now()}_${index}.jpg`;
  await FileSystem.copyAsync({ from: result.uri, to: dest });
  return dest;
}

/** 検出結果に食材ごとの切り抜きサムネ URI を付与（失敗時は fallback） */
export async function attachFoodPhotoThumbnails(
  sourceImageUrl: string,
  items: DetectedItem[],
  fallbackImageUrl: string = sourceImageUrl,
  knownSize?: { width: number; height: number },
): Promise<DetectedItem[]> {
  if (Platform.OS === 'web' || items.length === 0) {
    return items.map((item) => ({
      ...item,
      imageUrl: item.imageUrl ?? fallbackImageUrl,
    }));
  }

  const localUri = await resolveLocalImageUri(sourceImageUrl);
  if (!localUri) {
    return items.map((item) => ({
      ...item,
      imageUrl: item.imageUrl ?? fallbackImageUrl,
    }));
  }

  let imageWidth = knownSize?.width ?? 0;
  let imageHeight = knownSize?.height ?? 0;
  if (!imageWidth || !imageHeight) {
    try {
      ({ width: imageWidth, height: imageHeight } = await getImageSize(localUri));
    } catch {
      return items.map((item) => ({
        ...item,
        imageUrl: item.imageUrl ?? fallbackImageUrl,
      }));
    }
  }

  return Promise.all(
    items.map(async (item, index) => {
      if (!item.box2d) {
        return { ...item, imageUrl: fallbackImageUrl };
      }

      try {
        const thumbUri = await cropThumbnail(
          localUri,
          item.box2d,
          imageWidth,
          imageHeight,
          index,
        );
        return {
          ...item,
          imageUrl: thumbUri ?? fallbackImageUrl,
        };
      } catch {
        return { ...item, imageUrl: fallbackImageUrl };
      }
    }),
  );
}

/** 表示・保存用: 品目サムネ or フォールバック */
export function detectedItemImageUrl(item: DetectedItem, fallbackImageUrl: string): string {
  const url = item.imageUrl?.trim();
  return url || fallbackImageUrl;
}
