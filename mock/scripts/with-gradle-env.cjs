/**
 * Windows の 260 文字パス制限を避けるため、短い Gradle キャッシュを使う。
 * 用法: node scripts/with-gradle-env.cjs <command...>
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform === 'win32' && !process.env.GRADLE_USER_HOME) {
  process.env.GRADLE_USER_HOME = 'C:\\gradle';
  fs.mkdirSync(process.env.GRADLE_USER_HOME, { recursive: true });
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('usage: node scripts/with-gradle-env.cjs <command> [args...]');
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
  env: process.env,
});

process.exit(result.status ?? 1);
