import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CookedPhotoImage } from '../../components/CookedPhotoImage';
import { HeaderSegmentTabs, HeaderStack, FadeInView, Screen } from '../../components/ui';
import { RecipeStackParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import type { Recipe } from '../../types';
import type { AppLanguage } from '../../i18n';
import { formatLocaleDate } from '../../utils/localeFormat';

type Props = NativeStackScreenProps<RecipeStackParamList, 'RecipeHome'>;

type HomeTab = 'all' | 'fav' | 'collection';

function RecipeHistoryCard({
  recipe,
  onOpenRecipe,
  onOpenPhoto,
}: {
  recipe: Recipe;
  onOpenRecipe: () => void;
  onOpenPhoto: (photoId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as AppLanguage;
  const { photosForRecipe } = useApp();
  const photos = photosForRecipe(recipe.id);
  const latest = photos[0];

  return (
    <View style={styles.card}>
      {latest ? (
        <View style={styles.photoSection}>
          <Pressable onPress={() => onOpenPhoto(latest.id)}>
            <CookedPhotoImage uri={latest.imageUri} style={styles.cardHeroPhoto} />
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>
                {photos.length > 1
                  ? t('recipe.home.cookedBadgeWithCount', { count: photos.length })
                  : t('recipe.home.cookedBadge')}
              </Text>
            </View>
          </Pressable>
          {photos.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {photos.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => onOpenPhoto(photo.id)}
                  style={styles.photoStripItem}
                >
                  <CookedPhotoImage uri={photo.imageUri} style={styles.photoStripThumb} />
                  <Text style={styles.photoStripDate}>
                    {formatLocaleDate(photo.createdAt, lang, {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.photoDateSingle}>
              {t('recipe.home.photoTaken', {
                date: formatLocaleDate(latest.createdAt, lang, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
              })}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.noPhotoBox}>
          <Text style={styles.noPhotoText}>{t('recipe.home.noPhotoHint')}</Text>
        </View>
      )}

      <Pressable style={styles.cardBody} onPress={onOpenRecipe}>
        <View style={styles.cardTop}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.isFavorite ? <Text style={styles.star}>{t('common.favoriteStar')}</Text> : null}
        </View>
        <Text style={styles.meta}>
          {t('recipe.home.meta', {
            genre: recipe.genre,
            difficulty: recipe.difficulty,
            minutes: recipe.cookingTime,
            servings: recipe.servings,
          })}
        </Text>
        <Text style={styles.source} numberOfLines={1}>
          {t('recipe.home.sourceIngredients', {
            names: recipe.sourceIngredients.join(', '),
          })}
        </Text>
      </Pressable>
    </View>
  );
}

export function RecipeHomeScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as AppLanguage;
  const { recipes, cookedPhotos } = useApp();
  const [tab, setTab] = useState<HomeTab>(route.params?.initialTab ?? 'all');

  useEffect(() => {
    if (route.params?.initialTab) {
      setTab(route.params.initialTab);
    }
  }, [route.params, route.params?.initialTab]);

  const list = useMemo(() => {
    if (tab === 'fav') return recipes.filter((r) => r.isFavorite);
    return recipes;
  }, [recipes, tab]);

  const openPhoto = (photoId: string) => {
    navigation.navigate('CookedPhotoDetail', { photoId });
  };

  const tabs: { key: HomeTab; label: string }[] = [
    { key: 'all', label: t('recipe.home.tabHistory') },
    { key: 'fav', label: t('recipe.home.tabFavorite') },
    { key: 'collection', label: t('recipe.home.tabCollection') },
  ];

  return (
    <Screen edges={['top']}>
      <HeaderStack
        title={t('recipe.home.title')}
        subHeader={
          <HeaderSegmentTabs items={tabs} value={tab} onChange={setTab} />
        }
      />

      <FadeInView contentKey={tab} style={styles.list}>
        {tab === 'collection' ? (
          <FlatList
            key="flatlist-collection"
            style={styles.list}
            data={cookedPhotos}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.photoRow}
            contentContainerStyle={styles.collectionGrid}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('recipe.home.emptyCollection')}</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.photoCard}
                onPress={() => openPhoto(item.id)}
              >
                <CookedPhotoImage uri={item.imageUri} style={styles.photoImage} />
                <Text style={styles.photoTitle} numberOfLines={2}>
                  {item.recipeTitle}
                </Text>
                <Text style={styles.photoDate}>
                  {formatLocaleDate(item.createdAt, lang)}
                </Text>
              </Pressable>
            )}
          />
        ) : (
          <FlatList
            key="flatlist-history"
            style={styles.list}
            data={list}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyGrid}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('recipe.home.emptyHistory')}</Text>
            }
            renderItem={({ item }) => (
              <RecipeHistoryCard
                recipe={item}
                onOpenRecipe={() =>
                  navigation.navigate('RecipeDetail', { recipeId: item.id })
                }
                onOpenPhoto={openPhoto}
              />
            )}
          />
        )}
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  historyGrid: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  photoSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeroPhoto: {
    width: '100%',
    height: 148,
  },
  photoBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(26, 34, 40, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: colors.radius,
  },
  photoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  photoDateSingle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    color: colors.inkFaint,
    backgroundColor: colors.surfaceMuted,
  },
  photoStrip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  photoStripItem: {
    alignItems: 'center',
    width: 72,
  },
  photoStripThumb: {
    width: 72,
    height: 72,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoStripDate: {
    marginTop: 4,
    fontSize: 10,
    color: colors.inkFaint,
  },
  noPhotoBox: {
    height: 72,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  noPhotoText: {
    fontSize: 12,
    color: colors.inkFaint,
    textAlign: 'center',
  },
  cardBody: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  star: {
    color: colors.primary,
    fontSize: 18,
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: colors.inkMuted,
  },
  source: {
    marginTop: 4,
    fontSize: 12,
    color: colors.inkFaint,
  },
  collectionGrid: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  photoRow: {
    gap: 12,
  },
  photoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 8,
    maxWidth: '48%',
  },
  photoImage: {
    width: '100%',
    height: 120,
    borderRadius: colors.radius,
  },
  photoTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  photoDate: {
    marginTop: 4,
    fontSize: 11,
    color: colors.inkFaint,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.inkMuted,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
});
