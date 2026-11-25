export function computeTiltAngles(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  strength: number
): { rx: number; ry: number } {
  if (rect.width <= 0 || rect.height <= 0) return { rx: 0, ry: 0 };
  const dx = (clientX - rect.left) / rect.width - 0.5;
  const dy = (clientY - rect.top) / rect.height - 0.5;
  const maxDeg = Math.min(14, Math.max(2, strength * 1.35));
  const rx = Number((-dy * 2 * maxDeg).toFixed(2));
  const ry = Number((dx * 2 * maxDeg).toFixed(2));
  return { rx, ry };
}

export function attachTilt(
  el: HTMLElement,
  enabled: boolean,
  mode: 'screen' | 'parallax',
  strength: number
): () => void {
  const clear = () => {
    el.style.removeProperty('--tilt-x');
    el.style.removeProperty('--tilt-y');
  };

  if (!enabled) {
    clear();
    return () => {};
  }

  const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) {
    clear();
    return () => {};
  }

  const onMove = (e: PointerEvent) => {
    const rect =
      mode === 'screen'
        ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
        : el.getBoundingClientRect();
    const { rx, ry } = computeTiltAngles(e.clientX, e.clientY, rect, strength);
    el.style.setProperty('--tilt-x', `${rx}deg`);
    el.style.setProperty('--tilt-y', `${ry}deg`);
  };

  const target: HTMLElement | Window = mode === 'screen' ? window : el;
  target.addEventListener('pointermove', onMove as EventListener, { passive: true });
  el.addEventListener('pointerleave', clear);

  return () => {
    target.removeEventListener('pointermove', onMove as EventListener);
    el.removeEventListener('pointerleave', clear);
    clear();
  };
}
