import { createDefaultProfile, type ProfileConfigV1 } from './profile';

export interface ThemePreset {
  id: string;
  name: string;
  subtitle: string;
  sourceHint: string;
  apply: (current: ProfileConfigV1) => ProfileConfigV1;
}

export const COLOR_SWATCHES = [
  '#ffffff',
  '#000000',
  '#8b5cf6',
  '#1d9bf0',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#f5c451',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#64748b'
];

export const GRADIENT_PRESETS = [
  { id: 'midnight', name: 'Midnight', color1: '#07070c', color2: '#1a1033', angle: 145 },
  { id: 'deep-sea', name: 'Deep sea', color1: '#040b18', color2: '#0c3b5e', angle: 160 },
  { id: 'ember', name: 'Ember', color1: '#120608', color2: '#5c1218', angle: 135 },
  { id: 'violet', name: 'Violet', color1: '#0f071a', color2: '#4c1d95', angle: 140 },
  { id: 'forest', name: 'Forest', color1: '#05140c', color2: '#0e3a24', angle: 155 },
  { id: 'dawn', name: 'Dawn', color1: '#1a101b', color2: '#6b274b', angle: 130 },
  { id: 'neon', name: 'Neon', color1: '#090418', color2: '#112a46', angle: 120 },
  { id: 'ice', name: 'Ice', color1: '#091522', color2: '#1e3a5f', angle: 170 }
];

