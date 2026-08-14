const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFile } = require('child_process');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

async function writeQrHtml(url) {
  const htmlPath = path.join(__dirname, '..', 'expo-go-qr.html');
  const dataUri = await qrcode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 260,
  });
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Expo Go QR — CookingMock</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #E9EEF1; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }
    .card { background: #fff; border-radius: 12px; padding: 32px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.08); max-width: 360px; }
    h1 { font-size: 18px; margin: 0 0 8px; color: #1a1a1a; }
    p { color: #666; font-size: 13px; margin: 0 0 20px; line-height: 1.5; }
    img { width: 260px; height: 260px; border: 1px solid #ddd; border-radius: 8px; }
    code { display: block; margin-top: 16px; font-size: 12px; word-break: break-all; color: #2BB5A0; background: #f5f8fa; padding: 10px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>CookingMock — Expo Go</h1>
    <p>Expo Go アプリで QR をスキャン<br>または URL を手入力</p>
    <img src="${dataUri}" alt="Expo Go QR" />
    <code>${url}</code>
  </div>
</body>
</html>`;
  fs.writeFileSync(htmlPath, html, 'utf8');
  return htmlPath;
}

function openQrPage(htmlPath) {
  if (process.platform === 'win32') {
    execFile('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Start-Process -FilePath '${htmlPath.replace(/'/g, "''")}'`,
    ], () => {});
    return;
  }
  if (process.platform === 'darwin') {
    spawn('open', [htmlPath], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  spawn('xdg-open', [htmlPath], { detached: true, stdio: 'ignore' }).unref();
}

async function showExpoQr(port = '8081') {
  const url = `exp://${getLanIp()}:${port}`;
  console.log('\n========================================');
  console.log('  Expo Go — QRコード / 接続URL');
  console.log('========================================\n');
  qrcodeTerminal.generate(url, { small: true });
  console.log(`\n  ${url}\n`);
  console.log('  ※ PC とスマホを同じ Wi‑Fi に接続してください');
  console.log('========================================\n');
  const htmlPath = await writeQrHtml(url);
  console.log(`  QR ページ: ${htmlPath}\n`);
  openQrPage(htmlPath);
  return url;
}

module.exports = { showExpoQr, getLanIp, writeQrHtml, openQrPage };

if (require.main === module) {
  showExpoQr(process.env.EXPO_PORT || '8081').catch((err) => {
    console.error('[show-qr]', err);
    process.exit(1);
  });
}
