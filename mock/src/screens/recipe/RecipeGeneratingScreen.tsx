import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  ConfirmDialog,
  HeroCard,
  Header,
  Screen,
} from '../../components/ui';
import {
  generateRecipe,
} from '../../services/generateRecipe';
import { RecipeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { getGeminiApiHintKey } from '../../utils/geminiApiHint';
import { resolveGeminiErrorKey } from '../../utils/resolveGeminiError';

type Props = NativeStackScreenProps<RecipeStackParamList, 'RecipeGenerating'>;

/** 回数確認・広告視聴は A-001-e（CookingConfirmView）で行う。ここは生成のみ。 */
export function RecipeGeneratingScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { consumeGemini, addRecipe, rewardGeminiFromAd, user } = useApp();
  const {
    ingredientIds,
    ingredientNames,
    conditions,
    mode = 'normal',
    generationKey = 0,
    geminiPreConsumed = false,
  } = route.params;
  const isGacha = mode === 'gacha';
  const cancelledRef = useRef(false);
  const consumedRef = useRef(false);
  const completedRef = useRef(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const cancelGeneration = () => {
    cancelledRef.current = true;
  };

  const goBackToFridge = () => {
    cancelGeneration();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'RecipeHome' }],
      })
    );
    navigation.getParent()?.navigate('FridgeTab', { screen: 'FridgeHome' });
  };

  const handleBack = () => {
    cancelGeneration();
    navigation.goBack();
  };

  const exitOnQuota = () => {
    setQuotaDialogOpen(false);
    if (isGacha) {
      goBackToFridge();
      return;
    }
    handleBack();
  };

  useEffect(() => {
    cancelledRef.current = false;
    consumedRef.current = false;
    completedRef.current = false;

    (async () => {
      setError(null);
      if (!user.isPremium) {
        if (geminiPreConsumed) {
          consumedRef.current = true;
        } else if (!consumeGemini()) {
          if (cancelledRef.current) return;
          setQuotaDialogOpen(true);
          return;
        } else {
          consumedRef.current = true;
        }
      }

      try {
        const generated = await generateRecipe(
          ingredientNames,
          conditions,
          isGacha ? 'gacha' : 'normal',
        );
        if (cancelledRef.current) return;

        const recipe = addRecipe({
          ...generated,
          userMemo: '',
          isFavorite: false,
        });
        completedRef.current = true;
        navigation.replace('RecipeDetail', {
          recipeId: recipe.id,
          ingredientIds,
        });
      } catch (err) {
        if (cancelledRef.current) return;
        if (consumedRef.current && !completedRef.current) {
          rewardGeminiFromAd(1);
          consumedRef.current = false;
        }
        setError(t(resolveGeminiErrorKey(err)));
      }
    })();

    return () => {
      cancelledRef.current = true;
      // 生成完了前に離脱した場合、消費した Gemini 回数を返却（モック）
      if (consumedRef.current && !completedRef.current) {
        rewardGeminiFromAd(1);
      }
    };
  }, [
    addRecipe,
    conditions,
    consumeGemini,
    geminiPreConsumed,
    generationKey,
    ingredientIds,
    ingredientNames,
    isGacha,
    navigation,
    rewardGeminiFromAd,
    t,
    user.isPremium,
  ]);

  const label = isGacha
    ? t('recipe.generating.gachaLoading')
    : t('recipe.generating.normalLoading');

  return (
    <Screen edges={['top']}>
      <Header
        title={t('recipe.generating.title')}
        subtitle={t('recipe.generating.subtitle')}
        onBack={isGacha ? goBackToFridge : handleBack}
      />
      <View style={styles.center}>
        <HeroCard style={styles.loadingCard}>
          <View style={styles.loadingInner}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{label}</Text>
            <Text style={styles.loadingHint}>{t(getGeminiApiHintKey())}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </HeroCard>
      </View>

      <ConfirmDialog
        visible={quotaDialogOpen}
        onClose={exitOnQuota}
        title={t('gemini.quotaZero')}
        body={t('gemini.quotaExceeded')}
        dismissLabel={t('common.close')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    overflow: 'hidden',
  },
  loadingInner: {
    padding: 32,
    paddingLeft: 24,
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  error: {
    marginTop: 8,
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
});
