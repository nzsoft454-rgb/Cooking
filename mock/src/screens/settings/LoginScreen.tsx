import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import {
  FooterBar,
  FooterPrimaryButton,
  Panel,
  SectionTitle,
} from '../../components/ui';
import { SettingsStackParamList } from '../../navigation/types';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

export function LoginScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Login'>) {
  const { t } = useTranslation();

  return (
    <SettingsSubScreenLayout
      title={t('settings.login.title')}
      subtitle={t('settings.login.subtitle')}
      onBack={() => navigation.goBack()}
      footer={
        <FooterBar>
          <FooterPrimaryButton
            label={t('settings.login.continueDemo')}
            onPress={() => navigation.goBack()}
          />
        </FooterBar>
      }
    >
      <SectionTitle label={t('settings.login.sectionAuth')} />
      <Panel style={settingsStyles.panel}>
        <Text style={settingsStyles.p}>{t('settings.login.description')}</Text>
      </Panel>
    </SettingsSubScreenLayout>
  );
}
