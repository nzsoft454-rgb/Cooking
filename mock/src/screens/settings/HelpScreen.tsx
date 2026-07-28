import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Panel, PanelDivider, SectionTitle } from '../../components/ui';
import { SettingsStackParamList } from '../../navigation/types';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

export function HelpScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Help'>) {
  const { t } = useTranslation();

  return (
    <SettingsSubScreenLayout
      title={t('settings.help.title')}
      subtitle={t('settings.help.subtitle')}
      onBack={() => navigation.goBack()}
    >
      <SectionTitle label={t('settings.help.sectionUsage')} />
      <Panel style={settingsStyles.panel}>
        <Text style={settingsStyles.p}>{t('settings.help.step1')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.help.step2')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.help.step3')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.help.step4')}</Text>
      </Panel>
    </SettingsSubScreenLayout>
  );
}
