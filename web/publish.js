'use strict';
const stateEl = document.querySelector('#state');
const videoEl = document.querySelector('#local');
const camSel = document.querySelector('#camSel');
const micSel = document.querySelector('#micSel');
const say = (m) => { stateEl.textContent = m; };
let stream = null;
let wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':8504/ws';
let rpc = null, device = null, sendTransport = null, recvTransport = null, roomId = null, producers = [];
let currentToken = '';
let currentOfferId = '';
let reconnecting = false;
let reconnectAttempts = 0;
let stoppedByUser = true;
let joined = false;
let creating = false;
let acceptedViewer = null;
const MAX_RECONNECT_ATTEMPTS = 8;
const consumedProducerIds = new Set();
const knownConsumers = new Map();

const qp = new URLSearchParams(location.search);
if (qp.get('token')) document.querySelector('#token').value = qp.get('token');
if (qp.get('offer')) document.querySelector('#offer').value = qp.get('offer');

const connEl = document.querySelector('#connState');
const camStateEl = document.querySelector('#camState');
const micStateEl = document.querySelector('#micState');
const callStateEl = document.querySelector('#callState');
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
function refreshDeviceStates() {
  const vt = stream?.getVideoTracks?.()[0];
  const at = stream?.getAudioTracks?.()[0];
  if (camStateEl) camStateEl.textContent = vt ? (vt.enabled ? 'zapnutá' : 'vypnutá') : '—';
  if (micStateEl) micStateEl.textContent = at ? (at.enabled ? 'zapnutý' : 'vypnutý') : '—';
}

if (qp.get('auto') === '1' && qp.get('token') && qp.get('offer')) {
  const autoStart = () => { const btn = document.querySelector('#start'); if (!btn) return; btn.disabled = false; btn.click(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(autoStart, 300)); else setTimeout(autoStart, 300);
}

async function listDevices() {
  const devs = await navigator.mediaDevices.enumerateDevices();
  camSel.innerHTML = ''; micSel.innerHTML = '';
  for (const d of devs) {
    if (d.kind === 'videoinput') camSel.add(new Option(d.label || `Kamera ${camSel.length + 1}`, d.deviceId));
    if (d.kind === 'audioinput') micSel.add(new Option(d.label || `Mikrofón ${micSel.length + 1}`, d.deviceId));
  }
}
async function openStream() {
  if (stream && stream.getTracks().some(t => t.readyState === 'live')) return stream;
  const constraints = {
    audio: micSel.value ? { deviceId: { exact: micSel.value } } : true,
    video: { deviceId: camSel.value ? { exact: camSel.value } : true, width: { ideal: 640 }, height: { ideal: 480 } },
  };
  stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoEl.srcObject = stream;
  await listDevices();
  document.querySelector('#camToggle').textContent = 'Kamera: ON';
  document.querySelector('#micToggle').textContent = 'Mikrofón: ON';
  document.querySelector('#camToggle').disabled = false;
  document.querySelector('#micToggle').disabled = false;
  document.querySelector('#stopPreview').disabled = false;
  refreshDeviceStates();
  return stream;
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
async function consumeFrom(producerId, kind) {
  if (!rpc || !rpc.isOpen() || !device) return;
  if (consumedProducerIds.has(producerId)) return;
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
    knownConsumers.set(consumer.id, { producerId, kind });
    if (kind === 'video') videoEl.srcObject = new MediaStream([consumer.track]);
    else { const audioEl = document.querySelector('#remoteAudio'); audioEl.srcObject = new MediaStream([consumer.track]); }
    say(`Prijímaný ${kind} od kupujúceho.`);
  } catch (e) {
    consumedProducerIds.delete(producerId);
    if (!reconnecting) say(`Chyba príjmu ${kind}: ${e.message}`);
  }
}

function resetMediaState(full) {
  try { if (sendTransport) sendTransport.close(); } catch {}
  try { if (recvTransport) recvTransport.close(); } catch {}
  sendTransport = null; recvTransport = null; device = null; producers = [];
  consumedProducerIds.clear(); knownConsumers.clear();
  if (full) { roomId = null; joined = false; acceptedViewer = null; }
}

async function setupTransportsAndProduce(existingProducers = []) {
  if (!rpc || !rpc.isOpen()) throw new Error('not_connected');
  if (!device) {
    const caps = await rpc.request('getRouterRtpCapabilities');
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: caps });
  }
  const sendParams = await rpc.request('createWebRtcTransport', { roomId, direction: 'send' });
  sendTransport = device.createSendTransport({ ...sendParams, iceServers: sendParams.iceServers || [] });
  wireTransport(sendTransport, 'send');
  wireConnectionState(sendTransport, 'send');
  await openStream();
  producers = [];
  const audioTrack = stream.getAudioTracks()[0];
  const videoTrack = stream.getVideoTracks()[0];
  if (audioTrack) producers.push(await sendTransport.produce({ track: audioTrack }));
  if (videoTrack) producers.push(await sendTransport.produce({ track: videoTrack }));
  for (const p of existingProducers || []) await consumeFrom(p.producerId, p.kind);
}

