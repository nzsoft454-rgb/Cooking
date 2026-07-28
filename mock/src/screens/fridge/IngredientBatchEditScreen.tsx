import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  FooterBar,
  HeroCard,
  ListActionRow,
  PanelDivider,
  QuantitySlider,
  SectionTitle,
  AttributeField,
} from '../../components/d1Layout';
import {
  ConfirmDialog,
  FoodThumb,
  FooterPrimaryButton,
  Header,
  Panel,
  Screen,
} from '../../components/ui';
import { FridgeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import type { IngredientAttribute } from '../../types';
import { formatAddedShort } from '../../utils/addedDate';

type Props = NativeStackScreenProps<FridgeStackParamList, 'IngredientBatchEdit'>;

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

  const [bulkAttribute, setBulkAttribute] = useState<IngredientAttribute | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [dialog, setDialog] = useState<'noChange' | 'saved' | 'delete' | null>(null);

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

  const save = () => {
    const hasQty = quantity !== null;
    const hasAttribute = bulkAttribute !== null;

    if (!hasQty && !hasAttribute) {
      setDialog('noChange');
      return;
    }

    targets.forEach((item) => {
      const patch: { quantity?: number; attribute?: IngredientAttribute } = {};
      if (hasQty && quantity !== null) patch.quantity = quantity;
      if (hasAttribute && bulkAttribute) patch.attribute = bulkAttribute;
      updateIngredient(item.id, patch);
    });

    setDialog('saved');
  };

  const confirmDeleteAll = () => {
    setDialog('delete');
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
                {targets.map((item) => item.name).join(' · ')}
              </Text>
            </View>
          </View>
        </HeroCard>

        <SectionTitle label={t('fridge.batchEdit.sectionTargets')} />
        <Panel>
          {targets.map((item, i) => (
            <React.Fragment key={item.id}>
              {i > 0 ? <PanelDivider /> : null}
              <View style={styles.targetRow}>
                <FoodThumb imageUrl={item.imageUrl} name={item.name} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.targetName}>{item.name}</Text>
                  <Text style={styles.targetMeta}>
                    {t('fridge.batchEdit.remainingMeta', {
                      percent: Math.round(item.quantity * 100),
                    })}
                    {` · ${t(`ingredientAttribute.short.${item.attribute}`)} · ${formatAddedShort(item.addedDate)}`}
                  </Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </Panel>

        <SectionTitle label={t('fridge.batchEdit.sectionBulkChange')} />
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
          onPress={confirmDeleteAll}
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
        body={t('fridge.batchEdit.savedMessage', { count: targets.length })}
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
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  targetName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  targetMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkFaint,
  },
});
