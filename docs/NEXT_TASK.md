# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach: `CLAUDE.md` und `PROJEKTSTAND.md`.
> Stand: 12.10.2026 (abends) · zuletzt bearbeitet: Dachneigung, PDF-Ausgabe, Anfrage-Text
>
> **Erster Schritt in der neuen Sitzung:** Branch auf den aktuellen Stand setzen
> (`git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main`),
> dann Abschnitt 1 lesen. Nichts ist halbfertig liegen geblieben – alle
> Änderungen sind veröffentlicht.
>
> **Kurz halten.** Wird diese Datei länger als etwa 400 Zeilen, wandern die
> ältesten erledigten Einträge nach `docs/erledigt-archiv.md`.

---

## 1. Was als Nächstes ansteht

### Aufgabe A — Konfigurator-Produkte *(erledigt bis auf Zubehör)*

Der Konfigurator kann **Terrassendach TDS, Flachdach SkyView, Carport**
(TDS, Flat Line, Flat Box) und **Pergola / Lamellendach** (Lamellendach mit
drehbaren Lamellen, Faltdach, Velaris).

Seit dem Umbau auf das Vollbild-Layout (10.10.2026) dazu: **Sonnenschutz**
(Aufdach, Unterdach, Senkrechtmarkisen mit Ausfahr-Regler), **Seitenelemente
als einzelne Schiebeflügel** mit Öffnen-Regler, **Carport-Verkleidung** aus
Sichtschutzpaneelen, **Terrassenboden**, **zuschaltbare Maßlinien**,
Vollbild, Ansicht „Darunter“, Zahlenfeld neben jedem Regler.

Bewusst **nicht** gebaut (Begründung in `docs/entscheidungen.md`, 10.10.2026):
Richtpreis, Markisenstoff-Kollektionen, Plissee, Zaunpaneele, Holzdekore –
für die Stoff- und Dekornamen fehlt uns die Grundlage. Wenn der Betreiber sie
liefert, ist der Rahmen dafür da.

**Wenn ein Produkt dazukommt:** Zweig in `bauen()`, Eintrag in `MASSE` und im
Auswahlfeld `k3dProdukt`, Bedienfelder mit `data-k3d-fuer` kennzeichnen und
das Stichwort in `gruppeGilt()` auswerten. Übergabewerte **wörtlich** aus
`js/anfrage-wizard.js` übernehmen und in `vorgabeUebernehmen()` in die
`felder`-Liste eintragen – sonst kommt der Wert dort nie an.
`scripts/pruefe-konfigurator.js` prüft die Werte, nicht die Liste.

### Seiten — vier statt drei *(gebaut 23.10.2026)*

Bei Aufbau **„Freistehend"** gibt es im Schritt „Seiten" eine vierte Reihe
*Hinten (Rückseite)* mit denselben Möglichkeiten wie vorne (kein Keil — die
hintere Dachkante läuft waagerecht). Bei **Wandmontage** erscheint sie nicht,
und eine vorher getroffene Wahl wird beim Umschalten gelöscht. Warum das die
heikle Stelle ist, steht in `docs/entscheidungen.md`, Eintrag 23.10.2026.

### Offen am Bodengefälle *(seit 24.10.2026)*

- **Seitenelemente schräg zuschneiden.** Heute bleibt die Unterkante innerhalb
  eines Feldes waagerecht (Höhe = Boden in der Feldmitte); bei 2° und 2,3 m
  Feld sind das rund 4 cm an den Enden. Für einen sauberen Anschluss müssten
  Rahmen-, Planken- und Schiebeelemente unten schräg geschnitten werden.
- **Nur im Terrassen-Bauweg gerechnet** (TDS, SkyView, Carport TDS). Beim
  Flachdach-Carport und bei der Pergola wird das Gefälle nicht abgefragt.
- **Erledigt (24.10.2026):** Die Wiese kippt jetzt mit, der Belag bleibt dünn.
  Damit sind „verschwindet das pflasterdesign" und „die linke maßanzeige …
  ist ein fetter balken" dieselbe, behobene Ursache — siehe
  `docs/entscheidungen.md`, Eintrag „Der Boden kippt, nicht die Platte".
- **Beantwortet (24.10.2026):** „die durchgangshöhe ist halt immer die tiefere
  seite aber erst mal soll das so bliben". Gebaut bleibt „vorne"; nur wenn der
  Boden stärker fällt als das Dach, liegt die tiefere Seite hinten. Dann wäre
  ein Hinweis „niedrigste Durchgangshöhe: X mm an der Y-Seite" die kleine
  Lösung — **nicht ohne Auftrag bauen**.

### Sonderform — vier Maße *(gebaut 23.10.2026)*

