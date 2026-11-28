import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { prisma } from '../lib/prisma';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('API security: disabled debug route returns 404', async () => {
  const res = await fetch(`${BASE_URL}/api/debug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ legalPages: { privacy: 'hacked' } }),
  });
  assert.equal(res.status, 404);
});

test('API security: unauthenticated requests to protected endpoints are rejected', async () => {
  const adminStats = await fetch(`${BASE_URL}/api/admin/stats`);
  assert.equal(adminStats.status, 403);

  const superAdmins = await fetch(`${BASE_URL}/api/admin/super-admins`);
  assert.equal(superAdmins.status, 403);

  const createBroadcast = await fetch(`${BASE_URL}/api/admin/broadcasts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'x', message: 'y' }),
  });
  assert.equal(createBroadcast.status, 403);

  const deleteBroadcast = await fetch(`${BASE_URL}/api/admin/broadcasts?id=nonexistent`, {
    method: 'DELETE',
  });
  assert.equal(deleteBroadcast.status, 403);

  const getOrders = await fetch(`${BASE_URL}/api/orders`);
  assert.equal(getOrders.status, 401);

  const createProd = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId: 'cmwl3cf1y0001jw091pif7ydb', name: 'x', price: 1 }),
  });
  assert.equal(createProd.status, 403);

  const patchStore = await fetch(`${BASE_URL}/api/stores/abbasalaghber`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planTier: 'vip' }),
  });
  assert.equal(patchStore.status, 403);
});

test('API security: public store endpoint does not expose apiKeys or orders', async () => {
  const res = await fetch(`${BASE_URL}/api/stores/abbasalaghber`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.slug, 'abbasalaghber');
  assert.equal('apiKeys' in data, false);
  assert.equal('orders' in data, false);
});

test('API security: /api/upload blocks dangerous extensions (.html, .svg)', async () => {
  const form = new FormData();
  const evilHtml = new Blob(['<script>alert(1)</script>'], { type: 'text/html' });
  form.append('file', evilHtml, 'xss.html');

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: form,
  });
  assert.equal(res.status, 400);

  const svgForm = new FormData();
  const evilSvg = new Blob(['<svg onload=alert(1)></svg>'], { type: 'image/svg+xml' });
  svgForm.append('file', evilSvg, 'xss.svg');

  const resSvg = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: svgForm,
  });
  assert.equal(resSvg.status, 400);
});

test('API digital upload: accepts Word (.docx), persists to PostgreSQL, serves download, and cleans up', async () => {
  let createdKey: string | null = null;
  try {
    const sampleBytes = Buffer.from('PK\x03\x04SEEN-DOCX-INTEGRATION-TEST');
    const docxForm = new FormData();
    const docxBlob = new Blob([sampleBytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    docxForm.append('file', docxBlob, 'دليل_اختبار.docx');

    const upRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: docxForm,
    });
    assert.equal(upRes.status, 200);
    const upJson = await upRes.json();
    assert.equal(upJson.success, true);
    assert.ok(typeof upJson.url === 'string' && upJson.url.startsWith('/api/digital/'));

    const assetId = upJson.url.replace('/api/digital/', '');
    createdKey = `digital_asset_${assetId}`;

    const dlRes = await fetch(`${BASE_URL}${upJson.url}`);
    assert.equal(dlRes.status, 200);
    assert.equal(dlRes.headers.get('x-content-type-options'), 'nosniff');
    assert.ok((dlRes.headers.get('content-disposition') || '').includes('attachment'));
    const dlBuf = Buffer.from(await dlRes.arrayBuffer());
    assert.deepEqual(dlBuf, sampleBytes);
  } finally {
    if (createdKey) {
      await prisma.siteContent.delete({ where: { key: createdKey } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
});

test('Auth & Middleware: protected routes redirect unauthenticated and forged cookie callers', async () => {
  const merchUnauth = await fetch(`${BASE_URL}/merchant/abbasalaghber`, { redirect: 'manual' });
  assert.equal(merchUnauth.status, 307);
  assert.ok((merchUnauth.headers.get('location') || '').includes('/seenlogin5xa'));

  const adminUnauth = await fetch(`${BASE_URL}/seenayhq7x`, { redirect: 'manual' });
  assert.equal(adminUnauth.status, 307);
  assert.ok((adminUnauth.headers.get('location') || '').includes('/seenaylogin7x'));

  // Forged unsigned role cookie without valid HMAC token MUST be rejected
  const forgedAdmin = await fetch(`${BASE_URL}/seenayhq7x`, {
    redirect: 'manual',
    headers: {
      Cookie: 'seen_session_user_id=usr-admin-yousef; seen_session_role=SUPER_ADMIN; seen_session_token=forged.signature',
    },
  });
  assert.equal(forgedAdmin.status, 307);
  assert.ok((forgedAdmin.headers.get('location') || '').includes('/seenaylogin7x'));
});

test('Auth & Public routes: /favicon.ico returns 200, /api/logout supports POST, and public SSR pages return 200', async () => {
  const favRes = await fetch(`${BASE_URL}/favicon.ico`);
  assert.equal(favRes.status, 200);

  const logoutRes = await fetch(`${BASE_URL}/api/logout`, { method: 'POST' });
  assert.equal(logoutRes.status, 200);
  const logoutJson = await logoutRes.json();
  assert.equal(logoutJson.success, true);

  for (const path of ['/', '/login', '/seenlogin5xa', '/seenaylogin7x', '/create-store', '/store/abbasalaghber']) {
    const pageRes = await fetch(`${BASE_URL}${path}`);
    assert.equal(pageRes.status, 200, `Expected 200 on ${path}, got ${pageRes.status}`);
  }
});
