# Acceptance checklist

Legend: [x] verified by executed test, [~] implemented + code-inspected only,
[ ] pending.

## Local foundation
- [x] Install into isolated directory; original `live-prototype` untouched
      (only read-only reuse of worker binary + mediasoup-client bundle, both
      documented).
- [x] Unit tests pass — 13/13 (auth, session-store, events).
- [x] Integration test passes — boots real server (random port, real
      mediasoup worker): healthz, static, lock create/release, auth 4401,
      room lifecycle incl. reject/re-request/accept, direction-metadata
      ACLs, graceful SIGTERM exit 0.
- [x] Web/static served from `web/` only, loopback default, traversal guard.
- [x] Health endpoint reports readiness; secrets redacted in logs.
- [~] npm run check — replaced by `node --check` on all sources + bash -n on
      all scripts (all pass); no package.json check script wired.

## Media and behavior
- [~] Camera/mic consent + preview implemented in publish.html (needs browser
      verification on target Android).
- [~] Publisher room + audio/video produce implemented (protocol verified by
      integration test; real RTP flow pending browser test).
- [~] Viewer consume of both tracks implemented; viewer video produce blocked
      server-side (`viewer_video_forbidden`, verified).
- [~] Disconnect/stop/worker-failure cleanup implemented (SIGTERM path
      verified; worker-kill path code-inspected only).
- [ ] 10-minute and 30-minute sessions; ≥20 connect/stop cycles.
- [ ] ffprobe A/V validity and sync check on recordings.
- [ ] Multi-room isolation with concurrent sessions.

## Security and production gates
- [x] Identity and offer-level authorization server-side (deny-by-default
      adapter; direction metadata enforced; 4401 before any frame).
- [x] Rate limits (30/5 s, close after 2 violations), 64 KiB frame cap,
      runtime lock with PID+cwd ownership check.
- [x] Automated browser end-to-end (scripts/browser-test.sh): 22/22 PASS,
      repeatable; both audio directions proven by playback-time advance and
      FFmpeg RTP recording (ffprobe packet counts, h264+aac).
- [ ] TLS termination + ICE reachability in target environment.
- [ ] Audit retention, privacy policy for recordings, backups, observability,
      rollback and incident owner (see docs/PRODUCTION.md).
- [ ] Secrets outside source + rotation procedure.

Do not mark unchecked items passed based only on code inspection.

## Browser test evidence (automated, 2026-11-10)
- 2 isolated Chromium contexts (headless, fake media, auto-grant) via CDP.
- Flow: preview → createRoom (2 live producers) → requestInspection →
  inspectionRequested push at publisher → acceptInspection → viewer join +
  consume (video+audio) → recorder start → stop.
- Owner→viewer: `#remote.currentTime` +8.88 s→+11.40 s over 2.5 s sample;
  audio element also advancing.
- Viewer→owner: viewer mic produce → `newProducer` push → publisher consume →
  publisher `remoteAudio.currentTime` 2.14 s → 3.66 s.
- Recorder: FLV grew 0 B → 262144 B during 3 s window; `ffprobe -count_packets`
  reported ~770 real audio packets (h264+aac).
- Cleanup: rooms=0, peers=0, workerAlive=true after both contexts + helper WS
  closed.
- Fixes this step surfaced (all minimal, evidence-based): viewer client catch
  now matches `inspection_not_accepted`; `publish.html` was missing the
  `#remoteAudio` element (consumeFrom would throw); `index.js` did not await
  the async `createRecorder`; recorder hardcoded VP8 while producers negotiate
  H264 (now uses the producer's actual codec; `sprop-parameter-sets` stripped
  from SDP fmtp).
