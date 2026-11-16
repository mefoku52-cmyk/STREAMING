# Phase 3C – Audio Consume Forensic Diagnostic Report (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repos: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), `waste-platform` (workspace, existing Phase 2 changes). **No commit/push/deploy. No production/GitHub/Render/DB/env/recordings/user-data changes. No existing tests/logs deleted. No functional application source modified** (`web/`, `backend/src/` unchanged); changes limited to test harness and this report.

## Scope
Forensic diagnosis of why **viewer-side audio** was not proven in Phase 3B (publisher produced/sent audio RTP; video transfer OK) by tracing the real signaling/media/consume chain, collecting server/browser evidence, distinguishing receive vs playback, and re-running the same dual-context browser test on port 8504. Fix only if a concrete application defect was proven (none proven).

## Inputs examined (read-only)
- `deploy/PHASE3B_CDP_E2E_REPORT.md`, `deploy/phase3a-cdp-e2e.js`
- `web/viewer.js`, `web/rpc.js` (and prior-known `web/publish.js` flow)
- `backend/src/signaling.js`, `backend/src/protocol.js`, `backend/src/adapter/http-adapter.js`

## Test execution (diagnostic, repeated on port 8504)
- Harness: `deploy/phase3a-cdp-e2e.js` (Phase 3C instrumentation added, harness-only) — native streaming port **8504** (pre-flight free), dynamic platform/CDP ports, real platform runner/auth/minted tokens, unchanged `publish.html`/`viewer.html`, **two isolated CDP browser contexts** (fake A/V, Chromium 156 headless), non-invasive in-page hooks for WS lifecycle, `RTCPeerConnection`/mediasoup transport+consumer observation, and RPC/event tracing (no WS URL rewrite, no app changes).
- Command: `timeout 600 node deploy/phase3a-cdp-e2e.js`
- Artifacts: `/data/data/com.termux/files/usr/tmp/opencode/phase3c-run.log`, `/data/data/com.termux/files/usr/tmp/opencode/phase3c-result.json`
- Verdict (run): **PARTIAL** (last step `verdict_computed`).

## Baseline (Phase 3B, unchanged app) — reproduced
- Publisher audio+video producers created; publisher outbound **audio and video RTP grew**; ICE/DTLS connected.
- Viewer received/decoded/displayed **video** (live track, dimensions/currentTime progressed, inbound video RTP grew).
- Viewer **audio not evidenced**: `remoteAudio.srcObject` empty, no remote audio track, no inbound audio RTP stats.

## End-to-end audio trace (evidence, Phase 3C run)

### 1) Publisher → signaling → mediasoup producer (AUDIO & VIDEO)
| Step | Audio | Video | Evidence |
|---|---|---|---|
| Local capture (fake devices) | live, enabled `Fake Default Audio Input` | live, enabled `fake_device_0` | publisher diagnostics: 2 live tracks |
| `produce` RPC (send transport `16323960…`, connected) | **OK** `producerId d2b33cf9-0901-4729-b002-91585c12c31c` (kind audio) | **OK** `producerId 0a253432-0d59-4b51-8f65-9ecbbdd012d7` (kind video) | publisher RPC trace: `rpc_res produce` for both kinds |
| Publisher producer objects | id `d2b33cf9…`, kind audio, `closed:false, paused:false, track:true` | id `0a253432…`, kind video, `closed:false, paused:false, track:true` | publisher globals/diagnostics |
| Publisher outbound RTP (grows) | **32981→48271/39259→54269 B**, packets increasing, active | **320738→537768/407135→626716 B**, framesEncoded/sent increasing | samples & diagnostics (ICE/DTLS connected, selected pair succeeded) |

**Conclusion:** Audio produce **succeeded** on publisher side and server acknowledged it; publisher sent audio RTP continuously. Audio `produce()` ≠ audio `consume()` (confirmed distinction).

