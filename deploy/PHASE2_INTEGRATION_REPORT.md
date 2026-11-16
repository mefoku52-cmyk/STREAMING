# CMEP Streaming → CMEP Platform — FÁZA 2 integračný report

**Dátum:** 2026-11-15  
**Režim:** implementácia potvrdených nedostatkov + overenie (bez commit/push/deploy, bez produkčných zásahov, bez mazania `.env`/DB/nahrávok, bez odstraňovania testov).  
**Východisko:** `deploy/CMEP_PLATFORM_INTEGRATION_PLAN.md`, existujúca implementácia modulu `inspections` (nezduplikovaná).

## 1) Overenie skutočného end-to-end toku (podľa existujúcej implementácie)

| Krok toku | Stav | Dôkaz (súbory/testy) |
|---|---|---|
| 1. Autentifikácia v CMEP | **Potvrdené (existujúce)** | `waste-platform/app/modules/auth/*`, `shared/infrastructure/security/jwt_service.py`, `shared/presentation/auth_dependencies.py` (JWT Bearer, `require_current_user`) |
| 2. Overenie firemného členstva a oprávnení | **Potvrdené (existujúce)** | `shared/presentation/authorization.py`, `inspections/application/services.py` (`create_inspection` členstvo vlastníka listingu, `join_inspection` counterpart pravidlá, tenant/company väzby) |
| 3. Vytvorenie obhliadky pri ponuke | **Potvrdené** | Platform API `POST /api/v1/inspections` + DB záznam (`inspections`), zákaz duplicity aktívnej na listing; overené v platform unit testoch a cross-service E2E |
| 4. Vytvorenie záznamu a vydanie stream tokenu | **Potvrdené** | `inspections/application/streaming_tokens.py` (HMAC claims `insp/offerId/listingId/role/rec`, zhodný formát so streaming auth), `publishUrl/viewerUrl`; E2E overuje claims/URL |
| 5. Publisher pripojenie k streaming službe | **Potvrdené** | WS auth + `createRoom{offerId=inspectionId}` v `cmep-streaming/backend/src/{signaling,index,adapter/http-adapter.js}`; E2E: publisher vytvorí room |
| 6. Streaming overí token a autorizáciu cez platformu | **Potvrdené** | `verifyLocalSessionToken` + `HttpAdapter.authenticate/canCreateInspection` → platform `GET /api/v1/inspections/{id}/verify` (fail-closed), interný key; E2E + `http-adapter` testy |
| 7. Druhý oprávnený používateľ ako viewer | **Potvrdené** | Platform `join` (counterpart chat thread na listing) + viewer token/URL, streaming `requestInspection/joinRoom` + platform verify role viewer; E2E |
| 8. request/accept a WebRTC transporty | **Potvrdené (signaling/transport flow)** | `signaling.js` request/accept/join state machine, `createWebRtcTransport/connect/produce/consume/resumeConsumer`; E2E prechádza request→accept→viewer join(live). Skutočný RTP mediálny prenos medzi reálnymi prehliadačmi v tomto prostredí nebol overený (viď neoverené) |
| 9. Prenos zvuku a obrazu | **Čiastočne potvrdené / environment-limitované** | Signaling/transport/produce-consume mechanizmy existujú a integračný flow prechádza; reálny A/V kvalitatívny prenos (browser↔browser, kodeky, zariadenia) nebol vykonaný ako automatizovaný mediálny test v tomto prostredí |
| 10. Synchronizácia udalostí a stavov späť do CMEP | **Potvrdené + doplnená konzistencia** | Streaming `recordSessionEvent` → platform `POST /api/v1/inspections/events` (idempotentné `eventUid`, whitelist, `apply_event_to_entity`), stav/`room_id` aktualizácia; E2E overuje `room_created`, live/end a verify po end. Doplnené: pri ingeste `inspection_ended` platforma best-effort notifikuje streaming `end_inspection` (konzistencia s explicitným end flow) |
| 11. Ukončenie obhliadky a odstránenie aktívnej miestnosti | **Potvrdené** | Platform `end_inspection` (ENDED, autoritatívny stav, best-effort internal end call) + streaming `endInspection`/cleanup; E2E: stav `ended`, verify fail-closed `inspection_ended`, streaming health `rooms=0, peers=0, workerAlive=true` |
| 12. Odmietnutie neoprávneného používateľa | **Potvrdené** | E2E: cudzí používateľ nemôže vytvoriť/získať/joinnúť obhliadku; viewer nemôže získať publisher práva (`createRoom`/record zamietnuté); adapter fail-closed/tenant väzby (`claims.insp==offerId`, accepted viewer, membership/thread) |

## 2) Spoločné E2E testovanie

