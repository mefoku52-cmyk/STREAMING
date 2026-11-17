# Mapa toku streamu

## Modely
- Používateľ: claims.sub, companyId (v http mode).
- Obhliadka/inspection: identifikovaná offerId/inspectionId na CMEP platforme.
- Room: id, ownerId, offerId, state, participants, producers, acceptedViewer.
- Stream: WebRTC 1:1 audio/video medzi ownerom a viewerom.

## Vzťahy
- Jedna room je viazaná na jednu obhliadku (offerId).
- Owner vytvára room.
- Viewer požiada o pripojenie (requestInspection).
- Owner akceptuje alebo odmieta.
- Po akceptovaní sa viewer pripojí a stream je live.

## Endpointy a WS správy
- HTTP: GET /health, GET /healthz, POST /internal/inspections/:id/end.
- WS: createRoom, joinRoom, leaveRoom, requestInspection, acceptInspection, rejectInspection, produce, consume, startRecording, stopRecording, close, resumeSession, getIceServers, restartIce.

## Autorizácia
- Lokálny adapter: deny-by-default, tokeny z .env.
- HTTP adapter: platforma overuje každú akciu (fail-closed).
- Room je viazaná na offerId/inspectionId.

## Tlačidlá web
- publish.html: preview, camToggle, micToggle, stopPreview, start (createRoom), accept, stop.
- viewer.html: connect, micToggle, stop, enableAudio.
- Stavy: nacitava, zakazane, chyba, uspech.

## Viacfirmovosť
- Izolácia cez claims.sub a offerId/inspectionId.
- Viewer nemôže vidieť ponuku inej firmy, ak platforma nepovolí.
- Room state a acceptedViewer chránia pred neoprávneným pripojením.

## Stavový automat
- pending: room vytvorená, čaká na request/accept.
- accepted: viewer akceptovaný.
- live: viewer pripojený.
- closed: room ukončená.
- Prechody: pending -> accepted -> live -> closed.
- Odmietnuté prechody: joinRoom v pending, request z ownera, accept z non-owner.

## Rozhodnutia
- Jeden stream na obhliadku (room viazaná na offerId).
- Stream spúšťa owner po akceptovaní viewer requestu.
- Viewer publikuje iba audio.

## Stavy toku (doplnenie)
- stav requested: ziadost o stream od kupujuceho.
- stav approved: predavajuci schvalil ziadost.
- stav live: stream bezi.
- stav ended: stream ukonceny.
- stav failed: stream zlyhal.
