import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import {
  FooterBar,
  FooterPrimaryButton,
  Panel,
  PanelDivider,
  SectionTitle,
  SettingsRow,
} from '../../components/ui';
import type { AppLanguage } from '../../i18n';
import { SettingsStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import type { PremiumPlanId } from '../../types';
import { formatLocaleDate } from '../../utils/localeFormat';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

const PREMIUM_PLANS: Exclude<PremiumPlanId, 'free'>[] = ['monthly', 'semiannual', 'annual'];

function planPriceKey(plan: Exclude<PremiumPlanId, 'free'>) {
  if (plan === 'monthly') return 'settings.premium.priceMonthly';
  if (plan === 'semiannual') return 'settings.premium.priceSemiannual';
  return 'settings.premium.priceAnnual';
}

function planLabelKey(plan: Exclude<PremiumPlanId, 'free'>) {
  if (plan === 'monthly') return 'settings.premium.planMonthly';
  if (plan === 'semiannual') return 'settings.premium.planSemiannual';
  return 'settings.premium.planAnnual';
}

export function PremiumScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Premium'>) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as AppLanguage;
  const { user, subscribePremiumPlan, cancelPremium } = useApp();

  return (
    <SettingsSubScreenLayout
      title={t('settings.premium.title')}
      subtitle={t('settings.premium.subtitle')}
      onBack={() => navigation.goBack()}
      footer={
        user.isPremium ? (
          <FooterBar>
            <FooterPrimaryButton
              label={t('settings.premium.switchToFree')}
              variant="ghost"
              onPress={cancelPremium}
            />
          </FooterBar>
        ) : undefined
      }
    >
      <SectionTitle label={t('settings.premium.sectionPlan')} />
      <Panel style={settingsStyles.panel}>
        <Text style={settingsStyles.p}>
          {user.isPremium
            ? t('settings.premium.currentPremiumNamed', {
                plan: t(planLabelKey(user.premiumPlan as Exclude<PremiumPlanId, 'free'>)),
              })
            : t('settings.premium.currentFree')}
        </Text>
        {user.isPremium && user.premiumExpiresAt ? (
          <>
            <PanelDivider />
            <Text style={settingsStyles.p}>
              {t('settings.premium.expiresAt', {
                date: formatLocaleDate(user.premiumExpiresAt, lang, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
              })}
            </Text>
          </>
        ) : null}
      </Panel>

      <SectionTitle label={t('settings.premium.sectionChoose')} />
      <Panel style={settingsStyles.panel}>
        {PREMIUM_PLANS.map((plan, index) => {
          const selected = user.isPremium && user.premiumPlan === plan;
          return (
            <React.Fragment key={plan}>
              {index > 0 ? <PanelDivider /> : null}
              <SettingsRow
                label={t(planLabelKey(plan))}
                meta={selected ? t('common.selected') : t(planPriceKey(plan))}
                onPress={() => subscribePremiumPlan(plan)}
              />
            </React.Fragment>
          );
        })}
      </Panel>
      <Text style={settingsStyles.note}>{t('settings.premium.noteMock')}</Text>
    </SettingsSubScreenLayout>
  );
}
