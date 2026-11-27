// Запись canvas-эффектов: единственный способ сохранить то, чего нет в CSS.

const MAX_CANVASES = 3;

async function recordOne(canvas, durationMs) {
  const stream = canvas.captureStream(25);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime) return null;
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const done = new Promise((resolve) => {
    recorder.onstop = resolve;
  });
  recorder.start();
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  recorder.stop();
  await done;
  stream.getTracks().forEach((t) => t.stop());
  const blob = new Blob(chunks, { type: mime });
  if (!blob.size) return null;
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buffer.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, buffer.subarray(i, i + 0x8000));
  }
  return { mime, base64: btoa(binary) };
}

export async function recordCanvases(page, outDir, { durationMs = 3000, limit = MAX_CANVASES } = {}) {
  const saved = [];
  const count = await page.evaluate((max) => {
    const list = Array.from(document.querySelectorAll('canvas')).filter((c) => c.width > 2 && c.height > 2);
    window.__capCanvases = list.slice(0, max);
    return window.__capCanvases.length;
  }, limit);
  for (let i = 0; i < count; i += 1) {
    const result = await page.evaluate(recordOne, durationMs).catch(() => null);
    if (!result) continue;
    const name = `canvas-${i + 1}.webm`;
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    await fs.writeFile(path.join(outDir, name), Buffer.from(result.base64, 'base64'));
    saved.push(name);
  }
  return saved;
}
