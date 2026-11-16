'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const WebSocket = require(path.resolve(__dirname, '..', 'node_modules/ws'));
const { createSignaling } = require('../src/signaling');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function makeMediasoup() {
  const allProducers = [];
  const mkObserver = () => {
    const handlers = {};
    return {
      on: (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); },
      emit: (ev, ...a) => { (handlers[ev] || []).forEach((fn) => { try { fn(...a); } catch {} }); },
    };
  };
  const mkProducer = (kind, appData = {}) => {
    const obs = mkObserver();
    const p = {
      id: `prod-${kind}-${allProducers.length + 1}-${Math.random().toString(16).slice(2, 6)}`,
      kind, closed: false, paused: false, appData, observer: obs,
      close() { if (this.closed) return; this.closed = true; obs.emit('close'); },
      pause: async () => { p.paused = true; }, resume: async () => { p.paused = false; },
    };
    allProducers.push(p); return p;
  };
  const mkTransport = (direction) => {
    const obs = mkObserver();
    return {
      id: `tr-${direction}-${Math.random().toString(16).slice(2, 6)}`, closed: false,
      iceParameters: { usernameFragment: 'u', password: 'p', iceLite: true }, iceCandidates: [],
      dtlsParameters: { role: 'auto', fingerprints: [{ algorithm: 'sha-256', value: 'AA' }] },
      observer: obs, on() {},
      close() { if (this.closed) return; this.closed = true; obs.emit('close'); },
      connect: async () => ({}), restartIce: async () => ({ usernameFragment: 'u2', password: 'p2', iceLite: true }),
      produce: async ({ kind, appData }) => mkProducer(kind, appData),
      consume: async ({ producerId }) => {
        const cobs = mkObserver(); const src = allProducers.find((x) => x.id === producerId);
        const c = { id: `cons-${producerId}`, producerId, kind: (src && src.kind) || 'unknown', closed: false, type: 'simple', rtpParameters: {}, observer: cobs, close() { if (this.closed) return; this.closed = true; cobs.emit('close'); }, resume: async () => {} };
        return c;
      },
    };
  };
  const router = {
    rtpCapabilities: { codecs: [{ kind: 'audio', mimeType: 'audio/opus', preferredPayloadType: 111, clockRate: 48000, channels: 2, parameters: {} }, { kind: 'video', mimeType: 'video/H264', preferredPayloadType: 96, clockRate: 90000, parameters: {} }], headerExtensions: [] },
    canConsume: () => true,
    createWebRtcTransport: async () => mkTransport('any'),
  };
  const worker = { closed: false, on() {}, createRouter: async () => router, close() { this.closed = true; } };
  return { mediasoup: { createWorker: async () => worker }, mediaCodecs: [], listenIps: [{ ip: '127.0.0.1' }] };
}

function makeAdapter() {
  return { async canCreateInspection() { return true; }, async canJoinInspection() { return true; }, async canRecord() { return true; } };
}

async function withServer(run) {
  const server = http.createServer((_, res) => { res.writeHead(404); res.end(); });
  await new Promise((res, rej) => server.listen(0, '127.0.0.1', () => { server.removeListener('error', rej); res(); }));
  const port = server.address().port;
  const { mediasoup, mediaCodecs, listenIps } = makeMediasoup();
  const sig = await createSignaling({
    server, mediasoup, mediaCodecs, listenIps, adapter: makeAdapter(), events: { emit: async () => {} },
    authenticate: async (token) => JSON.parse(Buffer.from(token, 'base64url').toString('utf8')), turnService: null,
  });
  try { await run({ port, sig }); } finally { try { await sig.close(); } catch {} await new Promise((r) => server.close(() => r())); }
}

