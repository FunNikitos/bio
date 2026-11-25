export interface TypewriterOptions {
  phrases: string[];
  typeSpeed: number;
  deleteSpeed: number;
  loop: boolean;
}

export function startTypewriter(
  phrases: string[],
  typeSpeed: number,
  deleteSpeed: number,
  loop: boolean,
  onUpdate: (text: string) => void
): () => void {
  const clean = phrases.map((p) => p.trim()).filter(Boolean);
  if (clean.length === 0) {
    onUpdate('');
    return () => {};
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    onUpdate(clean[0]);
    return () => {};
  }

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let timer = 0;
  let cancelled = false;

  const typeMs = Math.max(25, 165 - typeSpeed * 13);
  const delMs = Math.max(20, 125 - deleteSpeed * 10);

  const step = () => {
    if (cancelled) return;
    const current = clean[phraseIdx];

    if (!deleting) {
      charIdx++;
      onUpdate(current.slice(0, charIdx));
      if (charIdx >= current.length) {
        if (!loop && phraseIdx === clean.length - 1) return;
        deleting = true;
        timer = window.setTimeout(step, 1400);
        return;
      }
      timer = window.setTimeout(step, typeMs);
    } else {
      charIdx--;
      onUpdate(current.slice(0, Math.max(0, charIdx)));
      if (charIdx <= 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % clean.length;
        timer = window.setTimeout(step, 320);
        return;
      }
      timer = window.setTimeout(step, delMs);
    }
  };

  onUpdate('');
  timer = window.setTimeout(step, 120);
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}

const SCRAMBLE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*';

export function startScramble(target: string, onUpdate: (text: string) => void): () => void {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !target) {
    onUpdate(target);
    return () => {};
  }

  let step = 0;
  let stopped = false;
  const maxSteps = Math.max(12, target.length * 3);
  const timer = window.setInterval(() => {
    if (stopped) return;
    step++;
    const revealed = Math.floor((step / maxSteps) * target.length);
    const next = target
      .split('')
      .map((ch, idx) => {
        if (ch === ' ') return ' ';
        if (idx < revealed) return ch;
        return SCRAMBLE_ALPHABET[Math.floor(Math.random() * SCRAMBLE_ALPHABET.length)];
      })
      .join('');
    onUpdate(next);
    if (step >= maxSteps) {
      onUpdate(target);
      clearInterval(timer);
    }
  }, 45);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

export function startAnimatedTitle(titleText: string, enabled: boolean): () => void {
  const clean = titleText.trim() || 'bio';
  if (!enabled) {
    document.title = clean;
    return () => {};
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    document.title = clean;
    return () => {};
  }

  let pos = 1;
  let dir = 1;
  const id = window.setInterval(() => {
    document.title = clean.slice(0, Math.max(1, pos));
    pos += dir;
    if (pos >= clean.length) dir = -1;
    else if (pos <= 1) dir = 1;
  }, 320);

  return () => clearInterval(id);
}
