# CMEP Live Inspections — end-to-end integration

Live 1:1 inspection (publisher ↔ viewer) between the **CMEP platform**
(FastAPI, `waste-platform`) and the **CMEP Streaming** service (Node.js +
mediasoup). The user never types a token, an offer id, a company id or a room
id: the platform issues the access and the streaming URL carries it.

Status (2026-11-11): implemented end-to-end, verified by a cross-service E2E
test (`backend/test/cmep-live-e2e.test.js`) that boots both services for real.

## 1. Architecture

```
CMEP platform (FastAPI)                         CMEP Streaming (Node.js)
┌────────────────────────────────┐              ┌──────────────────────────────────┐
│ UI: chat / listing / /obhliadka │              │ web/publish.html  (publisher)     │
│   POST /api/v1/inspections      │  1 mint      │   ?token=…&offer=<inspectionId>   │
│   POST /api/v1/inspections/join │─────────────►│ web/viewer.html   (viewer)        │
│   GET  /api/v1/inspections/{id} │              │      │                          │
│   GET  /api/v1/inspections/     │              │      ▼ WS /ws?token=…            │
│        {id}/verify   (internal) │◄─────────────┤ signaling.js (rooms, 1:1 gate)   │
│   POST /api/v1/inspections/     │   3 verify   │   HttpAdapter ──► verify /events  │
│        events        (internal) │─────────────►│                                  │
│   POST /internal/inspections/   │  4 close     │   executor (dry-run, guarded)     │
│        {id}/end  ──────────────►│──────────────┤   mediasoup worker/router        │
└────────────────────────────────┘              └──────────────────────────────────┘
```

- The platform owns **identity, tenancy and the inspection record**; the
  streaming service owns **media** only.
- The streaming service has no database and no user model — it never decides
  who may act; it asks the platform.

## 2. Identifier contract

| Identifier | Owner | Meaning |
|---|---|---|
| `listing.id` | platform | the offer the inspection is about |
| `inspection.id` | platform | one inspection session; **≡ `offerId`** in the streaming protocol and in the token |
| `room.id` | streaming | the mediasoup room; stored on the inspection once `createRoom` happens |
| `companyId` | platform | tenant of the participant; comes from `company_memberships`, never from the client |

Token claims (HMAC-SHA256, `base64url(payload).base64url(signature)` — the
same format as `backend/src/auth.js`):

```
sub        user uuid (identity, never client supplied)
companyId  tenant of the participant
insp       inspection id  (binds the token to one inspection)
offerId    inspection id  (== room.offerId; the offer is in listingId)
listingId  the offer/listing the inspection belongs to
role       publisher | viewer
rec        1 only with an explicit recording consent
iat, exp   seconds since epoch
```

## 3. Flow

1. **Publisher** clicks *Start live inspection* in the CMEP chat/listing.
   `POST /api/v1/inspections {listingId}` → the platform verifies the caller
   is a member of the listing's company, creates the inspection row and
   returns `{inspection, publishUrl}` — the URL contains the streaming token
   and `offer=<inspectionId>`; the streaming page prefills both.
2. The publisher page calls `createRoom {offerId}`. The streaming service
   verifies the token signature, binds the room to `claims.insp` and asks the
   platform (`GET …/verify`) before allowing it. On success the platform
   receives `inspection_requested` and stores `room_id` on the inspection.
3. **Viewer** clicks *Join inspection* in the chat.
   `POST /api/v1/inspections/join` → the platform checks that the caller is
   the counterpart of the chat thread on that listing, assigns the viewer,
   waits (max 15 s) for `room_id` and returns `viewerUrl` with the token and
   the room id.
4. Viewer page connects and requests the inspection; the publisher accepts it
   in the streaming UI (security gate, one click). The room becomes `live`.
5. **End**: the publisher leaves/closes the room, or the owner ends the
   inspection in CMEP → the platform calls
   `POST /internal/inspections/{id}/end` on the streaming service → the room
   closes and both sides see `roomClosed`. Afterwards `verify` returns
   `ok:false, reason:"inspection_ended"` — fail-closed.
6. All session events (`inspection_requested/accepted/rejected/started`,
   `participant_joined/left`, `connection_failed`, `inspection_ended`) are
   forwarded to the platform (`POST /api/v1/inspections/events`) as
   **metadata only** and are stored idempotently (`eventUid`).

## 4. Configuration

Streaming (`cmep-streaming/.env`):

```
CMEP_ADAPTER=http
CMEP_PLATFORM_URL=http://127.0.0.1:8001
CMEP_INTERNAL_API_KEY=<same value as on the platform>
SESSION_SIGNING_SECRET=<same value as CMEP_STREAMING_SIGNING_SECRET on the platform>
```

Platform (`waste-platform/.env`):

```
CMEP_STREAMING_SIGNING_SECRET=<same value as SESSION_SIGNING_SECRET>
CMEP_INTERNAL_API_KEY=<same value as CMEP_INTERNAL_API_KEY>
CMEP_STREAMING_PUBLIC_URL=https://streaming.example.com   # publisher/viewer URLs
CMEP_STREAMING_INTERNAL_URL=https://streaming.example.com   # optional, defaults to PUBLIC
```

The two secrets are **different by design**: the platform's JWT secret stays
private to the platform, the streaming secret is shared only by the two
services of the integration.

## 5. Security properties

- Server-side authorization on both sides; the client never states who it is.
- Every action is verified against the platform before it is allowed
  (fail-closed on every error path, including an unreachable platform).
- Unknown action types are rejected by the policy.
- External models and hardware actions are disabled by configuration
  (`externe_modely=false`, `hardverove_akcie=false`).
- Recording requires an explicit consent on the platform
  (`consent_to_record`) — without it the token carries `rec=0` and the
  streaming service denies `startRecording`.
- Internal endpoints require `X-CMEP-Internal-Key`; without it they answer
  403 and the integration is effectively disabled.
- The streaming service never stores user data; only the platform does.

## 6. Tests

| Test | Scope |
|---|---|
| `backend/test/http-adapter.test.js` | adapter against a mock platform: fail-closed, retries, idempotency |
| `backend/test/integration.test.js` | real server, real mediasoup worker, ACLs |
| `backend/test/cmep-live-e2e.test.js` | **cross-service**: real platform + real streaming, publisher → viewer → outsider → end → cleanup |
| `tests/unit/test_inspections_*.py` (platform) | service, tokens, HTTP gating |

Run the cross-service test:

```sh
node --test backend/test/cmep-live-e2e.test.js
```

It starts the platform (`scripts/cmep_live_inspection_e2e_server.py` in
`waste-platform`, hermetic SQLite, random port) and the streaming service on
a random port, then exercises the full flow.

## 7. Operational notes

- `/healthz` must be probed **after** the process is up; during the startup
  window the payload contains a placeholder (`media.workerAlive=false`).
  A probe before the mediasoup worker exists no longer kills the process.
- `MAX_ROOMS` (default 10) limits concurrent inspections per process.
- Recordings are off by default; enable only together with a consent flow
  and a retention policy for the `recordings/` directory.
- For production: terminate TLS in front of both services (WSS + HTTPS) and
  configure a TURN server — see `docs/PRODUCTION.md`.
