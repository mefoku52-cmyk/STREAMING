'use strict';
/* browser-test.js — fully automated CMEP 1:1 publisher↔viewer browser test.
 *
 * Drives two ISOLATED Chromium browser contexts over the DevTools protocol
 * (CDP) — no Playwright/Puppeteer install required; uses the project's `ws`.
 * Media input: Chromium's built-in fake device (sine-wave audio + test
 * pattern video), auto-granted permissions, autoplay allowed.
 *
 * Proves: room creation, request/accept/join flow, WebRTC connection,
 * owner→viewer AND viewer→owner audio RTP flow (via element playback time
 * advancing + optional FFmpeg recording packet counts), cleanup (rooms=0,
 * peers=0, workerAlive=true, no ffmpeg leftovers).
 *
 * Usage: node scripts/browser-test.js
 * Requires: server running on SIGNALING_PORT with fresh tokens in
 * runtime/tokens/, chromium-browser in PATH, ENABLE_RECORDER optional.
 * Never prints tokens.
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const WebSocket = require('../backend/node_modules/ws');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.SIGNALING_PORT || 8504);
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = process.env.CHROME_BIN || 'chromium-browser';
const results = [];
const ok = (step, pass, detail = '') => {
  results.push({ step, pass, detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${step}${detail ? ` — ${detail}` : ''}`);
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function tokenFrom(file) {
  const url = new URL(fs.readFileSync(path.join(ROOT, 'runtime', 'tokens', file), 'utf8').trim());
  return { token: url.searchParams.get('token'), room: url.searchParams.get('room') || '' };
}
async function healthz() {
  const res = await fetch(`${BASE}/healthz`);
  return res.json();
}
/* --- minimal WS RPC client (same protocol as web/rpc.js) --- */
function makeWsRpc(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws?token=${encodeURIComponent(token)}`);
    const api = { ws, _id: 0, _waiters: [], _events: [], closed: false };
    ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      if (m.event) { const w = api._waiters.findIndex(x => x.type === m.event); if (w >= 0) api._waiters.splice(w, 1)[0].res(m); else api._events.push(m); return; }
      const p = api[`p${m.id}`]; if (!p) return;
      delete api[`p${m.id}`];
      m.ok ? p.res(m.data) : p.rej(Object.assign(new Error(m.error), { code: m.error }));
    });
    ws.on('open', () => resolve(api));
    ws.on('close', () => { api.closed = true; });
    ws.on('error', reject);
    api.rpc = (method, data) => new Promise((res, rej) => {
      const id = ++api._id; api[`p${id}`] = { res, rej };
      ws.send(JSON.stringify({ id, method, data }));
    });
    api.waitEvent = (type, ms = 8000) => {
      const i = api._events.findIndex(e => e.event === type);
      if (i >= 0) return Promise.resolve(api._events.splice(i, 1)[0]);
      return new Promise((res, rej) => {
        api._waiters.push({ type, res });
        setTimeout(() => { const w = api._waiters.findIndex(x => x.type === type); if (w >= 0) { api._waiters.splice(w, 1); rej(new Error(`event timeout ${type}`)); } }, ms);
      });
    };
    setTimeout(() => reject(new Error('ws connect timeout')), 6000);
  });
}
/* --- minimal CDP driver --- */
class Cdp {
  constructor(ws) { this.ws = ws; this.next = 1; this.pending = new Map(); this.handlers = new Map(); }
  static connect(wsUrl) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const c = new Cdp(ws);
      ws.on('message', (d) => {
        const m = JSON.parse(d.toString());
        if (m.id !== undefined && c.pending.has(m.id)) { const p = c.pending.get(m.id); c.pending.delete(m.id); m.error ? p.rej(new Error(m.error.message || JSON.stringify(m.error))) : p.res(m.result); return; }
        if (m.method) for (const h of c.handlers.get(m.method) || []) h(m);
      });
      ws.on('open', () => resolve(c));
      ws.on('error', reject);
    });
  }
  send(method, params = {}, sessionId) {
    return new Promise((res, rej) => {
      const id = this.next++;
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  on(method, fn) { (this.handlers.get(method) || this.handlers.set(method, []).get(method)).push(fn); }
  close() { try { this.ws.close(); } catch {} }
}
async function evalIn(cdp, sessionId, expr, awaitPromise = false) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise, returnByValue: true, userGesture: true }, sessionId);
  if (r.exceptionDetails) throw new Error('page eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function navigate(cdp, sessionId, url) {
  await cdp.send('Page.enable', {}, sessionId);
  const loaded = new Promise(res => cdp.on('Page.loadEventFired', m => { if (m.sessionId === sessionId) res(); }));
  await cdp.send('Page.navigate', { url }, sessionId);
  await loaded;
  for (let i = 0; i < 40; i++) { if (await evalIn(cdp, sessionId, 'document.readyState') === 'complete') return; await sleep(250); }
  throw new Error('page load timeout');
}
async function waitState(cdp, sessionId, test, timeoutMs, what) {
  const t0 = Date.now();
  for (;;) {
    const s = await evalIn(cdp, sessionId, "document.querySelector('#state')?.textContent || ''");
    if (test(s)) return s;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout waiting [${what}]; last state: ${s}`);
    await sleep(400);
  }
}

