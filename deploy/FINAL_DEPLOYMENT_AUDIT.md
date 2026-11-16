# CMEP Streaming — Finanálny audit deployment balíka (pred VPS)

Tento dokument obsahuje kompletný technický audit adresára `deploy/` pred nasadením na čistý Linux VPS x86_64. Žiadny deployment nebol vykonaný, žiadne externé služby neboli kontaktované.

---

## 1. Zistené chyby a ich presné umiestnenie

### Chyba 1: `deploy/coturn/turnserver.conf:35` — neplatná coturn direktíva `no-auth?`
**Popis:** Riadok `no-auth? # zakomentované — vyžadujeme auth cez user= vyššie` nie je platná coturn konfiguračná direktíva. Coturn by pri štarte zlyhal s chybou neznámej možnosti.
**Opravené:** Áno — odstránené, nahradené komentárom.
**Umístenie:** `deploy/coturn/turnserver.conf` riadok 35 (pred opravou).

### Chyba 2: `deploy/coturn/turnserver.conf` — chýbajúca direktíva `use-auth-secret`
**Popis:** Skript `deploy/turn-credentials/generate-turn-credentials.sh` generuje HMAC-SHA256 credentials pomocou `TURN_SECRET` kľúča. Coturn tieto credentials vie overiť iba s direktívou `use-auth-secret=<TURN_SECRET>`. V pôvodnej konfigurácii chýbala.
**Opravené:** Áno — pridané `use-auth-secret=<TURN_SECRET>`.
**Umístenie:** `deploy/cotutn/turnserver.conf`.

### Chyba 3: `deploy/coturn/turnserver.conf:19` — konflikt `user=` vs `use-auth-secret`
**Popis:** Riadok `user=<TURN_USERNAME>:<TURN_PASSWORD>` definuje statické heslo, zatiaľ čo `generate-turn-credentials.sh` generuje časovo-obmedzené HMAC credentials. Coturn tieto dva spôsoby autentifikácie pre jeden realm nevie kombinovať čisto — statické `user=` by prepísalo alebo konfliktovalo s `use-auth-secret`.
**Opravené:** Áno — `user=` odstránené, bleibt len `use-auth-secret`.
**Umístenie:** `deploy/coturn/turnserver.conf` riadok 19 (pred opravou).

### Chyba 4: `deploy/firewall/ufw-rules.sh` — chýbajú coturn relay porty
**Popis:** Firewall otváral iba TURN control porty (3478 UDP/TCP, 5349 TCP), ale **nie** coturn relay rozsah 49152–65535 (UDP/TCP), ktorý je definovaný v `turnserver.conf` (`min-port=49152`, `max-port=65535`). Bez týchto portov TURN relay media prestavky neprejde.
**Opravené:** Áno — pridané `ufw allow 49152:65535/udp` a `ufw allow 49152:65535/tcp`.
**Umístenie:** `deploy/firewall/ufw-rules.sh` (sekcia coturn).

### Chyba 5: `deploy/env/.env.production.template` — chýbajúca premenná `TURN_SECRET`
**Popis:** `generate-turn-credentials.sh` vyžaduje env premennú `TURN_SECRET`, ale šablóna `.env.production.template` ju neobsahovala. Používateľ by nevieľ, akú hodnotu vyplniť.
**Opravené:** Áno — pridané `TURN_SECRET=VÁŠ_32_ZNAKOV_TURN_TAJNÝ_KLÚČ`.
**Umístenie:** `deploy/env/.env.production.template` (pred sekciou CMEP HTTP adaptér).

