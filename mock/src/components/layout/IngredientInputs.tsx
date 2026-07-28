import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IngredientAttribute } from '../../types';
import { colors } from '../../theme/colors';
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
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const isUnset = allowUnset && value === null;
  const quantityPct = isUnset ? 0 : Math.round((value ?? 0) * 100);

  const setFromX = (x: number) => {
    if (sliderWidth <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / sliderWidth));
    onChange(Math.round(ratio * 100) / 100);
  };

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.rowTop}>
        <FieldLabel icon="analytics-outline" label={t('common.remaining')} />
        <Text style={[styles.quantityValue, isUnset && styles.quantityUnset]}>
          {isUnset ? t('ingredientAttribute.unset') : `${quantityPct}%`}
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
      <Pressable
        style={[styles.sliderTrack, isUnset && styles.sliderTrackUnset]}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        onPress={(e) => setFromX(e.nativeEvent.locationX)}
      >
        <View style={[styles.sliderFill, { width: `${quantityPct}%` }, isUnset && styles.sliderFillUnset]} />
        {!isUnset ? (
          <View style={[styles.sliderThumb, { left: `${quantityPct}%` }]} />
        ) : null}
      </Pressable>
      <View style={styles.sliderMarks}>
        {[0, 25, 50, 75, 100].map((mark) => (
          <Text
            key={mark}
            style={[
              styles.sliderMark,
              quantityPct >= mark && styles.sliderMarkActive,
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
