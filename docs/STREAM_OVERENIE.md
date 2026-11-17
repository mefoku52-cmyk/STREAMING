# Overenie streamu v prehliadaci

## Lokálne porty
- Backend: http://127.0.0.1:8504
- WebSocket: ws://127.0.0.1:8504/ws
- Web: servírované backendom z /web

## Browser E2E
- Skript: scripts/browser-test.sh
- Výsledok: FATAL pri preview/getUserMedia (NotAllowedError) v tomto prostredí.
- Dôkaz: docs/evidence/browser-test.log
- Predchádzajúci úspešný beh: 22/22 PASS (docs/PHASE3B_CDP_E2E_REPORT.md).

## Viac firiem
- Izolácia cez offerId/inspectionId a claims.sub.
- NEOVERENE V TOMTO PROSTREDI: automatizovaný test dvoch firiem nebol spustený v tejto relácii.

## Plná sada testov
- Backend: 51/51 PASS (bez cmep-live-e2e).
- Smoke: SMOKE_LOCAL_PASS.

## Zhrnutie
Automatizovaný browser E2E je environment-senzitívny.
Predchádzajúce behy preukázali 22/22 PASS.

## Koniec
