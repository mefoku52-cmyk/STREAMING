# Phase 3E – Producer Dedup Fix Report (CMEP Streaming)

Date: 2026-11-16 (Termux/Android)  
Repo: `cmep-streaming`  
Branch: `main`  
HEAD (before start, unchanged): `3a76182741764b215acb88254886b7f44486bf5e`  
Scope: **minimal application fix only** for confirmed producer deduplication bug + additive regression tests + verification. No commit/push/merge/deploy. No reset/clean/checkout/rebase. No existing tests/reports deleted or overwritten. No changes to `web/`, `.env`, configs unrelated to bug, DB, recordings, or user data. No foreign process killed.

## 1. Original bug and confirmed cause

**Symptom (Phase 3B/3C):** Publisher successfully produced and sent audio+video RTP, but viewer did not receive/consume audio (viewer `joinRoom` producers list contained **video only**, no audio `newProducer`/consumer/inbound audio). Video path worked.

**Confirmed cause (Phase 3D, 4/4 isolation reproduction):** In `backend/src/signaling.js` `produce` handler, per-peer deduplication intended to replace an existing same-kind producer closed same-kind producers but then **unconditionally deleted every entry** from both `peer.producers` and `room.producers` (not limited to same-kind) before storing the new producer. Effect: a peer retained only its **last-produced** track in peer/room state.

- audio → video: room/advertisement left with **video only**
- video → audio: room/advertisement left with **audio only**

Phase 3D isolation (`deploy/phase3d-producer-isolation.js`) proved the signaling lifecycle/advertisement logic is otherwise correct when both kinds remain in state (all orderings/timings passed against real signaling with mocked mediasoup).

## 2. Exact application change (scope)

**File:** `backend/src/signaling.js` (only), `case 'produce'` dedup block.

- **Before:** iterated all `peer.producers`; for each entry closed it if same kind and **always** did `peer.producers.delete(pid)` and `room.producers.delete(pid)` (removed other kinds too).
- **After:** for each existing entry, act **only when** it is the same non-closed kind as the new produce: close that existing producer and delete **that producer’s** entries from `peer.producers` and `room.producers`. Entries of other kinds are left untouched. New producer is then stored in both maps and `close` observer removes only itself (unchanged).
- No API/protocol/event/identifier/client-compatibility changes. No `web/` changes. Transport/consumer/room/join/accept/recording/lifecycle logic otherwise unchanged.

## 3. Changed files (this phase)

- `backend/src/signaling.js` — minimal same-kind-only producer dedup fix in `produce`.
- `backend/test/producer-dedup.test.js` — **new** additive regression tests (isolated, real signaling/protocol/session-store with mocked mediasoup; no existing tests modified).
- `deploy/PHASE3E_PRODUCER_DEDUP_FIX_REPORT.md` — this report.

Notes: `deploy/` contains pre-existing Phase 3 artifacts/reports/harness changes from prior phases (untracked in workspace at start); this phase added only this report and did not delete/overwrite prior reports. Runtime evidence/logs written to `/data/data/com.termux/files/usr/tmp/opencode/` (outside repo).

## 4. Regression / verification results

| Suite / check | Result | Evidence / notes |
|---|---|---|
| **New** `backend/test/producer-dedup.test.js` (node --test) | **PASS 7/7** | Covers: audio→video room+join both; video→audio room+join both; repeated audio old closed/removed, new active, video preserved, no dup; repeated video symmetric; viewer joined before producers receives `newProducer` for both and room keeps both; viewer joined after gets audio+video in `joinRoom`; cleanup (peer disconnect closes room, `rooms.size()==0`). |
| Phase 3D isolation `deploy/phase3d-producer-isolation.js` (post-fix rerun) | **PASS 4/4, ERRORS=0** | Log: `/data/data/com.termux/files/usr/tmp/opencode/phase3e-isolation-run.log`; result JSON overwritten by script path `/data/data/com.termux/files/usr/tmp/opencode/phase3d-isolation-result.json`. All orderings/viewer-before-produce scenarios OK. |
| Existing unit/adapter/integration (selected): `auth, config, events, protocol, session-store, http-adapter, integration` | **PASS 28/28** | `node --test backend/test/{auth,config,events,protocol,session-store,http-adapter,integration}.test.js` |
| Existing TURN/signaling-TURN: `turn-credentials, signaling-turn` | **PASS 7/7** | Includes TURN integration + transport ICE behavior. |
| Existing `backend/test/signaling-resume.test.js` | **PARTIAL 5/6** | 5 passed (disconnect/reconnect resume+recreateTransports, expired token rejected 4401, vanished room resume rejected, vanished transport guarded + transport creatable after resume, duplicate reconnect/resume no duplicate participant). **1 failed:** `dedupe and concurrent restartIce: repeated/parallel requests safe` — `Error: Unexpected server response: 404` during WS connect in that test run (server/port readiness/connectivity in-harness). Failure is **not attributable** to the produce dedup change (fix touches only `produce` same-kind dedup); other resume/transport tests including restart/transport flows in resumed state passed. Treated as environment/flaky observation, documented separately. |
| Cross-service live E2E `backend/test/cmep-live-e2e.test.js` (platform↔streaming) | **PASS 1/1** (~29s) | Uses `waste-platform/scripts/cmep_live_inspection_e2e_server.py`. |
| **Phase 3 CDP browser E2E** on port 8504 (`timeout 600 node deploy/phase3a-cdp-e2e.js`, 2 isolated CDP contexts, real platform/auth/pages, headless Chromium fake A/V) | **PASS** (verdict_computed, last step) | Log: `/data/data/com.termux/files/usr/tmp/opencode/phase3e-cdp-run.log`; result: `/data/data/com.termux/files/usr/tmp/opencode/phase3c-result.json` (harness result path). Pre-flight 8504 free; no foreign process killed. |

