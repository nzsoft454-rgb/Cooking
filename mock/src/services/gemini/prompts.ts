import type { RecipeConditions } from '../../types';

export const FOOD_PHOTO_PROMPT = `あなたは日本の家庭向け料理アプリの食材認識AIです。
写真に写っている食材を日本語で列挙してください。

ルール:
- 食材名は一般的な日本語表記（例: トマト、玉ねぎ、鶏卵）
- quantity は「1個」「200g」「1束」「適量」など分かりやすい単位
- confidence は high / medium / low
- attribute は fresh（生鮮）/ processed（加工品・缶詰・冷凍食品）/ other（調味料・乾物など）
- 写っていないものは推測しない
- 食材が1つも写っていない場合のみ items を空配列 [] にする
- 写っている場合は必ず1件以上入れる
- 最大20件

JSONのみ返してください:
{
  "items": [
    { "name": "トマト", "quantity": "2個", "confidence": "high", "attribute": "fresh" }
  ]
}`;

export const RECEIPT_PROMPT = `あなたは日本のレシート読み取りAIです。
レシート画像から購入した食品・食材の品名と数量を抽出してください。

ルール:
- rawName はレシートに記載された表記をそのまま（略称・カタカナ可）
- quantity はレシート表記をそのまま（例: 1P, 2コ, 198g）。不明なら "1"
- 非食品（袋代・割引行・ポイント等）は除外
- 最大30件

JSONのみ返してください:
{
  "items": [
    { "rawName": "トマト", "quantity": "2コ" }
  ]
}`;

export function buildRecipePrompt(
  sourceIngredients: string[],
  conditions: RecipeConditions,
  gacha: boolean,
): string {
  const ingredients = sourceIngredients.length
    ? sourceIngredients.join('、')
    : '（指定なし）';

  const gachaNote = gacha
    ? 'ガチャモード: 抽選された残り物を無理やり使う、ユーモアのあるレシピ名にしてください。title の先頭に「【食材ガチャ】」を付けてください。'
    : '通常モード: 実用的で再現しやすい家庭料理にしてください。';

  return `あなたは日本の家庭向けレシピ生成AIです。
以下の条件でレシピを1件だけ生成してください。

${gachaNote}

使う食材: ${ingredients}
調理時間: ${conditions.cookingTime}
難易度: ${conditions.difficulty}
ジャンル: ${conditions.genre}
人数: ${conditions.servings}人前
味付け: ${conditions.seasoning}
品数: ${conditions.dishCount}

JSONのみ返してください:
{
  "title": "レシピ名",
  "cookingTime": 15,
  "ingredientsList": [{ "name": "玉ねぎ", "amount": "1/2個" }],
  "steps": [
    { "stepNumber": 1, "instruction": "手順", "timerSeconds": 180 }
  ],
  "tips": "コツ（任意）",
  "buyAssistText": "足りない場合の買い足し提案（任意）"
}

ルール:
- cookingTime は分（整数）
- steps は3〜6件、timerSeconds は任意（秒）
- 手順は日本語で具体的に
- sourceIngredients にない食材を大量に追加しない`;
}
