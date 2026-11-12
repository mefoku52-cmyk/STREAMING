# Security review notes

- Signaling must require authenticated identity; unauthenticated operations denied.
- Enforce per-room ACLs, participant limits, schema validation and rate limits.
- Keep credentials, signing secrets, TLS key material and tokens out of webroot, ZIPs, logs and Git.
- Never expose a generic static server rooted above the web asset directory.
- Bind development services to loopback; expose only through deliberate TLS/network configuration.
- Treat the source sample's fixed stream key as a placeholder and replace it with per-session authorization.
- Confirm process cleanup and room isolation under disconnects and crashes.
