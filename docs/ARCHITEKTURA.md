# Architektúra CMEP-STREAMING

## 1. Aktuálna architektúra

```
Browser (publish.html / viewer.html + vendored mediasoup-client 3.26.0)
   | HTTPS/WSS cez Caddy (VPS) alebo direct WS (dev)
   v
Node.js (jeden proces)
  |- http.js: staticke subory, /health, /healthz, /internal/*
  |- signaling.js: WebSocket protokol, rooms, mediasoup worker/router
  |- auth.js: HMAC session tokeny
  |- session-store.js: in-memory rooms/participants/producers
  |- adapter/cmep-adapter.js: local | http (CMEP platform)
  |- events.js: audit events
  |- recorder.js: volitelny FFmpeg pipeline (PlainTransport -> RTP -> FLV)
  |- process-manager.js: sprava child procesov
  |- turn-credentials.js: TURN REST credentials
  |- index.js: wiring, runtime lock, graceful shutdown
```

- Jeden Node proces, jeden mediasoup worker, jeden router zdielany pre vsetky rooms.
- Ziadna databaza; stav je in-memory.
- Nahravanie je volitelne (`ENABLE_RECORDER`).
- Adapter hranica umoznuje lokalny dev alebo CMEP platform HTTP.

## 2. Hlavne toky

1. Owner vytvori room (`createRoom`), state `pending`.
2. Viewer poziada o obhliadku (`requestInspection`), owner dostane push.
3. Owner akceptuje (`acceptInspection`), state `accepted`.
4. Viewer sa pripoji (`joinRoom`), state `live`.
5. Owner produkuje audio+video; viewer iba audio.
6. Close/disconnect uvolni transporty, producers, room.

## 3. Cieľová architektúra

### Varianta A - VPS (odporúčaná pre media)
- Caddy (TLS, reverse proxy, WSS) na 443.
- Node.js backend na 8504 (bind 127.0.0.1).
- coturn na 3478/5349, relay 49152-65535.
- mediasoup RTP/RTCP 60000-60100 UDP/TCP.
- systemd service, firewall ufw, journald logy.
- Voliteľný recorder s FFmpeg.

### Varianta B - Render.com (obmedzená)
- Render Web Service pre HTTP/WS signaling a staticke subory.
- Render neposkytuje raw UDP pre mediasoup RTP, preto media musi ist cez TURN alebo samostatny VPS.
- TURN server musi byt na samostatnom hoste s verejnou IP.
- Databaza/uchovavanie nahravok vyžaduje externy storage.

## 4. Rozdiely a riziká

- Render.com je vhodny pre signaling, ale nie pre priamy mediasoup UDP media.
- coturn je samostatna kriticka zavislost; bez neho WebRTC za NAT zlyha.
- In-memory stav znamena, ze restart servera zrusi vsetky rooms.
- Recorder vyžaduje FFmpeg a spravne porty; nie je vhodny pre Render.
- Bez TLS/WSS nie je mozne pouzit v produkcii.

## 5. Produkčné požiadavky

- Environment validation na štarte.
- Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).
- Rate limiting HTTP aj WebSocket.
- Input validation pre vsetky WS spravy.
- Strukturovane JSON logy bez tajomstiev.
- Graceful shutdown (SIGTERM/SIGINT).
- Health checks `/health`, `/healthz`.
