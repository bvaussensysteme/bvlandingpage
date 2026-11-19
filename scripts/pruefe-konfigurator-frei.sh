#!/usr/bin/env bash
# ============================================================
# Haelt die freie Planung von den oeffentlichen Konfiguratoren getrennt.
#
# Anlass: Ansage des Betreibers vom 17.11.2026, "Mach am besten noch
# eine Kopie, noch eine Seite daneben, wo nur intern ist, damit du den
# oeffentlichen nicht zerschiesst." Eine Kopie schuetzt nur so lange,
# wie sie wirklich getrennt bleibt. Dieses Skript weist das nach.
#
# Geprueft wird:
#   1. Die oeffentlichen Seiten laden weiter js/konfigurator-3d.js und
#      NICHT die freie Fassung.
#   2. Die freie Seite laedt js/konfigurator-frei.js und NICHT die
#      oeffentliche Fassung.
#   3. Die freie Seite steht unter /werkstatt/, traegt noindex und das
#      sichtbare Band.
#   4. Das Merkmal BV_KONFIGURATOR_FREI steht NUR in der freien Fassung.
#   5. Auf die freie Fassung verweist nichts ausserhalb von werkstatt/.
#   6. ABDRIFT: Der im Kopf der Kopie vermerkte Herkunfts-Commit ist
#      noch der letzte Stand von js/konfigurator-3d.js.
#
# Zu 6: Dieser Punkt schlaegt absichtlich an, sobald jemand den
# oeffentlichen Konfigurator aendert. Das ist der Sinn. Dann ist zu
# entscheiden, ob die Aenderung auch in die freie Fassung gehoert.
# Danach wird die Zeile "ABGESPALTEN VON" im Kopf auf den neuen Stand
# gesetzt. Siehe docs/konfigurator-frei.md.
#
# Aufruf:     bash scripts/pruefe-konfigurator-frei.sh
# Gegenprobe: bash scripts/pruefe-konfigurator-frei.sh --gegenprobe
# ============================================================
set -u
WURZEL="${BV_WURZEL:-$(cd "$(dirname "$0")/.." && pwd)}"
GEGENPROBE=0
[ "${1:-}" = "--gegenprobe" ] && GEGENPROBE=1

fehler=0
anzahl=0
pruef() {   # pruef "Name" wahr_falsch "Beleg"
  anzahl=$((anzahl + 1))
  if [ "$2" = "1" ]; then
    [ "$GEGENPROBE" = "0" ] && printf '  ok      %-54s %s\n' "$1" "$3"
  else
    printf '  FEHLER  %-54s %s\n' "$1" "$3"
    fehler=$((fehler + 1))
  fi
}
hat() { grep -qF "$2" "$WURZEL/$1" 2>/dev/null && echo 1 || echo 0; }
nicht() { grep -qF "$2" "$WURZEL/$1" 2>/dev/null && echo 0 || echo 1; }

[ "$GEGENPROBE" = "0" ] && echo "Freie Planung: Trennung von den oeffentlichen Konfiguratoren"
[ "$GEGENPROBE" = "0" ] && echo

pruef "oeffentlicher Konfigurator laedt die oeffentliche Fassung" \
  "$(hat konfigurator.html 'js/konfigurator-3d.js')" "konfigurator.html"
pruef "oeffentlicher Konfigurator laedt NICHT die freie Fassung" \
  "$(nicht konfigurator.html 'konfigurator-frei.js')" "konfigurator.html"
pruef "Werkstatt-Konfigurator laedt die oeffentliche Fassung" \
  "$(hat werkstatt/index.html '/js/konfigurator-3d.js')" "werkstatt/index.html"
pruef "Werkstatt-Konfigurator laedt NICHT die freie Fassung" \
  "$(nicht werkstatt/index.html 'konfigurator-frei.js')" "werkstatt/index.html"
pruef "freie Seite laedt die freie Fassung" \
  "$(hat werkstatt/frei.html '/js/konfigurator-frei.js')" "werkstatt/frei.html"
pruef "freie Seite laedt NICHT die oeffentliche Fassung" \
  "$(nicht werkstatt/frei.html '/js/konfigurator-3d.js')" "werkstatt/frei.html"