### 2) Viewer signaling / advertisement of producers (FIRST DIVERGENCE)
Viewer timeline (RPC/event trace, same room `27a4e28d…`):
1. WS open to `ws://127.0.0.1:8504/ws?token=…` (event `ready`).
2. `joinRoom` → error `inspection_not_accepted` (pre-accept).
3. `requestInspection` → OK (`state: pending`).
4. event `inspectionAccepted`.
5. `joinRoom` → **response:** `state:"live", role:"viewer", producers:[{"producerId":"0a253432-0d59-4b51-8f65-9ecbbdd012d7","kind":"video","from":"45c0e823…" }]` (**audio producer absent**).

Subsequent viewer trace: `getRouterRtpCapabilities` → `createWebRtcTransport(recv)` → `consume` request **only** for video producer `0a253432…` → `consume` response (video) → (resume implied by live flow). **No** `newProducer` event for audio received at any time; **no** consume request for audio producer `d2b33cf9…`; `consumedIds` = `["0a253432…"]` only.

**Comparison audio vs video:** video producer was advertised in `joinRoom` producers list and consumed; **audio producer was not advertised** (not in join list, no `newProducer` event observed) despite having been successfully produced earlier by the publisher.

### 3) Server → viewer consumer / mediasoup-client / track / element
| Item | Audio | Video |
|---|---|---|
| Info about producer delivered to viewer | **NO (not observed)** | **YES** (join list) |
| `consume` request from viewer | **NO** | **YES** (producer `0a253432…`) |
| Server/mediasoup consumer created & resumed | **Not created (no request)** | **YES** — consumer `1b526ff9…`, kind video, producerId matches, `paused:false, closed:false`, recv transport `0a1cca4e…` connected |
| Remote track on recv transport | **none** | live/enabled video track `remote video` |
| Attachment to element | **n/a** | `#remote.srcObject` set, playing (480x360→640x480, `currentTime` advancing) |
| Inbound RTP (viewer, grows) | **none observed** (`inbound.audio:null`, no audio track) | **bytesReceived 215860→430384, framesDecoded 150→251, packetsLost 0** |
| `#remoteAudio` | `srcObject:false, tracks:null, paused:true, currentTime 0` | n/a |
| `getStats` | no inbound-audio RTP entry; no audio receiver/track delivering | inbound-rtp video present; recv PC ICE/DTLS connected, selected pair succeeded |

### 4) Browser/runtime diagnostics
- **Exceptions:** 0 (publisher/viewer). **Console:** 0.
- **CDP WebSocket network events:** publisher 24, viewer 23 (WS open/frames/close observed; no signaling error surfaced).
- **WS lifecycle (in-page):** open on 8504 for both peers; signaling flow reached live state.
- **PeerConnections:** recv/send handlers connected/stable; only video inbound flow evidenced on viewer.

## Causal analysis (evidence-bounded)

### Determined facts
- **A (audio consumer never created on viewer path): YES, as a consequence** — viewer never issued an audio `consume` request and held only a video consumer.
- **Upstream reason for (A): viewer was never informed of the audio producer.** The `joinRoom` producers list contained only the video producer and no `newProducer` event for audio was observed; publisher, however, had a server-acknowledged live audio producer (and was sending audio RTP) before/during the session.

### First divergence point (audio vs video)
**Divergence at:** *signaling advertisement of the existing audio producer to the joining/connected viewer* (server→viewer producer visibility). Video: advertised (`joinRoom` list) → consumed → received/decoded/rendered. Audio: produced/ack’d/sending at publisher, but **not advertised** to viewer → no consume → no consumer/track/inbound RTP/playback.

### Cause classification (per requested A–F)
- **A. Audio consumer not created:** **Supported (downstream fact).**
- **B. Consumer created but non-functional:** **Ruled out** (no audio consumer existed).
- **C. Track received but frontend mis-attached:** **Ruled out** (no audio track/stream delivered to elements).
- **D. RTP received but playback blocked:** **Ruled out as primary** (no inbound audio RTP/track evidenced).
- **E. Harness/stat collection issue:** **Not indicated** as root cause (RPC/event tracing, consumer/transport inspection, element/track enumeration, and `getStats` all consistently show absence of audio advertisement/consume; video path fully observed through same instrumentation). Instrumentation timing cannot be proven perfect, but no counter-evidence of a missed audio `newProducer`/consume appeared.
- **F. Root cause unknown beyond last proven step:** **PARTIALLY APPLIES (upstream).** **Exact server-side reason** the acknowledged audio producer was absent from the `joinRoom` producers list / not delivered as `newProducer` to the viewer is **not conclusively isolated** from available black-box evidence without modifying server internals. Possible areas consistent with code paths (unproven): producer registration/retention vs join snapshot timing/state in `signaling.js` around `produce`/`joinRoom`/notification; however, publisher produce completed and video (same flow) was advertised correctly.

