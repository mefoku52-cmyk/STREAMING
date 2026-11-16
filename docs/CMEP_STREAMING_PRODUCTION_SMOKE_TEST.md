# CMEP Streaming — production smoke test

**Status: NOT RUN.** No production target was available or queried; no production credentials were used. Do not substitute local E2E results for this document.

Authorized production smoke sequence after all release gates and explicit approval:
1. Record target host, revision/image, configuration version and change window.
2. Verify `/healthz` liveness and `/readyz` readiness, TLS certificate, WSS upgrade and adapter private-path reachability.
3. Authenticate using existing CMEP test accounts with owner, authorized viewer and unrelated-tenant identities.
4. Create an inspection; verify short-lived Publisher URL and platform event/room state.
5. Verify authorized Viewer join and denied cross-tenant/unassigned join.
6. Validate audio/video RTP and ICE/DTLS; force TURN relay and record selected candidate pair.
7. End session; verify event persistence, server resource cleanup, monitoring and redacted logs.
8. Verify backup freshness and rollback trigger/owner.

Stop on any authorization, TLS, network, event, cleanup or rollback failure. No production PASS may be declared until captured evidence is attached.
