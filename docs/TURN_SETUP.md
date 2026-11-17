# TURN server setup (coturn)

## Inštalácia
- Nainštaluj coturn na VPS.
- Skopíruj `deploy/coturn/turnserver.conf` šablónu.
- Dosad `listening-ip`, `realm`, `static-auth-secret`.

## Konfigurácia
- `listening-port=3478`
- `tls-listening-port=5349`
- `min-port=49152`, `max-port=65535`
- `use-auth-secret`
- `static-auth-secret=<TURN_SECRET>`

## Firewall
- 3478/udp, 3478/tcp, 5349/tcp, 49152-65535/udp/tcp.

## Testovanie
- `deploy/turn-credentials/test-turn-auth.sh`
- Over allocation cez browser WebRTC stats.

## Troubleshooting
- Skontroluj verejnú IP (`ANNOUNCED_IP`).
- Over zhodu `TURN_SECRET` medzi backendom a coturnom.
- Over TLS certifikáty pre turns.

## Poznámky
- TURN je kritický pre NAT traversal.
- Bez TURN zlyhá pripojenie za symetrickým NAT.
- Relay porty musia byť otvorené vo firewalli.
