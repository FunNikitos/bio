import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapReport, parseColor, saturation, toHex } from '../mapping.mjs';

const baseReport = () => ({
  url: 'https://example.test/somebody',
  viewport: { width: 1440, height: 900 },
  body: { 'background-color': 'rgba(0, 0, 0, 0)', filter: 'none' },
  html: { 'background-color': 'rgba(0, 0, 0, 0)' },
  cursor: 'auto',
  anchors: [],
  assetsMeta: [{ url: 'https://example.test/a.png', file: '/demo/x/a.png', bytes: 10 }],
  page: { mediaElements: [], canvases: [], fontFaces: [], title: 't' }
});

const anchor = (role, style, extra = {}) => ({
  id: 'c-' + role,
  role,
  tag: 'DIV',
  text: '',
  rect: { x: 500, y: 300, w: 400, h: 300 },
  attrs: {},
  style,
  before: {},
  after: {},
  customProps: {},
  matchedRules: [],
  ...extra
});

describe('разбор цветов', () => {
  it('понимает rgb, rgba, hex и прозрачность', () => {
    assert.deepEqual(parseColor('rgba(12, 34, 56, 0.5)'), { r: 12, g: 34, b: 56, a: 0.5, css: 'rgba(12, 34, 56, 0.5)' });
    assert.equal(toHex(parseColor('#0af')), '#00aaff');
    assert.equal(parseColor('transparent').a, 0);
    assert.equal(parseColor('none'), null);
    assert.ok(saturation(parseColor('#ff0000')) > 0.9);
    assert.equal(saturation(parseColor('#808080')), 0);
  });
});

describe('маппинг отчёта в пресет', () => {
  it('переносит подложку карточки, размытие, радиус и ширину', () => {
    const report = baseReport();
    report.anchors.push(
      anchor('card', {
        'background-color': 'rgba(20, 16, 28, 0.18)',
        'backdrop-filter': 'blur(8px)',
        'border-top-left-radius': '24px',
        'border-top-width': '0px',
        'border-top-style': 'none'
      }, { rect: { x: 400, y: 200, w: 1500, h: 400 } })
    );
    const { preset } = mapReport(report, { slug: 'x' });
    assert.equal(preset.layout.cardOpacity, 18);
    assert.equal(preset.layout.cardBlur, 8);
    assert.equal(preset.layout.cardRadius, 24);
    assert.equal(preset.layout.cardWidth, 920);
    assert.equal(preset.layout.cardStyle, 'frosted');
  });

  it('не путает белый текст с акцентом, если рядом есть насыщенный цвет', () => {
    const report = baseReport();
    report.anchors.push(
      anchor('name', { color: 'rgba(0,0,0,0)', 'font-size': '40px', 'font-weight': '700', 'font-family': 'Foo', 'background-clip': 'text', 'background-image': 'linear-gradient(90deg, rgb(244,240,255), rgb(192,132,252))' }),
      anchor('links', { color: 'rgb(244, 240, 255)' }, { hrefs: [{ href: 'https://github.com/x', text: '', color: 'rgb(192, 132, 252)' }] })
    );
    const { preset } = mapReport(report, { slug: 'x' });
    assert.equal(preset.theme.accent, '#c084fc');
    assert.equal(preset.theme.text, '#f4f0ff');
    assert.equal(preset.effects.usernameEffect, 'gradient');
  });

  it('определяет прозрачную карточку и процентный радиус аватара', () => {
    const report = baseReport();
    report.anchors.push(
      anchor('card', { 'background-color': 'rgba(0, 0, 0, 0)', 'backdrop-filter': 'none', 'border-top-left-radius': '0px' }),
      anchor('avatar', { 'border-top-left-radius': '50%' }, { rect: { x: 10, y: 10, w: 96, h: 96 } })
    );
    const { preset } = mapReport(report, { slug: 'x' });
    assert.equal(preset.layout.cardStyle, 'transparent');
    assert.equal(preset.layout.cardOpacity, 0);
    assert.equal(preset.avatar.shape, 'circle');
    assert.equal(preset.avatar.size, 96);
  });

  it('разбирает ссылки по платформам и игнорирует дубли и якоря', () => {
    const report = baseReport();
    report.anchors.push(
      anchor('links', { color: 'rgb(200,200,200)' }, {
        hrefs: [
          { href: 'https://t.me/dupe', text: 'TG', color: 'rgb(1,2,3)' },
          { href: 'https://t.me/dupe', text: 'TG', color: 'rgb(1,2,3)' },
          { href: '#top', text: 'x', color: 'rgb(1,2,3)' },
          { href: 'https://github.com/a', text: '', color: 'rgb(1,2,3)' }
        ]
      })
    );
    const { preset } = mapReport(report, { slug: 'x' });
    assert.equal(preset.links.items.length, 2);
    assert.deepEqual(preset.links.items.map((i) => i.platform), ['telegram', 'github']);
    assert.equal(preset.links.items[1].label, 'github');
  });

  it('берёт фон из видео и подставляет локальный путь', () => {
    const report = baseReport();
    report.page.mediaElements.push({ tag: 'VIDEO', src: 'https://example.test/bg.mp4', poster: 'https://example.test/p.png', loop: true });
    report.assetsMeta.push({ url: 'https://example.test/bg.mp4', file: '/demo/x/bg.mp4', bytes: 10 });
    report.assetsMeta.push({ url: 'https://example.test/p.png', file: '/demo/x/p.png', bytes: 10 });
    const { preset } = mapReport(report, { slug: 'x' });
    assert.equal(preset.effects.background.type, 'video');
    assert.equal(preset.effects.background.mediaUrl, '/demo/x/bg.mp4');
    assert.equal(preset.effects.background.posterUrl, '/demo/x/p.png');
  });

  it('не падает на пустом отчёте и помечает догадки', () => {
    const { preset, unmapped, confidence } = mapReport(baseReport(), { slug: 'x' });
    assert.equal(preset.layout.cardStyle, 'transparent');
    assert.equal(preset.avatar.visible, false);
    assert.deepEqual(preset.links.items, []);
    assert.equal(confidence['effects.background.particleEffect'], undefined);
    assert.ok(unmapped.length >= 0);
    assert.equal(preset.identity.username, 'somebody');
  });

  it('записывает canvas как ручной перенос частиц', () => {
    const report = baseReport();
    report.page.canvases.push({ index: 0, w: 1440, h: 900, cssW: 1440, cssH: 900 });
    const { preset, unmapped } = mapReport(report, { slug: 'x' });
    assert.equal(preset.effects.background.particleEffect, 'stars');
    assert.ok(unmapped.some((u) => u.field === 'effects.background.particleEffect'));
  });
});
