import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractDefaults } from '../extract-defaults.mjs';
import { buildPreset, deepMerge, validatePreset } from '../preset.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');

describe('сборка пресета', () => {
  it('заменяет массивы целиком, а объекты сливает', () => {
    const merged = deepMerge({ a: 1, list: [1, 2], nested: { x: 1, y: 2 } }, { list: [3], nested: { y: 5 } });
    assert.deepEqual(merged, { a: 1, list: [3], nested: { x: 1, y: 5 } });
  });

  it('добавляет обязательные поля и выключает телеметрию', async () => {
    const preset = await buildPreset({ identity: { displayName: 'X' } }, 'x-slug');
    assert.equal(preset.schemaVersion, 1);
    assert.equal(preset.theme.presetId, 'x-slug');
    assert.equal(preset.analytics.trackViews, false);
    assert.equal(preset.meta.showBrandingFooter, false);
    assert.deepEqual(preset.blocks, []);
    assert.equal(preset.identity.displayName, 'X');
  });

  it('ловит выход за границы схемы', async () => {
    const preset = await buildPreset({ layout: { cardOpacity: 140 } }, 'bad');
    const { ok, errors } = await validatePreset(preset);
    assert.equal(ok, false);
    assert.ok(errors.some((e) => e.includes('/layout/cardOpacity')));
  });

  it('не даёт базовому профилю разойтись с createDefaultProfile', async () => {
    const source = fs.readFileSync(path.join(root, 'web', 'src', 'lib', 'schema', 'profile.ts'), 'utf8');
    const generated = extractDefaults(source);
    const committed = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'capture', 'base-profile.json'), 'utf8'));
    assert.deepEqual(Object.keys(committed), Object.keys(generated), 'состав полей разошёлся');
    assert.deepEqual(committed.layout.terminalMode, generated.layout.terminalMode);
    assert.deepEqual(committed.effects.typewriter, generated.effects.typewriter);
    assert.equal(committed.theme.fontFamily, generated.theme.fontFamily);
  });
});
