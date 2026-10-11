# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach: `CLAUDE.md` und `PROJEKTSTAND.md`.
> Stand: 11.10.2026 (nachmittags) · zuletzt bearbeitet: Velaris, Plankenwand, Rahmenwand, Wandprofil
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

### Offene Rückfragen an VD (aus dem Konfigurator)

| Frage | Warum sie zählt |
|---|---|
| **Lichtdurchlässigkeit der Sechsfachstegplatte Graphit** | Für klar (76 %), opal (48 %) und bronze (35 %) gibt es Händlerangaben, für Graphit nichts. Im Modell ist die Deckkraft geschätzt |
| **Rippenabstand des Trapezblechs T35M-0,75** | Profilhöhe 35 mm ist belegt, der Abstand nicht. Im Modell 200 mm geschätzt (steht auch als Rückfrage 5 in `daten/rueckfragen-an-vd.md`) |
| **Liefert der Hersteller das Trapezblech in der RAL-Farbe des Gestells?** | Der Konfigurator zeichnet es so. Nicht belegt |
| **Werden die Aluminium-Sichtschutzpaneele (140 mm) als Carport-Verkleidung angeboten?** | Die 140 mm stammen von unserer eigenen Produktseite, die Anwendung am Carport ist eine Annahme |

### Aufgabe A2 — Konfigurator auf die echten Herstellerdaten *(gebaut, wartet auf einen Handgriff)*

Fertig und geprüft. **Es fehlt nur noch, die Matrix in den KV-Speicher zu
legen** – das geht nur mit Cloudflare-Zugang.

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
| `scripts/pruefe-bauteile.js` | Liefert `js/bauteile.js` für jede Zeile der Preisliste dieselben Sparren- und Pfostenzahlen? |
| `scripts/pruefe-api-bauteile.mjs` | Baut den Worker wie Cloudflare, stellt echte Anfragen – und prüft, dass **keine** Antwort die Matrix enthält |
| `scripts/pruefe-live.sh` | Ist der veröffentlichte Stand tatsächlich draußen? (nutzt `curl -sL`) |

