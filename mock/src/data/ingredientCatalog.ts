/** レシート読み取り対応食材カタログ（アプリ内完結） */
export type IngredientCategory =
  | 'grain'
  | 'vegetable'
  | 'meat'
  | 'seafood'
  | 'soy_dairy'
  | 'fruit';

export type IngredientCatalogEntry = {
  /** asset ファイル名（ing_rice.jpg 等） */
  id: string;
  /** 表示名（正規名） */
  name: string;
  /** レシート表記ゆれ */
  aliases: string[];
  category: IngredientCategory;
};

export const INGREDIENT_CATALOG: IngredientCatalogEntry[] = [
  { id: 'rice', name: '米', aliases: ['こめ', '白米'], category: 'grain' },
  { id: 'flour', name: '小麦粉', aliases: ['薄力粉', '強力粉'], category: 'grain' },
  { id: 'bread', name: '食パン', aliases: ['パン', '食ぱん'], category: 'grain' },
  { id: 'udon', name: 'うどん', aliases: ['ウドン'], category: 'grain' },
  { id: 'soba', name: 'そば', aliases: ['ソバ', '蕎麦'], category: 'grain' },
  { id: 'pasta', name: 'パスタ', aliases: ['スパゲッティ'], category: 'grain' },
  { id: 'chinese_noodle', name: '中華麺', aliases: ['中華めん', 'ラーメン'], category: 'grain' },

  { id: 'cabbage', name: 'キャベツ', aliases: ['きゃべつ'], category: 'vegetable' },
  { id: 'onion', name: '玉ねぎ', aliases: ['タマネギ', 'たまねぎ', '玉葱'], category: 'vegetable' },
  { id: 'daikon', name: '大根', aliases: ['だいこん'], category: 'vegetable' },
  { id: 'carrot', name: 'にんじん', aliases: ['ニンジン', '人参'], category: 'vegetable' },
  { id: 'potato', name: 'じゃがいも', aliases: ['ジャガイモ', 'potato'], category: 'vegetable' },
  { id: 'napa', name: '白菜', aliases: ['はくさい'], category: 'vegetable' },
  { id: 'green_onion', name: 'ねぎ', aliases: ['ネギ', '長ねぎ', '長ネギ'], category: 'vegetable' },
  { id: 'lettuce', name: 'レタス', aliases: ['れたす'], category: 'vegetable' },
  { id: 'tomato', name: 'トマト', aliases: ['とまと', 'ミニトマト'], category: 'vegetable' },
  { id: 'cucumber', name: 'きゅうり', aliases: ['キュウリ', '胡瓜'], category: 'vegetable' },
  { id: 'bean_sprout', name: 'もやし', aliases: ['モヤシ'], category: 'vegetable' },
  { id: 'green_pepper', name: 'ピーマン', aliases: ['ぴーまん'], category: 'vegetable' },
  { id: 'spinach', name: 'ほうれん草', aliases: ['ホウレンソウ', 'ほうれんそう'], category: 'vegetable' },
  { id: 'komatsuna', name: '小松菜', aliases: ['こまつな'], category: 'vegetable' },
  { id: 'eggplant', name: 'なす', aliases: ['ナス', '茄子'], category: 'vegetable' },
  { id: 'broccoli', name: 'ブロッコリー', aliases: ['ブロッコリ'], category: 'vegetable' },
  { id: 'shiitake', name: 'しいたけ', aliases: ['シイタケ', '椎茸'], category: 'vegetable' },
  { id: 'shimeji', name: 'しめじ', aliases: ['シメジ'], category: 'vegetable' },
  { id: 'enoki', name: 'えのき', aliases: ['エノキ', 'エノキタケ'], category: 'vegetable' },

  { id: 'pork', name: '豚肉', aliases: ['ぶたにく', '豚'], category: 'meat' },
  { id: 'chicken', name: '鶏肉', aliases: ['とりにく', 'チキン'], category: 'meat' },
  { id: 'beef', name: '牛肉', aliases: ['ぎゅうにく', 'ビーフ'], category: 'meat' },
  { id: 'ground_meat', name: '合い挽き肉', aliases: ['合いびき肉', '合挽き肉', '合い挽'], category: 'meat' },
  { id: 'egg', name: '卵', aliases: ['鶏卵', 'たまご', 'タマゴ'], category: 'meat' },

  { id: 'salmon', name: 'さけ', aliases: ['鮭', 'サケ', 'しゃけ'], category: 'seafood' },
  { id: 'tuna', name: 'まぐろ', aliases: ['鮪', 'マグロ'], category: 'seafood' },
  { id: 'mackerel', name: 'さば', aliases: ['鯖', 'サバ'], category: 'seafood' },
  { id: 'aji', name: 'あじ', aliases: ['鰺', 'アジ'], category: 'seafood' },
  { id: 'squid', name: 'いか', aliases: ['イカ', '烏賊'], category: 'seafood' },
  { id: 'shrimp', name: 'えび', aliases: ['エビ', '海老'], category: 'seafood' },
  { id: 'chikuwa', name: 'ちくわ', aliases: ['チクワ', '竹輪'], category: 'seafood' },
  { id: 'canned_tuna', name: 'ツナ缶', aliases: ['ツナ', 'ツナ缶詰'], category: 'seafood' },

  { id: 'tofu', name: '豆腐', aliases: ['とうふ'], category: 'soy_dairy' },
  { id: 'natto', name: '納豆', aliases: ['なっとう'], category: 'soy_dairy' },
  { id: 'aburaage', name: '油揚げ', aliases: ['あぶらあげ'], category: 'soy_dairy' },
  { id: 'milk', name: '牛乳', aliases: ['ぎゅうにゅう'], category: 'soy_dairy' },
  { id: 'yogurt', name: 'ヨーグルト', aliases: ['ヨーグルト食品'], category: 'soy_dairy' },
  { id: 'cheese', name: 'チーズ', aliases: ['ちーず'], category: 'soy_dairy' },
  { id: 'butter', name: 'バター', aliases: ['ばたー'], category: 'soy_dairy' },

  { id: 'banana', name: 'バナナ', aliases: ['ばなな'], category: 'fruit' },
  { id: 'apple', name: 'りんご', aliases: ['リンゴ', '林檎'], category: 'fruit' },
  { id: 'mikan', name: 'みかん', aliases: ['ミカン', '蜜柑'], category: 'fruit' },
  { id: 'kiwi', name: 'キウイ', aliases: ['キウイフルーツ', 'kiwi'], category: 'fruit' },
];