### Chyba 6: `deploy/caddy/Caddyfile` — redundantné `Connection`/`Upgrade` headers
**Popis:** Manuálne nastavenie `header_up Connection {connection}` a `header_up Upgrade {upgrade}` v `reverse_proxy` blokoch je redundantné — Caddy WebSocket upgrade handleruje natívne. Manuálne nastavenie týchto headerov môže spôsobiť konflikt a zlyhanie WebSocket pripojenia.
**Opravené:** Áno — odstránené, ponechané len `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.
**Umístenie:** `deploy/caddy/Caddyfile` riadky 21-22 (pred opravou).

---

## 2. Bezpečnostné riziká

| # | Riziko | Umístenie | Mitigácia |
|---|--------|-----------|-----------|
| 1 | `SESSION_SIGNING_SECRET` v `.env` s hodnotou `VÁŠ_32_ZNAKOV_TAJNÝ_KLÚČ` (placeholder) | `deploy/env/.env.production.template` | Používateľ musí nahraďte skutočnou hodnotou ≥32 znakov pred spustením. `.env` je v `.gitignore`. |
| 2 | `CMEP_INTERNAL_API_KEY` placeholder | `deploy/env/.env.production.template` | Musí byť zhodné s platformou, nie je v Gite. |
| 3 | `TURN_SECRET` placeholder | `deploy/env/.env.production.template` | Musí byť unikátne, ≥32 znakov. |
| 4 | `SIGNALING_HOST=0.0.0.0` vystavuje Node server priamo na všetkých rozhraniach | `deploy/env/.env.production.template` | Firewall blokuje port 8504 z verejného internetu (povolený len 443 cez Caddy). Caddy proxyuje na `localhost:8504`. |
| 5 | `ProtectSystem=full` v systemd — zapisovacie cesty musia byť presné | `deploy/systemd/cmep-streaming.service` | `ReadWritePaths` zahŕňa `runtime`, `logs`, `recordings`, `tmp`. Ak sa pridajú ďalšie zapisovacie adresáre, treba ich doplniť. |
| 6 | Coturn logy obsahujú verbose výstup (`verbose`) | `deploy/coturn/turnserver.conf` riadok 31 | Môže obsahovať citlivé metaúdaje. Pre produkciu zvážiť `quiet` alebo `log-file` s prístupovými právami. |
| 7 | Caddyfile obsahuje `email off` — žiadne upozornenia na expiraciu certifikátov | `deploy/caddy/Caddyfile` riadok 2 | Používateľ by mal nastaviť skutočný e-mail pre Let's Encrypt upozornenia. |

---

## 3. Chýbajúce nastavenia

| Nastavenie | Umístenie | Poznámka |
|---|---|---|
| `TURN_SECRET` | `deploy/env/.env.production.template` | ✅ Pridané pri audite |
| `use-auth-secret` | `deploy/coturn/turnserver.conf` | ✅ Pridané pri audite |
| Coturn relay porty vo firewalli | `deploy/firewall/ufw-rules.sh` | ✅ Pridané pri audite |
| Predpoklady: Node.js, npm, Caddy, coturn, ufw nainštalované | `deploy/scripts/deploy.sh` | Chýba overenie a inštalácia prerequisít. Skript len varuje ak Caddy chýba. |
| Caddy e-mail pre Let's Encrypt | `deploy/caddy/Caddyfile` | `email off` — používateľ by mal nahraďte skutočným e-mailom. |
| TURN certifikáty pre port 5349 | `deploy/coturn/turnserver.conf` riadky 13-14 | Zakomentované — voliteľné, pre TURN/TLS. |

---

## 4. Konflikty medzi konfiguračnými súbormi (opravené)

| Konflikt | Pred opravou | Po oprave |
|---|---|---|
| `turnserver.conf` `user=` vs `generate-turn-credentials.sh` HMAC | `user=<TURN_USERNAME>:<TURN_PASSWORD>` + žiadne `use-auth-secret` | `use-auth-secret=<TURN_SECRET>`, bez `user=` |
| `turnserver.conf` `no-auth?` neplatná direktíva | Zpôsobila by chybu štartu coturn | Odstránené |
| Firewall chýbal coturn relay 49152–65535 | TURN relay media by neprešlo | Pridané `ufw allow 49152:65535/udp,tcp` |
| `.env.production.template` chýbalo `TURN_SECRET` | `generate-turn-credentials.sh` by zlyhalo s `TURN_SECRET` unset | Pridané `TURN_SECRET=...` |
| Caddy `Connection`/`Upgrade` headers | Mohli by rozbíjať WebSocket | Odstránené |

---

## 5. Čo je už pripravené (žiadne zmeny potrebné)

| Komponent | Stav | Dôkaz |
|---|---|---|
| Git repozitár (clean, `main`) | ✅ | `git status --short` prázdny, HEAD `3a761827` |
| Aplikačný kód (backend/src, web, scripts) | ✅ | Žiadne zmeny, 29/29 testov pass |
| Mediasoup worker postinstall | ✅ | `npm ci` stiahne správny Linux x86_64 prebuilt |
| systemd graceful shutdown (SIGTERM) | ✅ | `backend/src/index.js:128-140` obsluhuje SIGTERM, exit 0 |
| Health endpoint `/healthz` | ✅ | `backend/src/http.js:37-41`, vracia `ok=true` |
| CMEP HTTP adaptér (fail-closed) | ✅ | `backend/src/adapter/http-adapter.js`, verify pred každou akciou |
| Runtime lock (single instance) | ✅ | `backend/src/index.js:27-48`, PID+cwd overenie |
| Produkčné guard na `SESSION_SIGNING_SECRET` | ✅ | `backend/src/config.js:17-18`, vyhadzuje chybu ak <32 znakov v produkcii |

---

## 6. Čo sa musí opraviť pred VPS (používateľská akcia)

1. **`deploy/env/.env.production.template`** — skopírovať do `/opt/cmep-streaming/.env`, nahraď všetky `VÁŠ_...` placeholdery skutočnými hodnotami:
   - `SESSION_SIGNING_SECRET` (≥32 znakov, unikátne, zhodné s `CMEP_STREAMING_SIGNING_SECRET` na waste-platform)
   - `CMEP_INTERNAL_API_KEY` (≥32 znakov, zhodné s platformou)
   - `CMEP_PLATFORM_URL` (skutočná URL waste-platform FastAPI)
   - `ANNOUNCED_IP` (verejná IPv4 VPS)
   - `PUBLIC_ORIGIN` (skutočná doména, napr. `https://streaming.cmep.example.com`)
   - `TURN_SECRET` (≥32 znakov, unikátne)

