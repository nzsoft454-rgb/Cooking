import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  CapturePreview,
  FieldLabel,
  FooterBar,
  FooterPrimaryButton,
  Header,
  HeroCard,
  Panel,
  PanelDivider,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../../components/ui';
import { CameraStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import type { DetectedItem } from '../../types';
import { guessIngredientAttribute } from '../../utils/ingredientAttribute';

type Props = NativeStackScreenProps<CameraStackParamList, 'ManualEdit'>;

export function ManualEditScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { imageUrl } = route.params;
  const defaultQty = t('common.defaultQuantity');
  const [items, setItems] = useState<DetectedItem[]>(
    route.params.items.map((i) => ({
      ...i,
      attribute: i.attribute ?? guessIngredientAttribute(i.name),
    }))
  );
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(defaultQty);

  const updateName = (index: number, name: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, name, attribute: guessIngredientAttribute(name) }
          : item
      )
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
  };

  const apply = () => {
    navigation.navigate('AnalysisResult', { items, imageUrl });
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('camera.manualEdit.title')}
        subtitle={t('camera.manualEdit.subtitle')}
        onBack={() => navigation.goBack()}
      />

      <HeroCard style={styles.heroCard}>
        <View style={styles.heroInner}>
          <FieldLabel icon="camera-outline" label={t('common.captureImage')} />
          <CapturePreview imageUrl={imageUrl} height={160} />
        </View>
      </HeroCard>

      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle label={t('camera.manualEdit.sectionDetected')} />
        <Panel style={styles.panel}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <PanelDivider /> : null}
              <View style={styles.block}>
                <FieldLabel
                  icon="leaf-outline"
                  label={t('camera.manualEdit.ingredientIndex', { index: index + 1 })}
                />
                <TextInput
                  value={item.name}
                  onChangeText={(text) => updateName(index, text)}
                  style={styles.input}
                  placeholder={t('common.ingredientName')}
                  placeholderTextColor={colors.inkFaint}
                />
                {item.name.includes('小松菜') ? (
                  <PrimaryButton
                    label={t('camera.analysisResult.fixToSpinach')}
                    variant="secondary"
                    onPress={() => updateName(index, 'ほうれん草')}
                    style={{ marginTop: 8 }}
                  />
                ) : null}
              </View>
            </React.Fragment>
          ))}
        </Panel>

        <SectionTitle label={t('camera.manualEdit.sectionManualAdd')} />
        <Panel style={styles.panel}>
          <View style={styles.block}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              style={styles.input}
              placeholder={t('camera.manualEdit.placeholderButter')}
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
              label={t('common.add')}
              variant="ghost"
              onPress={addItem}
              style={{ marginTop: 8 }}
            />
          </View>
        </Panel>
      </ScrollView>

      <FooterBar>
        <FooterPrimaryButton
          label={t('camera.manualEdit.applyToResult')}
          onPress={apply}
        />
      </FooterBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 20,
    marginTop: 12,
    overflow: 'hidden',
  },
  heroInner: {
    padding: 16,
    paddingLeft: 20,
    gap: 10,
  },
  listScroll: {
    flex: 1,
  },
  listBody: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  panel: {
    overflow: 'hidden',
  },
  block: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
  },
});
