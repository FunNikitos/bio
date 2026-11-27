#!/usr/bin/env node
// Захват оформления страницы в пресет profile.v1.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { dumpAnchors, pageInventory, resolveAnchors } from './anchors.mjs';
import { createHarvester } from './assets.mjs';
import { mapReport } from './mapping.mjs';
import { assertValid, buildPreset } from './preset.mjs';
import { recordCanvases } from './record.mjs';
import { saveSnapshot } from './snapshot.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2 },
  phone: { width: 390, height: 844, deviceScaleFactor: 3 }
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.0.0 Safari/537.36';

function parseArgs(argv) {
  const args = { viewports: ['desktop', 'phone'], timeout: 45000, openWait: 2500, record: true, full: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (!value) throw new Error(`нет значения для ${arg}`);
      return value;
    };
    switch (arg) {
      case '--url':
        args.url = next();
        break;
      case '--slug':
        args.slug = next();
        break;
      case '--site':
        args.site = next();
        break;
      case '--handle':
        args.handle = next();
        break;
      case '--viewports':
        args.viewports = next().split(',').map((v) => v.trim());
        break;
      case '--timeout':
        args.timeout = Number(next());
        break;
      case '--open':
        args.open = next();
        break;
      case '--open-wait':
        args.openWait = Number(next());
        break;
      case '--headed':
        args.headed = true;
        break;
      case '--full':
        args.full = true;
        break;
      case '--no-record':
        args.record = false;
        break;
      case '--out':
        args.out = next();
        break;
      case '--help':
        args.help = true;
        break;
      default:
        throw new Error(`неизвестный аргумент ${arg}`);
    }
  }
  return args;
}

const HELP = `Захват чужого оформления в пресет bio.

  node tools/capture/cli.mjs --url <адрес> [--slug <имя>] [--site <площадка>] [--handle <ник>]

  --url          страница профиля (обязательно)
  --slug         имя пресета и папки ассетов (по умолчанию site-handle)
  --viewports    desktop,phone (по умолчанию оба)
  --open         CSS-селектор кнопки входа/сплэша, если автоклик не сработал
  --open-wait    пауза после входа, мс (по умолчанию 2500)
  --timeout      таймаут навигации, мс (по умолчанию 45000)
  --headed       показать браузер (нужно для Cloudflare/Vercel)
  --full         сохранить полную страницу, а не вьюпорт
  --no-record    не записывать canvas
  --out          каталог результата (по умолчанию data/capture/<slug>)

Результат: <out>/report.json, скриншоты, ассеты, schema/presets/<slug>.v1.json.
`;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9а-я._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function dismissSplash(page, args, desktop) {
  const pre = await page.evaluate(resolveAnchors);
  const splashText = pre.splashText || '';
  const splashAnchor = pre.anchors.find((a) => a.role === 'splash') || null;
  if (desktop) await page.screenshot({ path: path.join(args.out, 'shot-desktop-splash.png') }).catch(() => null);

  const stillCovered = async () => {
    const splash = splashAnchor;
    if (!splash) return false;
    return page
      .evaluate((id) => {
        const el = window.__capEls?.[id];
        if (!el) return false;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && r.width > 10 && r.height > 10;
      }, splash.id)
      .catch(() => false);
  };

  try {
    if (args.open) {
      await page.locator(args.open).first().click({ timeout: 5000 });
    } else {
      await page.mouse.click(desktop ? 720 : 195, desktop ? 450 : 422);
    }
  } catch {
    /* сплэша может не быть */
  }

  // Сплэш бывает кастомным оверлеем: пробуем клик по нему, потом прячем принудительно.
  const splash = pre.anchors.find((a) => a.role === 'splash');
  if (splash && (await stillCovered())) {
    await page.evaluate((id) => window.__capEls?.[id]?.click?.(), splash.id).catch(() => null);
    await page.waitForTimeout(600);
    if (await stillCovered()) {
      await page
        .evaluate((id) => {
          const el = window.__capEls?.[id];
          if (!el) return;
          el.hidden = true;
          el.style.display = 'none';
        }, splash.id)
        .catch(() => null);
    }
  }

  await page.waitForTimeout(args.openWait);
  return { splashText, splashAnchor };
}

