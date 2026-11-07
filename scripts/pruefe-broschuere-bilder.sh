#!/usr/bin/env bash
# Prueft die 36 Bilder der Broschuere gegen das PDF - auf einem ANDEREN
# WEG als scripts/pruefe-broschuere.mjs.
#
# WARUM ZWEI WEGE. Die Browser-Pruefung liest die Adressen aus der
# Seite: seite-01.webp bis seite-36.webp, in dieser Reihenfolge. Das
# sagt aber nichts darueber, WAS in diesen Dateien steht. Waere beim
# Umwandeln etwas verrutscht, stuende auf seite-05.webp eben Seite 6 -
# die Adressliste bliebe trotzdem makellos.
#
# Darum wird hier jede Seite aus dem PDF NEU gerendert (klein, 20 dpi)
# und mit dem ausgelieferten Bild verglichen. Gemessen wird der
# RMSE-Abstand: gleiche Seite liegt bei 0,06-0,07, verschiedene Seiten
# bei 0,28 und mehr (gemessen am 06.11.2026 an den Seiten 3, 4 und 17).
# Die Schwelle 0,15 liegt mit Abstand dazwischen.
#
# Aufruf:  scripts/pruefe-broschuere-bilder.sh [--gegenprobe]

set -u
WURZEL="$(cd "$(dirname "$0")/.." && pwd)"
BILDER="${BV_BROSCHUERE_DIR:-$WURZEL/assets/broschuere}"
PDF="${BV_BROSCHUERE_PDF:-$BILDER/BV-Broschuere.pdf}"
ANZAHL=36
SCHWELLE=0.15      # darunter: gleiche Seite
ABSTAND=0.05       # Nachbarseite muss mindestens so viel schlechter passen

for w in pdftoppm pdfinfo convert compare; do
  command -v "$w" >/dev/null 2>&1 || { echo "ABBRUCH: $w fehlt (Voraussetzung, keine Pruefung)"; exit 2; }
done

GEGEN=0
[ "${1:-}" = "--gegenprobe" ] && GEGEN=1

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# rmse <bild-a> <bild-b>  ->  Zahl zwischen 0 und 1
rmse() {
  local a="$1" b="$2"
  compare -metric RMSE "$a" "$b" null: 2>&1 | sed -n 's/.*(\([0-9.]*\)).*/\1/p'
}
kleiner() { awk -v a="$1" -v b="$2" 'BEGIN{exit !(a<b)}'; }

lauf() {  # $1 = Verzeichnis mit den Bildern, $2 = PDF; gibt "name|ok" aus
  local dir="$1" pdf="$2"
  local arbeit="$TMP/lauf"; rm -rf "$arbeit"; mkdir -p "$arbeit"

  # --- PDF-Seitenzahl ---
  local seiten; seiten="$(pdfinfo "$pdf" 2>/dev/null | sed -n 's/^Pages: *//p')"
  echo "Das PDF hat 36 Seiten|$([ "$seiten" = "$ANZAHL" ] && echo 1 || echo 0)|${seiten:-0} Seiten"

  # --- Dateien und Breiten ---
  local fehltS=0 fehltV=0 i nr b
  for i in $(seq 1 $ANZAHL); do
    nr=$(printf '%02d' "$i")
    if [ -f "$dir/seite-$nr.webp" ]; then
      b="$(identify -format '%w' "$dir/seite-$nr.webp" 2>/dev/null)"
      [ "$b" = "1400" ] || fehltS=$((fehltS+1))
    else fehltS=$((fehltS+1)); fi
    if [ -f "$dir/vorschau/seite-$nr.webp" ]; then
      b="$(identify -format '%w' "$dir/vorschau/seite-$nr.webp" 2>/dev/null)"
      [ "$b" = "300" ] || fehltV=$((fehltV+1))
    else fehltV=$((fehltV+1)); fi
  done
  echo "36 Seitenbilder, alle 1400 px breit|$([ "$fehltS" -eq 0 ] && echo 1 || echo 0)|$fehltS beanstandet"
  echo "36 Vorschaubilder, alle 300 px breit|$([ "$fehltV" -eq 0 ] && echo 1 || echo 0)|$fehltV beanstandet"

  # --- PDF neu rendern und vergleichen ---
  for i in $(seq 1 $ANZAHL); do
    pdftoppm -png -r 20 -f "$i" -l "$i" "$pdf" "$arbeit/p$i" 2>/dev/null
    local roh; roh="$(ls "$arbeit"/p$i-*.png 2>/dev/null | head -1)"
    [ -n "$roh" ] && convert "$roh" -resize 165x233! "$arbeit/pdf-$i.png" 2>/dev/null
    nr=$(printf '%02d' "$i")
    [ -f "$dir/seite-$nr.webp" ] && \
      convert "$dir/seite-$nr.webp" -resize 165x233! "$arbeit/web-$i.png" 2>/dev/null
  done

  local schlechtA=0 maxA=0 schlechtB=0 wert nachbar
  for i in $(seq 1 $ANZAHL); do
    if [ ! -f "$arbeit/web-$i.png" ] || [ ! -f "$arbeit/pdf-$i.png" ]; then
      schlechtA=$((schlechtA+1)); continue
    fi
    wert="$(rmse "$arbeit/web-$i.png" "$arbeit/pdf-$i.png")"
    [ -z "$wert" ] && wert=1
    kleiner "$wert" "$SCHWELLE" || schlechtA=$((schlechtA+1))
    kleiner "$maxA" "$wert" && maxA="$wert"
    if [ "$i" -lt "$ANZAHL" ] && [ -f "$arbeit/pdf-$((i+1)).png" ]; then
      nachbar="$(rmse "$arbeit/web-$i.png" "$arbeit/pdf-$((i+1)).png")"
      [ -z "$nachbar" ] && nachbar=0
      kleiner "$(awk -v a="$wert" -v b="$ABSTAND" 'BEGIN{print a+b}')" "$nachbar" || schlechtB=$((schlechtB+1))
    fi
  done
  echo "Jedes Seitenbild zeigt die zugehoerige PDF-Seite|$([ "$schlechtA" -eq 0 ] && echo 1 || echo 0)|$schlechtA abweichend, groesster Abstand $maxA"
  echo "Keine Seite passt besser auf ihre Nachbarseite|$([ "$schlechtB" -eq 0 ] && echo 1 || echo 0)|$schlechtB verdaechtig"

  # --- Vorschaubild gehoert zu seinem Seitenbild ---
  local schlechtC=0
  for i in $(seq 1 $ANZAHL); do
    nr=$(printf '%02d' "$i")
    if [ ! -f "$dir/vorschau/seite-$nr.webp" ] || [ ! -f "$arbeit/web-$i.png" ]; then
      schlechtC=$((schlechtC+1)); continue
    fi
    convert "$dir/vorschau/seite-$nr.webp" -resize 165x233! "$arbeit/vor-$i.png" 2>/dev/null
    wert="$(rmse "$arbeit/vor-$i.png" "$arbeit/web-$i.png")"
    [ -z "$wert" ] && wert=1
    kleiner "$wert" "$SCHWELLE" || schlechtC=$((schlechtC+1))
  done
  echo "Jedes Vorschaubild gehoert zu seinem Seitenbild|$([ "$schlechtC" -eq 0 ] && echo 1 || echo 0)|$schlechtC abweichend"
}

