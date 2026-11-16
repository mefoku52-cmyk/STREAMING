# CMEP Streaming — Finálny integračný audit deploymentu (pred VPS)

**Rozsah:** audit `deploy/` (14 súborov) + klienti `web/publish.js`, `web/viewer.js`. Žiadne zmeny mimo tohto reportu. Žiadny commit/push/deploy. Existujúce testy neboli opakované (kontext: backend 29/29 PASS, TURN auth 9/9 PASS).

---

## 1. Inventár deploy/ (14 súborov)

| # | Súbor | Účel |
|---|---|---|
| 1 | `deploy/README.md` | prehľad a požiadavky |
| 2 | `deploy/FINAL_DEPLOYMENT_AUDIT.md` | predchádzajúci audit |
| 3 | `deploy/TURN_AUTH_VERIFICATION.md` | overenie TURN REST auth |
| 4 | `deploy/systemd/cmep-streaming.service` | systemd unit |
| 5 | `deploy/caddy/Caddyfile` | HTTPS/WSS reverse proxy |
| 6 | `deploy/coturn/turnserver.conf` | šablóna coturn (TURN REST) |
| 7 | `deploy/firewall/ufw-rules.sh` | UFW pravidlá |
| 8 | `deploy/env/.env.production.template` | šablóna env |
| 9 | `deploy/scripts/check-worker.sh` | kontrola mediasoup workeru |
| 10 | `deploy/scripts/health-check.sh` | health-check `/healthz` |
| 11 | `deploy/scripts/deploy.sh` | deploy/aktualizácia |
| 12 | `deploy/scripts/rollback.sh` | rollback |
| 13 | `deploy/turn-credentials/generate-turn-credentials.sh` | generátor TURN REST credentials |
| 14 | `deploy/turn-credentials/test-turn-auth.sh` | lokálny test TURN auth |

---

## 2. Mapa konfigurácie (premenné, cesty, porty, závislosti)

| Vrstva | Zdroj → cieľ | Kľúčové hodnoty |
|---|---|---|
| `.env` (app) | `deploy/env/.env.production.template` → `/opt/cmep-streaming/.env` (deploy.sh:37-39, chmod 600) → systemd `EnvironmentFile` (service:11) → Node `backend/src/config.js`, `media-config.js` | `SIGNALING_HOST=0.0.0.0`, `SIGNALING_PORT=8504`, `WEB_HOST=127.0.0.1`, `WEB_PORT=8502`, `ANNOUNCED_IP`, `RTC_MIN_PORT=60000`, `RTC_MAX_PORT=60100`, `SESSION_SIGNING_SECRET`, `CMEP_ADAPTER/PLATFORM_URL/INTERNAL_API_KEY/HTTP_VERIFY`, `TURN_SECRET`, `TURN_REALM` |
| systemd | `deploy/systemd/cmep-streaming.service` → `/etc/systemd/system/` (deploy.sh:56) | `User=cmep-streaming`, `WorkingDirectory=/opt/cmep-streaming`, `ExecStart=/usr/bin/node backend/src/index.js`, `Restart=always`, SIGTERM, `ReadWritePaths=.../runtime,logs,recordings,tmp` |
| Node signaling/HTTP | `backend/src/index.js` + `config.js:28-29` | počúva `SIGNALING_HOST:SIGNALING_PORT` (8504), HTTP+WS `/ws`, `/healthz`, static z `web/` |
| Caddy | `deploy/caddy/Caddyfile` → `/etc/caddy/Caddyfile` (deploy.sh:64) | `:443` na doméne → `reverse_proxy localhost:8504` (HTTPS/WSS, ACME) |
| coturn | šablóna `deploy/coturn/turnserver.conf` → `/etc/turnserver.conf` (deploy.sh:81-89, root:600) | `listening-port=3478`, `tls-listening-port=5349`, `realm=<TURN_REALM>`, `use-auth-secret`+`static-auth-secret=<TURN_SECRET>`, relay `49152-65535`, no `user=` |
| UFW | `deploy/firewall/ufw-rules.sh` (manuálne) | povolené: 22/tcp, 80/tcp, 443/tcp, 60000-60100/udp+tcp, 3478/udp+tcp, 5349/tcp, 49152-65535/udp+tcp; default deny incoming |
| TURN credential gen | `deploy/turn-credentials/generate-turn-credentials.sh` | číta `TURN_SECRET` z env (nie z `.env`), výstup `timestamp:userid` + `Base64(HMAC-SHA1)` |
| Health check | `deploy/scripts/health-check.sh` | `GET http://127.0.0.1:8504/healthz`, kontrola `ok=true` |
| Deploy/rollback | `deploy/scripts/deploy.sh`, `deploy/scripts/rollback.sh` | clone/update, `npm ci --omit=dev`, check-worker, systemd enable/start, voliteľne caddy/coturn render |

