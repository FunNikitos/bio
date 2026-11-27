// Локальное сохранение ассетов: имена по хешу содержимого, карта URL → путь.

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const EXT_BY_TYPE = {
  'font/woff2': '.woff2',
  'font/woff': '.woff',
  'font/ttf': '.ttf',
  'font/otf': '.otf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/ogg': '.ogg',
  'text/css': '.css',
  'application/javascript': '.js',
  'text/javascript': '.js'
};

const EXT_BY_PATH = {
  '.woff2': '.woff2',
  '.woff': '.woff',
  '.ttf': '.ttf',
  '.otf': '.otf',
  '.png': '.png',
  '.jpg': '.jpg',
  '.jpeg': '.jpg',
  '.webp': '.webp',
  '.gif': '.gif',
  '.svg': '.svg',
  '.avif': '.avif',
  '.mp4': '.mp4',
  '.webm': '.webm',
  '.wav': '.wav',
  '.mp3': '.mp3',
  '.m4a': '.m4a',
  '.ogg': '.ogg',
  '.cur': '.cur',
  '.css': '.css',
  '.js': '.js',
  '.lottie': '.json',
  '.json': '.json'
};

export const CAPTURE_RESOURCE_TYPES = new Set(['font', 'image', 'media', 'stylesheet', 'script']);

function pickExt(contentType, url) {
  const type = (contentType || '').split(';')[0].trim().toLowerCase();
  if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return EXT_BY_PATH[ext] || '';
}

function isSkippable(url) {
  return !/^https?:|^file:/.test(url) || url.startsWith('data:') || url.includes('/cdn-cgi/');
}

export function createHarvester({ assetDir, baseUrl }) {
  const byUrl = new Map();
  const pending = new Map();
  const files = [];

  async function download(url, contentType, body) {
    if (byUrl.has(url)) return byUrl.get(url);
    if (pending.has(url)) return pending.get(url);
    const task = (async () => {
      let buffer = body;
      let type = contentType;
      if (!buffer) {
        if (url.startsWith('file:')) {
          const { fileURLToPath } = await import('node:url');
          const filePath = fileURLToPath(url);
          buffer = await fs.readFile(filePath).catch(() => null);
          if (!buffer) return null;
          type = path.extname(filePath);
        } else {
          const res = await fetch(url, { headers: { 'user-agent': 'bio-style-capture/1' } }).catch(() => null);
          if (!res || !res.ok) return null;
          type = res.headers.get('content-type') || '';
          buffer = Buffer.from(await res.arrayBuffer());
        }
      }
      const ext = pickExt(type, url);
      if (!ext) return null;
      if (buffer.length === 0 || buffer.length > 40 * 1024 * 1024) return null;
      const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
      const name = hash + ext;
      await fs.mkdir(assetDir, { recursive: true });
      await fs.writeFile(path.join(assetDir, name), buffer);
      const record = { url, file: name, bytes: buffer.length, contentType: type };
      byUrl.set(url, record);
      files.push(record);
      return record;
    })();
    pending.set(url, task);
    const result = await task;
    pending.delete(url);
    return result;
  }

  /** Переписывает url(...) и @import внутри CSS на локальные копии. */
  async function localizeCss(text, cssUrl) {
    const urls = [];
    const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
    let m;
    while ((m = re.exec(text))) {
      const raw = m[1].trim();
      if (raw.startsWith('data:')) continue;
      try {
        urls.push(new URL(raw, cssUrl).href);
      } catch {
        /* пропускаем неразбираемое */
      }
    }
    for (const url of urls) {
      if (isSkippable(url)) continue;
      await download(url).catch(() => null);
    }
    let out = text;
    for (const [url, record] of byUrl) {
      out = out.split(url).join('./' + record.file);
    }
    return out;
  }

  return {
    files,
    map: byUrl,
    async handleResponse(response) {
      const request = response.request();
      if (!response.ok()) return null;
      const type = request.resourceType();
      const url = response.url();
      if (!CAPTURE_RESOURCE_TYPES.has(type) || isSkippable(url)) return null;
      let body;
      try {
        body = await response.body();
      } catch {
        return null;
      }
      if (!body || body.length === 0) return null;
      let buffer = body;
      if (type === 'stylesheet') {
        const local = await download(url, 'text/css', Buffer.from(await localizeCss(body.toString('utf8'), url)));
        return local;
      }
      return download(url, response.headers()['content-type'], buffer);
    },
    async save(url, body, contentType) {
      return download(url, contentType, body);
    },
    local(url) {
      const record = byUrl.get(url);
      return record ? record.file : null;
    },
    /** Заменяет все скачанные абсолютные URL на относительные пути. */
    rewrite(text) {
      let out = text;
      for (const [url, record] of byUrl) {
        out = out.split(url).join('./assets/' + record.file);
        out = out.split(url.replace(/&/g, '&amp;')).join('./assets/' + record.file);
      }
      return out;
    },
    setBase(value) {
      baseUrl = value;
    }
  };
}
