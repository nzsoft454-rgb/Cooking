# Cooking App

スマート食材管理＆AIレシピ生成アプリ（モック）のリポジトリです。

## 構成

| ディレクトリ | 説明 |
|-------------|------|
| `mock/` | Expo / React Native アプリ（Web・Android 共通ソース） |
| `android/` | Android Studio 用ネイティブプロジェクト |
| `docks/` | 開発ドキュメント |

## クイックスタート

### Web（ブラウザ）

```bash
cd mock
npm install
npm run web
```

### Android

```bash
cd mock
npm install
node scripts/ensure-android-link.cjs   # 初回のみ
npm run android:dev
```

Android Studio では **`android/`** フォルダを開いてください。  
詳細は [android/README.md](android/README.md) を参照。

## 開発フロー

[docks/development_flow.md](docks/development_flow.md)
