// Преобразование отчёта захвата в поля profile.v1.
// Каждое поле получает оценку уверенности; сомнительное уходит и в unmapped.

const NAMED = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [255, 255, 255, 1],
  red: [255, 0, 0, 1],
  gray: [128, 128, 128, 1],
  grey: [128, 128, 128, 1]
};

export function parseColor(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (NAMED[raw]) {
    const [r, g, b, a] = NAMED[raw];
    return { r, g, b, a, css: raw };
  }
  const hex = /^#([0-9a-f]{3,8})$/.exec(raw);
  if (hex) {
    let body = hex[1];
    if (body.length === 3) body = body.split('').map((c) => c + c).join('');
    if (body.length === 6 || body.length === 8) {
      const r = parseInt(body.slice(0, 2), 16);
      const g = parseInt(body.slice(2, 4), 16);
      const b = parseInt(body.slice(4, 6), 16);
      const a = body.length === 8 ? parseInt(body.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a, css: raw };
    }
    return null;
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(raw);
  if (!rgb) return null;
  const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1, css: raw };
}

export function toHex(color) {
  if (!color) return '';
  const hex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + hex(color.r) + hex(color.g) + hex(color.b);
}

export function saturation(color) {
  if (!color) return 0;
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return 0;
  return (max - min) / (1 - Math.abs(2 * l - 1));
}

const px = (value) => {
  const n = parseFloat(String(value || ''));
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n, min, max) => Math.min(max, Math.max(min, Math.round(n)));

const PLATFORMS = [
  ['github.com', 'github'],
  ['discord.', 'discord'],
  ['t.me', 'telegram'],
  ['telegram.', 'telegram'],
  ['wa.me', 'whatsapp'],
  ['youtube.', 'youtube'],
  ['youtu.be', 'youtube'],
  ['spotify.', 'spotify'],
  ['twitch.', 'twitch'],
  ['tiktok.', 'tiktok'],
  ['instagram.', 'instagram'],
  ['x.com', 'x'],
  ['twitter.', 'x'],
  ['steamcommunity.', 'steam'],
  ['roblox.', 'roblox'],
  ['kick.com', 'kick'],
  ['soundcloud.', 'soundcloud'],
  ['vk.com', 'vk'],
  ['reddit.', 'reddit'],
  ['pinterest.', 'pinterest'],
  ['last.fm', 'lastfm'],
  ['ko-fi.', 'kofi'],
  ['patreon.', 'patreon'],
  ['paypal.', 'paypal'],
  ['mailto:', 'email']
];

function platformOf(url) {
  const lower = String(url || '').toLowerCase();
  for (const [needle, id] of PLATFORMS) if (lower.includes(needle)) return id;
  return 'website';
}

function assetResolver(meta) {
  const entries = meta || [];
  const byUrl = new Map(entries.map((e) => [e.url, e.file]));
  const byBase = new Map(entries.map((e) => [e.url.split('/').pop(), e.file]));
  return (url) => {
    if (!url) return '';
    if (byUrl.has(url)) return byUrl.get(url);
    try {
      const decoded = decodeURIComponent(url);
      if (byUrl.has(decoded)) return byUrl.get(decoded);
    } catch {
      /* оставляем как есть */
    }
    return byBase.get(url.split('/').pop()) || url;
  };
}

function gradientFrom(style) {
  const image = style?.['background-image'] || '';
  if (!image.includes('gradient(')) return null;
  const angle = /(-?[\d.]+)deg/.exec(image);
  const colors = [];
  const re = /(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = re.exec(image))) {
    const c = parseColor(m[1]);
    if (c) colors.push(c);
  }
  if (colors.length < 2) return null;
  return {
    radial: image.includes('radial-gradient'),
    angle: angle ? Math.round(((Number(angle[1]) % 360) + 360) % 360) : null,
    colors
  };
}

