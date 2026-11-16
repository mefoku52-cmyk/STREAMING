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
  maxRooms = 10,
  events,
  recorder = null,
}) {
  const worker = await mediasoup.createWorker({ logLevel: 'warn' });
  const router = await worker.createRouter({ mediaCodecs });
  const rooms = new SessionStore();
  const peers = new Set();
  const makeLimiter = createRateLimiter(rateLimit);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

  function send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }
  function notifyPeer(peer, event, data) { if (peer && peer.ws.readyState === WebSocket.OPEN) send(peer.ws, { event, data }); }
  function roomPeersExcept(room, sub) {
    return [...room.participants.values()].filter(p => p.sub !== sub);
  }
  function closeRoom(room, reason) {
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
  function cleanupPeer(peer, code) {
    peers.delete(peer);
    const room = peer.roomId ? rooms.get(peer.roomId) : null;
    if (room) {
      for (const [producerId, meta] of room.producers) {
        if (meta.ownerSub === peer.sub) room.producers.delete(producerId);
      }
      for (const entry of peer.transports.values()) { try { entry.transport.close(); } catch {} }
      peer.transports.clear(); peer.producers.clear(); peer.consumers.clear();
      room.participants.delete(peer.sub);
      events.emit(adapter, { type: 'participant_left', roomId: room.id, offerId: room.offerId, actorSub: peer.sub, role: peer.role, reason: code === undefined ? 'disconnect' : 'leave' });
      for (const other of roomPeersExcept(room, peer.sub)) notifyPeer(other, 'peerLeft', { sub: peer.sub });
      if (peer.sub === room.ownerId) closeRoom(room, 'owner_left');
      else if (room.participants.size === 0) closeRoom(room, 'empty');
      else if (room.participants.size === 1 && room.state === 'live') room.state = 'accepted';
    }
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
      const room = peer.roomId ? rooms.get(peer.roomId) : null;
      switch (msg.method) {
        case 'getRouterRtpCapabilities':
          return router.rtpCapabilities;
        case 'createRoom': {
          if (room) throw new Error('already_in_room');
          const offerId = String(msg.data?.offerId || '');
          if (!(await adapter.canCreateInspection(claims, offerId))) throw new Error('forbidden');
          if (rooms.size() >= maxRooms) throw new Error('too_many_rooms');
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
          const target = rooms.get(String(msg.data?.roomId || ''));
          if (!target) throw new Error('room_not_found');
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
          cleanupPeer(peer, 1000);
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
          return {
            id: transport.id, direction,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          };
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
          const meta = room.producers.get(String(msg.data?.producerId || ''));
          if (!meta || meta.producer.closed) throw new Error('producer_not_found');
          if (meta.ownerSub === peer.sub) throw new Error('cannot_consume_own_producer');
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
