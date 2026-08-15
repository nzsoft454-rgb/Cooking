import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CapturePreview,
  FoodThumb,
  Header,
  Panel,
  Screen,
} from '../../components/ui';
import { openTabScreen } from '../../navigation/navigationHelpers';
import type { CameraStackParamList, RootTabParamList } from '../../navigation/types';
import { useApp } from '../../store/AppContext';
import { colors } from '../../theme/colors';
import { pressFeedback } from '../../theme/motion';
import { isLongStored } from '../../utils/addedDate';
import {
  pickFoodImageFromLibrary,
  takeFoodPhotoFromCamera,
} from '../../utils/pickCaptureImage';

type Props = NativeStackScreenProps<CameraStackParamList, 'DashboardHome'>;

type ActionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  onPress: () => void;
  attention?: boolean;
};

function MetricCard({ icon, value, label, onPress, attention }: MetricCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.metricCard,
        attention && styles.metricCardAttention,
        pressed && pressFeedback(true),
      ]}
      accessibilityRole="button"
    >
      <Ionicons
        name={icon}
        size={18}
        color={attention ? colors.danger : colors.primary}
      />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}

function ActionCard({ icon, title, subtitle, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && pressFeedback(true)]}
      accessibilityRole="button"
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
    </Pressable>
  );
}

