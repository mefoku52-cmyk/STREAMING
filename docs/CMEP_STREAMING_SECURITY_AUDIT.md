# CMEP Streaming — security audit status

This is a source-level audit summary, not a penetration test. No live secrets or production config were inspected. No production systems were queried.

## Existing source controls
- CMEP access identity is derived from JWT-authenticated users and database memberships.
- Platform-issued HMAC stream tokens are short-lived and bind subject/company/inspection/listing/role/recording claims.
- Streaming HTTP adapter fails closed when configured platform verification is unavailable; internal platform calls use a shared key.
- Request protocol has method allowlisting, bounded payloads and rate limiting. Recording is opt-in in Streaming config and platform adapter checks permission/consent.

## Remaining risks / release requirements
- Internal event ingestion trusts actor/role/room fields after shared-key validation; bind them to the inspection participant and room.
- Align `publisher` vs `owner` role vocabulary consistently across token verification, event schema and mapper.
- Restrict internal key network access, rotate it, and verify secrets through secret-manager metadata only.
- Validate consent enforcement on actual recording start and secure recording storage/retention.
- Verify rate limiting, forwarded IP header sanitization, CORS, CSP, cookies, TLS/WSS and redacted logging at the real edge.
- Add adversarial cross-tenant, replay, forged-room/actor, expired-token and consent-denial tests.

**Security gate: FAIL / BLOCKED for production** until deployment configuration and these contract risks are reviewed. This status does not imply an observed production compromise.
