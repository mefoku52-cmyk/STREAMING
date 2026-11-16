# Phase 3B – CDP Browser E2E Report (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repos: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), `waste-platform` (workspace with existing Phase 2 changes). **No commit/push/deploy. No production/GitHub/Render/DB/env/recordings/user-data changes. No functional application source modified** (`web/publish.js`, `web/viewer.js`, backend implementation unchanged).

## Scope
Fix the **test harness only** (Phase 3A follow-up) and re-attempt real browser **publisher → viewer WebRTC audio/video** transfer using **Chromium CDP** on the native signaling port expected by the existing frontend. Report is evidence-based only.

## Changes vs Phase 3A (harness-only)
File modified: `deploy/phase3a-cdp-e2e.js` (test-only harness). No new dependencies installed.

- **Streaming on fixed port 8504** (matches `web/publish.js`/`web/viewer.js` hardcoded `ws(s)://<host>:8504/ws`).
- **Pre-flight port 8504 check**: TCP listen probe; if occupied collects diagnostics (`ss`, `netstat`, `lsof`, `/proc/net/tcp*`, `ps`) and **aborts safely with clear diagnostics without killing any foreign process**. (In this run port was free.)
- **Platform server and CDP on dynamic free ports** (unchanged strategy).
- **Removed injected JS WebSocket URL-rewrite hook**. Added non-invasive hooks only for **stats capture** (`RTCPeerConnection`/mediasoup transport observation) and **in-page WS lifecycle observation** (records URL/open/close/error, no URL rewrite).
- **Kept** existing platform runner (`waste-platform/scripts/cmep_live_inspection_e2e_server.py`), existing auth/token minting and API flow, unchanged `publish.html`/`viewer.html` pages, **two isolated Chromium browser contexts** (`Target.createBrowserContext` + separate targets/sessions), and safety controls (timeouts, step tracking, process cleanup).
- **Diagnostics added/strengthened**: browser console (`Runtime.consoleAPICalled`), `Runtime.exceptionThrown`, WebSocket URL and open/close/error events (in-page + CDP `Network.webSocket*`), CDP Target/Page lifecycle events, captured server (streaming/platform/chrome) logs/tails, WS probe close codes, and **last successful step** tracking on every run.

## Execution
- Command: `timeout 600 node deploy/phase3a-cdp-e2e.js` (from `cmep-streaming/`)
- Result artifact: `/data/data/com.termux/files/usr/tmp/opencode/phase3b-result.json`
- Run log: `/data/data/com.termux/files/usr/tmp/opencode/phase3b-run.log`
- Environment: Node v24.22.2 (Termux), Chromium 156.0.8078.79 `/data/data/com.termux/files/usr/bin/chromium-browser`, headless CDP, fake A/V (`--use-fake-ui-for-media-stream --use-fake-device-for-media-stream --autoplay-policy=no-user-gesture-required --no-sandbox --disable-gpu`).

## Pre-checks (evidence)
| Check | Result |
|---|---|
| Port 8504 availability pre-flight | **PASS** — free (`preflight_port_8504_free`, port 8504). No foreign process. |
| Streaming HTTP on 8504 (`GET /healthz`) | **PASS** — `200 {"ok":true,"ready":true,"status":"running",..."media":{"rooms":0,"workerAlive":true,"peers":0}}` |
| WebSocket `/ws` reachable on 8504 (unauth probe) | **PASS** — connection opened (probe `{"opened":true}`), endpoint accepting WS on 8504 |
| Publisher page creates real WebSocket | **PASS** — in-page observed `ws://127.0.0.1:8504/ws?token=...` with `open` event; CDP `Network.webSocket*` events captured (publisher: 24, viewer: 23) |

## Flow & step evidence (last successful step: `verdict_computed`)
1. `preflight_port_8504_free` (8504)
2. `platform_ready` (`http://127.0.0.1:38859`, tokens minted)
3. `inspection_created` (inspection/offer `695c7bcd-a5c5-46fe-8452-9f84f2c8fa0d`, publish origin `http://127.0.0.1:8504`)
4. `streaming_booted` + HTTP/WS checks passed
5. `chrome_cdp_connected`, **two isolated contexts created** (publisher target `1087918…`, context `AD84543…`; viewer target `324F67…`, context `F6DE15…`)
6. **Publisher signaling / createRoom / produce:** navigated `publish.html?token=<redacted>&offer=…&auto=1` → WS open → `createRoom` OK, room `3391359c-dad1-4ced-9b39-7a16605f2b5c`, state active/waiting, **2 producers**, send transport present (`publisher_active_producing`, conn `connected`); platform room bound `room_created`.
7. **Viewer signaling / request / accept / join:** platform join OK (`viewer_platform_join_ok`, room match) → navigated `viewer.html?token=<redacted>&room=…&auto=1` → viewer WS open → publisher received `inspectionRequested` and accept enabled for viewer → `publisher_accept_clicked` → viewer `viewer_live` (`V obhliadke … (state: live)`, call `v hovore`, conn `connected`, cam `prijímaná`, remote stream present).
8. Two media samples collected ~5s apart; UI cleanup (`Ukončené.` / `Odpojené.`), post-cleanup health `rooms:0, peers:0, workerAlive:true`, contexts disposed.

## Detailed results

