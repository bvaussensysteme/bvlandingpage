#!/usr/bin/env bash
# Prüft den veröffentlichten Stand auf bv-aussensysteme.de.
#
# Hintergrund und wichtigste Regel: Die Seite leitet /seite.html auf /seite
# weiter (307). Ohne -L liefert curl einen LEEREN Body – und jede Prüfung
# "kein Treffer gefunden" wirkt dann bestanden, obwohl gar nichts geprüft
# wurde. Genau dieser Fehler ist in einer früheren Sitzung passiert und hat
# zu einer falschen Erfolgsmeldung geführt. Deshalb prüft dieses Skript
# zuerst, ob überhaupt Inhalt ankommt, und meldet sonst einen Fehler statt
# "bestanden".
#
# Marker mit führendem "offen:" gehören zu einer Änderung, die noch in einem
# offenen Pull Request liegt. Sie werden berichtet, zählen aber nicht als
# Fehler. Nach dem Veröffentlichen das "offen:" entfernen.
#
# Marker mit führendem "gesperrt:" liegen auf einer Seite, die absichtlich
# abgeschaltet ist – derzeit der öffentliche 3D-Konfigurator (seit dem
# 31.10.2026, siehe docs/NEXT_TASK.md). Dort kommt die Hinweisseite statt
# des Rechners, also kann dort kein Suchtext gefunden werden.
#
# GEFUNDEN AM 31.10.2026: Sechs solche Marker standen ungeschützt in der
# Liste und machten diese Prüfung seit dem Abschalten rot – unbemerkt.
# Weggelassen werden sie NICHT: Sobald der Konfigurator wieder aufmacht,
# müssen sie wieder greifen.
#
# Damit das kein Freibrief wird, reicht "Text nicht gefunden" nicht aus:
# Es muss auch wirklich die HINWEISSEITE kommen (SPERRE_BELEG). Kommt
# etwas Drittes – eine Fehlerseite, eine leere Antwort, eine halb
# ausgelieferte Datei –, ist das ein Fehler wie jeder andere. Und wird der
# Text gefunden, ist der Konfigurator wieder offen: dann sagt das Skript,
# dass "gesperrt:" zu entfernen ist.
#
# Aufruf:     scripts/pruefe-live.sh [basis-url]
# Gegenprobe: scripts/pruefe-live.sh --gegenprobe
set -u
BASIS="${1:-https://bv-aussensysteme.de}"
[ "$BASIS" = "--gegenprobe" ] && BASIS="https://bv-aussensysteme.de"

# Pfad|Suchtext|Bezeichnung      ("offen:" vor dem Pfad = noch nicht erwartet)
MARKER='
/|konfigurator-widget.js|Konfigurator-Widget eingebunden
gesperrt:/konfigurator.html|k3dCanvas|3D-Konfigurator
/baugenehmigung.html|bg-pdf.js|PDF-Download im Baugenehmigungs-Check
/js/baugenehmigung-data.js|50 m³ umbauter Raum|Korrigierte RLP-Werte
/datenschutz.html|Vertragsabwicklung, Angebote und Anfragen|Abschnitt Vertragsabwicklung
/ratgeber/terrassenueberdachung-kosten.html|stammen nicht von uns|Preis-Klarstellung
/js/anfrage-wizard.js|Telefon / WhatsApp \*|Telefon ist Pflichtfeld
gesperrt:/konfigurator.html|k3d-app-seite|Konfigurator im Vollbild-Layout
/js/konfigurator-3d.js|bauenTerrasseGeschaetzt|Terrassendach wird als Terrassendach gezeichnet
/js/konfigurator-3d.js|function sonnenschutz|Sonnenschutz im Konfigurator
/js/anfrage-wizard.js|Aus dem 3D-Konfigurator|Notiz des Konfigurators geht in die Anfrage
gesperrt:/konfigurator.html|Polycarbonat graphit|Vier Polycarbonat-Ausführungen
/js/anfrage-wizard.js|Polycarbonat Bronze|Bronze auch im Anfrage-Assistenten
/js/konfigurator-3d.js|var NEIGUNG = (tds ? 6 : 0)|Flat Box ohne Gefälle
gesperrt:/konfigurator.html|data-k3d-erw=|Erweiterungen wie im Anfrage-Assistenten
gesperrt:/konfigurator.html|k3dMontage|Montage-Frage wieder im Bedienfeld
gesperrt:/konfigurator.html|k3dUntergrund|Untergrund-Frage im Konfigurator
/js/anfrage-wizard.js|erw_links|Erweiterungen kommen im Assistenten an
'

