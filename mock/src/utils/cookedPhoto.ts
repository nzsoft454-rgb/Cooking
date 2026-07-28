import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { COOKED_DISH_DEMO_IMAGES } from '../data/dummy';
import i18n from '../i18n';

/** モック用の出来上がりサンプル画像 */
export { COOKED_DISH_DEMO_IMAGES };
export const DEMO_COOKED_IMAGE = COOKED_DISH_DEMO_IMAGES.spinachStirFry;
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(i18n.t('permissions.cameraTitle'), i18n.t('permissions.cameraMessage'));
    return false;
  }
  return true;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(i18n.t('permissions.photosTitle'), i18n.t('permissions.photosMessage'));
    return false;
  }
  return true;
}

export async function takeCookedPhoto(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return DEMO_COOKED_IMAGE;
  }
  if (!(await requestCameraPermission())) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

export async function pickCookedPhotoFromLibrary(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return DEMO_COOKED_IMAGE;
  }
  if (!(await requestMediaLibraryPermission())) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}
