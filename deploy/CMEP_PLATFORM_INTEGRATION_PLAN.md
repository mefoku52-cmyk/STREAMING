# CMEP Platform ↔ Streaming — forenzný integračný prieskum a technický návrh (FÁZA 1, READ-ONLY)

**Dátum:** 2026-11-15  
**Režim:** iba analýza/report (žiadne zmeny zdrojových súborov, migrácií, API, commit/push/deploy, žiadne opakované testy).  
**Projekty:**
- Streaming: `$HOME/cmep-streaming` (git `main`, HEAD `3a76182741764b215acb88254886b7f44486bf5e`, stav podľa `git status`: modifikované `backend/src/{config,http,index,protocol,signaling}.js`, `web/{publish,viewer,rpc}.js`, untracked `backend/src/turn-credentials.js`, `backend/test/{signaling-turn,signaling-resume,turn-credentials}.test.js`, `deploy/*`; zdroj: `git status/diff` vykonané v tejto fáze)
- Platforma: `$HOME/waste-platform` (FastAPI + Next.js monorepo; zdroj: štruktúra `app/`, `apps/web/`, `migrations/`, `docs/`)

## 1) Zistený stav oboch projektov

### 1.1 CMEP platforma (`waste-platform`) — potvrdené

**Technológie/architektúra**
- Backend: FastAPI, async SQLAlchemy, modulárna DDD-ish štruktúra `app/modules/<modul>/{domain,application,infrastructure,presentation}`; agregácia routerov v `app/shared/presentation/api_router.py` (všetky pod `/api/v1` cez `app/main.py:create_app()` → `app.include_router(api_router, prefix="/api/v1")` ak prefix chýba). Zdroj: `app/main.py`, `app/shared/presentation/api_router.py`.
- Frontend: Next.js 15 + React 19 + TypeScript, TanStack Query, feature-based `apps/web/src/features/*`, App Router `apps/web/src/app/*`. Zdroj: `apps/web/package.json`, `apps/web/src/features/inspections/*`, `apps/web/src/app/obhliadka/[id]/page.tsx`.
- DB migrácie: Alembic v `migrations/versions/` (vrátane inspections migrácie). Zdroj: `migrations/versions/insp_2026111101_add_inspections_tables.py`.

**Identita, autentifikácia, autorizácia (existujúce mechanizmy)**
- JWT access/refresh/2FA tokeny vydáva `app/shared/infrastructure/security/jwt_service.py` (`JwtService.issue_access_token/issue_refresh_token/issue_2fa_token`, `decode_and_validate` s kontrolou typu, exp, revokácie jti/family, user revocation cutoff; `HS256`, secret z `settings.jwt.secret_key`). Zdroj: `app/shared/infrastructure/security/jwt_service.py`, `app/core/config.py` (`JWTSettings`, `JWT_SECRET_KEY`, TTL).
- Prihlásenie a kontext: `app/modules/auth/application/services.py` (`LoginService.execute/_issue_tokens`, 2FA gate, `GetCurrentAuthContextService.execute` načíta user + memberships a vracia `role_codes` odvodené z `membership_role` členstiev). HTTP: `app/modules/auth/presentation/router.py` (`POST /api/v1/auth/login`, `/auth/refresh`, `/auth/browser/*`, CSRF/origin ochrana pre browser flow, rate limiting). Zdroj: uvedené súbory.
- Aktuálny používateľ v API: `app/shared/presentation/auth_dependencies.py:require_current_user` (HTTP Bearer → `GetCurrentAuthContextService`). Voliteľná auth: `get_current_user_optional`.
- Platform vs tenant autorizácia centralizovaná: `app/shared/presentation/authorization.py` (`is_platform_admin` podľa `PLATFORM_ADMIN_EMAILS`/rezervovanej role, **nie** z firemného členstva; `membership_company_ids`, `is_company_member/admin`, `require_company_member/admin`; komentár explicitne oddeľuje platform admin od tenant `admin`). Zdroj: `app/shared/presentation/authorization.py`.
- Používatelia: `app/modules/users/infrastructure/models.py` (`UserModel`: id/email/status/names/…, `User2FAModel`). Zdroj: súbor.
- Firmy/členstvá: `app/modules/company_memberships/infrastructure/models.py` (`CompanyMembershipModel`: `company_id`, `user_id`, `membership_role`, `status`, `is_primary_contact`, časové polia; string PK/ID stĺpce). Zdroj: súbor.

**Doménové entity relevantné pre streaming/obhliadky**
- Ponuky: `app/modules/listings/infrastructure/models.py` (`ListingsModel`: `id`, `company_id`, `status`, `title`, lokácia/cena/materiál, …). Zdroj: súbor.
- Chat vlákna/správy: `app/modules/chat/infrastructure/models.py` (`ChatThreadModel`: `listing_id` nullable, `initiator_user_id/company_id`, `recipient_user_id/company_id`, `subject/status/last_message_at`; `ChatMessageModel`). Zdroj: súbor (väzba listing↔konverzácia existuje).

