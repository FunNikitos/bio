import http from 'node:http';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AuthManager } from './auth.mjs';
import { ProfileStore } from './store.mjs';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.cur': 'application/octet-stream'
};

function sendJson(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...extraHeaders
  });
  res.end(body);
}

async function readBodyBuffer(req, maxBytes = 35 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw Object.assign(new Error('Файл или тело запроса слишком большое'), { status: 413 });
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const buf = await readBodyBuffer(req, 2 * 1024 * 1024);
  try {
    return JSON.parse(buf.toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('Некорректный JSON'), { status: 400 });
  }
}

function parseMultipartFile(contentType, bodyBuffer) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) {
    throw Object.assign(new Error('Отсутствует boundary для загрузки'), { status: 400 });
  }
  const boundary = `--${match[1] || match[2]}`;
  const rawLatin = bodyBuffer.toString('latin1');
  const parts = rawLatin.split(boundary);
  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headers = part.slice(0, headerEnd);
    const filenameMatch = headers.match(/filename="([^"]+)"/i);
    if (!filenameMatch) continue;
    let bodyLatin = part.slice(headerEnd + 4);
    if (bodyLatin.endsWith('\r\n')) bodyLatin = bodyLatin.slice(0, -2);
    return {
      filename: filenameMatch[1],
      buffer: Buffer.from(bodyLatin, 'latin1')
    };
  }
  throw Object.assign(new Error('Файл не найден в форме'), { status: 400 });
}

export async function createBioApp({ dataDir, distDir, setupToken = '' }) {
  await fs.mkdir(dataDir, { recursive: true });
  const store = new ProfileStore(dataDir);
  const auth = new AuthManager(dataDir, setupToken);
  await store.init();
  const initialSetupCode = await auth.init();

  const serveFileSafe = async (req, res, baseDir, relPath) => {
    const cleanRel = relPath.replace(/^\/+/, '');
    const target = path.resolve(baseDir, cleanRel);
    const resolvedBase = path.resolve(baseDir);
    if (!target.startsWith(resolvedBase + path.sep) && target !== resolvedBase) {
      return sendJson(res, 403, { error: 'Forbidden' });
    }
    try {
      const stat = await fs.stat(target);
      if (!stat.isFile()) return false;
      const ext = path.extname(target).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const total = stat.size;
      const rangeHeader = req.headers.range;

      if (rangeHeader && total > 0) {
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (!match) {
          res.writeHead(416, { 'Content-Range': `bytes */${total}` });
          res.end();
          return true;
        }
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(total - 1, Number(match[2])) : total - 1;
        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
          res.writeHead(416, { 'Content-Range': `bytes */${total}` });
          res.end();
          return true;
        }
        res.writeHead(206, {
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Content-Length': end - start + 1
        });
        fsSync.createReadStream(target, { start, end }).pipe(res);
        return true;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': total
      });
      fsSync.createReadStream(target).pipe(res);
      return true;
    } catch {
      return false;
    }
  };

  const handler = async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method || 'GET';

    try {
      // Public API
      if (method === 'GET' && pathname === '/api/public/profile') {
        const preview = url.searchParams.get('preview') === 'draft';
        if (preview && !auth.isAuthenticated(req)) {
          return sendJson(res, 401, { error: 'Требуется вход для просмотра черновика' });
        }
        const profile = await store.getPublicProfile(preview);
        const analytics = await store.getAnalytics();
        return sendJson(res, 200, { profile, analytics, isPreview: preview });
      }

      if (method === 'POST' && pathname === '/api/public/view') {
        const views = await store.recordView();
        return sendJson(res, 200, { views });
      }
      if (method === 'POST' && pathname === '/api/public/like') {
        const likes = await store.recordLike();
        return sendJson(res, 200, { likes });
      }
      if (method === 'POST' && pathname === '/api/public/click') {
        const body = await readJsonBody(req);
        const clicks = await store.recordClick(body.linkId);
        return sendJson(res, 200, { clicks });
      }

      // Admin Auth
      if (method === 'GET' && pathname === '/api/admin/state') {
        const hasOwner = await auth.hasOwner();
        const isAuth = auth.isAuthenticated(req);
        if (!isAuth) {
          return sendJson(res, 200, { authenticated: false, needsSetup: !hasOwner });
        }
        const draft = await store.getDraft();
        const published = await store.getPublished();
        const analytics = await store.getAnalytics();
        const hasUnpublishedChanges = !published || JSON.stringify(draft) !== JSON.stringify(published);
        return sendJson(res, 200, { authenticated: true, needsSetup: false, draft, published, hasUnpublishedChanges, analytics });
      }

      if (method === 'POST' && pathname === '/api/admin/setup') {
        const body = await readJsonBody(req);
        const cookie = await auth.setupOwner(body.setupCode, body.password);
        return sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookie });
      }

      if (method === 'POST' && pathname === '/api/admin/login') {
        const body = await readJsonBody(req);
        const cookie = await auth.login(body.password);
        return sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookie });
      }

      if (method === 'POST' && pathname === '/api/admin/logout') {
        return sendJson(res, 200, { ok: true }, { 'Set-Cookie': auth.clearSessionCookie() });
      }

      // Protected Admin Endpoints
      if (pathname.startsWith('/api/admin/')) {
        if (!auth.isAuthenticated(req)) {
          return sendJson(res, 401, { error: 'Требуется авторизация' });
        }
        if (method === 'PUT' && pathname === '/api/admin/draft') {
          const body = await readJsonBody(req);
          const draft = await store.saveDraft(body);
          return sendJson(res, 200, { ok: true, draft });
        }
        if (method === 'POST' && pathname === '/api/admin/publish') {
          const published = await store.publishDraft();
          return sendJson(res, 200, { ok: true, published });
        }
        if (method === 'POST' && pathname === '/api/admin/import') {
          const body = await readJsonBody(req);
          const draft = await store.saveDraft(body);
          return sendJson(res, 200, { ok: true, draft });
        }
        if (method === 'POST' && pathname === '/api/admin/upload') {
          const buf = await readBodyBuffer(req);
          const { filename, buffer } = parseMultipartFile(req.headers['content-type'] || '', buf);
          const result = await store.saveUpload(filename, buffer);
          return sendJson(res, 200, result);
        }
      }

      // Uploads static files
      if (method === 'GET' && pathname.startsWith('/uploads/')) {
        const ok = await serveFileSafe(req, res, store.uploadsDir, pathname.slice('/uploads/'.length));
        if (ok !== false) return;
        return sendJson(res, 404, { error: 'Файл не найден' });
      }

      // Built Svelte SPA assets & routes (/ and /admin)
      if (method === 'GET' && distDir) {
        if (pathname !== '/' && !pathname.startsWith('/admin')) {
          const served = await serveFileSafe(req, res, distDir, pathname);
          if (served) return;
        }
        const indexServed = await serveFileSafe(req, res, distDir, 'index.html');
        if (indexServed) return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      const status = err?.status || 500;
      sendJson(res, status, { error: err?.message || 'Internal error' });
    }
  };

  const server = http.createServer(handler);
  return { server, store, auth, initialSetupCode };
}