**Tok TURN secretu:** `.env:TURN_SECRET` → `deploy.sh:73` (grep, bez logu) → `/etc/turnserver.conf:static-auth-secret` (deploy.sh:82,86-87). Generátor očakáva rovnaký `TURN_SECRET` v prostredí volajúceho (nie automaticky z `.env`).

---

## 3. Nálezy

### N-01 — Klient nepoužíva ICE servers / TURN (chýbajúca implementácia)
- **Súbor a riadok:** `web/publish.js:154,157,88`; `web/viewer.js:129,81,62` (grep: žiadne `iceServers`)
- **Dôkaz:** `device = new mediasoupClient.Device()` bez konfigurácie; `device.createSendTransport(params)` / `createRecvTransport(params)` dostávajú iba parametre zo servera (`createWebRtcTransport` → `iceParameters/iceCandidates/dtlsParameters`). Žiadny mechanizmus na prijatie TURN/STUN.
- **Dopad:** Za NAT/reštriktívnymi sieťami (typický produkčný prípad) spojenie zlyhá; nasadený coturn nebude využitý. Lokálne/LAN testy môžu prechádzať.
- **Priorita:** **P0 – kritický blokátor produkčnej pripravenosti**
- **Odporúčaná oprava:** (dokumentačne; mimo tohto reportu sa nemení kód) pridať doručenie `iceServers` (STUN/TURN, krátkodobé TURN REST credentials) klientom cez signalizačnú odpoveď/event alebo bezpečný endpoint a použiť ich pri `create*Transport`/Device; podporiť `turn:...?transport=udp` aj `tcp`.

### N-02 — Žiadny mechanizmus doručenia krátkodobých TURN credentials klientovi
- **Súbor a riadok:** `deploy/turn-credentials/generate-turn-credentials.sh:1-37`; `web/publish.js`, `web/viewer.js` (bez fetch/eventu pre ICE config)
- **Dôkaz:** generátor existuje, ale neexistuje server-side endpoint ani WS správa, ktorá by klientovi bezpečne poskytla `iceServers` + časovo obmedzené credentials; klient ich nevie prijať (N-01).
- **Dopad:** TURN REST (HMAC) nemožno v praxi použiť bez úniku statických údajov alebo bez novej implementácie.
- **Priorita:** **P0**
- **Odporúčaná oprava:** navrhnúť serverom vydávané krátkodobé credentials (per-session/user) a klientskú integráciu; `TURN_SECRET` nesmie byť v prehliadači.

### N-03 — Žiadna obnova spojenia (reconnect/ICE restart) v klientovi
- **Súbor a riadok:** `web/publish.js:137-148,184-195`; `web/viewer.js:104-121,142-150`; `web/rpc.js` (close → reject)
- **Dôkaz:** pri `roomClosed/peerLeft` sa UI/streamy čistia, ale nie je automatický WS reconnect, ICE restart ani znovuvytvorenie transportov/producerov/consumerov pri výpadku siete.
- **Dopad:** nestabilné siete → trvalý pád relácie bez automatickej obnovy.
- **Priorita:** **P1**
- **Odporúčaná oprava:** implementovať reconnect stratégiu (WS backoff, re-join, ICE restart podľa možností protokolu).

### N-04 — Health-check neoveruje pripravenosť mediasoup workeru
- **Súbor a riadok:** `deploy/scripts/health-check.sh:18-27`; (správanie servera) `backend/src/index.js` health vracia `ok:true` a počas štartu môže byť `media.workerAlive=false` (placeholder) — overené z kódu servera v predchádzajúcich auditoch.
- **Dôkaz:** skript akceptuje akékoľvek `ok==True` (`print(d.get('ok','False'))`) bez kontroly `media.workerAlive`.
- **Dopad:** deploy môže prehlásiť úspech skôr, než je media rovina pripravená.
- **Priorita:** **P1**
- **Odporúčaná oprava:** čakať/opakovať a vyžadovať `ok==true` a `media.workerAlive==true` (s timeoutom).

