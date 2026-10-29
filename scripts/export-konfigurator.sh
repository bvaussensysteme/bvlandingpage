#!/usr/bin/env bash
# Baut den 3D-Konfigurator als eigenständiges Paket für die INTERNE Nutzung
# (z. B. im CRM). Erzeugt wird, nicht kopiert: Es darf keine zweite Fassung
# des Konfigurators im Repository liegen, die still auseinanderläuft.
#
#   scripts/export-konfigurator.sh [zielordner]      Standard: export/konfigurator
#   scripts/export-konfigurator.sh --gegenprobe      prüft, ob die Prüfung anschlägt
#
# Was NICHT mitgeht und warum, steht in docs/konfigurator-export.md.
set -u
cd "$(dirname "$0")/.." || exit 2

gegen=0
ziel="export/konfigurator"
for a in "$@"; do
  case "$a" in
    --gegenprobe) gegen=1 ;;
    -*) echo "Unbekannte Option: $a"; exit 2 ;;
    *) ziel="$a" ;;
  esac
done

# Diese Skripte gehören zur Website, nicht in ein internes Werkzeug:
#   metricool.js        – Social-Analytics, laedt einen externen Tracker
#   cookie.js           – Einwilligungsbanner; intern nichts einzuwilligen
#   anfrage-wizard.js   – verschickt echte Kundenanfragen per E-Mail
#   konfigurator-widget – der schwebende Knopf, der genau den oeffnet
#
# „Ich will im crm eine eigenen 3d konfigurator 1:1 wie den auf der webseite
# nur ohne formular abschicken" (Betreiber, 21.10.2026). Deshalb faellt der
# gesamte Anfrage-Weg weg: die beiden Skripte UND der Knopf „Konfiguration
# anfragen", der sie aufruft. Bliebe der Knopf stehen, waere er tot.
#
# js/main.js bleibt drin (Navigation, Mobilmenue, Lightbox). Es enthaelt
# zwar den Formular-Versand der Website, aber der steckt vollstaendig in
# „if (formSubmit) { ... }“, und konfigurator.html hat gar kein Formular.
# Der Code kann dort also nicht laufen. Geprueft wird das unten, statt die
# fremde Datei zu veraendern – sonst liefen Paket und Repository
# auseinander, ohne dass man es sieht.
# main.js und accessibility.js bedienen Kopf- und Fußzeile der Website und
# bleiben drin, weil die Seite sonst halb bedient ist.
RAUS="js/metricool.js js/cookie.js js/anfrage-wizard.js js/konfigurator-widget.js"

MIT_JS="js/vendor/three.min.js js/masstabelle.js js/markisenstoffe.js js/ral.js
        js/pdf-blatt.js js/konfigurator-3d.js js/main.js js/accessibility.js"
MIT_BILD="images/logo-dunkel.png images/logo-hell.png images/favicon.ico
          images/favicon-16.png images/favicon-32.png images/apple-touch-icon.png
          images/textur/holzdielen.webp images/textur/holzmaserung.webp
          images/textur/klinker.webp images/textur/putz.webp
          images/textur/rasen.webp images/textur/steinplatten.webp
          images/textur/zufahrt.webp"

if [ "$gegen" = "1" ]; then
  ziel="${ziel}-gegenprobe"
  echo "Gegenprobe: baut nach $ziel und macht danach absichtlich acht Dinge"
  echo "            kaputt. Jede der neun Pruefungen MUSS anschlagen."
fi

rm -rf "$ziel" 2>/dev/null
mkdir -p "$ziel/js/vendor" "$ziel/css" "$ziel/images/textur" 2>/dev/null || {
  echo "  FEHLER  Zielordner lässt sich nicht anlegen: $ziel"; exit 1; }

fehlt=0
for f in $MIT_JS; do
  [ -f "$f" ] || { echo "  FEHLER  fehlt: $f"; fehlt=1; continue; }
  cp "$f" "$ziel/$f"
done

