import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { HeroCard, Header, Screen } from '../../components/ui';
import { CameraStackParamList } from '../../navigation/types';
import { analyzeImage } from '../../services/analyzeImage';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<CameraStackParamList, 'Analyzing'>;

/** 回数確認・広告視聴は CaptureConfirmScreen で行う。ここは外部 API 解析のみ。 */
export function AnalyzingScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { consumeGemini, rewardGeminiFromAd, user } = useApp();
  const { imageUrl, mode, analysisKey = 0 } = route.params;
  const consumedRef = useRef(false);
  const completedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const isReceipt = mode === 'receipt';

  useEffect(() => {
    consumedRef.current = false;
    completedRef.current = false;

    let alive = true;
    (async () => {
      if (!user.isPremium) {
        if (!consumeGemini()) {
          if (!alive) return;
          Alert.alert(t('gemini.quotaZero'), t('gemini.quotaExceeded'), [
            { text: t('common.close'), onPress: () => navigation.goBack() },
          ]);
          return;
        }
        consumedRef.current = true;
      }

      try {
        const result = await analyzeImage(imageUrl, mode);
        if (!alive) return;
        completedRef.current = true;
        if (result.mode === 'receipt') {
          navigation.replace('ReceiptResult', { items: result.items, imageUrl });
        } else {
          navigation.replace('AnalysisResult', { items: result.items, imageUrl });
        }
      } catch {
        if (alive) {
          if (consumedRef.current && !completedRef.current) {
            rewardGeminiFromAd(1);
            consumedRef.current = false;
          }
          setError(
            isReceipt ? t('camera.analyzing.errorReceipt') : t('camera.analyzing.errorPhoto')
          );
        }
      }
    })();

    return () => {
      alive = false;
      if (consumedRef.current && !completedRef.current) {
        rewardGeminiFromAd(1);
      }
    };
  }, [
    analysisKey,
    consumeGemini,
    imageUrl,
    isReceipt,
    mode,
    navigation,
    rewardGeminiFromAd,
    t,
    user.isPremium,
  ]);

  return (
    <Screen edges={['top']}>
      <Header
        title={isReceipt ? t('camera.analyzing.titleReceipt') : t('camera.analyzing.title')}
        subtitle={t('camera.analyzing.subtitle')}
      />
      <View style={styles.center}>
        <HeroCard style={styles.loadingCard}>
          <View style={styles.loadingInner}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {isReceipt ? t('camera.analyzing.loadingReceipt') : t('camera.analyzing.loading')}
            </Text>
            <Text style={styles.loadingHint}>{t('common.mockApiHint')}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </HeroCard>
      </View>
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
