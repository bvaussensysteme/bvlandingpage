#!/usr/bin/env bash
# ---------------------------------------------------------------
# Prueft: Stimmen die erzeugten HTML-Dateien mit ihren Vorlagen
# ueberein? Anders gesagt: Wuerde ein "npm run build" irgendetwas
# veraendern, das schon im Repository liegt?
#
# ANLASS (04.11.2026, nachts). Vier Aenderungen desselben Tages waren
# direkt in erzeugte HTML-Dateien geschrieben worden, nicht in ihre
# .njk-Vorlagen. Sie waren veroeffentlicht und sichtbar - aber EIN
# "npm run build" haette sie alle stillschweigend zurueckgenommen:
#
#   datenschutz.html     110 Zeilen - der GANZE Abschnitt 19 zur
#                        eigenen Reichweitenmessung
#   windzonen.html        68 Zeilen - der Weg vom Ergebnis zum
#                        Vorhaben, dazu die 16-px-Regel
#   baugenehmigung.html   25 Zeilen - die Querverweise
#   widerruf.html         14 Zeilen - die 16-px-Felder
#
# Der Datenschutzfall ist der schwerste: Die Messung laeuft. Eine
# Datenschutzerklaerung, die sie nicht nennt, ist ein eigener
# Verstoss - unabhaengig davon, ob die Messung zulaessig waere. Der
# Verstoss waere entstanden, ohne dass jemand etwas aendert: allein
# durch ein Bauen.
#
# WIE GEPRUEFT WIRD: bauen und nachsehen, ob sich eine Datei im
# Repository veraendert hat. Kein Abgleich von Dateilisten, keine
# Annahme darueber, welche Seite aus welcher Vorlage kommt - das
# Bauen selbst beantwortet die Frage.
#
# Gegenprobe: bash scripts/pruefe-erzeugte-seiten.sh --gegenprobe
# ---------------------------------------------------------------
set -u
cd "$(dirname "$0")/.." || exit 2

gegenprobe=""
[ "${1:-}" = "--gegenprobe" ] && gegenprobe=1

if [ -n "$(git status --porcelain)" ]; then
  echo "Uebersprungen: Es liegen ungesicherte Aenderungen im Arbeitsbaum."
  echo "   Diese Pruefung baut und vergleicht danach gegen den Commit -"
  echo "   mit offenen Aenderungen waere das Ergebnis bedeutungslos."
  echo "Ergebnis: uebersprungen (kein Fehler)"
  exit 0
fi

if [ -n "$gegenprobe" ]; then
  # Die VORLAGE aendern, nicht die erzeugte Datei. Beides beschreibt
  # denselben Zustand - Vorlage und Ergebnis laufen auseinander - aber
  # nur so ist er zu sehen: Wird die erzeugte Datei von Hand geaendert
  # und nicht committet, schreibt der Build sie im selben Lauf wieder
  # zurueck, und danach ist nichts mehr zu finden. Der erste Entwurf
  # dieser Gegenprobe tat genau das und meldete die Pruefung als blind.
  printf '\n<!-- absichtlicher Fehler der Gegenprobe -->\n' >> src/widerruf.njk
  echo "Gegenprobe: src/widerruf.njk geaendert, widerruf.html unberuehrt"
fi

if ! npm run build >/dev/null 2>&1; then
  echo "  FEHLER  npm run build laeuft nicht durch"
  [ -n "$gegenprobe" ] && git checkout -- . >/dev/null 2>&1
  echo "Ergebnis: nicht bestanden"
  exit 1
fi

geaendert=$(git status --porcelain | awk '{print $2}')

if [ -n "$gegenprobe" ]; then
  git checkout -- . >/dev/null 2>&1
  if [ -n "$geaendert" ]; then
    echo "  bestanden - das Auseinanderlaufen wurde bemerkt:"
    echo "$geaendert" | sed 's/^/     /'
    exit 0
  fi
  echo "  BLIND - das Auseinanderlaufen blieb unbemerkt"
  exit 1
fi

if [ -n "$geaendert" ]; then
  echo "  FEHLER  Der Build veraendert Dateien, die schon im Repository liegen."
  echo "          Diese Seiten wurden von Hand bearbeitet statt ihre Vorlage:"
  echo "$geaendert" | sed 's/^/            /'
  echo
  echo "          Die Aenderung gehoert in src/<name>.njk. Sonst nimmt der"
  echo "          naechste Build sie stillschweigend zurueck."
  git checkout -- . >/dev/null 2>&1
  echo "Ergebnis: nicht bestanden"
  exit 1
fi

echo "  ok      Jede erzeugte Seite stimmt mit ihrer Vorlage ueberein"
echo "Ergebnis: bestanden"
exit 0
