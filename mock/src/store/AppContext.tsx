import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  DEMO_SEED_VERSION,
  DEMO_USER_ID,
  INITIAL_USER,
  SEED_COOKED_PHOTOS,
  SEED_INGREDIENTS,
  SEED_RECIPES,
} from '../data/dummy';
import type {
  CookedDishPhoto,
  Ingredient,
  PremiumPlanId,
  Recipe,
  ShoppingItem,
  UserProfile,
} from '../types';
import { getDeviceLanguage, type AppLanguage } from '../i18n';
import { localTodayKey } from '../utils/dateKey';
import { resetFridgeCardEnterAnimation } from '../utils/fridgeCardAnimation';
import {
  computePremiumExpiry,
  normalizeUserProfile,
  withPremiumExpiryCheck,
} from '../utils/premiumPlan';
import {
  attributeFromLegacyStorageType,
  guessIngredientAttribute,
  normalizeIngredientAttribute,
} from '../utils/ingredientAttribute';

export type NewIngredientInput = Omit<
  Ingredient,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'addedDate'
> & { addedDate?: string };

type LegacyIngredient = Omit<Ingredient, 'attribute'> & {
  expirationDate?: string | null;
  storageType?: unknown;
  attribute?: Ingredient['attribute'];
};

function normalizeIngredient(raw: LegacyIngredient): Ingredient {
  const legacyExpiry = raw.expirationDate;
  const addedDate =
    raw.addedDate ??
    (legacyExpiry ? String(legacyExpiry).slice(0, 10) : undefined) ??
    (raw.createdAt ? raw.createdAt.slice(0, 10) : localTodayKey());
  const { expirationDate: _legacyExpiry, storageType: legacyStorage, ...rest } = raw;
  const attribute =
    raw.attribute != null
      ? normalizeIngredientAttribute(raw.attribute)
      : attributeFromLegacyStorageType(legacyStorage) ??
        guessIngredientAttribute(raw.name);
  return {
    ...rest,
    attribute,
    addedDate,
  };
}

function normalizeIngredients(list: Ingredient[]): Ingredient[] {
  return list.map(normalizeIngredient);
}

const STORAGE_KEY = '@cooking_mock_v6';

type PersistedState = {
  user: UserProfile;
  ingredients: Ingredient[];
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  cookedPhotos?: CookedDishPhoto[];
  demoSeedVersion?: number;
};

