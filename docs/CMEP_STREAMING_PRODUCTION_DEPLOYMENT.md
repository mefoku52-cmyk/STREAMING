# CMEP Streaming — production deployment status

## Status: BLOCKED / NOT DEPLOYED

No provider environment was inspected or changed. The repositories do not establish current service ownership, hosting location, public IP, domain, TLS, UDP reachability, TURN, firewall rules, secret-manager values, process supervision, monitoring receiver, backup schedule, or rollback readiness. The checked-in Streaming service is local/Termux-oriented and its HTTP server is plain HTTP; a production TLS/WSS and UDP media path must be designed for the real host.

## Release gates
- Confirm the actual platform/provider topology and a separate mediasoup-capable Streaming host.
- Confirm stable public IP/announced IP, firewall and configured RTC port range; validate UDP from target networks.
- Configure production TLS/WSS and TURN/STUN credentials in a secret manager. Keep secrets out of files, shell history, logs and Git.
- Use `CMEP_ADAPTER=http` with matching platform URL/internal key/signing secret; reject local/demo adapter mode.
- Verify migration status with database owners; backup, restore test and schema compatibility before release.
- Complete authorized staging audio/video, TURN relay, mobile/desktop, cleanup, monitoring and rollback acceptance.
- Obtain explicit release approval. Production rollout and smoke test have not been executed.

Never treat local tests, repository docs, or deployment scripts as proof of a live service.