**Integrácia živých obhliadok (už prítomná v platforme — kľúčové zistenie)**
- Modul `app/modules/inspections/` (domain/application/infrastructure/presentation) je implementovaný a zaregistrovaný v API (`api_router.include_router(inspections_router)` v `app/shared/presentation/api_router.py`; router prefix `/inspections` v `app/modules/inspections/presentation/router.py`).
- **DB modely/migrácia:** `inspections` a `inspection_events` (idempotencia `event_uid`, FK na listings/inspections) v `app/modules/inspections/infrastructure/models.py` a `migrations/versions/insp_2026111101_add_inspections_tables.py` (`insp_2026111101`, down_revision `mcp_phase4plus_20261104`). Stavy/typy: `app/modules/inspections/domain/enums.py` (`InspectionState`: created/room_created/requested/accepted/live/ended; `InspectionEventType` whitelist zhodný so streaming events).
- **Aplikačná logika:** `app/modules/inspections/application/services.py` (`InspectionService`: `create_inspection` len člen firmy vlastníka ponuky, zákaz duplicity aktívnej obhliadky na listing; `active_inspection_for_listing` (UI gating canPublish/canJoin), `join_inspection` len counterpart chat threadu na ponuke, priradenie viewera, čakanie na `room_id`, zákaz publisher-as-viewer/konfliktu; `publisher_link`, `get_inspection`, `set_recording_consent`, `end_inspection` s best-effort volaním streamingu; interné `verify_for_streaming` fail-closed a `record_event` idempotentný + aplikácia eventu na entitu).
- **Stavový stroj eventov:** `app/modules/inspections/infrastructure/mappers.py:apply_event_to_entity`.
- **Streamovacie tokeny (platforma mintuje):** `app/modules/inspections/application/streaming_tokens.py` (HMAC-SHA256 base64url formát zhodný s `cmep-streaming/backend/src/auth.js`; claims `sub, companyId, insp, offerId(=insp), listingId, role, rec, iat, exp`; secret `CMEP_STREAMING_SIGNING_SECRET`, TTL default 3600s). Validácia/prod guardy v `app/core/config.py` (neprázdny/ne-placeholder, min dĺžka v non-dev kontexte podľa settings logiky).
- **Platforma → streaming interné volanie:** `app/modules/inspections/infrastructure/streaming_client.py` (`POST {CMEP_STREAMING_INTERNAL_URL|PUBLIC_URL}/internal/inspections/{id}/end`, header `X-CMEP-Internal-Key`, best-effort bool).
- **API kontrakty (presentation):** `app/modules/inspections/presentation/router.py` + `schemas.py` — účastnícke (JWT): `POST /inspections` (201, publishUrl), `GET /inspections?listingId=`, `POST /inspections/join` (viewerUrl+roomId), `GET /inspections/{id}`, `POST /inspections/{id}/publisher-link`, `POST /inspections/{id}/recording-consent`, `POST /inspections/{id}/end`; interné (key): `GET /inspections/{id}/verify`, `POST /inspections/events` (idempotentné).
- **Frontend (existujúce):** `apps/web/src/features/inspections/{api.ts,types.ts,hooks/use-inspections-queries.ts,components/inspection-panel.tsx,components/inspection-page.tsx,index.ts}` a route `apps/web/src/app/obhliadka/[id]/page.tsx`; použitie panelu v `apps/web/src/app/dashboard/listings/[id]/page.tsx` a `apps/web/src/features/chat/components/chat-window.tsx` (grep nález). UI spúšťa/otvára publisher, join viewer, invite link, consent, end bez manuálneho kopírovania ID (podľa `inspection-panel.tsx`).
- **Dokumentácia platformy:** `docs/CMEP_LIVE_INSPECTIONS.md` popisuje rovnaký kontrakt/endpointy/konfiguráciu.
- **Testy (existujúce, neopakované):** `tests/unit/test_inspections_{endpoints,service,tokens}.py`, `scripts/cmep_live_inspection_e2e_server.py` (prítomné v strome; výsledky v tejto fáze neoverované/nespúšťané).

**Notifikácie/chat/ďalšie živé funkcie (kontext)**
- Moduly `notifications` (vrátane telegram/summary routerov), `chat`, `events` sú zaregistrované v `api_router.py`. Konkrétna väzba notifikácií na inspections v preskúmaných súboroch nebola potvrdená (neoverené).

### 1.2 CMEP Streaming (`cmep-streaming`) — potvrdené

**Služba a rozhrania**
- Node.js signaling/HTTP server: `backend/src/index.js` (načíta config, lock, HTTP server, mediasoup router/worker, adapter, recorder, turn service, signaling; `GET /healthz` liveness, `GET /health` readiness payload `{ok,ready,service,status,uptimeS,media}` vrátane `media.workerAlive`; interný handler `POST /internal/inspections/{id}/end` chránený `X-CMEP-Internal-Key` → `signaling.endInspection(inspectionId)`).
- HTTP: `backend/src/http.js` (`createHttpServer` obsluhuje `/health(z)`, interné `/internal/*` callback, statické súbory z `webRoot`).
- Konfigurácia/env: `backend/src/config.js` (host/port 8504 default, `SESSION_SIGNING_SECRET`, RTC dirs/limity/rate, `CMEP_ADAPTER` local/http, `CMEP_PLATFORM_URL`, `CMEP_INTERNAL_API_KEY`, `ENABLE_STATIC_SERVE`, `TURN_*`). Media: `backend/src/media-config.js`, lock: `backend/src/single-instance.js`.

