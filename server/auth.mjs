import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const SESSION_COOKIE = 'bio_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class AuthManager {
  constructor(dataDir, fixedSetupToken = '') {
    this.authPath = path.join(dataDir, 'auth.json');
    this.secretPath = path.join(dataDir, 'session-secret');
    this.fixedSetupToken = fixedSetupToken;
    this.ephemeralSetupToken = '';
    this.secret = '';
  }

  async init() {
    try {
      this.secret = (await fs.readFile(this.secretPath, 'utf8')).trim();
    } catch {
      this.secret = crypto.randomBytes(32).toString('hex');
      await fs.writeFile(this.secretPath, this.secret, 'utf8');
    }

    const ownerExists = await this.hasOwner();
    if (!ownerExists) {
      this.ephemeralSetupToken =
        this.fixedSetupToken || `BIO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    return this.ephemeralSetupToken;
  }

  async hasOwner() {
    try {
      const raw = await fs.readFile(this.authPath, 'utf8');
      const data = JSON.parse(raw);
      return Boolean(data.passwordHash && data.salt);
    } catch {
      return false;
    }
  }

  async setupOwner(setupCode, password) {
    if (await this.hasOwner()) {
      throw Object.assign(new Error('Владелец уже создан'), { status: 409 });
    }
    const expected = this.ephemeralSetupToken;
    if (!expected || !this.timingEqual(String(setupCode || '').trim(), expected)) {
      throw Object.assign(new Error('Неверный код установки из терминала'), { status: 403 });
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw Object.assign(new Error('Пароль должен быть не короче 6 символов'), { status: 400 });
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
    await fs.writeFile(
      this.authPath,
      JSON.stringify({ salt, passwordHash, createdAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
    this.ephemeralSetupToken = '';
    return this.issueSessionCookie();
  }

  async login(password) {
    let stored;
    try {
      stored = JSON.parse(await fs.readFile(this.authPath, 'utf8'));
    } catch {
      throw Object.assign(new Error('Сначала завершите первичную установку'), { status: 400 });
    }
    const derived = crypto.scryptSync(String(password || ''), stored.salt, 64).toString('hex');
    if (!this.timingEqual(derived, stored.passwordHash)) {
      throw Object.assign(new Error('Неверный пароль'), { status: 401 });
    }
    return this.issueSessionCookie();
  }

  issueSessionCookie() {
    const exp = Date.now() + SESSION_TTL_MS;
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    const sig = crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
    return `${SESSION_COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
  }

  clearSessionCookie() {
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }

  isAuthenticated(req) {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${SESSION_COOKIE}=`));
    if (!match) return false;
    const token = match.slice(SESSION_COOKIE.length + 1);
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    const expectedSig = crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
    if (!this.timingEqual(sig, expectedSig)) return false;
    try {
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return Number(parsed.exp) > Date.now();
    } catch {
      return false;
    }
  }

  timingEqual(a, b) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
