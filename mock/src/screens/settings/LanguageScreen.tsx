import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Panel, PanelDivider, SectionTitle, SettingsRow } from '../../components/ui';
import { SettingsStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

export function LanguageScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Language'>) {
  const { t } = useTranslation();
  const { language, setLanguage } = useApp();

  return (
    <SettingsSubScreenLayout
      title={t('settings.language.title')}
      subtitle={t('settings.language.subtitle')}
      onBack={() => navigation.goBack()}
    >
      <SectionTitle label={t('settings.language.sectionDisplay')} />
      <Panel style={settingsStyles.panel}>
        <SettingsRow
          label={t('settings.language.japanese')}
          meta={language === 'ja' ? t('common.selected') : undefined}
          onPress={() => setLanguage('ja')}
        />
        <PanelDivider />
        <SettingsRow
          label={t('settings.language.english')}
          meta={language === 'en' ? t('common.selected') : undefined}
          onPress={() => setLanguage('en')}
        />
      </Panel>
      <Text style={settingsStyles.note}>{t('settings.language.note')}</Text>
    </SettingsSubScreenLayout>
  );
}
