import type {
  CookedDishPhoto,
  DetectedItem,
  Ingredient,
  IngredientAttribute,
  Recipe,
  RecipeConditions,
  UserProfile,
} from '../types';
import { CAPTURE_IMAGE_KEY } from './images';
import { localTodayKey } from '../utils/dateKey';

export const DEMO_USER_ID = 'demo-user-001';

export const INITIAL_USER: UserProfile = {
  uid: DEMO_USER_ID,
  email: 'demo@example.com',
  isPremium: false,
  premiumPlan: 'free',
  premiumExpiresAt: null,
  geminiLimit: {
    usedToday: 0,
    maxPerDay: 5,
    lastResetDate: localTodayKey(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** カメラ撮影モックで使う画像キー（android/imegs） */
export const CAPTURE_IMAGE = CAPTURE_IMAGE_KEY;
export const DUMMY_IMAGE = CAPTURE_IMAGE_KEY;

export const DUMMY_DETECTED: DetectedItem[] = [
  {
    name: '小松菜（※誤判定のデモ用：手動でほうれん草に修正可能にする）',
    quantity: '1束',
    confidence: 'high',
    attribute: 'fresh',
  },
];

export const DUMMY_RECIPE_BASE = {
  recipe_name: '【ダミー】ほうれん草と卵の彩り炒め',
  servings: 2,
  cooking_time_minutes: 10,
  description: '冷蔵庫の野菜を使った、サッと作れる簡単おかずです。',
  ingredients: [
    { name: 'ほうれん草', amount: '1束' },
    { name: '卵', amount: '2個' },
    { name: 'にんにく', amount: '1片' },
    { name: '醤油', amount: '大さじ1' },
  ],
  steps: [
    { step_number: 1, instruction: 'ほうれん草は洗ってざく切りにします。' },
    { step_number: 2, instruction: 'フライパンでにんにくを炒め、香りが出たらほうれん草を入れます。' },
    {
      step_number: 3,
      instruction: 'しんなりしたら溶き卵を流し入れ、さらに3分炒めます。',
      timerSeconds: 180,
    },
    { step_number: 4, instruction: '醤油で味を整えて完成です！' },
  ],
  tips: '水気をよく切ると味が薄まりません。',
  buy_assist: '卵を買えば、ほうれん草の卵炒めがすぐ作れます',
};

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function seedItem(
  id: string,
  name: string,
  imageUrl: string,
  addedDaysAgo: number,
  quantity: number,
  attribute: IngredientAttribute = 'fresh'
): Ingredient {
  const now = new Date().toISOString();
  return {
    id,
    userId: DEMO_USER_ID,
    name,
    imageUrl,
    attribute,
    addedDate: daysFromToday(-addedDaysAgo),
    quantity,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** デモ食材（入庫日は起動日基準の相対日付） */
export const SEED_INGREDIENTS: Ingredient[] = [
  seedItem('ing-seed-1', '玉ねぎ', 'asset://tamanegi_onion', 5, 1),
  seedItem('ing-seed-2', 'きゅうり', 'asset://kyuuri_cucumber', 2, 0.75),
  seedItem('ing-seed-3', 'なす', 'asset://nasu_eggplant', 6, 1),
  seedItem('ing-seed-4', 'ピーマン', 'asset://piman_greenpepper', 1, 1),
  seedItem('ing-seed-5', 'ほうれん草', 'asset://hourensou_spinach', 10, 1),
  seedItem('ing-seed-6', 'かぶ', 'asset://kabu_turnip', 3, 1),
  seedItem('ing-seed-7', 'おくら', 'asset://okura_gombo', 4, 0.5),
  seedItem('ing-seed-8', 'エリンギ', 'asset://capture-erungi', 2, 0.85),
  seedItem('ing-seed-9', '玉ねぎ（半分）', 'asset://tamanegi_onion', 8, 0.5),
  seedItem('ing-seed-10', 'ミニトマト', 'asset://piman_greenpepper', 3, 0.6),
  seedItem('ing-seed-11', 'にんじん', 'asset://kabu_turnip', 12, 1),
  seedItem('ing-seed-12', '大根', 'asset://kabu_turnip', 4, 0.9),
  seedItem('ing-seed-13', 'ししとう', 'asset://piman_greenpepper', 2, 1),
  seedItem('ing-seed-14', '小松菜', 'asset://hourensou_spinach', 14, 0.4),
  seedItem('ing-seed-15', 'ズッキーニ', 'asset://kyuuri_cucumber', 5, 1),
  seedItem('ing-seed-16', 'トマト', 'asset://ing_tomato', 0, 0.7),
  seedItem('ing-seed-17', 'しめじ', 'asset://capture-erungi', 4, 0.55),
  seedItem('ing-seed-18', 'ブロッコリー', 'asset://okura_gombo', 30, 1, 'processed'),
  seedItem('ing-seed-19', 'レタス', 'asset://hourensou_spinach', 1, 0.35),
  seedItem('ing-seed-20', '長ねぎ', 'asset://tamanegi_onion', 7, 0.8),
  seedItem('ing-seed-21', 'なす（小）', 'asset://nasu_eggplant', 9, 0.6),
  seedItem('ing-seed-22', 'きゅうり（半本）', 'asset://kyuuri_cucumber', 3, 0.5),
  seedItem('ing-seed-23', 'かぼちゃ', 'asset://kabu_turnip', 20, 1),
  seedItem('ing-seed-24', 'もやし', 'asset://hourensou_spinach', 1, 1),
];

/** デモ食材セットの版 */
export const DEMO_SEED_VERSION = 5;

/** C-001 履歴デモ用：出来上がり写真 */
export const COOKED_DISH_DEMO_IMAGES = {
  spinachStirFry: 'asset://cooked_spinach_stirfry',
  eggplantPlate: 'asset://cooked_eggplant_salad',
  gachaPot: 'asset://cooked_gacha_pot',
  cucumberSalad: 'asset://cooked_cucumber_salad',
} as const;

const SEED_NOW = '2026-07-15T10:00:00.000Z';
const SEED_NOW_2 = '2026-07-18T18:30:00.000Z';
const SEED_NOW_3 = '2026-07-19T12:00:00.000Z';

/** C-001 履歴デモ用レシピ */
export const SEED_RECIPES: Recipe[] = [
  {
    id: 'rcp-seed-1',
    userId: DEMO_USER_ID,
    title: '【ダミー】ほうれん草と卵の彩り炒め',
    sourceIngredients: ['ほうれん草', '卵', 'にんにく'],
    servings: 2,
    cookingTime: 10,
    difficulty: '簡単',
    genre: '和風',
    ingredientsList: DUMMY_RECIPE_BASE.ingredients,
    steps: DUMMY_RECIPE_BASE.steps.map((s) => ({
      stepNumber: s.step_number,
      instruction: s.instruction,
      timerSeconds: (s as { timerSeconds?: number }).timerSeconds,
    })),
    tips: DUMMY_RECIPE_BASE.tips,
    buyAssistText: DUMMY_RECIPE_BASE.buy_assist,
    userMemo: '',
    isFavorite: true,
    createdAt: SEED_NOW,
    updatedAt: SEED_NOW,
  },
  {
    id: 'rcp-seed-2',
    userId: DEMO_USER_ID,
    title: 'なすときゅうりの浅漬け風サラダ',
    sourceIngredients: ['なす', 'きゅうり'],
    servings: 2,
    cookingTime: 15,
    difficulty: '簡単',
    genre: '和風',
    ingredientsList: [
      { name: 'なす', amount: '1本' },
      { name: 'きゅうり', amount: '1本' },
      { name: '酢', amount: '大さじ2' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'なすとかきゅうりを食べやすく切ります。' },
      { stepNumber: 2, instruction: '酢で和えて冷やせば完成。' },
    ],
    tips: '少し塩を振ると味が締まります。',
    buyAssistText: '',
    userMemo: '夏向き',
    isFavorite: false,
    createdAt: SEED_NOW_2,
    updatedAt: SEED_NOW_2,
  },
  {
    id: 'rcp-seed-3',
    userId: DEMO_USER_ID,
    title: '【食材ガチャ】ごちゃ混ぜ闇鍋・一発逆転スペシャル',
    sourceIngredients: ['玉ねぎ', 'ピーマン', 'おくら'],
    servings: 3,
    cookingTime: 20,
    difficulty: '普通',
    genre: '和風',
    ingredientsList: [
      { name: '玉ねぎ', amount: '適量' },
      { name: 'ピーマン', amount: '適量' },
      { name: 'おくら', amount: '適量' },
    ],
    steps: [
      { stepNumber: 1, instruction: '全部切って鍋へ。' },
      { stepNumber: 2, instruction: '煮込んで完成。' },
    ],
    tips: 'ガチャ結果は毎回違います。',
    buyAssistText: '豆腐を足すとボリュームアップ',
    userMemo: '',
    isFavorite: false,
    createdAt: SEED_NOW_3,
    updatedAt: SEED_NOW_3,
  },
];

/** C-001 履歴デモ用：調理後に撮影した想定の写真 */
export const SEED_COOKED_PHOTOS: CookedDishPhoto[] = [
  {
    id: 'cook-seed-1',
    userId: DEMO_USER_ID,
    recipeId: 'rcp-seed-1',
    recipeTitle: '【ダミー】ほうれん草と卵の彩り炒め',
    imageUri: COOKED_DISH_DEMO_IMAGES.spinachStirFry,
    createdAt: '2026-07-16T19:00:00.000Z',
  },
  {
    id: 'cook-seed-2',
    userId: DEMO_USER_ID,
    recipeId: 'rcp-seed-1',
    recipeTitle: '【ダミー】ほうれん草と卵の彩り炒め',
    imageUri: COOKED_DISH_DEMO_IMAGES.gachaPot,
    createdAt: '2026-07-20T11:00:00.000Z',
  },
  {
    id: 'cook-seed-3',
    userId: DEMO_USER_ID,
    recipeId: 'rcp-seed-2',
    recipeTitle: 'なすときゅうりの浅漬け風サラダ',
    imageUri: COOKED_DISH_DEMO_IMAGES.eggplantPlate,
    createdAt: '2026-07-18T19:30:00.000Z',
  },
  {
    id: 'cook-seed-4',
    userId: DEMO_USER_ID,
    recipeId: 'rcp-seed-2',
    recipeTitle: 'なすときゅうりの浅漬け風サラダ',
    imageUri: COOKED_DISH_DEMO_IMAGES.cucumberSalad,
    createdAt: '2026-07-19T08:00:00.000Z',
  },
];

export const DEFAULT_CONDITIONS: RecipeConditions = {
  cookingTime: '15分以内',
  difficulty: '簡単',
  genre: '和風',
  servings: 2, // 0.5刻み対応（例: 0.5 / 1 / 1.5 / 2 …）
  seasoning: '普通',
  dishCount: 1,
};

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockAnalyzeImage(): Promise<DetectedItem[]> {
  await delay(1800);
  return DUMMY_DETECTED.map((item) => ({ ...item }));
}

export async function mockGenerateRecipe(
  sourceIngredients: string[],
  conditions: RecipeConditions
): Promise<Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'userMemo'>> {
  await delay(2000);
  return {
    title: DUMMY_RECIPE_BASE.recipe_name,
    sourceIngredients,
    servings: conditions.servings,
    cookingTime: DUMMY_RECIPE_BASE.cooking_time_minutes,
    difficulty: conditions.difficulty,
    genre: conditions.genre,
    ingredientsList: DUMMY_RECIPE_BASE.ingredients,
    steps: DUMMY_RECIPE_BASE.steps.map((s) => ({
      stepNumber: s.step_number,
      instruction: s.instruction,
      timerSeconds: (s as { timerSeconds?: number }).timerSeconds,
    })),
    tips: DUMMY_RECIPE_BASE.tips,
    buyAssistText: DUMMY_RECIPE_BASE.buy_assist,
  };
}

const GACHA_TITLES = [
  'ごちゃ混ぜ闇鍋・一発逆転スペシャル',
  '残り物ラッキー鍋ガチャ★★★',
  '冷蔵庫パニック！奇跡のうま煮',
  'おまかせ混沌炒め（甘口エンド）',
  '闇鍋レジェンド・野菜ざんまい',
];

/** 冷蔵庫から食材をランダム抽選（生鮮優先・その他は除外） */
export function pickRandomIngredients(
  pool: Ingredient[],
  min = 2,
  max = 4
): Ingredient[] {
  const eligible = pool.filter((item) => item.attribute !== 'other');
  if (eligible.length === 0) return [];

  const shuffledFresh = [...eligible.filter((i) => i.attribute === 'fresh')].sort(
    () => Math.random() - 0.5
  );
  const shuffledProcessed = [...eligible.filter((i) => i.attribute === 'processed')].sort(
    () => Math.random() - 0.5
  );

  const targetCount = Math.min(
    eligible.length,
    Math.max(min, Math.min(max, 2 + Math.floor(Math.random() * (max - min + 1))))
  );

  const picked: Ingredient[] = [];
  for (const item of shuffledFresh) {
    if (picked.length >= targetCount) break;
    picked.push(item);
  }
  for (const item of shuffledProcessed) {
    if (picked.length >= targetCount) break;
    picked.push(item);
  }

  return picked.length > 0 ? picked : eligible.slice(0, 1);
}

/** 抽選された食材で作るガチャレシピ */
export async function mockGenerateGachaRecipe(
  sourceIngredients: string[]
): Promise<Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'userMemo'>> {
  await delay(2500);
  const title = GACHA_TITLES[Math.floor(Math.random() * GACHA_TITLES.length)];
  const names = sourceIngredients.length ? sourceIngredients : ['謎の残り物'];
  return {
    title: `【食材ガチャ】${title}`,
    sourceIngredients: names,
    servings: Math.max(1, Math.min(4, names.length)),
    cookingTime: 15 + Math.floor(Math.random() * 20),
    difficulty: '普通',
    genre: '和風',
    ingredientsList: [
      ...names.map((name) => ({ name, amount: '適量' })),
      { name: '水またはだし', amount: '適量' },
      { name: '醤油・塩コショウ', amount: 'お好み' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: `ガチャで当たった ${names.join('・')} を適当な大きさに切って鍋へ！`,
      },
      {
        stepNumber: 2,
        instruction: '水（またはだし）を入れて強火。ぐつぐつきたら味付け開始。',
      },
      {
        stepNumber: 3,
        instruction: '気になるまで5分煮込む。味見して調整！',
        timerSeconds: 300,
      },
      {
        stepNumber: 4,
        instruction: '完成！食材ガチャの結果は味覚次第。一発逆転おめでとう！',
      },
    ],
    tips: 'おまかせは食材の抽選です。冷蔵庫の残り物からランダムに選ばれます。',
    buyAssistText: '豆腐や卵を足せば、闇鍋がさらに豪華になります',
  };
}

export const IMAGE_COLORS: Record<string, string> = {
  'asset://hourensou_spinach': '#E8F5E9',
  'asset://kabu_turnip': '#F5F5F5',
  'asset://kyuuri_cucumber': '#E8F5E9',
  'asset://nasu_eggplant': '#EDE7F6',
  'asset://okura_gombo': '#E8F5E9',
  'asset://piman_greenpepper': '#E8F5E9',
  'asset://tamanegi_onion': '#FFF8E1',
  'asset://capture-erungi': '#FFF3E0',
  'asset://cooked_spinach_stirfry': '#FFF8E1',
  'asset://cooked_eggplant_salad': '#F3E5F5',
  'asset://cooked_gacha_pot': '#FFF3E0',
  'asset://cooked_cucumber_salad': '#E8F5E9',
};
