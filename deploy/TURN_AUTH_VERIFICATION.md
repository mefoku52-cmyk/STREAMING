# TURN Auth Verification (coturn TURN REST)

## Rozsah
Overenie a oprava TURN autentifikácie výhradne v `deploy/` (bez zmien v `backend/src/`, `web/`, `waste-platform`, API ani databáze). Žiadny commit, push ani deployment.

## 1. coturn konfigurácia (`deploy/coturn/turnserver.conf`)
- `use-auth-secret` je **samostatná direktíva** (zapína TURN REST režim coturn).
- `static-auth-secret=<TURN_SECRET>` je definovaný a pri nasadení sa nahrádza rovnakým secretom, aký používa generátor credentials (zdroj: `TURN_SECRET` v `.env`).
- **Žiadna konfliktná statická autentifikácia** `user=` nie je prítomná.
- `realm=<TURN_REALM>` je nastavený (dosadený pri nasadení).
- Relay rozsah: `min-port=49152`, `max-port=65535` (zhodné s firewall pravidlami v `deploy/firewall/ufw-rules.sh`).
- Súbor je **šablóna**; finálna `/etc/turnserver.conf` sa generuje pri nasadení (secret sa nedrží v Gite).

## 2. Generátor credentials (`deploy/turn-credentials/generate-turn-credentials.sh`)
Implementácia podľa coturn TURN REST API:
- **Username:** `expiration_timestamp:userid` (UTC unix timestamp, celé sekundy).
- **Password:** `Base64(HMAC-SHA1(secret, username))` — `openssl dgst -sha1 -hmac "$TURN_SECRET" -binary | openssl base64 -A`.
- **Časová platnosť:** vstup `ttl_seconds` (kladné celé číslo), `expiry = now(UTC) + ttl`.
- **Bezpečné spracovanie secretu:** `TURN_SECRET` sa číta z env, nikdy sa nevypisuje na stdout ani do logov; výstup obsahuje iba `username`, `password`, `expiry`, `ttl`.

Použitie:
```bash
TURN_SECRET=<secret> bash deploy/turn-credentials/generate-turn-credentials.sh <userid> <ttl_seconds>
```

## 3. Bezpečný prenos `TURN_SECRET` do coturn (`deploy/scripts/deploy.sh`)
- coturn **nečíta `.env` aplikácie** priamo.
- `deploy.sh` pri nasadení (ak je nainštalovaný `turnserver` a hodnoty sú nastavené):
  - načíta `TURN_SECRET`, `ANNOUNCED_IP`, `TURN_REALM` z `/opt/cmep-streaming/.env` (bez logovania hodnôt),
  - vygeneruje `/etc/turnserver.conf` zo šablóny `deploy/coturn/turnserver.conf` dosadením `<TURN_SECRET>`, `<VPS_PUBLIC_IP>`, `<TURN_REALM>`,
  - nastaví `umask 077`, vlastníka `root:root` a práva `600` na `/etc/turnserver.conf`.
- Secret **nie je v Gite** (`.env` je v `.gitignore`, šablóny obsahujú iba placeholdery), **nie je logovaný** deploy skriptom a cieľový konfiguračný súbor nie je verejne čitateľný (`600`).

Poznámka: `.env.production.template` doplnený o `TURN_REALM` a vysvetlenie, že coturn `.env` nečíta.

## 4. Automatický test (`deploy/turn-credentials/test-turn-auth.sh`)
Test beží lokálne, bez pripojenia k coturn/VPS a bez vypísania secretu. Overuje:
1. `turnserver.conf` obsahuje samostatnú direktívu `use-auth-secret` a definovaný `static-auth-secret`.
2. `turnserver.conf` neobsahuje konfliktné `user=`.
3. Generovaný `username` má formát `expiration_timestamp:userid` a timestamp sa zhoduje s `expiry`.
4. Expirácia je v budúcnosti a zodpovedá TTL (UTC).
5. `password` sa zhoduje s nezávislým výpočtom `Base64(HMAC-SHA1(secret, username))`.
6. `static-auth-secret` v (simulovane nasadenej) konfigurácii sa zhoduje so secretom generátora (porovnanie hashov, bez výpisu secretu).
7. Generátor nevypísal secret do stdout.

### Výsledok behu testu
```
==> TURN REST auth verification (self-contained, bez externých služieb)
PASS  turnserver.conf: use-auth-secret je samostatná direktíva
PASS  turnserver.conf: static-auth-secret je definovaný
PASS  turnserver.conf: bez 'user=' (žiadna konfliktná statická auth)
PASS  username má formát expiration_timestamp:userid
PASS  timestamp v username sa zhoduje s expiry
PASS  expirácia je v budúcnosti a zodpovedá TTL
PASS  password = Base64(HMAC-SHA1(secret, username)) sa zhoduje
PASS  static-auth-secret v (nasadenej) konfigurácii sa zhoduje so secretom generátora
PASS  generátor nevypísal secret do stdout

==> Výsledok: 9 pass, 0 fail
```

## 5. Zmenené súbory v `deploy/` (táto oprava)
- `deploy/coturn/turnserver.conf` — TURN REST šablóna: `use-auth-secret` + `static-auth-secret`, bez `user=`, realm/relay zachované.
- `deploy/turn-credentials/generate-turn-credentials.sh` — prepis na TURN REST (HMAC-SHA1, Base64, `timestamp:userid`, UTC, TTL validácia, bez výpisu secretu).
- `deploy/turn-credentials/test-turn-auth.sh` — nový automatický test.
- `deploy/scripts/deploy.sh` — bezpečné generovanie `/etc/turnserver.conf` zo šablóny (umask 077, chmod 600, bez logovania secretu).
- `deploy/env/.env.production.template` — pridaný `TURN_REALM`, upresnenie že coturn nečíta `.env`.

## 6. Existujúce testy aplikácie
29 existujúcich testov (`backend`: `node --test test/*.test.js`) stále prechádza: **29 pass, 0 fail** (overené po opravách).