**Autentifikácia a autorizácia v streamingu**
- WS handshake: `backend/src/signaling.js` (`tokenFromRequest` z Bearer/query `token`, `authenticate` callback z `index.js` overí `verifyLocalSessionToken(token, SESSION_SIGNING_SECRET)` a následne `adapter.authenticate(claims)`; neplatné → close `4401`). Zdroj: `backend/src/{index,signaling,auth}.js` (auth modul využívaný, formát kompatibilný s platformou podľa implementácie tokenov).
- Adapter boundary: `backend/src/adapter/cmep-adapter.js` (factory `local|http`), `backend/src/adapter/http-adapter.js` (`HttpAdapter`: vyžaduje `CMEP_PLATFORM_URL`+`CMEP_INTERNAL_API_KEY`; `authenticate` validuje štruktúru claims `sub/role/insp`; `canCreateInspection/canJoinInspection/canRecord` viažu `room.offerId ≡ claims.insp` a potvrdzujú cez platformu `GET /api/v1/inspections/{id}/verify?sub=&role=` s `X-CMEP-Internal-Key` fail-closed; `recordSessionEvent` POST `/api/v1/inspections/events` idempotentne s `eventUid`). Kritické rozhodnutia delegované na platformu pri http mode.
- Lokálny režim: `backend/src/adapter/local-adapter.js` (existuje; správanie v tejto fáze detailne neanalyzované).

**Signaling protokol a miestnosti**
- Protokol: `backend/src/protocol.js` (`METHODS` vrátane `createRoom, joinRoom, leaveRoom, getRouterRtpCapabilities, createWebRtcTransport, connectTransport, produce, consume, resumeConsumer, requestInspection, acceptInspection, rejectInspection, startRecording, stopRecording, close, getIceServers, restartIce, resumeSession`; limit správy 64k).
- Logika: `backend/src/signaling.js` (mediasoup worker/router, `SessionStore`, rate limit, miestnosti/účastníci/transporty/producery/consumery; flow pending→accepted→live; publisher owner, viewer po accept/request; `offerId` viazané na inspection; notifikácie `peerJoined/Left/Disconnected/Rejoined`, `newProducer`, `inspectionRequested/Accepted/Rejected`, `roomClosed`; resumable sloty na abnormal disconnect s grace timeoutom, `resumeSession` s opätovnou autorizáciou cez adapter a recreate-transports semantikou; dedupe producerov/consumerov; cleanup/owner-left/empty pravidlá; nahrávanie cez recorder ak povolené a `canRecord`).
- Stav miestností: `backend/src/session-store.js`. Eventy: `backend/src/events.js`. Nahrávanie: `backend/src/recorder.js` (podmienené `ENABLE_RECORDER` a consent v platform verify/claims).

**TURN/ICE, WebRTC klienti**
- TURN REST: `backend/src/turn-credentials.js` (HMAC-SHA1 Base64, `expiry:userId`, `buildIceServers/createTurnService`), používané v `createWebRtcTransport`/`getIceServers`; `TURN_SECRET` server-side.
- Publisher/viewer web: `web/{publish,viewer}.js` + `web/rpc.js` (RPC klient, reconnect/backoff, resume/transport recreate, konzum `iceServers` zo servera, ICE restart na failed/disconnected, spracovanie room/inspection eventov). Statické stránky `web/{publish,viewer,index}.html`, vendor klient v `web/vendor/`.

**Deployment/prevádzka (repo artefakty)**
- `deploy/{systemd/cmep-streaming.service,caddy/Caddyfile,coturn/turnserver.conf,firewall/ufw-rules.sh,env/.env.production.template,scripts/{deploy,rollback,health-check,check-worker}.sh,turn-credentials/*.sh,README.md}` — release deploy, preflight, readiness, rollback, reverzný proxy, TURN šablóna, firewall, env šablóna (stav/obsah podľa súborov v strome a `deploy/FINAL_IMPLEMENTATION_REPORT.md`).

**Testy (existujúce, neopakované; stav podľa reportu v strome)**
- `backend/test/*.test.js` vrátane `turn-credentials`, `signaling-turn`, `signaling-resume`, `integration`, `http-adapter`, `cmep-live-e2e` atď. `deploy/FINAL_IMPLEMENTATION_REPORT.md` uvádza lokálne PASS skupiny (55 PASS) a **necertifikovaný** `cmep-live-e2e` v danom prostredí (externá závislosť). V tejto fáze testy nespušťané.

## 2) Presné odkazy na kľúčové súbory a funkcie (výber)

