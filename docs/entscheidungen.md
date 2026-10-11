# Entscheidungen

> Logbuch der Grundsatzentscheidungen. **Diese Datei wird durchsucht, nicht
> gelesen** – `grep -i "stichwort" docs/entscheidungen.md`.
>
> Jede Zeile beantwortet: Was gilt, warum, und was der Anlass war. Wer etwas
> ändern will, das hier steht, sollte zuerst die Begründung entkräften können.

## Produkt und Außenwirkung

| Datum | Entscheidung | Begründung | Anlass |
|---|---|---|---|
| 09.09.2026 | **Keine Preise auf der Website** – weder Pauschal- noch Richtpreise, auch nicht nach Kontaktdaten | Preise hängen an Aufmaß, Untergrund, Statik und Ausstattung; eine veröffentlichte Zahl hält später nicht und macht vergleichbar | Grundsatz des Betreibers, mehrfach bestätigt |
| 09.09.2026 | Statt Preisen eine **ausdrückliche Klarstellung** auf der Kostenseite, im FAQ-Schema und in `llms.txt`: kursierende Richtwerte stammen nicht von uns | KI-Antworten nannten Preisspannen und setzten die Quellenangabe BV AussenSysteme daneben. Wer keine Zahl liefert, überlässt sie der Konkurrenz – eine direkte Aussage kann zitiert werden | Screenshot einer ChatGPT-Antwort mit „4.000–7.000 €" neben unserem Namen |
| 09.09.2026 | **Kein `aggregateRating`** im Schema | Google verbietet selbstdargestellte Bewertungen über das eigene Unternehmen auf der eigenen Seite (self-serving reviews), unabhängig von der Anzahl | Vorschlag aus einem Sichtbarkeits-Check |
| 09.09.2026 | KI-Chat entfernt, stattdessen öffnet der schwebende Button den **Anfrage-Assistenten** | Der Chat beantwortete Fragen, der Assistent erzeugt Anfragen | Wunsch des Betreibers |
| 10.10.2026 | 3D-Konfigurator endet im **Anfrage-Assistenten statt im Richtpreis** | Folgt der Preis-Linie; das Vorbild antonov-outdoor.de zeigt Richtpreise, das kam nicht infrage | Wunsch nach einem Konfigurator wie beim Wettbewerb |
| 10.10.2026 | **Maße durchgehend in Millimeter**, auch im Assistenten | So wird im Aufmaß gearbeitet | Ansage des Betreibers: „mm ist okey und richtig überall anwenden" |
| 10.10.2026 | **Reinweiß entfällt im Konfigurator, sobald Flat Line gewählt ist** (und eine bereits gewählte Farbe springt auf Anthrazit zurück) | Flat Line gibt es nur in drei Standardfarben – dieselbe Einschränkung steht im Anfrage-Assistenten. Sonst stünde in der Anfrage eine Farbe, die es für das Produkt nicht gibt | Abgleich Konfigurator/Assistent |

## Pflichtangaben im Anfrage-Assistenten

| Datum | Entscheidung | Begründung | Anlass |
|---|---|---|---|
| 16.09.2026 | Pflicht: **Anrede, Nachname, E-Mail, Telefon, PLZ, Ort** + Datenschutz-Zustimmung | Ohne Standort kein Aufmaßtermin und keine Anfahrt­einschätzung; Rückfragen am Telefon sparen mehrere E-Mails | Schrittweise Anweisungen des Betreibers |
| 16.09.2026 | **Vorname optional, Nachname Pflicht** | Entscheidung des Betreibers | Anweisung |
| 16.09.2026 | Fake-Erkennung prüft Zeichenmuster in **beiden** Namensfeldern | Sie lief nur auf dem Vornamen; nach dem Tausch wäre „xxxx" als Nachname durchgegangen | Beim Umbau aufgefallen |
| 10.10.2026 | Telefon-Prüfung **tolerant**: nur Ziffern zählen, mindestens sechs | `+49`, `0049`, Klammern, Schrägstriche und Leerzeichen sind übliche Schreibweisen; eine strenge Maske verliert echte Kunden | Telefon wurde Pflichtfeld |

## Technik

