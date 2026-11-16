'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const WebSocket = require('ws');
const crypto = require('node:crypto');
const { issueLocalSessionToken } = require('../src/auth');

const ROOT = path.resolve(__dirname, '..', '..');
const SECRET = 'integration-test-secret-0123456789abcdef0123456789abcdef';
const TURN_SECRET = 'turn-runtime-secret-0123456789abcdef012345';

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
    srv.on('error', reject);
  });
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function connect(port, token, { timeoutMs = 7000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = `ws://127.0.0.1:${port}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const ws = new WebSocket(url);
    const inbox = [];
    const waiters = [];
    ws.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      const w = waiters.findIndex(x => x.match(msg));
      if (w >= 0) waiters.splice(w, 1)[0].resolve(msg); else inbox.push(msg);
    });
    const api = {
      ws, inbox, _idc: 0,
      rpc(method, data) {
        const id = ++this._idc;
        return new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error(`rpc timeout: ${method}`)), timeoutMs);
          waiters.push({ match: m => m.id === id, resolve: m => { clearTimeout(to); m.ok ? res(m.data) : rej(Object.assign(new Error(m.error || 'rpc_error'), { code: m.error })); } });
          ws.send(JSON.stringify({ id, method, data }));
        });
      },
      close() { try { ws.close(); } catch {} },
    };
    ws.on('error', reject);
    ws.on('open', () => resolve(api));
    ws.on('close', (code) => { api.closeCode = code; });
    setTimeout(() => { if (ws.readyState === WebSocket.CONNECTING) { ws.terminate(); reject(new Error('connect timeout')); } }, timeoutMs);
  });
}

async function startServer(envExtra = {}) {
  const port = await freePort();
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmep-turn-it-'));
  const child = spawn(process.execPath, [path.join(ROOT, 'backend', 'src', 'index.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      SIGNALING_PORT: String(port),
      SESSION_SIGNING_SECRET: SECRET,
      RUNTIME_DIR: runtimeDir,
      LOG_LEVEL: 'warn',
      LOG_FORMAT: 'text',
      CMEP_ADAPTER: 'local',
      ENABLE_RECORDER: '0',
      ...envExtra,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', d => { out += d.toString(); });
  child.stderr.on('data', d => { out += d.toString(); });
  let up = false;
  for (let i = 0; i < 90 && !up; i++) {
    await wait(500);
    try { const res = await fetch(`http://127.0.0.1:${port}/healthz`); if (res.ok) up = true; } catch {}
  }
  assert.ok(up, `server did not come up: ${out.slice(0, 500)}`);
  return { port, child, runtimeDir, outRef: () => out };
}

test('TURN integration: getIceServers and transport include TURN REST creds when configured', { timeout: 120000 }, async (t) => {
  const srv = await startServer({
    TURN_SECRET,
    TURN_URLS: 'turn:203.0.113.10:3478?transport=udp,turns:203.0.113.10:5349?transport=tcp',
    TURN_STUN_URLS: 'stun:203.0.113.10:3478',
    TURN_CREDENTIAL_TTL_SECONDS: '300',
  });
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });

  // readiness/health
  const health = await (await fetch(`http://127.0.0.1:${srv.port}/health`)).json();
  assert.equal(health.ok, true);
  assert.equal(health.ready, true);
  assert.equal(health.media.workerAlive, true);

  const ownerTok = issueLocalSessionToken({ sub: 'owner-1', companyId: 'co-1', ttlSeconds: 600, secret: SECRET });
  const viewerTok = issueLocalSessionToken({ sub: 'viewer-1', companyId: 'co-1', ttlSeconds: 600, secret: SECRET });
  const owner = await connect(srv.port, ownerTok);
  const viewer = await connect(srv.port, viewerTok);

  const ice = await owner.rpc('getIceServers', {});
  assert.ok(Array.isArray(ice.iceServers));
  assert.ok(ice.iceServers.length >= 1, 'should return TURN/STUN servers');
  assert.equal(ice.ttlSeconds, 300);
  assert.ok(ice.expiresAt > Math.floor(Date.now()/1000));
  const turnEntry = ice.iceServers.find(s => Array.isArray(s.urls) ? s.urls.some(u => u.startsWith('turn')) : String(s.urls).startsWith('turn'));
  assert.ok(turnEntry, 'includes TURN server');
  assert.ok(turnEntry.username.includes(':owner-1'));
  const expectedCred = crypto.createHmac('sha1', TURN_SECRET).update(turnEntry.username).digest('base64');
  assert.equal(turnEntry.credential, expectedCred);
  assert.ok(!JSON.stringify(ice).includes(TURN_SECRET), 'secret must not leak');

  // unauthorized/no token cannot connect (existing behavior) - sanity
  const anon = await connect(srv.port, null);
  await wait(400);
  assert.equal(anon.closeCode, 4401);

  const room = await owner.rpc('createRoom', { offerId: 'offer-turn-1' });
  await viewer.rpc('requestInspection', { roomId: room.roomId });
  await owner.rpc('acceptInspection', { roomId: room.roomId, viewer: 'viewer-1' });
  await viewer.rpc('joinRoom', { roomId: room.roomId });

  const tparams = await owner.rpc('createWebRtcTransport', { direction: 'send' });
  assert.ok(Array.isArray(tparams.iceServers));
  const tTurn = tparams.iceServers.find(s => (s.username || '').includes(':owner-1'));
  assert.ok(tTurn, 'transport response includes per-user TURN creds');
  assert.ok(tparams.iceServersExpiresAt > 0);

  const restarted = await owner.rpc('restartIce', { transportId: tparams.id });
  assert.equal(restarted.transportId, tparams.id);
  assert.ok(restarted.iceParameters && restarted.iceParameters.usernameFragment);

  // viewer cannot restart owner's transport
  await assert.rejects(() => viewer.rpc('restartIce', { transportId: tparams.id }), /transport_not_found/);

  owner.close(); viewer.close();
});

test('ICE servers disabled when TURN not configured', { timeout: 120000 }, async (t) => {
  const srv = await startServer({});
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });
  const tok = issueLocalSessionToken({ sub: 'owner-1', ttlSeconds: 600, secret: SECRET });
  const owner = await connect(srv.port, tok);
  const ice = await owner.rpc('getIceServers', {});
  assert.deepEqual(ice.iceServers, []);
  const room = await owner.rpc('createRoom', { offerId: 'offer-2' });
  const tparams = await owner.rpc('createWebRtcTransport', { direction: 'send' });
  assert.deepEqual(tparams.iceServers, []);
  owner.close();
});

