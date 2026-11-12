# CMEP integration boundary

The adapter is the only place allowed to know about CMEP/waste-platform.
Everything else talks to rooms, transports and tokens. Deny-by-default.

## Current state

- `local` mode: `LocalDevAdapter` — development rules over locally minted
  HMAC tokens (`authenticate` = token claims passthrough,
  `canCreateInspection` = any non-empty sub+offerId, `canJoinInspection` =
  owner or accepted viewer, `canRecord` = owner only).
- `http` mode: `HttpAdapter` (implemented 2026-11-11) — production
  integration with the CMEP platform. The platform mints the session token
  (short-lived HMAC, claims `{sub, companyId, insp, offerId, listingId, role,
  rec, iat, exp}`); this service only **verifies** it and then asks the
  platform for a server-side decision before every action.

  Contract (all calls carry `X-CMEP-Internal-Key`, fail-closed):

  | Adapter op | Platform call | Rule |
  |---|---|---|
  | `authenticate` | — | claims must have `sub`, `role ∈ {publisher, viewer}`, `insp` |
  | `canCreateInspection` | `GET /api/v1/inspections/{insp}/verify?sub=&role=publisher` | `room.offerId` must equal `claims.insp` **and** platform must confirm the publisher |
  | `canJoinInspection` | `GET .../verify?sub=&role=viewer` | `room.offerId` must equal `claims.insp` **and** platform must confirm the viewer |
  | `canRecord` | `GET .../verify?sub=&role=publisher` | publisher + `claims.rec === 1` **and** platform reports `consentToRecord` |
  | `recordSessionEvent` | `POST /api/v1/inspections/events` | metadata only, idempotent per `eventUid` |

  In `http` mode `offerId` ≡ **inspection id** (identical to `room.offerId` and
  to the `offer=` parameter of the publisher URL); the offer (listing) is in
  the separate `listingId` claim.

  Reverse direction (platform → this service), also `X-CMEP-Internal-Key`:
  `POST /internal/inspections/{inspectionId}/end` closes the room whose
  `offerId` matches the inspection id (fail-closed, `503` while starting).

## Required adapter operations

```
authenticate(token)                      -> {sub, companyId, roles} | null
canCreateInspection(user, offerId)       -> boolean
canJoinInspection(user, room)            -> boolean
canRecord(user, room)                    -> boolean
recordSessionEvent(event)                -> durable acknowledgement
getOffer(offerId)                        -> approved offer summary | null
```

Server-side only. Never accept a client-provided company or user id as
identity. Define retention/deletion behavior before recording events or media.

## waste-platform recon (November 2026, read-only audit)

Stack: FastAPI 0.141.1 + Next.js 15/React 19; PostgreSQL (prod) / SQLite
(dev); JWT HS256 Bearer tokens (`sub` = user UUID, `type=access`);
`company_memberships` for tenancy; `listings` table carries `company_id` and
`status`; `chat_threads` already pairs two users per listing — the natural
anchor for inspection sessions; `voice_live_router` issues short-lived
Deepgram tokens (precedent for ephemeral stream credentials);
`activity_events` is a whitelisted analytics table; Stripe-style HMAC
webhooks exist; **no WebSockets anywhere in the platform** (greenfield for
this service).

Implemented wiring (2026-11-11):

| Adapter op | Platform integration |
|---|---|
| `authenticate` | validate platform JWT (shared HS256 secret or JWKS), map `sub` |
| `canCreateInspection` | user has membership in `listings.company_id`, listing status allows inspection |
| `canJoinInspection` | thread counterpart of the listing's owner, mirrored in `chat_threads` |
| `canRecord` | owner only + explicit consent flag to be added to listings |
| `recordSessionEvent` | append to `activity_events` whitelist (event types below) |
| `getOffer` | `GET /listings/{id}` approved summary |

Event mapping: `inspection_requested/accepted/rejected/started`,
`participant_joined/left`, `connection_failed`, `inspection_ended` — all
metadata-only (ids, roles, timestamps; never media content or message bodies).

Transport between platform and this service stays HTTP(S) — the platform has
no WebSocket infrastructure, so the streaming service remains a separate
deployable with its own WSS endpoint and token minting on the platform side.

## Required configuration (http mode)

| Variable (this service) | Purpose |
|---|---|
| `CMEP_ADAPTER=http` | switch the adapter |
| `CMEP_PLATFORM_URL` | base URL of the CMEP platform API |
| `CMEP_INTERNAL_API_KEY` | `X-CMEP-Internal-Key` for verify/events/end |
| `SESSION_SIGNING_SECRET` | **must equal** the platform's `CMEP_STREAMING_SIGNING_SECRET` |
| `CMEP_HTTP_VERIFY` | `0` disables platform verification — local development only |

The platform needs the mirror image: `CMEP_STREAMING_SIGNING_SECRET`,
`CMEP_INTERNAL_API_KEY`, `CMEP_STREAMING_PUBLIC_URL` (publisher/viewer URLs)
and optionally `CMEP_STREAMING_INTERNAL_URL` (internal end endpoint).

Fail-closed guarantees: unknown action types, missing keys, an unreachable
platform, a 5xx answer or `ok:false` all deny the action; a missing/invalid
`CMEP_INTERNAL_API_KEY` on the platform disables the internal endpoints
entirely (403).
