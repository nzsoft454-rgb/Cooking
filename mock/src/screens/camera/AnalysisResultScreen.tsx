import type { NavigationProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
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
  CapturePreview,
  Chip,
  FieldLabel,
  FoodThumb,
  FooterBar,
  FooterPrimaryButton,
  FadeInView,
  HeaderStack,
  Panel,
  PanelDivider,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../../components/ui';
import { AttributeField } from '../../components/d1Layout';
import { navigateTabScreen, resetToDashboardHome } from '../../navigation/navigationHelpers';
import { CameraStackParamList, RootTabParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import type { DetectedItem, Ingredient } from '../../types';
import { parseQuantityRatio } from '../../utils/quantityParse';
import {
  getDefaultIngredientAttribute,
  guessIngredientAttribute,
} from '../../utils/ingredientAttribute';
import { syncPersistedIngredients } from '../../utils/syncPersistedIngredients';
import { detectedItemImageUrl } from '../../utils/cropFoodThumbnails';
import { displayQuantity, sanitizeDetectedFoodQuantity } from '../../utils/sanitizeDetectedFoodQuantity';

function normalizeDetectedItem(item: DetectedItem): DetectedItem {
  return {
    ...item,
    quantity: sanitizeDetectedFoodQuantity(item.quantity),
    attribute: item.attribute ?? guessIngredientAttribute(item.name),
  };
}

type Props = NativeStackScreenProps<CameraStackParamList, 'AnalysisResult'>;

function needsReview(item: DetectedItem): boolean {
  return item.name.includes('小松菜') || item.confidence === 'low';
}

function displayName(name: string): string {
  const short = name.split('（')[0]?.trim();
  if (!short) return name;
  return short.length <= 12 ? short : `${short.slice(0, 12)}…`;
}

function aiOriginalLabel(name: string): string {
  if (name.includes('小松菜')) return '小松菜';
  return displayName(name);
}

export function AnalysisResultScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { addIngredients, updateIngredient, softDeleteIngredient } = useApp();
  const imageUrl = route.params.imageUrl;
  const defaultQty = t('common.defaultQuantity');
  const [originalItems, setOriginalItems] = useState<DetectedItem[]>(
    route.params.items.map(normalizeDetectedItem),
  );
  const [step, setStep] = useState<AnalysisStep>(1);
  const [items, setItems] = useState<DetectedItem[]>(
    route.params.items.map(normalizeDetectedItem),
  );
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(defaultQty);
  const [editIndex, setEditIndex] = useState(0);
  const savedIngredientsRef = useRef<Ingredient[] | null>(null);

  const confidenceLabel = (c: string) => {
    if (c === 'high' || c === 'medium' || c === 'low' || c === 'manual') {
      return t(`confidence.${c}`);
    }
    return c;
  };

  React.useEffect(() => {
    setNewQty(defaultQty);
  }, [defaultQty]);

  useEffect(() => {
    const next = route.params.items.map(normalizeDetectedItem);
    setOriginalItems(next);
    setItems(next);
    setEditIndex(0);
    savedIngredientsRef.current = null;
  }, [route.params.items, route.params.imageUrl]);

  const reviewCount = React.useMemo(() => items.filter(needsReview).length, [items]);

  const updateItem = (index: number, patch: Partial<DetectedItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if (patch.name !== undefined && patch.attribute === undefined) {
          next.attribute = guessIngredientAttribute(next.name);
        }
        return next;
      })
    );
  };

  const addItem = () => {
    if (!newName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        name: newName.trim(),
        quantity: newQty.trim() || defaultQty,
        confidence: 'manual',
        attribute: guessIngredientAttribute(newName.trim()),
      },
    ]);
    setNewName('');
    setNewQty(defaultQty);
    setEditIndex(items.length);
  };

  const persistIngredients = () => {
    const payloads = items.map((item) => ({
      name: item.name,
      imageUrl: detectedItemImageUrl(item, imageUrl),
      attribute: item.attribute ?? getDefaultIngredientAttribute(),
      quantity: parseQuantityRatio(item.quantity),
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
      t('camera.analysisResult.savedMessage', { count: created.length })
    );
    // 分析フローを閉じ、ダッシュボードに戻ったときに分析結果が残らないようにする
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
      ? t('camera.analysisResult.stepHint1')
      : step === 2
        ? t('camera.analysisResult.stepHint2')
        : t('camera.analysisResult.stepHint3');

  const activeItem = items[editIndex] ?? items[0];
  const originalItem = originalItems[editIndex] ?? originalItems[0];
  const showSpinachFix =
    (originalItem?.name.includes('小松菜') ?? false) ||
    (activeItem?.name.includes('小松菜') ?? false);

  return (
    <Screen edges={['top']}>
      <HeaderStack
        title={t('camera.analysisResult.title')}
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
            <SectionTitle label={t('camera.analysisResult.sectionCapture')} />
            <Panel style={styles.photoPanel}>
              <CapturePreview imageUrl={imageUrl} height={150} />
            </Panel>

            {reviewCount > 0 ? (
              <View style={styles.warnBanner}>
                <Text style={styles.warnText}>
                  {t('camera.analysisResult.reviewBanner', { count: reviewCount })}
                </Text>
              </View>
            ) : (
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  {t('camera.analysisResult.detectedBanner', { count: items.length })}
                </Text>
              </View>
            )}

            <SectionTitle label={t('camera.analysisResult.sectionResults')} />
            <Panel style={styles.panel}>
              {items.map((item, index) => (
                <React.Fragment key={`${index}-${item.name}`}>
                  {index > 0 ? <PanelDivider /> : null}
                  <View style={styles.resultRow}>
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>{t('common.checkmark')}</Text>
                    </View>
                    <FoodThumb
                      imageUrl={detectedItemImageUrl(item, imageUrl)}
                      name={item.name}
                      size={52}
                    />
                    <View style={styles.resultBody}>
                      <View style={styles.nameRow}>
                        <Text style={styles.resultName} numberOfLines={2} ellipsizeMode="tail">
                          {displayName(item.name)}
                        </Text>
                        {needsReview(item) ? (
                          <View style={styles.reviewBadge}>
                            <Text style={styles.reviewBadgeText}>{t('common.reviewNeeded')}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.resultMeta} numberOfLines={1} ellipsizeMode="tail">
                        {t('camera.analysisResult.resultMeta', {
                          attribute: t(`ingredientAttribute.short.${item.attribute}`),
                          quantity: displayQuantity(item.quantity, defaultQty),
                          confidence: confidenceLabel(item.confidence),
                        })}
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

            {items.some((i) => i.name.includes('小松菜')) ? (
              <View style={styles.demoTip}>
                <Text style={styles.demoTipText}>{t('camera.analysisResult.demoSpinachTip')}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {step === 2 && activeItem ? (
          <>
            <SectionTitle label={t('camera.analysisResult.sectionEdit')} />
            <Panel style={styles.editCard}>
              <View style={styles.editCardRow}>
                <View style={styles.editPhotoCol}>
                  <FoodThumb
                    imageUrl={detectedItemImageUrl(activeItem, imageUrl)}
                    name={activeItem.name}
                    size={120}
                  />
                  <Text style={styles.editPhotoCaption}>
                    {t('camera.analysisResult.sectionCapture')}
                  </Text>
                </View>
                <View style={styles.editFormCol}>
                  <FieldLabel icon="create-outline" label={t('common.ingredientName')} />
                  <TextInput
                    value={activeItem.name}
                    onChangeText={(text) => updateItem(editIndex, { name: text })}
                    style={styles.nameInput}
                    placeholder={t('common.ingredientName')}
                    placeholderTextColor={colors.inkFaint}
                  />

                  <View style={{ marginTop: 12 }}>
                    <FieldLabel icon="scale-outline" label={t('common.quantity')} />
                  </View>
                  <TextInput
                    value={activeItem.quantity}
                    onChangeText={(text) => updateItem(editIndex, { quantity: text })}
                    style={styles.input}
                    placeholder={t('camera.analysisResult.placeholderQtyExample')}
                    placeholderTextColor={colors.inkFaint}
                  />

                  <View style={{ marginTop: 12 }}>
                    <AttributeField
                      value={activeItem.attribute ?? getDefaultIngredientAttribute()}
                      onChange={(v) => {
                        if (v) updateItem(editIndex, { attribute: v });
                      }}
                    />
                  </View>

                  <View style={styles.aiNote}>
                    <Text style={styles.aiNoteLabel}>{t('camera.analysisResult.aiJudgment')}</Text>
                    <Text style={styles.aiNoteText}>
                      {t('camera.analysisResult.aiJudgmentMeta', {
                        name: aiOriginalLabel(originalItem?.name ?? ''),
                        confidence: confidenceLabel(originalItem?.confidence ?? 'high'),
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {showSpinachFix ? (
                <PrimaryButton
                  label={t('camera.analysisResult.fixToSpinach')}
                  variant="secondary"
                  onPress={() =>
                    updateItem(editIndex, { name: 'ほうれん草', confidence: 'manual' })
                  }
                  style={{ marginTop: 14, marginHorizontal: 16, marginBottom: 14 }}
                />
              ) : null}
            </Panel>

            {items.length > 1 ? (
              <>
                <SectionTitle label={t('camera.analysisResult.sectionEditTarget')} />
                <View style={styles.chipRow}>
                  {items.map((item, index) => (
                    <Chip
                      key={`tab-${index}`}
                      label={displayName(item.name)}
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
                  onPress={addItem}
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
                {t('camera.analysisResult.finalConfirm', { count: items.length })}
              </Text>
            </View>

            <SectionTitle label={t('camera.analysisResult.sectionSave')} />
            <Panel style={styles.panel}>
              {items.map((item, index) => (
                <React.Fragment key={`save-${index}-${item.name}`}>
                  {index > 0 ? <PanelDivider /> : null}
                  <View style={styles.saveRow}>
                    <FoodThumb
                      imageUrl={detectedItemImageUrl(item, imageUrl)}
                      name={item.name}
                      size={52}
                    />
                    <View style={styles.resultBody}>
                      <Text style={styles.resultName} numberOfLines={2} ellipsizeMode="tail">
                        {item.name}
                      </Text>
                      <Text style={styles.resultMeta} numberOfLines={1} ellipsizeMode="tail">
                        {t('camera.analysisResult.confirmedMeta', {
                          quantity: displayQuantity(item.quantity, defaultQty),
                        })}
                        {' · '}
                        {t(`ingredientAttribute.short.${item.attribute}`)}
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
              <Text style={styles.notePanelText}>{t('camera.analysisResult.addedDateNote')}</Text>
            </Panel>

            <Text style={styles.confirmQuestion}>{t('camera.analysisResult.confirmAdd')}</Text>

            <Pressable onPress={() => setStep(2)} style={styles.backEdit}>
              <Text style={styles.backEditText}>{t('camera.analysisResult.backToEdit')}</Text>
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
              label={t('camera.analysisResult.editAllNames')}
              variant="secondary"
              onPress={() =>
                navigation.navigate('ManualEdit', { items, imageUrl })
              }
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
              label={t('camera.analysisResult.saveToFridge')}
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
  resultBody: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  resultName: {
    flexShrink: 1,
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
  demoTip: {
    marginTop: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: colors.radius,
    padding: 12,
  },
  demoTipText: {
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
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
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  aiNote: {
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: colors.radius,
  },
  aiNoteLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkFaint,
    marginBottom: 2,
  },
  aiNoteText: {
    fontSize: 12,
    color: colors.inkMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  addPanel: {
    overflow: 'hidden',
  },
  addBlock: {
    padding: 16,
  },
  saveBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: colors.radius,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  savedCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCheck: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  notePanel: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.surfaceMuted,
  },
  notePanelText: {
    fontSize: 12,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  confirmQuestion: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  backEdit: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  backEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
