import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CookedPhotoImage } from '../../components/CookedPhotoImage';
import {
  Chip,
  ConfirmDialog,
  FooterBar,
  FooterPrimaryButton,
  HEADER_HEIGHT,
  Header,
  Panel,
  PanelDivider,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../../components/ui';
import { RecipeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { ingredientNamesMatch } from '../../utils/ingredientNameMatch';
import type { AppLanguage } from '../../i18n';
import { formatLocaleDate } from '../../utils/localeFormat';
import { shareRecipeText } from '../../utils/shareRecipe';
import { RECIPE_DETAIL_HERO_HEIGHT, RecipeDetailHero } from './recipeDetail/RecipeDetailHero';
import { RecipeMemoModal } from './recipeDetail/RecipeMemoModal';
import { resolveHeroSource } from './recipeDetail/resolveHeroSource';
import { useStepTimer } from './recipeDetail/useStepTimer';

type Props = NativeStackScreenProps<RecipeStackParamList, 'RecipeDetail'>;

type DetailTab = 'ingredients' | 'steps' | 'tips' | 'photos';

const HERO_HEIGHT = RECIPE_DETAIL_HERO_HEIGHT;

export function RecipeDetailScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as AppLanguage;
  const insets = useSafeAreaInsets();
  const headerMinHeight = insets.top + HEADER_HEIGHT;
  const collapseRange = HERO_HEIGHT - headerMinHeight;

  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    recipes,
    updateRecipe,
    toggleFavorite,
    addShoppingItem,
    activeIngredients,
    photosForRecipe,
    latestPhotoForRecipe,
  } = useApp();

  const recipe = useMemo(
    () => recipes.find((r) => r.id === route.params.recipeId),
    [recipes, route.params.recipeId]
  );

  const recipePhotos = useMemo(
    () => (recipe ? photosForRecipe(recipe.id) : []),
    [recipe, photosForRecipe]
  );
  const latestPhoto = useMemo(
    () => (recipe ? latestPhotoForRecipe(recipe.id) : undefined),
    [recipe, latestPhotoForRecipe]
  );
  const heroSource = useMemo(() => resolveHeroSource(latestPhoto), [latestPhoto]);

  const [tab, setTab] = useState<DetailTab>('steps');
  const [memoOpen, setMemoOpen] = useState(false);
  const [noIngredientsOpen, setNoIngredientsOpen] = useState(false);
  const [memo, setMemo] = useState(recipe?.userMemo ?? '');
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const {
    timerStep,
    remaining,
    running,
    setRunning,
    startTimer,
    resetTimer,
    formatTime,
  } = useStepTimer();

  useEffect(() => {
    setMemo(recipe?.userMemo ?? '');
  }, [recipe?.id]);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [HERO_HEIGHT, headerMinHeight],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, collapseRange],
    outputRange: [0, -collapseRange * 0.35],
    extrapolate: 'clamp',
  });

  const blurOpacity = scrollY.interpolate({
    inputRange: [0, collapseRange * 0.35, collapseRange],
    outputRange: [0, 0.55, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [collapseRange * 0.45, collapseRange * 0.85],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const lightIconOpacity = scrollY.interpolate({
    inputRange: [0, collapseRange * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const darkIconOpacity = scrollY.interpolate({
    inputRange: [collapseRange * 0.35, collapseRange * 0.75],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (!recipe) {
    return (
      <Screen>
        <Header title={t('recipe.detail.notFound')} onBack={() => navigation.goBack()} />
        <PrimaryButton label={t('common.back')} onPress={() => navigation.goBack()} style={{ margin: 20 }} />
      </Screen>
    );
  }

  const startTimerForStep = (stepNumber: number, seconds: number) => {
    startTimer(stepNumber, seconds);
  };

  const shareRecipe = () => void shareRecipeText(recipe);

  const goPostCookConsume = () => {
    const matchedIds = activeIngredients
      .filter((ing) =>
        recipe.sourceIngredients.some((name) => ingredientNamesMatch(ing.name, name))
      )
      .map((ing) => ing.id);

    const fromRoute = route.params.ingredientIds;
    const targetIds = fromRoute?.length ? fromRoute : matchedIds;

    if (targetIds.length === 0) {
      setNoIngredientsOpen(true);
      return;
    }

    navigation.navigate('PostCookConsume', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      ingredientIds: targetIds,
    });
  };

  const saveMemo = () => {
    updateRecipe(recipe.id, { userMemo: memo });
    setMemoOpen(false);
    Alert.alert(t('common.savedTitle'), t('recipe.detail.memoSaved'));
  };

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'ingredients', label: t('recipe.detail.tabIngredients') },
    { key: 'steps', label: t('recipe.detail.tabSteps') },
    { key: 'tips', label: t('recipe.detail.tabTips') },
    {
      key: 'photos',
      label: recipePhotos.length
        ? t('recipe.detail.tabPhotosWithCount', { count: recipePhotos.length })
        : t('recipe.detail.tabPhotos'),
    },
  ];

  return (
    <Screen edges={['top']} style={styles.screenRoot}>
      <RecipeDetailHero
        recipe={recipe}
        heroSource={heroSource}
        headerHeight={headerHeight}
        imageTranslateY={imageTranslateY}
        blurOpacity={blurOpacity}
        titleOpacity={titleOpacity}
        lightIconOpacity={lightIconOpacity}
        darkIconOpacity={darkIconOpacity}
        headerMinHeight={headerMinHeight}
        insetsTop={insets.top}
        onBack={() => navigation.goBack()}
        onToggleFavorite={() => toggleFavorite(recipe.id)}
      />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingTop: HERO_HEIGHT }]}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentSheet}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <Text style={styles.recipeMeta}>
            {t('recipe.detail.meta', {
              genre: recipe.genre,
              minutes: recipe.cookingTime,
              difficulty: recipe.difficulty,
              servings: recipe.servings,
            })}
            {recipe.isFavorite ? t('recipe.detail.favoriteBadge') : ''}
          </Text>
          {recipePhotos.length > 0 ? (
            <Text style={styles.cookedCount}>
              {t('recipe.detail.cookedRecords', { count: recipePhotos.length })}
            </Text>
          ) : null}
          <Text style={styles.recipeSource} numberOfLines={2}>
            {t('recipe.detail.source', {
              names: recipe.sourceIngredients.join(', '),
            })}
          </Text>

          <Pressable style={styles.memoPill} onPress={() => setMemoOpen(true)}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.memoPillText}>{t('recipe.detail.writeMemo')}</Text>
          </Pressable>
        </View>

        <View style={styles.contentPadding}>
          <SectionTitle label={t('recipe.detail.sectionQuickActions')} />
          <Panel style={styles.actionPanel}>
            <View style={styles.actionRow}>
              {recipe.buyAssistText ? (
                <Pressable style={styles.actionBtn} onPress={() => setTab('tips')}>
                  <Text style={styles.actionLabel}>{t('recipe.detail.buyAssist')}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.actionBtn} onPress={() => setMemoOpen(true)}>
                <Text style={styles.actionLabel}>{t('recipe.detail.memo')}</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={shareRecipe}>
                <Text style={styles.actionLabel}>{t('recipe.detail.share')}</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => setTab('photos')}>
                <Text style={styles.actionLabel}>{t('recipe.detail.photos')}</Text>
              </Pressable>
            </View>
          </Panel>

          <SectionTitle label={t('recipe.detail.sectionContent')} />
          <View style={styles.chipRow}>
            {tabs.map((t) => (
              <Chip
                key={t.key}
                label={t.label}
                selected={tab === t.key}
                onPress={() => setTab(t.key)}
              />
            ))}
          </View>

          <Panel style={styles.panel}>
            {tab === 'ingredients' ? (
              <>
                {recipe.ingredientsList.map((ing, index) => (
                  <React.Fragment key={`${index}-${ing.name}`}>
                    {index > 0 ? <PanelDivider /> : null}
                    <Text style={styles.line}>
                      {t('recipe.detail.ingredientLine', { name: ing.name, amount: ing.amount })}
                    </Text>
                  </React.Fragment>
                ))}
              </>
            ) : null}

            {tab === 'steps' ? (
              <>
                {recipe.steps.map((step, index) => {
                  const done = !!checked[step.stepNumber];
                  return (
                    <React.Fragment key={step.stepNumber}>
                      {index > 0 ? <PanelDivider /> : null}
                      <View style={styles.stepRow}>
                        <Pressable
                          onPress={() =>
                            setChecked((prev) => ({
                              ...prev,
                              [step.stepNumber]: !prev[step.stepNumber],
                            }))
                          }
                          style={[styles.checkbox, done && styles.checkboxOn]}
                        >
                          {done ? <Text style={styles.checkMark}>{t('common.checkmark')}</Text> : null}
                        </Pressable>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stepText, done && styles.stepDone]}>
                            {step.stepNumber}. {step.instruction}
                          </Text>
                          {step.timerSeconds ? (
                            <PrimaryButton
                              label={
                                timerStep === step.stepNumber && remaining > 0
                                  ? t('recipe.detail.timer', { time: formatTime(remaining) })
                                  : t('recipe.detail.timerMinutes', {
                                      minutes: Math.round(step.timerSeconds / 60),
                                    })
                              }
                              variant="ghost"
                              onPress={() => startTimerForStep(step.stepNumber, step.timerSeconds!)}
                              style={{ marginTop: 8, paddingVertical: 8 }}
                            />
                          ) : null}
                        </View>
                      </View>
                    </React.Fragment>
                  );
                })}
                {timerStep !== null ? (
                  <>
                    <PanelDivider />
                    <View style={styles.timerBar}>
                      <Text style={styles.timerLabel}>
                        {t('recipe.detail.timerStep', {
                          step: timerStep,
                          time: formatTime(remaining),
                        })}
                      </Text>
                      <View style={styles.timerBtns}>
                        <PrimaryButton
                          label={running ? t('recipe.detail.pause') : t('recipe.detail.resume')}
                          variant="secondary"
                          onPress={() => setRunning((v) => !v)}
                          style={{ flex: 1, paddingVertical: 10 }}
                        />
                        <PrimaryButton
                          label={t('recipe.detail.reset')}
                          variant="ghost"
                          onPress={resetTimer}
                          style={{ flex: 1, paddingVertical: 10 }}
                        />
                      </View>
                    </View>
                  </>
                ) : null}
              </>
            ) : null}

            {tab === 'tips' ? (
              <>
                {recipe.buyAssistText ? (
                  <View style={styles.assist}>
                    <Text style={styles.assistTitle}>{t('recipe.detail.buyAssistTitle')}</Text>
                    <Text style={styles.assistText}>{recipe.buyAssistText}</Text>
                    <PrimaryButton
                      label={t('recipe.detail.addToShoppingList')}
                      variant="secondary"
                      onPress={() => {
                        const itemName =
                          recipe.ingredientsList.find((ing) =>
                            recipe.buyAssistText?.includes(ing.name)
                          )?.name ?? recipe.ingredientsList[0]?.name ?? '';
                        if (!itemName) return;
                        addShoppingItem(itemName);
                        Alert.alert(
                          t('common.add'),
                          t('recipe.detail.addToShoppingListSuccess', { item: itemName })
                        );
                      }}
                      style={{ marginTop: 10 }}
                    />
                  </View>
                ) : null}
                {recipe.tips ? (
                  <Text style={[styles.line, recipe.buyAssistText ? { marginTop: 16 } : null]}>
                    {recipe.tips}
                  </Text>
                ) : (
                  !recipe.buyAssistText && (
                    <Text style={styles.emptyTab}>{t('recipe.detail.noTips')}</Text>
                  )
                )}
                {recipe.userMemo ? (
                  <>
                    <PanelDivider />
                    <View style={styles.savedMemo}>
                      <Text style={styles.savedMemoLabel}>{t('recipe.detail.savedMemo')}</Text>
                      <Text style={styles.line}>{recipe.userMemo}</Text>
                    </View>
                  </>
                ) : null}
              </>
            ) : null}

            {tab === 'photos' ? (
              <>
                {recipePhotos.length === 0 ? (
                  <Text style={styles.emptyTab}>{t('recipe.detail.noPhotos')}</Text>
                ) : (
                  <View style={styles.photoGrid}>
                    {recipePhotos.map((photo) => (
                      <Pressable
                        key={photo.id}
                        style={styles.photoCell}
                        onPress={() =>
                          navigation.navigate('CookedPhotoDetail', { photoId: photo.id })
                        }
                      >
                        <CookedPhotoImage uri={photo.imageUri} style={styles.photoThumb} />
                        <Text style={styles.photoDate} numberOfLines={1}>
                          {formatLocaleDate(photo.createdAt, lang)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </Panel>
        </View>
      </Animated.ScrollView>

      <FooterBar>
        <FooterPrimaryButton
          label={t('recipe.detail.finishCooking')}
          onPress={goPostCookConsume}
        />
      </FooterBar>

      <RecipeMemoModal
        visible={memoOpen}
        memo={memo}
        onChangeMemo={setMemo}
        onClose={() => setMemoOpen(false)}
        onSave={saveMemo}
      />

      <ConfirmDialog
        visible={noIngredientsOpen}
        onClose={() => setNoIngredientsOpen(false)}
        title={t('recipe.detail.noIngredientsTitle')}
        body={t('recipe.detail.noIngredientsMessage')}
        dismissLabel={t('common.close')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingBottom: 16,
  },
  contentSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -8,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    gap: 6,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 30,
  },
  recipeMeta: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  cookedCount: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  recipeSource: {
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 2,
  },
  memoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  memoPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  actionPanel: {
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  panel: {
    marginTop: 4,
    padding: 16,
    overflow: 'hidden',
  },
  line: {
    color: colors.ink,
    lineHeight: 22,
    fontSize: 14,
    paddingVertical: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: colors.radius,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.primary,
  },
  checkMark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  stepText: {
    color: colors.ink,
    lineHeight: 22,
    fontSize: 15,
  },
  stepDone: {
    textDecorationLine: 'line-through',
    color: colors.inkFaint,
  },
  timerBar: {
    backgroundColor: colors.primarySoft,
    borderRadius: colors.radius,
    padding: 12,
    marginTop: 4,
  },
  timerLabel: {
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  timerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  assist: {
    backgroundColor: colors.accentSoft,
    borderRadius: colors.radius,
    padding: 14,
  },
  assistTitle: {
    fontWeight: '700',
    color: colors.inkMuted,
    marginBottom: 4,
  },
  assistText: {
    color: colors.ink,
    lineHeight: 20,
  },
  savedMemo: {
    paddingTop: 12,
  },
  savedMemoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkFaint,
    marginBottom: 6,
  },
  emptyTab: {
    textAlign: 'center',
    color: colors.inkMuted,
    lineHeight: 22,
    paddingVertical: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCell: {
    width: '47%',
  },
  photoThumb: {
    width: '100%',
    height: 120,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoDate: {
    marginTop: 4,
    fontSize: 11,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