| Datum | Entscheidung | Begründung | Anlass |
|---|---|---|---|
| 10.10.2026 | **Lamellendach bekommt einen eigenen Regler für den Öffnungswinkel** (0–90°), die Lamellen überlappen sich bei 0° | Die drehbaren Lamellen sind das Kennzeichen des Systems – ein starres Bild zeigt nicht, wofür man bezahlt. Geschlossen ist so ein Dach regendicht, deshalb Überlappung statt fester Lamellenbreite | Bau der Pergola |
| 10.10.2026 | Farb- und Beleuchtungswerte werden **je Produkt** übersetzt | Beim Lamellendach heißt RAL 9010 im Assistenten „Creme-Weiß“ statt „Reinweiß“ und die Beleuchtung „Ja, mit Beleuchtung“ statt „Ja, mit LED-Spots“. Derselbe Wert am falschen Produkt kommt im Assistenten nicht an – und fällt nicht auf, weil beide Werte gültig sind | Beim Bau der Pergola aufgefallen |
| 09.09.2026 | Assistent wird auf der Startseite **per DOM-Verschiebung** ins Panel geholt, nicht kopiert | Ein zweites Exemplar hätte doppelte IDs (`#awTitle` …) erzeugt; `anfrage-wizard.js` hätte nur noch das erste bedient | Der Button scrollte nur, statt das Fenster zu öffnen |
| 09.09.2026 | **Eigener PDF-Schreiber** (`js/bg-pdf.js`) statt Druckdialog oder PDF-Bibliothek | Safari auf dem iPhone ignoriert `window.print()` stillschweigend; jsPDF & Co. wären mehrere hundert Kilobyte und eine weitere Abhängigkeit | „auf dem Handy lädt nix runter" |
| 09.09.2026 | PDF nutzt die **eingebauten Standardschriften** (Helvetica), keine Einbettung | Ergebnisdatei bleibt bei rund 9 KB statt mehrerer hundert | – |
| 09.09.2026 | Querverweise in der Datenschutzerklärung nennen **Abschnittsnamen statt Nummern** | Nummern verschieben sich, sobald ein Abschnitt entfällt – genau so entstanden zwei tote Verweise | Entfernen des KI-Chat-Abschnitts |
| 16.09.2026 | Hintergrund wird **nur im Sheet-Layout** (max. 600 px) fixiert | Auf dem Desktop schwebt das Fenster; die Seite dahinter durfte dort immer scrollen. Mein erster Fix fror auch den Desktop ein | Eigener Fehler, mit PR #254 korrigiert |
| 16.09.2026 | `body { overflow: hidden }` reicht nicht – der Body wird **fixiert** und die Scrollposition gemerkt | iOS Safari scrollt die Seite hinter einem Overlay trotzdem weiter | „wenn man mit finger scrollt dann scrollt nur der hintergrund" |
| 10.10.2026 | **three.js liegt unter `js/vendor/`**, nicht auf einem CDN | Kein weiterer Drittanbieter, keine IP-Übermittlung, keine CSP-Änderung, kein neuer Punkt in der Datenschutzerklärung. Kostet 603 KB im Repo | Bau des 3D-Konfigurators |
| 10.10.2026 | **Eigene Kamerasteuerung** statt OrbitControls | OrbitControls liegt nicht im three.js-Kern und käme von einem zweiten CDN; außerdem sollte das Touch-Verhalten nach den Scroll-Problemen selbst bestimmbar sein | Bau des 3D-Konfigurators |
| 10.10.2026 | Werte, die der Konfigurator an den Assistenten übergibt, müssen **wörtlich dessen Auswahlwerte** sein (`VORGABE_*`-Zuordnungen) | Weicht ein Wert ab, bleibt im Assistenten nichts markiert und die Angabe kann still aus der E-Mail fallen – ohne Fehlermeldung. Geprüft von `scripts/pruefe-konfigurator.js` | `verglasung: "VSG-Glas"`, `led: "Ja"`, `farbe: "Anthrazit"` kamen so nie an |
| 10.10.2026 | **Ein Konfigurator für alle Produkte**, Geometrie in `bauen()` nach Produkt verzweigt | Vier Seiten mit fast gleichem Inhalt hätten sich gegenseitig Konkurrenz gemacht und viermal gepflegt werden müssen | Erweiterung um Carport und SkyView |
| 10.10.2026 | Beim Produktwechsel werden die Maße auf die **Voreinstellung des Produkts gesetzt**, nicht umgerechnet | Ein 3 m tiefes Terrassendach ergibt als Carport keinen brauchbaren Startwert; stilles Umrechnen wäre irritierender als ein sichtbarer Sprung | Eigene Maßbereiche je Produkt |
| 10.10.2026 | Beim Flachdach-Carport bleibt die **Blende waagerecht**, das Gefälle liegt innen | So ist es gebaut (verdeckte Entwässerung) – eine mitgeneigte Blende sähe nach Schuppen aus und nicht nach Flat Line | Bau der Flachdach-Geometrie |
| 10.10.2026 | **Stückzahlen kommen aus der Herstellertabelle, nie aus einer Formel** (`js/bauteile.js`, Daten in `daten/`) | Die Sparrenanzahl springt unregelmäßig: bei TDS/Glas 11 → 13 → 15, dann über vier Breiten konstant. „Alle 1000 mm ein Sparren" liegt bei fast jeder Breite daneben | Herstellerdaten des Betreibers vom 10.10.2026 |
| 10.10.2026 | **Gebaut wird nach Kundenmaß, abgerechnet nach Raster.** Wer 5300 mm will, bekommt 5300 mm – Preis, Pfosten- und Sparrenzahl kommen aus dem nächstgrößeren Rasterfeld (5900 mm). Beide Zahlen stehen nebeneinander | Richtigstellung des Betreibers am 10.10.2026. Ich hatte das Raster zuerst als Liste der baubaren Größen gelesen und „Zwischenmaße gibt es nicht“ dokumentiert – falsch. Das Raster ist die Abrechnungsgrundlage, nicht die Fertigungsgrenze | Hinweis des Betreibers, nachdem der Konfigurator schon darauf gebaut war |
| 10.10.2026 | Matrix liegt als **Datei** (`daten/dachmatrix.json`) und wird maschinell nach `js/dachmatrix-daten.js` übersetzt, nicht abgetippt | Bei neuer Preisliste wird nur die Datei ersetzt und das Skript erneut ausgeführt. Abgetippte Zahlen laufen auseinander | ebenda |
| 10.10.2026 | Geschätzte Maße tragen im Code `// GESCHÄTZT:` und stehen gesammelt in `PROFILE_GESCHAETZT` | Belegt sind nur zwei Querschnitte (Pfosten 110×110, Statikträger 189×117). In sechs Monaten weiß sonst niemand mehr, was belegt war | `daten/offene-punkte.md` |
| 10.10.2026 | Widersprüchliche Grenzen werden **nicht geglättet**: Betriebsgrenze 4500 mm, Preislisten-Markierung erst ab 5050 mm → es gilt die härtere, mit sichtbarem Hinweis | Eine stillschweigende Entscheidung hätte den Widerspruch verschwinden lassen, statt ihn zur Klärung zu bringen | `daten/technische-daten.md` Abschnitt 5 |
| 10.10.2026 | **Die Herstellermatrix liegt nicht in diesem Repository** (`daten/` und `js/dachmatrix-daten.js` stehen in `.gitignore` und `.assetsignore`) | `bvlandingpage` ist ein **öffentliches** Repository. Die Sparren- und Stützfußmatrix über 2.240 Maßkombinationen ist eine systematische Übernahme aus den VD-Preislisten; daran besteht ein Datenbankherstellerrecht (§§ 87a ff. UrhG), unabhängig von der Schutzfähigkeit der einzelnen Zahl. Die Quelle (`bv-crm`, privat) sagt das ausdrücklich | Beim Lesen von `bv-crm/docs/konfigurator-daten/README.md` aufgefallen – **nachdem** die Dateien bereits in einen Branch des öffentlichen Repositorys gepusht waren |
| 10.10.2026 | Ein öffentlicher Konfigurator darf die Matrix **nicht an den Browser ausliefern**. Zulässig ist, nur das Ergebnis zu zeigen | Wörtlich aus derselben Quelle: „Ein Konfigurator, der nur Ergebnisse zeigt …, ist davon nicht betroffen – dann liegen die Daten auf dem Server, nicht beim Besucher." | ebenda |
| 10.10.2026 | Umgesetzt als **Worker-Endpunkt `/api/bauteile`**: Der Browser schickt ein Maß, der Server antwortet mit einer Stückliste. Die Matrix liegt im **KV-Speicher**, nicht im Repository | Der Worker existierte schon für `/api/kontakt`. KV statt Secret, weil die Matrix mit 4,8 KB zu dicht an der 5-KB-Grenze für Secrets liegt – die nächste Preisliste würde sie sprengen | Entscheidung des Betreibers am 10.10.2026 |
| 10.10.2026 | `js/bauteile.js` enthält **keine Daten und lädt keine** – die Matrix wird über `matrixSetzen()` hereingereicht | Dieselbe Datei läuft im Browser, unter Node und im Worker. Ein `require` der erzeugten Datei hätte den Worker-Build scheitern lassen, sobald sie fehlt – und sie fehlt im Repository absichtlich | Beim Bündeln des Workers aufgefallen |
| 10.10.2026 | Fehlt der KV-Speicher, antwortet der Endpunkt **503** und der Konfigurator zeigt die geschätzte Skizze. Kein Platzhalter-Binding in `wrangler.jsonc` | Eine erfundene Namespace-id lässt jeden Deploy scheitern. So bleibt die Seite benutzbar, auch wenn die Daten noch nicht eingespielt sind | – |

## Arbeitsweise

| Datum | Entscheidung | Begründung | Anlass |
|---|---|---|---|
| 10.10.2026 | **Übergabe in drei Dateien** statt im Chatverlauf: Einstieg, Logbuch, Archiv | Der Verlauf ist nach einem `/clear` weg – mit ihm die Begründungen, die nirgends im Code stehen | Vorgabe des Betreibers, als Abschnitt in `CLAUDE.md` übernommen |
| 10.10.2026 | Jedes Prüfskript bekommt eine **`--gegenprobe`** | Eine Prüfung, die nur die eigene Arbeit bestätigt, ist keine. Beispiel: `curl` ohne `-L` liefert einen leeren Body, jede Inhaltsprüfung wirkt dann bestanden | Falsche Erfolgsmeldung bei der Preis-Prüfung |
| 10.10.2026 | Rechtstext-PDFs (Widerruf, AGB, Datenschutz) **nicht** ins Repository | Sie werden aus den Seiten erzeugt; zwei Fassungen desselben Textes laufen auseinander | Erstellung für Kleinanzeigen |

