# CMEP Streaming Engine

Standalone WebRTC live-inspection service for Termux/Node.js, built from the five
audited ZIP packages and hardened during implementation. It does not modify
`live-prototype` or `waste-platform`; both are used read-only as reference.

## What it does

1:1 live video inspections between a publisher (owner of an offer) and a single
viewer, with request/accept gating, server-side authorization, optional FFmpeg
recording, and an adapter boundary for later CMEP (waste-platform) integration.

## Quick start

```sh
cp .env.example .env            # then set SESSION_SIGNING_SECRET
./scripts/check-deps.sh         # node, mediasoup worker binary, ffmpeg (optional)
npm install --ignore-scripts    # mediasoup build fails on Termux; binary is provisioned
./scripts/provision-worker.sh   # copies a prebuilt mediasoup-worker (see script header)
node backend/test/auth.test.js backend/test/session-store.test.js backend/test/events.test.js
node backend/test/integration.test.js          # boots a real server on a random port
./scripts/mint-token.sh owner user-1           # -> publisher URL
./scripts/mint-token.sh viewer user-2          # -> viewer URL
./scripts/start.sh                             # http://127.0.0.1:8504
./scripts/diagnose.sh && ./scripts/stop.sh
```

Open the publisher URL in one browser/tab and the viewer URL in another. The
viewer requests an inspection, the owner accepts, and the live call starts.

## Automated browser test (no manual steps)

`scripts/browser-test.sh` runs the full 1:1 flow headlessly: it launches one
Chromium with two isolated browser contexts (CDP, no Playwright install), fake
media device, auto-granted permissions, mints nothing (uses tokens from
`runtime/tokens/`), and asserts the whole flow step by step:

- publisher: preview → createRoom → 2 live producers
- viewer: prefilled URL → requestInspection → push event at publisher → accept
  → joinRoom → consume video+audio
- recorder (`ENABLE_RECORDER=1`): FLV file grows while RTP flows; `ffprobe`
  counts real audio packets (h264+aac)
- playback: viewer `currentTime` advances (owner→viewer) and the publisher's
  `remoteAudio.currentTime` advances after viewer mic ON (viewer→owner)
- cleanup: rooms=0, peers=0, workerAlive=true, no ffmpeg leftovers

```sh
./scripts/mint-token.sh inspector-owner 3600
./scripts/mint-token.sh inspector-viewer 3600
ENABLE_RECORDER=1 ./scripts/start.sh     # recorder on = objective RTP proof
./scripts/browser-test.sh                # prints PASS/FAIL per step; exit 0 = all pass
```

Tokens are never printed; report JSON lands in `runtime/browser-test-last.json`.

## Layout

```
backend/src/        Node.js service (HTTP+WS on one port, mediasoup, recorder)
backend/test/       unit + black-box integration tests (node:test)
web/                static client (no build step, vendored mediasoup-client)
scripts/            start/stop/diagnose/mint-token/provision-worker/status
docs/               ARCHITECTURE, PORTS, PRODUCTION, ACCEPTANCE, contracts
runtime/            server.lock (PID), logs in logs/
```

## Status

- Automated tests: 14/14 pass (13 unit, 1 integration incl. real mediasoup worker).
- Automated browser end-to-end: 22/22 pass, repeatable (two full runs) —
  both media directions proven via element playback time + FFmpeg recording
  (`ffprobe`: real RTP packets recorded, h264+aac).
- Recording pipeline: verified end-to-end with a real browser session
  (`ENABLE_RECORDER=1`), off by default. Recorder consumes the producer's
  actual negotiated codec (H264 or VP8).

See docs/ARCHITECTURE.md for design, docs/PORTS.md for port allocation, and
docs/PRODUCTION.md for what is still missing before real deployment.

## CMEP platform integration (live inspections)

With `CMEP_ADAPTER=http` the service integrates with the CMEP platform
(waste-platform): the platform mints the session tokens and authorizes every
action, this service handles only the media. Publisher and viewer URLs are
issued by the platform — no manual token/offer/room entry. See
docs/LIVE_INSPECTIONS.md for the architecture, the identifier contract and the
required configuration, and docs/CMEP_ADAPTER_CONTRACT.md for the adapter
contract.

## Produkcia a Render

Priprava pre Render.com a vlastnu domenu je v docs/RENDER_DEPLOY.md,
docs/ARCHITEKTURA.md a docs/ROZHODNUTIA.md. Dockerfile je v backend/Dockerfile.
TURN setup je v docs/TURN_SETUP.md. Runbook je v docs/RUNBOOK.md.