### N-05 — Rollback je mechanický (HEAD~1) a nepokrýva konfiguráciu
- **Súbor a riadok:** `deploy/scripts/rollback.sh:27,29,36-47`
- **Dôkaz:** `git checkout HEAD~1` bez výberu známej dobrej verzie; pri zlyhaní checkoutu reštartuje aktuálnu (možno zlú) službu (`:29`); neobnovuje `/etc/systemd/system/cmep-streaming.service`, `/etc/caddy/Caddyfile`, `/etc/turnserver.conf`, `/opt/cmep-streaming/.env`.
- **Dopad:** môže obnoviť nesprávny/rozbitý commit alebo zanechať nekonzistentnú konfiguráciu vs. kód.
- **Priorita:** **P1**
- **Odporúčaná oprava:** rollback na tag/explicitný commit „last known good“, snapshot/obnova deployovaných configov, bezpečné zlyhanie bez automatického štartu neznámeho stavu.

### N-06 — `deploy.sh`: chýbajúce adresáre v `ReadWritePaths`
- **Súbor a riadok:** `deploy/scripts/deploy.sh:20-21`; `deploy/systemd/cmep-streaming.service:23`
- **Dôkaz:** deploy vytvára `/var/log/cmep-streaming`, `/var/lib/cmep-streaming/recordings`, ale nevytvára `$ROOT/runtime`, `$ROOT/logs`, `$ROOT/recordings`, `$ROOT/tmp`, ktoré sú v `ReadWritePaths` (s `ProtectSystem=full` môžu chýbajúce cesty spôsobiť problémy štartu/písania).
- **Dopad:** potenciálne zlyhanie služby alebo zapisovania po prvom nasadení.
- **Priorita:** **P1**
- **Odporúčaná oprava:** `mkdir -p "$ROOT/runtime" "$ROOT/logs" "$ROOT/recordings" "$ROOT/tmp"` + správne vlastníctvo.

### N-07 — `deploy.sh`: idempotencia a správanie pri zlyhaní
- **Súbor a riadok:** `deploy/scripts/deploy.sh:24-32,35-43,60-66,71-76,95-109`
- **Dôkaz:** `.env` sa neprepisuje ak existuje (35-43, OK pre secrets) ale ak je vytvorený z template (37) a zostane s placeholdermi, skript aj tak pokračuje a štartuje službu (101) → pri `NODE_ENV=production` očakávateľné zlyhanie (config guard). Firewall sa nespúšťa automaticky (96). `chown -R ... "$ROOT"` (21) po git operáciách ako root môže pri rerune narážať na git ownership/safe.directory. Žiadna atomická kontrola „pripravenosti“ pred `systemctl start`.
- **Dopad:** opakované spustenie nie je plne bezpečné/deterministické; čiastočné nasadenie môže skončiť nefunkčnou službou.
- **Priorita:** **P1**
- **Odporúčaná oprava:** preflight validácia `.env` (žiadne placeholdery pre povinné hodnoty), explicitný poriadok, `set -e` zachovaný ale s kontrolami, ošetrenie git ownership, vytvorenie runtime/logs dirs.

### N-08 — Caddy: `file_server` je nedosiahnuteľný; doména placeholder
- **Súbor a riadok:** `deploy/caddy/Caddyfile:7,17-34`
- **Dôkaz:** catch-all `reverse_proxy localhost:8504` (17) obslúži všetky požiadavky pred `file_server` (29); `@health` (32-33) je redundantný. Doména `streaming.cmep.example.com` je placeholder.
- **Dopad:** mätúca konfigurácia (duplicitné cesty servovania statík), riziko nasadenia bez zmeny domény; funkčne Node servuje static (`http.js`).
- **Priorita:** **P2**
- **Odporúčaná oprava:** zjednodušiť (buď proxy všetko na Node, alebo matcher-based routing), vyžadovať reálnu doménu pred deployom.

### N-09 — README je nekonzistentný s firewallom (chýbajú TURN porty)
- **Súbor a riadok:** `deploy/README.md:25` vs `deploy/firewall/ufw-rules.sh:27-31`
- **Dôkaz:** README uvádza „TCP 80, 443, 60000–60100; UDP 60000–60100, 3478“ (chýba 3478/tcp, 5349/tcp, 49152-65535/udp+tcp), zatiaľ čo firewall ich otvára.
- **Dopad:** nesprávne otvorené porty pri manuálnom postupe podľa README → nefunkčný TURN.
- **Priorita:** **P2**
- **Odporúčaná oprava:** zosúladiť README s UFW/coturn.

