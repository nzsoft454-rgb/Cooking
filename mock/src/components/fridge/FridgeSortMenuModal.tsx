import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '../AppModal';
import {
  Chip,
  HEADER_SUB_HEIGHT,
  HEADER_TITLE_ROW_HEIGHT,
  Panel,
  PrimaryButton,
} from '../ui';
import { colors } from '../../theme/colors';
import {
  FRIDGE_SORT_KEYS,
  type FridgeSortKey,
} from '../../utils/fridgeSort';

type Props = {
  visible: boolean;
  onClose: () => void;
  sortKey: FridgeSortKey;
  onSortChange: (key: FridgeSortKey) => void;
  onSearch: (query: string) => void;
  initialQuery?: string;
};

export function FridgeSortMenuModal({
  visible,
  onClose,
  sortKey,
  onSortChange,
  onSearch,
  initialQuery = '',
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState(initialQuery);

  React.useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
    }
  }, [visible, initialQuery]);

  const sortLabel = (key: FridgeSortKey) => t(`fridge.sort.${key}`);

  const submitSearch = () => {
    onSearch(query.trim());
    onClose();
  };

  const sheetTop = insets.top + HEADER_TITLE_ROW_HEIGHT + HEADER_SUB_HEIGHT;

  return (
    <AppModal visible={visible} onClose={onClose} anchorTop={sheetTop}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <Panel style={styles.panel}>
          <Text style={styles.sectionLabel}>{t('fridge.home.sortLabel')}</Text>
          <View style={styles.chipRow}>
            {FRIDGE_SORT_KEYS.map((key) => (
              <Chip
                key={key}
                label={sortLabel(key)}
                selected={sortKey === key}
                onPress={() => onSortChange(key)}
              />
            ))}
          </View>

          <Text style={[styles.sectionLabel, styles.searchSection]}>
            {t('fridge.home.searchLabel')}
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('fridge.home.searchPlaceholder')}
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <PrimaryButton
            label={t('fridge.home.searchSubmit')}
            onPress={submitSearch}
            style={styles.searchBtn}
          />
        </Panel>
      </ScrollView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginHorizontal: 16,
    padding: 12,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
    letterSpacing: 0.3,
  },
  searchSection: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: colors.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
  },
  searchBtn: {
    marginTop: 4,
  },
});
