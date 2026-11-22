#!/usr/bin/env bash
# ============================================================
# Erzeugt die kleinen Stoffmuster fuer die Startseite.
#
# ANLASS (22.11.2026). Ansage des Betreibers: Im Abschnitt
# "Markisenstoffe" sollen "ein paar Stueck als kleine Bilder" stehen,
# zum Wischen und Nacheinander-Ansehen; wer alle in voller Groesse
# will, geht ueber den Knopf auf /stoffe.html.
#
# WARUM NICHT DIE VORHANDENEN DATEIEN. images/stoffe/*-flat.png sind
# 1024 x 205 grosse Baender und wiegen im Schnitt 109 KB. Acht davon
# waeren rund 870 KB auf einer Startseite, die ohnehin schon 2,2 MB
# laedt. Hier werden daraus Quadrate von 240 px geschnitten; gemessen
# bleiben je rund 10 bis 30 KB.
#
# WARUM EIN QUADRAT. Das Band zeigt dasselbe Muster ueber die ganze
# Breite. Ein mittiger Ausschnitt verliert also nichts und ergibt eine
# Kachel, die neben den anderen Kacheln der Seite nicht aus der Reihe
# faellt.
#
# Aufruf:   bash scripts/baue-stoff-miniaturen.sh
# Ergebnis: images/stoffe/mini/*.webp (gehoeren ins Repository)
# Neu erzeugen, wenn die Auswahl unten geaendert wird.
# ============================================================
set -eu
cd "$(dirname "$0")/.."

# ALLE Dessins, die es als Band gibt. Ansage des Betreibers vom
# 22.11.2026: "mach nicht nur 8 Muster zum Durchblaettern, sondern
# schon, ich sag mal so, kannst ja auch alle."
#
# Die REIHENFOLGE im Streifen steht NICHT hier, sondern in
# scripts/stoff-reihenfolge.txt. Grund: Der Betreiber will die
# beliebten Muster vorne haben, und Beliebtheit ist nichts, was
# dieses Skript wissen kann.
MUSTER=$(ls images/stoffe/*-flat.png | sed 's|.*/||; s|-flat.png||')

# NICHT images/stoffe/mini: Dieses Verzeichnis gehoert dem
# 3D-Konfigurator. js/konfigurator-3d.js und js/konfigurator-frei.js
# benutzen die Dateien dort als Stofftexturen, scripts/pruefe-stoffe.js
# prueft sie. Beim ersten Versuch am 22.11.2026 habe ich acht davon
# ueberschrieben; wiederhergestellt mit git checkout, Pruefung danach
# wieder gruen. Die Startseite bekommt ihr eigenes Verzeichnis.
ZIEL="images/stoffe/startseite"
mkdir -p "$ZIEL"

for m in $MUSTER; do
  quelle="images/stoffe/${m}-flat.png"
  if [ ! -f "$quelle" ]; then
    echo "FEHLT: $quelle" >&2
    exit 1
  fi
  convert "$quelle" \
    -gravity center -crop 205x205+0+0 +repage \
    -resize 240x240 -strip -quality 78 \
    "$ZIEL/${m}.webp"
  groesse=$(( $(stat -c%s "$ZIEL/${m}.webp") / 1024 ))
  echo "  ${m}.webp  ${groesse} KB"
done

gesamt=$(du -sk "$ZIEL" | cut -f1)
echo "Zusammen: ${gesamt} KB in $ZIEL"
