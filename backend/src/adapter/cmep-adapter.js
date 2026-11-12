'use strict';
// CMEP integration boundary. Deny-by-default.
// local mode: development-only rules based on locally minted HMAC tokens.
// http mode: HttpAdapter — integrácia s waste-platform cez HTTP (verify + events).
//   Konfigurácia sa číta z process.env (viz config.js):
//     CMEP_PLATFORM_URL      — základná URL platformy (napr. http://127.0.0.1:8001)
//     CMEP_INTERNAL_API_KEY  — interný kľúč pre verify/events endpointy
//     CMEP_HTTP_VERIFY=0     — iba pre lokálny vývoj (vypne platformový verify)
//   Chýba-li konfigurácia, konštruktor zlyhá (fail-closed, žiadny tichý režim).
const { HttpAdapter } = require('./http-adapter');

class LocalDevAdapter {
  constructor({ devAllow = true } = {}) { this.devAllow = devAllow; }
  async authenticate(tokenClaims) { return tokenClaims; }
  async canCreateInspection(claims, offerId) {
    if (!this.devAllow) return false;
    return Boolean(claims && claims.sub && offerId && String(offerId).length > 0);
  }
  async canJoinInspection(claims, room) {
    if (!this.devAllow) return false;
    if (!claims || !claims.sub || !room) return false;
    if (room.ownerId === claims.sub) return true;
    if (room.state === 'ended' || room.state === 'closed') return false;
    return room.state === 'accepted' && room.acceptedViewer === claims.sub;
  }
  async canRecord(claims, room) {
    if (!this.devAllow) return false;
    return Boolean(claims && room && room.ownerId === claims.sub);
  }
  async recordSessionEvent(event) { return { ok: true, mode: 'local-dev', event }; }
}

function httpAdapterOptions(options = {}) {
  return {
    platformUrl: options.platformUrl ?? process.env.CMEP_PLATFORM_URL,
    internalKey: options.internalKey ?? process.env.CMEP_INTERNAL_API_KEY,
    verifyEnabled: options.verifyEnabled ?? process.env.CMEP_HTTP_VERIFY !== '0',
    timeoutMs: options.timeoutMs ?? Number(process.env.CMEP_HTTP_TIMEOUT_MS || 4000),
  };
}

function createAdapter(mode, options = {}) {
  if (mode === 'http') return new HttpAdapter(httpAdapterOptions(options));
  return new LocalDevAdapter();
}

module.exports = { LocalDevAdapter, HttpAdapter, createAdapter };
