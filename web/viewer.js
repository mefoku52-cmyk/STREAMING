'use strict';
const stateEl = document.querySelector('#state');
const videoEl = document.querySelector('#remote');
const say = (m) => { stateEl.textContent = m; };
let wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':8504/ws';
let rpc = null, device = null, sendTransport = null, recvTransport = null, roomId = null;
let micStream = null, audioProducer = null, myMicOn = false;
let currentToken = '', reconnecting = false, reconnectAttempts = 0, stoppedByUser = true, joined = false;
const MAX_RECONNECT_ATTEMPTS = 8;
const consumedProducerIds = new Set();

const qp = new URLSearchParams(location.search);
if (qp.get('token')) document.querySelector('#token').value = qp.get('token');
if (qp.get('room')) document.querySelector('#room').value = qp.get('room');

const connEl = document.querySelector('#connState');
const camStateEl = document.querySelector('#camState');
const micStateEl = document.querySelector('#micState');
const callStateEl = document.querySelector('#callState');
const remoteAudioEl = document.querySelector('#remoteAudio');
const setConn = (state) => { if (connEl) { connEl.textContent = state; connEl.dataset.state = state; } };
const setCall = (state) => { if (callStateEl) callStateEl.textContent = state; };
let iceRestarting = false;
async function restartTransportIce(transport, label) {
  if (!transport || !rpc || !rpc.isOpen() || iceRestarting || reconnecting) return;
  iceRestarting = true;
  try {
    say(`Obnovujem ICE (${label})…`);
    const r = await rpc.request('restartIce', { transportId: transport.id });
    await transport.restartIce({ iceParameters: r.iceParameters });
    say('ICE obnovené.');
  } catch (e) {
    if (!reconnecting) say(`ICE restart zlyhal: ${e.message}`);
  } finally { iceRestarting = false; }
}
function wireConnectionState(transport, label) {
  if (!transport || typeof transport.on !== 'function') return;
  const update = (st) => {
    const state = st || transport.connectionState || 'new';
    setConn(state);
    if (state === 'failed') restartTransportIce(transport, label || 'transport');
  };
  transport.on('connectionstatechange', (st) => {
    update(st);
    if (st === 'disconnected') setTimeout(() => { if (transport.connectionState === 'disconnected' || transport.connectionState === 'failed') restartTransportIce(transport, label || 'transport'); }, 3000);
  });
  update();
}
function refreshMicState() { if (micStateEl) micStateEl.textContent = myMicOn ? 'zapnutý' : 'vypnutý'; }
function maybeShowAudioButton() {
  const btn = document.querySelector('#enableAudio');
  if (!btn || !remoteAudioEl) return;
  btn.hidden = !(remoteAudioEl.paused && remoteAudioEl.srcObject);
}
if (remoteAudioEl) {
  remoteAudioEl.addEventListener('play', maybeShowAudioButton);
  remoteAudioEl.addEventListener('pause', maybeShowAudioButton);
}
document.querySelector('#enableAudio').addEventListener('click', async (e) => { e.target.hidden = true; try { await remoteAudioEl.play(); } catch (err) { say(`Zvuk: ${err.name}`); } });
if (qp.get('auto') === '1' && qp.get('token') && qp.get('room')) {
  setTimeout(() => document.querySelector('#connect').click(), 400);
}

function wireTransport(t, direction) {
  t.on('connect', ({ dtlsParameters }, callback, errback) => {
    if (!rpc || !rpc.isOpen()) return errback(new Error('not_connected'));
    rpc.request('connectTransport', { transportId: t.id, dtlsParameters }).then(callback).catch(errback);
  });
  if (direction === 'send') {
    t.on('produce', ({ kind, rtpParameters }, callback, errback) => {
      if (!rpc || !rpc.isOpen()) return errback(new Error('not_connected'));
      rpc.request('produce', { transportId: t.id, kind, rtpParameters }).then(r => callback({ id: r.producerId })).catch(errback);
    });
  }
}

