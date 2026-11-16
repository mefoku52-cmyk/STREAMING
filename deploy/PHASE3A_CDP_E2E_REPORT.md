# Phase 3A – CDP Browser E2E Report (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repos: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), `waste-platform` (workspace with existing Phase 2 changes). **No commit/push/deploy. No production/GitHub/Render/DB/env/recordings/user-data changes. No functional application source modified.**

## Scope
Attempt real browser **publisher → viewer WebRTC audio/video** transfer in existing Termux environment using **Chromium CDP** (Playwright on Android unusable/unsupported). Harness and report kept separate from production implementation. No re-run of already-passed test suites.

## Pre-execution examination (read-only)
- `web/publish.{html,js}`, `web/viewer.{html,js}`, `web/rpc.js`: UI uses query params (`token`,`offer`/`room`,`auto=1`) to auto-start/connect; publisher does `getUserMedia`/preview+start → `createRoom`/`resumeSession` → creates send transport + produces A/V; viewer `requestInspection` → waits for `inspectionAccepted` then `joinRoom`/`resumeSession` and consumes. Publisher must **accept** (`acceptInspection`) on `inspectionRequested` event. **Signaling WS URL is hardcoded**: `let wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':8504/ws';` in both pages (ignores actual server port). `rpc.js` wraps WS RPC; `mediasoup-client` vendored at `web/vendor/mediasoup-client.min.js`.
- `backend/src/{index.js,http.js,signaling.js,config.js}` + adapter/auth/turn: HTTP+WS on configured port, `/ws` signaling, token auth via query `token`, `CMEP_ADAPTER=http` verifies with platform; mediasoup worker/router/transports/producers/consumers; `restartIce`/`resumeSession` supported.
- `backend/test/cmep-live-e2e.test.js` + `waste-platform/scripts/cmep_live_inspection_e2e_server.py`: cross-service flow (platform seed+mints JWTs, create inspection → publish token/offer, start streaming, publisher `createRoom` via WS, viewer `join` via platform API then WS `requestInspection`/`acceptInspection`/`joinRoom`, end/cleanup, health `rooms==0 peers==0`). Confirmed control-plane contract to mirror.
- Phase 3 probes: headless Chromium 156.0.8078.79 with fake media and CDP control feasible; `cmep-streaming/backend/node_modules/ws` available for CDP/WS scripting.

## Harness
- **Script:** `deploy/phase3a-cdp-e2e.js` (Node, executable) — test-only, additive.
- **Dependencies:** Node built-ins + `../backend/node_modules/ws`; system `chromium-browser`; `waste-platform/.venv/bin/python` + `scripts/cmep_live_inspection_e2e_server.py`. No new deps installed.
- **Flow implemented:** allocate free ports → start platform runner (unique token DB/file via `E2E_*` env, matching e2e test) → create inspection via platform API (`POST /api/v1/inspections`, owner JWT) to obtain real `publishUrl`/token/`offer` → start streaming server (`backend/src/index.js`, `CMEP_ADAPTER=http`, matching secrets/keys) → launch Chromium headless (`--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --use-fake-ui-for-media-stream --use-fake-device-for-media-stream --autoplay-policy=no-user-gesture-required --remote-debugging-port --remote-allow-origins=*`) → connect CDP Browser WS (`/json/version`) → create **two isolated browser contexts** via `Target.createBrowserContext(disposeOnDetach)` + `Target.createTarget` + `Target.attachToTarget(flatten)` → inject `Page.addScriptToEvaluateOnNewDocument` hook (attempt to rewrite hardcoded WS `:8504` to dynamic streaming port, record WS URLs/closes, capture `RTCPeerConnection`/mediasoup transport internals for stats) → navigate real pages `publish.html?token&offer&auto=1` and `viewer.html?token&room&auto=1` (viewer URL/token/room obtained via platform `POST /api/v1/inspections/join`) → auto-accept on `inspectionRequested` → wait for live/remote stream → sample `Runtime.evaluate` (awaitPromise) twice (~5s apart) for tracks/producers/DOM video state/inbound+outbound RTP/ICE-DTLS stats → UI stop clicks + context dispose; SIGTERM/KILL cleanup of Chromium and servers in `finally`. Timeouts/diagnostics throughout. Results persisted to `/data/data/com.termux/files/usr/tmp/opencode/phase3a-result.json` per run.
- **Execution:** `timeout 420 node deploy/phase3a-cdp-e2e.js` (from `cmep-streaming/`).

## Browser contexts
| Role | Isolation | Target page | Auth/flow |
|---|---|---|---|
| Publisher | separate `browserContextId` (CDP) | `http://127.0.0.1:<streamPort>/publish.html?token=<minted>&offer=<inspectionId>&auto=1` | Real platform-minted HMAC token; auto start/create room+produce |
| Viewer | separate `browserContextId` (CDP) | `http://127.0.0.1:<streamPort>/viewer.html?token=<minted>&room=<roomId>&auto=1` | Real platform join/minted viewer token & roomId; request→accept→join/consume |

(Ports/platform base dynamic per run, e.g. streaming 39061, platform 38397, CDP 33767 in final run.)

## Results