2. **`deploy/caddy/Caddyfile`** — nahraď `streaming.cmep.example.com` skutočnou domenou; zváži nastavenie `email` namiesto `email off`.

3. **`deploy/coturn/turnserver.conf`** — nahraď `<VPS_PUBLIC_IP>` a `<TURN_REALM>` skutočnými hodnotami; odkomentuj certifikáty ak používaš TURN/TLS na porte 5349.

4. **Nainštaluj prerequisity na VPS** pred spustením `deploy.sh`: Node.js 20+, npm, Caddy, coturn, ufw, python3 (pre health-check).

5. **Klientská TURN integracia (voliteľné, doporučené):** `web/publish.js` a `web/viewer.js` momentálne neposielajú žiadne `iceServers`. Pre produkčné TURN relay je nutné pridať `iceServers` do `mediasoupClient.Device()` konfigurácie. **Toto je zmena existujúceho aplikačného kódu — dokumentovaná, ale nevykonaná** (podľa zákazu neupravovať aplikáciu).

---

## 7. Čo sa dá bezpečne otestovať až po vytvorení VPS

| Test | Požiadavka | Spôsob overenia |
|------|-----------|-----------------|
| HTTPS/WSS dostupnosť | Verejná doména + DNS A záznam | `curl https://streaming.<domena>/healthz` |
| Verejná UDP 60000–60100 | Firewall otvorené | `nmap -sU -p 60000-60100 <VPS_IP>` |
| TURN relay (3478, 49152–65535) | coturn nainštalovaný a spustený | `turnutils_uclient` alebo browser WebRTC test |
| TURN/TLS (5349) | Certifikáty konfigurované | `openssl s_client -connect <VPS_IP>:5349` |
| Mediasoup worker na Linux x86_64 | `npm ci` spustený | `deploy/scripts/check-worker.sh` |
| Publisher → viewer (skutočné WebRTC) | Dva prehliadače, verejná IP | Browser E2E test (`scripts/browser-test.sh`) |
| Viewer → publisher audio | Mikrofón viewera | Browser E2E test |
| CMEP API komunikácia | waste-platform na Renderi, `CMEP_PLATFORM_URL` dosiahnuteľné | `cmep-live-e2e.test.js` s produkčnou platformou |
| Ukončenie miestností + lock release | SIGTERM na službu | `systemctl stop cmep-streaming`, skontrolovať `runtime/server.lock` |

---

## 8. Presný postup nasadenia (v správnom poradí)

```
0. Pred nasadením (lokálne, bez VPS):
   - Skontrolovať git status (clean tree)
   - Overiť, že 29/29 testov prejde: cd backend && node --test test/*.test.js

1. Na VPS (ako root):
   - useradd --system --create-home --shell /usr/bin/nologin cmep-streaming
   - Nainštalovať: Node.js 20+, npm, Caddy, coturn, ufw, python3

2. Naklonovať repo:
   - git clone --branch main https://github.com/mefoku52-cmyk/STREAMING.git /opt/cmep-streaming
   - chown -R cmep-streaming:cmep-streaming /opt/cmep-streaming

3. Prostredie:
   - cp deploy/env/.env.production.template /opt/cmep-streaming/.env
   - Upraviť všetky VÁŠ_... placeholdery (pozri sekciu 6)
   - chown cmep-streaming:cmep-streaming /opt/cmep-streaming/.env
   - chmod 600 /opt/cmep-streaming/.env

4. Závislosti:
   - cd /opt/cmep-streaming/backend
   - npm ci --omit=dev      (stiahne Linux x86_64 mediasoup worker)
   - bash deploy/scripts/check-worker.sh

5. Systemd:
   - cp deploy/systemd/cmep-streaming.service /etc/systemd/system/
   - systemctl daemon-reload
   - systemctl enable cmep-streaming

6. Caddy:
   - cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
   - Upraviť doménu a e-mail v Caddyfile
   - systemctl enable --now caddy

7. coturn:
   - cp deploy/coturn/turnserver.conf /etc/turnserver.conf
   - Upraviť <VPS_PUBLIC_IP>, <TURN_REALM>, <TURN_SECRET>
   - systemctl enable --now coturn

8. Firewall:
   - bash deploy/firewall/ufw-rules.sh

9. Spustiť službu:
   - systemctl start cmep-streaming
   - sleep 2
   - SIGNALING_PORT=8504 SIGNALING_HOST=127.0.0.1 bash deploy/scripts/health-check.sh
```

