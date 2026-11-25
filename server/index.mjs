import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBioApp } from './app.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = process.env.BIO_DATA_DIR || path.join(rootDir, 'data');
const distDir = path.join(rootDir, 'web', 'dist');
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';

const { server, initialSetupCode } = await createBioApp({
  dataDir,
  distDir,
  setupToken: process.env.BIO_SETUP_TOKEN || ''
});

server.listen(port, host, () => {
  console.log(`bio server listening on http://${host}:${port}`);
  if (initialSetupCode) {
    console.log(`==================================================`);
    console.log(`ПЕРВИЧНАЯ НАСТРОЙКА ВЛАДЕЛЬЦА: http://${host}:${port}/admin`);
    console.log(`ОДНОРАЗОВЫЙ КОД УСТАНОВКИ: ${initialSetupCode}`);
    console.log(`==================================================`);
  }
});
