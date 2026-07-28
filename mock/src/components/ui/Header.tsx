import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors } from '../../theme/colors';
import { pressFeedback } from '../../theme/motion';
import {
  HEADER_BODY_HEIGHT,
  HEADER_HEIGHT,
  HEADER_SUB_HEIGHT,
  HEADER_TITLE_ROW_HEIGHT,
} from './constants';

export function Header({
  title,
  subtitle,
  right,
  onBack,
  borderless,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  borderless?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <View style={[styles.header, borderless && styles.headerBorderless]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerBack,
            pressed && pressFeedback(true),
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
      ) : null}
      <View style={styles.headerBody}>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <View style={styles.headerSubSlot}>
          {subtitle ? (
            <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

/** 案C: 2段ヘッダー（タイトル行 + サブナビ行） */
export function HeaderStack({
  title,
  right,
  onBack,
  subHeader,
}: {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
  subHeader: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerStack}>
      <View style={styles.headerTitleRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBack,
              pressed && pressFeedback(true),
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        ) : null}
        <Text style={styles.headerTitleCompact} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
      <HeaderSubBar>{subHeader}</HeaderSubBar>
    </View>
  );
}

export function HeaderSubBar({ children }: { children: React.ReactNode }) {
  return <View style={styles.headerSubBar}>{children}</View>;
}

/** 案C: 2段ヘッダー内の均等幅タブ */
export function HeaderSegmentTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.segmentRow}>
      {items.map((item) => {
        const selected = value === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && pressFeedback(pressed),
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[styles.segmentText, selected && styles.segmentTextSelected]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const R = colors.radius;

const styles = StyleSheet.create({
  header: {
    minHeight: HEADER_HEIGHT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerBorderless: {
    borderBottomWidth: 0,
  },
  headerBack: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
    height: HEADER_BODY_HEIGHT,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  headerSubSlot: {
    minHeight: 16,
    marginTop: 2,
    justifyContent: 'center',
  },
  headerSub: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.inkFaint,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexShrink: 0,
    marginLeft: 8,
    justifyContent: 'center',
  },
  headerStack: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 20,
    elevation: 20,
  },
  headerTitleRow: {
    minHeight: HEADER_TITLE_ROW_HEIGHT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitleCompact: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  headerSubBar: {
    minHeight: HEADER_SUB_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  segmentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    minHeight: HEADER_SUB_HEIGHT,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    height: 32,
    borderRadius: R,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  segmentSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkMuted,
    textAlign: 'center',
    includeFontPadding: false,
  } as TextStyle,
  segmentTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
