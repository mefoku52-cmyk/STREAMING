'use strict';
const STATES = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  LIVE: 'live',
  ENDED: 'ended',
  FAILED: 'failed',
};
const TRANSITIONS = {
  [STATES.REQUESTED]: new Set([STATES.APPROVED, STATES.FAILED]),
  [STATES.APPROVED]: new Set([STATES.LIVE, STATES.FAILED]),
  [STATES.LIVE]: new Set([STATES.ENDED, STATES.FAILED]),
  [STATES.ENDED]: new Set([]),
  [STATES.FAILED]: new Set([]),
};
function canTransition(from, to) {
  return Boolean(TRANSITIONS[from] && TRANSITIONS[from].has(to));
}
function transition(state, to) {
  if (!canTransition(state, to)) throw new Error(`invalid_transition:${state}->${to}`);
  return to;
}
module.exports = { STATES, TRANSITIONS, canTransition, transition };
