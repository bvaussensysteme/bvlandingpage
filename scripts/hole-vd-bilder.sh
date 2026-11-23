#!/usr/bin/env bash
# ============================================================
# Holt Bilder vom Hersteller und legt sie unter images/vd_... ab.
#
# WOZU. Ansage des Betreibers vom 23.11.2026: "Zieh dir von den seiten
# alle Infos, alle Bilder die du kriegst" und "von cd darf ich alles
# nehmen" (gemeint ist VD). Die Bildnutzung ist laut
# docs/VD-INHALTE-INVENTAR.md vertraglich erlaubt; dort steht auch,
# dass alle Dateien mit dem Praefix vd_ aus dem Liefervertrag stammen
# und bei einem Vertragsende ueber genau dieses Praefix wieder
# entfernt werden koennen. Deshalb landet hier NICHTS ohne vd_.
#
# AUFRUF:
#   bash scripts/hole-vd-bilder.sh liste.txt
# Jede Zeile der Liste: <URL> <Zieldateiname ohne Pfad>
# Zeilen mit # werden uebersprungen.
#
# Der Zieldateiname MUSS mit vd_ beginnen, sonst bricht das Skript ab.
# Vorhandene Dateien werden nicht ueberschrieben: Ein zweiter Lauf
# soll nichts kaputtmachen.
# ============================================================
set -u
cd "$(dirname "$0")/.." || exit 2
LISTE="${1:-}"
[ -z "$LISTE" ] && { echo "Aufruf: bash scripts/hole-vd-bilder.sh <liste.txt>"; exit 2; }
[ -f "$LISTE" ] || { echo "Liste nicht gefunden: $LISTE"; exit 2; }
mkdir -p images

geholt=0; vorhanden=0; fehler=0
while read -r url ziel _rest; do
  case "$url" in ''|'#'*) continue ;; esac
  [ -z "$ziel" ] && { echo "FEHLER  Zeile ohne Zielnamen: $url"; fehler=$((fehler+1)); continue; }
  case "$ziel" in
    vd_*) : ;;
    *) echo "FEHLER  Zielname ohne vd_-Praefix: $ziel"; fehler=$((fehler+1)); continue ;;
  esac
  if [ -f "images/$ziel" ]; then
    echo "da      images/$ziel"
    vorhanden=$((vorhanden+1)); continue
  fi
  if curl -sfL --max-time 60 -o "images/$ziel.teil" "$url"; then
    # Nur behalten, was wirklich ein Bild ist.
    art=$(file -b --mime-type "images/$ziel.teil")
    case "$art" in
      image/*) mv "images/$ziel.teil" "images/$ziel"
               echo "neu     images/$ziel  ($(du -h "images/$ziel" | cut -f1), $art)"
               geholt=$((geholt+1)) ;;
      *) rm -f "images/$ziel.teil"
         echo "FEHLER  kein Bild ($art): $url"; fehler=$((fehler+1)) ;;
    esac
  else
    rm -f "images/$ziel.teil"
    echo "FEHLER  nicht ladbar: $url"; fehler=$((fehler+1))
  fi
done < "$LISTE"

echo ""
echo "$geholt neu, $vorhanden schon da, $fehler Fehler."
[ "$geholt" -gt 0 ] && echo "NICHT VERGESSEN: die neuen Dateien in docs/VD-INHALTE-INVENTAR.md eintragen."
exit $([ "$fehler" -gt 0 ] && echo 1 || echo 0)
