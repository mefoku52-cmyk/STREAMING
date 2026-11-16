#!/bin/bash
# Automatický test TURN REST autentifikácie (bez pripojenia k coturn/VPS).
# Overí: formát username, HMAC-SHA1+Base64 password, expiráciu, zhodu secretu
# medzi generátorom a coturn konfiguráciou — bez vypisovania secretu.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GEN="$SCRIPT_DIR/generate-turn-credentials.sh"
CONF="$ROOT/deploy/coturn/turnserver.conf"

PASS=0
FAIL=0

ok()   { PASS=$((PASS+1)); echo "PASS  $1"; }
fail() { FAIL=$((FAIL+1)); echo "FAIL  $1" >&2; }

# Dočasný test secret (nikdy sa nevypíše ani neuloží do Gitu)
TEST_SECRET="turn-test-secret-$(date -u +%s)-$(head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n')"
USERID="test-user"
TTL=3600

echo "==> TURN REST auth verification (self-contained, bez externých služieb)"

# 1) turnserver.conf musí mať use-auth-secret a static-auth-secret
if grep -qx 'use-auth-secret' "$CONF"; then
  ok "turnserver.conf: use-auth-secret je samostatná direktíva"
else
  fail "turnserver.conf: chýba samostatná direktíva 'use-auth-secret'"
fi

if grep -q '^static-auth-secret=' "$CONF"; then
  ok "turnserver.conf: static-auth-secret je definovaný"
else
  fail "turnserver.conf: chýba 'static-auth-secret='"
fi

# 2) Žiadna konfliktná statická autentifikácia user=
if grep -q '^user=' "$CONF"; then
  fail "turnserver.conf: obsahuje konfliktnú statickú autentifikáciu 'user='"
else
  ok "turnserver.conf: bez 'user=' (žiadna konfliktná statická auth)"
fi

# 3) Generovanie credentials
OUTPUT=$(TURN_SECRET="$TEST_SECRET" bash "$GEN" "$USERID" "$TTL")
GEN_USER=$(printf '%s\n' "$OUTPUT" | sed -n 's/^username=//p')
GEN_PASS=$(printf '%s\n' "$OUTPUT" | sed -n 's/^password=//p')
GEN_EXP=$(printf '%s\n' "$OUTPUT" | sed -n 's/^expiry=//p')
GEN_TTL=$(printf '%s\n' "$OUTPUT" | sed -n 's/^ttl=//p')

# 4) Formát username = "expiration_timestamp:userid"
if printf '%s' "$GEN_USER" | grep -Eq '^[0-9]+:'"$USERID"'$'; then
  ok "username má formát expiration_timestamp:userid"
else
  fail "username nemá očakávaný formát (got prefix/suffix mismatch)"
fi

TS_PART="${GEN_USER%%:*}"
if [ "$TS_PART" = "$GEN_EXP" ]; then
  ok "timestamp v username sa zhoduje s expiry"
else
  fail "timestamp v username ($TS_PART) != expiry ($GEN_EXP)"
fi

# 5) Expirácia: v budúcnosti, zodpovedá TTL
NOW=$(date -u +%s)
if [ "$GEN_EXP" -gt "$NOW" ] && [ "$GEN_EXP" -le $((NOW + TTL + 2)) ]; then
  ok "expirácia je v budúcnosti a zodpovedá TTL"
else
  fail "expirácia mimo očakávaného rozsahu (now=$NOW, exp=$GEN_EXP, ttl=$TTL)"
fi

# 6) Nezávislý výpočet HMAC-SHA1 + Base64 a porovnanie
EXPECTED_PASS=$(printf '%s' "$GEN_USER" | openssl dgst -sha1 -hmac "$TEST_SECRET" -binary | openssl base64 -A)
if [ "$GEN_PASS" = "$EXPECTED_PASS" ]; then
  ok "password = Base64(HMAC-SHA1(secret, username)) sa zhoduje"
else
  fail "password sa nezhoduje s nezávislým HMAC-SHA1 výpočtom"
fi

# 7) Zhoda secretu medzi generátorom a coturn konfiguráciou (bez vypísania secretu)
# Simulujeme deploy: nahradíme placeholder v šablóne a overíme, že výsledok obsahuje rovnaký secret.
TMP_CONF=$(mktemp)
trap 'rm -f "$TMP_CONF"' EXIT
sed "s|<TURN_SECRET>|${TEST_SECRET}|g" "$CONF" > "$TMP_CONF"

CONF_SECRET=$(sed -n 's/^static-auth-secret=//p' "$TMP_CONF" | head -n1)
# Porovnanie bez výpisu: hash porovnanie
GEN_HASH=$(printf '%s' "$TEST_SECRET" | openssl dgst -sha256 | awk '{print $NF}')
CONF_HASH=$(printf '%s' "$CONF_SECRET" | openssl dgst -sha256 | awk '{print $NF}')
if [ "$GEN_HASH" = "$CONF_HASH" ]; then
  ok "static-auth-secret v (nasadenej) konfigurácii sa zhoduje so secretom generátora"
else
  fail "static-auth-secret v konfigurácii sa nezhoduje so secretom generátora"
fi

# 8) Kontrola, že secret sa nikde nevypisuje do výstupu generátora
if printf '%s' "$OUTPUT" | grep -qF "$TEST_SECRET"; then
  fail "generátor vypísal secret do stdout"
else
  ok "generátor nevypísal secret do stdout"
fi

echo ""
echo "==> Výsledok: $PASS pass, $FAIL fail"
[ "$FAIL" -eq 0 ]
