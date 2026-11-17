# #!/usr/bin/env bash
# check_streaming.sh - Nezávislá kontrola fáz pre cmep-streaming
# Použitie: bash ~/cmep-streaming/scripts/check_streaming.sh <1-10>

ROOT="$HOME/cmep-streaming"
N="${1:-}"

case "$N" in
  1|2|3|4|5|6|7|8|9|10) ;;
  *) echo "Použitie: check_streaming.sh <1-10>"; exit 2;;
esac

cd "$ROOT" || exit 2
mkdir -p "$ROOT/.data/check"

FAILS=0
FAILED_LIST=""

ok()   { echo "OK            $1"; }
warn() { echo "UPOZORNENIE  $1"; }
bad()  { echo "CHYBA         $1"; FAILS=$((FAILS+1)); FAILED_LIST="${FAILED_LIST}
- $1"; }

nonempty() {
  if [ -s "$ROOT/$1" ]; then ok "$1"; else bad "súbor chýba alebo je prázdny: $1"; fi
}

lines_ge() {
  local f="$1" min="$2"
  local c=$(wc -l < "$ROOT/$f" 2>/dev/null || echo 0)
  if [ "$c" -ge "$min" ]; then ok "$f ($c riadkov)"; else bad "$f má $c riadkov, očakávaných aspoň $min"; fi
}

runcheck() {
  local desc="$1"; shift
  local LOG="$ROOT/.data/check/run_$(echo "$desc" | tr ' /' '__').log"
  if "$@" >"$LOG" 2>&1; then ok "$desc"; else bad "$desc zlyhal (posledné riadky nižšie)"; tail -15 "$LOG"; fi
}

# --- Fáza 1: Forenzná inventarizácia ---
ph1() {
  nonempty "docs/PROGRES.md"
  nonempty "docs/FORENZNA_ANALYZA.md"
  lines_ge "docs/FORENZNA_ANALYZA.md" 80
  
  # Kontrola commitov z fázy 1
  for hash in 6f29411 51af09d a652c5a fac1c57 9bdd5bf f79c088 6325b68 a43b5b9 a5cf4ae 4491e03; do
    if git log --oneline | grep -q "^$hash"; then ok "commit $hash existuje"; else bad "commit $hash chýba"; fi
  done
  
  # PROGRES.md musí obsahovať riadky pre fázu 1
  if grep -q "1.10" docs/PROGRES.md 2>/dev/null; then ok "PROGRES.md obsahuje fázu 1.10"; else bad "PROGRES.md neobsahuje fázu 1.10"; fi
}

# --- Fáza 2: Čistenie ---
ph2() {
  # Kontrola PHASE3F súborov - mali by byť archivované alebo commitnuté
  local phase3f_count=$(find deploy -maxdepth 1 -name "PHASE3F_*" -type f 2>/dev/null | wc -l)
  if [ "$phase3f_count" -eq 0 ]; then ok "PHASE3F súbory sú archivované"; else warn "PHASE3F súbory stále v deploy/ ($phase3f_count)"; fi
  
  # Kontrola duplicitných .env súborov
  local env_count=$(find . -maxdepth 2 -name ".env*" -not -path "./node_modules/*" -not -name ".env.example" 2>/dev/null | wc -l)
  if [ "$env_count" -le 1 ]; then ok "max 1 .env súbor"; else bad "nájdených $env_count .env súborov"; fi
  
  # mediasoup-client v backend - mal by byť odstránený ak nepoužívaný
  if grep -q '"mediasoup-client"' backend/package.json 2>/dev/null; then
    warn "mediasoup-client stále v backend/package.json - overiť použitie"
  else
    ok "mediasoup-client odstránený z backend"
  fi
}

# --- Fáza 3: Znovuoverenie ---
ph3() {
  # Server musí byť spustiteľný
  if [ -f "scripts/start.sh" ]; then ok "scripts/start.sh existuje"; else bad "scripts/start.sh chýba"; fi
  
  # Health endpoint test (server nemusí bežať, ale skript musí existovať)
  nonempty "scripts/smoke_local.sh" 2>/dev/null || warn "scripts/smoke_local.sh zatiaľ neexistuje (fáza 3)"
}

# --- Fáza 4: Architektúra ---
ph4() {
  nonempty "docs/ARCHITEKTURA.md"
  lines_ge "docs/ARCHITEKTURA.md" 50
  nonempty "docs/ROZHODNUTIA.md"
  lines_ge "docs/ROZHODNUTIA.md" 30
}

# --- Fáza 5: Hardening ---
ph5() {
  # Kontrola env validation v kóde
  if grep -r "process.env" backend/src/ 2>/dev/null | grep -q "throw\|exit"; then
    ok "env validation nájdená v kóde"
  else
    warn "env validation možno chýba - overiť manuálne"
  fi
  
  # Security headers
  if grep -ri "content-security-policy\|x-content-type-options" backend/src/ web/ 2>/dev/null | head -1 | grep -q .; then
    ok "security headers nájdené"
  else
    bad "security headers nenájdené"
  fi
  
  # Rate limiting
  if grep -ri "rate.*limit\|throttle" backend/src/ 2>/dev/null | head -1 | grep -q .; then
    ok "rate limiting nájdený"
  else
    bad "rate limiting nenájdený"
  fi
}

# --- Fáza 6: Render príprava ---
ph6() {
  nonempty "backend/Dockerfile"
  nonempty "render.yaml"
  lines_ge "docs/RENDER_DEPLOY.md" 40
  
  # Dockerfile kontroly
  if grep -q "FROM node:" backend/Dockerfile 2>/dev/null; then
    if grep -q "node:.*-alpine" backend/Dockerfile 2>/dev/null; then ok "Alpine obraz použitý"; else warn "nie je Alpine obraz"; fi
  else
    bad "Dockerfile nešpecifikuje Node obraz"
  fi
  
  if grep -qi "healthcheck" backend/Dockerfile 2>/dev/null; then ok "HEALTHCHECK v Dockerfile"; else bad "HEALTHCHECK chýba"; fi
  
  if grep -q "USER " backend/Dockerfile 2>/dev/null; then ok "neprivilegovaný užívateľ"; else bad "USER chýba v Dockerfile"; fi
}

# --- Fáza 7: Kvalita ---
ph7() {
  # Test súbory
  local test_count=$(find . -name "*.test.js" -o -name "*.spec.js" -not -path "./node_modules/*" 2>/dev/null | wc -l)
  if [ "$test_count" -ge 3 ]; then ok "testy: $test_count súborov"; else bad "málo testov: $test_count"; fi
  
  nonempty "docs/KVALITA.md"
  lines_ge "docs/KVALITA.md" 30
}

# --- Fáza 8: Dokumentácia ---
ph8() {
  nonempty "docs/RUNBOOK.md"
  lines_ge "docs/RUNBOOK.md" 40
  nonempty "docs/TURN_SETUP.md"
  lines_ge "docs/TURN_SETUP.md" 30
  
  # README aktualizácia
  if grep -qi "render\|produkc" README.md 2>/dev/null; then ok "README obsahuje produkčné info"; else warn "README možno neaktualizovaný"; fi
}

# --- Fáza 9: Lokálny produkčný profil ---
ph9() {
  nonempty "docker-compose.yml"
  
  # Ak Docker nie je dostupný, overiť aspoň syntax
  if command -v docker >/dev/null 2>&1; then
    if docker compose config > /dev/null 2>&1; then ok "docker-compose.yml syntax OK"; else bad "docker-compose.yml syntax chyba"; fi
  else
    warn "Docker nie je dostupný - NEOVERENE V TOMTO PROSTREDI"
  fi
  
  # .env.example musí obsahovať všetky premenné z .env
  if [ -f ".env" ] && [ -f ".env.example" ]; then
    local env_vars=$(grep -o '^[A-Z_]*=' .env | sort)
    local example_vars=$(grep -o '^[A-Z_]*=' .env.example | sort)
    local missing=$(comm -23 <(echo "$env_vars") <(echo "$example_vars") | wc -l)
    if [ "$missing" -eq 0 ]; then ok ".env.example pokrýva všetky premenné"; else bad ".env.example chýba $missing premenných"; fi
  fi
}

# --- Fáza 10: Záverečná kontrola ---
ph10() {
  nonempty "docs/REPORT_FINAL.md"
  lines_ge "docs/REPORT_FINAL.md" 50
  
  # Všetky predchádzajúce fázy musia byť v PROGRES.md
  for i in 1 2 3 4 5 6 7 8 9; do
    if grep -q "Fáza.*$i\|$i\." docs/PROGRES.md 2>/dev/null; then ok "PROGRES.md obsahuje fázu $i"; else bad "PROGRES.md chýba fáza $i"; fi
  done
  
  # Žiadne tajomstvá v git histórii posledných 20 commitov
  if git log -p -20 2>/dev/null | grep -iE "(sk-[a-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|ghp_[a-zA-Z0-9]{36})" | head -5 | grep -q .; then
    bad "možné tajomstvo v posledných commitoch"
  else
    ok "žiadne očividné tajomstvá v histórii"
  fi
}

# --- Spustenie kontrol ---
echo "=== Kontrola FÁZY $N ==="
for i in $(seq 1 "$N"); do
  echo "--- Fáza $i ---"
  "ph$i"
done

echo ""
echo "=== Bezpečnostná kontrola ==="

# .env nie je v gite
if git ls-files 2>/dev/null | grep -q "^\.env$"; then bad ".env je v gite"; else ok ".env nie je v gite"; fi

# Žiadne tajomstvá v tracked súboroch
if git grep -iE "(sk-[a-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN.*PRIVATE KEY)" 2>/dev/null | head -1 | grep -q .; then
  bad "nájdený podozrivý reťazec v tracked súboroch"
else
  ok "žiadne očividné tajomstvá v tracked súboroch"
fi

# npm audit - kontrola zraniteľností
echo ""
echo "=== npm audit ==="
if [ -f "backend/package.json" ]; then
  cd backend
  AUDIT_OUT=$(npm audit --omit=dev 2>&1)
  AUDIT_RC=$?
  cd ..
  if [ "$AUDIT_RC" -eq 0 ]; then ok "npm audit: žiadne zraniteľnosti"; else warn "npm audit: nálezy (overiť docs/SECURITY_AUDIT.md)"; fi
  echo "$AUDIT_OUT" | head -10
else
  warn "backend/package.json neexistuje"
fi

echo ""
echo "=== Stav gitu ==="
git log --oneline | head -5
if [ -n "$(git status --short 2>/dev/null)" ]; then warn "necommitnuté zmeny:"; git status --short | head -10; fi

echo ""
if [ "$FAILS" -eq 0 ]; then
  echo "VÝSLEDOK: FÁZA $N je v poriadku, môžeš schváliť."
  echo ""
  echo "----- VLOŽ DO OPENCODE -----"
  if [ "$N" -lt 10 ]; then
    M=$((N+1))
    echo "FÁZA $N schválená (check_streaming.sh $N prešiel). Pokračuj FÁZOU $M podľa docs/OPENCODE_PROMPT_PRODUKCIA.md, všetky jej kroky po sebe. Medzi krokmi sa nezastavuj. Aktualizuj docs/PROGRES.md po každom kroku. Po poslednom kroku napíš presne: FÁZA $M DOKONČENÁ - ČAKÁM NA SCHVÁLENIE a zastav sa."
  else
    echo "FÁZA 10 schválená. Nerob žiadne ďalšie zmeny ani nasadenie. Vypíš git log --oneline | head -5 a zoznam bodov z docs/REPORT_FINAL.md, ktoré sú stále otvorené."
  fi
else
  echo "VÝSLEDOK: FÁZA $N NIE JE v poriadku, počet chýb: $FAILS."
  echo ""
  echo "----- VLOŽ DO OPENCODE -----"
  echo "FÁZA $N neschválená. Nezávislá kontrola check_streaming.sh $N našla tieto chyby:${FAILED_LIST}"
  echo "Oprav presne tieto chyby, po každej oprave spusti testy a pošli nový report. Testy neoslabuj ani nemaž. Aktualizuj docs/PROGRES.md. Po oprave napíš presne vetu: FÁZA $N DOKONČENÁ - ČAKÁM NA SCHVÁLENIE a zastav sa."
fi

