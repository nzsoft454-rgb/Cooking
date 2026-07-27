# Cooking Mock — Android プロジェクト

`mock/` の Expo / React Native アプリを Android ネイティブでビルドするためのプロジェクトです。  
JavaScript ソースと `node_modules` は **`../mock`** を参照します。

## 前提

- [Node.js](https://nodejs.org/)（LTS 推奨）
- [Android Studio](https://developer.android.com/studio)（SDK / エミュレータ）
- `mock/` で `npm install` 済みであること

```bash
cd ../mock
npm install
node scripts/ensure-android-link.cjs
```

`local.properties` に SDK パスを設定してください（未設定時はビルドできません）:

```bash
copy local.properties.example local.properties
# sdk.dir を編集
```

## Android Studio で開く

1. Android Studio → **Open**
2. このフォルダ（`cookingApp/android`）を選択
3. Gradle Sync が完了するまで待つ
4. エミュレータまたは実機を選択して **Run**

デバッグビルドでは Metro バンドラーが必要です。別ターミナルで:

```bash
cd ../mock
npm start
```

## コマンドライン

### ルートから（推奨）

```bash
cd cookingApp
npm install --prefix mock   # 初回のみ
npm run android             # Metro 起動 + ビルド + 実機インストール
```

### mock から

```bash
cd mock
npm run android:dev
```

初回は `mock/android` と `android/node_modules` へのジャンクションを自動作成します。手動で行う場合:

```bash
cd mock
node scripts/ensure-android-link.cjs
```

### Gradle のみ

```bash
cd android
.\gradlew.bat assembleDebug   # Windows
./gradlew assembleDebug       # macOS / Linux
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

## 構成

| パス | 内容 |
|------|------|
| `cookingApp/mock/` | JS/TS ソース、`package.json`、`node_modules` |
| `cookingApp/android/` | Gradle / Kotlin ネイティブプロジェクト（本ディレクトリ） |
| `cookingApp/mock/android` | 開発用ジャンクション（git 管理外） |
| `cookingApp/android/node_modules` | `mock/node_modules` へのジャンクション（git 管理外） |
| `cookingApp/node_modules` | `mock/node_modules` へのジャンクション（Gradle autolinking 用・git 管理外） |

## 注意

- `mock/` で `npx expo prebuild --platform android` を実行すると `mock/android` 配下に上書き生成される可能性があります。ルートの `android/` を使う場合は prebuild 後にファイルを移すか、ジャンクションを張り直してください。
- アプリ ID: `com.cookingapp.mock`
- カメラ撮影はモック段階のまま（ダミー画像）。実カメラ対応は後続タスクです。
- **Windows**: ネイティブビルドでパス長エラー（260 文字超）が出る場合は、プロジェクトを短いパス（例: `C:\dev\cookingApp`）に置くか、[長いパスの有効化](https://learn.microsoft.com/ja-jp/windows/win32/fileio/maximum-file-path-limitation)を検討してください。