Am 11.10.2026 liefen alle Skripte außer dem Browsertest durch; die
Gegenprobe schlug überall vollständig an (`pruefe-fuehrung.js` 45/45,
`pruefe-masstabelle.js` 182/182, `pruefe-markise.js` 141/141).
**Der Browsertest wird nicht mehr gefahren** – der Betreiber testet selbst
im Browser („mach keinen browser test ich teste selber im browse").

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

## Stand 11.10.2026, nachmittags — Seitenelemente und Profile

Alles veröffentlicht (PRs bis #346), nichts liegt halbfertig. Die
Prüfskripte laufen durch, jede Gegenprobe schlägt vollständig an
(`pruefe-fuehrung.js` 136/136, `pruefe-masstabelle.js` 183/183,
`pruefe-markise.js` 141/141).

### Was heute am Konfigurator entstanden ist

| Bereich | Was jetzt gilt |
|---|---|
| **Glasschiebeelemente SG23** | Aufteilung je lichtes Feld, von der Mitte nach außen öffnend, runder Muschelgriff auf **1100 mm** (aus dem VD-Anfrageformular, vorher 1050 geraten). Glas **ESG klar oder satinato**, mehr gibt es nicht. Schloss und Bürstendichtung stehen als Bestellpositionen in der Mail, ebenso der Satz **„Richtungsangaben von INNEN gesehen"** – im Formular rot hervorgehoben |
| **Plankenwand** | Rechteckprofil **70,4 × 25,3 mm** an Winkeln 40 × 20 an den Pfosten. Fuge wird automatisch so gerechnet, dass die Wand oben und unten bündig schließt; von Hand 0–60 mm. Teilhöhe oben/unten mit Maßangabe. Über **7 m** geteilt mit Zwischenprofil |
| **Velaris** | Komplett neu: Rahmen mit **waagerechten** Lamellen (vorher senkrecht – in der Hauptachse falsch). Element 500–1500 mm, Anlage bis 7 m, feststehend 1–5, verschiebbar nur 3–4 Elemente (sonst bewegt sich nichts). Beide Hälften getrennt bedienbar, Klick schaltet zu → offen → zur Seite → zu |
| **Rahmenwand** | Von der Blechwand zum **Glas im Rahmen** (System FR23) mit bis zu drei senkrechten Sprossen. Ohne Keil geht sie bis ans Dach, Rahmen und Sprossen folgen der Schräge |
| **Wandprofil TD** | **143,6 mm hoch** an der Wand (Querschnitt), unten die Sparren, oben Glas und Glasleiste. Zweimal falsch gelesen, bevor es stimmte |
| **Bedienung** | Ansicht „Darunter" steht jetzt drinnen; Animationen bauen das Modell nicht mehr je Bild neu; Maßlinien filigraner |

### Was gegengelesen werden soll

- **Wandprofil und Statikträger** von schräg hinten: Profil 143,6 mm hoch,
  Träger steht 45 mm darunter hervor
- **Velaris verschiebbar** mit 3 und 4 Elementen: Es darf nichts
  ineinanderfahren, und an der Stirnseite muss jedes Feld nach außen
  aufgehen
- **Rahmenwand ohne Keil** an der Seite: kein offenes Dreieck, keine
  waagerechte Sprosse
- **Plankenwand** mit Teilhöhe: Winkel dürfen nicht über die oberste
  Planke stehen

### Fragen, die beim Betreiber liegen

| Frage | Warum sie zählt |
|---|---|
| **Keilfelder über 1500 mm** – bei 7 m Tiefe sind es jetzt 1750 mm, weil höchstens vier Felder gehen | Das widerspricht der früheren Angabe „je angefangene 1,5 m eine Unterteilung". Von VD bestätigen lassen |
| **Höchstmaß einer Scheibe** in der Rahmenwand | Bestimmt, wann eine Sprosse nötig wird; im Modell geraten |
| **Profilmaße FR23** (Rahmen, Sprosse, Bautiefe, Glas) | Alle geschätzt – die Anleitung zeigt die Profile, bemaßt sie nicht |
| **Velaris:** Lamellenhöhe, Rahmenbreite, Kopfprofilhöhe, Aufhängung, Bodenschiene | Fünf geschätzte Maße; die Verhältnisse stimmen, die Millimeter nicht |
| **Wandprofil:** die beiden kleinen Maße am Querschnitt | Ausladung mit 31 mm angenommen |
| **Plankenwand:** Materialstärke des Winkels, Fugenbreite, welcher Schenkel am Pfosten liegt | Drei Annahmen |
| **Dekorbilder** Eiche Mocca, Rovere Pechino hell, Golden OAK | Im Modell liegt eine neutrale Eichenmaserung (ambientCG Wood049, CC0) unter der Dekorfarbe |
| Ältere: **Dachvorsprung 1500 mm** statisch gedeckt? **Höhe hinten 2000–3200 mm**? Seitenelemente am Carport sinnvoll? | stehen seit dem Vormittag offen |

### Noch nicht gebaut, steht aber in den Unterlagen

- **Fenster FRF23** mit Griff als Teil der Rahmenwand
- Rahmenwand **„mit Neigung"** als eigene Ausführung (die Anleitung zeigt
  beide Varianten)

### Ältere offene Punkte

- **Rinnen-Seitendeckel:** Teilebild 172 × 175 mm gegen Rinne 186,3 ×
  136,7 mm – entschieden: echtes Maß, vorne bündig, in der Höhe mittig.
  Der Widerspruch im Maß selbst bleibt
- **Pfostenachse 55 mm**, **EZIP-Stoffbilder in CMYK ohne Profil** –
  ungeprüfte Annahmen
- **SkyView: Querschnittszeichnungen der Profile.** Die Montageanleitung
  (07.11.2025) ist jetzt eingearbeitet, sie bemaßt aber keine
  Profilquerschnitte. Sparren und Glasleisten sind laut Betreiber
  dieselben wie bei TDS und damit belegt. GESCHÄTZT bleiben nur noch:
  Rahmenhöhe 220 mm und Blendendicke.
  ABGELEITET (aus Sparrenlänge −150 mm und Auflager 65 mm): Rinne und
  Träger je 140 mm tief. Mit den Zeichnungen zu Rinne Flat (16553),
  Träger TD (15698), Seitenblende Sky (6069) und Glasleiste (15184)
  wären das echte Maße
- **SkyView freistehend oder Wandmontage?** `js/masstabelle.js` führt
  SkyView als `montage: 'wandmontage'`. Die Montageanleitung beschreibt
  durchgehend die FREISTEHENDE Anlage mit vier Pfosten, Fundamenten und
  Träger TD hinten; für die Wand gibt es eine eigene Wand-Rinnen-Blende
  (15185). Beides gibt es also – die Angabe in der Maßtabelle sollte
  geprüft werden
- **Teilebild für den Deckel am Wandprofil.** Für den Rinnendeckel gibt
  es eines (172 × 175 mm, Fase 34 mm, BELEGT). Der Deckel am Wandprofil
  ist eine andere, runde Form – seine drei Maße (140 mm tief, 175 mm
  hoch, Bogenradius 70 mm) sind am Werkbild ABGESCHÄTZT. Mit einem
  bemaßten Blatt sind sie in einer Zeile ersetzt
- **Statikträger hinter den Sparren: welches Profil ist das wirklich?**
  Die Maßtabelle nennt 189 × 117 mm. Steht er freistehend hinter den
  Sparren (an Stelle der Wand), stand er damit 6 cm unter den Sparren
  hervor – „mach ihn unten bündig mit sparren und oben bündig mit
  glasleiste" (Betreiber, 11.10.2026). Gezeichnet wird er dort jetzt so
  hoch wie Sparren + Eindeckung (rund 128 mm). **Frage an den
  Hersteller:** Ist das an dieser Stelle ein anderes, flacheres Profil,
  oder liegen die Sparren tiefer im Träger? Die Tiefe 117 mm bleibt
  unangetastet – an ihr hängt das Tiefenmaß der Anlage
- **eZIP-Kassettenform: erledigt.** „Z-E Eckig" (Betreiber, 11.10.2026) –
  die quaderförmige Kassette, nicht das Halbrund der Serie Z-R
- **Offen: Schiebetür zusammen mit Plankenwand.** Geometrisch sitzt die
  Tür jetzt auf der Plankenwand auf (nichts liegt mehr ineinander). Ob
  diese Kombination überhaupt angeboten werden soll, ist eine
  Produktfrage – eine Schiebetür über einer Brüstung von rund einem
  Drittel der Höhe ist kein Durchgang mehr
- **`/api/bauteile` antwortet 503** (KV-Namensraum nicht gebunden). Kein
  Blocker: `js/masstabelle.js` liefert die echten Zahlen, gegengerechnet
  1316 von 1316

### Eine Lehre aus diesem Nachmittag

**Ein Querschnitt sagt nichts über die Einbaulage.** Dreimal derselbe
Fehler: SG23-Profile um jeden Flügel gelegt, Velaris-Aufhängung als
kurzer Träger, Wandprofil liegend statt stehend. Das Maßbild zeigt die
Form – wie das Teil eingebaut wird, weiß nur der Betreiber. Im Zweifel
fragen, bevor es ins Modell geht.
