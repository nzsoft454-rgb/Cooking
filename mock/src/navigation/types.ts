import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ReceiptLineItem } from '../data/receiptMock';
import type { AnalysisMode } from '../services/analyzeImage';
import type { DetectedItem, RecipeConditions } from '../types';
import type { FridgeSortKey } from '../utils/fridgeSort';

export type CaptureSource = 'camera' | 'foodAlbum' | 'receiptAlbum';

export type CameraStackParamList = {
  CameraHome: undefined;
  CaptureConfirm: { imageUrl: string; source?: CaptureSource };
  Analyzing: { imageUrl: string; mode: AnalysisMode; analysisKey?: number };
  AnalysisResult: { items: DetectedItem[]; imageUrl: string };
  ManualEdit: { items: DetectedItem[]; imageUrl: string; index?: number };
  ReceiptResult: { items: ReceiptLineItem[]; imageUrl: string };
  CookingConfirm: {
    ingredientIds: string[];
    ingredientNames: string[];
  };
};

export type FridgeStackParamList = {
  FridgeHome: { sortKey?: FridgeSortKey } | undefined;
  FridgeSearch: {
    query: string;
    sortKey: FridgeSortKey;
  };
  IngredientEdit: { ingredientId: string };
  IngredientBatchEdit: { ingredientIds: string[] };
  CookingConfirm: {
    ingredientIds: string[];
    ingredientNames: string[];
  };
};

export type RecipeStackParamList = {
  RecipeHome: { initialTab?: 'all' | 'fav' | 'collection' } | undefined;
  RecipeGenerating: {
    ingredientIds: string[];
    ingredientNames: string[];
    conditions: RecipeConditions;
    /** ごちゃ混ぜ闇鍋（食材おまかせガチャ） */
    mode?: 'normal' | 'gacha';
    /** 同一画面への再遷移で生成を再実行するためのキー */
    generationKey?: number;
    /** ガチャ開始前に FridgeHome で Gemini を消費済み */
    geminiPreConsumed?: boolean;
  };
  RecipeDetail: { recipeId: string; ingredientIds?: string[] };
  PostCookConsume: {
    recipeId: string;
    recipeTitle: string;
    ingredientIds: string[];
  };
  PostCookPhoto: {
    recipeId: string;
    recipeTitle: string;
  };
  CookedPhotoDetail: { photoId: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ScreenGallery: undefined;
  Legal: undefined;
  Language: undefined;
  Profile: undefined;
  Help: undefined;
  Premium: undefined;
  Notifications: undefined;
  Login: undefined;
};

export type RootTabParamList = {
  CameraTab: NavigatorScreenParams<CameraStackParamList>;
  FridgeTab: NavigatorScreenParams<FridgeStackParamList>;
  RecipeTab: NavigatorScreenParams<RecipeStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};
