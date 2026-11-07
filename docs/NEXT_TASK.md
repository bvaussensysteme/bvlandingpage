# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach: `CLAUDE.md` und `PROJEKTSTAND.md`.
> Stand: **06.11.2026 (abends)** · zuletzt bearbeitet: Broschürenseite
> `/broschuere.html`, Höhenbezug und Fassadennotiz in beiden Konfiguratoren
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

### Zuerst: zwei Dinge liegen beim Betreiber, nicht am Rechner

1. **Kurzlink: vom Betreiber zurückgestellt (25.10.2026, abends).** Der
   Teilen-Dialog zeigt den langen Link – der funktioniert. Warum der kurze
   nicht kommt und was die Alternativen kosten: Abschnitt 2. **Nicht
   weiterbauen, ohne zu fragen.**
2. **Gibt es eine maximale Höhe hinten?** Frage an VD, siehe unten. Solange
   sie offen ist, wird nichts gekappt.
3. **Farbtöne: nichts tun.** Am 27.10.2026 entschieden („so lassen").
   RAL Classic ist vollständig und mit den amtlichen Werten hinterlegt;
   Farbwerte von Beschichter-Seiten (TIGER Coatings) wurden verworfen —
   fremde Produktdatenbank, und für VD nicht genauer. Begründung und der
   saubere Weg für mehr Auswahl (RAL Design, aus der Nummer berechnet):
   `docs/entscheidungen.md`, 27.10.2026. **Nicht ungefragt nachholen.**
4. **Balkonüberdachung: Maßgrenzen bei VD erfragen.** Seit dem 25.10.2026
   im Konfigurator (Details: `docs/balkonueberdachung.md`). Breite, Tiefe
   und Höhe sind dort an gängigen Balkongrößen ausgerichtet, **nicht** an
   einer Herstellerangabe — VD nennt auf der Produktseite keine. Ebenso
   offen: freitragende Ausführung, eigene Brüstungsbefestigung.
5. **Teilen-Dialog auf schmalen Handys.** Auf dem Bildschirmfoto des
   Betreibers (25.10.2026) sind „PDF / WhatsApp / E-Mail" unten
   abgeschnitten. Noch nicht repariert.

6. **Die rechtliche Freigabe des Datenschutztextes** (Abschnitt „Eigene
   Reichweitenmessung"). Seit dem 04.11. speichert die Messung ein
   Tageskennzeichen; der Text ist im selben Zug umgeschrieben. Einzelheiten
   und der Weg zurück: Abschnitt „Besucherzahlen" weiter unten.
7. **Sprachumschalter: Entscheidung offen (06.11.2026).** Beim Bauen der
   Broschürenseite kam heraus, dass die Übersetzung DE/EN/RU **auf keiner
   Seite eingebunden** war und `js/i18n.js` zudem einen Syntaxfehler hatte
   (ein unmaskiertes Hochkomma in Zeile 210, seit Langem). Der Fehler ist
   behoben, die Broschürenseite lädt die Datei und ihre Texte stehen als
   DE/EN/RU darin. Einen **Sprachumschalter** hat aber keine Seite, also
   greift die Übersetzung nur, wenn `localStorage.bv_lang` gesetzt ist.
   Ob der Umschalter zurück auf alle Seiten soll, entscheidet der
   Betreiber — Hintergrund in `docs/entscheidungen.md`, 06.11.2026.
   **Nicht ungefragt nachholen.**
8. **Google-Unternehmensprofil.** Der mit Abstand stärkste Hebel für
   Sichtbarkeit, und nichts davon lässt sich hier erledigen. In den eigenen
   Zahlen kommen Google und Bing zusammen auf einen kleinen Teil der Aufrufe.

Sonst ist nichts halbfertig: Alles ist gemergt, veröffentlicht und am
Livesystem nachgeprüft (Konfigurator `v=20261104v`, Assistent
`v=20261104b`). Der öffentliche Konfigurator ist **gesperrt**, gearbeitet
wird in der **Werkstatt** — beides weiter unten.

### Broschüre `/broschuere.html` *(fertig, veröffentlicht am 06.11.2026)*

36 Seiten aus `assets/broschuere/BV-Broschuere.pdf` als WebP, Blättern mit
`page-flip` (MIT) **lokal** unter `/assets/js/`. Was zu wissen ist:

- **Neue Broschüre?** PDF nach `assets/broschuere/BV-Broschuere.pdf` legen
  und die Bilder neu erzeugen (170 dpi → 1400 px, Qualität 82; die
  Vorschauen mit 300 px). Danach **beide** Prüfskripte laufen lassen —
  `scripts/pruefe-broschuere-bilder.sh` vergleicht jedes Bild mit seiner
  PDF-Seite und fängt eine verrutschte Reihenfolge, die der Browsertest
  nicht sehen kann. Ändert sich die Seitenzahl, muss `ANZAHL` in
  `js/broschuere.js` und in beiden Prüfskripten mitgehen, ebenso die
  Zahl „36" in den Seitentexten und in `js/i18n.js`.
- **Preise:** `pruefe-keine-preise.sh` liest kein PDF. Bei einer neuen
  Broschüre selbst nachsehen (`pdftotext … | grep -iE '€|EUR|Preis'`) —
  am 06.11.2026 war nichts drin.
- **Größenangabe „4,4 MB"** steht als Text in `src/broschuere.njk` und in
  `js/i18n.js` — bei einem neuen PDF mitändern.
- Begründungen (kein CDN, Nachladen von Hand, Zoom als eigene Ebene):
  `docs/entscheidungen.md`, 06.11.2026.

### Konfigurator-Produkte *(fertig bis auf Zubehör)*

Gebaut: Terrassendach TDS, Flachdach SkyView, Carport (TDS, Flat Line, Flat
Box), Pergola / Lamellendach, Sonnenschutz (Auf-/Unterdach, Senkrecht),
Seitenelemente als einzelne Schiebeflügel, Carport-Verkleidung,
Terrassenboden, zuschaltbare Maßlinien, Vollbild, Ansicht „Darunter", und bei
Aufbau „Freistehend" eine vierte Seitenreihe *Hinten*. Einzelheiten und
Begründungen stehen in `docs/erledigt-archiv.md` (Eintrag 31.10.2026).

Bewusst **nicht** gebaut: Richtpreis, Markisenstoff-Kollektionen, Plissee,
Zaunpaneele, Holzdekore — für die Stoff- und Dekornamen fehlt die Grundlage
(`docs/entscheidungen.md`, 10.10.2026). Liefert der Betreiber sie, ist der
Rahmen da.

**Wenn ein Produkt dazukommt:** Zweig in `bauen()`, Eintrag in `MASSE` und im
Auswahlfeld `k3dProdukt`, Bedienfelder mit `data-k3d-fuer` kennzeichnen, das
Stichwort in `gruppeGilt()` auswerten — und den Schritt in `BEREICHE` einem
der fünf Bereiche zuordnen, sonst erscheint er nirgends. Übergabewerte
**wörtlich** aus `js/anfrage-wizard.js` übernehmen und in
`vorgabeUebernehmen()` in die `felder`-Liste eintragen, sonst kommt der Wert
dort nie an. `scripts/pruefe-konfigurator.js` prüft die Werte, nicht die Liste.

### Offen am Bodengefälle *(seit 24.10.2026)*

- **Seitenelemente schräg zuschneiden.** Heute bleibt die Unterkante innerhalb
  eines Feldes waagerecht (Höhe = Boden in der Feldmitte); bei 2° und 2,3 m
  Feld sind das rund 4 cm an den Enden. Für einen sauberen Anschluss müssten
  Rahmen-, Planken- und Schiebeelemente unten schräg geschnitten werden.
- **Nur im Terrassen-Bauweg gerechnet** (TDS, SkyView, Carport TDS). Beim
  Flachdach-Carport und bei der Pergola wird das Gefälle nicht abgefragt.
- **Beantwortet (24.10.2026):** „die durchgangshöhe ist halt immer die tiefere
  seite aber erst mal soll das so bliben". Gebaut bleibt „vorne". Ein Hinweis
  „niedrigste Durchgangshöhe: X mm an der Y-Seite" wäre die kleine Lösung —
  **nicht ohne Auftrag bauen**.

### Öffentlicher Konfigurator ist gesperrt *(seit 31.10.2026)*

`/konfigurator` zeigt eine Hinweisseite („wird gerade überarbeitet") mit Knopf
zur Anfrage und Rufnummer. Menüeintrag und Startseiten-Teaser sind
ausgeblendet. Gearbeitet wird in der Werkstatt.

**Zum Zurückschalten, wenn der Betreiber freigibt:**

1. `worker/index.js`: `KONFIGURATOR_GESPERRT = false`
2. Alle Kommentare mit dem Marker `KONFIGURATOR-SPERRE 31.10.2026` auflösen:
   `grep -rl "KONFIGURATOR-SPERRE" --include=*.html --include=*.njk .`
   (betrifft `src/_includes/layout.njk`, `index.html` samt Teaser und sieben
   handgepflegte Seiten)
3. `npm run build`, dann `node scripts/baue-werkstatt.js`
4. `node scripts/pruefe-konfigurator-sperre.js` **muss jetzt rot sein** — das
   ist der Nachweis, dass die Sperre wirklich weg ist
5. In `scripts/pruefe-live.sh` die sechs `gesperrt:`-Marker entfernen. Das
   Skript sagt es von selbst („Konfigurator ist wieder offen"), sobald der
   Suchtext wieder gefunden wird — es muss also niemand daran denken

### Werkstatt `/werkstatt/` — läuft, passwortgeschützt *(31.10.2026)*

Die Erprobungsseite ist live und nur mit Passwort erreichbar. Das Passwort
liegt als **Secret** `WERKSTATT_PASSWORT` im Worker (Cloudflare → Workers &
Pages → **bvlanding** → Settings → Variables and Secrets → + Add → Typ
*Secret*). Es steht **nirgends im Projekt** und ist auch für den Assistenten
nicht lesbar. Die Anmeldung hält 30 Tage pro Gerät; wird das Passwort
geändert, sind alle alten Anmeldungen sofort ungültig. Ist kein Secret
hinterlegt, ist die Seite für **alle** gesperrt — auch für den Betreiber. Das
ist Absicht: ein Schutz, der ohne Einstellung aufmacht, ist keiner.

Oben in der Werkstatt steht ein Balken mit **„↻ Neu laden"** und der
ausgelieferten Dateiversion (`#wkVersion`) — daran ist zu sehen, ob eine
Änderung schon ausgeliefert wird oder noch der alte Stand im Browser liegt.

**Nach jeder Änderung an `konfigurator.html`:**
`node scripts/baue-werkstatt.js` — sonst hängt die Werkstatt zurück.
Prüfung: `node scripts/pruefe-werkstatt.js`.

**Drei Einblendungen fehlen in der Werkstatt — nur dort** (31.10.2026):
Cookie-Banner (`js/cookie.js`), Hinweis auf den Testbetrieb
(`k3dTestHinweis`) und die Bedienhilfe mit den beiden runden Knöpfen
(`js/accessibility.js`). Sie legten sich über genau das Bild, das
beurteilt werden soll. Auf der öffentlichen Seite bleibt alles —
`pruefe-werkstatt.js` prüft **beide Hälften**, und die zweite ist die
wichtigere: Fiele eine davon versehentlich auch öffentlich weg, fehlte
dort das Cookie-Banner.

Nebenbefund, nachgesehen: `js/metricool.js` startet erst nach einer
Einwilligung. Ohne Banner wird die in der Werkstatt nie erteilt — eigene
Testaufrufe verfälschen die Zahlen des Betriebs also nicht.

### Offen: Gibt es eine maximale Höhe hinten? *(seit 25.10.2026)*

Bei 7050 mm Tiefe und 8° Dachneigung ergibt sich eine **Höhe hinten von
3290 mm**. Der Höhenregler (vorne) endet bei 2700 mm, für die Höhe hinten gibt
es keine Grenze — die Pfosten hinten werden entsprechend lang. Gibt es eine
maximale Pfostenlänge oder Höhe hinten im System? Solange das niemand
beziffert hat, wird **nicht** gekappt; eine erfundene Grenze wäre schlimmer
als keine.

### Balkon: drei Bilder liegen beim Betreiber *(05.11.2026)*

Er hat drei Bilder geschickt: ein Foto einer Balkonüberdachung („nimm im
konfigurator für Balkonüberdachungen dieses bild") und zwei Darstellungen für
die zwei Montagearten – „das erste bild (auf der brüstung), zweite bild hinter
dem geländer". Die beiden Montagearten **gibt es im Konfigurator schon**
(`Z.pfostenAuf` = `Brüstung` | `Boden`), sie haben nur keine Bilder; das
Muster dafür steht bereit (`images/konfigurator/aufbau-frei.jpg` /
`aufbau-wand.jpg`), und `images/konfigurator/produkt-balkon.jpg` wäre das Ziel
für das Foto.

**Was fehlt:** Die Bilder kamen als Anhang im Chat an und liegen nicht als
Datei vor – sie müssen noch einmal geschickt oder ins Repository gelegt
werden. Dazu die Frage, woher die beiden Darstellungen stammen: Wenn sie aus
einem fremden Konfigurator kommen, gilt „Nachbauten: eigene Sprache, eigene
Namen" aus `CLAUDE.md` – dann zeichnen wir zwei eigene Symbole statt sie zu
übernehmen.

### Offene Rückfragen an VD (aus dem Konfigurator)

| Frage | Warum sie zählt |
|---|---|
| **Wie hoch darf der Keil höchstens werden – und was muss dem Element darunter mindestens bleiben?** | Seit 05.11.2026 lässt sich die Keilhöhe im Editor einstellen. Die Obergrenze für H1 ist im Modell `Platz unter dem Dach − 200 mm`; die **200 mm sind abgeleitet**, nicht belegt (die Zeichnung hatte diesen Boden immer schon, damit kein Element mit der Höhe null entsteht). Daran hängt, ob eine Glasschiebewand unter einem hohen Keil überhaupt noch montierbar ist – bitte den kleinsten zulässigen Elementwert schriftlich geben lassen |
| **Zulässiger Achsabstand der Pfosten (von … bis), je System** | Seit 01.11.2026 lassen sich die Zwischenpfosten verschieben. Die Spanne wird aus der Maßtabelle **hergeleitet**: größter und kleinster Achsabstand, der in der Tabelle irgendwo vorkommt (TDS/Glas flach: 970–3970 mm, aus den Zeilen 1080 mm/2 Pfosten und 4080 mm/2 Pfosten). Das ist eine Ableitung, keine Herstellerangabe. Daran hängen Statik und Gewährleistung; bitte die wirklichen Grenzwerte schriftlich geben lassen |
| **Lichtdurchlässigkeit der Sechsfachstegplatte Graphit** | Für klar (76 %), opal (48 %) und bronze (35 %) gibt es Händlerangaben, für Graphit nichts. Im Modell ist die Deckkraft geschätzt |
| ~~Rippenabstand des Trapezblechs T35M-0,75~~ | **Erledigt 16.10.2026.** Teilung 210 mm, abgeleitet aus der belegten Nutzbreite 1050 mm (1050 / 5); gestützt durch das Nachbarprofil T35/207 mit 1035 mm = 5 × 207 |
| ~~Liefert der Hersteller das Trapezblech in der RAL-Farbe des Gestells?~~ | **Erledigt 16.10.2026.** Nein – der Betreiber hat den Artikel genannt: „T35M-0,75-**RAL7016**". Das Blech läuft jetzt in Anthrazit, unabhängig von der Gestellfarbe |
| **Darf das Trapezblech T35M waagerecht verlegt werden?** | Das Produktdatenblatt des Herstellers nennt **min. 3° Dachneigung (5,24 cm/m)**; das Flat Line wird ohne Gefälle gebaut. Daran hängen Dichtigkeit, stehendes Wasser und im Streitfall die Gewährleistung – bitte schriftlich bestätigen lassen |
| **Querschnitt der Blenden 16555 / 16556 und Rinnen 16553 / 16554** | Die Einzelteileliste führt sie als Meterware ohne Maß. Im Modell tragen alle vier das SkyView-Maß – ein Platzhalter |
| **Gibt es die Seitenblende 16555 wirklich nicht in Reinweiß 9010?** | Die Teileliste nennt für 16556 die Farben 7016/9006/9007/9010, für 16555 nur 7016/9006/9007. Falls das stimmt, gehört es in die Farbauswahl |
| **Aufteilung des Trapezblech-Querschnitts (Untergurt / Steg / Obergurt)** | Im Modell geschätzte 115 / 25 / 45 / 25 mm. Sie treffen die belegten 210 mm Teilung und 35 mm Höhe genau, sind aber nicht belegt – eine Querschnittzeichnung erledigt es |
| **Werden die Aluminium-Sichtschutzpaneele (140 mm) als Carport-Verkleidung angeboten?** | Die 140 mm stammen von unserer eigenen Produktseite, die Anwendung am Carport ist eine Annahme |

### Herstellerdaten (DACHMATRIX) — wartet auf einen Handgriff

Gebaut und geprüft. Es fehlt nur, die Matrix in den **KV-Speicher** zu legen —
das geht nur mit Cloudflare-Zugang. Solange `/api/bauteile` mit 503 antwortet,
bleibt der Zusammenfassungskasten `k3dZus` leer (so gewollt); die Anfrage
rechnet seit 12.10.2026 über `bauteileJetzt()` aus `js/masstabelle.js`, das
3D-Modell ist nicht betroffen.

```bash
npx wrangler kv namespace create DACHMATRIX   # id in wrangler.jsonc eintragen
mkdir -p daten && cp /pfad/zu/bv-crm/docs/konfigurator-daten/* daten/
node scripts/baue-dachmatrix.js               # erzeugt js/dachmatrix-daten.json
npx wrangler kv key put --binding DACHMATRIX matrix \
  --path js/dachmatrix-daten.json --remote
```

Aufbau, offene Punkte beim Hersteller und die Grenzen (Carport TDS und Flat
Box ohne Matrix, geschätzte Profilquerschnitte): **`docs/dachmatrix.md`**.
Die Quelldaten liegen unter `daten/` und sind **nicht im Repository**.

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
| **Kurzlink: Rechte in der Datenbank** (nur falls gewünscht, siehe Abschnitt 2) | Die Datenbank-Rolle darf **gar nichts anlegen** – weder in `public` noch ein eigenes Schema. Live gemessen am 25.10.2026: Fehlernummer `42501`. Vom Betreiber zurückgestellt: „is mir zu kompliziert xd keine ahnung". Der lange Link funktioniert, er ist nur lang |

### Werkstatt-Zugang: Cloudflare Access einrichten *(beim Betreiber, 03.11.2026)*

Beschlossen am 03.11.2026: eigene Anmeldung je Person per E-Mail-Einmalcode,
kostenlos. **Die Einrichtung läuft im Cloudflare-Dashboard und kann nicht von
hier aus gemacht werden** – Schritt für Schritt in **`docs/werkstatt-zugang.md`**.
Dort steht auch die Falle: „Access für diesen Worker" würde die ganze
öffentliche Website hinter die Anmeldung legen; richtig ist eine
Self-hosted-Anwendung auf den Pfad `/werkstatt`.

Danach `bash scripts/pruefe-werkstatt-zugang.sh` – erwartet wird `Access` vor
allen Werkstatt-Pfaden und `offen` für die Startseite. Die eigene
Passwortschranke bleibt als Rückfallebene bestehen (Begründung im Dokument).

### Konfigurator: nächste Schritte aus der Vorbild-Analyse *(04.11.2026)*

Die Analyse der zehn Bilder steht in **`docs/konfigurator-bedienung.md`** –
samt der Trennung, was Idee ist (übernehmbar) und was Ausführung (nicht).
Gebaut sind Runde 1 (Reiterleiste, Fußzeile, Zwei-Wege-Karten) und Runde 2:

- **Bildkarten aus dem eigenen Modell** für Produkt, Aufbau und Dacheindeckung.
  14 Bilder in `images/konfigurator/`, erzeugt von
  `scripts/baue-miniaturen.mjs` (läuft nur bei Bedarf neu, nicht im Betrieb).
  Fünf Produkte stehen in **drei Spalten**, sonst wäre der erste Schritt von
  2,4 auf 2,86 Bildschirme gewachsen; gemessen jetzt 2,55. Begründung und
  Messwerte in `docs/entscheidungen.md`, 04.11.2026.

Offen:

1. **Seiten als Liste mit Zustand** statt als Knopfreihe.
2. **Berechnetes als Häkchenliste** im Maße-Schritt.
3. **Anfrage-Dialog** mit Planungskarte und der Zahl fehlender Pflichtangaben.
4. **Carport-Miniatur** sieht dem Terrassendach sehr ähnlich (gleiche
   Grundform). Entweder freistehender Blickwinkel oder bewusst so lassen.

### Konfigurator: zweite Runde ist vorbereitet, nicht entschieden *(03.11.2026)*

Die erste Runde (Regler → Zahlensteller, ein Bedienweg) ist gebaut. **Offen
und vom Betreiber noch nicht entschieden:**

1. **Schritte neu schneiden** – „Anlage" ist mit 1,9 Bildschirmen immer noch
   der längste. Vorschlag: Produkt / Ort und Aufbau / Maße / Farbe als eigene
   Schritte, Ziel höchstens 1,2 Bildschirme. Die Prüfung misst das heute schon
   (Grenze 2,6) und würde mit umgestellt.
2. **Modell beim Ändern sichtbar halten** – am Handy liegt das Bedienfeld
   unter dem Modell; wer scrollt, sieht das Ergebnis nicht mehr. Vorschlag:
   halbhohes Blatt über dem Modell.
3. **Dachneigung und hintere Höhe**: liegen jetzt hinter „Mehr Einstellungen".
   Das weicht bewusst von der Ansage vom 11.10.2026 ab (siehe
   `docs/entscheidungen.md`). Ein Wort genügt, um sie eine Ebene höher zu
   holen.

### Besucherzahlen — ausgebaut am 04.11.2026, ein Punkt offen

**Wie man sie liest und abfragt: `docs/zahlen-lesen.md`.** Dort stehen die
SQL-Abfragen, die Spalten und die drei Fallen. Dauerregel dazu in `CLAUDE.md`
(„Zahlen vor Meinung").

**Offen und beim Betreiber:**

1. **Die rechtliche Freigabe des Datenschutztextes.** Seit dem 04.11. speichert
   die Messung ein **Tageskennzeichen** (Prüfsumme aus Tagessalz + IP +
   Browserkennung, täglich wechselnd; IP und Browserkennung werden *nicht*
   gespeichert). Der Abschnitt „Eigene Reichweitenmessung" in
   `datenschutz.html` ist **im selben Zug** umgeschrieben worden und nennt
   Art. 6 Abs. 1 f DSGVO, Art. 21 und § 25 TDDDG. **Die verbindliche Prüfung
   steht aus.** Falls der Fachmann abrät: Der Rückbau ist klein —
   `messungBesucher()` in `worker/index.js` gibt dann `null` zurück, und der
   Text muss zurück.
2. **Der Konfigurator-Trichter bleibt leer**, solange der öffentliche
   Konfigurator gesperrt ist — in der Werkstatt wird bewusst nicht gezählt.

**Verworfen (Begründung im Logbuch):** Cloudflare Web Analytics als Ergänzung
(unklar, ob EU-Verkehr im Gratis-Tarif zählt) und Heatmaps über Microsoft
Clarity (einwilligungspflichtig, US-Anbieter, Eingabefelder müssten maskiert
werden).

### Vorschlag, nicht gebaut: das PDF als Anhang in der Anfrage

Gewünscht war „ggf. falls kostenlos möglich auch die fertige konfigurations
PDF" (Betreiber, 02.11.2026). **Kostenlos geht es nicht:** Web3Forms und
Formspree nehmen Dateien nur in ihren Bezahlplänen, und das PDF entsteht erst
im Browser des Kunden (mehrere MB). Stattdessen fährt jetzt der
**Konfigurationslink** mit — daraus ist das PDF in einem Klick erzeugt.

Der mögliche eigene Weg: PDF an einen Worker, Ablage in R2, kurzer Link in die
E-Mail. Kostet kein Geld (Freikontingent), **speichert aber Kundendaten** –
dann braucht es eine Aufbewahrungsfrist, einen Satz in der
Datenschutzerklärung und ein Löschkonzept. Wird nur auf Ansage gebaut.

### Kurzlink — zurückgestellt

Der Teilen-Dialog zeigt den **langen** Link, der funktioniert. Der kurze
(`/k/<id>`) scheitert daran, dass die Datenbankrolle nichts anlegen darf
(`42501`). Warum, welche drei Wege es gibt und was sie kosten:
**`docs/kurzlink.md`**. Vom Betreiber zurückgestellt — nicht ungefragt
weiterbauen.

## 2b. Konfigurator ins CRM übernehmen

Der 3D-Konfigurator lässt sich als eigenständiges Paket für die interne
Nutzung erzeugen: `scripts/export-konfigurator.sh`. Die vollständige
Übergabe – Dateiliste, Einbindung, Serverabhängigkeit, was bewusst nicht
mitgeht – steht in `docs/konfigurator-export.md`.

**Offen beim Betreiber:** Im Paket steckt der Anfrage-Assistent, der echte
E-Mails an `info@bv-aussensysteme.de` verschickt. Intern sollte er raus oder
stillgelegt werden; das ist bewusst nicht vorweggenommen (siehe Abschnitt 6
des Export-Dokuments).

## 2c. Design-Skills

13 Skills unter `.claude/skills/`, jeder mit `HERKUNFT.md` und Lizenz.
Welcher wofür, was bewusst **nicht** eingebaut wurde und warum:
**`docs/design-skills.md`**. Kein fremdes Installationsskript wurde
ausgeführt.

## 3. Prüfskripte

**Die vollständige Liste mit Zweck, Prüfungszahl und Gegenprobe steht in
`docs/pruefungen.md`.** Dort nachsehen, bevor eine neue Prüfung gebaut wird –
oft gibt es schon eine, die nur erweitert werden muss.

Das Wichtigste in zwei Sätzen: Jedes Skript liegt unter `scripts/pruefe-*`
und kennt `--gegenprobe` (baut jeden Fehler einzeln ein und verlangt, dass
jede Prüfung in mindestens einem Durchgang rot wird). **Nach einer Änderung
an Code, den mehrere Bereiche benutzen, alle Skripte laufen lassen, nicht die
vermuteten** – am 04.11.2026 war `pruefe-markise.js` dadurch einen halben Tag
unbemerkt rot.


## 4. Arbeitsweise

**Steht in `docs/arbeitsweise.md`** – Branch, Veröffentlichung, Cache-Buster,
Konfliktmarken, was nach einer Änderung am Konfigurator zu tun ist.

## 5. Fallen, die schon Zeit gekostet haben

Die ganze Liste steht in **`docs/fallen.md`** — vor dem Anfangen einmal
überfliegen. Die vier, die am häufigsten zuschlagen:

- **Cache-Buster:** pro Datei genau **eine** Version, sonst meldet
  `scripts/pruefe-cache-buster.sh` rot. Aktuell `v=20261031e`.
- **`run_worker_first` in `wrangler.jsonc`:** fehlt der Pfad dort, liefert
  Cloudflare die Datei direkt aus und der Worker läuft nie.
- **Konfliktmarken:** nach jedem `git merge origin/main`
  `bash scripts/pruefe-konfliktmarken.sh` laufen lassen — schon zweimal
  wurden Marken mitgecommittet.
- **Ein fehlgeschlagener Cloudflare-Bau** nach wenigen Sekunden ist meist nur
  ein Aussetzer: erst **Retry build**, dann suchen.

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

Nur die letzten Tage. Älteres vollständig und mit Begründung in
`docs/erledigt-archiv.md`, die Grundsatzentscheidungen in
`docs/entscheidungen.md`.

| Datum | Was | Stand |
|---|---|---|
| 06.11.2026 | **Broschüre `/broschuere.html`** – 36 PDF-Seiten als WebP, Blättern mit `page-flip` (MIT) **lokal**, echte Blätter-Animation, **Handy zuerst gebaut**, Wischgeste, Bedienleiste, Seitenübersicht, Zoom, Vollbild, Nachladen von Hand, Weg ohne JavaScript. Dabei gefunden: `js/i18n.js` war seit Langem ein Syntaxfehler und die Übersetzung auf **keiner** Seite eingebunden | live |
| 06.11.2026 | **Höhenbezug als Pflichtangabe** (Unterkante / Oberkante / Sonstiges mit freiem Text) und **Fassadennotiz** – in beiden Konfiguratoren, auf der Website direkt unter dem Höhenfeld | live |
| 06.11.2026 | **Dialog-Hülle heißt `k3d-bearb-*`**, nicht mehr `k3d-keil-*` (181 Stellen) | live |
| 05./06.11.2026 | **Vier Bearbeiten-Knöpfe** (Plankenwand, Rahmenwand, Schiebetür, Velaris) neben dem Keil; Plankenwand auch hochkant | live |
| 05.11.2026 | **Keil**: Rahmen und Glas gingen auseinander, die Glasschiebewand darunter wurde auf 786 mm gekappt – Ursache war ein zweimal vergebener Name (`KEIL_MIN_VORNE` in cm **und** mm im selben Gültigkeitsbereich) | live |

Älteres (04.11.2026 und davor) in `docs/erledigt-archiv.md`.
