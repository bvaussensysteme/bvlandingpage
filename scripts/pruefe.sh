#!/usr/bin/env bash
# Startet Pruefskripte, ohne dass man ihre Dateiendung kennen muss.
#
# Hintergrund: Die Skripte sind teils .mjs, teils .js, teils .py, teils
# .sh. Wer sie einzeln aufruft, raet die Endung, und ein falsch geratenes
# "node scripts/pruefe-stufen.mjs" endet mit MODULE_NOT_FOUND. Das sieht
# in einer Liste aus wie ein abgestuerztes Skript, und am 14.11.2026 ist
# das dreimal passiert: bei pruefe-fuehrung, pruefe-stufen und
# pruefe-datenschutz. Jedes Mal war in Wirklichkeit alles in Ordnung.
#
#   scripts/pruefe.sh stufen fuehrung datenschutz
#   scripts/pruefe.sh --alle
#   scripts/pruefe.sh --alle --gegenprobe
#
# Browserskripte brauchen Zeit und einen eigenen Port, deshalb laeuft
# hier alles NACHEINANDER. Parallel gestartet streiten sie sich um feste
# Ports und melden zufaellige Fehler (siehe docs/pruefungen.md).
set -u
cd "$(dirname "$0")/.." || exit 2

ZEIT=600
GEGENPROBE=""
NAMEN=()
for a in "$@"; do
  case "$a" in
    --gegenprobe) GEGENPROBE="--gegenprobe" ;;
    --alle)       NAMEN+=(ALLE) ;;
    *)            NAMEN+=("$a") ;;
  esac
done
[ ${#NAMEN[@]} -eq 0 ] && NAMEN=(ALLE)

starte() {
  local datei="$1" name
  name=$(basename "$datei")
  printf '%-44s ' "$name"
  local ausgabe rc
  case "$datei" in
    *.sh) ausgabe=$(timeout $ZEIT bash    "$datei" $GEGENPROBE 2>&1); rc=$? ;;
    *.py) ausgabe=$(timeout $ZEIT python3 "$datei" $GEGENPROBE 2>&1); rc=$? ;;
    *)    ausgabe=$(timeout $ZEIT node    "$datei" $GEGENPROBE 2>&1); rc=$? ;;
  esac
  local letzte
  letzte=$(printf '%s\n' "$ausgabe" | tail -1)
  if [ $rc -eq 124 ]; then
    echo "ZEITLIMIT nach ${ZEIT}s (nicht gelaufen, also nicht gruen)"
  else
    echo "$letzte"
  fi
  return $rc
}

fehler=0
if [ "${NAMEN[0]}" = "ALLE" ]; then
  for f in scripts/pruefe-*; do
    [ "$(basename "$f")" = "pruefe.sh" ] && continue
    starte "$f" || fehler=$((fehler+1))
  done
else
  for n in "${NAMEN[@]}"; do
    treffer=(scripts/pruefe-"$n".*)
    if [ ! -e "${treffer[0]}" ]; then
      printf '%-44s %s\n' "pruefe-$n" "GIBT ES NICHT"
      fehler=$((fehler+1)); continue
    fi
    starte "${treffer[0]}" || fehler=$((fehler+1))
  done
fi

echo
if [ $fehler -eq 0 ]; then
  echo "Ergebnis: alle aufgerufenen Pruefungen ohne Beanstandung"
else
  echo "Ergebnis: $fehler Pruefung(en) mit Beanstandung oder nicht gelaufen"
fi
exit $((fehler > 0))
