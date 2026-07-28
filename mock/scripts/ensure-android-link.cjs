/**
 * Expo CLI / Gradle 用リンクを張る:
 * - mock/android -> ../android（expo run:android 用）
 * - android/node_modules -> ../mock/node_modules（Gradle の node 解決用）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mockRoot = path.join(__dirname, '..');
const repoRoot = path.join(mockRoot, '..');
const androidRoot = path.join(repoRoot, 'android');
const mockAndroidLink = path.join(mockRoot, 'android');
const androidNodeModulesLink = path.join(androidRoot, 'node_modules');
const repoNodeModulesLink = path.join(repoRoot, 'node_modules');
const mockNodeModules = path.join(mockRoot, 'node_modules');

function resolveTarget(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

function ensureLink(linkPath, targetPath, label) {
  const absTarget = path.resolve(targetPath);
  const absLink = path.resolve(linkPath);

  if (!fs.existsSync(absTarget)) {
    console.error(`${label}: リンク先が見つかりません: ${absTarget}`);
    process.exit(1);
  }

  if (fs.existsSync(absLink)) {
    if (resolveTarget(absLink) === resolveTarget(absTarget)) {
      return;
    }
    console.error(`${label}: 既存のパスが別の場所を指しています: ${absLink}`);
    console.error('手動で削除してから再実行してください。');
    process.exit(1);
  }

  if (process.platform === 'win32') {
    execSync(`cmd /c mklink /J "${absLink}" "${absTarget}"`, { stdio: 'inherit' });
  } else {
    fs.symlinkSync(absTarget, absLink, 'dir');
  }

  console.log(`${label}: ${absLink} -> ${absTarget}`);
}

ensureLink(mockAndroidLink, androidRoot, 'mock/android');
ensureLink(androidNodeModulesLink, mockNodeModules, 'android/node_modules');
ensureLink(repoNodeModulesLink, mockNodeModules, 'repo/node_modules');
