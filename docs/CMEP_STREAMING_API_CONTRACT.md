# CMEP Streaming — API contract (source-level)

## Platform inspection endpoints
The inspection router prefix in source is `/inspections`; the top-level runtime prefix is not confirmed by this document. Repository docs report `/api/v1`, which must be verified against the actual deployment/OpenAPI.

| Method | Route | Auth / purpose |
|---|---|---|
| POST | `/inspections` | CMEP JWT; create for listing, return inspection and publisher URL |
| GET | `/inspections?listingId=...` | CMEP JWT; active state and caller capabilities |
| POST | `/inspections/join` | CMEP JWT; authorize counterpart and return Viewer URL |
| GET | `/inspections/{id}` | CMEP JWT; participant-visible inspection |
| POST | `/inspections/{id}/publisher-link` | CMEP JWT; owner reissue |
| POST | `/inspections/{id}/recording-consent` | CMEP JWT; owner consent update |
| POST | `/inspections/{id}/end` | CMEP JWT; platform end and best-effort stream close |
| GET | `/inspections/{id}/verify` | Internal key; verify streaming token claims/participant |
| POST | `/inspections/events` | Internal key; ingest event UID/type/actor/room/role |

## Streaming WebSocket
WebSocket upgrade path is `/ws`. RPC methods include room lifecycle, transport create/connect, produce/consume and `resumeConsumer`. Authentication token is sent to Streaming; users do not create separate Streaming accounts. `resumeConsumer` exists but reconnecting a lost session/transport is not established.

## Contract caveats
- Platform URL builders and Streaming token verification must be verified together in staging.
- Platform token role `publisher` and some event-side `owner` naming need explicit reconciliation.
- End and event delivery can be best-effort; retries/reconciliation semantics must be agreed.
- Production API prefix and live availability are **unverified**.
