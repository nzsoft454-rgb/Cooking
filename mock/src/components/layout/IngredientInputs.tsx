import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { IngredientAttribute } from '../../types';
import { colors } from '../../theme/colors';
import { MOTION } from '../../theme/motion';
import { formatAddedDisplay, formatAddedShort } from '../../utils/addedDate';
import { INGREDIENT_ATTRIBUTES } from '../../utils/ingredientAttribute';
import { Chip } from '../ui/Panel';
import { FieldLabel } from './FormFields';

export function AttributeField({
  value,
  onChange,
  allowUnset = false,
}: {
  value: IngredientAttribute | null;
  onChange: (v: IngredientAttribute | null) => void;
  allowUnset?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.block}>
      <FieldLabel icon="pricetag-outline" label={t('ingredientAttribute.label')} />
      <View style={styles.chipRow}>
        {allowUnset ? (
          <Chip
            label={t('ingredientAttribute.unset')}
            selected={value === null}
            onPress={() => onChange(null)}
          />
        ) : null}
        {INGREDIENT_ATTRIBUTES.map((attr) => (
          <Chip
            key={attr}
            label={t(`ingredientAttribute.${attr}`)}
            selected={value === attr}
            onPress={() => onChange(attr)}
          />
        ))}
      </View>
      {value ? (
        <Text style={styles.attributeHint}>{t(`ingredientAttribute.hint.${value}`)}</Text>
      ) : allowUnset ? (
        <Text style={styles.attributeHint}>{t('ingredientAttribute.unsetHint')}</Text>
      ) : null}
    </View>
  );
}

export function AddedDateReadOnly({ addedDate }: { addedDate: string }) {
  const { t } = useTranslation();

  return (
    <View style={styles.block}>
      <View style={styles.rowTop}>
        <FieldLabel icon="calendar-outline" label={t('addedDate.label')} />
        <Text style={styles.rowValue}>{formatAddedDisplay(addedDate)}</Text>
      </View>
      <Text style={styles.addedMeta}>{formatAddedShort(addedDate)}</Text>
      <Text style={styles.addedHint}>{t('addedDate.hint')}</Text>
    </View>
  );
}

export function QuantitySlider({
  value,
  onChange,
  allowUnset = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  allowUnset?: boolean;
}) {
  const { t } = useTranslation();
  const [sliderWidth, setSliderWidth] = useState(0);
  const isUnset = allowUnset && value === null;
  const progress = useRef(new Animated.Value(isUnset ? 0 : (value ?? 0))).current;
  const [displayPct, setDisplayPct] = useState(() =>
    isUnset ? 0 : Math.round((value ?? 0) * 100)
  );
  const skipAnimationRef = useRef(false);
  const draggingRef = useRef(false);
  const sliderWidthRef = useRef(0);
  const isUnsetRef = useRef(isUnset);
  const onChangeRef = useRef(onChange);

  sliderWidthRef.current = sliderWidth;
  isUnsetRef.current = isUnset;
  onChangeRef.current = onChange;

  useEffect(() => {
    const listenerId = progress.addListener(({ value: v }) => {
      setDisplayPct(Math.round(v * 100));
    });
    return () => progress.removeListener(listenerId);
  }, [progress]);

  useEffect(() => {
    if (skipAnimationRef.current) {
      skipAnimationRef.current = false;
      return;
    }
    if (draggingRef.current) return;

    const target = isUnset ? 0 : (value ?? 0);
    Animated.timing(progress, {
      toValue: target,
      duration: MOTION.durationNormal,
      useNativeDriver: false,
    }).start();
  }, [value, isUnset, progress]);

  const applyFromLocationX = (locationX: number) => {
    const width = sliderWidthRef.current;
    if (width <= 0) return;
    const ratio = Math.min(1, Math.max(0, locationX / width));
    const next = Math.round(ratio * 100) / 100;
    progress.stopAnimation();
    progress.setValue(next);
    skipAnimationRef.current = true;
    onChangeRef.current(next);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isUnsetRef.current,
        onMoveShouldSetPanResponder: () => !isUnsetRef.current,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          draggingRef.current = true;
          applyFromLocationX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          applyFromLocationX(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          draggingRef.current = false;
        },
        onPanResponderTerminate: () => {
          draggingRef.current = false;
        },
      }),
    [progress]
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const thumbLeft = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.rowTop}>
        <FieldLabel icon="analytics-outline" label={t('common.remaining')} />
        <Text style={[styles.quantityValue, isUnset && styles.quantityUnset]}>
          {isUnset ? t('ingredientAttribute.unset') : `${displayPct}%`}
        </Text>
      </View>
      {allowUnset ? (
        <View style={styles.chipRow}>
          <Chip
            label={t('ingredientAttribute.unset')}
            selected={isUnset}
            onPress={() => onChange(null)}
          />
        </View>
      ) : null}
      <View
        style={[styles.sliderTouchArea, isUnset && styles.sliderTouchAreaDisabled]}
        {...(!isUnset ? panResponder.panHandlers : {})}
      >
        <View
          style={[styles.sliderTrack, isUnset && styles.sliderTrackUnset]}
          onLayout={onTrackLayout}
        >
          <Animated.View
            style={[
              styles.sliderFill,
              { width: fillWidth },
              isUnset && styles.sliderFillUnset,
            ]}
          />
          {!isUnset ? (
            <Animated.View style={[styles.sliderThumb, { left: thumbLeft }]} pointerEvents="none" />
          ) : null}
        </View>
      </View>
      <View style={styles.sliderMarks}>
        {[0, 25, 50, 75, 100].map((mark) => (
          <Text
            key={mark}
            style={[
              styles.sliderMark,
              displayPct >= mark && styles.sliderMarkActive,
            ]}
          >
            {mark}
          </Text>
        ))}
      </View>
    </View>
  );
}


const R = colors.radius;

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  attributeHint: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkMuted,
    lineHeight: 18,
  },
  addedMeta: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  addedHint: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkFaint,
    lineHeight: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  sliderBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  quantityValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  quantityUnset: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkMuted,
    letterSpacing: 0,
  },
  sliderTrackUnset: {
    opacity: 0.55,
  },
  sliderFillUnset: {
    backgroundColor: colors.inkFaint,
  },
  sliderTouchArea: {
    justifyContent: 'center',
    paddingVertical: 14,
    marginVertical: -10,
  },
  sliderTouchAreaDisabled: {
    opacity: 0.55,
  },
  sliderTrack: {
    height: 10,
    borderRadius: R,
    backgroundColor: colors.bgAlt,
    overflow: 'visible',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: R,
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMark: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkFaint,
  },
  sliderMarkActive: {
    color: colors.primary,
  },
});
