'use strict';
const crypto = require('node:crypto');

// TURN REST API (coturn use-auth-secret): username = "<expiry>:<userid>", password = Base64(HMAC-SHA1(secret, username))
function issueTurnRestCredentials({ userId, ttlSeconds, secret, now = Date.now() }) {
  if (!secret || typeof secret !== 'string') throw new Error('turn_secret_required');
  if (!userId || typeof userId !== 'string') throw new Error('turn_user_required');
  const ttl = Number(ttlSeconds);
  if (!Number.isInteger(ttl) || ttl < 1) throw new Error('turn_ttl_invalid');
  const expiry = Math.floor(now / 1000) + ttl;
  const username = `${expiry}:${userId}`;
  const credential = crypto.createHmac('sha1', secret).update(username).digest('base64');
  return { username, credential, expiresAt: expiry, ttlSeconds: ttl };
}

function parseIceServerUrls(raw) {
  if (!raw) return [];
  return String(raw).split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
}

function buildIceServers({ urls, username, credential, stunUrls = [] }) {
  const servers = [];
  const stun = parseIceServerUrls(stunUrls);
  if (stun.length) servers.push({ urls: stun.length === 1 ? stun[0] : stun });
  const turn = parseIceServerUrls(urls);
  if (turn.length) {
    servers.push({ urls: turn.length === 1 ? turn[0] : turn, username, credential });
  }
  return servers;
}

function createTurnService(config) {
  const secret = config.turnSecret || '';
  const ttlSeconds = config.turnCredentialTtlSeconds || 600;
  const urls = config.turnUrls || '';
  const stunUrls = config.turnStunUrls || '';
  return {
    isEnabled() {
      return Boolean(secret && parseIceServerUrls(urls).length);
    },
    issueForUser(userId) {
      const creds = issueTurnRestCredentials({ userId, ttlSeconds, secret });
      const iceServers = buildIceServers({ urls, username: creds.username, credential: creds.credential, stunUrls });
      return {
        iceServers,
        expiresAt: creds.expiresAt,
        ttlSeconds: creds.ttlSeconds,
        username: creds.username,
      };
    },
  };
}

module.exports = { issueTurnRestCredentials, buildIceServers, parseIceServerUrls, createTurnService };
