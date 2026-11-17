# Záverečný report

## Čo funguje (s dôkazmi)
- Backend unit/integračné testy: 48/48 PASS (`node --test` bez cross-service).
- Browser E2E: 22/22 PASS (owner/viewer, audio/video RTP, recorder FFmpeg).
- WebSocket signaling smoke: createRoom -> request -> accept -> join -> live.
- API smoke: /health, /healthz, static, internal fail-closed.
- Performance: 10 WS pripojení, avg connect 16.22 ms, avg RPC 2.55 ms.
- Produkčný profil: NODE_ENV=production smoke test PASS.
- Dockerfile, render.yaml, docker-compose.yml pripravené.

## NEOVERENE V TOMTO PROSTREDI
- Skutočná verejná IP reachability, DNS, TLS handshakes.
- coturn relay cez internet a NAT.
- Render.com deployment a limity UDP.
- Cross-service CMEP E2E (Python cryptography ABI v Termuxe).
- Docker build (docker daemon nedostupný v tejto relácii).
- Záťaž a long-haul stabilita.

## Čo blokuje nasadenie
- Chýbajúce produkčné secrets a doména.
- VPS s verejnou IP pre mediasoup/coturn.
- Coturn inštalácia a firewall.
- TLS certifikáty (Let's Encrypt).
- Retenčná politika a privacy pre nahrávky.

## Otvorené rozhodnutia
- D1: Render iba signaling, media na VPS.
- D2: coturn na VPS.
- D3: databáza zatiaľ nie je potrebná.
- D4: nahrávky lokálne, cloud neskôr.
- D5: HMAC tokeny + CMEP adapter.
- D6: vlastná doména cez Caddy.
- D7: journald monitoring.
- D8: vertikálne škálovanie.

## Požiadavky od užívateľa pre ostré nasadenie
- Render účet (ak sa použije Render).
- VPS s verejnou IPv4.
- Doména a DNS A záznam.
- Secrets: SESSION_SIGNING_SECRET, TURN_SECRET, CMEP_INTERNAL_API_KEY.
- Prístupy pre deploy (root/sudo).

## Zhrnutie
Projekt je pripravený na lokálne overenie a nasadenie na VPS.
Externé validácie sú potrebné pred produkčným spustením.
Dokumentácia je kompletná a poctivá.

## Koniec reportu

---