**Preskúmané artefakty**
- `cmep-streaming/backend/test/cmep-live-e2e.test.js`: spúšťa platform runner (Python, pevná cesta na `.venv/bin/python` + `scripts/cmep_live_inspection_e2e_server.py`), seed/token JSON, dynamické porty, spustí streaming s `CMEP_ADAPTER=http` a zhodnými secrets/keys, vykoná full flow (create/dup 409, WS createRoom, room_created+room_id, join/viewer token, request→accept→join live, viewer forbidden ops, outsider forbidden, end+verify fail-closed, cleanup health).
- `waste-platform/scripts/cmep_live_inspection_e2e_server.py`: SQLite DB per PID, test env/JWT/disabled rate-limit, seed owner/viewer/outsider + membership/listing/chat thread, mint access tokenov, uvicorn app, zapisuje token payload (vrátane `baseUrl`).

**Požadované prostredie / predchádzajúce nedokončenie**
- Vyžaduje: funkčný `waste-platform/.venv` Python s projektovými závislosťami, spustiteľný uvicorn/FastAPI stack, voľné lokálne porty, Node/mediasoup v cmep-streaming, zapis do tmp cesty pre token súbor. Predchádzajúci stav (z `deploy/FINAL_IMPLEMENTATION_REPORT.md`): E2E necertifikovaný/timeout kvôli environmentálnej závislosti na platform runneri/beh prostredia; vtedy neprešlo čisto v danom kontexte.

**Výsledok behu (Fáza 2)**
- Seed-only runner: **PASS** (`python scripts/cmep_live_inspection_e2e_server.py --seed-only`, RC 0).
- Cross-service E2E: **PASS (1/1)** — opakovane úspešné behy, napr. `✔ cross-service CMEP live inspection E2E (platform <-> streaming)` (~23–31 s), RC 0. Re-run po oprave konzistencie tiež **PASS**.

**Klasifikácia**
- Pôvodný problém predchádzajúcej fázy nebol v tomto behu reprodukovaný a javil sa ako **environmentálne podmienený** (dostupnosť/beh platform runnera). Timeout v E2E sa automaticky nepovažuje za chybu aplikácie; tu test dobehol úspešne.
- Jediný preukázaný kódový nedostatok zistený pri analýze konzistencie (event-ingest `ended` bez notifikácie streamingu) bol **chyba logiky integrácie**, nie prostredia — opravený a pokrytý testom.

## 3) Implementácia skutočných nedostatkov

### P0 — Bezpečnosť a integrácia (potvrdené/existujúce + oprava)
- Existujúce (zachované, nezdvojené): CMEP ako zdroj identity/tenant/authz, platform-minted HMAC tokeny, server-side verify cez platformu (fail-closed), interný `X-CMEP-Internal-Key`, väzba `insp/offerId/accepted viewer/membership/thread`, idempotentný ingest eventov, bezpečné ukončenie cez platform end + streaming internal end.
- **Opravené:** konzistencia stavov pri ukončení pozorovanom cez ingest eventov — `record_event()` pri prechode do `ENDED` vykoná best-effort idempotentné `streaming.end_inspection(saved.id)` (zosúladenie platforma↔streaming room lifecycle aj mimo priameho `end_inspection` volania).

### P1 — Funkčnosť
- Potvrdené existujúcim kódom a testami: create/join/request/accept flow, signaling/transport RPC, reconnect/resume/ICE (predchádzajúce streaming testy/report + zachované), synchronizácia udalostí, cleanup.
- Reálny A/V mediálny prenos v prehliadačoch nebol doplnkovo automatizovane verifikovaný v tomto prostredí (signaling vrstva áno).

### P2 — Používateľské rozhranie
- Existujúci panel pri ponuke a v chate, stavy, chybové hlásenia, návrat cez aktívnu obhliadku/listing kontext sú prítomné (`waste-platform/apps/web/src/features/inspections/*`, použitie v `dashboard/listings/[id]`, `chat/components/chat-window.tsx`, route `/obhliadka/[id]`). Žiadna duplicitná implementácia nevytvorená. Bezpečné doplnenie „prehľadu minulých obhliadok“ bez rizika duplicity/regresie v tomto rozsahu neimplementované (vyžaduje samostatné UI/produktové rozhodnutie nad existujúcimi dátami).

### P3 — Notifikácie
- Preskúmaný `waste-platform/app/modules/notifications` (doménový enum/schémy bez inspection typov; žiadne napojenie na inspections eventy nenájdené). Napojenie **neimplementované**, pretože chýba potvrdený kontrakt/typy v existujúcom systéme a bezpečné doplnenie bez rizika nesprávnej duplicity/sémantiky si vyžaduje explicitné rozhodnutie (čo, komu, kedy). Stav zdokumentovaný.

## 4) Zoznam skutočne vykonaných zmien

| Súbor | Dôvod zmeny |
|---|---|
| `waste-platform/app/modules/inspections/application/services.py` | P0 konzistencia: po `record_event` aplikujúcom prechod do `InspectionState.ENDED` sa vykoná best-effort `streaming.end_inspection(saved.id)` (idempotentné, zhodné s `end_inspection`), aby ingestovaný koniec obhliadky nezanechal aktívnu miestnosť/nekonzistentný stav medzi platformou a streamingom. |
| `waste-platform/tests/unit/test_inspections_service.py` | Regresný test `test_record_event_ended_triggers_streaming_end_best_effort` (mock streaming klienta overuje volanie pri ended evente) na pokrytie opravy. |
| `cmep-streaming/deploy/PHASE2_INTEGRATION_REPORT.md` | Záväzný report Fázy 2. |

