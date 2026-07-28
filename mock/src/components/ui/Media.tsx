import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { IMAGE_COLORS } from '../../data/dummy';
import { FOOD_IMAGES } from '../../data/images';
import { colors } from '../../theme/colors';

const R = colors.radius;

export function FoodThumb({
  imageUrl,
  name,
  size = 88,
}: {
  imageUrl: string;
  name: string;
  size?: number;
}) {
  const source = FOOD_IMAGES[imageUrl];
  const bg = IMAGE_COLORS[imageUrl] ?? colors.bgAlt;

  if (source) {
    return (
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          borderRadius: R,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        resizeMode="cover"
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      style={[
        styles.thumb,
        {
          width: size,
          height: size,
          backgroundColor: bg,
          borderRadius: R,
        },
      ]}
    >
      <Text style={[styles.thumbInitial, { fontSize: size * 0.28 }]}>
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

function resolveCaptureSource(imageUrl: string) {
  const asset = FOOD_IMAGES[imageUrl];
  if (asset) return asset;
  if (
    imageUrl.startsWith('file://') ||
    imageUrl.startsWith('content://') ||
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://')
  ) {
    return { uri: imageUrl };
  }
  return null;
}

export function CapturePreview({
  imageUrl,
  height = 200,
}: {
  imageUrl: string;
  height?: number;
}) {
  const { t } = useTranslation();
  const source = resolveCaptureSource(imageUrl);
  if (!source) {
    return (
      <View style={[styles.capturePreview, { height, backgroundColor: colors.surfaceMuted }]}>
        <Text style={styles.captureFallback}>{t('common.noImage')}</Text>
      </View>
    );
  }
  return (
    <Image
      source={source}
      style={[styles.capturePreview, { height }]}
      resizeMode="cover"
      accessibilityLabel={t('common.captureImage')}
    />
  );
}

export function LoadingPanel({ label }: { label: string }) {
  const { t } = useTranslation();

  return (
    <View style={styles.loadingPanel}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
      <Text style={styles.loadingHint}>{t('common.mockApiHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbInitial: {
    fontWeight: '600',
    color: colors.inkMuted,
  },
  capturePreview: {
    width: '100%',
    borderRadius: R,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captureFallback: {
    textAlign: 'center',
    marginTop: 80,
    color: colors.inkMuted,
    fontWeight: '500',
  },
  loadingPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
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
});
