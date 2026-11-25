import { describe, expect, it } from 'vitest';
import { createDefaultProfile, normalizeProfile } from '../schema/profile';
import { SKIN_PRESETS } from '../schema/presets';
import { computeProfileStyle } from '../engine/themeCss';
import { renderBioMarkup } from '../engine/bioMarkdown';
import { activeLrcIndex, parseLrc } from '../engine/effects/lrcParser';
import { computeTiltAngles } from '../engine/effects/tilt';

describe('profile schema and presets', () => {
  it('normalizes partial JSON cleanly preserving schemaVersion 1', () => {
    const normalized = normalizeProfile({
      identity: { displayName: 'Tester', username: 'test', bio: 'hi', tags: ['a'] },
      analytics: { trackViews: false, showViewsBadge: false }
    });
    expect(normalized.schemaVersion).toBe(1);
    expect(normalized.identity.displayName).toBe('Tester');
    expect(normalized.analytics.trackViews).toBe(false);
    expect(normalized.links.items.length).toBeGreaterThan(0);
  });

  it('applies all 8 skin presets without erasing user identity or links', () => {
    const base = createDefaultProfile();
    base.identity.displayName = 'Custom Owner';
    for (const preset of SKIN_PRESETS) {
      const next = preset.apply(structuredClone(base));
      expect(next.identity.displayName).toBe('Custom Owner');
      expect(next.theme.presetId).toBe(preset.id);
      const css = computeProfileStyle(next);
      expect(css.rootVars).toContain('--bio-accent:');
    }
  });
});

describe('theme CSS mapper', () => {
  it('renders transparent card surface when cardLayout is transparent', () => {
    const p = createDefaultProfile();
    p.layout.cardLayout = 'transparent';
    const css = computeProfileStyle(p);
    expect(css.cardSurfaceCss).toBe('transparent');
    expect(css.wrapperClasses).toContain('bio-layout-transparent');
  });

  it('builds linear gradient with custom 0..360 angle', () => {
    const p = createDefaultProfile();
    p.effects.background.type = 'linear';
    p.effects.background.gradientAngle = 215;
    const css = computeProfileStyle(p);
    expect(css.backgroundCss).toContain('linear-gradient(215deg');
  });
});

describe('bio markup sanitizer', () => {
  it('escapes raw HTML tags and strips unsafe javascript: links', () => {
    const out = renderBioMarkup('<script>alert(1)</script> **Hi** [bad](javascript:alert(1)) [ok](https://example.com)');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('<strong>Hi</strong>');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('href="https://example.com/"');
  });
});

describe('lrc parser and tilt math', () => {
  it('parses synced lyrics and finds active line index', () => {
    const lines = parseLrc('[00:02.50] First line\n[00:10.00] Second line');
    expect(lines).toHaveLength(2);
    expect(activeLrcIndex(lines, 1.0)).toBe(-1);
    expect(activeLrcIndex(lines, 3.0)).toBe(0);
    expect(activeLrcIndex(lines, 12.0)).toBe(1);
  });

  it('clamps tilt angles symmetrically around center', () => {
    const center = computeTiltAngles(500, 300, { left: 0, top: 0, width: 1000, height: 600 }, 5);
    expect(center.rx).toBe(0);
    expect(center.ry).toBe(0);
    const corner = computeTiltAngles(1000, 0, { left: 0, top: 0, width: 1000, height: 600 }, 10);
    expect(Math.abs(corner.rx)).toBeLessThanOrEqual(14);
    expect(Math.abs(corner.ry)).toBeLessThanOrEqual(14);
  });
});
