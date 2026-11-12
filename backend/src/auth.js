'use strict';
const crypto = require('node:crypto');
// extraClaims (nepovinné): ďalšie claims v tokene (napr. insp, offerId, role, rec)
// — používa ich CMEP platforma pri mintovaní streamovacích tokenov (http mode).
// Overenie extra claims vykonáva HttpAdapter (server-side), nikdy klient.
function issueLocalSessionToken({ sub, companyId = '', ttlSeconds = 3600, secret, now = Date.now(), extraClaims = {} }) {
  if (!secret || typeof secret !== 'string') throw new Error('secret_required');
  if (!sub || typeof sub !== 'string') throw new Error('sub_required');
  const claims = { sub, companyId, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + ttlSeconds, ...extraClaims };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function verifyLocalSessionToken(token, secret, now = Date.now()) {
  if (!secret || !token || typeof token !== 'string') return null;
  const parts = token.split('.'); if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let claims; try { claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (!claims.sub || !claims.exp || claims.exp * 1000 <= now) return null;
  if (claims.companyId === undefined) claims.companyId = '';
  return claims;
}
module.exports = { issueLocalSessionToken, verifyLocalSessionToken };
