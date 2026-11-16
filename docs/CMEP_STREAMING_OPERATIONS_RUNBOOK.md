# CMEP Streaming — operations runbook (initial)

## Health and readiness
- `GET /healthz`: liveness; remains HTTP 200 while service process responds.
- `GET /readyz`: readiness; HTTP 503 until signaling is initialized and mediasoup worker is alive, then 200 with `ready:true`.
- `scripts/status.sh` uses `SIGNALING_PORT` or default 8504 and checks `/readyz` when curl is available.

## Start/stop and incident handling
Use only the approved environment-specific supervisor. The checked-in Termux `scripts/start.sh` is not a production supervisor. Do not print environment files or tokens. On readiness failure, capture redacted logs and service revision; inspect worker, port, WebSocket upgrade, announced IP and TURN from the service owner. A process restart loses in-memory rooms and may interrupt calls.

## Security and evidence
Never log `SESSION_SIGNING_SECRET`, `CMEP_INTERNAL_API_KEY`, HMAC tokens or TURN credentials. Use event IDs and inspection IDs only where permitted. Record incident timestamps, revision and sanitized status; do not expose PII in public logs.

## Gaps
Provider topology, monitoring/alert receiver, backup policy, recording retention, escalation owner and tested recovery are not established. This is not an operational authorization to access production.
