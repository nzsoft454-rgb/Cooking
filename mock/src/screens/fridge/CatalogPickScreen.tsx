import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  FoodThumb,
  FooterBar,
  FooterPrimaryButton,
  Header,
  Screen,
} from '../../components/ui';
import { INGREDIENT_CATALOG } from '../../data/ingredientCatalog';
import {
  getCatalogEntryById,
  getStarterCatalogEntries,
} from '../../data/starterCatalog';
import { FridgeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { pressFeedback } from '../../theme/motion';
import { guessIngredientAttribute } from '../../utils/ingredientAttribute';
import {
  catalogEntryToImageId,
  normalizeIngredientKey,
  resolveCatalogEntry,
} from '../../utils/resolveIngredientImage';

type Props = NativeStackScreenProps<FridgeStackParamList, 'CatalogPick'>;

const NUM_COLUMNS = 4;
const GRID_GAP = 8;
const GRID_H_PAD = 16;
const SEARCH_LIMIT = 40;

function catalogImageUrl(id: string): string {
  return `asset://ing_${catalogEntryToImageId(id)}`;
}

export function CatalogPickScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { activeIngredients, addIngredients } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const cardWidth =
    (width - GRID_H_PAD * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const ownedCatalogIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of activeIngredients) {
      const entry = resolveCatalogEntry(item.name);
      if (entry) ids.add(entry.id);
    }
    return ids;
  }, [activeIngredients]);

  const starterEntries = useMemo(() => getStarterCatalogEntries(), []);

  const searchEntries = useMemo(() => {
    const key = normalizeIngredientKey(query);
    if (!key) return [];
    const starterIdSet = new Set(starterEntries.map((entry) => entry.id));
    return INGREDIENT_CATALOG.filter((entry) => {
      if (starterIdSet.has(entry.id)) return false;
      if (normalizeIngredientKey(entry.name).includes(key)) return true;
      return entry.aliases.some((alias) => normalizeIngredientKey(alias).includes(key));
    }).slice(0, SEARCH_LIMIT);
  }, [query, starterEntries]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const cookWithPicks = () => {
    const entries = selectedIds
      .map((id) => getCatalogEntryById(id))
      .filter((entry): entry is NonNullable<typeof entry> => entry != null);
    if (entries.length === 0) return;

    const existingIdByCatalog = new Map<string, string>();
    for (const item of activeIngredients) {
      const entry = resolveCatalogEntry(item.name);
      if (entry) existingIdByCatalog.set(entry.id, item.id);
    }

    const toCreate = entries.filter((entry) => !existingIdByCatalog.has(entry.id));
    const created = addIngredients(
      toCreate.map((entry) => ({
        name: entry.name,
        imageUrl: catalogImageUrl(entry.id),
        attribute: guessIngredientAttribute(entry.name),
        quantity: 1,
      }))
    );
    toCreate.forEach((entry, index) => {
      const createdItem = created[index];
      if (createdItem) existingIdByCatalog.set(entry.id, createdItem.id);
    });

    const ingredientIds = entries
      .map((entry) => existingIdByCatalog.get(entry.id))
      .filter((id): id is string => Boolean(id));
    const ingredientNames = entries.map((entry) => entry.name);

    navigation.replace('CookingConfirm', {
      ingredientIds,
      ingredientNames,
      origin: 'fridge',
    });
  };

  const renderCard = (id: string, name: string) => {
    const selected = selectedIds.includes(id);
    const owned = ownedCatalogIds.has(id);
    return (
      <Pressable
        key={id}
        onPress={() => toggle(id)}
        style={({ pressed }) => [
          styles.card,
          { width: cardWidth, marginRight: 0 },
          selected && styles.cardSelected,
          pressed && pressFeedback(true),
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <FoodThumb imageUrl={catalogImageUrl(id)} name={name} size={Math.min(56, cardWidth - 12)} />
        <Text style={[styles.cardName, selected && styles.cardNameSelected]} numberOfLines={2}>
          {name}
        </Text>
        {owned ? (
          <Text style={styles.ownedTag}>{t('fridge.catalogPick.inFridge')}</Text>
        ) : null}
        {selected ? (
          <View style={styles.check}>
            <Text style={styles.checkText}>{t('common.checkmark')}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const canCook = selectedIds.length > 0;
  const cookLabel =
    selectedIds.length === 0
      ? t('fridge.catalogPick.needMore')
      : t('fridge.catalogPick.cook', { count: selectedIds.length });

  return (
    <Screen edges={['top']}>
      <Header
        title={t('fridge.catalogPick.title')}
        subtitle={t('fridge.catalogPick.subtitle')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>{t('fridge.catalogPick.hint')}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('fridge.catalogPick.searchPlaceholder')}
          placeholderTextColor={colors.inkFaint}
          style={styles.search}
        />

        <Text style={styles.section}>{t('fridge.catalogPick.sectionStarter')}</Text>
        <View style={styles.grid}>
          {starterEntries.map((entry) => renderCard(entry.id, entry.name))}
        </View>

        {query.trim() ? (
          <>
            <Text style={styles.section}>{t('fridge.catalogPick.sectionSearch')}</Text>
            {searchEntries.length === 0 ? (
              <Text style={styles.emptySearch}>{t('fridge.catalogPick.searchEmpty')}</Text>
            ) : (
              <View style={styles.grid}>
                {searchEntries.map((entry) => renderCard(entry.id, entry.name))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      <FooterBar>
        <FooterPrimaryButton label={cookLabel} onPress={cookWithPicks} disabled={!canCook} />
      </FooterBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  body: {
    paddingHorizontal: GRID_H_PAD,
    paddingTop: 12,
    paddingBottom: 16,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkMuted,
    marginBottom: 12,
  },
  search: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 16,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    padding: 6,
    alignItems: 'center',
    minHeight: 96,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  cardNameSelected: {
    color: colors.primary,
  },
  ownedTag: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '700',
    color: colors.inkFaint,
  },
  check: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  emptySearch: {
    fontSize: 13,
    color: colors.inkFaint,
    marginBottom: 18,
  },
});
