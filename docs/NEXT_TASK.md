# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach: `CLAUDE.md` und `PROJEKTSTAND.md`.
> Stand: 31.10.2026 · zuletzt bearbeitet: **Anklickpunkte am Modell**
> (ein Punkt je Seitenfeld, einer am Dach, Klick springt in den Bereich)
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

Sonst ist nichts halbfertig: Alles ist gemergt, veröffentlicht und am
Livesystem nachgeprüft (Stand `v=20261031d`). Der öffentliche Konfigurator
ist **gesperrt**, gearbeitet wird in der **Werkstatt** — beides weiter unten.

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

### Werkstatt: Aussparung (Hausvorsprung) *(Machbarkeit gezeigt, 31.10.2026)*

Zweiter Anlauf nach der am 25.10.2026 entfernten Sonderform, diesmal
**rechtwinklig**: Rechteck mit rechteckiger Lücke an der Wandseite. Sparren,
Scheiben und Wandprofil folgen der Lücke, Rinne und Pfosten vorne bleiben
unverändert — nachgemessen mit `node scripts/miss-aussparung.mjs`, nicht
geschätzt. Auf der öffentlichen Seite ist die Aussparung **durch nichts
einschaltbar**: sie hängt am Pfad `/werkstatt/` (`PROBE_AUSSPARUNG` in
`js/konfigurator-3d.js`), nicht an einem Parameter.

Formen über die Adresse (Standard ohne Parameter: `Rechteck`, also keine
Aussparung):

```
/werkstatt/?form=rechts&ab=2000&at=1000
/werkstatt/?form=links&ab=2000&at=1000
/werkstatt/?form=mittig&ab=2000&at=1000&aa=1200
```
`ab` = Breite der Aussparung, `at` = Tiefe, `aa` = Abstand von links, in mm.

**Bekannte Grenzen** (bewusst so, nicht vergessen):
- Ein Feld, das genau auf der Kante der Aussparung sitzt, wird ganz der
  Aussparung zugeschlagen — Versatz bis **13,6 cm**.
- `scripts/miss-aussparung.mjs` ist ein **Messwerkzeug ohne `--gegenprobe`**.
  Es beweist nichts, es zeigt Zahlen. Ein echter Browser-Prüflauf daraus wäre
  die saubere Lösung und ist noch nicht gebaut.
- Fehlt noch (bewusst): Bedienfeld, Grundriss-Skizze, Wandfelder an den
  Flanken, Randblende an der Stufe, Maßtabelle, Anfrage, interne Notiz.
  Begründungen: `docs/entscheidungen.md`, 31.10.2026.

**Der Betreiber entscheidet, ob weitergebaut wird.**

### Menü in fünf Bereichen — gebaut *(31.10.2026)*

