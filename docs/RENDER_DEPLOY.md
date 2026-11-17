# Render.com nasadenie (priprava)

## Obmedzenia
- Render neposkytuje raw UDP pre mediasoup RTP.
- Mediasoup worker a coturn musia bezat na VPS s verejnou IP.
- Render service obsluhuje signaling, WebSocket a staticke subory.

## Kroky
1. Vytvor Render Web Service z tohto repozitara.
2. Pouzi `backend/Dockerfile` a root context.
3. Nastav environment premenné podľa `.env.example` a produkčnej šablóny.
4. Nastav health check path na `/healthz`.
5. Pripoj vlastnú doménu a over TLS/WSS.
6. Na VPS nasaď coturn a otvor firewall porty.
7. Over `/health` (ready=true, workerAlive=true) a browser test.

## Povinné env premenné
- `NODE_ENV=production`
- `SESSION_SIGNING_SECRET`
- `SIGNALING_HOST=0.0.0.0`
- `SIGNALING_PORT=8504`
- `ANNOUNCED_IP` (VPS public IP)
- `RTC_MIN_PORT`, `RTC_MAX_PORT`
- `TURN_SECRET`, `TURN_URLS`, `TURN_REALM`
- `CMEP_ADAPTER`, `CMEP_PLATFORM_URL`, `CMEP_INTERNAL_API_KEY` (ak http mode)

## Limity
- Free tier môže uspávať service.
- Recorder je na Renderi vypnutý.
- Horizontálne škálovanie vyžaduje zdieľaný stav (zatiaľ nie je implementované).

## Rollback
- Použi predchádzajúci Render deploy alebo `deploy/scripts/rollback.sh` na VPS.

## Verifikácia
- `curl https://<domena>/healthz`
- `curl https://<domena>/health`
- Browser test s fake media.

## Koniec
