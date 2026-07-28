import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { FoodThumb, FooterBar, FooterPrimaryButton, Header, HeroCard, Screen } from '../../components/ui';
import { CAPTURE_IMAGE } from '../../data/dummy';
import { CameraStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { pickReceiptImageFromLibrary } from '../../utils/pickCaptureImage';

type Props = NativeStackScreenProps<CameraStackParamList, 'CameraHome'>;

export function CameraHomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { remainingGemini, user } = useApp();
  const [pickingReceipt, setPickingReceipt] = useState(false);

  const onReceiptPress = useCallback(async () => {
    if (pickingReceipt) return;
    setPickingReceipt(true);
    try {
      const uri = await pickReceiptImageFromLibrary();
      if (!uri) return;
      navigation.navigate('CaptureConfirm', { imageUrl: uri, source: 'album' });
    } finally {
      setPickingReceipt(false);
    }
  }, [navigation, pickingReceipt]);

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
          <View style={styles.frame}>
            <FoodThumb
              imageUrl={CAPTURE_IMAGE}
              name={t('camera.home.foodPlaceholder')}
              size={120}
            />
            <Text style={styles.hint}>{t('camera.home.hint')}</Text>
            <Text style={styles.hintSub}>{t('camera.home.hintSub')}</Text>
          </View>
        </HeroCard>
      </View>
      <FooterBar>
        <FooterPrimaryButton
          label={t('camera.home.album')}
          variant="secondary"
          disabled={pickingReceipt}
          onPress={onReceiptPress}
        />
        <FooterPrimaryButton
          label={t('camera.home.capture')}
          onPress={() =>
            navigation.navigate('CaptureConfirm', {
              imageUrl: CAPTURE_IMAGE,
              source: 'camera',
            })
          }
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
  },
  viewfinder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    alignItems: 'center',
    gap: 14,
    padding: 24,
    paddingLeft: 28,
  },
  hint: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  hintSub: {
    color: colors.inkFaint,
    fontSize: 12,
  },
});