export const BUILTIN_FONTS = [
  { id: 'Onest', label: 'Onest (Modern Sans)', stack: '"Onest", system-ui, -apple-system, sans-serif', category: 'Sans' },
  { id: 'Inter', label: 'Inter / System Sans', stack: '"Inter", system-ui, -apple-system, sans-serif', category: 'Sans' },
  { id: 'Space Grotesk', label: 'Space Grotesk', stack: '"Space Grotesk", "Segoe UI", system-ui, sans-serif', category: 'Sans' },
  { id: 'Rajdhani', label: 'Rajdhani (Tech)', stack: '"Rajdhani", "Segoe UI", sans-serif', category: 'Gaming' },
  { id: 'Orbitron', label: 'Orbitron (Sci-Fi)', stack: '"Orbitron", "Segoe UI", sans-serif', category: 'Gaming' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono', stack: '"JetBrains Mono", Consolas, monospace', category: 'Mono' },
  { id: 'Playfair Display', label: 'Playfair / Editorial Serif', stack: '"Playfair Display", Georgia, "Times New Roman", serif', category: 'Serif' },
  { id: 'Silkscreen', label: 'Pixel / Retro Mono', stack: '"Silkscreen", "Courier New", monospace', category: 'Pixel' },
  { id: 'Georgia', label: 'Classic Editorial Serif', stack: 'Georgia, "Times New Roman", serif', category: 'Serif' }
];

export function resolveFontStack(fontId: string, customFontName?: string): string {
  if (fontId === 'custom' && customFontName) {
    return `"${customFontName}", system-ui, sans-serif`;
  }
  return BUILTIN_FONTS.find((f) => f.id === fontId)?.stack ?? `"${fontId}", system-ui, sans-serif`;
}

export const SKIN_PRESETS: ThemePreset[] = [
  {
    id: 'aurora-glass',
    name: 'Aurora Glass',
    subtitle: 'Стеклянная карточка, звёзды и сияние',
    sourceHint: 'btw.bio + guns.lol',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'classic',
        cardStyle: 'frosted',
        cardSurfacePattern: 'aurora',
        cardOpacity: 58,
        cardBlur: 20,
        cardRadius: 24,
        borderStyle: 'subtle',
        borderWidth: 1,
        borderAnimated: 'none',
        tiltEnabled: true,
        entranceAnimation: 'rise'
      },
      theme: {
        ...p.theme,
        presetId: 'aurora-glass',
        accent: '#8b5cf6',
        text: '#f8fafc',
        background: '#07070c',
        cardColor: '#0e0d18',
        gradientColor: '#ec4899',
        iconColor: '#ffffff',
        fx1: '#a78bfa',
        fx2: '#38bdf8',
        fontFamily: 'Onest'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'linear', color1: '#090912', color2: '#1f1135', gradientAngle: 145, filter: 'dots', particleEffect: 'stars', dim: 25 },
        usernameEffect: 'glow',
        bioEffect: 'none'
      }
    })
  },
  {
    id: 'cardless-rain',
    name: 'Cardless Rain',
    subtitle: 'Прозрачный оверлей под дождём и искрами',
    sourceHint: 'guns.lol + btw.bio',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'transparent',
        cardStyle: 'transparent',
        cardSurfacePattern: 'solid',
        cardOpacity: 0,
        cardBlur: 0,
        borderWidth: 0,
        borderStyle: 'none',
        tiltEnabled: true,
        entranceAnimation: 'fade'
      },
      theme: {
        ...p.theme,
        presetId: 'cardless-rain',
        accent: '#38bdf8',
        text: '#ffffff',
        background: '#050811',
        cardColor: '#050811',
        gradientColor: '#0ea5e9',
        iconColor: '#ffffff',
        fx1: '#bae6fd',
        fx2: '#38bdf8',
        fontFamily: 'Space Grotesk'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'linear', color1: '#040711', color2: '#0d1b32', gradientAngle: 165, filter: 'vignette', particleEffect: 'diagonal-rain', dim: 20 },
        usernameEffect: 'sparkle',
        bioEffect: 'typewriter'
      }
    })
  },
  {
    id: 'sakura-pastel',
    name: 'Sakura Pastel',
    subtitle: 'Светлая лавандовая тема с сакурой',
    sourceHint: 'mychar.gg/lyla',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'compact',
        cardStyle: 'frosted',
        cardSurfacePattern: 'gradient',
        cardOpacity: 72,
        cardBlur: 18,
        cardRadius: 24,
        borderStyle: 'solid',
        borderWidth: 1,
        entranceAnimation: 'blur'
      },
      theme: {
        ...p.theme,
        presetId: 'sakura-pastel',
        accent: '#db2777',
        text: '#1f1224',
        background: '#fdf2f8',
        cardColor: '#ffd6fb',
        gradientColor: '#f3d3ff',
        iconColor: '#1f1224',
        fx1: '#f9a8d4',
        fx2: '#f472b6',
        fontFamily: 'Rajdhani'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'linear', color1: '#fce7f3', color2: '#ede9fe', gradientAngle: 135, filter: 'none', particleEffect: 'sakura', dim: 0 },
        usernameEffect: 'gradient',
        bioEffect: 'none'
      }
    })
  },
  {
    id: 'bento-gamer',
    name: 'Bento Gamer',
    subtitle: 'Широкий хедер + 2-колоночная сетка блоков',
    sourceHint: 'mychar.gg/hypnotic',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'bento',
        cardStyle: 'frosted',
        cardSurfacePattern: 'grid',
        cardWidth: 780,
        cardOpacity: 52,
        cardBlur: 16,
        cardRadius: 18,
        borderStyle: 'glow',
        borderWidth: 1,
        borderAnimated: 'two-corners',
        entranceAnimation: 'cascade'
      },
      theme: {
        ...p.theme,
        presetId: 'bento-gamer',
        accent: '#22d3ee',
        text: '#ecfeff',
        background: '#050b12',
        cardColor: '#081421',
        gradientColor: '#0ea5e9',
        iconColor: '#67e8f9',
        fx1: '#22d3ee',
        fx2: '#3b82f6',
        fontFamily: 'Orbitron'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'linear', color1: '#040911', color2: '#0d2238', gradientAngle: 150, filter: 'dots', particleEffect: 'embers', dim: 30 },
        usernameEffect: 'neon',
        bioEffect: 'none'
      }
    })
  },
  {
    id: 'cinematic-split',
    name: 'Cinematic Split',
    subtitle: 'Диагональный экран: сцена слева, профиль справа',
    sourceHint: 'vaults.lol/crispy/2',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'cinematic-split',
        cardStyle: 'classic',
        cardSurfacePattern: 'solid',
        cardOpacity: 85,
        cardBlur: 12,
        cardRadius: 20,
        tiltEnabled: false,
        entranceAnimation: 'unfold'
      },
      theme: {
        ...p.theme,
        presetId: 'cinematic-split',
        accent: '#f43f5e',
        text: '#fff1f2',
        background: '#09070b',
        cardColor: '#120d14',
        gradientColor: '#be123c',
        iconColor: '#fda4af',
        fx1: '#fb7185',
        fx2: '#f43f5e',
        fontFamily: 'Onest'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'linear', color1: '#17070c', color2: '#09060d', gradientAngle: 125, filter: 'grain', particleEffect: 'diagonal-rain', dim: 20 },
        usernameEffect: 'wave',
        bioEffect: 'none'
      }
    })
  },
  {
    id: 'float-islands',
    name: 'Float Islands',
    subtitle: 'Раздельные стеклянные островки и параллакс',
    sourceHint: 'vaults.lol/bias',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'float',
        cardStyle: 'frosted',
        cardSurfacePattern: 'solid',
        cardOpacity: 50,
        cardBlur: 22,
        cardRadius: 22,
        borderStyle: 'subtle',
        tiltEnabled: true,
        tiltMode: 'parallax',
        entranceAnimation: 'zoom'
      },
      theme: {
        ...p.theme,
        presetId: 'float-islands',
        accent: '#f5c451',
        text: '#fefce8',
        background: '#0a0908',
        cardColor: '#141210',
        gradientColor: '#ca8a04',
        iconColor: '#fde68a',
        fx1: '#f5c451',
        fx2: '#fb923c',
        fontFamily: 'Playfair Display'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'radial', color1: '#1d160c', color2: '#080706', gradientAngle: 180, filter: 'vignette', particleEffect: 'fireflies', dim: 20 },
        usernameEffect: 'flow',
        bioEffect: 'none'
      }
    })
  },
  {
    id: 'dock-952',
    name: 'Showcase 952',
    subtitle: 'Тёплое стекло внизу слева + волна и зерно',
    sourceHint: 'examples/952',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'dock-bottom-left',
        cardStyle: 'frosted',
        cardSurfacePattern: 'gradient',
        cardWidth: 440,
        cardOpacity: 88,
        cardBlur: 14,
        cardRadius: 26,
        borderStyle: 'subtle',
        borderWidth: 1,
        tiltEnabled: true,
        tiltStrength: 3,
        entranceAnimation: 'rise'
      },
      theme: {
        ...p.theme,
        presetId: 'dock-952',
        accent: '#f6d2c5',
        text: '#faf6f3',
        background: '#19181f',
        cardColor: '#251e2c',
        gradientColor: '#191b29',
        iconColor: '#f6d2c5',
        fx1: '#f6d2c5',
        fx2: '#c5bfc9',
        fontFamily: 'Georgia'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'linear', color1: '#24222e', color2: '#0e0d18', gradientAngle: 145, filter: 'grain', particleEffect: 'none', dim: 28 },
        usernameEffect: 'none',
        bioEffect: 'none'
      }
    })
  },
  {
    id: 'terminal-cli',
    name: 'Terminal CLI',
    subtitle: 'Интерактивный терминал с командами профиля',
    sourceHint: 'btw.bio Terminal',
    apply: (p) => ({
      ...p,
      layout: {
        ...p.layout,
        pageMode: 'terminal',
        cardLayout: 'classic',
        cardOpacity: 88,
        cardBlur: 10,
        cardRadius: 16,
        terminalMode: { ...p.layout.terminalMode, theme: 'green', typingSpeed: 7 }
      },
      theme: {
        ...p.theme,
        presetId: 'terminal-cli',
        accent: '#22c55e',
        text: '#dcfce7',
        background: '#030804',
        cardColor: '#061108',
        gradientColor: '#16a34a',
        iconColor: '#4ade80',
        fx1: '#22c55e',
        fx2: '#10b981',
        fontFamily: 'JetBrains Mono'
      },
      effects: {
        ...p.effects,
        background: { ...p.effects.background, type: 'solid', color1: '#030804', color2: '#041207', filter: 'old-tv', particleEffect: 'matrix', dim: 35 },
        usernameEffect: 'scramble',
        bioEffect: 'none'
      }
    })
  },
  {
    id: 'romash-glass',
    name: 'Guns Classic (Romash)',
    subtitle: 'Тёмное стекло без рамки, снег, Discord-пилюля и нижний плеер',
    sourceHint: 'guns.lol/romash_10',
    apply: (p) => ({
      ...p,
      avatar: {
        ...p.avatar,
        shape: 'circle',
        size: 118,
        frameStyle: 'none'
      },
      layout: {
        ...p.layout,
        pageMode: 'card',
        cardLayout: 'classic',
        alignment: 'center',
        pageScale: 100,
        cardStyle: 'frosted',
        cardSurfacePattern: 'solid',
        cardWidth: 640,
        cardOpacity: 13,
        cardBlur: 10,
        cardRadius: 20,
        borderStyle: 'none',
        borderWidth: 0,
        borderAnimated: 'none',
        tiltEnabled: false,
        entranceAnimation: 'rise',
        cornerWidgets: { views: 'card-bottom-left', audio: 'detached' },
        blocksBeforeLinks: true
      },
      theme: {
        ...p.theme,
        presetId: 'romash-glass',
        accent: '#ffffff',
        text: '#ffffff',
        background: '#080808',
        cardColor: '#1b1b1b',
        gradientColor: '#1b1b1b',
        iconColor: '#ffffff',
        fx1: '#ffffff',
        fx2: '#e2e8f0',
        fontFamily: 'Onest',
        usernameSize: 40,
        usernameWeight: 600,
        bioSize: 'medium'
      },
      effects: {
        ...p.effects,
        splash: { ...p.effects.splash, enabled: true, style: 'blur-curtain', text: 'click to enter...', subtitle: '' },
        background: { ...p.effects.background, type: 'solid', color1: '#080808', color2: '#080808', filter: 'none', particleEffect: 'snow', particleIntensity: 1, dim: 15 },
        usernameEffect: 'sparkle',
        bioEffect: 'none',
        effectColor1: '#ffffff',
        effectColor2: '#cbd5e1',
        cursor: { ...p.effects.cursor, trail: 'none', clickSound: 'none' }
      },
      audio: {
        ...p.audio,
        enabled: true,
        autoplayOnEnter: true,
        playerStyle: 'detached',
        showCornerVolume: true,
        visualizer: 'off'
      },
      links: {
        ...p.links,
        linkStyle: 'icons',
        iconStyle: 'plain',
        iconSizePx: 38,
        monochromeIcons: false,
        glowIcons: false,
        align: 'center'
      },
      analytics: { ...p.analytics, showViewsBadge: true, trackViews: true, enableLikes: false }
    })
  }
];

