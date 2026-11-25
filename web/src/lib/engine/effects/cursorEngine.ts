import type { ClickSound, CursorTrail } from '../../schema/profile';

interface TrailDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

let sharedAudioCtx: AudioContext | null = null;

export function playClickSound(sound: ClickSound, volumePct: number): void {
  if (sound === 'none' || volumePct <= 0) return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new Ctx();
    if (sharedAudioCtx.state === 'suspended') void sharedAudioCtx.resume();

    const now = sharedAudioCtx.currentTime;
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    const vol = Math.min(1, Math.max(0, volumePct / 100)) * 0.18;

    const specs: Record<Exclude<ClickSound, 'none'>, { freq: number; endFreq: number; dur: number; type: OscillatorType }> = {
      tap: { freq: 520, endFreq: 220, dur: 0.045, type: 'sine' },
      click: { freq: 980, endFreq: 320, dur: 0.035, type: 'triangle' },
      pop: { freq: 340, endFreq: 740, dur: 0.06, type: 'sine' },
      bubble: { freq: 420, endFreq: 880, dur: 0.09, type: 'sine' },
      blip: { freq: 720, endFreq: 1080, dur: 0.065, type: 'square' },
      coin: { freq: 987, endFreq: 1318, dur: 0.12, type: 'triangle' }
    };

    const spec = specs[sound];
    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.freq, now);
    osc.frequency.exponentialRampToValueAtTime(spec.endFreq, now + spec.dur);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + spec.dur);

    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start(now);
    osc.stop(now + spec.dur);
  } catch {
    // Ignore Web Audio errors when blocked by autoplay policy.
  }
}

export function startCursorTrail(
  canvas: HTMLCanvasElement,
  trail: CursorTrail,
  color: string,
  speed: 'slow' | 'normal' | 'fast'
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx || trail === 'none' || trail === 'oneko-cat') {
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    return () => {};
  }

  const fine = window.matchMedia?.('(pointer: fine)').matches ?? true;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return () => {};

  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);
  const dots: TrailDot[] = [];
  let hue = 0;
  let lastPointer = { x: w / 2, y: h / 2 };

  const lifeFrames = speed === 'slow' ? 42 : speed === 'fast' ? 18 : 28;

  const onResize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };

  const onMove = (e: PointerEvent) => {
    lastPointer = { x: e.clientX, y: e.clientY };
    hue = (hue + 9) % 360;
    const spawnCount = trail === 'sparkles' || trail === 'embers' ? 2 : 1;
    for (let i = 0; i < spawnCount; i++) {
      dots.push({
        x: e.clientX + (Math.random() - 0.5) * 6,
        y: e.clientY + (Math.random() - 0.5) * 6,
        vx: trail === 'smoke' || trail === 'embers' ? (Math.random() - 0.5) * 1.1 : (Math.random() - 0.5) * 0.6,
        vy: trail === 'smoke' ? -0.9 : trail === 'bubbles' ? -0.7 : (Math.random() - 0.5) * 0.6,
        life: lifeFrames,
        maxLife: lifeFrames,
        size: trail === 'ring' ? 10 : trail === 'smoke' ? 7 : 3.5 + Math.random() * 2.5,
        hue
      });
    }
    if (dots.length > 140) dots.splice(0, dots.length - 140);
  };

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onMove, { passive: true });

  let raf = 0;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    if (trail === 'ring' || trail === 'ghost') {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lastPointer.x, lastPointer.y, trail === 'ring' ? 14 : 9, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.x += d.vx;
      d.y += d.vy;
      d.life -= 1;
      if (d.life <= 0) {
        dots.splice(i, 1);
        continue;
      }

      const ratio = d.life / d.maxLife;
      ctx.globalAlpha = ratio * 0.85;
      const fill = trail === 'rainbow' ? `hsl(${d.hue}, 90%, 66%)` : color;

      if (trail === 'hearts') {
        ctx.fillStyle = fill;
        ctx.font = `${Math.round(d.size * 2.4)}px sans-serif`;
        ctx.fillText('♥', d.x - 4, d.y + 4);
      } else if (trail === 'sparkles') {
        ctx.fillStyle = fill;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(ratio * 2);
        const s = d.size * ratio;
        ctx.fillRect(-s, -0.8, s * 2, 1.6);
        ctx.fillRect(-0.8, -s, 1.6, s * 2);
        ctx.restore();
      } else if (trail === 'bubbles' || trail === 'ring') {
        ctx.strokeStyle = fill;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * (trail === 'ring' ? 1.4 - ratio * 0.6 : ratio), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * (trail === 'smoke' ? 1.8 - ratio * 0.7 : ratio), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  };

  raf = requestAnimationFrame(draw);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onMove);
  };
}
