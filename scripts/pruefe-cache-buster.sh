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

# ============================================================
# ZWEITE PRUEFUNG: Wurde die Version auch HOCHGEZAEHLT?
# ------------------------------------------------------------
# Anlass: „ja mach noch sehe ich keine änderung" (Betreiber,
# 03.11.2026). Der Konfigurator war umgebaut und live - aber
# js/konfigurator-3d.js trug noch dieselbe Versionsnummer wie zwei Tage
# zuvor. Browser duerfen die Datei unter derselben Adresse eine Stunde
# behalten (_headers: /js/* max-age=3600). Der Betreiber sah also
# zu Recht nichts.
#
# Die erste Pruefung oben sieht das nicht: Alle Seiten zeigten brav auf
# DIESELBE veraltete Version. Deshalb hier die zweite Frage: Ist die
# Datei juenger als die Stelle, an der ihre Version zuletzt geaendert
# wurde?
# ============================================================
# Wird in der Gegenprobe in einem anderen Verzeichnis aufgerufen.
bumpPruefen() {
  local fehler=0
  local datei version letzteDatei letzteVersion
  # src/css/style.css steht hier, weil das Stylesheet genauso lange im
  # Browser-Cache liegt wie das JavaScript (24 h laut _headers) - es
  # fehlte bis zum 04.11.2026. An dem Tag aenderte eine Korrektur fuer
  # iPhones die Schriftgroesse aller Eingabefelder, und die Pruefung
  # meldete trotzdem "aktuell": Niemand haette die Aenderung einen Tag
  # lang gesehen. Geprueft wird die QUELLE, nicht css/style.css - das
  # Minifikat erzeugt der Build, sein Zeitstempel sagt nichts.
  for datei in js/konfigurator-3d.js js/anfrage-wizard.js js/messung.js \
               js/bauteile.js js/ral.js js/markisenstoffe.js \
               src/css/style.css; do
    [ -f "$datei" ] || continue
    local name
    name=$(basename "$datei")
    # Nur Dateien, die ueberhaupt mit ?v= eingebunden sind
    grep -rqho "$name?v=" --include=*.html . 2>/dev/null || continue
    letzteDatei=$(git log -1 --format=%ct -- "$datei" 2>/dev/null)
    # Der letzte Commit, der die Versionsangabe dieser Datei anfasste.
    # -G und NICHT -S: -S zaehlt, wie oft eine Zeichenkette vorkommt, und
    # beim Hochzaehlen von ?v=20261102e auf ?v=20261103c bleibt diese Zahl
    # gleich - der Commit waere unsichtbar. Beim ersten Versuch meldete
    # die Pruefung deshalb drei Dateien als veraltet, die laengst
    # hochgezaehlt waren. -G sucht im Unterschied selbst.
    letzteVersion=$(git log -1 --format=%ct -G"$name\?v=" -- '*.html' 2>/dev/null)
    if [ -z "$letzteDatei" ] || [ -z "$letzteVersion" ]; then continue; fi
    if [ "$letzteDatei" -gt "$letzteVersion" ]; then
      echo "  FEHLER  $name wurde geändert, die Version aber nicht hochgezählt"
      echo "          Datei zuletzt: $(date -d @"$letzteDatei" '+%d.%m.%Y %H:%M')," \
           "Version zuletzt: $(date -d @"$letzteVersion" '+%d.%m.%Y %H:%M')"
      fehler=1
    else
      echo "  ok      $name  (Version jünger als die Datei)"
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
  rm -rf "$tmp"

  # ---- Gegenprobe fuer die zweite Pruefung ----
  # In einem eigenen kleinen Repository: erst beides zusammen einchecken,
  # dann NUR die Javascript-Datei aendern. Genau der Fall, der am
  # 03.11.2026 unbemerkt live ging.
  echo "Gegenprobe: Datei geändert, Version stehen gelassen"
  tmp2=$(mktemp -d)
  (
    cd "$tmp2" || exit 1
    git init -q . && git config user.email t@t && git config user.name T
    mkdir -p js
    printf 'alt\n' > js/konfigurator-3d.js
    printf '<script src="/js/konfigurator-3d.js?v=1111"></script>\n' > a.html
    git add -A && git commit -qm erst
    sleep 1
    printf 'neu\n' > js/konfigurator-3d.js
    git add -A && git commit -qm "nur die Datei"
  ) >/dev/null 2>&1
  if (cd "$tmp2" && bumpPruefen) >/dev/null 2>&1; then
    echo "  FEHLGESCHLAGEN - die stehen gelassene Version wurde NICHT bemerkt"
    rm -rf "$tmp2"; exit 1
  fi
  echo "  bestanden - die stehen gelassene Version wurde bemerkt"
  rm -rf "$tmp2"
  exit 0
fi

echo "Cache-Buster-Versionen"
gesamt=0
pruefen "." || gesamt=1
echo "Wurde die Version mit der Datei hochgezählt?"
bumpPruefen || gesamt=1
if [ "$gesamt" = "0" ]; then
  echo "Ergebnis: alle Seiten verweisen auf dieselbe Version, und sie ist aktuell"
  exit 0
else
  echo "Ergebnis: vor dem Veröffentlichen angleichen bzw. hochzählen"
  exit 1
fi
