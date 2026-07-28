import { delay } from './dummy';
import { INGREDIENT_CATALOG } from './ingredientCatalog';
import { RECEIPT_IMAGE_KEY } from './images';

export { RECEIPT_IMAGE_KEY };

/** デモ: レシートから読み取った品目 */
export const MOCK_RECEIPT_LINES = [
  'トマト',
  'タマネギ',
  '鶏卵',
  '牛乳',
  'サケ',
  'バナナ',
  'パスタ',
  'ツナ缶',
] as const;

export type ReceiptLineItem = {
  rawName: string;
  quantity: string;
};

/** アプリ内モック OCR（外部 API なし） */
export async function mockParseReceipt(_imageKey: string): Promise<ReceiptLineItem[]> {
  await delay(1800);
  return MOCK_RECEIPT_LINES.map((rawName) => ({
    rawName,
    quantity: '1',
  }));
}

/** カタログ登録数（設定画面等で参照可） */
export const RECEIPT_CATALOG_COUNT = INGREDIENT_CATALOG.length;
