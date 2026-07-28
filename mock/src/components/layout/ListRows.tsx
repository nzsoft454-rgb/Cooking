import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { pressFeedback } from '../../theme/motion';

export function ListActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && pressFeedback(pressed)]}
      onPress={onPress}
    >
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
    </Pressable>
  );
}

export function SettingsRow({
  label,
  meta,
  onPress,
}: {
  label: string;
  meta?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsRow, pressed && pressFeedback(pressed)]}
      onPress={onPress}
    >
      <Text style={styles.settingsLabel}>{label}</Text>
      <View style={styles.settingsTrailing}>
        {meta ? <Text style={styles.settingsMeta}>{meta}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      </View>
    </Pressable>
  );
}

const R = colors.radius;

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: R,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkFaint,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  settingsTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkFaint,
  },
});