# js/main.js traegt den Formular-Versand der Website mit sich. Er kann im
# Paket nicht laufen (er steckt in „if (formSubmit) { ... }“, und es gibt
# kein Formular), aber die Adresse soll in einem internen Werkzeug gar nicht
# erst stehen. Sie wird deshalb auf eine tote Adresse gesetzt - eine
# Ersetzung, kein Umbau: Der Code bleibt Zeile fuer Zeile derselbe.
if [ -f "$ziel/js/main.js" ]; then
  sed -i 's#https://formspree\.io/f/[a-zA-Z0-9]*#about:blank\#kein-versand-im-internen-paket#g' \
      "$ziel/js/main.js"
fi
[ -f css/style.css ] && cp css/style.css "$ziel/css/style.css" || { echo "  FEHLER  fehlt: css/style.css"; fehlt=1; }
for f in $MIT_BILD; do
  [ -f "$f" ] && cp "$f" "$ziel/$f" || echo "  Hinweis  Bild fehlt, wird ausgelassen: $f"
done

# index.html aus konfigurator.html ableiten:
#  - die beiden Website-Skripte entfernen
#  - absolute Pfade (/images/..., /js/...) relativ machen, damit das Paket
#    auch in einem Unterordner läuft
#  - Links auf andere Seiten der Website auf die echte Domain umbiegen,
#    sonst laufen sie im CRM ins Leere
sed -e '/js\/metricool\.js/d' \
    -e '/js\/cookie\.js/d' \
    -e '/js\/anfrage-wizard\.js/d' \
    -e '/js\/konfigurator-widget\.js/d' \
    -e '/id="k3dAnfrage"/,/<\/button>/d' \
    -e 's#\(src\|href\)="/images/#\1="images/#g' \
    -e 's#\(src\|href\)="/js/#\1="js/#g' \
    -e 's#\(src\|href\)="/css/#\1="css/#g' \
    -e 's#href="/"#href="https://bv-aussensysteme.de/"#g' \
    -e 's#href="/\([a-z0-9#][^"]*\)"#href="https://bv-aussensysteme.de/\1"#g' \
    konfigurator.html > "$ziel/index.html"

[ -s "$ziel/index.html" ] || { echo "  FEHLER  index.html ist leer"; fehlt=1; }

# ---------- Gegenprobe: das fertige Paket absichtlich kaputtmachen ----------
# Eine Pruefung, die nie anschlaegt, ist keine. Deshalb wird hier genau das
# wieder eingebaut, was der Export entfernen soll.
if [ "$gegen" = "1" ]; then
  printf '<script src="js/metricool.js"></script>\n' >> "$ziel/index.html"
  printf '<img src="/images/logo-dunkel.png">\n' >> "$ziel/index.html"
  printf '<!-- Grundpreis 1234 EUR -->\n' >> "$ziel/index.html"
  printf '<script src="js/cookie.js"></script>\\n' >> "$ziel/index.html"
  printf '<script src="js/anfrage-wizard.js"></script>\\n' >> "$ziel/index.html"
  printf '<script src="js/konfigurator-widget.js"></script>\\n' >> "$ziel/index.html"
  printf '<button id="k3dAnfrage">Konfiguration anfragen</button>\\n' >> "$ziel/index.html"
  printf '<form><input name="email"></form>\\n' >> "$ziel/index.html"
  printf 'var w = "https://api.web3forms.com/submit";\\n' > "$ziel/js/anfrage-wizard.js"
  printf 'var f = "https://formspree.io/f/xnjkabdv";\\n' >> "$ziel/js/main.js"
  sed -i 's#js/konfigurator-3d\.js#js/WEG-DAMIT.js#g' "$ziel/index.html"
  rm -f "$ziel/js/masstabelle.js"
fi

# ---------- Kontrollen am fertigen Paket ----------
echo
for f in $RAUS; do
  if grep -q "$(basename "$f")" "$ziel/index.html" 2>/dev/null; then
    echo "  FEHLER  $f ist noch verlinkt"; fehlt=1
  else
    echo "  ok      $f ist draußen"
  fi
done

# ---------- Kein Weg, eine Anfrage abzuschicken ----------
# Drei Dinge muessen zutreffen, sonst ist das Paket nicht das, was bestellt
# wurde: kein Anfrage-Knopf, kein Formularfeld, kein Versandskript.
if grep -q 'id="k3dAnfrage"' "$ziel/index.html" 2>/dev/null; then
  echo "  FEHLER  der Knopf „Konfiguration anfragen“ steht noch in index.html"; fehlt=1
