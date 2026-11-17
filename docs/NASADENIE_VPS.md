# Nasadenie na VPS (navod, nie deploy)

## Predpoklady
- Linux x86_64, Node.js 20+, npm, python3, rsync, curl, systemd, caddy, coturn, ufw, ffmpeg (volitelne).

## Postup
1. Skopiruj repozitar na VPS.
2. Nainstaluj zavislosti: `cd backend && npm ci`.
3. Over mediasoup worker: `deploy/scripts/check-worker.sh`.
4. Vytvor `/etc/cmep-streaming.env` z `deploy/env/.env.production.template`.
5. Nastav domenu, DNS A zaznam, TLS cez Caddy.
6. Nakonfiguruj coturn a firewall (ufw-rules.sh).
7. Spusti `deploy/scripts/deploy.sh` ako root.
8. Over health: `deploy/scripts/health-check.sh`.

## Porty
- 8504 TCP (Node signaling/HTTP cez Caddy)
- 443 TCP (HTTPS/WSS)
- 80 TCP (ACME)
- 60000-60100 UDP/TCP (mediasoup RTP)
- 3478 UDP/TCP, 5349 TCP (coturn)
- 49152-65535 UDP/TCP (coturn relay)

## UDP pre mediasoup
- Render.com neposkytuje raw UDP; mediasoup worker musi bezat na VPS.
- NEOVERENE V TOMTO PROSTREDI: skutocna dostupnost UDP na cielovom VPS.

## Zalohy a rollback
- Pouzi `deploy/scripts/rollback.sh`.

## Koniec navodu
