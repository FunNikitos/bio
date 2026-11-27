import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const slug = 'fixture-compare';
const presetPath = path.join(root, 'schema', 'presets', `${slug}.v1.json`);
const outDir = path.join(root, 'data', 'capture', slug);

function runCompare(threshold) {
  const run = spawnSync(
    process.execPath,
    ['tools/capture/compare.mjs', '--slug', slug, '--threshold', String(threshold)],
    { cwd: root, encoding: 'utf8' }
  );
  const file = path.join(outDir, 'diff', 'compare.json');
  const result = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { run, result };
}

before(() => {
  // compare.test опирается на сборку веб-приложения.
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', shell: true });
  assert.equal(build.status, 0, build.stderr);
  const capture = spawnSync(process.execPath, ['tools/capture/cli.mjs', '--url', new URL('../fixtures/profile.html', import.meta.url).href, '--slug', slug, '--no-record'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(capture.status, 0, capture.stderr);
});

describe('сверка с эталоном', () => {
  it('воспроизводит захваченное оформление в пределах порога', () => {
    const { run, result } = runCompare(12);
    assert.equal(run.status, 0, run.stdout + run.stderr);
    for (const viewport of result.results) {
      assert.ok(viewport.mismatch < 12, `расхождение ${viewport.mismatch}% на ${viewport.viewport}`);
    }
    assert.ok(fs.existsSync(path.join(outDir, 'diff', 'diff-desktop.png')));
    assert.ok(fs.existsSync(path.join(outDir, 'diff', 'web-desktop.png')));
    const desktop = result.results.find((r) => r.viewport === 'desktop');
    fs.writeFileSync(path.join(root, 'data', 'capture', 'baseline.json'), JSON.stringify(desktop.mismatch));
  });

  it('замечает подмену цвета в пресете', () => {
    const baseline = Number(fs.readFileSync(path.join(root, 'data', 'capture', 'baseline.json'), 'utf8'));
    const original = fs.readFileSync(presetPath, 'utf8');
    const broken = JSON.parse(original);
    broken.theme.accent = '#00ff00';
    broken.theme.text = '#00ff00';
    broken.layout.cardWidth = 420;
    broken.layout.cardOpacity = 5;
    broken.layout.cardRadius = 0;
    broken.effects.usernameEffect = 'none';
    broken.effects.background.type = 'solid';
    broken.effects.background.color1 = '#334455';
    broken.avatar.url = '';
    fs.writeFileSync(presetPath, JSON.stringify(broken, null, 2));
    try {
      const { result } = runCompare(12);
      const desktop = result.results.find((r) => r.viewport === 'desktop');
      assert.ok(desktop.mismatch > baseline + 3, `подмена не замечена: ${desktop.mismatch}% против ${baseline}%`);
    } finally {
      fs.writeFileSync(presetPath, original);
    }
  });
});
