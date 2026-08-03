/** 食材属性: 生鮮 / 加工品 / その他 */
export type IngredientAttribute = 'fresh' | 'processed' | 'other';

export type Ingredient = {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  /** 食材属性: 生鮮 / 加工品 / その他 */
  attribute: IngredientAttribute;
  /** 冷蔵庫に入れた日（YYYY-MM-DD） */
  addedDate: string;
  quantity: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecipeStep = {
  stepNumber: number;
  instruction: string;
  timerSeconds?: number;
};

export type RecipeIngredient = {
  name: string;
  amount: string;
};

export type Recipe = {
  id: string;
  userId: string;
  title: string;
  sourceIngredients: string[];
  servings: number;
  cookingTime: number;
  difficulty: string;
  genre: string;
  ingredientsList: RecipeIngredient[];
  steps: RecipeStep[];
  userMemo: string;
  isFavorite: boolean;
  tips?: string;
  buyAssistText?: string;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingItem = {
  id: string;
  userId: string;
  name: string;
  isChecked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PremiumPlanId = 'free' | 'monthly' | 'semiannual' | 'annual';

export type UserProfile = {
  uid: string;
  email: string;
  isPremium: boolean;
  premiumPlan: PremiumPlanId;
  premiumExpiresAt: string | null;
  geminiLimit: {
    usedToday: number;
    maxPerDay: number;
    lastResetDate: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type DetectedItem = {
  name: string;
  quantity: string;
  confidence: string;
  attribute: IngredientAttribute;
  /** 食材ごとの切り抜きサムネ（file://）。無い場合は撮影写真全体 */
  imageUrl?: string;
  /** Gemini 返却 bbox [ymin, xmin, ymax, xmax]（0-1000 正規化） */
  box2d?: [number, number, number, number];
};

export type RecipeConditions = {
  cookingTime: string;
  difficulty: string;
  genre: string;
  servings: number;
  seasoning: string;
  dishCount: number;
};

/** 調理完了後に撮影した出来上がり写真 */
export type CookedDishPhoto = {
  id: string;
  userId: string;
  recipeId: string;
  recipeTitle: string;
  /** file:// URI または asset:// キー */
  imageUri: string;
  createdAt: string;
};