Im Schritt „Maße" steht bei **Terrassendach TDS** und **Flachdach SkyView**
die Wahl *Normal / Sonderform*. Sonderform fragt vier Maße ab — **Breite
hinten, Breite vorne, Tiefe links, Tiefe rechts** — und baut daraus ein
Viereck; über den Feldern steht eine Skizze mit den eingetragenen Zahlen.
Die Vorderkante liegt mittig zur Hinterkante. Begründung, verworfene
Zwischenlösung (zehn Katalogformen) und die Gegenlese-Punkte stehen in
`docs/entscheidungen.md`, Eintrag 23.10.2026.

Noch nicht beantwortet: ob VD für ein Dach mit vier verschiedenen Maßen
einen Aufschlag nimmt. Im Katalogblatt stehen +30 % — **im Konfigurator
steht nirgends ein Preis**, die Frage betrifft nur die Kalkulation im
Betrieb.

### Offene Rückfragen an VD (aus dem Konfigurator)

| Frage | Warum sie zählt |
|---|---|
| **Lichtdurchlässigkeit der Sechsfachstegplatte Graphit** | Für klar (76 %), opal (48 %) und bronze (35 %) gibt es Händlerangaben, für Graphit nichts. Im Modell ist die Deckkraft geschätzt |
| ~~Rippenabstand des Trapezblechs T35M-0,75~~ | **Erledigt 16.10.2026.** Teilung 210 mm, abgeleitet aus der belegten Nutzbreite 1050 mm (1050 / 5); gestützt durch das Nachbarprofil T35/207 mit 1035 mm = 5 × 207 |
| ~~Liefert der Hersteller das Trapezblech in der RAL-Farbe des Gestells?~~ | **Erledigt 16.10.2026.** Nein – der Betreiber hat den Artikel genannt: „T35M-0,75-**RAL7016**". Das Blech läuft jetzt in Anthrazit, unabhängig von der Gestellfarbe |
| **Darf das Trapezblech T35M waagerecht verlegt werden?** | Das Produktdatenblatt des Herstellers nennt **min. 3° Dachneigung (5,24 cm/m)**; das Flat Line wird ohne Gefälle gebaut. Daran hängen Dichtigkeit, stehendes Wasser und im Streitfall die Gewährleistung – bitte schriftlich bestätigen lassen |
| **Querschnitt der Blenden 16555 / 16556 und Rinnen 16553 / 16554** | Die Einzelteileliste führt sie als Meterware ohne Maß. Im Modell tragen alle vier das SkyView-Maß – ein Platzhalter |
| **Gibt es die Seitenblende 16555 wirklich nicht in Reinweiß 9010?** | Die Teileliste nennt für 16556 die Farben 7016/9006/9007/9010, für 16555 nur 7016/9006/9007. Falls das stimmt, gehört es in die Farbauswahl |
| **Aufteilung des Trapezblech-Querschnitts (Untergurt / Steg / Obergurt)** | Im Modell geschätzte 115 / 25 / 45 / 25 mm. Sie treffen die belegten 210 mm Teilung und 35 mm Höhe genau, sind aber nicht belegt – eine Querschnittzeichnung erledigt es |
| **Werden die Aluminium-Sichtschutzpaneele (140 mm) als Carport-Verkleidung angeboten?** | Die 140 mm stammen von unserer eigenen Produktseite, die Anwendung am Carport ist eine Annahme |

### Aufgabe A2 — Konfigurator auf die echten Herstellerdaten *(gebaut, wartet auf einen Handgriff)*

Fertig und geprüft. **Es fehlt nur noch, die Matrix in den KV-Speicher zu
legen** – das geht nur mit Cloudflare-Zugang.

> **Das kostet gerade etwas (gefunden 12.10.2026).** Solange `/api/bauteile`
> mit 503 antwortet, liefert `stueckliste()` `null`. Daran hängen in der
> Anfrage-Zusammenfassung: Sparrenzahl, Pfostenzahl, Statikträger,
> Dachneigung und Höhe an der Wand (UK Wandprofil). Diese Angaben stehen
> damit **in keiner Anfrage** – auch nicht die Neigung, die der Kunde
> ausdrücklich eingestellt hat. Das 3D-Modell ist nicht betroffen, es rechnet
> seit dem 11.10.2026 über `js/masstabelle.js`.
> **Erledigt am 12.10.2026:** Der Betreiber hat Weg 2 gewählt. Die Anfrage
> rechnet jetzt über `bauteileJetzt()` aus `js/masstabelle.js`. Offen bleibt
> nur: Sobald DACHMATRIX gebunden ist, gehört `stueckliste()` in
> `bauteileJetzt()` vorgeschaltet – der Platz ist im Kommentar der Funktion
> benannt. Der Zusammenfassungskasten `k3dZus` bleibt bis dahin leer, so
> gewollt.

