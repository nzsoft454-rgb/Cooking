/**
 * Gemini 画像解析と同条件の API テスト
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
  console.error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
  process.exit(1);
}

const FOOD_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'STRING' },
          confidence: { type: 'STRING' },
          attribute: { type: 'STRING' },
        },
        required: ['name'],
      },
    },
  },
  required: ['items'],
};

const PROMPT = `JSON only: {"items":[{"name":"トマト","quantity":"2個","confidence":"high","attribute":"fresh"}]}`;

async function testCase(label, generationConfig) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: PROMPT }] }],
      generationConfig,
    }),
  });
  const body = await response.text();
  console.log(`\n=== ${label} ===`);
  console.log('status:', response.status);
  console.log('body:', body.slice(0, 600));
  return response.status;
}

(async () => {
  await testCase('plain', { temperature: 0.2 });
  await testCase('json only', {
    temperature: 0.2,
    responseMimeType: 'application/json',
  });
  await testCase('json + schema', {
    temperature: 0.2,
    responseMimeType: 'application/json',
    responseSchema: FOOD_SCHEMA,
  });
})();
