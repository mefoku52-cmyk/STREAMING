# cmep-streaming - doplnenie do produkcie (prompt pre OpenCode)

## 0. CIEL

Dokonci projekt cmep-streaming tak, aby sa lokalne aj v prehliadaci dal prejst cely tok:
prihlasenie kupujuceho, ponuka s tlacidlom "Poziadat o stream", ziadost predavajuceho
s tlacidlom "Spustit stream", prehravanie v viewer.html, a to pre viac firiem naraz.
Pripravi aj produkcny profil a zoznam vecí, ktore su nutne na nasadenie.

Nasadenie, push, zmena DNS a vytvaranie externych uctov NIE SU sucastou tejto ulohy.

## 1. PRAVIDLA

R1. Bez emoji. Bez domnienok: co nie je v kode alebo v tomto dokumente, neplati.
R2. Kazdy krok: zmena, kontrola syntaxe, test, skutocny vystup z terminalu, commit.
R3. Pred zmenou suboru s prechadzajucimi testami spusti testy (stav pred), po zmene znova (stav po).
R4. Nikdy nemaz vetvy, nerob force push, nerob rebase, nerob git push.
R5. Tajomstva: .env nesmie byt v gite. Hodnoty tajomstiev nikdy nevypisuj do reportov ani logov.
R6. Ziadne placeholdery: prazdne subory (okrem __init__.py a .gitkeep), telo funkcie iba pass,
    TODO, FIXME, tlacidlo bez handleru, tlacidlo bez logiky, text typu "Coming soon".
R7. Dlhe prikazy (viac ako 30 s) spustaj cez nohup s logom v logs/.
R8. Test zlyha: zastav sa, oprav pricinu. Testy neoslabuj ani nemaz.
R9. Aktualizuj docs/PROGRES.md v tom istom commite ako kazdy krok.
R10. Ak sa nieco neda overit v Termuxe, napis NEOVERENE V TOMTO PROSTREDI. Nikdy nepis OK bez vystupu.
R11. Ziadne tvrdenie typu "vsetko prechadza" bez posledných riadkov vystupu testu v reporte.
R12. Po poslednom kroku fazy napis presne: FAZA N DOKONCENA - CAKAM NA SCHVALENIE, a zastav sa.

## 2. AUDIT TVRDENI Z PREDCHADZAJUCICH REPORTOV (FAZA 0, iba citanie)

0.1 Over docs/REPORT_FINAL.md a docs/PROGRES.md: ku kazdej fazy 1 az 10 uved commit a
    skutocny vystup. Riadky bez commitu (faza 2, 3, 4 v predoslom reporte) over cez git log.
0.2 Nesledovany subor scripts/check_streaming.sh: precitaj ho. Ak je uzitocny, commitni ho
    v samostatnom kroku. Ak nie, zapis dovod do docs/PROGRES.md a ponechaj ho nedotknuty.
0.3 Spusti scripts/check_all.sh cez nohup a uloz log do logs/. Zapis presny vysledok:
    pocet prejdenych, zlyhanych, preskocenych testov a exit kod.
0.4 Zisti, co je v 53 necommitnutych/nepushnutych commitoch: git log origin/main..main --oneline.
    Nic nepushuj. Zapis zoznam do docs/PRODUKCIA_STAV.md.
0.5 Over, ci sa v commitoch neobjavuje .env, certifikat alebo privatny kluc:
    git log --all --name-only --pretty=format: | sort -u | grep -Ei "\.env$|\.pem$|\.key$"
0.6 Commit docs/PRODUKCIA_STAV.md. Veta z R12.

## 3. BEZPECNOST ZAVISLOSTI ws (FAZA 1)

1.1 Zapis stav: cd backend && npm ls ws && cp package-lock.json logs/package-lock.before-ws.json
1.2 Zisti, ktore balíky od ws zavisia (npm ls ws --all) a ci server pouziva ws priamo
    (grep -rn "require(.ws.)\|from .ws." backend/src).
1.3 Aktualizuj iba ws na najmensiu verziu mimo zraniteľného rozsahu z npm audit:
    npm install ws@<verzia> --save-exact (NIE npm audit fix --force).
    Ak je potrebna verzia mimo deklarovaneho rozsahu, zapis to do docs/SECURITY_AUDIT.md.
1.4 npm audit --omit=dev. Vystup uloz do logs/. Ocakavane: 0 high.
1.5 Spusti celu backend sadu testov a overenie WebSocket (scripts/smoke_local.sh alebo ekvivalent).
1.6 Commit s popisom: "security: update ws to fix GHSA-58qx-3vcg-4xpx and GHSA-96hv-2xvq-fx4p".
    Veta z R12.

## 4. MAPA TOKU A VIACERO FIREM (FAZA 2, iba citanie)

2.1 Najdi modely: firma/company, ponuka/offer, ziadost/request o stream, stream/session, pouzivatel
    a jeho rola. Zapis ich vztahy do docs/STREAM_TOK.md.
2.2 Najdi vsetky endpointy a WebSocket spravy suvisiace so streamom. Pre kazdy: autorizacia,
    vstup, vystup, stav.
2.3 Najdi vsetky tlacidla v web/ suvisiace s ponukou a ziadostou. Pre kazde: handler, endpoint,
    stav (funkcne, nefunkcne, bez handleru).
