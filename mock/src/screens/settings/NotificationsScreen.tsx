import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, Text, View } from 'react-native';
import {
  FooterBar,
  FooterPrimaryButton,
  Panel,
  SectionTitle,
} from '../../components/ui';
import { colors } from '../../theme/colors';
import { SettingsStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { scheduleFridgeDemoNotification } from '../../utils/notifications';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

export function NotificationsScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Notifications'>) {
  const { t } = useTranslation();
  const { notificationsEnabled, setNotificationsEnabled, activeIngredients } = useApp();

  const scheduleDemo = async () => {
    if (!notificationsEnabled) {
      Alert.alert(
        t('settings.notifications.disabledTitle'),
        t('settings.notifications.disabledMessage'),
      );
      return;
    }
    const result = await scheduleFridgeDemoNotification(activeIngredients);
    Alert.alert(
      result.ok ? t('settings.notifications.scheduledTitle') : t('settings.notifications.errorTitle'),
      result.message,
    );
  };

  return (
    <SettingsSubScreenLayout
      title={t('settings.notifications.title')}
      subtitle={t('settings.notifications.subtitle')}
      onBack={() => navigation.goBack()}
      footer={
        <FooterBar>
          <FooterPrimaryButton
            label={t('settings.notifications.scheduleDemo')}
            onPress={scheduleDemo}
          />
        </FooterBar>
      }
    >
      <SectionTitle label={t('settings.notifications.sectionAlerts')} />
      <Panel style={settingsStyles.panel}>
        <View style={settingsStyles.switchRow}>
          <Text style={settingsStyles.switchLabel}>{t('settings.notifications.fridgeAlert')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </Panel>
      <Text style={settingsStyles.note}>{t('settings.notifications.note')}</Text>
    </SettingsSubScreenLayout>
  );
}
