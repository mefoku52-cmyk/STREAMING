# Forenzn√° anal√Ωza - invent√°r s√∫borov

Vygenerovan√©: 2026-11-17T15:41:54Z
Kore≈à: /data/data/com.termux/files/home/cmep-streaming

## Zoznam s√∫borov

### .env
- veƒækos≈•: 1168 B
- riadky: 32
- prv√Ωch 5 riadkov:
```
NODE_ENV=development
APP_NAME=cmep-streaming
SIGNALING_HOST=127.0.0.1
SIGNALING_PORT=8504
WEB_HOST=127.0.0.1
```

### .env.example
- veƒækos≈•: 1598 B
- riadky: 42
- prv√Ωch 5 riadkov:
```
NODE_ENV=development
APP_NAME=cmep-streaming
SIGNALING_HOST=127.0.0.1
SIGNALING_PORT=8504
WEB_HOST=127.0.0.1
```

### .gitignore
- veƒækos≈•: 109 B
- riadky: 13
- prv√Ωch 5 riadkov:
```
node_modules/
.env
.env.*
!.env.example
*.pem
```

### INSTALL_TERMUX.txt
- veƒækos≈•: 883 B
- riadky: 25
- prv√Ωch 5 riadkov:
```
TERMUX INSTALL ‚Äî PACKAGE 1/5

Run from Termux. This creates a separate directory and refuses overwrite. It does not read or alter ~/live-prototype.

cat > "$HOME/install_cmep_part1.sh" <<'EOF'
```

### README.md
- veƒækos≈•: 4225 B
- riadky: 88
- prv√Ωch 5 riadkov:
```
# CMEP Streaming Engine

Standalone WebRTC live-inspection service for Termux/Node.js, built from the five
audited ZIP packages and hardened during implementation. It does not modify
`live-prototype` or `waste-platform`; both are used read-only as reference.
```

### backend/package-lock.json
- veƒækos≈•: 13519 B
- riadky: 390
- prv√Ωch 5 riadkov:
```
{
  "name": "cmep-streaming-backend",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
```

### backend/package.json
- veƒækos≈•: 562 B
- riadky: 20
- prv√Ωch 5 riadkov:
```
{
  "name": "cmep-streaming-backend",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
```

### backend/scripts/postinstall.js
- veƒækos≈•: 902 B
- riadky: 17
- prv√Ωch 5 riadkov:
```
#!/usr/bin/env node
'use strict';
// Copies the mediasoup-client browser bundle into web/vendor so the static
// web UI never depends on node_modules at runtime. Fails soft: if the bundle
// is missing (e.g. install without network), a warning is printed and the
```

### backend/src/adapter/cmep-adapter.js
- veƒækos≈•: 2169 B
- riadky: 47
- prv√Ωch 5 riadkov:
```
'use strict';
// CMEP integration boundary. Deny-by-default.
// local mode: development-only rules based on locally minted HMAC tokens.
// http mode: HttpAdapter ‚Äî integr√°cia s waste-platform cez HTTP (verify + events).
//   Konfigur√°cia sa ƒç√≠ta z process.env (viz config.js):
```

### backend/src/adapter/http-adapter.js
- veƒækos≈•: 7125 B
- riadky: 168
- prv√Ωch 5 riadkov:
```
'use strict';
// CMEP HTTP adapter ‚Äî produkƒçn√° integr√°cia s waste-platform (CMEP).
//
// Kontrakt (docs/CMEP_ADAPTER_CONTRACT.md):
//   - tokeny mintuje platforma (kr√°tke HMAC, claims {sub, companyId, insp, role, rec})
```

### backend/src/auth.js
- veƒækos≈•: 1733 B
- riadky: 26
- prv√Ωch 5 riadkov:
```
'use strict';
const crypto = require('node:crypto');
// extraClaims (nepovinn√©): ƒèal≈°ie claims v tokene (napr. insp, offerId, role, rec)
// ‚Äî pou≈æ√≠va ich CMEP platforma pri mintovan√≠ streamovac√≠ch tokenov (http mode).
// Overenie extra claims vykon√°va HttpAdapter (server-side), nikdy klient.
```

### backend/src/config.js
- veƒækos≈•: 2622 B
- riadky: 52
- prv√Ωch 5 riadkov:
```
'use strict';
const path = require('node:path');
function port(name, fallback) {
  const raw = process.env[name] ?? String(fallback);
  const n = Number(raw);
```

### backend/src/events.js
- veƒækos≈•: 1011 B
- riadky: 28
- prv√Ωch 5 riadkov:
```
'use strict';
// Analytics events forwarded to the CMEP adapter. Metadata only ‚Äî never media
// content, message bodies, names or raw device data.
const EVENT_TYPES = new Set([
  'inspection_requested', 'inspection_accepted', 'inspection_rejected',
```

### backend/src/http.js
- veƒækos≈•: 3077 B
- riadky: 71
- prv√Ωch 5 riadkov:
```
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

```

### backend/src/index.js
- veƒækos≈•: 6365 B
- riadky: 146
- prv√Ωch 5 riadkov:
```
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { loadConfig } = require('./config');
const { createHttpServer } = require('./http');
```

### backend/src/logger.js
- veƒækos≈•: 610 B
- riadky: 10
- prv√Ωch 5 riadkov:
```
'use strict';
const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = levels[process.env.LOG_LEVEL || 'info'] ?? 20;
function write(level, message, fields = {}) {
  if ((levels[level] || 20) < threshold) return;
```

### backend/src/media-config.js
- veƒækos≈•: 1174 B
- riadky: 28
- prv√Ωch 5 riadkov:
```
'use strict';
function intEnv(k, d) {
  const n = Number(process.env[k] ?? d);
  if (!Number.isInteger(n) || n < 1 || n > 65535) throw Error(`invalid ${k}`);
  return n;
```

### backend/src/process-manager.js
- veƒækos≈•: 862 B
- riadky: 21
- prv√Ωch 5 riadkov:
```
'use strict';
const { spawn } = require('node:child_process');
class ProcessManager {
  #children = new Set();
  spawn(command,args,opts={}) {
```

### backend/src/protocol.js
- veƒækos≈•: 898 B
- riadky: 15
- prv√Ωch 5 riadkov:
```
'use strict';
const METHODS = new Set([
  'createRoom', 'joinRoom', 'leaveRoom', 'getRouterRtpCapabilities',
  'createWebRtcTransport', 'connectTransport', 'produce', 'consume', 'resumeConsumer',
  'requestInspection', 'acceptInspection', 'rejectInspection', 'startRecording', 'stopRecording', 'close',
```

### backend/src/recorder.js
- veƒækos≈•: 7050 B
- riadky: 159
- prv√Ωch 5 riadkov:
```
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const dgram = require('node:dgram');
const log = require('./logger');
```

### backend/src/session-store.js
- veƒækos≈•: 695 B
- riadky: 24
- prv√Ωch 5 riadkov:
```
'use strict';
const crypto = require('node:crypto');
class SessionStore {
  #rooms = new Map();
  create({ ownerId, offerId }) {
```

### backend/src/signaling.js
- veƒækos≈•: 26157 B
- riadky: 473
- prv√Ωch 5 riadkov:
```
'use strict';
const { WebSocketServer, WebSocket } = require('ws');
const { parseMessage } = require('./protocol');
const { SessionStore } = require('./session-store');
const log = require('./logger');
```

### backend/src/turn-credentials.js
- veƒækos≈•: 2142 B
- riadky: 54
- prv√Ωch 5 riadkov:
```
'use strict';
const crypto = require('node:crypto');

// TURN REST API (coturn use-auth-secret): username = "<expiry>:<userid>", password = Base64(HMAC-SHA1(secret, username))
function issueTurnRestCredentials({ userId, ttlSeconds, secret, now = Date.now() }) {
```

### backend/test/auth.test.js
- veƒækos≈•: 1922 B
- riadky: 45
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { issueLocalSessionToken, verifyLocalSessionToken } = require('../src/auth');

```

### backend/test/cmep-live-e2e.test.js
- veƒækos≈•: 12535 B
- riadky: 278
- prv√Ωch 5 riadkov:
```
'use strict';
/* Cross-service E2E (CMEP Live Inspections):
   - Python runner (scripts/cmep_live_inspection_e2e_server.py) = CMEP platform + seed + JWT mint
   - Node = CMEP Streaming server (CMEP_ADAPTER=http) + platform HTTP calls + full WS flow
*/
```

### backend/test/config.test.js
- veƒækos≈•: 634 B
- riadky: 7
- prv√Ωch 5 riadkov:
```
'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {loadConfig}=require('../src/config');
// Pozn. 2026-11-11: oƒçak√°van√Ω port opraven√Ω z 8404 na 8504 ‚Äî 8504 je dokumentovan√Ω
// default (docs/PORTS.md, README, .env.example); test bol zostatkom po zmene portu
```

### backend/test/events.test.js
- veƒækos≈•: 1396 B
- riadky: 32
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { emit, EVENT_TYPES } = require('../src/events');

```

### backend/test/http-adapter.test.js
- veƒækos≈•: 13077 B
- riadky: 282
- prv√Ωch 5 riadkov:
```
'use strict';
/* HttpAdapter testy ‚Äî mock platforma na lok√°lnom porte + fail-closed scen√°re. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
```

### backend/test/integration.test.js
- veƒækos≈•: 9009 B
- riadky: 209
- prv√Ωch 5 riadkov:
```
'use strict';
/* Black-box integration test: spawns the real server (ephemeral random port),
   exercises the WS protocol, ACLs, room lifecycle and graceful shutdown. */
const test = require('node:test');
const assert = require('node:assert/strict');
```

### backend/test/producer-dedup.test.js
- veƒækos≈•: 13387 B
- riadky: 245
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
```

### backend/test/protocol.test.js
- veƒækos≈•: 463 B
- riadky: 6
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test'); const assert = require('node:assert/strict');
const { parseMessage } = require('../src/protocol');
test('parses supported request', () => assert.equal(parseMessage('{"id":1,"method":"createRoom","data":{}}').method, 'createRoom'));
test('rejects unsupported method', () => assert.throws(() => parseMessage('{"id":1,"method":"shell"}')));
```

### backend/test/session-store.test.js
- veƒækos≈•: 1128 B
- riadky: 33
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SessionStore } = require('../src/session-store');

```

### backend/test/signaling-resume.test.js
- veƒækos≈•: 9494 B
- riadky: 186
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
```

