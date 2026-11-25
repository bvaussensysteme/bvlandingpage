#!/bin/bash
# Laesst ALLE scripts/pruefe-* nacheinander laufen und schreibt je
# Skript eine Zeile GRUEN oder ROT in eine Ergebnisdatei.
#
# Aufruf:   bash scripts/alle-pruefungen.sh [ergebnisdatei]
# Dauer:    etwa 40 Minuten
# Ergebnis: Standard /tmp/bv-pruefergebnis.txt, letzte Zeile "GESAMT: ..."
#
# WARUM ES DIESES SKRIPT GIBT (24.11.2026):
# Die Pruefungen haben vier Endungen: .mjs und .js laufen mit node,
# .sh mit bash, .py mit python3. Ein Starter, der nur .mjs nimmt,
# ueberspringt 21 von 83 Skripten, ohne es zu melden. Das ist am
# 23.11.2026 zweimal passiert. Deshalb zaehlt dieses Skript mit und
# nennt am Ende die Zahl der UEBERSPRUNGENEN; sie muss 0 sein.
#
# DREI DINGE, DIE MAN WISSEN MUSS:
# 1. Nie zwei Laeufe gleichzeitig. Sie schreiben in dieselbe Datei und
#    machen sich gegenseitig rot. Vorher pruefen: pgrep -fc alle-pruefungen
# 2. Einen Lauf ueber die PROZESSNUMMER beenden, nie ueber pkill mit
#    einem Namensmuster. Ein pkill auf den Namen der Protokolldatei
#    hat am 24.11.2026 den Lauf selbst getroffen.
# 3. Ein rotes Ergebnis ist erst nach einem Einzellauf ein Befund.
#    Welche Skripte unter Last oder durch Zufall rot werden, steht in
#    docs/pruefungen.md.
cd "$(dirname "$0")/.." || exit 1
ERG="${1:-/tmp/bv-pruefergebnis.txt}"
: > "$ERG"
G=0; R=0; U=0; N=0
for s in scripts/pruefe-*; do
  N=$((N+1))
  case "$s" in
    *.mjs|*.js) CMD="node $s" ;;
    *.sh)       CMD="bash $s" ;;
    *.py)       CMD="python3 $s" ;;
    *) echo "UEBERSPRUNGEN $s (unbekannte Endung)" >> "$ERG"; U=$((U+1)); continue ;;
  esac
  T=$(date +%s)
  if timeout 900 $CMD > /dev/null 2>&1; then
    echo "GRUEN $(( $(date +%s) - T ))s $s" >> "$ERG"; G=$((G+1))
  else
    C=$?
    echo "ROT   $(( $(date +%s) - T ))s $s (exit $C)" >> "$ERG"; R=$((R+1))
  fi
done
echo "---" >> "$ERG"
echo "GESAMT: $N   GRUEN: $G   ROT: $R   UEBERSPRUNGEN: $U" >> "$ERG"
