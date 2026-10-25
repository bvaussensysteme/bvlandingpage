#!/bin/sh
# Sucht liegengebliebene Merge-Marken im ganzen Projekt.
#
# ANLASS: Zum zweiten Mal sind Konfliktmarken in eine Datei geraten und
# mitgeliefert worden - am 23.10.2026 in scripts/pruefe-rueckseite.js, am
# 25.10.2026 in scripts/pruefe-fuehrung.js und docs/NEXT_TASK.md. Beide
# Male beim Aufloesen eines Merges: die Marken wurden in EINER Datei
# beseitigt, die uebrigen mit `git add -A` unbesehen mitgenommen.
#
# Ein kaputtes Pruefskript faellt dabei besonders unangenehm auf: Es
# prueft dann gar nichts mehr und meldet trotzdem nichts - es stuerzt nur
# ab, und ein Abbruch sieht in einer langen Ausgabe aus wie "fertig".
#
# Deshalb diese Pruefung. Sie gehoert in jeden Durchlauf VOR dem Commit.
#
# Aufruf:  sh scripts/pruefe-konfliktmarken.sh [--gegenprobe]
#
# --gegenprobe legt eine Datei MIT Marken an und erwartet, dass sie
# gefunden wird. Eine Suche, die nichts findet, weil sie falsch sucht,
# sieht sonst genauso aus wie eine saubere Arbeitskopie.

set -u
GEGEN=0
[ "${1:-}" = "--gegenprobe" ] && GEGEN=1

PROBE=""
if [ "$GEGEN" = "1" ]; then
  PROBE="docs/.konfliktmarken-probe.md"
  printf '<<<<<<< HEAD\nlinks\n=======\nrechts\n>>>>>>> origin/main\n' > "$PROBE"
fi

# Nur Zeilen, die wirklich wie Marken aussehen: am Zeilenanfang, mit
# genau sieben Zeichen. Kommentarlinien aus Gleichheitszeichen (davon
# gibt es im Projekt viele) sind laenger und fallen nicht darunter.
TREFFER=$(grep -rnE '^(<{7}( .*)?|={7}|>{7}( .*)?)$' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=export \
  --exclude-dir=daten --exclude='*.min.js' --exclude='*.webp' \
  --exclude='pruefe-konfliktmarken.sh' . 2>/dev/null)

[ -n "$PROBE" ] && rm -f "$PROBE"

echo "Merge-Marken im Projekt"
if [ "$GEGEN" = "1" ]; then
  if echo "$TREFFER" | grep -q 'konfliktmarken-probe'; then
    echo "  ok      die eingebaute Probe wurde gefunden"
    echo ""
    echo "Gegenprobe: bestanden - die Suche schlaegt an, wenn sie soll"
    exit 0
  fi
  echo "  FEHLER  die eingebaute Probe wurde NICHT gefunden"
  echo ""
  echo "Gegenprobe: fehlgeschlagen - die Suche findet nichts, auch wenn sie soll"
  exit 1
fi

if [ -n "$TREFFER" ]; then
  echo "$TREFFER" | sed 's/^/  FEHLER  /'
  echo ""
  echo "Ergebnis: nicht bestanden - diese Marken duerfen nicht eingecheckt werden"
  exit 1
fi
echo "  ok      keine liegengebliebenen Marken"
echo ""
echo "Ergebnis: bestanden"
exit 0