---

## 9. Presný postup aktualizácie a rollbacku

### Aktualizácia (re-deploy)
```
cd /opt/cmep-streaming
git fetch origin
git checkout main
git merge --ff-only origin/main
cd backend
npm ci --omit=dev
bash deploy/scripts/check-worker.sh
systemctl restart cmep-streaming
sleep 2
SIGNALING_PORT=8504 SIGNALING_HOST=127.0.0.1 bash deploy/scripts/health-check.sh
```

### Rollback (návrát na predchádzajúcu verziu)
```
systemctl stop cmep-streaming
cd /opt/cmep-streaming
git fetch origin
# Poznámka: deploy/rollback.sh používa mechanický HEAD~1.
# Pre bezpečnejší rollback použite tag alebo známy dobrý commit:
git checkout <znamy-dobry-commit>
cd backend
npm ci --omit=dev
bash deploy/scripts/check-worker.sh
systemctl start cmep-streaming
sleep 2
SIGNALING_PORT=8504 SIGNALING_HOST=127.0.0.1 bash deploy/scripts/health-check.sh
```

**Poznámka k rollbacku:** `deploy/rollback.sh` vracia na `HEAD~1` (mechanicky). Ak je `HEAD~1` aj rozbitý, rollback zlyhá. Pre produkciu odporúčame tagovať funkčné verzie (`git tag v1.0.0`) a rollbackovať na konkrétny tag namiesto `HEAD~1`.

---

## 10. Zhrnutie zmien v deploy/ počas auditu

| Súbor | Zmena | Dôvod |
|---|---|---|
| `deploy/coturn/turnserver.conf` | Odstránené `no-auth?`, pridané `use-auth-secret=<TURN_SECRET>`, odstránené `user=<TURN_USERNAME>:<TURN_PASSWORD>` | Neplatná direktíva, chýbajúca overovacia direktíva, konflikt autentifikácii |
| `deploy/firewall/ufw-rules.sh` | Pridané `49152:65535/udp` a `49152:65535/tcp` | Chýbajúce coturn relay porty |
| `deploy/env/.env.production.template` | Pridané `TURN_SECRET=VÁŠ_32_ZNAKOV_TURN_TAJNÝ_KLÚČ` | Chýbajúca premenná pre generate-turn-credentials.sh |
| `deploy/caddy/Caddyfile` | Odstránené `header_up Connection` a `header_up Upgrade` | Redundantné s natívnym Caddy WebSocket handlingom |

**Žiadne existujúce aplikačné súbory (`backend/src/`, `web/`, `scripts/`) neboli menené.**
**Žiadny commit, push alebo deploy nebol vykonaný.**

---

## Príloha: Výsledky regresných testov (spustené lokálne, 29/29 pass)

```
✔ issued token verifies and carries claims
✔ expired token is rejected
✔ token signed with different secret is rejected
✔ tampered payload is rejected
✔ malformed inputs are rejected
✔ missing sub is rejected at issuance
✔ cross-service CMEP live inspection E2E (platform <-> streaming)
✔ config uses loopback defaults
✔ required CMEP event types are whitelisted
✔ emit passes sanitized event to adapter
✔ unknown event type is rejected
✔ adapter failure does not break the caller
✔ authenticate: valid claims pass, invalid rejected
✔ canCreateInspection: platform ok=true → allowed, correct room binding
✔ canCreateInspection: fail-closed na 500, ok=false, nesvizskom platformy
✔ canJoinInspection: viewer viazanosť na room.offerId a acceptedViewer
✔ canRecord: len publisher s rec=1 a platným súhlasom na platforme
✔ recordSessionEvent: POST s idempotencným eventUid, retry na 5xx
✔ recordSessionEvent: perzistentná chyba nevyhadzuje (best-effort), vráti ok:false
✔ HttpAdapter: bez konfigurácie fail-closed (konštruktor zlyhá)
✔ createAdapter: local mode funguje ako predtým, http mode dostane env config
✔ server http-mode integration: token z platformy, createRoom via verify
✔ server integration: boot, auth, ACL, room lifecycle, shutdown
✔ parses supported request
✔ rejects unsupported method
✔ rejects invalid JSON
✔ create/get/remove lifecycle
✔ unknown id returns null
✔ rooms are isolated

ℹ tests 29
ℹ pass 29
ℹ fail 0
```
