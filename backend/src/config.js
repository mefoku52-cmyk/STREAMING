'use strict';
const path = require('node:path');
function port(name, fallback) {
  const raw = process.env[name] ?? String(fallback);
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) throw new Error(`${name} must be a TCP/UDP port`);
  return n;
}
function positiveInt(name, fallback) {
  const raw = process.env[name] ?? String(fallback);
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new Error(`${name} must be a positive integer`);
  return n;
}
function loadConfig() {
  const secret = process.env.SESSION_SIGNING_SECRET || '';
  if (process.env.NODE_ENV === 'production' && (secret.length < 32 || secret.includes('REPLACE_'))) {
    throw new Error('SESSION_SIGNING_SECRET must be a unique secret of at least 32 characters in production');
  }
  if (!secret && process.env.NODE_ENV !== 'production') {
    process.stderr.write('WARNING: SESSION_SIGNING_SECRET not set; all WS connections will be rejected until tokens are minted with a configured secret.\n');
  }
  const adapterMode = process.env.CMEP_ADAPTER === 'http' ? 'http' : 'local';
  const rootDir = path.resolve(__dirname, '..', '..');
  return Object.freeze({
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'cmep-streaming',
    host: process.env.SIGNALING_HOST || '127.0.0.1',
    port: port('SIGNALING_PORT', 8504),
    webHost: process.env.WEB_HOST || '127.0.0.1',
    webPort: port('WEB_PORT', 8502),
    logLevel: process.env.LOG_LEVEL || 'info',
    sessionSecret: secret,
    webRoot: path.join(rootDir, 'web'),
    runtimeDir: process.env.RUNTIME_DIR ? path.resolve(process.env.RUNTIME_DIR) : path.join(rootDir, 'runtime'),
    recordingsDir: process.env.RECORDINGS_DIR ? path.resolve(process.env.RECORDINGS_DIR) : path.join(rootDir, 'recordings'),
    maxRooms: positiveInt('MAX_ROOMS', 10),
    rateLimitRequests: positiveInt('RATE_LIMIT_REQUESTS', 30),
    rateLimitWindowMs: positiveInt('RATE_LIMIT_WINDOW_MS', 5000),
    adapterMode,
    // CMEP http-adapter konfigurácia (číta ju adapter; tu len z dokumentačných dôvodov)
    cmepPlatformUrl: process.env.CMEP_PLATFORM_URL || '',
    cmepInternalKey: process.env.CMEP_INTERNAL_API_KEY || '',
    staticEnabled: process.env.ENABLE_STATIC_SERVE !== '0',
  });
}
module.exports = { loadConfig };
