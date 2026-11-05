#!/usr/bin/env bash
# ---------------------------------------------------------------
# Prueft an der LIVE-Seite: Liegen interne Dateien offen?
#
# ANLASS (05.11.2026). wrangler.jsonc liefert das Verzeichnis "."
# aus - also ALLES, was nicht in .assetsignore steht. Nachgemessen
# waren oeffentlich erreichbar:
#
#   /scripts/pruefe-marken.js   HTTP 200, 54 kB
#   /src/_includes/layout.njk   HTTP 200
#   /node_modules/...           2250 Dateien
#   /.claude/settings.json      HTTP 200
#
# Keine Zugangsdaten darunter - aber scripts/pruefe-werkstatt.js
# beschreibt die Passwortschranke samt der Liste, wie sie zu brechen
# waere, und pruefe-konfigurator-sperre.js und pruefe-messung.* tun
# dasselbe fuer Sperre und Messung.
#
# WARUM EINE LIVE-PRUEFUNG UND KEINE DATEIPRUEFUNG: .assetsignore
# anzusehen beweist nichts. Nur der Abruf zeigt, was Cloudflare
# wirklich herausgibt - und genau da lag der Unterschied.
#
# Gegenprobe: bash scripts/pruefe-nicht-oeffentlich.sh --gegenprobe
#   Fragt zusaetzlich Pfade ab, die oeffentlich sein MUESSEN. Meldet
#   die Pruefung nichts, prueft sie nichts.
# ---------------------------------------------------------------
set -u
ZIEL="${BV_ZIEL:-https://bv-aussensysteme.de}"
gegenprobe=""
[ "${1:-}" = "--gegenprobe" ] && gegenprobe=1

# Muessen 404 (oder zumindest nicht 200) liefern.
GESPERRT="
scripts/pruefe-marken.js
scripts/pruefe-werkstatt.js
scripts/pruefe-konfigurator-sperre.js
scripts/pruefe-messung.js
scripts/pruefe-nicht-oeffentlich.sh
src/_includes/layout.njk
src/widerruf.njk
src/css/style.css
node_modules/.package-lock.json
.claude/settings.json
package.json
eleventy.config.js
CLAUDE.md
docs/NEXT_TASK.md
docs/zahlen-lesen.md
worker/index.js
wrangler.jsonc
.git/config
"

# Muessen 200 liefern - sonst haette die Ausnahmeliste zu viel erwischt.
OEFFENTLICH="

css/style.css
js/konfigurator-3d.js
js/anfrage-wizard.js
datenschutz.html
widerruf.html
windzonen.html
"

fehler=0; ok=0
hole() { curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$ZIEL/$1"; }

echo "Interne Dateien duerfen nicht ausgeliefert werden ($ZIEL)"
for p in $GESPERRT; do
  code=$(hole "$p")
  if [ "$code" = "200" ]; then
    echo "  FEHLER  /$p ist oeffentlich erreichbar (HTTP 200)"
    fehler=$((fehler+1))
  else
    ok=$((ok+1))
  fi
done
echo "  ok      $ok von $((ok+fehler)) internen Pfaden sind nicht erreichbar"

if [ -n "$gegenprobe" ]; then
  echo "Gegenprobe: Seiten, die oeffentlich sein MUESSEN"
  blind=0; gut=0
  for p in $OEFFENTLICH; do
    code=$(hole "$p")
    if [ "$code" = "200" ]; then gut=$((gut+1)); else
      echo "  FEHLER  /$p liefert $code - die Ausnahmeliste hat zu viel erwischt"
      blind=$((blind+1))
    fi
  done
  echo "  $gut von $((gut+blind)) oeffentlichen Pfaden erreichbar"
  if [ "$blind" -gt 0 ]; then echo "Ergebnis: nicht bestanden"; exit 1; fi
  # Die Gegenprobe im engeren Sinn: ein Pfad, der sicher nicht existiert,
  # darf NICHT als "nicht erreichbar" durchgehen, ohne dass es auffaellt -
  # sonst wuerde die Pruefung auch bei abgeschalteter Seite gruen melden.
  erf=$(hole "")
  if [ "$erf" != "200" ]; then
    echo "  BLIND - die Seite antwortet gar nicht, die Pruefung sagt nichts"
    exit 1
  fi
  echo "  bestanden - die Seite antwortet, und die Trennung stimmt in beide Richtungen"
  exit 0
fi

if [ "$fehler" -gt 0 ]; then
  echo
  echo "  Gehoert in .assetsignore. wrangler.jsonc liefert das Verzeichnis \".\""
  echo "  aus - alles, was dort nicht steht, ist oeffentlich."
  echo "Ergebnis: nicht bestanden"
  exit 1
fi
echo "Ergebnis: bestanden"
exit 0
