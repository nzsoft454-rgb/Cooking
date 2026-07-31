import { delay } from './dummy';
import { RECEIPT_CATALOG_COUNT } from './receiptCatalog';
import { RECEIPT_IMAGE_KEY } from './images';

export { RECEIPT_IMAGE_KEY, RECEIPT_CATALOG_COUNT };

/** デモ: レシートから読み取った品目（200件カタログから抜粋） */
export const MOCK_RECEIPT_LINES = [
  '国産キャベツ',
  'ミニトマト',
  'タマネギ',
  '鶏モモ肉',
  'サーモン',
  'リンゴ',
  '木綿豆腐',
  '白米',
  '明太',
  'ブロッコリー',
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