Statt einer langen Schrittfolge gibt es oben fünf Reiter: **Anlage · Dach ·
Seiten · Zubehör · Fertig** (`BEREICHE` in `js/konfigurator-3d.js`, Zähler
„1 von 5", Weiter-Knopf nennt den nächsten Bereich). Ein Reiter ohne Inhalt
wird ausgeblendet (`bereichHatInhalt`). Geprüft von
`scripts/pruefe-fuehrung.js` (vier eigene Bereichsprüfungen).

**Zwei Fragen sind offen und brauchen eine Antwort des Betreibers:**
1. Ist „Anlage" zu voll (Produkt + Montage + Maße + Farbe)?
2. Soll „Tragwerk" ein eigener Bereich werden?

### Maße: voreingestellt an und anklickbar *(31.10.2026)*

Die Maßlinien sind **standardmäßig eingeschaltet**. Ein Tipp auf ein Maßschild
im Bild öffnet ein kleines Zahlenfeld; die neue Zahl ändert die Anlage sofort.

- Anklickbar sind **Breite, Tiefe und Höhe vorne**. Das Schild trägt dafür
  `userData.massFeld`; den Klick wertet `massGeklickt()` aus.
- Die Zahl wird **in das Zahlenfeld des Bedienfeldes geschrieben**
  (`k3dBreiteZahl` …) und dort per `change` angewandt — dort hängen Mindest-
  und Höchstmaß und der Neubau. Im Browser gemessen: **99999 mm → 14080 mm**.
- Die Schilder sind seit dem 11.10.2026 bewusst klein und filigran; daran ist
  **nichts geändert**. Zurückgenommen wurde nur die Deckkraft des Kästchens
  (62 → 52 %), also dieselbe Richtung wie „nicht störend wirken".
- `k3dMassWert` steht in `pruefe-fuehrung.js` als **Ausnahme mit Begründung**:
  Es stellt nichts ein, solange getippt wird — sonst wäre eine halb getippte
  „4" sofort ein 4-mm-Dach.

**Offen, bewusst:** Mit der Tastatur sind die Schilder nicht erreichbar (sie
sind Teile im 3D-Bild, keine Knöpfe). Dieselben Werte stehen im Bedienfeld.

### Anklickpunkte am Modell — gebaut *(31.10.2026)*

Am Modell sitzt jetzt **ein Punkt je Seitenfeld und einer am Dach**. Ein Klick
springt in den passenden Bereich und setzt den Blick auf die Einstellung:
Feld → **Seiten**, Dach → **Dach**. Die angesprungene Zeile leuchtet kurz auf,
sonst wirkt der Klick folgenlos.

- Leer ist der Punkt ein **+**, belegt ein **Stift** — ein Plus an einer Seite,
  die längst eine Schiebeanlage hat, sagt etwas Falsches.
- **24 px (Handy 28 px), halbdurchsichtig**, unter dem Zeiger voll deckend.
  Nachgebessert am 31.10.2026: „die + zeichen sind zu groß … mach sie kleiner
  etwas durchsichtiger und feststehend". Weniger als 24 px geht nicht —
  das ist das Mindestmaß für eine Fläche zum Antippen (WCAG 2.2, 2.5.8).
- **Die Bühne wird beobachtet, nicht nur das Fenster** (`ResizeObserver` in
  `groesseAnpassen()`). Gemessen am 31.10.2026: Wird die Bühne kleiner, ohne
  dass sich das Fenster ändert — am iPhone fährt dabei die Adressleiste ein
  und aus —, blieb der Zeichenpuffer der Leinwand auf der alten Größe
  (Bühne 390 × 360, Puffer 390 × 380). Das Bild wird dann per CSS **gedehnt**
  (daher das verzerrte Modell) und die Punkte rechnen schon mit der neuen
  Größe: Sie liegen neben ihrem Bauteil. Ein `resize`-Ereignis kommt dabei
  nicht zuverlässig.
- **Verdeckte Punkte werden ausgeblendet** (`markenVerdeckungPruefen()`).
  Die Flächenrichtung allein reichte nicht: Beim Drehen schien der Punkt der
  abgewandten Längsseite durch das ganze Bauwerk und klebte an einem fremden
  Bauteil. Der Strahl läuft **nicht je Bild**, sondern höchstens alle 110 ms
  und nur bei bewegter Kamera — sonst wäre er der teuerste Posten der
  Zeichenschleife. Beleg: In der Ansicht „Von oben" ist nur noch **1 von 5**
  Punkten zu sehen, der am Dach.
- Abschaltbar an zwei Stellen, die denselben Wert halten: Schalter
  **„+ Punkte"** in der Ansichtsleiste und Häkchen unter *Anzeige*.
  Voreingestellt **an**.
- Punkte sind **HTML über der Leinwand** (`.k3d-marke`), nicht Teile im Modell.
  Deshalb bleiben sie bei jedem Zoom gleich groß, sind mit der Tabulatortaste
  erreichbar — und stehen **nicht** im gespeicherten Bild und nicht im PDF.
  Begründung und die verworfenen Wege: `docs/entscheidungen.md`, 31.10.2026.
- Lage: `markenFelder()` in `js/konfigurator-3d.js`, mit denselben Achsen, mit
  denen `eineSeite()` baut. Ob ein Punkt gezeigt wird, entscheidet die Richtung
  seiner Fläche (`markeSichtbar()`) — kein Strahl ins Modell, das wäre je Bild
  der teuerste Posten. Der Dachpunkt fällt in der Ansicht „Darunter" deshalb
  von selbst weg.
- Geprüft von **`scripts/pruefe-marken.js`** (28 Prüfungen, Gegenprobe mit
  24 einzeln eingebauten Fehlern).

**Beim ersten Bauen schiefgegangen** (steht hier, damit es niemand wiederholt):
Die Hülle über der Leinwand und das Häkchen im Bedienfeld trugen beide die
Kennung `k3dMarken`. `getElementById` nahm das erste Element im Dokument, also
das Häkchen — alle Punkte landeten **darin** statt über der Leinwand und saßen
im Browserlauf zu viert auf einem Fleck bei 0/0. Die Hülle heißt jetzt
`k3dMarkenHuelle`, und `pruefe-marken.js` prüft, dass beide Kennungen
verschieden sind.

**Offen (bewusst, braucht eine Entscheidung):**
1. **Ein Punkt je Feld, aber nur eine Auswahl je Seite.** Zwei Felder links
   springen beide in dieselbe Zeile „Links". Eine Auswahl je Feld wäre der
   nächste Schritt — und ein großer: Sie müsste durch Maßtabelle, Anfrage und
   Teilen-Link mitgehen.
2. **Kein Punkt am Terrassenboden, an den Pfosten und am Zubehör.** Auftrag
   waren Seitenfelder und Dach; mehr Punkte sind schnell zu viele.
3. **Der Hinweis zum Testbetrieb liegt beim ersten Aufruf über den Punkten.**
   Er verschwindet nach dem Wegklicken (einmal je Browser-Sitzung) — unschön,
   aber kein Fehler.

### Offen: Gibt es eine maximale Höhe hinten? *(seit 25.10.2026)*

Bei 7050 mm Tiefe und 8° Dachneigung ergibt sich eine **Höhe hinten von
3290 mm**. Der Höhenregler (vorne) endet bei 2700 mm, für die Höhe hinten gibt
es keine Grenze — die Pfosten hinten werden entsprechend lang. Gibt es eine
maximale Pfostenlänge oder Höhe hinten im System? Solange das niemand
beziffert hat, wird **nicht** gekappt; eine erfundene Grenze wäre schlimmer
als keine.

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
| `scripts/pruefe-symbole.js` | **Keine Emoji in der Oberfläche.** Sucht die Zeichen selbst (nicht das Aussehen) in Knopfbeschriftungen, in allem, was Javascript in die Seite schreibt, und in den sechs Skripten der Website. Dazu: Jedes benutzte Symbol gibt es, keines liegt ungenutzt herum, jedes hat eine viewBox, keines bringt fremde Bilddaten mit, das Sprite steht vor der ersten Verwendung. Gegenprobe: 17 Fehler, jeder einzeln |
| `scripts/pruefe-marken.js` | Anklickpunkte am Modell: ein Punkt je Seitenfeld (auch bei Unterzug und Mittelpfosten), kein Punkt hinten bei Wandmontage, hinten nach den **hinteren** Achsen, keiner steckt in einem Pfosten, Abgewandtes wird nicht gezeigt, Schalter wirkt, Punkte bleiben aus Bild und PDF heraus. `markenFelder()` und `markeSichtbar()` werden **ausgeführt**, nicht im Quelltext nachgelesen. Gegenprobe: 24 Fehler, jeder einzeln |
| `scripts/pruefe-aussparung.js` | Form der Anlage mit Aussparung: Lage links/rechts/mittig, Begrenzungen, wandert die Hinterkante genau dort, bleibt der Randsparren lang, bekommt kein Sparren Länge null (200 Stellen abgetastet). Die Gegenprobe baut **jeden Fehler einzeln** ein und verlangt, dass jede Prüfung in mindestens einem Durchgang anschlägt |
| `scripts/pruefe-konfigurator-sperre.js` | Ist der öffentliche Konfigurator wirklich gesperrt (503, nicht 404), führt die Hinweisseite zur Anfrage, ist die Werkstatt **nicht** mitgesperrt, verlinkt keine Seite ihn noch aktiv im Menü? **Beim Zurückschalten muss dieses Skript rot werden** |
| `scripts/pruefe-werkstatt.js` | Passwortschranke vor `/werkstatt/`: gesperrt ohne hinterlegtes Passwort, falsches Passwort abgewiesen, Keks HttpOnly/Secure/SameSite und nicht im Klartext, alte Anmeldung nach Passwortwechsel ungültig — **und ob die Seite überhaupt durch den Worker läuft** (`run_worker_first`). Gegenprobe: 10 Fehler, jeder einzeln |
| `scripts/miss-aussparung.mjs` | **Messwerkzeug, keine Prüfung** (keine `--gegenprobe`): misst die Aussparung im echten Browser nach — Scheiben, Lage, Hausvorsprung, fehlende Dateien. Hat am 31.10.2026 drei Fehler auf einmal gefunden. **Offen: eine echte Browser-Prüfung mit Gegenprobe daraus machen** |
| `scripts/baue-werkstatt.js` | Erzeugt `werkstatt/index.html` aus `konfigurator.html`. Mit `--pruefen` meldet es, wenn die Werkstatt nicht mehr auf dem Stand ist |
| `scripts/pruefe-konfliktmarken.sh` | **Nach jedem Merge, vor jedem Commit:** liegengebliebene Merge-Marken im ganzen Projekt. Gegenprobe legt eine Datei mit Marken an und muss sie finden |
| `scripts/pruefe-assistent.mjs` | Bedienung des Anfrage-Assistenten im echten Browser: Eindeckungs-Kacheln alle gleich groß (auch bei ungerader Anzahl), Aufpreis-Hinweis bei der Wunschfarbe, RAL-Suche (Kachel, Suchfeld, „braun" findet Brauntöne, Nummer steht vorn, Unsinn erklärt sich, **Eingabefeld behält den Fokus**, Treffer setzt die Farbe) |
| `scripts/pruefe-balkon.mjs` | Balkonüberdachung am fertigen Modell im Browser: Pfostenfuß auf der Brüstung bzw. am Boden, Pfosten hinter der Brüstung, Dach bis zur Außenkante, Pfosten-Auswahl verschwindet beim Geländer, Baurechts-Hinweis, keine Javascript-Fehler. Gemessen werden Eckpunkte in Weltkoordinaten |
| `scripts/pruefe-kurzlink.mjs` | Kurzlink im Worker ohne Datenbank: Wege bedient, Unsinn mit 400 abgewiesen bevor die Datenbank angefasst wird, 503/404 ohne Datenbankmeldung, Kennung stabil und vorlesbar, Tabelle ohne Persönliches. Dazu die Ausweich-Logik an einer nachgebauten Datenbank: `public` offen / `public` verschlossen / Datenbank ganz weg, und die fertigen SQL-Befehle werden zurückgelesen |
| `scripts/pruefe-teilen.mjs` | Teilen-Link: plant im Browser, teilt, öffnet den Link in einem frischen Tab und vergleicht alle 91 Einstellungen, 14 Knopfreihen und die Farbe. Gegenprobe verfälscht den Link und erwartet den Hinweis |
| `scripts/pruefe-ral.js` | RAL-Tabelle und Farbsuche: führt beide aus – 217 Töne, Stichproben Nummer → Name, Helligkeit der Schwarz-/Weißtöne nachgerechnet, neun Suchfragen mit erwartetem erstem Treffer, Lupe im HTML verdrahtet |
| `scripts/pruefe-bodengefaelle.js` | Gefälle des Terrassenbodens: Führt `bodenY()` aus und rechnet nach – ebener Boden ändert nichts, 2° auf 4 m sind 140 mm, vier Ecken auf vier Höhen. Dazu: Dach wird verschoben statt gekippt, Pfostenlängen gehen in die Anfrage. **Misst mit three.js nach**, dass Wiese und Plattenoberseite senkrecht gemessen auf derselben Ebene liegen wie die gerechneten Pfosten |
| `scripts/pruefe-stufen.js` | Basic und Pro: Ist Basic voreingestellt? Trägt jede Fachangabe `data-k3d-pro`? Bleibt jede Kundenfrage in Basic sichtbar? Verbirgt die Stufenregel nur, statt aufzudecken? Und vor allem: Wird beim Umschalten **kein** Wert zurückgesetzt |
| `scripts/pruefe-rueckseite.js` | Die vierte Seite: Gibt es sie nur freistehend? Verschwindet die Wahl beim Zurückschalten auf Wandmontage wieder? Kein Keil hinten, Höhe aus der Dachunterkante, Assistent kennt `erw_hinten` |
| `scripts/pruefe-bauteile.js` | Liefert `js/bauteile.js` für jede Zeile der Preisliste dieselben Sparren- und Pfostenzahlen? |
| `scripts/pruefe-hinweise.js` | Bleibt getrennt, was der Kunde sieht, und was nur in die Anfrage-Mail gehört? Prüft Hinweisbox, Kasten „Ihre Konfiguration", Assistenten-Anzeige und alle drei Versandwege – einmal aus dem Quelltext, einmal an wirklich erzeugten Hinweisen |
| `scripts/pruefe-pdf.js` | Erzeugt die PDFs **beider** Stellen (Konfigurator und Baugenehmigungs-Check) und liest sie mit **pdfinfo, pdftotext und pdfimages** zurück – fremden Werkzeugen, die unsere Annahmen nicht kennen. Seitenzahl, Format, Bildgröße, Umlaute, und vor allem: Steht jede Angabe **vollständig** da, auch bei 34 langen Zeilen über zwei Seiten? Zweispaltige Seiten werden dafür spaltenweise ausgeschnitten – am Stück gelesen zerreißt pdftotext die umgebrochenen Zeilen |
| `scripts/pruefe-api-bauteile.mjs` | Baut den Worker wie Cloudflare, stellt echte Anfragen – und prüft, dass **keine** Antwort die Matrix enthält |
| `scripts/pruefe-live.sh` | Ist der veröffentlichte Stand tatsächlich draußen? (nutzt `curl -sL`). Marker mit `gesperrt:` ruhen, solange der öffentliche Konfigurator abgeschaltet ist — aber nur, wenn wirklich die **Hinweisseite** kommt; etwas Drittes ist ein Fehler. Gegenprobe dafür: `SPERRE_BELEG=XX bash scripts/pruefe-live.sh` muss die sechs rot machen. **Beim Zurückschalten sagt das Skript selbst, dass `gesperrt:` zu entfernen ist** |

**Exit-Code abfragen, nicht die letzte Zeile lesen.** Am 23.10.2026 fiel
auf, dass `pruefe-konfigurator-oberflaeche.mjs` seit PR #281 (11.10.2026)
mit einer Ausnahme abbrach, statt ein Ergebnis zu melden – zwölf Tage
unbemerkt rot. Eine Prüfung, die mit einer Ausnahme endet, ist rot.

**Stand 31.10.2026: alle Skripte laufen durch**, jedes mit vollständig
anschlagender Gegenprobe
(`pruefe-marken.js` 28 Prüfungen und 25 Fehler, `pruefe-masstabelle.js` 364,
`pruefe-markise.js` 190, `pruefe-fuehrung.js` 313, `pruefe-teilen.mjs`,
`pruefe-kurzlink.mjs`, `pruefe-assistent.mjs`, `pruefe-werkstatt.js`).

> **Am 31.10.2026 repariert: Dieses Skript brach bei Prüfung 67 von 90 ab**
> — die letzten 23 Prüfungen (Untergrund, Montage, Verkleidung, der ganze
> Handy-Teil) liefen seit PR #500 gar nicht, und in der **Gegenprobe** war es
> dieselbe Stelle. Es lag **nicht** an den Anklickpunkten: derselbe Abbruch am
> unberührten Programmstand mit unverändertem Skript, in eigenen Läufen
> nachgewiesen.
>
> **Ursache, gemessen statt geraten:** `page.check('#k3dSound')` lief in eine
> Zeitüberschreitung. An der Stelle war das Kästchen sichtbar, nicht gesperrt,
> im Bild, und `elementFromPoint` in seiner Mitte war es selbst — ein Klick
> im Browser setzte es sofort, nur der Mausklick von außen kam nicht an. Der
> Unterschied zu den Häkchen weiter oben: **das Bedienfeld war 6944 von
> 8683 px gescrollt.** Playwright scrollt heran und klickt sofort danach; der
> Browser hat die neue Scrollstelle da noch nicht übernommen, der Klick
> landet auf den alten Koordinaten. Alle sieben Häkchen laufen jetzt über
> `haken()` — heranscrollen, zwei Bilder warten, dann klicken.
>
> **Dahinter lag ein zweites Hindernis verdeckt:** Die Gegenprobe quetscht
> die Bühne absichtlich auf 0 px. Die Ansichtsleiste liegt darin und ist
> mittig begrenzt, hat dann also keine Fläche zum Anklicken — der Klick auf
> „Darunter" scheiterte. Gelöst über `ansicht()`: im normalen Lauf ein echter
> Mausklick, in der Gegenprobe wird der Knopf direkt ausgelöst (dasselbe tut
> das Skript seit längerem beim Umschalter `#k3dModus`).
>
> **Stand jetzt: 91 von 91 Prüfungen grün, Gegenprobe bestanden** — alle
> eingebauten Fehler werden gefunden.

Ebenfalls am 31.10.2026 gefunden: Eine Prüfung desselben Skripts war seit
der Bereichs-Aufteilung (PR #500) **unbemerkt rot**. Sie erwartete, dass das
Maßfeld im Produktschritt unsichtbar ist — seit den fünf Bereichen steht
„Maße" aber absichtlich im Bereich *Anlage*. Sie prüft jetzt dieselbe
Absicht am neuen Aufbau: Während „Anlage" offen ist, darf die Montagefrage
(Bereich *Fertig*) nicht sichtbar sein. **Zwei Prüfungen in einem Skript,
beide unbemerkt rot** — das ist der Grund, warum oben „Exit-Code abfragen"
steht.

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

**Wenn der Zweig schon eigene Commits trägt** (frisch aufsetzen ginge nur mit
`--force-with-lease`, und das lehnt die automatische Freigabe ab): `main`
hereinholen statt überschreiben. PRs werden hier **squash**-gemergt — dadurch
meldet git beim nächsten Mal 50+ Konflikte, obwohl inhaltlich nichts
auseinanderläuft. Am 31.10.2026 dreimal hintereinander passiert. Der eigene
Zweig ist dabei der neuere Stand:

```bash
git merge origin/main
git diff --name-only --diff-filter=U | xargs git checkout --ours --
git diff --name-only --diff-filter=U | xargs git add
git commit --no-edit
bash scripts/pruefe-konfliktmarken.sh
git diff --stat <letzter-eigener-commit> HEAD   # MUSS LEER SEIN
```

Die letzte Zeile ist der Nachweis, dass durch das Hereinholen keine Datei
ihren Inhalt verändert hat. Ohne sie ist `--ours` geraten, nicht geprüft.

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
| 31.10.2026 | **Maße voreingestellt an und im Bild anklickbar** — Tipp auf ein Maß öffnet ein Zahlenfeld | live |
| 31.10.2026 | Anklickpunkte kleiner, halbdurchsichtig, **verdeckte werden ausgeblendet**; Werkstatt-Streifen von 4 Zeilen auf eine (28 px) | live |
| 31.10.2026 | **Keine Emoji mehr**: eigene Symbolsammlung für Konfigurator und Website (Cookie-Banner, Newsletter, Slider, Galerie-Lupe, Ortsanzeige, Bedienhilfe) | live |
| 31.10.2026 | `pruefe-live.sh`: sechs Marker auf dem gesperrten Konfigurator machten sie unbemerkt rot — ruhen jetzt, mit Beweis der Hinweisseite | live |
| 31.10.2026 | `pruefe-konfigurator-oberflaeche.mjs`: Abbruch bei Prüfung 67 von 90 behoben (23 Prüfungen liefen seit PR #500 nicht) | live |
| 31.10.2026 | **Anklickpunkte am Modell**: ein Punkt je Seitenfeld, einer am Dach, Klick springt in den Bereich; abschaltbar | live |
| 31.10.2026 | Menü in fünf Bereiche geteilt (Anlage · Dach · Seiten · Zubehör · Fertig) mit Reitern und Zähler | live |
| 31.10.2026 | Werkstatt `/werkstatt/`: Passwortschutz im Worker, Neu-laden-Knopf, Versionsanzeige | live |
| 31.10.2026 | Öffentlicher Konfigurator gesperrt: Hinweisseite statt Rechner, alle Links raus | live |
| 31.10.2026 | Aussparung (Hausvorsprung) als Machbarkeitsnachweis — nur in der Werkstatt | **wartet auf Entscheidung** |
| 25.10.2026 | **Sonderform entfernt** – Entscheidung des Betreibers; Sonderformen laufen über Telefon und Aufmaß | live |
| 25.10.2026 | Teilen-Knopf: Link öffnet die Planung wieder, mit PDF-, WhatsApp- und E-Mail-Weg | live |
| 25.10.2026 | Kurzlink über den eigenen Worker (`/api/teilen`, `/k/<id>`) | **zurückgestellt – Datenbankrolle darf nichts anlegen (`42501`), siehe Abschnitt 2** |
| 25.10.2026 | Alle RAL-Töne (217) mit Lupensuche nach Farbe oder Nummer | live |
| 25.10.2026 | PDF: Kacheln liefen ineinander; Durchfahrt jetzt mit Statikträger | live |
| 25.10.2026 | Gefälle sichtbar: Steigungsdreieck an der Maßlinie | live |
| 24.10.2026 | Gefälle des Terrassenbodens: Pfostenlängen je Ecke, Wiese kippt mit | live |
| 24.10.2026 | Statikträger auf Wunsch auch beim Carport TDS | live |
| 24.10.2026 | Zwei Stufen im Konfigurator: Basic (Kundenfragen) und Pro (alles) | live |
| 24.10.2026 | Rückseite teilt sich an ihren eigenen Pfosten | live |
| 24.10.2026 | Maßlinien als Körper mit Endmarken, BV-Logo deutlicher | live |
| 23.10.2026 | Seitenelemente auch hinten, wenn die Anlage freistehend ist | live |
