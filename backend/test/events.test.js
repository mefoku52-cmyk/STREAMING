'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { emit, EVENT_TYPES } = require('../src/events');

test('required CMEP event types are whitelisted', () => {
  for (const t of [
    'inspection_requested', 'inspection_accepted', 'inspection_rejected',
    'inspection_started', 'participant_joined', 'participant_left',
    'connection_failed', 'inspection_ended',
  ]) assert.ok(EVENT_TYPES.has(t), t);
});

test('emit passes sanitized event to adapter', async () => {
  const seen = [];
  const adapter = { recordSessionEvent: async (e) => { seen.push(e); return { ok: true }; } };
  const out = await emit(adapter, { type: 'inspection_started', roomId: 'r1', offerId: 'o1', actorSub: 'u2', role: 'viewer' });
  assert.equal(seen.length, 1);
  assert.equal(out.type, 'inspection_started');
  assert.equal(out.roomId, 'r1');
});

test('unknown event type is rejected', async () => {
  const adapter = { recordSessionEvent: async () => { throw new Error('should not be called'); } };
  await assert.rejects(() => emit(adapter, { type: 'made_up_event' }));
});

test('adapter failure does not break the caller', async () => {
  const adapter = { recordSessionEvent: async () => { throw new Error('db down'); } };
  const out = await emit(adapter, { type: 'participant_joined', roomId: 'r' });
  assert.equal(out.type, 'participant_joined');
});
