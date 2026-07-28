import { ImageSourcePropType } from 'react-native';
import { INGREDIENT_IMAGES } from './ingredientImages';

/**
 * モック用画像マップ（実写写真 + レシート食材）。
 * Expo 参照: mock/assets/food
 */
export const FOOD_IMAGES: Record<string, ImageSourcePropType> = {
  'asset://hourensou_spinach': require('../../assets/food/hourensou_spinach.jpg'),
  'asset://kabu_turnip': require('../../assets/food/kabu_turnip.png'),
  'asset://kyuuri_cucumber': require('../../assets/food/kyuuri_cucumber.png'),
  'asset://nasu_eggplant': require('../../assets/food/nasu_eggplant.png'),
  'asset://okura_gombo': require('../../assets/food/okura_gombo.png'),
  'asset://piman_greenpepper': require('../../assets/food/piman_greenpepper.jpg'),
  'asset://tamanegi_onion': require('../../assets/food/tamanegi_onion.png'),
  'asset://capture-erungi': require('../../assets/food/capture-erungi.png'),
  'asset://cooked_spinach_stirfry': require('../../assets/food/cooked_spinach_stirfry.png'),
  'asset://cooked_eggplant_salad': require('../../assets/food/cooked_eggplant_salad.png'),
  'asset://cooked_gacha_pot': require('../../assets/food/cooked_gacha_pot.png'),
  'asset://cooked_cucumber_salad': require('../../assets/food/cooked_cucumber_salad.png'),
  'asset://receipt_sample': require('../../assets/food/receipt_sample.jpg'),
  ...INGREDIENT_IMAGES,
};

/** カメラ撮影モックで使う画像 */
export const CAPTURE_IMAGE_KEY = 'asset://hourensou_spinach';

/** レシート読み取りモック */
export const RECEIPT_IMAGE_KEY = 'asset://receipt_sample';