#### Die drei Befehle

```bash
npx wrangler kv namespace create DACHMATRIX
# die ausgegebene id in wrangler.jsonc eintragen (Vorlage steht dort als Kommentar)

mkdir -p daten && cp /pfad/zu/bv-crm/docs/konfigurator-daten/* daten/
node scripts/baue-dachmatrix.js        # erzeugt js/dachmatrix-daten.json

npx wrangler kv key put --binding DACHMATRIX matrix \
  --path js/dachmatrix-daten.json --remote
```

Vorher passiert nichts Schlimmes: `/api/bauteile` antwortet mit 503 und der
Konfigurator zeigt dieselbe geschätzte Skizze wie bisher.

#### Wie es gebaut ist

| Teil | Rolle |
|---|---|
| `js/bauteile.js` | die Regeln. **Enthält keine Herstellerdaten**, bekommt die Matrix über `matrixSetzen()`. Läuft im Browser, unter Node und im Worker |
| `worker/index.js` → `/api/bauteile` | nimmt ein Maß, gibt eine Stückliste. Holt die Matrix aus KV, nie an den Browser |
| `js/konfigurator-3d.js` | freie Schieberegler (gebaut wird nach Kundenmaß), fragt den Endpunkt gebremst, zeichnet das Kundenmaß und zeigt das Rasterfeld als Abrechnungsgrundlage daneben. Ohne Antwort: geschätzte Skizze, Seite bleibt benutzbar |
| `daten/` | die Quelle – **nicht im Repository**, siehe `.gitignore` |

#### Was offen bleibt

- **Beim Hersteller:** `daten/rueckfragen-an-vd.md` (liegt lokal, nicht im
  Repo) listet neun Punkte. Die zwei wirksamsten: Systemschnitte oder
  DXF-Dateien der Profile, und die Seiten 10, 25 und 32 der
  VD-Montageanleitung abfotografieren.
- **Carport TDS und Flat Box** haben keine Matrix – sie bleiben die
  geschätzte Skizze, bis es eine Preisliste dafür gibt.
- **Profilquerschnitte** sind bis auf Pfosten und Statikträger geschätzt
  (`PROFILE_GESCHAETZT` in `js/bauteile.js`). Das Modell ist deshalb in den
  Stückzahlen richtig, in den Proportionen noch nicht.

### Aufgabe B — Baugenehmigungs-Check: weitere Bundesländer prüfen

13 der 16 Länder sind **Übersichtsangaben ohne Prüfung am Gesetzestext**.
Geprüft sind nur Rheinland-Pfalz, Hessen und Nordrhein-Westfalen (Feld
`geprueft`). Als Nächstes sinnvoll: **Bayern** und **Baden-Württemberg**.

| Datei | Wofür |
|---|---|
| `js/baugenehmigung-data.js` | die Daten, ein Block je Bundesland |
| `scripts/pruefe-lbo-daten.js` | prüft Etikett, Farbe und Text auf Widersprüche |
| `src/baugenehmigung.njk` | Anzeige, FAQ-Schema und Quellzeile |

**Wichtig:** Primärquelle verwenden (Landesrecht-Portal oder amtliche
Broschüre), nicht Vergleichsportale. Bei RLP hätte das vier Wochen früher
auffallen können – dort stand jahrelang ein falscher Wert (m² statt m³).

---

## 2. Was beim Betreiber liegt, nicht am Rechner

Diese Punkte kann niemand im Projekt erledigen – sie brauchen einen Zugang,
eine Entscheidung oder eine Rückfrage bei Dritten.

| Was | Warum es wartet |
|---|---|
| **Google-Business-Profil-URL** | Fehlt im `sameAs`-Teil des Schemas. Nur der Betreiber kommt an die Profil-Adresse |
| **Bewertungen sammeln** | Aktuell eine einzige. Kein technisches Problem – es braucht echte Kundenanfragen |
| **3D-Konfigurator am iPhone gegenlesen** | Dreh- und Zoomverhalten lässt sich im Container nur emulieren |
| **Abschnitt „Vertragsabwicklung" in der Datenschutzerklärung** | Von mir formuliert. Die Liste der Empfänger (Steuerbüro, Hersteller, Transport, Kreditinstitute) muss zur tatsächlichen Praxis passen – im Zweifel anwaltlich bestätigen lassen |
| **Rechtstext-PDFs für Kleinanzeigen** | Liegen nicht im Repository (siehe Abschnitt 5). Bei Textänderungen neu erzeugen lassen |
| **Preisgrundlage, falls je Preise gezeigt werden sollen** | Bisherige Linie: keine Preise. Eine Kalkulationsgrundlage kann nur der Betrieb liefern |

