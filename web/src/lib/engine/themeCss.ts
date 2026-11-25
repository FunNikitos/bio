import type { ProfileConfigV1 } from '../schema/profile';
import { resolveFontStack } from '../schema/presets';

export interface ComputedProfileStyle {
  rootVars: string;
  backgroundCss: string;
  washCss: string;
  cardSurfaceCss: string;
  wrapperClasses: string[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex: string, fallback = '14, 13, 24'): string {
  const clean = hex.trim().replace(/^#/, '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function buildBackgroundStyle(profile: ProfileConfigV1): string {
  const bg = profile.effects.background;
  if (bg.type === 'solid') return bg.color1 || profile.theme.background;
  if (bg.type === 'radial') {
    return `radial-gradient(circle at 50% 25%, ${bg.color2}, ${bg.color1} 75%)`;
  }
  return `linear-gradient(${clamp(bg.gradientAngle, 0, 360)}deg, ${bg.color1}, ${bg.color2})`;
}

export function buildCardSurfaceStyle(profile: ProfileConfigV1): string {
  const alpha = clamp(profile.layout.cardOpacity, 0, 100) / 100;
  if (profile.layout.cardLayout === 'transparent' || profile.layout.cardStyle === 'transparent' || alpha === 0) {
    return 'transparent';
  }
  const baseRgb = hexToRgb(profile.theme.cardColor);
  const gradRgb = hexToRgb(profile.theme.gradientColor);
  const accentRgb = hexToRgb(profile.theme.accent);

  if (profile.layout.cardStyle === 'aurora' || profile.layout.cardSurfacePattern === 'aurora') {
    return `radial-gradient(ellipse 95% 70% at 50% -15%, rgba(${accentRgb}, ${(alpha * 0.35).toFixed(3)}), transparent 62%), linear-gradient(140deg, rgba(${baseRgb}, ${alpha.toFixed(3)}), rgba(${gradRgb}, ${(alpha * 0.45).toFixed(3)}))`;
  }
  if (profile.layout.cardSurfacePattern === 'gradient') {
    return `linear-gradient(135deg, rgba(${baseRgb}, ${alpha.toFixed(3)}), rgba(${gradRgb}, ${(alpha * 0.52).toFixed(3)}))`;
  }
  return `rgba(${baseRgb}, ${alpha.toFixed(3)})`;
}

export function computeProfileStyle(profile: ProfileConfigV1): ComputedProfileStyle {
  const { layout, theme, effects, avatar, links, badges } = profile;
  const fontMain = resolveFontStack(theme.fontFamily, theme.customFontName);
  const fontUser = theme.usernameFontFamily
    ? resolveFontStack(theme.usernameFontFamily, theme.customFontName)
    : fontMain;

  const washAlpha = clamp(effects.background.washStrength, 0, 100) / 100;
  const washCss =
    washAlpha > 0
      ? `linear-gradient(to top, ${effects.background.colorWash} 0%, transparent 72%)`
      : 'none';

  const vars: Record<string, string> = {
    '--bio-accent': theme.accent,
    '--bio-text': theme.text,
    '--bio-text-muted': `color-mix(in srgb, ${theme.text} 68%, transparent)`,
    '--bio-text-subtle': `color-mix(in srgb, ${theme.text} 46%, transparent)`,
    '--bio-bg': theme.background,
    '--bio-card-color': theme.cardColor,
    '--bio-grad': theme.gradientColor,
    '--bio-icon': theme.iconColor,
    '--bio-fx1': theme.fx1,
    '--bio-fx2': theme.fx2,
    '--bio-efx1': effects.effectColor1,
    '--bio-efx2': effects.effectColor2,
    '--bio-font': fontMain,
    '--bio-name-font': fontUser,
    '--bio-font-scale': String(clamp(theme.fontSizeScale, 0.75, 1.5)),
    '--bio-name-size': `${clamp(theme.usernameSize, 18, 96)}px`,
    '--bio-name-weight': String(theme.usernameWeight),
    '--bio-letter-spacing': `${theme.letterSpacing}em`,
    '--bio-page-scale': String(clamp(layout.pageScale, 85, 150) / 100),
    '--bio-card-w': `${clamp(layout.cardWidth, 340, 920)}px`,
    '--bio-card-h': layout.cardHeight > 0 ? `${clamp(layout.cardHeight, 220, 900)}px` : 'auto',
    '--bio-card-blur': `${clamp(layout.cardBlur, 0, 50)}px`,
    '--bio-card-radius': `${clamp(layout.cardRadius, 0, 40)}px`,
    '--bio-card-fade': String(clamp(layout.cardContentFade, 40, 100) / 100),
    '--bio-border-w': layout.borderStyle === 'none' ? '0px' : `${clamp(layout.borderWidth, 0, 8)}px`,
    '--bio-border-color': `color-mix(in srgb, ${theme.text} 22%, transparent)`,
    '--bio-avatar-size': `${clamp(avatar.size, 64, 200)}px`,
    '--bio-avatar-blur': `${clamp(avatar.blur, 0, 10)}px`,
    '--bio-avatar-obj-x': `${clamp(avatar.objectX, 0, 100)}%`,
    '--bio-avatar-obj-y': `${clamp(avatar.objectY, 0, 100)}%`,
    '--bio-avatar-scale': String(clamp(avatar.scale, 0.5, 2)),
    '--bio-avatar-frame': avatar.frameColor || theme.accent,
    '--bio-banner-fade': `${clamp(avatar.bannerFade, 0, 100)}%`,
    '--bio-bg-dim': String(clamp(effects.background.dim, 0, 90) / 100),
    '--bio-media-blur': `${clamp(effects.background.mediaBlur, 0, 40)}px`,
    '--bio-video-opacity': String(clamp(effects.background.videoOpacity, 10, 100) / 100),
    '--bio-wash-opacity': String(washAlpha),
    '--bio-icon-size': `${clamp(links.iconSizePx, 24, 56)}px`,
    '--bio-badge-scale': String(clamp(badges.sizePct, 60, 200) / 100),
    '--bio-badge-glow': badges.glowColor || theme.accent
  };

  for (const [slot, val] of Object.entries(theme.specificTextColors)) {
    if (val) vars[`--bio-slot-${slot}`] = val;
  }

  const rootVars = Object.entries(vars)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');

  const wrapperClasses = [
    `bio-mode-${layout.pageMode}`,
    `bio-layout-${layout.cardLayout}`,
    `bio-align-${layout.alignment}`,
    `bio-cs-${layout.cardStyle}`,
    `bio-pat-${layout.cardSurfacePattern}`,
    `bio-border-${layout.borderStyle}`,
    `bio-banim-${layout.borderAnimated}`,
    `bio-hover-${layout.cardHoverEffect}`,
    `bio-in-${layout.entranceAnimation}`,
    `bio-stagger-${layout.elementsStagger}`,
    `bio-bgfx-${effects.background.filter}`,
    `bio-bio-size-${theme.bioSize}`
  ];

  return {
    rootVars,
    backgroundCss: buildBackgroundStyle(profile),
    washCss,
    cardSurfaceCss: buildCardSurfaceStyle(profile),
    wrapperClasses
  };
}
