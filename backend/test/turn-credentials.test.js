'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { issueTurnRestCredentials, buildIceServers, createTurnService } = require('../src/turn-credentials');

const SECRET = 'turn-test-secret-0123456789abcdef0123456789';

test('TURN REST: username format and HMAC-SHA1 base64 password', () => {
  const now = 1700000000000;
  const out = issueTurnRestCredentials({ userId: 'user-1', ttlSeconds: 600, secret: SECRET, now });
  assert.equal(out.expiresAt, Math.floor(now / 1000) + 600);
  assert.equal(out.username, `${out.expiresAt}:user-1`);
  const expected = crypto.createHmac('sha1', SECRET).update(out.username).digest('base64');
  assert.equal(out.credential, expected);
  assert.ok(!JSON.stringify(out).includes(SECRET));
});

test('TURN REST: invalid inputs rejected', () => {
  assert.throws(() => issueTurnRestCredentials({ userId: '', ttlSeconds: 60, secret: SECRET }), /turn_user_required/);
  assert.throws(() => issueTurnRestCredentials({ userId: 'u', ttlSeconds: 0, secret: SECRET }), /turn_ttl_invalid/);
  assert.throws(() => issueTurnRestCredentials({ userId: 'u', ttlSeconds: 60, secret: '' }), /turn_secret_required/);
});

test('buildIceServers: TURN urls + optional STUN', () => {
  const servers = buildIceServers({ urls: 'turn:1.2.3.4:3478?transport=udp,turn:1.2.3.4:3478?transport=tcp', username: 'u', credential: 'c', stunUrls: 'stun:1.2.3.4:3478' });
  assert.equal(servers.length, 2);
  assert.deepEqual(servers[0].urls, 'stun:1.2.3.4:3478');
  assert.equal(servers[1].username, 'u');
  assert.equal(servers[1].credential, 'c');
  assert.ok(Array.isArray(servers[1].urls));
});

test('createTurnService: disabled without secret/urls', () => {
  const s = createTurnService({ turnSecret: '', turnUrls: '' });
  assert.equal(s.isEnabled(), false);
});

test('createTurnService: issues credentials without exposing secret', () => {
  const s = createTurnService({ turnSecret: SECRET, turnUrls: 'turn:1.2.3.4:3478?transport=udp', turnStunUrls: '', turnCredentialTtlSeconds: 300 });
  assert.equal(s.isEnabled(), true);
  const out = s.issueForUser('user-1');
  assert.equal(out.ttlSeconds, 300);
  assert.ok(out.expiresAt > Math.floor(Date.now()/1000));
  assert.equal(out.iceServers[0].username, out.username);
  assert.ok(!JSON.stringify(out).includes(SECRET));
});
