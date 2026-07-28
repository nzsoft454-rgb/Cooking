import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AppModal,
  CapturePreview,
  Chip,
  ConfirmDialog,
  FooterBar,
  FooterPrimaryButton,
  Header,
  HeroCard,
  Panel,
  PrimaryButton,
  Screen,
  confirmStyles,
} from '../../components/ui';
import { delay } from '../../data/dummy';
import { CameraStackParamList } from '../../navigation/types';
import type { AnalysisMode } from '../../services/analyzeImage';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<CameraStackParamList, 'CaptureConfirm'>;

type ModalStep = null | 'confirm' | 'quota' | 'watchingAd';

const AD_REWARD = 1;

function defaultMode(source: 'camera' | 'album' | undefined): AnalysisMode {
  return source === 'album' ? 'receipt' : 'photo';
}

export function CaptureConfirmScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { imageUrl, source } = route.params;
  const { remainingGemini, user, rewardGeminiFromAd } = useApp();
  const [mode, setMode] = useState<AnalysisMode>(() => defaultMode(source));
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [adMessage, setAdMessage] = useState<string | null>(null);
  const navigatingRef = useRef(false);
  const isReceipt = mode === 'receipt';

  useFocusEffect(
    useCallback(() => {
      navigatingRef.current = false;
    }, [])
  );

  const closeModal = () => {
    navigatingRef.current = false;
    setModalStep(null);
  };

  const remainingLabel = user.isPremium ? '∞' : String(remainingGemini);
  const canAnalyze = user.isPremium || remainingGemini > 0;

  const openConfirm = () => {
    setAdMessage(null);
    setModalStep('confirm');
  };

  const onConfirmYes = () => {
    setAdMessage(null);
    setModalStep('quota');
  };

  const startAnalyze = () => {
    if (navigatingRef.current) return;
    if (!user.isPremium && remainingGemini <= 0) {
      setAdMessage(t('gemini.noQuotaYet'));
      return;
    }
    navigatingRef.current = true;
    setModalStep(null);
    setAdMessage(null);
    navigation.navigate('Analyzing', { imageUrl, mode, analysisKey: Date.now() });
  };

  const watchAd = async () => {
    setModalStep('watchingAd');
    await delay(2200);
    rewardGeminiFromAd(AD_REWARD);
    navigatingRef.current = false;
    setAdMessage(t('gemini.adComplete', { count: AD_REWARD }));
    setModalStep('quota');
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('camera.captureConfirm.title')}
        subtitle={t('camera.captureConfirm.subtitle')}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        <HeroCard style={styles.heroCard}>
          <View style={styles.heroInner}>
            <CapturePreview imageUrl={imageUrl} height={240} />
            <Text style={styles.modeLabel}>{t('camera.captureConfirm.modeLabel')}</Text>
            <View style={styles.modeRow}>
              <Chip
                label={t('camera.captureConfirm.modePhoto')}
                selected={mode === 'photo'}
                onPress={() => setMode('photo')}
                segment
              />
              <Chip
                label={t('camera.captureConfirm.modeReceipt')}
                selected={mode === 'receipt'}
                onPress={() => setMode('receipt')}
                segment
              />
            </View>
            <Text style={styles.caption}>
              {source === 'album'
                ? t('camera.captureConfirm.captionAlbum')
                : t('camera.captureConfirm.caption')}
            </Text>
            <Text style={styles.note}>{t('camera.captureConfirm.note')}</Text>
          </View>
        </HeroCard>
      </View>
      <FooterBar>
        <FooterPrimaryButton
          label={
            source === 'album'
              ? t('camera.captureConfirm.reselect')
              : t('camera.captureConfirm.retake')
          }
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
        <FooterPrimaryButton
          label={
            isReceipt
              ? t('camera.captureConfirm.analyzeReceipt')
              : t('camera.captureConfirm.analyze')
          }
          onPress={openConfirm}
        />
      </FooterBar>

      <ConfirmDialog
        visible={modalStep === 'confirm'}
        onClose={closeModal}
        title={t('camera.captureConfirm.modalTitle')}
        body={
          isReceipt
            ? t('camera.captureConfirm.modalBodyReceipt')
            : t('camera.captureConfirm.modalBody')
        }
        meta={
          isReceipt
            ? t('camera.captureConfirm.modalMetaReceipt')
            : t('camera.captureConfirm.modalMeta')
        }
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.next')}
        onConfirm={onConfirmYes}
      />

      <AppModal visible={modalStep === 'quota'} onClose={closeModal}>
        <Pressable style={confirmStyles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={confirmStyles.title}>{t('gemini.title')}</Text>
            {canAnalyze ? (
              <>
                <Text style={styles.quotaNumber}>
                  {t('gemini.quotaRemaining', { count: remainingLabel })}
                </Text>
                {adMessage ? <Text style={styles.adSuccess}>{adMessage}</Text> : null}
                <Text style={confirmStyles.body}>
                  {user.isPremium
                    ? t('gemini.premiumNoLimit')
                    : t('gemini.freePlanAnalyzeLimit', { max: user.geminiLimit.maxPerDay })}
                </Text>
                <View style={confirmStyles.actions}>
                  <PrimaryButton
                    label={t('common.cancel')}
                    variant="ghost"
                    onPress={closeModal}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    label={t('gemini.analyze')}
                    onPress={startAnalyze}
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroInner: {
    padding: 16,
    paddingLeft: 20,
    gap: 12,
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'stretch',
  },
  caption: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  note: {
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
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
