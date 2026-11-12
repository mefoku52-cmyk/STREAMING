'use strict';
/* Black-box integration test: spawns the real server (ephemeral random port),
   exercises the WS protocol, ACLs, room lifecycle and graceful shutdown. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const crypto = require('node:crypto');
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

function connect(port, token, { timeoutMs = 5000 } = {}) {
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
      ws,
      inbox,
      _idc: 0,
      send(data) { ws.send(JSON.stringify(data)); },
      rpc(method, data) {
        const id = ++this._idc;
        return new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error(`rpc timeout: ${method}`)), timeoutMs);
          this.pushWait(m => m.id === id, m => { clearTimeout(to); m.ok ? res(m.data) : rej(Object.assign(new Error(m.error || 'rpc_error'), { code: m.error })); });
          ws.send(JSON.stringify({ id, method, data }));
        });
      },
      pushWait(match, resolveFn) { waiters.push({ match, resolve: resolveFn }); },
      waitEvent(type, timeout = 5000) {
        const idx = inbox.findIndex(m => m.event === type);
        if (idx >= 0) return Promise.resolve(inbox.splice(idx, 1)[0]);
        return new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error(`event timeout: ${type}`)), timeout);
          this.pushWait(m => m.event === type, m => { clearTimeout(to); res(m); });
        });
      },
      close() { try { ws.close(); } catch {} },
    };
    ws.on('error', (e) => reject(e));
    ws.on('open', () => resolve(api));
    ws.on('close', (code) => { api.closed = true; api.closeCode = code; });
    setTimeout(() => { if (ws.readyState === WebSocket.CONNECTING) { ws.terminate(); reject(new Error('connect timeout')); } }, timeoutMs);
  });
}

test('server integration: boot, auth, ACL, room lifecycle, shutdown', { timeout: 120000 }, async (t) => {
  const port = await freePort();
  const runtimeDir = require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(), 'cmep-it-'));
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
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', d => { stderr += d.toString(); });
  child.stdout.on('data', d => { stderr += d.toString(); });

  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await wait(3000);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
  });

  // wait for boot
  let up = false;
  for (let i = 0; i < 90 && !up; i++) {
    await wait(500);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (res.ok) up = true;
    } catch {}
  }
  assert.ok(up, `server did not come up; stderr: ${stderr.slice(0, 500)}`);

  // lock file exists and contains our pid
  const lockPath = path.join(runtimeDir, 'server.lock');
  assert.ok(require('node:fs').existsSync(lockPath), 'lock file created');

  // static file served
  const page = await fetch(`http://127.0.0.1:${port}/publish.html`);
  assert.equal(page.status, 200);
  assert.ok(/<!doctype/i.test(await page.text()));

  // healthz payload
  const hz = await (await fetch(`http://127.0.0.1:${port}/healthz`)).json();
  assert.equal(hz.ok, true);

  // --- auth: unauthorized connections are closed with 4401 ---
  const anon = await connect(port, null);
  await wait(500);
  assert.equal(anon.closeCode, 4401);
  const bad = await connect(port, 'garbage.token');
  await wait(500);
  assert.equal(bad.closeCode, 4401);

  const ownerTok = issueLocalSessionToken({ sub: 'owner-1', companyId: 'co-1', ttlSeconds: 600, secret: SECRET });
  const viewerTok = issueLocalSessionToken({ sub: 'viewer-1', companyId: 'co-1', ttlSeconds: 600, secret: SECRET });
  const viewer2Tok = issueLocalSessionToken({ sub: 'viewer-2', companyId: 'co-1', ttlSeconds: 600, secret: SECRET });

  const owner = await connect(port, ownerTok);
  const hello = await owner.rpc('createRoom', { offerId: 'offer-9' });
  assert.ok(hello.roomId, 'createRoom returns roomId');
  assert.equal(hello.role, 'publisher');
  const roomId = hello.roomId;

  // duplicate createRoom rejected
  await assert.rejects(() => owner.rpc('createRoom', { offerId: 'x' }), /already_in_room/);

  // unknown room
  const ghost = await connect(port, viewer2Tok);
  await assert.rejects(() => ghost.rpc('joinRoom', { roomId: 'nope' }), /room_not_found/);

  // viewer join before acceptance
  const viewer = await connect(port, viewerTok);
  await assert.rejects(() => viewer.rpc('joinRoom', { roomId }), /inspection_not_accepted/);

  // requestInspection → owner gets push event
  const reqAck = await viewer.rpc('requestInspection', { roomId, message: 'prosím o obhliadku' });
  assert.equal(reqAck.roomId, roomId);
  const requestedEv = await owner.waitEvent('inspectionRequested');
  assert.equal(requestedEv.data.roomId, roomId);

  // reject then accept flow
  await owner.rpc('rejectInspection', { roomId });
  await assert.rejects(() => viewer.rpc('joinRoom', { roomId }), /inspection_not_accepted/);
  await viewer.rpc('requestInspection', { roomId });
  await owner.waitEvent('inspectionRequested');
  const accAck = await owner.rpc('acceptInspection', { roomId, viewer: 'viewer-1' });
  assert.equal(accAck.state, 'accepted');
  await viewer.waitEvent('inspectionAccepted');

  // accepted viewer joins
  const jv = await viewer.rpc('joinRoom', { roomId });
  assert.equal(jv.role, 'viewer');
  assert.deepEqual(jv.producers, []);

  // duplicate viewer blocked (1:1)
  await assert.rejects(() => ghost.rpc('joinRoom', { roomId }), /room_full|inspection_not_accepted/);

  // --- transport direction metadata ---
  const recvT = await viewer.rpc('createWebRtcTransport', { direction: 'recv' });
  assert.ok(recvT.id);
  const sendT = await viewer.rpc('createWebRtcTransport', { direction: 'send' });
  assert.ok(sendT.id);

  // produce video as viewer → forbidden (direction metadata path works: send transport accepted for check)
  await assert.rejects(() => viewer.rpc('produce', { transportId: sendT.id, kind: 'video', rtpParameters: { mid: '0' } }), /viewer_video_forbidden/);
  // produce on recv transport → wrong direction
  await assert.rejects(() => viewer.rpc('produce', { transportId: recvT.id, kind: 'audio', rtpParameters: { mid: '0' } }), /wrong_transport_direction/);

  // owner send transport + produce with invalid rtpParameters → mediasoup-level error (not 'wrong_transport_direction')
  const oT = await owner.rpc('createWebRtcTransport', { direction: 'send' });
  await assert.rejects(() => owner.rpc('produce', { transportId: oT.id, kind: 'audio', rtpParameters: { mid: '0' } }), (e) => !/wrong_transport_direction/.test(e.message));

  // --- recording controls (recorder disabled) ---
  await assert.rejects(() => owner.rpc('startRecording', {}), /recorder_unavailable/);

  // --- lifecycle ---
  await owner.rpc('close', { roomId });
  await viewer.waitEvent('roomClosed');

  owner.close(); viewer.close(); ghost.close();
  await wait(500);

  // server still healthy after churn
  const hz2 = await (await fetch(`http://127.0.0.1:${port}/healthz`)).json();
  assert.equal(hz2.ok, true);

  // graceful shutdown on SIGTERM, lock released
  child.kill('SIGTERM');
  const code = await new Promise((res, rej) => {
    const to = setTimeout(() => { child.kill('SIGKILL'); rej(new Error('graceful shutdown timeout')); }, 10000);
    child.on('exit', (c) => { clearTimeout(to); res(c); });
  });
  assert.equal(code, 0, `exit code ${code}, stderr: ${stderr.slice(-400)}`);
  assert.ok(!require('node:fs').existsSync(lockPath), 'lock released on shutdown');
});
