import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FridgeIngredientGrid } from '../../components/fridge/FridgeIngredientGrid';
import { FridgeListToolbar } from '../../components/fridge/FridgeListToolbar';
import { FridgeSortMenuModal } from '../../components/fridge/FridgeSortMenuModal';
import {
  ConfirmDialog,
  FadeInView,
  FooterBar,
  FooterPrimaryButton,
  HeaderStack,
  Screen,
  SlideFadeView,
} from '../../components/ui';
import { FridgeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import {
  filterFridgeIngredientsByQuery,
  sortFridgeIngredients,
} from '../../utils/fridgeSort';

type Props = NativeStackScreenProps<FridgeStackParamList, 'FridgeSearch'>;

export function FridgeSearchScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const { activeIngredients } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const { query, sortKey: initialSortKey } = route.params;
  const [sortKey, setSortKey] = useState(initialSortKey);

  useEffect(() => {
    setSortKey(route.params.sortKey);
  }, [route.params.sortKey]);

  const results = useMemo(() => {
    const filtered = filterFridgeIngredientsByQuery(activeIngredients, query);
    return sortFridgeIngredients(filtered, sortKey, i18n.language);
  }, [activeIngredients, query, sortKey, i18n.language]);

  useEffect(() => {
    const alive = new Set(results.map((i) => i.id));
    setSelected((prev) => prev.filter((id) => alive.has(id)));
  }, [results]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedNames = () =>
    results.filter((i) => selected.includes(i.id)).map((i) => i.name);

  const cookSelected = () => {
    if (selected.length === 0) {
      setSelectDialogOpen(true);
      return;
    }
    navigation.navigate('CookingConfirm', {
      ingredientIds: selected,
      ingredientNames: selectedNames(),
      origin: 'fridge',
    });
  };

  const goBackToFridge = () => {
    navigation.navigate('FridgeHome', { sortKey });
  };

  return (
    <Screen edges={['top']}>
      <HeaderStack
        title={t('fridge.search.title')}
        onBack={goBackToFridge}
        subHeader={
          <FridgeListToolbar sortKey={sortKey} onOpenMenu={() => setSortMenuOpen(true)} />
        }
      />

      <FridgeSortMenuModal
        visible={sortMenuOpen}
        onClose={() => setSortMenuOpen(false)}
        sortKey={sortKey}
        onSortChange={setSortKey}
        initialQuery={query}
        onSearch={(nextQuery) => {
          setSortMenuOpen(false);
          if (!nextQuery) {
            navigation.navigate('FridgeHome', { sortKey });
            return;
          }
          navigation.setParams({ query: nextQuery, sortKey });
        }}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {t('fridge.search.resultFor', { query })}
        </Text>
        <Text style={styles.summaryCount}>
          {t('fridge.search.resultCount', { count: results.length })}
        </Text>
      </View>

      <View style={styles.selectBarWrap}>
        <SlideFadeView visible={selected.length > 0} style={styles.selectBarSlide}>
          <View style={styles.selectBar}>
            <FadeInView contentKey={selected.length}>
              <Text style={styles.selectBarText}>
                {t('fridge.home.selectedBar', { count: selected.length })}
              </Text>
            </FadeInView>
            <Pressable onPress={() => setSelected([])}>
              <Text style={styles.selectClear}>{t('fridge.home.clear')}</Text>
            </Pressable>
          </View>
        </SlideFadeView>
      </View>

      <FridgeIngredientGrid
        items={results}
        selected={selected}
        onToggle={toggle}
        onEdit={(id) => navigation.navigate('IngredientEdit', { ingredientId: id })}
        emptyMessage={t('fridge.search.empty', { query })}
      />

      <FooterBar>
        <FooterPrimaryButton
          label={t('fridge.search.backToFridge')}
          variant="secondary"
          onPress={goBackToFridge}
        />
        <FooterPrimaryButton
          label={
            selected.length > 0
              ? t('fridge.home.cookWithCount', { count: selected.length })
              : t('fridge.home.cook')
          }
          onPress={cookSelected}
        />
      </FooterBar>

      <ConfirmDialog
        visible={selectDialogOpen}
        onClose={() => setSelectDialogOpen(false)}
        title={t('fridge.home.selectAlertTitle')}
        body={t('fridge.home.selectAlertMessage')}
        dismissLabel={t('common.close')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  selectBarWrap: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  selectBarSlide: {
    width: '100%',
  },
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectBarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  selectClear: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
});
