'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHttpServer } = require('../src/http');
const WebSocket = require('ws');

test('health remains live while readiness fails closed until media is ready', async (t) => {
  let ready = false;
  const server = await createHttpServer({
    host: '127.0.0.1',
    port: 0,
    health: () => ({ ok: true, ready, status: ready ? 'ready' : 'starting' }),
    staticEnabled: false,
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  const live = await fetch(`${base}/healthz`);
  assert.equal(live.status, 200);
  assert.deepEqual(await live.json(), { ok: true, ready: false, status: 'starting' });

  const notReady = await fetch(`${base}/readyz`);
  assert.equal(notReady.status, 503);
  assert.deepEqual(await notReady.json(), { ok: true, ready: false, status: 'starting' });

  // Before signaling attaches the HTTP upgrade handler, a premature /ws
  // handshake falls through to the regular HTTP route and receives 404.
  const prematureStatus = await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    ws.once('unexpected-response', (request, response) => { response.resume(); resolve(response.statusCode); });
    ws.once('error', reject);
  });
  assert.equal(prematureStatus, 404);

  ready = true;
  const readyResponse = await fetch(`${base}/readyz`);
  assert.equal(readyResponse.status, 200);
  assert.deepEqual(await readyResponse.json(), { ok: true, ready: true, status: 'ready' });
});