### N-10 — `FINAL_DEPLOYMENT_AUDIT.md` obsahuje neaktuálne/nekonzistentné informácie
- **Súbor a riadok:** `deploy/FINAL_DEPLOYMENT_AUDIT.md:15-17,72,168-170,223`
- **Dôkaz:** uvádza „HMAC-SHA256“ a `use-auth-secret=<TURN_SECRET>` v starom kontexte, pričom aktuálna implementácia je TURN REST (HMAC-SHA1) s `use-auth-secret` + `static-auth-secret` (`coturn/turnserver.conf:16-17`, `generate-turn-credentials.sh:4-6,29`). Kroky nasadenia kopírujú coturn šablónu manuálne (168-170), ale `deploy.sh` ju teraz generuje (68-89). Nejasná sekcia „✅ Pridané/Opravené“ voči súčasnému stavu.
- **Dopad:** operátor môže postupovať podľa zastaraných krokov a rozbiť TURN/TLS.
- **Priorita:** **P2**
- **Odporúčaná oprava:** aktualizovať alebo označiť ako historický; jediný zdroj pravdy zosúladiť s aktuálnymi súbormi.

### N-11 — Systemd: hardcoded cesta k Node, chýbajúce adresáre
- **Súbor a riadok:** `deploy/systemd/cmep-streaming.service:12,23`
- **Dôkaz:** `ExecStart=/usr/bin/node ...` (môže byť inde na cieľovom systéme); `ReadWritePaths` obsahuje `.../tmp` (neisté vytvorenie).
- **Dopad:** služba nemusí naštartovať na odlišnej distribúcii/instalácii Node.
- **Priorita:** **P2**
- **Odporúčaná oprava:** overiť cestu (`/usr/bin/env node` alebo detekcia) a zabezpečiť existenciu všetkých RW ciest.

### N-12 — Firewall: široký relay rozsah (prevádzkové riziko)
- **Súbor a riadok:** `deploy/firewall/ufw-rules.sh:30-31`
- **Dôkaz:** otvorené `49152:65535` UDP aj TCP (potrebné pre coturn relay `coturn/turnserver.conf:24-25`).
- **Dopad:** veľká plocha expozície (nevyhnutné pre TURN), ale nevystavuje interné porty 8504/8502/7120-7133 (OK).
- **Priorita:** **P3** (informačné)
- **Odporúčaná oprava:** ponechať, prípadne zúžiť podľa záťaže a coturn nastavení; monitorovať.

---

## 4. Idempotencia a spoľahlivosť deploy/rollback (bod 4,5)

- **Opakované spustenie deploy.sh:** čiastočne idempotentné (git update, npm ci, kopírovanie unit/caddy, regen coturn pri splnených podmienkach, enable service). Riziká: placeholder `.env` + štart služby (N-07), chýbajúce mkdir pre RW paths (N-06), git ownership.
- **Existujúca coturn konfigurácia:** prepis `/etc/turnserver.conf` ak `turnserver` existuje a env hodnoty nie sú placeholdery (deploy.sh:71-90) — OK, ale bez zálohy.
- **Existujúca systemd služba:** `cp` + `daemon-reload` + `enable` (56-58) — idempotentné.
- **Zlyhanie uprostred:** `set -euo pipefail` zastaví, ale stav môže zostať čiastočný (napr. nainštalované deps bez reštartu, alebo naopak).
- **Ochrana secretov:** `.env` chmod 600 a neprepisuje sa (35-39); coturn conf 600 (81-87); deploy neechouje secret hodnoty (grep do premenných) — **OK**.
- **Rollback:** obnoví kód na `HEAD~1` a deps, nie „known good“ a nie konfigurácie mimo repo (N-05).

---

## 5. Sieťová expozícia (bod 6,7)

- **Caddy → Node:** `localhost:8504` (caddy:17) zodpovedá `SIGNALING_PORT=8504` (env template:11, config default). **Správne** (overené konfiguračne).
- **Systemd → Node:** spúšťa Node v `/opt/cmep-streaming`, počúva na `SIGNALING_HOST=0.0.0.0:8504` (env:10-11) — prístup zvonka má byť iba cez Caddy/443 pri správnom UFW. **Správne navrhnuté**.
- **Firewall:** povoľuje potrebné verejné porty (443/80, 60000-60100, 3478/5349, 49152-65535) a neotvára 8504/8502/7120-7133. **OK** (s výhradou N-09 v dokumentácii).

