#!/usr/bin/env bash
# ============================================================
# Prüft VON AUSSEN, was vor der Werkstatt steht.
#
# Anlass: „kommt man da ohne passwort rein?" (Betreiber, 03.11.2026) und
# die Entscheidung, Cloudflare Access davorzusetzen.
#
# Warum von außen und nicht im Code: Ob Cloudflare Access wirklich
# greift, steht in keiner Datei dieses Projekts – das entscheidet die
# Einstellung im Cloudflare-Konto. Und genau das ist die Gefahr: Eine
# Access-Anwendung, deren Pfad nicht passt, sieht im Dashboard richtig
# aus und schützt nichts. Dieses Skript fragt die echte Adresse und
# sagt, welche Tür geantwortet hat.
#
# Erwartet wird für JEDEN Werkstatt-Pfad eine von zwei Antworten:
#   Access   – Cloudflare fragt nach der E-Mail (das Ziel)
#   Passwort – unsere eigene Schranke (zweite Lage, bleibt bestehen)
# Alles andere ist ein Fehler, vor allem „INHALT OFFEN".
#
# Aufruf:     bash scripts/pruefe-werkstatt-zugang.sh
# Gegenprobe: bash scripts/pruefe-werkstatt-zugang.sh --gegenprobe
# ============================================================
set -u
SEITE="${BV_SEITE:-https://bv-aussensysteme.de}"
GEGENPROBE=0
[ "${1:-}" = "--gegenprobe" ] && GEGENPROBE=1
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
fehler=0
anzahl=0

echo "Was steht vor der Werkstatt?  ($SEITE)"

# Gibt eine von fünf Einordnungen zurück. Die Erkennung ist die
# eigentliche Leistung dieses Skripts - deshalb prüft die Gegenprobe
# unten sie selbst.
einordnen() {
  local pfad="$1" antwort code ziel
  antwort=$(curl -s -o "$TMP" -w "%{http_code}|%{redirect_url}" "$SEITE$pfad")
  code="${antwort%%|*}"
  ziel="${antwort#*|}"
  if printf '%s' "$ziel" | grep -qi "cloudflareaccess\.com"; then
    echo "Access|$code"
  elif grep -qi "cloudflareaccess\.com\|cf-access-\|Cloudflare Access" "$TMP"; then
    echo "Access|$code"
  elif grep -q 'name="passwort"' "$TMP"; then
    echo "Passwort|$code"
  elif grep -qi 'id="zeitwahl"\|Was auf der Website passiert\|wk-leiste\|k3d-buehne\|id="kontakt"' "$TMP"; then
    # id="kontakt" steht auf der oeffentlichen Startseite, die drei
    # anderen Marken nur in der Werkstatt. Gemessen am 03.11.2026: Ohne
    # den oeffentlichen Marker hielt dieses Skript die Startseite fuer
    # "unklar" - und haette damit auch eine versehentlich gesperrte
    # Website nicht von einem Netzfehler unterscheiden koennen.
    echo "INHALT OFFEN|$code"
  elif [ "$code" = "404" ]; then
    echo "nicht vorhanden|$code"
  else
    echo "unklar|$code"
  fi
}

pruef() {   # pruef "Beschriftung" "Pfad" "erlaubt1 erlaubt2 ..."
  local name="$1" pfad="$2" erlaubt="$3" e tuer code ok=0
  e=$(einordnen "$pfad"); tuer="${e%%|*}"; code="${e##*|}"
  for g in $erlaubt; do [ "${tuer// /_}" = "$g" ] && ok=1; done
  anzahl=$((anzahl + 1))
  if [ "$ok" = "1" ]; then
    printf '  ok      %-34s %s (HTTP %s)\n' "$name" "$tuer" "$code"
  else
    printf '  FEHLER  %-34s %s (HTTP %s)\n' "$name" "$tuer" "$code"
    fehler=$((fehler + 1))
  fi
}

# Jeder Weg zur Werkstatt muss an einer Tür enden.
pruef "Werkstatt-Startseite"      "/werkstatt/"               "Access Passwort"
pruef "Konfigurator der Werkstatt" "/werkstatt/index.html"    "Access Passwort"
pruef "Zahlenseite"               "/werkstatt/zahlen.html"    "Access Passwort"
pruef "Die Zahlen selbst"         "/werkstatt/api/zahlen?tage=7" "Access Passwort"
pruef "Mit Parameter"             "/werkstatt/zahlen.html?x=1" "Access Passwort"
pruef "Mit Schrägstrich am Ende"  "/werkstatt/zahlen.html/"   "Access Passwort"
pruef "GROSS geschrieben"         "/WERKSTATT/zahlen.html"    "Access Passwort nicht_vorhanden"

# Und die öffentliche Seite muss offen BLEIBEN. Das ist die Falle bei
# Cloudflare Access: Ein Klick auf "Access für diesen Worker" würde die
# ganze Website hinter die Anmeldung legen - dieselbe Worker-Datei
# liefert sie aus.
e=$(einordnen "/"); tuer="${e%%|*}"
anzahl=$((anzahl + 1))
if [ "$tuer" = "INHALT OFFEN" ]; then
  printf '  ok      %-34s offen, wie es sein muss\n' "Öffentliche Startseite"
else
  printf '  FEHLER  %-34s %s - die Website ist nicht erreichbar!\n' "Öffentliche Startseite" "$tuer"
  fehler=$((fehler + 1))
fi

# Die Messung darf von Access NICHT betroffen sein, sonst zählt nichts mehr.
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SEITE/api/messung" \
  -H "content-type: text/plain" --data '{"seite":"/","geraet":"rechner","dauer":0,"neu":false}')
anzahl=$((anzahl + 1))
if [ "$code" = "204" ]; then
  printf '  ok      %-34s nimmt weiter an (HTTP 204)\n' "Messung der Besucher"
else
  printf '  FEHLER  %-34s HTTP %s statt 204\n' "Messung der Besucher" "$code"
  fehler=$((fehler + 1))
fi

if [ "$GEGENPROBE" = "1" ]; then
  echo
  echo "Gegenprobe: erkennt die Einordnung überhaupt einen Unterschied?"
  luecken=0
  a=$(einordnen "/werkstatt/"); b=$(einordnen "/"); c=$(einordnen "/gibt-es-nicht-xyz")
  for paar in "Werkstatt:${a%%|*}" "Startseite:${b%%|*}" "Unbekannt:${c%%|*}"; do
    printf '  %-12s -> %s\n' "${paar%%:*}" "${paar#*:}"
  done
  [ "${a%%|*}" = "${b%%|*}" ] && { echo "  FEHLGESCHLAGEN Werkstatt und Startseite sehen gleich aus"; luecken=1; }
  [ "${c%%|*}" != "nicht vorhanden" ] && { echo "  FEHLGESCHLAGEN eine erfundene Adresse gilt nicht als fehlend"; luecken=1; }
  [ "${b%%|*}" != "INHALT OFFEN" ] && { echo "  FEHLGESCHLAGEN die offene Startseite wird nicht als offen erkannt"; luecken=1; }
  if [ "$luecken" = "0" ]; then
    echo "Ergebnis: bestanden - die Einordnung unterscheidet die drei Fälle"
    exit 0
  fi
  echo "Ergebnis: die Einordnung prueft nicht, was sie soll"
  exit 1
fi

echo
if [ "$fehler" = "0" ]; then
  echo "Ergebnis: alle $anzahl Prüfungen bestanden"
else
  echo "Ergebnis: $fehler von $anzahl Prüfung(en) nicht bestanden"
fi
exit $((fehler == 0 ? 0 : 1))
