// Сборка пресета: база из createDefaultProfile, затем замеры, затем проверка по JSON-схеме.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

const BASE_PATH = path.join(here, 'base-profile.json');
const SCHEMA_PATH = path.join(root, 'schema', 'profile.v1.schema.json');

export function deepMerge(base, patch) {
  if (Array.isArray(patch)) return patch.map((v) => (v && typeof v === 'object' ? deepMerge({}, v) : v));
  if (patch && typeof patch === 'object') {
    const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      out[key] = deepMerge(out[key], value);
    }
    return out;
  }
  return patch;
}

export async function loadBase() {
  return JSON.parse(await fs.readFile(BASE_PATH, 'utf8'));
}

const NEUTRAL = {
  meta: { animatedTabTitle: false, nsfwGate: false, passcode: '', passcodeHint: '' },
  identity: {
    uid: 1,
    showUid: false,
    showJoinDate: false,
    pronounsLeft: '',
    pronounsRight: '',
    location: '',
    status: '',
    tagAlign: 'center',
    tags: [],
    verified: { enabled: false, placement: 'displayName', color: '#ffffff' }
  },
  avatar: {
    visible: true,
    blur: 0,
    objectX: 50,
    objectY: 50,
    scale: 1,
    frameStyle: 'none',
    decoration: 'none',
    expandOnClick: false,
    protectImage: false,
    bannerUrl: '',
    bannerFade: 0,
    bannerAvatarCutout: false
  },
  layout: {
    pageMode: 'card',
    cardContentFade: 100,
    borderAnimated: 'none',
    cardHoverEffect: 'none',
    tiltStrength: 4,
    elementsStagger: 'none',
    cardDelaySec: 0
  },
  theme: { fontSizeScale: 1, bioSize: 'medium', usernameFontFamily: '', specificTextColors: {} },
  effects: {
    extraNameGlow: false,
    background: { dim: 0, washStrength: 0, videoOpacity: 100, videoMuted: true, fit: 'cover', filter: 'none' },
    typewriter: { phrases: [], typeSpeed: 6, deleteSpeed: 7, caret: 'bar', loop: true },
    cursor: { clickSound: 'none', clickVolume: 0, sizePct: 100, trailSpeed: 'normal' }
  },
  audio: { enabled: false, tracks: [], playerStyle: 'hidden', showCornerVolume: false, visualizer: 'off' },
  links: { items: [] },
  badges: { items: [] },
  blocks: []
};

export async function buildPreset(overrides, slug) {
  const base = deepMerge(await loadBase(), NEUTRAL);
  const preset = deepMerge(base, overrides);
  preset.schemaVersion = 1;
  preset.theme.presetId = slug;
  preset.meta.showBrandingFooter = false;
  preset.analytics = { ...preset.analytics, trackViews: false, showViewsBadge: false, trackClicks: false };
  return preset;
}

export async function validatePreset(preset) {
  const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const ok = validate(preset);
  return { ok, errors: ok ? [] : (validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`) };
}

/** Валидация с человекочитаемой ошибкой. */
export async function assertValid(preset) {
  const { ok, errors } = await validatePreset(preset);
  if (!ok) {
    throw new Error('пресет не соответствует schema/profile.v1.schema.json:\n  ' + errors.slice(0, 12).join('\n  '));
  }
}
