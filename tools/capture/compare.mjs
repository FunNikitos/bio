#!/usr/bin/env node
// Сверка нашего рендера с эталонными скриншотами захвата.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { createBioApp } from '../../server/app.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

const SCALE = { desktop: 2, phone: 2 };
const VIEWPORT = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.0.0 Safari/537.36';

function args() {
  const out = { viewports: ['desktop', 'phone'], threshold: 1.5, masks: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case '--slug':
        out.slug = argv[++i];
        break;
      case '--ref':
        out.ref = argv[++i];
        break;
      case '--viewports':
        out.viewports = argv[++i].split(',');
        break;
      case '--threshold':
        out.threshold = Number(argv[++i]);
        break;
      case '--mask':
        out.masks.push(...argv[++i].split(',').map((v) => v.trim()));
        break;
      case '--out':
        out.out = argv[++i];
        break;
      default:
        throw new Error(`неизвестный аргумент ${argv[i]}`);
    }
  }
  return out;
}

async function startApp() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bio-compare-'));
  const { server } = await createBioApp({ dataDir, distDir: path.join(root, 'web', 'dist'), setupToken: 'COMPARE-CODE' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const setup = await fetch(`${baseUrl}/api/admin/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setupCode: 'COMPARE-CODE', password: 'compare-pass' })
  });
  if (!setup.ok) throw new Error(`setup ${setup.status}`);
  const cookie = setup.headers.get('set-cookie').split(';')[0];
  return { server, baseUrl, cookie, dataDir };
}

function regionStats(diff, regions, width) {
  const rows = [];
  for (const region of regions) {
    const x0 = Math.max(0, Math.round(region.rect.x));
    const y0 = Math.max(0, Math.round(region.rect.y));
    const x1 = Math.min(width, Math.round(region.rect.x + region.rect.w));
    const y1 = Math.min(diff.height, Math.round(region.rect.y + region.rect.h));
    let total = 0;
    let bad = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * width + x) * 4;
        total += 1;
        if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) bad += 1;
      }
    }
    if (total > 0) rows.push({ role: region.role, anchor: region.id, mismatch: +((bad / total) * 100).toFixed(2) });
  }
  return rows.sort((a, b) => b.mismatch - a.mismatch);
}

async function main() {
  const opts = args();
  if (!opts.slug) throw new Error('нужен --slug (или preset через data/capture/<slug>)');
  const refDir = opts.ref || path.join(root, 'data', 'capture', opts.slug);
  const outDir = opts.out || path.join(root, 'data', 'capture', opts.slug, 'diff');
  await fs.mkdir(outDir, { recursive: true });

  const presetPath = path.join(root, 'schema', 'presets', `${opts.slug}.v1.json`);
  const preset = JSON.parse(await fs.readFile(presetPath, 'utf8'));
  const report = JSON.parse(await fs.readFile(path.join(refDir, 'report.json'), 'utf8'));

  await fs.access(path.join(root, 'web', 'dist', 'index.html')).catch(() => {
    throw new Error('нет web/dist — сначала npm run build');
  });

  const app = await startApp();
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const name of opts.viewports) {
      const spec = VIEWPORT[name];
      const scale = SCALE[name];
      if (!spec) continue;

      const context = await browser.newContext({
        userAgent: UA,
        locale: 'ru-RU',
        colorScheme: 'dark',
        reducedMotion: 'no-preference',
        deviceScaleFactor: scale
      });

      const save = await fetch(`${app.baseUrl}/api/admin/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: app.cookie },
        body: JSON.stringify(preset)
      });
      if (!save.ok) throw new Error(`сохранение черновика ${save.status}: ${await save.text()}`);
      const pub = await fetch(`${app.baseUrl}/api/admin/publish`, { method: 'POST', headers: { Cookie: app.cookie } });
      if (!pub.ok) throw new Error(`публикация ${pub.status}`);

      const page = await context.newPage();
      await page.setViewportSize(spec);
      await page.goto(app.baseUrl, { waitUntil: 'load' });
      await page.waitForSelector('.bio-card, .bio-splash, .profile-root, body', { timeout: 15000 }).catch(() => null);
      const trigger = page.locator('.splash-trigger, .splash-btn').first();
      if (await trigger.count()) {
        await trigger.click({ timeout: 5000 }).catch(() => null);
        await page.waitForSelector('.bio-splash', { state: 'detached', timeout: 5000 }).catch(() => null);
      } else {
        await page.mouse.click(spec.width / 2, spec.height / 2).catch(() => null);
      }
      if (await page.locator('.bio-splash').count()) {
        await page.keyboard.press('Enter').catch(() => null);
        await page.evaluate(() => document.querySelector('.bio-splash')?.remove()).catch(() => null);
      }
      await page.waitForTimeout(2500);
      const shotPath = path.join(outDir, `web-${name}.png`);
      await page.screenshot({ path: shotPath });
      await page.close();
      await context.close();

      const refPath = path.join(refDir, `shot-${name}.png`);
      const expected = PNG.sync.read(await fs.readFile(refPath));
      const actual = PNG.sync.read(await fs.readFile(shotPath));
      if (process.env.CAPTURE_DEBUG) {
        const crypto = await import('node:crypto');
        const hash = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
        console.log('debug files', name, hash(expected.data), hash(actual.data), refPath === shotPath);
      }
      if (expected.width !== actual.width || expected.height !== actual.height) {
        results.push({
          viewport: name,
          error: `размеры не совпали: эталон ${expected.width}x${expected.height}, рендер ${actual.width}x${actual.height}`
        });
        continue;
      }

      for (const mask of opts.masks) {
        const [role, id] = mask.split(':');
        for (const anchor of report.anchors || []) {
          if (anchor.role !== role || (id && anchor.id !== id)) continue;
          const x0 = Math.max(0, Math.round(anchor.rect.x * scale));
          const y0 = Math.max(0, Math.round(anchor.rect.y * scale));
          const x1 = Math.min(expected.width, Math.round((anchor.rect.x + anchor.rect.w) * scale));
          const y1 = Math.min(expected.height, Math.round((anchor.rect.y + anchor.rect.h) * scale));
          for (const png of [expected, actual]) {
            for (let y = y0; y < y1; y += 1) {
              for (let x = x0; x < x1; x += 1) {
                const i = (y * png.width + x) * 4;
                png.data[i] = 128;
                png.data[i + 1] = 128;
                png.data[i + 2] = 128;
                png.data[i + 3] = 255;
              }
            }
          }
        }
      }

      const diff = new PNG({ width: expected.width, height: expected.height });
      const bad = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.12 });
      if (process.env.CAPTURE_DEBUG) console.log('debug', name, 'bad', bad, 'total', expected.width * expected.height);
      const mismatch = +((bad / (expected.width * expected.height)) * 100).toFixed(2);
      await fs.writeFile(path.join(outDir, `diff-${name}.png`), PNG.sync.write(diff));

      const regions = (report.anchors || [])
        .filter((a) => !a.missing)
        .map((a) => ({ role: a.role, id: a.id, rect: { x: a.rect.x * scale, y: a.rect.y * scale, w: a.rect.w * scale, h: a.rect.h * scale } }));

      results.push({ viewport: name, mismatch, pass: mismatch <= opts.threshold, regions: regionStats(diff, regions, expected.width) });
    }
  } finally {
    await browser.close();
    app.server.close();
    await fs.rm(app.dataDir, { recursive: true, force: true });
  }

  const failed = results.filter((r) => r.error || !r.pass);
  await fs.writeFile(path.join(outDir, 'compare.json'), JSON.stringify({ threshold: opts.threshold, results }, null, 2));
  for (const r of results) {
    if (r.error) console.log(`${r.viewport}: ошибка — ${r.error}`);
    else console.log(`${r.viewport}: расхождение ${r.mismatch}% (порог ${opts.threshold}%) — ${r.pass ? 'ok' : 'выше порога'}`);
    if (r.regions?.length) console.log('  худшие зоны: ' + r.regions.slice(0, 4).map((g) => `${g.role}#${g.anchor} ${g.mismatch}%`).join(', '));
  }
  console.log(`диффы: ${path.relative(root, outDir)}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
