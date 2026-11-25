export type PageMode = 'card' | 'sections' | 'terminal';

export type CardLayout =
  | 'classic'
  | 'compact'
  | 'stacked'
  | 'float'
  | 'bento'
  | 'cinematic-split'
  | 'dock-bottom-left'
  | 'horizon'
  | 'transparent';

export type CardStyle = 'classic' | 'frosted' | 'aurora' | 'outlined' | 'transparent';
export type CardSurfacePattern = 'solid' | 'gradient' | 'glow' | 'grid' | 'dots' | 'aurora' | 'mesh';
export type AvatarShape = 'circle' | 'rounded' | 'square' | 'hexagon';
export type AvatarFrameStyle = 'none' | 'thin' | 'accent' | 'gradient' | 'glow';
export type AvatarDecoration =
  | 'none'
  | 'aurora-halo'
  | 'angel-wings'
  | 'kitty-ears'
  | 'neon-headphones'
  | 'sakura-crown'
  | 'frost-crown'
  | 'custom';

export type EntranceAnimation =
  | 'none'
  | 'rise'
  | 'fade'
  | 'zoom'
  | 'blur'
  | 'drop'
  | 'flip'
  | 'slide'
  | 'swing'
  | 'bounce'
  | 'spin'
  | 'unfold'
  | 'cascade';

export type ParticleEffect =
  | 'none'
  | 'snow'
  | 'rain'
  | 'diagonal-rain'
  | 'stars'
  | 'embers'
  | 'fireflies'
  | 'matrix'
  | 'sakura'
  | 'bubbles'
  | 'confetti'
  | 'geometric';

export type BackgroundFilter = 'none' | 'blur' | 'dots' | 'grain' | 'vignette' | 'night' | 'old-tv';

export type UsernameEffect =
  | 'none'
  | 'glow'
  | 'neon'
  | 'rainbow'
  | 'gradient'
  | 'flow'
  | 'shine'
  | 'glitch'
  | 'wave'
  | 'sparkle'
  | 'typewriter'
  | 'scramble'
  | 'fuzzy'
  | 'outline'
  | 'shadow3d'
  | 'heartbeat';

export type BioEffect =
  | 'none'
  | 'glow'
  | 'gradient'
  | 'rainbow'
  | 'shine'
  | 'glitch'
  | 'wave'
  | 'typewriter'
  | 'scramble'
  | 'fade-lines';

export type CursorTrail =
  | 'none'
  | 'dots'
  | 'sparkles'
  | 'embers'
  | 'rainbow'
  | 'bubbles'
  | 'hearts'
  | 'smoke'
  | 'ring'
  | 'ghost'
  | 'oneko-cat';

export type ClickSound = 'none' | 'tap' | 'click' | 'pop' | 'bubble' | 'blip' | 'coin';
export type CornerSlot = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline' | 'hidden';
export type AudioCornerSlot = CornerSlot | 'detached';
export type LinkStyle = 'icons' | 'minimal' | 'outline' | 'cards' | 'pills';
export type IconStyle = 'plain' | 'soft' | 'circle' | 'outline';

export interface ProfileLinkItem {
  id: string;
  platform: string;
  label: string;
  subtitle: string;
  url: string;
  mode: 'link' | 'copy';
  customIconUrl: string;
  glowColor: string;
  pinned: boolean;
  is18Plus: boolean;
  visible: boolean;
}

export interface ProfileBadgeItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  visible: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl: string;
  lrcText: string;
}

export interface SetupItem {
  id: string;
  category: 'PC / Specs' | 'Monitor' | 'Keyboard' | 'Mouse' | 'Headset' | 'Microphone' | 'Controller' | 'Chair' | 'Other';
  name: string;
  details: string;
  url: string;
}

