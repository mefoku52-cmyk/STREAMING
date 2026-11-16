'use strict';
/* Cross-service E2E (CMEP Live Inspections):
   - Python runner (scripts/cmep_live_inspection_e2e_server.py) = CMEP platform + seed + JWT mint
   - Node = CMEP Streaming server (CMEP_ADAPTER=http) + platform HTTP calls + full WS flow
*/
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const { spawn } = require('node:child_process');
const WebSocket = require('../node_modules/ws');

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const SECRET = 'http-adapter-test-secret-0123456789abcdef';
const INTERNAL_KEY = 'internal-key-test-0123456789abcdef0123456789';
const PLATFORM_ROOT = path.resolve(process.env.CMEP_PLATFORM_ROOT || path.resolve(__dirname, '../../../waste-platform'));
const PLATFORM_SCRIPT = path.join(PLATFORM_ROOT, 'scripts/cmep_live_inspection_e2e_server.py');
const PLATFORM_PY = process.env.CMEP_PLATFORM_PYTHON || path.join(PLATFORM_ROOT, '.venv/bin/python');
// Keep per-process E2E tokens in the OS temp directory, never in the repository.
const TOKEN_PATH = path.join(os.tmpdir(), `cmep-e2e-tokens-${process.pid}-${Date.now()}.json`);

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
    srv.on('error', reject);
  });
}

async function startStreamingServer(port, platformBase) {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmep-live-e2e-'));
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'index.js')], {
    cwd: path.resolve(__dirname, '..', '..', '..'),
    env: {
      ...process.env,
      SIGNALING_PORT: String(port),
      SESSION_SIGNING_SECRET: SECRET,
      RUNTIME_DIR: runtimeDir,
      LOG_LEVEL: 'warn',
      LOG_FORMAT: 'text',
      CMEP_ADAPTER: 'http',
      CMEP_PLATFORM_URL: platformBase,
      CMEP_INTERNAL_API_KEY: INTERNAL_KEY,
      ENABLE_RECORDER: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', d => { stderr += d.toString(); });
  child.stdout.on('data', d => { stderr += d.toString(); });
  for (let i = 0; i < 60; i++) {
    await wait(500);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/readyz`);
      if (res.ok && (await res.json()).ready === true) return { child, runtimeDir, stderr };
    } catch {}
  }
  throw new Error(`streaming did not boot: ${stderr.slice(0, 600)}`);
}

async function startPlatform(streamingPort, platformPort) {
  try { fs.unlinkSync(TOKEN_PATH); } catch {}
  const python = fs.existsSync(PLATFORM_PY) ? PLATFORM_PY : (process.env.PYTHON || 'python3');
  const child = spawn(python, [PLATFORM_SCRIPT], {
    cwd: PLATFORM_ROOT,
    env: {
      ...process.env,
      E2E_TOKENS_PATH: TOKEN_PATH,
      E2E_PORT: String(platformPort),
      PYTHONPATH: [PLATFORM_ROOT, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
      CMEP_STREAMING_SIGNING_SECRET: SECRET,
      CMEP_INTERNAL_API_KEY: INTERNAL_KEY,
      CMEP_STREAMING_PUBLIC_URL: `http://127.0.0.1:${streamingPort}`,
      CMEP_STREAMING_INTERNAL_URL: `http://127.0.0.1:${streamingPort}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  let exit = null;
  child.on('exit', (code, signal) => { exit = { code, signal }; });
  child.stderr.on('data', d => { stderr += d.toString(); });
  child.stdout.on('data', d => { stderr += d.toString(); });
  const base = `http://127.0.0.1:${platformPort}`;
  const start = Date.now();
  while (Date.now() - start < 90000) {
    if (fs.existsSync(TOKEN_PATH)) return { child, stderr };
    if (exit) throw new Error(`platform runner exited (${exit.code ?? exit.signal}): ${stderr.slice(0, 800)}`);
    await wait(500);
  }
  throw new Error(`platform did not write tokens on ${base}: ${stderr.slice(0, 800)}`);
}

async function waitForTokens(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (fs.existsSync(TOKEN_PATH)) return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    } catch {}
    await wait(500);
  }
  throw new Error('E2E token file not created');
}

function decodeClaims(token) {
  const payload = String(token || '').split('.')[0];
  const pad = (4 - (payload.length % 4)) % 4;
  const padded = payload + '='.repeat(pad);
  return JSON.parse(Buffer.from(padded, 'base64url').toString('utf8'));
}