async function consumeProducer(p) {
  if (!rpc || !rpc.isOpen() || !device) return;
  const producerId = p.producerId || p.id;
  if (!producerId || consumedProducerIds.has(producerId)) return;
  consumedProducerIds.add(producerId);
  try {
    if (!recvTransport) {
      const params = await rpc.request('createWebRtcTransport', { roomId, direction: 'recv' });
      recvTransport = device.createRecvTransport({ ...params, iceServers: params.iceServers || [] });
      wireTransport(recvTransport, 'recv');
      wireConnectionState(recvTransport, 'recv');
    }
    const data = await rpc.request('consume', { producerId, rtpCapabilities: device.rtpCapabilities });
    const consumer = await recvTransport.consume({ id: data.consumerId, producerId: data.producerId, kind: data.kind, rtpParameters: data.rtpParameters });
    await rpc.request('resumeConsumer', { consumerId: consumer.id });
    if (data.kind === 'video') { videoEl.srcObject = new MediaStream([consumer.track]); if (camStateEl) camStateEl.textContent = 'prijímaná'; }
    else { remoteAudioEl.srcObject = new MediaStream([consumer.track]); maybeShowAudioButton(); }
    say(`Prijímaný ${data.kind} z obhliadky.`);
  } catch (e) {
    consumedProducerIds.delete(producerId);
    if (!reconnecting) say(`Chyba príjmu: ${e.message}`);
  }
}

function resetMediaState(full) {
  try { if (audioProducer) audioProducer.close(); } catch {}
  try { if (sendTransport) sendTransport.close(); } catch {}
  try { if (recvTransport) recvTransport.close(); } catch {}
  audioProducer = null; sendTransport = null; recvTransport = null; device = null; consumedProducerIds.clear();
  if (full) { roomId = null; joined = false; }
}

async function ensureDeviceAndRecv(existingProducers = []) {
  if (!device) {
    const caps = await rpc.request('getRouterRtpCapabilities');
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: caps });
  }
  for (const p of existingProducers || []) await consumeProducer(p);
  if (myMicOn && micStream) await republishMic();
}

async function republishMic() {
  if (!rpc || !rpc.isOpen() || !device) return;
  try {
    if (!micStream) micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!sendTransport) {
      const params = await rpc.request('createWebRtcTransport', { roomId, direction: 'send' });
      sendTransport = device.createSendTransport({ ...params, iceServers: params.iceServers || [] });
      wireTransport(sendTransport, 'send');
      wireConnectionState(sendTransport, 'send');
    }
    try { if (audioProducer) audioProducer.close(); } catch {}
    audioProducer = await sendTransport.produce({ track: micStream.getAudioTracks()[0] });
    myMicOn = true;
    document.querySelector('#micToggle').textContent = 'Mikrofón: ON';
    refreshMicState();
  } catch (e) { say(`Mikrofón sa nepodarilo obnoviť: ${e.message}`); }
}

async function publishMicToggle() {
  if (!micStream) {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!sendTransport) {
      const params = await rpc.request('createWebRtcTransport', { roomId, direction: 'send' });
      sendTransport = device.createSendTransport({ ...params, iceServers: params.iceServers || [] });
      wireTransport(sendTransport, 'send');
      wireConnectionState(sendTransport, 'send');
    }
    audioProducer = await sendTransport.produce({ track: micStream.getAudioTracks()[0] });
    myMicOn = true;
  } else if (audioProducer) {
    myMicOn = !myMicOn;
    myMicOn ? audioProducer.resume() : audioProducer.pause();
  } else {
    await republishMic();
  }
  document.querySelector('#micToggle').textContent = myMicOn ? 'Mikrofón: ON' : 'Mikrofón: OFF';
  refreshMicState();
}

async function ensureConnected() {
  if (rpc && rpc.isOpen()) return;
  currentToken = document.querySelector('#token').value.trim();
  if (!currentToken) throw new Error('Chýba token.');
  rpc = new CmepRpcClient(`${wsUrl}?token=${encodeURIComponent(currentToken)}`);
  rpc.onEvent = async (event, data) => {
    if (event === 'inspectionAccepted') { setCall('predávajúci schválil — pripájam sa'); say('Predávajúci schválil obhliadku — pripájam sa…'); try { await joinOrResume(roomId || document.querySelector('#room').value.trim()); } catch (e) { say(`Chyba: ${e.message}`); } }
    if (event === 'inspectionRejected') { setCall('zamietnuté'); say('Predávajúci zamietol obhliadku.'); }
    if (event === 'newProducer') await consumeProducer(data);
    if (event === 'roomClosed') { stoppedByUser = true; setCall('ukončený'); say('Obhliadka bola ukončená predávajúcim.'); }
    if (event === 'peerLeft') { setCall('predávajúci sa odpojil'); videoEl.srcObject = null; say('Predávajúci sa odpojil.'); }
    if (event === 'peerDisconnected') { setCall('predávajúci sa prepája…'); }
    if (event === 'peerRejoined') { setCall('v hovore'); }
  };
  rpc.onClose = ({ code, manual }) => {
    if (manual || stoppedByUser) return;
    if (code === 4401) { say('Session expirovala alebo autorizácia bola odobratá.'); stoppedByUser = true; return; }
    scheduleReconnect();
  };
  await rpc.connect();
}

