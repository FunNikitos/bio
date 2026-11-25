import type { ParticleEffect } from '../../schema/profile';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  char?: string;
  color: string;
}

const MATRIX_CHARS = '01アイウエオカキクケコBIO<>/*';

export function startParticleCanvas(
  canvas: HTMLCanvasElement,
  effect: ParticleEffect,
  color1: string,
  color2: string,
  intensity: number
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx || effect === 'none') {
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    return () => {};
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return () => {};

  let width = (canvas.width = canvas.clientWidth || window.innerWidth);
  let height = (canvas.height = canvas.clientHeight || window.innerHeight);

  const onResize = () => {
    width = canvas.width = canvas.clientWidth || window.innerWidth;
    height = canvas.height = canvas.clientHeight || window.innerHeight;
  };
  window.addEventListener('resize', onResize);

  const baseCount = effect === 'stars' ? 90 : effect === 'rain' || effect === 'diagonal-rain' ? 110 : 55;
  const count = Math.max(12, Math.round(baseCount * Math.min(2.5, Math.max(0.2, intensity))));

  const makeParticle = (scatterY = false): Particle => {
    const pickColor = Math.random() > 0.45 ? color1 : color2;
    const x = Math.random() * width;
    const y = scatterY ? Math.random() * height : effect === 'embers' || effect === 'bubbles' ? height + 16 : -16;

    switch (effect) {
      case 'snow':
        return { x, y, vx: (Math.random() - 0.5) * 0.6, vy: 0.7 + Math.random() * 1.4, size: 1.5 + Math.random() * 3, alpha: 0.35 + Math.random() * 0.6, phase: Math.random() * 6.28, color: '#ffffff' };
      case 'rain':
        return { x, y, vx: 0, vy: 9 + Math.random() * 6, size: 12 + Math.random() * 10, alpha: 0.22 + Math.random() * 0.35, phase: 0, color: pickColor };
      case 'diagonal-rain':
        return { x, y, vx: -3.2 - Math.random() * 1.5, vy: 9 + Math.random() * 6, size: 14 + Math.random() * 12, alpha: 0.25 + Math.random() * 0.4, phase: 0, color: pickColor };
      case 'stars':
        return { x, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12, size: 0.8 + Math.random() * 2, alpha: 0.2 + Math.random() * 0.8, phase: Math.random() * 6.28, color: pickColor };
      case 'embers':
        return { x, y, vx: (Math.random() - 0.5) * 0.9, vy: -(0.8 + Math.random() * 1.8), size: 1.5 + Math.random() * 2.8, alpha: 0.45 + Math.random() * 0.55, phase: Math.random() * 6.28, color: pickColor };
      case 'fireflies':
        return { x, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55, size: 2 + Math.random() * 2.5, alpha: 0.3 + Math.random() * 0.7, phase: Math.random() * 6.28, color: pickColor };
      case 'sakura':
        return { x, y, vx: -0.6 + Math.random() * 1.4, vy: 0.9 + Math.random() * 1.3, size: 4 + Math.random() * 4.5, alpha: 0.5 + Math.random() * 0.45, phase: Math.random() * 6.28, color: pickColor };
      case 'bubbles':
        return { x, y, vx: (Math.random() - 0.5) * 0.4, vy: -(0.6 + Math.random() * 1.2), size: 4 + Math.random() * 9, alpha: 0.18 + Math.random() * 0.32, phase: Math.random() * 6.28, color: pickColor };
      case 'confetti':
        return { x, y, vx: (Math.random() - 0.5) * 1.4, vy: 1.4 + Math.random() * 2.2, size: 4 + Math.random() * 4, alpha: 0.7 + Math.random() * 0.3, phase: Math.random() * 6.28, color: ['#f43f5e', '#38bdf8', '#f5c451', '#a855f7', '#22c55e'][Math.floor(Math.random() * 5)] };
      case 'matrix':
        return { x: Math.floor(Math.random() * (width / 16)) * 16, y: scatterY ? Math.random() * height : -16, vx: 0, vy: 2.5 + Math.random() * 3.5, size: 14, alpha: 0.35 + Math.random() * 0.6, phase: 0, char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)], color: pickColor };
      case 'geometric':
      default:
        return { x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45, size: 2.5, alpha: 0.45, phase: Math.random() * 6.28, color: pickColor };
    }
  };

  const particles: Particle[] = Array.from({ length: count }, () => makeParticle(true));
  let raf = 0;

  const tick = () => {
    ctx.clearRect(0, 0, width, height);

    if (effect === 'geometric') {
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 115) {
            ctx.strokeStyle = a.color;
            ctx.globalAlpha = (1 - dist / 115) * 0.28;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = a.color;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
      return;
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.phase += 0.03;
      p.x += p.vx + (effect === 'snow' || effect === 'sakura' ? Math.sin(p.phase) * 0.4 : 0);
      p.y += p.vy;

      const outBottom = p.y > height + 24;
      const outTop = p.y < -24;
      const outSide = p.x < -30 || p.x > width + 30;
      if (outBottom || (effect !== 'stars' && effect !== 'fireflies' && outTop) || outSide) {
        if (effect === 'stars' || effect === 'fireflies') {
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        } else {
          particles[i] = makeParticle(false);
          continue;
        }
      }

      ctx.globalAlpha = effect === 'stars' || effect === 'fireflies' ? p.alpha * (0.5 + 0.5 * Math.sin(p.phase)) : p.alpha;

      if (effect === 'rain' || effect === 'diagonal-rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 1.4, p.y + p.size);
        ctx.stroke();
      } else if (effect === 'matrix') {
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px monospace`;
        if (Math.random() < 0.04) p.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillText(p.char || '1', p.x, p.y);
      } else if (effect === 'sakura' || effect === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (effect === 'sakura') {
          ctx.ellipse(0, 0, p.size, p.size * 0.58, 0, 0, Math.PI * 2);
        } else {
          ctx.rect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        }
        ctx.fill();
        ctx.restore();
      } else if (effect === 'bubbles') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}