| Oblasť | Súbor | Relevantné symboly/miesta |
|---|---|---|
| Platforma app/wiring | `waste-platform/app/main.py` | `create_app`, `lifespan`, CORS, `/health`,`/ready`, include `/api/v1`, router `inspections` cez shared router |
| Platforma API agregácia | `waste-platform/app/shared/presentation/api_router.py` | `api_router.include_router(inspections_router)` a ostatné moduly |
| Platforma config | `waste-platform/app/core/config.py` | `JWT*`, CORS, `CMEP_STREAMING_*`, `CMEP_INTERNAL_API_KEY`, prod validácie |
| Auth/JWT | `waste-platform/app/shared/infrastructure/security/jwt_service.py` | `JwtService.issue_*`, `decode_and_validate`, revokácie |
| Auth flow | `waste-platform/app/modules/auth/{application/services.py,presentation/router.py, presentation/dependencies.py}` | login/refresh/2FA, `require_current_user` kontext |
| Autorizácia | `waste-platform/app/shared/presentation/authorization.py` | platform vs tenant, `membership_company_ids`, `require_company_*` |
| Inspections API | `waste-platform/app/modules/inspections/presentation/{router.py,schemas.py,dependencies.py}` | účastnícke + interné endpointy, `X-CMEP-Internal-Key` |
| Inspections biz logika | `waste-platform/app/modules/inspections/application/{services.py,streaming_tokens.py,dto.py}` | create/join/verify/event/end, mint HMAC tokenov (claims `insp/offerId/listingId/role/rec`) |
| Inspections dáta | `waste-platform/app/modules/inspections/{infrastructure/models.py,infrastructure/repositories.py,infrastructure/mappers.py,domain/{entities.py,enums.py}}` | `inspections`,`inspection_events`, stavový stroj, idempotencia |
| Inspections migrácia | `waste-platform/migrations/versions/insp_2026111101_add_inspections_tables.py` | tabuľky/indexy/constrainty |
| Inspections FE | `waste-platform/apps/web/src/features/inspections/*`, `apps/web/src/app/obhliadka/[id]/page.tsx` | `inspectionsApi`, panel/page, stavy |
| Doména listing/chat/členstvo | `waste-platform/app/modules/{listings,chat,company_memberships,users}/infrastructure/models.py` | `company_id`, `listing_id` vo vláknach, členstvá/role |
| Streaming server | `cmep-streaming/backend/src/{index.js,http.js,config.js,signaling.js,protocol.js,session-store.js,events.js,turn-credentials.js}` | health/ready, WS auth, rooms/RPC, TURN, resume |
| Streaming adapter/auth | `cmep-streaming/backend/src/{auth.js,adapter/cmep-adapter.js,adapter/http-adapter.js,adapter/local-adapter.js}` | verify tokenu, delegácia na platformu verify/events, fail-closed |
| Streaming interný end | `cmep-streaming/backend/src/index.js` | `internalRequestHandler` (`POST /internal/inspections/:id/end`, key check) |
| Streaming web klient | `cmep-streaming/web/{rpc.js,publish.js,viewer.js,*.html}` | WS reconnect/resume, `createWebRtcTransport` + iceServers, ICE restart, UI flow |

## 3) Integračná mapa (požadované body)

1. **Vlastník identity používateľa:** **Platforma (CMEP)** — `users`/JWT a auth kontext (`waste-platform/app/modules/users/*`, `auth/*`, `shared/infrastructure/security/jwt_service.py`, `shared/presentation/auth_dependencies.py`). Streaming neuchováva používateľov/DB; identitu berie z overených claims tokenu a adapter verify (`cmep-streaming/backend/src/index.js`, `signaling.js`, `adapter/http-adapter.js`). **Potvrdené.**
2. **Kto rozhoduje o oprávnení vytvoriť živý prenos:** **Platforma** (člen firmy vlastníka ponuky + stav/duplicita) v `InspectionService.create_inspection` (`.../inspections/application/services.py`); pri http-adapter režime streaming dodatočne vyžaduje server-side potvrdenie cez platform verify pri `createRoom` (`HttpAdapter.canCreateInspection` ↔ `GET /api/v1/inspections/{id}/verify`). **Potvrdené.**
3. **Ako sa vytvorí stream a pridelí vlastník:** Platforma vytvorí záznam `inspections` (owner user/company = listing.company_id člen), vydá publisher stream token (`insp=inspection.id`, `role=publisher`) a `publishUrl` na streaming web (`InspectionService.create_inspection`, `StreamingTokenService.mint`, `_publish_url`); klient otvorí streaming, `createRoom{offerId=inspectionId}`; streaming emituje eventy, platforma cez ingest aktualizuje stav/`room_id` (`backend/src/signaling.js`, `events.js`, platforma `record_event` + `apply_event_to_entity`). **Potvrdené (čiastočne distribuovaný stavový stroj).**
4. **Ako sa divák dostane k streamu:** Platforma overí counterpart chat vlákna na ponuke a priradí viewera (`InspectionService.join_inspection` v `services.py`, kontrola `ChatThreadModel` initiator/recipient na `listing_id`), vydá viewer token + `viewerUrl` (s `roomId` po dostupnosti) cez `POST /api/v1/inspections/join`; viewer ide cez `web/viewer` + signaling `requestInspection/joinRoom` s kontrolami stavu/accepted viewer (`backend/src/signaling.js`, platform verify `role=viewer`). **Potvrdené.**
5. **Prístup firemných používateľov:** Odvodený z `company_memberships` cez platform auth kontext/`authorization.py` a kontrolu `listing.company_id` / `owner_company_id` v inspections službe; streaming dôveruje claims+verify, nie klientskému companyId. **Potvrdené.**
6. **Verejný alebo členský prístup (ak ho CMEP podporuje):** **Neoverené/nenájdené v preskúmanom kontexte** — existujúci flow je viazaný na prihláseného používateľa a buď člena vlastníckej firmy, alebo counterpart chat vlákna (`require_current_user`, `join_inspection` vyžaduje thread). Samostatný verejný/členský režim mimo tohto modelu nebol potvrdený.
7. **Zabezpečenie signalingu a krátkodobých TURN poverení:** Signaling token = platformou mintovaný HMAC (shared secret `CMEP_STREAMING_SIGNING_SECRET` ↔ streaming `SESSION_SIGNING_SECRET`) overený pri WS + adapter checks; interná platform↔streaming komunikácia `X-CMEP-Internal-Key` (`http-adapter.js`, platform `InspectionService._check_internal_key/verify/record_event`, streaming `index.js:internalRequestHandler`); TURN REST krátkodobé creds vydáva streaming server-side (`backend/src/turn-credentials.js`, `TURN_*` v `config.js`, RPC `getIceServers`/v transport params), `TURN_SECRET` len na serveri. **Potvrdené.**
8. **Evidencia streamov, stav a história:** Existuje `inspections` (stav, listing/room/owner/viewer/company/thread, consent, timestamps) a `inspection_events` (idempotentný audit eventov zo streamingu) — modely + migrácia + update cez ingest (`apply_event_to_entity`). História detailov/medií mimo týchto tabuliek **neoverená**. **Potvrdené čiastočne.**
9. **Notifikácie a ukončenie prenosu:** Ukončenie: platform endpoint `POST /inspections/{id}/end` → stav `ENDED` + best-effort `StreamingServiceClient.end_inspection` (`POST /internal/inspections/{id}/end`), a opačne streaming eventy/room close pretekajú do ingestu; tiež interný end na streaming strane (`signaling.endInspection`). Notifikačná integrácia na inspection udalosti **neoverená** v kóde preskúmanom v tejto fáze (notifications modul existuje samostatne). **Ukončenie potvrdené, notifikácie neoverené.**
10. **Zobrazenie vo frontendovej platforme:** Existuje feature `inspections` (panel + stránka `/obhliadka/[id]`, použitie v chate a detaile listingu) volajúce platform API a otvárajúce streaming `publish/viewer` URL s tokenmi. **Potvrdené** (úplnosť UX/pokrývanie všetkých obrazoviek natívne **neoverené**).