## Bewusst verworfen

| Verworfen | Warum | Stattdessen |
|---|---|---|
| jsPDF / html2canvas für den PDF-Download | mehrere hundert Kilobyte, externe Abhängigkeit, CSP-Anpassung nötig | eigener PDF-Schreiber in `js/bg-pdf.js` |
| OrbitControls aus dem three.js-Beispielordner | zweites CDN, Touch-Verhalten nicht steuerbar | rund 60 Zeilen eigene Steuerung in `js/konfigurator-3d.js` |
| `aggregateRating` im LocalBusiness-Schema | Verstoß gegen Googles Richtlinie zu selbstdargestellten Bewertungen | echte Bewertungen im Google-Profil sammeln |
| 2D-Vorschau als Zwischenschritt | Betreiber entschied sich direkt für echtes 3D | three.js-Modell |
| Richtpreise im Konfigurator (wie beim Wettbewerb) | widerspricht der Preis-Linie | Übergabe an den Anfrage-Assistenten |
| Hochladen der Rechtstext-PDFs ins Repository | sie werden aus den Seiten erzeugt; zwei Fassungen desselben Textes laufen auseinander | bei Bedarf neu erzeugen, siehe `docs/NEXT_TASK.md` |

## 10.10.2026 – Konfigurator als Vollbild-Anwendung, nach dem Vorbild von antonov-outdoor.de

**Anlass.** Der Betreiber: „analysiere die komplette seite, den code und baue
den konfigurator ähnlich nur in meinem seitendesign“ (antonov-outdoor.de/konfigurator).
Vorher war unser Konfigurator eine normale Seite mit Überschrift, Bühne und
einer Spalte Auswahlfelder daneben.

**Was analysiert wurde.** Seite (36 KB HTML, 15 KB CSS inline) und Bundle
(905 KB, esbuild, three.js plus App, minifiziert). Aufbau dort: 340-px-Seitenleiste
mit aufklappbaren Abschnitten, jeder mit Kurzfassung der Auswahl im Kopf;
Modell daneben bildschirmfüllend; Werkzeugleiste unten über dem Modell,
Aktionsknöpfe oben rechts; auf dem Handy Modell oben (48 svh), Bedienfeld
darunter. Texturen werden dort wie hier per Canvas erzeugt, keine Bilddateien.

**Was übernommen wurde** (Entscheidung des Betreibers: „Layout + belegte Optionen“):
Vollbild-Layout, Abschnitte mit Kurzfassung, Zahlenfeld neben jedem Regler,
zuschaltbare Maßlinien, Terrassenboden, Vollbild-Knopf, Ansicht „Darunter“,
Taste R, Schiebeelemente als einzelne Flügel mit Öffnen-Regler, Sonnenschutz
(Aufdach, Unterdach, Senkrechtmarkisen mit Ausfahr-Regler), Carport-Verkleidung
aus Sichtschutzpaneelen.

**Was NICHT übernommen wurde und warum.**
* **Richtpreis.** Antonovs ganzer Ablauf endet im Richtpreis nach dem Absenden
  des Formulars – das ist ihr Köder. Dem Betreiber vorgelegt, Antwort: bleibt
  ohne Preis. Kein Preis im Code, nichts Auslesbares.
* **Markisenstoff-Kollektionen, Plissee, Zaunpaneele, Holzdekore.** Dafür
  liegen uns keine echten Stoff- und Dekornamen vor. Erfinden wäre eine
  Produktaussage, die im Angebot nicht haltbar ist.
* **Maße in Zentimetern.** Antonov rechnet in cm, hier bleibt alles in mm –
  so wird aufgemessen.

**Zwei Fehler, die dabei auffielen** (beide vom Browsertest gefunden, nicht beim Lesen):
1. Die Klasse `k3d-seite` am `body` traf die vorhandene CSS-Regel `.k3d-seite`
   (die Zeile „Links / Rechts / Vorne“, ein Raster mit 62-px-Spalte) und zog
   die ganze Anwendung auf 62 px zusammen. Klasse heißt jetzt `k3d-app-seite`,
   mit Begründung als Kommentar an der Regel.
2. Die Notiz aus dem Konfigurator (`answers.wunsch`) fiel komplett aus der
   E-Mail: `summaryPairs()` prüfte `inFlow('wunsch')`, und der Schritt „wunsch“
   gehört bei den Standardprodukten nicht zum Ablauf. Genau darin stehen die
   Angaben ohne eigenes Feld – Sonnenschutz, Verkleidung, Bodenbelag. Jetzt
   wird sie mitgeschickt, sobald sie da ist, unter „Aus dem 3D-Konfigurator“.

**Dritter Fund: das Terrassendach wurde als Carport gezeichnet.**
`/api/bauteile` antwortet mit 503, solange die Herstellermatrix nicht im
KV-Speicher liegt (bekannt, siehe NEXT_TASK Aufgabe A2). Der Rückfall lief
aber für *alle* Produkte in `bauenGeschaetzt()` – und das ist die
Carport-Skizze. Über der Überschrift „Terrassendach TDS“ stand also ein
Carport, und Seitenelemente erschienen überhaupt nicht, weil sie nur im
Datenpfad gezeichnet wurden. Neu: `bauenTerrasseGeschaetzt()` mit eigenen
Proportionen (Pfosten 110 mm BELEGT, Sparrenabstand 1100 mm Richtwert, alles
übrige GESCHÄTZT und so markiert). Sobald die Matrix angebunden ist,
übernimmt wieder `bauenAusDaten()`.

**Gegenzulesen.** Ob die Sichtschutzpaneele (140 mm, von unserer eigenen
Produktseite) so angeboten werden; ob „Aufdach“ und „Unterdach“ die richtigen
Bezeichnungen für unsere Beschattungen sind; die geschätzten Proportionen des
Terrassendachs im Vergleich zu einem echten Foto.

## 10.10.2026 – Flat Box: Dach ohne Gefälle, Eindeckung sichtbar als Trapezblech

**Anlass.** Der Betreiber: „Flatbox hat auf dach kein gefälle und eindeckung
is trapezblech“.

**Was falsch war.** Die geschätzte Carport-Zeichnung gab dem Flachdach 1,5°
Neigung (`NEIGUNG = (tds ? 6 : 1.5)`). Das widersprach unseren eigenen Daten:
`js/bauteile.js` führt `GENEIGT = { 'TDS': true, 'SkyView': false, 'Flat Line':
false }` mit dem Vermerk BELEGT (technische-daten.md 1). Flat Box ist Flat Line
mit Wänden, also ebenfalls ohne Gefälle. Sichtbar war es an der nach vorn
kippenden Dachfläche und an den hinteren Pfosten, die 144 mm länger wurden.

**Was jetzt gilt.** Nur der Carport TDS ist geneigt (6°). Flat Line und Flat Box
liegen waagerecht. Die Eindeckung wird als echtes Trapezblech gezeichnet:
Grundblech plus Rippen, Profilhöhe 35 mm (BELEGT, T35M-0,75), Rippenabstand
200 mm (GESCHÄTZT – der Wert steht als Rückfrage 5 an VD). Solarmodule und
Dachbegrünung liegen jetzt **auf** dem Blech, sie ersetzen es nicht; die
Oberfläche sagt das auch.

**Eine frühere Entscheidung wird damit widerrufen.** Der Eintrag vom selben
Tag – „Blende waagerecht, Gefälle liegt innen (verdeckte Entwässerung)“ – war
eine Annahme von mir, keine Herstellerangabe. Sie gilt nicht mehr. Wo genau
ein Flat-Line-Dach entwässert, ist nicht belegt und wird deshalb nicht
gezeichnet.

