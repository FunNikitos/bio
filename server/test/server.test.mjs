import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createBioApp } from '../app.mjs';

const tempDirs = [];

afterEach(async () => {
  while (tempDirs.length) {
    const dir = tempDirs.pop();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

async function startTempServer() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bio-test-'));
  tempDirs.push(dir);
  const { server } = await createBioApp({ dataDir: dir, distDir: '', setupToken: 'BIO-TEST-CODE' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  return { server, baseUrl: `http://127.0.0.1:${addr.port}` };
}

describe('bio self-hosted server workflow', () => {
  it('guards setup with one-time token, keeps draft separate from published, and honors analytics toggles', async () => {
    const { server, baseUrl } = await startTempServer();
    try {
      // 1. Unauthenticated admin state requires setup
      const s1 = await (await fetch(`${baseUrl}/api/admin/state`)).json();
      assert.equal(s1.authenticated, false);
      assert.equal(s1.needsSetup, true);

      // 2. Wrong setup code fails
      const badSetup = await fetch(`${baseUrl}/api/admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupCode: 'WRONG', password: 'secret123' })
      });
      assert.equal(badSetup.status, 403);

      // 3. Valid setup issues session cookie
      const okSetup = await fetch(`${baseUrl}/api/admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupCode: 'BIO-TEST-CODE', password: 'secret123' })
      });
      assert.equal(okSetup.status, 200);
      const cookie = okSetup.headers.get('set-cookie').split(';')[0];

      // 4. Draft preview blocked without cookie, allowed with cookie
      const unauthDraft = await fetch(`${baseUrl}/api/public/profile?preview=draft`);
      assert.equal(unauthDraft.status, 401);

      // 5. Save draft, verify public stays unchanged until publish
      const adminState = await (await fetch(`${baseUrl}/api/admin/state`, { headers: { Cookie: cookie } })).json();
      const updated = structuredClone(adminState.draft);
      updated.identity.displayName = 'Draft Only Name';
      updated.analytics.trackViews = false;

      const saveRes = await fetch(`${baseUrl}/api/admin/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify(updated)
      });
      assert.equal(saveRes.status, 200);

      // Before publish, trackViews was still true on default snapshot
      await fetch(`${baseUrl}/api/public/view`, { method: 'POST', body: '{}' });
      let statsAfterFirstView = await (await fetch(`${baseUrl}/api/public/profile`)).json();
      assert.equal(statsAfterFirstView.analytics.views, 1);

      // Now publish draft with trackViews: false and new displayName
      const pubRes = await fetch(`${baseUrl}/api/admin/publish`, {
        method: 'POST',
        headers: { Cookie: cookie }
      });
      assert.equal(pubRes.status, 200);

      // Subsequent view must NOT increment because trackViews is false
      await fetch(`${baseUrl}/api/public/view`, { method: 'POST', body: '{}' });
      const pubAfter = await (await fetch(`${baseUrl}/api/public/profile`)).json();
      assert.equal(pubAfter.profile.identity.displayName, 'Draft Only Name');
      assert.equal(pubAfter.analytics.views, 1);

      // 6. Test multipart upload & serving
      const form = new FormData();
      form.append('file', new Blob(['fake-png-bytes'], { type: 'image/png' }), 'avatar.png');
      const uploadRes = await fetch(`${baseUrl}/api/admin/upload`, {
        method: 'POST',
        headers: { Cookie: cookie },
        body: form
      });
      assert.equal(uploadRes.status, 200);
      const uploaded = await uploadRes.json();
      assert.ok(uploaded.url.startsWith('/uploads/'));
      const fetchedAsset = await fetch(`${baseUrl}${uploaded.url}`);
      assert.equal(fetchedAsset.status, 200);
      assert.equal(await fetchedAsset.text(), 'fake-png-bytes');

      // 6b. Test HTTP Range partial response for video/audio seeking
      const rangedAsset = await fetch(`${baseUrl}${uploaded.url}`, {
        headers: { Range: 'bytes=0-3' }
      });
      assert.equal(rangedAsset.status, 206);
      assert.equal(rangedAsset.headers.get('content-range'), 'bytes 0-3/14');
      assert.equal(await rangedAsset.text(), 'fake');

      // 7. Reject disallowed extension (.exe/.html)
      const badForm = new FormData();
      badForm.append('file', new Blob(['<script>'], { type: 'text/html' }), 'evil.html');
      const badUpload = await fetch(`${baseUrl}/api/admin/upload`, {
        method: 'POST',
        headers: { Cookie: cookie },
        body: badForm
      });
      assert.equal(badUpload.status, 400);

      // 8. Logout + password login check
      await fetch(`${baseUrl}/api/admin/logout`, { method: 'POST', headers: { Cookie: cookie } });
      const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret123' })
      });
      assert.equal(loginRes.status, 200);
    } finally {
      server.close();
    }
  });
});
