// Эвристики поиска элементов по роли. Выполняются внутри страницы:
// селекторы площадок не используются, только геометрия и вычисленные стили.

export const ROLES = [
  'root',
  'card',
  'name',
  'username',
  'bio',
  'avatar',
  'links',
  'tag',
  'player',
  'media',
  'canvas',
  'splash'
];

const MAX_ANCHORS_PER_ROLE = 3;

/**
 * @returns {{ viewport: {width:number,height:number}, splashText: string, anchors: Array<{role:string, id:string, score:number, text:string, tag:string, path:string}> }}
 */
export function resolveAnchors() {
  const ROLES = [
    'root',
    'card',
    'name',
    'username',
    'bio',
    'avatar',
    'links',
    'tag',
    'player',
    'media',
    'canvas',
    'splash'
  ];
  const MAX_ANCHORS_PER_ROLE = 3;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const viewportArea = Math.max(1, vw * vh);
  const els = [];
  const store = (window.__capEls = window.__capEls || {});

  const skipTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'TITLE', 'NOSCRIPT', 'TEMPLATE', 'BR']);

  function rect(el) {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, area: Math.max(0, r.width) * Math.max(0, r.height) };
  }

  function path(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 6) {
      const cls = typeof node.className === 'string' ? node.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      parts.unshift(node.tagName.toLowerCase() + (cls ? '.' + cls : ''));
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function ownText(el) {
    let out = '';
    for (const node of el.childNodes) {
      if (node.nodeType === 3) out += node.nodeValue;
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  const SNAP_PROPS = [
    'color',
    'background-color',
    'background-image',
    'background-clip',
    '-webkit-background-clip',
    'font-size',
    'font-weight',
    'font-family',
    'letter-spacing',
    'opacity',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-top-width',
    'border-top-color',
    'border-top-style',
    'backdrop-filter',
    'box-shadow',
    'text-shadow',
    'filter',
    'animation',
    'transform',
    'cursor',
    'z-index',
    'display',
    'position'
  ];

  function snapshotStyle(el, cs) {
    const out = {};
    for (const name of SNAP_PROPS) out[name] = cs.getPropertyValue(name);
    el.__capStyle = out;
    return out;
  }

  const all = document.body ? document.body.querySelectorAll('*') : [];
  for (const el of all) {
    if (skipTags.has(el.tagName)) continue;
    const r = rect(el);
    if (r.w < 2 || r.h < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    els.push({ el, r, cs, text: ownText(el).slice(0, 200), tag: el.tagName, areaRatio: r.area / viewportArea });
  }

  function colorAlpha(value) {
    if (!value) return 0;
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return value === 'transparent' ? 0 : 1;
    const parts = m[1].split(/[,/]/).map((p) => parseFloat(p));
    return parts.length > 3 ? Number(parts[3]) : 1;
  }

  function px(value) {
    return parseFloat(value) || 0;
  }

  const scored = new Map();
  function add(role, candidate, score) {
    if (!(score > 0)) return;
    const list = scored.get(role) || [];
    list.push({ ...candidate, score });
    scored.set(role, list);
  }

  const root = document.documentElement;
  store.c0 = root;
  add('root', { el: root, r: { x: 0, y: 0, w: vw, h: vh, area: viewportArea }, cs: getComputedStyle(root), text: '', tag: 'HTML' }, 1);

  for (const c of els) {
    const { el, r, cs, tag, text } = c;
    const hasBg = colorAlpha(cs.backgroundColor) > 0.01 || (cs.backgroundImage && cs.backgroundImage !== 'none');
    const radius = Math.min(px(cs.borderTopLeftRadius), px(cs.borderTopRightRadius));
    const blur = /blur\(([\d.]+)px\)/.exec(cs.backdropFilter || '');

    // Карточка: заметный блок со скруглением и подложкой или размытием.
    if (c.areaRatio > 0.04 && c.areaRatio < 0.92 && tag !== 'BODY') {
      let score = 0;
      if (hasBg) score += 2;
      if (blur) score += 2;
      if (radius >= 8) score += 1.5;
      if (px(cs.borderTopWidth) > 0) score += 0.5;
      if (cs.position === 'fixed' || cs.position === 'absolute' || cs.position === 'relative') score += 0.5;
      if (el.querySelector('h1,h2,h3,img,a')) score += 1.5;
      if (c.areaRatio > 0.6) score -= 0.5;
      if (c.areaRatio > 0.85) score -= 1;
      add('card', c, score);
    }

    // Имя: крупный короткий текст.
    const fontSize = px(cs.fontSize);
    if (text.length >= 1 && text.length <= 48 && fontSize >= 20) {
      let score = fontSize / 10;
      if (/^H[1-3]$/.test(tag)) score += 3;
      if (fontSize >= 32) score += 2;
      if (colorAlpha(cs.color) > 0) score += 0.5;
      if (text.startsWith('@')) score += 0.5;
      add('name', c, score);
    }

    // Отдельный @username.
    if (/^@[\w.-]{2,32}$/.test(text) && fontSize >= 11 && fontSize <= 28) add('username', c, 6);

    // Био: строка среднего размера.
    if (text.length >= 8 && text.length <= 300 && fontSize >= 10 && fontSize <= 24 && !/^H[1-3]$/.test(tag)) {
      let score = 1;
      if (tag === 'P' || tag === 'SPAN' || tag === 'DIV') score += 1;
      if (r.w > 120) score += 0.5;
      if (c.areaRatio < 0.3) score += 0.5;
      add('bio', c, score);
    }

    // Аватар: небольшая почти квадратная картинка.
    const square = Math.abs(r.w - r.h) / Math.max(r.w, r.h);
    if (tag === 'IMG' || (cs.backgroundImage && /url\(/.test(cs.backgroundImage))) {
      if (r.w >= 40 && r.w <= 240 && square < 0.2) {
        let score = 4;
        if (radius >= r.w / 2 - 2) score += 3;
        if (c.areaRatio < 0.05) score += 1;
        add('avatar', c, score);
      }
    }

    // Теги-пилюли: мелкий текст на подложке.
    if (text.length >= 1 && text.length <= 24 && fontSize <= 16 && radius >= 8 && hasBg && r.h <= 44) {
      add('tag', c, 3);
    }

    // Медиа-фон: почти на весь экран.
    if (c.areaRatio > 0.45 && (tag === 'VIDEO' || tag === 'IMG')) {
      add('media', c, tag === 'VIDEO' ? 8 : 5);
    }

    if (tag === 'CANVAS' && c.areaRatio > 0.15) add('canvas', c, c.areaRatio > 0.5 ? 6 : 3);

    if (tag === 'AUDIO' || el.querySelector('audio')) add('player', c, tag === 'AUDIO' ? 5 : 2);
  }

  // Ссылки: ищем контейнер с максимумом коротких ссылок.
  for (const c of els) {
    if (c.tag !== 'A' || !c.el.getAttribute('href')) continue;
    if (c.r.w > 420 || c.r.h > 140) continue;
    const parent = c.el.parentElement;
    if (!parent) continue;
    const siblings = Array.from(parent.querySelectorAll(':scope > a[href], :scope > * > a[href]')).filter((a) => {
      const rr = a.getBoundingClientRect();
      return rr.width > 4 && rr.height > 4;
    });
    if (siblings.length === 0) continue;
    const key = siblings.length;
    add(
      'links',
      {
        ...c,
        el: parent,
        tag: parent.tagName,
        text: String(key),
        links: siblings.slice(0, 14).map((a) => ({
          href: a.href,
          text: ownText(a).slice(0, 40),
          color: getComputedStyle(a).color
        }))
      },
      key
    );
  }

  // Splash: полноэкранный слой с призывом войти.
  for (const c of els) {
    if (c.areaRatio < 0.75) continue;
    const z = Number(c.cs.zIndex) || 0;
    const fixed = c.cs.position === 'fixed' || c.cs.position === 'absolute';
    if (!fixed || z < 2) continue;
    const text = (c.el.innerText || '').replace(/\s+/g, ' ').trim();
    if (!/click|enter|войти|вход|tap|нажм/i.test(text)) continue;
    add('splash', { ...c, text: text.slice(0, 80) }, z + 5);
  }

  const anchors = [];
  let index = 0;
  for (const role of ROLES) {
    const list = (scored.get(role) || []).sort((a, b) => b.score - a.score).slice(0, MAX_ANCHORS_PER_ROLE);
    for (const item of list) {
      if (item.el.__capId) {
        store[item.el.__capId] = item.el;
        anchors.push({
          role,
          id: item.el.__capId,
          score: item.score,
          text: item.text,
          tag: item.tag,
          path: path(item.el),
          rect: { x: item.r.x, y: item.r.y, w: item.r.w, h: item.r.h },
          hrefs: item.links || [],
          style: snapshotStyle(item.el, item.cs)
        });
        continue;
      }
      const id = 'c' + index++;
      item.el.__capId = id;
      store[id] = item.el;
      anchors.push({
        role,
        id,
        score: item.score,
        text: item.text,
        tag: item.tag,
        path: path(item.el),
        rect: { x: item.r.x, y: item.r.y, w: item.r.w, h: item.r.h },
        hrefs: item.links || [],
        style: snapshotStyle(item.el, item.cs)
      });
    }
  }

  const splashText = (scored.get('splash') || []).sort((a, b) => b.score - a.score)[0]?.text || '';
  return { viewport: { width: vw, height: vh }, splashText, anchors };
}

/**
 * Дамп стилей и метаданных по найденным якорям.
 * @param {Array<{id:string, role:string}>} anchors
 */
export function dumpAnchors(anchors) {
  const store = window.__capEls || {};
  const props = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo || null);
    const out = {};
    for (const name of cs) out[name] = cs.getPropertyValue(name);
    return out;
  };
  const customProps = (el) => {
    const out = {};
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 8) {
      const cs = getComputedStyle(node);
      for (const name of cs) {
        if (!name.startsWith('--')) continue;
        const value = cs.getPropertyValue(name).trim();
        if (value) out[name] = value;
      }
      node = node.parentElement;
      depth += 1;
    }
    return out;
  };

  return anchors.map(({ id, role }) => {
    const el = store[id];
    if (!el) return { id, role, missing: true };
    if (!el.isConnected) return { id, role, missing: true, style: el.__capStyle || {} };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const attrs = {};
    for (const name of ['class', 'id', 'poster', 'alt', 'type', 'rel']) {
      const value = el.getAttribute(name);
      if (value) attrs[name] = value.slice(0, 300);
    }
    if (el.src) attrs.src = el.src;
    if (el.href) attrs.href = el.href;
    return {
      id,
      role,
      tag: el.tagName,
      text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400),
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      attrs,
      customProps: customProps(el),
      style: props(el),
      before: el.tagName === 'HTML' ? {} : props(el, '::before'),
      after: el.tagName === 'HTML' ? {} : props(el, '::after'),
      html: el.outerHTML.slice(0, 1200)
    };
  });
}

