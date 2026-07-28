import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CookedPhotoImage } from '../../components/CookedPhotoImage';
import { CookedPhotoShareCard } from '../../components/CookedPhotoShareCard';
import {
  ConfirmDialog,
  FooterBar,
  FooterPrimaryButton,
  Header,
  HeroCard,
  Panel,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '../../components/ui';
import { useCookedPhotoShareCapture } from '../../hooks/useCookedPhotoShareCapture';
import { RecipeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { formatLocaleDateTime } from '../../utils/localeFormat';
import { buildCookedPhotoShareMessage, shareCookedPhoto } from '../../utils/shareCookedPhoto';

type Props = NativeStackScreenProps<RecipeStackParamList, 'CookedPhotoDetail'>;

export function CookedPhotoDetailScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const { cookedPhotos, removeCookedPhoto } = useApp();
  const [sharing, setSharing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const photo = useMemo(
    () => cookedPhotos.find((p) => p.id === route.params.photoId),
    [cookedPhotos, route.params.photoId]
  );
  const shareMessage = photo ? buildCookedPhotoShareMessage(photo.recipeTitle) : '';
  const { shareCardRef, needsComposite, markShareCardReady, captureShareCard } =
    useCookedPhotoShareCapture(photo?.imageUri ?? '');

  const onShare = async () => {
    if (!photo) return;
    setSharing(true);
    try {
      const compositeUri = needsComposite ? await captureShareCard() : null;
      await shareCookedPhoto(photo, { compositeUri });
    } finally {
      setSharing(false);
    }
  };

  if (!photo) {
    return (
      <Screen>
        <Header title={t('recipe.cookedPhotoDetail.notFound')} onBack={() => navigation.goBack()} />
        <PrimaryButton label={t('common.back')} onPress={() => navigation.goBack()} style={{ margin: 20 }} />
      </Screen>
    );
  }

  const dateLabel = formatLocaleDateTime(photo.createdAt, i18n.language as 'ja' | 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Screen edges={['top']}>
      <Header
        title={t('recipe.cookedPhotoDetail.title')}
        subtitle={dateLabel}
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={() => setDeleteOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
          >
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <SectionTitle label={t('recipe.cookedPhotoDetail.sectionPhoto')} />
        <Panel style={styles.photoPanel}>
          <CookedPhotoImage uri={photo.imageUri} style={styles.photo} />
        </Panel>

        <HeroCard style={styles.heroCard}>
          <View style={styles.heroInner}>
            <Text style={styles.heroEyebrow}>{t('recipe.cookedPhotoDetail.collectionEyebrow')}</Text>
            <Text style={styles.title}>{photo.recipeTitle}</Text>
            <Text style={styles.caption}>{t('recipe.cookedPhotoDetail.caption')}</Text>
          </View>
        </HeroCard>
      </ScrollView>

      <FooterBar>
        <FooterPrimaryButton
          label={
            sharing ? t('recipe.cookedPhotoDetail.sharing') : t('recipe.cookedPhotoDetail.shareSns')
          }
          onPress={onShare}
          disabled={sharing}
        />
        <FooterPrimaryButton
          label={t('recipe.cookedPhotoDetail.viewRecipe')}
          variant="secondary"
          onPress={() => navigation.replace('RecipeDetail', { recipeId: photo.recipeId })}
        />
      </FooterBar>

      {needsComposite ? (
        <View style={styles.shareCardHost} pointerEvents="none">
          <CookedPhotoShareCard
            ref={shareCardRef}
            imageUri={photo.imageUri}
            message={shareMessage}
            onImageLoad={markShareCardReady}
          />
        </View>
      ) : null}

      <ConfirmDialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('common.deleteTitle')}
        body={t('recipe.cookedPhotoDetail.deleteMessage')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        onConfirm={() => {
          removeCookedPhoto(photo.id);
          setDeleteOpen(false);
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 20,
    paddingBottom: 16,
  },
  photoPanel: {
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 280,
  },
  heroCard: {
    marginTop: 16,
    overflow: 'hidden',
  },
  heroInner: {
    padding: 16,
    paddingLeft: 20,
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  caption: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  shareCardHost: {
    position: 'absolute',
    left: -9999,
    top: 0,
    opacity: 0,
  },
});