---

## 2b. Konfigurator ins CRM übernehmen

Der 3D-Konfigurator lässt sich als eigenständiges Paket für die interne
Nutzung erzeugen: `scripts/export-konfigurator.sh`. Die vollständige
Übergabe – Dateiliste, Einbindung, Serverabhängigkeit, was bewusst nicht
mitgeht – steht in `docs/konfigurator-export.md`.

**Offen beim Betreiber:** Im Paket steckt der Anfrage-Assistent, der echte
E-Mails an `info@bv-aussensysteme.de` verschickt. Intern sollte er raus oder
stillgelegt werden; das ist bewusst nicht vorweggenommen (siehe Abschnitt 6
des Export-Dokuments).

## 3. Prüfskripte

Jederzeit ausführbar. Jedes Skript kennt `--gegenprobe`: es baut einen
absichtlichen Fehler und erwartet, dass die Prüfung anschlägt. **Eine Prüfung,
die nie anschlägt, ist keine.**

| Skript | Was es prüft |
|---|---|
| `scripts/pruefe-cache-buster.sh` | Verweisen alle HTML-Dateien auf dieselbe Version einer CSS-/JS-Datei? |
| `scripts/pruefe-keine-preise.sh` | Steht irgendwo ein Preis für unsere Leistungen? (Ausnahmen in `scripts/preise-ausnahmen.txt`) |
| `scripts/pruefe-datenschutz.py` | Nummerierung, Inhaltsverzeichnis, Sprungmarken, Querverweise |
| `scripts/pruefe-lbo-daten.js` | Widersprüche zwischen Etikett, Farbe und Text der Baugenehmigungs-Daten |
| `scripts/pruefe-konfigurator.js` | Kennt der Anfrage-Assistent jeden Wert, den der 3D-Konfigurator übergibt? |
| `scripts/pruefe-masstabelle.js` | Stimmt die Maßtabelle mit den Regeln überein, nach denen sie verdichtet wurde? Deckt sie alle 1316 Datensätze ab? |
| `scripts/pruefe-fuehrung.js` | Gehört jede Bedieneinheit des 3D-Konfigurators zu einem Schritt der geführten Reihenfolge? Nennt die Anfrage alle drei Seiten? |
| `scripts/pruefe-stoffe.js` | Sind beide Stoffgruppen vollständig, überschneidungsfrei und in beiden Konfiguratoren gleich? Sind alle Musterbilder da? |
| `scripts/pruefe-markise.js` | Stimmen die Maße der Aufdachmarkise (Kassette, Schiene, Stützen) mit der Herstellerzeichnung Linea A/AZ überein? `--gegenprobe` verfälscht die Sollwerte |
| `scripts/pruefe-konfigurator-oberflaeche.mjs` | Echter Browser: Layout, Regler, Markisen, Maße, Handy-Scrollen – und liest zurück, was im Assistenten ankommt. Braucht `npm i --no-save playwright`, startet den Webserver selbst |
| `scripts/pruefe-teilen.mjs` | Teilen-Link: plant im Browser, teilt, öffnet den Link in einem frischen Tab und vergleicht alle 91 Einstellungen, 14 Knopfreihen und die Farbe. Gegenprobe verfälscht den Link und erwartet den Hinweis |
| `scripts/pruefe-ral.js` | RAL-Tabelle und Farbsuche: führt beide aus – 217 Töne, Stichproben Nummer → Name, Helligkeit der Schwarz-/Weißtöne nachgerechnet, neun Suchfragen mit erwartetem erstem Treffer, Lupe im HTML verdrahtet |
| `scripts/pruefe-bodengefaelle.js` | Gefälle des Terrassenbodens: Führt `bodenY()` aus und rechnet nach – ebener Boden ändert nichts, 2° auf 4 m sind 140 mm, vier Ecken auf vier Höhen. Dazu: Dach wird verschoben statt gekippt, Pfostenlängen gehen in die Anfrage. **Misst mit three.js nach**, dass Wiese und Plattenoberseite senkrecht gemessen auf derselben Ebene liegen wie die gerechneten Pfosten |
| `scripts/pruefe-stufen.js` | Basic und Pro: Ist Basic voreingestellt? Trägt jede Fachangabe `data-k3d-pro`? Bleibt jede Kundenfrage in Basic sichtbar? Verbirgt die Stufenregel nur, statt aufzudecken? Und vor allem: Wird beim Umschalten **kein** Wert zurückgesetzt |
| `scripts/pruefe-rueckseite.js` | Die vierte Seite: Gibt es sie nur freistehend? Verschwindet die Wahl beim Zurückschalten auf Wandmontage wieder? Kein Keil hinten, Höhe aus der Dachunterkante, Assistent kennt `erw_hinten` |
| `scripts/pruefe-sonderform.js` | Sonderform: Führt die Geometrie wirklich aus und misst nach – Viereck aus vier Maßen, nirgends Tiefe null, nichts ragt über das umschließende Rechteck hinaus, Vorderkante mittig, fehlendes Maß wird gemeldet, keine Reste der alten Katalogformen |
| `scripts/pruefe-bauteile.js` | Liefert `js/bauteile.js` für jede Zeile der Preisliste dieselben Sparren- und Pfostenzahlen? |
| `scripts/pruefe-hinweise.js` | Bleibt getrennt, was der Kunde sieht, und was nur in die Anfrage-Mail gehört? Prüft Hinweisbox, Kasten „Ihre Konfiguration", Assistenten-Anzeige und alle drei Versandwege – einmal aus dem Quelltext, einmal an wirklich erzeugten Hinweisen |
| `scripts/pruefe-pdf.js` | Erzeugt die PDFs **beider** Stellen (Konfigurator und Baugenehmigungs-Check) und liest sie mit **pdfinfo, pdftotext und pdfimages** zurück – fremden Werkzeugen, die unsere Annahmen nicht kennen. Seitenzahl, Format, Bildgröße, Umlaute, und vor allem: Steht jede Angabe **vollständig** da, auch bei 34 langen Zeilen über zwei Seiten? Zweispaltige Seiten werden dafür spaltenweise ausgeschnitten – am Stück gelesen zerreißt pdftotext die umgebrochenen Zeilen |
| `scripts/pruefe-api-bauteile.mjs` | Baut den Worker wie Cloudflare, stellt echte Anfragen – und prüft, dass **keine** Antwort die Matrix enthält |
| `scripts/pruefe-live.sh` | Ist der veröffentlichte Stand tatsächlich draußen? (nutzt `curl -sL`) |