**Rozlíšenie existujúce vs nové:** veľká časť „natívnej“ integrácie (DB, API, token bridge, verify/events, FE panel, streaming http-adapter + WS flow) **už existuje**. Potenciálne nové/doladenie (podľa cieľa „natívna funkcia“ v celej platforme): notifikácie/história v UI, širšie zapojenie do navigácie/firiem/admin nastavení, verejný/členský prístup ak požadovaný, produkčné zladenie env/infra oboch systémov, hardening a E2E v cieľovom prostredí — **nové požiadavky/rozsah neoverený**.

## 4) API kontrakt medzi systémami (zistený)

**A. Platforma → Streaming (server-side)**
- `POST {CMEP_STREAMING_INTERNAL_URL|CMEP_STREAMING_PUBLIC_URL}/internal/inspections/{inspectionId}/end`  
  - Auth: `X-CMEP-Internal-Key` (HMAC-porovnanie/rovnosť podľa implementácií; musí sedieť s `CMEP_INTERNAL_API_KEY`)  
  - Účel: ukončiť miestnosť/inspekciu v streamingu (`StreamingServiceClient.end_inspection`, `backend/src/index.js:internalRequestHandler`, `signaling.endInspection`).  
  - Semantika: best-effort na strane platformy; platform stav autoritatívny pri end flow.

**B. Streaming (http-adapter) → Platforma (server-side overenie/udalosti)**
- `GET {CMEP_PLATFORM_URL}/api/v1/inspections/{inspectionId}/verify?sub=&role=`  
  - Auth: `X-CMEP-Internal-Key`  
  - Response: `{ok, state, reason?, inspectionId, listingId, ownerCompanyId, viewerCompanyId?, consentToRecord, roomId}` (podľa `HttpAdapter._verify/canRecord` a `InspectionService.verify_for_streaming`/schemas)  
  - Fail-closed pri chybe/nesúlade.
- `POST {CMEP_PLATFORM_URL}/api/v1/inspections/events`  
  - Auth: `X-CMEP-Internal-Key`, JSON `{eventUid, inspectionId, eventType, actorSub?, roomId?, role?, reason?}`  
  - Idempotentné podľa `eventUid`, whitelist event typov; aktualizuje stav/históriu (`HttpAdapter.recordSessionEvent`, platform `record_event`).

**C. Klient (prehliadač) → Platforma (JWT používateľa, `/api/v1`)**
- `POST /inspections` `{listingId}` → `{inspection, role:"publisher", publishUrl, expiresIn}`
- `GET /inspections?listingId=` → `{inspection|null, canPublish, canJoin, isViewer}`
- `POST /inspections/join` `{inspectionId|listingId, threadId?, waitRoomSeconds?}` → `{inspection, role:"viewer", viewerUrl, expiresIn, roomId}`
- `GET /inspections/{id}` → `{data}`
- `POST /inspections/{id}/publisher-link` → `{role,publishUrl,expiresIn}`
- `POST /inspections/{id}/recording-consent` → `{data}`
- `POST /inspections/{id}/end` → `{data}`  
(Zdroj: `inspections/presentation/router.py`, `schemas.py`, FE `features/inspections/api.ts/types.ts`)

**D. Klient → Streaming (WS signaling, token v URL/Bearer)**
- Autentifikácia: `?token=`/Bearer s HMAC tokenom (claims vrátane `sub,insp,offerId,role,companyId,rec`) vydaným platformou, overenie `SESSION_SIGNING_SECRET` + adapter authorize.
- RPC metódy (protokol): `getRouterRtpCapabilities, getIceServers, createRoom, joinRoom, leaveRoom, resumeSession, createWebRtcTransport, connectTransport, produce, consume, resumeConsumer, requestInspection, acceptInspection, rejectInspection, startRecording, stopRecording, restartIce, close` (`backend/src/protocol.js`, obsluha v `signaling.js`). Eventy server→klient: ready, inspectionRequested/Accepted/Rejected, peerJoined/Left/Disconnected/Rejoined, newProducer, roomClosed (podľa `signaling.js` a web klientov).
- HTTP: `/healthz`, `/health`, statické `/publish.html`, `/viewer.html` (`backend/src/http.js`).

