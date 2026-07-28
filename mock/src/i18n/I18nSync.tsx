import React, { useEffect } from 'react';
import { changeAppLanguage, type AppLanguage, supportedLanguages } from './index';
import { useApp } from '../store/AppContext';

function isAppLanguage(value: string): value is AppLanguage {
  return (supportedLanguages as readonly string[]).includes(value);
}

/** AppContext の language と i18next を同期 */
export function I18nSync() {
  const { language, ready } = useApp();

  useEffect(() => {
    if (!ready || !isAppLanguage(language)) return;
    changeAppLanguage(language);
  }, [language, ready]);

  return null;
}
