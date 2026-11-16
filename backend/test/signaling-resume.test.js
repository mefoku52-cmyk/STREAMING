'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const WebSocket = require('ws');
const { issueLocalSessionToken } = require('../src/auth');

const ROOT = path.resolve(__dirname, '..', '..');
const SECRET = 'integration-test-secret-0123456789abcdef0123456789abcdef';

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
    const push = (msg) => {
      const i = waiters.findIndex(w => w.match(msg));
      if (i >= 0) waiters.splice(i, 1)[0].resolve(msg); else inbox.push(msg);
    };
    ws.on('message', d => { try { push(JSON.parse(d.toString())); } catch {} });
    const api = {
      ws, inbox, _idc: 0,
      rpc(method, data, t = timeoutMs) {
        const id = ++this._idc;
        return new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error(`rpc timeout: ${method}`)), t);
          waiters.push({ match: m => m.id === id, resolve: m => { clearTimeout(to); m.ok ? res(m.data) : rej(Object.assign(new Error(m.error || 'rpc_error'), { code: m.error })); } });
          ws.send(JSON.stringify({ id, method, data }));
        });
      },
      waitEvent(type, timeout = 7000) {
        const idx = inbox.findIndex(m => m.event === type);
        if (idx >= 0) return Promise.resolve(inbox.splice(idx, 1)[0]);
        return new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error(`event timeout: ${type}`)), timeout);
          waiters.push({ match: m => m.event === type, resolve: m => { clearTimeout(to); res(m); } });
        });
      },
      close(code = 1000) { try { ws.close(code); } catch {} },
      terminate() { try { ws.terminate(); } catch {} },
    };
    ws.on('error', reject);
    ws.on('open', () => resolve(api));
    ws.on('close', (code) => { api.closeCode = code; api.closed = true; });
    setTimeout(() => { if (ws.readyState === WebSocket.CONNECTING) { try { ws.terminate(); } catch {} reject(new Error('connect timeout')); } }, timeoutMs);
  });
}

async function startServer(envExtra = {}) {
  const port = await freePort();
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmep-resume-it-'));
  const child = spawn(process.execPath, [path.join(ROOT, 'backend', 'src', 'index.js')], {
    cwd: ROOT,
    env: { ...process.env, SIGNALING_PORT: String(port), SESSION_SIGNING_SECRET: SECRET, RUNTIME_DIR: runtimeDir, LOG_LEVEL: 'warn', LOG_FORMAT: 'text', CMEP_ADAPTER: 'local', ENABLE_RECORDER: '0', ...envExtra },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', d => { out += d.toString(); });
  child.stderr.on('data', d => { out += d.toString(); });
  let up = false;
  for (let i = 0; i < 90 && !up; i++) { await wait(500); try { const res = await fetch(`http://127.0.0.1:${port}/healthz`); if (res.ok) { const j = await res.json(); if (j && j.ready === true) up = true; } } catch {} }
  assert.ok(up, `server did not come up: ${out.slice(0, 500)}`);
  return { port, child, outRef: () => out };
}

const tok = (sub, extra = {}) => issueLocalSessionToken({ sub, companyId: 'co-1', ttlSeconds: 600, secret: SECRET, extraClaims: extra });

test('resume: websocket disconnect/reconnect restores participant slot and state', { timeout: 120000 }, async (t) => {
  const srv = await startServer();
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });
  const owner = await connect(srv.port, tok('owner-1'));
  const viewer = await connect(srv.port, tok('viewer-1'));
  const room = await owner.rpc('createRoom', { offerId: 'offer-r1' });
  await viewer.rpc('requestInspection', { roomId: room.roomId });
  await owner.rpc('acceptInspection', { roomId: room.roomId, viewer: 'viewer-1' });
  await viewer.rpc('joinRoom', { roomId: room.roomId });

  // abnormal disconnect viewer -> should become resumable (not closed immediately)
  viewer.terminate();
  await wait(500);
  // room should still exist (owner present) and be accepted (not live with 1 participant)
  const statusRes = await owner.rpc('getIceServers', {}); // keepalive sanity
  assert.ok(statusRes);

  const viewer2 = await connect(srv.port, tok('viewer-1'));
  const resumed = await viewer2.rpc('resumeSession', { roomId: room.roomId });
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.role, 'viewer');
  assert.equal(resumed.recreateTransports, true);
  assert.ok(Array.isArray(resumed.producers));

  owner.close(); viewer2.close();
});