async function ensureConnected() {
  if (rpc && rpc.isOpen()) return;
  currentToken = document.querySelector('#token').value.trim();
  currentOfferId = document.querySelector('#offer').value.trim();
  if (!currentToken) throw new Error('Chýba token.');
  rpc = new CmepRpcClient(`${wsUrl}?token=${encodeURIComponent(currentToken)}`);
  rpc.onEvent = async (event, data) => {
    if (event === 'inspectionRequested') {
      say(`Kupujúci žiada obhliadku (${data.from}). Schváliť tlačidlom Accept.`);
      setCall('kupujúci žiada o hovor');
      const acceptBtn = document.querySelector('#accept');
      if (acceptBtn) { acceptBtn.disabled = false; acceptBtn.dataset.viewer = data.from || ''; }
    }
    if (event === 'peerJoined' || event === 'peerRejoined') setCall('kupujúci pripojený');
    if (event === 'peerDisconnected') setCall('kupujúci sa prepája…');
    if (event === 'newProducer') await consumeFrom(data.producerId, data.kind);
    if (event === 'roomClosed') { stoppedByUser = true; setCall('ukončený'); say('Obhliadka ukončená serverom.'); }
    if (event === 'peerLeft') { setCall('kupujúci sa odpojil'); videoEl.srcObject = null; say('Kupujúci sa odpojil.'); }
  };
  rpc.onClose = ({ code, manual, error }) => {
    if (manual || stoppedByUser) return;
    if (code === 4401) { say('Session expirovala alebo bola odobratá autorizácia. Obnovte prihlásenie.'); stoppedByUser = true; return; }
    scheduleReconnect(error || new Error('connection_closed'));
  };
  await rpc.connect();
}

async function tryResumeOrJoin() {
  if (!roomId) {
    const room = await rpc.request('createRoom', { offerId: currentOfferId });
    if (room.shouldResume) {
      const resumed = await rpc.request('resumeSession', { roomId: room.roomId });
      roomId = resumed.roomId; joined = true;
      await setupTransportsAndProduce(resumed.producers || []);
      return;
    }
    roomId = room.roomId; joined = true;
    await setupTransportsAndProduce([]);
    return;
  }
  try {
    const resumed = await rpc.request('resumeSession', { roomId });
    roomId = resumed.roomId; joined = true;
    await setupTransportsAndProduce(resumed.producers || []);
  } catch (e) {
    if (/resume_not_available|resume_expired|room_not_found|forbidden|invalid_state/.test(e.message)) {
      throw e;
    }
    throw e;
  }
}