**Abgesichert.** `scripts/pruefe-konfigurator.js` vergleicht jetzt die
GENEIGT-Tabelle aus `js/bauteile.js` mit der Neigung im Konfigurator; die
Gegenprobe baut genau diesen Fehler wieder ein und erkennt ihn.

## 10.10.2026 – Polycarbonat sieht aus wie Polycarbonat, und alle vier Ausführungen sind wählbar

**Anlass.** Der Betreiber: „Polycarbonat sieht aus wie glas […] wir haben,
klar, opal (milchig), graphit und bronze“.

**Was falsch war.** Der Konfigurator kannte eine einzige Eindeckung
„Polycarbonat“ und zeichnete sie als transparente, spiegelnde Fläche – optisch
identisch zu Glas. Im Anfrage-Assistenten gab es nur klar und opal.

**Was jetzt gilt.** Vier Ausführungen, so wie sie in der Artikelliste stehen
(`daten/profile-und-eindeckung.csv`, Art. 6077 klar, 6025 opal, 6126 graphit,
6127 bronce – Sechsfachstegplatten 16 mm): klar, opal, graphit, bronze. Die
Artikelliste schreibt „Bronce“, sichtbar steht Bronze. Dieselben vier stehen
jetzt auch im Anfrage-Assistenten.

Im Modell bekommt Polycarbonat eine eigene Darstellung: matter als Glas, dazu
eine gezeichnete Streifentextur für die Stege. Genau daran erkennt man eine
Stegplatte; der echte Stegabstand einer 16-mm-Platte wäre in dieser
Darstellung nicht sichtbar, die Streifen sind also ein Hinweis, kein Maß.

**Woher die Lichtwerte kommen.** Händler-Datenblätter (dwz-shop.de,
baustoffshop.de): klar ca. 76 %, opal ca. 48 %, bronze ca. 35–38 %. Es sind
Werte für Dreifach- und Fünffachplatten, nicht für die Sechsfachplatte – als
Richtwert gekennzeichnet. **Für Graphit war nichts zu finden**; die Deckkraft
im Modell ist geschätzt, und die Oberfläche sagt, dass uns dazu noch eine
Angabe fehlt. Beim Hersteller nachfragen.

**Abgesichert.** `scripts/pruefe-konfigurator.js` liest die Artikelliste und
verlangt, dass jede dort geführte Stegplatten-Ausführung im Konfigurator
wählbar ist (übersprungen mit Hinweis, wenn die Liste nicht vorliegt – sie
gehört nicht ins Repository). Der Browsertest prüft, dass Glas, klar, opal,
graphit und bronze jeweils ein anderes Bild ergeben.

## 10.10.2026 – Ein gemeinsamer Fragensatz für beide Konfiguratoren

**Anlass.** Zwei Beanstandungen des Betreibers: „wenn man led beleuchtung in
den sparren auswählt, ist diese im modell nicht in den sparren sondern miten
in der eindeckung“ und „generell die abfragen sollen ähnlich sein wie in
unsem nicht 3d konfigurator“. Danach: „finde den besten sweetspot zwischen den
2 konfiguratoren und passe beide dann gleich an“.

**LED-Fehler.** `ledSpots()` bekam die Mitten ZWISCHEN den Sparren – die Spots
saßen mitten in der Verglasung, wo nichts sie halten könnte. Jetzt bekommt die
Funktion die Sparrenachsen und die Unterkante des Sparrenprofils. Der
Spotdurchmesser ist auf 56–68 mm gesetzt, damit er in ein 70-mm-Profil passt.

**Der gemeinsame Fragensatz.** Maßgeblich ist, was der Anfrage-Assistent
fragt – dort steht die gewachsene Produktlogik. Der 3D-Konfigurator hat
übernommen:

| Frage | vorher im 3D | jetzt |
|---|---|---|
| Seitliche Erweiterungen | „offen / Festverglasung / Schiebeelement“ | dieselben sechs Möglichkeiten wie im Assistenten (Keil, Rahmenwand, Schiebetür, Plankenwand, Senkrechtmarkise, Velaris), mehrere je Seite, mit denselben Regeln |
| Sonnenschutz | Aufdach / Unterdach | dazu Plissees, Sonnensegel, „Noch unsicher“ |
| LED | nur ja/nein | Set 6er/8er/12er, Anzahl der Sets, Lautsprecher mit 2er/4er-Set |
| Komfort (Lamellendach) | – | Heizstrahler, Wetter-Automatik |
| Hauswand | – | Rauputz / Verklinkert / weiß nicht – im Modell sichtbar |
| Untergrund | – | tragend / Punktfundamente / weiß nicht |
| Dachvorsprung (TDS) | – | Regler, wie im Assistenten |
| Farbe | vier Felder | dazu „Andere / Beratung“ |
| Montage | **fehlte** | wieder da |

Die Montage-Frage war beim Umbau auf das Vollbild-Layout aus dem Bedienfeld
gefallen – jeder Besucher hätte stillschweigend „mit Fachmontage“ angefragt.
Gefunden beim Abgleich der beiden Fragensätze.

**Was der Assistent übernommen hat.** „Ohne“ beim Sonnenschutz: Wer keine
Markise will, musste bisher „Noch unsicher – bitte beraten“ wählen und bekam
einen Rückruf zu etwas, das er gar nicht möchte. Dazu die vier
Polycarbonat-Ausführungen (siehe Eintrag davor).

**Zwei Abweichungen bleiben, bewusst.** Der 3D-Konfigurator kennt bei der
Eindeckung kein „Noch unsicher“ – das Modell muss immer etwas zeichnen. Und
Bodenbelag, Maßlinien, Ansichten und Tag/Abend gibt es nur im 3D; das sind
Darstellungsfragen, keine Produktfragen, und sie gehören nicht in die Anfrage.

**Abgesichert.** `scripts/pruefe-konfigurator.js` vergleicht jetzt Wert für
Wert, ob beide dasselbe fragen (Sonnenschutz, Untergrund, Fassade, Montage,
Aufbau und die sechs Erweiterungen). Die Gegenprobe lässt die Listen
absichtlich auseinanderlaufen und erkennt es – elf von elf eingebauten
Fehlern. Der Browsertest prüft dazu die Regeln: Schiebetür zieht den Keil
mit, Velaris sperrt die Senkrechtmarkise, und am Ende wird aus der
Zusammenfassung des Assistenten zurückgelesen, dass Erweiterungen, LED-Set,
Untergrund und Montage dort wirklich ankommen – 54 Prüfungen.

**Gegenzulesen.** Ob „Rahmenwand unten, Schiebetür darüber“ auch im Modell
richtig proportioniert ist (38 % der Höhe ist geschätzt), und ob die
Velaris-Lamellen senkrecht stehend richtig dargestellt sind.

## 10.10.2026 – Die Regeln beim Schließen der Seiten, nachgeprüft

**Anlass.** Rückfrage des Betreibers: „hast du die regeln beim verschließen
der seiten auch beachtet? wo keil notwendig is wo nicht etc“. Nachgesehen
statt behauptet – und dabei zwei Lücken gefunden.