/** Список шрифтов, медиа и канвасов на странице. */
export function pageInventory() {
  return {
    fonts: Array.from(document.fonts || []).map((f) => ({ family: f.family, weight: f.weight, style: f.style, status: f.status })),
    fontFaces: (() => {
      const out = [];
      for (const sheet of document.styleSheets) {
        let rules = [];
        try {
          rules = Array.from(sheet.cssRules || []);
        } catch {
          continue;
        }
        for (const rule of rules) {
          if (rule.type === CSSRule.FONT_FACE_RULE) out.push(rule.cssText.slice(0, 500));
        }
      }
      return out;
    })(),
    mediaElements: Array.from(document.querySelectorAll('video,audio')).map((el) => ({
      tag: el.tagName,
      src: el.currentSrc || el.getAttribute('src') || '',
      poster: el.getAttribute('poster') || '',
      loop: !!el.loop,
      muted: !!el.muted,
      duration: Number.isFinite(el.duration) ? el.duration : null
    })),
    canvases: Array.from(document.querySelectorAll('canvas')).map((el, i) => {
      const r = el.getBoundingClientRect();
      return { index: i, w: el.width, h: el.height, cssW: r.width, cssH: r.height };
    }),
    shadowRoots: Array.from(document.querySelectorAll('*')).filter((el) => el.shadowRoot).length,
    iframes: Array.from(document.querySelectorAll('iframe')).map((el) => el.src),
    title: document.title,
    lang: document.documentElement.lang || '',
    bodyClasses: document.body ? document.body.className : ''
  };
}
