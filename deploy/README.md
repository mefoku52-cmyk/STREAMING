# CMEP Streaming — VPS Deployment

Samostatné produkčné nasadenie streamovacieho servera na Linux VPS s verejnou IPv4.
CMEP API (waste-platform) zostáva externe; tento streamingový server je samostatná služba.

## Štruktúra

| Cesta | Účel |
|---|---|
| `deploy/systemd/cmep-streaming.service` | systemd unit (Env: `/etc/cmep-streaming.env`, state: `/var/lib/cmep-streaming`) |
| `deploy/caddy/Caddyfile` | HTTPS/WSS reverzný proxy na `127.0.0.1:8504` s automatickým TLS |
| `deploy/coturn/turnserver.conf` | šablóna coturn TURN REST (`use-auth-secret` + `static-auth-secret`, secret sa dosadí pri deployi) |
| `deploy/firewall/ufw-rules.sh` | Firewall pravidlá (presné porty) |
| `deploy/env/.env.production.template` | Šablóna produkčných env premenných (bez tajomstiev) |
| `deploy/scripts/check-worker.sh` | Kontrola dostupnosti mediasoup workeru |
| `deploy/scripts/health-check.sh` | Liveness/readiness health-check (`/healthz`, `/health` + `ready` + `media.workerAlive`) |
| `deploy/scripts/deploy.sh` | Preflight + idempotentné release nasadenie (vyžaduje platný env; neničí existujúci env/recordings/runtime pri opakovaní bez source env) |
| `deploy/scripts/rollback.sh` | Návrat na explicitnú predchádzajúcu release (`/var/lib/cmep-streaming/releases/previous` alebo argument) |
| `deploy/turn-credentials/generate-turn-credentials.sh` | TURN REST credential helper (HMAC-SHA1/Base64, formát `expiry:userid`) |

## Požiadavky na VPS

- Linux x86_64 (mediasoup prebuilt worker), verejná IPv4, DNS na doménu
- Node.js 20+, npm, python3, rsync, curl, systemd, caddy, coturn
- Otvorené porty: TCP 80,443,3478,5349,60000–60100; UDP 3478,60000–60100,49152–65535 (coturn relay)

## Konfigurácia

- Skopírujte `deploy/env/.env.production.template` na server ako zdroj `deploy/env/.env.production` (alebo priamo `/etc/cmep-streaming.env`) a vyplňte reálne hodnoty (žiadne `VÁŠ_*`/`REPLACE_*`).
- Povinné: `SESSION_SIGNING_SECRET`, CMEP http adapter kľúče pri `CMEP_ADAPTER=http`.
- TURN: `TURN_SECRET`, `TURN_REALM`, verejné `TURN_URLS`/`TURN_STUN_URLS` (klient dostáva iba krátkodobé serverom vydané credentials cez signaling; secret nikdy neopúšťa server).
- `deploy.sh` pred akoukoľvek systémovou zmenou vykoná preflight povinných príkazov a konfigurácie; pri chýbajúcej/placeholder konfigurácii zlyhá.

## Nasadenie a rollback

- Nasadenie: `sudo deploy/scripts/deploy.sh` (vytvorí release v `/var/lib/cmep-streaming/releases/<id>`, aktivuje symlink `/opt/cmep-streaming`, reštartuje služby, čaká na readiness).
- Rollback: `sudo deploy/scripts/rollback.sh [release_path]` (prepne symlink na známu release a overí readiness). Nie je založené na `git HEAD~1`.
- Opakovaný deploy nesmie prepisovať existujúci `/etc/cmep-streaming.env` ak nie je dodaný nový source env; recordings/runtime/logs ostávajú mimo release adresára.

## Poznámky

- TURN credentials sú časovo obmedzené (TURN REST), vydávané server-side autorizovaným účastníkom relácie.
- Web klient podporuje serverom dodané `iceServers` a ICE restart/reconnect; plné overenie reálneho NAT traversal vyžaduje verejnú VPS, DNS/TLS a coturn v produkčnej sieti.
