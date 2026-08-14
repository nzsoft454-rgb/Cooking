import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AttributeField,
  FieldLabel,
  FooterBar,
  HeroCard,
  ListActionRow,
  PanelDivider,
  QuantitySlider,
  SectionTitle,
} from '../../components/d1Layout';
import {
  ConfirmDialog,
  FoodThumb,
  FooterPrimaryButton,
  Header,
  Panel,
  Screen,
  SlideFadeView,
} from '../../components/ui';
import { FridgeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { MOTION } from '../../theme/motion';
import type { Ingredient, IngredientAttribute } from '../../types';
import { formatAddedShort } from '../../utils/addedDate';
import { guessIngredientAttribute } from '../../utils/ingredientAttribute';
import { resolveIngredientImageUrl } from '../../utils/resolveIngredientImage';

type Props = NativeStackScreenProps<FridgeStackParamList, 'IngredientBatchEdit'>;

type Draft = {
  name: string;
  attribute: IngredientAttribute;
  /** 属性を手動で選び直したら名前からの自動推定を止める */
  attributeTouched: boolean;
};

function draftOf(drafts: Record<string, Draft>, item: Ingredient): Draft {
  return (
    drafts[item.id] ?? {
      name: item.name,
      attribute: item.attribute,
      attributeTouched: false,
    }
  );
}

function AccordionChevron({ expanded }: { expanded: boolean }) {
  const rotate = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: expanded ? 1 : 0,
      duration: MOTION.durationNormal,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotate]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg'],
            }),
          },
        ],
      }}
    >
      <Ionicons
        name="chevron-down"
        size={16}
        color={expanded ? colors.primary : colors.inkFaint}
      />
    </Animated.View>
  );
}

