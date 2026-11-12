# Architecture

## Components

```
Browser (publish.html / viewer.html, vendored mediasoup-client 3.26.0)
   │  HTTPS/HTTP static + WSS/WS on ONE port (default 8504)
   ▼
backend/src/http.js ── static files, /healthz, /ws upgrade
backend/src/signaling.js ── WS protocol, rooms, mediasoup router/transports
backend/src/auth.js ── HMAC session tokens (payload.signature, base64url)
backend/src/session-store.js ── Room records (participants, producers, state)
backend/src/adapter/cmep-adapter.js ── CMEP boundary (local | http, deny-by-default)
backend/src/events.js ── whitelisted analytics events → adapter
backend/src/recorder.js ── optional FFmpeg pipeline (PlainTransport→RTP→FLV)
backend/src/index.js ── wiring, runtime lock, graceful shutdown
```

Single Node process; one mediasoup worker; one router per server (rooms share it);
PlainTransports for the recorder only. No database, no external services in
local mode.

## Session flow (1:1)

1. Owner: `createRoom {offerId}` → auto-joins as publisher, state `pending`.
2. Viewer: `requestInspection {roomId}` → owner gets `inspectionRequested` push,
   room stores `pendingPeer`.
3. Owner: `acceptInspection {roomId, viewer}` (or `rejectInspection`) →
   viewer gets `inspectionAccepted` push, state `accepted`, `acceptedViewer` set.
4. Viewer: `joinRoom {roomId}` → state `live`, `inspection_started` event.
   Join response lists existing producers so late joiners can consume.
5. Owner publishes audio+video; viewer may publish **audio only**
   (`viewer_video_forbidden`).
6. Owner `close {roomId}` or disconnects → `roomClosed` to all,
   `inspection_ended` event, resources destroyed.

Re-accept rule: after the viewer leaves a live room, state returns to
`accepted` for the SAME viewer; a different viewer requires a new
request/accept cycle. Owner leaving closes the room.

## WS protocol

- Connect: `GET /ws?token=<minted>` (or `Authorization: Bearer`). No/invalid
  token → close code 4401 before any frame.
- Frames: requests `{id:int, method, data?}`, replies `{id, ok, data}` or
  `{id, ok:false, error}`, pushes `{event, data}`.
- Methods: `createRoom, joinRoom, leaveRoom, getRouterRtpCapabilities,
  createWebRtcTransport, connectTransport, produce, consume, resumeConsumer,
  requestInspection, acceptInspection, rejectInspection, startRecording,
  stopRecording, close`.
- Push events: `inspectionRequested, inspectionAccepted, inspectionRejected,
  newProducer, peerJoined, peerLeft, roomClosed, recorderState`.
- Limits: 64 KiB/frame, 30 req/5 s per connection, close after 2 violations.

## Transport direction tracking

mediasoup 3.32.2 does not expose `transport.direction`; the server keeps
`peer.transports: Map<id, {transport, direction}>` set at creation
(`send` for producers, `recv` for consumers). `produce` refuses non-send
transports, `consume` picks the recv transport — this was a real bug found by
the integration diagnostic and is now covered by tests.

## Recording (optional)

`ENABLE_RECORDER=1` + `FFMPEG_PATH`. Per media pair: mediasoup PlainTransport
listens on `{Ms}` ports, FFmpeg listens on `{Ff}` ports from the generated SDP;
`transport.connect()` points RTP/RTCP at the FFmpeg ports. A 12-byte RTP
keepalive packet is sent to the FFmpeg ports before `requestKeyFrame()` so the
blocked read() unblocks (Gate C pattern). Output: FLV file per session in
`recordings/`, or pushed to `RTMP_URL` when set. FFmpeg stderr is consumed and
logged (prevents 64 KiB pipe deadlock). All processes are tracked by
ProcessManager and killed on stop.

## CMEP adapter boundary

`local` mode (default): development rules from locally minted tokens,
deny-by-default. `http` mode: `HttpAdapter` — the platform mints the tokens
and answers server-side `verify` requests; every action is authorized by the
platform (fail-closed). The platform can additionally close a room through
the internal endpoint `POST /internal/inspections/{inspectionId}/end`
(`X-CMEP-Internal-Key`). See docs/LIVE_INSPECTIONS.md and
docs/CMEP_ADAPTER_CONTRACT.md.

## Failure handling

- WS close → cleanupPeer: close transports, delete producer registrations,
  participant_left event; owner-left/empty → closeRoom.
- Uncaught exception → log + graceful close (rooms, worker, HTTP, lock).
- SIGINT/SIGTERM → close all rooms (`shutdown`), stop recordings, close worker,
  release runtime/server.lock, exit 0 (verified by integration test).
- Stale lock (crash/SIGKILL) → next start verifies PID ownership
  (cmdline + /proc/PID/cwd) and clears it.
