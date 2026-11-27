import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function defaultProfileSnapshot() {
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
      verified: { enabled: true, placement: 'displayName', color: '#a78bfa' }
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
      sectionMode: { snap: true, dotsSide: 'right', wide: false, scrollHint: 'Листайте ниже' },
      terminalMode: { promptName: 'owner', theme: 'accent', typingSpeed: 6 },
      cornerWidgets: { views: 'bottom-left', audio: 'detached' }
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
      splash: { enabled: false, style: 'blur-curtain', text: 'нажмите для входа', subtitle: '', countdownSec: 0 },
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
      typewriter: { phrases: ['Открытый конструктор bio'], typeSpeed: 6, deleteSpeed: 7, caret: 'bar', loop: true },
      cursor: { customUrl: '', sizePct: 100, trail: 'sparkles', trailColor: '#a78bfa', trailSpeed: 'normal', clickSound: 'tap', clickVolume: 45 }
    },
    audio: {
      enabled: false,
      autoplayOnEnter: false,
      shuffle: false,
      playerStyle: 'detached',
      showCornerVolume: false,
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
        { id: 'link-github', platform: 'github', label: 'GitHub', subtitle: 'Исходный код проекта', url: 'https://github.com/FunNikitos/bio', mode: 'link', customIconUrl: '', glowColor: '#8b5cf6', pinned: true, is18Plus: false, visible: true },
        { id: 'link-discord', platform: 'discord', label: 'Discord', subtitle: 'Нажмите, чтобы скопировать тег', url: 'owner#0001', mode: 'copy', customIconUrl: '', glowColor: '#5865f2', pinned: false, is18Plus: false, visible: true },
        { id: 'link-telegram', platform: 'telegram', label: 'Telegram', subtitle: 'Канал и связь', url: 'https://t.me/telegram', mode: 'link', customIconUrl: '', glowColor: '#38bdf8', pinned: false, is18Plus: false, visible: true }
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
      { id: 'blk-clock', visible: true, type: 'clock', title: 'Местное время', timezone: 'Europe/Moscow', label: 'Моё время', hour12: false }
    ],
    analytics: { trackViews: true, showViewsBadge: true, trackClicks: true, enableLikes: true }
  };
}

const ALLOWED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif',
  '.mp4', '.webm', '.mp3', '.m4a', '.ogg', '.wav',
  '.woff2', '.woff', '.ttf', '.otf', '.cur', '.ico'
]);

export class ProfileStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.uploadsDir = path.join(dataDir, 'uploads');
    this.draftPath = path.join(dataDir, 'draft.json');
    this.publishedPath = path.join(dataDir, 'published.json');
    this.analyticsPath = path.join(dataDir, 'analytics.json');
  }

  async init() {
    await fs.mkdir(this.uploadsDir, { recursive: true });
    if (!(await this.exists(this.draftPath))) {
      await this.writeAtomic(this.draftPath, defaultProfileSnapshot());
    }
    if (!(await this.exists(this.analyticsPath))) {
      await this.writeAtomic(this.analyticsPath, { views: 0, likes: 0, clicksByLink: {} });
    }
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readJson(filePath, fallback = null) {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch {
      return fallback;
    }
  }

  async writeAtomic(filePath, data) {
    const tmp = `${filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, filePath);
  }

  async getDraft() {
    return (await this.readJson(this.draftPath)) ?? defaultProfileSnapshot();
  }

  async getPublished() {
    return this.readJson(this.publishedPath, null);
  }

  async getPublicProfile(previewDraft = false) {
    if (previewDraft) return this.getDraft();
    return (await this.getPublished()) ?? defaultProfileSnapshot();
  }

  async saveDraft(nextDraft) {
    if (!nextDraft || typeof nextDraft !== 'object' || nextDraft.schemaVersion !== 1) {
      throw Object.assign(new Error('Неверная структура конфига profile.v1'), { status: 400 });
    }
    await this.writeAtomic(this.draftPath, nextDraft);
    return nextDraft;
  }

  async publishDraft() {
    const draft = await this.getDraft();
    await this.writeAtomic(this.publishedPath, draft);
    return draft;
  }

  async getAnalytics() {
    return (await this.readJson(this.analyticsPath)) ?? { views: 0, likes: 0, clicksByLink: {} };
  }

  async recordView() {
    const profile = await this.getPublicProfile(false);
    const stats = await this.getAnalytics();
    if (!profile.analytics?.trackViews) return stats.views;
    stats.views += 1;
    await this.writeAtomic(this.analyticsPath, stats);
    return stats.views;
  }

  async recordLike() {
    const profile = await this.getPublicProfile(false);
    const stats = await this.getAnalytics();
    if (!profile.analytics?.enableLikes) return stats.likes;
    stats.likes += 1;
    await this.writeAtomic(this.analyticsPath, stats);
    return stats.likes;
  }

  async recordClick(linkId) {
    const profile = await this.getPublicProfile(false);
    const stats = await this.getAnalytics();
    if (!profile.analytics?.trackClicks || !linkId) return 0;
    const cleanId = String(linkId).slice(0, 80);
    stats.clicksByLink[cleanId] = (stats.clicksByLink[cleanId] || 0) + 1;
    await this.writeAtomic(this.analyticsPath, stats);
    return stats.clicksByLink[cleanId];
  }

  async saveUpload(originalName, buffer) {
    const ext = path.extname(originalName || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw Object.assign(new Error(`Неподдерживаемый формат файла: ${ext || 'unknown'}`), { status: 400 });
    }
    const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 32) || 'asset';
    const fileName = `${crypto.randomBytes(6).toString('hex')}-${base}${ext}`;
    const fullPath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(fullPath, buffer);
    return { url: `/uploads/${fileName}`, name: originalName, size: buffer.length };
  }
}
