import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Share, TurboModuleRegistry } from 'react-native';
import {
  ensureLocalFileUri,
  mimeTypeForUri,
  shareFilename,
} from './shareImageUri';

type RNShareNative = {
  open: (options: Record<string, unknown>) => Promise<{ success?: boolean; message?: string }>;
};

export function hasNativeRNShare(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return TurboModuleRegistry.get('RNShare') != null;
  } catch {
    return false;
  }
}

function getNativeRNShare(): RNShareNative | null {
  if (!hasNativeRNShare()) return null;
  return TurboModuleRegistry.get('RNShare') as RNShareNative | null;
}

export function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('cancel') || msg.includes('dismiss') || msg.includes('user did not share');
}

async function toAndroidSharePayload(fileUri: string): Promise<{
  url: string;
  type: string;
  useInternalStorage?: boolean;
}> {
  const mimeType = mimeTypeForUri(fileUri);
  if (Platform.OS !== 'android') {
    return { url: fileUri, type: mimeType };
  }

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return {
    url: `data:${mimeType};base64,${base64}`,
    type: mimeType,
    useInternalStorage: true,
  };
}

async function shareWithNativeModule(
  fileUri: string,
  message: string,
  title: string
): Promise<void> {
  const nativeShare = getNativeRNShare();
  if (!nativeShare?.open) {
    throw new Error('RNShare unavailable');
  }

  const payload = await toAndroidSharePayload(fileUri);

  await nativeShare.open({
    title,
    message,
    url: payload.url,
    type: payload.type,
    filename: shareFilename(fileUri),
    useInternalStorage: payload.useInternalStorage ?? false,
    failOnCancel: false,
  });
}

async function shareCompositeImage(fileUri: string, title: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing unavailable');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: mimeTypeForUri(fileUri),
    dialogTitle: title,
  });
}

export async function shareCookedPhotoWithMessage(
  imageUri: string,
  message: string,
  title: string,
  compositeUri?: string | null
): Promise<void> {
  if (Platform.OS === 'web') {
    await Share.share({ message, title });
    return;
  }

  if (Platform.OS === 'ios') {
    const fileUri = compositeUri ?? (await ensureLocalFileUri(imageUri));
    if (!fileUri) throw new Error('image unavailable');
    await Share.share({ message, url: fileUri, title });
    return;
  }

  if (hasNativeRNShare()) {
    const fileUri = await ensureLocalFileUri(imageUri);
    if (!fileUri) throw new Error('image unavailable');
    await shareWithNativeModule(fileUri, message, title);
    return;
  }

  if (!compositeUri) throw new Error('composite required');
  await shareCompositeImage(compositeUri, title);
}
