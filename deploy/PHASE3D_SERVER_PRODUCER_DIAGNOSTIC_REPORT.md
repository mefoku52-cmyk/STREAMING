# Phase 3D – Server Producer Lifecycle Isolation Diagnostic (CMEP Live Inspections)

Date: 2026-11-16 (Termux/Android)
Repo: `cmep-streaming` HEAD `3a76182741764b215acb88254886b7f44486bf5e` (`main`), workspace includes existing modified/untracked files from prior phases (untouched). **No commit/push/merge/deploy. No application logic changes. No changes to `web/`, `backend/src/`, configuration, or existing tests. No existing reports/artifacts deleted or overwritten. `.env`, DB, recordings, user data preserved. Port 8504 not used by this phase’s tests (in-process mocked servers on ephemeral ports).**

## Scope & goal
Isolate the precise mechanism by which an **audio producer** can exist and be acknowledged to the publisher, yet be absent from the viewer’s `joinRoom` producer list (Phase 3C: publisher produced+sent audio+video RTP; viewer `joinRoom` returned only the video producer; no audio consumer created). Phase 3D performed **study + isolated reproduction only** (no blind fixes).

## Inputs studied (read-only)
- `backend/src/{signaling.js,protocol.js,adapter/http-adapter.js,session-store.js,media-config.js,index.js,events.js,auth.js}`, related modules; existing `backend/test/*`.
- `deploy/PHASE3B_CDP_E2E_REPORT.md`, `deploy/PHASE3C_AUDIO_DIAGNOSTIC_REPORT.md`, `deploy/phase3a-cdp-e2e.js`.

## Lifecycle map (as implemented, from code)

| Step | Mechanism (evidence in code) |
|---|---|
| Room creation | `createRoom`: authz `adapter.canCreateInspection`, creates `SessionStore` room (`id, ownerId, offerId, state:'pending', participants/producers Maps`), sets peer as publisher participant, emits events. |
| Publisher peer registration | On `createRoom` (and on join/resume paths) peer bound to room/role and added to `room.participants`. |
| Transport | `createWebRtcTransport` creates mediasoup WebRTC transport, stored in `peer.transports` (dir send/recv). |
| Produce (audio/video) | `produce`: requires in-room peer, send transport, kind `audio|video`; viewer video forbidden. **Dedup guard:** for same peer closes/deletes any existing non-closed same-kind producer from `peer.producers` and `room.producers`. Creates mediasoup producer, stores `peer.producers.set(producer.id, producer)` and `room.producers.set(producer.id, {producer, ownerSub, kind})`, wires close-observer cleanup, **notifies every other participant** `newProducer {producerId, kind, from}`, returns `{producerId, kind}`. |
| Room state storage | `room.producers` is the authoritative room-wide Map of all current producers (all kinds/peers) keyed by producer id; `peer.producers` per-peer. |
| `produce` confirmation | RPC success response `{ok:true,data:{producerId,kind}}` sent only after store+notify. |
| Viewer connect/request/accept/join | `requestInspection` (pending room) → owner `acceptInspection` sets `acceptedViewer`, state `accepted`, notifies pending viewer. `joinRoom`: validates state/acceptance/authz/capacity, sets viewer participant, may transition to `live`, emits events, notifies `peerJoined`. **Returns** `producerList = [...room.producers.values()].map(m=>({producerId:m.producer.id, kind:m.kind, from:m.ownerSub}))` with no kind/role filtering. |
| `newProducer` events | Emitted in `produce` to `roomPeersExcept(room, peer.sub)` at produce time (so peers already present receive; late joiners rely on `joinRoom` snapshot). |

**Observation:** no code path in `signaling.js` filters `room.producers` by kind or excludes audio from the `joinRoom` snapshot; dedup removes only an existing producer of the **same kind** for the **same peer**.

## Isolated reproduction tests (diagnostic-only)
- Harness: `deploy/phase3d-producer-isolation.js` (new, separate; clearly diagnostic). Uses **real** `backend/src/signaling.js`, `protocol.js`, `session-store.js` with a **mocked mediasoup** (in-memory worker/router/transports/producers/consumers), HTTP adapter behavior stubbed permissive, in-process WS clients on ephemeral ports. Captures per step: step name, time, peerId, roomId, producerId/kind/transportId, `room.producers` snapshot, and viewer `joinRoom` response producers / `newProducer` events.
- Result artifact: `/data/data/com.termux/files/usr/tmp/opencode/phase3d-isolation-result.json` (log: `phase3d-run.log`).
- Execution: `node deploy/phase3d-producer-isolation.js` → **SCENARIO_OK x4, ERRORS=0**.

### Scenarios & evidence (expected vs actual)

