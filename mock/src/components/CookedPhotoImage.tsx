import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FOOD_IMAGES } from '../data/images';
import { colors } from '../theme/colors';

type Props = {
  uri: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
  onLoad?: () => void;
};

export function CookedPhotoImage({ uri, style, containerStyle, accessibilityLabel, onLoad }: Props) {
  const { t } = useTranslation();
  const defaultLabel = accessibilityLabel ?? t('components.cookedPhoto');

  if (uri.startsWith('asset://')) {
    const source = FOOD_IMAGES[uri];
    if (source) {
      return (
        <Image
          source={source}
          style={style}
          resizeMode="cover"
          onLoad={onLoad}
          accessibilityLabel={defaultLabel}
        />
      );
    }
  }

  if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http')) {
    return (
      <Image
        source={{ uri }}
        style={style}
        resizeMode="cover"
        onLoad={onLoad}
        accessibilityLabel={defaultLabel}
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle, style]}>
      <Text style={styles.fallbackText}>{t('components.photo')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