**Stated boundary:** Proven chain breaks at “viewer receives information about audio producer” (not received). The precise defect/mechanism inside the server causing that omission is **not proven** by this run.

## Fix assessment
- **Concrete, proven application defect:** **No** (mechanism of missing audio advertisement not isolated with certainty).
- **Functional application changes made:** **None** (per constraint; no speculative fix). `web/viewer.js` correctly consumes producers supplied to it and handles audio kind; it was never supplied the audio producer here.
- **Regression risk:** N/A (no app change). Video, signaling, reconnect, authorization, and existing API behavior preserved (video path verified working).

## Before / after comparison
| Aspect | Phase 3B (before) | Phase 3C (after, same app + instrumented harness) |
|---|---|---|
| Publisher outbound audio RTP | Growing (evidenced) | Growing (evidenced) |
| Viewer informed of audio producer | Not evidenced | **Evidenced absent** (join list video-only, no audio `newProducer`) |
| Viewer audio consume/consumer | Not evidenced | **Did not occur** (no request, no consumer) |
| Viewer inbound audio RTP | Not evidenced | **Not received/evidenced** |
| Viewer live audio track / pipeline attached | Not evidenced | **No** (no track/stream) |
| Audio playback activity | Not evidenced | **Not established** (and no receive) |
| Viewer video receive/render | OK | OK (unchanged) |

## Audio receive vs playback (separated)
- **Audio RTP received by viewer:** **NO (not evidenced)** — no inbound-audio RTP/track/consumer.
- **Audio playback (audible pipeline) proven:** **NO** — cannot play what is not received/attached; no measurable playback activity collected.

## Unverified / remaining
- Exact server-internal cause of the missing audio producer advertisement (state/ordering/retention) — **unproven** without deeper server-side instrumentation or a reproducing, isolated unit/integration trace of `room.producers` across produce/join.
- Any audio playback/autoplay behavior beyond RTP receipt (irrelevant until receive/track is established).
- Physical devices (B) and public internet + TURN/TLS/DNS (C) — not tested.
- Reconnect/ICE-restart-under-active-media, load/long-haul, negative browser cases — not exercised.

## Changed files
- **Modified (harness only):** `deploy/phase3a-cdp-e2e.js` (Phase 3C forensic instrumentation: trace/consumer/PC/media/WS diagnostics; result path `phase3c-result.json`)
- **Added (report):** `deploy/PHASE3C_AUDIO_DIAGNOSTIC_REPORT.md`
- **Runtime artifacts (evidence):** `/data/data/com.termux/files/usr/tmp/opencode/phase3c-run.log`, `/data/data/com.termux/files/usr/tmp/opencode/phase3c-result.json`
- **Unchanged:** all application source (`web/*`, `backend/src/*`), configs, `.env`, DB, recordings/user data, existing tests.

## Conclusion
**Diagnosis (evidence):** Publisher successfully **produced and transmitted** audio (and video). The viewer **never consumed audio** because it was **never informed of the audio producer**: the post-accept `joinRoom` response listed **only the video producer** and no `newProducer` audio event was observed, while the audio producer (`d2b33cf9…`) existed/was acknowledged on the publisher. Consequently no audio consumer/track/inbound RTP/attachment/playback occurred (video path worked end-to-end). **First divergence:** producer advertisement to viewer (audio missing vs video present). **Category:** aligns with **A (consumer not created, downstream)** with **upstream cause bounded but not conclusively isolated (F at mechanism level)** — no proven app defect to safely patch within constraints.

**Verdict:** **PARTIAL** (video proven; audio receive/playback not proven; root mechanism of missing audio advertisement unconfirmed).