function connectClient(port, claims) {
  const token = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${encodeURIComponent(token)}`);
  let idc = 0; const pending = new Map(); const events = [];
  ws.on('message', (d) => {
    const m = JSON.parse(d.toString());
    if (m.event) { events.push(m); return; }
    if (m.id !== undefined && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.to);
      m.ok ? p.resolve(m.data) : p.reject(Object.assign(new Error(m.error || 'rpc_failed'), { resp: m }));
    }
  });
  const open = new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('ws open timeout')), 8000);
    ws.on('open', () => { clearTimeout(to); resolve(); });
    ws.on('error', (e) => { clearTimeout(to); reject(e); });
  });
  function rpc(method, data, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const id = ++idc; const to = setTimeout(() => { pending.delete(id); reject(new Error('rpc timeout ' + method)); }, timeoutMs);
      pending.set(id, { resolve, reject, to }); ws.send(JSON.stringify({ id, method, data }));
    });
  }
  async function close() { try { ws.close(1000, 'test'); } catch {} await wait(30); }
  return { open, rpc, events, close };
}

function snapRoom(sig, roomId) {
  const room = sig.rooms.get(roomId); if (!room) return null;
  return {
    roomId: room.id, state: room.state,
    producers: [...room.producers.values()].map((m) => ({ producerId: m.producer.id, kind: m.kind, from: m.ownerSub, closed: !!m.producer.closed })),
  };
}
function kinds(list) { return list.map((p) => p.kind).sort(); }

async function createPubWithRoom(port) {
  const pub = connectClient(port, { sub: 'pub1', role: 'publisher', insp: 'insp1' }); await pub.open;
  const r = await pub.rpc('createRoom', { offerId: 'insp1' });
  const roomId = r.roomId; const tr = await pub.rpc('createWebRtcTransport', { roomId, direction: 'send' });
  return { pub, roomId, sendTr: tr.id };
}
async function joinViewerAfterAccept(port, roomId, pub) {
  const view = connectClient(port, { sub: 'view1', role: 'viewer', insp: 'insp1' }); await view.open;
  await view.rpc('requestInspection', { roomId });
  await pub.rpc('acceptInspection', { roomId, viewer: 'view1' });
  const jr = await view.rpc('joinRoom', { roomId });
  return { view, jr };
}

test('audio->video: room keeps both and viewer join returns both', { timeout: 30000 }, async () => {
  await withServer(async ({ port, sig }) => {
    const { pub, roomId, sendTr } = await createPubWithRoom(port);
    const a = await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    const v = await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    const snap = snapRoom(sig, roomId);
    assert.deepEqual(kinds(snap.producers), ['audio', 'video']);
    assert.ok(snap.producers.find((p) => p.producerId === a.producerId && p.kind === 'audio'));
    assert.ok(snap.producers.find((p) => p.producerId === v.producerId && p.kind === 'video'));
    const { view, jr } = await joinViewerAfterAccept(port, roomId, pub);
    assert.deepEqual(kinds(jr.producers), ['audio', 'video']);
    await view.close(); await pub.close();
  });
});

test('video->audio: room keeps both and viewer join returns both', { timeout: 30000 }, async () => {
  await withServer(async ({ port, sig }) => {
    const { pub, roomId, sendTr } = await createPubWithRoom(port);
    const v = await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    const a = await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    const snap = snapRoom(sig, roomId);
    assert.deepEqual(kinds(snap.producers), ['audio', 'video']);
    assert.ok(snap.producers.find((p) => p.producerId === v.producerId && p.kind === 'video'));
    assert.ok(snap.producers.find((p) => p.producerId === a.producerId && p.kind === 'audio'));
    const { view, jr } = await joinViewerAfterAccept(port, roomId, pub);
    assert.deepEqual(kinds(jr.producers), ['audio', 'video']);
    await view.close(); await pub.close();
  });
});

test('repeated audio: old closed/removed, new active, video preserved, no duplicate audio', { timeout: 30000 }, async () => {
  await withServer(async ({ port, sig }) => {
    const { pub, roomId, sendTr } = await createPubWithRoom(port);
    const a1 = await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    const v = await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    const a2 = await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    assert.notEqual(a1.producerId, a2.producerId);
    const room = sig.rooms.get(roomId);
    const peer = room.participants.get('pub1');
    const roomProds = [...room.producers.values()].map((m) => m.producer);
    const audioRoom = roomProds.filter((p) => p.kind === 'audio');
    const videoRoom = roomProds.filter((p) => p.kind === 'video');
    assert.equal(audioRoom.length, 1);
    assert.equal(videoRoom.length, 1);
    assert.equal(audioRoom[0].id, a2.producerId);
    assert.equal(videoRoom[0].id, v.producerId);
    assert.equal(audioRoom[0].closed, false);
    // old audio closed and not present
    assert.equal(room.producers.has(a1.producerId), false);
    const peerAudio = [...peer.producers.values()].filter((p) => p.kind === 'audio');
    const peerVideo = [...peer.producers.values()].filter((p) => p.kind === 'video');
    assert.equal(peerAudio.length, 1); assert.equal(peerVideo.length, 1);
    assert.equal(peerAudio[0].id, a2.producerId); assert.equal(peerVideo[0].id, v.producerId);
    await pub.close();
  });
});

test('repeated video: old closed/removed, new active, audio preserved, no duplicate video', { timeout: 30000 }, async () => {
  await withServer(async ({ port, sig }) => {
    const { pub, roomId, sendTr } = await createPubWithRoom(port);
    const v1 = await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    const a = await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    const v2 = await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    assert.notEqual(v1.producerId, v2.producerId);
    const room = sig.rooms.get(roomId);
    const peer = room.participants.get('pub1');
    const roomProds = [...room.producers.values()].map((m) => m.producer);
    const videoRoom = roomProds.filter((p) => p.kind === 'video');
    const audioRoom = roomProds.filter((p) => p.kind === 'audio');
    assert.equal(videoRoom.length, 1);
    assert.equal(audioRoom.length, 1);
    assert.equal(videoRoom[0].id, v2.producerId);
    assert.equal(audioRoom[0].id, a.producerId);
    assert.equal(videoRoom[0].closed, false);
    assert.equal(room.producers.has(v1.producerId), false);
    const peerVideo = [...peer.producers.values()].filter((p) => p.kind === 'video');
    const peerAudio = [...peer.producers.values()].filter((p) => p.kind === 'audio');
    assert.equal(peerVideo.length, 1); assert.equal(peerAudio.length, 1);
    assert.equal(peerVideo[0].id, v2.producerId); assert.equal(peerAudio[0].id, a.producerId);
    await pub.close();
  });
});

test('viewer joined before producers gets newProducer events for both and room keeps both', { timeout: 30000 }, async () => {
  await withServer(async ({ port, sig }) => {
    const { pub, roomId, sendTr } = await createPubWithRoom(port);
    const view = connectClient(port, { sub: 'view1', role: 'viewer', insp: 'insp1' }); await view.open;
    await view.rpc('requestInspection', { roomId });
    await pub.rpc('acceptInspection', { roomId, viewer: 'view1' });
    const jr = await view.rpc('joinRoom', { roomId });
    assert.deepEqual(jr.producers, []);
    await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    await wait(120);
    const evKinds = view.events.filter((e) => e.event === 'newProducer').map((e) => e.data.kind).sort();
    assert.deepEqual(evKinds, ['audio', 'video']);
    assert.deepEqual(kinds(snapRoom(sig, roomId).producers), ['audio', 'video']);
    await view.close(); await pub.close();
  });
});

test('viewer joined after producers gets audio and video in joinRoom response', { timeout: 30000 }, async () => {
  await withServer(async ({ port, sig }) => {
    const { pub, roomId, sendTr } = await createPubWithRoom(port);
    await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    const { view, jr } = await joinViewerAfterAccept(port, roomId, pub);
    assert.deepEqual(kinds(jr.producers), ['audio', 'video']);
    await view.close(); await pub.close();
  });
});

test('cleanup: peer disconnect removes its producers and room close leaves no orphan refs', { timeout: 30000 }, async () => {
  await withServer(async ({ port, sig }) => {
    const { pub, roomId, sendTr } = await createPubWithRoom(port);
    await pub.rpc('produce', { transportId: sendTr, kind: 'audio', rtpParameters: {} });
    await pub.rpc('produce', { transportId: sendTr, kind: 'video', rtpParameters: {} });
    assert.equal(sig.rooms.get(roomId).producers.size, 2);
    await pub.close();
    await wait(200);
    assert.equal(sig.rooms.get(roomId), null);
    assert.equal(sig.rooms.size(), 0);
  });
});
