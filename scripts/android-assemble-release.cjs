/**
 * Release APK ビルド（JS バンドル同梱・Metro 不要）
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const androidRoot = path.join(repoRoot, 'android');
const distDir = path.join(repoRoot, 'dist');
const sourceApk = path.join(
  androidRoot,
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);
const destApk = path.join(distDir, 'CookingMock-release.apk');

if (process.platform === 'win32' && !process.env.GRADLE_USER_HOME) {
  process.env.GRADLE_USER_HOME = 'C:\\gradle';
  fs.mkdirSync(process.env.GRADLE_USER_HOME, { recursive: true });
}

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
console.log('Release APK をビルド中（数分〜20分程度）…');

const result = spawnSync(`${gradlew} assembleRelease`, {
  stdio: 'inherit',
  shell: true,
  cwd: androidRoot,
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!fs.existsSync(sourceApk)) {
  console.error(`APK が見つかりません: ${sourceApk}`);
  process.exit(1);
}

fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(sourceApk, destApk);
const sizeMb = (fs.statSync(destApk).size / (1024 * 1024)).toFixed(1);
console.log(`\nAPK 出力: ${destApk} (${sizeMb} MB)`);