async function joinOrResume(targetRoomId) {
  if (!targetRoomId) throw new Error('Chýba Room ID.');
  let joinedResp;
  try {
    joinedResp = await rpc.request('joinRoom', { roomId: targetRoomId });
  } catch (e) {
    if (/not_accepted/.test(e.message) || e.message === 'forbidden') {
      say('Žiadam o obhliadku… (čakám na schválenie predávajúcim)');
      await rpc.request('requestInspection', { roomId: targetRoomId });
      roomId = targetRoomId;
      return;
    }
    throw e;
  }
  if (joinedResp && joinedResp.shouldResume) {
    joinedResp = await rpc.request('resumeSession', { roomId: targetRoomId });
  }
  roomId = joinedResp.roomId;
  joined = true;
  await ensureDeviceAndRecv(joinedResp.producers || []);
  document.querySelector('#stop').disabled = false;
  document.querySelector('#micToggle').disabled = false;
  setCall('v hovore');
  say(`V obhliadke ${roomId} (state: ${joinedResp.state}).`);
}

async function scheduleReconnect() {
  if (reconnecting || stoppedByUser) return;
  reconnecting = true;
  try {
    resetMediaState(false);
    while (!stoppedByUser && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
      say(`Výpadok spojenia. Pokus o obnovenie ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} o ${Math.round(delay/1000)}s…`);
      await new Promise(r => setTimeout(r, delay));
      if (stoppedByUser) return;
      try {
        if (rpc) try { rpc.close(); } catch {}
        rpc = null;
        await ensureConnected();
        if (roomId) await joinOrResume(roomId);
        reconnectAttempts = 0;
        say(`Spojenie obnovené (${roomId}).`);
        setCall('obnovené');
        return;
      } catch (e) {
        if (/auth_failed/.test(e.message) || e.code === 4401) { say('Session expirovala alebo autorizácia bola odobratá.'); stoppedByUser = true; return; }
        if (/resume_expired|resume_not_available|room_not_found|forbidden|inspection_not_accepted|not_accepted/.test(e.message)) { say(`Obnovenie nie je možné: ${e.message}`); stoppedByUser = true; return; }
      }
    }
    if (!stoppedByUser) { say('Obnovenie zlyhalo po viacerých pokusoch.'); stoppedByUser = true; }
  } finally { reconnecting = false; }
}

document.querySelector('#connect').addEventListener('click', async () => {
  try {
    stoppedByUser = false; reconnectAttempts = 0;
    const room = document.querySelector('#room').value.trim();
    if (!room) { say('Zadaj token aj Room ID.'); return; }
    await ensureConnected();
    await joinOrResume(room);
  } catch (e) { say(`Chyba: ${e.message}`); }
});

document.querySelector('#micToggle').addEventListener('click', async () => { try { await publishMicToggle(); } catch (e) { say(`Mikrofón zlyhal: ${e.name}`); } });

document.querySelector('#stop').addEventListener('click', () => {
  stoppedByUser = true;
  try { if (audioProducer) audioProducer.close(); } catch {}
  try { if (rpc) rpc.close(); } catch {}
  if (micStream) { try { micStream.getTracks().forEach(t => t.stop()); } catch {} }
  resetMediaState(true);
  videoEl.srcObject = null; micStream = null; myMicOn = false;
  setConn('—'); setCall('neaktívny'); refreshMicState();
  document.querySelector('#stop').disabled = true;
  document.querySelector('#micToggle').disabled = true;
  say('Odpojené.');
});
