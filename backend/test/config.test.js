'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {loadConfig}=require('../src/config');
// Pozn. 2026-11-11: očakávaný port opravený z 8404 na 8504 — 8504 je dokumentovaný
// default (docs/PORTS.md, README, .env.example); test bol zostatkom po zmene portu
// (predchádzajúce správanie servera sa týmto nemení, len test zopisuje realitu).
test('config uses loopback defaults',()=>{const old={...process.env};delete process.env.SIGNALING_HOST;delete process.env.SIGNALING_PORT;const c=loadConfig();assert.equal(c.host,'127.0.0.1');assert.equal(c.port,8504);process.env=old;});