**Nezmenené zámerne:** existujúce API kontrakty/DB schémy/migrácie, `inspections` identita a dáta, streaming signalizačná logika (už pokrytá), UI panel štruktúra, `.env`, DB dáta, nahrávky. Žiadne nové migrácie, commit/push/deploy.

## 5) Výsledky nových a relevantných regresných testov

| Prostredie / sada | Výsledok |
|---|---|
| `waste-platform` `tests/unit/test_inspections_service.py tests/unit/test_inspections_tokens.py tests/unit/test_inspections_endpoints.py` | **PASS (20 passed, 0 failed)**, RC 0 |
| `cmep-streaming` `backend/test/http-adapter.test.js backend/test/integration.test.js` | **PASS (11 tests)**, RC 0 |
| `cmep-streaming` `backend/test/cmep-live-e2e.test.js` (cross-service, platform runner) | **PASS (1/1)**, RC 0 (seed-only tiež RC 0) |

Predchádzajúce širšie streaming sady z Fázy 1 (podľa `deploy/FINAL_IMPLEMENTATION_REPORT.md`) neboli zbytočne opakované; meniaca sa oblasť v Fáze 2 bola platformová konzistencia + relevantné integračné/adapter/E2E overenie.

## 6) Výsledok spoločného E2E testu

- **`cmep-live-e2e.test.js`: PASS.** Overené scenáre v teste: vytvorenie obhliadky a publisher token/claims, duplicita 409, WS `createRoom`, prechod na `room_created` + `room_id`, viewer join cez platformu a token/URL, request→accept→viewer join (live), zamietnutie viewer publisher oprávnení a nahrávania, zamietnutie cudzieho používateľa (create/get/join), ukončenie + verify fail-closed (`inspection_ended`), cleanup streamingu (`rooms=0, peers=0, workerAlive=true`).

## 7) Potvrdené funkčné scenáre

- Autentifikovaná, autorizovaná tvorba obhliadky viazaná na ponuku/členstvo firmy (bez duplicitnej identity/DB).
- Server-side mint/overenie tokenov, interná key-autorizácia, platform verify fail-closed.
- Publisher/viewer flow cez existujúci signaling (create/request/accept/join) a synchronizácia stavov/room_id/eventov.
- Tenant/role izolácia a odmietnutie neoprávnených/cudzích používateľov v testovaných cestách.
- Ukončenie a cleanup miestnosti + konzistencia pri ended evente (vrátane doplnenej opravy).

## 8) Neoverené scenáre a ich príčiny

- **Reálny prenos A/V média (audio/video) medzi reálnymi prehliadačmi/zařízeníami:** chýba automatizovaný browser-media E2E v tomto prostredí; overená signalizačná/autorizačná vrstva, nie kvalita RTP streamu.
- **TURN/NAT traversal na verejnej sieti, produkčné TLS/DNS/VPS správanie:** vyžaduje externú infra (verejná IP, coturn, certifikáty, reálne siete) — mimo lokálneho prostredia.
- **Notifikačné doručenie inspection udalostí používateľom:** v existujúcom notifications module nenájdená integrácia/kontrakt; neimplementované (P3 podmienené).
- **Plnohodnotný UI prehľad minulých obhliadok a komplexné browser UX scenáre:** čiastočne pokryté existujúcim panelom; dedikovaná história/rozšírené UX neimplementované bez ďalšieho produktuálneho rozsahu.
- **Záťažové/dlhodobé a multi-browser reconnect scenáre na reálnej sieti:** neoverené lokálne.

## 9) Zostávajúce prekážky pre produkčné nasadenie

- Nasadiť a zosúladiť konfiguráciu/secrets oboch služieb (`SESSION_SIGNING_SECRET`↔`CMEP_STREAMING_SIGNING_SECRET`, `CMEP_INTERNAL_API_KEY`, `CMEP_PLATFORM_URL`/internal/public URL, `TURN_*`, `ANNOUNCED_IP`) v cieľovom prostredí so sieťovou izoláciou interných endpointov.
- Verejná VPS infra: DNS+TLS (Caddy/LE), coturn, firewall/porty (RTC 60000-60100, TURN 3478/5349/49152-65535), systemd/release deploy podľa `deploy/` artefaktov a overenie readiness.
- Overiť reálny mediálny prenos a NAT traversal end-to-end na produkčnej sieti (min. manuálny/browser akceptačný test).
- Rozhodnúť a doimplementovať notifikácie/históriu UI, ak sú požadované (s jasným kontraktom v existujúcom module).
- Prevádzkové monitorovanie, rotácia kľúčov a overenie migrácií na cieľovej DB.

**Stav:** implementácia v rámci rozsahu dokončená, relevantné testy a cross-service E2E prešli. **Bez commitu, pushu a deploymentu.**