export function create952RomashProfile(): ProfileConfigV1 {
  const base = createDefaultProfile();
  const romash = SKIN_PRESETS.find((p) => p.id === 'romash-glass')!.apply(base);
  return {
    ...romash,
    meta: {
      ...romash.meta,
      tabTitle: '@952 · Под гипнозом',
      animatedTabTitle: true,
      faviconUrl: '/demo/952/portrait.webp',
      seoTitle: '952 · Под гипнозом',
      seoDescription: 'Музыкальная визитка 952 — Под гипнозом (ARTIK & ASTI).'
    },
    identity: {
      ...romash.identity,
      displayName: '952',
      username: '952',
      showUid: false,
      showUsername: false,
      showJoinDate: false,
      location: '',
      status: '',
      bio: 'Под гипнозом · ARTIK & ASTI',
      tags: [],
      verified: { enabled: false, placement: 'displayName', color: '#ffffff' }
    },
    avatar: {
      ...romash.avatar,
      url: '/demo/952/portrait.webp',
      visible: true,
      shape: 'circle',
      size: 118,
      objectX: 50,
      objectY: 39,
      frameStyle: 'none',
      decoration: 'none',
      expandOnClick: true
    },
    theme: {
      ...romash.theme,
      presetId: 'romash-glass',
      usernameSize: 52,
      usernameWeight: 600
    },
    effects: {
      ...romash.effects,
      background: {
        ...romash.effects.background,
        type: 'video',
        mediaUrl: '/demo/952/scene-hd.mp4',
        posterUrl: '/demo/952/poster.webp',
        videoMuted: true,
        videoOpacity: 85,
        dim: 32,
        colorWash: '#0e0d18',
        washStrength: 35,
        filter: 'grain',
        particleEffect: 'snow',
        particleIntensity: 0.9
      }
    },
    audio: {
      ...romash.audio,
      enabled: true,
      autoplayOnEnter: true,
      playerStyle: 'detached',
      showCornerVolume: true,
      defaultVolume: 65,
      syncVideoWithAudio: true,
      visualizer: 'waveform',
      tracks: [
        {
          id: 'trk-952',
          title: 'Под гипнозом',
          artist: 'ARTIK & ASTI',
          url: '/demo/952/hypnosis.m4a',
          coverUrl: '/demo/952/poster.webp',
          lrcText: ''
        }
      ]
    },
    links: {
      ...romash.links,
      linkStyle: 'icons',
      iconStyle: 'plain',
      iconSizePx: 38,
      monochromeIcons: false,
      glowIcons: false,
      align: 'center',
      items: [
        { id: 'lnk-952-yt', platform: 'youtube', label: 'YouTube', subtitle: '', url: 'https://youtube.com', mode: 'link', customIconUrl: '', glowColor: '#ff0000', pinned: false, is18Plus: false, visible: true },
        { id: 'lnk-952-ig', platform: 'instagram', label: 'Instagram', subtitle: '', url: 'https://instagram.com', mode: 'link', customIconUrl: '', glowColor: '#d62976', pinned: false, is18Plus: false, visible: true },
        { id: 'lnk-952-dc', platform: 'discord', label: 'Discord', subtitle: '', url: '952#0952', mode: 'copy', customIconUrl: '', glowColor: '#5865f2', pinned: false, is18Plus: false, visible: true },
        { id: 'lnk-952-wa', platform: 'whatsapp', label: 'WhatsApp', subtitle: '', url: 'https://whatsapp.com', mode: 'link', customIconUrl: '', glowColor: '#25d366', pinned: false, is18Plus: false, visible: true }
      ]
    },
    badges: { ...romash.badges, items: [] },
    blocks: [
      {
        id: 'blk-dc-952',
        visible: true,
        type: 'discord',
        style: 'pill',
        displayName: '952',
        username: '952',
        status: 'offline',
        activity: '',
        subtext: 'Под гипнозом · last seen recently',
        guildTag: '',
        avatarUrl: '/demo/952/portrait.webp',
        bannerColor: '#5865f2',
        showBadges: false
      }
    ]
  };
}
