import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigationProp } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  FooterBar,
  FooterPrimaryButton,
  Header,
  HeroCard,
  Panel,
  PanelDivider,
  PrimaryButton,
  Screen,
  SectionTitle,
  SettingsRow,
} from '../../components/ui';
import { openTabScreenFresh } from '../../navigation/navigationHelpers';
import type { RootTabParamList, SettingsStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { premiumPlanI18nKey } from '../../utils/premiumPlan';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

const LINKS: { key: keyof SettingsStackParamList; labelKey: string; id: string }[] = [
  { key: 'Profile', labelKey: 'settings.home.profile', id: 'D-001-c' },
  { key: 'Premium', labelKey: 'settings.home.premium', id: 'D-001-e' },
  { key: 'Notifications', labelKey: 'settings.home.notifications', id: 'D-001-f' },
  { key: 'Language', labelKey: 'settings.home.language', id: 'D-001-b' },
  { key: 'Help', labelKey: 'settings.home.help', id: 'D-001-d' },
  { key: 'Legal', labelKey: 'settings.home.legal', id: 'D-001-a' },
  { key: 'Login', labelKey: 'settings.home.login', id: 'ログイン' },
];

export function SettingsHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, remainingGemini, resetDemoData } = useApp();

  const planMeta = user.isPremium
    ? t('settings.home.planMetaPremium', {
        plan: t(premiumPlanI18nKey(user.premiumPlan)),
      })
    : t('settings.home.planMeta', {
        plan: t('common.planFree'),
        remaining: remainingGemini,
        max: user.geminiLimit.maxPerDay,
      });

  const confirmReplayTutorial = () => {
    Alert.alert(
      t('settings.home.replayTutorialConfirmTitle'),
      t('settings.home.replayTutorialConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.home.replayTutorial'),
          onPress: () => {
            resetDemoData();
            const parent = navigation.getParent<NavigationProp<RootTabParamList>>();
            if (parent) openTabScreenFresh(parent, 'FridgeTab', 'FridgeHome');
          },
        },
      ]
    );
  };

  const confirmReset = () => {
    Alert.alert(
      t('settings.home.resetDemoConfirmTitle'),
      t('settings.home.resetDemoConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.home.resetDemo'), style: 'destructive', onPress: resetDemoData },
      ]
    );
  };

  return (
    <Screen edges={['top']}>
      <Header title={t('settings.home.title')} subtitle={t('settings.home.subtitle')} />

      <View style={styles.content}>
        <HeroCard style={styles.summary}>
          <View style={styles.summaryInner}>
            <Text style={styles.summaryEyebrow}>{t('settings.home.accountEyebrow')}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.meta}>{planMeta}</Text>
          </View>
        </HeroCard>

        <SectionTitle label={t('settings.home.sectionMenu')} />
        <Panel style={styles.list}>
          <SettingsRow
            label={t('settings.home.screenGallery')}
            meta="QA"
            onPress={() => navigation.navigate('ScreenGallery')}
          />
          <PanelDivider />
          {LINKS.map((item, index) => (
            <React.Fragment key={item.key}>
              {index > 0 ? <PanelDivider /> : null}
              <SettingsRow
                label={t(item.labelKey)}
                meta={item.id}
                onPress={() => navigation.navigate(item.key)}
              />
            </React.Fragment>
          ))}
        </Panel>

        <View style={styles.replayBlock}>
          <PrimaryButton
            label={t('settings.home.replayTutorial')}
            onPress={confirmReplayTutorial}
          />
        </View>
      </View>

      <FooterBar>
        <FooterPrimaryButton
          label={t('settings.home.resetDemo')}
          variant="dangerOutline"
          onPress={confirmReset}
        />
      </FooterBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  summary: {
    overflow: 'hidden',
  },
  summaryInner: {
    padding: 16,
    paddingLeft: 20,
    gap: 4,
  },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  email: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.ink,
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  list: {
    overflow: 'hidden',
  },
  replayBlock: {
    marginTop: 20,
  },
});
