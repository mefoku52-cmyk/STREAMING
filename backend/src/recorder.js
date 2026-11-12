'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dgram = require('node:dgram');
const log = require('./logger');

const PLAIN_HEADER_EXTENSIONS = [
  'urn:ietf:params:rtp-hdrext:sdes:mid',
  'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
  'urn:ietf:params:rtp-hdrext:ssrc-audio-level',
];

function buildFfmpegRtpCaps(router, codecMime) {
  const kind = codecMime.split('/')[0];
  const codecs = router.rtpCapabilities.codecs.filter(c => c.mimeType === codecMime);
  if (codecs.length === 0) throw new Error(`codec_missing:${codecMime}`);
  const headerExtensions = (router.rtpCapabilities.headerExtensions || [])
    .filter(h => h.kind === kind && PLAIN_HEADER_EXTENSIONS.includes(h.uri));
  return { codecs, headerExtensions };
}

function buildSdp(entries) {
  const sdp = ['v=0', 'o=- 1001 2 IN IP4 127.0.0.1', 's=cmep-recorder', 't=0 0'];
  for (const e of entries) {
    const codec = e.consumer.rtpParameters.codecs[0];
    const name = codec.mimeType.split('/')[1];
    const pt = codec.payloadType;
    const clock = codec.clockRate;
    const ssrc = e.consumer.rtpParameters.encodings[0].ssrc;
    const params = Object.entries(codec.parameters || {}).filter(([k]) => k !== 'sprop-parameter-sets').map(([k, v]) => `${k}=${v}`).join(';');
    sdp.push(
      `m=${codec.mimeType.split('/')[0]} ${e.port} RTP/AVP ${pt}`,
      'c=IN IP4 127.0.0.1',
      'a=recvonly',
      `a=rtpmap:${pt} ${name}/${clock}${codec.channels ? '/' + codec.channels : ''}`,
      `a=ssrc:${ssrc} cname:cmep-recorder`,
      `a=rtcp:${e.rtcpPort} IN IP4 127.0.0.1`,
    );
    if (params) sdp.push(`a=fmtp:${pt} ${params}`);
  }
  return sdp.join('\r\n') + '\r\n';
}

function sendWakeup(mediaConfig) {
  const sock = dgram.createSocket('udp4');
  const pktV = Buffer.from([0x80, 0x62, 0x00, 0x01, 0, 0, 0, 0, 0x00, 0x4c, 0x4b, 0x40]);
  const pktA = Buffer.from([0x80, 0x61, 0x00, 0x01, 0, 0, 0, 0, 0x00, 0x4c, 0x4b, 0x40]);
  let n = 0;
  const iv = setInterval(() => {
    if (n++ >= 10) { clearInterval(iv); sock.close(); return; }
    try { sock.send(pktV, mediaConfig.recVideoFfPort, '127.0.0.1'); } catch {}
    try { sock.send(pktA, mediaConfig.recAudioFfPort, '127.0.0.1'); } catch {}
  }, 300);
}

