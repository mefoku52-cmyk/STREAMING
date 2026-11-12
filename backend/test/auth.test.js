'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { issueLocalSessionToken, verifyLocalSessionToken } = require('../src/auth');

const SECRET = 'unit-test-secret-0123456789abcdef0123456789abcdef';

test('issued token verifies and carries claims', () => {
  const t = issueLocalSessionToken({ sub: 'user-1', companyId: 'co-1', ttlSeconds: 60, secret: SECRET });
  const claims = verifyLocalSessionToken(t, SECRET);
  assert.ok(claims);
  assert.equal(claims.sub, 'user-1');
  assert.equal(claims.companyId, 'co-1');
  assert.ok(claims.exp > claims.iat);
});

test('expired token is rejected', () => {
  const past = Date.now() - 120000;
  const t = issueLocalSessionToken({ sub: 'user-1', ttlSeconds: 60, secret: SECRET, now: past });
  assert.equal(verifyLocalSessionToken(t, SECRET), null);
});

test('token signed with different secret is rejected', () => {
  const t = issueLocalSessionToken({ sub: 'user-1', ttlSeconds: 60, secret: SECRET });
  assert.equal(verifyLocalSessionToken(t, 'another-secret'), null);
});

test('tampered payload is rejected', () => {
  const t = issueLocalSessionToken({ sub: 'user-1', ttlSeconds: 60, secret: SECRET });
  const [payload, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'attacker', exp: 9999999999 })).toString('base64url');
  assert.equal(verifyLocalSessionToken(`${forged}.${sig}`, SECRET), null);
});

test('malformed inputs are rejected', () => {
  assert.equal(verifyLocalSessionToken('', SECRET), null);
  assert.equal(verifyLocalSessionToken('abc', SECRET), null);
  assert.equal(verifyLocalSessionToken('a.b.c', SECRET), null);
  assert.equal(verifyLocalSessionToken(null, SECRET), null);
  assert.equal(verifyLocalSessionToken('x.y', ''), null);
});

test('missing sub is rejected at issuance', () => {
  assert.throws(() => issueLocalSessionToken({ ttlSeconds: 60, secret: SECRET }));
});
