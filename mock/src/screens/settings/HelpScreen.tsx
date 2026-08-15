import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigationProp } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import {
  Panel,
  PanelDivider,
  PrimaryButton,
  SectionTitle,
} from '../../components/ui';
import { openTabScreenFresh } from '../../navigation/navigationHelpers';
import type { RootTabParamList, SettingsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

function FlowStep({
  n,
  title,
  body,
  last,
}: {
  n: number;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <View style={styles.flowRow}>
      <View style={styles.flowNum}>
        <Text style={styles.flowNumText}>{n}</Text>
      </View>
      <View style={[styles.flowCopy, last && styles.flowCopyLast]}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
    </View>
  );
}

function HelpCard({
  icon,
  title,
  body,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <View>
      <View style={styles.cardRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardBody}>{body}</Text>
        </View>
      </View>
      {last ? null : <PanelDivider />}
    </View>
  );
}

export function HelpScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'Help'>) {
  const { t } = useTranslation();

  const openCatalogPick = () => {
    const parent = navigation.getParent<NavigationProp<RootTabParamList>>();
    if (parent) openTabScreenFresh(parent, 'FridgeTab', 'CatalogPick');
  };

  return (
    <SettingsSubScreenLayout
      title={t('settings.help.title')}
      subtitle={t('settings.help.subtitle')}
      onBack={() => navigation.goBack()}
    >
      <SectionTitle label={t('settings.help.flowTitle')} />
      <Panel style={styles.flowPanel}>
        <FlowStep n={1} title={t('settings.help.flow1Title')} body={t('settings.help.flow1Body')} />
        <FlowStep n={2} title={t('settings.help.flow2Title')} body={t('settings.help.flow2Body')} />
        <FlowStep
          n={3}
          title={t('settings.help.flow3Title')}
          body={t('settings.help.flow3Body')}
          last
        />
      </Panel>
      <PrimaryButton
        label={t('settings.help.tryCta')}
        onPress={openCatalogPick}
        style={styles.cta}
      />

      <SectionTitle label={t('settings.help.sectionAdd')} />
      <Panel style={settingsStyles.panel}>
        <HelpCard
          icon="nutrition-outline"
          title={t('settings.help.catalogTitle')}
          body={t('settings.help.catalogBody')}
        />
        <HelpCard
          icon="camera-outline"
          title={t('settings.help.cameraTitle')}
          body={t('settings.help.cameraBody')}
        />
        <HelpCard
          icon="receipt-outline"
          title={t('settings.help.receiptTitle')}
          body={t('settings.help.receiptBody')}
          last
        />
      </Panel>

      <SectionTitle label={t('settings.help.sectionCook')} />
      <Panel style={settingsStyles.panel}>
        <HelpCard
          icon="hand-left-outline"
          title={t('settings.help.fridgeTitle')}
          body={t('settings.help.fridgeBody')}
        />
        <HelpCard
          icon="dice-outline"
          title={t('settings.help.gachaTitle')}
          body={t('settings.help.gachaBody')}
        />
        <HelpCard
          icon="restaurant-outline"
          title={t('settings.help.dishTitle')}
          body={t('settings.help.dishBody')}
        />
        <HelpCard
          icon="checkmark-circle-outline"
          title={t('settings.help.afterTitle')}
          body={t('settings.help.afterBody')}
          last
        />
      </Panel>

      <SectionTitle label={t('settings.help.sectionTrouble')} />
      <Panel style={settingsStyles.panel}>
        <HelpCard
          icon="sparkles-outline"
          title={t('settings.help.quotaTitle')}
          body={t('settings.help.quotaBody')}
        />
        <HelpCard
          icon="create-outline"
          title={t('settings.help.wrongTitle')}
          body={t('settings.help.wrongBody')}
        />
        <HelpCard
          icon="refresh-outline"
          title={t('settings.help.retryTitle')}
          body={t('settings.help.retryBody')}
          last
        />
      </Panel>
    </SettingsSubScreenLayout>
  );
}

const styles = StyleSheet.create({
  flowPanel: {
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  flowNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flowNumText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  flowCopy: {
    flex: 1,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 14,
  },
  flowCopyLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 12,
  },
  cta: {
    marginTop: 12,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
