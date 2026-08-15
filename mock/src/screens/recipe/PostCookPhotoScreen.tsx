import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CookedPhotoImage } from '../../components/CookedPhotoImage';
import {
  FooterBar,
  FooterPrimaryButton,
  Header,
  HeroCard,
  Panel,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../../components/ui';

import { RecipeStackParamList } from '../../navigation/types';

import { useApp } from '../../store/AppContext';

import { colors } from '../../theme/colors';

import {

  DEMO_COOKED_IMAGE,

  pickCookedPhotoFromLibrary,

  takeCookedPhoto,

} from '../../utils/cookedPhoto';



type Props = NativeStackScreenProps<RecipeStackParamList, 'PostCookPhoto'>;



export function PostCookPhotoScreen({ navigation, route }: Props) {

  const { t } = useTranslation();

  const { addCookedPhoto } = useApp();

  const { recipeId, recipeTitle } = route.params;

  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const [savedVisible, setSavedVisible] = useState(false);



  const capture = async (mode: 'camera' | 'library' | 'demo') => {

    setBusy(true);

    try {

      let uri: string | null = null;

      if (mode === 'demo') uri = DEMO_COOKED_IMAGE;

      else if (mode === 'camera') uri = await takeCookedPhoto();

      else uri = await pickCookedPhotoFromLibrary();

      if (uri) setPreviewUri(uri);

    } finally {

      setBusy(false);

    }

  };



  const saveAndFinish = () => {

    if (!previewUri) {

      Alert.alert(

        t('recipe.postCookPhoto.noPhotoTitle'),

        t('recipe.postCookPhoto.noPhotoMessage')

      );

      return;

    }

    addCookedPhoto({

      recipeId,

      recipeTitle,

      imageUri: previewUri,

    });

    setSavedVisible(true);

  };



  const goToRecipe = () => {

    setSavedVisible(false);

    navigation.reset({

      index: 1,

      routes: [

        { name: 'RecipeHome' },

        { name: 'RecipeDetail', params: { recipeId } },

      ],

    });

  };



  const goToCollection = () => {

    setSavedVisible(false);

    navigation.reset({

      index: 0,

      routes: [{ name: 'RecipeHome', params: { initialTab: 'collection' } }],

    });

  };



  const skip = () => {

    navigation.reset({

      index: 0,

      routes: [{ name: 'RecipeHome' }],

    });

  };



  return (

    <Screen edges={['top']}>

      <Header

        title={t('recipe.postCookPhoto.title')}

        subtitle={t('recipe.postCookPhoto.subtitle')}

        onBack={() =>
          navigation.reset({
            index: 1,
            routes: [
              { name: 'RecipeHome' },
              { name: 'RecipeDetail', params: { recipeId } },
            ],
          })
        }

      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <HeroCard style={styles.heroCard}>

          <View style={styles.heroInner}>

            <Text style={styles.heroEyebrow}>{t('recipe.postCookPhoto.cookedEyebrow')}</Text>

            <Text style={styles.recipeTitle}>{recipeTitle}</Text>

            <Text style={styles.lead}>{t('recipe.postCookPhoto.lead')}</Text>

          </View>

        </HeroCard>



        <SectionTitle label={t('recipe.postCookPhoto.sectionPreview')} />

        <Panel style={styles.previewBox}>

          {previewUri ? (

            <CookedPhotoImage uri={previewUri} style={styles.preview} />

          ) : (

            <View style={styles.previewPlaceholder}>

              <Text style={styles.placeholderText}>

                {t('recipe.postCookPhoto.previewPlaceholder')}

              </Text>

            </View>

          )}

        </Panel>



        <SectionTitle label={t('recipe.postCookPhoto.sectionCaptureMethod')} />

        <Panel style={styles.actionPanel}>

          <View style={styles.actionBlock}>

            <PrimaryButton

              label={busy ? t('common.processing') : t('recipe.postCookPhoto.captureCamera')}

              onPress={() => capture('camera')}

              disabled={busy}

            />

            <PrimaryButton

              label={t('recipe.postCookPhoto.captureLibrary')}

              variant="secondary"

              onPress={() => capture('library')}

              disabled={busy}

              style={{ marginTop: 10 }}

            />

            {Platform.OS === 'web' ? (

              <PrimaryButton

                label={t('recipe.postCookPhoto.captureDemoWeb')}

                variant="ghost"

                onPress={() => capture('demo')}

                disabled={busy}

                style={{ marginTop: 10 }}

              />

            ) : null}

          </View>

        </Panel>

      </ScrollView>



      <FooterBar>

        <FooterPrimaryButton

          label={t('common.skip')}

          variant="ghost"

          onPress={skip}

        />

        <FooterPrimaryButton

          label={t('recipe.postCookPhoto.saveToCollection')}

          onPress={saveAndFinish}

          disabled={!previewUri || busy}

        />

      </FooterBar>



      <ConfirmDialog

        visible={savedVisible}

        onClose={() => setSavedVisible(false)}

        title={t('common.savedTitle')}

        body={t('recipe.postCookPhoto.savedMessage')}

        cancelLabel={t('recipe.postCookPhoto.viewCollection')}

        confirmLabel={t('recipe.postCookPhoto.backToRecipe')}

        onCancel={goToCollection}

        onConfirm={goToRecipe}

      />

    </Screen>

  );

}



const styles = StyleSheet.create({

  body: {

    paddingHorizontal: 20,

    paddingBottom: 24,

  },

  heroCard: {

    overflow: 'hidden',

  },

  heroInner: {

    padding: 16,

    paddingLeft: 20,

    gap: 6,

  },

  heroEyebrow: {

    fontSize: 10,

    fontWeight: '700',

    letterSpacing: 1.2,

    color: colors.primary,

  },

  recipeTitle: {

    fontSize: 17,

    fontWeight: '700',

    color: colors.ink,

  },

  lead: {

    fontSize: 13,

    color: colors.inkMuted,

    lineHeight: 20,

  },

  previewBox: {

    overflow: 'hidden',

  },

  preview: {

    width: '100%',

    height: 240,

  },

  previewPlaceholder: {

    height: 240,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: colors.surfaceMuted,

  },

  placeholderText: {

    color: colors.inkFaint,

    fontWeight: '600',

    fontSize: 13,

  },

  actionPanel: {

    overflow: 'hidden',

  },

  actionBlock: {

    padding: 16,

  },

});


