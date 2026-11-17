# Runbook

## Štart
1. `cp .env.example .env` a nastav `SESSION_SIGNING_SECRET`.
2. `./scripts/start.sh`
3. Over `curl http://127.0.0.1:8504/healthz`

## Stop
- `./scripts/stop.sh`

## Debug
- Logy: `logs/server.log`, `tail -f logs/server.log`
- Health: `curl http://127.0.0.1:8504/health`
- Lock: `runtime/server.lock`, `runtime/last-start.pid`
- Ak stale lock: over PID a cwd, potom zmaž lock.

## Bežné chyby
- `SESSION_SIGNING_SECRET` chýba -> WS close 4401.
- Port obsadený -> server neštartuje.
- mediasoup worker chýba -> health ready false.
- Recorder unavailable -> `ENABLE_RECORDER=0` alebo chýba FFmpeg.

## Testy
- `./scripts/smoke_local.sh`
- `./scripts/test_all.sh`
- `./scripts/browser-test.sh` (vyžaduje Chromium a tokeny)

## Rollback
- `./deploy/scripts/rollback.sh`

## Produkcia
- Použi `deploy/scripts/deploy.sh` na VPS.
- Over env premenné a firewall.

## Monitoring
- Sleduj journald a JSON logy.
- Over rooms=0 a peers=0 po testoch.
- Over workerAlive=true.

## Incidenty
- Pri páde servera over runtime lock.
- Pri problémoch s media over TURN a firewall.
