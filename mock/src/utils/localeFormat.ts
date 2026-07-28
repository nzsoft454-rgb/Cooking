import type { AppLanguage } from '../i18n';

export function localeTag(lang: AppLanguage): string {
  return lang === 'ja' ? 'ja-JP' : 'en-US';
}

export function formatLocaleDate(
  iso: string,
  lang: AppLanguage,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(iso).toLocaleDateString(localeTag(lang), options);
}

export function formatLocaleDateTime(
  iso: string,
  lang: AppLanguage,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(iso).toLocaleString(localeTag(lang), options);
}
