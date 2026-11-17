'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { STATES, canTransition, transition } = require('../src/stream-state');

test('stream state: requested -> approved -> live -> ended', () => {
  let s = STATES.REQUESTED;
  s = transition(s, STATES.APPROVED);
  s = transition(s, STATES.LIVE);
  s = transition(s, STATES.ENDED);
  assert.equal(s, STATES.ENDED);
});

test('stream state: invalid transitions are rejected', () => {
  assert.equal(canTransition(STATES.ENDED, STATES.LIVE), false);
  assert.throws(() => transition(STATES.REQUESTED, STATES.LIVE));
});

test('stream state: failure transition allowed from active states', () => {
  assert.equal(canTransition(STATES.LIVE, STATES.FAILED), true);
});