pruef "freie Seite ist von Suchmaschinen ausgenommen" \
  "$(hat werkstatt/frei.html 'noindex')" "robots-Angabe"
# Nicht nur "steht in der Datei": Am 17.11.2026 lag das Band im KOPF,
# weil ein <body> in einem Kommentar frueher kam als das echte. Die
# Textpruefung war gruen, der Browser zeigte nichts. Deshalb wird die
# Reihenfolge mitgeprueft.
# Nach dem Band selbst suchen, nicht nach seinem Text: Derselbe Satz
# steht im <title> auf Zeile 39 und machte die Pruefung erst falsch rot.
bandZ="$(grep -n 'role="note"' "$WURZEL/werkstatt/frei.html" | head -1 | cut -d: -f1)"
kopfZ="$(grep -n '</head>' "$WURZEL/werkstatt/frei.html" | head -1 | cut -d: -f1)"
pruef "freie Seite traegt das sichtbare Band im Koerper" \
  "$([ -n "$bandZ" ] && [ -n "$kopfZ" ] && [ "$bandZ" -gt "$kopfZ" ] && echo 1 || echo 0)" \
  "Band Zeile ${bandZ:-?}, </head> Zeile ${kopfZ:-?}"
pruef "Merkmal steht in der freien Fassung" \
  "$(hat js/konfigurator-frei.js 'window.BV_KONFIGURATOR_FREI = true')" "js/konfigurator-frei.js"
pruef "Merkmal steht NICHT in der oeffentlichen Fassung" \
  "$(nicht js/konfigurator-3d.js 'BV_KONFIGURATOR_FREI')" "js/konfigurator-3d.js"

# 5: kein Verweis ausserhalb von werkstatt/
treffer="$(cd "$WURZEL" && grep -rl 'konfigurator-frei\.js' \
  --include='*.html' --include='*.njk' . 2>/dev/null \
  | grep -v '^\./node_modules' | grep -v '^\./werkstatt/' | tr '\n' ' ')"
pruef "kein Verweis auf die freie Fassung ausserhalb von werkstatt/" \
  "$([ -z "$treffer" ] && echo 1 || echo 0)" "${treffer:-nichts gefunden}"

# 6b: Zwischenspeicher. Aendert sich die Skriptdatei, muss die
# Versionsnummer im Skript-Tag mitwachsen, sonst laedt der Browser die
# alte Fassung weiter. Am 17.11.2026 genau so passiert.
standSoll="$(grep -o 'Stand von js/konfigurator-frei\.js: [0-9a-f]*' \
  "$WURZEL/werkstatt/frei.html" 2>/dev/null | awk '{print $NF}')"
standIst="$(cd "$WURZEL" && git hash-object js/konfigurator-frei.js 2>/dev/null)"
if [ -z "$standSoll" ]; then
  pruef "Stand der Skriptdatei ist in der Seite vermerkt" 0 "Zeile fehlt"
else
  pruef "Versionsnummer passt zum Stand der Skriptdatei" \
    "$([ "$standSoll" = "$standIst" ] && echo 1 || echo 0)" \
    "Seite sagt ${standSoll:0:12}, Datei ist ${standIst:0:12}"
fi

# 5b: Die Bildkorrektur fuer die Masslinien gehoert in BEIDE Fassungen.
#     Sie wurde in der Kopie gemessen (pruefe-freie-planung.mjs); dass die
#     oeffentliche Fassung dieselbe Rechnung hat, wird hier gezeigt.
pruef "Bildkorrektur fuer die Masslinien in der oeffentlichen Fassung" \
  "$(hat js/konfigurator-3d.js 'function massAbstandFuerBild')" "js/konfigurator-3d.js"
rumpfA="$(sed -n '/function massAbstandFuerBild/,/^  }$/p' "$WURZEL/js/konfigurator-3d.js")"
rumpfB="$(sed -n '/function massAbstandFuerBild/,/^  }$/p' "$WURZEL/js/konfigurator-frei.js")"
pruef "beide Fassungen rechnen den Bildabstand gleich" \
  "$([ -n "$rumpfA" ] && [ "$rumpfA" = "$rumpfB" ] && echo 1 || echo 0)" \
  "$(printf '%s' "$rumpfA" | wc -l) Zeilen verglichen"