2.4 Over viacfirmovost: ako sa izoluje firma A od firmy B pri ponuke, ziadosti a streame.
    Ak izolacia chyba, zapis to ako blokujuci nalez.
2.5 Zapis stavovy automat streamu: ziadost (requested), schvalenie (approved), spustenie (live),
    ukoncenie (ended), chyba (failed). Vypis, ktore prechody su implementovane.
2.6 Pre kazde rozhodnutie, ktore nie je v kode (napr. kto spusta stream, ci je jeden stream na ponuku
    alebo na ziadost), zapis predvolenu hodnotu do docs/ROZHODNUTIA.md s dosledkom. Pouzi predvolene
    hodnoty z docs/ROZHODNUTIA.md, ak existuju. Nic nerozhoduj inak.
2.7 Commit. Veta z R12.

## 5. DOKONCENIE TOKU (FAZA 3)

3.1 Implementuj stavovy automat (2.5) ako samostatny modul s testami prechodov a odmietnutych prechodov.
3.2 Endpointy: ziadost o stream z ponuky, schvalenie, spustenie z ziadosti, ukoncenie, stav.
    Autorizacia: iba opravnena strana firmy, deny by default. Testy opravnenych aj neopravnenych volani.
3.3 Dvojite kliknutie na tlacidlo nesmie vytvorit dve ziadosti ani dva streamy (idempotencia).
3.4 Tlacidla vo web/: "Poziadat o stream" aktivne iba pre prihlaseneho kupujuceho bez existujucej
    ziadosti; inak zobraz dovod. "Spustit stream" aktivne iba pre opravneneho predavajuceho v spravnom stave.
3.5 Stavy kazdeho tlacidla: nacitava, zakazane (s dovodom), chyba (s textom), uspech.
3.6 Viewer viewer.html: napoj na aktualny stream, zobraz stav "nie je live", "ukonceny", chybu.
3.7 Ziadne tlacidlo bez handleru a bez logiky (R6).
3.8 Testy komponentov a stavov. Spusti celu sadu. Commit po kazdom podkroku. Veta z R12.

## 6. OVERENIE V PREHLIADACI (FAZA 4)

4.1 Spusti backend a web lokalne (cez scripts/smoke_local.sh alebo ekvivalent) a zapis, na ktorych portoch.
4.2 Ak je dostupny headless prehliadac, prejdi tok: prihlasenie kupujuceho, ponuka, ziadost,
    prihlasenie predavajuceho, spustenie, prehravanie. Screenshot kazdeho kroku do docs/evidence/.
    Ak prehliadac nie je dostupny, napis NEOVERENE V TOMTO PROSTREDI a vypis, co by bolo treba.
4.3 Dvakrat spusti test viacerych firiem: dve firmy, jedna nesmie vidiet ponuku, ziadost ani stream druhej.
4.4 Plna sada testov, vystup do docs/STREAM_OVERENIE.md. Veta z R12.

## 7. PRODUKCNY PROFIL BEZ NASADENIA (FAZA 5)

5.1 Validacia env premennych pri starte: chybajuce povinne premenne = jasna chyba, proces skonci.
5.2 Security headers, CORS z env bez wildcardu, rate limit na prihlasenie a ziadosti.
5.3 Dockerfile: pripnuta verzia, neprivilegovany uzivatel, HEALTHCHECK. Ak Docker nie je, NEOVERENE.
5.4 render.yaml: over, ci konfiguracia zodpoveda obmedzeniam platformy. Ak nie je jasne, ci Render
    podporuje UDP pre mediasoup, napis to ako NEOVERENE a nepredpokladaj.
5.5 docs/NASADENIE_VPS.md: postup pre VPS (docker-compose, porty, UDP rozsah, TURN, TLS cez Caddy).
    Nie je to deploy, je to navod.
5.6 docs/PRED_NASADENIM.md: zoznam veci, ktore musi dodat prevadzkovatel: server alebo Render ucet,
    domena, DNS zaznam, TLS, TURN prihlasovacie udaje, JWT tajomstvo. Kazda polozka s vlastnikom a stavom.
5.7 Commit. Veta z R12.

## 8. ZAVER (FAZA 6)

6.1 scripts/check_all.sh a scripts/check_streaming.sh spusti. Vystup uloz do logs/.
6.2 docs/REPORT_DOPLNENIE.md: co bolo implementovane (commity), co je overene (vystupy), co je
    NEOVERENE V TOMTO PROSTREDI, co blokuje nasadenie, ktore rozhodnutia boli predvolene.
6.3 Commit. Potom napis: FAZA 6 DOKONCENA - CAKAM NA SCHVALENIE.
6.4 NEPUSHUJ. NENASADZUJ. Vypis zoznam prikazov, ktore by spustil prevadzkovatel, ak schvali.

## 9. FORMAT ODPOVEDE

KROK [cislo]: [Nazov]
POPIS: co a preco
SUBORY: vytvorene/upravene
IMPLEMENTACIA: prikazy
VYSLEDOK: posledných 15 riadkov skutocneho vystupu
PRICINA: preco krok
INE MOZNOSTI: zamietnute alternativy
RIZIKA: riziko a eliminacia

Teraz precitaj docs/PROGRES.md, git log --oneline -5 a zacni FAZOU 0.