else
  echo "  ok      kein Anfrage-Knopf mehr"
fi
if grep -qE '<form|id="formSubmit"|name="email"' "$ziel/index.html" 2>/dev/null; then
  echo "  FEHLER  es gibt ein Formularfeld im Paket:"
  grep -ohE '<form[^>]*|id="formSubmit"|name="email"' "$ziel/index.html" | sort -u | head -3
  fehlt=1
else
  echo "  ok      kein Formular im Paket – nichts abzuschicken"
fi
if grep -rqE 'web3forms|WEB3FORMS_KEY|formspree\.io/f/[a-zA-Z0-9]' "$ziel/js" 2>/dev/null; then
  echo "  FEHLER  ein Versandziel liegt noch im Paket:"
  grep -rlE 'web3forms|WEB3FORMS_KEY|formspree\.io/f/[a-zA-Z0-9]' "$ziel/js" | head -3
  fehlt=1
else
  echo "  ok      kein Versandziel im Paket (weder Web3Forms noch Formspree)"
fi

if grep -rqE '(src|href)="/[a-z]' "$ziel/index.html" 2>/dev/null; then
  echo "  FEHLER  es stehen noch absolute Pfade in index.html:"
  grep -ohE '(src|href)="/[a-z][^"]*' "$ziel/index.html" | sort -u | head -5
  fehlt=1
else
  echo "  ok      keine absoluten Pfade mehr"
fi

alle=1
for f in $MIT_JS; do
  b=$(basename "$f")
  grep -q "$b" "$ziel/index.html" || { echo "  FEHLER  $b wird nicht geladen"; fehlt=1; alle=0; }
done
[ "$alle" = "1" ] && echo "  ok      alle $(echo $MIT_JS | wc -w) Skripte sind verlinkt"

# Jede Datei, die index.html oertlich anfordert, muss auch im Paket liegen.
# Das ist die Pruefung, die einen vergessenen Mitnahme-Eintrag findet, ohne
# dass man den Browser dafuer aufmachen muss.
fehlend=""
for ref in $(grep -ohE '(src|href)="[^":#]+\.(js|css|png|jpg|jpeg|webp|svg|ico)' "$ziel/index.html" \
             | sed -E 's/^(src|href)="//' | sed 's/?.*//' | sort -u); do
  [ -f "$ziel/$ref" ] || fehlend="$fehlend $ref"
done
if [ -n "$fehlend" ]; then
  echo "  FEHLER  im Paket fehlen Dateien, die index.html laedt:$fehlend"; fehlt=1
else
  echo "  ok      jede angeforderte Datei liegt im Paket"
fi

# Preise duerfen nirgends auftauchen - dieselbe Regel wie fuers Repository.
# Gesucht wird nach BETRAEGEN, nicht nach dem Wort „Preis“: Im Code stehen
# Kommentare wie „die Preisliste sagt ...“, und die sind kein Preis.
if grep -rnE '[0-9][0-9.,]*[[:space:]]*(€|EUR\b)|(€|EUR)[[:space:]]*[0-9]' "$ziel/js" "$ziel/index.html" >/dev/null 2>&1; then
  echo "  FEHLER  Betraege im Paket gefunden:"
  grep -rnE '[0-9][0-9.,]*[[:space:]]*(€|EUR\b)|(€|EUR)[[:space:]]*[0-9]' "$ziel/js" "$ziel/index.html" | head -5
  fehlt=1
else
  echo "  ok      keine Betraege im Paket"
fi

gr=$(du -sh "$ziel" 2>/dev/null | cut -f1)
echo
if [ "$gegen" = "1" ]; then
  rm -rf "$ziel"
  if [ "$fehlt" = "1" ]; then
    echo "Gegenprobe bestanden: die Pruefungen haben angeschlagen"; exit 0
  fi
  echo "Gegenprobe NICHT bestanden: nichts hat angeschlagen"; exit 1
fi
[ "$fehlt" = "1" ] && { echo "Ergebnis: Export NICHT sauber"; exit 1; }
echo "Ergebnis: $ziel ist fertig ($gr)"
exit 0
