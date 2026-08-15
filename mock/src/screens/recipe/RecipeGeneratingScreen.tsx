import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  ConfirmDialog,
  FooterBar,
  FooterPrimaryButton,
  HeroCard,
  Header,
  Screen,
} from '../../components/ui';
import {
  generateRecipes,
} from '../../services/generateRecipe';
import { resetToRecipeHome, resetTabToHome } from '../../navigation/navigationHelpers';
import { RecipeStackParamList, RootTabParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { getGeminiApiHintKey } from '../../utils/geminiApiHint';
import { resolveGeminiErrorKey } from '../../utils/resolveGeminiError';
import type { NavigationProp } from '@react-navigation/native';

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
    origin,
  } = route.params;
  const isGacha = mode === 'gacha';
  const cancelledRef = useRef(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const flowOrigin = origin ?? (isGacha ? 'fridge' : undefined);

  const cancelGeneration = () => {
    cancelledRef.current = true;
  };

  const leaveGenerating = () => {
    cancelGeneration();
    resetToRecipeHome(navigation);
    const parent = navigation.getParent<NavigationProp<RootTabParamList>>();
    if (!parent) return;
    if (flowOrigin === 'fridge') {
      resetTabToHome(parent, 'FridgeTab');
    } else if (flowOrigin === 'camera') {
      resetTabToHome(parent, 'DashboardTab');
    }
  };

  useEffect(() => {
    // alive は effect ごとに独立させる。cancelledRef を共有したまま false に戻すと、
    // 再実行時に前回の生成が復活してレシピの二重登録・二重遷移が起きる
    let alive = true;
    let consumed = false;
    let completed = false;
    cancelledRef.current = false;

    const aborted = () => !alive || cancelledRef.current;

    (async () => {
      setError(null);
      if (!user.isPremium) {
        if (geminiPreConsumed) {
          consumed = true;
        } else if (!consumeGemini()) {
          if (aborted()) return;
          setQuotaDialogOpen(true);
          return;
        } else {
          consumed = true;
        }
      }

      try {
        const generatedList = await generateRecipes(
          ingredientNames,
          conditions,
          isGacha ? 'gacha' : 'normal',
        );
        if (aborted()) return;

        const savedRecipes = generatedList.map((generated) =>
          addRecipe({
            ...generated,
            userMemo: '',
            isFavorite: false,
          }),
        );
        completed = true;
        navigation.replace('RecipeDetail', {
          recipeId: savedRecipes[0].id,
          ingredientIds,
        });
      } catch (err) {
        if (aborted()) return;
        if (consumed && !completed) {
          rewardGeminiFromAd(1);
          consumed = false;
        }
        setError(t(resolveGeminiErrorKey(err)));
      }
    })();

    return () => {
      alive = false;
      cancelledRef.current = true;
      // 生成完了前に離脱した場合、消費した Gemini 回数を返却（モック）
      if (consumed && !completed) {
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

  const dishTotal = Math.max(1, conditions.dishCount);
  const label = isGacha
    ? t('recipe.generating.gachaLoading')
    : dishTotal > 1
      ? t('recipe.generating.multiLoading', { count: dishTotal })
      : t('recipe.generating.normalLoading');

  return (
    <Screen edges={['top']}>
      <Header
        title={t('recipe.generating.title')}
        subtitle={t('recipe.generating.subtitle')}
        onBack={leaveGenerating}
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

      {error ? (
        <FooterBar>
          <FooterPrimaryButton label={t('common.back')} onPress={leaveGenerating} />
        </FooterBar>
      ) : null}

      <ConfirmDialog
        visible={quotaDialogOpen}
        onClose={() => {
          setQuotaDialogOpen(false);
          leaveGenerating();
        }}
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