**Konfiguračné väzby (musí sedieť naprieč systémami):** `CMEP_STREAMING_SIGNING_SECRET`(platform) == `SESSION_SIGNING_SECRET`(streaming), `CMEP_INTERNAL_API_KEY` zhodný, `CMEP_PLATFORM_URL`/`*_INTERNAL_URL` smerujú na platformu, `CMEP_STREAMING_PUBLIC_URL` na verejný streaming.

## 5) Návrh databázovej evidencie

**Existujúce (potvrdené, nemenené):**
- `inspections` (`insp_2026111101`): identita/tenancy/relácie (`listing_id` FK, `room_id`, `owner_user_id/company_id`, `viewer_user_id/company_id/thread_id`), `state`, `consent_to_record/recording_consent_at`, `ended_at`, audit polia; indexy na listing/room/owner/company. Vhodné ako autoritatívny záznam relácie obhliadky na strane platformy.
- `inspection_events`: `event_uid` unique (idempotencia), `inspection_id` FK, typ/actor/room/role/reason/payload, timestamps — audit/história stavových prechodov zo streamingu.

**Návrh rozšírení (nové požiadavky — NENASADZOVAŤ v tejto fáze):**
- Len ak treba biznis históriu nad rámec eventov: napr. materializované metriky/trvanie/účastnícke súhrny alebo prepojenie na notifikácie/konverzácie (preferovať odvodenie z `inspection_events` + `inspections` pred duplikáciou). 
- Ak bude verejný/členský prístup: explicitný model pozvánok/prístupových tokenov/ACL (nie je v aktuálnom modeli) — **neoverená požiadavka**.
- Prípadné indexy podľa reálnych dotazov (napr. aktívne podľa účastníka) až po analýze záťaže; unikátna „jedna aktívna na listing“ podmienka je dnes riešená aplikačne (`find_active_by_listing`) — zvážiť DB constraint pri implementácii opatrne kvôli race conditions a definícii aktívnych stavov.

## 6) Návrh používateľského rozhrania

**Existujúce (potvrdené):** `InspectionPanel` integrovaný v detaile listingu a chat okne; samostatná route `/obhliadka/[id]` (`inspection-page.tsx`); toky publish/join/reopen/invite/consent/end cez platform API bez manuálnych ID.

**Cieľová natívna integrácia (návrh, etapovo):**
- **Konzistentné vstupné body:** listing detail, chat vlákno viazané na listing, prípadne notifikačný/inbox vstup; jednotné zobrazenie stavu (created/room_created/requested/accepted/live/ended), účastníkov, času, consent.
- **Publisher (vlastník/člen firmy):** spustiť, znova otvoriť publish, udeliť súhlas s nahrávaním pred record, ukončiť; jasné stavy „čaká sa na miestnosť/diváka“.
- **Viewer (counterpart):** viditeľnosť dostupnej obhliadky, join/request podľa stavu, návrat po reconnect (UI info).
- **Firemný kontext:** zobrazenie len používateľom s oprávnením podľa členstva/konverzácie (už backendom vynucované); admin nastavenia firmy — **závislé od existujúcich firemných nastavení (neoverené, či sa má rozšíriť)**.
- **História/audit v UI:** prehľad minulých obhliadok na listing/konverzácii z `inspections` (+ voliteľne eventy) — **nové UI, ak požadované**.
- FE musí ostať thin-client nad platform API; streaming URL/token nikdy nevytvárať klientom, iba otvárať z odpovedí platformy.

## 7) Bezpečnostné riziká

- **Zhodnosť secretov a ich únik:** `SESSION_SIGNING_SECRET`↔`CMEP_STREAMING_SIGNING_SECRET`, `CMEP_INTERNAL_API_KEY` musia byť silné, rotované bezpečne a nikdy vystavené klientu/logom; TURN/streaming tokeny len server-side. (Kontroly v kóde: fail-closed verify, nevracanie secretov; riziko nesprávnej produkčnej konfigurácie.)
- **Autorizácia/tenant izolácia:** spoliehanie na `room.offerId == claims.insp`, accepted viewer, membership/listing owner a counterpart-thread pravidlá — regresia v ktoromkoľvek bode môže spôsobiť neoprávnený prístup. Nutné zachovať platformu ako zdroj rozhodnutia pri http mode.
- **Token TTL a replay:** stream tokeny majú TTL (platform mint default 3600s v `StreamingTokenService`, TURN krátke) a stavová revokácia cez verify; dlhšie TTL zvyšuje riziko po zmene oprávnení — zosúladiť s bezpečnostnou politikou.
- **Stavová konzistencia (distribuovaný systém):** best-effort `end_inspection` volanie streamingu, ingest eventov, polling na `room_id`, reconnect/resume — možné prechodné nesúlady; idempotencia (`event_uid`, dedupe) a fail-closed verify znižujú dopad.
- **Interné endpointy:** `/internal/*` (streaming) a `/api/v1/inspections/verify|events` (platforma) musia byť dostupné len dôveryhodnému backend-to-backend kanálu (sieťová izolácia, správny key). Chybná expozícia = riziko.
- **CORS/CSRF/origin:** platforma už rieši pre auth/browser; streaming web beží ako samostatná appka — integračné vloženie/otváranie musí rešpektovať originy a nevkladať citlivé údaje do URL nad rámec už navrhnutého (tokeny v URL sú citlivé; minimalizovať logovanie/referrer úniky).
- **Súhlas a nahrávanie:** `consent_to_record`/`rec` a `canRecord` server-side kontrolované; právna/GDPR správnosť procesu je mimo kódu (neoverené).
- **DoS/rate limiting:** signaling rate limit existuje (`signaling.js`, config), platform rate limits na auth; potrebné overiť limity pre inspections/WS v produkcii.

