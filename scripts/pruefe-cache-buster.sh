#!/usr/bin/env bash
# Prüft: Verweist jede HTML-Datei auf dieselbe Version einer CSS-/JS-Datei?
#
# Hintergrund: _headers erlaubt bis zu 24 h alte CSS/JS aus dem Browser-Cache.
# Wird beim Veröffentlichen eine Datei übersehen, liefert sie tagelang den
# alten Stand aus. Genau das ist passiert: index.html hing auf v=20260727a,
# während alle anderen 49 Seiten schon auf v=20260909a standen.
#
# Gegenprobe: scripts/pruefe-cache-buster.sh --gegenprobe
# baut einen Fall mit absichtlich abweichender Version und erwartet, dass
# die Prüfung anschlägt. Eine Prüfung, die nie anschlägt, ist keine.
set -u
cd "$(dirname "$0")/.." || exit 2

pruefen() {
  local wurzel="$1" fehler=0
  # Alle Verweise der Form datei.ext?v=version einsammeln
  local liste
  liste=$(grep -rho '[a-z0-9-]*\.\(js\|css\)?v=[0-9a-z]*' \
          --include=*.html --include=*.njk --exclude-dir=export "$wurzel" 2>/dev/null | sort -u)
  [ -z "$liste" ] && { echo "  keine versionierten Dateien gefunden"; return 1; }

  local datei
  for datei in $(echo "$liste" | sed 's/?v=.*//' | sort -u); do
    local versionen anzahl
    versionen=$(echo "$liste" | grep "^${datei}?v=" | sed 's/.*?v=//' | sort -u)
    anzahl=$(echo "$versionen" | wc -l)
    if [ "$anzahl" -gt 1 ]; then
      echo "  FEHLER  $datei hat $anzahl verschiedene Versionen: $(echo "$versionen" | tr '\n' ' ')"
      # Zeigen, welche Dateien abweichen - sonst sucht man von Hand
      local haeufigste
      haeufigste=$(grep -rho "${datei}?v=[0-9a-z]*" --include=*.html --include=*.njk --exclude-dir=export "$wurzel" \
                   | sort | uniq -c | sort -rn | head -1 | sed 's/.*?v=//')
      grep -rl "${datei}?v=" --include=*.html --include=*.njk --exclude-dir=export "$wurzel" \
        | while read -r f; do
            grep -q "${datei}?v=${haeufigste}" "$f" || echo "          abweichend: $f"
          done
      fehler=1
    else
      echo "  ok      $datei  (v=$versionen)"
    fi
  done
  return $fehler
}

if [ "${1:-}" = "--gegenprobe" ]; then
  echo "Gegenprobe: absichtlich abweichende Version"
  tmp=$(mktemp -d)
  printf '<script src="/js/test.js?v=1111"></script>\n' > "$tmp/a.html"
  printf '<script src="/js/test.js?v=2222"></script>\n' > "$tmp/b.html"
  if pruefen "$tmp" >/dev/null 2>&1; then
    echo "  FEHLGESCHLAGEN - die Prüfung hat den eingebauten Fehler NICHT gefunden"
    rm -rf "$tmp"; exit 1
  fi
  echo "  bestanden - der eingebaute Fehler wurde erkannt"
  rm -rf "$tmp"; exit 0
fi

echo "Cache-Buster-Versionen"
if pruefen "."; then
  echo "Ergebnis: alle Seiten verweisen auf dieselbe Version"
  exit 0
else
  echo "Ergebnis: Versionen laufen auseinander - vor dem Veröffentlichen angleichen"
  exit 1
fi