test('resume: expired session token cannot reconnect/resume', { timeout: 120000 }, async (t) => {
  const srv = await startServer();
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });
  const ownerTok = tok('owner-1');
  const owner = await connect(srv.port, ownerTok);
  const room = await owner.rpc('createRoom', { offerId: 'offer-r2' });
  owner.terminate();
  await wait(300);
  const expired = issueLocalSessionToken({ sub: 'owner-1', ttlSeconds: -10, secret: SECRET });
  const bad = await connect(srv.port, expired);
  await wait(500);
  assert.equal(bad.closeCode, 4401);
});

test('resume: vanished room rejects resume', { timeout: 120000 }, async (t) => {
  const srv = await startServer();
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });
  const owner = await connect(srv.port, tok('owner-1'));
  const room = await owner.rpc('createRoom', { offerId: 'offer-r3' });
  owner.terminate();
  await wait(35000); // > RESUME_GRACE_MS (30s)
  const owner2 = await connect(srv.port, tok('owner-1'));
  await assert.rejects(() => owner2.rpc('resumeSession', { roomId: room.roomId }), /resume_not_available|room_not_found|resume_expired/);
  owner2.close();
});

test('resume/transport: vanished transport and duplicate produce guarded', { timeout: 120000 }, async (t) => {
  const srv = await startServer();
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });
  const owner = await connect(srv.port, tok('owner-1'));
  const room = await owner.rpc('createRoom', { offerId: 'offer-r4' });
  // after disconnect, transports are torn down server-side -> restartIce/produce should fail until recreated
  owner.terminate();
  await wait(400);
  const owner2 = await connect(srv.port, tok('owner-1'));
  const resumed = await owner2.rpc('resumeSession', { roomId: room.roomId });
  assert.equal(resumed.resumed, true);
  await assert.rejects(() => owner2.rpc('restartIce', { transportId: 'nope' }), /transport_not_found/);
  await assert.rejects(() => owner2.rpc('connectTransport', { transportId: 'nope', dtlsParameters: {} }), /transport_not_found/);
  // create transport works after resume
  const t1 = await owner2.rpc('createWebRtcTransport', { direction: 'send' });
  assert.ok(t1.id);
  owner2.close();
});

test('dedupe and concurrent restartIce: repeated/parallel requests safe', { timeout: 120000 }, async (t) => {
  const srv = await startServer();
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });
  const owner = await connect(srv.port, tok('owner-1'));
  const room = await owner.rpc('createRoom', { offerId: 'offer-r5' });
  const t1 = await owner.rpc('createWebRtcTransport', { direction: 'send' });
  const [a,b] = await Promise.all([
    owner.rpc('restartIce', { transportId: t1.id }).catch(e => ({ err: e.message })),
    owner.rpc('restartIce', { transportId: t1.id }).catch(e => ({ err: e.message })),
  ]);
  // both should resolve or at least not crash server; mediasoup may serialize internally
  assert.ok(a && b);
  const health = await (await fetch(`http://127.0.0.1:${srv.port}/health`)).json();
  assert.equal(health.ok, true);
  owner.close();
});

test('duplicate reconnect/resume requests do not create duplicate participant state', { timeout: 120000 }, async (t) => {
  const srv = await startServer();
  t.after(async () => { if (srv.child.exitCode == null) { srv.child.kill('SIGTERM'); await wait(2000); } });
  const owner = await connect(srv.port, tok('owner-1'));
  const room = await owner.rpc('createRoom', { offerId: 'offer-r6' });
  owner.terminate();
  await wait(400);
  const o2 = await connect(srv.port, tok('owner-1'));
  const r1 = await o2.rpc('resumeSession', { roomId: room.roomId });
  assert.equal(r1.resumed, true);
  await assert.rejects(() => o2.rpc('resumeSession', { roomId: room.roomId }), /already_in_room|resume_not_available/);
  // second parallel connection trying to resume/join should be rejected once joined
  const o3 = await connect(srv.port, tok('owner-1'));
  await assert.rejects(() => o3.rpc('joinRoom', { roomId: room.roomId }), /already_joined|resume_not_available|room_full|forbidden/);
  o2.close(); o3.close();
});
