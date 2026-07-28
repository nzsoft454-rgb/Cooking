# スマート食材管理＆AIレシピ生成アプリ（モック）

Expo / React Native の仮アプリです。Web と Android で同じソースを共有します。

## 起動（Web）

```bash
cd mock
npm install
npm run web
```

## 起動（Android）

ルートから:

```bash
cd cookingApp
npm install --prefix mock   # 初回のみ
npm run android
```

または `mock/` から:

```bash
npm run android:dev
```

Android Studio で開く場合は **`../android`** を開いてください。詳細は [android/README.md](../android/README.md) を参照。

## 画面対応

| ID | 画面 |
|---|---|
| A-001 | カメラ（撮影モック） |
| A-001-a | 撮影確認 |
| A-001-b | AI分析中 |
| A-001-c | 分析結果 |
| A-001-d | 食材名手動修正 |
| A-001-e | 調理条件 |
| B-001 | 冷蔵庫（グリッド） |
| B-001-a | 食材編集・削除 |
| C-001 | レシピ履歴 |
| C-001-a | レシピ生成中 |
| C-001-b | レシピ詳細（チェック・タイマー・お気に入り・メモ・シェア） |
| D-001〜 | 設定一式 |

## 補足

- データは AsyncStorage に保存
- 食材撮影はダミー画像（実カメラは後続）
- ネイティブ Android プロジェクトは `android/`（Expo prebuild 出力）
