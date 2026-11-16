'use strict';
const { WebSocketServer, WebSocket } = require('ws');
const { parseMessage } = require('./protocol');
const { SessionStore } = require('./session-store');
const log = require('./logger');

function createRateLimiter({ limit, windowMs }) {
  return () => {
    const state = { count: 0, windowStart: Date.now() };
    return () => {
      const t = Date.now();
      if (t - state.windowStart >= windowMs) { state.windowStart = t; state.count = 0; }
      state.count += 1;
      return state.count <= limit;
    };
  };
}

function tokenFromRequest(req) {
  const url = new URL(req.url, 'http://localhost');
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return url.searchParams.get('token') || '';
}

async function createSignaling({
  server, mediasoup, mediaCodecs, authenticate, adapter,
  listenIps = [{ ip: '127.0.0.1' }],
  rateLimit = { limit: 30, windowMs: 5000 },
  events,
  recorder = null,
  turnService = null,
}) {
  const worker = await mediasoup.createWorker({ logLevel: 'warn' });
  const router = await worker.createRouter({ mediaCodecs });
  const rooms = new SessionStore();
  const peers = new Set();
  const resumable = new Map(); // key: `${roomId}:${sub}` -> snapshot
  const RESUME_GRACE_MS = 30000;
  const makeLimiter = createRateLimiter(rateLimit);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

  function send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }
  function notifyPeer(peer, event, data) { if (peer && peer.ws.readyState === WebSocket.OPEN) send(peer.ws, { event, data }); }
  function roomPeersExcept(room, sub) {
    return [...room.participants.values()].filter(p => p.sub !== sub);
  }
  function clearResume(roomId, sub) {
    const key = `${roomId}:${sub}`;
    const snap = resumable.get(key);
    if (snap && snap.timer) clearTimeout(snap.timer);
    resumable.delete(key);
  }
  function clearRoomResumes(roomId) {
    for (const [k, snap] of resumable) {
      if (k.startsWith(`${roomId}:`)) { if (snap.timer) clearTimeout(snap.timer); resumable.delete(k); }
    }
  }
  function closeRoom(room, reason) {
    clearRoomResumes(room.id);
    for (const peer of room.participants.values()) {
      for (const entry of peer.transports.values()) { try { entry.transport.close(); } catch {} }
      peer.transports.clear(); peer.producers.clear(); peer.consumers.clear(); peer.roomId = null;
      notifyPeer(peer, 'roomClosed', { roomId: room.id, reason: reason || 'closed' });
      events.emit(adapter, { type: 'participant_left', roomId: room.id, offerId: room.offerId, actorSub: peer.sub, role: peer.role, reason: 'room_closed' });
    }
    for (const rec of room.recordings) { try { rec.stop('room_closed'); } catch {} }
    room.recordings.clear();
    room.state = 'closed';
    rooms.remove(room.id);
    events.emit(adapter, { type: 'inspection_ended', roomId: room.id, offerId: room.offerId, reason: reason || 'closed' });
    log.info('room closed', { roomId: room.id, reason });
  }
  function teardownPeerMedia(peer, room) {
    if (!room) return;
    for (const [producerId, meta] of room.producers) {
      if (meta.ownerSub === peer.sub) room.producers.delete(producerId);
    }
    for (const entry of peer.transports.values()) { try { entry.transport.close(); } catch {} }
    peer.transports.clear(); peer.producers.clear(); peer.consumers.clear();
  }
  function finalizePeerDeparture(peer, room, reason, opts = {}) {
    if (!room) return;
    teardownPeerMedia(peer, room);
    room.participants.delete(peer.sub);
    events.emit(adapter, { type: 'participant_left', roomId: room.id, offerId: room.offerId, actorSub: peer.sub, role: peer.role, reason });
    for (const other of roomPeersExcept(room, peer.sub)) notifyPeer(other, 'peerLeft', { sub: peer.sub });
    if (peer.sub === room.ownerId) closeRoom(room, opts.ownerReason || 'owner_left');
    else if (room.participants.size === 0 && resumableCountForRoom(room.id) === 0) closeRoom(room, 'empty');
    else if (room.participants.size === 1 && room.state === 'live') room.state = 'accepted';
  }
  function resumableCountForRoom(roomId) {
    let n = 0;
    for (const k of resumable.keys()) if (k.startsWith(`${roomId}:`)) n += 1;
    return n;
  }
  function cleanupPeer(peer, code, opts = {}) {
    peers.delete(peer);
    const room = peer.roomId ? rooms.get(peer.roomId) : null;
    if (!room) return;
    const isDisconnect = code === 1006 || code === 1001 || code === undefined || opts.disconnect === true;
    const explicitLeave = code === 1000 && opts.disconnect !== true;
    if (isDisconnect && !explicitLeave && room.state !== 'closed') {
      // park resumable slot: server-side transports/producers are torn down (cannot survive WS loss safely),
      // but participant slot is reserved for bounded resume with re-auth.
      const key = `${room.id}:${peer.sub}`;
      const prev = resumable.get(key);
      if (prev && prev.timer) clearTimeout(prev.timer);
      teardownPeerMedia(peer, room);
      room.participants.delete(peer.sub);
      for (const other of roomPeersExcept(room, peer.sub)) notifyPeer(other, 'peerDisconnected', { sub: peer.sub, resumableUntil: Date.now() + RESUME_GRACE_MS });
      events.emit(adapter, { type: 'participant_left', roomId: room.id, offerId: room.offerId, actorSub: peer.sub, role: peer.role, reason: 'disconnect_resumable' });
      const timer = setTimeout(() => {
        resumable.delete(key);
        const r = rooms.get(room.id);
        if (!r) return;
        events.emit(adapter, { type: 'participant_left', roomId: r.id, offerId: r.offerId, actorSub: peer.sub, role: peer.role, reason: 'resume_timeout' });
        if (peer.sub === r.ownerId) closeRoom(r, 'owner_resume_timeout');
        else if (r.participants.size === 0 && resumableCountForRoom(r.id) === 0) closeRoom(r, 'empty');
        else if (r.participants.size === 1 && r.state === 'live') r.state = 'accepted';
      }, RESUME_GRACE_MS);
      resumable.set(key, { roomId: room.id, sub: peer.sub, role: peer.role, owner: peer.sub === room.ownerId, acceptedViewer: room.acceptedViewer, expiresAt: Date.now() + RESUME_GRACE_MS, timer });
      if (room.participants.size === 1 && room.state === 'live') room.state = 'accepted';
      log.info('peer parked for resume', { roomId: room.id, sub: peer.sub, role: peer.role, graceMs: RESUME_GRACE_MS });
      return;
    }
    finalizePeerDeparture(peer, room, explicitLeave ? 'leave' : 'disconnect', { ownerReason: 'owner_left' });
  }

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/ws') { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });

  wss.on('connection', async (ws, req) => {
    let claims;
    try { claims = await authenticate(tokenFromRequest(req)); } catch (e) { log.warn('authenticate error', { error: e.message }); claims = null; }
    if (!claims) { ws.close(4401, 'unauthorized'); return; }
    const limiter = makeLimiter();
    const peer = { sub: claims.sub, ws, role: null, roomId: null, transports: new Map(), producers: new Map(), consumers: new Map() };

    peers.add(peer);
    let limiterViolations = 0;

    ws.on('message', async raw => {
      if (!limiter()) {
        limiterViolations += 1;
        send(ws, { id: null, ok: false, error: 'rate_limited' });
        if (limiterViolations >= 2) ws.close(4408, 'rate_limited');
        return;
      }
      let msg;
      try { msg = parseMessage(raw.toString()); } catch (e) { send(ws, { id: null, ok: false, error: e.message }); return; }
      try {
        const data = await handle(peer, msg, claims);
        send(ws, { id: msg.id, ok: true, data });
      } catch (e) {
        log.warn('request failed', { method: msg.method, sub: peer.sub, error: e.message });
        send(ws, { id: msg.id, ok: false, error: e.message });
      }
    });

    ws.on('close', (code) => {
      if (code === 1006) events.emit(adapter, { type: 'connection_failed', actorSub: peer.sub, roomId: peer.roomId, reason: 'abnormal_close' });
      cleanupPeer(peer, code);
    });
    ws.on('error', () => { try { ws.close(); } catch {} });

    async function handle(peer, msg, claims) {
      let room = peer.roomId ? rooms.get(peer.roomId) : null;
      switch (msg.method) {
        case 'getRouterRtpCapabilities':
          return router.rtpCapabilities;
        case 'resumeSession': {
          if (room) throw new Error('already_in_room');
          const roomId = String(msg.data?.roomId || '');
          const key = `${roomId}:${peer.sub}`;
          const snap = resumable.get(key);
          if (!snap) throw new Error('resume_not_available');
          if (snap.expiresAt < Date.now()) { if (snap.timer) clearTimeout(snap.timer); resumable.delete(key); throw new Error('resume_expired'); }
          const target = rooms.get(roomId);
          if (!target || target.state === 'closed') { if (snap.timer) clearTimeout(snap.timer); resumable.delete(key); throw new Error('room_not_found'); }
          // Re-validate authorization with fresh claims
          let allowed = false;
          if (snap.role === 'publisher' && target.ownerId === peer.sub) {
            allowed = await adapter.canCreateInspection(claims, target.offerId);
          } else if (snap.role === 'viewer') {
            allowed = await adapter.canJoinInspection(claims, target);
          }
          if (!allowed) { if (snap.timer) clearTimeout(snap.timer); resumable.delete(key); throw new Error('forbidden'); }
          if (target.participants.has(peer.sub)) { if (snap.timer) clearTimeout(snap.timer); resumable.delete(key); throw new Error('already_joined'); }
          // For viewer, ensure still accepted viewer and room in resumable state
          if (snap.role === 'viewer') {
            if (target.acceptedViewer !== peer.sub) { if (snap.timer) clearTimeout(snap.timer); resumable.delete(key); throw new Error('forbidden'); }
            if (target.state !== 'accepted' && target.state !== 'live') throw new Error('invalid_state');
          }
          if (snap.timer) clearTimeout(snap.timer);
          resumable.delete(key);
          peer.role = snap.role;
          peer.roomId = target.id;
          target.participants.set(peer.sub, peer);
          if (snap.role === 'viewer' && target.state === 'accepted') target.state = 'live';
          events.emit(adapter, { type: 'participant_joined', roomId: target.id, offerId: target.offerId, actorSub: peer.sub, role: peer.role, reason: 'resume' });
          for (const other of roomPeersExcept(target, peer.sub)) notifyPeer(other, 'peerRejoined', { sub: peer.sub, role: peer.role });
          const producerList = [...target.producers.values()].map(m => ({ producerId: m.producer.id, kind: m.kind, from: m.ownerSub }));
          log.info('peer resumed session', { roomId: target.id, sub: peer.sub, role: peer.role });
          return { roomId: target.id, state: target.state, role: peer.role, producers: producerList, resumed: true, recreateTransports: true };
        }
        case 'getIceServers': {
          if (!turnService || !turnService.isEnabled()) return { iceServers: [], ttlSeconds: 0, expiresAt: 0 };
          const issued = turnService.issueForUser(peer.sub);
          return { iceServers: issued.iceServers, ttlSeconds: issued.ttlSeconds, expiresAt: issued.expiresAt };
        }
        case 'createRoom': {
          if (room) throw new Error('already_in_room');
          const offerId = String(msg.data?.offerId || '');
          if (!(await adapter.canCreateInspection(claims, offerId))) throw new Error('forbidden');
          // if owner has resumable room for same offer, instruct resume
          for (const [k, snap] of resumable) {
            if (snap.sub === peer.sub && snap.role === 'publisher') {
              const r = rooms.get(snap.roomId);
              if (r && r.offerId === offerId) return { roomId: r.id, state: r.state, role: 'publisher', shouldResume: true };
            }
          }
          if (rooms.size() >= 10) throw new Error('too_many_rooms');
          const newRoom = rooms.create({ ownerId: claims.sub, offerId });
          newRoom.state = 'pending';
          peer.role = 'publisher';
          peer.roomId = newRoom.id;
  newRoom.participants.set(claims.sub, peer);
  await events.emit(adapter, { type: 'inspection_requested', roomId: newRoom.id, offerId, actorSub: claims.sub, role: 'owner' });
  await events.emit(adapter, { type: 'participant_joined', roomId: newRoom.id, actorSub: claims.sub, role: 'publisher' });
  log.info('room created', { roomId: newRoom.id, offerId });
          return { roomId: newRoom.id, state: newRoom.state, role: peer.role };
        }
        case 'joinRoom': {
          if (room) throw new Error('already_in_room');
          const targetId = String(msg.data?.roomId || '');
          const target = rooms.get(targetId);
          if (!target) throw new Error('room_not_found');
          // resumable slot shortcut
          const snap = resumable.get(`${target.id}:${claims.sub}`);
          if (snap) return { roomId: target.id, state: target.state, role: snap.role, shouldResume: true };
          const isOwnerJoin = target.ownerId === claims.sub;
          if (!isOwnerJoin && target.state === 'pending') throw new Error('inspection_not_accepted');
          if (!isOwnerJoin && (target.state === 'accepted' || target.state === 'live') && target.acceptedViewer !== claims.sub) throw new Error('room_full');
          if (!(await adapter.canJoinInspection(claims, target))) throw new Error('forbidden');
          if (target.participants.has(claims.sub)) throw new Error('already_joined');
          const isOwner = target.ownerId === claims.sub;
          if (!isOwner && target.state !== 'accepted') throw new Error('not_accepted');
          if (!isOwner && target.participants.size >= 2) throw new Error('room_full');
          peer.role = isOwner ? 'publisher' : 'viewer';
          peer.roomId = target.id;
          target.participants.set(claims.sub, peer);
          if (!isOwner && target.state === 'accepted') {
            target.state = 'live';
            events.emit(adapter, { type: 'inspection_started', roomId: target.id, offerId: target.offerId, actorSub: claims.sub, role: 'viewer' });
          }
          events.emit(adapter, { type: 'participant_joined', roomId: target.id, offerId: target.offerId, actorSub: claims.sub, role: peer.role });
          for (const other of roomPeersExcept(target, claims.sub)) notifyPeer(other, 'peerJoined', { sub: claims.sub, role: peer.role });
          log.info('peer joined', { roomId: target.id, sub: peer.sub, role: peer.role });
          const producerList = [...target.producers.values()].map(m => ({ producerId: m.producer.id, kind: m.kind, from: m.ownerSub }));
          return { roomId: target.id, state: target.state, role: peer.role, producers: producerList };
        }
        case 'leaveRoom': {
          if (!room) return { ok: true };
          clearResume(room.id, peer.sub);
          cleanupPeer(peer, 1000);
          peer.roomId = null; peer.role = null;
          return { ok: true };
        }
        case 'requestInspection': {
          const target = rooms.get(String(msg.data?.roomId || ''));
          if (!target) throw new Error('room_not_found');
          if (target.state !== 'pending') throw new Error('invalid_state');
          if (target.ownerId === peer.sub) throw new Error('owner_cannot_request');
          target.pendingPeer = { sub: peer.sub, ws: peer.ws };
          events.emit(adapter, { type: 'inspection_requested', roomId: target.id, offerId: target.offerId, actorSub: peer.sub, role: 'viewer' });
          for (const p of roomPeersExcept(target, peer.sub)) notifyPeer(p, 'inspectionRequested', { roomId: target.id, from: peer.sub });
          return { roomId: target.id, state: target.state };
        }
        case 'acceptInspection': {
          const target = rooms.get(String(msg.data?.roomId || ''));
          if (!target) throw new Error('room_not_found');
          if (target.ownerId !== claims.sub) throw new Error('forbidden');
          if (target.state !== 'pending') throw new Error('invalid_state');
          const viewer = String(msg.data?.viewer || '');
          if (!viewer || viewer === claims.sub) throw new Error('invalid_viewer');
          target.acceptedViewer = viewer;
          target.state = 'accepted';
          events.emit(adapter, { type: 'inspection_accepted', roomId: target.id, offerId: target.offerId, actorSub: claims.sub, role: 'owner' });
          if (target.pendingPeer && target.pendingPeer.sub === viewer) {
            notifyPeer({ ws: target.pendingPeer.ws }, 'inspectionAccepted', { roomId: target.id });
            target.pendingPeer = null;
          }
          return { roomId: target.id, state: target.state, viewer };
        }
        case 'rejectInspection': {
          const target = rooms.get(String(msg.data?.roomId || ''));
          if (!target) throw new Error('room_not_found');
          if (target.ownerId !== claims.sub) throw new Error('forbidden');
          events.emit(adapter, { type: 'inspection_rejected', roomId: target.id, offerId: target.offerId, actorSub: claims.sub, role: 'owner', reason: String(msg.data?.reason || '') });
          if (target.pendingPeer) {
            notifyPeer({ ws: target.pendingPeer.ws }, 'inspectionRejected', { roomId: target.id });
            target.pendingPeer = null;
          }
          return { roomId: target.id, state: target.state };
        }
        case 'createWebRtcTransport': {
          if (!room) throw new Error('not_in_room');
          const direction = msg.data?.direction === 'recv' ? 'recv' : 'send';
          const transport = await router.createWebRtcTransport({
            listenIps, enableUdp: true, enableTcp: true, preferUdp: true, initialAvailableOutgoingBitrate: 1000000,
          });
          transport.on('icestatechange', (state) => log.debug('ice state', { roomId: room.id, sub: peer.sub, transport: transport.id, state }));
          transport.on('dtlsstatechange', (state) => {
            if (state === 'failed' || state === 'closed') { try { transport.close(); } catch {} }
          });
          peer.transports.set(transport.id, { transport, direction });
          transport.observer.on('close', () => peer.transports.delete(transport.id));
          const ice = (turnService && turnService.isEnabled()) ? turnService.issueForUser(peer.sub) : null;
          return {
            id: transport.id, direction,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            iceServers: ice ? ice.iceServers : [],
            iceServersExpiresAt: ice ? ice.expiresAt : 0,
          };
        }
        case 'restartIce': {
          if (!room) throw new Error('not_in_room');
          const entry = peer.transports.get(String(msg.data?.transportId || ''));
          if (!entry || entry.transport.closed) throw new Error('transport_not_found');
          const iceParameters = await entry.transport.restartIce();
          return { transportId: entry.transport.id, iceParameters };
        }
        case 'connectTransport': {
          if (!room) throw new Error('not_in_room');
          const entry = peer.transports.get(String(msg.data?.transportId || ''));
          if (!entry || entry.transport.closed) throw new Error('transport_not_found');
          await entry.transport.connect({ dtlsParameters: msg.data?.dtlsParameters });
          return { connected: true };
        }
        case 'produce': {
          if (!room) throw new Error('not_in_room');
          const entry = peer.transports.get(String(msg.data?.transportId || ''));
          if (!entry || entry.transport.closed) throw new Error('transport_not_found');
          if (entry.direction !== 'send') throw new Error('wrong_transport_direction');
          const kind = msg.data?.kind;
          if (kind !== 'audio' && kind !== 'video') throw new Error('invalid_kind');
          if (peer.role === 'viewer' && kind === 'video') throw new Error('viewer_video_forbidden');
          // prevent duplicate producers by kind for same peer (reconnect/retry safety)
          for (const [pid, existing] of [...peer.producers.entries()]) {
            if (existing && !existing.closed && existing.kind === kind) {
              try { existing.close(); } catch {}
              peer.producers.delete(pid);
              room.producers.delete(pid);
            }
          }
          const producer = await entry.transport.produce({ kind, rtpParameters: msg.data?.rtpParameters, appData: { sub: peer.sub } });
          peer.producers.set(producer.id, producer);
          room.producers.set(producer.id, { producer, ownerSub: peer.sub, kind });
          producer.observer.on('close', () => { peer.producers.delete(producer.id); room.producers.delete(producer.id); });
          for (const other of roomPeersExcept(room, peer.sub)) notifyPeer(other, 'newProducer', { producerId: producer.id, kind, from: peer.sub });
          log.info('producer created', { roomId: room.id, sub: peer.sub, kind, producerId: producer.id });
          return { producerId: producer.id, kind };
        }
        case 'consume': {
          if (!room) throw new Error('not_in_room');
          const producerId = String(msg.data?.producerId || '');
          const meta = room.producers.get(producerId);
          if (!meta || meta.producer.closed) throw new Error('producer_not_found');
          if (meta.ownerSub === peer.sub) throw new Error('cannot_consume_own_producer');
          // dedupe: reuse existing consumer for same producer on this peer
          for (const c of peer.consumers.values()) {
            try {
              if (!c.closed && c.producerId === meta.producer.id) {
                return { consumerId: c.id, producerId: meta.producer.id, kind: c.kind, rtpParameters: c.rtpParameters, type: c.type, existing: true };
              }
            } catch {}
          }
          const recvEntry = [...peer.transports.values()].find(e => e.direction === 'recv' && !e.transport.closed);
          if (!recvEntry) throw new Error('recv_transport_not_found');
          if (!router.canConsume({ producerId: meta.producer.id, rtpCapabilities: msg.data?.rtpCapabilities })) throw new Error('cannot_consume');
          const consumer = await recvEntry.transport.consume({
            producerId: meta.producer.id, rtpCapabilities: msg.data?.rtpCapabilities, paused: true, appData: { sub: peer.sub },
          });
          peer.consumers.set(consumer.id, consumer);
          consumer.observer.on('close', () => peer.consumers.delete(consumer.id));
          return {
            consumerId: consumer.id, producerId: meta.producer.id, kind: consumer.kind,
            rtpParameters: consumer.rtpParameters, type: consumer.type,
          };
        }
        case 'resumeConsumer': {
          if (!room) throw new Error('not_in_room');
          const consumer = peer.consumers.get(String(msg.data?.consumerId || ''));
          if (!consumer || consumer.closed) throw new Error('consumer_not_found');
          await consumer.resume();
          return { resumed: true };
        }
        case 'startRecording': {
          if (!room) throw new Error('not_in_room');
          if (!(await adapter.canRecord(claims, room))) throw new Error('forbidden');
          if (!recorder) throw new Error('recorder_unavailable');
          const recorderSession = await recorder.start({ room, router });
          room.recordings.add(recorderSession);
          log.info('recording started', { roomId: room.id, recordingId: recorderSession.id });
          return { recordingId: recorderSession.id };
        }
        case 'stopRecording': {
          if (!room) throw new Error('not_in_room');
          const recId = String(msg.data?.recordingId || '');
          for (const rec of room.recordings) {
            if (rec.id === recId) { rec.stop('client_request'); room.recordings.delete(rec); return { stopped: true }; }
          }
          throw new Error('recording_not_found');
        }
        case 'close': {
          const scope = msg.data?.scope || 'room';
          if (scope === 'room') {
            if (!room) throw new Error('not_in_room');
            if (room.ownerId !== claims.sub) throw new Error('forbidden');
            closeRoom(room, 'owner_requested');
            return { closed: room.id };
          }
          throw new Error('invalid_scope');
        }
        default:
          throw new Error('method_requires_media_package');
      }
    }

    send(ws, { event: 'ready', data: { sub: peer.sub } });
  });

  worker.on('died', (err) => {
    log.error('mediasoup worker died', { error: err?.message });
    for (const peer of peers) { try { peer.ws.close(1011, 'worker_died'); } catch {} }
    process.exitCode = 1;
  });

  return {
    wss, worker, router, rooms,
    status: () => ({ rooms: rooms.size(), workerAlive: !worker.closed, peers: peers.size }),
    /**
     * Ukoncenie obhliadky zo strany platformy (CMEP). Room sa najde podla
     * offerId === inspectionId. Vola sa server-side z interneho HTTP endpointu.
     */
    endInspection: (inspectionId) => {
      const target = String(inspectionId || '');
      if (!target) return { ok: false, reason: 'invalid_inspection_id' };
      for (const room of rooms.list()) {
        if (String(room.offerId) === target) {
          closeRoom(room, 'platform_ended');
          return { ok: true, roomId: room.id };
        }
      }
      return { ok: false, reason: 'room_not_found' };
    },
    close: async () => {
      for (const peer of peers) { try { peer.ws.close(1001, 'server_shutdown'); } catch {} }
      wss.close();
      for (const room of rooms.list()) closeRoom(room, 'shutdown');
      worker.close();
    },
  };
}
module.exports = { createSignaling };
