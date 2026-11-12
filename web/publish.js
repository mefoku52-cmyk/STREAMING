'use strict';
const stateEl = document.querySelector('#state');
const videoEl = document.querySelector('#local');
const camSel = document.querySelector('#camSel');
const micSel = document.querySelector('#micSel');
const say = (m) => { stateEl.textContent = m; };
let stream = null;
let wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':8504/ws';
let rpc = null, device = null, sendTransport = null, recvTransport = null, roomId = null, producers = [];

// CMEP platforma otvára túto stránku s tokenom + Offer/Inspection ID v URL
// (žiadne ručné kopírovanie). Ručné zadávanie zostáva funkčné pre dev režim.
const qp = new URLSearchParams(location.search);
if (qp.get('token')) document.querySelector('#token').value = qp.get('token');
if (qp.get('offer')) document.querySelector('#offer').value = qp.get('offer');

const connEl = document.querySelector('#connState');
const camStateEl = document.querySelector('#camState');
const micStateEl = document.querySelector('#micState');
const callStateEl = document.querySelector('#callState');
const setConn = (state) => { if (connEl) { connEl.textContent = state; connEl.dataset.state = state; } };
const setCall = (state) => { if (callStateEl) callStateEl.textContent = state; };
function wireConnectionState(transport) {
  if (!transport || typeof transport.on !== 'function') return;
  const update = () => setConn(transport.connectionState || 'new');
  transport.on('connectionstatechange', update);
  update();
}
function refreshDeviceStates() {
  const vt = stream?.getVideoTracks?.()[0];
  const at = stream?.getAudioTracks?.()[0];
  if (camStateEl) camStateEl.textContent = vt ? (vt.enabled ? 'zapnutá' : 'vypnutá') : '—';
  if (micStateEl) micStateEl.textContent = at ? (at.enabled ? 'zapnutý' : 'vypnutý') : '—';
}

// Auto-start: CMEP platforma otvára publisher stránku s tokenom + Offer ID
// (auto=1) — kamera, mikrofón a miestnosť sa spustia sami, bez ručného zadávania.
if (qp.get('auto') === '1' && qp.get('token') && qp.get('offer')) {
  const autoStart = () => {
    const btn = document.querySelector('#start');
    if (!btn) return;
    btn.disabled = false;
    btn.click();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(autoStart, 300));
  else setTimeout(autoStart, 300);
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
}

function wireTransport(t, direction) {
  t.on('connect', ({ dtlsParameters }, callback, errback) => {
    rpc.request('connectTransport', { transportId: t.id, dtlsParameters }).then(callback).catch(errback);
  });
  if (direction === 'send') {
    t.on('produce', ({ kind, rtpParameters }, callback, errback) => {
      rpc.request('produce', { transportId: t.id, kind, rtpParameters }).then(r => callback({ id: r.producerId })).catch(errback);
    });
  }
}

