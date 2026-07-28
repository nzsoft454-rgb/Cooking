import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppModal } from './AppModal';
import { PrimaryButton } from './ui';
import { colors } from '../theme/colors';

export type ConfirmDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  meta?: string | readonly string[];
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost';
  /** 1ボタンのみ（OK / 閉じる） */
  dismissLabel?: string;
  children?: React.ReactNode;
};

/** 解析確認モーダルと同じカードデザイン */
export function ConfirmDialog({
  visible,
  onClose,
  title,
  body,
  meta,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  dismissLabel,
  children,
}: ConfirmDialogProps) {
  const metaLines = meta == null ? [] : typeof meta === 'string' ? [meta] : [...meta];
  const twoActions = Boolean(confirmLabel && onConfirm);

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  return (
    <AppModal visible={visible} onClose={onClose}>
      <Pressable style={confirmStyles.card} onPress={(e) => e.stopPropagation()}>
        <Text style={confirmStyles.title}>{title}</Text>
        {body ? <Text style={confirmStyles.body}>{body}</Text> : null}
        {metaLines.map((line) => (
          <Text key={line} style={confirmStyles.meta}>
            {line}
          </Text>
        ))}
        {children}
        {twoActions ? (
          <View style={confirmStyles.actions}>
            {cancelLabel ? (
              <PrimaryButton
                label={cancelLabel}
                variant="ghost"
                onPress={handleCancel}
                style={{ flex: 1 }}
              />
            ) : null}
            <PrimaryButton
              label={confirmLabel!}
              variant={confirmVariant}
              onPress={handleConfirm}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <PrimaryButton
            label={dismissLabel ?? cancelLabel ?? 'OK'}
            variant="ghost"
            onPress={onClose}
            style={{ marginTop: 18 }}
          />
        )}
      </Pressable>
    </AppModal>
  );
}

export const confirmStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
});