export function DashboardScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const {
    activeIngredients,
    cookedPhotos,
    recipes,
    remainingGemini,
    user,
  } = useApp();
  const rootNavigation = navigation.getParent<NavigationProp<RootTabParamList>>();
  const [capturing, setCapturing] = useState(false);
  const [pickingFood, setPickingFood] = useState(false);
  const [lastPreview, setLastPreview] = useState<string | null>(null);

  const longStoredCount = useMemo(
    () => activeIngredients.filter((item) => isLongStored(item.addedDate)).length,
    [activeIngredients]
  );
  const recentIngredients = useMemo(
    () =>
      [...activeIngredients]
        .sort((a, b) => b.addedDate.localeCompare(a.addedDate))
        .slice(0, 4),
    [activeIngredients]
  );
  const busy = capturing || pickingFood;

  const openCaptureConfirm = useCallback(
    (imageUrl: string, source: 'camera' | 'foodAlbum') => {
      setLastPreview(imageUrl);
      navigation.navigate('CaptureConfirm', { imageUrl, source });
    },
    [navigation]
  );

  const onCapturePress = useCallback(async () => {
    if (busy) return;
    setCapturing(true);
    try {
      const uri = await takeFoodPhotoFromCamera();
      if (uri) openCaptureConfirm(uri, 'camera');
    } finally {
      setCapturing(false);
    }
  }, [busy, openCaptureConfirm]);

  const onFoodAlbumPress = useCallback(async () => {
    if (busy) return;
    setPickingFood(true);
    try {
      const uri = await pickFoodImageFromLibrary();
      if (uri) openCaptureConfirm(uri, 'foodAlbum');
    } finally {
      setPickingFood(false);
    }
  }, [busy, openCaptureConfirm]);

  const openCatalogPick = useCallback(() => {
    if (!rootNavigation) return;
    openTabScreen(rootNavigation, 'FridgeTab', 'CatalogPick');
  }, [rootNavigation]);

  const openFridge = useCallback(
    (params?: { sortKey?: 'addedAsc' }) => {
      if (!rootNavigation) return;
      openTabScreen(rootNavigation, 'FridgeTab', 'FridgeHome', params);
    },
    [rootNavigation]
  );

  const openRecipes = useCallback(
    (initialTab: 'all' | 'fav' | 'collection' = 'all') => {
      if (!rootNavigation) return;
      openTabScreen(rootNavigation, 'RecipeTab', 'RecipeHome', { initialTab });
    },
    [rootNavigation]
  );

  const openIngredient = useCallback(
    (ingredientId: string) => {
      if (!rootNavigation) return;
      openTabScreen(rootNavigation, 'FridgeTab', 'IngredientEdit', { ingredientId });
    },
    [rootNavigation]
  );

  return (
    <Screen edges={['top']}>
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        right={
          <View style={styles.geminiBadge}>
            <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
            <Text style={styles.geminiBadgeText}>
              {user.isPremium
                ? t('common.geminiRemainingInfinity')
                : t('common.geminiRemaining', { count: remainingGemini })}
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Panel style={styles.captureCard}>
          <View style={styles.captureAccent} />
          <View style={styles.captureTop}>
            <View style={styles.captureCopy}>
              <Text style={styles.eyebrow}>{t('dashboard.captureEyebrow')}</Text>
              <Text style={styles.captureTitle}>{t('dashboard.captureTitle')}</Text>
              <Text style={styles.captureSubtitle}>{t('dashboard.captureSubtitle')}</Text>
            </View>
            <View style={styles.cameraOrb}>
              <Ionicons name="camera-outline" size={30} color={colors.primary} />
            </View>
          </View>

          {lastPreview ? (
            <View style={styles.preview}>
              <CapturePreview imageUrl={lastPreview} height={132} />
            </View>
          ) : null}

          <View style={styles.captureActions}>
            <Pressable
              onPress={onCapturePress}
              disabled={busy}
              style={({ pressed }) => [
                styles.captureButton,
                styles.captureButtonPrimary,
                pressed && pressFeedback(true),
                busy && styles.disabled,
              ]}
              accessibilityRole="button"
            >
              {capturing ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="camera" size={18} color={colors.surface} />
              )}
              <Text style={styles.captureButtonPrimaryText}>
                {capturing ? t('camera.home.openingCamera') : t('dashboard.openCamera')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onFoodAlbumPress}
              disabled={busy}
              style={({ pressed }) => [
                styles.captureButton,
                styles.captureButtonSecondary,
                pressed && pressFeedback(true),
                busy && styles.disabled,
              ]}
              accessibilityRole="button"
            >
              {pickingFood ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="images-outline" size={18} color={colors.primary} />
              )}
              <Text style={styles.captureButtonSecondaryText}>
                {t('dashboard.openAlbum')}
              </Text>
            </Pressable>
          </View>
        </Panel>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.overviewTitle')}</Text>
          <Text style={styles.sectionMeta}>{t('dashboard.overviewMeta')}</Text>
        </View>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="grid-outline"
            value={activeIngredients.length}
            label={t('dashboard.ingredients')}
            onPress={() => openFridge()}
          />
          <MetricCard
            icon="restaurant-outline"
            value={recipes.length}
            label={t('dashboard.recipes')}
            onPress={() => openRecipes('all')}
          />
          <MetricCard
            icon="images-outline"
            value={cookedPhotos.length}
            label={t('dashboard.cookedPhotos')}
            onPress={() => openRecipes('collection')}
          />
          <MetricCard
            icon="time-outline"
            value={longStoredCount}
            label={t('dashboard.longStored')}
            attention={longStoredCount > 0}
            onPress={() => openFridge({ sortKey: 'addedAsc' })}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActionsTitle')}</Text>
        </View>
        <Panel style={styles.actionsPanel}>
          {activeIngredients.length === 0 ? (
            <>
              <ActionCard
                icon="nutrition-outline"
                title={t('fridge.catalogPick.ctaTitle')}
                subtitle={t('fridge.catalogPick.ctaSub')}
                onPress={openCatalogPick}
              />
              <View style={styles.divider} />
            </>
          ) : null}
          <ActionCard
            icon="grid-outline"
            title={t('dashboard.openFridge')}
            subtitle={t('dashboard.openFridgeSub')}
            onPress={() => openFridge()}
          />
          <View style={styles.divider} />
          <ActionCard
            icon="restaurant-outline"
            title={t('dashboard.openRecipes')}
            subtitle={t('dashboard.openRecipesSub')}
            onPress={() => openRecipes('all')}
          />
        </Panel>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentIngredientsTitle')}</Text>
          {activeIngredients.length > 0 ? (
            <Pressable onPress={() => openFridge()} hitSlop={8}>
              <Text style={styles.seeAll}>{t('dashboard.seeAll')}</Text>
            </Pressable>
          ) : null}
        </View>
        <Panel style={styles.recentPanel}>
          {recentIngredients.length > 0 ? (
            recentIngredients.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.ingredientRow,
                    pressed && pressFeedback(true),
                  ]}
                  onPress={() => openIngredient(item.id)}
                >
                  <FoodThumb imageUrl={item.imageUrl} name={item.name} size={42} />
                  <View style={styles.ingredientCopy}>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                    <Text style={styles.ingredientMeta}>
                      {t(`ingredientAttribute.short.${item.attribute}`)}
                      {` · ${t('dashboard.remaining', {
                        percent: Math.round(item.quantity * 100),
                      })}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
                </Pressable>
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyRecent}>
              <Ionicons name="basket-outline" size={28} color={colors.inkFaint} />
              <Text style={styles.emptyRecentText}>{t('dashboard.noIngredients')}</Text>
              <Pressable
                onPress={openCatalogPick}
                style={({ pressed }) => [
                  styles.emptyCta,
                  pressed && pressFeedback(true),
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.emptyCtaText}>{t('fridge.catalogPick.cta')}</Text>
              </Pressable>
            </View>
          )}
        </Panel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  geminiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  geminiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  captureCard: {
    overflow: 'hidden',
    padding: 18,
    paddingLeft: 20,
  },
  captureAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  captureTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  captureCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  captureTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.ink,
  },
  captureSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.inkMuted,
  },
  cameraOrb: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: {
    marginTop: 14,
    borderRadius: colors.radius,
    overflow: 'hidden',
  },
  captureActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  captureButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: colors.radius,
    borderWidth: 1,
  },
  captureButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  captureButtonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  captureButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
  },
  captureButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
  sectionHeader: {
    minHeight: 28,
    marginTop: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkFaint,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '47%',
    flexGrow: 1,
    minHeight: 92,
    padding: 13,
    borderRadius: colors.radius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  metricCardAttention: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  metricLabel: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  actionsPanel: {
    overflow: 'hidden',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: colors.radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  actionSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.inkFaint,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
    backgroundColor: colors.border,
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  recentPanel: {
    overflow: 'hidden',
  },
  ingredientRow: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  ingredientCopy: {
    flex: 1,
    gap: 2,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  ingredientMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.inkFaint,
  },
  emptyRecent: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
  },
  emptyRecentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: colors.radius,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emptyCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