holen() { curl -sL --max-time 25 "$1"; }

# Woran die Hinweisseite der Sperre zu erkennen ist (worker/index.js).
# Ueberschreibbar, damit die Gegenprobe den Beleg wegnehmen kann: Dann
# muessen die "gesperrt:"-Marker wieder als FEHLER erscheinen. Ohne diese
# Moeglichkeit waere die Sperre-Ausnahme nicht pruefbar.
SPERRE_BELEG="${SPERRE_BELEG:-wird überarbeitet}"

if [ "${1:-}" = "--gegenprobe" ]; then
  echo "Gegenprobe: schlägt die Prüfung an, wenn der Inhalt fehlt?"
  if holen "$BASIS/gibt-es-nicht-$RANDOM.js" | grep -q "konfigurator-widget.js"; then
    echo "  FEHLGESCHLAGEN – Suchtext in einer nicht vorhandenen Datei gefunden"
    exit 1
  fi
  # Zweite Hälfte der Gegenprobe: ohne -L kommt bei einer echten Seite nichts
  ohne=$(curl -s --max-time 25 "$BASIS/datenschutz.html" | wc -c)
  mit=$(holen "$BASIS/datenschutz.html" | wc -c)
  echo "  datenschutz.html ohne -L: $ohne Bytes, mit -L: $mit Bytes"
  if [ "$ohne" -ge 500 ]; then
    echo "  Hinweis: diese Installation leitet nicht weiter – die -L-Regel gilt trotzdem."
  fi
  if [ "$mit" -lt 500 ]; then
    echo "  FEHLGESCHLAGEN – auch mit -L kommt kein Inhalt an"
    exit 1
  fi
  echo "  bestanden – fehlender Inhalt wird erkannt, mit -L kommt die Seite an"
  exit 0
fi

echo "Live-Stand auf $BASIS"
fehler=0
offen=0
gesperrtZahl=0
while IFS='|' read -r pfad text name; do
  [ -z "$pfad" ] && continue
  nurOffen=0
  gesperrt=0
  case "$pfad" in
    offen:*)    nurOffen=1; pfad="${pfad#offen:}" ;;
    gesperrt:*) gesperrt=1; pfad="${pfad#gesperrt:}" ;;
  esac

  inhalt=$(holen "$BASIS$pfad")
  groesse=$(printf '%s' "$inhalt" | wc -c)

  if [ "$groesse" -lt 500 ]; then
    printf '  FEHLER  %-42s nur %s Bytes – nicht erreichbar oder Weiterleitung nicht gefolgt\n' "$name" "$groesse"
    fehler=$((fehler + 1))
  elif printf '%s' "$inhalt" | grep -q "$text"; then
    if [ "$nurOffen" -eq 1 ]; then
      printf '  ok      %-42s jetzt live – "offen:" im Skript entfernen\n' "$name"
    elif [ "$gesperrt" -eq 1 ]; then
      printf '  ok      %-42s Konfigurator ist wieder offen – "gesperrt:" entfernen\n' "$name"
    else
      printf '  ok      %-42s (%s Bytes)\n' "$name" "$groesse"
    fi
  elif [ "$nurOffen" -eq 1 ]; then
    printf '  offen   %-42s noch nicht veröffentlicht (erwartet)\n' "$name"
    offen=$((offen + 1))
  elif [ "$gesperrt" -eq 1 ] && printf '%s' "$inhalt" | grep -q "$SPERRE_BELEG"; then
    printf '  gesperrt %-41s Hinweisseite statt Rechner (so gewollt)\n' "$name"
    gesperrtZahl=$((gesperrtZahl + 1))
  else
    printf '  FEHLER  %-42s Suchtext nicht gefunden\n' "$name"
    fehler=$((fehler + 1))
  fi
done <<EOF
$MARKER
EOF

if [ "$gesperrtZahl" -gt 0 ]; then
  echo "Hinweis: $gesperrtZahl Prüfung(en) ruhen, weil der öffentliche"
  echo "         3D-Konfigurator abgeschaltet ist (docs/NEXT_TASK.md)."
fi
if [ "$fehler" -eq 0 ]; then
  echo "Ergebnis: bestanden${offen:+ ($offen noch offen, siehe oben)}"
  exit 0
fi
echo "Ergebnis: $fehler Prüfung(en) nicht bestanden"
exit 1
