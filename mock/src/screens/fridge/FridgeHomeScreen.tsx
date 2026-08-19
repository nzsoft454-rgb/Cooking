import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FridgeIngredientGrid, type FridgeGridColumns } from '../../components/fridge/FridgeIngredientGrid';
import { FridgeListToolbar } from '../../components/fridge/FridgeListToolbar';
import { FridgeSortMenuModal } from '../../components/fridge/FridgeSortMenuModal';
import {
  AppModal,
  ConfirmDialog,
  FadeInView,
  FooterBar,
  FooterPrimaryButton,
  HeaderStack,
  PrimaryButton,
  Screen,
  SlideFadeView,
  confirmStyles,
} from '../../components/ui';
import { DEFAULT_CONDITIONS, pickRandomIngredients } from '../../data/dummy';
import { FridgeStackParamList, RootTabParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { isLongStored } from '../../utils/addedDate';
import { sortFridgeIngredients, type FridgeSortKey } from '../../utils/fridgeSort';

type Props = NativeStackScreenProps<FridgeStackParamList, 'FridgeHome'>;

const GRID_H_PAD = 10;

type FridgeDialog =
  | null
  | 'select'
  | 'gachaNeedMore'
  | 'gachaResult'
  | 'gachaQuota'
  | 'gachaAdDone'
  | 'help';

type GachaDraw = { ids: string[]; names: string[] };

function FridgeGridColumnToggle({
  columns,
  onChange,
}: {
  columns: FridgeGridColumns;
  onChange: (columns: FridgeGridColumns) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.gridColumnBar}>
      <Text style={styles.gridColumnBarLabel}>{t('fridge.home.gridColumnsTitle')}</Text>
      <View style={styles.gridColumnSegment}>
        {([3, 4] as const).map((count) => {
          const selected = columns === count;
          return (
            <Pressable
              key={count}
              onPress={() => onChange(count)}
              style={({ pressed }) => [
                styles.gridColumnOption,
                selected && styles.gridColumnOptionActive,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t('fridge.home.gridColumnsLabel', { count })}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={selected ? colors.primary : colors.inkMuted}
              />
              <Text
                style={[styles.gridColumnOptionText, selected && styles.gridColumnOptionTextActive]}
              >
                {t('fridge.home.gridColumnsLabel', { count })}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FridgeHomeScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const rootNav = useNavigation<NavigationProp<RootTabParamList>>();
  const { activeIngredients, remainingGemini, user, rewardGeminiFromAd, consumeGemini } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortKey, setSortKey] = useState<FridgeSortKey>(
    route.params?.sortKey ?? 'addedAscFreshFirst'
  );
  const [dialog, setDialog] = useState<FridgeDialog>(null);
  const [gachaDraw, setGachaDraw] = useState<GachaDraw | null>(null);
  const [gridColumns, setGridColumns] = useState<FridgeGridColumns>(4);

  useEffect(() => {
    if (route.params?.sortKey) {
      setSortKey(route.params.sortKey);
    }
  }, [route.params?.sortKey]);

  const sorted = useMemo(
    () => sortFridgeIngredients(activeIngredients, sortKey, i18n.language),
    [activeIngredients, sortKey, i18n.language]
  );

  const longStoredCount = useMemo(
    () => activeIngredients.filter((item) => isLongStored(item.addedDate)).length,
    [activeIngredients]
  );

  const longStoredLegendVisible = longStoredCount > 0;

  useEffect(() => {
    const alive = new Set(activeIngredients.map((i) => i.id));
    setSelected((prev) => {
      const next = prev.filter((id) => alive.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [activeIngredients]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      const alive = new Set(activeIngredients.map((i) => i.id));
      setSelected((prev) => prev.filter((id) => alive.has(id)));
    });
    return unsub;
  }, [navigation, activeIngredients]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedNames = () =>
    sorted.filter((i) => selected.includes(i.id)).map((i) => i.name);

  const cookSelected = () => {
    if (selected.length === 0) {
      setDialog('select');
      return;
    }
    navigation.navigate('CookingConfirm', {
      ingredientIds: selected,
      ingredientNames: selectedNames(),
      origin: 'fridge',
    });
  };

  const editSelected = () => {
    if (selected.length === 1) {
      navigation.navigate('IngredientEdit', { ingredientId: selected[0] });
      return;
    }
    navigation.navigate('IngredientBatchEdit', { ingredientIds: selected });
  };

  const gachaPool = useMemo(
    () => activeIngredients.filter((i) => i.attribute !== 'other'),
    [activeIngredients]
  );

  const navigateToGachaGenerating = (draw: GachaDraw, geminiPreConsumed: boolean) => {
    setDialog(null);
    rootNav.navigate('RecipeTab', {
      screen: 'RecipeGenerating',
      params: {
        ingredientIds: draw.ids,
        ingredientNames: draw.names,
        conditions: DEFAULT_CONDITIONS,
        mode: 'gacha',
        generationKey: Date.now(),
        geminiPreConsumed,
        origin: 'fridge',
      },
    });
  };

  const showGachaResult = () => {
    const drawn = pickRandomIngredients(gachaPool, 2, 4);
    const draw: GachaDraw = {
      ids: drawn.map((i) => i.id),
      names: drawn.map((i) => i.name),
    };
    setGachaDraw(draw);
    setDialog('gachaResult');
  };

  const launchGacha = () => {
    if (!gachaDraw) return;
    if (!user.isPremium && remainingGemini <= 0) {
      setDialog('gachaQuota');
      return;
    }
    let geminiPreConsumed = false;
    if (!user.isPremium) {
      if (!consumeGemini()) {
        setDialog('gachaQuota');
        return;
      }
      geminiPreConsumed = true;
    }
    navigateToGachaGenerating(gachaDraw, geminiPreConsumed);
  };

  const startGacha = () => {
    if (gachaPool.length < 2) {
      setDialog('gachaNeedMore');
      return;
    }
    showGachaResult();
  };

  const showHelp = () => {
    setDialog('help');
  };

  return (
    <Screen edges={['top']}>
      <HeaderStack
        title={t('fridge.home.title')}
        right={
          <View style={styles.headerRight}>
            <FadeInView contentKey={sorted.length} style={styles.countBadgeWrap}>
              <View style={styles.countBadge}>
                <Text style={styles.countLabel}>{t('fridge.home.ingredientLabel')}</Text>
                <Text style={styles.countText}>{sorted.length}</Text>
                <Text style={styles.countUnit}>{t('common.itemUnit')}</Text>
              </View>
            </FadeInView>
            <Pressable onPress={showHelp} style={styles.helpBtn} hitSlop={8}>
              <Text style={styles.helpBtnText}>?</Text>
            </Pressable>
          </View>
        }
        subHeader={
          <View style={styles.subHeaderStack}>
            <FridgeListToolbar
              sortKey={sortKey}
              onOpenMenu={() => setSortMenuOpen(true)}
            />
            <FridgeGridColumnToggle columns={gridColumns} onChange={setGridColumns} />
          </View>
        }
      />

      <FridgeSortMenuModal
        visible={sortMenuOpen}
        onClose={() => setSortMenuOpen(false)}
        sortKey={sortKey}
        onSortChange={setSortKey}
        onSearch={(query) => {
          setSortMenuOpen(false);
          if (!query) return;
          navigation.navigate('FridgeSearch', { query, sortKey });
        }}
      />

      <View style={styles.selectBarWrap}>
        <SlideFadeView visible={selected.length > 0} style={styles.selectBarSlide}>
          <View style={styles.selectBar}>
            <FadeInView contentKey={selected.length}>
              <Text style={styles.selectBarText}>
                {t('fridge.home.selectedBar', { count: selected.length })}
              </Text>
            </FadeInView>
            <View style={styles.selectActions}>
              <Pressable onPress={editSelected}>
                <Text style={styles.selectEdit}>
                  {selected.length === 1
                    ? t('fridge.home.editSelected')
                    : t('fridge.home.batchEdit')}
                </Text>
              </Pressable>
              <Pressable onPress={() => setSelected([])}>
                <Text style={styles.selectClear}>{t('fridge.home.clear')}</Text>
              </Pressable>
            </View>
          </View>
        </SlideFadeView>
      </View>

      <View style={styles.longStoredLegendWrap}>
        <SlideFadeView visible={longStoredLegendVisible} style={styles.longStoredLegendSlide}>
          <View style={styles.longStoredLegend}>
            <View style={styles.longStoredLegendRow}>
              <FadeInView contentKey={longStoredCount} style={styles.legendItemWrap}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotSoon]} />
                  <Text style={styles.legendText}>
                    {t('fridge.home.longStoredLegend', { count: longStoredCount })}
                  </Text>
                </View>
              </FadeInView>
            </View>
          </View>
        </SlideFadeView>
      </View>

      <FridgeIngredientGrid
        items={sorted}
        selected={selected}
        numColumns={gridColumns}
        onToggle={toggle}
        onEdit={(id) => navigation.navigate('IngredientEdit', { ingredientId: id })}
        emptyMessage={t('fridge.home.empty')}
        emptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t('fridge.home.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('fridge.home.empty')}</Text>
            <PrimaryButton
              label={t('fridge.catalogPick.cta')}
              onPress={() => navigation.navigate('CatalogPick')}
              style={styles.emptyCta}
            />
          </View>
        }
      />

      <FooterBar>
        {sorted.length === 0 ? (
          <FooterPrimaryButton
            label={t('fridge.catalogPick.cta')}
            onPress={() => navigation.navigate('CatalogPick')}
          />
        ) : (
          <>
            <FooterPrimaryButton
              label={t('fridge.home.gacha')}
              variant="secondary"
              onPress={startGacha}
            />
            <FooterPrimaryButton
              label={
                selected.length > 0
                  ? t('fridge.home.cookWithCount', { count: selected.length })
                  : t('fridge.home.cook')
              }
              onPress={cookSelected}
            />
          </>
        )}
      </FooterBar>

      <ConfirmDialog
        visible={dialog === 'select'}
        onClose={() => setDialog(null)}
        title={t('fridge.home.selectAlertTitle')}
        body={t('fridge.home.selectAlertMessage')}
        dismissLabel={t('common.close')}
      />

      <ConfirmDialog
        visible={dialog === 'gachaNeedMore'}
        onClose={() => setDialog(null)}
        title={t('fridge.home.gachaAlertTitle')}
        body={t('fridge.home.gachaAlertMessage')}
        dismissLabel={t('common.close')}
      />

      <ConfirmDialog
        visible={dialog === 'help'}
        onClose={() => setDialog(null)}
        title={t('fridge.home.helpTitle')}
        body={t('fridge.home.helpMessage')}
        dismissLabel={t('common.close')}
      />

      <ConfirmDialog
        visible={dialog === 'gachaResult' && !!gachaDraw}
        onClose={() => setDialog(null)}
        title={t('fridge.home.gachaResultTitle')}
        body={t('fridge.home.gachaResultMessage', {
          list: gachaDraw?.names.map((n) => `・${n}`).join('\n') ?? '',
        })}
        cancelLabel={t('fridge.home.gachaRetry')}
        confirmLabel={t('fridge.home.gachaConfirm')}
        onCancel={showGachaResult}
        onConfirm={launchGacha}
      />

      <ConfirmDialog
        visible={dialog === 'gachaAdDone'}
        onClose={() => setDialog(null)}
        title={t('gemini.title')}
        body={t('gemini.adComplete', { count: 1 })}
        cancelLabel={t('common.close')}
        confirmLabel={t('fridge.home.gachaConfirm')}
        onConfirm={launchGacha}
      />

      <AppModal visible={dialog === 'gachaQuota'} onClose={() => setDialog(null)}>
        <View style={confirmStyles.card}>
          <Text style={confirmStyles.title}>{t('gemini.quotaZero')}</Text>
          <Text style={confirmStyles.body}>{t('gemini.quotaExceeded')}</Text>
          <PrimaryButton
            label={t('gemini.watchAdReward', { count: 1 })}
            onPress={() => {
              rewardGeminiFromAd(1);
              setDialog('gachaAdDone');
            }}
            style={{ marginTop: 16 }}
          />
          <PrimaryButton
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => setDialog(null)}
            style={{ marginTop: 10 }}
          />
        </View>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    gap: 8,
  },
  countBadgeWrap: {
    flex: 0,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  countLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  countText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  countUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  subHeaderStack: {
    width: '100%',
  },
  gridColumnBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  gridColumnBarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  gridColumnSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridColumnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  gridColumnOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  gridColumnOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  gridColumnOptionTextActive: {
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
  selectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  selectEdit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  selectClear: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  longStoredLegendWrap: {
    marginHorizontal: GRID_H_PAD,
    marginTop: 10,
  },
  longStoredLegendSlide: {
    width: '100%',
  },
  longStoredLegend: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: colors.radius,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  longStoredLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItemWrap: {
    flex: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotSoon: {
    backgroundColor: '#C4860A',
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
});
