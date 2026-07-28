import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { RECEIPT_IMAGE_KEY } from '../data/images';
import { requestMediaLibraryPermission } from './cookedPhoto';

/** アルバムからレシート画像を選ぶ（Web はモック画像） */
export async function pickReceiptImageFromLibrary(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return RECEIPT_IMAGE_KEY;
  }
  if (!(await requestMediaLibraryPermission())) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}