async function createRecorder({ mediaConfig, processManager, recordingsDir }) {
  let counter = 0;
  async function start({ room, router }) {
    const videoProducer = [...room.producers.values()].find(m => m.kind === 'video');
    const audioProducer = [...room.producers.values()].find(m => m.kind === 'audio');
    if (!videoProducer && !audioProducer) throw new Error('nothing_to_record');
    const id = `rec-${Date.now().toString(36)}-${++counter}`;
    const entries = [];
    const transports = [];
    const consumers = [];
    const pliTimers = [];

    async function pipe(producerMeta, msRtpPort, msRtcpPort, ffRtpPort, ffRtcpPort, mime) {
      const transport = await router.createPlainTransport({
        listenIp: { ip: '127.0.0.1' }, listenRtpPort: msRtpPort, listenRtcpPort: msRtcpPort,
        rtcpMux: false, comedia: false,
      });
      transports.push(transport);
      await transport.connect({ ip: '127.0.0.1', port: ffRtpPort, rtcpPort: ffRtcpPort });
      const consumer = await transport.consume({
        producerId: producerMeta.producer.id,
        rtpCapabilities: buildFfmpegRtpCaps(router, mime),
        paused: true,
      });
      consumers.push(consumer);
      entries.push({ consumer, port: ffRtpPort, rtcpPort: ffRtcpPort });
      return consumer;
    }

    const vC = videoProducer
      ? await pipe(videoProducer, mediaConfig.recVideoMsPort, mediaConfig.recVideoMsRtcpPort, mediaConfig.recVideoFfPort, mediaConfig.recVideoFfRtcpPort, videoProducer.producer.rtpParameters.codecs[0].mimeType)
      : null;
    const aC = audioProducer
      ? await pipe(audioProducer, mediaConfig.recAudioMsPort, mediaConfig.recAudioMsRtcpPort, mediaConfig.recAudioFfPort, mediaConfig.recAudioFfRtcpPort, audioProducer.producer.rtpParameters.codecs[0].mimeType)
      : null;

    const outBase = path.join(recordingsDir, `${room.id}-${id}`);
    const outDirect = `${outBase}.flv`;
    let output = outDirect;
    if (mediaConfig.rtmpUrl) output = `[f=flv:onfail=ignore]${mediaConfig.rtmpUrl}|[f=flv]${outDirect}`;

    const sdpPath = `${outBase}.sdp`;
    fs.mkdirSync(recordingsDir, { recursive: true });
    fs.writeFileSync(sdpPath, buildSdp(entries.filter(e => e.consumer)));

    const args = [
      '-hide_banner', '-y', '-loglevel', 'info',
      '-analyzeduration', '10000000', '-probesize', '10000000',
      '-protocol_whitelist', 'file,udp,rtp',
      '-fflags', '+genpts+discardcorrupt', '-max_delay', '5000000', '-rtbufsize', '100M',
      '-i', sdpPath,
    ];
    if (vC && aC) args.push('-map', '0:v:0', '-map', '0:a:0');
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-pix_fmt', 'yuv420p',
      '-g', '60', '-r', '30', '-b:v', '2000k', '-flags', '+global_header', '-x264-params', 'repeat-headers=1',
      '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-f', 'flv', output);

    const child = processManager.spawn(mediaConfig.ffmpegPath, args);
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (d) => {
      for (const raw of d.split('\n')) {
        const s = raw.trim();
        if (s && !/^(frame|fps|size)=/.test(s)) log.debug('recorder-ffmpeg', { id, line: s.slice(0, 300) });
      }
    });
    log.info('recorder ffmpeg spawned', { id, pid: child.pid, out: outDirect });

    for (const c of consumers) { try { await c.resume(); } catch {} }
    if (vC) {
      let keyframes = 0;
      const askKey = async () => { try { await vC.requestKeyFrame(); keyframes += 1; } catch {} };
      await askKey();
      await new Promise(r => setTimeout(r, 4000));
      await askKey();
      const startedAt = Date.now();
      const pli = setInterval(() => {
        if (Date.now() - startedAt < 30000) askKey();
        else clearInterval(pli);
      }, 5000);
      pliTimers.push(pli);
    }

    let stopped = false;
    const stop = async (reason) => {
      if (stopped) return; stopped = true;
      for (const t of pliTimers) clearInterval(t);
      log.info('recorder stopping', { id, reason });
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGINT');
        await new Promise(r => setTimeout(r, 1200));
        if (child.exitCode === null && child.signalCode === null) sendWakeup(mediaConfig);
        await new Promise(r => setTimeout(r, 1000));
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }
      for (const c of consumers) { try { c.close(); } catch {} }
      for (const t of transports) { try { t.close(); } catch {} }
      try { fs.unlinkSync(sdpPath); } catch {}
    };
    child.once('exit', (code) => { stopped = true; log.info('recorder ffmpeg exit', { id, code }); });
    return { id, stop, outputFile: outDirect };
  }
  return { start };
}
module.exports = { createRecorder };
