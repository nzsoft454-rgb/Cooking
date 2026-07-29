import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  ImageLoadEventData,
  LayoutChangeEvent,
  Modal,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { IMAGE_COLORS } from '../../data/dummy';
import { colors } from '../../theme/colors';
import { resolveImageSource } from '../../utils/resolveImageSource';
import { ZoomableLightboxImage } from './ZoomableLightboxImage';

const R = colors.radius;

function fitPreviewSize(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (imageWidth <= 0 || imageHeight <= 0 || containerWidth <= 0) {
    return { width: containerWidth, height: maxHeight };
  }
  const ratio = imageWidth / imageHeight;
  let width = containerWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return { width, height };
}

export function FoodThumb({
  imageUrl,
  name,
  size = 88,
}: {
  imageUrl: string;
  name: string;
  size?: number;
}) {
  const source = resolveImageSource(imageUrl);
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

type CapturePreviewProps = {
  imageUrl: string;
  /** @deprecated Use maxHeight. Kept for existing call sites. */
  height?: number;
  maxHeight?: number;
};

export function CapturePreview({
  imageUrl,
  height = 200,
  maxHeight,
}: CapturePreviewProps) {
  const { t } = useTranslation();
  const capHeight = maxHeight ?? height;
  const [containerWidth, setContainerWidth] = useState(0);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const source = resolveImageSource(imageUrl);

  useEffect(() => {
    setImageSize(null);
  }, [imageUrl]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) setContainerWidth(width);
  }, []);

  const onLoad = useCallback((event: NativeSyntheticEvent<ImageLoadEventData>) => {
    const { width, height: loadedHeight } = event.nativeEvent.source;
    if (width > 0 && loadedHeight > 0) {
      setImageSize({ width, height: loadedHeight });
    }
  }, []);

  const displaySize = useMemo(() => {
    if (!containerWidth) {
      return { width: '100%' as const, height: capHeight * 0.75 };
    }
    if (!imageSize) {
      return { width: containerWidth, height: capHeight * 0.75 };
    }
    return fitPreviewSize(
      imageSize.width,
      imageSize.height,
      containerWidth,
      capHeight,
    );
  }, [capHeight, containerWidth, imageSize]);

  if (!source) {
    return (
      <View
        style={[styles.capturePreview, { height: capHeight, backgroundColor: colors.surfaceMuted }]}
      >
        <Text style={styles.captureFallback}>{t('common.noImage')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.capturePreviewWrap} onLayout={onLayout}>
      <Image
        key={imageUrl}
        source={source}
        style={[styles.capturePreview, displaySize]}
        resizeMode="contain"
        onLoad={onLoad}
        accessibilityLabel={t('common.captureImage')}
      />
    </View>
  );
}

function ImageLightbox({
  visible,
  imageUrl,
  onClose,
}: {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const source = resolveImageSource(imageUrl);
  const { width: screenW, height: screenH } = useWindowDimensions();

  const imageFrame = useMemo(
    () => ({ width: Math.max(screenW - 32, 1), height: Math.max(screenH - 120, 1) }),
    [screenH, screenW],
  );

  if (!source) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.lightboxRoot}>
        <Pressable
          style={styles.lightboxBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
        <View style={styles.lightboxContent} pointerEvents="box-none">
          <ZoomableLightboxImage
            source={source}
            width={imageFrame.width}
            height={imageFrame.height}
            accessibilityLabel={t('common.captureImage')}
            resetKey={imageUrl}
          />
          <Text style={styles.lightboxHint}>{t('common.pinchToZoom')}</Text>
          <Pressable
            style={styles.lightboxCloseBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Text style={styles.lightboxCloseText}>{t('common.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** タップで全画面拡大できる CapturePreview */
export function ExpandableCapturePreview({
  disabled = false,
  ...previewProps
}: CapturePreviewProps & { disabled?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const source = resolveImageSource(previewProps.imageUrl);
  const expandable = Boolean(source) && !disabled;

  return (
    <>
      <View style={styles.expandableWrap}>
        <Pressable
          onPress={() => setOpen(true)}
          disabled={!expandable}
          style={({ pressed }) => [
            styles.expandablePress,
            expandable && pressed && styles.expandablePressPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.captureImage')}
          accessibilityHint={expandable ? t('common.tapToExpandImage') : undefined}
        >
          <CapturePreview {...previewProps} />
        </Pressable>
        {expandable ? (
          <View style={styles.expandBadge} pointerEvents="none">
            <Ionicons name="expand-outline" size={14} color={colors.inkMuted} />
          </View>
        ) : null}
      </View>
      <ImageLightbox
        visible={open}
        imageUrl={previewProps.imageUrl}
        onClose={() => setOpen(false)}
      />
    </>
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
  capturePreviewWrap: {
    width: '100%',
    alignItems: 'center',
  },
  capturePreview: {
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
  expandableWrap: {
    width: '100%',
    position: 'relative',
  },
  expandablePress: {
    width: '100%',
  },
  expandablePressPressed: {
    opacity: 0.92,
  },
  expandBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxRoot: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 14, 0.94)',
  },
  lightboxBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  lightboxContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 48,
  },
  lightboxHint: {
    marginTop: 12,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.62)',
    fontWeight: '500',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 24,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  lightboxCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