if [ "$GEGEN" -eq 0 ]; then
  schlecht=0
  while IFS='|' read -r name ok info; do
    if [ "$ok" = "1" ]; then printf '  ok      %-52s %s\n' "$name" "$info"
    else printf '  FEHLER  %-52s %s\n' "$name" "$info"; schlecht=$((schlecht+1)); fi
  done < <(lauf "$BILDER" "$PDF")
  echo
  if [ "$schlecht" -eq 0 ]; then echo "Ergebnis: alles bestanden"; exit 0
  else echo "Ergebnis: $schlecht nicht bestanden"; exit 1; fi
fi

# ---------------- Gegenprobe ----------------
echo "Normaler Lauf:"
gut="$(lauf "$BILDER" "$PDF")"
echo "$gut" | while IFS='|' read -r n o i; do printf '  %-52s %s\n' "$n" "$([ "$o" = 1 ] && echo ok || echo FEHLER)"; done
if echo "$gut" | grep -q '|0|'; then
  echo "ABBRUCH: Der normale Lauf ist nicht gruen - Gegenprobe sinnlos."; exit 1
fi
alle="$(echo "$gut" | cut -d'|' -f1)"
offen="$alle"

mach_kopie() {
  local ziel="$1"; rm -rf "$ziel"; mkdir -p "$ziel/vorschau"
  cp "$BILDER"/seite-*.webp "$ziel/"
  cp "$BILDER"/vorschau/seite-*.webp "$ziel/vorschau/"
  cp "$PDF" "$ziel/BV-Broschuere.pdf"
}

fehler_namen=(
  "Zwei Seitenbilder sind vertauscht"
  "Ein Seitenbild ist die Kopie der naechsten Seite"
  "Ein Seitenbild ist zu klein gerechnet"
  "Ein Vorschaubild zeigt eine andere Seite"
  "Ein Vorschaubild ist zu klein gerechnet"
  "Das PDF hat nicht 36 Seiten"
)

for nummer in 0 1 2 3 4 5; do
  dir="$TMP/f$nummer"; mach_kopie "$dir"; pdf="$dir/BV-Broschuere.pdf"
  case "$nummer" in
    0) mv "$dir/seite-05.webp" "$dir/x.webp"; mv "$dir/seite-06.webp" "$dir/seite-05.webp"; mv "$dir/x.webp" "$dir/seite-06.webp" ;;
    1) cp "$dir/seite-21.webp" "$dir/seite-20.webp" ;;
    2) convert "$dir/seite-12.webp" -resize 900x "$dir/seite-12b.webp"; mv "$dir/seite-12b.webp" "$dir/seite-12.webp" ;;
    3) cp "$dir/vorschau/seite-30.webp" "$dir/vorschau/seite-29.webp" ;;
    4) convert "$dir/vorschau/seite-08.webp" -resize 200x "$dir/vorschau/seite-08b.webp"; mv "$dir/vorschau/seite-08b.webp" "$dir/vorschau/seite-08.webp" ;;
    5) convert "$dir/seite-01.webp" "$dir/seite-02.webp" "$dir/seite-03.webp" "$dir/kurz.pdf"; pdf="$dir/kurz.pdf" ;;
  esac
  ergebnis="$(lauf "$dir" "$pdf")"
  rot="$(echo "$ergebnis" | grep '|0|' | cut -d'|' -f1)"
  if [ -z "$rot" ]; then
    echo "FEHLER: Eingebauter Fehler \"${fehler_namen[$nummer]}\" bleibt unbemerkt."; exit 1
  fi
  echo "  Fehler \"${fehler_namen[$nummer]}\": $(echo "$rot" | wc -l) Pruefung(en) schlagen an"
  while IFS= read -r r; do offen="$(echo "$offen" | grep -vxF "$r")"; done <<< "$rot"
done

if [ -n "$offen" ]; then
  echo "FEHLER: Diese Pruefungen wurden von keinem Fehler rot:"
  echo "$offen" | sed 's/^/   /'
  exit 1
fi
echo
echo "Gegenprobe in Ordnung: jede Pruefung schlaegt an."