async function matchedStyles(page, ids) {
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const { root: domRoot } = await session.send('DOM.getDocument', { depth: 1 });
  const out = {};
  for (const id of ids) {
    try {
      const selector = '[data-cap-id="' + id + '"]';
      const { nodeId } = await session.send('DOM.querySelector', { nodeId: domRoot.nodeId, selector });
      if (!nodeId) continue;
      const matched = await session.send('CSS.getMatchedStylesForNode', { nodeId });
      out[id] = (matched.matchedCSSRules || [])
        .filter((m) => m.rule && m.rule.origin === 'regular' && m.rule.style && m.rule.selectorList)
        .map((m) => ({
          selector: m.rule.selectorList.text,
          media: (m.rule.media || []).map((q) => q.text),
          props: (m.rule.style.cssProperties || []).filter((p) => p.value).map((p) => `${p.name}: ${p.value}`)
        }))
        .slice(0, 40);
    } catch {
      /* узел мог исчезнуть */
    }
  }
  const mediaQueries = await session.send('CSS.getMediaQueries').then((r) => r.medias.map((m) => m.text)).catch(() => []);
  await session.detach();
  return { byId: out, mediaQueries };
}

async function captureViewport(context, args, viewportName, harvester, report) {
  const spec = VIEWPORTS[viewportName] || VIEWPORTS.desktop;
  const page = await context.newPage();
  await page.setViewportSize({ width: spec.width, height: spec.height });
  const pending = [];
  page.on('response', (response) => pending.push(harvester.handleResponse(response).catch(() => null)));

  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 300));
  });

  await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: args.timeout });
  await page.waitForLoadState('load', { timeout: args.timeout }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(800);

  // Прокрутка провоцирует ленивую загрузку и появление анимаций.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.9;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
  });

  let splashText = '';
  let splashAnchor = null;
  const isDesktop = viewportName === 'desktop';
  const dismissal = await dismissSplash(page, args, isDesktop);
  splashText = dismissal.splashText;
  splashAnchor = dismissal.splashAnchor;

  const resolved = await page.evaluate(resolveAnchors);
  const dump = await page.evaluate(dumpAnchors, resolved.anchors);
  const inventory = await page.evaluate(pageInventory);
  const pageStyle = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    const out = {};
    for (const name of cs) out[name] = cs.getPropertyValue(name);
    return { body: out, cursor: cs.cursor };
  });

  // Сплэш после входа скрыт и в новый обход не попадает — возвращаем снятый до клика слепок.
  if (splashAnchor && !resolved.anchors.some((a) => a.id === splashAnchor.id)) {
    resolved.anchors.push(splashAnchor);
  }

  await page.evaluate((anchors) => {
    const store = window.__capEls || {};
    for (const { id } of anchors) if (store[id]) store[id].setAttribute('data-cap-id', id);
  }, resolved.anchors);

  const matched = await matchedStyles(page, resolved.anchors.map((a) => a.id));

  const shotName = `shot-${viewportName}.png`;
  await page.screenshot({ path: path.join(args.out, shotName), fullPage: args.full });

  const canvasClips = isDesktop && args.record ? await recordCanvases(page, args.out) : [];
  if (isDesktop) {
    await saveSnapshot(page, args.out, harvester, args.slug || path.basename(args.out));
  }

  const viewportReport = {
    viewport: spec,
    splashText,
    anchors: resolved.anchors.map((a) => {
      const dumped = dump.find((d) => d.id === a.id) || {};
      const gone = dumped.missing || !dumped.rect || dumped.rect.w === 0;
      const rect = gone ? a.rect : dumped.rect;
      const style = gone ? a.style : dumped.style;
      return { ...a, ...dumped, rect, style, matchedRules: matched.byId[a.id] || [] };
    }),
    page: inventory,
    body: pageStyle.body,
    cursor: pageStyle.cursor,
    mediaQueries: matched.mediaQueries,
    consoleErrors,
    screenshot: shotName,
    canvasClips
  };
  await page.close();
  await Promise.allSettled(pending);
  return viewportReport;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (!args.url) throw new Error('нужен --url');

  const url = new URL(args.url);
  const site = args.site || url.hostname.replace(/^www\./, '').replace(/\./g, '-');
  const handle = args.handle || url.pathname.split('/').filter(Boolean).pop() || 'profile';
  const slug = slugify(args.slug || `${site}-${handle}`);

  args.out = args.out || path.join(root, 'data', 'capture', slug);
  const assetDir = path.join(root, 'web', 'public', 'demo', slug);
  await fs.mkdir(args.out, { recursive: true });
  await fs.mkdir(assetDir, { recursive: true });

  const harvester = createHarvester({ assetDir });
  const browser = await chromium.launch({ headless: !args.headed });
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'ru-RU',
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    deviceScaleFactor: 2
  });

  const report = {
    url: args.url,
    slug,
    site,
    handle,
    date: new Date().toISOString(),
    tool: 'bio style capture v1',
    viewports: args.viewports,
    cursor: '',
    assets: {},
    assetsMeta: []
  };

  try {
    const first = args.viewports[0] || 'desktop';
    const mainReport = await captureViewport(context, args, first, harvester, report);
    report.viewport = mainReport.viewport;
    report.splashText = mainReport.splashText;
    report.anchors = mainReport.anchors;
    report.page = mainReport.page;
    report.mediaQueries = mainReport.mediaQueries;
    report.consoleErrors = mainReport.consoleErrors;
    report.canvasClips = mainReport.canvasClips;
    report.body = mainReport.body;
    report.cursor = mainReport.cursor;
    report.html = mainReport.anchors.find((a) => a.role === 'root')?.style || {};

    // Медиа-файлы могли не попасть в сетевой перехват (ленивая загрузка) — докачиваем.
    for (const media of mainReport.page?.mediaElements || []) {
      if (media.src) await harvester.save(media.src).catch(() => null);
      if (media.poster) await harvester.save(media.poster).catch(() => null);
    }

    for (const name of args.viewports.slice(1)) {
      report[name] = await captureViewport(context, args, name, harvester, report);
    }
  } finally {
    await browser.close();
  }

  for (const file of harvester.files) {
    report.assets[file.url] = `/demo/${slug}/${file.file}`;
    report.assetsMeta.push({ url: file.url, file: `/demo/${slug}/${file.file}`, bytes: file.bytes });
  }

  await fs.writeFile(path.join(args.out, 'report.json'), JSON.stringify(report, null, 2));

  const { preset, unmapped, confidence } = mapReport(report, { slug });
  const merged = await buildPreset(preset, slug);
  await assertValid(merged);

  const presetPath = path.join(root, 'schema', 'presets', `${slug}.v1.json`);
  await fs.writeFile(presetPath, JSON.stringify(merged, null, 2) + '\n');
  await fs.writeFile(path.join(args.out, 'unmapped.json'), JSON.stringify({ unmapped, confidence }, null, 2));

  const lowFields = Object.entries(confidence).filter(([, level]) => level === 'low').map(([field]) => field);
  const md = [
    `# Захват ${args.url}`,
    '',
    `- дата: ${report.date}`,
    `- пресет: \`schema/presets/${slug}.v1.json\``,
    `- ассетов: ${report.assetsMeta.length}, общий вес: ${Math.round(report.assetsMeta.reduce((s, a) => s + a.bytes, 0) / 1024)} КБ`,
    `- записей canvas: ${(report.canvasClips || []).length}`,
    `- вьюпорты: ${args.viewports.join(', ')}`,
    '',
    '## Требует ручной доводки',
    lowFields.length ? lowFields.map((f) => `- \`${f}\``).join('\n') : '- нет полей с низкой уверенностью',
    '',
    '## Ручной перенос JS',
    report.canvasClips?.length
      ? report.canvasClips.map((c) => `- запись эффекта: \`${c}\` — исходный скрипт ищите в отчёте (canvas) и переносите вручную`).join('\n')
      : '- canvas-эффектов не найдено',
    '',
    '## Ограничения',
    '- значения сняты с одного состояния страницы; наведение, нажатия и другие состояния не покрыты',
    '- шрифты сохраняются локально, лицензию нужно проверить',
    '- снимок `reference.html` — только для чтения структуры, скрипты удалены'
  ].join('\n');
  await fs.writeFile(path.join(args.out, 'README.md'), md);

  console.log(`пресет: ${path.relative(root, presetPath)}`);
  console.log(`отчёт:  ${path.relative(root, path.join(args.out, 'report.json'))}`);
  console.log(`ассеты: ${path.relative(root, assetDir)} (${report.assetsMeta.length})`);
  if (lowFields.length) console.log(`низкая уверенность: ${lowFields.join(', ')}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
