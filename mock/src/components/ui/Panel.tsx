import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { pressFeedback } from '../../theme/motion';

const R = colors.radius;

/** マットスチールのパネル */
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Chip({
  label,
  selected,
  onPress,
  segment,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** ヘッダータブなど均等幅配置向け */
  segment?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        segment && styles.chipSegment,
        selected && styles.chipSelected,
        pressed && pressFeedback(pressed),
      ]}
    >
      <Text
        numberOfLines={segment ? 1 : undefined}
        adjustsFontSizeToFit={segment}
        minimumFontScale={segment ? 0.78 : undefined}
        style={[
          styles.chipText,
          segment && styles.chipTextSegment,
          selected && styles.chipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: R,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: R,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipSegment: {
    flex: 1,
    minWidth: 0,
    marginRight: 0,
    marginBottom: 0,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    color: colors.ink,
    fontWeight: '500',
    fontSize: 13,
  } as TextStyle,
  chipTextSegment: {
    fontSize: 12,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
