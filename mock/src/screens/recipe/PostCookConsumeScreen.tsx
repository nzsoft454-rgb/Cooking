import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AppModal,
  Chip,
  ConfirmDialog,
  FoodThumb,
  FooterBar,
  FooterPrimaryButton,
  Header,
  HeroCard,
  Panel,
  PanelDivider,
  PrimaryButton,
  ProgressBar,
  Screen,
  SectionTitle,
} from '../../components/ui';
import { RecipeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import type { Ingredient } from '../../types';

type Props = NativeStackScreenProps<RecipeStackParamList, 'PostCookConsume'>;

type ConsumeChoice = {
  mode: 'all' | 'fraction';
  n?: number;
};

export function PostCookConsumeScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { ingredients, consumeIngredients } = useApp();
  const { ingredientIds, recipeTitle } = route.params;

  const targets = useMemo(
    () =>
      ingredientIds
        .map((id) => ingredients.find((i) => i.id === id && !i.isDeleted))
        .filter((i): i is Ingredient => !!i && i.quantity > 0),
    [ingredientIds, ingredients]
  );

  const [pendingIds, setPendingIds] = useState<string[]>(() =>
    ingredientIds.filter((id) => {
      const ing = ingredients.find((i) => i.id === id);
      return !!ing && !ing.isDeleted && ing.quantity > 0;
    })
  );
  const [doneLog, setDoneLog] = useState<string[]>([]);
  const [active, setActive] = useState<Ingredient | null>(null);
  const [fractionN, setFractionN] = useState(2);
  const [skipOpen, setSkipOpen] = useState(false);

  useEffect(() => {
    const alive = new Set(targets.map((item) => item.id));
    setPendingIds((prev) => {
      const next = prev.filter((id) => alive.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [targets]);

  const pendingItems = useMemo(
    () => pendingIds.map((id) => targets.find((t) => t.id === id) ?? ingredients.find((i) => i.id === id)).filter(Boolean) as Ingredient[],
    [pendingIds, targets, ingredients]
  );

  const applyConsume = (item: Ingredient, choice: ConsumeChoice) => {
    const amount =
      choice.mode === 'all'
        ? item.quantity
        : Math.min(item.quantity, Number((1 / (choice.n ?? 2)).toFixed(4)));

    consumeIngredients([item.id], amount);
    const label =
      choice.mode === 'all'
        ? t('recipe.postCookConsume.logAllConsumed', { name: item.name })
        : t('recipe.postCookConsume.logFractionConsumed', {
            name: item.name,
            n: choice.n,
            percent: Math.round(amount * 100),
          });
    setDoneLog((prev) => [...prev, label]);
    setPendingIds((prev) => prev.filter((id) => id !== item.id));
    setActive(null);
  };

  const finish = () => {
    navigation.navigate('PostCookPhoto', {
      recipeId: route.params.recipeId,
      recipeTitle,
    });
  };

  const skipRest = () => {
    setSkipOpen(true);
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('recipe.postCookConsume.title')}
        subtitle={t('recipe.postCookConsume.subtitle')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <HeroCard style={styles.heroCard}>
          <View style={styles.heroInner}>
            <Text style={styles.heroEyebrow}>{t('recipe.postCookConsume.recipeEyebrow')}</Text>
            <Text style={styles.recipeName}>{recipeTitle}</Text>
            <Text style={styles.hint}>{t('recipe.postCookConsume.hint')}</Text>
          </View>
        </HeroCard>

        <SectionTitle
          label={t('recipe.postCookConsume.sectionPending', { count: pendingItems.length })}
        />
        <FlatList
          style={styles.listScroll}
          data={pendingItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('recipe.postCookConsume.allDone')}</Text>
          }
          renderItem={({ item, index }) => (
            <View style={index > 0 ? styles.cardGap : undefined}>
              <Panel style={styles.card}>
                <Pressable style={styles.cardRow} onPress={() => setActive(item)}>
                  <FoodThumb imageUrl={item.imageUrl} name={item.name} size={56} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {t('recipe.postCookConsume.remainingMeta', {
                        percent: Math.round(item.quantity * 100),
                      })}
                    </Text>
                    <ProgressBar percent={item.quantity * 100} />
                  </View>
                  <Text style={styles.tap}>{t('common.tap')}</Text>
                </Pressable>
              </Panel>
            </View>
          )}
        />

        {doneLog.length > 0 ? (
          <View style={styles.logBox}>
            <SectionTitle label={t('recipe.postCookConsume.sectionProcessed')} />
            <Panel style={styles.logPanel}>
              {doneLog.map((line, i) => (
                <React.Fragment key={`${line}-${i}`}>
                  {i > 0 ? <PanelDivider /> : null}
                  <Text style={styles.logLine}>
                    {t('common.checkmark')} {line}
                  </Text>
                </React.Fragment>
              ))}
            </Panel>
          </View>
        ) : null}
      </View>

      <FooterBar>
        {pendingItems.length === 0 ? (
          <FooterPrimaryButton
            label={t('recipe.postCookConsume.finish')}
            onPress={finish}
          />
        ) : (
          <FooterPrimaryButton
            label={t('recipe.postCookConsume.skipRest')}
            variant="ghost"
            onPress={skipRest}
          />
        )}
      </FooterBar>

      <AppModal visible={!!active} onClose={() => setActive(null)} placement="bottom">
        <Panel style={styles.modalCard}>
            {active ? (
              <>
                <Text style={styles.modalTitle}>{active.name}</Text>
                <Text style={styles.modalMeta}>
                  {t('recipe.postCookConsume.modalCurrentRemaining', {
                    percent: Math.round(active.quantity * 100),
                  })}
                </Text>

                <PrimaryButton
                  label={t('recipe.postCookConsume.consumeAll')}
                  onPress={() => applyConsume(active, { mode: 'all' })}
                  style={{ marginTop: 12 }}
                />

                <Text style={styles.nLabel}>{t('recipe.postCookConsume.consumeFractionLabel')}</Text>
                <View style={styles.nRow}>
                  {[2, 3, 4, 5].map((n) => (
                    <Chip
                      key={n}
                      label={`1/${n}`}
                      selected={fractionN === n}
                      onPress={() => setFractionN(n)}
                    />
                  ))}
                </View>
                <PrimaryButton
                  label={t('recipe.postCookConsume.consumeFraction', { n: fractionN })}
                  variant="secondary"
                  onPress={() =>
                    applyConsume(active, { mode: 'fraction', n: fractionN })
                  }
                  style={{ marginTop: 8 }}
                />
                <PrimaryButton
                  label={t('common.cancel')}
                  variant="ghost"
                  onPress={() => setActive(null)}
                  style={{ marginTop: 8 }}
                />
              </>
            ) : null}
          </Panel>
      </AppModal>

      <ConfirmDialog
        visible={skipOpen}
        onClose={() => setSkipOpen(false)}
        title={t('recipe.postCookConsume.skipTitle')}
        body={t('recipe.postCookConsume.skipMessage')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('recipe.postCookConsume.skipConfirm')}
        onConfirm={finish}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  listScroll: {
    flex: 1,
  },
  heroCard: {
    marginHorizontal: 20,
    marginTop: 12,
    overflow: 'hidden',
  },
  heroInner: {
    padding: 16,
    paddingLeft: 20,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  hint: {
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  card: {
    overflow: 'hidden',
  },
  cardGap: {
    marginTop: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: {
    marginTop: 2,
    marginBottom: 4,
    fontSize: 12,
    color: colors.inkMuted,
  },
  tap: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    color: colors.success,
    fontWeight: '700',
    marginTop: 12,
  },
  logBox: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  logPanel: {
    overflow: 'hidden',
  },
  logLine: {
    fontSize: 12,
    color: colors.inkMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCard: {
    borderTopLeftRadius: colors.radius,
    borderTopRightRadius: colors.radius,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  modalMeta: {
    marginTop: 4,
    color: colors.inkMuted,
  },
  nLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontWeight: '700',
    color: colors.inkMuted,
    fontSize: 13,
  },
  nRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