type AppContextValue = {
  ready: boolean;
  user: UserProfile;
  ingredients: Ingredient[];
  activeIngredients: Ingredient[];
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  cookedPhotos: CookedDishPhoto[];
  remainingGemini: number;
  consumeGemini: () => boolean;
  /** 広告視聴モック: 本日の残り回数を増やす（usedToday を減らす） */
  rewardGeminiFromAd: (amount?: number) => number;
  addIngredients: (items: NewIngredientInput[]) => Ingredient[];
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void;
  softDeleteIngredient: (id: string) => void;
  consumeIngredients: (ids: string[], amount: number) => void;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Recipe;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  toggleFavorite: (id: string) => void;
  addCookedPhoto: (photo: Omit<CookedDishPhoto, 'id' | 'userId' | 'createdAt'>) => CookedDishPhoto;
  removeCookedPhoto: (id: string) => void;
  photosForRecipe: (recipeId: string) => CookedDishPhoto[];
  latestPhotoForRecipe: (recipeId: string) => CookedDishPhoto | undefined;
  addShoppingItem: (name: string) => void;
  toggleShoppingItem: (id: string) => void;
  subscribePremiumPlan: (plan: Exclude<PremiumPlanId, 'free'>) => void;
  cancelPremium: () => void;
  setLanguage: (lang: AppLanguage) => void;
  language: AppLanguage;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  resetDemoData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withDailyGeminiReset(user: UserProfile): UserProfile {
  const active = withPremiumExpiryCheck(normalizeUserProfile(user));
  const today = localTodayKey();
  if (active.geminiLimit.lastResetDate === today) return active;
  return {
    ...active,
    geminiLimit: {
      ...active.geminiLimit,
      usedToday: 0,
      lastResetDate: today,
    },
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [ingredients, setIngredients] = useState<Ingredient[]>(SEED_INGREDIENTS);
  const [recipes, setRecipes] = useState<Recipe[]>(SEED_RECIPES);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [cookedPhotos, setCookedPhotos] = useState<CookedDishPhoto[]>(SEED_COOKED_PHOTOS);
  const [language, setLanguage] = useState<AppLanguage>(() => getDeviceLanguage());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedState & {
            language?: string;
            notificationsEnabled?: boolean;
          };
          let nextUser = withDailyGeminiReset(parsed.user ?? INITIAL_USER);
          setUser(nextUser);
          const storedSeedVersion = parsed.demoSeedVersion ?? 1;
          const shouldRefreshSeed = storedSeedVersion < DEMO_SEED_VERSION;
          setIngredients(
            shouldRefreshSeed
              ? SEED_INGREDIENTS
              : normalizeIngredients(
                  parsed.ingredients?.length ? parsed.ingredients : SEED_INGREDIENTS
                )
          );
          setRecipes(shouldRefreshSeed ? SEED_RECIPES : parsed.recipes?.length ? parsed.recipes : SEED_RECIPES);
          setShoppingList(parsed.shoppingList ?? []);
          setCookedPhotos(
            shouldRefreshSeed
              ? SEED_COOKED_PHOTOS
              : parsed.cookedPhotos?.length
                ? parsed.cookedPhotos
                : SEED_COOKED_PHOTOS
          );
          if (parsed.language === 'ja' || parsed.language === 'en') {
            setLanguage(parsed.language);
          }
          if (typeof parsed.notificationsEnabled === 'boolean') {
            setNotificationsEnabled(parsed.notificationsEnabled);
          }
        }
      } catch (err) {
        console.warn('[AppContext] Failed to load persisted state', err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setUser((prev) => withDailyGeminiReset(prev));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload = {
      user,
      ingredients,
      recipes,
      shoppingList,
      cookedPhotos,
      language,
      notificationsEnabled,
      demoSeedVersion: DEMO_SEED_VERSION,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch((err) => {
      console.warn('[AppContext] Failed to persist state', err);
    });
  }, [ready, user, ingredients, recipes, shoppingList, cookedPhotos, language, notificationsEnabled]);

  const activeIngredients = useMemo(
    () => ingredients.filter((i) => !i.isDeleted && i.quantity > 0),
    [ingredients]
  );

  const remainingGemini = Math.max(
    0,
    user.geminiLimit.maxPerDay - user.geminiLimit.usedToday
  );

  const consumeGemini = useCallback(() => {
    let ok = false;
    setUser((prev) => {
      const reset = withDailyGeminiReset(prev);
      if (reset.isPremium) {
        ok = true;
        return reset;
      }
      if (reset.geminiLimit.usedToday >= reset.geminiLimit.maxPerDay) {
        ok = false;
        return reset;
      }
      ok = true;
      return {
        ...reset,
        geminiLimit: {
          ...reset.geminiLimit,
          usedToday: reset.geminiLimit.usedToday + 1,
          lastResetDate: localTodayKey(),
        },
        updatedAt: new Date().toISOString(),
      };
    });
    return ok;
  }, []);

  const rewardGeminiFromAd = useCallback((amount = 1) => {
    setUser((prev) => {
      const reset = withDailyGeminiReset(prev);
      if (reset.isPremium) return reset;
      return {
        ...reset,
        geminiLimit: {
          ...reset.geminiLimit,
          usedToday: Math.max(0, reset.geminiLimit.usedToday - amount),
          lastResetDate: localTodayKey(),
        },
        updatedAt: new Date().toISOString(),
      };
    });
    return amount;
  }, []);

  const addIngredients = useCallback((items: NewIngredientInput[]) => {
      const now = new Date().toISOString();
      const created = items.map((item) => ({
        ...item,
        attribute: normalizeIngredientAttribute(
          item.attribute ?? guessIngredientAttribute(item.name)
        ),
        addedDate: item.addedDate ?? localTodayKey(),
        id: uid('ing'),
        userId: DEMO_USER_ID,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      }));
      setIngredients((prev) => [...created, ...prev]);
      return created;
    },
    []
  );

  const updateIngredient = useCallback((id: string, patch: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const softDeleteIngredient = useCallback((id: string) => {
    setIngredients((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isDeleted: true, quantity: 0, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const consumeIngredients = useCallback((ids: string[], amount: number) => {
    setIngredients((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id)) return item;
        const nextQty = Math.max(0, Number((item.quantity - amount).toFixed(2)));
        return {
          ...item,
          quantity: nextQty,
          isDeleted: nextQty <= 0 ? true : item.isDeleted,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const addRecipe = useCallback(
    (recipe: Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const created: Recipe = {
        ...recipe,
        id: uid('rcp'),
        userId: DEMO_USER_ID,
        createdAt: now,
        updatedAt: now,
      };
      setRecipes((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateRecipe = useCallback((id: string, patch: Partial<Recipe>) => {
    setRecipes((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setRecipes((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isFavorite: !item.isFavorite, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const addCookedPhoto = useCallback(
    (photo: Omit<CookedDishPhoto, 'id' | 'userId' | 'createdAt'>) => {
      const now = new Date().toISOString();
      const created: CookedDishPhoto = {
        ...photo,
        id: uid('cook'),
        userId: DEMO_USER_ID,
        createdAt: now,
      };
      setCookedPhotos((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const removeCookedPhoto = useCallback((id: string) => {
    setCookedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const photosForRecipe = useCallback(
    (recipeId: string) => cookedPhotos.filter((p) => p.recipeId === recipeId),
    [cookedPhotos]
  );

  const latestPhotoForRecipe = useCallback(
    (recipeId: string) => cookedPhotos.find((p) => p.recipeId === recipeId),
    [cookedPhotos]
  );

  const addShoppingItem = useCallback((name: string) => {
    const now = new Date().toISOString();
    setShoppingList((prev) => [
      {
        id: uid('shop'),
        userId: DEMO_USER_ID,
        name,
        isChecked: false,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isChecked: !item.isChecked, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const setPremium = useCallback((value: boolean) => {
    if (value) {
      setUser((prev) => {
        const reset = withDailyGeminiReset(prev);
        const expiresAt = computePremiumExpiry('monthly');
        return {
          ...reset,
          isPremium: true,
          premiumPlan: 'monthly',
          premiumExpiresAt: expiresAt,
          geminiLimit: {
            ...reset.geminiLimit,
            maxPerDay: 9999,
          },
          updatedAt: new Date().toISOString(),
        };
      });
      return;
    }
    setUser((prev) => ({
      ...withDailyGeminiReset(prev),
      isPremium: false,
      premiumPlan: 'free',
      premiumExpiresAt: null,
      geminiLimit: {
        ...prev.geminiLimit,
        maxPerDay: 5,
      },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const subscribePremiumPlan = useCallback((plan: Exclude<PremiumPlanId, 'free'>) => {
    setUser((prev) => {
      const reset = withDailyGeminiReset(prev);
      return {
        ...reset,
        isPremium: true,
        premiumPlan: plan,
        premiumExpiresAt: computePremiumExpiry(plan),
        geminiLimit: {
          ...reset.geminiLimit,
          maxPerDay: 9999,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const cancelPremium = useCallback(() => {
    setPremium(false);
  }, [setPremium]);

  const resetDemoData = useCallback(() => {
    setUser(INITIAL_USER);
    setIngredients(SEED_INGREDIENTS);
    setRecipes(SEED_RECIPES);
    setShoppingList([]);
    setCookedPhotos(SEED_COOKED_PHOTOS);
    setLanguage(getDeviceLanguage());
    setNotificationsEnabled(true);
    resetFridgeCardEnterAnimation();
  }, []);

  const value: AppContextValue = {
    ready,
    user,
    ingredients,
    activeIngredients,
    recipes,
    shoppingList,
    cookedPhotos,
    remainingGemini,
    consumeGemini,
    rewardGeminiFromAd,
    addIngredients,
    updateIngredient,
    softDeleteIngredient,
    consumeIngredients,
    addRecipe,
    updateRecipe,
    toggleFavorite,
    addCookedPhoto,
    removeCookedPhoto,
    photosForRecipe,
    latestPhotoForRecipe,
    addShoppingItem,
    toggleShoppingItem,
    subscribePremiumPlan,
    cancelPremium,
    setLanguage,
    language,
    notificationsEnabled,
    setNotificationsEnabled,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