## 8) Etapový implementačný plán (návrh, malé kontrolovateľné kroky)

> **Poznámka:** Inspections integrácia je už čiastočne implementovaná. Etapy majú preto charakter „overiť/doplniť/hardeniť“, nie nevyhnutne stavať od nuly. Presný rozsah po schválení.

### Etapa 0 — Baseline a kontrakt (bez funkčných zmien)
- **Súbory (existujúce):** `waste-platform/docs/CMEP_LIVE_INSPECTIONS.md`, `app/modules/inspections/**`, `app/core/config.py`, `cmep-streaming/backend/src/{protocol,signaling,adapter/http-adapter.js,config.js,index.js}`, `deploy/env/.env.production.template`.
- **Závislosti:** zhodné secrets/URL/keys, dostupnosť DB migrácie `insp_2026111101`.
- **Nové súbory:** prípadne doplnený integračný runbook (až po schválení).
- **Riziká regresie:** žiadne (len inventarizácia).
- **Kritériá úspechu/testy:** potvrdený end-to-end kontrakt (token claims, verify/events, roomId lifecycle) oproti kódu; zoznam delta oproti cieľu.

### Etapa 1 — Backend integrácia (platforma) hardening/doplnenie
- **Súbory:** `waste-platform/app/modules/inspections/application/services.py`, `presentation/{router.py,schemas.py}`, `infrastructure/{repositories.py,streaming_client.py,mappers.py}`, prípadne `chat/listings` read modely ak treba rozšíriť pravidlá; `app/core/config.py`.
- **Nové súbory:** len ak pribudne nová schopnosť (napr. notifikačný hook/service) — špecifikovať pri implementácii.
- **Riziká:** zmena stavového stroja, idempotencie, autorizácie counterpart/tenant.
- **Testy/kritériá:** rozšíriť/udržať `tests/unit/test_inspections_{service,endpoints,tokens}.py`; overiť fail-closed verify/events, duplicitu aktívnej obhliadky, ukončenie, consent.

### Etapa 2 — Databázové modely a migrácie (len ak potrebné)
- **Súbory:** `waste-platform/app/modules/inspections/infrastructure/models.py`, `migrations/versions/*` (nová migrácia len aditívne), repository.
- **Závislosti:** existujúca migrácia `insp_2026111101`.
- **Riziká:** migrácia na produkčnej DB, spätna kompatibilita.
- **Testy:** migračný test, repository/unit.

### Etapa 3 — Autentifikácia a autorizácia (zosúladenie)
- **Súbory:** `waste-platform/app/shared/presentation/{auth_dependencies.py,authorization.py}`, `inspections/application/services.py`, `cmep-streaming/backend/src/{auth.js,adapter/http-adapter.js,signaling.js,index.js}`.
- **Riziká:** rozšírenie prístupu (verejný/členský) bez oslabenia tenant izolácie.
- **Testy:** authz matica (owner member, non-member, counterpart, cudzí, expirovaný/revokovaný kontext podľa možností), WS 4401/resume forbidden.

### Etapa 4 — API kontrakty a stavová synchronizácia
- **Súbory:** platform `inspections` router/schemas/services, streaming `protocol.js/signaling.js/index.js`, `http-adapter.js`, FE `features/inspections/api.ts/types.ts`.
- **Riziká:** breaking zmeny pre existujúcich klientov/testy; nesúlad event mapovania (`apply_event_to_entity`).
- **Testy:** kontraktové/unit/integration (`backend/test/*`, platform unit tests, prípadne E2E harness).

### Etapa 5 — Frontend natívne UX
- **Súbory:** `apps/web/src/features/inspections/*`, `apps/web/src/app/obhliadka/[id]/page.tsx`, integrácie v `chat`, `dashboard/listings/[id]`, navigácia/notifikácie (podľa existujúcich vzorov).
- **Nové súbory:** iba nové view/komponenty ak potrebné v rámci existujúcej architektúry.
- **Riziká:** UX regresie chatu/listingu, spracovanie chýb/expirácie tokenu.
- **Testy:** FE unit/integration (vitest) tam kde sú vzory, manuálny lokálny flow.

### Etapa 6 — Signaling/WebRTC prevádzkové doladenie
- **Súbory:** `cmep-streaming/backend/src/signaling.js`, `web/{publish,viewer,rpc}.js`, `turn-credentials.js`, recorder (ak v scope).
- **Riziká:** media/reconnect regresie (už riešené oblasti — nemenené bez dôvodu).
- **Testy:** `backend/test/{signaling-resume,signaling-turn,integration,http-adapter}.test.js` a cieľové TURN auth; nere-run PASS sád bez dôvodu.

### Etapa 7 — Testovanie regresií a lokálne spoločné E2E
- **Súbory:** `waste-platform/tests/unit/test_inspections_*.py`, `scripts/cmep_live_inspection_e2e_server.py`, `cmep-streaming/backend/test/cmep-live-e2e.test.js` a prepojenie.
- **Riziká:** krehkosť E2E, závislosti na prostredí (Python venv/DB/ports).
- **Kritériá:** reprodukovateľný lokálny beh platforma+streaming (HTTP adapter, verify/events, end-to-end publish/join/live/end, reconnect scenáre podľa podpory).