async function scheduleReconnect(err) {
  if (reconnecting || stoppedByUser) return;
  reconnecting = true;
  try {
    // transports cannot survive WS loss; recreate after resume
    resetMediaState(false);
    while (!stoppedByUser && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts += 1;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
      say(`Výpadok spojenia. Pokus o obnovenie ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} o ${Math.round(delay/1000)}s…`);
      await new Promise(r => setTimeout(r, delay));
      if (stoppedByUser) return;
      try {
        // revalidate token/session by reconnecting (server closes 4401 if invalid)
        if (rpc) try { rpc.close(); } catch {}
        rpc = null;
        await ensureConnected();
        await tryResumeOrJoin();
        reconnectAttempts = 0;
        say(`Obhliadka ${roomId} obnovená.`);
        setCall('obnovené');
        return;
      } catch (e) {
        if (/auth_failed/.test(e.message) || (e.code === 4401)) { say('Session expirovala alebo autorizácia bola odobratá.'); stoppedByUser = true; return; }
        if (/resume_expired|resume_not_available|room_not_found|forbidden/.test(e.message)) { say(`Obnovenie nie je možné: ${e.message}`); stoppedByUser = true; return; }
        // else retry
      }
    }
    if (!stoppedByUser) { say('Obnovenie zlyhalo po viacerých pokusoch.'); stoppedByUser = true; }
  } finally {
    reconnecting = false;
  }
}

document.querySelector('#preview').addEventListener('click', async () => {
  try { say('Žiadam kameru a mikrofón…'); await openStream(); say('Náhľad aktívny. Vyplň token + Offer ID a vytvor obhliadku.'); document.querySelector('#start').disabled = false; }
  catch (e) { say(`Prístup zamietnutý: ${e.name}`); }
});
document.querySelector('#stopPreview').addEventListener('click', () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null; videoEl.srcObject = null;
  document.querySelector('#stopPreview').disabled = true;
  document.querySelector('#camToggle').disabled = true;
  document.querySelector('#micToggle').disabled = true;
  say('Náhľad zastavený.');
});
document.querySelector('#camToggle').addEventListener('click', (e) => { const t = stream?.getVideoTracks()[0]; if (!t) return; t.enabled = !t.enabled; e.target.textContent = t.enabled ? 'Kamera: ON' : 'Kamera: OFF'; refreshDeviceStates(); });
document.querySelector('#micToggle').addEventListener('click', (e) => { const t = stream?.getAudioTracks()[0]; if (!t) return; t.enabled = !t.enabled; e.target.textContent = t.enabled ? 'Mikrofón: ON' : 'Mikrofón: OFF'; refreshDeviceStates(); });

document.querySelector('#start').addEventListener('click', async () => {
  try {
    stoppedByUser = false; reconnectAttempts = 0; creating = true;
    currentToken = document.querySelector('#token').value.trim();
    currentOfferId = document.querySelector('#offer').value.trim();
    if (!currentToken || !currentOfferId) { say('Zadaj token aj Offer ID.'); return; }
    await openStream();
    say('Pripájam WS…');
    await ensureConnected();
    say('Vytváram/obnovujem obhliadku…');
    await tryResumeOrJoin();
    document.querySelector('#stop').disabled = false;
    document.querySelector('#start').disabled = true;
    say(`Obhliadka ${roomId} aktívna. Čakám na žiadosť kupujúceho.`);
  } catch (e) { say(`Chyba: ${e.message}`); }
  finally { creating = false; }
});

document.querySelector('#accept').addEventListener('click', async (e) => {
  try {
    const viewer = e.target.dataset.viewer || '';
    if (!viewer) { say('Nie je čo schváliť — čakám na žiadosť kupujúceho.'); return; }
    await rpc.request('acceptInspection', { roomId, viewer });
    acceptedViewer = viewer;
    e.target.disabled = true;
    say(`Obhliadka schválená pre ${viewer}.`);
  } catch (err) { say(`Chyba: ${err.message}`); }
});

document.querySelector('#stop').addEventListener('click', async () => {
  stoppedByUser = true;
  try {
    if (roomId && rpc && rpc.isOpen()) { try { await rpc.request('close', { scope: 'room' }); } catch {} }
    if (rpc) rpc.close();
  } finally {
    producers.forEach(p => { try { p.close(); } catch {} }); producers = [];
    resetMediaState(true);
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; videoEl.srcObject = null;
    setConn('—'); setCall('neaktívny'); refreshDeviceStates();
    document.querySelector('#stop').disabled = true;
    document.querySelector('#start').disabled = false;
    say('Ukončené.');
  }
});

const __startStreamBtn = document.querySelector('#startStream');
if (__startStreamBtn) __startStreamBtn.addEventListener('click', () => { const b = document.querySelector('#start'); if (b) b.click(); });