---

## 6. Rozdelenie výsledkov

### A. Už hotové a overené
- TURN REST auth implementácia a lokálny test: 9/9 PASS (`deploy/TURN_AUTH_VERIFICATION.md:46-60`, `test-turn-auth.sh`).
- Coturn šablóna: `use-auth-secret` + `static-auth-secret`, bez `user=`, relay rozsah 49152-65535 (`coturn/turnserver.conf:16-17,24-25,36`).
- Generátor credentials: formát `timestamp:userid`, `Base64(HMAC-SHA1)` (`generate-turn-credentials.sh:25-29`).
- UFW pokrýva 3478/5349 aj relay 49152-65535 (`ufw-rules.sh:27-31`).
- Bezpečné renderovanie `/etc/turnserver.conf` (chmod 600, bez logovania secretu) v `deploy.sh:81-89`.
- Backend regresné testy 29/29 PASS (kontext, neopakované).

### B. Hotové, ale iba lokálne overené
- Celý deploy/rollback flow (nebežal na čistom VPS).
- Coturn/TLS/Caddy v reálnej sieti, verejná UDP/TCP dostupnosť, NAT traversal.
- Mediasoup worker na cieľovom Linux x86_64 (v repozitári je Android/Termux binárka; na VPS očakávané stiahnutie cez `npm ci` — overiteľné až tam).

### C. Chýbajúca implementácia
- Klient: `iceServers`/TURN konfigurácia, doručenie krátkodobých credentials (N-01, N-02).
- Klient: reconnect/ICE restart (N-03).
- Health-check: kontrola `media.workerAlive`/wait-ready (N-04).
- Deploy: preflight validácia env/dirs, robustnejšia idempotencia (N-06, N-07).
- Rollback: „known good“ stratégia a obnova configov (N-05).

### D. Blokátory pred kúpou VPS
1. **P0:** Chýba klientská integrácia TURN/ICE a spôsob bezpečného doručenia krátkodobých credentials (N-01, N-02) — bez toho nie je overiteľná produkčná použiteľnosť za NAT.
2. **P1:** Health-check nepotvrdzuje worker pripravenosť (N-04) a rollback nie je spoľahlivý (N-05) — prevádzkové riziko nasadenia.
3. **P1:** Deploy skript vyžaduje dotiahnutie (dirs/preflight/idempotencia) (N-06, N-07).
4. **P2:** Dokumentačné nekonzistencie (README/FINAL_DEPLOYMENT_AUDIT) môžu viesť k chybnému postupu (N-09, N-10).

### E. Kroky po získaní VPS
- Linux x86_64 VPS + verejná IPv4; DNS A záznam na doménu.
- Nainštalovať Node 20+, npm, git, Caddy, coturn, ufw, python3, openssl.
- Vyplniť `/opt/cmep-streaming/.env` (bez placeholderov): `SESSION_SIGNING_SECRET`, `ANNOUNCED_IP`, `PUBLIC_ORIGIN`, `CMEP_*`, `TURN_SECRET`, `TURN_REALM`.
- Nastaviť doménu v `deploy/caddy/Caddyfile`; TLS (ACME) overiť po DNS.
- Spustiť `deploy.sh`, potom `ufw-rules.sh`; overiť `/healthz`, worker, systemd/coturn status.
- Overiť TURN (UDP/TCP/TLS 3478/5349, relay) a WebRTC E2E cez verejnú sieť.
- Na CMEP platforme (Render) nastaviť zhodné: `CMEP_STREAMING_SIGNING_SECRET == SESSION_SIGNING_SECRET`, `CMEP_INTERNAL_API_KEY`, `CMEP_STREAMING_PUBLIC_URL/INTERNAL_URL`, `CMEP_PLATFORM_URL` dosiahnuteľné.

---

## 7. Verdikt

**NOT READY FOR VPS**

**Dôvody (blokujúce):** P0 chýbajúca klientská podpora ICE/TURN a doručenie krátkodobých credentials (N-01, N-02); P1 nedostatočný health-check pripravenosti (N-04), nespoľahlivý rollback (N-05) a neúplná idempotencia/preflight deployu (N-06, N-07). Balík je vhodný ako základ infra konfigurácie (TURN REST auth lokálne overená), ale nie je pripravený na spoľahlivé produkčné nasadenie bez doplnenia vyššie uvedeného.
