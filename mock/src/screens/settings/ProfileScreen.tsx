import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Panel, PanelDivider, SectionTitle } from '../../components/ui';
import type { AppLanguage } from '../../i18n';
import { SettingsStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { formatLocaleDate } from '../../utils/localeFormat';
import { premiumPlanI18nKey } from '../../utils/premiumPlan';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

export function ProfileScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Profile'>) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as AppLanguage;
  const { user, remainingGemini } = useApp();

  return (
    <SettingsSubScreenLayout
      title={t('settings.profile.title')}
      subtitle={t('settings.profile.subtitle')}
      onBack={() => navigation.goBack()}
    >
      <SectionTitle label={t('settings.profile.sectionAccount')} />
      <Panel style={settingsStyles.panel}>
        <Text style={settingsStyles.p}>{t('settings.profile.uid', { uid: user.uid })}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.profile.email', { email: user.email })}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>
          {user.isPremium
            ? t('settings.profile.premiumActive', {
                plan: t(premiumPlanI18nKey(user.premiumPlan)),
              })
            : t('settings.profile.premiumInactive')}
        </Text>
        {user.isPremium && user.premiumExpiresAt ? (
          <>
            <PanelDivider />
            <Text style={settingsStyles.p}>
              {t('settings.profile.premiumExpires', {
                date: formatLocaleDate(user.premiumExpiresAt, lang, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
              })}
            </Text>
          </>
        ) : null}
        <PanelDivider />
        <Text style={settingsStyles.p}>
          {t('settings.profile.geminiUsage', {
            used: user.geminiLimit.usedToday,
            max: user.geminiLimit.maxPerDay,
            remaining: remainingGemini,
          })}
        </Text>
      </Panel>
    </SettingsSubScreenLayout>
  );
}
