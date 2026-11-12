'use strict';
const stateEl = document.querySelector('#state');
const videoEl = document.querySelector('#remote');
const say = (m) => { stateEl.textContent = m; };
let wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':8504/ws';
let rpc = null, device = null, sendTransport = null, recvTransport = null, roomId = null;
let micStream = null, audioProducer = null, myMicOn = false;

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
function wireConnectionState(transport) {
  if (!transport || typeof transport.on !== 'function') return;
  const update = () => setConn(transport.connectionState || 'new');
  transport.on('connectionstatechange', update);
  update();
}
function refreshMicState() {
  if (micStateEl) micStateEl.textContent = myMicOn ? 'zapnutý' : 'vypnutý';
}
function maybeShowAudioButton() {
  const btn = document.querySelector('#enableAudio');
  if (!btn || !remoteAudioEl) return;
  btn.hidden = !(remoteAudioEl.paused && remoteAudioEl.srcObject);
}
if (remoteAudioEl) {
  remoteAudioEl.addEventListener('play', maybeShowAudioButton);
  remoteAudioEl.addEventListener('pause', maybeShowAudioButton);
}
document.querySelector('#enableAudio').addEventListener('click', async (e) => {
  e.target.hidden = true;
  try { await remoteAudioEl.play(); } catch (err) { say(`Zvuk: ${err.name}`); }
});
// Auto-join: CMEP platforma otvára viewer stránku s tokenom + Room ID (auto=1).
// Bez auto parametra (dev režim) zostáva ručné zadávanie funkčné.
if (qp.get('auto') === '1' && qp.get('token') && qp.get('room')) {
  setTimeout(() => document.querySelector('#connect').click(), 400);
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

async function consumeProducer(p) {
  if (!recvTransport) {
    const params = await rpc.request('createWebRtcTransport', { roomId, direction: 'recv' });
    recvTransport = device.createRecvTransport(params);
    wireTransport(recvTransport, 'recv');
    wireConnectionState(recvTransport);
  }
  const data = await rpc.request('consume', { producerId: p.producerId, rtpCapabilities: device.rtpCapabilities });
  const consumer = await recvTransport.consume({
    id: data.consumerId, producerId: data.producerId, kind: data.kind, rtpParameters: data.rtpParameters,
  });
  await rpc.request('resumeConsumer', { consumerId: consumer.id });
  if (data.kind === 'video') { videoEl.srcObject = new MediaStream([consumer.track]); if (camStateEl) camStateEl.textContent = 'prijímaná'; }
  else { remoteAudioEl.srcObject = new MediaStream([consumer.track]); maybeShowAudioButton(); }
  say(`Prijímaný ${data.kind} z obhliadky.`);
}

async function publishMic() {
  if (!micStream) {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!sendTransport) {
      const params = await rpc.request('createWebRtcTransport', { roomId, direction: 'send' });
      sendTransport = device.createSendTransport(params);
      wireTransport(sendTransport, 'send');
    }
    audioProducer = await sendTransport.produce({ track: micStream.getAudioTracks()[0] });
    myMicOn = true;
  } else if (audioProducer) {
    myMicOn = !myMicOn;
    myMicOn ? audioProducer.resume() : audioProducer.pause();
  }
  document.querySelector('#micToggle').textContent = myMicOn ? 'Mikrofón: ON' : 'Mikrofón: OFF';
  refreshMicState();
}

document.querySelector('#connect').addEventListener('click', async () => {
  try {
    const token = document.querySelector('#token').value.trim();
    const room = document.querySelector('#room').value.trim();
    if (!token || !room) { say('Zadaj token aj Room ID.'); return; }
    if (!rpc || !rpc.ws || rpc.ws.readyState !== 1) {
      try { if (rpc) rpc.close(); } catch {}
      say('Pripájam WS…');
      rpc = new CmepRpcClient(`${wsUrl}?token=${encodeURIComponent(token)}`);
      await rpc.connect();
      rpc.onEvent = async (event, data) => {
        if (event === 'inspectionAccepted') { setCall('predávajúci schválil — pripájam sa'); say('Predávajúci schválil obhliadku — pripájam sa…'); try { await joinRoom(room); } catch (e) { say(`Chyba: ${e.message}`); } }
        if (event === 'inspectionRejected') { setCall('zamietnuté'); say('Predávajúci zamietol obhliadku.'); }
        if (event === 'newProducer') await consumeProducer(data);
        if (event === 'roomClosed') { setCall('ukončený'); say('Obhliadka bola ukončená predávajúcim.'); document.querySelector('#stop').click(); }
        if (event === 'peerLeft') { setCall('predávajúci sa odpojil'); videoEl.srcObject = null; say('Predávajúci sa odpojil.'); }
      };
    }
    try {
      await joinRoom(room);
    } catch (e) {
      if (/not_accepted/.test(e.message) || e.message === 'forbidden') {
        say('Žiadam o obhliadku… (čakám na schválenie predávajúcim)');
        await rpc.request('requestInspection', { roomId: room });
      } else throw e;
    }
  } catch (e) { say(`Chyba: ${e.message}`); }
});

async function joinRoom(room) {
  say('Pripájam sa k obhliadke…');
  const joined = await rpc.request('joinRoom', { roomId: room });
  roomId = joined.roomId;
  say('Načítavam router capabilities…');
  const caps = await rpc.request('getRouterRtpCapabilities');
  device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities: caps });
  for (const p of joined.producers || []) await consumeProducer(p);
  document.querySelector('#stop').disabled = false;
  document.querySelector('#micToggle').disabled = false;
  setCall('v hovore');
  say(`V obhliadke ${roomId} (state: ${joined.state}). Aktivuj mikrofón pre obojstranný zvuk.`);
}

document.querySelector('#micToggle').addEventListener('click', async () => {
  try { await publishMic(); } catch (e) { say(`Mikrofón zlyhal: ${e.name}`); }
});

document.querySelector('#stop').addEventListener('click', () => {
  try { if (audioProducer) audioProducer.close(); } catch {}
  try { if (rpc) rpc.close(); } catch {}
  videoEl.srcObject = null; micStream = null; audioProducer = null;
  sendTransport = null; recvTransport = null; device = null; roomId = null;
  setConn('—'); setCall('neaktívny'); refreshMicState();
  document.querySelector('#stop').disabled = true;
  document.querySelector('#micToggle').disabled = true;
  say('Odpojené.');
});
