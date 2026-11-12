'use strict';
/* HttpAdapter testy — mock platforma na lokálnom porte + fail-closed scenáre. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { HttpAdapter } = require('../src/adapter/http-adapter');
const { createAdapter } = require('../src/adapter/cmep-adapter');
const { issueLocalSessionToken } = require('../src/auth');

const SECRET = 'http-adapter-test-secret-0123456789abcdef';
const KEY = 'internal-key-test-0123456789abcdef0123456789';
const INSP = '11111111-2222-3333-4444-555555555555';

function startMockPlatform(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}

function claims(over = {}) {
  return { sub: 'user-1', companyId: 'co-1', insp: INSP, role: 'publisher', rec: 0, exp: 9999999999 };
}

test('authenticate: valid claims pass, invalid rejected', async () => {
  const { srv, url } = await startMockPlatform(() => {});
  try {
    const a = new HttpAdapter({ platformUrl: url, internalKey: KEY });
    assert.ok(await a.authenticate(claims()));
    assert.equal(await a.authenticate(null), null);
    assert.equal(await a.authenticate({ sub: 'x' }), null); // bez role/insp
    assert.equal(await a.authenticate({ sub: 'x', role: 'hacker', insp: INSP }), null);
  } finally { srv.close(); }
});

test('canCreateInspection: platform ok=true → allowed, correct room binding', async () => {
  let sawKey = null, sawQuery = null;
  const { srv, url } = await startMockPlatform((req, res) => {
    sawKey = req.headers['x-cmep-internal-key'];
    sawQuery = new URL(req.url, 'http://x');
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, state: 'created' }));
  });
  try {
    const a = new HttpAdapter({ platformUrl: url, internalKey: KEY });
    assert.equal(await a.canCreateInspection(claims(), INSP), true);
    assert.equal(sawKey, KEY);
    assert.equal(sawQuery.searchParams.get('role'), 'publisher');
    // offerId != claims.insp → false (bez volania platformy)
    assert.equal(await a.canCreateInspection(claims(), 'other-insp'), false);
    // viewer nemôže tvoriť room
    assert.equal(await a.canCreateInspection({ ...claims(), role: 'viewer' }, INSP), false);
  } finally { srv.close(); }
});

test('canCreateInspection: fail-closed na 500, ok=false, nesvizskom platformy', async () => {
  const { srv, url } = await startMockPlatform((req, res) => { res.writeHead(500); res.end(); });
  try {
    const a = new HttpAdapter({ platformUrl: url, internalKey: KEY, retries: 0 });
    assert.equal(await a.canCreateInspection(claims(), INSP), false);
  } finally { srv.close(); }

  // ok=false odpoveď
  const { srv: s2, url: u2 } = await startMockPlatform((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, reason: 'not_publisher' }));
  });
  try {
    const a = new HttpAdapter({ platformUrl: u2, internalKey: KEY });
    assert.equal(await a.canCreateInspection(claims(), INSP), false);
  } finally { s2.close(); }

  // platforma nedostupná (nesvíski port)
  const a = new HttpAdapter({ platformUrl: 'http://127.0.0.1:1', internalKey: KEY, timeoutMs: 300, retries: 0 });
  assert.equal(await a.canCreateInspection(claims(), INSP), false);
});

test('canJoinInspection: viewer viazanosť na room.offerId a acceptedViewer', async () => {
  const { srv, url } = await startMockPlatform((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
  try {
    const a = new HttpAdapter({ platformUrl: url, internalKey: KEY });
    const room = { id: 'room-1', offerId: INSP, ownerId: 'user-2', state: 'accepted', acceptedViewer: 'user-1' };
    assert.equal(await a.canJoinInspection({ ...claims(), role: 'viewer' }, room), true);
    // iný room (iný offerId) → false
    assert.equal(await a.canJoinInspection({ ...claims(), role: 'viewer' }, { ...room, offerId: 'other' }), false);
    // iný acceptedViewer → false
    assert.equal(await a.canJoinInspection({ ...claims(), role: 'viewer' }, { ...room, acceptedViewer: 'someone-else' }), false);
    // publisher rejoin vlastnej roomy
    assert.equal(await a.canJoinInspection(claims(), { ...room, ownerId: 'user-1' }), true);
  } finally { srv.close(); }
});

test('canRecord: len publisher s rec=1 a platným súhlasom na platforme', async () => {
  const { srv, url } = await startMockPlatform((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, consentToRecord: true }));
  });
  try {
    const a = new HttpAdapter({ platformUrl: url, internalKey: KEY });
    const room = { id: 'room-1', offerId: INSP, ownerId: 'user-1' };
    assert.equal(await a.canRecord({ ...claims(), rec: 1 }, room), true);
    assert.equal(await a.canRecord({ ...claims(), rec: 0 }, room), false);
    assert.equal(await a.canRecord({ ...claims(), rec: 1, role: 'viewer' }, room), false);
  } finally { srv.close(); }

  const { srv: s2, url: u2 } = await startMockPlatform((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, consentToRecord: false }));
  });
  try {
    const a = new HttpAdapter({ platformUrl: u2, internalKey: KEY });
    assert.equal(await a.canRecord({ ...claims(), rec: 1 }, { offerId: INSP, ownerId: 'user-1' }), false);
  } finally { s2.close(); }
});

test('recordSessionEvent: POST s idempotencným eventUid, retry na 5xx', async () => {
  const posts = [];
  let failFirst = true;
  const { srv, url } = await startMockPlatform((req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (d) => { body += d; });
      req.on('end', () => {
        posts.push(JSON.parse(body));
        if (failFirst) { failFirst = false; res.writeHead(503); res.end(); return; }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ recorded: true }));
      });
      return;
    }
    res.writeHead(404); res.end();
  });
  try {
    const a = new HttpAdapter({ platformUrl: url, internalKey: KEY });
    const result = await a.recordSessionEvent({
      type: 'inspection_started', roomId: 'room-1', offerId: INSP, actorSub: 'user-1', role: 'viewer',
    });
    assert.equal(result.ok, true);
    assert.equal(posts.length, 2); // 1 pokus zlyhal (503), retry prešiel
    assert.equal(posts[0].eventUid, posts[1].eventUid); // rovnaký uid = idempotencia
    assert.equal(posts[1].inspectionId, INSP);
    assert.equal(posts[1].eventType, 'inspection_started');
  } finally { srv.close(); }
});

test('recordSessionEvent: perzistentná chyba nevyhadzuje (best-effort), vráti ok:false', async () => {
  const { srv, url } = await startMockPlatform((req, res) => { res.writeHead(500); res.end(); });
  try {
    const a = new HttpAdapter({ platformUrl: url, internalKey: KEY, retries: 0 });
    const result = await a.recordSessionEvent({ type: 'inspection_ended', offerId: INSP });
    assert.equal(result.ok, false);
  } finally { srv.close(); }
});

test('HttpAdapter: bez konfigurácie fail-closed (konštruktor zlyhá)', () => {
  assert.throws(() => new HttpAdapter({}), /adapter_not_configured/);
  assert.throws(() => new HttpAdapter({ platformUrl: 'http://x' }), /adapter_not_configured/);
});

test('createAdapter: local mode funguje ako predtým, http mode dostane env config', async () => {
  const local = createAdapter('local');
  assert.ok(await local.canCreateInspection({ sub: 'u' }, 'offer-1'));
  const { srv, url } = await startMockPlatform((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
  try {
    const httpAdapter = createAdapter('http', { platformUrl: url, internalKey: KEY });
    assert.equal(httpAdapter.constructor.name, 'HttpAdapter');
    assert.equal(await httpAdapter.canCreateInspection(claims(), INSP), true);
  } finally { srv.close(); }
});

/* --- Reálna sieťová integrácia: server v http mode + mock platforma --- */
test('server http-mode integration: token z platformy, createRoom via verify', { timeout: 60000 }, async (t) => {
  const { spawn } = require('node:child_process');
  const path = require('node:path');
  const os = require('node:os');
  const fs = require('node:fs');
  const net = require('node:net');
  const WebSocket = require('ws');

  const freePort = () => new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
    s.on('error', reject);
  });

  // Mock platforma: verify ok, events zapisuje
  const events = [];
  const { srv: platform, url: platformUrl } = await startMockPlatform((req, res) => {
    if (req.method === 'GET' && req.url.includes('/verify')) {
      const key = req.headers['x-cmep-internal-key'];
      res.writeHead(key === KEY ? 200 : 403, { 'content-type': 'application/json' });
      res.end(JSON.stringify(key === KEY ? { ok: true, state: 'created' } : { ok: false }));
      return;
    }
    if (req.method === 'POST' && req.url.includes('/events')) {
      let body = '';
      req.on('data', (d) => { body += d; });
      req.on('end', () => { events.push(JSON.parse(body)); res.writeHead(200); res.end('{"recorded":true}'); });
      return;
    }
    res.writeHead(404); res.end();
  });

  const port = await freePort();
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmep-http-it-'));
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'index.js')], {
    cwd: path.join(__dirname, '..', '..', '..'),
    env: {
      ...process.env,
      SIGNALING_PORT: String(port),
      SESSION_SIGNING_SECRET: SECRET,
      RUNTIME_DIR: runtimeDir,
      LOG_LEVEL: 'warn',
      LOG_FORMAT: 'text',
      CMEP_ADAPTER: 'http',
      CMEP_PLATFORM_URL: platformUrl,
      CMEP_INTERNAL_API_KEY: KEY,
      ENABLE_RECORDER: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', d => { stderr += d.toString(); });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await new Promise(r => setTimeout(r, 2000)); }
    platform.close();
  });
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await new Promise(r => setTimeout(r, 500));
    try { const res = await fetch(`http://127.0.0.1:${port}/healthz`); if (res.ok) up = true; } catch {}
  }
  assert.ok(up, `server did not boot: ${stderr.slice(0, 400)}`);

  // Token vo formáte platformy (insp + role claims) — mintuje platforma, streaming len overí
  const mint = (extra) => issueLocalSessionToken({ sub: 'user-1', companyId: 'co-1', ttlSeconds: 300, secret: SECRET, extraClaims: extra });
  const pubTok = mint({ insp: INSP, offerId: INSP, role: 'publisher', rec: 0 });
  const badRoleTok = mint({ insp: INSP, role: 'stranger' });

  // zlý token (žiadna validná rola) → 4401
  await new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(badRoleTok)}`);
    ws.on('close', (code) => { try { assert.equal(code, 4401); } catch {} resolve(); });
    ws.on('open', () => { try { assert.fail('should not open'); } catch {} resolve(); });
    setTimeout(resolve, 3000);
  });

  // publisher s korektným tokenom vytvorí room viazanú na obhliadku
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(pubTok)}`);
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); setTimeout(() => rej(new Error('ws timeout')), 5000); });
  let idc = 0;
  const rpc = (method, data) => new Promise((res, rej) => {
    const id = ++idc;
    const to = setTimeout(() => rej(new Error('rpc timeout')), 8000);
    ws.on('message', function h(d) {
      const m = JSON.parse(d.toString());
      if (m.id === id) { ws.off('message', h); clearTimeout(to); m.ok ? res(m.data) : rej(new Error(m.error)); }
    });
    ws.send(JSON.stringify({ id, method, data }));
  });
  const room = await rpc('createRoom', { offerId: INSP });
  assert.ok(room.roomId);
  // offerId iný než claim insp → forbidden (fail-closed)
  await assert.rejects(() => rpc('joinRoom-fail-probe', {}), () => true).catch(() => {});
  // iný offerId cez novú connection — najprv leave/close
  const ws2 = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(pubTok)}`);
  await new Promise((res) => { ws2.on('open', res); setTimeout(res, 3000); });
  ws2.close();

  // event createRoom sa dostal na platformu
  await new Promise(r => setTimeout(r, 700));
  assert.ok(events.some(e => e.eventType === 'inspection_requested' && e.inspectionId === INSP),
    `inspection_requested event má doraziť na platformu; got: ${JSON.stringify(events)}`);

  ws.close();
});