### Publisher
- **Local audio/video tracks:** **PASS (evidenced)** — 2 live tracks: audio `Fake Default Audio Input` (live, enabled, unmuted), video `fake_device_0` (live, enabled, unmuted).
- **Signaling / createRoom:** **PASS** — WS created+open on 8504, room created `3391359c-dad1-4ced-9b39-7a16605f2b5c`, joined/active, no reconnect errors.
- **Audio/video produce:** **PASS** — 2 producers: audio `b59cc7b7…` and video `087f3ad1…` (both `closed:false`, `paused:false`); `transportStates.send: "connected"`.
- **Outbound RTP statistics (growing):** **PASS**
  - Sample 1: audio `bytesSent 32981, packetsSent 566`; video `bytesSent 320738, packetsSent 386, framesEncoded 222, framesSent 222`.
  - Sample 2: audio `bytesSent 48271, packetsSent 821`; video `bytesSent 537768, packetsSent 619, framesEncoded 324, framesSent 324` (all increased).
- **ICE/DTLS:** **PASS** — `ice: connected, dtls: connected, signaling: stable`; selected candidate pair `state: succeeded, nominated: true` (RTT ~0.002–0.003s, bytes flowing).

### Viewer
- **Signaling / request / accept / join:** **PASS** — viewer WS open, inspection request observed, publisher accept clicked, viewer state `live` / `v hovore`.
- **Remote MediaStream / video track:** **PASS** — `#remote.srcObject: true`, video track `live/enabled/unmuted`, `readyState: 4`.
- **Image playback (progression):** **PASS** — `videoWidth/Height` `480x360` → `640x480` (>0), `currentTime` `7.465571` → `12.521065` (advancing), `paused: false`.
- **Inbound video RTP (growing):** **PASS** — bytesReceived `215860` → `430384`, packetsReceived `250` → `480`, `framesDecoded` `150` → `251`, `packetsLost 0`, `jitter ~0.005`.
- **Audio consume / inbound audio RTP / audio activity:** **NOT EVIDENCED (PARTIAL)** — publisher produced and sent audio RTP successfully, but viewer reported `#remoteAudio.srcObject: false` (tracks null, paused, currentTime 0) and `inbound.audio: null` with no audio track on remote media elements in samples. No inbound audio `bytesReceived/packetsReceived` growth observed on viewer. Per existing `viewer.js` behavior, remote audio element is populated on audio consume; absence here is **evidenced but not root-caused** in this harness (could be app consume/attach/timing/headless autoplay/track-routing behavior — not proven). Therefore **audio transfer to viewer is unverified** despite publisher outbound audio.
- **ICE/DTLS:** **PASS** — recv PC `ice: connected, dtls: connected, signaling: stable`; selected pair `succeeded, nominated: true`, increasing `bytesReceived` on pair.

## Cleanup
- **PASS (evidenced):** publisher/viewer UI stop actions executed (`Ukončené.` / `Odpojené.`), post-cleanup streaming health `{"rooms":0,"workerAlive":true,"peers":0}`, both browser contexts disposed, processes terminated in `finally`.

## Diagnostics summary
- **Browser console:** 0 messages (publisher/viewer). **Runtime exceptions:** 0.
- **CDP Network WebSocket events:** captured (publisher 24, viewer 23) consistent with observed signaling.
- **In-page WS observation:** real WS URLs to `ws://127.0.0.1:8504/ws?token=...` with `open` (and subsequent) events recorded; no URL rewriting used.
- **Server/stream logs:** captured (tails in result JSON). **Signaling errors/close codes:** none observed in page state/WS events during successful flow.
- **Errors array:** empty.

## Unverified / limitations (explicit)
- **Viewer inbound audio receive/playback/activity** not proven (publisher outbound audio OK; viewer `inbound.audio`/remote audio track not evidenced). Root cause not isolated (harness vs app/headless behavior undetermined by this run).
- No physical camera/microphone test (B). No public internet/NAT traversal over real TURN/TLS/DNS/public IP (C).
- No reconnect/ICE-restart-under-active-media, load/long-haul, or other negative browser scenarios exercised in this run.
- `getStats()` fields reported as available; where absent they are null/not shown (e.g. no separate audio inbound stats on viewer) — no assumptions made.

## Changed files
- **Modified (harness only):** `deploy/phase3a-cdp-e2e.js`
- **Added (report):** `deploy/PHASE3B_CDP_E2E_REPORT.md`
- **Runtime artifacts (evidence, outside repo):** `/data/data/com.termux/files/usr/tmp/opencode/phase3b-run.log`, `/data/data/com.termux/files/usr/tmp/opencode/phase3b-result.json`
- **Unchanged:** `web/publish.js`, `web/viewer.js`, all backend implementation, configs, `.env`, DB, recordings/user data, existing tests.

## Conclusion
**VERDICT: PARTIAL**

Rationale (evidence-based): running streaming on native **port 8504** with the fixed harness succeeded in pre-flight/HTTP/WS checks, real publisher-page WS creation on 8504, **createRoom**, **audio+video produce**, and a real browser publisher→viewer flow with **request/accept/join/consume**. **Video** transfer is proven end-to-end: live remote video track, `videoWidth/Height > 0` and advancing `currentTime`, and **growing inbound video RTP** (`bytesReceived`/`framesDecoded`) plus growing publisher outbound RTP, with ICE/DTLS **connected/stable** and clean **cleanup** (`rooms:0, peers:0`). However, **viewer-side audio receive/activity was not evidenced** (`inbound.audio` null, no remote audio track/element stream) despite publisher outbound audio, so full A/V proof is incomplete. No simulated PASS; unproven areas listed above.