**Was schon stimmte.** Velaris, Senkrechtmarkise und Schiebetür ziehen den
Keil mit und sperren ihn; Velaris verträgt sich nicht mit Senkrechtmarkise,
Schiebetür und Rahmenwand; an der Stirnseite gibt es keinen Keil; den Keil
gibt es nur dort, wo es ein Außengefälle gibt (Terrassendach TDS und
Carport TDS). Das war aus `js/anfrage-wizard.js` übernommen.

**Lücke 1: Der Keil überlebte den Produktwechsel.** Wer auf dem
Terrassendach TDS eine Schiebetür wählte (und damit den Keil bekam) und dann
auf das Flachdach SkyView wechselte, behielt den Keil in der Auswahl. SkyView
hat ein innenliegendes Gefälle, der Assistent kennt die Möglichkeit dort gar
nicht – und im Modell stand ein Dreieck, das niemand bestellt hatte. Der
Assistent löscht beim Produktwechsel die ganze Konfiguration (`resetConfig`);
hier wird nur das Unmögliche entfernt (`erwAufraeumen`), weil ein kompletter
Reset den Besucher seine Maße kosten würde. Dazu eine zweite Sicherung beim
Zeichnen: der Keil wird nur dort gezeichnet, wo er erlaubt ist.

**Lücke 2: Zwei Schreibweisen derselben Auswahl.** Der Assistent sortiert die
Erweiterungen (`erwToggle` nach `erwIndex`), der Konfigurator hängte sie in
Klickreihenfolge an. In der Anfrage stand „Schiebetür, Keil“, im Assistenten
„Keil, Schiebetür“ – dieselbe Auswahl, und niemand hätte gewusst, welche
gilt. Jetzt sortieren beide nach derselben Reihenfolge.

**Abgesichert – und zwar die Regeln selbst, nicht nur die Auswahl.**
`scripts/pruefe-konfigurator.js` vergleicht jetzt die drei Regeltabellen
zwischen Assistent und Konfigurator: welche Erweiterungen den Keil erzwingen,
welche sich gegenseitig ausschließen, und bei welchen Produkten es den Keil
überhaupt gibt. Die Gegenprobe verändert jede der drei einzeln und erkennt
alle – vierzehn von vierzehn eingebauten Fehlern. Der Browsertest prüft
zusätzlich das Verhalten: Keil wird mitgewählt, Stirnseite bietet keinen an,
Keil fällt beim Wechsel zum Flachdach weg, die Schiebetür bleibt stehen.
58 Prüfungen.

## 10.10.2026 – TDS nach den echten Profilen modelliert

**Anlass.** „jz arbeiten wir das modell tds nochmal besser aus das es fast wie
real aussieht“. Dazu vom Betreiber: zwei Querschnittszeichnungen (Regenrinne
und Dachsparren) und die VD-Montageanleitung als PDF.

**Was aus den Zeichnungen kommt (BELEGT).**

| Bauteil | Maß |
|---|---|
| Regenrinne 2 TD | 186,3 mm breit, 136,7 mm hoch, innen 130 × 82,2 mm |
| Dachsparren (Träger TD) | 61 mm breit, 120 mm hoch, davon 96,7 mm Hauptkörper, darüber der schmale Steg für die Eindeckung |
| Pfosten | 110 × 110 mm (deckt sich mit der Einzelteileliste) |

**Was aus der Montageanleitung kommt (BELEGT).**

* Sparrenraster: *(Dachbreite − 60 mm) ÷ Anzahl der Felder* = Abstand Mitte zu
  Mitte (S. 33). Damit liegen die äußeren Sparrenachsen 30 mm vom Rand – die
  bisherige Annahme „Randsparren außen bündig“ ist damit erledigt.
* Breite der Eindeckung = *Abstand zwischen den Trägern + 40 mm* (S. 9). Die
  Scheibe liegt also beidseitig 20 mm auf dem Sparren auf. Vorher war sie
  schmaler als der lichte Abstand und lag damit auf nichts.
* LED-Spots: Bohrungen **44 mm** in den Sparren (S. 17). Der Spot im Modell
  war mit 56–68 mm zu groß geraten.
* Pfostenmitte 55 mm hinter der Vorderkante (S. 25) – bestätigt die vorhandene
  Angabe, gilt jetzt auch in der geschätzten Zeichnung.
* Auf jedem Sparren sitzt nach dem Verlegen ein Abdeckprofil („Rundleiste“,
  außen „Seitenabdeckleiste“, S. 34/35). Dass es da ist, ist belegt; Breite und
  Höhe nicht – 50 × 12 mm halbrund sind GESCHÄTZT.

**Zwei Fehler, die dabei auffielen.**

1. **Die Rinne saß um ihre eigene Breite zu weit innen.** Vom Betreiber im Bild
   bemerkt. Ursache: Das Profil entsteht in der XY-Ebene und wird in z gezogen;
   bei einer Drehung um +90° wandert die Querschnittsbreite in −z, und die
   gerundete Vorderkante zeigt nach hinten. Mit −90° stimmt beides.
2. **Anthrazit sah aus wie Mittelgrau.** Der Renderer gibt in sRGB aus, rechnet
   aber linear, und three.js r128 wandelt Materialfarben nicht automatisch um.
   Jede Oberflächenfarbe läuft jetzt durch `rgb()` (sRGB → linear); gezeichnete
   Farbtexturen bekommen `encoding = sRGBEncoding`. Erst dadurch sieht RAL 7016
   aus wie RAL 7016.

**Weiter gebaut:** Umgebung für Spiegelungen (ein gezeichneter Verlauf, kein
HDRI von einem Fremdserver – kein neuer Drittanbieter), Pulverbeschichtung als
Lack statt als blankes Metall, Schattenauflösung 2048, Sparren enden an der
Rinnenrückwand und die Eindeckung reicht in die Kehle.

**Nur für TDS.** SkyView ist ein anderes System; dafür liegt keine Zeichnung
vor und die geschätzten Kästen bleiben stehen, im Code so benannt.

**Noch offen (weitere Querschnitte willkommen):** Wandanschlussprofil,
Pfostenfuß/U-Profil, Seitenglasleiste, Abdeckleiste. Die Maße stehen gebündelt
in `js/konfigurator-3d.js` in den Tabellen `RINNE` und `SPARREN` – eine neue
Zeichnung ist dort in wenigen Zeilen nachgetragen.

**Nicht geprüft:** Dieser Stand ist **nicht** durch den Browsertest gelaufen –
der Betreiber prüft selbst im Browser. Die statischen Prüfungen
(`pruefe-konfigurator.js` mit Gegenprobe, `pruefe-keine-preise.sh`,
`pruefe-cache-buster.sh`) sind bestanden.

## 2026-10-11 – Aufdachmarkise TDS Linea A / Linea AZ nach Herstellerzeichnung modelliert

**Anlass.** Der Betreiber hat die technische Zeichnung „TDS_Linea A - Linea AZ"
(Stand 01.07.2025) geschickt mit der Frage, ob sich das so im 3D-Modell
umsetzen lässt, und dann: „erst alle seiten, bilder, texte lesen analysieren"
und „baue dann die aufdachmarkise".

**Was falsch war.** Die Aufdachmarkise bestand aus zwei Boxen: einem flachen
Tuch über der Eindeckung und einem 130 × 130 mm Balken als „Kassette", beides
frei schwebend über dem Dach. Es gab keine Führungsschienen, keine Stützen,
keine Kassettenform – und bei eingefahrenem Tuch (Regler auf 0) wurde gar
nichts gezeichnet, ein Dach mit Markise sah also aus wie eines ohne. Die
Markise ist aber montiert, nicht ausgefahren.

