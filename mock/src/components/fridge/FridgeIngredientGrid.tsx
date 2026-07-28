import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ProgressBar } from '../layout';
import { FoodThumb } from '../ui';
import { colors } from '../../theme/colors';
import { MOTION } from '../../theme/motion';
import type { Ingredient } from '../../types';
import { formatAddedShort, isLongStored } from '../../utils/addedDate';
import {
  hasFridgeCardEntered,
  markFridgeCardEntered,
} from '../../utils/fridgeCardAnimation';

const NUM_COLUMNS = 4;
const GRID_GAP = 6;
export const FRIDGE_GRID_H_PAD = 10;

type Props = {
  items: Ingredient[];
  selected: string[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  emptyMessage: string;
};

type CardProps = {
  item: Ingredient;
  index: number;
  isOn: boolean;
  cardWidth: number;
  marginRight: number;
  thumbSize: number;
  onToggle: () => void;
  onEdit: () => void;
};

function FridgeIngredientCard({
  item,
  index,
  isOn,
  cardWidth,
  marginRight,
  thumbSize,
  onToggle,
  onEdit,
}: CardProps) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const selectOpacity = useRef(new Animated.Value(isOn ? 1 : 0)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterY = useRef(new Animated.Value(MOTION.cardEnterOffsetY)).current;
  const selectionReady = useRef(false);

  const pct = Math.round(item.quantity * 100);
  const addedLabel = formatAddedShort(item.addedDate);
  const longStored = isLongStored(item.addedDate);

  useEffect(() => {
    if (hasFridgeCardEntered(item.id)) {
      enterOpacity.setValue(1);
      enterY.setValue(0);
      return;
    }

    markFridgeCardEntered(item.id);
    const delay = Math.min(index * MOTION.cardEnterStaggerMs, MOTION.cardEnterMaxDelayMs);
    enterOpacity.setValue(0);
    enterY.setValue(MOTION.cardEnterOffsetY);

    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: MOTION.durationNormal,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(enterY, {
        toValue: 0,
        duration: MOTION.durationNormal,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [item.id, index, enterOpacity, enterY]);

  useEffect(() => {
    if (!selectionReady.current) {
      selectionReady.current = true;
      return;
    }

    Animated.sequence([
      Animated.timing(scale, {
        toValue: MOTION.pressScale,
        duration: MOTION.durationFast,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: MOTION.durationFast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOn, scale]);

  useEffect(() => {
    Animated.timing(selectOpacity, {
      toValue: isOn ? 1 : 0,
      duration: MOTION.durationNormal,
      useNativeDriver: true,
    }).start();
  }, [isOn, selectOpacity]);

  return (
    <Animated.View
      style={{
        width: cardWidth,
        marginRight,
        opacity: enterOpacity,
        transform: [{ translateY: enterY }],
      }}
    >
      <Pressable onPress={onToggle} onLongPress={onEdit}>
        {({ pressed }) => (
          <Animated.View
            style={[
              styles.card,
              isOn && styles.cardSelected,
              !isOn && longStored && styles.cardLongStored,
              pressed ? { opacity: MOTION.pressOpacity } : undefined,
              { transform: [{ scale }] },
            ]}
          >
            <View style={styles.photoWrap}>
              <FoodThumb imageUrl={item.imageUrl} name={item.name} size={thumbSize} />
            </View>
            <Text style={[styles.name, isOn && styles.nameSelected]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.attributeBadge, isOn && styles.attributeBadgeSelected]}>
                {t(`ingredientAttribute.short.${item.attribute}`)}
              </Text>
              <Text style={[styles.addedLabel, longStored && styles.addedLabelLong]}>
                {addedLabel}
              </Text>
            </View>
            <ProgressBar percent={pct} />
            <Text style={[styles.qty, isOn && styles.qtySelected]}>{pct}%</Text>

            {isOn ? (
              <Animated.View
                pointerEvents="none"
                style={[styles.selectBadge, styles.selectBadgeOn, { opacity: selectOpacity }]}
              >
                <Text style={styles.selectBadgeCheck}>{t('common.checkmark')}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function FridgeIngredientGrid({
  items,
  selected,
  onToggle,
  onEdit,
  emptyMessage,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth =
    (screenWidth - FRIDGE_GRID_H_PAD * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  return (
    <FlatList
      style={styles.list}
      data={items}
      extraData={selected}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      renderItem={({ item, index }) => {
        const isRowEnd = (index + 1) % NUM_COLUMNS === 0;
        const thumbSize = Math.min(56, Math.floor(cardWidth - 12));

        return (
          <FridgeIngredientCard
            item={item}
            index={index}
            isOn={selected.includes(item.id)}
            cardWidth={cardWidth}
            marginRight={isRowEnd ? 0 : GRID_GAP}
            thumbSize={thumbSize}
            onToggle={() => onToggle(item.id)}
            onEdit={() => onEdit(item.id)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: FRIDGE_GRID_H_PAD,
    paddingTop: 12,
    paddingBottom: 8,
  },
  list: {
    flex: 1,
  },
  row: {
    marginBottom: GRID_GAP,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    padding: 6,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardLongStored: {
    borderColor: '#C4860A',
    backgroundColor: '#FFF6E6',
  },
  photoWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  selectBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectBadgeOn: {
    backgroundColor: colors.primary,
  },
  selectBadgeCheck: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    minHeight: 28,
    lineHeight: 14,
  },
  nameSelected: {
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 2,
  },
  attributeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: '800',
    color: colors.inkMuted,
    backgroundColor: colors.surfaceMuted,
  },
  attributeBadgeSelected: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  addedLabel: {
    flex: 1,
    fontSize: 9,
    fontWeight: '600',
    color: colors.inkFaint,
    textAlign: 'right',
  },
  addedLabelLong: {
    color: '#C4860A',
    fontWeight: '700',
  },
  qty: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkFaint,
    textAlign: 'right',
  },
  qtySelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.inkMuted,
    paddingHorizontal: 24,
  },
});
