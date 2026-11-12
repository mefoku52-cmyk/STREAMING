'use strict';
const METHODS = new Set([
  'createRoom', 'joinRoom', 'leaveRoom', 'getRouterRtpCapabilities',
  'createWebRtcTransport', 'connectTransport', 'produce', 'consume', 'resumeConsumer',
  'requestInspection', 'acceptInspection', 'rejectInspection', 'startRecording', 'stopRecording', 'close',
]);
function parseMessage(raw) {
  if (Buffer.byteLength(raw) > 64 * 1024) throw new Error('message_too_large');
  let m; try { m = JSON.parse(raw); } catch { throw new Error('invalid_json'); }
  if (!m || typeof m !== 'object' || !Number.isInteger(m.id) || typeof m.method !== 'string' || !METHODS.has(m.method)) throw new Error('invalid_request');
  if (m.data !== undefined && (m.data === null || typeof m.data !== 'object' || Array.isArray(m.data))) throw new Error('invalid_data');
  return m;
}
module.exports = { METHODS, parseMessage };
