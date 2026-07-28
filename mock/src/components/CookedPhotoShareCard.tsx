import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CookedPhotoImage } from './CookedPhotoImage';
import { colors } from '../theme/colors';

type Props = {
  imageUri: string;
  message: string;
  onImageLoad?: () => void;
};

/** シェア用に画像＋文案を合成するオフスクリーンカード（captureRef 用） */
export const CookedPhotoShareCard = forwardRef<View, Props>(function CookedPhotoShareCard(
  { imageUri, message, onImageLoad },
  ref
) {
  const lines = message.split('\n');

  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      <CookedPhotoImage uri={imageUri} style={styles.image} onLoad={onImageLoad} />
      <View style={styles.caption}>
        {lines.map((line, index) => (
          <Text key={`${index}-${line}`} style={styles.captionLine}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: 360,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 360,
  },
  caption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
    backgroundColor: colors.surface,
  },
  captionLine: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: '500',
  },
});
