import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { Panel, PanelDivider, SectionTitle } from '../../components/ui';
import { SettingsRow } from '../../components/layout/ListRows';
import { CAPTURE_IMAGE_KEY, RECEIPT_IMAGE_KEY } from '../../data/images';
import { DEFAULT_CONDITIONS, DUMMY_DETECTED } from '../../data/dummy';
import { MOCK_RECEIPT_LINES } from '../../data/receiptMock';
import { SettingsStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { SettingsSubScreenLayout, settingsStyles } from './SettingsSubScreenLayout';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ScreenGallery'>;

type GalleryGroup = {
  title: string;
  items: {
    id: string;
    label: string;
    hint?: string;
    onPress: () => void;
  }[];
};

export function ScreenGalleryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { ingredients, recipes, cookedPhotos } = useApp();

  const activeIngredients = useMemo(
    () => ingredients.filter((item) => !item.isDeleted),
    [ingredients]
  );
  const gachaPool = useMemo(
    () => activeIngredients.filter((item) => item.attribute !== 'other'),
    [activeIngredients]
  );
  const firstIngredient = activeIngredients[0];
  const secondIngredient = activeIngredients[1];
  const firstRecipe = recipes[0];
  const firstPhoto = cookedPhotos[0];

  const ingredientIds = activeIngredients.slice(0, 2).map((item) => item.id);
  const ingredientNames = activeIngredients.slice(0, 2).map((item) => item.name);
  const gachaIngredientIds = gachaPool.slice(0, 2).map((item) => item.id);
  const gachaIngredientNames = gachaPool.slice(0, 2).map((item) => item.name);

  const go = (tab: string, screen: string, params?: object) => {
    navigation.getParent()?.navigate(tab, { screen, params });
  };

  const groups: GalleryGroup[] = [
    {
      title: t('settings.screenGallery.sectionCamera'),
      items: [
        {
          id: 'A-001',
          label: t('settings.screenGallery.cameraHome'),
          onPress: () => go('CameraTab', 'CameraHome'),
        },
        {
          id: 'A-001-a',
          label: t('settings.screenGallery.captureConfirm'),
          onPress: () =>
            go('CameraTab', 'CaptureConfirm', {
              imageUrl: CAPTURE_IMAGE_KEY,
              source: 'camera',
            }),
        },
        {
          id: 'A-001-b',
          label: t('settings.screenGallery.analyzing'),
          onPress: () =>
            go('CameraTab', 'Analyzing', {
              imageUrl: CAPTURE_IMAGE_KEY,
              mode: 'food',
            }),
        },
        {
          id: 'A-001-c',
          label: t('settings.screenGallery.analysisResult'),
          onPress: () =>
            go('CameraTab', 'AnalysisResult', {
              items: DUMMY_DETECTED,
              imageUrl: CAPTURE_IMAGE_KEY,
            }),
        },
        {
          id: 'A-001-d',
          label: t('settings.screenGallery.manualEdit'),
          onPress: () =>
            go('CameraTab', 'ManualEdit', {
              items: DUMMY_DETECTED,
              imageUrl: CAPTURE_IMAGE_KEY,
            }),
        },
        {
          id: 'R-001-c',
          label: t('settings.screenGallery.receiptResult'),
          onPress: () =>
            go('CameraTab', 'ReceiptResult', {
              items: MOCK_RECEIPT_LINES.map((rawName) => ({
                rawName,
                quantity: '1',
              })),
              imageUrl: RECEIPT_IMAGE_KEY,
            }),
        },
        {
          id: 'A-001-e',
          label: t('settings.screenGallery.cookingConfirm'),
          hint: t('settings.screenGallery.needsIngredients'),
          onPress: () => {
            if (ingredientIds.length < 1) return;
            go('CameraTab', 'CookingConfirm', { ingredientIds, ingredientNames });
          },
        },
      ],
    },
    {
      title: t('settings.screenGallery.sectionFridge'),
      items: [
        {
          id: 'B-001',
          label: t('settings.screenGallery.fridgeHome'),
          onPress: () => go('FridgeTab', 'FridgeHome'),
        },
        {
          id: 'B-001-search',
          label: t('settings.screenGallery.fridgeSearch'),
          onPress: () =>
            go('FridgeTab', 'FridgeSearch', {
              query: firstIngredient?.name ?? '玉ねぎ',
              sortKey: 'addedDescFreshFirst',
            }),
        },
        {
          id: 'B-001-a',
          label: t('settings.screenGallery.ingredientEdit'),
          hint: t('settings.screenGallery.needsOneIngredient'),
          onPress: () => {
            if (!firstIngredient) return;
            go('FridgeTab', 'IngredientEdit', { ingredientId: firstIngredient.id });
          },
        },
        {
          id: 'B-001-batch',
          label: t('settings.screenGallery.ingredientBatchEdit'),
          hint: t('settings.screenGallery.needsTwoIngredients'),
          onPress: () => {
            if (!firstIngredient || !secondIngredient) return;
            go('FridgeTab', 'IngredientBatchEdit', {
              ingredientIds: [firstIngredient.id, secondIngredient.id],
            });
          },
        },
        {
          id: 'B-001-cook',
          label: t('settings.screenGallery.fridgeCookingConfirm'),
          hint: t('settings.screenGallery.needsIngredients'),
          onPress: () => {
            if (ingredientIds.length < 1) return;
            go('FridgeTab', 'CookingConfirm', { ingredientIds, ingredientNames });
          },
        },
      ],
    },
    {
      title: t('settings.screenGallery.sectionRecipe'),
      items: [
        {
          id: 'C-001',
          label: t('settings.screenGallery.recipeHome'),
          onPress: () => go('RecipeTab', 'RecipeHome'),
        },
        {
          id: 'C-001-a',
          label: t('settings.screenGallery.recipeGenerating'),
          hint: t('settings.screenGallery.needsIngredients'),
          onPress: () => {
            if (ingredientIds.length < 1) return;
            go('RecipeTab', 'RecipeGenerating', {
              ingredientIds,
              ingredientNames,
              conditions: DEFAULT_CONDITIONS,
              generationKey: Date.now(),
            });
          },
        },
        {
          id: 'C-001-gacha',
          label: t('settings.screenGallery.recipeGeneratingGacha'),
          hint: t('settings.screenGallery.needsGachaIngredients'),
          onPress: () => {
            if (gachaIngredientIds.length < 2) return;
            go('RecipeTab', 'RecipeGenerating', {
              ingredientIds: gachaIngredientIds,
              ingredientNames: gachaIngredientNames,
              conditions: DEFAULT_CONDITIONS,
              mode: 'gacha',
              generationKey: Date.now(),
            });
          },
        },
        {
          id: 'C-001-b',
          label: t('settings.screenGallery.recipeDetail'),
          hint: t('settings.screenGallery.needsRecipe'),
          onPress: () => {
            if (!firstRecipe) return;
            go('RecipeTab', 'RecipeDetail', {
              recipeId: firstRecipe.id,
              ingredientIds,
            });
          },
        },
        {
          id: 'C-001-consume',
          label: t('settings.screenGallery.postCookConsume'),
          hint: t('settings.screenGallery.needsRecipe'),
          onPress: () => {
            if (!firstRecipe) return;
            go('RecipeTab', 'PostCookConsume', {
              recipeId: firstRecipe.id,
              recipeTitle: firstRecipe.title,
              ingredientIds,
            });
          },
        },
        {
          id: 'C-001-photo',
          label: t('settings.screenGallery.postCookPhoto'),
          hint: t('settings.screenGallery.needsRecipe'),
          onPress: () => {
            if (!firstRecipe) return;
            go('RecipeTab', 'PostCookPhoto', {
              recipeId: firstRecipe.id,
              recipeTitle: firstRecipe.title,
            });
          },
        },
        {
          id: 'C-001-photo-detail',
          label: t('settings.screenGallery.cookedPhotoDetail'),
          hint: t('settings.screenGallery.needsPhoto'),
          onPress: () => {
            if (!firstPhoto) return;
            go('RecipeTab', 'CookedPhotoDetail', { photoId: firstPhoto.id });
          },
        },
      ],
    },
    {
      title: t('settings.screenGallery.sectionSettings'),
      items: [
        {
          id: 'D-001',
          label: t('settings.screenGallery.settingsHome'),
          onPress: () => go('SettingsTab', 'SettingsHome'),
        },
        {
          id: 'D-001-a',
          label: t('settings.home.legal'),
          onPress: () => navigation.navigate('Legal'),
        },
        {
          id: 'D-001-b',
          label: t('settings.home.language'),
          onPress: () => navigation.navigate('Language'),
        },
        {
          id: 'D-001-c',
          label: t('settings.home.profile'),
          onPress: () => navigation.navigate('Profile'),
        },
        {
          id: 'D-001-d',
          label: t('settings.home.help'),
          onPress: () => navigation.navigate('Help'),
        },
        {
          id: 'D-001-e',
          label: t('settings.home.premium'),
          onPress: () => navigation.navigate('Premium'),
        },
        {
          id: 'D-001-f',
          label: t('settings.home.notifications'),
          onPress: () => navigation.navigate('Notifications'),
        },
        {
          id: 'login',
          label: t('settings.home.login'),
          onPress: () => navigation.navigate('Login'),
        },
      ],
    },
  ];

  return (
    <SettingsSubScreenLayout
      title={t('settings.screenGallery.title')}
      subtitle={t('settings.screenGallery.subtitle')}
      onBack={() => navigation.goBack()}
    >
      <Text style={settingsStyles.note}>{t('settings.screenGallery.intro')}</Text>

      {groups.map((group) => (
        <React.Fragment key={group.title}>
          <SectionTitle label={group.title} />
          <Panel style={settingsStyles.panel}>
            {group.items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 ? <PanelDivider /> : null}
                <SettingsRow
                  label={item.label}
                  meta={item.hint ? `${item.id} · ${item.hint}` : item.id}
                  onPress={item.onPress}
                />
              </React.Fragment>
            ))}
          </Panel>
        </React.Fragment>
      ))}

      <SectionTitle label={t('settings.screenGallery.sectionModals')} />
      <Panel style={settingsStyles.panel}>
        <Text style={settingsStyles.p}>{t('settings.screenGallery.modalFridgeSort')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.screenGallery.modalFridgeGacha')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.screenGallery.modalFridgeDelete')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.screenGallery.modalCameraAd')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.screenGallery.modalRecipeMemo')}</Text>
        <PanelDivider />
        <Text style={settingsStyles.p}>{t('settings.screenGallery.modalSettingsReset')}</Text>
      </Panel>
    </SettingsSubScreenLayout>
  );
}