**Was jetzt gilt.** `aufdachmarkise()` in `js/konfigurator-3d.js` baut die
Markise als eigene, um die Dachneigung gedrehte Gruppe über der Eindeckung.
Aus der Zeichnung BELEGT übernommen (Konstante `MARKISE`):

| Maß | Wert | Fundstelle in der Zeichnung |
|---|---|---|
| Bestellmaß Breite | = Dachbreite | Überschrift |
| Bestellmaß Tiefe | = Terrassendach-Tiefe | Unterschrift |
| Kassettenhöhe | 158 mm (Korpus 150) | Seitenansicht links |
| Führungsschiene | 87 mm hoch | Seitenansicht |
| Seitensparren | 61 mm breit | Vorderansicht unten |
| Außenkante → Befestigungsachse | 37 mm | Vorderansicht, rot |
| Stütze Dachfläche → Schienen-UK | 75 mm | Seitenansicht |
| Säule / Fußplatte / Plattendicke | 80 / 100 / 6 mm | Seitenansicht |
| erste Stütze hinter der Kassette | min. 345, max. 395 mm | Seitenansicht |
| letzte Stütze vor dem Ende | min. 150, max. 1000 mm | Seitenansicht |
| Stützen dazwischen | gleichmäßig („=") | Seitenansicht |

GESCHÄTZT bleibt nur die **Kassettentiefe** (~230 mm) – sie ist in der
Zeichnung nicht bemaßt und wurde über den Maßstab der bemaßten Teile
abgegriffen. Ebenso Tuchdicke und Tuchfarbe.

**Warum so und nicht anders.**
- *Eigene gedrehte Gruppe* statt Einzelteile mit Gefälle-Rechnung: Nur so
  bleiben Stützenhöhe (75 mm) und Schienenlage genau die Maße der Zeichnung.
  Sonst müsste jedes Teil einzeln mit `tan(neig)` verrechnet werden, und jeder
  Fehler darin fällt erst im Bild auf.
- *Kassette als ExtrudeGeometry* statt Box: Die Seitenansicht zeigt eine runde,
  tropfenförmige Kassette mit fast senkrechter Vorderseite, aus der das Tuch
  austritt. Eine Box sieht an dieser Stelle falsch aus, weil die Rundung
  genau das ist, was man vom Dach aus sieht.
- *Schienen auf den äußeren Sparren*: Die Sparrenachse liegt 30 mm vom Rand
  (Montageanleitung S. 33), die Schiene ist 61 mm breit – sie schließt damit
  außen bündig ab. Das deckt sich mit „Bestellmaß Breite = Dachbreite".
- *Hardware immer sichtbar*: siehe oben, Regler auf 0 heißt eingefahren,
  nicht abwesend.

**Verworfen.** Die 37 mm der Zeichnung als Schienenachse zu nehmen. Sie geben
die **Befestigungsachse** an, nicht die Schienenmitte; die Schiene selbst
sitzt auf dem Sparren. Hätte die Schienen 7 mm nach innen gerückt und außen
einen Spalt gelassen.

**Was gegengelesen werden soll.**
1. Sitzt die Kassette an der **Wand** (hinten) und fährt das Tuch nach vorne
   zur Rinne aus? So steht es in der Zeichnung (Kassette am Ende mit
   min. 345/395) und so ist es gebaut – bitte am Modell prüfen.
2. Stößt die Kassette bei flachen Dächern an das Wandprofil? Rechnerisch
   bleiben 4 mm Luft zwischen Kassettenunterkante und Eindeckung.
3. Kassettentiefe 230 mm – falls das Datenblatt eine andere Zahl nennt,
   gehört sie in `MARKISE.kasTiefe`.

**Prüfung.** `node scripts/pruefe-markise.js` – 15 Prüfungen, alle bestanden.
`node scripts/pruefe-markise.js --gegenprobe` – 15 von 15 schlagen an.

## 2026-10-11 – Aufdachmarkise endete vor der Rinne

**Was falsch war.** Der Betreiber mit Bild: „hört zu früh auf mus bis zur
rinne gehen". Schiene und Tuch endeten rund 19 cm vor der Rinne und hingen
in der Luft.

**Ursache.** `sonnenschutz()` bekam `dachTiefe` übergeben – das ist die Tiefe
bis zum SPARRENENDE, und die Sparren enden an der Rückwand der Rinne
(`T − RINNE.breite`, also 186,3 mm vor der Dachkante). Für Sparren und
Eindeckung stimmt das Maß; für die Markise nicht.

**Was jetzt gilt.** Die Markise bekommt die volle Tiefe `T`. Das deckt sich
mit der Herstellerzeichnung: „Bestellmaß Tiefe = Terrassendach Tiefe" – die
Markise läuft über die ganze Dachtiefe bis an die Rinne.

**Was gegengelesen werden soll.** Ob das vordere Schienenende optisch
richtig auf der Rinne aufsetzt oder noch darüber hinausragt. Die Schiene
liegt rechnerisch rund 5 cm über der Rinnenoberkante.

**Prüfung.** `scripts/pruefe-markise.js` hat dafür eine eigene Prüfung
(„Markise bekommt die volle Dachtiefe bis zur Rinne"); 16 Prüfungen, alle
bestanden, Gegenprobe 16 von 16.

## 2026-10-11 – Unterdachmarkise TDS Linea U / Linea UZ nach Herstellerzeichnung modelliert

**Anlass.** Der Betreiber hat die Zeichnung „TDS_Linea U - Linea UZ"
(Stand 01.07.2025) geschickt: „das is die unterdachmarkise auslesen" und
dann „bauen mergen".

**Was falsch war.** Die Unterdachmarkise war das, was die Aufdachmarkise vor
dem 11.10. auch war: ein flaches Tuch plus ein 130 × 130 mm Balken, unter
die Sparren gehängt. Kein Kasten, keine Kassette, keine Konsolen – und bei
eingefahrenem Tuch gar nichts.

**Was jetzt gilt.** `unterdachmarkise()` in `js/konfigurator-3d.js`, Maße in
der Konstante `MARKISE_U`. Aus der Zeichnung BELEGT:

| Maß | Wert |
|---|---|
| Bestellmaß Breite | Dachbreite − 142 mm |
| Bestellmaß Tiefe | Sparrenlänge − 45 mm (ausdrücklich „TDS:") |
| Kassette | 162 mm hoch, Korpus 150, Tiefe 238 (oben 227) |
| Kasten / Endkappe vorne | 80 mm hoch, Endkappe 41 mm |
| Konsole über Kastenoberkante | 19 mm |
| Luft zur Sparrenunterkante | 5 mm |
| Säule / Fußplatte | 80 / 100 mm |
| Sparren-Innenkante → Markisenkante | 10 mm |
| Markisenkante → Befestigungsachse | 37 mm |
| erste Konsole hinter der Kassette | min. 345 / max. 395 mm |
| letzte Konsole vor dem Ende | min. 150 / max. 1000 mm |

**Der Unterschied zur Aufdachmarkise ist nicht kosmetisch.** Linea A läuft
über die VOLLE Dachbreite und -tiefe und steht auf 75 mm hohen Stützen AUF
der Eindeckung. Linea U sitzt ZWISCHEN den äußeren Sparren und hängt mit
19 mm hohen Konsolen DARUNTER. Deshalb bekommt `sonnenschutz()` jetzt zwei
Bezugsflächen übergeben: `dach.ok(z)` (Oberkante Eindeckung) und
`dach.uk(z)` plus `dach.sparrenL` (Unterkante und Länge der Sparren).

**Ein Gegenbeleg, der sich gelohnt hat.** Die 142 mm bestätigen unser
Sparrenraster auf einem zweiten, unabhängigen Weg: Sparrenachse 30 mm vom
Rand (Montageanleitung S. 33) plus halbe Sparrenbreite 30,5 mm ergibt die
Innenkante bei 60,5 mm, also ein Innenmaß von B − 121 mm; abzüglich zweimal
10 mm Luft bleibt B − 141 mm. Die Zeichnung sagt 142. Die Prüfung
„Linea U – 142 mm decken sich mit dem Sparrenraster" rechnet das jedes Mal
nach.

**GESCHÄTZT.** Die Breite der seitlichen Führungsschienen (60 mm – in dieser
Zeichnung nicht bemaßt) und die Frage, WO die 45 mm Tiefenabzug sitzen;
im Modell je zur Hälfte vorne und hinten.

**Widerspruch in der Zeichnung, GEGENZULESEN.** Von der Sparren-Innenkante
bis zur Befestigungsachse wären es 10 + 37 = 47 mm, bemaßt sind 60 mm.
Vermutlich meinen die 60 mm die Außenkante der Konsole, nicht die Achse.
Fürs Modell ohne Folgen (13 mm), für ein Aufmaß nicht.

**Was gegengelesen werden soll.**
1. Hängt der Kasten sichtbar unter den Sparren und nicht in ihnen?
2. Sitzt die Kassette hinten an der Wand, Tuch nach vorne?
3. Steht der Kasten seitlich weit genug von den Sparren ab (10 mm Luft)?

**Prüfung.** `node scripts/pruefe-markise.js` – jetzt 33 Prüfungen für beide
Markisen, alle bestanden; Gegenprobe 33 von 33.

## 2026-10-11 – Markisen warfen keinen Schatten, SkyView-Regel fehlte, Fototexturen

Drei Punkte aus einer Rückmeldungsrunde des Betreibers, zusammen umgesetzt.

### 1. „die markisen machen iwi keinen schatten in der überdachung"

**Zwei Ursachen, eine davon ein klarer Fehler.**

- Der **Unterdachmarkise fehlte `castShadow` komplett.** Das Tuch hing
  unter dem Dach und warf nichts – obwohl Schatten spenden sein einziger
  Zweck ist. Dasselbe galt für die Plissee-Falten.
- Beide Tücher waren **3 mm dick**. Im Schattenpuffer entspricht
  `shadow.bias = −0,0004` bei `far = 2200` rund 9 mm Tiefe; ein Körper,
  der dünner ist als die eigene Tiefenkorrektur, verliert den Schatten.
  Die Tücher sind jetzt 14 mm dick – was für ein Tuch mit Saum und
  Wickelwelle ohnehin realistischer ist.

**GEGENZULESEN:** Ob der Schatten jetzt sichtbar ist. Die Dicke ist die
wahrscheinliche, nicht die bewiesene Ursache – geprüft werden konnte das
ohne Browser nicht.

### 2. „bei sky view is keine aufdachmarkise möglich"

Der Betreiber ergänzte: „solltest du aber eig. wisen aus unserem nicht 3d
konfigurator". **Das stimmt nicht – die Regel stand dort auch nicht.**
Der Anfrage-Assistent hat die Aufdachmarkise beim Flachdach SkyView
genauso angeboten wie der 3D-Konfigurator. Die Lücke war an beiden
Stellen und ist jetzt an beiden Stellen geschlossen:

- 3D: `MARKISE_NICHT` sperrt den Knopf und setzt eine bereits getroffene
  Wahl auf „Ohne" zurück, wenn jemand von TDS auf SkyView wechselt.
- Assistent: `markise.render` baut die Karte gar nicht erst und löscht
  eine vorher getroffene Wahl.

**Begründung:** Die Aufdachmarkise wird auf die äußeren Sparren der
geneigten Dachfläche geschraubt. SkyView hat kein Außengefälle und eine
umlaufende hohe Blende, über die Kassette und Schienen hinausstünden.

`scripts/pruefe-markise.js` prüft beide Stellen.

### 3. Fotorealistische Texturen für Boden, Wiese und Hauswand

Wunsch des Betreibers: „besser auflösende texturen ... ohne lizenz ...
ohne wasserzeichen". Umgesetzt mit **CC0-Material von ambientCG**
(Public Domain, keine Namensnennung nötig, keine Wasserzeichen, geprüft
am 11.10.2026).

Einzelheiten – welche Datei aus welchem Material, Größen, Maßstab,
Umwandlungsbefehle – in **`docs/texturen.md`**. Hier nur das Wesentliche:

- Die Dateien liegen **im Projekt** unter `images/textur/`, nicht auf
  einem fremden Server. Kein neuer Drittanbieter, kein neuer Eintrag in
  der Datenschutzerklärung.
- Rund **1,0 MB** für sechs Materialien (Farbe 1024², Normalmap 512²,
  WebP), geladen nur auf `konfigurator.html`.
- Das **gezeichnete Canvas-Muster von vorher ist nicht entfernt worden**.
  Es ist der Notnagel, wenn eine Datei fehlt oder der Browser kein WebP
  kann. Ein Konfigurator ohne Boden wäre schlimmer als einer mit einem
  groben Muster.

**Verworfen:** Texturen zur Laufzeit von einem fremden CDN zu laden. Das
hätte Gewicht aus dem Projekt genommen, aber einen Drittanbieter in den
Ladepfad und in die Datenschutzerklärung gebracht – für ein Hintergrund-
bild ist das ein schlechter Tausch.

**Was gegengelesen werden soll.** Der Maßstab: `TEXTUR_KACHEL` sagt, wie
breit eine Kachel in Wirklichkeit ist, und diese Zahlen sind nach
Augenmaß geschätzt. Wirken die Platten zu groß oder zu klein, ist das die
Stellschraube.

## 2026-10-11 – Stoffauswahl, Terrassentür, Senkrechtmarkise, kürzerer Hinweistext

### Stoffauswahl in beiden Konfiguratoren

Der Betreiber hat die Stoffkarte geschickt mit dem Hinweis: „es is wichtig
die bauarten zu unterscheiden da es nicht alle stoffarten für alle
markisenarten gibt."

**Was war.** `stoffe.html` listet seit je alle 97 Stoffe korrekt getrennt.
Die **Konfiguratoren fragten den Stoff gar nicht ab** – der Assistent sagte
nur „den Farbwunsch klären wir persönlich", das 3D-Modell zeichnete jedes
Tuch in demselben Beige.

**Was jetzt gilt.** Beide Konfiguratoren haben eine Stoffauswahl, strikt
nach Bauart getrennt. Die Liste steht **einmal** in
`js/markisenstoffe.js`; Regel, Eigenschaften und Bildpfade in
`docs/markisenstoffe.md`. Das Tuch im 3D-Modell bekommt das echte Muster.

**Eine Korrektur, die der Betreiber angebracht hat:** Ich hatte Konfektion
A/B als Außen- und Innenseite desselben Tuchs gelesen. Falsch – es sind
**zwei Muster, der Kunde wählt eins**. Die Datenstruktur hängt daran:
jeder EZIP-Stoff ist zwei wählbare Einträge, nicht einer.

**Verworfen:** `optionCards` wie bei den übrigen Schritten. 97 große
Karten mit Foto sind unbedienbar. Stattdessen ein Musterraster nach
Farbfamilie, Bilder verzögert geladen.

**Offen und in `docs/markisenstoffe.md` ausführlich beschrieben:** Die
EZIP-Stoffbilder liegen als **CMYK ohne Farbprofil** vor. Jede Umrechnung
nach sRGB ist eine Schätzung, und die Farben weichen sichtbar ab – auch
auf `stoffe.html`, wo dieselben Dateien direkt eingebunden sind.
Abgesichert ist das derzeit nur durch den Hinweistext. **Der saubere Weg
wäre, die Bilder beim Lieferanten als sRGB anzufordern.**

### Terrassentür an der Hauswand

Wunsch des Betreibers: „vllt. noch so ne terassentür/balkontür einfach als
bild nix 3d modelieren das macht den ganzen konfigurator langsamer."

Genau so gebaut: **eine Fläche aus zwei Dreiecken** mit einer auf Canvas
gezeichneten Tür (Blendrahmen, zwei Flügel, Glasverlauf, Griffe). Eine
echte Tür wären schnell 60 Flächen – und sie würde nichts zeigen, was das
Bild nicht auch zeigt. Maße 180 × 220 cm sind GESCHÄTZT; es geht um den
Maßstabsvergleich, nicht um ein Bauteil. Sichtbar nur bei Wandmontage.

### Senkrechtmarkise bekommt einen Aufbau

Bisher war sie ein Rechteck, das in der Luft hing. Jetzt: Kassette oben,
Führungsschienen an beiden Seiten, Ausfallprofil am unteren Tuchende – so
wie im Produktfoto der Stoffkarte (VD EZIP 105 / 125).

**Kassette 10,5 cm ist aus dem Produktnamen abgeleitet** (EZIP 105 →
105 mm, EZIP 125 → 125 mm). Das ist eine ANNAHME; eine Maßzeichnung zur
EZIP liegt uns nicht vor. Schienen (50 mm) und Ausfallprofil sind
GESCHÄTZT. **GEGENZULESEN**, und falls es eine EZIP-Zeichnung gibt, gehört
sie hier hin – so wie bei Linea A und Linea U.

### Hinweistext im Konfigurator gekürzt

Vorher nannte der Fußtext Herstellerunterlagen, geschätzte
Profilquerschnitte und Fertigungszeichnungen. Auf Wunsch des Betreibers
jetzt kurz und ohne Herstellerbezug:

> Die Darstellung dient nur der Orientierung und bildet Farben, Materialien
> und Details nicht verbindlich ab. Maßgeblich ist unser Angebot nach dem
> kostenlosen Aufmaß vor Ort.

Das deckt zugleich die Farbabweichung der Stoffbilder ab.

**Prüfung.** `node scripts/pruefe-stoffe.js` – 12 Prüfungen, alle
bestanden; Gegenprobe 12 von 12.

## 2026-10-11 – Senkrechtmarkise nach Montageanleitung, Spalte zu Pfosten und Wand

### Senkrechtmarkise VD eZIP 105 / 125

Der Betreiber hat die Montageanleitung geschickt. Damit ist die Annahme
vom selben Tag („Kassette 105 mm aus dem Produktnamen abgeleitet")
**bestätigt und zugleich präzisiert**:

| Angabe | Quelle |
|---|---|
| Serie **Z-R**: halbrunde Kassette, Ø 105 oder 125 mm | Anleitung S. 5 |
| Serie **Z-E**: quaderförmige Kassette, Kantenlänge 105 oder 125 mm | S. 5 |
| Ab **400 cm** Markisenbreite zusätzliche Kastenunterstützung | S. 5 |
| Z-R105 max. 4000 mm breit, **Z-R125 max. 5000 mm** | S. 26 |
| Aufbau: Kassette, Fallstange, je Seite Einzelführungsschiene aus Rückteil, Z-Schiene und Vorderteil, hinten Schienenblende | Abb. 2, S. 5 |

Die **Kassette ist jetzt halbrund** gezeichnet (Serie Z-R), nicht mehr
eckig. **GEGENZULESEN:** In unseren Unterlagen steht nirgends, welche der
beiden Serien wir verkaufen. Umstellen auf die eckige Z-E ist eine Zeile:
`KASSETTE_RUND`.

**Schienenquerschnitt:** Abb. 3 (S. 13) ist mit 10,7 / 18,9 / 19,9 mm
bemaßt – das sind die **Bohrkanäle**, nicht die Außenmaße. Die Außenmaße
(rund 48 × 41 mm) sind über diesen Maßstab aus der Zeichnung
**abgegriffen**: kein gedrucktes Maß, aber auch nicht geraten.

**Neu im Bedienfeld:** Ist eine Seite mit Senkrechtmarkise breiter als
5 m, steht das als Hinweis beim Stoff. Breiter gibt es sie nicht am
Stück – das gehört in die Anfrage und nicht erst ins Angebot.

### Zwei Spalte, die der Betreiber im Bild gefunden hat

**„die markise und keil haben lücke zum pfosten die müssen bündig sein"**
Die Seitenelemente endeten an der Dachkante. Die liegt 186 mm hinter der
Rinnenvorderkante, der Pfosten steht mittig unter der Rinne – dazwischen
blieben **38 mm Luft**. Jetzt enden sie an der hinteren Pfostenfläche.
Über dem Stück dazwischen liegt die Rinne, das Element hängt dort also
nicht frei.

Damit ist die Begründung von vorher überholt („Maßgeblich ist die
Dachkante"). Der Kommentar im Code sagt das ausdrücklich, damit es
niemand zurückbaut.

**„die senkrechtmarkisen haben spalt zur wand, das muss auch bündig
sein"** Die Elemente begannen bei `z = PROFIL`, ließen also 11 cm Luft
zur Hauswand. Jetzt beginnen sie bei `z = 0`. Freistehend steht dort der
hintere Pfosten, dessen Rückseite ebenfalls bei 0 liegt – derselbe Wert
passt für beide Fälle.

**Prüfung.** `scripts/pruefe-markise.js` – 43 Prüfungen, alle bestanden;
Gegenprobe 43 von 43. Beide Spalte haben eine eigene Prüfung, damit sie
nicht zurückkommen.

## 2026-10-11 – Markise im Bild anklickbar

**Wunsch des Betreibers.** „wenn man die markise anklickt egal ob aufdah,
unterdach oder senkrecht, soll diese öffnen/schließen".

**Was jetzt gilt.** Jedes Markisenteil trägt `userData.sonne`. Beim Klick
geht ein Strahl durch das Bild; am Treffer wird nach oben durch die Eltern
gelaufen, damit auch ein Teil zählt, das in einer Gruppe steckt (Auf- und
Unterdachmarkise sind Gruppen). Getroffen zählt nur das **vorderste**
Teil – sonst würde ein Klick auf den Pfosten die Markise hinter ihm
bedienen.

Die Markise fährt **weich** aus oder ein (650 ms), statt zu springen. Das
Ausfahren ist die Bewegung, um die es geht; ein Sprung zeigt sie nicht.
Der Rechenaufwand entspricht dem Ziehen am Regler.

**Klick oder Drehen?** Wer die Kamera dreht, bewegt den Zeiger. Erst unter
6 Pixel Weg und unter einer halben Sekunde gilt es als Klick. Ohne diese
Unterscheidung würde jede Drehbewegung die Markise umschalten.

Im Bedienfeld steht jetzt ein Satz dazu – eine Klickfläche, von der
niemand weiß, gibt es praktisch nicht.
