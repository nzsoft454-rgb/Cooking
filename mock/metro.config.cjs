const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-i18next v17 の ESM (dist/es/*.js) が Metro で解決できないため CommonJS を使う
config.resolver.unstable_enablePackageExports = false;

// Android ネイティブビルド中に .cxx が消えて Metro の watcher が落ちるのを防ぐ
config.resolver.blockList = [
  /.*[/\\]android[/\\]\.cxx[/\\].*/,
  /.*[/\\]android[/\\]build[/\\].*/,
  /.*[/\\]\.venv-img[/\\].*/,
];

module.exports = config;
