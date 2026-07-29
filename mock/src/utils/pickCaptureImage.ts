import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import {
  requestCameraPermission,
  requestMediaLibraryPermission,
} from './cookedPhoto';

const BASE_CAPTURE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
};

/** Android のみ OS 標準トリミング（任意比率）。iOS は正方形固定のため無効。 */
const NATIVE_CAPTURE_OPTIONS: ImagePicker.ImagePickerOptions =
  Platform.OS === 'android'
    ? { ...BASE_CAPTURE_OPTIONS, allowsEditing: true }
    : { ...BASE_CAPTURE_OPTIONS, allowsEditing: false };

/** 食材用: カメラで撮影（Web はライブラリ選択にフォールバック） */
export async function takeFoodPhotoFromCamera(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickFoodImageFromLibrary();
  }
  if (!(await requestCameraPermission())) return null;
  const result = await ImagePicker.launchCameraAsync(NATIVE_CAPTURE_OPTIONS);
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

/** 食材用: アルバムから選択 */
export async function pickFoodImageFromLibrary(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (!(await requestMediaLibraryPermission())) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      ...BASE_CAPTURE_OPTIONS,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    return result.assets[0].uri;
  }
  if (!(await requestMediaLibraryPermission())) return null;
  const result = await ImagePicker.launchImageLibraryAsync(NATIVE_CAPTURE_OPTIONS);
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}
