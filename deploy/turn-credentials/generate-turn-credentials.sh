#!/bin/bash
# Generovanie časovo obmedzených TURN REST credentials pre coturn (use-auth-secret).
#
# coturn TURN REST API formát:
#   username  = "<expiration_unix_timestamp>:<userid>"
#   password  = Base64(HMAC-SHA1(secret, username))
#
# Použitie:
#   TURN_SECRET=<secret> bash deploy/turn-credentials/generate-turn-credentials.sh <userid> <ttl_seconds>
#
# Výstup (stdout): username, password, expiry, ttl — bez vypísania secretu.
set -euo pipefail

USERID="${1:?usage: TURN_SECRET=<secret> $0 <userid> <ttl_seconds>}"
TTL="${2:?usage: TURN_SECRET=<secret> $0 <userid> <ttl_seconds>}"
: "${TURN_SECRET:?Nastavte TURN_SECRET env premennú (nezobrazuj ju v logoch)}"

# TTL musí byť kladné celé číslo
case "$TTL" in ''|*[!0-9]*|0) echo "ERROR: ttl_seconds musí byť kladné celé číslo" >&2; exit 2 ;; esac

# UTC timestamp
NOW=$(date -u +%s)
EXPIRY=$(( NOW + TTL ))

# TURN REST: username = "timestamp:userid"
TURN_USERNAME="${EXPIRY}:${USERID}"

# TURN REST: password = Base64(HMAC-SHA1(secret, username))
TURN_PASSWORD=$(printf '%s' "$TURN_USERNAME" | openssl dgst -sha1 -hmac "$TURN_SECRET" -binary | openssl base64 -A)

printf 'username=%s\n' "$TURN_USERNAME"
printf 'password=%s\n' "$TURN_PASSWORD"
printf 'expiry=%s\n' "$EXPIRY"
printf 'ttl=%s\n' "$TTL"
printf '\nPoužitie v klientovi (mediasoup-client iceServers):\n'
printf '  { urls: "turn:VPS_IP:3478?transport=udp", username: "%s", credential: "%s" }\n' "$TURN_USERNAME" "$TURN_PASSWORD"
printf '  (credentials platia do %s UTC unix timestamp, %s s)\n' "$EXPIRY" "$TTL"
