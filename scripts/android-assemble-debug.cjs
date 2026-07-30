/**
 * Debug APK ビルド（Windows パス長対策付き）
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const androidRoot = path.join(repoRoot, 'android');

if (process.platform === 'win32' && !process.env.GRADLE_USER_HOME) {
  process.env.GRADLE_USER_HOME = 'C:\\gradle';
  fs.mkdirSync(process.env.GRADLE_USER_HOME, { recursive: true });
}

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const result = spawnSync(`${gradlew} assembleDebug`, {
  stdio: 'inherit',
  shell: true,
  cwd: androidRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
