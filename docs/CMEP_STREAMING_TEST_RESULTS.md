# CMEP Streaming — local test results

Environment: sandbox checkout; Node v22.23.4; temporary local services; platform E2E used temporary SQLite. These are not production tests.

- `CMEP_PLATFORM_ROOT=/tmp/cmep-audit/waste-platform CMEP_PLATFORM_PYTHON=/tmp/cmep-audit/waste-platform/.venv/bin/python npm test` (from `STREAMING/backend`): **31 passed, 0 failed, 0 skipped**.
- `npm run check`: **PASS** (Node syntax check and Python module compile).
- `npm audit --audit-level=low`: **0 vulnerabilities** after updating `ws` to 8.23.0.
- `node --test test/integration.test.js`, five separate runs: **5/5 passed**. Each run includes five sequential WebSocket handshake/RPC probes after readiness (25 successful probes total).
- `node --test test/http-readiness.test.js`: verifies liveness 200, readiness 503 while unready, and reproduces premature `/ws` 404 in the unready HTTP-only window.

Scope not tested: public network/RTP, TURN relay, real mobile/desktop browser, production DNS/TLS/WSS, provider, production database/migration, monitoring or deployed smoke tests. See `../deploy/PHASE3F_verify.txt` for exact Phase 3F evidence and limitations.