| # | Scenario | Steps & room.producers (id,kinds) | Viewer `joinRoom` `resp.producers` | `viewer.newProducer` events | Result |
|---|---|---|---|---|---|
| 1 | audio+video before viewer (audio, then video; request/accept/join) | after audio: `[audio]`; after video: `[audio,video]`; before/at join: `[audio,video]` | `[audio, video]` (both ids, from `pub1`) | `[]` (correct: both existed before join, delivered via snapshot) | **MATCH expected** |
| 2 | audio before video, viewer joins after (explicit) | after audio `[audio]` → after video `[audio,video]` → join snapshot `[audio,video]` | `[audio, video]` | `[]` | **MATCH expected** |
| 3 | video before audio, viewer joins after | after video `[video]` → after audio `[video,audio]` → join snapshot `[video,audio]` | `[video, audio]` | `[]` | **MATCH expected** |
| 4 | viewer connected (joined, live) before producers created | join before produce: `resp.producers []`, room `[]`; after audio produce: room `[audio]`; after video: room `[audio,video]` | initial `[]` (none existed) | `[{newProducer,audio,from pub1},{newProducer,video,from pub1}]` (both delivered) | **MATCH expected** |

(All producer IDs/kinds/peer/room recorded per step in the JSON result.)

## Comparison with real Phase 3C browser E2E

| Aspect | Phase 3C (real browser, mediasoup, 8504) | Phase 3D isolation (mocked mediasoup, real signaling logic) |
|---|---|---|
| Publisher produce audio+video | Both acknowledged; outbound A/V RTP growing | Both acknowledged; stored in `room.producers` |
| Viewer `joinRoom` producers | **Video only** (audio missing) | **Audio + video** in all pre-produce orderings |
| `newProducer` to viewer | No audio `newProducer` observed | Both kinds delivered (snapshot or events as applicable) |
| Order dependence (A/V) | N/A (only video seen) | None — audio-before-video and video-before-audio equivalent |
| Viewer-before-produce | N/A | Both `newProducer` events received |

**Divergence:** Isolation proves the signaling/room-state/response-assembly logic **does** register, retain, and advertise both audio and video producers under the tested orderings and join timings. Phase 3C shows audio **not** advertised to the viewer in the real browser/mediasoup run. Therefore the Phase 3C symptom **does not reproduce** in isolation of server signaling logic with a mocked media layer.

## Cause assessment (confirmed vs unproven)

| Hypothesis | Assessment | Evidence |
|---|---|---|
| Registration failure / not stored | **Not supported** (isolation) | audio present in `room.producers` immediately after `produce` in all cases |
| Overwrite/loss of room state | **Not supported** (isolation) | both kinds retained through subsequent steps/join |
| Filtering by peer/role/kind in `joinRoom`/notify | **Not supported** (code + isolation) | no kind filter; both kinds returned/emitted |
| Produce ordering (A then V / V then A) | **Not supported** | scenarios 2 & 3 identical-correct outcomes |
| Async ordering within signaling logic (viewer before/after produce) | **Not supported** (isolation) | snapshot and `newProducer` paths both deliver both kinds |
| Precise mechanism in Phase 3C E2E | **UNPROVEN** | not reproduced under mocked mediasoup; real-run divergence persists per Phase 3C but mechanism not isolated here |

**First proven deviation (this phase):** *None within isolated signaling logic* — all isolated scenarios match expected behavior. **First known deviation remains the Phase 3C E2E observation:** `joinRoom` response to viewer omits the publisher’s audio producer despite prior successful audio `produce`/RTP (mechanism **not** localized to the studied signaling state/assembly code by this test).

**Plausible but unproven areas (not a fix claim):** interaction/timing with **real mediasoup** producer lifecycle/ack semantics, cross-process/platform E2E flow specifics (accept/join timing, event ingestion/room binding in real run), or environment-specific behavior — none demonstrated by isolated evidence; requires non-speculative, deeper instrumentation against the real media stack/E2E path (out of scope without risking app changes).

## Changed files (Phase 3D)
- **Added (diagnostic, separate):** `deploy/phase3d-producer-isolation.js`
- **Added (report):** `deploy/PHASE3D_SERVER_PRODUCER_DIAGNOSTIC_REPORT.md`
- **Runtime artifacts (evidence):** `/data/data/com.termux/files/usr/tmp/opencode/phase3d-isolation-result.json`, `/data/data/com.termux/files/usr/tmp/opencode/phase3d-run.log`
- **Unchanged:** `web/`, `backend/src/`, configuration, existing tests, prior reports/artifacts.

## Verdict
**PARTIAL**

- PASS aspects: lifecycle mapped; isolated reproduction tests executed with per-step producer/room/join evidence for all requested orderings; signaling/room/`joinRoom` assembly **not** implicated by isolation (audio+video correctly retained and advertised).
- FAIL to prove: the **precise mechanism** causing audio-producer omission in the real Phase 3C browser E2E (divergence not reproduced in isolation). Cause **not confirmed** — no fix proposed.