### Etapa 8 — Produkčná infraštruktúra (až po schválení a lokálnom overení)
- **Súbory:** `cmep-streaming/deploy/**`, platform env/secrets manažment (mimo repo kódu), sieťová izolácia interných endpointov.
- **Riziká:** verejná expozícia interných API, nesúlad DNS/TLS/TURN/certifikátov, výpadok.
- **Kritériá:** readiness/health, funkčný TURN cez NAT, monitorovanie, rollback plán; overenie na VPS.

## 9) Otvorené otázky a neoverené predpoklady

- **Cieľový rozsah „natívna funkcia“:** ktoré konkrétne obrazovky/roly/tenant scenáre ešte chýbajú nad existujúcim panelom (chat, listing, dashboard, admin, firma)?
- **Verejný/členský prístup:** požadovaný alebo nie? (aktuálne neimplementované podľa potvrdeného flow).
- **Notifikácie:** majú sa generovať pri request/accept/live/end? ak áno, cez ktorý existujúci kanál (`notifications` modul) a aké eventy.
- **História v UI:** potrebný používateľský prehľad minulých obhliadok/záznamov (okrem event tabuľky)?
- **Nahrávanie:** požadované v produkcii? (závisí od recorder, storage, consent, GDPR procesu) — technicky pripravené čiastočne, prevádzkovo neoverené.
- **Zhodnosť/rotácia kľúčov:** prevádzkový proces pre `CMEP_STREAMING_SIGNING_SECRET/SESSION_SIGNING_SECRET`, `CMEP_INTERNAL_API_KEY`, `TURN_SECRET` naprieč prostrediami.
- **Sieťová topológia:** či `/internal/*` a platform verify/events budú volateľné iba v privátnej sieti; TLS medzi službami.
- **Stav migrácií na cieľovej DB:** či `insp_2026111101` (a ďalšie) sú nasadené konzistentne.
- **Skutočný stav FE navigácie/UX:** úplné pokrytie všetkých požadovaných miest v platforme nebolo forenzne mapované do detailu každej stránky.
- **Výsledky existujúcich E2E/unit testov v aktuálnom prostredí:** nepotvrdzované v tejto fáze (okrem dokumentovaných reportov v streaming deploy artefaktoch).

## 10) Záver — požadované sumarizácie

### Potvrdené skutočnosti
- Platforma je zdroj identity (JWT/users) a tenant/role kontextu (memberships) a už obsahuje implementovaný modul `inspections` (DB `inspections`+`inspection_events`, migrácia `insp_2026111101`, API create/join/verify/events/end/consent, mint HMAC stream tokenov, FE panel + route `/obhliadka/[id]`, napojenie v chate a detaile listingu).
- Streaming je médiová signalizačná služba (mediasoup) s WS auth cez overenie tokenu + adapter autorizáciu; v http režime deleguje kritické rozhodnutia na platform verify a posiela idempotentné eventy; podporuje TURN REST server-side cred vydávanie, ICE restart, reconnect/resume mechanizmy a health/readiness endpointy (podľa kódu a `deploy/FINAL_IMPLEMENTATION_REPORT.md`).
- Medzisystémový kontrakt (kľúče, token claims `insp/offerId/role/sub/rec`, verify/events, internal end) je v kóde oboch strán prítomný a vzájomne zosúladený na úrovni preskúmaných súborov.
- Read-only fáza: žiadne zdrojové súbory projektov neboli modifikované touto analýzou; vytvorený iba tento report.

### Neoverené skutočnosti
- Úplná produkčná pripravenosť, reálne NAT/TURN/TLS/DNS správanie a cross-service/platform E2E v cieľovom prostredí (vrátane `cmep-live-e2e`).
- Existencia/požiadavka verejného alebo členského prístupu mimo aktuálneho modelu, notifikačných väzieb a požadovaného rozsahu histórie/UI v celej platforme.
- Aktuálne nasadené DB schémy/env/secrets na cieľových prostrediach a prevádzkové metriky/záťaž.

### Chýbajúce závislosti
- (Na overenie/prevádzku) funkčné cieľové prostredie: VPS/Linux x86_64, verejná IP+DNS+TLS, caddy/coturn/systemd, korektne nastavené `CMEP_STREAMING_*`/`CMEP_INTERNAL_API_KEY`/`SESSION_SIGNING_SECRET`/`TURN_*` na oboch stranách, sieťovo dostupné platform↔streaming interné cesty.
- (Na lokálne spoločné E2E) funkčný `waste-platform` beh (Python/venv/DB/migrácie) + streaming node/mediasoup a súčinné test harnessy.
- Schválený produktový rozsah pre „natívnu“ integráciu (notifikácie, história, verejný prístup, admin/firemné nastavenia, nahrávanie) pred implementáciou.

### Odporúčaná prvá implementačná etapa
**Etapa 0 → Etapa 1 (po schválení):** potvrdiť cieľový rozsah delty oproti už existujúcej implementácii a vykonať malý, kontrolovaný hardening/zosúladenie backend kontraktu a autorizácie v `waste-platform/app/modules/inspections/**` + zodpovedajúcich hraniciach v `cmep-streaming` (bez zbytočných zmien), s aktualizáciou/udržaním existujúcich unit testov oboch strán ako prvej regresnej brány pred ďalšími UI/E2E/infra krokmi.

**Stav:** analýza dokončená, report vytvorený. Čakám na schválenie pred akoukoľvek implementáciou.
