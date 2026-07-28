import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';

export const supportedLanguages = ['ja', 'en'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'ja';

export function getDeviceLanguage(): AppLanguage {
  return deviceLang === 'en' ? 'en' : 'ja';
}

const initialLng: AppLanguage = getDeviceLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export function changeAppLanguage(lang: AppLanguage): void {
  void i18n.changeLanguage(lang);
}

export default i18n;