function wsRpc(port, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(token)}`);
    let idc = 0;
    const pending = new Map();
    ws.on('open', () => resolve({ ws, rpc }));
    ws.on('error', reject);
    ws.on('message', d => {
      const m = JSON.parse(d.toString());
      if (m.id !== undefined && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        m.error ? p.reject(new Error(m.error || 'rpc_error')) : p.resolve(m.data);
      }
    });
    function rpc(method, data) {
      return new Promise((res, rej) => {
        const id = ++idc;
        pending.set(id, { resolve: res, reject: rej });
        const to = setTimeout(() => { pending.delete(id); rej(new Error(`rpc timeout: ${method}`)); }, 12000);
        ws.send(JSON.stringify({ id, method, data }));
      });
    }
    setTimeout(() => reject(new Error('ws open timeout')), 8000);
  });
}

async function authFetch(base, method, url, token, body, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${base}${url}`, {
        method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const txt = await res.text();
      let json = null; try { json = JSON.parse(txt); } catch {}
      return { status: res.status, json, text: txt };
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await wait(1000);
    }
  }
}

test('cross-service CMEP live inspection E2E (platform <-> streaming)', { timeout: 240000 }, async () => {
  assert.ok(fs.existsSync(PLATFORM_SCRIPT), `platform E2E runner missing: ${PLATFORM_SCRIPT}`);
  const streamingPort = await freePort();
  const platformPort = await freePort();
  const { child: platformProc, stderr } = await startPlatform(streamingPort, platformPort);
  process.on('exit', () => { try { platformProc.kill('SIGKILL'); } catch {} });
  const tokens = await waitForTokens();
  const base = tokens.baseUrl; // http://127.0.0.1:8765 (pevne v seed skripte)

  // 1. Owner spusti obhliadku z ponuky -> publisher token (platforma)
  const create = await authFetch(base, 'POST', '/api/v1/inspections', tokens.ownerToken, { listingId: tokens.listingId });
  if (create.status !== 201) {
    console.error('[E2E][tokenPath]', TOKEN_PATH);
    console.error('[E2E][base]', base, '| listing', tokens.listingId);
    console.error('[E2E][ownerSub]', tokens.ownerUserId);
  }
  assert.equal(create.status, 201, `create failed: ${create.status} ${create.text}`);
  assert.ok(create.json.publishUrl, 'publishUrl expected');
  assert.equal(create.json.role, 'publisher');
  assert.equal(create.json.inspection.state, 'created');
  const inspectionId = create.json.inspection.id;
  const pubUrl = new URL(create.json.publishUrl);
  const pubToken = pubUrl.searchParams.get('token');
  const offer = pubUrl.searchParams.get('offer');
  assert.ok(pubToken);
  assert.equal(pubUrl.origin, `http://127.0.0.1:${streamingPort}`, 'publishUrl ukazuje na streaming');
  assert.equal(offer, inspectionId);
  const pubClaims = decodeClaims(pubToken);
  assert.equal(pubClaims.sub, tokens.ownerUserId);
  assert.equal(pubClaims.role, 'publisher');
  assert.equal(pubClaims.insp, inspectionId);
  assert.equal(pubClaims.offerId, inspectionId);

  // 2. Duplikatne spustenie -> 409
  const dup = await authFetch(base, 'POST', '/api/v1/inspections', tokens.ownerToken, { listingId: tokens.listingId });
  assert.equal(dup.status, 409, `duplicate create should be 409: ${dup.status}`);

  // 3. Streaming server + publisher vytvori miestnost
  const srv = await startStreamingServer(streamingPort, base);
  const publisher = await wsRpc(streamingPort, pubToken);
  const room = await publisher.rpc('createRoom', { offerId: offer });
  assert.ok(room.roomId);
  assert.equal(room.role, 'publisher');

  // 4. Inspection stav -> room_created + room_id previazenie na Inspection
  let state = null;
  for (let i = 0; i < 40; i++) {
    const g = await authFetch(base, 'GET', `/api/v1/inspections/${inspectionId}`, tokens.ownerToken);
    assert.equal(g.status, 200);
    state = g.json.data.state;
    if (state === 'room_created') break;
    await wait(250);
  }
  assert.equal(state, 'room_created');
  const insp = (await authFetch(base, 'GET', `/api/v1/inspections/${inspectionId}`, tokens.ownerToken)).json.data;
  assert.equal(insp.roomId, room.roomId);

  // 5. Viewer sa pripoji cez CMEP (platforma vystavi viewer token + viewer URL)
  const join = await authFetch(base, 'POST', '/api/v1/inspections/join', tokens.viewerToken, {
    inspectionId, threadId: null, waitRoomSeconds: 8,
  });
  assert.equal(join.status, 200, `join failed: ${join.status} ${join.text}`);
  assert.ok(join.json.viewerUrl, 'viewerUrl expected');
  assert.equal(join.json.role, 'viewer');
  assert.equal(join.json.roomId, room.roomId);
  const viewToken = new URL(join.json.viewerUrl).searchParams.get('token');
  assert.ok(viewToken);
  const viewClaims = decodeClaims(viewToken);
  assert.equal(viewClaims.sub, tokens.viewerUserId);
  assert.equal(viewClaims.role, 'viewer');
  assert.equal(viewClaims.insp, inspectionId);
  assert.equal(viewClaims.offerId, inspectionId);
  assert.equal(viewClaims.rec, 0);

  // 6. Viewer request -> publisher accept -> viewer join (live)
  const viewer = await wsRpc(streamingPort, viewToken);
  await viewer.rpc('requestInspection', { roomId: room.roomId });
  const acc = await publisher.rpc('acceptInspection', { roomId: room.roomId, viewer: tokens.viewerUserId });
  assert.equal(acc.state, 'accepted');
  const vJoined = await viewer.rpc('joinRoom', { roomId: room.roomId });
  assert.equal(vJoined.state, 'live');

  // 7. Viewer NEMoze ziskat publisher prava (createRoom / record zamietnute)
  let createErr = null;
  try { await viewer.rpc('createRoom', { offerId: 'x' }); } catch (e) { createErr = e; }
  assert.ok(createErr, 'viewer createRoom should be forbidden');
  let recErr = null;
  try { await viewer.rpc('startRecording', {}); } catch (e) { recErr = e; }
  assert.ok(recErr, 'viewer startRecording should be forbidden');

  // 8. Cudzi uzivatel: nemoze spustit ani sledovat obhliadku
  const outsiderCreate = await authFetch(base, 'POST', '/api/v1/inspections', tokens.outsiderToken, { listingId: tokens.listingId });
  assert.ok(outsiderCreate.status >= 400, `outsider create should be rejected: ${outsiderCreate.status}`);
  const outsiderGet = await authFetch(base, 'GET', `/api/v1/inspections/${inspectionId}`, tokens.outsiderToken);
  assert.ok(outsiderGet.status >= 400, `outsider get should be rejected: ${outsiderGet.status}`);
  const outsiderJoin = await authFetch(base, 'POST', '/api/v1/inspections/join', tokens.outsiderToken, { inspectionId });
  assert.ok(outsiderJoin.status >= 400, `outsider join should be rejected: ${outsiderJoin.status}`);

  // 9. Ucastníci odídu (publisher ukončí miestnosť), potom platforma obhliadku ukončí (idempotentne).
  publisher.ws.close();
  viewer.ws.close();
  await wait(1500);

  const end = await authFetch(base, 'POST', `/api/v1/inspections/${inspectionId}/end`, tokens.ownerToken);
  assert.equal(end.status, 200, `end failed: ${end.status} ${end.text}`);
  assert.equal(end.json.data.state, 'ended');
  const ver2 = await fetch(`${base}/api/v1/inspections/${inspectionId}/verify?sub=${encodeURIComponent(tokens.ownerUserId)}&role=publisher`, {
    headers: { 'x-cmep-internal-key': INTERNAL_KEY },
  });
  const verBody = await ver2.json();
  assert.equal(verBody.ok, false, `verify after end should fail-closed: ${JSON.stringify(verBody)}`);
  assert.equal(verBody.reason, 'inspection_ended');

  // 10. Cleanup: overi stav streamingu: rooms=0, peers=0, workerAlive=true.
  let h = null;
  for (let i = 0; i < 30; i++) {
    try { h = await (await fetch(`http://127.0.0.1:${streamingPort}/healthz`)).json(); } catch { h = { media: {} }; }
    if (h.media.rooms === 0 && h.media.peers === 0 && h.media.workerAlive) break;
    await wait(500);
  }
  assert.equal(h.media.rooms, 0, `rooms should be 0: ${JSON.stringify(h.media)}`);
  assert.equal(h.media.peers, 0, `peers should be 0`);
  assert.equal(h.media.workerAlive, true, `worker should be alive: ${JSON.stringify(h.media)}`);

  srv.child.kill('SIGTERM');
  await wait(1500);
  platformProc.kill('SIGTERM');
});
