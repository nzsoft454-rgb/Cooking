import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../../theme/colors';
import type { Recipe } from '../../../types';

type Props = {
  recipe: Recipe;
  heroSource: ImageSourcePropType;
  headerHeight: Animated.AnimatedInterpolation<number>;
  imageTranslateY: Animated.AnimatedInterpolation<number>;
  blurOpacity: Animated.AnimatedInterpolation<number>;
  titleOpacity: Animated.AnimatedInterpolation<number>;
  lightIconOpacity: Animated.AnimatedInterpolation<number>;
  darkIconOpacity: Animated.AnimatedInterpolation<number>;
  headerMinHeight: number;
  insetsTop: number;
  onBack: () => void;
  onToggleFavorite: () => void;
};

export function RecipeDetailHero({
  recipe,
  heroSource,
  headerHeight,
  imageTranslateY,
  blurOpacity,
  titleOpacity,
  lightIconOpacity,
  darkIconOpacity,
  headerMinHeight,
  insetsTop,
  onBack,
  onToggleFavorite,
}: Props) {
  const { t } = useTranslation();

  const renderNavIcon = (
    name: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
    label: string,
    lightColor = '#fff',
    darkColor = colors.ink
  ) => (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.navIconSlot}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.navIconLayer, { opacity: lightIconOpacity }]}>
          <Ionicons name={name} size={24} color={lightColor} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.navIconLayer, { opacity: darkIconOpacity }]}>
          <Ionicons name={name} size={24} color={darkColor} />
        </Animated.View>
      </View>
    </Pressable>
  );

  return (
    <Animated.View style={[styles.collapsingHeader, { height: headerHeight }]}>
      <Animated.Image
        source={heroSource}
        style={[styles.heroImage, { transform: [{ translateY: imageTranslateY }] }]}
        resizeMode="cover"
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}>
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, styles.webBlurFallback]} />
        ) : (
          <BlurView intensity={72} tint="light" style={StyleSheet.absoluteFill} />
        )}
      </Animated.View>
      <View style={[styles.navBar, { paddingTop: insetsTop, height: headerMinHeight }]}>
        {renderNavIcon('chevron-back', onBack, t('common.back'))}
        <Animated.Text style={[styles.navTitle, { opacity: titleOpacity }]} numberOfLines={1}>
          {recipe.title}
        </Animated.Text>
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={
            recipe.isFavorite ? t('recipe.detail.unfavorite') : t('recipe.detail.favorite')
          }
        >
          <View style={styles.navIconSlot}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.navIconLayer, { opacity: lightIconOpacity }]}>
              <Ionicons
                name={recipe.isFavorite ? 'star' : 'star-outline'}
                size={24}
                color="#fff"
              />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.navIconLayer, { opacity: darkIconOpacity }]}>
              <Ionicons
                name={recipe.isFavorite ? 'star' : 'star-outline'}
                size={24}
                color={colors.primary}
              />
            </Animated.View>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const HERO_HEIGHT = 300;

const styles = StyleSheet.create({
  collapsingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: HERO_HEIGHT,
  },
  webBlurFallback: {
    backgroundColor: 'rgba(245, 237, 228, 0.88)',
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  navIconSlot: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const RECIPE_DETAIL_HERO_HEIGHT = HERO_HEIGHT;
