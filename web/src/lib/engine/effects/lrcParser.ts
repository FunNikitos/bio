export interface LrcLine {
  timeSec: number;
  text: string;
}

const LINE_RE = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/;

export function parseLrc(raw: string): LrcLine[] {
  if (!raw.trim()) return [];
  const lines: LrcLine[] = [];
  for (const row of raw.split(/\r?\n/)) {
    const match = row.match(LINE_RE);
    if (!match) continue;
    const mins = Number(match[1]);
    const secs = Number(match[2]);
    const frac = match[3] ? Number(match[3].padEnd(3, '0')) / 1000 : 0;
    const text = match[4].trim();
    if (text) lines.push({ timeSec: mins * 60 + secs + frac, text });
  }
  return lines.sort((a, b) => a.timeSec - b.timeSec);
}

export function activeLrcIndex(lines: LrcLine[], currentTimeSec: number): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (currentTimeSec >= lines[i].timeSec) idx = i;
    else break;
  }
  return idx;
}
