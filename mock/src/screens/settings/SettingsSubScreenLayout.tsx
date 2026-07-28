import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import {
  FooterBar,
  FooterPrimaryButton,
  Header,
  Screen,
} from '../../components/ui';
import { colors } from '../../theme/colors';

export function SettingsSubScreenLayout({
  title,
  subtitle,
  children,
  onBack,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Screen edges={['top']}>
      <Header title={title} subtitle={subtitle} onBack={onBack} />
      <ScrollView
        style={settingsStyles.scroll}
        contentContainerStyle={settingsStyles.body}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ?? (
        <FooterBar>
          <FooterPrimaryButton
            label={t('common.back')}
            variant="ghost"
            onPress={onBack}
          />
        </FooterBar>
      )}
    </Screen>
  );
}

export const settingsStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  panel: {
    overflow: 'hidden',
    padding: 16,
  },
  p: {
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  note: {
    marginTop: 16,
    fontSize: 12,
    color: colors.inkFaint,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
});
