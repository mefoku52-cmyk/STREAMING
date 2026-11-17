# Report doplnenia

## Implementované (commity)
- ws security update (8.21.0).
- Stream state machine modul a testy.
- Tlačidlá "Požiadať o stream" a "Spustiť stream".
- Dokumentácia toku, nasadenia a pred nasadením.
- Produkčný profil a smoke testy.

## Overené (výstupy)
- Backend testy: 51/51 PASS.
- Smoke: SMOKE_LOCAL_PASS.
- check_all.sh: CHECK_ALL_PASS.
- cmep_check.sh 0-5: PASS.

## NEOVERENE V TOMTO PROSTREDI
- Browser E2E (fake media permission issue v tejto relácii).
- Viac firiem automatizovaný test.
- Render UDP pre mediasoup.
- Cross-service CMEP E2E (Python ABI).
- Docker build (daemon nedostupný).

## Blokujúce nasadenie
- Secrets, doména, VPS, coturn, TLS, retenčná politika.

## Predvolené rozhodnutia
- Stream na obhliadku (room viazaná na offerId).
- Stream spúšťa owner po akceptovaní.
- Viewer publikuje iba audio.

## Koniec reportu
