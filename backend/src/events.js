'use strict';
// Analytics events forwarded to the CMEP adapter. Metadata only — never media
// content, message bodies, names or raw device data.
const EVENT_TYPES = new Set([
  'inspection_requested', 'inspection_accepted', 'inspection_rejected',
  'inspection_started', 'participant_joined', 'participant_left',
  'connection_failed', 'inspection_ended',
]);
function sanitize(event) {
  return {
    type: event.type,
    roomId: event.roomId || null,
    offerId: event.offerId || null,
    actorSub: event.actorSub || null,
    role: event.role || null,
    reason: event.reason || null,
    at: new Date().toISOString(),
  };
}
async function emit(adapter, event) {
  if (!EVENT_TYPES.has(event.type)) throw new Error(`unknown_event_type:${event.type}`);
  const safe = sanitize(event);
  try { await adapter.recordSessionEvent(safe); } catch (e) {
    require('./logger').warn('event_record_failed', { type: safe.type, error: e.message });
  }
  return safe;
}
module.exports = { emit, EVENT_TYPES };
