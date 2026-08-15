import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnalysisStep, AnalysisStepBar } from '../../components/AnalysisStepBar';
import {
  ExpandableCapturePreview,
  Chip,
  FadeInView,
  FieldLabel,
  FoodThumb,
  FooterBar,
  FooterPrimaryButton,
  HeaderStack,
  Panel,
  PanelDivider,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../../components/ui';
import { AttributeField } from '../../components/d1Layout';
import type { ReceiptLineItem } from '../../data/receiptMock';
import { navigateTabScreen, resetToDashboardHome } from '../../navigation/navigationHelpers';
import { CameraStackParamList, RootTabParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import type { Ingredient, IngredientAttribute } from '../../types';
import { parseQuantityRatio } from '../../utils/quantityParse';
import {
  getDefaultIngredientAttribute,
  resolveIngredientAttribute,
} from '../../utils/ingredientAttribute';
import { syncPersistedIngredients } from '../../utils/syncPersistedIngredients';
import { matchReceiptLine } from '../../utils/resolveIngredientImage';

type Props = NativeStackScreenProps<CameraStackParamList, 'ReceiptResult'>;

type ReceiptRow = ReceiptLineItem & {
  resolvedName: string;
  imageUrl: string;
  known: boolean;
  attribute: IngredientAttribute;
};

function toRow(item: ReceiptLineItem): ReceiptRow {
  const matched = matchReceiptLine(item.rawName);
  return {
    ...item,
    resolvedName: matched.resolvedName,
    imageUrl: matched.imageUrl,
    known: matched.known,
    attribute: resolveIngredientAttribute(matched.resolvedName),
  };
}

function displayName(name: string): string {
  const short = name.split('（')[0]?.trim();
  if (!short) return name;
  return short.length <= 14 ? short : `${short.slice(0, 14)}…`;
}

function needsReview(row: ReceiptRow): boolean {
  return !row.known;
}

export function ReceiptResultScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { addIngredients, updateIngredient, softDeleteIngredient } = useApp();
  const { imageUrl } = route.params;
  const defaultQty = t('common.defaultQuantity');
  const [originalRows, setOriginalRows] = useState<ReceiptRow[]>(() => route.params.items.map(toRow));
  const [step, setStep] = useState<AnalysisStep>(1);
  const [rows, setRows] = useState<ReceiptRow[]>(() => route.params.items.map(toRow));
  const [editIndex, setEditIndex] = useState(0);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(defaultQty);
  const savedIngredientsRef = useRef<Ingredient[] | null>(null);

  React.useEffect(() => {
    setNewQty(defaultQty);
  }, [defaultQty]);

  useEffect(() => {
    const next = route.params.items.map(toRow);
    setOriginalRows(next);
    setRows(next);
    setEditIndex(0);
    savedIngredientsRef.current = null;
  }, [route.params.items, route.params.imageUrl]);

  const knownCount = useMemo(() => rows.filter((r) => r.known).length, [rows]);
  const reviewCount = useMemo(() => rows.filter(needsReview).length, [rows]);

  const updateRow = (index: number, patch: Partial<ReceiptRow>) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.resolvedName !== undefined) {
          const matched = matchReceiptLine(next.resolvedName);
          next.resolvedName = matched.resolvedName;
          next.imageUrl = matched.imageUrl;
          next.known = matched.known;
          next.attribute = resolveIngredientAttribute(matched.resolvedName);
        }
        return next;
      })
    );
  };

  const addRow = () => {
    if (!newName.trim()) return;
    const name = newName.trim();
    const matched = matchReceiptLine(name);
    setRows((prev) => [
      ...prev,
      {
        rawName: name,
        quantity: newQty.trim() || defaultQty,
        resolvedName: matched.resolvedName,
        imageUrl: matched.imageUrl,
        known: matched.known,
        attribute: resolveIngredientAttribute(matched.resolvedName),
      },
    ]);
    setNewName('');
    setNewQty(defaultQty);
    setEditIndex(rows.length);
  };

  const persistIngredients = () => {
    const payloads = rows.map((row) => ({
      name: row.resolvedName,
      imageUrl: row.imageUrl || '',
      attribute: row.attribute ?? getDefaultIngredientAttribute(),
      quantity: parseQuantityRatio(row.quantity),
    }));
    const synced = syncPersistedIngredients(
      payloads,
      savedIngredientsRef.current,
      addIngredients,
      updateIngredient,
      softDeleteIngredient
    );
    savedIngredientsRef.current = synced;
    return synced;
  };

  const saveToFridge = () => {
    const created = persistIngredients();
    Alert.alert(
      t('common.savedTitle'),
      t('camera.receiptResult.savedMessage', { count: created.length })
    );
    // 分析フローを閉じ、ダッシュボードに戻ったときに結果画面が残らないようにする
    const parent = navigation.getParent<NavigationProp<RootTabParamList>>();
    if (parent) navigateTabScreen(parent, 'FridgeTab', 'FridgeHome');
    requestAnimationFrame(() => resetToDashboardHome(navigation));
  };

  const cookNow = () => {
    const created = persistIngredients();
    navigation.navigate('CookingConfirm', {
      ingredientIds: created.map((c) => c.id),
      ingredientNames: created.map((c) => c.name),
      origin: 'camera',
    });
  };

  const stepHint =
    step === 1
      ? t('camera.receiptResult.stepHint1')
      : step === 2
        ? t('camera.receiptResult.stepHint2')
        : t('camera.receiptResult.stepHint3');

  const activeRow = rows[editIndex] ?? rows[0];
  const originalRow = originalRows[editIndex] ?? originalRows[0];

  return (
    <Screen edges={['top']}>
      <HeaderStack
        title={t('camera.receiptResult.title')}
        onBack={() => navigation.goBack()}
        subHeader={
          <AnalysisStepBar
            embedded
            current={step}
            onStepPress={(s) => {
              if (s < step) setStep(s);
            }}
          />
        }
      />

      <View style={styles.hintBar}>
        <Text style={styles.stepHint}>{stepHint}</Text>
      </View>

      <FadeInView contentKey={step} style={styles.scroll}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <SectionTitle label={t('camera.receiptResult.sectionReceipt')} />
              <Panel style={styles.photoPanel}>
                <ExpandableCapturePreview imageUrl={imageUrl} height={150} />
              </Panel>

              {reviewCount > 0 ? (
                <View style={styles.warnBanner}>
                  <Text style={styles.warnText}>
                    {t('camera.receiptResult.reviewBanner', { count: reviewCount })}
                  </Text>
                </View>
              ) : (
                <View style={styles.infoBanner}>
                  <Text style={styles.infoText}>
                    {t('camera.receiptResult.summary', {
                      total: rows.length,
                      matched: knownCount,
                    })}
                  </Text>
                </View>
              )}

              <SectionTitle label={t('camera.receiptResult.sectionItems')} />
              <Panel style={styles.panel}>
                {rows.map((row, index) => (
                  <React.Fragment key={`${row.rawName}-${index}`}>
                    {index > 0 ? <PanelDivider /> : null}
                    <View style={styles.resultRow}>
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkMark}>{t('common.checkmark')}</Text>
                      </View>
                      <FoodThumb
                        imageUrl={row.imageUrl}
                        name={row.resolvedName}
                        size={52}
                      />
                      <View style={styles.resultBody}>
                        <View style={styles.nameRow}>
                          <Text style={styles.resultName}>{displayName(row.resolvedName)}</Text>
                          {needsReview(row) ? (
                            <View style={styles.reviewBadge}>
                              <Text style={styles.reviewBadgeText}>
                                {t('common.reviewNeeded')}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.resultMeta}>
                          {row.known
                            ? t('camera.receiptResult.matched', { raw: row.rawName })
                            : t('camera.receiptResult.unmatched', { raw: row.rawName })}
                          {' · '}
                          {row.quantity}
                          {' · '}
                          {t(`ingredientAttribute.short.${row.attribute}`)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          setEditIndex(index);
                          setStep(2);
                        }}
                        style={styles.editIconBtn}
                        hitSlop={8}
                      >
                        <Text style={styles.editIcon}>✎</Text>
                      </Pressable>
                    </View>
                  </React.Fragment>
                ))}
              </Panel>
            </>
          ) : null}

          {step === 2 && activeRow ? (
            <>
              <SectionTitle label={t('camera.receiptResult.sectionEdit')} />
              <Panel style={styles.editCard}>
                <View style={styles.editCardRow}>
                  <View style={styles.editPhotoCol}>
                    <ExpandableCapturePreview imageUrl={imageUrl} height={120} />
                    <Text style={styles.editPhotoCaption}>
                      {t('camera.receiptResult.sectionReceipt')}
                    </Text>
                  </View>
                  <View style={styles.editFormCol}>
                    <FieldLabel icon="create-outline" label={t('common.ingredientName')} />
                    <TextInput
                      value={activeRow.resolvedName}
                      onChangeText={(text) => updateRow(editIndex, { resolvedName: text })}
                      style={styles.nameInput}
                      placeholder={t('common.ingredientName')}
                      placeholderTextColor={colors.inkFaint}
                    />

                    <View style={{ marginTop: 12 }}>
                      <FieldLabel icon="scale-outline" label={t('common.quantity')} />
                    </View>
                    <TextInput
                      value={activeRow.quantity}
                      onChangeText={(text) => updateRow(editIndex, { quantity: text })}
                      style={styles.input}
                      placeholder={t('camera.analysisResult.placeholderQtyExample')}
                      placeholderTextColor={colors.inkFaint}
                    />

                    <View style={{ marginTop: 12 }}>
                      <AttributeField
                        value={activeRow.attribute ?? getDefaultIngredientAttribute()}
                        onChange={(v) => {
                          if (v) updateRow(editIndex, { attribute: v });
                        }}
                      />
                    </View>

                    <View style={styles.aiNote}>
                      <Text style={styles.aiNoteLabel}>
                        {t('camera.receiptResult.receiptLineLabel')}
                      </Text>
                      <Text style={styles.aiNoteText}>
                        {t('camera.receiptResult.receiptLineMeta', {
                          raw: originalRow?.rawName ?? activeRow.rawName,
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </Panel>

              {rows.length > 1 ? (
                <>
                  <SectionTitle label={t('camera.analysisResult.sectionEditTarget')} />
                  <View style={styles.chipRow}>
                    {rows.map((row, index) => (
                      <Chip
                        key={`tab-${index}`}
                        label={displayName(row.resolvedName)}
                        selected={editIndex === index}
                        onPress={() => setEditIndex(index)}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <SectionTitle label={t('camera.analysisResult.sectionAdd')} />
              <Panel style={styles.addPanel}>
                <View style={styles.addBlock}>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    style={styles.input}
                    placeholder={t('camera.analysisResult.placeholderAddName')}
                    placeholderTextColor={colors.inkFaint}
                  />
                  <TextInput
                    value={newQty}
                    onChangeText={setNewQty}
                    style={[styles.input, { marginTop: 8 }]}
                    placeholder={t('common.amount')}
                    placeholderTextColor={colors.inkFaint}
                  />
                  <PrimaryButton
                    label={t('camera.analysisResult.addToList')}
                    variant="ghost"
                    onPress={addRow}
                    style={{ marginTop: 10 }}
                  />
                </View>
              </Panel>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <View style={styles.saveBanner}>
                <Text style={styles.saveBannerText}>
                  {t('camera.receiptResult.finalConfirm', { count: rows.length })}
                </Text>
              </View>

              <SectionTitle label={t('camera.analysisResult.sectionSave')} />
              <Panel style={styles.panel}>
                {rows.map((row, index) => (
                  <React.Fragment key={`save-${index}-${row.resolvedName}`}>
                    {index > 0 ? <PanelDivider /> : null}
                    <View style={styles.saveRow}>
                      <FoodThumb
                        imageUrl={row.imageUrl}
                        name={row.resolvedName}
                        size={52}
                      />
                      <View style={styles.resultBody}>
                        <Text style={styles.resultName}>{row.resolvedName}</Text>
                        <Text style={styles.resultMeta}>
                          {t('camera.analysisResult.confirmedMeta', { quantity: row.quantity })}
                          {' · '}
                          {t(`ingredientAttribute.short.${row.attribute}`)}
                        </Text>
                      </View>
                      <View style={styles.savedCheckCircle}>
                        <Text style={styles.savedCheck}>{t('common.checkmark')}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </Panel>

              <Panel style={styles.notePanel}>
                <Text style={styles.notePanelText}>
                  {t('camera.analysisResult.addedDateNote')}
                </Text>
              </Panel>

              <Text style={styles.confirmQuestion}>
                {t('camera.receiptResult.confirmAdd')}
              </Text>

              <Pressable onPress={() => setStep(2)} style={styles.backEdit}>
                <Text style={styles.backEditText}>
                  {t('camera.analysisResult.backToEdit')}
                </Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </FadeInView>

      <FooterBar>
        {step === 1 ? (
          <>
            <FooterPrimaryButton
              label={t('common.back')}
              variant="ghost"
              onPress={() => navigation.goBack()}
            />
            <FooterPrimaryButton
              label={t('common.edit')}
              variant="secondary"
              onPress={() => setStep(2)}
            />
            <FooterPrimaryButton label={t('common.next')} onPress={() => setStep(3)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <FooterPrimaryButton
              label={t('common.back')}
              variant="ghost"
              onPress={() => setStep(1)}
            />
            <FooterPrimaryButton
              label={t('camera.analysisResult.saveToPreview')}
              onPress={() => setStep(3)}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <FooterPrimaryButton
              label={t('camera.receiptResult.saveToFridge')}
              onPress={saveToFridge}
            />
            <FooterPrimaryButton
              label={t('camera.analysisResult.cookNow')}
              variant="ghost"
              onPress={cookNow}
            />
          </>
        ) : null}
      </FooterBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hintBar: {
    backgroundColor: colors.bg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepHint: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  scroll: { flex: 1 },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  photoPanel: {
    padding: 14,
    overflow: 'hidden',
  },
  warnBanner: {
    marginTop: 12,
    backgroundColor: colors.dangerSoft,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 12,
  },
  warnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  infoBanner: {
    marginTop: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  panel: {
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  resultBody: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  reviewBadge: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: colors.radius,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reviewBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  resultMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.inkMuted,
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  editCard: {
    overflow: 'hidden',
  },
  editCardRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    padding: 14,
  },
  editPhotoCol: {
    width: 120,
  },
  editPhotoCaption: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkFaint,
    textAlign: 'center',
  },
  editFormCol: {
    flex: 1,
    gap: 6,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  aiNote: {
    marginTop: 12,
    padding: 10,
    borderRadius: colors.radius,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkMuted,
    marginBottom: 4,
  },
  aiNoteText: {
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  addPanel: {
    overflow: 'hidden',
  },
  addBlock: {
    padding: 14,
  },
  saveBanner: {
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  notePanel: {
    marginTop: 12,
    padding: 12,
  },
  notePanelText: {
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  confirmQuestion: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  backEdit: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  backEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  savedCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCheck: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
