import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { pressFeedback } from '../../theme/motion';

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  compact,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'danger' && styles.btnDanger,
        variant === 'dangerOutline' && styles.btnDangerOutline,
        variant === 'ghost' && styles.btnGhost,
        disabled && { opacity: 0.7 },
        pressed && !disabled && pressFeedback(true),
        style,
      ]}
    >
      <Text
        numberOfLines={compact ? 1 : undefined}
        adjustsFontSizeToFit={compact}
        minimumFontScale={compact ? 0.82 : undefined}
        style={[
          styles.btnText,
          variant === 'primary' && { color: '#fff' },
          (variant === 'secondary' || variant === 'ghost') && { color: colors.ink },
          variant === 'danger' && { color: '#fff' },
          variant === 'dangerOutline' && { color: colors.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FooterPrimaryButton({
  style,
  ...props
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return <PrimaryButton {...props} compact style={[styles.footerBtn, style]} />;
}

const R = colors.radius;

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerBtn: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnDangerOutline: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
