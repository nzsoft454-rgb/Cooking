import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { CapturePreview, FooterBar, FooterPrimaryButton, Header, HeroCard, Screen } from '../../components/ui';
import { CameraStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import {
  pickFoodImageFromLibrary,
  takeFoodPhotoFromCamera,
} from '../../utils/pickCaptureImage';

type Props = NativeStackScreenProps<CameraStackParamList, 'CameraHome'>;

export function CameraHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { remainingGemini, user } = useApp();
  const [capturing, setCapturing] = useState(false);
  const [pickingFood, setPickingFood] = useState(false);
  const [lastPreview, setLastPreview] = useState<string | null>(null);

  const onCapturePress = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const uri = await takeFoodPhotoFromCamera();
      if (!uri) return;
      setLastPreview(uri);
      navigation.navigate('CaptureConfirm', { imageUrl: uri, source: 'camera' });
    } finally {
      setCapturing(false);
    }
  }, [capturing, navigation]);

  const onFoodAlbumPress = useCallback(async () => {
    if (pickingFood) return;
    setPickingFood(true);
    try {
      const uri = await pickFoodImageFromLibrary();
      if (!uri) return;
      setLastPreview(uri);
      navigation.navigate('CaptureConfirm', { imageUrl: uri, source: 'foodAlbum' });
    } finally {
      setPickingFood(false);
    }
  }, [navigation, pickingFood]);

  const busy = capturing || pickingFood;

  return (
    <Screen edges={['top']}>
      <Header
        title={t('camera.home.title')}
        subtitle={t('camera.home.subtitle')}
        right={
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {user.isPremium
                ? t('common.geminiRemainingInfinity')
                : t('common.geminiRemaining', { count: remainingGemini })}
            </Text>
          </View>
        }
      />
      <View style={styles.viewfinderWrap}>
        <HeroCard style={styles.viewfinder}>
          {lastPreview ? (
            <CapturePreview imageUrl={lastPreview} height={280} />
          ) : (
            <View style={styles.frame}>
              <View style={styles.viewfinderIconWrap}>
                <Ionicons name="camera-outline" size={48} color={colors.primary} />
              </View>
              <Text style={styles.hint}>{t('camera.home.hint')}</Text>
              <Text style={styles.hintSub}>{t('camera.home.hintSub')}</Text>
            </View>
          )}
        </HeroCard>
        <Text style={styles.albumHint}>{t('camera.home.albumHint')}</Text>
      </View>
      <FooterBar>
        <FooterPrimaryButton
          label={t('camera.home.albumFood')}
          variant="secondary"
          disabled={busy}
          onPress={onFoodAlbumPress}
        />
        <FooterPrimaryButton
          label={capturing ? t('camera.home.openingCamera') : t('camera.home.capture')}
          disabled={busy}
          onPress={onCapturePress}
        />
      </FooterBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  viewfinderWrap: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
  },
  viewfinder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 12,
  },
  frame: {
    alignItems: 'center',
    gap: 14,
    padding: 24,
    paddingLeft: 28,
  },
  viewfinderIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  hintSub: {
    color: colors.inkFaint,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  albumHint: {
    fontSize: 12,
    color: colors.inkFaint,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
