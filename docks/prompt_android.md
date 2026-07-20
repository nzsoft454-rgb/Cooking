# モックアップ（Expo）から Android Studio プロジェクト（androi/）への書き出し指示書

あなたは優秀な Android / React Native エンジニアです。
共有済みの『開発プロセスおよび基本ルール（docks/development_flow.md）』の【ステップ 2】に基づき、現在 `mock/` 内で React Native (Expo) として動作しているWebモックアップの資産をベースに、Android Studioで起動・ビルド確認ができるネイティブプロジェクトを `androi/` ディレクトリ内に構築・設定してください。

---

## 1. 開発・移植の方針
* **Androidプロジェクトのエクスポート:** Expoの `npx expo prebuild`（または旧 eject）の仕組み、あるいはAndroid Studio用のプロジェクト構成を模し、`androi/` ディレクトリの中にAndroid Studioでそのまま [Open] できるファイル群（`build.gradle`, `src/main/`, `AndroidManifest.xml` 等）を生成・準備します。
* **仕様のネイティブ最適化:** `mock/` で検証した以下の仕様が、Android Studio経由でビルドした実機・エミュレータでも完全に動作するよう、ネイティブコードや設定ファイルに反映させてください。

---

## 2. 実装・修正要件（ネイティブ化の反映）

### ① データの保存（AsyncStorageのネイティブ動作）
* Androidのローカル（SQLite等のネイティブ領域）にデータが保存されるよう、必要な依存関係（`@react-native-async-storage/async-storage` などのネイティブモジュール設定）が `androi/` 側のビルド設定に正しく含まれていることを確認してください。

### ② 画面のネイティブ調整
* Android Studioでの起動時、アプリがAndroidのステータスバーやナビゲーションバーと被らないよう、画面上部の余白（インセット）の設定が正しく反映される設定にしてください。

### ③ 削除時の確認ダイアログ（Androidネイティブ化）
* `Platform.OS === 'android'` のルートが通り、Web用の `window.confirm` ではなく、Androidネイティブの `Alert.alert()`（またはネイティブのダイアログ）が確実に呼び出されるようにコードを確定させてください。

---

## 3. 出力および作業指示

1. `mock/` のソースをもとに、`androi/` ディレクトリ内に生成されるべき主要なAndroid構成ファイル（`MainActivity.kt`、`AndroidManifest.xml`、各種 `gradle` 設定など）のコード、またはそれらを生成するための具体的なコマンド手順を出力してください。
2. 出力後、ユーザーが **Android Studioを開いて `androi/` ディレクトリをインポートし、エミュレータ等で【ステップ 3（起動確認）】へ進むための具体的な操作手順**を分かりやすく解説してください。