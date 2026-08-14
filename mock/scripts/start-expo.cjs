const { spawn } = require('child_process');
const path = require('path');
const { showExpoQr } = require('./show-qr.cjs');

(async () => {
  await showExpoQr(process.env.EXPO_PORT || '8081');
})();

const env = { ...process.env };
delete env.CI;
delete env.EXPO_NO_QR;

const child = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env,
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => process.exit(code ?? 0));
