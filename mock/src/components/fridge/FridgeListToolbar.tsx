import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FadeInView } from '../ui';
import { colors } from '../../theme/colors';
import { pressFeedback } from '../../theme/motion';
import type { FridgeSortKey } from '../../utils/fridgeSort';

type Props = {
  sortKey: FridgeSortKey;
  onOpenMenu: () => void;
};

export function FridgeListToolbar({ sortKey, onOpenMenu }: Props) {
  const { t } = useTranslation();
  const sortLabel = (key: FridgeSortKey) => t(`fridge.sort.${key}`);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.bar, pressed && pressFeedback(pressed)]}
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel={t('fridge.home.sortMenu')}
      >
        <View style={styles.barLeft}>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
          <FadeInView contentKey={sortKey} style={styles.barLabelWrap}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {sortLabel(sortKey)}
            </Text>
          </FadeInView>
        </View>
        <Text style={styles.barHint}>{t('fridge.home.sortMenu')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
  },
  bar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  barLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  barLabelWrap: {
    flex: 1,
    minWidth: 0,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  barHint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkMuted,
  },
});
