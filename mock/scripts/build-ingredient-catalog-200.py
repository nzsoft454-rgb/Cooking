#!/usr/bin/env python3
"""Build ingredient catalog (200 items) from Excel export JSON."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIST_PATH = Path(__file__).resolve().parent / "ingredient-list-200.json"
OUT_CATALOG_TS = ROOT / "src" / "data" / "ingredientCatalog.ts"
OUT_META_JSON = Path(__file__).resolve().parent / "ingredient-catalog-200.json"

# Excel row order (200). Duplicate 枝豆 at 39/174 shares slug edamame.
SLUGS = [
    "cabbage", "lettuce", "napa", "komatsuna", "spinach", "mizuna", "shungiku",
    "chingensai", "broccoli", "cauliflower", "tomato", "mini_tomato", "cucumber",
    "eggplant", "green_pepper", "paprika", "shishito", "okra", "goya", "zucchini",
    "pumpkin", "carrot", "daikon", "turnip", "burdock", "lotus_root", "sweet_potato",
    "potato", "satoimo", "nagaimo", "onion", "green_onion", "garlic_chive", "garlic",
    "ginger", "celery", "asparagus", "corn", "edamame", "bean_sprout", "radish",
    "red_onion", "coriander", "mitsuba", "oba", "cress", "kale", "beet", "turnip_greens",
    "water_spinach", "shiitake", "shimeji", "enoki", "eringi", "maitake", "button_mushroom",
    "nameko", "wood_ear", "matsutake", "porcini", "truffle", "hiratake", "hanabira_take",
    "yamabushitake", "maitake_wild", "apple", "banana", "mikan", "orange", "lemon",
    "grapefruit", "strawberry", "grape", "kyoho", "shine_muscat", "peach", "pear",
    "persimmon", "cherry", "kiwi", "pineapple", "mango", "papaya", "dragon_fruit",
    "avocado", "melon", "watermelon", "blueberry", "raspberry", "blackberry", "lychee",
    "pomegranate", "fig", "plum", "apricot", "beef", "pork", "chicken_thigh",
    "chicken_breast", "chicken_tender", "chicken_wing_tip", "chicken_drumette",
    "ground_chicken", "ground_pork", "ground_beef", "mixed_ground_meat", "lamb",
    "mutton", "horse_meat", "venison", "boar_meat", "duck", "turkey", "bacon",
    "sausage", "salmon", "salmon_en", "tuna", "bonito", "yellowtail", "young_yellowtail",
    "sea_bream", "mackerel", "sardine", "aji", "sanma", "cod", "flounder", "flatfish",
    "kinmedai", "shirasu", "shishamo", "unagi", "anago", "squid", "octopus", "shrimp",
    "sweet_shrimp", "crab", "scallop", "asari", "shijimi", "hamaguri", "mussel",
    "oyster", "uni", "ikura", "kazunoko", "tobiko", "mentaiko", "egg", "quail_egg",
    "milk", "soy_milk", "fresh_cream", "yogurt", "butter", "margarine", "cream_cheese",
    "mozzarella", "cheddar", "parmesan", "camembert", "gouda", "cottage_cheese",
    "cotton_tofu", "silken_tofu", "atsuage", "aburaage", "koyadofu", "natto", "okara",
    "yuba", "edamame_dup", "soybean", "black_bean", "kintoki_bean", "azuki",
    "lentil", "chickpea", "white_rice", "brown_rice", "multigrain_rice", "mochi_rice",
    "bread", "french_bread", "udon", "soba", "chinese_noodle", "pasta", "rice_noodle",
    "harusame", "oatmeal", "flour", "rice_flour", "wakame", "kombu", "nori", "almond",
    "walnut",
]

CATEGORY_BY_NO: list[tuple[int, int, str]] = [
    (1, 50, "vegetable"),
    (51, 65, "vegetable"),
    (66, 95, "fruit"),
    (96, 115, "meat"),
    (116, 150, "seafood"),
    (151, 152, "meat"),
    (153, 165, "soy_dairy"),
    (166, 180, "soy_dairy"),
    (181, 195, "grain"),
    (196, 198, "vegetable"),
    (199, 200, "fruit"),
]

# Extra receipt aliases (表記ゆれ)
EXTRA_ALIASES: dict[str, list[str]] = {
    "tomato": ["とまと", "トマト"],
    "mini_tomato": ["ミニトマト", "ミニとまと"],
    "onion": ["玉葱", "タマネギ", "たまねぎ"],
    "green_onion": ["ネギ", "ねぎ", "長ネギ"],
    "eggplant": ["なす", "茄子"],
    "cucumber": ["きゅうり", "キュウリ", "胡瓜"],
    "green_pepper": ["ぴーまん", "ピーマン"],
    "spinach": ["ホウレンソウ", "ほうれんそう"],
    "carrot": ["ニンジン", "人参"],
    "daikon": ["だいこん"],
    "potato": ["ジャガイモ", "じゃがいも"],
    "napa": ["はくさい", "ハクサイ"],
    "apple": ["リンゴ", "林檎"],
    "banana": ["ばなな"],
    "mikan": ["ミカン", "蜜柑"],
    "kiwi": ["キウイフルーツ"],
    "salmon": ["さけ", "しゃけ", "サケ", "鮭"],
    "salmon_en": ["サーモン"],
    "tuna": ["まぐろ", "マグロ", "鮪"],
    "mackerel": ["さば", "サバ", "鯖"],
    "aji": ["あじ", "アジ", "鰺"],
    "squid": ["いか", "イカ", "烏賊"],
    "octopus": ["たこ", "タコ", "蛸"],
    "shrimp": ["えび", "エビ", "海老"],
    "egg": ["たまご", "タマゴ", "鶏卵"],
    "milk": ["ぎゅうにゅう", "ギュウニュウ"],
    "mixed_ground_meat": ["合い挽き肉", "合挽き肉", "合い挽"],
    "edamame": ["枝豆", "エダマメ"],
    "edamame_dup": ["枝豆", "エダマメ"],
    "bread": ["食ぱん", "パン"],
    "pasta": ["スパゲッティ", "スパゲティ"],
    "chinese_noodle": ["中華めん", "ラーメン"],
    "white_rice": ["米", "こめ"],
    "flour": ["薄力粉", "強力粉"],
    "natto": ["なっとう"],
    "aburaage": ["あぶらあげ", "油あげ"],
    "maitake_wild": ["舞茸", "マイタケ"],
    # --- レシート表記ゆれ（200件） ---
    "cabbage": ["きゃべつ", "キャベツ"],
    "lettuce": ["れたす", "レタス"],
    "komatsuna": ["こまつな", "コマツナ"],
    "spinach": ["ほうれんそう", "ホウレンソウ"],
    "mizuna": ["みずな", "ミズナ"],
    "shungiku": ["しゅんぎく", "シュンギク"],
    "chingensai": ["ちんげんさい"],
    "broccoli": ["ぶろっこりー"],
    "cauliflower": ["かりふらわー"],
    "mini_tomato": ["みにとまと", "ミニとまと"],
    "eggplant": ["なす", "ナス"],
    "paprika": ["ぱぷりか"],
    "shishito": ["ししとう", "シシトウ"],
    "okra": ["おくら", "オクラ"],
    "goya": ["ゴーヤー", "にがうり"],
    "zucchini": ["ズッキニ", "ずっきーに"],
    "pumpkin": ["かぼちゃ", "カボチャ"],
    "turnip": ["かぶ", "カブ"],
    "burdock": ["ごぼう", "ゴボウ"],
    "lotus_root": ["れんこん", "レンコン"],
    "sweet_potato": ["さつまいも", "サツマイモ"],
    "satoimo": ["さといも", "サトイモ"],
    "nagaimo": ["ながいも", "ナガイモ"],
    "garlic_chive": ["にら", "ニラ"],
    "garlic": ["にんにく", "ニンニク"],
    "ginger": ["しょうが", "ショウガ", "生姜"],
    "celery": ["せろり"],
    "asparagus": ["あすぱら", "アスパラ"],
    "corn": ["とうもろこし", "トウモロコシ", "コーン"],
    "radish": ["らでぃっしゅ", "ラディッシュ"],
    "red_onion": ["あかたまねぎ", "赤玉ねぎ"],
    "coriander": ["パクチー", "ぱくちー", "コリアンダー"],
    "mitsuba": ["みつば", "ミツバ"],
    "oba": ["おおば", "オオバ", "紫蘇"],
    "cress": ["クレソン", "くれそん"],
    "kale": ["ケール", "けーる"],
    "beet": ["ビーツ", "びーつ"],
    "turnip_greens": ["かぶの葉", "カブノハ"],
    "water_spinach": ["からしな", "カラシナ", "空芯菜"],
    "shiitake": ["しいたけ", "シイタケ", "椎茸"],
    "shimeji": ["しめじ", "シメジ"],
    "enoki": ["えのき", "エノキ", "えのきたけ"],
    "eringi": ["エリンギ", "えりんぎ"],
    "maitake": ["まいたけ", "マイタケ", "舞茸"],
    "button_mushroom": ["マッシュルーム", "きのこ"],
    "nameko": ["なめこ", "ナメコ"],
    "wood_ear": ["きくらげ", "キクラゲ"],
    "matsutake": ["まつたけ", "マツタケ", "松茸"],
    "strawberry": ["いちご", "イチゴ", "苺"],
    "grape": ["ぶどう", "ブドウ", "葡萄"],
    "kyoho": ["巨峰", "きょほう"],
    "shine_muscat": ["シャインマスカット", "しゃいんますかっと"],
    "peach": ["もも", "モモ", "桃"],
    "pear": ["なし", "ナシ", "梨"],
    "persimmon": ["柿", "とし", "トシ"],
    "cherry": ["さくらんぼ", "サクランボ", "桜ん坊"],
    "pineapple": ["パイナップル", "ぱいなっぷる"],
    "mango": ["マンゴー", "まんごー"],
    "papaya": ["パパイヤ", "ぱぱいや"],
    "dragon_fruit": ["ドラゴンフルーツ", "ピタヤ"],
    "avocado": ["アボカド", "あぼかど"],
    "melon": ["メロン", "めろん"],
    "watermelon": ["すいか", "スイカ", "西瓜"],
    "blueberry": ["ブルーベリー", "ぶるーべりー"],
    "raspberry": ["ラズベリー", "らずべりー"],
    "blackberry": ["ブラックベリー"],
    "lychee": ["ライチ", "らいち", "レイシ"],
    "pomegranate": ["ザクロ", "ざくろ", "石榴"],
    "fig": ["イチジク", "いちじく", "無花果"],
    "plum": ["プラム", "すもも", "スモモ"],
    "apricot": ["アプリコット", "あんず", "杏"],
    "beef": ["ぎゅうにく", "ギュウニク", "牛肉"],
    "pork": ["ぶたにく", "ブタニク", "豚肉"],
    "chicken_thigh": ["鶏もも", "鶏モモ", "チキンモモ", "もも肉", "トリカワ"],
    "chicken_breast": ["鶏むね", "鶏ムネ", "むね肉", "胸肉"],
    "chicken_tender": ["ささみ", "ササミ", "鶏ササミ"],
    "chicken_wing_tip": ["手羽", "てば", "テバ", "手羽先"],
    "chicken_drumette": ["手羽元", "てばもと"],
    "ground_chicken": ["鶏ひき", "チキンミンチ", "鶏ミンチ"],
    "ground_pork": ["豚ひき", "ポークミンチ", "豚ミンチ"],
    "ground_beef": ["牛ひき", "ビーフミンチ", "牛ミンチ"],
    "lamb": ["ラム", "らむ"],
    "bacon": ["ベーコン", "べーこん"],
    "sausage": ["ソーセージ", "そーせーじ", "ウインナー"],
    "bonito": ["かつお", "カツオ", "鰹"],
    "yellowtail": ["ぶり", "ブリ", "鰤"],
    "young_yellowtail": ["はまち", "ハマチ", "葉山"],
    "sea_bream": ["たい", "タイ", "鯛"],
    "sardine": ["いわし", "イワシ", "鰯"],
    "sanma": ["さんま", "サンマ", "秋刀魚"],
    "cod": ["たら", "タラ", "鱈"],
    "flounder": ["ひらめ", "ヒラメ", "平目"],
    "flatfish": ["カレイ", "かれい", "鰈"],
    "kinmedai": ["きんめ", "キンメ"],
    "shirasu": ["しらす", "シラス", "白子"],
    "shishamo": ["ししゃも", "シシャモ", "柳葉魚"],
    "unagi": ["うなぎ", "ウナギ", "鰻"],
    "anago": ["あなご", "アナゴ", "穴子"],
    "octopus": ["たこ", "タコ", "蛸"],
    "sweet_shrimp": ["甘えび", "アマエビ"],
    "crab": ["かに", "カニ", "蟹"],
    "scallop": ["ほたて", "ホタテ", "帆立"],
    "asari": ["あさり", "アサリ", "浅利"],
    "shijimi": ["しじみ", "シジミ", "蜆"],
    "hamaguri": ["はまぐり", "ハマグリ", "蛤"],
    "mussel": ["ムール貝", "むーるがい"],
    "oyster": ["かき", "カキ", "牡蠣"],
    "uni": ["うに", "ウニ", "雲丹"],
    "ikura": ["いくら", "イクラ", "鮭卵"],
    "kazunoko": ["数の子", "かずのこ"],
    "tobiko": ["とびこ", "トビコ", "飛子"],
    "mentaiko": ["明太", "めんたい", "明太子"],
    "quail_egg": ["うずら", "ウズラ", "うずら卵"],
    "soy_milk": ["豆乳", "とうにゅう"],
    "fresh_cream": ["生クリーム", "ナマクリーム"],
    "yogurt": ["ヨーグルト", "ヨーグルト食品"],
    "margarine": ["マーガリン", "まーがりん"],
    "cream_cheese": ["クリームチーズ"],
    "mozzarella": ["モッツァレラ", "もっつぁれら"],
    "cheddar": ["チェダー", "ちぇだー"],
    "parmesan": ["パルメザン", "ぱるめざん"],
    "camembert": ["カマンベール", "かまんべーる"],
    "gouda": ["ゴーダ", "ごーだ"],
    "cottage_cheese": ["カッテージチーズ"],
    "cotton_tofu": ["豆腐", "とうふ", "木綿"],
    "silken_tofu": ["絹ごし", "絹豆腐", "きぬごし"],
    "atsuage": ["厚揚げ", "あつあげ"],
    "koyadofu": ["高野豆腐", "こうやどうふ", "凍り豆腐"],
    "okara": ["おから", "オカラ"],
    "yuba": ["ゆば", "ユバ", "湯葉"],
    "soybean": ["大豆", "だいず", "ダイズ"],
    "black_bean": ["黒豆", "くろまめ"],
    "kintoki_bean": ["金時", "きんとき"],
    "azuki": ["あずき", "アズキ", "小豆"],
    "lentil": ["レンズ豆", "れんずまめ"],
    "chickpea": ["ひよこ豆", "ヒヨコマメ"],
    "brown_rice": ["玄米", "げんまい"],
    "multigrain_rice": ["雑穀", "ざっこく"],
    "mochi_rice": ["もち米", "モチゴメ"],
    "bread": ["食パン", "しょくぱん", "パン"],
    "french_bread": ["フランスパン", "バゲット", "棒パン"],
    "udon": ["ウドン", "うどん"],
    "soba": ["ソバ", "そば", "蕎麦"],
    "rice_noodle": ["ビーフン", "米線"],
    "harusame": ["春雨", "はるさめ"],
    "oatmeal": ["オートミール", "おーとみーる"],
    "rice_flour": ["米粉", "こめこ"],
    "wakame": ["わかめ", "ワカメ", "若布"],
    "kombu": ["こんぶ", "コンブ", "昆布"],
    "nori": ["のり", "ノリ", "海苔"],
    "almond": ["アーモンド", "あーもんど"],
    "walnut": ["くるみ", "クルミ", "胡桃"],
}


def category_for_no(no: int) -> str:
    for start, end, cat in CATEGORY_BY_NO:
        if start <= no <= end:
            return cat
    return "vegetable"


def katakana_to_hiragana(text: str) -> str:
    out = []
    for ch in text:
        code = ord(ch)
        if 0x30A1 <= code <= 0x30F6:
            out.append(chr(code - 0x60))
        else:
            out.append(ch)
    return "".join(out)


def hiragana_to_katakana(text: str) -> str:
    out = []
    for ch in text:
        code = ord(ch)
        if 0x3041 <= code <= 0x3096:
            out.append(chr(code + 0x60))
        else:
            out.append(ch)
    return "".join(out)


def strip_paren(name: str) -> str:
    return re.sub(r"[（(].*?[）)]", "", name).strip()


def alias_variants(name: str) -> list[str]:
    base = strip_paren(name)
    variants = {name, base}
    if base != name:
        variants.add(name.replace("（", "(").replace("）", ")"))

    for text in list(variants):
        variants.add(katakana_to_hiragana(text))
        variants.add(hiragana_to_katakana(text))
        variants.add(unicodedata.normalize("NFKC", text))

    variants.discard(name)
    return sorted(v for v in variants if v and v != name)


def canonical_name(name: str) -> str:
    cleaned = strip_paren(name)
    return cleaned or name


def image_source_slug(slug: str) -> str:
    if slug == "edamame_dup":
        return "edamame"
    return slug


def main() -> None:
    rows = json.loads(LIST_PATH.read_text(encoding="utf-8"))
    if len(rows) != 200:
        raise SystemExit(f"expected 200 rows, got {len(rows)}")
    if len(SLUGS) != 200:
        raise SystemExit(f"expected 200 slugs, got {len(SLUGS)}")

    entries = []
    for row, slug in zip(rows, SLUGS, strict=True):
        no = row["no"]
        raw_name = row["name"].strip()
        name = canonical_name(raw_name)
        aliases = alias_variants(raw_name)
        aliases.extend(EXTRA_ALIASES.get(slug, []))
        # dedupe aliases
        alias_set = []
        seen = {name}
        for a in aliases:
            if a not in seen:
                seen.add(a)
                alias_set.append(a)

        entries.append(
            {
                "no": no,
                "id": slug,
                "name": name,
                "aliases": alias_set,
                "category": category_for_no(no),
                "imageFile": f"ing_{image_source_slug(slug)}.jpg",
                "imageKey": f"asset://ing_{image_source_slug(slug)}",
            }
        )

    OUT_META_JSON.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    lines = [
        "/** レシート読み取り対応食材カタログ（Excel 200件・自動生成） */",
        "export type IngredientCategory =",
        "  | 'grain'",
        "  | 'vegetable'",
        "  | 'meat'",
        "  | 'seafood'",
        "  | 'soy_dairy'",
        "  | 'fruit';",
        "",
        "export type IngredientCatalogEntry = {",
        "  /** asset ファイル名（ing_rice.jpg 等） */",
        "  id: string;",
        "  /** 表示名（正規名） */",
        "  name: string;",
        "  /** レシート表記ゆれ */",
        "  aliases: string[];",
        "  category: IngredientCategory;",
        "};",
        "",
        "export const INGREDIENT_CATALOG: IngredientCatalogEntry[] = [",
    ]

    for e in entries:
        alias_json = json.dumps(e["aliases"], ensure_ascii=False)
        lines.append(
            f"  {{ id: '{e['id']}', name: '{e['name']}', aliases: {alias_json}, category: '{e['category']}' }},"
        )

    lines.append("];")
    lines.append("")
    OUT_CATALOG_TS.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {len(entries)} entries -> {OUT_CATALOG_TS.name}")


if __name__ == "__main__":
    main()