export function mapReport(report, meta = {}) {
  const unmapped = [];
  const confidence = {};
  const preset = {};
  const resolveAsset = assetResolver(report.assetsMeta);
  const note = (field, value, level, reason, anchor) => {
    confidence[field] = level;
    if (level === 'low') unmapped.push({ field, value, reason, anchor: anchor || null });
  };

  const anchors = report.anchors || [];
  const byRole = (role) => anchors.filter((a) => a.role === role && a.style && Object.keys(a.style).length);
  const first = (role) => byRole(role)[0] || null;
  const styleOf = (role) => first(role)?.style || {};
  const rectOf = (role) => first(role)?.rect || { x: 0, y: 0, w: 0, h: 0 };

  const page = report.page || {};
  const bodyStyle = report.body || {};
  const htmlStyle = report.html || {};

  // --- Фон страницы ---
  const bg = { type: 'solid', color1: '', color2: '', gradientAngle: 180 };
  const gradient = gradientFrom(bodyStyle) || gradientFrom(htmlStyle);
  const video = (page.mediaElements || []).find((m) => m.tag === 'VIDEO');
  const mediaAnchor = first('media');
  const solid = parseColor(bodyStyle['background-color']) || parseColor(htmlStyle['background-color']);
  const solidVisible = solid && solid.a > 0.05 ? solid : null;

  if (gradient) {
    bg.gradientAngle = gradient.angle ?? 180;
  }

  if (video && video.src) {
    bg.type = 'video';
    bg.mediaUrl = resolveAsset(video.src);
    if (video.poster) bg.posterUrl = resolveAsset(video.poster);
    note('effects.background.type', 'video', 'high');
  } else if (mediaAnchor && mediaAnchor.tag === 'IMG') {
    const src = mediaAnchor.attrs?.src || '';
    if (src) {
      bg.type = 'image';
      bg.mediaUrl = resolveAsset(src);
      note('effects.background.type', 'image', 'high');
    }
  } else if (gradient) {
    bg.type = gradient.radial ? 'radial' : 'linear';
    note('effects.background.type', bg.type, 'medium');
  } else {
    bg.type = 'solid';
    note('effects.background.type', 'solid', solidVisible ? 'high' : 'low', solidVisible ? '' : 'цвет фона не найден');
  }

  if (gradient) {
    bg.color1 = toHex(gradient.colors[0]);
    bg.color2 = toHex(gradient.colors[gradient.colors.length - 1]);
  }
  if (!bg.color1) bg.color1 = toHex(solidVisible) || '#0b0b10';
  if (!bg.color2) bg.color2 = bg.color1;

  const bodyFilter = bodyStyle.filter || '';
  const blurMedia = /blur\(([\d.]+)px\)/.exec(mediaAnchor?.style?.filter || '') || /blur\(([\d.]+)px\)/.exec(bodyFilter);
  if (blurMedia) bg.mediaBlur = clamp(px(blurMedia[1]), 0, 40);

  bg.filter = 'none';
  const filterText = `${bodyStyle.filter || ''} ${mediaAnchor?.style?.filter || ''}`;
  if (/grayscale|sepia/.test(filterText)) bg.filter = 'old-tv';
  else if (/contrast|brightness/.test(filterText)) bg.filter = 'night';
  else if (/blur\(/.test(filterText)) bg.filter = 'blur';

  // --- Карточка ---
  const card = first('card');
  const cardStyle = card?.style || {};
  const cardBg = parseColor(cardStyle['background-color']);
  const cardRect = rectOf('card');
  const layout = {};

  if (card) {
    const alpha = cardBg ? cardBg.a : 0;
    layout.cardOpacity = clamp(alpha * 100, 0, 100);
    note('layout.cardOpacity', layout.cardOpacity, 'high');
    const backdrop = /blur\(([\d.]+)px\)/.exec(cardStyle['backdrop-filter'] || '');
    layout.cardBlur = backdrop ? clamp(px(backdrop[1]), 0, 50) : 0;
    note('layout.cardBlur', layout.cardBlur, 'high');
    layout.cardRadius = 0;
    const radius = Math.max(
      px(cardStyle['border-top-left-radius']),
      px(cardStyle['border-top-right-radius']),
      px(cardStyle['border-bottom-left-radius']),
      px(cardStyle['border-bottom-right-radius'])
    );
    layout.cardRadius = clamp(radius || (parseFloat(cardStyle['border-top-left-radius']) / 100) * cardRect.w || 0, 0, 40);
    note('layout.cardRadius', layout.cardRadius, 'high');
    layout.cardWidth = clamp(cardRect.w, 340, 920);
    note('layout.cardWidth', layout.cardWidth, cardRect.w > 920 || cardRect.w < 340 ? 'low' : 'high');
    if (cardRect.h > 120) layout.cardHeight = clamp(cardRect.h, 0, 900);

    const cardGradient = gradientFrom(cardStyle);
    if (cardGradient) {
      layout.cardStyle = 'aurora';
      layout.cardSurfacePattern = 'gradient';
      note('layout.cardStyle', 'aurora', 'medium', 'фон карточки — градиент');
    } else if (alpha <= 0.02) {
      layout.cardStyle = 'transparent';
      layout.cardSurfacePattern = 'solid';
      note('layout.cardStyle', 'transparent', 'high');
    } else if (layout.cardBlur >= 6) {
      layout.cardStyle = 'frosted';
      layout.cardSurfacePattern = 'solid';
      note('layout.cardStyle', 'frosted', 'high');
    } else {
      layout.cardStyle = 'classic';
      layout.cardSurfacePattern = 'solid';
      note('layout.cardStyle', 'classic', 'medium');
    }

    const borderWidth = px(cardStyle['border-top-width']);
    if (cardStyle['border-top-style'] !== 'none' && borderWidth > 0) {
      layout.borderWidth = clamp(borderWidth, 0, 8);
      layout.borderStyle = 'solid';
    } else {
      layout.borderWidth = 0;
      layout.borderStyle = 'none';
    }

    const center = cardRect.x + cardRect.w / 2;
    const offset = (center - report.viewport.width / 2) / report.viewport.width;
    layout.alignment = Math.abs(offset) < 0.04 ? 'center' : offset < 0 ? 'left' : 'right';
    note('layout.alignment', layout.alignment, 'high');

    const coverage = (cardRect.w * cardRect.h) / (report.viewport.width * report.viewport.height);
    layout.cardLayout = coverage > 0.55 ? 'stacked' : layout.alignment === 'left' || layout.alignment === 'right' ? 'dock-bottom-left' : 'compact';
    if (layout.alignment === 'right') layout.cardLayout = 'float';
    if (layout.cardOpacity === 0 && layout.cardBlur === 0) layout.cardLayout = 'transparent';
    note('layout.cardLayout', layout.cardLayout, 'low', 'раскладка угадана по геометрии');

    const animation = cardStyle.animation?.split(',')[0]?.trim().split(/\s+/)[0] || '';
    const entranceMap = [
      [/rise|slide-up|up/i, 'rise'],
      [/flip/i, 'flip'],
      [/unfold/i, 'unfold'],
      [/zoom|scale/i, 'zoom'],
      [/blur/i, 'blur'],
      [/drop/i, 'drop'],
      [/cascade|stagger/i, 'cascade'],
      [/fade/i, 'fade']
    ];
    const entrance = entranceMap.find(([re]) => re.test(animation));
    layout.entranceAnimation = entrance ? entrance[1] : 'none';
    note('layout.entranceAnimation', layout.entranceAnimation, entrance ? 'medium' : 'low', 'по animation-name карточки', card.id);
  } else {
    layout.cardStyle = 'transparent';
    layout.cardSurfacePattern = 'solid';
    layout.cardOpacity = 0;
    layout.cardBlur = 0;
    layout.cardRadius = 0;
    layout.cardLayout = 'transparent';
    layout.alignment = 'center';
    layout.cardWidth = 480;
    note('layout.cardLayout', 'transparent', 'medium', 'карточка не найдена');
  }

  const transform = cardStyle.transform || '';
  const rotated = /matrix3?d?\(/.test(transform) && transform !== 'none';
  layout.tiltEnabled = rotated;
  if (rotated) note('layout.tiltEnabled', true, 'medium', 'карточка уже наклонена в простое');

  // --- Текст, цвета, шрифты ---
  const name = first('name');
  const bio = first('bio');
  const nameStyle = styleOf('name');
  const bioStyle = styleOf('bio');
  const username = first('username');
  const linkItems = byRole('links');

  const textColor = parseColor(nameStyle.color) || parseColor(bioStyle.color);
  const gradientText = (nameStyle['background-clip'] || '') === 'text' || (nameStyle['-webkit-background-clip'] || '') === 'text';
  const nameGradient = gradientText ? gradientFrom(nameStyle) : null;

  const weight = (color) => {
    const light = (Math.max(color.r, color.g, color.b) + Math.min(color.r, color.g, color.b)) / 510;
    return saturation(color) * (1 - Math.abs(light - 0.5) * 1.6);
  };

  let accent = null;
  let accentScore = 0;
  const accentCandidates = [];
  for (const anchor of linkItems) {
    for (const link of anchor.hrefs || []) {
      const c = parseColor(link.color);
      if (c) accentCandidates.push(c);
    }
  }
  for (const anchor of [...linkItems, ...byRole('player'), ...byRole('tag'), name].filter(Boolean)) {
    for (const key of ['color', 'border-top-color', 'background-color']) {
      const c = parseColor(anchor.style?.[key] || '');
      if (c) accentCandidates.push(c);
    }
  }
  for (const c of accentCandidates) {
    if (c.a < 0.4) continue;
    const score = weight(c);
    if (score > accentScore && score > 0.1) {
      accent = c;
      accentScore = score;
    }
  }
  if (!accent && nameGradient) accent = nameGradient.colors[0];

  const theme = {
    accent: toHex(accent) || '#8b5cf6',
    text: toHex(nameGradient?.colors?.[0]) || toHex(textColor) || '#ffffff',
    background: bg.color1,
    cardColor: toHex(cardBg) || '#141019',
    gradientColor: toHex(nameGradient?.colors?.[1]) || toHex(accent) || '#ec4899',
    iconColor: toHex(parseColor(linkItems[0]?.style?.color)) || toHex(textColor) || '#ffffff',
    fx1: toHex(nameGradient?.colors?.[0]) || toHex(accent) || '#a78bfa',
    fx2: toHex(nameGradient?.colors?.[1]) || toHex(textColor) || '#38bdf8'
  };
  note('theme.accent', theme.accent, accent ? 'medium' : 'low', accent ? 'по насыщенности иконок и ссылок' : 'акцент не найден');
  note('theme.text', theme.text, textColor || nameGradient ? 'high' : 'low');

  const fontFamily = (nameStyle['font-family'] || '').split(',')[0].replace(/["']/g, '').trim();
  const themeFonts = {
    fontFamily: fontFamily || 'Onest',
    usernameSize: clamp(px(nameStyle['font-size']) || 34, 18, 96),
    usernameWeight: [400, 600, 700, 800, 900].includes(Number(nameStyle['font-weight']))
      ? Number(nameStyle['font-weight'])
      : 700,
    letterSpacing: Math.max(-0.1, Math.min(0.3, px(nameStyle['letter-spacing']) / (px(nameStyle['font-size']) || 16)))
  };
  note('theme.fontFamily', themeFonts.fontFamily, fontFamily ? 'high' : 'low');

  const fontFaceUrl = (page.fontFaces || [])
    .map((rule) => /url\(['"]?([^'")]+)['"]?\)/.exec(rule))
    .find(Boolean)?.[1];
  if (fontFaceUrl) {
    themeFonts.customFontUrl = resolveAsset(fontFaceUrl);
    themeFonts.customFontName = fontFamily;
    unmapped.push({
      field: 'theme.customFontUrl',
      value: themeFonts.customFontUrl,
      reason: 'локальная копия веб-шрифта: проверить лицензию перед публикацией'
    });
  }

  const shadow = nameStyle['text-shadow'] || '';
  let usernameEffect = 'none';
  if (gradientText) usernameEffect = 'gradient';
  else if (shadow && shadow !== 'none') usernameEffect = shadow.split(',').length > 2 ? 'neon' : 'glow';
  else if (/glitch/i.test(nameStyle.animation || '')) usernameEffect = 'glitch';
  else if (/wave/i.test(nameStyle.animation || '')) usernameEffect = 'wave';
  note('effects.usernameEffect', usernameEffect, usernameEffect === 'none' ? 'low' : 'medium', 'по text-shadow/background-clip/animation');

  let bioEffect = 'none';
  if ((bioStyle['background-clip'] || '') === 'text') bioEffect = 'gradient';
  else if (bioStyle['text-shadow'] && bioStyle['text-shadow'] !== 'none') bioEffect = 'glow';

  // --- Идентичность ---
  const url = new URL(report.url);
  const identity = {
    displayName: (name?.text || '').slice(0, 48) || 'Профиль',
    username: (username?.text || decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')).replace(/^@/, '').slice(0, 32) || 'profile',
    bio: (bio?.text || '').slice(0, 600),
    showUsername: !!username,
    showUid: false,
    showJoinDate: false,
    location: '',
    status: '',
    verified: { enabled: false, placement: 'displayName', color: theme.accent },
    tags: byRole('tag')
      .map((t) => t.text)
      .filter((t) => t && t.length <= 30)
      .slice(0, 12)
  };

  // --- Аватар ---
  const avatar = first('avatar');
  const avatarStyle = avatar?.style || {};
  const avatarRect = rectOf('avatar');
  const avatarSrc = avatar?.attrs?.src || /url\(['"]?([^'")]+)/.exec(avatarStyle['background-image'] || '')?.[1] || '';
  const avatarPreset = {
    url: avatarSrc ? resolveAsset(avatarSrc) : '',
    visible: !!avatar,
    shape: 'circle',
    size: clamp(avatarRect.w || 96, 64, 200),
    frameStyle: 'none',
    frameColor: '#ffffff',
    decoration: 'none',
    expandOnClick: false,
    protectImage: false,
    bannerUrl: '',
    bannerFade: 0,
    bannerAvatarCutout: false
  };
  // Радиус может быть в процентах: считаем долю от ширины.
  const radiusRatio = (style, size) => {
    const raw = style?.['border-top-left-radius'] || '';
    if (raw.endsWith('%')) return (parseFloat(raw) || 0) / 100;
    return size ? px(raw) / size : 0;
  };
  const avatarRadius = px(avatarStyle['border-top-left-radius']);
  const roundRatio = radiusRatio(avatarStyle, avatarRect.w);  if (roundRatio > 0.45) avatarPreset.shape = 'circle';
  else if (roundRatio > 0.15) avatarPreset.shape = 'rounded';
  else avatarPreset.shape = 'square';
  if (px(avatarStyle['border-top-width']) > 0) {
    avatarPreset.frameStyle = 'thin';
    avatarPreset.frameColor = toHex(parseColor(avatarStyle['border-top-color'])) || '#ffffff';
  }
  if ((avatarStyle['box-shadow'] || '').includes('rgb')) avatarPreset.frameStyle = 'glow';

  // --- Ссылки ---
  const seen = new Set();
  const items = [];
  for (const anchor of linkItems) {
    for (const link of anchor.hrefs || []) {
      const href = link.href || '';
      if (!href || href.startsWith('#') || seen.has(href)) continue;
      seen.add(href);
      const platform = platformOf(href);
      items.push({
        id: 'lnk-' + (items.length + 1),
        platform,
        label: link.text && link.text.length <= 32 ? link.text : platform,
        subtitle: '',
        url: href,
        mode: 'link',
        customIconUrl: '',
        glowColor: theme.accent,
        pinned: false,
        is18Plus: false,
        visible: true
      });
    }
  }
  const iconSize = Math.max(
    ...byRole('links').map((a) => Math.max(a.rect.w, a.rect.h)),
    px(linkItems[0]?.style?.['font-size']) || 32
  );
  const links = {
    linkStyle: items.some((i) => i.label && i.label !== i.platform && i.label.length > 2) ? 'pills' : 'icons',
    iconStyle: 'plain',
    iconSizePx: clamp(iconSize || 32, 24, 56),
    monochromeIcons: false,
    glowIcons: (linkItems[0]?.style?.['filter'] || '').includes('drop-shadow'),
    align: layout.alignment === 'center' ? 'center' : layout.alignment,
    randomizeOrder: false,
    items
  };
  note('links.linkStyle', links.linkStyle, 'medium', 'по наличию подписей у ссылок');

  // --- Эффекты: частицы, курсор, splash ---
  const effects = {
    splash: {
      enabled: !!report.splashText,
      style: 'blur-curtain',
      text: String(report.splashText || '').slice(0, 60),
      subtitle: '',
      countdownSec: 0
    },
    background: bg,
    usernameEffect,
    bioEffect,
    typewriter: { phrases: [], typeSpeed: 6, deleteSpeed: 7, caret: 'bar', loop: true },
    cursor: {
      customUrl: '',
      sizePct: 100,
      trail: 'none',
      trailColor: theme.accent,
      trailSpeed: 'normal',
      clickSound: 'none',
      clickVolume: 0
    }
  };
  note('effects.splash.enabled', effects.splash.enabled, 'medium', 'по тексту оверлея входа');

  const cursorRule = /url\(['"]?([^'")]+)['"]?\)/.exec(report.cursor || '');
  if (cursorRule) {
    effects.cursor.customUrl = resolveAsset(cursorRule[1]);
    unmapped.push({ field: 'effects.cursor.customUrl', value: effects.cursor.customUrl, reason: 'курсор: проверить лицензию' });
  }
  const canvases = (report.page?.canvases || []).filter((c) => c.cssW * c.cssH > report.viewport.width * report.viewport.height * 0.3);
  if (canvases.length) {
    bg.particleEffect = 'stars';
    bg.particleIntensity = 1;
    note('effects.background.particleEffect', 'stars', 'low', 'есть полноэкранный canvas — тип частиц угадан');
    if ((report.body?.cursor || '').includes('none')) effects.cursor.trail = 'dots';
    unmapped.push({ field: 'effects.background.particleEffect', value: 'canvas', reason: 'canvas требует ручного переноса JS; есть запись в узах' });
  }

  // --- Аудио ---
  const audioEl = (page.mediaElements || []).find((m) => m.tag === 'AUDIO');
  const audio = {
    enabled: !!audioEl?.src || byRole('player').length > 0,
    autoplayOnEnter: !!report.splashText,
    shuffle: false,
    playerStyle: 'hidden',
    showCornerVolume: false,
    defaultVolume: 60,
    syncVideoWithAudio: false,
    visualizer: 'off',
    beatShake: false,
    showLyrics: false,
    tracks: []
  };
  if (audioEl?.src) {
    audio.tracks.push({
      id: 'trk-1',
      title: name?.text || 'Трек',
      artist: '',
      url: resolveAsset(audioEl.src),
      coverUrl: '',
      lrcText: ''
    });
    audio.playerStyle = 'detached';
    note('audio.playerStyle', 'detached', 'low', 'плеер найден, но положение угадано');
  }

  const preset$ = {
    meta: { tabTitle: page.title || identity.displayName, seoTitle: identity.displayName, seoDescription: identity.bio },
    identity,
    avatar: avatarPreset,
    layout,
    theme: { presetId: meta.slug || 'captured', ...theme, ...themeFonts },
    effects,
    audio,
    links
  };

  // --- Что не переносится автоматически ---
  for (const anchor of anchors) {
    for (const key of ['box-shadow', 'filter', 'text-shadow', 'animation', 'transform', 'mask-image', '-webkit-mask-image', 'background-image', 'background-size', 'clip-path']) {
      const value = anchor.style?.[key];
      if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
        unmapped.push({ field: `${anchor.role}.${key}`, value: value.slice(0, 200), reason: 'сырое CSS-свойство', anchor: anchor.id });
      }
    }
    if (anchor.before && anchor.before.content && anchor.before.content !== 'none') {
      unmapped.push({ field: `${anchor.role}::before`, value: anchor.before.content.slice(0, 120), reason: 'псевдоэлемент' });
    }
    if (anchor.after && anchor.after.content && anchor.after.content !== 'none') {
      unmapped.push({ field: `${anchor.role}::after`, value: anchor.after.content.slice(0, 120), reason: 'псевдоэлемент' });
    }
  }
  for (const [name$, value] of Object.entries(first('root')?.customProps || {})) {
    unmapped.push({ field: `--${name$.replace(/^--/, '')}`, value: String(value).slice(0, 160), reason: 'CSS-токен площадки' });
  }

  return { preset: preset$, unmapped, confidence };
}
