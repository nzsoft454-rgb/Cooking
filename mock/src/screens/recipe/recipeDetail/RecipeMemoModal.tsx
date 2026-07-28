import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput } from 'react-native';
import { AppModal, Panel, PrimaryButton } from '../../../components/ui';
import { colors } from '../../../theme/colors';

type Props = {
  visible: boolean;
  memo: string;
  onChangeMemo: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function RecipeMemoModal({ visible, memo, onChangeMemo, onClose, onSave }: Props) {
  const { t } = useTranslation();

  return (
    <AppModal visible={visible} onClose={onClose}>
      <Panel style={styles.modalCard}>
        <Text style={styles.modalTitle}>{t('recipe.detail.memoModalTitle')}</Text>
        <TextInput
          value={memo}
          onChangeText={onChangeMemo}
          style={styles.memoInput}
          multiline
          placeholder={t('recipe.detail.memoPlaceholder')}
          placeholderTextColor={colors.inkFaint}
        />
        <PrimaryButton label={t('common.save')} onPress={onSave} style={{ marginTop: 12 }} />
        <PrimaryButton
          label={t('common.close')}
          variant="ghost"
          onPress={onClose}
          style={{ marginTop: 8 }}
        />
      </Panel>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modalCard: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 12,
  },
  memoInput: {
    minHeight: 100,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: colors.radius,
    padding: 12,
    textAlignVertical: 'top',
    color: colors.ink,
  },
});
