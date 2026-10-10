#!/usr/bin/env bash
# Prüft: Steht irgendwo auf der Website ein Preis für unsere Leistungen?
#
# Hintergrund: Der Betrieb nennt bewusst keine Preise – weder Pauschal- noch
# Richtpreise. Die Kostenseite und llms.txt sagen das ausdrücklich zu. Eine
# versehentlich eingebaute Zahl würde dieser Zusage widersprechen und von
# KI-Systemen als unser Preis zitiert.
#
# Gemeldet wird jede Geldangabe, die nicht in scripts/preise-ausnahmen.txt
# steht. Die Ausnahmen sind Fremdkosten (Bußgelder, Behördengebühren), keine
# eigenen Preise – jede Zeile dort ist bewusst freigegeben.
#
# Gegenprobe: scripts/pruefe-keine-preise.sh --gegenprobe
# legt eine Datei mit einem Preis an und lässt denselben Entscheidungsweg
# darüber laufen. Erwartet wird, dass die Prüfung anschlägt. Eine Prüfung,
# die nie anschlägt, ist keine.
set -u
cd "$(dirname "$0")/.." || exit 2
AUSNAHMEN="$(pwd)/scripts/preise-ausnahmen.txt"

# Geldangaben in ausgelieferten Dateien suchen.
# node_modules und js/vendor sind Fremdcode: three.js enthält z. B. eine
# Währungstabelle und ist kein Seiteninhalt.
sammeln() {
  grep -rnoE '.{0,40}(€|EUR [0-9]|[0-9][.,][0-9]{3} ?(Euro|EUR)).{0,40}' \
    --include=*.html --include=*.txt \
    --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=.git \
    "$1" 2>/dev/null \
    | grep -v 'priceCurrency' \
    | grep -v '"price": *"0"' \
    | sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//' \
    | sort -u
}

# Der vollständige Entscheidungsweg: suchen, Ausnahmen abziehen, übrig?
unerlaubte() {
  local gefunden
  gefunden=$(sammeln "$1")
  [ -z "$gefunden" ] && return 0
  if [ -f "$AUSNAHMEN" ]; then
    # -F statt -xF: die Ausnahme muss nur im Fund enthalten sein. Sonst würde
    # jede neue Zeilennummer die Ausnahme ungültig machen.
    echo "$gefunden" | grep -vF -f "$AUSNAHMEN" || true
  else
    echo "$gefunden"
  fi
}

if [ "${1:-}" = "--gegenprobe" ]; then
  echo "Gegenprobe: eingebaute Preisangabe, geprüft über denselben Weg"
  tmp=$(mktemp -d)
  printf '<p>Terrassendach ab 4.900 EUR inklusive Montage.</p>\n' > "$tmp/probe.html"
  # Zusätzlich eine freigegebene Fremdkostenzeile: sie darf NICHT anschlagen
  printf '<p>Bußgeldern (bis zu 500.000 €) drohen bei Bauen ohne Genehmigung.</p>\n' > "$tmp/erlaubt.html"
  ergebnis=$(unerlaubte "$tmp")
  rm -rf "$tmp"
  if [ -z "$ergebnis" ]; then
    echo "  FEHLGESCHLAGEN – der eingebaute Preis wurde NICHT gemeldet"
    exit 1
  fi
  if echo "$ergebnis" | grep -q '500.000'; then
    echo "  FEHLGESCHLAGEN – die freigegebene Fremdkostenzeile wurde fälschlich gemeldet"
    exit 1
  fi
  echo "  bestanden – Preis gemeldet, Fremdkosten durchgelassen:"
  echo "$ergebnis" | sed 's/^/            /'
  exit 0
fi

echo "Preisangaben auf der Website"
unerlaubt=$(unerlaubte ".")
if [ -z "$unerlaubt" ]; then
  echo "  ok      keine Preisangaben außerhalb der freigegebenen Ausnahmen"
  echo "Ergebnis: bestanden"
  exit 0
fi
echo "  FEHLER  nicht freigegebene Geldangaben gefunden:"
echo "$unerlaubt" | sed 's/^/          /'
echo "Ergebnis: prüfen. Ist es ein Fremdkosten-Hinweis, in $AUSNAHMEN eintragen."
exit 1