### backend/test/signaling-turn.test.js
- veƒækos≈•: 6922 B
- riadky: 156
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
```

### backend/test/turn-credentials.test.js
- veƒækos≈•: 2376 B
- riadky: 47
- prv√Ωch 5 riadkov:
```
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { issueTurnRestCredentials, buildIceServers, createTurnService } = require('../src/turn-credentials');
```

### config/ports.example.json
- veƒækos≈•: 294 B
- riadky: 8
- prv√Ωch 5 riadkov:
```
{
  "web": [8402],
  "signaling": [8404],
  "websocket": [8404],
  "mediasoupRtcRange": [40000, 40100],
```

### deploy/CMEP_PLATFORM_INTEGRATION_PLAN.md
- veƒækos≈•: 38245 B
- riadky: 264
- prv√Ωch 5 riadkov:
```
# CMEP Platform ‚Üî Streaming ‚Äî forenzn√Ω integraƒçn√Ω prieskum a technick√Ω n√°vrh (F√ÅZA 1, READ-ONLY)

**D√°tum:** 2026-11-15  
**Re≈æim:** iba anal√Ωza/report (≈æiadne zmeny zdrojov√Ωch s√∫borov, migr√°ci√≠, API, commit/push/deploy, ≈æiadne opakovan√© testy).  
**Projekty:**
```

### deploy/FINAL_DEPLOYMENT_AUDIT.md
- veƒækos≈•: 15166 B
- riadky: 269
- prv√Ωch 5 riadkov:
```
# CMEP Streaming ‚Äî Finan√°lny audit deployment bal√≠ka (pred VPS)

Tento dokument obsahuje kompletn√Ω technick√Ω audit adres√°ra `deploy/` pred nasaden√≠m na ƒçist√Ω Linux VPS x86_64. ≈Ωiadny deployment nebol vykonan√Ω, ≈æiadne extern√© slu≈æby neboli kontaktovan√©.

---
```

### deploy/FINAL_IMPLEMENTATION_REPORT.md
- veƒækos≈•: 11945 B
- riadky: 116
- prv√Ωch 5 riadkov:
```
# CMEP Streaming ‚Äî Final Implementation Report

**Project:** `$HOME/cmep-streaming`  
**Date:** 2026-11-15  
**Scope:** Complete in-progress implementation (TURN/ICE resilience, WS reconnect/session resume, deployment hardening, tests). **No commit, push, deployment, Render/production changes performed.**
```

### deploy/FINAL_READINESS_AUDIT.md
- veƒækos≈•: 17179 B
- riadky: 196
- prv√Ωch 5 riadkov:
```
# CMEP Streaming ‚Äî Fin√°lny integraƒçn√Ω audit deploymentu (pred VPS)

**Rozsah:** audit `deploy/` (14 s√∫borov) + klienti `web/publish.js`, `web/viewer.js`. ≈Ωiadne zmeny mimo tohto reportu. ≈Ωiadny commit/push/deploy. Existuj√∫ce testy neboli opakovan√© (kontext: backend 29/29 PASS, TURN auth 9/9 PASS).

---
```

### deploy/PHASE2_INTEGRATION_REPORT.md
- veƒækos≈•: 13091 B
- riadky: 105
- prv√Ωch 5 riadkov:
```
# CMEP Streaming ‚Üí CMEP Platform ‚Äî F√ÅZA 2 integraƒçn√Ω report

**D√°tum:** 2026-11-15  
**Re≈æim:** implement√°cia potvrden√Ωch nedostatkov + overenie (bez commit/push/deploy, bez produkƒçn√Ωch z√°sahov, bez mazania `.env`/DB/nahr√°vok, bez odstra≈àovania testov).  
**V√Ωchodisko:** `deploy/CMEP_PLATFORM_INTEGRATION_PLAN.md`, existuj√∫ca implement√°cia modulu `inspections` (nezduplikovan√°).
```

### deploy/PHASE3A_CDP_E2E_REPORT.md
- veƒækos≈•: 10557 B
- riadky: 82
- prv√Ωch 5 riadkov:
```
# Phase 3A ‚Äì CDP Browser E2E Report (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repos: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), `waste-platform` (workspace with existing Phase 2 changes). **No commit/push/deploy. No production/GitHub/Render/DB/env/recordings/user-data changes. No functional application source modified.**

```

### deploy/PHASE3B_CDP_E2E_REPORT.md
- veƒækos≈•: 10282 B
- riadky: 87
- prv√Ωch 5 riadkov:
```
# Phase 3B ‚Äì CDP Browser E2E Report (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repos: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), `waste-platform` (workspace with existing Phase 2 changes). **No commit/push/deploy. No production/GitHub/Render/DB/env/recordings/user-data changes. No functional application source modified** (`web/publish.js`, `web/viewer.js`, backend implementation unchanged).

```

### deploy/PHASE3C_AUDIO_DIAGNOSTIC_REPORT.md
- veƒækos≈•: 12502 B
- riadky: 121
- prv√Ωch 5 riadkov:
```
# Phase 3C ‚Äì Audio Consume Forensic Diagnostic Report (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repos: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), `waste-platform` (workspace, existing Phase 2 changes). **No commit/push/deploy. No production/GitHub/Render/DB/env/recordings/user-data changes. No existing tests/logs deleted. No functional application source modified** (`web/`, `backend/src/` unchanged); changes limited to test harness and this report.

```

### deploy/PHASE3D_SERVER_PRODUCER_DIAGNOSTIC_REPORT.md
- veƒækos≈•: 9468 B
- riadky: 81
- prv√Ωch 5 riadkov:
```
# Phase 3D ‚Äì Server Producer Lifecycle Isolation Diagnostic (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repo: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), workspace includes existing modified/untracked files from prior phases (untouched). **No commit/push/merge/deploy. No application logic changes. No changes to `web/`, `backend/src/`, configuration, or existing tests. No existing reports/artifacts deleted or overwritten. `.env`, DB, recordings, user data preserved. Port 8504 not used by this phase‚Äôs tests (in-process mocked servers on ephemeral ports).**

```

### deploy/PHASE3E_PRODUCER_DEDUP_FIX_REPORT.md
- veƒækos≈•: 10031 B
- riadky: 86
- prv√Ωch 5 riadkov:
```
# Phase 3E ‚Äì Producer Dedup Fix Report (CMEP Streaming)

Date: 2026-11-16 (Termux/Android)  
Repo: `cmep-streaming`  
Branch: `main`  
```

### deploy/PHASE3F_code_extract.txt
- veƒækos≈•: 6545 B
- riadky: 143
- prv√Ωch 5 riadkov:
```
== index.js 28-135 ==
function acquireRuntimeLock(runtimeDir) {
  fs.mkdirSync(runtimeDir, { recursive: true });
  const lockPath = path.join(runtimeDir, 'server.lock');
  if (fs.existsSync(lockPath)) {
```

### deploy/PHASE3F_discovery.txt
- veƒækos≈•: 7389 B
- riadky: 103
- prv√Ωch 5 riadkov:
```
== git ==
3a76182741764b215acb88254886b7f44486bf5e
 M backend/src/config.js
 M backend/src/http.js
 M backend/src/index.js
```

### deploy/PHASE3F_order.txt
- veƒækos≈•: 430 B
- riadky: 5
- prv√Ωch 5 riadkov:
```
backend/src/signaling.js:26:async function createSignaling({
backend/src/signaling.js:34:  const worker = await mediasoup.createWorker({ logLevel: 'warn' });
backend/src/signaling.js:35:  const router = await worker.createRouter({ mediaCodecs });
backend/src/signaling.js:41:  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
backend/src/signaling.js:132:  server.on('upgrade', (req, socket, head) => {
```

### deploy/PHASE3F_runA.txt
- veƒækos≈•: 0 B
- riadky: 0
- prv√Ωch 5 riadkov:
```
```

### deploy/PHASE3F_runB.txt
- veƒækos≈•: 36 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
SUMMARY pass=0 fail=6 s_404=0 z N=6
```

### deploy/PHASE3F_verify.txt
- veƒækos≈•: 0 B
- riadky: 0
- prv√Ωch 5 riadkov:
```
```

### deploy/PHASE3F_window.txt
- veƒækos≈•: 890 B
- riadky: 21
- prv√Ωch 5 riadkov:
```
run 1:
  ECONNREFUSED | health=ECONNREFUSED  first=237ms last=1006ms n=24
  HTTP404 | ready=true  first=1172ms last=1172ms n=1
  101 | ready=true  first=1227ms last=1272ms n=2
run 2:
```

### deploy/PHASE3_BROWSER_MEDIA_REPORT.md
- veƒækos≈•: 7606 B
- riadky: 80
- prv√Ωch 5 riadkov:
```
# Phase 3 ‚Äì Browser Media Report (CMEP Live Inspections)

Date: 2026-11-16 (environment: Termux/Android, Node v25.12.0, npm 11.12.1)
Repos: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), `waste-platform` (workspace with existing Phase 2 changes). **No commit/push/deploy performed. No production/GitHub/Render/DB/env/recordings/user-data changes. No source code modified.**

```

### deploy/README.md
- veƒækos≈•: 3232 B
- riadky: 43
- prv√Ωch 5 riadkov:
```
# CMEP Streaming ‚Äî VPS Deployment

Samostatn√© produkƒçn√© nasadenie streamovacieho servera na Linux VPS s verejnou IPv4.
CMEP API (waste-platform) zost√°va externe; tento streamingov√Ω server je samostatn√° slu≈æba.

```

### deploy/TURN_AUTH_VERIFICATION.md
- veƒækos≈•: 4805 B
- riadky: 70
- prv√Ωch 5 riadkov:
```
# TURN Auth Verification (coturn TURN REST)

## Rozsah
Overenie a oprava TURN autentifik√°cie v√Ωhradne v `deploy/` (bez zmien v `backend/src/`, `web/`, `waste-platform`, API ani datab√°ze). ≈Ωiadny commit, push ani deployment.

```

### deploy/caddy/Caddyfile
- veƒækos≈•: 740 B
- riadky: 26
- prv√Ωch 5 riadkov:
```
{
  email off
  acme_ca https://acme-v02.api.letsencrypt.org/directory
}

```

### deploy/coturn/turnserver.conf
- veƒækos≈•: 1199 B
- riadky: 36
- prv√Ωch 5 riadkov:
```
# coturn konfigur√°cia pre CMEP Streaming WebRTC relay.
# ≈†abl√≥na ‚Äî pri nasaden√≠ sa z nej generuje fin√°lna /etc/turnserver.conf
# s dosaden√Ωmi hodnotami (TURN_SECRET sa ƒç√≠ta z .env, nie je v tejto ≈°abl√≥ne).

# Verejn√° IP adresa VPS (iba IPv4; pre IPv6 pridajte dal≈°√≠ riadok listening-ip)
```

### deploy/env/.env.production.template
- veƒækos≈•: 2569 B
- riadky: 68
- prv√Ωch 5 riadkov:
```
# CMEP Streaming ‚Äî produkƒçn√© environment premenn√©
# Skop√≠rujte do /opt/cmep-streaming/.env a nahraƒète ka≈æd√∫ "V√Å≈†_..." hodnotu.
# Tento s√∫bor nikdy neukladajte do Gitu (je v .gitignore).

# --- Node.js ---
```

### deploy/firewall/ufw-rules.sh
- veƒækos≈•: 1257 B
- riadky: 35
- prv√Ωch 5 riadkov:
```
#!/bin/bash
# Firewall pravidl√° pre CMEP Streaming VPS (ufw).
# Spusti≈• ako root po nasaden√≠: bash deploy/firewall/ufw-rules.sh
set -euo pipefail

```

### deploy/phase3a-cdp-e2e.js
- veƒækos≈•: 52188 B
- riadky: 680
- prv√Ωch 5 riadkov:
```
'use strict';
/**
 * Phase 3C audio-diagnostic CDP browser E2E harness (publisher -> viewer WebRTC A/V) for Termux/Android.
 * Test-only harness. No application source changes.
 *
```

### deploy/phase3d-producer-isolation.js
- veƒækos≈•: 13333 B
- riadky: 228
- prv√Ωch 5 riadkov:
```
'use strict';
/**
 * Phase 3D - isolated reproduction tests for "audio producer missing from viewer joinRoom"
 * Diagnostic-only, no application source/config/existing tests modified.
 * Uses backend/src modules with mocked mediasoup to inspect room.producers and responses.
```

### deploy/phase3f_runA/run_1.log
- veƒækos≈•: 666 B
- riadky: 18
- prv√Ωch 5 riadkov:
```
# PRED
02:17:23.049406892
‚úî resume: websocket disconnect/reconnect restores participant slot and state (4456.411461ms)
‚úî resume: expired session token cannot reconnect/resume (4414.703385ms)
‚úî resume: vanished room rejects resume (38626.436541ms)
```

### deploy/phase3f_runA/run_10.log
- veƒækos≈•: 608 B
- riadky: 24
- prv√Ωch 5 riadkov:
```
# PRED
02:21:34.073090984
‚úî resume: websocket disconnect/reconnect restores participant slot and state (3916.406462ms)

Interrupted while running:
```

### deploy/phase3f_runA/run_11.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:39.169480446

Interrupted while running:

```

### deploy/phase3f_runA/run_12.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:40.358949138

Interrupted while running:

```

### deploy/phase3f_runA/run_13.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:41.502380138

Interrupted while running:

```

### deploy/phase3f_runA/run_14.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:42.524064754

Interrupted while running:

```

### deploy/phase3f_runA/run_15.log
- veƒækos≈•: 195 B
- riadky: 4
- prv√Ωch 5 riadkov:
```
# PRED
02:21:43.740497369
‚úî resume: websocket disconnect/reconnect restores participant slot and state (3946.821462ms)
‚úî resume: expired session token cannot reconnect/resume (4426.789462ms)
```

### deploy/phase3f_runA/run_2.log
- veƒækos≈•: 667 B
- riadky: 18
- prv√Ωch 5 riadkov:
```
# PRED
02:18:28.213445358
‚úî resume: websocket disconnect/reconnect restores participant slot and state (4501.984924ms)
‚úî resume: expired session token cannot reconnect/resume (4415.261ms)
‚úî resume: vanished room rejects resume (38612.473617ms)
```

### deploy/phase3f_runA/run_3.log
- veƒækos≈•: 664 B
- riadky: 18
- prv√Ωch 5 riadkov:
```
# PRED
02:19:36.608772131
‚úî resume: websocket disconnect/reconnect restores participant slot and state (4181.272ms)
‚úî resume: expired session token cannot reconnect/resume (4516.651692ms)
‚úî resume: vanished room rejects resume (38778.496849ms)
```

### deploy/phase3f_runA/run_4.log
- veƒækos≈•: 682 B
- riadky: 25
- prv√Ωch 5 riadkov:
```
# PRED
02:20:41.703722289
‚úî resume: websocket disconnect/reconnect restores participant slot and state (4025.188001ms)
‚úî resume: expired session token cannot reconnect/resume (4442.431ms)

```

### deploy/phase3f_runA/run_5.log
- veƒækos≈•: 513 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:26.343991830

Interrupted while running:

```

### deploy/phase3f_runA/run_6.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:28.888891830

Interrupted while running:

```

### deploy/phase3f_runA/run_7.log
- veƒækos≈•: 513 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:30.015026061

Interrupted while running:

```

### deploy/phase3f_runA/run_8.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:31.849825676

Interrupted while running:

```

### deploy/phase3f_runA/run_9.log
- veƒækos≈•: 507 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:21:33.001301369

Interrupted while running:

```

### deploy/phase3f_runB/run_1.log
- veƒækos≈•: 3989 B
- riadky: 45
- prv√Ωch 5 riadkov:
```
# PRED
02:21:59.851365986
14875 node --test test/signaling-resume.test.js
14890 /data/data/com.termux/files/usr/bin/node --test-concurrency=0 --heap-prof-interval=524288 --stack-trace-limit=10 --report-signal=SIGUSR2 --heapsnapshot-near-heap-limit=0 --tls-cipher-list=TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA --watch-kill-signal=SIGTERM --inspect-publish-uid=stderr,http --test-isolation=process --test-coverage-lines=0 --cpu-prof-interval=1000 --test-coverage-functions=0 --max-http-header-size=16384 --test-timeout=0 --inspect-port=127.0.0.1:9229 --use-largepages=off --experimental-addon-modules --test-coverage-branches=0 --network-family-autoselection-attempt-timeout=250 --secure-heap-min=2 --v8-pool-size=4 --secure-heap=0 --node-snapshot --trace-event-file-pattern=node_trace.${rotation}.log test/signaling-resume.test.js
15020 /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/home/cmep-streaming/backend/src/index.js
```

### deploy/phase3f_runB/run_2.log
- veƒækos≈•: 3989 B
- riadky: 45
- prv√Ωch 5 riadkov:
```
# PRED
02:22:00.759788832
14875 node --test test/signaling-resume.test.js
14890 /data/data/com.termux/files/usr/bin/node --test-concurrency=0 --heap-prof-interval=524288 --stack-trace-limit=10 --report-signal=SIGUSR2 --heapsnapshot-near-heap-limit=0 --tls-cipher-list=TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA --watch-kill-signal=SIGTERM --inspect-publish-uid=stderr,http --test-isolation=process --test-coverage-lines=0 --cpu-prof-interval=1000 --test-coverage-functions=0 --max-http-header-size=16384 --test-timeout=0 --inspect-port=127.0.0.1:9229 --use-largepages=off --experimental-addon-modules --test-coverage-branches=0 --network-family-autoselection-attempt-timeout=250 --secure-heap-min=2 --v8-pool-size=4 --secure-heap=0 --node-snapshot --trace-event-file-pattern=node_trace.${rotation}.log test/signaling-resume.test.js
15020 /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/home/cmep-streaming/backend/src/index.js
```

### deploy/phase3f_runB/run_3.log
- veƒækos≈•: 3989 B
- riadky: 45
- prv√Ωch 5 riadkov:
```
# PRED
02:22:01.640440755
14875 node --test test/signaling-resume.test.js
14890 /data/data/com.termux/files/usr/bin/node --test-concurrency=0 --heap-prof-interval=524288 --stack-trace-limit=10 --report-signal=SIGUSR2 --heapsnapshot-near-heap-limit=0 --tls-cipher-list=TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA --watch-kill-signal=SIGTERM --inspect-publish-uid=stderr,http --test-isolation=process --test-coverage-lines=0 --cpu-prof-interval=1000 --test-coverage-functions=0 --max-http-header-size=16384 --test-timeout=0 --inspect-port=127.0.0.1:9229 --use-largepages=off --experimental-addon-modules --test-coverage-branches=0 --network-family-autoselection-attempt-timeout=250 --secure-heap-min=2 --v8-pool-size=4 --secure-heap=0 --node-snapshot --trace-event-file-pattern=node_trace.${rotation}.log test/signaling-resume.test.js
15020 /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/home/cmep-streaming/backend/src/index.js
```

### deploy/phase3f_runB/run_4.log
- veƒækos≈•: 3989 B
- riadky: 45
- prv√Ωch 5 riadkov:
```
# PRED
02:22:02.546124755
14875 node --test test/signaling-resume.test.js
14890 /data/data/com.termux/files/usr/bin/node --test-concurrency=0 --heap-prof-interval=524288 --stack-trace-limit=10 --report-signal=SIGUSR2 --heapsnapshot-near-heap-limit=0 --tls-cipher-list=TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA --watch-kill-signal=SIGTERM --inspect-publish-uid=stderr,http --test-isolation=process --test-coverage-lines=0 --cpu-prof-interval=1000 --test-coverage-functions=0 --max-http-header-size=16384 --test-timeout=0 --inspect-port=127.0.0.1:9229 --use-largepages=off --experimental-addon-modules --test-coverage-branches=0 --network-family-autoselection-attempt-timeout=250 --secure-heap-min=2 --v8-pool-size=4 --secure-heap=0 --node-snapshot --trace-event-file-pattern=node_trace.${rotation}.log test/signaling-resume.test.js
15020 /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/home/cmep-streaming/backend/src/index.js
```

### deploy/phase3f_runB/run_5.log
- veƒækos≈•: 3989 B
- riadky: 45
- prv√Ωch 5 riadkov:
```
# PRED
02:22:03.486389371
14875 node --test test/signaling-resume.test.js
14890 /data/data/com.termux/files/usr/bin/node --test-concurrency=0 --heap-prof-interval=524288 --stack-trace-limit=10 --report-signal=SIGUSR2 --heapsnapshot-near-heap-limit=0 --tls-cipher-list=TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA --watch-kill-signal=SIGTERM --inspect-publish-uid=stderr,http --test-isolation=process --test-coverage-lines=0 --cpu-prof-interval=1000 --test-coverage-functions=0 --max-http-header-size=16384 --test-timeout=0 --inspect-port=127.0.0.1:9229 --use-largepages=off --experimental-addon-modules --test-coverage-branches=0 --network-family-autoselection-attempt-timeout=250 --secure-heap-min=2 --v8-pool-size=4 --secure-heap=0 --node-snapshot --trace-event-file-pattern=node_trace.${rotation}.log test/signaling-resume.test.js
15020 /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/home/cmep-streaming/backend/src/index.js
```

### deploy/phase3f_runB/run_6.log
- veƒækos≈•: 3989 B
- riadky: 45
- prv√Ωch 5 riadkov:
```
# PRED
02:22:04.336632448
14875 node --test test/signaling-resume.test.js
14890 /data/data/com.termux/files/usr/bin/node --test-concurrency=0 --heap-prof-interval=524288 --stack-trace-limit=10 --report-signal=SIGUSR2 --heapsnapshot-near-heap-limit=0 --tls-cipher-list=TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA --watch-kill-signal=SIGTERM --inspect-publish-uid=stderr,http --test-isolation=process --test-coverage-lines=0 --cpu-prof-interval=1000 --test-coverage-functions=0 --max-http-header-size=16384 --test-timeout=0 --inspect-port=127.0.0.1:9229 --use-largepages=off --experimental-addon-modules --test-coverage-branches=0 --network-family-autoselection-attempt-timeout=250 --secure-heap-min=2 --v8-pool-size=4 --secure-heap=0 --node-snapshot --trace-event-file-pattern=node_trace.${rotation}.log test/signaling-resume.test.js
15020 /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/home/cmep-streaming/backend/src/index.js
```

### deploy/phase3f_runs/run_1.log
- veƒækos≈•: 670 B
- riadky: 18
- prv√Ωch 5 riadkov:
```
# PRED
02:23:27.132735837
‚úî resume: websocket disconnect/reconnect restores participant slot and state (3940.873769ms)
‚úî resume: expired session token cannot reconnect/resume (4407.422462ms)
‚úî resume: vanished room rejects resume (38641.626772ms)
```

### deploy/phase3f_runs/run_10.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:25:08.649019612

Interrupted while running:

```

### deploy/phase3f_runs/run_11.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:25:09.781903843

Interrupted while running:

```

### deploy/phase3f_runs/run_12.log
- veƒækos≈•: 507 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:25:10.821787843

Interrupted while running:

```

### deploy/phase3f_runs/run_13.log
- veƒækos≈•: 508 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:25:11.877856843

Interrupted while running:

```

### deploy/phase3f_runs/run_14.log
- veƒækos≈•: 581 B
- riadky: 22
- prv√Ωch 5 riadkov:
```
# PRED
02:25:12.908054305
‚úî resume: websocket disconnect/reconnect restores participant slot and state (3931.516385ms)

Interrupted while running:
```

### deploy/phase3f_runs/run_2.log
- veƒækos≈•: 685 B
- riadky: 25
- prv√Ωch 5 riadkov:
```
# PRED
02:24:32.181304226
‚úî resume: websocket disconnect/reconnect restores participant slot and state (4755.338154ms)
‚úî resume: expired session token cannot reconnect/resume (3939.180692ms)

```

### deploy/phase3f_runs/run_3.log
- veƒækos≈•: 513 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:24:46.280255226

Interrupted while running:

```

### deploy/phase3f_runs/run_4.log
- veƒækos≈•: 504 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:24:48.819465996

Interrupted while running:

```

### deploy/phase3f_runs/run_5.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:24:50.160211919

Interrupted while running:

```

### deploy/phase3f_runs/run_6.log
- veƒækos≈•: 683 B
- riadky: 25
- prv√Ωch 5 riadkov:
```
# PRED
02:24:51.359613381
‚úî resume: websocket disconnect/reconnect restores participant slot and state (3977.232385ms)
‚úî resume: expired session token cannot reconnect/resume (4443.822154ms)

```

### deploy/phase3f_runs/run_7.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:25:05.476603228

Interrupted while running:

```

### deploy/phase3f_runs/run_8.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:25:06.584532766

Interrupted while running:

```

### deploy/phase3f_runs/run_9.log
- veƒækos≈•: 510 B
- riadky: 23
- prv√Ωch 5 riadkov:
```
# PRED
02:25:07.651206920

Interrupted while running:

```

### deploy/scripts/check-worker.sh
- veƒækos≈•: 890 B
- riadky: 30
- prv√Ωch 5 riadkov:
```
#!/bin/bash
# Kontrola dostupnosti a spr√°vnosti mediasoup workeru pre cieƒæov√∫ architekt√∫ru.
# Spusti≈• na VPS po `npm ci`.
set -euo pipefail

```

### deploy/scripts/deploy.sh
- veƒækos≈•: 7063 B
- riadky: 161
- prv√Ωch 5 riadkov:
```
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cmep-streaming}"
DEPLOY_USER="${DEPLOY_USER:-cmep}"
```

### deploy/scripts/health-check.sh
- veƒækos≈•: 735 B
- riadky: 33
- prv√Ωch 5 riadkov:
```
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:8504}"
MODE="${2:-ready}" # live | ready
```

### deploy/scripts/rollback.sh
- veƒækos≈•: 1190 B
- riadky: 37
- prv√Ωch 5 riadkov:
```
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cmep-streaming}"
RELEASES_DIR="${RELEASES_DIR:-/var/lib/cmep-streaming/releases}"
```

### deploy/systemd/cmep-streaming.service
- veƒækos≈•: 760 B
- riadky: 28
- prv√Ωch 5 riadkov:
```
[Unit]
Description=CMEP Streaming ‚Äî standalone WebRTC live-inspection service
After=network-online.target
Wants=network-online.target

```

### deploy/turn-credentials/generate-turn-credentials.sh
- veƒækos≈•: 1552 B
- riadky: 37
- prv√Ωch 5 riadkov:
```
#!/bin/bash
# Generovanie ƒçasovo obmedzen√Ωch TURN REST credentials pre coturn (use-auth-secret).
#
# coturn TURN REST API form√°t:
#   username  = "<expiration_unix_timestamp>:<userid>"
```

### deploy/turn-credentials/test-turn-auth.sh
- veƒækos≈•: 4041 B
- riadky: 107
- prv√Ωch 5 riadkov:
```
#!/bin/bash
# Automatick√Ω test TURN REST autentifik√°cie (bez pripojenia k coturn/VPS).
# Over√≠: form√°t username, HMAC-SHA1+Base64 password, expir√°ciu, zhodu secretu
# medzi gener√°torom a coturn konfigur√°ciou ‚Äî bez vypisovania secretu.
set -euo pipefail
```

### docs/ACCEPTANCE.md
- veƒækos≈•: 3662 B
- riadky: 66
- prv√Ωch 5 riadkov:
```
# Acceptance checklist

Legend: [x] verified by executed test, [~] implemented + code-inspected only,
[ ] pending.

```

### docs/ARCHITECTURE.md
- veƒækos≈•: 4575 B
- riadky: 92
- prv√Ωch 5 riadkov:
```
# Architecture

## Components

```
```

### docs/CMEP_ADAPTER_CONTRACT.md
- veƒækos≈•: 5157 B
- riadky: 98
- prv√Ωch 5 riadkov:
```
# CMEP integration boundary

The adapter is the only place allowed to know about CMEP/waste-platform.
Everything else talks to rooms, transports and tokens. Deny-by-default.

```

### docs/FORENZNA_ANALYZA.md
- veƒækos≈•: 36701 B
- riadky: 1276
- prv√Ωch 5 riadkov:
```
# Forenzn√° anal√Ωza - invent√°r s√∫borov

Vygenerovan√©: 2026-11-17T15:41:54Z
Kore≈à: /data/data/com.termux/files/home/cmep-streaming

```

### docs/LIVE_INSPECTIONS.md
- veƒækos≈•: 8212 B
- riadky: 159
- prv√Ωch 5 riadkov:
```
# CMEP Live Inspections ‚Äî end-to-end integration

Live 1:1 inspection (publisher ‚Üî viewer) between the **CMEP platform**
(FastAPI, `waste-platform`) and the **CMEP Streaming** service (Node.js +
mediasoup). The user never types a token, an offer id, a company id or a room
```

### docs/PORTS.md
- veƒækos≈•: 1555 B
- riadky: 26
- prv√Ωch 5 riadkov:
```
# Port allocation

All loopback by default; every value overridable via `.env`. Chosen to avoid
the running live-prototype (8402‚Äì8405 HTTP, 7020‚Äì7033 recorder, RTC
10000‚Äì59999).
```

### docs/PRODUCTION.md
- veƒækos≈•: 2524 B
- riadky: 44
- prv√Ωch 5 riadkov:
```
# Production readiness gap analysis

What exists today is a hardened development system. This list is the delta to
a deployable production service, split into hard blockers and recommended
work.
```

### docs/PROGRES.md
- veƒækos≈•: 184 B
- riadky: 5
- prv√Ωch 5 riadkov:
```
# PROGRES

| F√°za | Krok | Stav | Commit | D√°tum | Pozn√°mka |
|------|------|------|--------|-------|----------|
| 1 | 1.1 | hotovo | pending | 2026-11-17 | Zalo≈æen√Ω PROGRES.md |
```

### docs/SECURITY_REVIEW.md
- veƒækos≈•: 651 B
- riadky: 9
- prv√Ωch 5 riadkov:
```
# Security review notes

- Signaling must require authenticated identity; unauthenticated operations denied.
- Enforce per-room ACLs, participant limits, schema validation and rate limits.
- Keep credentials, signing secrets, TLS key material and tokens out of webroot, ZIPs, logs and Git.
```

### docs/evidence/browser-test-last.json
- veƒækos≈•: 2860 B
- riadky: 114
- prv√Ωch 5 riadkov:
```
{
  "at": "2026-11-12T00:47:24.386Z",
  "results": [
    {
      "step": "server.healthz",
```

### logs/server.log
- veƒækos≈•: 34212 B
- riadky: 197
- prv√Ωch 5 riadkov:
```
{"time":"2026-11-10T16:12:42.153Z","level":"info","message":"cmep-streaming started","host":"127.0.0.1","port":8504,"nodeEnv":"development","adapter":"local","recorder":false,"pid":28944}
{"time":"2026-11-10T16:32:54.182Z","level":"info","message":"cmep-streaming started","host":"127.0.0.1","port":8504,"nodeEnv":"development","adapter":"local","recorder":false,"pid":27803}
{"time":"2026-11-10T16:33:06.846Z","level":"warn","message":"authenticate error","error":"unauthorized"}
{"time":"2026-11-10T16:33:06.872Z","level":"warn","message":"authenticate error","error":"unauthorized"}
{"time":"2026-11-10T16:33:37.731Z","level":"warn","message":"authenticate error","error":"unauthorized"}
```

### logs/start.out
- veƒækos≈•: 57 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
cmep-streaming started (pid 28944), log: logs/server.log
```

### python/server.py
- veƒækos≈•: 726 B
- riadky: 14
- prv√Ωch 5 riadkov:
```
#!/usr/bin/env python3
"""Loopback-only static development server; webroot is this package's web/ directory."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
```

### recordings/383de1ee-8684-4037-af46-1afe4bd475d2-rec-mwbb7yze-5.flv
- veƒækos≈•: 878020 B
- riadky: 4541
- prv√Ωch 5 riadkov:
```
FLV   	     ;        
onMetaData    duration @0àr∞ ƒú width @t       height @n       videodatarate @ûÑÄ     	framerate @>       videocodecid @       audiodatarate @Wp      audiosamplerate @Áp      audiosamplesize @0       stereo audiocodecid @$       title cmep-recorder encoder Lavf63.1.102 filesize A*Àà      	  F	  .           B¿ˇ· gB¿⁄È®002      y,]@ hŒ<Ä   9         Ø êVÂ      €       Ø‹ Lavc63.1.102 B4ˇˇ˝@˚YE°`ËXZó◊ΩÀûæ<{V´!†ºè9w[]]@m¯‚d‹˜¶ˆˇ·≠‰3=1π≤œC°éºx0œNw…[é•®'∞˜eKk[t„–xÓu6±ë$¢K58‡3ÜÁ(“1¡E™Ãô¿≥ûGqhÆg ßZ7ﬂˇø“˘h7mòÅBΩHü/Æ› yÁoñlÛÕ^V(ª,õ1ª œ9®«é¥"á√©}{‹πÎ„«µj≤»ÛómÆÆ†            Ê	 <           ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä   gB¿⁄È®002      y,]@   hŒ<Ä  ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä  feàÑ†¶ ÄÀí !.Ÿ˚Ωªu∂Ÿ˝o¯‡ %ã ±cøÖ¿ DX 6ß` b  Û’Ìø”nöy1@999999999999998C ´0 ≥ )L– Y ’ÔÌ˝ªa   Ä @¸  ¿:—cßA`ñi,p‡wvœ›ﬂ¿ °:™I?oñã_∆Ó  °:™I?oñã_¿@Ä8^Ü™öfB·.8!B4ëÇ…<$â2n0A&4i"H(v 3à övú EÄ Ck  &◊_›~µÑp @  †â ≤(Jä°DµÈËB¨ ∞` ¿ıÄÎ ¨∞ `z¿uÄ÷t}‹1:>Ó¡÷ XNèªÜË˚∏o˛; Y  É p ≠ %êàî»tÑq¸ 	É!⁄&>ÑÄQQeØ¿A/•mÈÄSk≥Ï Ø¸2  ÖVpQmÄ¯6J€”¶ô(/¢¶#øl 5Ä Éı©ô~»∞ : πÃ  ÄYGƒ	a¯Ãª∏8–p·\∞Nä˘Ö≤À&é#Q◊y&¿¿ç$±aã@yA’˚‡‡)
)sæË¬g'LV¶bãXÔ˙2ô¡”©Ü\D@  fA IbZúíX¿î1Ö d@ @4R’ˇÔ8π‡°)î‡»™#·_xÄRŸ`òÉÄ ÿ(ÏËV®ÁÍÄ≠/P‚Ç·dµß†~  0 &@OÁ¬äáêçœ¯Ï   | iÄ∫Ä @H´9RzØË»Ä z‡∑$!¡≠∆…¢ 0¿÷`d\GØº ÿˇ˚Ä!F^˙Î`®y>µÅ‘·ß¨v0\[0`   7@%≠ÂY'±Ó‡≈kÕzƒ∂vƒ¨ bd∏»á8≥˜‡DÄ’ö #°ªˇﬁpJ Ót®¬ÒÂÈ^BO Mb‹∂ˇD∏èŒzçú @4FéÀ uôˇqò¿"ˇZ‚$øÀ SVh µü˛aêÄM'ó@Í-ÅTÄ@Í;@ @l   A©r yŸ•∆Ä
ç˙; >»Ä z‡∑!¡µ∆»”ˆ:|k8   ;oÏ]0®e>U!˜Éo5Ìÿ∞’∂& ¡êÌB@(®≤÷¿  · ò7[RS‡ ó“∂Ù¿)µŸˆ W@ ØB:≤©Á8Ã`ØÉ√‰I~⁄@H¿  RA¥Ú+À@rx0¯d 
≠‡<‡¢€ 7 ‡  0  0PTO¬â[zt”%ÙTƒw‡ Ä 	C¿ —]\2ê1xàp πÄ Ä H¯Å,?ÄWw :+ñ	—_0∂i\Õ¬aä!Ç‚è$√ò§Çñ,1h(:ø}@0\IˆbZM)Ò   ¶ ‡"X``≤â¿$LË‡º'?˚àà  Ã» 	 ,KSíKÄ∆0† ,à äZø˝Á 7< /Â2úBÑ~ú+Ô
```

### recordings/5d0457cb-0b39-4435-ac1c-b12c599407a1-rec-mwctvp2f-2.flv
- veƒækos≈•: 907421 B
- riadky: 4883
- prv√Ωch 5 riadkov:
```
FLV   	     ;        
onMetaData    duration @-€•„S˜œ width @t       height @n       videodatarate @ûÑÄ     	framerate @>       videocodecid @       audiodatarate @Wp      audiosamplerate @Áp      audiosamplesize @0       stereo audiocodecid @$       title cmep-recorder encoder Lavf63.1.102 filesize A+±:      	  F	  .           B¿ˇ· gB¿⁄È®002      y,]@ hŒ<Ä   9         Ø êVÂ      …       Ø‹ Lavc63.1.102 B4ˇˇ‰ Î1àÑ—tfà√£a;˘Â5øl®õÈSzÀÉJpqœ´§û¡π˙´ÓÂ÷XÒÈƒ}Mv§˚˝ÑRW«!2u_^S¢í»Ûû˝ö:FÔ4∂∂ª/˙wÌÏ?ÁÂ-†oÈæå÷Ô-= è2ERmo»dAyw—öñMòÑ_‚˘BYòàXÛgs
ﬂD!—¯Ù^âﬂœ)≠˚eDﬂJõ÷\SÄıdÄ      8   ‘	 Ó           ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä   gB¿⁄È®002      y,]@   hŒ<Ä  ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä  ˝eàÑ†¶  `   ›ªdÒ„.\®L l˝›˝¸˝˝˝˝˛ﬂ¿	 TD ,( ±<≥—Ëp ≈é X±¯   )  Å∞  ÜÆ@˛Í7 –@‹A‘Ä …ÈÈ¶   ¸ <:ŒàƒpŒÇ_ A6 Ê  †  Å   & 	  !/ `  ñ ≤√Ä Äò %Ä Ñl≤bÄ2rrrrrrrrrrrrrrpÜ 5≠Ä ä® õUÄ áÿ AØ}ÔˆÁ·‡%ÅI©üüΩ˝∑˜˜˚≠˛±ÿ ‡  §   P	F¿«P} ÿ@∏ 	‚◊	T`  ¿2¬o~åG@;u•!É πYÄŒH 0 K €ä™™ ¿ A, #n(p  ∞ ç∏;|ˆ?˚c˛; d Å¿ @.¥ ñ@J"S!“ƒoÄÄ¡0d;D«–ê
*,µ¯à%Ù≠Ω0
mv}ÄˇÜ@`  ™ﬁŒ
```

### recordings/618b9c93-eeb0-4b2d-9896-ca32c9a66622-rec-mwbwm0ww-1.flv
- veƒækos≈•: 915469 B
- riadky: 4809
- prv√Ωch 5 riadkov:
```
FLV   	     ;        
onMetaData    duration @-íÒ©˚Ám width @t       height @n       videodatarate @ûÑÄ     	framerate @>       videocodecid @       audiodatarate @Wp      audiosamplerate @Áp      audiosamplesize @0       stereo audiocodecid @$       title cmep-recorder encoder Lavf63.1.102 filesize A+      	  F	  .           B¿ˇ· gB¿⁄È®002      y,]@ hŒ<Ä   9         Ø êVÂ      ≥       Ø‹ Lavc63.1.102 BSüˇˇ ÷÷2BÅ“u
MTïû[∫ëJπéŸﬁq]{q'¨e"Lhó«ùŒ§¿å@ÄÔø"˚Ü≠ÒÀª>å|¡‰àl«`MΩ◊•4≈Œ˙t1„VPu~ÿÙﬂ7ç}L(Ÿ€6vÏ‘-èrÃT›˘^åÆa›“izçºi/ §€´Ä%áì√®Rj§¨Ú›‘äUÃvªŒ)ÌƒúJ∞      ‡   æ	 ∞           ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä   gB¿⁄È®002      y,]@   hŒ<Ä  ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä  äeàÑ†¶  Ä  2 hÒ1º\.‡#õ¿H  ?æ 1B_e#Fí""Ö"Gˇ °/≤ë£IBë  80≈	}îçHàäâ4 ¿mƒÎ¢<^.Ó 07"t≈5|>º^-é X±¿ K?  ‡ B  ` P|˝Ä*¿≠ $≈‡ ° `"
x÷Qªï,6ÚΩN ¿(OEÌ)ÜêçÀà  Åå † +Ü/á  J ôa¿ @ƒ Ä @¶X4Ï≠Ud‰‰‰‰‰‰‰‰‰‰‰‰‰‰‰· k[ – >´ 0 ä=^˛ﬂﬁ„ÉÇwªﬂl˛≥ˆ¯Ï  Ä A Ä 
¬–¨BÖVÖ† ì 	ê qÜ(Y‘,YGƒˇT´Ä0
```

### recordings/69b3228d-6c28-4004-ba6a-72827c7d3746-rec-mwbb6rz2-4.flv
- veƒækos≈•: 875830 B
- riadky: 4419
- prv√Ωch 5 riadkov:
```
FLV   	     ;        
onMetaData    duration @0{"–Â`B width @t       height @n       videodatarate @ûÑÄ     	framerate @>       videocodecid @       audiodatarate @Wp      audiosamplerate @Áp      audiosamplesize @0       stereo audiocodecid @$       title cmep-recorder encoder Lavf63.1.102 filesize A*∫l      	  F	  .           B¿ˇ· gB¿⁄È®002      y,]@ hŒ<Ä   9         Ø êVÂ      È       Ø‹ Lavc63.1.102 B4ˇˇˇ¿	[[OBÅ—t°÷≤'Hî’U‘UÓKvuiC‚Ùûœ◊wÚ|ä>øOsß◊ÔÆ!∆s’ê∆‹pßz√˝¶[3U®^˛¢˝±ˇù3îÂª´)ÏËjjˇˆπ'Ã,πûu+≤K?ÆñxªglÎ…?dçˇ$Í0 ã:[Â†ØŒÔ*H0 YO˘$X˘¬ Go˛†@ ≥«¶ˇıC:ÆÄ ﬂ>ŒE#Ωà≈˝%§¿Jè¥>áJk"tâMU]E^‰∑ai@          Ä   Ù	 <           ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä   gB¿⁄È®002      y,]@   hŒ<Ä  ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä  feàÑ†¶ ÄÀí !.Ÿ˚Ωªu∂Ÿ˝o¯‡ %ã ±cøÖ¿ DX 6ß` b  Û’Ìø”nöy1@999999999999998C ´0 ≥ )L– Y ’ÔÌ˝ªa   Ä @¸  ¿:—cßA`ñi,p‡wvœ›ﬂ¿ °:™I?oñã_∆Ó  °:™I?oñã_¿@Ä8^Ü™öfB·.8!B4ëÇ…<$â2n0A&4i"H(v 3à övú EÄ Ck  &◊_›~µÑp @  †â ≤(Jä°DµÈËB¨ ∞` ¿ıÄÎ ¨∞ `z¿uÄ÷t}‹1:>Ó¡÷ XNèªÜË˚∏o˛; Y  É p ≠ %êàî»tÑq¸ 	É!⁄&>ÑÄQQeØ¿A/•mÈÄSk≥Ï Ø¸2  ÖVpQmÄ¯6J€”¶ô(/¢¶#øl 5Ä Éı©ô~»∞ : πÃ  ÄYGƒ	a¯Ãª∏8–p·\∞Nä˘Ö≤À&é#Q◊y&¿¿ç$±aã@yA’˚‡‡)
)sæË¬g'LV¶bãXÔ˙2ô¡”©Ü\D@  fA IbZúíX¿î1Ö d@ @4R’ˇÔ8π‡°)î‡»™#·_xÄRŸ`òÉÄ ÿ(ÏËV®ÁÍÄ≠/P‚Ç·dµß†~  0 &@OÁ¬äáêçœ¯Ï   | iÄ∫Ä @H´9RzØË»Ä z‡∑$!¡≠∆…¢ 0¿÷`d\GØº ÿˇ˚Ä!F^˙Î`®y>µÅ‘·ß¨v0\[0`   7@%≠ÂY'±Ó‡≈kÕzƒ∂vƒ¨ bd∏»á8≥˜‡DÄ’ö #°ªˇﬁpJ Ót®¬ÒÂÈ^BO Mb‹∂ˇD∏èŒzçú @4FéÀ uôˇqò¿"ˇZ‚$øÀ SVh µü˛aêÄM'ó@Í-ÅTÄ@Í;@ @l   A©r yŸ•∆Ä
ç˙; >»Ä z‡∑!¡µ∆»”ˆ:|k8   ;oÏ]0®e>U!˜Éo5Ìÿ∞’∂& ¡êÌB@(®≤÷¿  · ò7[RS‡ ó“∂Ù¿)µŸˆ W@ ØB:≤©Á8Ã`ØÉ√‰I~⁄@H¿  RA¥Ú+À@rx0¯d 
≠‡<‡¢€ 7 ‡  0  0PTO¬â[zt”%ÙTƒw‡ Ä 	C¿ —]\2ê1xàp πÄ Ä H¯Å,?ÄWw :+ñ	—_0∂i\Õ¬aä!Ç‚è$√ò§Çñ,1h(:ø}@0\IˆbZM)Ò   ¶ ‡"X``≤â¿$LË‡º'?˚àà  Ã» 	 ,KSíKÄ∆0† ,à äZø˝Á 7< /Â2úBÑ~ú+Ô
```

### recordings/af8073da-892c-452a-aa9b-c6e1596f71fd-rec-mwctundq-1.flv
- veƒækos≈•: 950556 B
- riadky: 4986
- prv√Ωch 5 riadkov:
```
FLV   	     ;        
onMetaData    duration @1¡$›/ width @t       height @n       videodatarate @ûÑÄ     	framerate @>       videocodecid @       audiodatarate @Wp      audiosamplerate @Áp      audiosamplesize @0       stereo audiocodecid @$       title cmep-recorder encoder Lavf63.1.102 filesize A-8      	  F	  .           B¿ˇ· gB¿⁄È®002      y,]@ hŒ<Ä   9         Ø êVÂ      ≥       Ø‹ Lavc63.1.102 B3üˇˇ µ#B!—àu3Á‡Ã‚ËC/5ñ¸Ø{M^,z@ﬁŸˇ≈wfhéˇÚˇ∞÷t7ú}pìËÓ÷«ÕÏz7”XÆú$Ûè¢ÜÖŸ%oõ√wÅJpÂÅóÛ˝y!)nK<kŸb®Ä ]≥Â˝ÜvÎˇòe≥„˜Ä˘Ë¸>@Öh|:?£¬Ê|¸ú]eÊ≤ﬂè{M^      ¿   æ	 º           ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä   gB¿⁄È®002      y,]@   hŒ<Ä  ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä  
eàÑ†¶ ∞»ê  çÓÓÌ∂€gıø„Ä òåp è¿˛. :  #)9‡ G  PÕÊ€˙iÈßììììììììììììììììÑ0≠l ¿ @Ú¨  @`ı{˚˝Á·Äî9†EeÁÔl˛Ï˛ı«`8Ä ègK¿ G8 d¥ §Ìu˝◊ÎXG    H  ¡`i⁄ÉÑ»Ωâ$ë4  ∞÷âÄ ÄXkƒ¿ @$ÎâÄ ÄXkƒ¿ @, µÄˆîøﬁ¡Úó‡`‚`   Z¿Ä∑∞|•¯Åo`˘K0¯Ïd  †  /Z {@9*ìÍ"«¯ 8ÅÌ	£&Vaså$öñÔ∏√_@ø‡–prU∞€Ikt _‡ÿQ¨oOûl¿˛Àöé˝∞ Ï
  	?˚s≥^d < RÊ  ÄP∞õB∏PÄ%øìÄÅAC;d≠%ÛÊòŒúå ¬ò)œ,IFû¿¿Õ,—°À¿>†Ó˝pBålG+^(z"Ô«SÔkB9⁄ıC¡n:ü8D@  'cÄiA¬€îX¿JéqÄ  L 	∆Ó_˛ÛÄÄƒÉÖá=¶SÉ*∏fè¿¬ìx†shÕ†√†¿YGAß‚'ïßøWÄêc:n‡í√a‘∂" ?   @ .@u  ∞ö ù–ÑÄ P ¿ @&à° âl;YK¨˙Ä‡ø!l˙YMá◊ªf∞Ä%”£bΩˇ`'Ô‹ ÖYõÎÓÉ`≤çãÅ$‡€÷î^5ò0 ‡T÷]le∂ù‹≠$Ú^-–82’∫-h@vn&«≈<¸¿'ˇ¿Ñ@=ßÄ Ä .=v˛ÛÇQÄ⁄“£ÃBåS?Öﬁ «ÄH∂¯1≈«0ò˚†,%x hd›*{Æ ≥S˛„1Ä"ˇZ`°:o√EàÄ
{M   TzÏ?˚¡Å ÄßÄÒnpcè„¬sËÏ  T JÄ¡	ˆÄœÄœ˛M@p_ê∂m,¶√Î›∞·ßÏt0~k∏  `√6ãWT6(Ã®¯1ZIÂ¥[†heØtZ ¿àväÑ—ì´0π∞ Ä @òX6,kj| c&•ª¶ÅŒ0◊–-∞  ´–ØÄÜ÷% [≥å∆ ç˝x§Èö &` 5‡E\ãÙ‡ÆœÉÄ3í≠Üÿ:K[† Ä   ‡plO¬çcz|Ûfˆ\‘#¯ Ä  í   ∫dÏƒ&ÿ≥b@ πÄ Ä áî,&–Æ†	o‰‡†PPﬁŸ+I}π¶3ß#0¶
```

### recordings/d4651816-e08f-460a-87d7-f4c5a415f799-rec-mwbwo7np-1.flv
- veƒækos≈•: 906134 B
- riadky: 4739
- prv√Ωch 5 riadkov:
```
FLV   	     ;        
onMetaData    duration @-ÁÔù≤- width @t       height @n       videodatarate @ûÑÄ     	framerate @>       videocodecid @       audiodatarate @Wp      audiosamplerate @Áp      audiosamplesize @0       stereo audiocodecid @$       title cmep-recorder encoder Lavf63.1.102 filesize A+ß,      	  F	  .           B¿ˇ· gB¿⁄È®002      y,]@ hŒ<Ä   9         Ø êVÂ      Œ       Ø‹ Lavc63.1.102 BTˇˇÙ Î[B¡–¿t,-
Nø¯Æ¯´ÕL„ôSUUs!∑ó%M‘çs°ÿ{ècrLY( Qï
£õ‰óe0fk*©@(Ç™™à»∂Jæ5"™ûo™•9™ûo=ŸB,¢Åu
•¶Á,Yö‹Ö¿¿N8%ÌˆÂ0hK3ïN…T@{˙ß;zôÁRaÄ∫ÖPÙáÎ›-Òáá√°Òh|:uˇ≈w≈^jg ö™´ôºB*Fπ–      ¿   Ÿ	 S           ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä   gB¿⁄È®002      y,]@   hŒ<Ä  ]ˇˇY‹EÈΩÊŸH∑ñ,ÿ Ÿ#ÓÔx264 - core 164 - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=0 ref=1 deblock=0:0:0 analyse=0:0 me=dia subme=0 psy=1 psy_rd=1.00:0.00 mixed_ref=0 me_range=16 chroma_me=1 trellis=0 8x8dct=0 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=0 threads=3 lookahead_threads=3 sliced_threads=1 slices=3 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=0 weightp=0 keyint=60 keyint_min=6 scenecut=0 intra_refresh=0 rc=abr mbtree=0 bitrate=2000 ratetol=1.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=0 Ä  	eàÑ†¶ ÄÚ@s¿ M¿'ªüø∂~€˚˚˚˚¯‡ &◊ ⁄„ªƒ† %$ J’H wÄ Zı{ß¶ù7M4”Lúúúúúúúúúúúúúúúú!Äô&` !Ê ô† !2 ´ﬂ€˚v«‡ ÂÄ óªﬂtL_qÿ Ω≥ +e )  VH ‹M⁄ÎcU≠UUB8   *  É–  pï¥\Çòæî}>Öê Ä∫¿p\ 
```

### runtime/browser-test-last.json
- veƒækos≈•: 2860 B
- riadky: 114
- prv√Ωch 5 riadkov:
```
{
  "at": "2026-11-12T00:47:24.386Z",
  "results": [
    {
      "step": "server.healthz",
```

### runtime/last-start.pid
- veƒækos≈•: 5 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
6002
```

### runtime/server.lock
- veƒækos≈•: 30 B
- riadky: 2
- prv√Ωch 5 riadkov:
```
6002
2026-11-12T01:02:32.191Z
```

### runtime/tokens/inspector-owner.publish.url
- veƒækos≈•: 185 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
http://127.0.0.1:8504/publish.html?token=eyJzdWIiOiJpbnNwZWN0b3Itb3duZXIiLCJjb21wYW55SWQiOiIiLCJpYXQiOjE3OTQ0NDQzNTcsImV4cCI6MTc5NDQ0Nzk1N30.rOI6g5D8Akau0R-mH0fqLYq-9nEP6OATd3ja7uRGL6o
```

### runtime/tokens/inspector-owner.viewer.url
- veƒækos≈•: 184 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
http://127.0.0.1:8504/viewer.html?token=eyJzdWIiOiJpbnNwZWN0b3Itb3duZXIiLCJjb21wYW55SWQiOiIiLCJpYXQiOjE3OTQ0NDQzNTcsImV4cCI6MTc5NDQ0Nzk1N30.rOI6g5D8Akau0R-mH0fqLYq-9nEP6OATd3ja7uRGL6o
```

### runtime/tokens/inspector-viewer.publish.url
- veƒækos≈•: 186 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
http://127.0.0.1:8504/publish.html?token=eyJzdWIiOiJpbnNwZWN0b3Itdmlld2VyIiwiY29tcGFueUlkIjoiIiwiaWF0IjoxNzk0NDQ0MzU4LCJleHAiOjE3OTQ0NDc5NTh9.aqQj3T6OhmgfIyJ3T26-i7utVDcFRXAHPRSVL5rNfNQ
```

### runtime/tokens/inspector-viewer.viewer.url
- veƒækos≈•: 185 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
http://127.0.0.1:8504/viewer.html?token=eyJzdWIiOiJpbnNwZWN0b3Itdmlld2VyIiwiY29tcGFueUlkIjoiIiwiaWF0IjoxNzk0NDQ0MzU4LCJleHAiOjE3OTQ0NDc5NTh9.aqQj3T6OhmgfIyJ3T26-i7utVDcFRXAHPRSVL5rNfNQ
```

### scripts/browser-test.js
- veƒækos≈•: 16829 B
- riadky: 270
- prv√Ωch 5 riadkov:
```
'use strict';
/* browser-test.js ‚Äî fully automated CMEP 1:1 publisher‚Üîviewer browser test.
 *
 * Drives two ISOLATED Chromium browser contexts over the DevTools protocol
 * (CDP) ‚Äî no Playwright/Puppeteer install required; uses the project's `ws`.
```

### scripts/browser-test.sh
- veƒækos≈•: 1288 B
- riadky: 25
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
# browser-test.sh ‚Äî fully automated 1:1 browser test (publisher‚Üîviewer) via CDP.
#
# Preconditions:
#   1. Server running:  ./scripts/start.sh   (ENABLE_RECORDER=1 recommended ‚Äî
```

### scripts/check-deps.sh
- veƒækos≈•: 346 B
- riadky: 8
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
set -eu
for cmd in node npm python ffmpeg; do if command -v "$cmd" >/dev/null 2>&1; then printf '%-8s %s
' "$cmd" "$(command -v "$cmd")"; else printf '%-8s MISSING
' "$cmd"; fi; done
```

### scripts/diagnose.sh
- veƒækos≈•: 1040 B
- riadky: 22
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
# diagnose.sh ‚Äî read-only diagnostics of the cmep-streaming runtime.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$ROOT/.env" ] && { set -a; . "$ROOT/.env"; set +a; }
```

### scripts/forenzy.sh
- veƒækos≈•: 872 B
- riadky: 34
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/FORENZNA_ANALYZA.md"
```

### scripts/mint-token.sh
- veƒækos≈•: 1950 B
- riadky: 33
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
# mint-token.sh ‚Äî mints a local dev session token and writes the ready-to-open
# URLs into runtime/tokens/ (dir 0700, files 0600). The token is NEVER printed
# to stdout/logs/reports ‚Äî read the URL file locally and paste it into the
# browser. Development only; in production identity comes from CMEP.
```

### scripts/provision-worker.sh
- veƒækos≈•: 1393 B
- riadky: 25
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
# provision-worker.sh ‚Äî provisions the mediasoup worker binary for Termux/Android.
#
# WHY: mediasoup@3.32.2 publishes no android-arm64 prebuilt worker, and the
# local source build fails in Termux because the pip-provisioned meson cannot
```

### scripts/start.sh
- veƒækos≈•: 1275 B
- riadky: 29
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
# start.sh ‚Äî starts the cmep-streaming signaling/HTTP server in the background.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
```

### scripts/status.sh
- veƒækos≈•: 289 B
- riadky: 6
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
set -u
for p in 8402 8404; do
  if command -v curl >/dev/null 2>&1 && [ "$p" = 8404 ]; then curl -fsS "http://127.0.0.1:$p/healthz" || true; echo; fi
  if command -v ss >/dev/null 2>&1; then ss -ltn 2>/dev/null | grep -E ":$p\b" || true; fi
```

### scripts/stop.sh
- veƒækos≈•: 1297 B
- riadky: 28
- prv√Ωch 5 riadkov:
```
#!/data/data/com.termux/files/usr/bin/bash
# stop.sh ‚Äî stops the cmep-streaming server identified via its runtime lock
# (never uses pkill/patterns; exact PID ownership is verified first).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
```

### tools/diag_3f_discover.sh
- veƒækos≈•: 837 B
- riadky: 18
- prv√Ωch 5 riadkov:
```
#!/usr/bin/env bash
set -u
cd "$HOME/cmep-streaming" || exit 1
OUT=deploy/PHASE3F_discovery.txt
{
```

### tools/diag_3f_repeat.sh
- veƒækos≈•: 692 B
- riadky: 19
- prv√Ωch 5 riadkov:
```
#!/usr/bin/env bash
set -u
cd "$HOME/cmep-streaming" || exit 1
: "${TEST_CMD:?Nastav TEST_CMD}"
N="${N:-20}"
```

### tools/diag_3f_window.js
- veƒækos≈•: 2605 B
- riadky: 40
- prv√Ωch 5 riadkov:
```
const { spawn } = require('node:child_process');
const net = require('node:net'); const os = require('node:os');
const fs = require('node:fs'); const path = require('node:path');
const ROOT = path.join(process.env.HOME, 'cmep-streaming');
const WebSocket = require(require.resolve('ws', { paths: [path.join(ROOT, 'backend')] }));
```

### web/app.css
- veƒækos≈•: 243 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
:root{font:16px/1.5 system-ui,sans-serif;color:#17212b;background:#f4f7fa}body{margin:0}main{max-width:760px;margin:8vh auto;padding:2rem;background:white;border-radius:1rem;box-shadow:0 8px 32px #15253612}h1{line-height:1.15}a{color:#075f9b}
```

### web/index.html
- veƒækos≈•: 455 B
- riadky: 1
- prv√Ωch 5 riadkov:
```
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CMEP Live Inspection</title><link rel="stylesheet" href="/app.css"></head><body><main><h1>CMEP Live Inspection</h1><p id="status">Foundation package installed. Signaling and media packages are staged separately.</p><nav><a href="/publish.html">Publisher</a> ¬∑ <a href="/viewer.html">Viewer</a></nav></main></body></html>
```

### web/publish.html
- veƒækos≈•: 1608 B
- riadky: 19
- prv√Ωch 5 riadkov:
```
<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CMEP Live Inspection ‚Äî Publisher</title><link rel="stylesheet" href="/app.css"></head><body><main><h1>Publisher ‚Äî ≈æiv√° obhliadka</h1>
<section><h2>1. Zariadenia</h2>
<label>Kamera <select id="camSel"></select></label>
<label>Mikrof√≥n <select id="micSel"></select></label>
<p><button id="preview">N√°hƒæad kamery</button> <button id="camToggle" disabled>Kamera: ‚Äî</button> <button id="micToggle" disabled>Mikrof√≥n: ‚Äî</button> <button id="stopPreview" disabled>Stop n√°hƒæad</button></p>
```

### web/publish.js
- veƒækos≈•: 14638 B
- riadky: 304
- prv√Ωch 5 riadkov:
```
'use strict';
const stateEl = document.querySelector('#state');
const videoEl = document.querySelector('#local');
const camSel = document.querySelector('#camSel');
const micSel = document.querySelector('#micSel');
```

### web/rpc.js
- veƒækos≈•: 2718 B
- riadky: 60
- prv√Ωch 5 riadkov:
```
'use strict';
class RpcClient {
  constructor(url, opts = {}) {
    this.url = url;
    this.next = 1;
```

### web/vendor/mediasoup-client.min.js
- veƒækos≈•: 233546 B
- riadky: 3
- prv√Ωch 5 riadkov:
```
(()=>{var Mn=Object.create;var{getPrototypeOf:kn,defineProperty:jr,getOwnPropertyNames:On}=Object;var Fr=Object.prototype.hasOwnProperty;function In(e){return this[e]}var jn,Fn,Nn=(e,t,r)=>{var s=e!=null&&typeof e==="object";if(s){var i=t?jn??=new WeakMap:Fn??=new WeakMap,n=i.get(e);if(n)return n}r=e!=null?Mn(kn(e)):{};let a=t||!e||!e.__esModule||!Fr.call(e,"default")?jr(r,"default",{value:e,enumerable:!0}):r;if(e&&typeof e==="object"||typeof e==="function"){for(let o of On(e))if(!Fr.call(a,o))jr(a,o,{get:In.bind(e,o),enumerable:!0})}if(s)i.set(e,a);return a};var C=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var Ar=C(function(dc,Nr){var je=1000,Fe=je*60,Ne=Fe*60,Te=Ne*24,An=Te*7,zn=Te*365.25;Nr.exports=function(e,t){t=t||{};var r=typeof e;if(r==="string"&&e.length>0)return qn(e);else if(r==="number"&&isFinite(e))return t.long?Bn(e):$n(e);throw Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))};function qn(e){if(e=String(e),e.length>100)return;var t=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(!t)return;var r=parseFloat(t[1]),s=(t[2]||"ms").toLowerCase();switch(s){case"years":case"year":case"yrs":case"yr":case"y":return r*zn;case"weeks":case"week":case"w":return r*An;case"days":case"day":case"d":return r*Te;case"hours":case"hour":case"hrs":case"hr":case"h":return r*Ne;case"minutes":case"minute":case"mins":case"min":case"m":return r*Fe;case"seconds":case"second":case"secs":case"sec":case"s":return r*je;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return r;default:return}}function $n(e){var t=Math.abs(e);if(t>=Te)return Math.round(e/Te)+"d";if(t>=Ne)return Math.round(e/Ne)+"h";if(t>=Fe)return Math.round(e/Fe)+"m";if(t>=je)return Math.round(e/je)+"s";return e+"ms"}function Bn(e){var t=Math.abs(e);if(t>=Te)return Ot(e,t,Te,"day");if(t>=Ne)return Ot(e,t,Ne,"hour");if(t>=Fe)return Ot(e,t,Fe,"minute");if(t>=je)return Ot(e,t,je,"second");return e+" ms"}function Ot(e,t,r,s){var i=t>=r*1.5;return Math.round(e/r)+" "+s+(i?"s":"")}});var qr=C(function(pc,zr){function Vn(e){r.debug=r,r.default=r,r.coerce=c,r.disable=a,r.enable=i,r.enabled=o,r.humanize=Ar(),r.destroy=d,Object.keys(e).forEach((l)=>{r[l]=e[l]}),r.names=[],r.skips=[],r.formatters={};function t(l){let p=0;for(let u=0;u<l.length;u++)p=(p<<5)-p+l.charCodeAt(u),p|=0;return r.colors[Math.abs(p)%r.colors.length]}r.selectColor=t;function r(l){let p,u=null,h,f;function m(...w){if(!m.enabled)return;let T=m,U=Number(new Date),L=U-(p||U);if(T.diff=L,T.prev=p,T.curr=U,p=U,w[0]=r.coerce(w[0]),typeof w[0]!=="string")w.unshift("%O");let Oe=0;w[0]=w[0].replace(/%([a-zA-Z%])/g,(Ie,kt)=>{if(Ie==="%%")return"%";Oe++;let fe=r.formatters[kt];if(typeof fe==="function"){let me=w[Oe];Ie=fe.call(T,me),w.splice(Oe,1),Oe--}return Ie}),r.formatArgs.call(T,w),(T.log||r.log).apply(T,w)}if(m.namespace=l,m.useColors=r.useColors(),m.color=r.selectColor(l),m.extend=s,m.destroy=r.destroy,Object.defineProperty(m,"enabled",{enumerable:!0,configurable:!1,get:()=>{if(u!==null)return u;if(h!==r.namespaces)h=r.namespaces,f=r.enabled(l);return f},set:(w)=>{u=w}}),typeof r.init==="function")r.init(m);return m}function s(l,p){let u=r(this.namespace+(typeof p>"u"?":":p)+l);return u.log=this.log,u}function i(l){r.save(l),r.namespaces=l,r.names=[],r.skips=[];let p=(typeof l==="string"?l:"").trim().replace(/\s+/g,",").split(",").filter(Boolean);for(let u of p)if(u[0]==="-")r.skips.push(u.slice(1));else r.names.push(u)}function n(l,p){let u=0,h=0,f=-1,m=0;while(u<l.length)if(h<p.length&&(p[h]===l[u]||p[h]==="*"))if(p[h]==="*")f=h,m=u,h++;else u++,h++;else if(f!==-1)h=f+1,m++,u=m;else return!1;while(h<p.length&&p[h]==="*")h++;return h===p.length}function a(){let l=[...r.names,...r.skips.map((p)=>"-"+p)].join(",");return r.enable(""),l}function o(l){for(let p of r.skips)if(n(l,p))return!1;for(let p of r.names)if(n(l,p))return!0;return!1}function c(l){if(l instanceof Error)return l.stack||l.message;return l}function d(){console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")}return r.enable(r.load()),r}zr.exports=Vn});var ct=C(function(N,It){N.formatArgs=Kn;N.save=Hn;N.load=Gn;N.useColors=Un;N.storage=Qn();N.destroy=(()=>{let e=!1;return()=>{if(!e)e=!0,console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")}})();N.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"];function Un(){if(typeof window<"u"&&window.process&&(window.process.type==="renderer"||window.process.__nwjs))return!0;if(typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))return!1;let e;return typeof document<"u"&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||typeof window<"u"&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||typeof navigator<"u"&&navigator.userAgent&&(e=navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/))&&parseInt(e[1],10)>=31||typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)}function Kn(e){if(e[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+e[0]+(this.useColors?"%c ":" ")+"+"+It.exports.humanize(this.diff),!this.useColors)return;let t="color: "+this.color;e.splice(1,0,t,"color: inherit");let r=0,s=0;e[0].replace(/%[a-zA-Z%]/g,(i)=>{if(i==="%%")return;if(r++,i==="%c")s=r}),e.splice(s,0,t)}N.log=console.debug||console.log||(()=>{});function Hn(e){try{if(e)N.storage.setItem("debug",e);else N.storage.removeItem("debug")}catch(t){}}function Gn(){let e;try{e=N.storage.getItem("debug")||N.storage.getItem("DEBUG")}catch(t){}if(!e&&typeof process<"u"&&"env"in process)e=process.env.DEBUG;return e}function Qn(){try{return localStorage}catch(e){}}It.exports=qr()(N);var{formatters:Wn}=It.exports;Wn.j=function(e){try{return JSON.stringify(e)}catch(t){return"[UnexpectedJSONParseError]: "+t.message}}});var Br=C(function($r){Object.defineProperty($r,"__esModule",{value:!0})});var I=C(function(qe){var Jn=qe&&qe.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(qe,"__esModule",{value:!0});qe.Logger=void 0;var Ae=Jn(ct()),ze="mediasoup-client";class Vr{_debug;_warn;_error;constructor(e){if(e)this._debug=(0,Ae.default)(`${ze}:${e}`),this._warn=(0,Ae.default)(`${ze}:WARN:${e}`),this._error=(0,Ae.default)(`${ze}:ERROR:${e}`);else this._debug=(0,Ae.default)(ze),this._warn=(0,Ae.default)(`${ze}:WARN`),this._error=(0,Ae.default)(`${ze}:ERROR`);this._debug.log=console.info.bind(console),this._warn.log=console.warn.bind(console),this._error.log=console.error.bind(console)}get debug(){return this._debug}get warn(){return this._warn}get error(){return this._error}}qe.Logger=Vr});var es=C(function(hc,gr){var $e=typeof Reflect==="object"?Reflect:null,Ur=$e&&typeof $e.apply==="function"?$e.apply:function(t,r,s){return Function.prototype.apply.call(t,r,s)},jt;if($e&&typeof $e.ownKeys==="function")jt=$e.ownKeys;else if(Object.getOwnPropertySymbols)jt=function(t){return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))};else jt=function(t){return Object.getOwnPropertyNames(t)};function Yn(e){if(console&&console.warn)console.warn(e)}var Hr=Number.isNaN||function(t){return t!==t};function x(){x.init.call(this)}gr.exports=x;gr.exports.once=ta;x.EventEmitter=x;x.prototype._events=void 0;x.prototype._eventsCount=0;x.prototype._maxListeners=void 0;var Kr=10;function Ft(e){if(typeof e!=="function")throw TypeError('The "listener" argument must be of type Function. Received type '+typeof e)}Object.defineProperty(x,"defaultMaxListeners",{enumerable:!0,get:function(){return Kr},set:function(e){if(typeof e!=="number"||e<0||Hr(e))throw RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+e+".");Kr=e}});x.init=function(){if(this._events===void 0||this._events===Object.getPrototypeOf(this)._events)this._events=Object.create(null),this._eventsCount=0;this._maxListeners=this._maxListeners||void 0};x.prototype.setMaxListeners=function(t){if(typeof t!=="number"||t<0||Hr(t))throw RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+t+".");return this._maxListeners=t,this};function Gr(e){if(e._maxListeners===void 0)return x.defaultMaxListeners;return e._maxListeners}x.prototype.getMaxListeners=function(){return Gr(this)};x.prototype.emit=function(t){var r=[];for(var s=1;s<arguments.length;s++)r.push(arguments[s]);var i=t==="error",n=this._events;if(n!==void 0)i=i&&n.error===void 0;else if(!i)return!1;if(i){var a;if(r.length>0)a=r[0];if(a instanceof Error)throw a;var o=Error("Unhandled error."+(a?" ("+a.message+")":""));throw o.context=a,o}var c=n[t];if(c===void 0)return!1;if(typeof c==="function")Ur(c,this,r);else{var d=c.length,l=Zr(c,d);for(var s=0;s<d;++s)Ur(l[s],this,r)}return!0};function Qr(e,t,r,s){var i,n,a;if(Ft(r),n=e._events,n===void 0)n=e._events=Object.create(null),e._eventsCount=0;else{if(n.newListener!==void 0)e.emit("newListener",t,r.listener?r.listener:r),n=e._events;a=n[t]}if(a===void 0)a=n[t]=r,++e._eventsCount;else{if(typeof a==="function")a=n[t]=s?[r,a]:[a,r];else if(s)a.unshift(r);else a.push(r);if(i=Gr(e),i>0&&a.length>i&&!a.warned){a.warned=!0;var o=Error("Possible EventEmitter memory leak detected. "+a.length+" "+String(t)+" listeners added. Use emitter.setMaxListeners() to increase limit");o.name="MaxListenersExceededWarning",o.emitter=e,o.type=t,o.count=a.length,Yn(o)}}return e}x.prototype.addListener=function(t,r){return Qr(this,t,r,!1)};x.prototype.on=x.prototype.addListener;x.prototype.prependListener=function(t,r){return Qr(this,t,r,!0)};function Zn(){if(!this.fired){if(this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length===0)return this.listener.call(this.target);return this.listener.apply(this.target,arguments)}}function Wr(e,t,r){var s={fired:!1,wrapFn:void 0,target:e,type:t,listener:r},i=Zn.bind(s);return i.listener=r,s.wrapFn=i,i}x.prototype.once=function(t,r){return Ft(r),this.on(t,Wr(this,t,r)),this};x.prototype.prependOnceListener=function(t,r){return Ft(r),this.prependListener(t,Wr(this,t,r)),this};x.prototype.removeListener=function(t,r){var s,i,n,a,o;if(Ft(r),i=this._events,i===void 0)return this;if(s=i[t],s===void 0)return this;if(s===r||s.listener===r){if(--this._eventsCount===0)this._events=Object.create(null);else if(delete i[t],i.removeListener)this.emit("removeListener",t,s.listener||r)}else if(typeof s!=="function"){n=-1;for(a=s.length-1;a>=0;a--)if(s[a]===r||s[a].listener===r){o=s[a].listener,n=a;break}if(n<0)return this;if(n===0)s.shift();else Xn(s,n);if(s.length===1)i[t]=s[0];if(i.removeListener!==void 0)this.emit("removeListener",t,o||r)}return this};x.prototype.off=x.prototype.removeListener;x.prototype.removeAllListeners=function(t){var r,s,i;if(s=this._events,s===void 0)return this;if(s.removeListener===void 0){if(arguments.length===0)this._events=Object.create(null),this._eventsCount=0;else if(s[t]!==void 0)if(--this._eventsCount===0)this._events=Object.create(null);else delete s[t];return this}if(arguments.length===0){var n=Object.keys(s),a;for(i=0;i<n.length;++i){if(a=n[i],a==="removeListener")continue;this.removeAllListeners(a)}return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if(r=s[t],typeof r==="function")this.removeListener(t,r);else if(r!==void 0)for(i=r.length-1;i>=0;i--)this.removeListener(t,r[i]);return this};function Jr(e,t,r){var s=e._events;if(s===void 0)return[];var i=s[t];if(i===void 0)return[];if(typeof i==="function")return r?[i.listener||i]:[i];return r?ea(i):Zr(i,i.length)}x.prototype.listeners=function(t){return Jr(this,t,!0)};x.prototype.rawListeners=function(t){return Jr(this,t,!1)};x.listenerCount=function(e,t){if(typeof e.listenerCount==="function")return e.listenerCount(t);else return Yr.call(e,t)};x.prototype.listenerCount=Yr;function Yr(e){var t=this._events;if(t!==void 0){var r=t[e];if(typeof r==="function")return 1;else if(r!==void 0)return r.length}return 0}x.prototype.eventNames=function(){return this._eventsCount>0?jt(this._events):[]};function Zr(e,t){var r=Array(t);for(var s=0;s<t;++s)r[s]=e[s];return r}function Xn(e,t){for(;t+1<e.length;t++)e[t]=e[t+1];e.pop()}function ea(e){var t=Array(e.length);for(var r=0;r<t.length;++r)t[r]=e[r].listener||e[r];return t}function ta(e,t){return new Promise(function(r,s){function i(a){e.removeListener(t,n),s(a)}function n(){if(typeof e.removeListener==="function")e.removeListener("error",i);r([].slice.call(arguments))}if(Xr(e,t,n,{once:!0}),t!=="error")ra(e,i,{once:!0})})}function ra(e,t,r){if(typeof e.on==="function")Xr(e,"error",t,r)}function Xr(e,t,r,s){if(typeof e.on==="function")if(s.once)e.once(t,r);else e.on(t,r);else if(typeof e.addEventListener==="function")e.addEventListener(t,function i(n){if(s.once)e.removeEventListener(t,i);r(n)});else throw TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof e)}});var A=C(function(Nt){Object.defineProperty(Nt,"__esModule",{value:!0});Nt.EnhancedEventEmitter=void 0;var ts=es(),rs=I(),sa=new rs.Logger("EnhancedEventEmitter");class ss extends ts.EventEmitter{constructor(){super();this.setMaxListeners(1/0)}close(){super.removeAllListeners()}emit(e,...t){return super.emit(e,...t)}safeEmit(e,...t){try{return super.emit(e,...t)}catch(r){sa.error("safeEmit() | event listener threw an error [eventName:%s]:%o",e,r);try{super.emit("listenererror",e,r)}catch(s){}return Boolean(super.listenerCount(e))}}on(e,t){return super.on(e,t),this}off(e,t){return super.off(e,t),this}addListener(e,t){return super.on(e,t),this}prependListener(e,t){return super.prependListener(e,t),this}once(e,t){return super.once(e,t),this}prependOnceListener(e,t){return super.prependOnceListener(e,t),this}removeListener(e,t){return super.off(e,t),this}removeAllListeners(e){return super.removeAllListeners(e),this}listenerCount(e){return super.listenerCount(e)}listeners(e){return super.listeners(e)}rawListeners(e){return super.rawListeners(e)}}Nt.EnhancedEventEmitter=ss});var H=C(function(Be){Object.defineProperty(Be,"__esModule",{value:!0});Be.InvalidStateError=Be.UnsupportedError=void 0;class _r extends Error{constructor(e){super(e);if(this.name="UnsupportedError",Error.hasOwnProperty("captureStackTrace"))Error.captureStackTrace(this,_r);else this.stack=Error(e).stack}}Be.UnsupportedError=_r;class vr extends Error{constructor(e){super(e);if(this.name="InvalidStateError",Error.hasOwnProperty("captureStackTrace"))Error.captureStackTrace(this,vr);else this.stack=Error(e).stack}}Be.InvalidStateError=vr});var De=C(function(dt){Object.defineProperty(dt,"__esModule",{value:!0});dt.clone=ia;dt.generateRandomNumber=na;dt.deepFreeze=is;function ia(e){if(e===void 0)return;else if(Number.isNaN(e))return NaN;else if(typeof structuredClone==="function")return structuredClone(e);else return JSON.parse(JSON.stringify(e))}function na(){return Math.round(Math.random()*1e7)}function is(e){let t=Reflect.ownKeys(e);for(let r of t){let s=e[r];if(s&&typeof s==="object"||typeof s==="function")is(s)}return Object.freeze(e)}});var as=C(function(Ke){var aa=Ke&&Ke.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(Ke,"__esModule",{value:!0});Ke.Logger=void 0;var Ve=aa(ct()),Ue="h264-profile-level-id";class ns{_debug;_warn;_error;constructor(e){if(e)this._debug=(0,Ve.default)(`${Ue}:${e}`),this._warn=(0,Ve.default)(`${Ue}:WARN:${e}`),this._error=(0,Ve.default)(`${Ue}:ERROR:${e}`);else this._debug=(0,Ve.default)(Ue),this._warn=(0,Ve.default)(`${Ue}:WARN`),this._error=(0,Ve.default)(`${Ue}:ERROR`);this._debug.log=console.info.bind(console),this._warn.log=console.warn.bind(console),this._error.log=console.error.bind(console)}get debug(){return this._debug}get warn(){return this._warn}get error(){return this._error}}Ke.Logger=ns});var hs=C(function(O){Object.defineProperty(O,"__esModule",{value:!0});O.ProfileLevelId=O.Level=O.Profile=void 0;O.parseProfileLevelId=ls;O.profileLevelIdToString=us;O.profileToString=da;O.levelToString=pa;O.parseSdpProfileLevelId=xe;O.isSameProfile=la;O.isSameProfileAndLevel=ua;O.generateProfileLevelIdStringForAnswer=ha;O.supportedLevel=fa;var ps=as(),Y=new ps.Logger,P;(function(e){e[e.ConstrainedBaseline=1]="ConstrainedBaseline",e[e.Baseline=2]="Baseline",e[e.Main=3]="Main",e[e.ConstrainedHigh=4]="ConstrainedHigh",e[e.High=5]="High",e[e.PredictiveHigh444=6]="PredictiveHigh444"})(P||(O.Profile=P={}));var g;(function(e){e[e.L1_b=0]="L1_b",e[e.L1=10]="L1",e[e.L1_1=11]="L1_1",e[e.L1_2=12]="L1_2",e[e.L1_3=13]="L1_3",e[e.L2=20]="L2",e[e.L2_1=21]="L2_1",e[e.L2_2=22]="L2_2",e[e.L3=30]="L3",e[e.L3_1=31]="L3_1",e[e.L3_2=32]="L3_2",e[e.L4=40]="L4",e[e.L4_1=41]="L4_1",e[e.L4_2=42]="L4_2",e[e.L5=50]="L5",e[e.L5_1=51]="L5_1",e[e.L5_2=52]="L5_2"})(g||(O.Level=g={}));class pt{profile;level;constructor(e,t){this.profile=e,this.level=t}}O.ProfileLevelId=pt;var oa=new pt(P.ConstrainedBaseline,g.L3_1);class ee{mask;masked_value;constructor(e){this.mask=~cs("x",e),this.masked_value=cs("1",e)}isMatch(e){return this.masked_value===(e&this.mask)}}class te{profile_idc;profile_iop;profile;constructor(e,t,r){this.profile_idc=e,this.profile_iop=t,this.profile=r}}var ca=[new te(66,new ee("x1xx0000"),P.ConstrainedBaseline),new te(77,new ee("1xxx0000"),P.ConstrainedBaseline),new te(88,new ee("11xx0000"),P.ConstrainedBaseline),new te(66,new ee("x0xx0000"),P.Baseline),new te(88,new ee("10xx0000"),P.Baseline),new te(77,new ee("0x0x0000"),P.Main),new te(100,new ee("00000000"),P.High),new te(100,new ee("00001100"),P.ConstrainedHigh),new te(244,new ee("00000000"),P.PredictiveHigh444)],os=[{max_macroblocks_per_second:1485,max_macroblock_frame_size:99,level:g.L1},{max_macroblocks_per_second:1485,max_macroblock_frame_size:99,level:g.L1_b},{max_macroblocks_per_second:3000,max_macroblock_frame_size:396,level:g.L1_1},{max_macroblocks_per_second:6000,max_macroblock_frame_size:396,level:g.L1_2},{max_macroblocks_per_second:11880,max_macroblock_frame_size:396,level:g.L1_3},{max_macroblocks_per_second:11880,max_macroblock_frame_size:396,level:g.L2},{max_macroblocks_per_second:19800,max_macroblock_frame_size:792,level:g.L2_1},{max_macroblocks_per_second:20250,max_macroblock_frame_size:1620,level:g.L2_2},{max_macroblocks_per_second:40500,max_macroblock_frame_size:1620,level:g.L3},{max_macroblocks_per_second:108000,max_macroblock_frame_size:3600,level:g.L3_1},{max_macroblocks_per_second:216000,max_macroblock_frame_size:5120,level:g.L3_2},{max_macroblocks_per_second:245760,max_macroblock_frame_size:8192,level:g.L4},{max_macroblocks_per_second:245760,max_macroblock_frame_size:8192,level:g.L4_1},{max_macroblocks_per_second:522240,max_macroblock_frame_size:8704,level:g.L4_2},{max_macroblocks_per_second:589824,max_macroblock_frame_size:22080,level:g.L5},{max_macroblocks_per_second:983040,max_macroblock_frame_size:36864,level:g.L5_1},{max_macroblocks_per_second:2073600,max_macroblock_frame_size:36864,level:g.L5_2}];function ls(e){if(typeof e!=="string"||e.length!==6)return;let r=parseInt(e,16);if(r===0)return;let s=r&255,i=r>>8&255,n=r>>16&255,a;switch(s){case g.L1_1:{a=(i&16)!==0?g.L1_b:g.L1_1;break}case g.L1:case g.L1_2:case g.L1_3:case g.L2:case g.L2_1:case g.L2_2:case g.L3:case g.L3_1:case g.L3_2:case g.L4:case g.L4_1:case g.L4_2:case g.L5:case g.L5_1:case g.L5_2:{a=s;break}default:{Y.warn(`parseProfileLevelId() | unrecognized level_idc [str:${e}, level_idc:${s}]`);return}}for(let o of ca)if(n===o.profile_idc&&o.profile_iop.isMatch(i))return Y.debug(`parseProfileLevelId() | result [str:${e}, profile:${o.profile}, level:${a}]`),new pt(o.profile,a);Y.warn(`parseProfileLevelId() | unrecognized profile_idc/profile_iop combination [str:${e}, profile_idc:${n}, profile_iop:${i}]`);return}function us(e){if(e.level==g.L1_b)switch(e.profile){case P.ConstrainedBaseline:return"42f00b";case P.Baseline:return"42100b";case P.Main:return"4d100b";default:{Y.warn(`profileLevelIdToString() | Level 1_b not is allowed for profile ${e.profile}`);return}}let t;switch(e.profile){case P.ConstrainedBaseline:{t="42e0";break}case P.Baseline:{t="4200";break}case P.Main:{t="4d00";break}case P.ConstrainedHigh:{t="640c";break}case P.High:{t="6400";break}case P.PredictiveHigh444:{t="f400";break}default:{Y.warn(`profileLevelIdToString() | unrecognized profile ${e.profile}`);return}}let r=e.level.toString(16);if(r.length===1)r=`0${r}`;return`${t}${r}`}function da(e){switch(e){case P.ConstrainedBaseline:return"ConstrainedBaseline";case P.Baseline:return"Baseline";case P.Main:return"Main";case P.ConstrainedHigh:return"ConstrainedHigh";case P.High:return"High";case P.PredictiveHigh444:return"PredictiveHigh444";default:{Y.warn(`profileToString() | unrecognized profile ${e}`);return}}}function pa(e){switch(e){case g.L1_b:return"1b";case g.L1:return"1";case g.L1_1:return"1.1";case g.L1_2:return"1.2";case g.L1_3:return"1.3";case g.L2:return"2";case g.L2_1:return"2.1";case g.L2_2:return"2.2";case g.L3:return"3";case g.L3_1:return"3.1";case g.L3_2:return"3.2";case g.L4:return"4";case g.L4_1:return"4.1";case g.L4_2:return"4.2";case g.L5:return"5";case g.L5_1:return"5.1";case g.L5_2:return"5.2";default:{Y.warn(`levelToString() | unrecognized level ${e}`);return}}}function xe(e={}){let t=e["profile-level-id"];return t?ls(t):oa}function la(e={},t={}){let r=xe(e),s=xe(t);return Boolean(r&&r.profile===s?.profile)}function ua(e={},t={}){let r=xe(e),s=xe(t);return Boolean(r&&r.profile===s?.profile&&r.level==s?.level)}function ha(e={},t={}){if(!e["profile-level-id"]&&!t["profile-level-id"]){Y.warn("generateProfileLevelIdStringForAnswer() | profile-level-id missing in local and remote params");return}let r=xe(e),s=xe(t);if(!r)throw TypeError("invalid local_profile_level_id");if(!s)throw TypeError("invalid remote_profile_level_id");if(r.profile!==s.profile)throw TypeError("H264 Profile mismatch");let i=ds(e)&&ds(t),n=r.level,a=s.level,o=ga(n,a),c=i?n:o;return Y.debug(`generateProfileLevelIdStringForAnswer() | result [profile:${r.profile}, level:${c}]`),us(new pt(r.profile,c))}function fa(e,t){for(let s=os.length-1;s>=0;--s){let i=os[s];if(i.max_macroblock_frame_size*256<=e&&i.max_macroblocks_per_second<=t*i.max_macroblock_frame_size)return Y.debug(`supportedLevel() | result [max_frame_pixel_count:${e}, max_fps:${t}, level:${i.level}]`),i.level}Y.warn(`supportedLevel() | no level supported [max_frame_pixel_count:${e}, max_fps:${t}]`);return}function cs(e,t){return Number(t[0]===e)<<7|Number(t[1]===e)<<6|Number(t[2]===e)<<5|Number(t[3]===e)<<4|Number(t[4]===e)<<3|Number(t[5]===e)<<2|Number(t[6]===e)<<1|Number(t[7]===e)<<0}function ma(e,t){if(e===g.L1_b)return t!==g.L1&&t!==g.L1_b;if(t===g.L1_b)return e!==g.L1;return e<t}function ga(e,t){return ma(e,t)?e:t}function ds(e={}){let t=e["level-asymmetry-allowed"];return t===!0||t===1||t==="1"}});var re=C(function(k){var _a=k&&k.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),va=k&&k.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),gs=k&&k.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")_a(r,t,s[i])}return va(r,t),r}}();Object.defineProperty(k,"__esModule",{value:!0});k.validateAndNormalizeRtpCapabilities=Ra;k.validateAndNormalizeRtpParameters=br;k.validateAndNormalizeSctpStreamParameters=Ca;k.getExtendedRtpCapabilities=Ea;k.getRecvRtpCapabilities=Ta;k.getSendRtpCapabilities=Da;k.getSendingRtpParameters=xa;k.getSendingRemoteRtpParameters=Pa;k.reduceCodecs=La;k.generateProbatorRtpParameters=Ma;k.canSend=ka;k.canReceive=Oa;var fs=gs(hs()),wa=gs(De()),ba="probator",ya=1234,Sa=127;function Ra(e){if(typeof e!=="object")throw TypeError("caps is not an object");if(e.codecs&&!Array.isArray(e.codecs))throw TypeError("caps.codecs is not an array");else if(!e.codecs)e.codecs=[];for(let t of e.codecs)Ia(t);if(e.headerExtensions&&!Array.isArray(e.headerExtensions))throw TypeError("caps.headerExtensions is not an array");else if(!e.headerExtensions)e.headerExtensions=[];for(let t of e.headerExtensions)ja(t)}function br(e){if(typeof e!=="object")throw TypeError("params is not an object");if(e.mid&&typeof e.mid!=="string")throw TypeError("params.mid is not a string");if(!Array.isArray(e.codecs))throw TypeError("missing params.codecs");for(let t of e.codecs)Fa(t);if(e.headerExtensions&&!Array.isArray(e.headerExtensions))throw TypeError("params.headerExtensions is not an array");else if(!e.headerExtensions)e.headerExtensions=[];for(let t of e.headerExtensions)Na(t);if(e.encodings&&!Array.isArray(e.encodings))throw TypeError("params.encodings is not an array");else if(!e.encodings)e.encodings=[];for(let t of e.encodings)Aa(t);if(e.rtcp&&typeof e.rtcp!=="object")throw TypeError("params.rtcp is not an object");else if(!e.rtcp)e.rtcp={};za(e.rtcp)}function Ca(e){if(typeof e!=="object")throw TypeError("params is not an object");if(typeof e.streamId!=="number")throw TypeError("missing params.streamId");let t=!1;if(typeof e.ordered==="boolean")t=!0;else e.ordered=!0;if(e.maxPacketLifeTime!==void 0&&typeof e.maxPacketLifeTime!=="number")throw TypeError("invalid params.maxPacketLifeTime");if(e.maxRetransmits!==void 0&&typeof e.maxRetransmits!=="number")throw TypeError("invalid params.maxRetransmits");if(e.maxPacketLifeTime!==void 0&&e.maxRetransmits!==void 0)throw TypeError("cannot provide both maxPacketLifeTime and maxRetransmits");if(t&&e.ordered&&(e.maxPacketLifeTime!==void 0||e.maxRetransmits!==void 0))throw TypeError("cannot be ordered with maxPacketLifeTime or maxRetransmits");else if(!t&&(e.maxPacketLifeTime!==void 0||e.maxRetransmits!==void 0))e.ordered=!1;if(e.label&&typeof e.label!=="string")throw TypeError("invalid params.label");if(e.protocol&&typeof e.protocol!=="string")throw TypeError("invalid params.protocol")}function Ea(e,t,r){let s={codecs:[],headerExtensions:[]};if(r)for(let i of e.codecs??[]){if(He(i))continue;let n=(t.codecs??[]).find((o)=>wr(o,i,{strict:!0,modify:!0}));if(!n)continue;let a={kind:i.kind,mimeType:i.mimeType,clockRate:i.clockRate,channels:i.channels,localPayloadType:i.preferredPayloadType,localRtxPayloadType:void 0,remotePayloadType:n.preferredPayloadType,remoteRtxPayloadType:void 0,localParameters:i.parameters??{},remoteParameters:n.parameters??{},rtcpFeedback:ms(i,n)};s.codecs.push(a)}else for(let i of t.codecs??[]){if(He(i))continue;let n=(e.codecs??[]).find((o)=>wr(o,i,{strict:!0,modify:!0}));if(!n)continue;let a={kind:n.kind,mimeType:n.mimeType,clockRate:n.clockRate,channels:n.channels,localPayloadType:n.preferredPayloadType,localRtxPayloadType:void 0,remotePayloadType:i.preferredPayloadType,remoteRtxPayloadType:void 0,localParameters:n.parameters??{},remoteParameters:i.parameters??{},rtcpFeedback:ms(n,i)};s.codecs.push(a)}for(let i of s.codecs){let n=e.codecs.find((o)=>He(o)&&o.parameters?.apt===i.localPayloadType),a=t.codecs.find((o)=>He(o)&&o.parameters?.apt===i.remotePayloadType);if(n&&a)i.localRtxPayloadType=n.preferredPayloadType,i.remoteRtxPayloadType=a.preferredPayloadType}for(let i of t.headerExtensions){let n=e.headerExtensions.find((o)=>qa(o,i));if(!n)continue;let a={kind:i.kind,uri:i.uri,sendId:n.preferredId,recvId:i.preferredId,encrypt:n.preferredEncrypt??!1,direction:"sendrecv"};switch(i.direction){case"sendrecv":{a.direction="sendrecv";break}case"recvonly":{a.direction="sendonly";break}case"sendonly":{a.direction="recvonly";break}case"inactive":{a.direction="inactive";break}}s.headerExtensions.push(a)}return s}function Ta(e){return vs({direction:"recvonly",extendedRtpCapabilities:e})}function Da(e){return vs({direction:"sendonly",extendedRtpCapabilities:e})}function xa(e,t){let r={mid:void 0,codecs:[],headerExtensions:[],encodings:[],rtcp:{}};for(let s of t.codecs){if(s.kind!==e)continue;let i={mimeType:s.mimeType,payloadType:s.localPayloadType,clockRate:s.clockRate,channels:s.channels,parameters:s.localParameters,rtcpFeedback:s.rtcpFeedback};if(r.codecs.push(i),s.localRtxPayloadType){let n={mimeType:`${s.kind}/rtx`,payloadType:s.localRtxPayloadType,clockRate:s.clockRate,parameters:{apt:s.localPayloadType},rtcpFeedback:[]};r.codecs.push(n)}}for(let s of t.headerExtensions){if(s.kind&&s.kind!==e||s.direction!=="sendrecv"&&s.direction!=="sendonly")continue;let i={uri:s.uri,id:s.sendId,encrypt:s.encrypt,parameters:{}};r.headerExtensions.push(i)}return r}function Pa(e,t){let r={mid:void 0,codecs:[],headerExtensions:[],encodings:[],rtcp:{}};for(let s of t.codecs){if(s.kind!==e)continue;let i={mimeType:s.mimeType,payloadType:s.localPayloadType,clockRate:s.clockRate,channels:s.channels,parameters:s.remoteParameters,rtcpFeedback:s.rtcpFeedback};if(r.codecs.push(i),s.localRtxPayloadType){let n={mimeType:`${s.kind}/rtx`,payloadType:s.localRtxPayloadType,clockRate:s.clockRate,parameters:{apt:s.localPayloadType},rtcpFeedback:[]};r.codecs.push(n)}}for(let s of t.headerExtensions){if(s.kind&&s.kind!==e||s.direction!=="sendrecv"&&s.direction!=="sendonly")continue;let i={uri:s.uri,id:s.sendId,encrypt:s.encrypt,parameters:{}};r.headerExtensions.push(i)}if(r.headerExtensions.some((s)=>s.uri==="http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01"))for(let s of r.codecs)s.rtcpFeedback=(s.rtcpFeedback??[]).filter((i)=>i.type!=="goog-remb");else if(r.headerExtensions.some((s)=>s.uri==="http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time"))for(let s of r.codecs)s.rtcpFeedback=(s.rtcpFeedback??[]).filter((i)=>i.type!=="transport-cc");else for(let s of r.codecs)s.rtcpFeedback=(s.rtcpFeedback??[]).filter((i)=>i.type!=="transport-cc"&&i.type!=="goog-remb");return r}function La(e,t){let r=[];if(!t){if(r.push(e[0]),He(e[1]))r.push(e[1])}else{for(let s=0;s<e.length;++s)if(wr(e[s],t,{strict:!0})){if(r.push(e[s]),He(e[s+1]))r.push(e[s+1]);break}if(r.length===0)throw TypeError("no matching codec found")}return r}function Ma(e){e=wa.clone(e),br(e);let t={mid:ba,codecs:[],headerExtensions:[],encodings:[{ssrc:ya}],rtcp:{cname:"probator"}};return t.codecs.push(e.codecs[0]),t.codecs[0].payloadType=Sa,t.headerExtensions=e.headerExtensions,t}function ka(e,t){return(t.codecs??[]).some((r)=>r.kind===e)}function Oa(e,t){if(br(e),e.codecs.length===0)return!1;let r=e.codecs[0];return(t.codecs??[]).some((s)=>s.preferredPayloadType===r.payloadType)}function Ia(e){let t=new RegExp("^(audio|video)/(.+)","i");if(typeof e!=="object")throw TypeError("codec is not an object");if(!e.mimeType||typeof e.mimeType!=="string")throw TypeError("missing codec.mimeType");let r=t.exec(e.mimeType);if(!r)throw TypeError("invalid codec.mimeType");if(e.kind=r[1].toLowerCase(),typeof e.preferredPayloadType!=="number")throw TypeError("missing codec.preferredPayloadType");if(typeof e.clockRate!=="number")throw TypeError("missing codec.clockRate");if(e.kind==="audio"){if(typeof e.channels!=="number")e.channels=1}else delete e.channels;if(!e.parameters||typeof e.parameters!=="object")e.parameters={};for(let s of Object.keys(e.parameters)){let i=e.parameters[s];if(i===void 0)e.parameters[s]="",i="";if(typeof i!=="string"&&typeof i!=="number")throw TypeError(`invalid codec parameter [key:${s}s, value:${i}]`);if(s==="apt"){if(typeof i!=="number")throw TypeError("invalid codec apt parameter")}}if(!e.rtcpFeedback||!Array.isArray(e.rtcpFeedback))e.rtcpFeedback=[];for(let s of e.rtcpFeedback)_s(s)}function _s(e){if(typeof e!=="object")throw TypeError("fb is not an object");if(!e.type||typeof e.type!=="string")throw TypeError("missing fb.type");if(!e.parameter||typeof e.parameter!=="string")e.parameter=""}function ja(e){if(typeof e!=="object")throw TypeError("ext is not an object");if(e.kind!=="audio"&&e.kind!=="video")throw TypeError("invalid ext.kind");if(!e.uri||typeof e.uri!=="string")throw TypeError("missing ext.uri");if(typeof e.preferredId!=="number")throw TypeError("missing ext.preferredId");if(e.preferredEncrypt&&typeof e.preferredEncrypt!=="boolean")throw TypeError("invalid ext.preferredEncrypt");else if(!e.preferredEncrypt)e.preferredEncrypt=!1;if(e.direction&&typeof e.direction!=="string")throw TypeError("invalid ext.direction");else if(!e.direction)e.direction="sendrecv"}function Fa(e){let t=new RegExp("^(audio|video)/(.+)","i");if(typeof e!=="object")throw TypeError("codec is not an object");if(!e.mimeType||typeof e.mimeType!=="string")throw TypeError("missing codec.mimeType");let r=t.exec(e.mimeType);if(!r)throw TypeError("invalid codec.mimeType");if(typeof e.payloadType!=="number")throw TypeError("missing codec.payloadType");if(typeof e.clockRate!=="number")throw TypeError("missing codec.clockRate");if(r[1].toLowerCase()==="audio"){if(typeof e.channels!=="number")e.channels=1}else delete e.channels;if(!e.parameters||typeof e.parameters!=="object")e.parameters={};for(let i of Object.keys(e.parameters)){let n=e.parameters[i];if(n===void 0)e.parameters[i]="",n="";if(typeof n!=="string"&&typeof n!=="number")throw TypeError(`invalid codec parameter [key:${i}s, value:${n}]`);if(i==="apt"){if(typeof n!=="number")throw TypeError("invalid codec apt parameter")}}if(!e.rtcpFeedback||!Array.isArray(e.rtcpFeedback))e.rtcpFeedback=[];for(let i of e.rtcpFeedback)_s(i)}function Na(e){if(typeof e!=="object")throw TypeError("ext is not an object");if(!e.uri||typeof e.uri!=="string")throw TypeError("missing ext.uri");if(typeof e.id!=="number")throw TypeError("missing ext.id");if(e.encrypt&&typeof e.encrypt!=="boolean")throw TypeError("invalid ext.encrypt");else if(!e.encrypt)e.encrypt=!1;if(!e.parameters||typeof e.parameters!=="object")e.parameters={};for(let t of Object.keys(e.parameters)){let r=e.parameters[t];if(r===void 0)e.parameters[t]="",r="";if(typeof r!=="string"&&typeof r!=="number")throw TypeError("invalid header extension parameter")}}function Aa(e){if(typeof e!=="object")throw TypeError("encoding is not an object");if(e.ssrc&&typeof e.ssrc!=="number")throw TypeError("invalid encoding.ssrc");if(e.rid&&typeof e.rid!=="string")throw TypeError("invalid encoding.rid");if(e.rtx&&typeof e.rtx!=="object")throw TypeError("invalid encoding.rtx");else if(e.rtx){if(typeof e.rtx.ssrc!=="number")throw TypeError("missing encoding.rtx.ssrc")}if(e.scalabilityMode&&typeof e.scalabilityMode!=="string")throw TypeError("invalid encoding.scalabilityMode")}function za(e){if(typeof e!=="object")throw TypeError("rtcp is not an object");if(e.cname&&typeof e.cname!=="string")throw TypeError("invalid rtcp.cname");if(!e.reducedSize||typeof e.reducedSize!=="boolean")e.reducedSize=!0}function vs({direction:e,extendedRtpCapabilities:t}){let r=e==="sendonly",s={codecs:[],headerExtensions:[]};for(let i of t.codecs){let n={kind:i.kind,mimeType:i.mimeType,preferredPayloadType:r?i.localPayloadType:i.remotePayloadType,clockRate:i.clockRate,channels:i.channels,parameters:i.localParameters,rtcpFeedback:i.rtcpFeedback};if(s.codecs.push(n),!i.localRtxPayloadType||!i.remoteRtxPayloadType)continue;let a={kind:i.kind,mimeType:`${i.kind}/rtx`,preferredPayloadType:r?i.localRtxPayloadType:i.remoteRtxPayloadType,clockRate:i.clockRate,parameters:{apt:r?i.localPayloadType:i.remotePayloadType},rtcpFeedback:[]};s.codecs.push(a)}for(let i of t.headerExtensions){if(i.direction!=="sendrecv"&&i.direction!==e)continue;let n={kind:i.kind,uri:i.uri,preferredId:r?i.sendId:i.recvId,preferredEncrypt:i.encrypt??!1,direction:i.direction};s.headerExtensions.push(n)}return s}function He(e){if(!e)return!1;return/.+\/rtx$/i.test(e.mimeType)}function wr(e,t,{strict:r=!1,modify:s=!1}={}){let i=e.mimeType.toLowerCase(),n=t.mimeType.toLowerCase();if(i!==n)return!1;if(e.clockRate!==t.clockRate)return!1;if(e.channels!==t.channels)return!1;switch(i){case"video/h264":{if(r){let a=e.parameters["packetization-mode"]??0,o=t.parameters["packetization-mode"]??0;if(a!==o)return!1;if(!fs.isSameProfile(e.parameters,t.parameters))return!1;let c;try{c=fs.generateProfileLevelIdStringForAnswer(e.parameters,t.parameters)}catch(d){return!1}if(s)if(c)e.parameters["profile-level-id"]=c,t.parameters["profile-level-id"]=c;else delete e.parameters["profile-level-id"],delete t.parameters["profile-level-id"]}break}case"video/vp9":{if(r){let a=e.parameters["profile-id"]??0,o=t.parameters["profile-id"]??0;if(a!==o)return!1}break}}return!0}function qa(e,t){if(e.kind&&t.kind&&e.kind!==t.kind)return!1;if(e.uri!==t.uri)return!1;return!0}function ms(e,t){let r=[];for(let s of e.rtcpFeedback??[]){let i=(t.rtcpFeedback??[]).find((n)=>n.type===s.type&&(n.parameter===s.parameter||!n.parameter&&!s.parameter));if(i)r.push(i)}return r}});var bs=C(function(We){var $a=We&&We.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(We,"__esModule",{value:!0});We.Logger=void 0;var Ge=$a(ct()),Qe="awaitqueue";class ws{_debug;_warn;_error;constructor(e){if(e)this._debug=(0,Ge.default)(`${Qe}:${e}`),this._warn=(0,Ge.default)(`${Qe}:WARN:${e}`),this._error=(0,Ge.default)(`${Qe}:ERROR:${e}`);else this._debug=(0,Ge.default)(Qe),this._warn=(0,Ge.default)(`${Qe}:WARN`),this._error=(0,Ge.default)(`${Qe}:ERROR`);this._debug.log=console.info.bind(console),this._warn.log=console.warn.bind(console),this._error.log=console.error.bind(console)}get debug(){return this._debug}get warn(){return this._warn}get error(){return this._error}}We.Logger=ws});var Rr=C(function(Je){Object.defineProperty(Je,"__esModule",{value:!0});Je.AwaitQueueRemovedTaskError=Je.AwaitQueueStoppedError=void 0;class yr extends Error{constructor(e){super(e??"queue stopped");if(this.name="AwaitQueueStoppedError",typeof Error.captureStackTrace==="function")Error.captureStackTrace(this,yr)}}Je.AwaitQueueStoppedError=yr;class Sr extends Error{constructor(e){super(e??"queue task removed");if(this.name="AwaitQueueRemovedTaskError",typeof Error.captureStackTrace==="function")Error.captureStackTrace(this,Sr)}}Je.AwaitQueueRemovedTaskError=Sr});var Rs=C(function(At){Object.defineProperty(At,"__esModule",{value:!0});At.AwaitQueue=void 0;var ys=bs(),Ye=Rr(),ge=new ys.Logger("AwaitQueue");class Ss{pendingTasks=new Map;nextTaskId=0;constructor(){ge.debug("constructor()")}get size(){return this.pendingTasks.size}async push(e,t,r){if(t=t??e.name,ge.debug(`push() [name:${t}, options:%o]`,r),typeof e!=="function")throw TypeError("given task is not a function");if(t)try{Object.defineProperty(e,"name",{value:t})}catch(s){}return new Promise((s,i)=>{if(t&&r?.removeOngoingTasksWithSameName){for(let a of this.pendingTasks.values())if(a.name===t)a.reject(new Ye.AwaitQueueRemovedTaskError,{canExecuteNextTask:!1})}let n={id:this.nextTaskId++,task:e,name:t,enqueuedAt:Date.now(),executedAt:void 0,completed:!1,resolve:(a)=>{if(n.completed)return;n.completed=!0,this.pendingTasks.delete(n.id),ge.debug(`resolving task [name:${n.name}]`),s(a);let[o]=this.pendingTasks.values();if(o&&!o.executedAt)this.execute(o)},reject:(a,{canExecuteNextTask:o})=>{if(n.completed)return;if(n.completed=!0,this.pendingTasks.delete(n.id),ge.debug(`rejecting task [name:${n.name}]: %s`,String(a)),i(a),o){let[c]=this.pendingTasks.values();if(c&&!c.executedAt)this.execute(c)}}};if(this.pendingTasks.set(n.id,n),this.pendingTasks.size===1)this.execute(n)})}stop(){ge.debug("stop()");for(let e of this.pendingTasks.values())ge.debug(`stop() | stopping task [name:${e.name}]`),e.reject(new Ye.AwaitQueueStoppedError,{canExecuteNextTask:!1})}remove(e){ge.debug(`remove() [taskIdx:${e}]`);let t=Array.from(this.pendingTasks.values())[e];if(!t){ge.debug(`stop() | no task with given idx [taskIdx:${e}]`);return}t.reject(new Ye.AwaitQueueRemovedTaskError,{canExecuteNextTask:!0})}dump(){let e=Date.now(),t=0;return Array.from(this.pendingTasks.values()).map((r)=>({idx:t++,task:r.task,name:r.name,enqueuedTime:r.executedAt?r.executedAt-r.enqueuedAt:e-r.enqueuedAt,executionTime:r.executedAt?e-r.executedAt:0}))}async execute(e){if(ge.debug(`execute() [name:${e.name}]`),e.executedAt)throw Error("task already being executed");e.executedAt=Date.now();try{let t=await e.task();e.resolve(t)}catch(t){e.reject(t,{canExecuteNextTask:!0})}}}At.AwaitQueue=Ss});var Es=C(function(Re){Object.defineProperty(Re,"__esModule",{value:!0});Re.AwaitQueueRemovedTaskError=Re.AwaitQueueStoppedError=Re.AwaitQueue=void 0;var Ba=Rs();Object.defineProperty(Re,"AwaitQueue",{enumerable:!0,get:function(){return Ba.AwaitQueue}});var Cs=Rr();Object.defineProperty(Re,"AwaitQueueStoppedError",{enumerable:!0,get:function(){return Cs.AwaitQueueStoppedError}});Object.defineProperty(Re,"AwaitQueueRemovedTaskError",{enumerable:!0,get:function(){return Cs.AwaitQueueRemovedTaskError}})});var xs=C(function(qt){Object.defineProperty(qt,"__esModule",{value:!0});qt.Producer=void 0;var Ts=I(),zt=A(),z=H(),se=new Ts.Logger("Producer");class Ds extends zt.EnhancedEventEmitter{_id;_localId;_closed=!1;_rtpSender;_track;_kind;_rtpParameters;_paused;_maxSpatialLayer;_stopTracks;_disableTrackOnPause;_zeroRtpOnPause;_appData;_observer=new zt.EnhancedEventEmitter;constructor({id:e,localId:t,rtpSender:r,track:s,rtpParameters:i,stopTracks:n,disableTrackOnPause:a,zeroRtpOnPause:o,appData:c}){super();se.debug("constructor()"),this._id=e,this._localId=t,this._rtpSender=r,this._track=s,this._kind=s.kind,this._rtpParameters=i,this._paused=a?!s.enabled:!1,this._maxSpatialLayer=void 0,this._stopTracks=n,this._disableTrackOnPause=a,this._zeroRtpOnPause=o,this._appData=c??{},this.onTrackEnded=this.onTrackEnded.bind(this),this.handleTrack()}get id(){return this._id}get localId(){return this._localId}get closed(){return this._closed}get kind(){return this._kind}get rtpSender(){return this._rtpSender}get track(){return this._track}get rtpParameters(){return this._rtpParameters}get paused(){return this._paused}get maxSpatialLayer(){return this._maxSpatialLayer}get appData(){return this._appData}set appData(e){this._appData=e}get observer(){return this._observer}close(){if(this._closed)return;se.debug("close()"),this._closed=!0,this.destroyTrack(),this.emit("@close"),this._observer.safeEmit("close"),super.close(),this._observer.close()}transportClosed(){if(this._closed)return;se.debug("transportClosed()"),this._closed=!0,this.destroyTrack(),this.safeEmit("transportclose"),this._observer.safeEmit("close"),super.close(),this._observer.close()}async getStats(){if(this._closed)throw new z.InvalidStateError("closed");return new Promise((e,t)=>{this.safeEmit("@getstats",e,t)})}pause(){if(se.debug("pause()"),this._closed){se.error("pause() | Producer closed");return}if(this._paused=!0,this._track&&this._disableTrackOnPause)this._track.enabled=!1;if(this._zeroRtpOnPause)new Promise((e,t)=>{this.safeEmit("@pause",e,t)}).catch(()=>{});this._observer.safeEmit("pause")}resume(){if(se.debug("resume()"),this._closed){se.error("resume() | Producer closed");return}if(this._paused=!1,this._track&&this._disableTrackOnPause)this._track.enabled=!0;if(this._zeroRtpOnPause)new Promise((e,t)=>{this.safeEmit("@resume",e,t)}).catch(()=>{});this._observer.safeEmit("resume")}async replaceTrack({track:e}){if(se.debug("replaceTrack() [track:%o]",e),this._closed){if(e&&this._stopTracks)try{e.stop()}catch(t){}throw new z.InvalidStateError("closed")}else if(e?.readyState==="ended")throw new z.InvalidStateError("track ended");if(e===this._track){se.debug("replaceTrack() | same track, ignored");return}try{if(await new Promise((t,r)=>{this.safeEmit("@replacetrack",e,t,r)}),this._closed)throw new z.InvalidStateError("closed")}catch(t){if(e&&this._stopTracks)try{e.stop()}catch(r){}throw t}if(this.destroyTrack(),this._track=e,this._track&&this._disableTrackOnPause){if(!this._paused)this._track.enabled=!0;else if(this._paused)this._track.enabled=!1}this.handleTrack()}async setMaxSpatialLayer(e){if(this._closed)throw new z.InvalidStateError("closed");else if(this._kind!=="video")throw new z.UnsupportedError("not a video Producer");else if(typeof e!=="number")throw TypeError("invalid spatialLayer");if(e===this._maxSpatialLayer)return;await new Promise((t,r)=>{this.safeEmit("@setmaxspatiallayer",e,t,r)}),this._maxSpatialLayer=e}async setRtpEncodingParameters(e){if(this._closed)throw new z.InvalidStateError("closed");else if(typeof e!=="object")throw TypeError("invalid params");await new Promise((t,r)=>{this.safeEmit("@setrtpencodingparameters",e,t,r)})}onTrackEnded(){se.debug('track "ended" event'),this.safeEmit("trackended"),this._observer.safeEmit("trackended")}handleTrack(){if(!this._track)return;this._track.addEventListener("ended",this.onTrackEnded)}destroyTrack(){if(!this._track)return;try{if(this._track.removeEventListener("ended",this.onTrackEnded),this._stopTracks)this._track.stop()}catch(e){}}}qt.Producer=Ds});var ks=C(function(Bt){Object.defineProperty(Bt,"__esModule",{value:!0});Bt.Consumer=void 0;var Ps=I(),$t=A(),Ls=H(),ie=new Ps.Logger("Consumer");class Ms extends $t.EnhancedEventEmitter{_id;_localId;_producerId;_closed=!1;_rtpReceiver;_track;_rtpParameters;_paused;_appData;_observer=new $t.EnhancedEventEmitter;constructor({id:e,localId:t,producerId:r,rtpReceiver:s,track:i,rtpParameters:n,appData:a}){super();ie.debug("constructor()"),this._id=e,this._localId=t,this._producerId=r,this._rtpReceiver=s,this._track=i,this._rtpParameters=n,this._paused=!i.enabled,this._appData=a??{},this.onTrackEnded=this.onTrackEnded.bind(this),this.handleTrack()}get id(){return this._id}get localId(){return this._localId}get producerId(){return this._producerId}get closed(){return this._closed}get kind(){return this._track.kind}get rtpReceiver(){return this._rtpReceiver}get track(){return this._track}get rtpParameters(){return this._rtpParameters}get paused(){return this._paused}get appData(){return this._appData}set appData(e){this._appData=e}get observer(){return this._observer}close(){if(this._closed)return;ie.debug("close()"),this._closed=!0,this.destroyTrack(),this.emit("@close"),this._observer.safeEmit("close"),super.close(),this._observer.close()}transportClosed(){if(this._closed)return;ie.debug("transportClosed()"),this._closed=!0,this.destroyTrack(),this.safeEmit("transportclose"),this._observer.safeEmit("close"),super.close(),this._observer.close()}async getStats(){if(this._closed)throw new Ls.InvalidStateError("closed");return new Promise((e,t)=>{this.safeEmit("@getstats",e,t)})}pause(){if(ie.debug("pause()"),this._closed){ie.error("pause() | Consumer closed");return}if(this._paused){ie.debug("pause() | Consumer is already paused");return}this._paused=!0,this._track.enabled=!1,this.emit("@pause"),this._observer.safeEmit("pause")}resume(){if(ie.debug("resume()"),this._closed){ie.error("resume() | Consumer closed");return}if(!this._paused){ie.debug("resume() | Consumer is already resumed");return}this._paused=!1,this._track.enabled=!0,this.emit("@resume"),this._observer.safeEmit("resume")}onTrackEnded(){ie.debug('track "ended" event'),this.safeEmit("trackended"),this._observer.safeEmit("trackended")}handleTrack(){this._track.addEventListener("ended",this.onTrackEnded)}destroyTrack(){try{this._track.removeEventListener("ended",this.onTrackEnded),this._track.stop()}catch(e){}}}Bt.Consumer=Ms});var Fs=C(function(Ut){Object.defineProperty(Ut,"__esModule",{value:!0});Ut.DataProducer=void 0;var Os=I(),Vt=A(),Is=H(),_e=new Os.Logger("DataProducer");class js extends Vt.EnhancedEventEmitter{_id;_dataChannel;_closed=!1;_sctpStreamParameters;_appData;_observer=new Vt.EnhancedEventEmitter;constructor({id:e,dataChannel:t,sctpStreamParameters:r,appData:s}){super();_e.debug("constructor()"),this._id=e,this._dataChannel=t,this._sctpStreamParameters=r,this._appData=s??{},this.handleDataChannel()}get id(){return this._id}get closed(){return this._closed}get sctpStreamParameters(){return this._sctpStreamParameters}get readyState(){return this._dataChannel.readyState}get label(){return this._dataChannel.label}get protocol(){return this._dataChannel.protocol}get bufferedAmount(){return this._dataChannel.bufferedAmount}get bufferedAmountLowThreshold(){return this._dataChannel.bufferedAmountLowThreshold}set bufferedAmountLowThreshold(e){this._dataChannel.bufferedAmountLowThreshold=e}get appData(){return this._appData}set appData(e){this._appData=e}get observer(){return this._observer}close(){if(this._closed)return;_e.debug("close()"),this._closed=!0,this._dataChannel.close(),this.emit("@close"),this._observer.safeEmit("close"),super.close(),this._observer.close()}transportClosed(){if(this._closed)return;_e.debug("transportClosed()"),this._closed=!0,this._dataChannel.close(),this.safeEmit("transportclose"),this._observer.safeEmit("close"),super.close(),this._observer.close()}send(e){if(_e.debug("send()"),this._closed)throw new Is.InvalidStateError("closed");this._dataChannel.send(e)}handleDataChannel(){this._dataChannel.addEventListener("open",()=>{if(this._closed)return;_e.debug('DataChannel "open" event'),this.safeEmit("open")}),this._dataChannel.addEventListener("error",(e)=>{if(this._closed)return;let t=e.error??Error("unknown DataChannel error");if(e.error?.errorDetail==="sctp-failure")_e.error("DataChannel SCTP error [sctpCauseCode:%s]: %s",e.error?.sctpCauseCode,e.error.message);else _e.error('DataChannel "error" event: %o',t);this.safeEmit("error",t)}),this._dataChannel.addEventListener("close",()=>{if(this._closed)return;_e.debug('DataChannel "close" event'),this._closed=!0,this._dataChannel.close(),this.emit("@close"),this.safeEmit("close"),this._observer.safeEmit("close"),super.close(),this._observer.close()}),this._dataChannel.addEventListener("message",()=>{if(this._closed)return;_e.warn('DataChannel "message" event in a DataProducer, message discarded')}),this._dataChannel.addEventListener("bufferedamountlow",()=>{if(this._closed)return;this.safeEmit("bufferedamountlow")})}}Ut.DataProducer=js});var zs=C(function(Ht){Object.defineProperty(Ht,"__esModule",{value:!0});Ht.DataConsumer=void 0;var Ns=I(),Kt=A(),Pe=new Ns.Logger("DataConsumer");class As extends Kt.EnhancedEventEmitter{_id;_dataProducerId;_dataChannel;_closed=!1;_sctpStreamParameters;_appData;_observer=new Kt.EnhancedEventEmitter;constructor({id:e,dataProducerId:t,dataChannel:r,sctpStreamParameters:s,appData:i}){super();Pe.debug("constructor()"),this._id=e,this._dataProducerId=t,this._dataChannel=r,this._sctpStreamParameters=s,this._appData=i??{},this.handleDataChannel()}get id(){return this._id}get dataProducerId(){return this._dataProducerId}get closed(){return this._closed}get sctpStreamParameters(){return this._sctpStreamParameters}get readyState(){return this._dataChannel.readyState}get label(){return this._dataChannel.label}get protocol(){return this._dataChannel.protocol}get binaryType(){return this._dataChannel.binaryType}set binaryType(e){this._dataChannel.binaryType=e}get appData(){return this._appData}set appData(e){this._appData=e}get observer(){return this._observer}close(){if(this._closed)return;Pe.debug("close()"),this._closed=!0,this._dataChannel.close(),this.emit("@close"),this._observer.safeEmit("close"),super.close(),this._observer.close()}transportClosed(){if(this._closed)return;Pe.debug("transportClosed()"),this._closed=!0,this._dataChannel.close(),this.safeEmit("transportclose"),this._observer.safeEmit("close"),super.close(),this._observer.close()}handleDataChannel(){this._dataChannel.addEventListener("open",()=>{if(this._closed)return;Pe.debug('DataChannel "open" event'),this.safeEmit("open")}),this._dataChannel.addEventListener("error",(e)=>{if(this._closed)return;let t=e.error??Error("unknown DataChannel error");if(e.error?.errorDetail==="sctp-failure")Pe.error("DataChannel SCTP error [sctpCauseCode:%s]: %s",e.error?.sctpCauseCode,e.error.message);else Pe.error('DataChannel "error" event: %o',t);this.safeEmit("error",t)}),this._dataChannel.addEventListener("close",()=>{if(this._closed)return;Pe.debug('DataChannel "close" event'),this._closed=!0,this._dataChannel.close(),this.emit("@close"),this.safeEmit("close"),this._observer.safeEmit("close"),super.close(),this._observer.close()}),this._dataChannel.addEventListener("message",(e)=>{if(this._closed)return;this.safeEmit("message",e.data)})}}Ht.DataConsumer=As});var Ws=C(function(ne){var Va=ne&&ne.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Ua=ne&&ne.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),qs=ne&&ne.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")Va(r,t,s[i])}return Ua(r,t),r}}();Object.defineProperty(ne,"__esModule",{value:!0});ne.Transport=void 0;var $s=Es(),Bs=I(),Qt=A(),E=H(),Gt=qs(De()),lt=qs(re()),Vs=xs(),Us=ks(),Ks=Fs(),Hs=zs(),M=new Bs.Logger("Transport");class Gs{consumerOptions;promise;resolve;reject;constructor(e){this.consumerOptions=e,this.promise=new Promise((t,r)=>{this.resolve=t,this.reject=r})}}class Qs extends Qt.EnhancedEventEmitter{_id;_closed=!1;_direction;_getSendExtendedRtpCapabilities;_recvRtpCapabilities;_canProduceByKind;_sctpParameters;_handler;_iceGatheringState="new";_connectionState="new";_appData;_producers=new Map;_consumers=new Map;_dataProducers=new Map;_dataConsumers=new Map;_probatorConsumerCreated=!1;_awaitQueue=new $s.AwaitQueue;_pendingConsumerTasks=[];_consumerCreationInProgress=!1;_pendingPauseConsumers=new Map;_consumerPauseInProgress=!1;_pendingResumeConsumers=new Map;_consumerResumeInProgress=!1;_pendingCloseConsumers=new Map;_consumerCloseInProgress=!1;_observer=new Qt.EnhancedEventEmitter;constructor({direction:e,id:t,iceParameters:r,iceCandidates:s,dtlsParameters:i,sctpParameters:n,iceServers:a,iceTransportPolicy:o,additionalSettings:c,appData:d,handlerFactory:l,getSendExtendedRtpCapabilities:p,recvRtpCapabilities:u,canProduceByKind:h}){super();if(M.debug("constructor() [id:%s, direction:%s]",t,e),this._id=t,this._direction=e,this._getSendExtendedRtpCapabilities=p,this._recvRtpCapabilities=u,this._canProduceByKind=h,this._sctpParameters=Gt.clone(n),this._sctpParameters)this._sctpParameters.maxSendMessageSize=this._sctpParameters.maxSendMessageSize??this._sctpParameters.maxMessageSize,this._sctpParameters.maxReceiveMessageSize=this._sctpParameters.maxReceiveMessageSize??this._sctpParameters.maxMessageSize;let f=Gt.clone(c)??{};delete f.iceServers,delete f.iceTransportPolicy,delete f.bundlePolicy,delete f.rtcpMuxPolicy,this._handler=l.factory({direction:e,iceParameters:r,iceCandidates:s,dtlsParameters:i,sctpParameters:this._sctpParameters,iceServers:a,iceTransportPolicy:o,additionalSettings:f,getSendExtendedRtpCapabilities:this._getSendExtendedRtpCapabilities}),this._appData=d??{},this.handleHandler()}get id(){return this._id}get closed(){return this._closed}get direction(){return this._direction}get handler(){return this._handler}get iceGatheringState(){return this._iceGatheringState}get connectionState(){return this._connectionState}get appData(){return this._appData}set appData(e){this._appData=e}get observer(){return this._observer}close(){if(this._closed)return;M.debug("close()"),this._closed=!0;for(let e of this._pendingConsumerTasks)e.reject(new E.InvalidStateError("closed"));this._pendingConsumerTasks=[],this._awaitQueue.stop(),this._handler.close(),this._connectionState="closed";for(let e of this._producers.values())e.transportClosed();this._producers.clear();for(let e of this._consumers.values())e.transportClosed();this._consumers.clear();for(let e of this._dataProducers.values())e.transportClosed();this._dataProducers.clear();for(let e of this._dataConsumers.values())e.transportClosed();this._dataConsumers.clear(),this._observer.safeEmit("close"),super.close(),this._observer.close()}async getStats(){if(this._closed)throw new E.InvalidStateError("closed");return this._handler.getTransportStats()}async restartIce({iceParameters:e}){if(M.debug("restartIce()"),this._closed)throw new E.InvalidStateError("closed");else if(!e)throw TypeError("missing iceParameters");await this._awaitQueue.push(async()=>{await this._handler.restartIce(e)},"transport.restartIce()")}async updateIceServers({iceServers:e}={}){if(M.debug("updateIceServers()"),this._closed)throw new E.InvalidStateError("closed");else if(!Array.isArray(e))throw TypeError("missing iceServers");await this._awaitQueue.push(async()=>{await this._handler.updateIceServers(e)},"transport.updateIceServers()")}async produce({track:e,streamId:t,encodings:r,codecOptions:s,codec:i,stopTracks:n=!0,disableTrackOnPause:a=!0,zeroRtpOnPause:o=!1,onRtpSender:c,appData:d={}}={}){if(M.debug("produce() [track:%o]",e),this._closed){if(e&&n)try{e.stop()}catch(l){}throw new E.InvalidStateError("closed")}else if(!e)throw TypeError("missing track");else if(this._direction!=="send")throw new E.UnsupportedError("not a sending transport");else if(!this._canProduceByKind[e.kind])throw new E.UnsupportedError(`cannot produce ${e.kind}`);else if(e.readyState==="ended")throw new E.InvalidStateError("track ended");else if(this.listenerCount("connect")===0&&this._connectionState==="new")throw TypeError('no "connect" listener set into this transport');else if(this.listenerCount("produce")===0)throw TypeError('no "produce" listener set into this transport');else if(d&&typeof d!=="object")throw TypeError("if given, appData must be an object");return this._awaitQueue.push(async()=>{let l;if(r&&!Array.isArray(r))throw TypeError("encodings must be an array");else if(r?.length===0)l=void 0;else if(r)l=r.map((f)=>{let m={active:!0};if(f.active===!1)m.active=!1;if(typeof f.scalabilityMode==="string")m.scalabilityMode=f.scalabilityMode;if(typeof f.scaleResolutionDownBy==="number")m.scaleResolutionDownBy=f.scaleResolutionDownBy;if(typeof f.maxBitrate==="number")m.maxBitrate=f.maxBitrate;if(typeof f.maxFramerate==="number")m.maxFramerate=f.maxFramerate;if(typeof f.adaptivePtime==="boolean")m.adaptivePtime=f.adaptivePtime;if(typeof f.priority==="string")m.priority=f.priority;if(typeof f.networkPriority==="string")m.networkPriority=f.networkPriority;return m});let{localId:p,rtpParameters:u,rtpSender:h}=await this._handler.send({track:e,streamId:t,encodings:l,codecOptions:s,codec:i,onRtpSender:c});try{lt.validateAndNormalizeRtpParameters(u);let{id:f}=await new Promise((w,T)=>{this.safeEmit("produce",{kind:e.kind,rtpParameters:u,appData:d},w,T)}),m=new Vs.Producer({id:f,localId:p,rtpSender:h,track:e,rtpParameters:u,stopTracks:n,disableTrackOnPause:a,zeroRtpOnPause:o,appData:d});return this._producers.set(m.id,m),this.handleProducer(m),this._observer.safeEmit("newproducer",m),m}catch(f){throw this._handler.stopSending(p).catch(()=>{}),f}},"transport.produce()").catch((l)=>{if(n)try{e.stop()}catch(p){}throw l})}async consume({id:e,producerId:t,kind:r,rtpParameters:s,streamId:i,onRtpReceiver:n,appData:a={}}){if(M.debug("consume()"),this._closed)throw new E.InvalidStateError("closed");else if(this._direction!=="recv")throw new E.UnsupportedError("not a receiving transport");else if(typeof e!=="string")throw TypeError("missing id");else if(typeof t!=="string")throw TypeError("missing producerId");else if(r!=="audio"&&r!=="video")throw TypeError(`invalid kind '${r}'`);else if(this.listenerCount("connect")===0&&this._connectionState==="new")throw TypeError('no "connect" listener set into this transport');else if(a&&typeof a!=="object")throw TypeError("if given, appData must be an object");let o=Gt.clone(s);if(!lt.canReceive(o,this._recvRtpCapabilities))throw new E.UnsupportedError("cannot consume this Producer");let d=new Gs({id:e,producerId:t,kind:r,rtpParameters:o,streamId:i,onRtpReceiver:n,appData:a});return this._pendingConsumerTasks.push(d),queueMicrotask(()=>{if(this._closed)return;if(this._consumerCreationInProgress===!1)this.createPendingConsumers()}),d.promise}async produceData({ordered:e=!0,maxPacketLifeTime:t,maxRetransmits:r,label:s="",protocol:i="",appData:n={}}={}){if(M.debug("produceData()"),this._closed)throw new E.InvalidStateError("closed");else if(this._direction!=="send")throw new E.UnsupportedError("not a sending transport");else if(!this._sctpParameters)throw new E.UnsupportedError("SCTP not enabled by remote transport");else if(this.listenerCount("connect")===0&&this._connectionState==="new")throw TypeError('no "connect" listener set into this transport');else if(this.listenerCount("producedata")===0)throw TypeError('no "producedata" listener set into this transport');else if(n&&typeof n!=="object")throw TypeError("if given, appData must be an object");if(t!==void 0||r!==void 0)e=!1;return this._awaitQueue.push(async()=>{let{dataChannel:a,sctpStreamParameters:o}=await this._handler.sendDataChannel({sctpStreamParameters:{ordered:e,maxPacketLifeTime:t,maxRetransmits:r,label:s,protocol:i}}),c;try{lt.validateAndNormalizeSctpStreamParameters(o),{id:c}=await new Promise((l,p)=>{this.safeEmit("producedata",{sctpStreamParameters:o,label:s,protocol:i,appData:n},l,p)})}catch(l){try{a.close()}catch(p){}throw l}let d=new Ks.DataProducer({id:c,dataChannel:a,sctpStreamParameters:o,appData:n});return this._dataProducers.set(d.id,d),this.handleDataProducer(d),this._observer.safeEmit("newdataproducer",d),d},"transport.produceData()")}async consumeData({id:e,dataProducerId:t,sctpStreamParameters:r,label:s="",protocol:i="",appData:n={}}){if(M.debug("consumeData()"),this._closed)throw new E.InvalidStateError("closed");else if(this._direction!=="recv")throw new E.UnsupportedError("not a receiving transport");else if(!this._sctpParameters)throw new E.UnsupportedError("SCTP not enabled by remote transport");else if(typeof e!=="string")throw TypeError("missing id");else if(typeof t!=="string")throw TypeError("missing dataProducerId");else if(this.listenerCount("connect")===0&&this._connectionState==="new")throw TypeError('no "connect" listener set into this transport');else if(n&&typeof n!=="object")throw TypeError("if given, appData must be an object");let a=Gt.clone(r);return lt.validateAndNormalizeSctpStreamParameters(a),this._awaitQueue.push(async()=>{let{dataChannel:o}=await this._handler.receiveDataChannel({maxMessageSize:this._sctpParameters?.maxSendMessageSize,sctpStreamParameters:a,label:s,protocol:i}),c=new Hs.DataConsumer({id:e,dataProducerId:t,dataChannel:o,sctpStreamParameters:a,appData:n});return this._dataConsumers.set(c.id,c),this.handleDataConsumer(c),this._observer.safeEmit("newdataconsumer",c),c},"transport.consumeData()")}getDataChannelMaxMessageSize(){return this._handler.getDataChannelMaxMessageSize()}createPendingConsumers(){this._consumerCreationInProgress=!0,this._awaitQueue.push(async()=>{if(this._pendingConsumerTasks.length===0){M.debug("createPendingConsumers() | there is no Consumer to be created");return}let e=[...this._pendingConsumerTasks];this._pendingConsumerTasks=[];let t=void 0,r=[];for(let s of e){let{id:i,kind:n,rtpParameters:a,streamId:o,onRtpReceiver:c}=s.consumerOptions;r.push({trackId:i,kind:n,rtpParameters:a,streamId:o,onRtpReceiver:c})}try{let s=await this._handler.receive(r);for(let i=0;i<s.length;++i){let n=e[i],a=s[i],{id:o,producerId:c,kind:d,rtpParameters:l,appData:p}=n.consumerOptions,{localId:u,rtpReceiver:h,track:f}=a,m=new Us.Consumer({id:o,localId:u,producerId:c,rtpReceiver:h,track:f,rtpParameters:l,appData:p});if(this._consumers.set(m.id,m),this.handleConsumer(m),!this._probatorConsumerCreated&&!t&&d==="video")t=m;this._observer.safeEmit("newconsumer",m),n.resolve(m)}}catch(s){for(let i of e)i.reject(s)}if(t)try{let s=lt.generateProbatorRtpParameters(t.rtpParameters);await this._handler.receive([{trackId:"probator",kind:"video",rtpParameters:s}]),M.debug("createPendingConsumers() | Consumer for RTP probation created"),this._probatorConsumerCreated=!0}catch(s){M.error("createPendingConsumers() | failed to create Consumer for RTP probation:%o",s)}},"transport.createPendingConsumers()").then(()=>{if(this._consumerCreationInProgress=!1,this._pendingConsumerTasks.length>0)this.createPendingConsumers()}).catch(()=>{})}pausePendingConsumers(){this._consumerPauseInProgress=!0,this._awaitQueue.push(async()=>{if(this._pendingPauseConsumers.size===0){M.debug("pausePendingConsumers() | there is no Consumer to be paused");return}let e=Array.from(this._pendingPauseConsumers.values());this._pendingPauseConsumers.clear();try{let t=e.map((r)=>r.localId);await this._handler.pauseReceiving(t)}catch(t){M.error("pausePendingConsumers() | failed to pause Consumers:",t)}},"transport.pausePendingConsumers()").then(()=>{if(this._consumerPauseInProgress=!1,this._pendingPauseConsumers.size>0)this.pausePendingConsumers()}).catch(()=>{})}resumePendingConsumers(){this._consumerResumeInProgress=!0,this._awaitQueue.push(async()=>{if(this._pendingResumeConsumers.size===0){M.debug("resumePendingConsumers() | there is no Consumer to be resumed");return}let e=Array.from(this._pendingResumeConsumers.values());this._pendingResumeConsumers.clear();try{let t=e.map((r)=>r.localId);await this._handler.resumeReceiving(t)}catch(t){M.error("resumePendingConsumers() | failed to resume Consumers:",t)}},"transport.resumePendingConsumers()").then(()=>{if(this._consumerResumeInProgress=!1,this._pendingResumeConsumers.size>0)this.resumePendingConsumers()}).catch(()=>{})}closePendingConsumers(){this._consumerCloseInProgress=!0,this._awaitQueue.push(async()=>{if(this._pendingCloseConsumers.size===0){M.debug("closePendingConsumers() | there is no Consumer to be closed");return}let e=Array.from(this._pendingCloseConsumers.values());this._pendingCloseConsumers.clear();try{await this._handler.stopReceiving(e.map((t)=>t.localId))}catch(t){M.error("closePendingConsumers() | failed to close Consumers:",t)}},"transport.closePendingConsumers()").then(()=>{if(this._consumerCloseInProgress=!1,this._pendingCloseConsumers.size>0)this.closePendingConsumers()}).catch(()=>{})}handleHandler(){let e=this._handler;e.on("@connect",({dtlsParameters:t},r,s)=>{if(this._closed){s(new E.InvalidStateError("closed"));return}this.safeEmit("connect",{dtlsParameters:t},r,s)}),e.on("@icegatheringstatechange",(t)=>{if(t===this._iceGatheringState)return;if(M.debug("ICE gathering state changed to %s",t),this._iceGatheringState=t,!this._closed)this.safeEmit("icegatheringstatechange",t)}),e.on("@icecandidateerror",(t)=>{M.debug(`ICE candidate error [url:${t.url}, localAddress:${t.address}, localPort:${t.port}]: ${t.errorCode} "${t.errorText}"`),this.safeEmit("icecandidateerror",t)}),e.on("@connectionstatechange",(t)=>{if(t===this._connectionState)return;if(M.debug("connection state changed to %s",t),this._connectionState=t,!this._closed)this.safeEmit("connectionstatechange",t)})}handleProducer(e){e.on("@close",()=>{if(this._producers.delete(e.id),this._closed)return;this._awaitQueue.push(async()=>{await this._handler.stopSending(e.localId)},"producer @close event").catch((t)=>M.warn("producer closure failed:%o",t))}),e.on("@pause",(t,r)=>{this._awaitQueue.push(async()=>{await this._handler.pauseSending(e.localId)},"producer @pause event").then(t).catch(r)}),e.on("@resume",(t,r)=>{this._awaitQueue.push(async()=>{await this._handler.resumeSending(e.localId)},"producer @resume event").then(t).catch(r)}),e.on("@replacetrack",(t,r,s)=>{this._awaitQueue.push(async()=>{await this._handler.replaceTrack(e.localId,t)},"producer @replacetrack event").then(r).catch(s)}),e.on("@setmaxspatiallayer",(t,r,s)=>{this._awaitQueue.push(async()=>{await this._handler.setMaxSpatialLayer(e.localId,t)},"producer @setmaxspatiallayer event").then(r).catch(s)}),e.on("@setrtpencodingparameters",(t,r,s)=>{this._awaitQueue.push(async()=>{await this._handler.setRtpEncodingParameters(e.localId,t)},"producer @setrtpencodingparameters event").then(r).catch(s)}),e.on("@getstats",(t,r)=>{if(this._closed)return r(new E.InvalidStateError("closed"));this._handler.getSenderStats(e.localId).then(t).catch(r)})}handleConsumer(e){e.on("@close",()=>{if(this._consumers.delete(e.id),this._pendingPauseConsumers.delete(e.id),this._pendingResumeConsumers.delete(e.id),this._closed)return;if(this._pendingCloseConsumers.set(e.id,e),this._consumerCloseInProgress===!1)this.closePendingConsumers()}),e.on("@pause",()=>{if(this._pendingResumeConsumers.has(e.id))this._pendingResumeConsumers.delete(e.id);this._pendingPauseConsumers.set(e.id,e),queueMicrotask(()=>{if(this._closed)return;if(this._consumerPauseInProgress===!1)this.pausePendingConsumers()})}),e.on("@resume",()=>{if(this._pendingPauseConsumers.has(e.id))this._pendingPauseConsumers.delete(e.id);this._pendingResumeConsumers.set(e.id,e),queueMicrotask(()=>{if(this._closed)return;if(this._consumerResumeInProgress===!1)this.resumePendingConsumers()})}),e.on("@getstats",(t,r)=>{if(this._closed)return r(new E.InvalidStateError("closed"));this._handler.getReceiverStats(e.localId).then(t).catch(r)})}handleDataProducer(e){e.on("@close",()=>{this._dataProducers.delete(e.id)})}handleDataConsumer(e){e.on("@close",()=>{this._dataConsumers.delete(e.id)})}}ne.Transport=Qs});var Wt=C(function(Pc,Ys){var Js=Ys.exports={v:[{name:"version",reg:/^(\d*)$/}],o:[{name:"origin",reg:/^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,names:["username","sessionId","sessionVersion","netType","ipVer","address"],format:"%s %s %d %s IP%d %s"}],s:[{name:"name"}],i:[{name:"description"}],u:[{name:"uri"}],e:[{name:"email"}],p:[{name:"phone"}],z:[{name:"timezones"}],r:[{name:"repeats"}],t:[{name:"timing",reg:/^(\d*) (\d*)/,names:["start","stop"],format:"%d %d"}],c:[{name:"connection",reg:/^IN IP(\d) (\S*)/,names:["version","ip"],format:"IN IP%d %s"}],b:[{push:"bandwidth",reg:/^(TIAS|AS|CT|RR|RS):(\d*)/,names:["type","limit"],format:"%s:%s"}],m:[{reg:/^(\w*) (\d*) ([\w/]*)(?: (.*))?/,names:["type","port","protocol","payloads"],format:"%s %d %s %s"}],a:[{push:"rtp",reg:/^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,names:["payload","codec","rate","encoding"],format:function(e){return e.encoding?"rtpmap:%d %s/%s/%s":e.rate?"rtpmap:%d %s/%s":"rtpmap:%d %s"}},{push:"fmtp",reg:/^fmtp:(\d*) ([\S| ]*)/,names:["payload","config"],format:"fmtp:%d %s"},{name:"control",reg:/^control:(.*)/,format:"control:%s"},{name:"rtcp",reg:/^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,names:["port","netType","ipVer","address"],format:function(e){return e.address!=null?"rtcp:%d %s IP%d %s":"rtcp:%d"}},{push:"rtcpFbTrrInt",reg:/^rtcp-fb:(\*|\d*) trr-int (\d*)/,names:["payload","value"],format:"rtcp-fb:%s trr-int %d"},{push:"rtcpFb",reg:/^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,names:["payload","type","subtype"],format:function(e){return e.subtype!=null?"rtcp-fb:%s %s %s":"rtcp-fb:%s %s"}},{push:"ext",reg:/^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,names:["value","direction","encrypt-uri","uri","config"],format:function(e){return"extmap:%d"+(e.direction?"/%s":"%v")+(e["encrypt-uri"]?" %s":"%v")+" %s"+(e.config?" %s":"")}},{name:"extmapAllowMixed",reg:/^(extmap-allow-mixed)/},{push:"crypto",reg:/^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,names:["id","suite","config","sessionConfig"],format:function(e){return e.sessionConfig!=null?"crypto:%d %s %s %s":"crypto:%d %s %s"}},{name:"setup",reg:/^setup:(\w*)/,format:"setup:%s"},{name:"connectionType",reg:/^connection:(new|existing)/,format:"connection:%s"},{name:"mid",reg:/^mid:([^\s]*)/,format:"mid:%s"},{push:"msid",reg:/^msid:([\w-]+)(?: ([\w-]+))?/,names:["id","appdata"],format:"msid:%s %s"},{name:"ptime",reg:/^ptime:(\d*(?:\.\d*)*)/,format:"ptime:%d"},{name:"maxptime",reg:/^maxptime:(\d*(?:\.\d*)*)/,format:"maxptime:%d"},{name:"direction",reg:/^(sendrecv|recvonly|sendonly|inactive)/},{name:"icelite",reg:/^(ice-lite)/},{name:"iceUfrag",reg:/^ice-ufrag:(\S*)/,format:"ice-ufrag:%s"},{name:"icePwd",reg:/^ice-pwd:(\S*)/,format:"ice-pwd:%s"},{name:"fingerprint",reg:/^fingerprint:(\S*) (\S*)/,names:["type","hash"],format:"fingerprint:%s %s"},{push:"candidates",reg:/^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,names:["foundation","component","transport","priority","ip","port","type","raddr","rport","tcptype","generation","network-id","network-cost"],format:function(e){var t="candidate:%s %d %s %d %s %d typ %s";if(t+=e.raddr!=null?" raddr %s rport %d":"%v%v",t+=e.tcptype!=null?" tcptype %s":"%v",e.generation!=null)t+=" generation %d";return t+=e["network-id"]!=null?" network-id %d":"%v",t+=e["network-cost"]!=null?" network-cost %d":"%v",t}},{name:"endOfCandidates",reg:/^(end-of-candidates)/},{name:"remoteCandidates",reg:/^remote-candidates:(.*)/,format:"remote-candidates:%s"},{name:"iceOptions",reg:/^ice-options:(\S*)/,format:"ice-options:%s"},{push:"ssrcs",reg:/^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,names:["id","attribute","value"],format:function(e){var t="ssrc:%d";if(e.attribute!=null){if(t+=" %s",e.value!=null)t+=":%s"}return t}},{push:"ssrcGroups",reg:/^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,names:["semantics","ssrcs"],format:"ssrc-group:%s %s"},{name:"msidSemantic",reg:/^msid-semantic:\s?(\w*) (\S*)/,names:["semantic","token"],format:"msid-semantic: %s %s"},{push:"groups",reg:/^group:(\w*) (.*)/,names:["type","mids"],format:"group:%s %s"},{name:"rtcpMux",reg:/^(rtcp-mux)/},{name:"rtcpRsize",reg:/^(rtcp-rsize)/},{name:"sctpmap",reg:/^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,names:["sctpmapNumber","app","maxMessageSize"],format:function(e){return e.maxMessageSize!=null?"sctpmap:%s %s %s":"sctpmap:%s %s"}},{name:"xGoogleFlag",reg:/^x-google-flag:([^\s]*)/,format:"x-google-flag:%s"},{push:"rids",reg:/^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,names:["id","direction","params"],format:function(e){return e.params?"rid:%s %s %s":"rid:%s %s"}},{push:"imageattrs",reg:new RegExp("^imageattr:(\\d+|\\*)[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?"),names:["pt","dir1","attrs1","dir2","attrs2"],format:function(e){return"imageattr:%s %s %s"+(e.dir2?" %s %s":"")}},{name:"simulcast",reg:new RegExp("^simulcast:(send|recv) ([a-zA-Z0-9\\-_~;,]+)(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?$"),names:["dir1","list1","dir2","list2"],format:function(e){return"simulcast:%s %s"+(e.dir2?" %s %s":"")}},{name:"simulcast_03",reg:/^simulcast:[\s\t]+([\S+\s\t]+)$/,names:["value"],format:"simulcast: %s"},{name:"framerate",reg:/^framerate:(\d+(?:$|\.\d+))/,format:"framerate:%s"},{name:"sourceFilter",reg:/^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,names:["filterMode","netType","addressTypes","destAddress","srcList"],format:"source-filter: %s %s %s %s %s"},{name:"bundleOnly",reg:/^(bundle-only)/},{name:"label",reg:/^label:(.+)/,format:"label:%s"},{name:"sctpPort",reg:/^sctp-port:(\d+)$/,format:"sctp-port:%s"},{name:"maxMessageSize",reg:/^max-message-size:(\d+)$/,format:"max-message-size:%s"},{push:"tsRefClocks",reg:/^ts-refclk:([^\s=]*)(?:=(\S*))?/,names:["clksrc","clksrcExt"],format:function(e){return"ts-refclk:%s"+(e.clksrcExt!=null?"=%s":"")}},{name:"mediaClk",reg:/^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,names:["id","mediaClockName","mediaClockValue","rateNumerator","rateDenominator"],format:function(e){var t="mediaclk:";return t+=e.id!=null?"id=%s %s":"%v%s",t+=e.mediaClockValue!=null?"=%s":"",t+=e.rateNumerator!=null?" rate=%s":"",t+=e.rateDenominator!=null?"/%s":"",t}},{name:"keywords",reg:/^keywds:(.+)$/,format:"keywds:%s"},{name:"content",reg:/^content:(.+)/,format:"content:%s"},{name:"bfcpFloorCtrl",reg:/^floorctrl:(c-only|s-only|c-s)/,format:"floorctrl:%s"},{name:"bfcpConfId",reg:/^confid:(\d+)/,format:"confid:%s"},{name:"bfcpUserId",reg:/^userid:(\d+)/,format:"userid:%s"},{name:"bfcpFloorId",reg:/^floorid:(.+) (?:m-stream|mstrm):(.+)/,names:["id","mStream"],format:"floorid:%s mstrm:%s"},{push:"invalid",names:["value"]}]};Object.keys(Js).forEach(function(e){var t=Js[e];t.forEach(function(r){if(!r.reg)r.reg=/(.*)/;if(!r.format)r.format="%s"})})});var ei=C(function(ve){var Ze=function(e){return String(Number(e))===e?Number(e):e},Ka=function(e,t,r,s){if(s&&!r)t[s]=Ze(e[1]);else for(var i=0;i<r.length;i+=1)if(e[i+1]!=null)t[r[i]]=Ze(e[i+1])},Ha=function(e,t,r){var s=e.name&&e.names;if(e.push&&!t[e.push])t[e.push]=[];else if(s&&!t[e.name])t[e.name]={};var i=e.push?{}:s?t[e.name]:t;if(Ka(r.match(e.reg),i,e.names,e.name),e.push)t[e.push].push(i)},Zs=Wt(),Ga=RegExp.prototype.test.bind(/^([a-z])=(.*)/);ve.parse=function(e){var t={},r=[],s=t;return e.split(/(\r\n|\r|\n)/).filter(Ga).forEach(function(i){var n=i[0],a=i.slice(2);if(n==="m")r.push({rtp:[],fmtp:[]}),s=r[r.length-1];for(var o=0;o<(Zs[n]||[]).length;o+=1){var c=Zs[n][o];if(c.reg.test(a))return Ha(c,s,a)}}),t.media=r,t};var Xs=function(e,t){var r=t.split(/=(.+)/,2);if(r.length===2)e[r[0]]=Ze(r[1]);else if(r.length===1&&t.length>1)e[r[0]]=void 0;return e};ve.parseParams=function(e){return e.split(/;\s?/).reduce(Xs,{})};ve.parseFmtpConfig=ve.parseParams;ve.parsePayloads=function(e){return e.toString().split(" ").map(Number)};ve.parseRemoteCandidates=function(e){var t=[],r=e.split(" ").map(Ze);for(var s=0;s<r.length;s+=3)t.push({component:r[s],ip:r[s+1],port:r[s+2]});return t};ve.parseImageAttributes=function(e){return e.split(" ").map(function(t){return t.substring(1,t.length-1).split(",").reduce(Xs,{})})};ve.parseSimulcastStreamList=function(e){return e.split(";").map(function(t){return t.split(",").map(function(r){var s,i=!1;if(r[0]!=="~")s=Ze(r);else s=Ze(r.substring(1,r.length)),i=!0;return{scid:s,paused:i}})})}});var ri=C(function(Mc,ti){var Cr=Wt(),Qa=/%[sdv%]/g,Wa=function(e){var t=1,r=arguments,s=r.length;return e.replace(Qa,function(i){if(t>=s)return i;var n=r[t];switch(t+=1,i){case"%%":return"%";case"%s":return String(n);case"%d":return Number(n);case"%v":return""}})},ut=function(e,t,r){var s=t.format instanceof Function?t.format(t.push?r:r[t.name]):t.format,i=[e+"="+s];if(t.names)for(var n=0;n<t.names.length;n+=1){var a=t.names[n];if(t.name)i.push(r[t.name][a]);else i.push(r[t.names[n]])}else i.push(r[t.name]);return Wa.apply(null,i)},Ja=["v","o","s","i","u","e","p","c","b","t","r","z","a"],Ya=["i","c","b","a"];ti.exports=function(e,t){if(t=t||{},e.version==null)e.version=0;if(e.name==null)e.name=" ";e.media.forEach(function(n){if(n.payloads==null)n.payloads=""});var r=t.outerOrder||Ja,s=t.innerOrder||Ya,i=[];return r.forEach(function(n){Cr[n].forEach(function(a){if(a.name in e&&e[a.name]!=null)i.push(ut(n,a,e));else if(a.push in e&&e[a.push]!=null)e[a.push].forEach(function(o){i.push(ut(n,a,o))})})}),e.media.forEach(function(n){i.push(ut("m",Cr.m[0],n)),s.forEach(function(a){Cr[a].forEach(function(o){if(o.name in n&&n[o.name]!=null)i.push(ut(a,o,n));else if(o.push in n&&n[o.push]!=null)n[o.push].forEach(function(c){i.push(ut(a,o,c))})})})}),i.join(`\r
`)+`\r
`}});var we=C(function(ae){var Le=ei(),Za=ri(),Xa=Wt();ae.grammar=Xa;ae.write=Za;ae.parse=Le.parse;ae.parseParams=Le.parseParams;ae.parseFmtpConfig=Le.parseFmtpConfig;ae.parsePayloads=Le.parsePayloads;ae.parseRemoteCandidates=Le.parseRemoteCandidates;ae.parseImageAttributes=Le.parseImageAttributes;ae.parseSimulcastStreamList=Le.parseSimulcastStreamList});var Me=C(function(Er){Object.defineProperty(Er,"__esModule",{value:!0});Er.parse=to;var eo=new RegExp("^[LS]([1-9]\\d{0,1})T([1-9]\\d{0,1})");function to(e){let t=eo.exec(e??"");if(t)return{spatialLayers:Number(t[1]),temporalLayers:Number(t[2])};else return{spatialLayers:1,temporalLayers:1}}});var ci=C(function(q){var ro=q&&q.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),so=q&&q.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),ii=q&&q.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")ro(r,t,s[i])}return so(r,t),r}}();Object.defineProperty(q,"__esModule",{value:!0});q.RemoteOfferMediaSection=q.RemoteAnswerMediaSection=q.RemoteMediaSection=void 0;var io=ii(we()),si=ii(De());class Jt{_mediaObject;constructor({iceParameters:e,iceCandidates:t,dtlsParameters:r}){if(this._mediaObject={type:"",port:0,protocol:"",payloads:"",rtp:[],fmtp:[]},e)this.setIceParameters(e);if(t){this._mediaObject.candidates=[];for(let s of t){let i={foundation:s.foundation,component:1,ip:s.address??s.ip,port:s.port,priority:s.priority,transport:s.protocol,type:s.type};if(s.tcpType)i.tcptype=s.tcpType;this._mediaObject.candidates.push(i)}this._mediaObject.endOfCandidates="end-of-candidates",this._mediaObject.iceOptions="renomination"}if(r)this.setDtlsRole(r.role)}get mid(){return String(this._mediaObject.mid)}get closed(){return this._mediaObject.port===0}getObject(){return this._mediaObject}setIceParameters(e){this._mediaObject.iceUfrag=e.usernameFragment,this._mediaObject.icePwd=e.password}pause(){this._mediaObject.direction="inactive"}disable(){this.pause()}close(){this.disable(),this._mediaObject.port=0,delete this._mediaObject.candidates,delete this._mediaObject.endOfCandidates,delete this._mediaObject.iceUfrag,delete this._mediaObject.icePwd,delete this._mediaObject.iceOptions,this._mediaObject.rtp=[],this._mediaObject.fmtp=[],delete this._mediaObject.rtcp,delete this._mediaObject.rtcpFb,delete this._mediaObject.ssrcs,delete this._mediaObject.ssrcGroups,delete this._mediaObject.simulcast,delete this._mediaObject.simulcast_03,delete this._mediaObject.rids,delete this._mediaObject.extmapAllowMixed}}q.RemoteMediaSection=Jt;class ni extends Jt{constructor({iceParameters:e,iceCandidates:t,dtlsParameters:r,sctpParameters:s,plainRtpParameters:i,offerMediaObject:n,offerRtpParameters:a,answerRtpParameters:o,codecOptions:c}){super({iceParameters:e,iceCandidates:t,dtlsParameters:r});if(this._mediaObject.mid=String(n.mid),this._mediaObject.type=n.type,this._mediaObject.protocol=n.protocol,!i)this._mediaObject.connection={ip:"127.0.0.1",version:4},this._mediaObject.port=7;else this._mediaObject.connection={ip:i.ip,version:i.ipVersion},this._mediaObject.port=i.port;switch(n.type){case"audio":case"video":{this._mediaObject.direction="recvonly",this._mediaObject.rtp=[],this._mediaObject.rtcpFb=[],this._mediaObject.fmtp=[];for(let d of o.codecs){let l={payload:d.payloadType,codec:oi(d),rate:d.clockRate};if(d.channels>1)l.encoding=d.channels;this._mediaObject.rtp.push(l);let p=si.clone(d.parameters)??{},u=si.clone(d.rtcpFeedback)??[];if(c){let{opusStereo:f,opusFec:m,opusDtx:w,opusMaxPlaybackRate:T,opusMaxAverageBitrate:U,opusPtime:L,opusNack:Oe,videoGoogleStartBitrate:mr,videoGoogleMaxBitrate:Ie,videoGoogleMinBitrate:kt}=c,fe=a.codecs.find((me)=>me.payloadType===d.payloadType);switch(d.mimeType.toLowerCase()){case"audio/opus":case"audio/multiopus":{if(f!==void 0)fe.parameters["sprop-stereo"]=f?1:0,p.stereo=f?1:0;if(m!==void 0)fe.parameters.useinbandfec=m?1:0,p.useinbandfec=m?1:0;if(w!==void 0)fe.parameters.usedtx=w?1:0,p.usedtx=w?1:0;if(T!==void 0)p.maxplaybackrate=T;if(U!==void 0)p.maxaveragebitrate=U;if(L!==void 0)fe.parameters.ptime=L,p.ptime=L;if(!Oe)fe.rtcpFeedback=fe.rtcpFeedback.filter((me)=>me.type!=="nack"||me.parameter),u=u.filter((me)=>me.type!=="nack"||me.parameter);break}case"video/vp8":case"video/vp9":case"video/h264":case"video/h265":case"video/av1":{if(mr!==void 0)p["x-google-start-bitrate"]=mr;if(Ie!==void 0)p["x-google-max-bitrate"]=Ie;if(kt!==void 0)p["x-google-min-bitrate"]=kt;break}}}let h={payload:d.payloadType,config:""};for(let f of Object.keys(p)){if(h.config)h.config+=";";h.config+=`${f}=${p[f]}`}if(h.config)this._mediaObject.fmtp.push(h);for(let f of u)this._mediaObject.rtcpFb.push({payload:d.payloadType,type:f.type,subtype:f.parameter})}this._mediaObject.payloads=o.codecs.map((d)=>d.payloadType).join(" "),this._mediaObject.ext=[];for(let d of o.headerExtensions){if(!(n.ext??[]).some((p)=>p.uri===d.uri))continue;this._mediaObject.ext.push({uri:d.uri,value:d.id})}if(n.extmapAllowMixed==="extmap-allow-mixed")this._mediaObject.extmapAllowMixed="extmap-allow-mixed";if(n.simulcast){this._mediaObject.simulcast={dir1:"recv",list1:n.simulcast.list1},this._mediaObject.rids=[];for(let d of n.rids??[]){if(d.direction!=="send")continue;this._mediaObject.rids.push({id:d.id,direction:"recv"})}}else if(n.simulcast_03){this._mediaObject.simulcast_03={value:n.simulcast_03.value.replace(/send/g,"recv")},this._mediaObject.rids=[];for(let d of n.rids??[]){if(d.direction!=="send")continue;this._mediaObject.rids.push({id:d.id,direction:"recv"})}}this._mediaObject.rtcpMux="rtcp-mux",this._mediaObject.rtcpRsize="rtcp-rsize";break}case"application":{if(typeof n.sctpPort==="number")this._mediaObject.payloads="webrtc-datachannel",this._mediaObject.sctpPort=s.port,this._mediaObject.maxMessageSize=s.maxReceiveMessageSize;else if(n.sctpmap)this._mediaObject.payloads=String(s.port),this._mediaObject.sctpmap={app:"webrtc-datachannel",sctpmapNumber:s.port,maxMessageSize:s.maxReceiveMessageSize};break}}}setDtlsRole(e){switch(e){case"client":{this._mediaObject.setup="active";break}case"server":{this._mediaObject.setup="passive";break}case"auto":{this._mediaObject.setup="actpass";break}}}resume(){this._mediaObject.direction="recvonly"}muxSimulcastStreams(e){if(!this._mediaObject.simulcast?.list1)return;let t={};for(let i of e)if(i.rid)t[i.rid]=i;let r=this._mediaObject.simulcast.list1,s=io.parseSimulcastStreamList(r);for(let i of s)for(let n of i)n.paused=!t[n.scid]?.active;this._mediaObject.simulcast.list1=s.map((i)=>i.map((n)=>`${n.paused?"~":""}${n.scid}`).join(",")).join(";")}}q.RemoteAnswerMediaSection=ni;class ai extends Jt{constructor({iceParameters:e,iceCandidates:t,dtlsParameters:r,sctpParameters:s,plainRtpParameters:i,mid:n,kind:a,offerRtpParameters:o,streamId:c,trackId:d}){super({iceParameters:e,iceCandidates:t,dtlsParameters:r});if(this._mediaObject.mid=String(n),this._mediaObject.type=a,!i){if(this._mediaObject.connection={ip:"127.0.0.1",version:4},!s)this._mediaObject.protocol="UDP/TLS/RTP/SAVPF";else this._mediaObject.protocol="UDP/DTLS/SCTP";this._mediaObject.port=7}else this._mediaObject.connection={ip:i.ip,version:i.ipVersion},this._mediaObject.protocol="RTP/AVP",this._mediaObject.port=i.port;switch(this._mediaObject.extmapAllowMixed="extmap-allow-mixed",a){case"audio":case"video":{this._mediaObject.direction="sendonly",this._mediaObject.rtp=[],this._mediaObject.rtcpFb=[],this._mediaObject.fmtp=[],this._mediaObject.msid=[{id:c,appdata:d}];for(let h of o.codecs){let f={payload:h.payloadType,codec:oi(h),rate:h.clockRate};if(h.channels>1)f.encoding=h.channels;this._mediaObject.rtp.push(f);let m={payload:h.payloadType,config:""};for(let w of Object.keys(h.parameters??{})){if(m.config)m.config+=";";m.config+=`${w}=${h.parameters[w]}`}if(m.config)this._mediaObject.fmtp.push(m);for(let w of h.rtcpFeedback)this._mediaObject.rtcpFb.push({payload:h.payloadType,type:w.type,subtype:w.parameter})}this._mediaObject.payloads=o.codecs.map((h)=>h.payloadType).join(" "),this._mediaObject.ext=[];for(let h of o.headerExtensions)this._mediaObject.ext.push({uri:h.uri,value:h.id});this._mediaObject.rtcpMux="rtcp-mux",this._mediaObject.rtcpRsize="rtcp-rsize";let l=o.encodings[0],p=l.ssrc,u=l.rtx?.ssrc;if(this._mediaObject.ssrcs=[],this._mediaObject.ssrcGroups=[],p&&o.rtcp.cname)this._mediaObject.ssrcs.push({id:p,attribute:"cname",value:o.rtcp.cname});if(u){if(o.rtcp.cname)this._mediaObject.ssrcs.push({id:u,attribute:"cname",value:o.rtcp.cname});if(p)this._mediaObject.ssrcGroups.push({semantics:"FID",ssrcs:`${p} ${u}`})}break}case"application":{this._mediaObject.payloads="webrtc-datachannel",this._mediaObject.sctpPort=s.port,this._mediaObject.maxMessageSize=s.maxReceiveMessageSize;break}}}setDtlsRole(e){this._mediaObject.setup="actpass"}resume(){this._mediaObject.direction="sendonly"}}q.RemoteOfferMediaSection=ai;function oi(e){let r=new RegExp("^(audio|video)/(.+)","i").exec(e.mimeType);if(!r)throw TypeError("invalid codec.mimeType");return r[2]}});var Xe=C(function(oe){var no=oe&&oe.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),ao=oe&&oe.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),oo=oe&&oe.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")no(r,t,s[i])}return ao(r,t),r}}();Object.defineProperty(oe,"__esModule",{value:!0});oe.RemoteSdp=void 0;var co=oo(we()),di=I(),Ce=ci(),pi=Tr(),po=["av1","h264"],Yt=new di.Logger("RemoteSdp");class li{_iceParameters;_iceCandidates;_dtlsParameters;_sctpParameters;_plainRtpParameters;_mediaSections=[];_midToIndex=new Map;_firstMid;_sdpObject;constructor({iceParameters:e,iceCandidates:t,dtlsParameters:r,sctpParameters:s,plainRtpParameters:i}){if(this._iceParameters=e,this._iceCandidates=t,this._dtlsParameters=r,this._sctpParameters=s,this._plainRtpParameters=i,this._sdpObject={version:0,origin:{address:"0.0.0.0",ipVer:4,netType:"IN",sessionId:"10000",sessionVersion:0,username:`mediasoup-client-v${pi.version}`},name:"-",timing:{start:0,stop:0},media:[]},this._sdpObject.iceOptions="ice2",e?.iceLite)this._sdpObject.icelite="ice-lite";if(r){this._sdpObject.msidSemantic={semantic:"WMS",token:"*"};let n=this._dtlsParameters.fingerprints.length;this._sdpObject.fingerprint={type:r.fingerprints[n-1].algorithm,hash:r.fingerprints[n-1].value},this._sdpObject.groups=[{type:"BUNDLE",mids:""}]}if(i)this._sdpObject.origin.address=i.ip,this._sdpObject.origin.ipVer=i.ipVersion}updateIceParameters(e){Yt.debug("updateIceParameters() [iceParameters:%o]",e),this._iceParameters=e,this._sdpObject.icelite=e.iceLite?"ice-lite":void 0;for(let t of this._mediaSections)t.setIceParameters(e)}updateDtlsRole(e){Yt.debug("updateDtlsRole() [role:%s]",e),this._dtlsParameters.role=e;for(let t of this._mediaSections)t.setDtlsRole(e)}setSessionExtmapAllowMixed(){Yt.debug("setSessionExtmapAllowMixed()"),this._sdpObject.extmapAllowMixed="extmap-allow-mixed"}getNextMediaSectionIdx(){for(let e=0;e<this._mediaSections.length;++e){let t=this._mediaSections[e];if(t.closed)return{idx:e,reuseMid:t.mid}}return{idx:this._mediaSections.length}}send({offerMediaObject:e,reuseMid:t,offerRtpParameters:r,answerRtpParameters:s,codecOptions:i}){let n=new Ce.RemoteAnswerMediaSection({iceParameters:this._iceParameters,iceCandidates:this._iceCandidates,dtlsParameters:this._dtlsParameters,plainRtpParameters:this._plainRtpParameters,offerMediaObject:e,offerRtpParameters:r,answerRtpParameters:s,codecOptions:i}),a=n.getObject();if(!a.rtp.find((c)=>po.includes(c.codec.toLowerCase())))a.ext=a.ext?.filter((c)=>c.uri!=="https://aomediacodec.github.io/av1-rtp-spec/#dependency-descriptor-rtp-header-extension");if(t)this.replaceMediaSection(n,t);else if(!this._midToIndex.has(n.mid))this.addMediaSection(n);else this.replaceMediaSection(n)}receive({mid:e,kind:t,offerRtpParameters:r,streamId:s,trackId:i}){this.setSessionExtmapAllowMixed();let n=new Ce.RemoteOfferMediaSection({iceParameters:this._iceParameters,iceCandidates:this._iceCandidates,dtlsParameters:this._dtlsParameters,plainRtpParameters:this._plainRtpParameters,mid:e,kind:t,offerRtpParameters:r,streamId:s,trackId:i}),a=this._mediaSections.find((o)=>o.closed&&o.getObject().type===t);if(a)this.replaceMediaSection(n,a.mid);else this.addMediaSection(n)}pauseMediaSection(e){this.findMediaSection(e).pause()}resumeSendingMediaSection(e){this.findMediaSection(e).resume()}resumeReceivingMediaSection(e){this.findMediaSection(e).resume()}disableMediaSection(e){this.findMediaSection(e).disable()}closeMediaSection(e){let t=this.findMediaSection(e);if(e===this._firstMid)return Yt.debug("closeMediaSection() | cannot close first media section, disabling it instead [mid:%s]",e),this.disableMediaSection(e),!1;return t.close(),this.regenerateBundleMids(),!0}muxMediaSectionSimulcast(e,t){let r=this.findMediaSection(e);r.muxSimulcastStreams(t),this.replaceMediaSection(r)}sendSctpAssociation({offerMediaObject:e}){let t=new Ce.RemoteAnswerMediaSection({iceParameters:this._iceParameters,iceCandidates:this._iceCandidates,dtlsParameters:this._dtlsParameters,sctpParameters:this._sctpParameters,plainRtpParameters:this._plainRtpParameters,offerMediaObject:e});this.addMediaSection(t)}receiveSctpAssociation(){let e=new Ce.RemoteOfferMediaSection({iceParameters:this._iceParameters,iceCandidates:this._iceCandidates,dtlsParameters:this._dtlsParameters,sctpParameters:this._sctpParameters,plainRtpParameters:this._plainRtpParameters,mid:"datachannel",kind:"application"});this.addMediaSection(e)}getSdp(){return this._sdpObject.origin.sessionVersion++,co.write(this._sdpObject)}addMediaSection(e){if(!this._firstMid)this._firstMid=e.mid;this._mediaSections.push(e),this._midToIndex.set(e.mid,this._mediaSections.length-1),this._sdpObject.media.push(e.getObject()),this.regenerateBundleMids()}replaceMediaSection(e,t){if(typeof t==="string"){let r=this._midToIndex.get(t);if(r===void 0)throw Error(`no media section found for reuseMid '${t}'`);let s=this._mediaSections[r];this._mediaSections[r]=e,this._midToIndex.delete(s.mid),this._midToIndex.set(e.mid,r),this._sdpObject.media[r]=e.getObject(),this.regenerateBundleMids()}else{let r=this._midToIndex.get(e.mid);if(r===void 0)throw Error(`no media section found with mid '${e.mid}'`);this._mediaSections[r]=e,this._sdpObject.media[r]=e.getObject()}}findMediaSection(e){let t=this._midToIndex.get(e);if(t===void 0)throw Error(`no media section found with mid '${e}'`);return this._mediaSections[t]}regenerateBundleMids(){if(!this._dtlsParameters)return;this._sdpObject.groups[0].mids=this._mediaSections.filter((e)=>!e.closed).map((e)=>e.mid).join(" ")}}oe.RemoteSdp=li});var et=C(function(G){var lo=G&&G.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),uo=G&&G.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),ho=G&&G.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")lo(r,t,s[i])}return uo(r,t),r}}();Object.defineProperty(G,"__esModule",{value:!0});G.extractRtpCapabilities=fo;G.extractDtlsParameters=mo;G.getCname=go;G.applyCodecParameters=_o;var ui=ho(we());function fo({sdpObject:e}){let t=new Map,r=new Map;for(let i of e.media){let n=i.type;switch(n){case"audio":case"video":break;default:continue}for(let a of i.rtp){let o={kind:n,mimeType:`${n}/${a.codec}`,preferredPayloadType:a.payload,clockRate:a.rate,channels:a.encoding,parameters:{},rtcpFeedback:[]};t.set(o.preferredPayloadType,o)}for(let a of i.fmtp??[]){let o=ui.parseParams(a.config),c=t.get(a.payload);if(!c)continue;if(o?.hasOwnProperty("profile-level-id"))o["profile-level-id"]=String(o["profile-level-id"]);c.parameters=o}for(let a of i.rtcpFb??[]){let o={type:a.type,parameter:a.subtype};if(!o.parameter)delete o.parameter;if(a.payload!=="*"){let c=t.get(Number(a.payload));if(!c)continue;c.rtcpFeedback.push(o)}else for(let c of t.values())if(c.kind===n&&!/.+\/rtx$/i.test(c.mimeType))c.rtcpFeedback.push(o)}for(let a of i.ext??[]){if(a["encrypt-uri"])continue;let o={kind:n,uri:a.uri,preferredId:a.value};r.set(`${n}:${o.preferredId}`,o)}}return{codecs:Array.from(t.values()),headerExtensions:Array.from(r.values())}}function mo({sdpObject:e}){let{setup:t,fingerprint:r}=e;if(!t||!r){let n=(e.media??[]).find((a)=>a.port!==0);if(n)t=t??n.setup,r=r??n.fingerprint}if(!t)throw Error("no a=setup found at SDP session or media level");else if(!r)throw Error("no a=fingerprint found at SDP session or media level");let s;switch(t){case"active":{s="client";break}case"passive":{s="server";break}case"actpass":{s="auto";break}}return{role:s,fingerprints:[{algorithm:r.type,value:r.hash}]}}function go({offerMediaObject:e}){let t=(e.ssrcs??[]).find((r)=>r.attribute==="cname");if(!t)return"";return t.value}function _o({offerRtpParameters:e,answerMediaObject:t}){for(let r of e.codecs){let s=r.mimeType.toLowerCase();if(s!=="audio/opus")continue;if(!(t.rtp??[]).find((o)=>o.payload===r.payloadType))continue;t.fmtp=t.fmtp??[];let n=t.fmtp.find((o)=>o.payload===r.payloadType);if(!n)n={payload:r.payloadType,config:""},t.fmtp.push(n);let a=ui.parseParams(n.config);switch(s){case"audio/opus":{let o=r.parameters?.["sprop-stereo"];if(o!==void 0)a.stereo=Number(o)?1:0;break}}n.config="";for(let o of Object.keys(a)){if(n.config)n.config+=";";n.config+=`${o}=${a[o]}`}}}});var tt=C(function(Zt){Object.defineProperty(Zt,"__esModule",{value:!0});Zt.getRtpEncodings=vo;Zt.addLegacySimulcast=wo;function vo({offerMediaObject:e,codecs:t}){let r=new Set;for(let n of e.ssrcs??[]){let a=n.id;if(a)r.add(a)}if(r.size===0)throw Error("no a=ssrc lines found");let s=new Map;for(let n of e.ssrcGroups??[]){if(n.semantics!=="FID")continue;let a=n.ssrcs.split(/\s+/),o=Number(a[0]),c=Number(a[1]);if(r.has(o))r.delete(o),r.delete(c),s.set(o,c)}for(let n of r)s.set(n,void 0);let i=[];for(let[n,a]of s){let o={ssrc:n};if(a&&t.length>1)o.rtx={ssrc:a};i.push(o)}return i}function wo({offerMediaObject:e,numStreams:t}){if(t<=1)throw TypeError("numStreams must be greater than 1");let r=(e.ssrcs??[]).find((p)=>p.attribute==="msid");if(!r)throw Error("a=ssrc line with msid information not found");let[s,i]=r.value.split(" "),n=Number(r.id),a;(e.ssrcGroups??[]).some((p)=>{if(p.semantics!=="FID")return!1;let u=p.ssrcs.split(/\s+/);if(Number(u[0])===n)return a=Number(u[1]),!0;else return!1});let o=(e.ssrcs??[]).find((p)=>p.attribute==="cname");if(!o)throw Error("a=ssrc line with cname information not found");let c=o.value,d=[],l=[];for(let p=0;p<t;++p)if(d.push(n+p),a)l.push(a+p);e.ssrcGroups=[],e.ssrcs=[],e.ssrcGroups.push({semantics:"SIM",ssrcs:d.join(" ")});for(let p of d)e.ssrcs.push({id:p,attribute:"cname",value:c}),e.ssrcs.push({id:p,attribute:"msid",value:`${s} ${i}`});for(let p=0;p<l.length;++p){let u=d[p],h=l[p];e.ssrcs.push({id:h,attribute:"cname",value:c}),e.ssrcs.push({id:h,attribute:"msid",value:`${s} ${i}`}),e.ssrcGroups.push({semantics:"FID",ssrcs:`${u} ${h}`})}}});var rt=C(function(ht){Object.defineProperty(ht,"__esModule",{value:!0});ht.addNackSupportForOpus=yo;ht.getMsidStreamIdAndTrackId=So;ht.applyForcedRtpExtensions=Ro;var hi=I(),bo=new hi.Logger("ortc/utils");function yo(e){for(let t of e.codecs??[])if((t.mimeType.toLowerCase()==="audio/opus"||t.mimeType.toLowerCase()==="audio/multiopus")&&!t.rtcpFeedback?.some((r)=>r.type==="nack"&&!r.parameter)){if(!t.rtcpFeedback)t.rtcpFeedback=[];t.rtcpFeedback.push({type:"nack"})}}function So(e){if(!e||typeof e!=="string")return{msidStreamId:void 0,msidTrackId:void 0};let[t,r]=e.trim().split(/\s+/);if(!t)return{msidStreamId:void 0,msidTrackId:void 0};return{msidStreamId:t,msidTrackId:r}}function Ro(e,t){if(!e.getHeaderExtensionsToNegotiate||!e.setHeaderExtensionsToNegotiate)return!1;if(Object.keys(t).length===0)return!1;let r=e.getHeaderExtensionsToNegotiate();r=r.map((s)=>{let i=s.uri,n=t[i];if(n===!0)s.direction="sendrecv";else if(n===!1)s.direction="stopped";return s});try{e.setHeaderExtensionsToNegotiate(r)}catch(s){return bo.error("applyForcedRtpExtensions() | transceiver.setHeaderExtensionsToNegotiate() failed",{transceiver:e,forcedRtpExtensions:t,extensionsToNegotiate:r,error:s}),!1}return!0}});var yi=C(function(ce){var Co=ce&&ce.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Eo=ce&&ce.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),gt=ce&&ce.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")Co(r,t,s[i])}return Eo(r,t),r}}();Object.defineProperty(ce,"__esModule",{value:!0});ce.Chrome111=void 0;var be=gt(we()),gi=A(),_i=I(),ft=gt(re()),vi=H(),wi=Me(),bi=Xe(),Xt=gt(et()),fi=gt(tt()),st=gt(rt()),y=new _i.Logger("Chrome111"),mi="Chrome111";class mt extends gi.EnhancedEventEmitter{_closed=!1;_direction;_sctpMaxReceiveMessageSize;_remoteSdp;_getSendExtendedRtpCapabilities;_forcedRtpExtensions;_forcedLocalDtlsRole;_pc;_mapMidTransceiver=new Map;_sendStream=new MediaStream;_hasDataChannelMediaSection=!1;_nextSendSctpStreamId=0;_transportReady=!1;static createFactory({forcedRtpExtensions:e}){return{name:mi,factory:(t)=>new mt({...t,forcedRtpExtensions:e}),getNativeRtpCapabilities:async({direction:t})=>{y.debug("getNativeRtpCapabilities() [direction:%o]",t);let r=new RTCPeerConnection({iceServers:[],iceTransportPolicy:"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require"});try{let s=r.addTransceiver("audio",{direction:t});if(e)st.applyForcedRtpExtensions(s,e);let i=r.addTransceiver("video",{direction:t,sendEncodings:[{scalabilityMode:"L3T3"}]});if(e)st.applyForcedRtpExtensions(i,e);let n=await r.createOffer();try{r.close()}catch(c){}r=void 0;let a=be.parse(n.sdp);return mt.getLocalRtpCapabilities(a)}catch(s){try{r?.close()}catch(i){}throw r=void 0,s}}}}static getLocalRtpCapabilities(e){let t=Xt.extractRtpCapabilities({sdpObject:e});return ft.validateAndNormalizeRtpCapabilities(t),st.addNackSupportForOpus(t),t}constructor({direction:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,getSendExtendedRtpCapabilities:c,forcedRtpExtensions:d}){super();if(y.debug("constructor()"),this._direction=e,this._sctpMaxReceiveMessageSize=i?.maxSendMessageSize,this._remoteSdp=new bi.RemoteSdp({iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i}),this._getSendExtendedRtpCapabilities=c,this._forcedRtpExtensions=d,s.role&&s.role!=="auto")this._forcedLocalDtlsRole=s.role==="server"?"client":"server";if(this._pc=new RTCPeerConnection({iceServers:n??[],iceTransportPolicy:a??"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require",...o}),this._pc.addEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.addEventListener("icecandidateerror",this.onIceCandidateError),this._pc.connectionState)this._pc.addEventListener("connectionstatechange",this.onConnectionStateChange);else y.warn("run() | pc.connectionState not supported, using pc.iceConnectionState"),this._pc.addEventListener("iceconnectionstatechange",this.onIceConnectionStateChange)}get name(){return mi}close(){if(y.debug("close()"),this._closed)return;this._closed=!0;try{this._pc.close()}catch(e){}this._pc.removeEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.removeEventListener("icecandidateerror",this.onIceCandidateError),this._pc.removeEventListener("connectionstatechange",this.onConnectionStateChange),this._pc.removeEventListener("iceconnectionstatechange",this.onIceConnectionStateChange),this.emit("@close"),super.close()}async updateIceServers(e){this.assertNotClosed(),y.debug("updateIceServers()");let t=this._pc.getConfiguration();t.iceServers=e,this._pc.setConfiguration(t)}async restartIce(e){if(this.assertNotClosed(),y.debug("restartIce()"),this._remoteSdp.updateIceParameters(e),!this._transportReady)return;if(this._direction==="send"){let t=await this._pc.createOffer({iceRestart:!0});y.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]",t),await this._pc.setLocalDescription(t);let r={type:"answer",sdp:this._remoteSdp.getSdp()};y.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]",r),await this._pc.setRemoteDescription(r)}else{let t={type:"offer",sdp:this._remoteSdp.getSdp()};y.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();y.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}}async getTransportStats(){return this.assertNotClosed(),this._pc.getStats()}async send({track:e,streamId:t,encodings:r,codecOptions:s,codec:i,onRtpSender:n}){if(this.assertNotClosed(),this.assertSendDirection(),y.debug("send() [kind:%s, track.id:%s, streamId:%s]",e.kind,e.id,t),r&&r.length>1){let o=1;for(let c of r){let d=c.scalabilityMode?wi.parse(c.scalabilityMode).temporalLayers:3;if(d>o)o=d}r.forEach((c,d)=>{c.rid=`r${d}`,c.scalabilityMode=`L1T${o}`})}let a;try{a=this._pc.addTransceiver(e,{direction:"sendonly",streams:[this._sendStream],sendEncodings:r});let o=this._remoteSdp.getNextMediaSectionIdx();if(this._forcedRtpExtensions)st.applyForcedRtpExtensions(a,this._forcedRtpExtensions);if(n)n(a.sender);let c=await this._pc.createOffer(),d=be.parse(c.sdp);if(d.extmapAllowMixed)this._remoteSdp.setSessionExtmapAllowMixed();let l=mt.getLocalRtpCapabilities(d),p=this._getSendExtendedRtpCapabilities(l),u=ft.getSendingRtpParameters(e.kind,p);u.codecs=ft.reduceCodecs(u.codecs,i);let h=ft.getSendingRemoteRtpParameters(e.kind,p);if(h.codecs=ft.reduceCodecs(h.codecs,i),!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:d});y.debug("send() | calling pc.setLocalDescription() [offer:%o]",c),await this._pc.setLocalDescription(c);let f=a.mid;u.mid=f,d=be.parse(this._pc.localDescription.sdp);let m=d.media[o.idx];if(u.rtcp.cname=Xt.getCname({offerMediaObject:m}),u.msid=`${t??this._sendStream.id} ${e.id}`,!r)u.encodings=fi.getRtpEncodings({offerMediaObject:m,codecs:u.codecs});else if(r.length===1){let T=fi.getRtpEncodings({offerMediaObject:m,codecs:u.codecs});Object.assign(T[0],r[0]),u.encodings=T}else u.encodings=r;this._remoteSdp.send({offerMediaObject:m,reuseMid:o.reuseMid,offerRtpParameters:u,answerRtpParameters:h,codecOptions:s});let w={type:"answer",sdp:this._remoteSdp.getSdp()};return y.debug("send() | calling pc.setRemoteDescription() [answer:%o]",w),await this._pc.setRemoteDescription(w),this._mapMidTransceiver.set(f,a),{localId:f,rtpParameters:u,rtpSender:a.sender}}catch(o){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(c){}a?.stop()}catch(c){}throw o}}async stopSending(e){if(this.assertSendDirection(),y.debug("stopSending() [localId:%s]",e),this._closed)return;let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");if(t.sender.replaceTrack(null),this._pc.removeTrack(t.sender),this._remoteSdp.closeMediaSection(t.mid))try{t.stop()}catch(n){}let s=await this._pc.createOffer();y.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]",s),await this._pc.setLocalDescription(s);let i={type:"answer",sdp:this._remoteSdp.getSdp()};y.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]",i),await this._pc.setRemoteDescription(i),this._mapMidTransceiver.delete(e)}async pauseSending(e){this.assertNotClosed(),this.assertSendDirection(),y.debug("pauseSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");t.direction="inactive",this._remoteSdp.pauseMediaSection(e);let r=await this._pc.createOffer();y.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};y.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async resumeSending(e){this.assertNotClosed(),this.assertSendDirection(),y.debug("resumeSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(this._remoteSdp.resumeSendingMediaSection(e),!t)throw Error("associated RTCRtpTransceiver not found");t.direction="sendonly";let r=await this._pc.createOffer();y.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};y.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async replaceTrack(e,t){if(this.assertNotClosed(),this.assertSendDirection(),t)y.debug("replaceTrack() [localId:%s, track.id:%s]",e,t.id);else y.debug("replaceTrack() [localId:%s, no track]",e);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");await r.sender.replaceTrack(t)}async setMaxSpatialLayer(e,t){this.assertNotClosed(),this.assertSendDirection(),y.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{if(o<=t)a.active=!0;else a.active=!1}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();y.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};y.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async setRtpEncodingParameters(e,t){this.assertNotClosed(),this.assertSendDirection(),y.debug("setRtpEncodingParameters() [localId:%s, params:%o]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{s.encodings[o]={...a,...t}}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();y.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};y.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async getSenderStats(e){this.assertNotClosed(),this.assertSendDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.sender.getStats()}async sendDataChannel({sctpStreamParameters:e}){this.assertNotClosed(),this.assertSendDirection();let t={negotiated:!0,id:this._nextSendSctpStreamId,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits,protocol:e.protocol};y.debug("sendDataChannel() [options:%o]",t);let r=this._pc.createDataChannel(e.label,t);if(this._nextSendSctpStreamId=++this._nextSendSctpStreamId%(this._pc.sctp?.maxChannels??65536),!this._hasDataChannelMediaSection)try{let i=await this._pc.createOffer(),n=be.parse(i.sdp),a=n.media.find((c)=>c.type==="application");if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});y.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i),this._remoteSdp.sendSctpAssociation({offerMediaObject:a});let o={type:"answer",sdp:this._remoteSdp.getSdp()};y.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]",o),await this._pc.setRemoteDescription(o),this._hasDataChannelMediaSection=!0}catch(i){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(n){}r.close()}catch(n){}throw i}let s={streamId:t.id,ordered:t.ordered,maxPacketLifeTime:t.maxPacketLifeTime,maxRetransmits:t.maxRetransmits};return{dataChannel:r,sctpStreamParameters:s}}async receive(e){this.assertNotClosed(),this.assertRecvDirection();let t=[],r=new Map;for(let a of e){let{trackId:o,kind:c,rtpParameters:d,streamId:l}=a;y.debug("receive() [trackId:%s, kind:%s]",o,c);let p=d.mid??String(this._mapMidTransceiver.size);r.set(o,p);let{msidStreamId:u}=st.getMsidStreamIdAndTrackId(d.msid);this._remoteSdp.receive({mid:p,kind:c,offerRtpParameters:d,streamId:l??u??d.rtcp?.cname??"-",trackId:o})}let s={type:"offer",sdp:this._remoteSdp.getSdp()};y.debug("receive() | calling pc.setRemoteDescription() [offer:%o]",s),await this._pc.setRemoteDescription(s);for(let a of e){let{trackId:o,onRtpReceiver:c}=a;if(c){let d=r.get(o),l=this._pc.getTransceivers().find((p)=>p.mid===d);if(!l)throw Error("transceiver not found");if(this._forcedRtpExtensions)st.applyForcedRtpExtensions(l,this._forcedRtpExtensions);c(l.receiver)}}let i=await this._pc.createAnswer(),n=be.parse(i.sdp);for(let a of e){let{trackId:o,rtpParameters:c}=a,d=r.get(o),l=n.media.find((p)=>String(p.mid)===d);Xt.applyCodecParameters({offerRtpParameters:c,answerMediaObject:l})}if(i={type:"answer",sdp:be.write(n)},!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});y.debug("receive() | calling pc.setLocalDescription() [answer:%o]",i),await this._pc.setLocalDescription(i);for(let a of e){let{trackId:o}=a,c=r.get(o),d=this._pc.getTransceivers().find((l)=>l.mid===c);if(!d)throw Error("new RTCRtpTransceiver not found");else this._mapMidTransceiver.set(c,d),t.push({localId:c,track:d.receiver.track,rtpReceiver:d.receiver})}return t}async stopReceiving(e){if(this.assertRecvDirection(),this._closed)return;for(let s of e){y.debug("stopReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");this._remoteSdp.closeMediaSection(i.mid)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};y.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();y.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r);for(let s of e)this._mapMidTransceiver.delete(s)}async pauseReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){y.debug("pauseReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="inactive",this._remoteSdp.pauseMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};y.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();y.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async resumeReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){y.debug("resumeReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="recvonly",this._remoteSdp.resumeReceivingMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};y.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();y.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async getReceiverStats(e){this.assertNotClosed(),this.assertRecvDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.receiver.getStats()}async receiveDataChannel({maxMessageSize:e,sctpStreamParameters:t,label:r,protocol:s}){this.assertNotClosed(),this.assertRecvDirection();let{streamId:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o}=t,c={negotiated:!0,id:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o,protocol:s};y.debug("receiveDataChannel() [options:%o]",c);let d=this._pc.createDataChannel(r,c);if(!this._hasDataChannelMediaSection){this._remoteSdp.receiveSctpAssociation();let l={type:"offer",sdp:this._remoteSdp.getSdp()};y.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]",l),await this._pc.setRemoteDescription(l);let p=await this._pc.createAnswer(),u=be.parse(p.sdp),h=u.media.find((f)=>f.type==="application");if(typeof e==="number")h.maxMessageSize=e;if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:u});p={type:"answer",sdp:be.write(u)},y.debug("receiveDataChannel() | calling pc.setLocalDescription() [answer:%o]",p),await this._pc.setLocalDescription(p),this._hasDataChannelMediaSection=!0}return{dataChannel:d}}getDataChannelMaxMessageSize(){return this._direction==="send"?this._pc.sctp?.maxMessageSize:this._sctpMaxReceiveMessageSize}async setupTransport({localDtlsRole:e,localSdpObject:t}){if(!t)t=be.parse(this._pc.localDescription.sdp);let r=Xt.extractDtlsParameters({sdpObject:t});r.role=e,this._remoteSdp.updateDtlsRole(e==="client"?"server":"client"),await new Promise((s,i)=>{this.safeEmit("@connect",{dtlsParameters:r},s,i)}),this._transportReady=!0}onIceGatheringStateChange=()=>{this.emit("@icegatheringstatechange",this._pc.iceGatheringState)};onIceCandidateError=(e)=>{this.emit("@icecandidateerror",e)};onConnectionStateChange=()=>{this.emit("@connectionstatechange",this._pc.connectionState)};onIceConnectionStateChange=()=>{switch(this._pc.iceConnectionState){case"checking":{this.emit("@connectionstatechange","connecting");break}case"connected":case"completed":{this.emit("@connectionstatechange","connected");break}case"failed":{this.emit("@connectionstatechange","failed");break}case"disconnected":{this.emit("@connectionstatechange","disconnected");break}case"closed":{this.emit("@connectionstatechange","closed");break}}};assertNotClosed(){if(this._closed)throw new vi.InvalidStateError("method called in a closed handler")}assertSendDirection(){if(this._direction!=="send")throw Error('method can just be called for handlers with "send" direction')}assertRecvDirection(){if(this._direction!=="recv")throw Error('method can just be called for handlers with "recv" direction')}}ce.Chrome111=mt});var xi=C(function(de){var To=de&&de.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Do=de&&de.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),wt=de&&de.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")To(r,t,s[i])}return Do(r,t),r}}();Object.defineProperty(de,"__esModule",{value:!0});de.Chrome74=void 0;var Z=wt(we()),Ri=I(),Ci=A(),_t=wt(re()),Ei=H(),Ti=Me(),Di=Xe(),er=wt(et()),Dr=wt(tt()),it=wt(rt()),b=new Ri.Logger("Chrome74"),Si="Chrome74";class vt extends Ci.EnhancedEventEmitter{_closed=!1;_direction;_sctpMaxReceiveMessageSize;_remoteSdp;_getSendExtendedRtpCapabilities;_forcedRtpExtensions;_forcedLocalDtlsRole;_pc;_mapMidTransceiver=new Map;_sendStream=new MediaStream;_hasDataChannelMediaSection=!1;_nextSendSctpStreamId=0;_transportReady=!1;static createFactory({forcedRtpExtensions:e}){return{name:Si,factory:(t)=>new vt({...t,forcedRtpExtensions:e}),getNativeRtpCapabilities:async({direction:t})=>{b.debug("getNativeRtpCapabilities() [direction:%o]",t);let r=new RTCPeerConnection({iceServers:[],iceTransportPolicy:"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require"});try{let s=r.addTransceiver("audio",{direction:t});if(e)it.applyForcedRtpExtensions(s,e);let i=r.addTransceiver("video",{direction:t});if(e)it.applyForcedRtpExtensions(i,e);let n=await r.createOffer();try{r.close()}catch(c){}r=void 0;let a=Z.parse(n.sdp);return vt.getLocalRtpCapabilities(a)}catch(s){try{r?.close()}catch(i){}throw r=void 0,s}}}}static getLocalRtpCapabilities(e){let t=er.extractRtpCapabilities({sdpObject:e});return _t.validateAndNormalizeRtpCapabilities(t),it.addNackSupportForOpus(t),t}constructor({direction:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,getSendExtendedRtpCapabilities:c,forcedRtpExtensions:d}){super();if(b.debug("constructor()"),this._direction=e,this._sctpMaxReceiveMessageSize=i?.maxSendMessageSize,this._remoteSdp=new Di.RemoteSdp({iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i}),this._getSendExtendedRtpCapabilities=c,this._forcedRtpExtensions=d,s.role&&s.role!=="auto")this._forcedLocalDtlsRole=s.role==="server"?"client":"server";if(this._pc=new RTCPeerConnection({iceServers:n??[],iceTransportPolicy:a??"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require",...o}),this._pc.addEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.addEventListener("icecandidateerror",this.onIceCandidateError),this._pc.connectionState)this._pc.addEventListener("connectionstatechange",this.onConnectionStateChange);else b.warn("run() | pc.connectionState not supported, using pc.iceConnectionState"),this._pc.addEventListener("iceconnectionstatechange",this.onIceConnectionStateChange)}get name(){return Si}close(){if(b.debug("close()"),this._closed)return;this._closed=!0;try{this._pc.close()}catch(e){}this._pc.removeEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.removeEventListener("icecandidateerror",this.onIceCandidateError),this._pc.removeEventListener("connectionstatechange",this.onConnectionStateChange),this._pc.removeEventListener("iceconnectionstatechange",this.onIceConnectionStateChange),this.emit("@close"),super.close()}async updateIceServers(e){this.assertNotClosed(),b.debug("updateIceServers()");let t=this._pc.getConfiguration();t.iceServers=e,this._pc.setConfiguration(t)}async restartIce(e){if(this.assertNotClosed(),b.debug("restartIce()"),this._remoteSdp.updateIceParameters(e),!this._transportReady)return;if(this._direction==="send"){let t=await this._pc.createOffer({iceRestart:!0});b.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]",t),await this._pc.setLocalDescription(t);let r={type:"answer",sdp:this._remoteSdp.getSdp()};b.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]",r),await this._pc.setRemoteDescription(r)}else{let t={type:"offer",sdp:this._remoteSdp.getSdp()};b.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();b.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}}async getTransportStats(){return this.assertNotClosed(),this._pc.getStats()}async send({track:e,streamId:t,encodings:r,codecOptions:s,codec:i,onRtpSender:n}){if(this.assertNotClosed(),this.assertSendDirection(),b.debug("send() [kind:%s, track.id:%s, streamId:%s]",e.kind,e.id,t),r&&r.length>1)r.forEach((o,c)=>{o.rid=`r${c}`});let a;try{a=this._pc.addTransceiver(e,{direction:"sendonly",streams:[this._sendStream],sendEncodings:r});let o=this._remoteSdp.getNextMediaSectionIdx();if(this._forcedRtpExtensions)it.applyForcedRtpExtensions(a,this._forcedRtpExtensions);if(n)n(a.sender);let c=await this._pc.createOffer(),d=Z.parse(c.sdp);if(d.extmapAllowMixed)this._remoteSdp.setSessionExtmapAllowMixed();let l=vt.getLocalRtpCapabilities(d),p=this._getSendExtendedRtpCapabilities(l),u=_t.getSendingRtpParameters(e.kind,p);u.codecs=_t.reduceCodecs(u.codecs,i);let h=_t.getSendingRemoteRtpParameters(e.kind,p);if(h.codecs=_t.reduceCodecs(h.codecs,i),!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:d});let f=!1,m=Ti.parse((r??[{}])[0].scalabilityMode),w;if(r?.length===1&&m.spatialLayers>1&&u.codecs[0].mimeType.toLowerCase()==="video/vp9")b.debug("send() | enabling legacy simulcast for VP9 SVC"),f=!0,d=Z.parse(c.sdp),w=d.media[o.idx],Dr.addLegacySimulcast({offerMediaObject:w,numStreams:m.spatialLayers}),c={type:"offer",sdp:Z.write(d)};b.debug("send() | calling pc.setLocalDescription() [offer:%o]",c),await this._pc.setLocalDescription(c);let T=a.mid;if(u.mid=T,d=Z.parse(this._pc.localDescription.sdp),w=d.media[o.idx],u.rtcp.cname=er.getCname({offerMediaObject:w}),u.msid=`${t??this._sendStream.id} ${e.id}`,!r)u.encodings=Dr.getRtpEncodings({offerMediaObject:w,codecs:u.codecs});else if(r.length===1){let L=Dr.getRtpEncodings({offerMediaObject:w,codecs:u.codecs});if(Object.assign(L[0],r[0]),f)L=[L[0]];u.encodings=L}else u.encodings=r;if(u.encodings.length>1&&(u.codecs[0].mimeType.toLowerCase()==="video/vp8"||u.codecs[0].mimeType.toLowerCase()==="video/h264"))for(let L of u.encodings)if(L.scalabilityMode)L.scalabilityMode=`L1T${m.temporalLayers}`;else L.scalabilityMode="L1T3";this._remoteSdp.send({offerMediaObject:w,reuseMid:o.reuseMid,offerRtpParameters:u,answerRtpParameters:h,codecOptions:s});let U={type:"answer",sdp:this._remoteSdp.getSdp()};return b.debug("send() | calling pc.setRemoteDescription() [answer:%o]",U),await this._pc.setRemoteDescription(U),this._mapMidTransceiver.set(T,a),{localId:T,rtpParameters:u,rtpSender:a.sender}}catch(o){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(c){}a?.stop()}catch(c){}throw o}}async stopSending(e){if(this.assertSendDirection(),b.debug("stopSending() [localId:%s]",e),this._closed)return;let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");if(t.sender.replaceTrack(null),this._pc.removeTrack(t.sender),this._remoteSdp.closeMediaSection(t.mid))try{t.stop()}catch(n){}let s=await this._pc.createOffer();b.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]",s),await this._pc.setLocalDescription(s);let i={type:"answer",sdp:this._remoteSdp.getSdp()};b.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]",i),await this._pc.setRemoteDescription(i),this._mapMidTransceiver.delete(e)}async pauseSending(e){this.assertNotClosed(),this.assertSendDirection(),b.debug("pauseSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");t.direction="inactive",this._remoteSdp.pauseMediaSection(e);let r=await this._pc.createOffer();b.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};b.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async resumeSending(e){this.assertNotClosed(),this.assertSendDirection(),b.debug("resumeSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(this._remoteSdp.resumeSendingMediaSection(e),!t)throw Error("associated RTCRtpTransceiver not found");t.direction="sendonly";let r=await this._pc.createOffer();b.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};b.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async replaceTrack(e,t){if(this.assertNotClosed(),this.assertSendDirection(),t)b.debug("replaceTrack() [localId:%s, track.id:%s]",e,t.id);else b.debug("replaceTrack() [localId:%s, no track]",e);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");await r.sender.replaceTrack(t)}async setMaxSpatialLayer(e,t){this.assertNotClosed(),this.assertSendDirection(),b.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{if(o<=t)a.active=!0;else a.active=!1}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();b.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};b.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async setRtpEncodingParameters(e,t){this.assertNotClosed(),this.assertSendDirection(),b.debug("setRtpEncodingParameters() [localId:%s, params:%o]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{s.encodings[o]={...a,...t}}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();b.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};b.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async getSenderStats(e){this.assertNotClosed(),this.assertSendDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.sender.getStats()}async sendDataChannel({sctpStreamParameters:e}){this.assertNotClosed(),this.assertSendDirection();let t={negotiated:!0,id:this._nextSendSctpStreamId,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits,protocol:e.protocol};b.debug("sendDataChannel() [options:%o]",t);let r=this._pc.createDataChannel(e.label,t);if(this._nextSendSctpStreamId=++this._nextSendSctpStreamId%(this._pc.sctp?.maxChannels??65536),!this._hasDataChannelMediaSection)try{let i=await this._pc.createOffer(),n=Z.parse(i.sdp),a=n.media.find((c)=>c.type==="application");if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});b.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i),this._remoteSdp.sendSctpAssociation({offerMediaObject:a});let o={type:"answer",sdp:this._remoteSdp.getSdp()};b.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]",o),await this._pc.setRemoteDescription(o),this._hasDataChannelMediaSection=!0}catch(i){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(n){}r.close()}catch(n){}throw i}let s={streamId:t.id,ordered:t.ordered,maxPacketLifeTime:t.maxPacketLifeTime,maxRetransmits:t.maxRetransmits};return{dataChannel:r,sctpStreamParameters:s}}async receive(e){this.assertNotClosed(),this.assertRecvDirection();let t=[],r=new Map;for(let a of e){let{trackId:o,kind:c,rtpParameters:d,streamId:l}=a;b.debug("receive() [trackId:%s, kind:%s]",o,c);let p=d.mid??String(this._mapMidTransceiver.size);r.set(o,p);let{msidStreamId:u}=it.getMsidStreamIdAndTrackId(d.msid);this._remoteSdp.receive({mid:p,kind:c,offerRtpParameters:d,streamId:l??u??d.rtcp?.cname??"-",trackId:o})}let s={type:"offer",sdp:this._remoteSdp.getSdp()};b.debug("receive() | calling pc.setRemoteDescription() [offer:%o]",s),await this._pc.setRemoteDescription(s);for(let a of e){let{trackId:o,onRtpReceiver:c}=a;if(c){let d=r.get(o),l=this._pc.getTransceivers().find((p)=>p.mid===d);if(!l)throw Error("transceiver not found");if(this._forcedRtpExtensions)it.applyForcedRtpExtensions(l,this._forcedRtpExtensions);c(l.receiver)}}let i=await this._pc.createAnswer(),n=Z.parse(i.sdp);for(let a of e){let{trackId:o,rtpParameters:c}=a,d=r.get(o),l=n.media.find((p)=>String(p.mid)===d);er.applyCodecParameters({offerRtpParameters:c,answerMediaObject:l})}if(i={type:"answer",sdp:Z.write(n)},!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});b.debug("receive() | calling pc.setLocalDescription() [answer:%o]",i),await this._pc.setLocalDescription(i);for(let a of e){let{trackId:o}=a,c=r.get(o),d=this._pc.getTransceivers().find((l)=>l.mid===c);if(!d)throw Error("new RTCRtpTransceiver not found");else this._mapMidTransceiver.set(c,d),t.push({localId:c,track:d.receiver.track,rtpReceiver:d.receiver})}return t}async stopReceiving(e){if(this.assertRecvDirection(),this._closed)return;for(let s of e){b.debug("stopReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");this._remoteSdp.closeMediaSection(i.mid)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};b.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();b.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r);for(let s of e)this._mapMidTransceiver.delete(s)}async pauseReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){b.debug("pauseReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="inactive",this._remoteSdp.pauseMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};b.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();b.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async resumeReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){b.debug("resumeReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="recvonly",this._remoteSdp.resumeReceivingMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};b.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();b.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async getReceiverStats(e){this.assertNotClosed(),this.assertRecvDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.receiver.getStats()}async receiveDataChannel({maxMessageSize:e,sctpStreamParameters:t,label:r,protocol:s}){this.assertNotClosed(),this.assertRecvDirection();let{streamId:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o}=t,c={negotiated:!0,id:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o,protocol:s};b.debug("receiveDataChannel() [options:%o]",c);let d=this._pc.createDataChannel(r,c);if(!this._hasDataChannelMediaSection){this._remoteSdp.receiveSctpAssociation();let l={type:"offer",sdp:this._remoteSdp.getSdp()};b.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]",l),await this._pc.setRemoteDescription(l);let p=await this._pc.createAnswer(),u=Z.parse(p.sdp),h=u.media.find((f)=>f.type==="application");if(typeof e==="number")h.maxMessageSize=e;if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:u});p={type:"answer",sdp:Z.write(u)},b.debug("receiveDataChannel() | calling pc.setLocalDescription() [answer:%o]",p),await this._pc.setLocalDescription(p),this._hasDataChannelMediaSection=!0}return{dataChannel:d}}getDataChannelMaxMessageSize(){return this._direction==="send"?this._pc.sctp?.maxMessageSize:this._sctpMaxReceiveMessageSize}async setupTransport({localDtlsRole:e,localSdpObject:t}){if(!t)t=Z.parse(this._pc.localDescription.sdp);let r=er.extractDtlsParameters({sdpObject:t});r.role=e,this._remoteSdp.updateDtlsRole(e==="client"?"server":"client"),await new Promise((s,i)=>{this.safeEmit("@connect",{dtlsParameters:r},s,i)}),this._transportReady=!0}onIceGatheringStateChange=()=>{this.emit("@icegatheringstatechange",this._pc.iceGatheringState)};onIceCandidateError=(e)=>{this.emit("@icecandidateerror",e)};onConnectionStateChange=()=>{this.emit("@connectionstatechange",this._pc.connectionState)};onIceConnectionStateChange=()=>{switch(this._pc.iceConnectionState){case"checking":{this.emit("@connectionstatechange","connecting");break}case"connected":case"completed":{this.emit("@connectionstatechange","connected");break}case"failed":{this.emit("@connectionstatechange","failed");break}case"disconnected":{this.emit("@connectionstatechange","disconnected");break}case"closed":{this.emit("@connectionstatechange","closed");break}}};assertNotClosed(){if(this._closed)throw new Ei.InvalidStateError("method called in a closed handler")}assertSendDirection(){if(this._direction!=="send")throw Error('method can just be called for handlers with "send" direction')}assertRecvDirection(){if(this._direction!=="recv")throw Error('method can just be called for handlers with "recv" direction')}}de.Chrome74=vt});var Fi=C(function(pe){var xo=pe&&pe.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Po=pe&&pe.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),Rt=pe&&pe.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")xo(r,t,s[i])}return Po(r,t),r}}();Object.defineProperty(pe,"__esModule",{value:!0});pe.Firefox120=void 0;var ye=Rt(we()),Mi=A(),ki=I(),Oi=H(),bt=Rt(re()),Ii=Me(),ji=Xe(),tr=Rt(et()),Pi=Rt(tt()),yt=Rt(rt()),S=new ki.Logger("Firefox120"),Li="Firefox120";class St extends Mi.EnhancedEventEmitter{_closed=!1;_direction;_sctpMaxReceiveMessageSize;_remoteSdp;_getSendExtendedRtpCapabilities;_forcedRtpExtensions;_pc;_mapMidTransceiver=new Map;_sendStream=new MediaStream;_hasDataChannelMediaSection=!1;_nextSendSctpStreamId=0;_transportReady=!1;static createFactory({forcedRtpExtensions:e}){return{name:Li,factory:(t)=>new St({...t,forcedRtpExtensions:e}),getNativeRtpCapabilities:async({direction:t})=>{S.debug("getNativeRtpCapabilities() [direction:%o]",t);let r=new RTCPeerConnection({iceServers:[],iceTransportPolicy:"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require"}),s=document.createElement("canvas");s.getContext("2d");let n=s.captureStream().getVideoTracks()[0];try{let a=r.addTransceiver("audio",{direction:t});if(e)yt.applyForcedRtpExtensions(a,e);let o=r.addTransceiver(n,{direction:t,sendEncodings:[{rid:"r0",maxBitrate:1e5},{rid:"r1",maxBitrate:500000}]});if(e)yt.applyForcedRtpExtensions(o,e);let c=await r.createOffer();try{s.remove()}catch(p){}try{n.stop()}catch(p){}try{r.close()}catch(p){}r=void 0;let d=ye.parse(c.sdp);return St.getLocalRtpCapabilities(d)}catch(a){try{s.remove()}catch(o){}try{n.stop()}catch(o){}try{r?.close()}catch(o){}throw r=void 0,a}}}}static getLocalRtpCapabilities(e){let t=tr.extractRtpCapabilities({sdpObject:e});return bt.validateAndNormalizeRtpCapabilities(t),t}constructor({direction:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,getSendExtendedRtpCapabilities:c,forcedRtpExtensions:d}){super();if(S.debug("constructor()"),this._direction=e,this._sctpMaxReceiveMessageSize=i?.maxSendMessageSize,this._remoteSdp=new ji.RemoteSdp({iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i}),this._getSendExtendedRtpCapabilities=c,this._forcedRtpExtensions=d,this._pc=new RTCPeerConnection({iceServers:n??[],iceTransportPolicy:a??"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require",...o}),this._pc.addEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.addEventListener("icecandidateerror",this.onIceCandidateError),this._pc.connectionState)this._pc.addEventListener("connectionstatechange",this.onConnectionStateChange);else S.warn("run() | pc.connectionState not supported, using pc.iceConnectionState"),this._pc.addEventListener("iceconnectionstatechange",this.onIceConnectionStateChange)}get name(){return Li}close(){if(S.debug("close()"),this._closed)return;this._closed=!0;try{this._pc.close()}catch(e){}this._pc.removeEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.removeEventListener("icecandidateerror",this.onIceCandidateError),this._pc.removeEventListener("connectionstatechange",this.onConnectionStateChange),this._pc.removeEventListener("iceconnectionstatechange",this.onIceConnectionStateChange),this.emit("@close"),super.close()}async updateIceServers(e){this.assertNotClosed(),S.debug("updateIceServers()");let t=this._pc.getConfiguration();t.iceServers=e,this._pc.setConfiguration(t)}async restartIce(e){if(this.assertNotClosed(),S.debug("restartIce()"),this._remoteSdp.updateIceParameters(e),!this._transportReady)return;if(this._direction==="send"){let t=await this._pc.createOffer({iceRestart:!0});S.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]",t),await this._pc.setLocalDescription(t);let r={type:"answer",sdp:this._remoteSdp.getSdp()};S.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]",r),await this._pc.setRemoteDescription(r)}else{let t={type:"offer",sdp:this._remoteSdp.getSdp()};S.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();S.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}}async getTransportStats(){return this.assertNotClosed(),this._pc.getStats()}async send({track:e,streamId:t,encodings:r,codecOptions:s,codec:i,onRtpSender:n}){if(this.assertNotClosed(),this.assertSendDirection(),S.debug("send() [kind:%s, track.id:%s, streamId:%s]",e.kind,e.id,t),r&&r.length>1)r.forEach((o,c)=>{o.rid=`r${c}`});let a;try{if(a=this._pc.addTransceiver(e,{direction:"sendonly",streams:[this._sendStream],sendEncodings:r}),this._forcedRtpExtensions)yt.applyForcedRtpExtensions(a,this._forcedRtpExtensions);if(n)n(a.sender);let o=await this._pc.createOffer(),c=ye.parse(o.sdp);if(c.extmapAllowMixed)this._remoteSdp.setSessionExtmapAllowMixed();let d=St.getLocalRtpCapabilities(c),l=this._getSendExtendedRtpCapabilities(d),p=bt.getSendingRtpParameters(e.kind,l);p.codecs=bt.reduceCodecs(p.codecs,i);let u=bt.getSendingRemoteRtpParameters(e.kind,l);if(u.codecs=bt.reduceCodecs(u.codecs,i),!this._transportReady)await this.setupTransport({localDtlsRole:"client",localSdpObject:c});let h=Ii.parse((r??[{}])[0].scalabilityMode);S.debug("send() | calling pc.setLocalDescription() [offer:%o]",o),await this._pc.setLocalDescription(o);let f=a.mid;p.mid=f,c=ye.parse(this._pc.localDescription.sdp);let m=c.media[c.media.length-1];if(p.rtcp.cname=tr.getCname({offerMediaObject:m}),p.msid=`${t??this._sendStream.id} ${e.id}`,!r)p.encodings=Pi.getRtpEncodings({offerMediaObject:m,codecs:p.codecs});else if(r.length===1){let T=Pi.getRtpEncodings({offerMediaObject:m,codecs:p.codecs});Object.assign(T[0],r[0]),p.encodings=T}else p.encodings=r;if(p.encodings.length>1&&(p.codecs[0].mimeType.toLowerCase()==="video/vp8"||p.codecs[0].mimeType.toLowerCase()==="video/h264"))for(let T of p.encodings)if(T.scalabilityMode)T.scalabilityMode=`L1T${h.temporalLayers}`;else T.scalabilityMode="L1T3";this._remoteSdp.send({offerMediaObject:m,offerRtpParameters:p,answerRtpParameters:u,codecOptions:s});let w={type:"answer",sdp:this._remoteSdp.getSdp()};return S.debug("send() | calling pc.setRemoteDescription() [answer:%o]",w),await this._pc.setRemoteDescription(w),this._mapMidTransceiver.set(f,a),{localId:f,rtpParameters:p,rtpSender:a.sender}}catch(o){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(c){}a?.stop()}catch(c){}throw o}}async stopSending(e){if(this.assertSendDirection(),S.debug("stopSending() [localId:%s]",e),this._closed)return;let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated transceiver not found");t.sender.replaceTrack(null),this._pc.removeTrack(t.sender),this._remoteSdp.disableMediaSection(t.mid);let r=await this._pc.createOffer();S.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};S.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s),this._mapMidTransceiver.delete(e)}async pauseSending(e){this.assertNotClosed(),this.assertSendDirection(),S.debug("pauseSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");t.direction="inactive",this._remoteSdp.pauseMediaSection(e);let r=await this._pc.createOffer();S.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};S.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async resumeSending(e){this.assertNotClosed(),this.assertSendDirection(),S.debug("resumeSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");t.direction="sendonly",this._remoteSdp.resumeSendingMediaSection(e);let r=await this._pc.createOffer();S.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};S.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async replaceTrack(e,t){if(this.assertNotClosed(),this.assertSendDirection(),t)S.debug("replaceTrack() [localId:%s, track.id:%s]",e,t.id);else S.debug("replaceTrack() [localId:%s, no track]",e);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");await r.sender.replaceTrack(t)}async setMaxSpatialLayer(e,t){this.assertNotClosed(),this.assertSendDirection(),S.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated transceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{if(o<=t)a.active=!0;else a.active=!1}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();S.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};S.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async setRtpEncodingParameters(e,t){this.assertNotClosed(),this.assertSendDirection(),S.debug("setRtpEncodingParameters() [localId:%s, params:%o]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{s.encodings[o]={...a,...t}}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();S.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};S.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async getSenderStats(e){this.assertNotClosed(),this.assertSendDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.sender.getStats()}async sendDataChannel({sctpStreamParameters:e}){this.assertNotClosed(),this.assertSendDirection();let t={negotiated:!0,id:this._nextSendSctpStreamId,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits,protocol:e.protocol};S.debug("sendDataChannel() [options:%o]",t);let r=this._pc.createDataChannel(e.label,t);if(this._nextSendSctpStreamId=++this._nextSendSctpStreamId%(this._pc.sctp?.maxChannels??65536),!this._hasDataChannelMediaSection)try{let i=await this._pc.createOffer(),n=ye.parse(i.sdp),a=n.media.find((c)=>c.type==="application");if(!this._transportReady)await this.setupTransport({localDtlsRole:"client",localSdpObject:n});S.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i),this._remoteSdp.sendSctpAssociation({offerMediaObject:a});let o={type:"answer",sdp:this._remoteSdp.getSdp()};S.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]",o),await this._pc.setRemoteDescription(o),this._hasDataChannelMediaSection=!0}catch(i){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(n){}r.close()}catch(n){}throw i}let s={streamId:t.id,ordered:t.ordered,maxPacketLifeTime:t.maxPacketLifeTime,maxRetransmits:t.maxRetransmits};return{dataChannel:r,sctpStreamParameters:s}}async receive(e){this.assertNotClosed(),this.assertRecvDirection();let t=[],r=new Map;for(let a of e){let{trackId:o,kind:c,rtpParameters:d,streamId:l}=a;S.debug("receive() [trackId:%s, kind:%s]",o,c);let p=d.mid??String(this._mapMidTransceiver.size);r.set(o,p);let{msidStreamId:u}=yt.getMsidStreamIdAndTrackId(d.msid);this._remoteSdp.receive({mid:p,kind:c,offerRtpParameters:d,streamId:l??u??d.rtcp?.cname??"-",trackId:o})}let s={type:"offer",sdp:this._remoteSdp.getSdp()};S.debug("receive() | calling pc.setRemoteDescription() [offer:%o]",s),await this._pc.setRemoteDescription(s);for(let a of e){let{trackId:o,onRtpReceiver:c}=a;if(c){let d=r.get(o),l=this._pc.getTransceivers().find((p)=>p.mid===d);if(!l)throw Error("transceiver not found");if(this._forcedRtpExtensions)yt.applyForcedRtpExtensions(l,this._forcedRtpExtensions);c(l.receiver)}}let i=await this._pc.createAnswer(),n=ye.parse(i.sdp);for(let a of e){let{trackId:o,rtpParameters:c}=a,d=r.get(o),l=n.media.find((p)=>String(p.mid)===d);tr.applyCodecParameters({offerRtpParameters:c,answerMediaObject:l}),i={type:"answer",sdp:ye.write(n)}}if(!this._transportReady)await this.setupTransport({localDtlsRole:"client",localSdpObject:n});S.debug("receive() | calling pc.setLocalDescription() [answer:%o]",i),await this._pc.setLocalDescription(i);for(let a of e){let{trackId:o}=a,c=r.get(o),d=this._pc.getTransceivers().find((l)=>l.mid===c);if(!d)throw Error("new RTCRtpTransceiver not found");this._mapMidTransceiver.set(c,d),t.push({localId:c,track:d.receiver.track,rtpReceiver:d.receiver})}return t}async stopReceiving(e){if(this.assertRecvDirection(),this._closed)return;for(let s of e){S.debug("stopReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");this._remoteSdp.closeMediaSection(i.mid)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};S.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();S.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r);for(let s of e)this._mapMidTransceiver.delete(s)}async pauseReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){S.debug("pauseReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="inactive",this._remoteSdp.pauseMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};S.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();S.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async resumeReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){S.debug("resumeReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="recvonly",this._remoteSdp.resumeReceivingMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};S.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();S.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async getReceiverStats(e){this.assertRecvDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.receiver.getStats()}async receiveDataChannel({maxMessageSize:e,sctpStreamParameters:t,label:r,protocol:s}){this.assertNotClosed(),this.assertRecvDirection();let{streamId:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o}=t,c={negotiated:!0,id:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o,protocol:s};S.debug("receiveDataChannel() [options:%o]",c);let d=this._pc.createDataChannel(r,c);if(!this._hasDataChannelMediaSection){this._remoteSdp.receiveSctpAssociation();let l={type:"offer",sdp:this._remoteSdp.getSdp()};S.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]",l),await this._pc.setRemoteDescription(l);let p=await this._pc.createAnswer(),u=ye.parse(p.sdp),h=u.media.find((f)=>f.type==="application");if(typeof e==="number")h.maxMessageSize=e;if(!this._transportReady)await this.setupTransport({localDtlsRole:"client",localSdpObject:u});p={type:"answer",sdp:ye.write(u)},S.debug("receiveDataChannel() | calling pc.setLocalDescription() [answer:%o]",p),await this._pc.setLocalDescription(p),this._hasDataChannelMediaSection=!0}return{dataChannel:d}}getDataChannelMaxMessageSize(){return this._direction==="send"?this._pc.sctp?.maxMessageSize:this._sctpMaxReceiveMessageSize}async setupTransport({localDtlsRole:e,localSdpObject:t}){if(!t)t=ye.parse(this._pc.localDescription.sdp);let r=tr.extractDtlsParameters({sdpObject:t});r.role=e,this._remoteSdp.updateDtlsRole(e==="client"?"server":"client"),await new Promise((s,i)=>{this.safeEmit("@connect",{dtlsParameters:r},s,i)}),this._transportReady=!0}onIceGatheringStateChange=()=>{this.emit("@icegatheringstatechange",this._pc.iceGatheringState)};onIceCandidateError=(e)=>{this.emit("@icecandidateerror",e)};onConnectionStateChange=()=>{this.emit("@connectionstatechange",this._pc.connectionState)};onIceConnectionStateChange=()=>{switch(this._pc.iceConnectionState){case"checking":{this.emit("@connectionstatechange","connecting");break}case"connected":case"completed":{this.emit("@connectionstatechange","connected");break}case"failed":{this.emit("@connectionstatechange","failed");break}case"disconnected":{this.emit("@connectionstatechange","disconnected");break}case"closed":{this.emit("@connectionstatechange","closed");break}}};assertNotClosed(){if(this._closed)throw new Oi.InvalidStateError("method called in a closed handler")}assertSendDirection(){if(this._direction!=="send")throw Error('method can just be called for handlers with "send" direction')}assertRecvDirection(){if(this._direction!=="recv")throw Error('method can just be called for handlers with "recv" direction')}}pe.Firefox120=St});var Ui=C(function(le){var Lo=le&&le.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Mo=le&&le.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),Tt=le&&le.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")Lo(r,t,s[i])}return Mo(r,t),r}}();Object.defineProperty(le,"__esModule",{value:!0});le.Safari12=void 0;var Se=Tt(we()),zi=A(),qi=I(),Ct=Tt(re()),$i=H(),Bi=Me(),Vi=Xe(),rr=Tt(et()),Ni=Tt(tt()),nt=Tt(rt()),R=new qi.Logger("Safari12"),Ai="Safari12";class Et extends zi.EnhancedEventEmitter{_closed=!1;_direction;_sctpMaxReceiveMessageSize;_remoteSdp;_getSendExtendedRtpCapabilities;_forcedRtpExtensions;_forcedLocalDtlsRole;_pc;_mapMidTransceiver=new Map;_sendStream=new MediaStream;_hasDataChannelMediaSection=!1;_nextSendSctpStreamId=0;_transportReady=!1;static createFactory({forcedRtpExtensions:e}){return{name:Ai,factory:(t)=>new Et({...t,forcedRtpExtensions:e}),getNativeRtpCapabilities:async({direction:t})=>{R.debug("getNativeRtpCapabilities() [direction:%o]",t);let r=new RTCPeerConnection({iceServers:[],iceTransportPolicy:"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require"});try{let s=r.addTransceiver("audio",{direction:t});if(e)nt.applyForcedRtpExtensions(s,e);let i=r.addTransceiver("video",{direction:t});if(e)nt.applyForcedRtpExtensions(i,e);let n=await r.createOffer();try{r.close()}catch(c){}r=void 0;let a=Se.parse(n.sdp);return Et.getLocalRtpCapabilities(a)}catch(s){try{r?.close()}catch(i){}throw r=void 0,s}}}}static getLocalRtpCapabilities(e){let t=rr.extractRtpCapabilities({sdpObject:e});return Ct.validateAndNormalizeRtpCapabilities(t),nt.addNackSupportForOpus(t),t}constructor({direction:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,getSendExtendedRtpCapabilities:c,forcedRtpExtensions:d}){super();if(R.debug("constructor()"),this._direction=e,this._sctpMaxReceiveMessageSize=i?.maxSendMessageSize,this._remoteSdp=new Vi.RemoteSdp({iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i}),this._getSendExtendedRtpCapabilities=c,this._forcedRtpExtensions=d,s.role&&s.role!=="auto")this._forcedLocalDtlsRole=s.role==="server"?"client":"server";if(this._pc=new RTCPeerConnection({iceServers:n??[],iceTransportPolicy:a??"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require",...o}),this._pc.addEventListener("icegatheringstatechange",()=>{this.emit("@icegatheringstatechange",this._pc.iceGatheringState)}),this._pc.addEventListener("icecandidateerror",(l)=>{this.emit("@icecandidateerror",l)}),this._pc.addEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.addEventListener("icecandidateerror",this.onIceCandidateError),this._pc.connectionState)this._pc.addEventListener("connectionstatechange",this.onConnectionStateChange);else R.warn("run() | pc.connectionState not supported, using pc.iceConnectionState"),this._pc.addEventListener("iceconnectionstatechange",this.onIceConnectionStateChange)}get name(){return Ai}close(){if(R.debug("close()"),this._closed)return;this._closed=!0;try{this._pc.close()}catch(e){}this._pc.removeEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.removeEventListener("icecandidateerror",this.onIceCandidateError),this._pc.removeEventListener("connectionstatechange",this.onConnectionStateChange),this._pc.removeEventListener("iceconnectionstatechange",this.onIceConnectionStateChange),this.emit("@close"),super.close()}async updateIceServers(e){this.assertNotClosed(),R.debug("updateIceServers()");let t=this._pc.getConfiguration();t.iceServers=e,this._pc.setConfiguration(t)}async restartIce(e){if(this.assertNotClosed(),R.debug("restartIce()"),this._remoteSdp.updateIceParameters(e),!this._transportReady)return;if(this._direction==="send"){let t=await this._pc.createOffer({iceRestart:!0});R.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]",t),await this._pc.setLocalDescription(t);let r={type:"answer",sdp:this._remoteSdp.getSdp()};R.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]",r),await this._pc.setRemoteDescription(r)}else{let t={type:"offer",sdp:this._remoteSdp.getSdp()};R.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();R.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}}async getTransportStats(){return this.assertNotClosed(),this._pc.getStats()}async send({track:e,streamId:t,encodings:r,codecOptions:s,codec:i,onRtpSender:n}){if(this.assertNotClosed(),this.assertSendDirection(),R.debug("send() [kind:%s, track.id:%s, streamId:%s]",e.kind,e.id,t),r&&r.length>1){let o=1;for(let c of r){let d=c.scalabilityMode?Bi.parse(c.scalabilityMode).temporalLayers:3;if(d>o)o=d}r.forEach((c,d)=>{c.rid=`r${d}`,c.scalabilityMode=`L1T${o}`})}let a;try{a=this._pc.addTransceiver(e,{direction:"sendonly",streams:[this._sendStream],sendEncodings:r});let o=this._remoteSdp.getNextMediaSectionIdx();if(this._forcedRtpExtensions)nt.applyForcedRtpExtensions(a,this._forcedRtpExtensions);if(n)n(a.sender);let c=await this._pc.createOffer(),d=Se.parse(c.sdp);if(d.extmapAllowMixed)this._remoteSdp.setSessionExtmapAllowMixed();let l=Et.getLocalRtpCapabilities(d),p=this._getSendExtendedRtpCapabilities(l),u=Ct.getSendingRtpParameters(e.kind,p);u.codecs=Ct.reduceCodecs(u.codecs,i);let h=Ct.getSendingRemoteRtpParameters(e.kind,p);if(h.codecs=Ct.reduceCodecs(h.codecs,i),!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:d});R.debug("send() | calling pc.setLocalDescription() [offer:%o]",c),await this._pc.setLocalDescription(c);let f=a.mid;u.mid=f,d=Se.parse(this._pc.localDescription.sdp);let m=d.media[o.idx];if(u.rtcp.cname=rr.getCname({offerMediaObject:m}),u.msid=`${t??this._sendStream.id} ${e.id}`,!r)u.encodings=Ni.getRtpEncodings({offerMediaObject:m,codecs:u.codecs});else if(r.length===1){let T=Ni.getRtpEncodings({offerMediaObject:m,codecs:u.codecs});Object.assign(T[0],r[0]),u.encodings=T}else u.encodings=r;this._remoteSdp.send({offerMediaObject:m,reuseMid:o.reuseMid,offerRtpParameters:u,answerRtpParameters:h,codecOptions:s});let w={type:"answer",sdp:this._remoteSdp.getSdp()};return R.debug("send() | calling pc.setRemoteDescription() [answer:%o]",w),await this._pc.setRemoteDescription(w),this._mapMidTransceiver.set(f,a),{localId:f,rtpParameters:u,rtpSender:a.sender}}catch(o){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(c){}a?.stop()}catch(c){}throw o}}async stopSending(e){if(this.assertSendDirection(),this._closed)return;R.debug("stopSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");if(t.sender.replaceTrack(null),this._pc.removeTrack(t.sender),this._remoteSdp.closeMediaSection(t.mid))try{t.stop()}catch(n){}let s=await this._pc.createOffer();R.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]",s),await this._pc.setLocalDescription(s);let i={type:"answer",sdp:this._remoteSdp.getSdp()};R.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]",i),await this._pc.setRemoteDescription(i),this._mapMidTransceiver.delete(e)}async pauseSending(e){this.assertNotClosed(),this.assertSendDirection(),R.debug("pauseSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");t.direction="inactive",this._remoteSdp.pauseMediaSection(e);let r=await this._pc.createOffer();R.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};R.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async resumeSending(e){this.assertNotClosed(),this.assertSendDirection(),R.debug("resumeSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");t.direction="sendonly",this._remoteSdp.resumeSendingMediaSection(e);let r=await this._pc.createOffer();R.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};R.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async replaceTrack(e,t){if(this.assertNotClosed(),this.assertSendDirection(),t)R.debug("replaceTrack() [localId:%s, track.id:%s]",e,t.id);else R.debug("replaceTrack() [localId:%s, no track]",e);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");await r.sender.replaceTrack(t)}async setMaxSpatialLayer(e,t){this.assertNotClosed(),this.assertSendDirection(),R.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{if(o<=t)a.active=!0;else a.active=!1}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();R.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};R.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async setRtpEncodingParameters(e,t){this.assertNotClosed(),this.assertSendDirection(),R.debug("setRtpEncodingParameters() [localId:%s, params:%o]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{s.encodings[o]={...a,...t}}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();R.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};R.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async getSenderStats(e){this.assertNotClosed(),this.assertSendDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.sender.getStats()}async sendDataChannel({sctpStreamParameters:e}){this.assertNotClosed(),this.assertSendDirection();let t={negotiated:!0,id:this._nextSendSctpStreamId,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits,protocol:e.protocol};R.debug("sendDataChannel() [options:%o]",t);let r=this._pc.createDataChannel(e.label,t);if(this._nextSendSctpStreamId=++this._nextSendSctpStreamId%(this._pc.sctp?.maxChannels??65536),!this._hasDataChannelMediaSection)try{let i=await this._pc.createOffer(),n=Se.parse(i.sdp),a=n.media.find((c)=>c.type==="application");if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});R.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i),this._remoteSdp.sendSctpAssociation({offerMediaObject:a});let o={type:"answer",sdp:this._remoteSdp.getSdp()};R.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]",o),await this._pc.setRemoteDescription(o),this._hasDataChannelMediaSection=!0}catch(i){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(n){}r.close()}catch(n){}throw i}let s={streamId:t.id,ordered:t.ordered,maxPacketLifeTime:t.maxPacketLifeTime,maxRetransmits:t.maxRetransmits};return{dataChannel:r,sctpStreamParameters:s}}async receive(e){this.assertNotClosed(),this.assertRecvDirection();let t=[],r=new Map;for(let a of e){let{trackId:o,kind:c,rtpParameters:d,streamId:l}=a;R.debug("receive() [trackId:%s, kind:%s]",o,c);let p=d.mid??String(this._mapMidTransceiver.size);r.set(o,p);let{msidStreamId:u}=nt.getMsidStreamIdAndTrackId(d.msid);this._remoteSdp.receive({mid:p,kind:c,offerRtpParameters:d,streamId:l??u??d.rtcp?.cname??"-",trackId:o})}let s={type:"offer",sdp:this._remoteSdp.getSdp()};R.debug("receive() | calling pc.setRemoteDescription() [offer:%o]",s),await this._pc.setRemoteDescription(s);for(let a of e){let{trackId:o,onRtpReceiver:c}=a;if(c){let d=r.get(o),l=this._pc.getTransceivers().find((p)=>p.mid===d);if(!l)throw Error("transceiver not found");if(this._forcedRtpExtensions)nt.applyForcedRtpExtensions(l,this._forcedRtpExtensions);c(l.receiver)}}let i=await this._pc.createAnswer(),n=Se.parse(i.sdp);for(let a of e){let{trackId:o,rtpParameters:c}=a,d=r.get(o),l=n.media.find((p)=>String(p.mid)===d);rr.applyCodecParameters({offerRtpParameters:c,answerMediaObject:l})}if(i={type:"answer",sdp:Se.write(n)},!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});R.debug("receive() | calling pc.setLocalDescription() [answer:%o]",i),await this._pc.setLocalDescription(i);for(let a of e){let{trackId:o}=a,c=r.get(o),d=this._pc.getTransceivers().find((l)=>l.mid===c);if(!d)throw Error("new RTCRtpTransceiver not found");this._mapMidTransceiver.set(c,d),t.push({localId:c,track:d.receiver.track,rtpReceiver:d.receiver})}return t}async stopReceiving(e){if(this.assertRecvDirection(),this._closed)return;for(let s of e){R.debug("stopReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");this._remoteSdp.closeMediaSection(i.mid)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};R.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();R.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r);for(let s of e)this._mapMidTransceiver.delete(s)}async pauseReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){R.debug("pauseReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="inactive",this._remoteSdp.pauseMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};R.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();R.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async resumeReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){R.debug("resumeReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="recvonly",this._remoteSdp.resumeReceivingMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};R.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();R.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async getReceiverStats(e){this.assertNotClosed(),this.assertRecvDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.receiver.getStats()}async receiveDataChannel({maxMessageSize:e,sctpStreamParameters:t,label:r,protocol:s}){this.assertNotClosed(),this.assertRecvDirection();let{streamId:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o}=t,c={negotiated:!0,id:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o,protocol:s};R.debug("receiveDataChannel() [options:%o]",c);let d=this._pc.createDataChannel(r,c);if(!this._hasDataChannelMediaSection){this._remoteSdp.receiveSctpAssociation();let l={type:"offer",sdp:this._remoteSdp.getSdp()};R.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]",l),await this._pc.setRemoteDescription(l);let p=await this._pc.createAnswer(),u=Se.parse(p.sdp),h=u.media.find((f)=>f.type==="application");if(typeof e==="number")h.maxMessageSize=e;if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:u});p={type:"answer",sdp:Se.write(u)},R.debug("receiveDataChannel() | calling pc.setLocalDescription() [answer:%o]",p),await this._pc.setLocalDescription(p),this._hasDataChannelMediaSection=!0}return{dataChannel:d}}getDataChannelMaxMessageSize(){return this._direction==="send"?this._pc.sctp?.maxMessageSize:this._sctpMaxReceiveMessageSize}async setupTransport({localDtlsRole:e,localSdpObject:t}){if(!t)t=Se.parse(this._pc.localDescription.sdp);let r=rr.extractDtlsParameters({sdpObject:t});r.role=e,this._remoteSdp.updateDtlsRole(e==="client"?"server":"client"),await new Promise((s,i)=>{this.safeEmit("@connect",{dtlsParameters:r},s,i)}),this._transportReady=!0}onIceGatheringStateChange=()=>{this.emit("@icegatheringstatechange",this._pc.iceGatheringState)};onIceCandidateError=(e)=>{this.emit("@icecandidateerror",e)};onConnectionStateChange=()=>{this.emit("@connectionstatechange",this._pc.connectionState)};onIceConnectionStateChange=()=>{switch(this._pc.iceConnectionState){case"checking":{this.emit("@connectionstatechange","connecting");break}case"connected":case"completed":{this.emit("@connectionstatechange","connected");break}case"failed":{this.emit("@connectionstatechange","failed");break}case"disconnected":{this.emit("@connectionstatechange","disconnected");break}case"closed":{this.emit("@connectionstatechange","closed");break}}};assertNotClosed(){if(this._closed)throw new $i.InvalidStateError("method called in a closed handler")}assertSendDirection(){if(this._direction!=="send")throw Error('method can just be called for handlers with "send" direction')}assertRecvDirection(){if(this._direction!=="recv")throw Error('method can just be called for handlers with "recv" direction')}}le.Safari12=Et});var Yi=C(function(ue){var ko=ue&&ue.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Oo=ue&&ue.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),Pt=ue&&ue.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")ko(r,t,s[i])}return Oo(r,t),r}}();Object.defineProperty(ue,"__esModule",{value:!0});ue.ReactNative106=void 0;var X=Pt(we()),Hi=A(),Gi=I(),Dt=Pt(re()),Qi=H(),Wi=Me(),Ji=Xe(),sr=Pt(et()),xr=Pt(tt()),at=Pt(rt()),v=new Gi.Logger("ReactNative106"),Ki="ReactNative106";class xt extends Hi.EnhancedEventEmitter{_closed=!1;_direction;_sctpMaxReceiveMessageSize;_remoteSdp;_getSendExtendedRtpCapabilities;_forcedRtpExtensions;_forcedLocalDtlsRole;_pc;_mapMidTransceiver=new Map;_sendStream=new MediaStream;_hasDataChannelMediaSection=!1;_nextSendSctpStreamId=0;_transportReady=!1;static createFactory({forcedRtpExtensions:e}){return{name:Ki,factory:(t)=>new xt({...t,forcedRtpExtensions:e}),getNativeRtpCapabilities:async({direction:t})=>{v.debug("getNativeRtpCapabilities() [direction:%o]",t);let r=new RTCPeerConnection({iceServers:[],iceTransportPolicy:"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require"});try{let s=r.addTransceiver("audio",{direction:t});if(e)at.applyForcedRtpExtensions(s,e);let i=r.addTransceiver("video",{direction:t});if(e)at.applyForcedRtpExtensions(i,e);let n=await r.createOffer();try{r.close()}catch(c){}r=void 0;let a=X.parse(n.sdp);return xt.getLocalRtpCapabilities(a)}catch(s){try{r?.close()}catch(i){}throw r=void 0,s}}}}static getLocalRtpCapabilities(e){let t=sr.extractRtpCapabilities({sdpObject:e});return Dt.validateAndNormalizeRtpCapabilities(t),at.addNackSupportForOpus(t),t}constructor({direction:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,getSendExtendedRtpCapabilities:c,forcedRtpExtensions:d}){super();if(v.debug("constructor()"),this._direction=e,this._sctpMaxReceiveMessageSize=i?.maxSendMessageSize,this._remoteSdp=new Ji.RemoteSdp({iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i}),this._getSendExtendedRtpCapabilities=c,this._forcedRtpExtensions=d,s.role&&s.role!=="auto")this._forcedLocalDtlsRole=s.role==="server"?"client":"server";if(this._pc=new RTCPeerConnection({iceServers:n??[],iceTransportPolicy:a??"all",bundlePolicy:"max-bundle",rtcpMuxPolicy:"require",...o}),this._pc.addEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.addEventListener("icecandidateerror",this.onIceCandidateError),this._pc.connectionState)this._pc.addEventListener("connectionstatechange",this.onConnectionStateChange);else v.warn("run() | pc.connectionState not supported, using pc.iceConnectionState"),this._pc.addEventListener("iceconnectionstatechange",this.onIceConnectionStateChange)}get name(){return Ki}close(){if(v.debug("close()"),this._closed)return;this._closed=!0,this._sendStream.release(!1);try{this._pc.close()}catch(e){}this._pc.removeEventListener("icegatheringstatechange",this.onIceGatheringStateChange),this._pc.removeEventListener("icecandidateerror",this.onIceCandidateError),this._pc.removeEventListener("connectionstatechange",this.onConnectionStateChange),this._pc.removeEventListener("iceconnectionstatechange",this.onIceConnectionStateChange),this.emit("@close"),super.close()}async updateIceServers(e){this.assertNotClosed(),v.debug("updateIceServers()");let t=this._pc.getConfiguration();t.iceServers=e,this._pc.setConfiguration(t)}async restartIce(e){if(this.assertNotClosed(),v.debug("restartIce()"),this._remoteSdp.updateIceParameters(e),!this._transportReady)return;if(this._direction==="send"){let t=await this._pc.createOffer({iceRestart:!0});v.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]",t),await this._pc.setLocalDescription(t);let r={type:"answer",sdp:this._remoteSdp.getSdp()};v.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]",r),await this._pc.setRemoteDescription(r)}else{let t={type:"offer",sdp:this._remoteSdp.getSdp()};v.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();v.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}}async getTransportStats(){return this.assertNotClosed(),this._pc.getStats()}async send({track:e,streamId:t,encodings:r,codecOptions:s,codec:i,onRtpSender:n}){if(this.assertNotClosed(),this.assertSendDirection(),v.debug("send() [kind:%s, track.id:%s, streamId:%s]",e.kind,e.id,t),r&&r.length>1)r.forEach((o,c)=>{o.rid=`r${c}`});let a;try{a=this._pc.addTransceiver(e,{direction:"sendonly",streams:[this._sendStream],sendEncodings:r});let o=this._remoteSdp.getNextMediaSectionIdx();if(this._forcedRtpExtensions)at.applyForcedRtpExtensions(a,this._forcedRtpExtensions);if(n)n(a.sender);let c=await this._pc.createOffer(),d=X.parse(c.sdp);if(d.extmapAllowMixed)this._remoteSdp.setSessionExtmapAllowMixed();let l=xt.getLocalRtpCapabilities(d),p=this._getSendExtendedRtpCapabilities(l),u=Dt.getSendingRtpParameters(e.kind,p);u.codecs=Dt.reduceCodecs(u.codecs,i);let h=Dt.getSendingRemoteRtpParameters(e.kind,p);if(h.codecs=Dt.reduceCodecs(h.codecs,i),!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:d});let f=!1,m=Wi.parse((r??[{}])[0].scalabilityMode),w;if(r?.length===1&&m.spatialLayers>1&&u.codecs[0].mimeType.toLowerCase()==="video/vp9")v.debug("send() | enabling legacy simulcast for VP9 SVC"),f=!0,d=X.parse(c.sdp),w=d.media[o.idx],xr.addLegacySimulcast({offerMediaObject:w,numStreams:m.spatialLayers}),c={type:"offer",sdp:X.write(d)};v.debug("send() | calling pc.setLocalDescription() [offer:%o]",c),await this._pc.setLocalDescription(c);let T=a.mid??void 0;if(!T)v.warn("send() | missing transceiver.mid (bug in react-native-webrtc, using a workaround");if(u.mid=T,d=X.parse(this._pc.localDescription.sdp),w=d.media[o.idx],u.rtcp.cname=sr.getCname({offerMediaObject:w}),u.msid=`${t??this._sendStream.id} ${e.id}`,!r)u.encodings=xr.getRtpEncodings({offerMediaObject:w,codecs:u.codecs});else if(r.length===1){let L=xr.getRtpEncodings({offerMediaObject:w,codecs:u.codecs});if(Object.assign(L[0],r[0]),f)L=[L[0]];u.encodings=L}else u.encodings=r;if(u.encodings.length>1&&(u.codecs[0].mimeType.toLowerCase()==="video/vp8"||u.codecs[0].mimeType.toLowerCase()==="video/h264"))for(let L of u.encodings)if(L.scalabilityMode)L.scalabilityMode=`L1T${m.temporalLayers}`;else L.scalabilityMode="L1T3";this._remoteSdp.send({offerMediaObject:w,reuseMid:o.reuseMid,offerRtpParameters:u,answerRtpParameters:h,codecOptions:s});let U={type:"answer",sdp:this._remoteSdp.getSdp()};if(v.debug("send() | calling pc.setRemoteDescription() [answer:%o]",U),await this._pc.setRemoteDescription(U),!T)T=a.mid,u.mid=T;return this._mapMidTransceiver.set(T,a),{localId:T,rtpParameters:u,rtpSender:a.sender}}catch(o){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(c){}a?.stop()}catch(c){}throw o}}async stopSending(e){if(this.assertSendDirection(),this._closed)return;v.debug("stopSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");if(t.sender.replaceTrack(null),this._pc.removeTrack(t.sender),this._remoteSdp.closeMediaSection(t.mid))try{t.stop()}catch(n){}let s=await this._pc.createOffer();v.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]",s),await this._pc.setLocalDescription(s);let i={type:"answer",sdp:this._remoteSdp.getSdp()};v.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]",i),await this._pc.setRemoteDescription(i),this._mapMidTransceiver.delete(e)}async pauseSending(e){this.assertNotClosed(),this.assertSendDirection(),v.debug("pauseSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");t.direction="inactive",this._remoteSdp.pauseMediaSection(e);let r=await this._pc.createOffer();v.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};v.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async resumeSending(e){this.assertNotClosed(),this.assertSendDirection(),v.debug("resumeSending() [localId:%s]",e);let t=this._mapMidTransceiver.get(e);if(this._remoteSdp.resumeSendingMediaSection(e),!t)throw Error("associated RTCRtpTransceiver not found");t.direction="sendonly";let r=await this._pc.createOffer();v.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]",r),await this._pc.setLocalDescription(r);let s={type:"answer",sdp:this._remoteSdp.getSdp()};v.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]",s),await this._pc.setRemoteDescription(s)}async replaceTrack(e,t){if(this.assertNotClosed(),this.assertSendDirection(),t)v.debug("replaceTrack() [localId:%s, track.id:%s]",e,t.id);else v.debug("replaceTrack() [localId:%s, no track]",e);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");await r.sender.replaceTrack(t)}async setMaxSpatialLayer(e,t){this.assertNotClosed(),this.assertSendDirection(),v.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{if(o<=t)a.active=!0;else a.active=!1}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();v.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};v.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async setRtpEncodingParameters(e,t){this.assertNotClosed(),this.assertSendDirection(),v.debug("setRtpEncodingParameters() [localId:%s, params:%o]",e,t);let r=this._mapMidTransceiver.get(e);if(!r)throw Error("associated RTCRtpTransceiver not found");let s=r.sender.getParameters();s.encodings.forEach((a,o)=>{s.encodings[o]={...a,...t}}),await r.sender.setParameters(s),this._remoteSdp.muxMediaSectionSimulcast(e,s.encodings);let i=await this._pc.createOffer();v.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i);let n={type:"answer",sdp:this._remoteSdp.getSdp()};v.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]",n),await this._pc.setRemoteDescription(n)}async getSenderStats(e){this.assertNotClosed(),this.assertSendDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.sender.getStats()}async sendDataChannel({sctpStreamParameters:e}){this.assertNotClosed(),this.assertSendDirection();let t={negotiated:!0,id:this._nextSendSctpStreamId,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits,protocol:e.protocol};v.debug("sendDataChannel() [options:%o]",t);let r=this._pc.createDataChannel(e.label,t);if(this._nextSendSctpStreamId=++this._nextSendSctpStreamId%(this._pc.sctp?.maxChannels??65536),!this._hasDataChannelMediaSection)try{let i=await this._pc.createOffer(),n=X.parse(i.sdp),a=n.media.find((c)=>c.type==="application");if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});v.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]",i),await this._pc.setLocalDescription(i),this._remoteSdp.sendSctpAssociation({offerMediaObject:a});let o={type:"answer",sdp:this._remoteSdp.getSdp()};v.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]",o),await this._pc.setRemoteDescription(o),this._hasDataChannelMediaSection=!0}catch(i){try{if(this._pc.signalingState==="have-local-offer")try{await this._pc.setLocalDescription({type:"rollback"})}catch(n){}r.close()}catch(n){}throw i}let s={streamId:t.id,ordered:t.ordered,maxPacketLifeTime:t.maxPacketLifeTime,maxRetransmits:t.maxRetransmits};return{dataChannel:r,sctpStreamParameters:s}}async receive(e){this.assertNotClosed(),this.assertRecvDirection();let t=[],r=new Map;for(let a of e){let{trackId:o,kind:c,rtpParameters:d,streamId:l}=a;v.debug("receive() [trackId:%s, kind:%s]",o,c);let p=d.mid??String(this._mapMidTransceiver.size);r.set(o,p);let{msidStreamId:u}=at.getMsidStreamIdAndTrackId(d.msid);this._remoteSdp.receive({mid:p,kind:c,offerRtpParameters:d,streamId:l??u??d.rtcp?.cname??"-",trackId:o})}let s={type:"offer",sdp:this._remoteSdp.getSdp()};v.debug("receive() | calling pc.setRemoteDescription() [offer:%o]",s),await this._pc.setRemoteDescription(s);for(let a of e){let{trackId:o,onRtpReceiver:c}=a;if(c){let d=r.get(o),l=this._pc.getTransceivers().find((p)=>p.mid===d);if(!l)throw Error("transceiver not found");if(this._forcedRtpExtensions)at.applyForcedRtpExtensions(l,this._forcedRtpExtensions);c(l.receiver)}}let i=await this._pc.createAnswer(),n=X.parse(i.sdp);for(let a of e){let{trackId:o,rtpParameters:c}=a,d=r.get(o),l=n.media.find((p)=>String(p.mid)===d);sr.applyCodecParameters({offerRtpParameters:c,answerMediaObject:l})}if(i={type:"answer",sdp:X.write(n)},!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:n});v.debug("receive() | calling pc.setLocalDescription() [answer:%o]",i),await this._pc.setLocalDescription(i);for(let a of e){let{trackId:o}=a,c=r.get(o),d=this._pc.getTransceivers().find((l)=>l.mid===c);if(!d)throw Error("new RTCRtpTransceiver not found");else this._mapMidTransceiver.set(c,d),t.push({localId:c,track:d.receiver.track,rtpReceiver:d.receiver})}return t}async stopReceiving(e){if(this.assertRecvDirection(),this._closed)return;for(let s of e){v.debug("stopReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");this._remoteSdp.closeMediaSection(i.mid)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};v.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();v.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r);for(let s of e)this._mapMidTransceiver.delete(s)}async pauseReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){v.debug("pauseReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="inactive",this._remoteSdp.pauseMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};v.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();v.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async resumeReceiving(e){this.assertNotClosed(),this.assertRecvDirection();for(let s of e){v.debug("resumeReceiving() [localId:%s]",s);let i=this._mapMidTransceiver.get(s);if(!i)throw Error("associated RTCRtpTransceiver not found");i.direction="recvonly",this._remoteSdp.resumeReceivingMediaSection(s)}let t={type:"offer",sdp:this._remoteSdp.getSdp()};v.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]",t),await this._pc.setRemoteDescription(t);let r=await this._pc.createAnswer();v.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]",r),await this._pc.setLocalDescription(r)}async getReceiverStats(e){this.assertNotClosed(),this.assertRecvDirection();let t=this._mapMidTransceiver.get(e);if(!t)throw Error("associated RTCRtpTransceiver not found");return t.receiver.getStats()}async receiveDataChannel({maxMessageSize:e,sctpStreamParameters:t,label:r,protocol:s}){this.assertNotClosed(),this.assertRecvDirection();let{streamId:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o}=t,c={negotiated:!0,id:i,ordered:n,maxPacketLifeTime:a,maxRetransmits:o,protocol:s};v.debug("receiveDataChannel() [options:%o]",c);let d=this._pc.createDataChannel(r,c);if(!this._hasDataChannelMediaSection){this._remoteSdp.receiveSctpAssociation();let l={type:"offer",sdp:this._remoteSdp.getSdp()};v.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]",l),await this._pc.setRemoteDescription(l);let p=await this._pc.createAnswer(),u=X.parse(p.sdp),h=u.media.find((f)=>f.type==="application");if(typeof e==="number")h.maxMessageSize=e;if(!this._transportReady)await this.setupTransport({localDtlsRole:this._forcedLocalDtlsRole??"client",localSdpObject:u});p={type:"answer",sdp:X.write(u)},v.debug("receiveDataChannel() | calling pc.setLocalDescription() [answer:%o]",p),await this._pc.setLocalDescription(p),this._hasDataChannelMediaSection=!0}return{dataChannel:d}}getDataChannelMaxMessageSize(){return this._direction==="send"?this._pc.sctp?.maxMessageSize:this._sctpMaxReceiveMessageSize}async setupTransport({localDtlsRole:e,localSdpObject:t}){if(!t)t=X.parse(this._pc.localDescription.sdp);let r=sr.extractDtlsParameters({sdpObject:t});r.role=e,this._remoteSdp.updateDtlsRole(e==="client"?"server":"client"),await new Promise((s,i)=>{this.safeEmit("@connect",{dtlsParameters:r},s,i)}),this._transportReady=!0}onIceGatheringStateChange=()=>{this.emit("@icegatheringstatechange",this._pc.iceGatheringState)};onIceCandidateError=(e)=>{this.emit("@icecandidateerror",e)};onConnectionStateChange=()=>{this.emit("@connectionstatechange",this._pc.connectionState)};onIceConnectionStateChange=()=>{switch(this._pc.iceConnectionState){case"checking":{this.emit("@connectionstatechange","connecting");break}case"connected":case"completed":{this.emit("@connectionstatechange","connected");break}case"failed":{this.emit("@connectionstatechange","failed");break}case"disconnected":{this.emit("@connectionstatechange","disconnected");break}case"closed":{this.emit("@connectionstatechange","closed");break}}};assertNotClosed(){if(this._closed)throw new Qi.InvalidStateError("method called in a closed handler")}assertSendDirection(){if(this._direction!=="send")throw Error('method can just be called for handlers with "send" direction')}assertRecvDirection(){if(this._direction!=="recv")throw Error('method can just be called for handlers with "recv" direction')}}ue.ReactNative106=xt});var ln=C(function(W){var Io=W&&W.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),jo=W&&W.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),Zi=W&&W.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")Io(r,t,s[i])}return jo(r,t),r}}();Object.defineProperty(W,"__esModule",{value:!0});W.Device=void 0;W.detectDevice=cn;W.detectDeviceAsync=dn;var Xi=I(),en=A(),B=H(),ir=Zi(De()),Q=Zi(re()),tn=Ws(),rn=yi(),sn=xi(),nn=Fi(),an=Ui(),on=Yi(),_=new Xi.Logger("Device");function cn(e,t){if(_.debug("detectDevice()"),!e&&typeof navigator==="object")e=navigator.userAgent;if(!t&&typeof navigator==="object")t=navigator.userAgentData;return pn(e,t)}async function dn(e,t){if(_.debug("detectDeviceAsync()"),!e&&typeof navigator==="object")e=navigator.userAgent;if(!t&&typeof navigator==="object")t=navigator.userAgentData;return pn(e,t)}class Pr{_handlerFactory;_handlerName;_loaded=!1;_getSendExtendedRtpCapabilities;_recvRtpCapabilities;_sendRtpCapabilities;_canProduceByKind={audio:!1,video:!1};_observer=new en.EnhancedEventEmitter;static async factory({handlerName:e,handlerFactory:t,forcedRtpExtensions:r}={}){if(_.debug("factory()"),e&&t)throw TypeError("just one of handlerName or handlerInterface can be given");if(!e&&!t){if(e=await dn(),!e)throw new B.UnsupportedError("device not supported")}return new Pr({handlerName:e,handlerFactory:t,forcedRtpExtensions:r})}constructor({handlerName:e,handlerFactory:t,forcedRtpExtensions:r}={}){if(_.debug("constructor()"),e&&t)throw TypeError("just one of handlerName or handlerInterface can be given");if(t)this._handlerFactory=t;else{if(e)_.debug("constructor() | handler given: %s",e);else if(e=cn(),e)_.debug("constructor() | detected handler: %s",e);else throw new B.UnsupportedError("device not supported");switch(e){case"Chrome111":{this._handlerFactory=rn.Chrome111.createFactory({forcedRtpExtensions:r});break}case"Chrome74":{this._handlerFactory=sn.Chrome74.createFactory({forcedRtpExtensions:r});break}case"Firefox120":{this._handlerFactory=nn.Firefox120.createFactory({forcedRtpExtensions:r});break}case"Safari12":{this._handlerFactory=an.Safari12.createFactory({forcedRtpExtensions:r});break}case"ReactNative106":{this._handlerFactory=on.ReactNative106.createFactory({forcedRtpExtensions:r});break}default:throw TypeError(`unknown handlerName "${e}"`)}}this._handlerName=this._handlerFactory.name}get handlerName(){return this._handlerName}get loaded(){return this._loaded}get rtpCapabilities(){return this.recvRtpCapabilities}get recvRtpCapabilities(){if(!this._loaded)throw new B.InvalidStateError("not loaded");return this._recvRtpCapabilities}get sendRtpCapabilities(){if(!this._loaded)throw new B.InvalidStateError("not loaded");return this._sendRtpCapabilities}get observer(){return this._observer}async load({routerRtpCapabilities:e,preferLocalCodecsOrder:t=!1}){if(_.debug("load() [routerRtpCapabilities:%o]",e),this._loaded)throw new B.InvalidStateError("already loaded");let r=ir.clone(e);Q.validateAndNormalizeRtpCapabilities(r);let{getNativeRtpCapabilities:s}=this._handlerFactory,i=ir.clone(await s({direction:"recvonly"}));_.debug("load() | got native receiving RTP capabilities:%o",i),Q.validateAndNormalizeRtpCapabilities(i);let n=ir.clone(await s({direction:"sendonly"}));_.debug("load() | got native sending RTP capabilities:%o",n),Q.validateAndNormalizeRtpCapabilities(n),this._getSendExtendedRtpCapabilities=(c)=>ir.clone(Q.getExtendedRtpCapabilities(c,r,t));let a=Q.getExtendedRtpCapabilities(i,r,!1);this._recvRtpCapabilities=Q.getRecvRtpCapabilities(a),_.debug("load() | got receiving RTP capabilities:%o",this._recvRtpCapabilities),Q.validateAndNormalizeRtpCapabilities(this._recvRtpCapabilities);let o=Q.getExtendedRtpCapabilities(n,r,t);this._sendRtpCapabilities=Q.getSendRtpCapabilities(o),_.debug("load() | got sending RTP capabilities:%o",this._sendRtpCapabilities),Q.validateAndNormalizeRtpCapabilities(this._sendRtpCapabilities),this._canProduceByKind.audio=Q.canSend("audio",this._sendRtpCapabilities),this._canProduceByKind.video=Q.canSend("video",this._sendRtpCapabilities),_.debug("load() succeeded"),this._loaded=!0}canProduce(e){if(!this._loaded)throw new B.InvalidStateError("not loaded");else if(e!=="audio"&&e!=="video")throw TypeError(`invalid kind "${e}"`);return this._canProduceByKind[e]}createSendTransport({id:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,appData:c}){return _.debug("createSendTransport()"),this.createTransport({direction:"send",id:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,appData:c})}createRecvTransport({id:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,appData:c}){return _.debug("createRecvTransport()"),this.createTransport({direction:"recv",id:e,iceParameters:t,iceCandidates:r,dtlsParameters:s,sctpParameters:i,iceServers:n,iceTransportPolicy:a,additionalSettings:o,appData:c})}createTransport({direction:e,id:t,iceParameters:r,iceCandidates:s,dtlsParameters:i,sctpParameters:n,iceServers:a,iceTransportPolicy:o,additionalSettings:c,appData:d}){if(!this._loaded)throw new B.InvalidStateError("not loaded");else if(typeof t!=="string")throw TypeError("missing id");else if(typeof r!=="object")throw TypeError("missing iceParameters");else if(!Array.isArray(s))throw TypeError("missing iceCandidates");else if(typeof i!=="object")throw TypeError("missing dtlsParameters");else if(n&&typeof n!=="object")throw TypeError("wrong sctpParameters");else if(d&&typeof d!=="object")throw TypeError("if given, appData must be an object");let l=new tn.Transport({direction:e,id:t,iceParameters:r,iceCandidates:s,dtlsParameters:i,sctpParameters:n,iceServers:a,iceTransportPolicy:o,additionalSettings:c,appData:d,handlerFactory:this._handlerFactory,getSendExtendedRtpCapabilities:this._getSendExtendedRtpCapabilities,recvRtpCapabilities:this._recvRtpCapabilities,canProduceByKind:this._canProduceByKind});return this._observer.safeEmit("newtransport",l),l}}W.Device=Pr;function pn(e,t){_.debug('detectDeviceImpl() [userAgent:"%s", userAgentData:%o]',e,t);let r=Fo(e,t);if(r)if(r>=111)return _.debug("detectDeviceImpl() | using Chrome111 handler"),"Chrome111";else if(r>=74)return _.debug("detectDeviceImpl() | using Chrome74 handler"),"Chrome74";else{_.warn("detectDeviceImpl() | unsupported Chromium based browser/version");return}let s=No(e);if(s)if(s>=120)return _.debug("detectDeviceImpl() | using Firefox120 handler"),"Firefox120";else{_.warn("detectDeviceImpl() | unsupported Firefox browser/version");return}let i=Ao(e);if(i)if(i>=605)return _.debug("detectDeviceImpl() | using Safari12 handler"),"Safari12";else{_.warn("detectDeviceImpl() | unsupported desktop Safari browser/version");return}let n=zo(e);if(n)if(n>=605)return _.debug("detectDeviceImpl() | using Safari12 handler"),"Safari12";else{_.warn("detectDeviceImpl() | unsupported iOS Safari based browser/version");return}if(Lt())if(typeof RTCPeerConnection<"u"&&typeof RTCRtpTransceiver<"u")return _.debug("detectDeviceImpl() | using ReactNative106 handler"),"ReactNative106";else{_.warn("detectDeviceImpl() | unsupported react-native-webrtc version without RTCPeerConnection or RTCRtpTransceiver, forgot to call registerGlobals() on it?");return}_.warn('detectDeviceImpl() | device not supported [userAgent:"%s", userAgentData:%o]',e,t);return}function Fo(e,t){if(_.debug("getChromiumMajorVersion()"),nr(e,t)){_.debug("getChromiumMajorVersion() | this is iOS => undefined");return}if(Lt()){_.debug("getChromiumMajorVersion() | this is React-Native => undefined");return}if(t){let i=(Array.isArray(t.brands)?t.brands:[]).find((n)=>n.brand==="Chromium");if(i){let n=Number(i.version);return _.debug(`getChromiumMajorVersion() | Chromium major version based on NavigatorUAData => ${n}`),n}}let r=e?.match(/\b(?:Chrome|Chromium)\/(\w+)/i);if(r?.[1]){let s=Number(r[1]);return _.debug(`getChromiumMajorVersion() | Chromium major version based on User-Agent => ${s}`),s}_.debug("getChromiumMajorVersion() | this is not Chromium => undefined");return}function No(e){if(_.debug("getFirefoxMajorVersion()"),nr(e)){_.debug("getFirefoxMajorVersion() | this is iOS => undefined");return}if(Lt()){_.debug("getFirefoxMajorVersion() | this is React-Native => undefined");return}let t=e?.match(/\bFirefox\/(\w+)/i);if(t?.[1]){let r=Number(t[1]);return _.debug(`getFirefoxMajorVersion() | Firefox major version based on User-Agent => ${r}`),r}_.debug("getFirefoxMajorVersion() | this is not Firefox => undefined");return}function Ao(e){if(_.debug("getMacOSWebKitMajorVersion()"),nr(e)){_.debug("getMacOSWebKitMajorVersion() | this is iOS => undefined");return}if(Lt()){_.debug("getMacOSWebKitMajorVersion() | this is React-Native => undefined");return}if(!(e&&/\bSafari\b/i.test(e)&&!/\bChrome\b/i.test(e)&&!/\bChromium\b/i.test(e)&&!/\bFirefox\b/i.test(e))){_.debug("getMacOSWebKitMajorVersion() | this is not Safari => undefined");return}let r=e.match(/AppleWebKit\/(\w+)/i);if(r?.[1]){let s=Number(r[1]);return _.debug(`getMacOSWebKitMajorVersion() | WebKit major version based on User-Agent => ${s}`),s}_.debug("getMacOSWebKitMajorVersion() | this is not WebKit => undefined");return}function zo(e){if(_.debug("getIOSWebKitMajorVersion()"),!nr(e)){_.debug("getIOSWebKitMajorVersion() | this is not iOS => undefined");return}if(Lt()){_.debug("getIOSWebKitMajorVersion() | this is React-Native => undefined");return}let t=e?.match(/AppleWebKit\/(\w+)/i);if(t?.[1]){let r=Number(t[1]);return _.debug(`getIOSWebKitMajorVersion() | WebKit major version based on User-Agent => ${r}`),r}_.debug("getIOSWebKitMajorVersion() | this is not WebKit => undefined");return}function nr(e,t){if(_.debug("isIOS()"),t?.platform==="iOS")return _.debug("isIOS() | this is iOS based on NavigatorUAData.platform => true"),!0;if(t?.platform)return _.debug("isIOS() | this is not iOS based on NavigatorUAData.platform => false"),!1;if(e&&/iPad|iPhone|iPod/.test(e))return _.debug("isIOS() | this is iOS based on User-Agent => true"),!0;if(typeof navigator==="object"&&navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)return _.debug("isIOS() | this is iPadOS 13+ based on User-Agent => true"),!0;return _.debug("isIOS() | this is not iOS => false"),!1}function Lt(){if(_.debug("isReactNative()"),typeof navigator==="object"&&navigator.product==="ReactNative")return _.debug("isReactNative() | this is React-Native based on navigator.product"),!0;return _.debug("isReactNative() | this is not React-Native => false"),!1}});var hn=C(function(un){var ke=256,or=[],ar;while(ke--)or[ke]=(ke+256).toString(16).substring(1);function qo(){var e=0,t,r="";if(!ar||ke+16>256){ar=Array(e=256);while(e--)ar[e]=256*Math.random()|0;e=ke=0}for(;e<16;e++){if(t=ar[ke+e],e==6)r+=or[t&15|64];else if(e==8)r+=or[t&63|128];else r+=or[t];if(e&1&&e>1&&e<11)r+="-"}return ke++,r}un.v4=qo});var mn=C(function(cr){Object.defineProperty(cr,"__esModule",{value:!0});cr.FakeEventTarget=void 0;class fn{listeners={};addEventListener(e,t,r){if(!t)return;this.listeners[e]=this.listeners[e]??[],this.listeners[e].push({callback:typeof t==="function"?t:t.handleEvent,once:typeof r==="object"&&r.once===!0})}removeEventListener(e,t,r){if(!this.listeners[e])return;if(!t)return;this.listeners[e]=this.listeners[e].filter((s)=>s.callback!==(typeof t==="function"?t:t.handleEvent))}dispatchEvent(e){if(!e||typeof e.type!=="string")throw Error("invalid event object");let t=this.listeners[e.type];if(!t)return!0;for(let r of[...t]){try{r.callback.call(this,e)}catch(s){setTimeout(()=>{throw s},0)}if(r.once)this.removeEventListener(e.type,r.callback)}return!e.defaultPrevented}}cr.FakeEventTarget=fn});var _n=C(function(dr){Object.defineProperty(dr,"__esModule",{value:!0});dr.FakeEvent=void 0;class gn{NONE=0;CAPTURING_PHASE=1;AT_TARGET=2;BUBBLING_PHASE=3;type;bubbles;cancelable;defaultPrevented=!1;composed=!1;currentTarget=null;eventPhase=this.NONE;isTrusted=!0;target=null;timeStamp=0;cancelBubble=!1;returnValue=!0;srcElement=null;constructor(e,t={}){this.type=e,this.bubbles=t.bubbles??!1,this.cancelable=t.cancelable??!1}preventDefault(){if(this.cancelable)this.defaultPrevented=!0}stopPropagation(){}stopImmediatePropagation(){}composedPath(){return[]}initEvent(e,t,r){}}dr.FakeEvent=gn});var vn=C(function(Lr){Object.defineProperty(Lr,"__esModule",{value:!0});Lr.clone=$o;function $o(e){if(e===void 0)return;else if(Number.isNaN(e))return NaN;else if(typeof structuredClone==="function")return structuredClone(e);else return JSON.parse(JSON.stringify(e))}});var bn=C(function(lr){Object.defineProperty(lr,"__esModule",{value:!0});lr.FakeMediaStreamTrack=void 0;var pr=hn(),wn=mn(),J=_n(),Ee=vn();class Mr extends wn.FakeEventTarget{#m;#l;#u;#e;#r;#t;#s;#h;#i;#f;#n;#a=null;#o=null;#c=null;#d=null;#p=null;constructor({kind:e,id:t,label:r,contentHint:s,enabled:i,muted:n,readyState:a,capabilities:o,constraints:c,settings:d,data:l}){super();this.#m=t??pr.v4(),this.#l=e,this.#u=r??"",this.#s=s??"",this.#r=i??!0,this.#t=n??!1,this.#e=a??"live",this.#h=o??{},this.#i=c??{},this.#f=d??{},this.#n=l??{}}get id(){return this.#m}get kind(){return this.#l}get label(){return this.#u}get contentHint(){return this.#s}set contentHint(e){this.#s=e}get enabled(){return this.#r}set enabled(e){let t=this.#r!==e;if(this.#r=e,t)this.dispatchEvent(new J.FakeEvent("enabledchange"))}get muted(){return this.#t}get readyState(){return this.#e}get data(){return this.#n}set data(e){this.#n=e}get onmute(){return this.#a}set onmute(e){if(this.#a)this.removeEventListener("mute",this.#a);if(this.#a=e,e)this.addEventListener("mute",e)}get onunmute(){return this.#o}set onunmute(e){if(this.#o)this.removeEventListener("unmute",this.#o);if(this.#o=e,e)this.addEventListener("unmute",e)}get onended(){return this.#c}set onended(e){if(this.#c)this.removeEventListener("ended",this.#c);if(this.#c=e,e)this.addEventListener("ended",e)}get onenabledchange(){return this.#d}set onenabledchange(e){if(this.#d)this.removeEventListener("enabledchange",this.#d);if(this.#d=e,e)this.addEventListener("enabledchange",e)}get onstopped(){return this.#p}set onstopped(e){if(this.#p)this.removeEventListener("stopped",this.#p);if(this.#p=e,e)this.addEventListener("stopped",e)}addEventListener(e,t,r){super.addEventListener(e,t,r)}removeEventListener(e,t,r){super.removeEventListener(e,t,r)}stop(){if(this.#e==="ended")return;this.#e="ended",this.dispatchEvent(new J.FakeEvent("stopped"))}clone({id:e,data:t}={}){return new Mr({id:e??pr.v4(),kind:this.#l,label:this.#u,contentHint:this.#s,enabled:this.#r,muted:this.#t,readyState:this.#e,capabilities:Ee.clone(this.#h),constraints:Ee.clone(this.#i),settings:Ee.clone(this.#f),data:t??Ee.clone(this.#n)})}getCapabilities(){return this.#h}getConstraints(){return this.#i}async applyConstraints(e={}){return this.#i=e,Promise.resolve()}getSettings(){return this.#f}remoteStop(){if(this.#e==="ended")return;this.#e="ended",this.dispatchEvent(new J.FakeEvent("stopped")),this.dispatchEvent(new J.FakeEvent("ended"))}remoteMute(){if(this.#t)return;this.#t=!0,this.dispatchEvent(new J.FakeEvent("mute"))}remoteUnmute(){if(!this.#t)return;this.#t=!1,this.dispatchEvent(new J.FakeEvent("unmute"))}}lr.FakeMediaStreamTrack=Mr});var Sn=C(function(ur){Object.defineProperty(ur,"__esModule",{value:!0});ur.FakeEventTarget=void 0;class yn{listeners={};addEventListener(e,t,r){if(!t)return;this.listeners[e]=this.listeners[e]??[],this.listeners[e].push({callback:typeof t==="function"?t:t.handleEvent,once:typeof r==="object"&&r.once===!0})}removeEventListener(e,t,r){if(!this.listeners[e])return;if(!t)return;this.listeners[e]=this.listeners[e].filter((s)=>s.callback!==(typeof t==="function"?t:t.handleEvent))}dispatchEvent(e){if(!e||typeof e.type!=="string")throw Error("invalid event object");let t=this.listeners[e.type];if(!t)return!0;for(let r of[...t]){try{r.callback.call(this,e)}catch(s){setTimeout(()=>{throw s},0)}if(r.once)this.removeEventListener(e.type,r.callback)}return!e.defaultPrevented}}ur.FakeEventTarget=yn});var Pn=C(function(he){var Bo=he&&he.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Vo=he&&he.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),Cn=he&&he.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")Bo(r,t,s[i])}return Vo(r,t),r}}();Object.defineProperty(he,"__esModule",{value:!0});he.FakeHandler=void 0;var En=bn(),Tn=A(),Dn=I(),ot=Cn(De()),kr=Cn(re()),hr=H(),xn=Sn(),j=new Dn.Logger("FakeHandler"),Rn="FakeHandler";class Mt extends Tn.EnhancedEventEmitter{_closed=!1;_fakeParameters;_getSendExtendedRtpCapabilities;_cname=`CNAME-${ot.generateRandomNumber()}`;_defaultSendStreamId=`${ot.generateRandomNumber()}`;_transportReady=!1;_nextLocalId=1;_tracks=new Map;_nextSctpStreamId=0;static createFactory(e){return{name:Rn,factory:(t)=>new Mt(t,e),getNativeRtpCapabilities:async({direction:t})=>(j.debug("getNativeRtpCapabilities() [direction:%o]",t),Mt.getLocalRtpCapabilities(e))}}static getLocalRtpCapabilities(e){let t=e.generateNativeRtpCapabilities();return kr.validateAndNormalizeRtpCapabilities(t),t}constructor({getSendExtendedRtpCapabilities:e},t){super();j.debug("constructor()"),this._getSendExtendedRtpCapabilities=e,this._fakeParameters=t}get name(){return Rn}close(){if(j.debug("close()"),this._closed)return;this._closed=!0,super.close()}setIceGatheringState(e){this.emit("@icegatheringstatechange",e)}setConnectionState(e){this.emit("@connectionstatechange",e)}async updateIceServers(e){this.assertNotClosed(),j.debug("updateIceServers()")}async restartIce(e){this.assertNotClosed(),j.debug("restartIce()")}async getTransportStats(){return this.assertNotClosed(),new Map}async send({track:e,streamId:t,encodings:r,codecOptions:s,codec:i}){if(this.assertNotClosed(),j.debug("send() [kind:%s, track.id:%s]",e.kind,e.id),!this._transportReady)await this.setupTransport({localDtlsRole:"server"});let n=Mt.getLocalRtpCapabilities(this._fakeParameters),a=this._getSendExtendedRtpCapabilities(n),o=kr.getSendingRtpParameters(e.kind,a);o.codecs=kr.reduceCodecs(o.codecs,i);let c=o.codecs.some((l)=>/.+\/rtx$/i.test(l.mimeType));if(o.mid=`mid-${ot.generateRandomNumber()}`,o.msid=`${t??"-"} ${e.id}`,!r)r=[{}];for(let l of r)if(l.ssrc=ot.generateRandomNumber(),c)l.rtx={ssrc:ot.generateRandomNumber()};o.encodings=r,o.rtcp={cname:this._cname,reducedSize:!0,mux:!0},o.msid=`${t??this._defaultSendStreamId} ${e.id}`;let d=this._nextLocalId++;return this._tracks.set(d,e),{localId:String(d),rtpParameters:o}}async stopSending(e){if(j.debug("stopSending() [localId:%s]",e),this._closed)return;if(!this._tracks.has(Number(e)))throw Error("local track not found");this._tracks.delete(Number(e))}async pauseSending(e){this.assertNotClosed()}async resumeSending(e){this.assertNotClosed()}async replaceTrack(e,t){if(this.assertNotClosed(),t)j.debug("replaceTrack() [localId:%s, track.id:%s]",e,t.id);else j.debug("replaceTrack() [localId:%s, no track]",e);this._tracks.delete(Number(e)),this._tracks.set(Number(e),t)}async setMaxSpatialLayer(e,t){this.assertNotClosed(),j.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]",e,t)}async setRtpEncodingParameters(e,t){this.assertNotClosed(),j.debug("setRtpEncodingParameters() [localId:%s, params:%o]",e,t)}async getSenderStats(e){return this.assertNotClosed(),new Map}async sendDataChannel({sctpStreamParameters:e}){if(this.assertNotClosed(),!this._transportReady)await this.setupTransport({localDtlsRole:"server"});j.debug("sendDataChannel()");let t=new Or({id:this._nextSctpStreamId++,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits,label:e.label,protocol:e.protocol}),r={streamId:this._nextSctpStreamId,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits};return{dataChannel:t,sctpStreamParameters:r}}async receive(e){this.assertNotClosed();let t=[];for(let r of e){let{trackId:s,kind:i}=r;if(!this._transportReady)await this.setupTransport({localDtlsRole:"client"});j.debug("receive() [trackId:%s, kind:%s]",s,i);let n=this._nextLocalId++,a=new En.FakeMediaStreamTrack({kind:i});this._tracks.set(n,a),t.push({localId:String(n),track:a})}return t}async stopReceiving(e){if(this._closed)return;for(let t of e)j.debug("stopReceiving() [localId:%s]",t),this._tracks.delete(Number(t))}async pauseReceiving(e){this.assertNotClosed()}async resumeReceiving(e){this.assertNotClosed()}async getReceiverStats(e){return this.assertNotClosed(),new Map}async receiveDataChannel({sctpStreamParameters:e,label:t,protocol:r}){if(this.assertNotClosed(),!this._transportReady)await this.setupTransport({localDtlsRole:"client"});return j.debug("receiveDataChannel()"),{dataChannel:new Or({id:e.streamId,ordered:e.ordered,maxPacketLifeTime:e.maxPacketLifeTime,maxRetransmits:e.maxRetransmits,label:t,protocol:r})}}getDataChannelMaxMessageSize(){return 500000}async setupTransport({localDtlsRole:e,localSdpObject:t}){let r=ot.clone(this._fakeParameters.generateLocalDtlsParameters());if(e)r.role=e;this.emit("@connectionstatechange","connecting"),await new Promise((s,i)=>this.emit("@connect",{dtlsParameters:r},s,i)),this._transportReady=!0}assertNotClosed(){if(this._closed)throw new hr.InvalidStateError("method called in a closed handler")}}he.FakeHandler=Mt;class Or extends xn.FakeEventTarget{_id;_negotiated=!0;_ordered;_maxPacketLifeTime;_maxRetransmits;_label;_protocol;_readyState="connecting";_bufferedAmount=0;_bufferedAmountLowThreshold=0;_binaryType="arraybuffer";_onopen=null;_onclosing=null;_onclose=null;_onmessage=null;_onbufferedamountlow=null;_onerror=null;constructor({id:e,ordered:t=!0,maxPacketLifeTime:r=null,maxRetransmits:s=null,label:i="",protocol:n=""}){super();j.debug(`constructor() [id:${e}, ordered:${t}, maxPacketLifeTime:${r}, maxRetransmits:${s}, label:${i}, protocol:${n}`),this._id=e,this._ordered=t,this._maxPacketLifeTime=r,this._maxRetransmits=s,this._label=i,this._protocol=n}get id(){return this._id}get negotiated(){return this._negotiated}get ordered(){return this._ordered}get maxPacketLifeTime(){return this._maxPacketLifeTime}get maxRetransmits(){return this._maxRetransmits}get label(){return this._label}get protocol(){return this._protocol}get readyState(){return this._readyState}get bufferedAmount(){return this._bufferedAmount}get bufferedAmountLowThreshold(){return this._bufferedAmountLowThreshold}set bufferedAmountLowThreshold(e){this._bufferedAmountLowThreshold=e}get binaryType(){return this._binaryType}set binaryType(e){this._binaryType=e}get onopen(){return this._onopen}set onopen(e){if(this._onopen)this.removeEventListener("open",this._onopen);if(this._onopen=e,e)this.addEventListener("open",e)}get onclosing(){return this._onclosing}set onclosing(e){if(this._onclosing)this.removeEventListener("closing",this._onclosing);if(this._onclosing=e,e)this.addEventListener("closing",e)}get onclose(){return this._onclose}set onclose(e){if(this._onclose)this.removeEventListener("close",this._onclose);if(this._onclose=e,e)this.addEventListener("close",e)}get onmessage(){return this._onmessage}set onmessage(e){if(this._onmessage)this.removeEventListener("message",this._onmessage);if(this._onmessage=e,e)this.addEventListener("message",e)}get onbufferedamountlow(){return this._onbufferedamountlow}set onbufferedamountlow(e){if(this._onbufferedamountlow)this.removeEventListener("bufferedamountlow",this._onbufferedamountlow);if(this._onbufferedamountlow=e,e)this.addEventListener("bufferedamountlow",e)}get onerror(){return this._onerror}set onerror(e){if(this._onerror)this.removeEventListener("error",this._onerror);if(this._onerror=e,e)this.addEventListener("error",e)}addEventListener(e,t,r){super.addEventListener(e,t,r)}removeEventListener(e,t,r){super.removeEventListener(e,t,r)}close(){if(["closing","closed"].includes(this._readyState))return;this._readyState="closed"}send(e){if(this._readyState!=="open")throw new hr.InvalidStateError("not open")}}});var Ln=C(function(F){var Uo=F&&F.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),Ko=F&&F.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),Ho=F&&F.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")Uo(r,t,s[i])}return Ko(r,t),r}}();Object.defineProperty(F,"__esModule",{value:!0});F.generateRouterRtpCapabilities=Go;F.generateNativeRtpCapabilities=Qo;F.generateLocalDtlsParameters=Wo;F.generateTransportRemoteParameters=Jo;F.generateProducerRemoteParameters=Yo;F.generateConsumerRemoteParameters=Zo;F.generateDataProducerRemoteParameters=Xo;F.generateDataConsumerRemoteParameters=ec;var V=Ho(De());function K(){return String(V.generateRandomNumber())}function Go(){return V.deepFreeze({codecs:[{mimeType:"audio/opus",kind:"audio",preferredPayloadType:100,clockRate:48000,channels:2,rtcpFeedback:[{type:"transport-cc"}],parameters:{useinbandfec:1,foo:"bar"}},{mimeType:"video/VP8",kind:"video",preferredPayloadType:101,clockRate:90000,rtcpFeedback:[{type:"nack"},{type:"nack",parameter:"pli"},{type:"ccm",parameter:"fir"},{type:"goog-remb"},{type:"transport-cc"}],parameters:{"x-google-start-bitrate":1500}},{mimeType:"video/rtx",kind:"video",preferredPayloadType:102,clockRate:90000,rtcpFeedback:[],parameters:{apt:101}},{mimeType:"video/H264",kind:"video",preferredPayloadType:103,clockRate:90000,rtcpFeedback:[{type:"nack"},{type:"nack",parameter:"pli"},{type:"ccm",parameter:"fir"},{type:"goog-remb"},{type:"transport-cc"}],parameters:{"level-asymmetry-allowed":1,"packetization-mode":1,"profile-level-id":"42e01f"}},{mimeType:"video/rtx",kind:"video",preferredPayloadType:104,clockRate:90000,rtcpFeedback:[],parameters:{apt:103}},{mimeType:"video/VP9",kind:"video",preferredPayloadType:105,clockRate:90000,rtcpFeedback:[{type:"nack"},{type:"nack",parameter:"pli"},{type:"ccm",parameter:"fir"},{type:"goog-remb"},{type:"transport-cc"}],parameters:{"profile-id":0,"x-google-start-bitrate":1500}},{mimeType:"video/rtx",kind:"video",preferredPayloadType:106,clockRate:90000,rtcpFeedback:[],parameters:{apt:105}}],headerExtensions:[{kind:"audio",uri:"urn:ietf:params:rtp-hdrext:sdes:mid",preferredId:1,preferredEncrypt:!1,direction:"sendrecv"},{kind:"video",uri:"urn:ietf:params:rtp-hdrext:sdes:mid",preferredId:1,preferredEncrypt:!1,direction:"sendrecv"},{kind:"video",uri:"urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id",preferredId:2,preferredEncrypt:!1,direction:"recvonly"},{kind:"video",uri:"urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id",preferredId:3,preferredEncrypt:!1,direction:"recvonly"},{kind:"audio",uri:"http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",preferredId:4,preferredEncrypt:!1,direction:"sendrecv"},{kind:"video",uri:"http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",preferredId:4,preferredEncrypt:!1,direction:"sendrecv"},{kind:"audio",uri:"http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",preferredId:5,preferredEncrypt:!1,direction:"recvonly"},{kind:"video",uri:"http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",preferredId:5,preferredEncrypt:!1,direction:"sendrecv"},{kind:"audio",uri:"urn:ietf:params:rtp-hdrext:ssrc-audio-level",preferredId:10,preferredEncrypt:!1,direction:"sendrecv"},{kind:"video",uri:"urn:3gpp:video-orientation",preferredId:11,preferredEncrypt:!1,direction:"sendrecv"}]})}function Qo(){return{codecs:[{mimeType:"audio/opus",kind:"audio",preferredPayloadType:111,clockRate:48000,channels:2,rtcpFeedback:[{type:"transport-cc"}],parameters:{minptime:10,useinbandfec:1}},{mimeType:"audio/ISAC",kind:"audio",preferredPayloadType:103,clockRate:16000,channels:1,rtcpFeedback:[{type:"transport-cc"}],parameters:{}},{mimeType:"audio/CN",kind:"audio",preferredPayloadType:106,clockRate:32000,channels:1,rtcpFeedback:[{type:"transport-cc"}],parameters:{}},{mimeType:"audio/foo",kind:"audio",preferredPayloadType:107,clockRate:90000,channels:4,rtcpFeedback:[{type:"foo-qwe-qwe"}],parameters:{foo:"lalala"}},{mimeType:"video/BAZCODEC",kind:"video",preferredPayloadType:100,clockRate:90000,rtcpFeedback:[{type:"foo"},{type:"transport-cc"},{type:"ccm",parameter:"fir"},{type:"nack"},{type:"nack",parameter:"pli"}],parameters:{baz:"1234abcd"}},{mimeType:"video/rtx",kind:"video",preferredPayloadType:101,clockRate:90000,rtcpFeedback:[],parameters:{apt:100}},{mimeType:"video/VP8",kind:"video",preferredPayloadType:96,clockRate:90000,rtcpFeedback:[{type:"goog-remb"},{type:"transport-cc"},{type:"ccm",parameter:"fir"},{type:"nack"},{type:"nack",parameter:"pli"}],parameters:{baz:"1234abcd"}},{mimeType:"video/rtx",kind:"video",preferredPayloadType:97,clockRate:90000,rtcpFeedback:[],parameters:{apt:96}},{mimeType:"video/VP9",kind:"video",preferredPayloadType:98,clockRate:90000,rtcpFeedback:[{type:"goog-remb"},{type:"transport-cc"},{type:"ccm",parameter:"fir"},{type:"nack"},{type:"nack",parameter:"pli"}],parameters:{"profile-id":0}},{mimeType:"video/rtx",kind:"video",preferredPayloadType:99,clockRate:90000,rtcpFeedback:[],parameters:{apt:98}}],headerExtensions:[{kind:"audio",uri:"urn:ietf:params:rtp-hdrext:sdes:mid",preferredId:1},{kind:"video",uri:"urn:ietf:params:rtp-hdrext:sdes:mid",preferredId:1},{kind:"video",uri:"http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",preferredId:3},{kind:"video",uri:"urn:3gpp:video-orientation",preferredId:4},{kind:"video",uri:"http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",preferredId:5},{kind:"video",uri:"http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",preferredId:6},{kind:"video",uri:"http://www.webrtc.org/experiments/rtp-hdrext/video-content-type",preferredId:7},{kind:"video",uri:"http://www.webrtc.org/experiments/rtp-hdrext/video-timing",preferredId:8},{kind:"audio",uri:"urn:ietf:params:rtp-hdrext:ssrc-audio-level",preferredId:10}]}}function Wo(){return V.deepFreeze({fingerprints:[{algorithm:"sha-256",value:"82:5A:68:3D:36:C3:0A:DE:AF:E7:32:43:D2:88:83:57:AC:2D:65:E5:80:C4:B6:FB:AF:1A:A0:21:9F:6D:0C:AD"}],role:"auto"})}function Jo(){return{id:K(),iceParameters:V.deepFreeze({iceLite:!0,password:"yku5ej8nvfaor28lvtrabcx0wkrpkztz",usernameFragment:"h3hk1iz6qqlnqlne"}),iceCandidates:V.deepFreeze([{foundation:"udpcandidate",address:"9.9.9.9",ip:"9.9.9.9",port:40533,priority:1078862079,protocol:"udp",type:"host",tcpType:"passive"},{foundation:"udpcandidate",address:"9.9.9.9",ip:"9:9:9:9:9:9",port:41333,priority:1078862089,protocol:"udp",type:"host",tcpType:"passive"}]),dtlsParameters:V.deepFreeze({fingerprints:[{algorithm:"sha-256",value:"A9:F4:E0:D2:74:D3:0F:D9:CA:A5:2F:9F:7F:47:FA:F0:C4:72:DD:73:49:D0:3B:14:90:20:51:30:1B:90:8E:71"},{algorithm:"sha-384",value:"03:D9:0B:87:13:98:F6:6D:BC:FC:92:2E:39:D4:E1:97:32:61:30:56:84:70:81:6E:D1:82:97:EA:D9:C1:21:0F:6B:C5:E7:7F:E1:97:0C:17:97:6E:CF:B3:EF:2E:74:B0"},{algorithm:"sha-512",value:"84:27:A4:28:A4:73:AF:43:02:2A:44:68:FF:2F:29:5C:3B:11:9A:60:F4:A8:F0:F5:AC:A0:E3:49:3E:B1:34:53:A9:85:CE:51:9B:ED:87:5E:B8:F4:8E:3D:FA:20:51:B8:96:EE:DA:56:DC:2F:5C:62:79:15:23:E0:21:82:2B:2C"}],role:"auto"}),sctpParameters:V.deepFreeze({port:5000,maxSendMessageSize:50000,maxReceiveMessageSize:50000})}}function Yo(){return V.deepFreeze({id:K()})}function Zo({id:e,codecMimeType:t}={}){switch(t){case"audio/opus":return{id:e??K(),producerId:K(),kind:"audio",rtpParameters:V.deepFreeze({codecs:[{mimeType:"audio/opus",payloadType:100,clockRate:48000,channels:2,rtcpFeedback:[{type:"transport-cc"}],parameters:{useinbandfec:1,foo:"bar"}}],encodings:[{ssrc:46687003}],headerExtensions:[{uri:"urn:ietf:params:rtp-hdrext:sdes:mid",id:1},{uri:"http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",id:5},{uri:"urn:ietf:params:rtp-hdrext:ssrc-audio-level",id:10}],rtcp:{cname:"wB4Ql4lrsxYLjzuN",reducedSize:!0,mux:!0}})};case"audio/ISAC":return{id:e??K(),producerId:K(),kind:"audio",rtpParameters:V.deepFreeze({codecs:[{mimeType:"audio/ISAC",payloadType:111,clockRate:16000,channels:1,rtcpFeedback:[{type:"transport-cc"}],parameters:{}}],encodings:[{ssrc:46687004}],headerExtensions:[{uri:"urn:ietf:params:rtp-hdrext:sdes:mid",id:1},{uri:"http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",id:5}],rtcp:{cname:"wB4Ql4lrsxYLjzuN",reducedSize:!0,mux:!0}})};case"video/VP8":return{id:e??K(),producerId:K(),kind:"video",rtpParameters:V.deepFreeze({codecs:[{mimeType:"video/VP8",payloadType:101,clockRate:90000,rtcpFeedback:[{type:"nack"},{type:"nack",parameter:"pli"},{type:"ccm",parameter:"fir"},{type:"goog-remb"},{type:"transport-cc"}],parameters:{"x-google-start-bitrate":1500}},{mimeType:"video/rtx",payloadType:102,clockRate:90000,rtcpFeedback:[],parameters:{apt:101}}],encodings:[{ssrc:99991111,rtx:{ssrc:99991112}}],headerExtensions:[{uri:"urn:ietf:params:rtp-hdrext:sdes:mid",id:1},{uri:"http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",id:4},{uri:"http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",id:5},{uri:"urn:3gpp:video-orientation",id:11}],rtcp:{cname:"wB4Ql4lrsxYLjzuN",reducedSize:!0,mux:!0}})};case"video/H264":return{id:e??K(),producerId:K(),kind:"video",rtpParameters:V.deepFreeze({codecs:[{mimeType:"video/H264",payloadType:103,clockRate:90000,rtcpFeedback:[{type:"nack"},{type:"nack",parameter:"pli"},{type:"ccm",parameter:"fir"},{type:"goog-remb"},{type:"transport-cc"}],parameters:{"level-asymmetry-allowed":1,"packetization-mode":1,"profile-level-id":"42e01f"}},{mimeType:"video/rtx",payloadType:104,clockRate:90000,rtcpFeedback:[],parameters:{apt:103}}],encodings:[{ssrc:99991113,rtx:{ssrc:99991114}}],headerExtensions:[{uri:"urn:ietf:params:rtp-hdrext:sdes:mid",id:1},{uri:"http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",id:4},{uri:"http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",id:5},{uri:"urn:3gpp:video-orientation",id:11}],rtcp:{cname:"wB4Ql4lrsxYLjzuN",reducedSize:!0,mux:!0}})};default:throw TypeError(`unknown codecMimeType '${t}'`)}}function Xo(){return V.deepFreeze({id:K()})}function ec({id:e}={}){return{id:e??K(),dataProducerId:K(),sctpStreamParameters:V.deepFreeze({streamId:666,maxPacketLifeTime:5000,maxRetransmits:void 0})}}});var Tr=C(function(D){var tc=D&&D.__createBinding||(Object.create?function(e,t,r,s){if(s===void 0)s=r;var i=Object.getOwnPropertyDescriptor(t,r);if(!i||("get"in i?!t.__esModule:i.writable||i.configurable))i={enumerable:!0,get:function(){return t[r]}};Object.defineProperty(e,s,i)}:function(e,t,r,s){if(s===void 0)s=r;e[s]=t[r]}),rc=D&&D.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),fr=D&&D.__importStar||function(){var e=function(t){return e=Object.getOwnPropertyNames||function(r){var s=[];for(var i in r)if(Object.prototype.hasOwnProperty.call(r,i))s[s.length]=i;return s},e(t)};return function(t){if(t&&t.__esModule)return t;var r={};if(t!=null){for(var s=e(t),i=0;i<s.length;i++)if(s[i]!=="default")tc(r,t,s[i])}return rc(r,t),r}}(),sc=D&&D.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(D,"__esModule",{value:!0});D.debug=D.testFakeParameters=D.FakeHandler=D.enhancedEvents=D.ortc=D.parseScalabilityMode=D.detectDeviceAsync=D.detectDevice=D.Device=D.version=D.types=void 0;var ic=sc(ct());D.debug=ic.default;D.types=fr(Br());D.version="3.26.0";var Ir=ln();Object.defineProperty(D,"Device",{enumerable:!0,get:function(){return Ir.Device}});Object.defineProperty(D,"detectDevice",{enumerable:!0,get:function(){return Ir.detectDevice}});Object.defineProperty(D,"detectDeviceAsync",{enumerable:!0,get:function(){return Ir.detectDeviceAsync}});var nc=Me();Object.defineProperty(D,"parseScalabilityMode",{enumerable:!0,get:function(){return nc.parse}});D.ortc=fr(re());D.enhancedEvents=fr(A());var ac=Pn();Object.defineProperty(D,"FakeHandler",{enumerable:!0,get:function(){return ac.FakeHandler}});D.testFakeParameters=fr(Ln())});var oc=Nn(Tr());window.mediasoupClient=oc;})();
```

### web/viewer.html
- veƒækos≈•: 1216 B
- riadky: 12
- prv√Ωch 5 riadkov:
```
<!doctype html><html lang="sk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CMEP Live Inspection ‚Äî Viewer</title><link rel="stylesheet" href="/app.css"></head><body><main><h1>Viewer ‚Äî ≈æiv√° obhliadka</h1>
<label>Token (dev) <input id="token" autocomplete="off" placeholder="z mint-token.sh alebo z CMEP platformy"></label>
<label>Room ID <input id="room" autocomplete="off" placeholder="vypln√≠ sa automaticky z CMEP"></label>
<p><button id="connect">Pripoji≈• a ≈æiada≈• obhliadku</button> <button id="micToggle" disabled>Mikrof√≥n OFF</button> <button id="stop" disabled>Odpoji≈•</button> <button id="enableAudio" hidden>Zapn√∫≈• zvuk</button></p>
<p>Stav spojenia: <span id="connState" data-state="new">‚Äî</span> ¬∑ Kamera: <span id="camState">‚Äî</span> ¬∑ Mikrof√≥n: <span id="micState">vypnut√Ω</span> ¬∑ Hovor: <span id="callState">neakt√≠vny</span></p>
```

### web/viewer.js
- veƒækos≈•: 12373 B
- riadky: 258
- prv√Ωch 5 riadkov:
```
'use strict';
const stateEl = document.querySelector('#state');
const videoEl = document.querySelector('#remote');
const say = (m) => { stateEl.textContent = m; };
let wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':8504/ws';
```


## Backend anal√Ωza (F√ÅZA 1.3)

### Moduly `backend/src`

| S√∫bor | Riadky | √öƒçel | Z√°vislosti |
|---|---:|---|---|
| index.js | 146 | Vstupn√Ω bod, runtime lock, health, intern√© API | config, http, signaling, adapter, media-config, process-manager, recorder, events, mediasoup, auth, turn-credentials |
| http.js | 71 | HTTP server, statick√© s√∫bory, health endpointy, intern√© POST | node:http, node:fs, node:path |
| signaling.js | 473 | WebSocket signaling, mediasoup worker/router, rooms, peers, resume | ws, protocol, session-store, logger |
| config.js | 52 | Konfigur√°cia env | node:path |
| auth.js | 26 | Lok√°lne JWT/session tokeny | node:crypto |
| adapter/cmep-adapter.js | 47 | V√Ωber local/http adaptera | adapter/http-adapter |
| adapter/http-adapter.js | 168 | CMEP platform HTTP adapter | node:crypto |
| events.js | 28 | Audit/event emitovanie | logger |
| logger.js | 10 | JSON logging | - |
| media-config.js | 28 | Media/listen IP konfigur√°cia | - |
| process-manager.js | 21 | Spr√°va child procesov (ffmpeg/recorder) | node:child_process |
| protocol.js | 15 | Valid√°cia WS met√≥d | - |
| recorder.js | 159 | FFmpeg recording cez plain transport | node:fs, node:path, node:dgram |
| session-store.js | 24 | In-memory room/peer store | node:crypto |
| turn-credentials.js | 54 | TURN REST credentials a ICE servers | node:crypto |

### HTTP endpointy
- `GET /health`, `GET /healthz` - health payload, cache-control no-store.
- `POST /internal/inspections/:id/end` - intern√© CMEP rozhranie chr√°nen√© `X-CMEP-Internal-Key`.
- `GET /*` - statick√© s√∫bory z `web/` ak `staticEnabled`.
- WebSocket upgrade iba pre `GET /ws`.

### WebSocket met√≥dy (protocol.js)
createRoom, joinRoom, leaveRoom, getRouterRtpCapabilities, createWebRtcTransport, connectTransport, produce, consume, resumeConsumer, requestInspection, acceptInspection, rejectInspection, startRecording, stopRecording, close, getIceServers, restartIce, resumeSession.

### Zistenia
- Backend je Node.js CommonJS, z√°vislosti iba `mediasoup`, `mediasoup-client`, `ws`.
- NPM skript `check` kontroluje syntax JS a Python server.
- Server m√° runtime lock s PID a kontrolou `/proc/<pid>/cmdline`.
- Health endpoint m√¥≈æe vr√°ti≈• `ready: false` poƒças ≈°tartu (worker e≈°te neexistuje).
- Intern√© API je fail-closed, ak ch√Ωba signaling.
