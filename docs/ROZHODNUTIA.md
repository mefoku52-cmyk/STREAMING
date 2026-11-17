# Rozhodnutia

| ID | Rozhodnutie | Zvolená hodnota | Dôvod |
|----|-------------|-----------------|-------|
| D1 | Cieľová platforma | VPS pre media, Render iba voliteľne pre signaling/static | Render neposkytuje raw UDP pre mediasoup RTP |
| D2 | TURN server | coturn na VPS s verejnou IP | Nutný pre NAT traversal a relay |
| D3 | Databáza | Nie je potrebná v tejto fáze | Stav je in-memory; perzistencia až pri auditoch/retencii |
| D4 | Uchovávanie nahrávok | Lokálny disk + neskorší R2/S3 | Najjednoduchšie pre Termux/VPS; cloud až po politike retencie |
| D5 | Autentifikácia | HMAC session tokeny + CMEP adapter | Už implementované, fail-closed |
| D6 | Doména | Vlastná doména cez Caddy/Let's Encrypt | Automatické TLS a WSS |
| D7 | Monitoring | journald + štruktúrované JSON logy | Nízke náklady, dostatočné pre prvú produkciu |
| D8 | Škálovanie | Vertikálne (jeden worker) najprv | Horizontálne vyžaduje zdieľaný stav a sticky sessions |

## Dôsledky implementácie

- Render Blueprint (`render.yaml`) bude obsluhovať iba signaling/static, nie mediasoup worker.
- Mediasoup worker a coturn musia bežať na hoste s verejnou IP.
- Nahrávky vyžadujú diskovú kvótu a retenčnú politiku.
- Autentifikácia zostáva kompatibilná s CMEP platformou cez `CMEP_ADAPTER=http`.
- Monitoring je založený na logoch; alerting až neskôr.

## Poznámky k implementácii

- Render Blueprint pripraví signaling, ale media ostáva na VPS.
- coturn vyžaduje verejnú IP a otvorené UDP/TCP porty.
- Nahrávky nie sú v tejto fáze automaticky zálohované.
- Autentifikácia je založená na zdieľanom `SESSION_SIGNING_SECRET`.
- Monitoring je minimálny; alerting je budúca úloha.
- Škálovanie je zatiaľ vertikálne.

## Koniec dokumentu