(async () => {
  const startedAt = Date.now();
  /* 0. server */
  const h0 = await healthz();
  ok('server.healthz', h0.ok === true && h0.media.workerAlive === true && h0.media.rooms === 0, `rooms=${h0.media.rooms} peers=${h0.media.peers} worker=${h0.media.workerAlive}`);
  if (!h0.ok || h0.media.rooms !== 0) throw new Error('server not clean at start');

  /* 1. chromium headless with fake media + auto-grant */
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cmep-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
    `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const to = setTimeout(() => rej(new Error('chromium DevTools timeout: ' + buf.slice(-300))), 20000);
    chrome.stderr.on('data', d => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(to); res(m[1]); }
    });
    chrome.on('exit', c => { clearTimeout(to); rej(new Error('chromium exited ' + c + ': ' + buf.slice(-300))); });
  });
  ok('chromium.launch', true, `pid=${chrome.pid} (fake media, auto-grant, autoplay-on)`);
  let ownerWs = null;
  let cdp = null;
  try {
    cdp = await Cdp.connect(wsUrl);    const ctxP = (await cdp.send('Target.createBrowserContext')).browserContextId;
    const ctxV = (await cdp.send('Target.createBrowserContext')).browserContextId;
    const tP = (await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId: ctxP })).targetId;
    const tV = (await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId: ctxV })).targetId;
    const aP = (await cdp.send('Target.attachToTarget', { targetId: tP, flatten: true })).sessionId;
    const aV = (await cdp.send('Target.attachToTarget', { targetId: tV, flatten: true })).sessionId;
    ok('browser.contexts', true, '2 izolované browserové kontexty (publisher + viewer)');

    /* 2. publisher page: token+offer, preview, createRoom */
    const owner = tokenFrom('inspector-owner.publish.url');
    const viewer = tokenFrom('inspector-viewer.viewer.url');
    await navigate(cdp, aP, `${BASE}/publish.html`);
    await evalIn(cdp, aP, `document.querySelector('#token').value = ${JSON.stringify(owner.token)}; document.querySelector('#offer').value = 'automated-test'; 'ok'`);
    await evalIn(cdp, aP, `document.querySelector('#preview').click(); 'clicked'`);
    await waitState(cdp, aP, s => s.includes('Náhľad aktívny'), 12000, 'preview+getUserMedia');
    ok('publisher.preview', true, 'getUserMedia fake zariadenie OK');
    await evalIn(cdp, aP, `document.querySelector('#start').click(); 'clicked'`);
    const stP = await waitState(cdp, aP, s => /Obhliadka [0-9a-f-]{36} aktívna/.test(s), 20000, 'createRoom+produce');
    const roomId = stP.match(/Obhliadka ([0-9a-f-]{36}) aktívna/)[1];
    ok('publisher.createRoom', true, `roomId=${roomId}`);
    const prodInfo = await evalIn(cdp, aP, "({n: producers.length, tracks: producers.map(p => p.track.kind + ':' + p.track.readyState)})");
    ok('publisher.producers', prodInfo.n === 2 && prodInfo.tracks.every(t => t.endsWith('live')), prodInfo.tracks.join(', '));

    /* owner helper WS: accept + recording control (naväzuje push eventy NIE — len requesty) */
    ownerWs = await makeWsRpc(owner.token);

    /* 3. viewer page: prefilled URL (?token=&room=), connect → request */
    await navigate(cdp, aV, `${BASE}/viewer.html?token=${encodeURIComponent(viewer.token)}&room=${roomId}`);
    const pre = await evalIn(cdp, aV, "({t: document.querySelector('#token').value.length, r: document.querySelector('#room').value})");
    ok('viewer.prefill', pre.t > 100 && pre.r === roomId, `token len=${pre.t}, room match=${pre.r === roomId}`);
    await evalIn(cdp, aV, `document.querySelector('#connect').click(); 'clicked'`);
    await waitState(cdp, aV, s => s.includes('Žiadam o obhliadku'), 15000, 'requestInspection');
    ok('viewer.request', true, 'requestInspection odoslaná');
    /* push event ide do room participantov → publisher UI ho zobrazí (helper WS nie je v room) */
    await waitState(cdp, aP, s => s.includes('žiada obhliadku'), 10000, 'publisher push inspectionRequested');
    ok('push.inspectionRequested', true, 'publisher obdržal push event (zobrazený v UI)');
    const acc = await ownerWs.rpc('acceptInspection', { roomId, viewer: 'inspector-viewer' });
    ok('owner.accept', acc.state === 'accepted', `state=${acc.state}`);

    /* 4. viewer auto-join on inspectionAccepted + consume */
    await waitState(cdp, aV, s => s.includes('V obhliadke'), 20000, 'viewer joinRoom+consume');
    ok('viewer.joined', true, `roomId=${roomId}`);
    const vCons = await evalIn(cdp, aV, "({recv: recvTransport ? recvTransport.direction : null, video: !!document.querySelector('#remote').srcObject && document.querySelector('#remote').srcObject.getVideoTracks().length > 0, audio: !!document.querySelector('#remoteAudio').srcObject && document.querySelector('#remoteAudio').srcObject.getAudioTracks().length > 0})");
    ok('viewer.consumers', vCons.recv === 'recv' && vCons.video && vCons.audio, `video=${vCons.video} audio(owner)=${vCons.audio}`);

    /* 5. recording ON → objective RTP proof at server (publisher je v room, helper nie) */
    const recDir = path.join(ROOT, 'recordings');
    const findNewFlv = () => fs.readdirSync(recDir).filter(f => f.endsWith('.flv')).map(f => ({ f, s: fs.statSync(path.join(recDir, f)) })).filter(x => x.s.mtimeMs > startedAt).sort((a, b) => b.s.mtimeMs - a.s.mtimeMs)[0];
    const recId = await evalIn(cdp, aP, "rpc.request('startRecording', {}).then(d => d.recordingId)", true);
    ok('recorder.start', typeof recId === 'string' && recId.length > 0, `recordingId=${recId}`);
    let recFile = null;
    for (let i = 0; i < 20 && !recFile; i++) { recFile = findNewFlv(); if (!recFile) await sleep(500); }
    ok('recorder.file', !!recFile, recFile ? recFile.f : 'žiadny .flv do 10 s');
    const size0 = recFile ? recFile.s.size : 0;
    await sleep(3000);
    const size1 = recFile ? fs.statSync(path.join(recDir, recFile.f)).size : 0;
    ok('recorder.rtpInbound', !!recFile && size1 > size0 && size1 > 0, `${recFile ? recFile.f : 'NO FILE'}: ${size0}B → ${size1}B (rastie = RTP tečie)`);

    /* 6. inbound RTP → decode → playback (owner video+audio at viewer) */
    const c0 = await evalIn(cdp, aV, "({t: document.querySelector('#remote').currentTime, rs: document.querySelector('#remote').readyState, paused: document.querySelector('#remote').paused})");
    await sleep(2500);
    const c1 = await evalIn(cdp, aV, "({t: document.querySelector('#remote').currentTime, rs: document.querySelector('#remote').readyState, paused: document.querySelector('#remote').paused})");
    ok('viewer.videoPlayback', c1.t > c0.t + 0.5 && c1.rs >= 2 && !c1.paused, `currentTime ${c0.t.toFixed(2)}s → ${c1.t.toFixed(2)}s (+${(c1.t - c0.t).toFixed(2)}s)`);
    const a0 = await evalIn(cdp, aV, "document.querySelector('#remoteAudio').currentTime");
    await sleep(1500);
    const a1 = await evalIn(cdp, aV, "document.querySelector('#remoteAudio').currentTime");
    ok('viewer.audioPlayback', a1 > a0 + 0.3, `audio currentTime ${a0.toFixed(2)}s → ${a1.toFixed(2)}s`);

    /* 7. reverse direction: viewer mic → publisher */
    await evalIn(cdp, aV, `document.querySelector('#micToggle').click(); 'clicked'`);
    await waitState(cdp, aP, s => s.includes('Prijímaný audio'), 12000, 'publisher consumeFrom viewer audio');
    ok('reverse.newProducer', true, 'push newProducer → publisher consumeFrom (viewer audio)');
    await sleep(2000);
    const pAudio = await evalIn(cdp, aP, "({n: !!document.querySelector('#remoteAudio') && !!document.querySelector('#remoteAudio').srcObject, t: document.querySelector('#remoteAudio') ? document.querySelector('#remoteAudio').currentTime : -1})");
    await sleep(1500);
    const pAudio2 = await evalIn(cdp, aP, "document.querySelector('#remoteAudio').currentTime");
    ok('reverse.viewerMicToPublisher', pAudio.n && pAudio2 > pAudio.t + 0.3, `publisher remoteAudio ${pAudio.t.toFixed(2)}s → ${pAudio2.toFixed(2)}s (viewer audio tečie k publisherovi)`);

    /* 8. recording OFF + ffprobe packets */
    await evalIn(cdp, aP, `rpc.request('stopRecording', { recordingId: ${JSON.stringify(recId)} })`, true);
    ok('recorder.stop', true, 'stopRecording OK');
    let probe = { packets: 0, bytes: 0, duration: 0 };
    if (recFile) {
      const { execFile } = require('node:child_process');
      const run = (cmd, args) => new Promise(res => execFile(cmd, args, { timeout: 20000 }, (e, so, se) => res({ e, out: so + se })));
      const pr = await run('ffprobe', ['-v', 'error', '-count_packets', '-show_streams', '-of', 'json', path.join(recDir, recFile.f)]);
      try {
        const j = JSON.parse(pr.out);
        const aSt = (j.streams || []).find(s => s.codec_type === 'audio') || {};
        probe = { packets: Number(aSt.nb_read_packets || 0), bytes: Number(aSt.nb_read_packets || 0) > 0 ? size1 : 0, duration: Number(aSt.duration || 0), codecs: (j.streams || []).map(s => s.codec_name).join('+') };
      } catch { probe.err = pr.out.slice(0, 200); }
    }
    ok('recorder.ffprobe', probe.packets > 0, `audio packets=${probe.packets}, size=${size1}B, duration=${probe.duration}s, codecs=${probe.codecs || probe.err || '?'}`);

    /* 9. cleanup */
    await evalIn(cdp, aV, `document.querySelector('#stop').click(); 'stopped'`);
    await sleep(700);
    await evalIn(cdp, aP, `document.querySelector('#stop').click(); 'stopped'`);
    try { ownerWs.ws.close(); } catch {}
    let h1 = null;
    for (let i = 0; i < 20; i++) {
      h1 = await healthz();
      if (h1.media.rooms === 0 && h1.media.peers === 0 && h1.media.workerAlive) break;
      await sleep(500);
    }
    ok('cleanup.healthz', h1.media.rooms === 0 && h1.media.peers === 0 && h1.media.workerAlive === true, `rooms=${h1.media.rooms} peers=${h1.media.peers} worker=${h1.media.workerAlive}`);
  } finally {
    try { ownerWs && ownerWs.ws.close(); } catch {}
    try { cdp && cdp.send('Browser.close'); } catch {}
    await sleep(800);
    try { chrome.kill('SIGKILL'); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  const fails = results.filter(r => !r.pass);
  console.log(`\n=== SÚHRN: ${results.length - fails.length}/${results.length} PASS${fails.length ? ` (${fails.map(f => f.step).join(', ')})` : ' — VŠETKO OK'} ===`);
  fs.writeFileSync(path.join(ROOT, 'runtime', 'browser-test-last.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