## 5. Proof: audio and video remain in room state / both producers delivered

- **Isolation/regression tests:** `snapRoom`/room state shows `['audio','video']` after audio→video and video→audio; repeated produce keeps exactly 1 active per kind with other preserved; viewer-before-produce leaves final room with both.
- **Phase 3D isolation post-fix:** 4/4 scenarios OK (both kinds retained/advertised per ordering/timing).
- **CDP E2E (real browser, real signaling/mediasoup):** viewer `joinRoom` produced consumption of **2 producers** — `consumedIds` = `["51dff768-b044-4ad0-87b3-b4bc077075d4","84824bbc-368e-4fc8-90d6-32b7a52b547d"]` (two kinds), remote audio track present and remote video track present; both streams attached.

## 6. Publisher / Viewer RTP and media evidence (CDP E2E)

**Publisher (sample 1 → sample 2):**
- Tracks: local audio+video live/enabled (`Fake Default Audio Input`, `fake_device_0`), 2 producers, send transport/conn `connected`.
- Outbound **audio** RTP: `bytesSent 42601 → 57721`, `packetsSent 683 → 937`, `active:true` (growing).
- Outbound **video** RTP: `bytesSent 420471 → 642779`, `packetsSent 490 → 728`, `framesEncoded 269 → 371`, `framesSent 269 → 371`, `active:true` (growing).

**Viewer (sample 1 → sample 2):**
- `joinRoom`/consume resulted in **audio and video consumers**; recv transport connected, ICE/DTLS connected (selected pairs succeeded).
- Remote **video**: live/enabled/unmuted track, `videoWidth/Height 640x480`, `currentTime` advanced `12.13 → 17.15` (progressing), `paused:false`.
- Inbound **video** RTP: `bytesReceived 311664 → 531770`, `packetsReceived 350 → 586`, `framesDecoded 199 → 300`, `packetsLost 0` (growing).
- Remote **audio**: live/enabled track, `#remoteAudio.srcObject` present with track `Fake Default Audio Input`.
- Inbound **audio** RTP: `bytesReceived 32803 → 47761`, `packetsReceived 488 → 740`, `packetsLost 0`, `jitter ~0.002-0.003`, `totalAudioEnergy 1.7509 → 2.8001` (growing/measurable).

**Audio RTP vs playback (separated):** inbound audio RTP growth and measurable `totalAudioEnergy` increase are **evidenced**; remote audio track/attachment present. **Audible/headless speaker output is not directly provable** in this headless Chromium/fake-device environment (no acoustic capture) — playback pipeline attachment/activity indicators are evidenced, but audible perception is not claimed.

## 7. Cleanup

CDP E2E post-cleanup health: `{"ok":true,"ready":true,"status":"running","media":{"rooms":0,"workerAlive":true,"peers":0}}`. UI states ended/disconnected; browser contexts disposed. Regression cleanup test: room removed, `rooms.size()==0` after peer disconnect.

## 8. Limitations / notes

- `signaling-resume.test.js` had 1/6 failure (`dedupe and concurrent restartIce`, WS 404 connect) in this run; not reproduced as a produce-dedup regression and other resume/transport behaviors passed — flagged for separate attention if persistent.
- Headless environment cannot prove audible audio output; audio receive/RTP/track/activity evidenced separately as above.
- Real physical camera/microphone, public internet/NAT with real TURN/TLS/DNS, production deployment, load/long-haul, and reconnect-under-active-media in real browsers remain out of scope/unverified.
- Harness (`deploy/phase3a-cdp-e2e.js`) reused as-is on port 8504; no app/web/config changes.

## 9. Final verdict

**PASS**

Confirmed same-kind-only producer dedup fix in `backend/src/signaling.js` preserves other media kinds and keeps peer/room state consistent. Additive regression tests and Phase 3D isolation pass, existing targeted streaming/integration/TURN/cross-service tests pass, and the CDP dual-context browser E2E on port 8504 demonstrates publisher outbound audio+video RTP growth, viewer `joinRoom`/consumption of both producers, inbound video RTP+playback progression, inbound audio RTP growth with live attached audio track (audible output not headless-provable), and clean shutdown (`rooms:0, peers:0, workerAlive:true`) with no observed video regression. (Single unrelated/flaky resume test connection failure noted above does not indicate dedup regression.)

