'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(webRoot, urlPath, res) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { res.writeHead(400); res.end('{"error":"bad_path"}'); return; }
  if (decoded === '/') decoded = '/index.html';
  const filePath = path.resolve(webRoot, '.' + decoded);
  if (filePath !== webRoot && !filePath.startsWith(webRoot + path.sep)) { res.writeHead(403); res.end('{"error":"forbidden"}'); return; }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{"error":"not_found"}'); return; }
    const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
    fs.createReadStream(filePath).pipe(res);
  });
}

function notFound(res) {
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end('{"error":"not_found"}');
}

const HTTP_RATE_LIMIT = { limit: 300, windowMs: 5000 };
const httpRateState = new Map();
function httpRateAllowed(ip) {
  const now = Date.now();
  let st = httpRateState.get(ip);
  if (!st || now - st.start >= HTTP_RATE_LIMIT.windowMs) { st = { count: 0, start: now }; httpRateState.set(ip, st); }
  st.count += 1;
  return st.count <= HTTP_RATE_LIMIT.limit;
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' ws: wss:; media-src 'self' blob:; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
}

function createHttpServer({ host, port, health, webRoot, staticEnabled = true, internal = null }) {
  const server = http.createServer((req, res) => {
    setSecurityHeaders(res);
    const ip = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
    if (!httpRateAllowed(ip)) { res.writeHead(429, { 'content-type': 'application/json' }); res.end('{"error":"rate_limited"}'); return; }
    if ((req.method === 'GET' && req.url === '/healthz') || (req.method === 'GET' && req.url === '/health')) {
      const body = JSON.stringify(health());
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(body); return;
    }
    // Interne rozhranie platformy (CMEP) — POST /internal/*. Vrati true ak
    // poziadavku obsluzi (aj async). Vysledok je JSON.
    if (internal && req.method === 'POST' && req.url && req.url.startsWith('/internal/')) {
      const handle = () => {
        try {
          const r = internal(req, res);
          if (r && typeof r.then === 'function') {
            r.then((handled) => { if (!handled && !res.headersSent) notFound(res); }).catch(() => {
              if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
              res.end('{"error":"internal_error"}');
            });
            return;
          }
          if (!r && !res.headersSent) notFound(res);
        } catch (e) {
          if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
          res.end('{"error":"internal_error"}');
        }
      };
      handle(); return;
    }
    if (req.method === 'GET' && staticEnabled) { serveStatic(webRoot, req.url, res); return; }
    notFound(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => { server.removeListener('error', reject); resolve(server); });
  });
}
module.exports = { createHttpServer };
