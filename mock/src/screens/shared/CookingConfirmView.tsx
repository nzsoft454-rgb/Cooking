import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AppModal,
  Chip,
  ConfirmDialog,
  FooterBar,
  FooterPrimaryButton,
  Header,
  HeroCard,
  Panel,
  PrimaryButton,
  Screen,
  SectionTitle,
  confirmStyles,
} from '../../components/ui';
import { DEFAULT_CONDITIONS, delay } from '../../data/dummy';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import type { RecipeConditions } from '../../types';
import type { RootTabParamList } from '../../navigation/types';

type Props = {
  ingredientIds: string[];
  ingredientNames: string[];
};

type ModalStep = null | 'confirm' | 'quota' | 'watchingAd';
type AdMessageKey = 'noQuotaYet' | 'adComplete';

const AD_REWARD = 1;

/** 0.5人前〜4人前（0.5刻み） */
const SERVING_OPTIONS = Array.from({ length: 8 }, (_, i) => (i + 1) * 0.5);

type ConditionOption = { value: string; labelKey: string };

const COOKING_TIME_OPTIONS: ConditionOption[] = [
  { value: '15分以内', labelKey: 'conditions.cookingTime15' },
  { value: '30分以内', labelKey: 'conditions.cookingTime30' },
  { value: 'こだわらない', labelKey: 'conditions.cookingTimeAny' },
];

const DIFFICULTY_OPTIONS: ConditionOption[] = [
  { value: '簡単', labelKey: 'conditions.difficultyEasy' },
  { value: '普通', labelKey: 'conditions.difficultyNormal' },
  { value: '本格派', labelKey: 'conditions.difficultyAdvanced' },
];

const GENRE_OPTIONS: ConditionOption[] = [
  { value: '和風', labelKey: 'conditions.genreJapanese' },
  { value: '洋風', labelKey: 'conditions.genreWestern' },
  { value: '中華', labelKey: 'conditions.genreChinese' },
];

const SEASONING_OPTIONS: ConditionOption[] = [
  { value: '薄味', labelKey: 'conditions.seasoningLight' },
  { value: '普通', labelKey: 'conditions.seasoningNormal' },
  { value: '濃いめ', labelKey: 'conditions.seasoningStrong' },
];

const CONDITION_LABEL_KEYS: Record<string, string> = Object.fromEntries(
  [...COOKING_TIME_OPTIONS, ...DIFFICULTY_OPTIONS, ...GENRE_OPTIONS, ...SEASONING_OPTIONS].map(
    ({ value, labelKey }) => [value, labelKey]
  )
);