# 6: Abdrift
kopf="$(grep -o 'ABGESPALTEN VON: js/konfigurator-3d.js, Stand [0-9a-f]\{7,\}' \
  "$WURZEL/js/konfigurator-frei.js" 2>/dev/null | awk '{print $NF}')"
jetzt="$(cd "$WURZEL" && git log -1 --format=%h -- js/konfigurator-3d.js 2>/dev/null)"
if [ -z "$kopf" ]; then
  pruef "Herkunfts-Commit steht im Kopf der Kopie" 0 "Zeile ABGESPALTEN VON fehlt"
elif [ -z "$jetzt" ]; then
  pruef "Herkunfts-Commit lesbar" 0 "git antwortet nicht"
else
  pruef "keine Abdrift: oeffentliche Fassung unveraendert seit der Kopie" \
    "$([ "$kopf" = "$jetzt" ] && echo 1 || echo 0)" \
    "Kopf sagt $kopf, zuletzt geaendert in $jetzt"
fi

if [ "$GEGENPROBE" = "1" ]; then
  # Jeder eingebaute Fehler einzeln, auf einer Wegwerfkopie.
  TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
  (cd "$WURZEL" && tar cf - konfigurator.html werkstatt/frei.html \
     werkstatt/index.html js/konfigurator-frei.js js/konfigurator-3d.js) \
     | (cd "$TMP" && tar xf -)
  (cd "$WURZEL" && git log -1 --format=%h -- js/konfigurator-3d.js) > "$TMP/.stand"
  echo "Gegenprobe: 4 eingebaute Fehler, jeder einzeln"
  echo
  erkannt=0; gesamt=0
  probe() {   # probe "Name" datei alt neu
    gesamt=$((gesamt + 1))
    local sich; sich="$(cat "$TMP/$2")"
    python3 - "$TMP/$2" "$3" "$4" << 'PY'
import sys
p,a,b=sys.argv[1],sys.argv[2],sys.argv[3]
t=open(p,encoding='utf-8').read()
if a not in t: sys.exit(9)
open(p,'w',encoding='utf-8').write(t.replace(a,b,1))
PY
    if [ $? -eq 9 ]; then
      echo "  NICHT GEFUNDEN  $1  (Stelle fehlt in der Datei)"
      printf '%s' "$sich" > "$TMP/$2"; return
    fi
    if BV_WURZEL="$TMP" bash "$0" 2>/dev/null | grep -q 'FEHLER'; then
      echo "  erkannt   $1"; erkannt=$((erkannt + 1))
    else
      echo "  NICHT ERKANNT  $1"
    fi
    printf '%s' "$sich" > "$TMP/$2"
  }
  probe "die oeffentliche Seite laedt die freie Fassung" \
    konfigurator.html 'js/konfigurator-3d.js' 'js/konfigurator-frei.js'
  probe "die freie Seite laedt die oeffentliche Fassung" \
    werkstatt/frei.html '/js/konfigurator-frei.js' '/js/konfigurator-3d.js'
  probe "das Band auf der freien Seite ist weg" \
    werkstatt/frei.html 'Freie Planung, nur intern' 'Konfigurator'
  probe "das Merkmal steckt in der oeffentlichen Fassung" \
    js/konfigurator-3d.js '(function () {' 'window.BV_KONFIGURATOR_FREI = true;
(function () {'
  echo
  echo "$erkannt von $gesamt eingebauten Fehlern erkannt."
  [ "$erkannt" = "$gesamt" ] && echo "Gegenprobe bestanden." && exit 0
  echo "Gegenprobe NICHT bestanden."; exit 1
fi

echo
if [ "$fehler" = "0" ]; then
  echo "Ergebnis: alle $anzahl Pruefungen bestanden"
  exit 0
fi
echo "Ergebnis: $fehler von $anzahl Pruefungen beanstandet"
exit 1