export function IngredientBatchEditScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { ingredients, updateIngredient, softDeleteIngredient } = useApp();
  const { ingredientIds } = route.params;

  const targets = useMemo(
    () =>
      ingredientIds
        .map((id) => ingredients.find((i) => i.id === id && !i.isDeleted))
        .filter((i): i is NonNullable<typeof i> => !!i),
    [ingredientIds, ingredients]
  );

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkAttribute, setBulkAttribute] = useState<IngredientAttribute | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [dialog, setDialog] = useState<'noChange' | 'saved' | 'delete' | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const patchDraft = (item: Ingredient, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [item.id]: { ...draftOf(prev, item), ...patch },
    }));
  };

  const resetDraft = (item: Ingredient) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  if (targets.length === 0) {
    return (
      <Screen edges={['top']}>
        <Header
          title={t('fridge.batchEdit.emptyTitle')}
          subtitle={t('fridge.ingredientEdit.subtitle')}
          onBack={() => navigation.goBack()}
        />
        <FooterBar>
          <FooterPrimaryButton
            label={t('common.back')}
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </FooterBar>
      </Screen>
    );
  }

  /** 一括変更は個別に設定した食材属性より優先する */
  const resolvePatch = (item: Ingredient) => {
    const draft = draftOf(drafts, item);
    const nextName = draft.name.trim() || item.name;
    const nextAttribute = bulkAttribute ?? draft.attribute;
    const patch: Partial<Ingredient> = {};

    if (nextName !== item.name) {
      patch.name = nextName;
      const catalogImageUrl = resolveIngredientImageUrl(nextName);
      if (catalogImageUrl) patch.imageUrl = catalogImageUrl;
    }
    if (nextAttribute !== item.attribute) patch.attribute = nextAttribute;
    if (quantity !== null) patch.quantity = quantity;

    return patch;
  };

  const save = () => {
    const updates = targets
      .map((item) => ({ id: item.id, patch: resolvePatch(item) }))
      .filter(({ patch }) => Object.keys(patch).length > 0);

    if (updates.length === 0) {
      setDialog('noChange');
      return;
    }

    updates.forEach(({ id, patch }) => updateIngredient(id, patch));
    setSavedCount(updates.length);
    setDialog('saved');
  };

  const doDeleteAll = () => {
    targets.forEach((item) => softDeleteIngredient(item.id));
    setDialog(null);
    navigation.goBack();
  };

  const closeAndGoBack = () => {
    setDialog(null);
    navigation.goBack();
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('fridge.batchEdit.title')}
        subtitle={t('fridge.batchEdit.subtitle', { count: targets.length })}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <HeroCard style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.heroThumbs}>
              {targets.slice(0, 4).map((item) => (
                <FoodThumb
                  key={item.id}
                  imageUrl={item.imageUrl}
                  name={item.name}
                  size={44}
                />
              ))}
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroEyebrow}>{t('fridge.batchEdit.batchEyebrow')}</Text>
              <Text style={styles.heroTitle}>
                {t('fridge.batchEdit.batchTitle', { count: targets.length })}
              </Text>
              <Text style={styles.heroSub} numberOfLines={2}>
                {targets.map((item) => draftOf(drafts, item).name.trim() || item.name).join(' · ')}
              </Text>
            </View>
          </View>
        </HeroCard>

        <SectionTitle label={t('fridge.batchEdit.sectionTargets')} />
        <Text style={styles.sectionHint}>{t('fridge.batchEdit.sectionTargetsHint')}</Text>
        <Panel style={styles.targetPanel}>
          {targets.map((item, i) => {
            const draft = draftOf(drafts, item);
            const expanded = expandedId === item.id;
            const displayName = draft.name.trim() || item.name;
            const effectiveAttribute = bulkAttribute ?? draft.attribute;
            const effectiveQuantity = quantity ?? item.quantity;
            const edited =
              displayName !== item.name || draft.attribute !== item.attribute;

            return (
              <React.Fragment key={item.id}>
                {i > 0 ? <PanelDivider /> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.targetRow,
                    expanded && styles.targetRowExpanded,
                    pressed && styles.targetRowPressed,
                  ]}
                  onPress={() => setExpandedId(expanded ? null : item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`${displayName} · ${t('fridge.batchEdit.tapToEdit')}`}
                >
                  <FoodThumb imageUrl={item.imageUrl} name={displayName} size={40} />
                  <View style={styles.targetBody}>
                    <View style={styles.targetNameRow}>
                      <Text style={styles.targetName} numberOfLines={1}>
                        {displayName}
                      </Text>
                      {edited ? (
                        <View style={styles.editedBadge}>
                          <Text style={styles.editedBadgeText}>
                            {t('fridge.batchEdit.editedBadge')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.targetMeta} numberOfLines={1}>
                      {t('fridge.batchEdit.remainingMeta', {
                        percent: Math.round(effectiveQuantity * 100),
                      })}
                      {` · ${t(`ingredientAttribute.short.${effectiveAttribute}`)} · ${formatAddedShort(item.addedDate)}`}
                    </Text>
                  </View>
                  <AccordionChevron expanded={expanded} />
                </Pressable>

                <SlideFadeView visible={expanded} style={styles.editor}>
                  <View style={styles.editorNameRow}>
                    <FieldLabel
                      icon="create-outline"
                      label={t('fridge.batchEdit.itemNameLabel')}
                    />
                    <TextInput
                      value={draft.name}
                      onChangeText={(text) =>
                        patchDraft(item, {
                          name: text,
                          attribute: draft.attributeTouched
                            ? draft.attribute
                            : guessIngredientAttribute(text),
                        })
                      }
                      style={styles.editorInput}
                      placeholder={item.name}
                      placeholderTextColor={colors.inkFaint}
                      returnKeyType="done"
                    />
                  </View>

                  <AttributeField
                    value={draft.attribute}
                    onChange={(v) => {
                      if (v) patchDraft(item, { attribute: v, attributeTouched: true });
                    }}
                  />

                  {bulkAttribute ? (
                    <View style={styles.overrideNote}>
                      <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color={colors.inkMuted}
                      />
                      <Text style={styles.overrideNoteText}>
                        {t('fridge.batchEdit.bulkOverrideNote')}
                      </Text>
                    </View>
                  ) : null}

                  {edited ? (
                    <Pressable
                      style={styles.resetRow}
                      onPress={() => resetDraft(item)}
                      accessibilityRole="button"
                    >
                      <Ionicons name="arrow-undo-outline" size={14} color={colors.danger} />
                      <Text style={styles.resetText}>{t('fridge.batchEdit.resetItem')}</Text>
                    </Pressable>
                  ) : null}
                </SlideFadeView>
              </React.Fragment>
            );
          })}
        </Panel>

        <SectionTitle label={t('fridge.batchEdit.sectionBulkChange')} />
        <Text style={styles.sectionHint}>
          {t('fridge.batchEdit.sectionBulkChangeHint', { count: targets.length })}
        </Text>
        <Panel>
          <AttributeField
            value={bulkAttribute}
            onChange={setBulkAttribute}
            allowUnset
          />
          <PanelDivider />
          <QuantitySlider
            allowUnset
            value={quantity}
            onChange={setQuantity}
          />
        </Panel>

        <SectionTitle label={t('fridge.batchEdit.sectionQuickActions')} />
        <Panel>
          <ListActionRow
            icon="pie-chart-outline"
            title={t('fridge.ingredientEdit.half')}
            subtitle={t('fridge.ingredientEdit.halfSub')}
            onPress={() => setQuantity(0.5)}
          />
          <PanelDivider />
          <ListActionRow
            icon="refresh-outline"
            title={t('fridge.ingredientEdit.restoreAll')}
            subtitle={t('fridge.ingredientEdit.restoreAllSub')}
            onPress={() => setQuantity(1)}
          />
        </Panel>
      </ScrollView>

      <FooterBar>
        <FooterPrimaryButton label={t('fridge.batchEdit.saveApply')} onPress={save} />
        <FooterPrimaryButton
          label={t('fridge.ingredientEdit.consumeDelete')}
          variant="dangerOutline"
          onPress={() => setDialog('delete')}
        />
      </FooterBar>

      <ConfirmDialog
        visible={dialog === 'noChange'}
        onClose={() => setDialog(null)}
        title={t('fridge.batchEdit.noChangeTitle')}
        body={t('fridge.batchEdit.noChangeMessage')}
        dismissLabel={t('common.close')}
      />

      <ConfirmDialog
        visible={dialog === 'saved'}
        onClose={closeAndGoBack}
        title={t('common.savedTitle')}
        body={t('fridge.batchEdit.savedMessage', { count: savedCount })}
        dismissLabel={t('common.close')}
      />

      <ConfirmDialog
        visible={dialog === 'delete'}
        onClose={() => setDialog(null)}
        title={t('fridge.batchEdit.deleteBatchTitle')}
        body={t('fridge.batchEdit.deleteBatchMessage', { count: targets.length })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        onConfirm={doDeleteAll}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hero: {
    marginTop: 16,
  },
  heroInner: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    paddingLeft: 18,
  },
  heroThumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: 96,
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
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkMuted,
    lineHeight: 18,
  },
  sectionHint: {
    marginTop: -4,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkFaint,
    lineHeight: 16,
  },
  targetPanel: {
    overflow: 'hidden',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },  targetRowExpanded: {
    backgroundColor: colors.primarySoft,
  },
  targetRowPressed: {
    opacity: 0.6,
  },
  targetBody: {
    flex: 1,
  },
  targetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  editedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: colors.radius,
    backgroundColor: colors.primary,
  },
  editedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.surface,
    letterSpacing: 0.4,
  },
  targetMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkFaint,
  },
  editor: {
    paddingBottom: 6,
    backgroundColor: colors.bgAlt,
  },
  editorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  editorInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  overrideNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  overrideNoteText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkMuted,
    lineHeight: 16,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
});
