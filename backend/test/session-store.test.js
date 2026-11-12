'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SessionStore } = require('../src/session-store');

test('create/get/remove lifecycle', () => {
  const store = new SessionStore();
  const room = store.create({ ownerId: 'u1', offerId: 'offer-9' });
  assert.equal(room.ownerId, 'u1');
  assert.equal(room.offerId, 'offer-9');
  assert.equal(room.state, 'pending');
  assert.equal(store.get(room.id).id, room.id);
  assert.equal(store.size(), 1);
  assert.equal(store.list().length, 1);
  assert.equal(store.remove(room.id), true);
  assert.equal(store.get(room.id), null);
  assert.equal(store.size(), 0);
});

test('unknown id returns null', () => {
  const store = new SessionStore();
  assert.equal(store.get('nope'), null);
});

test('rooms are isolated', () => {
  const store = new SessionStore();
  const a = store.create({ ownerId: 'u1', offerId: 'o1' });
  const b = store.create({ ownerId: 'u2', offerId: 'o2' });
  assert.notEqual(a.id, b.id);
  a.participants.set('u1', { sub: 'u1' });
  assert.equal(b.participants.size, 0);
  assert.equal(store.size(), 2);
});