function ChipSection({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: ConditionOption[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <SectionTitle label={label} />
      <Panel style={styles.chipPanel}>
        <View style={styles.chipBlock}>
          <View style={styles.chipRow}>
            {options.map(({ value, labelKey }) => (
              <Chip
                key={value}
                label={t(labelKey)}
                selected={selected === value}
                onPress={() => onSelect(value)}
              />
            ))}
          </View>
        </View>
      </Panel>
    </>
  );
}

function ServingChipSection({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (v: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <SectionTitle label={t('cookingConfirm.sectionServings')} />
      <Panel style={styles.chipPanel}>
        <View style={styles.chipBlock}>
          <View style={styles.chipRow}>
            {SERVING_OPTIONS.map((v) => (
              <Chip
                key={v}
                label={t('common.servings', { count: v })}
                selected={selected === v}
                onPress={() => onSelect(v)}
              />
            ))}
          </View>
        </View>
      </Panel>
    </>
  );
}

export function CookingConfirmView({ ingredientIds, ingredientNames }: Props) {
  const { t } = useTranslation();
  const stackNav = useNavigation();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { remainingGemini, user, rewardGeminiFromAd } = useApp();
  const [conditions, setConditions] = useState<RecipeConditions>(DEFAULT_CONDITIONS);
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [adMessageKey, setAdMessageKey] = useState<AdMessageKey | null>(null);
  const navigatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      navigatingRef.current = false;
    }, [])
  );

  const closeModal = () => {
    navigatingRef.current = false;
    setModalStep(null);
  };

  const setField = <K extends keyof RecipeConditions>(key: K, value: RecipeConditions[K]) => {
    setConditions((prev) => ({ ...prev, [key]: value }));
  };

  const conditionLabel = (value: string) => {
    const key = CONDITION_LABEL_KEYS[value];
    return key ? t(key) : value;
  };

  const remainingLabel = user.isPremium ? '∞' : String(remainingGemini);
  const canGenerate = user.isPremium || remainingGemini > 0;

  const openConfirm = () => {
    setAdMessageKey(null);
    setModalStep('confirm');
  };

  const onConfirmYes = () => {
    setAdMessageKey(null);
    setModalStep('quota');
  };

  const startGenerate = () => {
    if (navigatingRef.current) return;
    if (!user.isPremium && remainingGemini <= 0) {
      setAdMessageKey('noQuotaYet');
      return;
    }
    navigatingRef.current = true;
    setModalStep(null);
    setAdMessageKey(null);
    navigation.navigate('RecipeTab', {
      screen: 'RecipeGenerating',
      params: {
        ingredientIds,
        ingredientNames,
        conditions,
        generationKey: Date.now(),
      },
    });
  };

  const watchAd = async () => {
    setModalStep('watchingAd');
    await delay(2200);
    rewardGeminiFromAd(AD_REWARD);
    navigatingRef.current = false;
    setAdMessageKey('adComplete');
    setModalStep('quota');
  };

  const adMessage =
    adMessageKey === 'noQuotaYet'
      ? t('gemini.noQuotaYet')
      : adMessageKey === 'adComplete'
        ? t('gemini.adComplete', { count: AD_REWARD })
        : null;

  return (
    <Screen edges={['top']}>
      <Header
        title={t('cookingConfirm.title')}
        subtitle={t('cookingConfirm.subtitle')}
        onBack={() => stackNav.goBack()}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle label={t('cookingConfirm.sectionIngredients')} />
        <HeroCard style={styles.ingredientCard}>
          <View style={styles.ingredientInner}>
            <Text style={styles.ingredientEyebrow}>{t('cookingConfirm.ingredientsEyebrow')}</Text>
            <Text style={styles.ingredients}>{ingredientNames.join(' / ')}</Text>
          </View>
        </HeroCard>

        <ChipSection
          label={t('cookingConfirm.sectionCookingTime')}
          options={COOKING_TIME_OPTIONS}
          selected={conditions.cookingTime}
          onSelect={(v) => setField('cookingTime', v)}
        />

        <ChipSection
          label={t('cookingConfirm.sectionDifficulty')}
          options={DIFFICULTY_OPTIONS}
          selected={conditions.difficulty}
          onSelect={(v) => setField('difficulty', v)}
        />

        <ChipSection
          label={t('cookingConfirm.sectionGenre')}
          options={GENRE_OPTIONS}
          selected={conditions.genre}
          onSelect={(v) => setField('genre', v)}
        />

        <ServingChipSection
          selected={conditions.servings}
          onSelect={(v) => setField('servings', v)}
        />

        <ChipSection
          label={t('cookingConfirm.sectionSeasoning')}
          options={SEASONING_OPTIONS}
          selected={conditions.seasoning}
          onSelect={(v) => setField('seasoning', v)}
        />

        <Panel style={styles.notePanel}>
          <Text style={styles.note}>{t('cookingConfirm.note')}</Text>
        </Panel>
      </ScrollView>
      <FooterBar>
        <FooterPrimaryButton
          label={t('cookingConfirm.generate')}
          onPress={openConfirm}
        />
      </FooterBar>

      <ConfirmDialog
        visible={modalStep === 'confirm'}
        onClose={closeModal}
        title={t('cookingConfirm.confirmTitle')}
        body={t('cookingConfirm.confirmBody')}
        meta={[
          t('cookingConfirm.confirmIngredients', { names: ingredientNames.join(' / ') }),
          t('cookingConfirm.confirmConditions', {
            genre: conditionLabel(conditions.genre),
            difficulty: conditionLabel(conditions.difficulty),
            cookingTime: conditionLabel(conditions.cookingTime),
            servings: t('common.servings', { count: conditions.servings }),
          }),
        ]}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.next')}
        onConfirm={onConfirmYes}
      />

      <AppModal visible={modalStep === 'quota'} onClose={closeModal}>
        <Pressable style={confirmStyles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={confirmStyles.title}>{t('gemini.title')}</Text>
          {canGenerate ? (
            <>
              <Text style={styles.quotaNumber}>
                {t('gemini.quotaRemaining', { count: remainingLabel })}
              </Text>
              {adMessage ? <Text style={styles.adSuccess}>{adMessage}</Text> : null}
              <Text style={confirmStyles.body}>
                {user.isPremium
                  ? t('gemini.premiumNoLimit')
                  : t('gemini.freePlanGenerateLimit', { max: user.geminiLimit.maxPerDay })}
              </Text>
              <View style={confirmStyles.actions}>
                <PrimaryButton
                  label={t('common.cancel')}
                  variant="ghost"
                  onPress={closeModal}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label={t('gemini.generate')}
                  onPress={startGenerate}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.quotaNumberWarn}>{t('gemini.quotaZero')}</Text>
              <Text style={confirmStyles.body}>{t('gemini.quotaExceeded')}</Text>
              {adMessage ? <Text style={styles.adWarn}>{adMessage}</Text> : null}
              <PrimaryButton
                label={t('gemini.watchAdReward', { count: AD_REWARD })}
                onPress={watchAd}
                style={{ marginTop: 16 }}
              />
              <PrimaryButton
                label={t('common.close')}
                variant="ghost"
                onPress={closeModal}
                style={{ marginTop: 10 }}
              />
            </>
          )}
        </Pressable>
      </AppModal>

      <AppModal visible={modalStep === 'watchingAd'} dismissOnBackdrop={false}>
        <Panel style={styles.adCard}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={confirmStyles.title}>{t('gemini.adPlaying')}</Text>
          <Text style={confirmStyles.body}>{t('gemini.adMockHint')}</Text>
          <View style={styles.fakeAd}>
            <Text style={styles.fakeAdText}>{t('gemini.demoAd')}</Text>
            <Text style={styles.fakeAdSub}>{t('gemini.demoAdSub')}</Text>
          </View>
        </Panel>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  ingredientCard: {
    overflow: 'hidden',
  },
  ingredientInner: {
    padding: 16,
    paddingLeft: 20,
    gap: 4,
  },
  ingredientEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  ingredients: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 22,
  },
  chipPanel: {
    overflow: 'hidden',
  },
  chipBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  notePanel: {
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.surfaceMuted,
  },
  note: {
    fontSize: 12,
    color: colors.inkFaint,
    lineHeight: 18,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 34, 40, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  cardMeta: {
    marginTop: 8,
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  quotaNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 10,
  },
  quotaNumberWarn: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: 10,
  },
  adSuccess: {
    marginBottom: 10,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  adWarn: {
    marginTop: 8,
    color: colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  adCard: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  adTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 8,
  },
  fakeAd: {
    marginTop: 12,
    width: '100%',
    height: 120,
    borderRadius: colors.radius,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeAdText: {
    color: colors.inkMuted,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 2,
  },
  fakeAdSub: {
    marginTop: 6,
    color: colors.inkFaint,
    fontSize: 12,
  },
});
