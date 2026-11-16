'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig } = require('./config');
const { createHttpServer } = require('./http');
const log = require('./logger');
const { createSignaling } = require('./signaling');
const { createAdapter } = require('./adapter/cmep-adapter');
const { loadMediaConfig } = require('./media-config');
const { ProcessManager } = require('./process-manager');
const { createRecorder } = require('./recorder');
const { emit } = require('./events');
const mediasoup = require('mediasoup');
const { verifyLocalSessionToken } = require('./auth');
const { createTurnService } = require('./turn-credentials');

const MEDIA_CODECS = [
  { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2, preferredPayloadType: 97 },
  {
    kind: 'video', mimeType: 'video/H264', clockRate: 90000,
    parameters: { 'level-asymmetry-allowed': 1, 'packetization-mode': 1, 'profile-level-id': '42e01f' },
    rtcpFeedback: [{ type: 'nack' }, { type: 'nack pli' }, { type: 'ccm fir' }],
    preferredPayloadType: 96,
  },
  { kind: 'video', mimeType: 'video/VP8', clockRate: 90000, rtcpFeedback: [{ type: 'nack' }, { type: 'nack pli' }, { type: 'ccm fir' }], preferredPayloadType: 98 },
];

function acquireRuntimeLock(runtimeDir) {
  fs.mkdirSync(runtimeDir, { recursive: true });
  const lockPath = path.join(runtimeDir, 'server.lock');
  if (fs.existsSync(lockPath)) {
    const raw = fs.readFileSync(lockPath, 'utf8').trim();
    const pid = Number(raw.split('\n')[0]);
    let live = false;
    try {
      const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
      live = cmd.includes('index.js');
    } catch { live = false; }
    if (live && pid !== process.pid) {
      throw new Error(`duplicate_start: server already running with pid ${pid} (lock ${lockPath})`);
    }
    log.warn('stale lock removed', { pid, lockPath });
    fs.unlinkSync(lockPath);
  }
  const fd = fs.openSync(lockPath, 'wx');
  fs.writeFileSync(fd, `${process.pid}\n${new Date().toISOString()}\n`);
  fs.closeSync(fd);
  return () => { try { fs.unlinkSync(lockPath); } catch {} };
}

function internalRequestHandler(req, res, getSignaling, config) {
  const expected = config.cmepInternalKey;
  const provided = req.headers['x-cmep-internal-key'];
  if (!expected || !provided || provided !== expected) {
    res.writeHead(403, { 'content-type': 'application/json' });
    res.end('{"error":"forbidden"}');
    return true;
  }
  const m = /^\/internal\/inspections\/([^/]+)\/end$/.exec(req.url || '');
  if (!m) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end('{"error":"not_found"}');
    return true;
  }
  // Startup okno: signaling este nemusi existovat (createSignaling je async).
  // Fail-closed: 503 namiesto pádu procesu.
  let signaling = null;
  try { signaling = getSignaling(); } catch { signaling = null; }
  if (!signaling) {
    res.writeHead(503, { 'content-type': 'application/json' });
    res.end('{"error":"not_ready"}');
    return true;
  }
  const result = signaling.endInspection(decodeURIComponent(m[1]));
  res.writeHead(result.ok ? 200 : 404, { 'content-type': 'application/json' });
  res.end(JSON.stringify(result));
  return true;
}

async function main() {
  const config = loadConfig();
  const media = loadMediaConfig();
  const adapter = createAdapter(config.adapterMode);
  const processManager = new ProcessManager();
  const releaseLock = acquireRuntimeLock(config.runtimeDir);
  const startedAt = Date.now();
  let signaling = null;

  const recorder = media.recorderEnabled
    ? await createRecorder({ mediaConfig: media, processManager, recordingsDir: config.recordingsDir })
    : null;

  const server = await createHttpServer({
    host: config.host, port: config.port, webRoot: config.webRoot, staticEnabled: config.staticEnabled,
    // Startup okno: HTTP server pocúva predtym, ako je vytvoreny mediasoup worker
    // (createSignaling je async). Bez poistky by prvý readiness/liveness probe
    // na /healthz skoncil TDZ ReferenceError -> uncaughtException -> proces umrie.
    // Dopad: tvar payloadu je nezmeneny; len do inicializacie signaling je media
    // placeholder (rooms/peers = 0, workerAlive = false).
    health: () => {
      let media = { rooms: 0, peers: 0, workerAlive: false };
      let ready = false;
      try { media = signaling.status(); ready = Boolean(media && media.workerAlive); } catch { ready = false; }
      return { ok: true, ready, service: config.appName, status: ready ? 'running' : 'starting', nodeEnv: config.nodeEnv, uptimeS: Math.floor((Date.now() - startedAt) / 1000), media };
    },
    // Interne platformove rozhranie (X-CMEP-Internal-Key, fail-closed).
    internal: (req, res) => internalRequestHandler(req, res, () => signaling, config),
  });

  const turnService = createTurnService(config);
  signaling = await createSignaling({
    server,
    mediasoup,
    mediaCodecs: MEDIA_CODECS,
    adapter,
    listenIps: media.listenIps,
    events: { emit },
    recorder,
    turnService,
    authenticate: async (token) => {
      const claims = verifyLocalSessionToken(token, config.sessionSecret);
      if (!claims) throw new Error('unauthorized');
      return adapter.authenticate(claims);
    },
  });

  log.info('cmep-streaming started', {
    host: config.host, port: config.port, nodeEnv: config.nodeEnv,
    adapter: config.adapterMode, recorder: media.recorderEnabled, pid: process.pid,
  });

  let closing = false;
  const close = async (exitCode) => {
    if (closing) return; closing = true;
    try { await signaling.close(); } catch (e) { log.error('signaling close failed', { error: e.message }); }
    try { await processManager.closeAll(); } catch {}
    server.close(() => { releaseLock(); process.exit(exitCode); });
    setTimeout(() => { releaseLock(); process.exit(exitCode); }, 5000).unref();
  };
  process.on('SIGINT', () => close(0));
  process.on('SIGTERM', () => close(0));
  process.on('unhandledRejection', (r) => { log.error('unhandledRejection', { error: r && r.message ? r.message : String(r) }); });
  process.on('uncaughtException', (e) => { log.error('uncaughtException', { error: e && e.message ? e.message : String(e) }); close(1); });
}

main().catch(err => { log.error('Startup failed', { error: err.message }); process.exit(1); });