**Exit-Code abfragen, nicht die letzte Zeile lesen.** Am 23.10.2026 fiel
auf, dass `pruefe-konfigurator-oberflaeche.mjs` seit PR #281 (11.10.2026)
mit einer Ausnahme abbrach, statt ein Ergebnis zu melden – zwölf Tage
unbemerkt rot. Eine Prüfung, die mit einer Ausnahme endet, ist rot.

Stand 23.10.2026: **alle Skripte laufen durch**, jedes mit vollständig
anschlagender Gegenprobe (`pruefe-sonderform.js` 25/25,
`pruefe-konfigurator-oberflaeche.mjs` 61 Prüfungen und alle drei
eingebauten Fehler gefunden, `pruefe-masstabelle.js` 361,
`pruefe-markise.js` 141, `pruefe-fuehrung.js` 45).

Der Browsertest ist damit wieder brauchbar. Er ersetzt **nicht** das
Nachsehen im Browser – das macht der Betreiber selbst („mach keinen browser
test ich teste selber im browse"); er fängt nur ab, dass eine Bedieneinheit
unbemerkt verschwindet.

Die beiden Datenprüfungen überspringen sich selbst, wenn `daten/` fehlt –
das ist der Normalfall in einem frischen Klon.

---

## 4. Arbeitsweise

**Branch:** immer `claude/bv-aussensysteme-setup-bq7ew4`. Nach einem gemergten
PR frisch aufsetzen:
```bash
git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main
```

**Ablauf:** bauen → prüfen → committen → pushen → PR → Build abwarten →
squash-mergen → Live-Stand prüfen (`scripts/pruefe-live.sh`). Der Betreiber
sagt meist „mergen veröffentlichen"; bei neuen öffentlichen Funktionen vorher
auf die Preview schauen lassen.

**Build:** `npm run build` (Eleventy + cleancss). Nach einem Container-Neustart
fehlen die Abhängigkeiten → vorher `npm install`.

**Cache-Buster:** `_headers` erlaubt bis zu 24 h alte CSS/JS aus dem
Browser-Cache. Nach jeder Änderung an `js/*.js` oder `src/css/style.css` die
Version in **allen** HTML-Dateien hochziehen und mit
`scripts/pruefe-cache-buster.sh` nachsehen.

**Eigenständige HTML-Dateien ohne njk-Vorlage** (werden vom Build *nicht*
erzeugt, direkt bearbeiten): `index.html`, `konfigurator.html`, alle
`terrassenueberdachung-*.html`, `carport-*.html`, `pergola-*.html`,
`danke.html`.

---

## 5. Fallen, die schon Zeit gekostet haben

- **`curl` braucht `-L`.** Die Seite leitet `/seite.html` → `/seite` weiter
  (307). Ohne `-L` kommt ein **leerer Body** zurück und jede Prüfung wirkt
  „bestanden". Hat schon zu einer falschen Erfolgsmeldung geführt.
  `scripts/pruefe-live.sh` fängt das ab.
- **CSS wird minifiziert**: in `css/style.css` steht `overscroll-behavior:contain`
  ohne Leerzeichen. Suchmuster entsprechend wählen.
- **iOS Safari ignoriert `window.print()`** – deshalb erzeugt `js/bg-pdf.js`
  die PDF-Datei selbst.
- **`body { overflow: hidden }` sperrt iOS nicht.** Der Body wird fixiert,
  aber nur im Sheet-Layout (`matchMedia('(max-width: 600px)')`).
- **Schwebe-Buttons** liegen rechts über dem Inhalt – rechtsbündige Werte auf
  schmalen Schirmen vermeiden.
- **Chromium im Container erreicht die echte Domain nicht** (Proxy-Zertifikat).
  Funktionstests gegen `http://localhost:8783`, live mit `curl -sL`.

**Testaufbau** (nach einem Container-Neustart weg, neu aufsetzen):
```bash
python3 -m http.server 8783 &                 # im Projektverzeichnis
cd "$SCRATCHPAD" && npm install playwright    # Chromium: /opt/pw-browsers/chromium
```
Für WebGL (3D-Konfigurator) mit
`args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader']` starten.
Absende-Wege mit `page.route()` auf `**/api/kontakt` und
`https://api.web3forms.com/**` abfangen, statt echt zu senden.

**Rechtstext-PDFs für Kleinanzeigen** (Widerrufsbelehrung, AGB,
Datenschutzerklärung): werden aus den echten Seiten per Playwright erzeugt und
**nicht** im Repository gehalten – zwei Fassungen desselben Textes laufen
auseinander. Bei Bedarf neu erzeugen: Inhalt aus `agb.html` (`#widerruf` plus
folgender Block) und `datenschutz.html` holen, in eine schlichte Druckvorlage
mit Briefkopf setzen, als A4-PDF ausgeben.

---

## 6. Dauerhafte Vorgaben des Betreibers

- **Sparsam mit Nutzungsvolumen** (siehe `CLAUDE.md`): keine unnötigen
  Prüfschleifen, Änderungen bündeln, bei größeren Aufgaben erst kurz fragen.
- **Keine Preise** auf der Website – weder Pauschal- noch Richtpreise.
- **VD-Inhalte niemals ungefragt entfernen** (siehe `CLAUDE.md`).
- **Vorschlagen ja, ungefragt umsetzen nein.** Was gebaut wird, entscheidet
  der Betreiber.
- Kommunikation auf Deutsch.

---

## 7. Letzte Arbeitsschritte

Vollständig und mit Begründung in `docs/erledigt-archiv.md`, die
Grundsatzentscheidungen in `docs/entscheidungen.md`.

| Datum | Was | Stand |
|---|---|---|
| 24.10.2026 | Gefälle des Terrassenbodens: Pfostenlängen je Ecke, zwei Neigungen ausgewiesen | **noch nicht veröffentlicht** |
| 24.10.2026 | Statikträger auf Wunsch auch beim Carport TDS (war pauschal für alle Carports gesperrt) | **noch nicht veröffentlicht** |
| 24.10.2026 | Zwei Stufen im Konfigurator: Basic (Kundenfragen) und Pro (alles) | **noch nicht veröffentlicht** |
| 24.10.2026 | Rückseite teilt sich an ihren eigenen Pfosten, nicht an denen der Vorderseite | **noch nicht veröffentlicht** |
| 23.10.2026 | Seitenelemente auch hinten, wenn die Anlage freistehend ist | **noch nicht veröffentlicht** |
| 23.10.2026 | Sonderform: vier freie Maße statt zehn Katalogformen; Browser-Prüfung nach zwölf Tagen wieder grün | live |
| 12.10.2026 | „PDF erstellen": mehrseitige Ausgabe mit Zustandsseiten und neu gestalteter Konfigurationsseite | live |
| 12.10.2026 | Anfrage-Text rechnet über `bauteileJetzt()` statt über die tote Schnittstelle | live |
| 12.10.2026 | Dachneigung: Rechenweg der Montageanleitung belegt, Anzeige in ganzen Grad | live |
| 12.10.2026 | Beide PDF-Erzeuger auf einen Unterbau, Baugenehmigungs-Check erstmals geprüft | live |
| 11.10.2026 | Seitenelemente, Velaris, Plankenwand, Rahmenwand, Profilmaße (siehe Archiv) | live |
| 10.10.2026 | Konfigurator rechnet serverseitig (`/api/bauteile`), Rasterauswahl, Matrix bleibt auf dem Server | **fertig, wartet auf den KV-Namensraum** |
| 10.10.2026 | 3D-Konfigurator: Carport (TDS, Flat Line, Flat Box) und Flachdach SkyView; Übergabewerte an den Assistenten korrigiert | **in Arbeit** |
| 10.10.2026 | Übergabe- und Prüfsystem eingerichtet (diese Datei, Entscheidungen, Archiv, fünf Prüfskripte) | live |
| 10.10.2026 | 3D-Konfigurator Terrassendach TDS | **live** |
| 10.10.2026 | Telefonnummer als Pflichtangabe | live |
| 16.09.2026 | Scrollen im Konfigurator-Fenster auf dem Handy repariert | live |
| 16.09.2026 | Anrede, Nachname, PLZ und Ort als Pflichtangaben | live |
| 09.09.2026 | Baugenehmigungs-Daten korrigiert (RLP rechnet in m³) | live |
| 09.09.2026 | Preis-Klarstellung auf Kostenseite, FAQ-Schema und `llms.txt` | live |
| 09.09.2026 | Datenschutz: tote Verweise repariert, Vertragsabwicklung ergänzt | live |
| 09.09.2026 | PDF-Download im Baugenehmigungs-Check | live |
| 09.09.2026 | Konfigurator-Fenster auch auf der Startseite | live |

## Stand 12.10.2026, abends — Neigung, PDF und die Anfrage

Alles veröffentlicht (PRs bis #398), nichts liegt halbfertig. Alle
Prüfskripte laufen durch, jede Gegenprobe schlägt **vollständig** an
(`pruefe-fuehrung.js` 253/253, `pruefe-masstabelle.js` 243/243,
`pruefe-pdf.js` 24/24, `pruefe-markise.js` 179/179,
`pruefe-stoffe.js` 12/12, `pruefe-konfigurator.js`,
`pruefe-bauteile.js`, `pruefe-lbo-daten.js`, `pruefe-stoffe.js`,
`pruefe-datenschutz.py`, beide `.sh`-Skripte).

### Was heute entstanden ist

| Bereich | Was jetzt gilt |
|---|---|
| **Dachneigung** | Der Rechenweg ist jetzt **belegt**: über die volle Bestelltiefe, ohne Abzüge (Montageanleitung, wörtlich: 200 cm + 3 × 14 cm = 242 cm). Eine zwischenzeitliche „Korrektur" um Rinnen- und Profilmaße ist zurückgenommen – die angezeigte Zahl geht in die Bestellung und muss die des Herstellers sein |
| **Zwei Wege zur Neigung** | Grad eingeben **oder** Unterkante Rinne und Unterkante Wandprofil, wie im Bestellformular. Angezeigt werden **ganze Grad**; gerechnet und gezeichnet wird weiter genau, weil die beiden Höhen bindend sind |
| **Höhe hinten** | Nimmt jeden Millimeter. Vorher rastete der Regler auf ein 50er-Raster über einer krummen Untergrenze – aus 2600 wurde 2602 |
| **SkyView** | Festes Gefälle von 2°, keine Neigungseingabe. War schon so, ist jetzt belegt |
| **Anfrage-Text** | Sparrenzahl, Pfosten, Statikträger, Dachneigung und Höhe an der Wand hingen allein an `/api/bauteile` (503) und standen damit **in keiner Anfrage**. Rechnen jetzt über `bauteileJetzt()` aus `js/masstabelle.js` – dieselbe Quelle wie der Maßhinweis |
| **„PDF erstellen"** | Statt eines Sammelbilds eine mehrseitige PDF: fünf Ansichten (Markisen eingefahren, Schiebeelemente offen), je eine Seite pro beweglichem Teil im anderen Zustand, zuletzt die Konfiguration |
| **Konfigurationsseite** | Kopf, vier Eckdaten als Kacheln, Angaben nach Themen gruppiert, Zeilen werden umgebrochen statt abgeschnitten, bei Platzmangel eine weitere Seite, unten der Ablauf in drei Schritten |
| **PDF-Erzeuger** | `js/pdf-blatt.js` schreibt die Datei für **beide** Stellen; `js/bg-pdf.js` (Baugenehmigungs-Check) hatte einen eigenen, gleichen Dateiaufbau. Der war bis heute nirgends geprüft |

### Was gegengelesen werden soll

- **PDF mit viel Ausstattung** (Schiebetüren auf allen Seiten, Markise,
  LED): Steht jede Angabe vollständig da? Ist „Ihre Konfiguration" die
  letzte Seite? Steht der Konfigurator danach **genau so da wie vorher**
  (gleiche Ansicht, gleiche Reglerstellungen)?
- **Baugenehmigungs-Check** auf `/baugenehmigung.html`: PDF speichern –
  es muss sich öffnen lassen und aussehen wie vorher
- **Anfrage-Text** bei Terrassendach TDS: Sparren, Pfosten, Dachneigung
  und Höhe an der Wand müssen dastehen. Bei SkyView muss die
  Dachneigung **verschwinden**
- **Neigung:** Tiefe 3000, Unterkante Rinne 2200 – bei 2500 mm müssen 6°
  erscheinen, wie im Bestellformular des Herstellers

### Beim Betreiber: Entscheidung offen

| Was | Warum es wartet |
|---|---|
| **Ablauftexte im PDF** („Kostenloses Aufmaß · Verbindliches Angebot · Fertigung und Montage") | Von mir vorgeschlagen, nicht abgestimmt. Wortlaut und Reihenfolge sollten zum tatsächlichen Prozess passen |
| **Zweiter Referenzfall für die Neigung**, am besten mit großer Tiefe | Der Fall 2200/2500/3000 → 6° bestätigt den Rechenweg, trennt ihn aber nicht von drei ähnlichen Varianten. Bei 7 m Tiefe und 300 mm Unterschied lägen sie 1° auseinander |

### Fragen an VD (unverändert offen)

| Frage | Warum sie zählt |
|---|---|
| **Profilquerschnitte TDS mit Maßen** (Rinne, Wandprofil, Sparren, Glasleiste) | Räumt den Rest an Schätzungen ab. Die gezeichnete Unterkante Wandprofil liegt rund 4 cm unter der angezeigten Zahl, weil ein Maß der Kette (Sparrensitz in der Rinne) geschätzt ist |
| **SkyView: wirkliche Blendenhöhe** | Die Blende ist außen „immer gleich, einfach rechteckig" (Betreiber, 12.10.2026). Im Modell wächst ihre Höhe mit der Tiefe, weil das 2°-Gefälle innen untergebracht werden muss. Gibt es gestaffelte Profilhöhen? |
| **SkyView freistehend oder Wandmontage?** | `js/masstabelle.js` führt SkyView als `wandmontage`; die Montageanleitung beschreibt durchgehend die freistehende Anlage. Beides gibt es – die Angabe sollte geprüft werden |
| **Statikträger „überstehend"** | Das Bestellformular kennt „ohne / überstehend / unter Rinne", der Konfigurator nur das Häkchen „unter der Rinne" |
| **Teilebild für den Deckel am Wandprofil** | Für den Rinnendeckel gibt es eines (172 × 175 mm, Fase 34, BELEGT). Der Wandprofil-Deckel ist rund; seine drei Maße sind am Werkbild abgeschätzt |
| **Echte RAL-Liste je Serie** | Aktuell aus der Maßtabelle abgeleitet (7016 / 9006 / 9007, Reinweiß 9010 nur bei TDS) |
| **Höchstmaß einer Scheibe** in der Rahmenwand · **Profilmaße FR23** · **Velaris-Maße** · **Plankenwand-Winkel** · **Keilfelder über 1500 mm** | Standen schon gestern offen, siehe `docs/erledigt-archiv.md` (Block vom 11.10.2026) |

### Noch nicht gebaut, steht aber in den Unterlagen

- **Fenster FRF23** mit Griff als Teil der Rahmenwand
- Rahmenwand **„mit Neigung"** als eigene Ausführung
- **Zubehör** im Konfigurator (Richtpreis, Plissee, Zaunpaneele,
  Holzdekore) – dafür fehlen die Grundlagen, siehe Abschnitt 1

### Zwei Lehren aus diesem Tag

**Eine Prüfung kann lügen.** `pdftotext -layout` liest über beide Spalten
hinweg und meldete 29 von 34 fehlenden Zeilen, die in Wahrheit alle auf
dem Blatt standen. Hätte ich das geglaubt, hätte ich einen Fehler
gesucht, den es nicht gibt. **Wer einem Prüfergebnis nicht traut, rendert
die Seite und sieht hin.**

**Eine Gegenprobe, die nicht anschlägt, beweist nichts.** Die erste
Gegenprobe des PDF-Skripts beschädigte die Verweistabelle – poppler
repariert die stillschweigend, acht von elf Prüfungen liefen trotzdem
durch. Jede Prüfung braucht ihre **eigene** Verfälschung.