async function consumeFrom(producerId, kind) {
  if (!recvTransport) {
    const params = await rpc.request('createWebRtcTransport', { roomId, direction: 'recv' });
    recvTransport = device.createRecvTransport(params);
    wireTransport(recvTransport, 'recv');
  }
  const data = await rpc.request('consume', { producerId, rtpCapabilities: device.rtpCapabilities });
  const consumer = await recvTransport.consume({
    id: data.consumerId, producerId: data.producerId, kind: data.kind, rtpParameters: data.rtpParameters,
  });
  await rpc.request('resumeConsumer', { consumerId: consumer.id });
  if (kind === 'video') {
    videoEl.srcObject = new MediaStream([consumer.track]);
  } else {
    const audioEl = document.querySelector('#remoteAudio');
    audioEl.srcObject = new MediaStream([consumer.track]);
  }
  say(`Prijímaný ${kind} od kupujúceho.`);
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
document.querySelector('#camToggle').addEventListener('click', (e) => {
  const t = stream?.getVideoTracks()[0]; if (!t) return;
  t.enabled = !t.enabled; e.target.textContent = t.enabled ? 'Kamera: ON' : 'Kamera: OFF';
  refreshDeviceStates();
});
document.querySelector('#micToggle').addEventListener('click', (e) => {
  const t = stream?.getAudioTracks()[0]; if (!t) return;
  t.enabled = !t.enabled; e.target.textContent = t.enabled ? 'Mikrofón: ON' : 'Mikrofón: OFF';
  refreshDeviceStates();
});

document.querySelector('#start').addEventListener('click', async () => {
  try {
    const token = document.querySelector('#token').value.trim();
    const offerId = document.querySelector('#offer').value.trim();
    if (!token || !offerId) { say('Zadaj token aj Offer ID.'); return; }
    if (!stream) await openStream();
    say('Pripájam WS…');
    rpc = new CmepRpcClient(`${wsUrl}?token=${encodeURIComponent(token)}`);
    await rpc.connect();
    rpc.onEvent = async (event, data) => {
      if (event === 'inspectionRequested') {
        say(`Kupujúci žiada obhliadku (${data.from}). Schváliť tlačidlom Accept.`);
        setCall('kupujúci žiada o hovor');
        const acceptBtn = document.querySelector('#accept');
        if (acceptBtn) { acceptBtn.disabled = false; acceptBtn.dataset.viewer = data.from || ''; }
      }
      if (event === 'peerJoined') setCall('kupujúci pripojený');
      if (event === 'newProducer') await consumeFrom(data.producerId, data.kind);
      if (event === 'roomClosed') { setCall('ukončený'); say('Obhliadka ukončená serverom.'); }
      if (event === 'peerLeft') { setCall('kupujúci sa odpojil'); videoEl.srcObject = null; say('Kupujúci sa odpojil.'); }
    };
    say('Vytváram obhliadku…');
    const room = await rpc.request('createRoom', { offerId });
    roomId = room.roomId;
    say('Načítavam router capabilities…');
    const caps = await rpc.request('getRouterRtpCapabilities');
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: caps });
    const params = await rpc.request('createWebRtcTransport', { roomId, direction: 'send' });
    sendTransport = device.createSendTransport(params);
    wireTransport(sendTransport, 'send');
    wireConnectionState(sendTransport);
    setCall('čaká sa na kupujúceho');
    say('Publikujem audio+video…');
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    if (audioTrack) producers.push(await sendTransport.produce({ track: audioTrack }));
    if (videoTrack) producers.push(await sendTransport.produce({ track: videoTrack }));
    document.querySelector('#stop').disabled = false;
    document.querySelector('#start').disabled = true;
    say(`Obhliadka ${roomId} aktívna (state: ${room.state}). Čakám na žiadosť kupujúceho.`);
  } catch (e) { say(`Chyba: ${e.message}`); }
});

// Schválenie žiadosti viewera (acceptInspection) — security gate, ostáva manuálny
// klik publishera; Viewer sub prichádza z push eventu (server-side identita).
document.querySelector('#accept').addEventListener('click', async (e) => {
  try {
    const viewer = e.target.dataset.viewer || '';
    if (!viewer) { say('Nie je čo schváliť — čakám na žiadosť kupujúceho.'); return; }
    await rpc.request('acceptInspection', { roomId, viewer });
    e.target.disabled = true;
    say(`Obhliadka schválená pre ${viewer}.`);
  } catch (err) { say(`Chyba: ${err.message}`); }
});

document.querySelector('#stop').addEventListener('click', async () => {
  try {
    if (roomId) { try { await rpc.request('close', { scope: 'room' }); } catch {} }
    if (rpc) rpc.close();
  } finally {
    producers.forEach(p => { try { p.close(); } catch {} }); producers = [];
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; videoEl.srcObject = null; sendTransport = null; recvTransport = null; device = null; roomId = null;
    setConn('—'); setCall('neaktívny'); refreshDeviceStates();
    document.querySelector('#stop').disabled = true;
    say('Ukončené.');
  }
});