export interface GameItem {
  id: string;
  name: string;
  handle: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  caption: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type ContentBlock =
  | { id: string; visible: boolean; type: 'clock'; title: string; timezone: string; label: string; hour12: boolean }
  | { id: string; visible: boolean; type: 'setup'; title: string; photoUrl: string; items: SetupItem[] }
  | { id: string; visible: boolean; type: 'games'; title: string; items: GameItem[] }
  | {
      id: string;
      visible: boolean;
      type: 'discord';
      displayName: string;
      username: string;
      status: 'online' | 'idle' | 'dnd' | 'offline';
      activity: string;
      guildTag: string;
      avatarUrl: string;
      bannerColor: string;
      showBadges: boolean;
    }
  | { id: string; visible: boolean; type: 'gallery'; title: string; columns: 2 | 3; items: GalleryItem[] }
  | { id: string; visible: boolean; type: 'faq'; title: string; items: FaqItem[] }
  | { id: string; visible: boolean; type: 'quote'; text: string; author: string }
  | { id: string; visible: boolean; type: 'callout'; title: string; text: string; tone: 'accent' | 'neutral' | 'warn' }
  | { id: string; visible: boolean; type: 'text'; title: string; body: string; align: 'left' | 'center' | 'right' }
  | { id: string; visible: boolean; type: 'divider'; style: 'gradient' | 'solid' | 'dashed' | 'glow' };

export interface ProfileConfigV1 {
  schemaVersion: 1;
  meta: {
    tabTitle: string;
    animatedTabTitle: boolean;
    faviconUrl: string;
    seoTitle: string;
    seoDescription: string;
    seoImageUrl: string;
    nsfwGate: boolean;
    passcode: string;
    passcodeHint: string;
    showBrandingFooter: boolean;
  };
  identity: {
    displayName: string;
    username: string;
    uid: number;
    showUid: boolean;
    showUsername: boolean;
    showJoinDate: boolean;
    joinDate: string;
    pronounsLeft: string;
    pronounsRight: string;
    location: string;
    status: string;
    bio: string;
    tagAlign: 'left' | 'center' | 'right';
    tags: string[];
    verified: {
      enabled: boolean;
      placement: 'displayName' | 'username' | 'both';
      color: string;
    };
  };
  avatar: {
    url: string;
    visible: boolean;
    shape: AvatarShape;
    size: number;
    blur: number;
    objectX: number;
    objectY: number;
    scale: number;
    frameStyle: AvatarFrameStyle;
    frameColor: string;
    decoration: AvatarDecoration;
    customDecorationUrl: string;
    expandOnClick: boolean;
    protectImage: boolean;
    bannerUrl: string;
    bannerFade: number;
    bannerAvatarCutout: boolean;
  };
  layout: {
    pageMode: PageMode;
    cardLayout: CardLayout;
    alignment: 'left' | 'center' | 'right';
    pageScale: number;
    cardStyle: CardStyle;
    cardSurfacePattern: CardSurfacePattern;
    cardWidth: number;
    cardHeight: number;
    cardOpacity: number;
    cardBlur: number;
    cardRadius: number;
    cardContentFade: number;
    borderWidth: number;
    borderStyle: 'none' | 'subtle' | 'solid' | 'dashed' | 'dotted' | 'glow';
    borderAnimated: 'none' | 'two-corners' | 'single-line' | 'rainbow';
    cardHoverEffect: 'none' | 'lift' | 'scale' | 'glow';
    tiltEnabled: boolean;
    tiltMode: 'screen' | 'parallax';
    tiltStrength: number;
    entranceAnimation: EntranceAnimation;
    elementsStagger: 'none' | 'building-blocks' | 'rise-up' | 'pop-in';
    cardDelaySec: number;
    sectionMode: {
      snap: boolean;
      dotsSide: 'left' | 'right' | 'hidden';
      wide: boolean;
      scrollHint: string;
    };
    terminalMode: {
      promptName: string;
      theme: 'green' | 'amber' | 'white' | 'accent';
      typingSpeed: number;
    };
    cornerWidgets: {
      views: CornerSlot;
      audio: AudioCornerSlot;
    };
  };
  theme: {
    presetId: string;
    accent: string;
    text: string;
    background: string;
    cardColor: string;
    gradientColor: string;
    iconColor: string;
    fx1: string;
    fx2: string;
    specificTextColors: Record<string, string>;
    fontFamily: string;
    usernameFontFamily: string;
    customFontUrl: string;
    customFontName: string;
    fontSizeScale: number;
    usernameSize: number;
    usernameWeight: 400 | 600 | 700 | 800 | 900;
    bioSize: 'small' | 'medium' | 'large';
    letterSpacing: number;
  };
  effects: {
    splash: {
      enabled: boolean;
      style: 'blur-curtain' | 'radial-dark' | 'slit-curtain';
      text: string;
      subtitle: string;
      countdownSec: number;
    };
    background: {
      type: 'solid' | 'linear' | 'radial' | 'image' | 'video';
      color1: string;
      color2: string;
      gradientAngle: number;
      mediaUrl: string;
      posterUrl: string;
      videoMuted: boolean;
      videoOpacity: number;
      mediaBlur: number;
      dim: number;
      colorWash: string;
      washStrength: number;
      fit: 'cover' | 'contain';
      filter: BackgroundFilter;
      particleEffect: ParticleEffect;
      particleIntensity: number;
    };
    usernameEffect: UsernameEffect;
    bioEffect: BioEffect;
    extraNameGlow: boolean;
    effectColor1: string;
    effectColor2: string;
    typewriter: {
      phrases: string[];
      typeSpeed: number;
      deleteSpeed: number;
      caret: 'bar' | 'block' | 'underscore' | 'none';
      loop: boolean;
    };
    cursor: {
      customUrl: string;
      sizePct: number;
      trail: CursorTrail;
      trailColor: string;
      trailSpeed: 'slow' | 'normal' | 'fast';
      clickSound: ClickSound;
      clickVolume: number;
    };
  };
  audio: {
    enabled: boolean;
    autoplayOnEnter: boolean;
    shuffle: boolean;
    playerStyle: 'corner' | 'detached' | 'inline' | 'volume-only' | 'hidden';
    defaultVolume: number;
    syncVideoWithAudio: boolean;
    visualizer: 'off' | 'bars' | 'waveform' | 'ring';
    beatShake: boolean;
    showLyrics: boolean;
    tracks: AudioTrack[];
  };
  links: {
    linkStyle: LinkStyle;
    iconStyle: IconStyle;
    iconSizePx: number;
    monochromeIcons: boolean;
    glowIcons: boolean;
    align: 'left' | 'center' | 'right';
    randomizeOrder: boolean;
    items: ProfileLinkItem[];
  };
  badges: {
    placement: 'next-to-name' | 'below-name';
    boxStyle: 'none' | 'one-box' | 'each-box';
    sizePct: number;
    monochrome: boolean;
    glow: boolean;
    glowColor: string;
    items: ProfileBadgeItem[];
  };
  blocks: ContentBlock[];
  analytics: {
    trackViews: boolean;
    showViewsBadge: boolean;
    trackClicks: boolean;
    enableLikes: boolean;
  };
}

export function createDefaultProfile(): ProfileConfigV1 {
  return {
    schemaVersion: 1,
    meta: {
      tabTitle: '@owner',
      animatedTabTitle: false,
      faviconUrl: '',
      seoTitle: 'Персональная страница bio',
      seoDescription: 'Профиль и ссылки на собственном сервере.',
      seoImageUrl: '',
      nsfwGate: false,
      passcode: '',
      passcodeHint: '',
      showBrandingFooter: false
    },
    identity: {
      displayName: 'bio owner',
      username: 'owner',
      uid: 1,
      showUid: true,
      showUsername: true,
      showJoinDate: false,
      joinDate: '2026-11-25',
      pronounsLeft: '',
      pronounsRight: '',
      location: 'Self-hosted',
      status: 'Создаю свой профиль',
      bio: 'Открытая персональная bio-страница на собственном сервере.',
      tagAlign: 'center',
      tags: ['self-hosted', 'open-source', 'design'],
      verified: {
        enabled: true,
        placement: 'displayName',
        color: '#a78bfa'
      }
    },
    avatar: {
      url: '',
      visible: true,
      shape: 'circle',
      size: 104,
      blur: 0,
      objectX: 50,
      objectY: 50,
      scale: 1,
      frameStyle: 'glow',
      frameColor: '#8b5cf6',
      decoration: 'aurora-halo',
      customDecorationUrl: '',
      expandOnClick: true,
      protectImage: false,
      bannerUrl: '',
      bannerFade: 40,
      bannerAvatarCutout: true
    },
    layout: {
      pageMode: 'card',
      cardLayout: 'classic',
      alignment: 'center',
      pageScale: 100,
      cardStyle: 'frosted',
      cardSurfacePattern: 'aurora',
      cardWidth: 540,
      cardHeight: 0,
      cardOpacity: 58,
      cardBlur: 20,
      cardRadius: 24,
      cardContentFade: 100,
      borderWidth: 1,
      borderStyle: 'subtle',
      borderAnimated: 'none',
      cardHoverEffect: 'none',
      tiltEnabled: true,
      tiltMode: 'screen',
      tiltStrength: 4,
      entranceAnimation: 'rise',
      elementsStagger: 'rise-up',
      cardDelaySec: 0,
      sectionMode: {
        snap: true,
        dotsSide: 'right',
        wide: false,
        scrollHint: 'Листайте ниже'
      },
      terminalMode: {
        promptName: 'owner',
        theme: 'accent',
        typingSpeed: 6
      },
      cornerWidgets: {
        views: 'bottom-left',
        audio: 'detached'
      }
    },
    theme: {
      presetId: 'aurora-glass',
      accent: '#8b5cf6',
      text: '#f8fafc',
      background: '#07070c',
      cardColor: '#0e0d18',
      gradientColor: '#ec4899',
      iconColor: '#ffffff',
      fx1: '#a78bfa',
      fx2: '#38bdf8',
      specificTextColors: {},
      fontFamily: 'Onest',
      usernameFontFamily: '',
      customFontUrl: '',
      customFontName: '',
      fontSizeScale: 1,
      usernameSize: 34,
      usernameWeight: 800,
      bioSize: 'medium',
      letterSpacing: -0.02
    },
    effects: {
      splash: {
        enabled: false,
        style: 'blur-curtain',
        text: 'нажмите для входа',
        subtitle: '',
        countdownSec: 0
      },
      background: {
        type: 'linear',
        color1: '#090912',
        color2: '#1f1135',
        gradientAngle: 145,
        mediaUrl: '',
        posterUrl: '',
        videoMuted: true,
        videoOpacity: 85,
        mediaBlur: 0,
        dim: 25,
        colorWash: '#090714',
        washStrength: 20,
        fit: 'cover',
        filter: 'dots',
        particleEffect: 'stars',
        particleIntensity: 1
      },
      usernameEffect: 'glow',
      bioEffect: 'none',
      extraNameGlow: true,
      effectColor1: '#c4b5fd',
      effectColor2: '#f472b6',
      typewriter: {
        phrases: ['Открытый конструктор bio', 'Стиль, медиа и полная свобода'],
        typeSpeed: 6,
        deleteSpeed: 7,
        caret: 'bar',
        loop: true
      },
      cursor: {
        customUrl: '',
        sizePct: 100,
        trail: 'sparkles',
        trailColor: '#a78bfa',
        trailSpeed: 'normal',
        clickSound: 'tap',
        clickVolume: 45
      }
    },
    audio: {
      enabled: false,
      autoplayOnEnter: false,
      shuffle: false,
      playerStyle: 'detached',
      defaultVolume: 60,
      syncVideoWithAudio: false,
      visualizer: 'bars',
      beatShake: false,
      showLyrics: false,
      tracks: []
    },
    links: {
      linkStyle: 'pills',
      iconStyle: 'soft',
      iconSizePx: 38,
      monochromeIcons: false,
      glowIcons: true,
      align: 'center',
      randomizeOrder: false,
      items: [
        {
          id: 'link-github',
          platform: 'github',
          label: 'GitHub',
          subtitle: 'Исходный код проекта',
          url: 'https://github.com/FunNikitos/bio',
          mode: 'link',
          customIconUrl: '',
          glowColor: '#8b5cf6',
          pinned: true,
          is18Plus: false,
          visible: true
        },
        {
          id: 'link-discord',
          platform: 'discord',
          label: 'Discord',
          subtitle: 'Нажмите, чтобы скопировать тег',
          url: 'owner#0001',
          mode: 'copy',
          customIconUrl: '',
          glowColor: '#5865f2',
          pinned: false,
          is18Plus: false,
          visible: true
        },
        {
          id: 'link-telegram',
          platform: 'telegram',
          label: 'Telegram',
          subtitle: 'Канал и связь',
          url: 'https://t.me/telegram',
          mode: 'link',
          customIconUrl: '',
          glowColor: '#38bdf8',
          pinned: false,
          is18Plus: false,
          visible: true
        }
      ]
    },
    badges: {
      placement: 'below-name',
      boxStyle: 'one-box',
      sizePct: 100,
      monochrome: false,
      glow: true,
      glowColor: '#a78bfa',
      items: [
        { id: 'b-early', label: 'Self-Host Owner', icon: 'crown', color: '#f5c451', visible: true },
        { id: 'b-dev', label: 'Open Source', icon: 'code', color: '#8b5cf6', visible: true },
        { id: 'b-verified', label: 'Verified', icon: 'sparkles', color: '#38bdf8', visible: true }
      ]
    },
    blocks: [
      {
        id: 'blk-clock',
        visible: true,
        type: 'clock',
        title: 'Местное время',
        timezone: 'Europe/Moscow',
        label: 'Моё время',
        hour12: false
      }
    ],
    analytics: {
      trackViews: true,
      showViewsBadge: true,
      trackClicks: true,
      enableLikes: true
    }
  };
}

export function cloneProfile(profile: ProfileConfigV1): ProfileConfigV1 {
  return JSON.parse(JSON.stringify(profile)) as ProfileConfigV1;
}

export function normalizeProfile(raw: unknown): ProfileConfigV1 {
  const base = createDefaultProfile();
  if (!raw || typeof raw !== 'object') return base;
  const src = raw as Partial<ProfileConfigV1>;
  return {
    schemaVersion: 1,
    meta: { ...base.meta, ...(src.meta ?? {}) },
    identity: {
      ...base.identity,
      ...(src.identity ?? {}),
      tags: Array.isArray(src.identity?.tags) ? src.identity.tags : base.identity.tags,
      verified: { ...base.identity.verified, ...(src.identity?.verified ?? {}) }
    },
    avatar: { ...base.avatar, ...(src.avatar ?? {}) },
    layout: {
      ...base.layout,
      ...(src.layout ?? {}),
      sectionMode: { ...base.layout.sectionMode, ...(src.layout?.sectionMode ?? {}) },
      terminalMode: { ...base.layout.terminalMode, ...(src.layout?.terminalMode ?? {}) },
      cornerWidgets: { ...base.layout.cornerWidgets, ...(src.layout?.cornerWidgets ?? {}) }
    },
    theme: {
      ...base.theme,
      ...(src.theme ?? {}),
      specificTextColors: { ...base.theme.specificTextColors, ...(src.theme?.specificTextColors ?? {}) }
    },
    effects: {
      ...base.effects,
      ...(src.effects ?? {}),
      splash: { ...base.effects.splash, ...(src.effects?.splash ?? {}) },
      background: { ...base.effects.background, ...(src.effects?.background ?? {}) },
      typewriter: {
        ...base.effects.typewriter,
        ...(src.effects?.typewriter ?? {}),
        phrases: Array.isArray(src.effects?.typewriter?.phrases)
          ? src.effects.typewriter.phrases
          : base.effects.typewriter.phrases
      },
      cursor: { ...base.effects.cursor, ...(src.effects?.cursor ?? {}) }
    },
    audio: {
      ...base.audio,
      ...(src.audio ?? {}),
      tracks: Array.isArray(src.audio?.tracks) ? src.audio.tracks : base.audio.tracks
    },
    links: {
      ...base.links,
      ...(src.links ?? {}),
      items: Array.isArray(src.links?.items) ? src.links.items : base.links.items
    },
    badges: {
      ...base.badges,
      ...(src.badges ?? {}),
      items: Array.isArray(src.badges?.items) ? src.badges.items : base.badges.items
    },
    blocks: Array.isArray(src.blocks) ? src.blocks : base.blocks,
    analytics: { ...base.analytics, ...(src.analytics ?? {}) }
  };
}
