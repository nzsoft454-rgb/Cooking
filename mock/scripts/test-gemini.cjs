/**
 * Gemini API 接続テスト（エラー内容のみ表示、キーは出力しない）
 * 用法: node scripts/test-gemini.cjs
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const name = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (name && !(name in process.env)) process.env[name] = value;
  }
}

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error('EXPO_PUBLIC_GEMINI_API_KEY is not set in mock/.env');
  process.exit(1);
}

const models = [
  process.env.EXPO_PUBLIC_GEMINI_TEXT_MODEL,
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash',
].filter(Boolean);

async function tryModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Reply with OK only' }] }],
    }),
  });
  const text = await response.text();
  return { model, status: response.status, body: text.slice(0, 400) };
}

(async () => {
  for (const model of [...new Set(models)]) {
    const result = await tryModel(model);
    console.log(`\n--- ${result.model} ---`);
    console.log('status:', result.status);
    console.log('body:', result.body);
    if (result.status === 200) {
      console.log('\nSuccess with model:', result.model);
      process.exit(0);
    }
  }
  process.exit(1);
})();
