# Production readiness gap analysis

What exists today is a hardened development system. This list is the delta to
a deployable production service, split into hard blockers and recommended
work.

## Blockers

1. **TLS.** No HTTPS/WSS. Browsers only grant getUserMedia in secure contexts.
   Terminate TLS in a reverse proxy (Caddy/nginx) or Node itself; forward to
   8504; set forwarded headers if any logic starts using them.
2. **CMEP adapter (`http` mode) — IMPLEMENTED (2026-11-11).** `HttpAdapter`
   verifies platform-minted tokens and asks the platform (`verify`) before
   every action (fail-closed). Production still requires: a dedicated
   `CMEP_STREAMING_SIGNING_SECRET` shared only between the two services, a
   `CMEP_INTERNAL_API_KEY` for the internal endpoints, and TLS in front of
   the platform API. See docs/LIVE_INSPECTIONS.md and
   docs/CMEP_ADAPTER_CONTRACT.md. `LocalDevAdapter` remains for offline
   development only.
3. **Secrets.** `SESSION_SIGNING_SECRET` currently comes from `.env`. In
   production: inject via secret manager/systemd environment, rotate, never in
   the repo. Logger already redacts `*secret*` keys.
4. **TURN.** No TURN server. Works on LAN; mobile networks/NAT64 will fail
   without coturn (or a hosted TURN). Add `RTC_ANNOUNCED_IP` planning per site.
5. **Process supervision.** start.sh is a foreground dev runner. Use systemd
   (or tmux+monitor in Termux) with restart policy, and keep
   runtime/server.lock as the single-instance guard.

## Recommended

- **Observability:** export the structured logs (JSON lines) to a collector;
  add per-room duration/bitrate counters to /healthz or /metrics.
- **Limits:** `MAX_ROOMS=10` is a global cap — make it per-company when the
  adapter supplies tenancy; consider per-IP WS connection limits.
- **Recording:** validate 10/30-minute recordings with ffprobe (Gate C plan:
  20 connect/stop cycles, A/V sync check) before enabling by default; ensure
  recordings storage has retention + deletion policy (privacy).
- **Upgrades:** pin mediasoup version; worker binary is currently copied from
  live-prototype via scripts/provision-worker.sh — in production, build or
  vendor the binary for the target arch and verify its checksum.
- **Origin policy:** restrict CORS/static serving to the deployment origin;
  add basic security headers to http.js responses.
- **Backups/rollback:** recordings dir and runtime state are the only durable
  data; define backup and rollback runbook + incident owner (per ACCEPTANCE).
