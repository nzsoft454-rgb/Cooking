import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Panel, PanelDivider, SectionTitle } from '../../components/ui';
import { SettingsStackParamList } from '../../navigation/types';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

export function LegalScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Legal'>) {
  const { t } = useTranslation();

  return (
    <SettingsSubScreenLayout
      title={t('settings.legal.title')}
      subtitle={t('settings.legal.subtitle')}
      onBack={() => navigation.goBack()}
    >
      <SectionTitle label={t('settings.legal.sectionTerms')} />
      <Panel style={settingsStyles.panel}>
        <Text style={settingsStyles.p}>{t('settings.legal.termsMock')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.legal.disclaimer')}</Text>
      </Panel>
    </SettingsSubScreenLayout>
  );
}