### Run 1 (baseline harness, no port rewrite) — `.../phase3a-run.log`
- Platform/inspection/streaming/chrome/contexts: **OK** (tokens minted, inspection created, servers ready, 2 contexts created).
- **Publisher:** `state="Chyba: connection_closed"`, `room=null`, `producers=0`, `stream=true` (local getUserMedia acquired), `send=false`. **Did not create room / produce.**
- Stopped at publisher stage (viewer/join not reached). Verdict **FAIL**.
- **Cause (identified):** pages hardcode signaling WS to port **8504**; harness used dynamic free streaming port → WS connect failure/close. (Application behavior as coded; mismatch is harness-vs-dynamic-port environment, not a proven app defect.)

### Runs 2–3 (harness added injected WS `:8504`→dynamic-port rewrite + diagnostics) — `.../phase3a-run2.log`, `.../phase3a-run3.log`, `phase3a-result.json`
- Platform/inspection/streaming/chrome/contexts: **OK**.
- **Publisher:** entered repeated reconnect loop: `state="Výpadok spojenia. Pokus o obnovenie 8/8 o 10s…"`, `reconnecting=true`, `attempts=8`, `joined=false`, `creating=false`, `room=null`, `producers=0`, `stream=true` (local media obtained), `send=false`, `pcCount=0`.
- **Diagnostics from page:** `wsUrls=[]`, `wsCloses=[]`, `lastErr=null` — injected hook did not record any WebSocket construction/close events, so either the hook’s WS wrapper did not take effect as intended or did not observe the app’s connections. **Exact runtime cause inside headless page not conclusively isolated from available evidence** (CDP console capture not added). 
- **Viewer:** **not exercised** (flow aborted because publisher never created room). No join/accept/consume/remote stream occurred.
- Final `phase3a-result.json`: `verdict:"FAIL"`, `publisherDiag` as above, `errors:[{stage:"fatal", msg:"publisher did not create room; ..."}]`.
- **Classification:** failure to establish publisher signaling/room is **harness-side / harness-environment integration** for dynamic-port execution (client hardcodes `:8504`; attempted runtime rewrite proved ineffective in observed runs). **Not evidence of an application signaling/media bug** under its configured/default port; however, no successful in-browser run completed to exonerate or implicate the app for the tested dynamic-port setup.

## Required evidence (publisher)
| Item | Result |
|---|---|
| Local audio/video tracks | **PARTIAL/observed:** publisher obtained local stream (`stream:true` in probes) but track-level detail not collected in final failed runs; no produce completed. |
| Successful produce audio and video | **NOT ACHIEVED** (`producers:0`, no room/transport). |
| Outbound RTP statistics | **NOT COLLECTED** (no send transport/PC with flow). |

## Required evidence (viewer)
| Item | Result |
|---|---|
| Remote MediaStream / live A/V tracks | **NOT TESTED** (viewer flow not reached). |
| `videoWidth`/`videoHeight` > 0, progressing `currentTime` | **NOT TESTED**. |
| Growing `inbound-rtp` video `bytesReceived`/`framesDecoded` | **NOT TESTED**. |
| Growing `inbound-rtp` audio `bytesReceived`/`packetsReceived` | **NOT TESTED**. |
| ICE and DTLS state | **NOT TESTED**. |

## ICE/DTLS
Not observed (no established peer transports/stats). **NOT TESTED.**

## Cleanup
- Harness invoked UI stop clicks and disposed browser contexts; killed Chromium and platform/streaming processes in `finally` (runs terminated cleanly per logs). Post-run streaming `/healthz` not reliably captured in failed early-abort paths. **Not fully evidenced** as green/idle in final failed run.

## Errors and unverified areas
- **Publisher never created room / no signaling success in harness runs:** run 1 `connection_closed` due to hardcoded client WS port 8504 vs dynamic port (identified). Runs 2–3 reconnect exhaustion with no recorded WS activity (`wsUrls/wsCloses` empty) — **harness instrumentation/adaptation inconclusive**; root cause of non-connection under hook not fully proven (possible injection/timing/wrapper compatibility issue). Separated from app defect: **harness-blocking** for this automated path.
- **No real media transfer proven:** no produce/consume, no RTP stats, no playback progression, no ICE/DTLS evidence.
- **Not exercised:** viewer accept→join→consume path in browser, reconnection/stability under active media, auth edge cases in browser, end/leave cleanup with active peers, physical devices, public internet+TURN/TLS/DNS, multi-browser/load.
- **Browser stats caveats:** not reached; where Chromium omits fields, would have been reported (n/a).

## Changed files
- **Added:** `deploy/phase3a-cdp-e2e.js` (CDP E2E harness, test-only).
- **Added:** `deploy/PHASE3A_CDP_E2E_REPORT.md` (this report).
- **Runtime artifacts (not in repo, for evidence):** `/data/data/com.termux/files/usr/tmp/opencode/phase3a-run.log`, `phase3a-run2.log`, `phase3a-run3.log`, `phase3a-result.json`.
- **Unchanged:** all functional application source, configs, DB/env/recordings, existing tests.

## Conclusion
**VERDICT: FAIL**

Reason: the CDP harness did **not** complete a real publisher→viewer browser WebRTC A/V flow and produced **no** audio/video RTP transfer evidence. Platform+streaming+Chromium boot and isolated CDP contexts were achieved, but publisher signaling/room creation failed (run 1: deterministic port mismatch from client’s hardcoded `:8504`; runs 2–3: reconnect exhaustion with ineffective/unobserved WS rewrite hook — harness-environment integration issue). No simulated PASS claimed; media transfer, inbound/outbound RTP growth, playback metrics, and ICE/DTLS states remain **NOT TESTED/NOT ACHIEVED**.
