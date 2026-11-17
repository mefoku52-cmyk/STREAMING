# Kvalita a testy

## Jednotkové testy
- `backend/test/auth.test.js`
- `backend/test/config.test.js`
- `backend/test/events.test.js`
- `backend/test/protocol.test.js`
- `backend/test/session-store.test.js`
- `backend/test/turn-credentials.test.js`

## Integračné testy
- `backend/test/integration.test.js`
- `backend/test/signaling-resume.test.js`
- `backend/test/signaling-turn.test.js`
- `backend/test/producer-dedup.test.js`
- `backend/test/http-adapter.test.js`

## E2E
- `scripts/browser-test.sh` (22/22 PASS)
- `scripts/smoke_local.sh` (health + WebSocket smoke)

## Výsledky
- 48/48 unit/integration testov (bez cross-service) PASS.
- Browser E2E 22/22 PASS.
- Cross-service E2E závisí od externého Python prostredia (cryptography ABI) a nie je overené v Termuxe.

## Slabé miesta
- `npm test` (node --test test/) zlyháva na Node v24 kvôli rozlíšeniu adresára; použiť glob.
- Cross-service test nie je stabilný v tomto prostredí.
- Docker build nebol overený (docker daemon nedostupný).
