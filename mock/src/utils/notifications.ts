import { Alert, Platform } from 'react-native';
import i18n from '../i18n';
import { isLongStored } from './addedDate';

let demoTimer: ReturnType<typeof setTimeout> | null = null;

type StoredItem = { name: string; addedDate: string };

/**
 * 入庫日ベースのデモ通知（Expo Go 向け）。
 * SDK53+ の Expo Go では expo-notifications が使えないため、
 * 1分後のアプリ内 Alert で代替する。
 */
export async function scheduleFridgeDemoNotification(
  ingredients: StoredItem[]
): Promise<{ ok: boolean; message: string }> {
  const targets = ingredients.filter((i) => isLongStored(i.addedDate));

  const names =
    targets.length > 0
      ? targets.map((t) => t.name).slice(0, 3).join('・')
      : i18n.t('notifications.defaultIngredientName');

  const title = i18n.t('notifications.fridgeAlertTitle');
  const body =
    targets.length > 0
      ? i18n.t('notifications.fridgeAlertBody', { names })
      : i18n.t('notifications.fridgeAlertDemoBody');

  if (demoTimer) clearTimeout(demoTimer);
  demoTimer = setTimeout(() => {
    Alert.alert(title, body);
    demoTimer = null;
  }, 60_000);

  return {
    ok: true,
    message:
      Platform.OS === 'web'
        ? i18n.t('notifications.scheduledWeb')
        : i18n.t('notifications.scheduledNative'),
  };
}

/** @deprecated scheduleFridgeDemoNotification を使用 */
export const scheduleExpiryDemoNotification = scheduleFridgeDemoNotification;
