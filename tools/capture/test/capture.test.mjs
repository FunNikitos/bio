import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { validatePreset } from '../preset.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const slug = 'fixture-test';
const fixture = pathToFileURL(path.join(root, 'tools', 'capture', 'fixtures', 'profile.html')).href;
const outDir = path.join(root, 'data', 'capture', slug);
const presetPath = path.join(root, 'schema', 'presets', `${slug}.v1.json`);

function cleanup() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.rmSync(presetPath, { force: true });
}

before(() => {
  cleanup();
  const run = spawnSync(process.execPath, ['tools/capture/cli.mjs', '--url', fixture, '--slug', slug, '--no-record'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(run.status, 0, `cli упал: ${run.stderr}`);
});

after(cleanup);

describe('захват оформления', () => {
  it('находит ключевые элементы по геометрии и стилям', () => {
    const report = JSON.parse(fs.readFileSync(path.join(outDir, 'report.json'), 'utf8'));
    const roles = new Set(report.anchors.map((a) => a.role));
    for (const role of ['card', 'name', 'bio', 'avatar', 'links', 'canvas', 'splash']) {
      assert.ok(roles.has(role), `роль ${role} не найдена`);
    }
    const card = report.anchors.find((a) => a.role === 'card');
    assert.match(card.style['backdrop-filter'], /blur\(18px\)/);
    assert.equal(card.style['background-color'], 'rgba(22, 17, 30, 0.42)');
    assert.equal(report.splashText, 'click to enter...');
  });

  it('снимает псевдоэлементы, токены и правила каскада', () => {
    const report = JSON.parse(fs.readFileSync(path.join(outDir, 'report.json'), 'utf8'));
    const name = report.anchors.find((a) => a.role === 'name');
    assert.equal(name.after.content, '"✦"');
    const card = report.anchors.find((a) => a.role === 'card');
    assert.equal(card.customProps['--containerBlur'], '18px');
    assert.ok(card.matchedRules.some((rule) => rule.props.some((p) => p.startsWith('backdrop-filter'))));
    assert.ok(report.mediaQueries.includes('(max-width: 520px)'));
  });

  it('сохраняет ассеты локально и переводит на них пресет', () => {
    const report = JSON.parse(fs.readFileSync(path.join(outDir, 'report.json'), 'utf8'));
    const preset = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
    assert.match(preset.avatar.url, /^\/demo\/fixture-test\/[\da-f]{12}\.svg$/);
    assert.match(preset.effects.cursor.customUrl, /^\/demo\/fixture-test\//);
    assert.match(preset.effects.background.mediaUrl, /^\/demo\/fixture-test\//);
    assert.match(preset.audio.tracks[0].url, /\.wav$/);
    assert.ok(report.assetsMeta.length >= 5);
    for (const asset of report.assetsMeta) {
      const local = path.join(root, 'web', 'public', asset.file.replace(/^\//, ''));
      assert.ok(fs.existsSync(local), `ассет не сохранён: ${asset.file}`);
    }
  });

  it('переносит замеры в поля профиля и проходит схему', async () => {
    const preset = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
    assert.equal(preset.layout.cardOpacity, 42);
    assert.equal(preset.layout.cardBlur, 18);
    assert.equal(preset.layout.cardRadius, 28);
    assert.equal(preset.layout.cardStyle, 'frosted');
    assert.equal(preset.layout.cardWidth, 620);
    assert.equal(preset.identity.displayName, 'Fixture');
    assert.equal(preset.identity.username, 'fixture');
    assert.deepEqual(preset.identity.tags, ['design', 'capture']);
    assert.equal(preset.effects.usernameEffect, 'gradient');
    assert.equal(preset.effects.splash.enabled, true);
    assert.equal(preset.links.items.length, 3);
    assert.deepEqual(
      preset.links.items.map((i) => i.platform),
      ['github', 'telegram', 'youtube']
    );
    assert.equal(preset.avatar.shape, 'circle');
    assert.equal(preset.avatar.size, 112);
    assert.equal(preset.effects.background.type, 'image');
    assert.equal(preset.audio.enabled, true);
    const { ok, errors } = await validatePreset(preset);
    assert.ok(ok, errors.join('; '));
  });

  it('перечисляет непереносимое и не выдаёт низкую уверенность за факт', () => {
    const extra = JSON.parse(fs.readFileSync(path.join(outDir, 'unmapped.json'), 'utf8'));
    const fields = extra.unmapped.map((u) => u.field);
    assert.ok(fields.some((f) => f.includes('::after')), 'псевдоэлемент не записан');
    assert.ok(fields.includes('--containerBlur'), 'CSS-токен не записан');
    assert.ok(fields.includes('effects.background.particleEffect'), 'canvas не помечен как ручной перенос');
    assert.equal(extra.confidence['effects.background.particleEffect'], 'low');
    assert.equal(extra.confidence['layout.cardOpacity'], 'high');
  });

  it('делает снимок без сплэша и снимает оба вьюпорта', () => {
    const splash = PNG.sync.read(fs.readFileSync(path.join(outDir, 'shot-desktop-splash.png')));
    const desktop = PNG.sync.read(fs.readFileSync(path.join(outDir, 'shot-desktop.png')));
    const diff = new PNG({ width: splash.width, height: splash.height });
    const bad = pixelmatch(splash.data, desktop.data, diff.data, splash.width, splash.height, { threshold: 0.12 });
    assert.ok(bad / (splash.width * splash.height) > 0.03, 'кадр после входа совпал со сплэшем');
    const phone = JSON.parse(fs.readFileSync(path.join(outDir, 'report.json'), 'utf8')).phone;
    assert.deepEqual(phone.viewport.width, 390);
    assert.ok(fs.existsSync(path.join(outDir, 'shot-phone.png')));
  });

  it('пишет снимок структуры без скриптов и с локальными ассетами', () => {
    const html = fs.readFileSync(path.join(outDir, 'reference.html'), 'utf8');
    assert.ok(html.includes('class="card"'));
    assert.ok(!/<script/i.test(html));
    assert.ok(html.includes('/demo/fixture-test/'));
    assert.ok(fs.existsSync(path.join(outDir, 'styles.css')));
  });
});
