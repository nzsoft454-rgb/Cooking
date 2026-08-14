import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AddedDateReadOnly,
  AttributeField,
  QuantitySlider,
} from '../../components/d1Layout';
import {
  ConfirmDialog,
  FoodThumb,
  FooterBar,
  FooterPrimaryButton,
  Header,
  Panel,
  PrimaryButton,
  Screen,
} from '../../components/ui';
import { FridgeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import type { IngredientAttribute } from '../../types';
import { formatAddedShort } from '../../utils/addedDate';
import {
  getDefaultIngredientAttribute,
  guessIngredientAttribute,
} from '../../utils/ingredientAttribute';
import { resolveIngredientImageUrl } from '../../utils/resolveIngredientImage';

type Props = NativeStackScreenProps<FridgeStackParamList, 'IngredientEdit'>;

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function FieldLabel({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

export function IngredientEditScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { ingredients, updateIngredient, softDeleteIngredient } = useApp();
  const ingredient = useMemo(
    () => ingredients.find((i) => i.id === route.params.ingredientId),
    [ingredients, route.params.ingredientId]
  );

  const [name, setName] = useState(ingredient?.name ?? '');
  const [attribute, setAttribute] = useState<IngredientAttribute>(
    ingredient?.attribute ?? getDefaultIngredientAttribute()
  );
  const [quantity, setQuantity] = useState(ingredient?.quantity ?? 1);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!ingredient) return;
    setName(ingredient.name);
    setAttribute(ingredient.attribute ?? getDefaultIngredientAttribute());
    setQuantity(ingredient.quantity);
  }, [ingredient?.id, ingredient?.name, ingredient?.attribute, ingredient?.quantity]);

  if (!ingredient) {
    return (
      <Screen>
        <Header title={t('fridge.ingredientEdit.notFound')} />
        <PrimaryButton
          label={t('common.back')}
          onPress={() => navigation.goBack()}
          style={{ margin: 20 }}
        />
      </Screen>
    );
  }

  const quantityPct = Math.round(quantity * 100);
  const displayName = name.trim() || ingredient.name;
  const previewImageUrl =
    resolveIngredientImageUrl(displayName) || ingredient.imageUrl;
  const addedShort = formatAddedShort(ingredient.addedDate);

  const save = () => {
    const catalogImageUrl = resolveIngredientImageUrl(displayName);
    updateIngredient(ingredient.id, {
      name: displayName,
      attribute,
      quantity: Math.min(1, Math.max(0, quantity)),
      imageUrl: catalogImageUrl || ingredient.imageUrl,
    });
    navigation.goBack();
  };

  const doDelete = () => {
    softDeleteIngredient(ingredient.id);
    setDeleteOpen(false);
    navigation.goBack();
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('fridge.ingredientEdit.title')}
        subtitle={t('fridge.ingredientEdit.subtitle')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Panel style={styles.heroCard}>
          <View style={styles.heroAccent} />
          <View style={styles.heroInner}>
            <View style={styles.heroPhotoFrame}>
              <FoodThumb imageUrl={previewImageUrl} name={displayName} size={76} />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroEyebrow}>{t('fridge.ingredientEdit.editingEyebrow')}</Text>
              <Text style={styles.heroName} numberOfLines={2}>
                {displayName}
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{quantityPct}%</Text>
                  <Text style={styles.heroStatLabel}>{t('common.remaining')}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{addedShort}</Text>
                  <Text style={styles.heroStatLabel}>{t('addedDate.labelShort')}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {t(`ingredientAttribute.short.${attribute}`)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Panel>

        <SectionTitle label={t('fridge.ingredientEdit.sectionBasic')} />
        <Panel style={styles.panel}>
          <View style={styles.row}>
            <FieldLabel icon="create-outline" label={t('common.ingredientName')} />
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                setAttribute(guessIngredientAttribute(text));
              }}
              style={styles.rowInput}
              placeholder={t('common.ingredientName')}
              placeholderTextColor={colors.inkFaint}
            />
          </View>

          <View style={styles.rowDivider} />

          <AttributeField
            value={attribute}
            onChange={(v) => {
              if (v) setAttribute(v);
            }}
          />

          <View style={styles.rowDivider} />

          <AddedDateReadOnly addedDate={ingredient.addedDate} />

          <View style={styles.rowDivider} />

          <QuantitySlider
            value={quantity}
            onChange={(v) => {
              if (v !== null) setQuantity(v);
            }}
          />
        </Panel>

        <SectionTitle label={t('fridge.ingredientEdit.sectionQuickActions')} />
        <Panel style={styles.panel}>
          <Pressable style={styles.actionRow} onPress={() => setQuantity(0.5)}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{t('fridge.ingredientEdit.half')}</Text>
              <Text style={styles.actionSub}>{t('fridge.ingredientEdit.halfSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </Pressable>
          <View style={styles.rowDivider} />
          <Pressable style={styles.actionRow} onPress={() => setQuantity(1)}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{t('fridge.ingredientEdit.restoreAll')}</Text>
              <Text style={styles.actionSub}>{t('fridge.ingredientEdit.restoreAllSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </Pressable>
        </Panel>
      </ScrollView>

      <FooterBar>
        <FooterPrimaryButton label={t('common.save')} onPress={save} />
        <FooterPrimaryButton
          label={t('fridge.ingredientEdit.consumeDelete')}
          variant="dangerOutline"
          onPress={() => setDeleteOpen(true)}
        />
      </FooterBar>

      <ConfirmDialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('fridge.ingredientEdit.deleteTitle')}
        body={t('fridge.ingredientEdit.deleteConfirm', { name: displayName })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        onConfirm={doDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroCard: {
    marginTop: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  heroAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    paddingLeft: 18,
  },
  heroPhotoFrame: {
    padding: 4,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  heroBody: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkFaint,
    letterSpacing: 0.4,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkMuted,
    letterSpacing: 1,
  },
  panel: {
    overflow: 'hidden',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 92,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    paddingVertical: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkFaint,
  },
});
