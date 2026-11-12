'use strict';
// CMEP HTTP adapter — produkčná integrácia s waste-platform (CMEP).
//
// Kontrakt (docs/CMEP_ADAPTER_CONTRACT.md):
//   - tokeny mintuje platforma (krátke HMAC, claims {sub, companyId, insp, role, rec})
//   - streaming tokeny IBA verifikuje (index.js verifyLocalSessionToken) a tu
//     server-side autorizuje: role + viazanosť na konkrétnu obhliadku (claim `insp`)
//   - každé kritické rozhodnutie potvrdí platforma cez
//     GET {platformUrl}/api/v1/inspections/{id}/verify  (X-CMEP-Internal-Key)
//   - VŠETKY chyby siete/platformy => fail-closed (false), nikdy fail-open
//   - eventy: POST {platformUrl}/api/v1/inspections/events (idempotentné podľa eventUid)
//
// Tento súbor je jediný, ktorý pozná CMEP/waste-platform — ostatné moduly hovoria
// len o rooms/transports/tokenoch (architektonická hranica).
const crypto = require('node:crypto');

const DEFAULT_TIMEOUT_MS = 4000;
const DEFAULT_RETRIES = 1;
const RETRY_DELAY_MS = 250;

class HttpAdapter {
  constructor({
    platformUrl,
    internalKey,
    verifyEnabled = true,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    fetchImpl = globalThis.fetch,
    logger = null,
  } = {}) {
    if (!platformUrl) throw new Error('adapter_not_configured: CMEP_PLATFORM_URL is required for http mode');
    if (!internalKey) throw new Error('adapter_not_configured: CMEP_INTERNAL_API_KEY is required for http mode');
    this.platformUrl = String(platformUrl).replace(/\/+$/, '');
    this.internalKey = String(internalKey);
    this.verifyEnabled = Boolean(verifyEnabled);
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.fetch = fetchImpl;
    this.log = logger || { warn: () => {}, info: () => {} };
  }

  _timeoutFetch(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const opts = { ...options, signal: controller.signal };
    return this.fetch(url, opts).finally(() => clearTimeout(timer));
  }

  async _withRetries(fn, label) {
    let lastErr;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try { return await fn(); } catch (e) {
        lastErr = e;
        if (attempt < this.retries) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
    }
    throw lastErr;
  }

  /** GET/POST s retry na 5xx (4xx sa neopakuje — je to definitívna odpoveď). */
  async _request(url, options, label) {
    const res = await this._withRetries(async () => {
      const r = await this._timeoutFetch(url, options);
      if (r.status >= 500) throw new Error(`platform_5xx:${r.status}`);
      return r;
    }, label).catch((e) => ({ _error: e }));
    return res;
  }

  /**
   * Potvrdenie oprávnenia na strane platformy. Fail-closed: akákoľvek chyba
   * (sieť, 5xx, 4xx, ok=false) => false.
   */
  async _verify(inspectionId, { sub, role } = {}) {
    if (!this.verifyEnabled) return { ok: true, skipped: true };
    if (!inspectionId || !sub || !role) return { ok: false };
    const url = `${this.platformUrl}/api/v1/inspections/${encodeURIComponent(inspectionId)}/verify`
      + `?sub=${encodeURIComponent(sub)}&role=${encodeURIComponent(role)}`;
    try {
      const res = await this._request(url, {
        method: 'GET',
        headers: { 'x-cmep-internal-key': this.internalKey },
      }, 'verify');
      if (res._error) { this.log.warn('verify_error', { error: res._error.message, inspectionId }); return { ok: false }; }
      if (!res.ok) { this.log.warn('verify_rejected', { status: res.status, inspectionId }); return { ok: false }; }
      const body = await res.json();
      if (!body || body.ok !== true) { this.log.warn('verify_not_ok', { inspectionId, reason: body && body.reason }); return { ok: false }; }
      return body;
    } catch (e) {
      this.log.warn('verify_unreachable', { error: e.message, inspectionId });
      return { ok: false };
    }
  }

  /** Token claims už overil auth (podpis+exp). Tu sa kontroluje štruktúra claims. */
  async authenticate(tokenClaims) {
    if (!tokenClaims || typeof tokenClaims !== 'object') return null;
    if (!tokenClaims.sub) return null;
    if (tokenClaims.role !== 'publisher' && tokenClaims.role !== 'viewer') return null;
    if (!tokenClaims.insp) return null;
    return tokenClaims;
  }

  async canCreateInspection(claims, offerId) {
    if (!claims || claims.role !== 'publisher') return false;
    // Room je viazaná na konkrétnu obhliadku: offerId ≡ claims.insp.
    if (!offerId || String(offerId) !== String(claims.insp)) return false;
    const v = await this._verify(claims.insp, { sub: claims.sub, role: 'publisher' });
    return v.ok === true;
  }

  async canJoinInspection(claims, room) {
    if (!claims || !room) return false;
    // Viazanosť na obhliadku: room.offerId musí sedieť s claim `insp` v tokene.
    if (String(room.offerId) !== String(claims.insp)) return false;
    if (room.ownerId === claims.sub) {
      const v = await this._verify(claims.insp, { sub: claims.sub, role: 'publisher' });
      return v.ok === true;
    }
    if (claims.role !== 'viewer') return false;
    if (room.acceptedViewer && room.acceptedViewer !== claims.sub) return false;
    const v = await this._verify(claims.insp, { sub: claims.sub, role: 'viewer' });
    return v.ok === true;
  }

  async canRecord(claims, room) {
    if (!claims || !room) return false;
    if (claims.role !== 'publisher' || room.ownerId !== claims.sub) return false;
    // Súhlas musí byť v čase nahrávania aktívny (nielen v tokene).
    const v = await this._verify(claims.insp, { sub: claims.sub, role: 'publisher' });
    return v.ok === true && v.consentToRecord === true && claims.rec === 1;
  }

  /** Event do platformy — idempotentný (eventUid), retry, chyby loguje. */
  async recordSessionEvent(event) {
    const inspectionId = event.offerId;
    if (!inspectionId) throw new Error('event_missing_inspection_id');
    const eventUid = crypto.randomUUID();
    const body = JSON.stringify({
      eventUid,
      inspectionId: String(inspectionId),
      eventType: event.type,
      actorSub: event.actorSub || null,
      roomId: event.roomId || null,
      role: event.role || null,
      reason: event.reason || null,
    });
    const res = await this._request(
      `${this.platformUrl}/api/v1/inspections/events`,
      { method: 'POST', headers: { 'content-type': 'application/json', 'x-cmep-internal-key': this.internalKey }, body },
      'record_event',
    ).catch((e) => {
      this.log.warn('event_record_failed', { type: event.type, error: e.message });
      return null;
    });
    if (!res || res._error) {
      if (res && res._error) this.log.warn('event_record_failed', { type: event.type, error: res._error.message });
      return { ok: false, mode: 'http', event };
    }
    if (!res.ok) {
      this.log.warn('event_record_rejected', { type: event.type, status: res.status });
      return { ok: false, mode: 'http', event };
    }
    return { ok: true, mode: 'http', event };
  }
}

module.exports = { HttpAdapter };
