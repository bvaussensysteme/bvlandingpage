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

## 2026-10-11 – 3D-Konfigurator fragt Schritt für Schritt ab

**Anlass.** Der Betreiber: „jetzt ist es kompliziert. du musst dir
vorstellen da sitzt nen 60 jähriger ahnungsloser opa am pc oder handy.
der konfigurator muss für jeden leihen einfach bedienbar sein" – und auf
Nachfrage: „quasi genauso wie jetzt schon im nicht 3d konfigurator".

**Was war.** Acht aufklappbare Abschnitte mit 38 Bedieneinheiten, alle
gleichzeitig sichtbar. Wer weiß, was er sucht, findet alles. Wer nicht
weiß, was eine Eindeckung oder ein Keil ist, sieht eine Wand aus
Fachbegriffen.

**Was jetzt gilt.** Dieselbe Reihenfolge wie im Anfrage-Assistenten:
eine Frage nach der anderen, Weiter und Zurück, Fortschrittsbalken.
Elf Schritte von „Was möchten Sie bauen?" bis „Fertig".

**Warum so und nicht anders – der wichtigste Punkt:** Die Bedienelemente
wurden **nicht neu gebaut**. Jede Gruppe trägt `data-k3d-schritt` und
gehört damit zu genau einem Schritt; gesteuert wird nur, welche gerade
sichtbar ist. Dadurch

- bleibt „Alles auf einen Blick" ohne Zusatzaufwand möglich (ein Schalter
  oben rechts – gedacht für den Betreiber selbst beim Kundentermin),
- gibt es **keine zweite Stelle**, an der dieselbe Einstellung lebt und
  auseinanderlaufen könnte,
- gelten alle bestehenden Sichtbarkeitsregeln (`gruppeGilt`) unverändert
  weiter.

**Leere Schritte werden übersprungen.** Beim Carport gibt es keine
Seitenelemente, beim Terrassendach keine Verkleidung. Ohne das
Überspringen stünde man vor einer leeren Seite. Der Fortschritt zählt
deshalb nur Schritte, die es in dieser Konfiguration wirklich gibt –
„Schritt 7 von 11" wäre gelogen, wenn vier übersprungen werden.

**Selten Gebrauchtes liegt hinter „Mehr Einstellungen":** Dachneigung,
Dachvorsprung, Dachüberstand, Lamellenstellung, Schiebe-Regler,
Ausfahrgrad, Bodenbelag, Maßanzeige. Acht von 38 Gruppen.

### Der Fall, der das ausgelöst hat

Der Betreiber: „ich hatte z.b auch schon fälle da hat einer nur links
schiebetüren ausgewählt und später gefragt ob es rundherum is."

Die Knöpfe zeigen, was man ANKLICKEN kann – nicht, was am Ende steht.
Zwei Stellen sagen es jetzt in Worten:

1. **Im Bedienfeld** eine Klartextzeile: „So steht es gerade: links:
   Schiebetür. Offen bleiben: rechts und vorne."
2. **In der Anfrage-Mail** werden jetzt **alle drei Seiten genannt**,
   auch die offenen (`links: Schiebetür · rechts: offen · vorne: offen`).
   Vorher standen dort nur die geschlossenen – damit war auch für uns
   nicht festgehalten, ob eine Seite offen bleiben SOLL oder nur
   vergessen wurde.

**Laiensprache im Bedienfeld, Fachbegriffe in der Anfrage** (Vorgabe des
Betreibers). Die gespeicherten Werte sind unverändert technisch
(`Aufdachmarkise`, `Keil`, `VSG 8 mm`); vereinfacht wurden nur
Schritttitel und Erklärsätze. Die Mail ist für den Betrieb, nicht für den
Kunden.

**Prüfung.** `node scripts/pruefe-fuehrung.js` – 9 Prüfungen, alle
bestanden; Gegenprobe 9 von 9. Sie fängt vor allem den Fall ab, dass eine
neue Bedieneinheit ohne `data-k3d-schritt` eingebaut wird: die wäre im
geführten Modus unsichtbar, und es würde niemandem auffallen.

## 2026-10-11 – Bedienfeld wächst mit der Bildschirmbreite

**Anlass.** Der Betreiber mit zwei Bildschirmfotos: „man kann diesen
einstellungsbereich ja noch etwas verbreitern halt ausgeglichen das man
3d noch gut sieht aber auch vernünftig konfigurieren kann, so im goldenen
schnitt goldene mitte."

**Was falsch war.** Das Bedienfeld war fest 352 px breit. Auf dem
Bildschirmfoto sieht man die Folge: „Streifenfundament" bricht mitten im
Wort ab, „Punktfundament" ebenso – und daneben stehen auf einem 1900 px
breiten Bildschirm 1500 px Rasen.

**Was jetzt gilt.** `--k3d-sl-breite: clamp(360px, 30vw, 520px)`.

| Bildschirm | Bedienfeld | Anteil |
|---|---|---|
| 1900 px | 520 px | 27 % |
| 1600 px | 480 px | 30 % |
| 1280 px | 384 px | 30 % |
| 1100 px | 360 px | 33 % |

**Warum nicht der echte goldene Schnitt.** 38 % von 1900 px wären 722 px –
so breit wird eine Spalte aus Knöpfen unruhig, und das Modell verliert
genau die Fläche, wegen der es da ist. Ein knappes Viertel bis Drittel ist
die Mitte, die der Betreiber meint: genug Platz für zweizeilige
Beschriftungen, das Modell bleibt die Hauptsache.

Dazu `overflow-wrap: break-word; hyphens: auto` auf den Knöpfen – damit
ein langes Wort umbricht statt abgeschnitten zu werden, auch wenn jemand
später einen längeren Text einträgt.

Die zugeklappte Stellung rechnet jetzt mit derselben Variablen
(`margin-left: calc(var(--k3d-sl-breite) * -1)`); vorher standen die
352 px an zwei Stellen und wären beim nächsten Mal auseinandergelaufen.

**Prüfung.** `scripts/pruefe-fuehrung.js` – 10 Prüfungen, Gegenprobe
10 von 10. Eine davon schlägt an, wenn jemand wieder eine feste Breite
einträgt.

## 2026-10-11 – Dachneigung unter der Durchgangshöhe, Höhe an der Wand wird ausgerechnet

**Anlass.** Der Betreiber mit zwei Seiten aus der Montageanleitung: „wenn
man die durchgngshöhe eingibt dadrunter muss man auch neigung des daches
in grad einstellen können dann wird auch dadrunter die höhe an der wand
angezeigt also ausgerechnet."

**Was war.** Die Dachneigung lag zwei Schritte weiter hinten im Schritt
„Dach", zusätzlich versteckt hinter „Mehr Einstellungen". Die Höhe an der
Wand wurde nirgends gezeigt – weder im Bedienfeld noch in der Anfrage.

**Was jetzt gilt.** Die Neigung steht direkt unter der Durchgangshöhe,
nicht mehr versteckt. Die Darstellung hat der Betreiber vorgegeben:
„2 kleine felder nebeneinander links stellt man grad ein rechts werden
die % angezeigt und dadrunter wieder ein feld mit der höhe an der wand."

- **Links** ein Zahlenfeld für die Grad (mit Regler darunter, wie bei
  Breite, Tiefe und Höhe – dieselbe Bedienung an allen Maßen).
- **Rechts** das Gefälle in Prozent, nur zum Ablesen. Das ist die
  Übersetzung in die Sprache der Montageanleitung: 8° = 14 %.
- **Darunter** über die ganze Breite die Höhe an der Wand, z. B.
  **2420 mm**, mit der Rechnung in einer Zeile darunter: „2000 mm
  Durchgang + 420 mm Anstieg auf 3,00 m Tiefe."


Dieselbe Zahl steht jetzt auch in der Anfrage-Mail („Höhe an der Wand
(UK Wandprofil)"), zusammen mit Grad und Prozent.

**Gerechnet wird mit der Tabelle der Anleitung, nicht mit dem Tangens.**
Der Unterschied ist klein, aber er ist da: tan 8° = 14,05 %, die Tabelle
sagt 14 %. Auf 3 m Tiefe sind das 422 statt 420 mm – und 420 mm steht im
Rechenbeispiel der Anleitung. Wer die Zahl im Konfigurator mit der
Anleitung vergleicht, soll dieselbe sehen. (Bei 2° weicht die Tabelle mit
3,4 statt 3,5 % sogar etwas mehr ab; auch dort gilt die Tabelle, weil
danach gebaut wird.)

**Warum das zählt.** Nach dieser Zahl wird an der Wand angerissen. Wer
sie selbst ausrechnen muss, rechnet sie irgendwann falsch – und ein um
4 cm falsch gesetztes Wandprofil merkt man erst, wenn das Dach liegt.

**Gegengerechnet.** `scripts/pruefe-fuehrung.js` prüft die Tabelle gegen
die Anleitung auf einem zweiten Weg: die vier Werte der Skizze (140, 280,
420, 560 mm bei 1 bis 4 m) und das Rechenbeispiel (200 cm innen, 3 m
Ausfall → 242 cm). Alle fünf stimmen. 18 Prüfungen, Gegenprobe 18 von 18.

## 2026-10-11 – Hinweis auf den Testbetrieb im 3D-Konfigurator

**Anlass.** Der Betreiber: „kannst du wenn man auf den 3d konfigurator
geht so ein pop up bauen … das der 3d konfigurator noch im bau ist und
getestet wird und somit noch fehler sein könten bevor das jemand für
fertige version hält".

**Was jetzt gilt.** Beim Öffnen erscheint einmal ein Hinweis: Der
Konfigurator wird gebaut und getestet, die Darstellung kann noch
abweichen, verbindlich ist das Angebot nach dem Aufmaß. Dazu die Bitte
um Rückmeldung, wenn etwas auffällt.

**Die Entscheidungen dahinter:**

- **Einmal je Browser-Sitzung**, nicht bei jedem Aufruf (`sessionStorage`,
  nicht `localStorage`). Wer zwischen Website und Konfigurator hin- und
  herspringt, soll nicht jedes Mal wegklicken. Beim nächsten Besuch kommt
  er wieder – solange er stimmt, soll er auch gesehen werden.
- **Erst nach dem Cookie-Hinweis.** Zwei Dialoge übereinander sind keiner.
  Gewartet wird auf das Verschwinden von `cb-visible`, höchstens
  20 Sekunden – lieber einmal übereinander als gar nicht.
- **Ohne JavaScript kein Dialog.** Das Markup startet mit `hidden`;
  eingeblendet wird nur per Skript. Sonst stünde bei abgeschaltetem
  JavaScript ein nicht schließbarer Kasten über der Seite.
- **Schlägt `sessionStorage` fehl** (privates Fenster, gesperrte Daten),
  wird der Hinweis gezeigt. Das ist die sichere Richtung.
- Bedienbar mit Escape und Klick daneben, Fokus springt auf den Knopf und
  danach dorthin zurück, wo er war.

**Rechtlich.** Der Hinweis ersetzt den Vorbehalt im Fußtext nicht, er
verstärkt ihn: Im Dialog steht ausdrücklich, dass das Angebot nach dem
Aufmaß verbindlich ist und nicht das Bild auf dem Bildschirm.

**Wenn der Konfigurator fertig ist:** Den Block `k3dTestHinweis` aus
`konfigurator.html` und die zugehörige Funktion aus
`js/konfigurator-3d.js` entfernen. Die Prüfungen in
`scripts/pruefe-fuehrung.js` dann ebenfalls.

**Prüfung.** 25 Prüfungen, alle bestanden; Gegenprobe 25 von 25.

## 2026-10-11 – Rinnen-Seitendeckel als flache Platte mit Schräge

**Anlass.** Der Betreiber hat das Teilebild geschickt: „so sehen die
seitendeckel für die rinne aus bei tds" – und nachgeschoben: „die
niedrigere seite is die vorderseite".

**Was war.** Der Seitendeckel war die SILHOUETTE des Rinnenprofils,
4 mm dick extrudiert. Er folgte also jeder Rundung der Rinne.

**Was jetzt gilt.** Eine **flache Platte mit geraden Kanten und einer
abgeschrägten Ecke** – so sieht das Teil aus. Die Schräge sitzt an der
**Vorderkante oben**, damit die Vorderseite die niedrigere ist.

**Das Maß und seine Lage – entschieden vom Betreiber.** Das Teilebild
nennt **172 × 175 mm**. Unsere Rinne ist nach der Querschnittszeichnung
**186,3 mm breit und 136,7 mm hoch**; der Deckel ist also in der einen
Richtung schmaler, in der anderen höher als die Öffnung. Auf die Frage,
wie er dann sitzen soll: „gleich den deckel mittig aus huptsache vorne is
bündig."

Also: **echtes Maß 172 × 175 mm**, **vorne bündig** mit der
Rinnenvorderkante, **in der Höhe mittig**. Hinten bleiben rund 14 mm der
Öffnung frei, oben und unten steht der Deckel je rund 19 mm über. Das ist
so gewollt und nicht übersehen – die Vorderkante ist das, was man sieht.

Warum das trotzdem notiert bleibt: Der Widerspruch im Maß selbst ist
damit nicht erklärt, nur umgangen. Falls sich klärt, worauf sich die
172 × 175 beziehen, gehört das in `RINNENDECKEL`.

## 2026-10-11 – Glasleiste war zu klein

**Anlass.** Der Betreiber mit dem Teilebild „Glasleiste TD": „die hast du
bissl zu klein modelliert".

**Was falsch war.** 50 × 12 mm, GESCHÄTZT – so stand es auch im
Kommentar. Das Teilebild nennt **55,3 × 22,6 mm**. Vor allem die **Höhe
war nur halb so groß**, und das sieht man: Die Glasleiste ist das, was
man auf dem Dach zwischen den Scheiben überhaupt erkennt.

**Was jetzt gilt.** `GLASLEISTE = { breite: 5.53, hoehe: 2.26 }`, aus dem
Teilebild BELEGT. Der Halbzylinder wird daraus gerechnet: Radius ist die
halbe Breite, die Stauchung in y ergibt die Höhe.

**Was das zeigt.** Von den geschätzten Maßen im Modell war dieses das
sichtbarste – und es war um den Faktor zwei daneben. Die übrigen
GESCHÄTZT-Stellen stehen in `docs/NEXT_TASK.md`; wenn dazu Teilebilder
greifbar sind, lohnt derselbe Abgleich.

**Prüfung.** `scripts/pruefe-markise.js` prüft beide Maße gegen das
Teilebild. 46 Prüfungen, Gegenprobe 46 von 46.

## 2026-10-11 – Sparrenzahl der geschätzten Skizze war deutlich zu niedrig

**Anlass.** Der Betreiber mit Bildschirmfoto: „hier ist ein fehler, bei
vsg glas 8mm, wären es bei breite 6000mm und tiefe 3000mm, 3pfoten und
9 sparren". Im Bild standen 6 Sparren.

**Was falsch war.** Die geschätzte Skizze rechnete `Breite / 110 cm`.
Bei 6 m Breite kamen damit 6 Sparren heraus, also **120 cm Achsabstand** –
ein Maß, das es mit VSG 8 mm überhaupt nicht gibt.

**Was belegt ist.** `daten/technische-daten.md`, Abschnitt 3: Der
Achsabstand liegt bei **VSG 8 mm zwischen 680 und 770 mm** (max.
Scheibenbreite 720 mm), bei **Polycarbonat zwischen 1016 und 1080 mm**
(Stegplattenbreite). Daraus folgt die kleinste Sparrenzahl, deren
Achsabstand das Höchstmaß nicht reißt.

**Gegengerechnet.** Die Regel trifft alle sieben Zeilen der
Beispieltabelle „TDS · Glas" derselben Quelle – und zusätzlich die Angabe
des Betreibers:

| Breite | belegt | Regel | Achsabstand |
|---:|---:|---:|---:|
| 1080 | 3 | 3 | 540 mm |
| 1500 | 3 | 3 | 750 mm |
| 2080 | 4 | 4 | 693 mm |
| 2200 | 4 | 4 | 733 mm |
| 3080 | 5 | 5 | 770 mm |
| 3700 | 6 | 6 | 740 mm |
| 4080 | 7 | 7 | 680 mm |
| **6000** | **9** (Betreiber) | **9** | **750 mm** |

`scripts/pruefe-konfigurator.js` rechnet alle acht Zeilen bei jedem Lauf
nach und prüft zusätzlich, dass der Achsabstand im Band 680–770 mm
landet. Die Gegenprobe verfälscht das Höchstmaß und erwartet, dass es
auffällt.

**Die Pfosten waren schon richtig:** 3 ab 5 m Breite, das deckt sich mit
der Regel aus `daten/technische-daten.md` Abschnitt 4 („bis 4500 mm zwei
Pfosten, ab 4500 mm ein dritter") und mit der Angabe des Betreibers.

**Das bleibt eine Schätzung.** Die echte Matrix springt unregelmäßig
(siehe Kopf von `js/bauteile.js`). Sie liegt bewusst nicht in diesem
Repository und kommt über `/api/bauteile`.

### Die eigentliche Ursache: `/api/bauteile` antwortet 503

Die Schnittstelle liefert **derzeit immer 503**, weil der KV-Namensraum
**`DACHMATRIX` in `wrangler.jsonc` nicht gebunden** ist. Deshalb läuft
jedes Produkt über den Schätzpfad – nicht nur bei diesem einen Maß.

**Solange das so bleibt, sind alle Stückzahlen im Konfigurator
geschätzt.** Die Schätzung ist jetzt belegbar gut, aber sie ist nicht die
Preisliste. Das Binden des Namensraums ist der eine Schritt, der aus
geschätzten Zahlen verbindliche macht.

## 2026-10-11 – Maßtabelle öffentlich: echte Stückzahlen statt Schätzung

**Anlass.** Nach dem Bericht zur 503-Schnittstelle hat der Betreiber die
„Maßtabelle Terrassenüberdachungen – BV AussenSysteme" (Stand 11.10.2026)
geschickt: „hier alle daten die dürfen öffentlich".

**Was das löst.** Der Konfigurator hat alle Stückzahlen geschätzt, weil
`/api/bauteile` immer 503 antwortet (KV-Namensraum `DACHMATRIX` nicht
gebunden). Jetzt stehen **echte Zahlen im öffentlichen Repo**:
`js/masstabelle.js`, 4,2 KB.

**Reihenfolge der Quellen im Konfigurator:**

1. `/api/bauteile` – die vollständige Herstellermatrix, sobald gebunden
2. **die Maßtabelle** – deckt TDS, SkyView und Flat Line vollständig ab
3. `sparrenGeschaetzt()` – nur noch Notnagel (Pergola, Breiten außerhalb)

**Verdichtung – über alle 1316 Datensätze nachgerechnet, null Abweichungen:**

- Sparren und Stützfüße hängen **nur von der Breite** ab, nie von der Tiefe
- Pfosten ohne Unterzug = Stützfüße + (Tiefe > 4500 ? 1 : 0)
- Pfosten mit Unterzug = Stützfüße + (Tiefe > 7000 ? 1 : 0)
- Unterzug nötig ab Tiefe > 4500, lieferbar bis 7000, Innenkern nur bei 4600

Deshalb speichert die Datei nur `Breite → [Sparren, Stützfüße]` plus die
lieferbaren Tiefen. Aus 1316 Zeilen werden 100 Einträge.

**Gegengerechnet gegen die private Herstellermatrix.** Die liegt in der
Arbeitsumgebung (korrekt per `.gitignore` ausgeschlossen, nie committet).
Verglichen wurden **alle 1316 Kombinationen: 1316 von 1316 Sparrenzahlen
identisch.** Die öffentliche Tabelle ist also nicht „ungefähr richtig",
sondern deckungsgleich.

**Breiten zwischen zwei Tabellenwerten** gehen auf die nächste
**lieferbare Breite nach oben** – so wird auch bestellt. 6000 mm ist keine
lieferbare Breite; gerechnet wird mit 6080 mm, und das ergibt die 9 Sparren
und 3 Pfosten, die der Betreiber genannt hat.

**Was das für den KV-Speicher bedeutet.** Das Binden von `DACHMATRIX` ist
damit **kein Blocker mehr**, nur noch eine Verbesserung: Die Matrix im
KV-Speicher enthält mehr als diese Tabelle (alle Tiefen- und
Montagevarianten in voller Breite). Die Tabelle deckt aber genau das ab,
was der Konfigurator zeigt.

**Zur Freigabe.** Dass diese Daten öffentlich sein dürfen, hat der
Betriebsinhaber entschieden; die Tabelle trägt den Vermerk
„QUELLE=VD-Preislisten_geprueft PREISE=keine". Preise enthält sie keine –
`scripts/pruefe-keine-preise.sh` läuft durch. Die vollständige
Herstellermatrix bleibt weiterhin draußen.

**Prüfung.** `node scripts/pruefe-masstabelle.js` – 15 Prüfungen, alle
bestanden; Gegenprobe 15 von 15. Sie fängt vor allem den Fall ab, dass
eine neue Preisliste die Verdichtung ungültig macht (Sparrenzahl hinge
dann auch von der Tiefe ab) – das wäre sonst still falsch.

## 2026-10-11 – Maßgrenzen aus der Tabelle, Statikträger unter der Rinne, Maßhinweis

### Die Grenzen waren zu eng – und zwar deutlich

Der Betreiber: „laut tds maßtabelle sind das aber nicht die maximalmaße
wieso begrenzt du es so". Die Antwort ist unbequem: Die Werte standen
**fest im Code** und stammten aus der Zeit vor der Maßtabelle. Sie waren
eine ANNAHME, keine Grenze des Systems.

| | vorher (fest) | jetzt (aus der Tabelle) |
|---|---|---|
| TDS Breite | 2500–7000 mm | **1080–14080 mm** |
| TDS Tiefe | 2000–4500 mm | **550–6550 mm** |
| SkyView Breite | 2500–7000 mm | **1000–14000 mm** |
| SkyView Tiefe | 2000–4500 mm | **500–7000 mm** |

Wer 9 m Breite brauchte, konnte sie **nicht einmal eingeben** – obwohl
sie lieferbar ist. Das ist nicht nur eine Darstellungsfrage: Eine Anfrage,
die gar nicht erst gestellt werden kann, kommt auch nicht an.

`reglerGrenzenSetzen()` nimmt die Grenzen jetzt aus der Maßtabelle, wenn
die Schnittstelle nichts liefert – derselbe Weg wie bei den Stückzahlen.
Die TDS-Tiefe endet bei 6550 mm, weil die Tabelle zwar 7050 mm führt, sie
aber als nicht lieferbar markiert.

### Statikträger sitzt jetzt unter der Rinne

Vorgabe des Betreibers: „beachte nur bei den nötigen maßen den
statikträger unter der dachrinne, die maße vom statikträger stehen ja im
pdf". BELEGT aus der Maßtabelle: **189 × 117 mm, Länge = volle
Dachbreite**, nötig ab Tiefe > 4500 mm.

Er sitzt **unter der Rinne und auf den Pfosten**. Daraus folgt eine
Entscheidung, die man sehen muss: **Die eingestellte Durchgangshöhe bleibt
das, was man darunter hat** – Rinne und Dachfläche rücken um die
Trägerhöhe nach oben, statt den Durchgang um 189 mm zu verkleinern. Wer
2,30 m einstellt, hat auch unter dem Träger 2,30 m.

**ANNAHME, GEGENZULESEN:** Die Tabelle nennt nur „189x117". Ich lese 189
als Höhe und 117 als Tiefe – andersherum wäre der Träger flacher als
breit, was für einen tragenden Unterzug wenig Sinn ergibt.

Seitenelemente und Sonnenschutz rechnen mit `hRinne` statt `hVorn`, sonst
bliebe bei angehobener Dachfläche oben ein Spalt.

### Maßhinweis im Bedienfeld

Unter Breite und Tiefe steht jetzt, was daraus folgt – drei Dinge, die der
Kunde sonst erst im Angebot erfährt:

1. **nach welcher lieferbaren Breite gerechnet wird** (sein Maß liegt fast
   immer dazwischen) und wie viele Sparren und Pfosten das ergibt,
2. dass ab 4,5 m Tiefe ein **Statikträger** dazukommt – mit dem Hinweis,
   dass die Durchgangshöhe dabei bleibt,
3. dass über 7 m Tiefe **nichts mehr geht**.

**Prüfung.** `scripts/pruefe-masstabelle.js` – 20 Prüfungen, alle
bestanden; Gegenprobe 20 von 20.

## 2026-10-11 – Dachvorsprung wirkte nicht, Statikträger hat zwei Lagen

**Was falsch war.** Der Betreiber: „der schieberegler für den
dachüberstand funktioniert nicht". Er hatte recht, und zwar grundlegend:
`Z.vorsprung` wurde gelesen, in der Zusammenfassung angezeigt und in die
Anfrage geschrieben – **aber nirgends in der Geometrie verwendet**. Am
Modell bewegte sich nichts, egal wohin man den Regler zog.

Das ist die unangenehmste Sorte Fehler: Der Wert kam korrekt beim Betrieb
an, nur das Bild log. Wer am Regler zog und nichts sah, musste annehmen,
der Vorsprung sei egal.

**Was der Vorsprung bedeutet** (Betreiber): „bei dachüberstand wandern die
pfosten ja nach innen um die ausgewählten mm und da kommt auch der
statikträger ins spiel, da ist er nicht unter der rinne wäre ja
unlogisch, sondern über den pfosten unter den sparren."

**Daraus folgen zwei Lagen für denselben Träger:**

| | Pfosten | Träger | Durchgang darunter |
|---|---|---|---|
| **ohne Vorsprung** | unter der Rinne | zwischen Pfostenkopf und Rinne | 189 mm niedriger |
| **mit Vorsprung** | um das Maß nach innen | über den Pfosten, unter den Sparren | rund 189 mm niedriger |

**Korrektur vom selben Tag.** Hier stand zuerst, ohne Vorsprung rücke die
Rinne um die Trägerhöhe nach oben und die Durchgangshöhe bleibe. Der
Betreiber: „rinne rückt nicht hoch", „geht technisch nicht", „auch da wird
die durchgangshöhe um 189mm niedriger". Er hat recht – die Rinne sitzt am
Dach, nicht auf einem Stapel. Sie lässt sich nicht anheben; was sich
ändert, ist die Pfostenlänge.

Im Code ist das jetzt **eine** Rechnung für beide Lagen: `traegerOk` ist
ohne Vorsprung die Rinnenunterkante, mit Vorsprung die Sparrenunterkante
an der Pfostenachse; der Pfosten endet jeweils eine Trägerhöhe darunter.

**Im Bedienfeld steht die Zahl.** Wer 2300 mm einstellt und einen Träger
bekommt, liest: „Unter dem Träger bleiben 2111 mm statt der eingestellten
2300 mm." Ohne diesen Satz plant jemand mit 2,30 m und steht vor 2,11 m.

Die Begründung für die zweite Lage ist die des Betreibers und sie trägt:
Mit Vorsprung kragt die Rinne über die Pfosten hinaus. Ein Träger unter
der Rinne trüge dort nichts.

Im Code ergibt sich die Trägerhöhe deshalb aus der **Pfostenlage**, nicht
aus einer zweiten Regel: `hPfosten + traegerH / 2`. Ohne Vorsprung ist
das „unter der Rinne", mit Vorsprung „unter den Sparren" – eine Formel,
zwei Bilder.

**Wann der Träger kommt:** wenn die Maßtabelle ihn verlangt (Tiefe über
4500 mm) **oder** wenn ein Vorsprung eingestellt ist.

**Voreinstellung geklärt (Betreiber, 11.10.2026): 0.** Der Regler stand
auf 300 mm – damit hätte jedes Terrassendach TDS einen Statikträger
bekommen, auch das kleinste. Der Vorsprung ist eine **Option, nicht die
Normalausführung**. Im Bedienfeld steht jetzt ein Satz dazu, was er
bewirkt: Pfosten rücken nach innen, Statikträger kommt dazu.

**Prüfung.** `scripts/pruefe-masstabelle.js` – 22 Prüfungen, alle
bestanden; Gegenprobe 22 von 22. Drei davon sichern genau diesen Fehler
ab: dass der Vorsprung die Pfosten bewegt, dass der Träger über den
Pfosten sitzt und dass er auch ohne Tiefenregel kommt.

## 2026-10-11 – Anzeige des Dachvorsprungs blieb auf 0 stehen

**Anlass.** Der Betreiber nach dem Einbau: „jetzt klappt es allerdings
bleibt die anzeige immer bei 0 mm stehen aber in 3d passiert die
änderung".

**Was falsch war.** `k3dVorsprung` stand in **keiner** der beiden Listen,
die in `aendern()` die Reglerausgabe und das Zahlenfeld nachführen. Das
Modell reagierte korrekt, nur die Anzeige log – und das Zahlenfeld
daneben war wirkungslos.

Das ist dieselbe Fehlerart wie die vorherige, nur umgekehrt: Vorher stand
der Wert richtig im Bedienfeld und falsch im Modell, jetzt richtig im
Modell und falsch im Bedienfeld. Beide Male geht nichts kaputt, es
stimmt nur nicht.

**Was jetzt gilt.** `k3dVorsprung` steht in beiden Listen.

**Und die Prüfung ist allgemein, nicht auf diesen einen Regler gemünzt.**
`scripts/pruefe-fuehrung.js` liest alle `k3d-range`-Regler aus dem HTML
und prüft für **jeden**, ob eine vorhandene `…Wert`-Ausgabe im Code
nachgeführt und ein vorhandenes `…Zahl`-Feld gekoppelt wird. Aktuell
neun Regler, alle vollständig. Wer den nächsten einbaut und das Verdrahten
vergisst, bekommt es beim nächsten Lauf gesagt.

**Prüfung.** 27 Prüfungen, alle bestanden; Gegenprobe 27 von 27.

## 2026-10-11 – Freistehend: Statikträger trägt das Wandprofil

**Vorgabe des Betreibers.** „bei der freistehenden methode, kommt das
wandprofil anstatt an die wand an den statikträger, und die pfosten sind
unter dem statiträger ganz normal wie sie es jetzt schon bei
dachüberstand sind."

**Was war.** Freistehend wurde hinten nur ein etwas dickerer Balken
gezeichnet, und die hinteren Pfosten liefen bis auf die volle Höhe
`hHinten` durch. Ein Statikträger kam dort nicht vor – obwohl ohne Wand
genau er die Last trägt.

**Was jetzt gilt.** Hinten gibt es dieselben drei Lagen wie vorne mit
Dachvorsprung:

1. **Sparren** oben
2. **Statikträger** 189 × 117 mm über die volle Breite, Oberkante an der
   Sparrenunterkante
3. **Pfosten** darunter

Das **Wandprofil verschwindet nicht** – es hängt an der Vorderseite des
Trägers, auf gleicher Höhe. Es bekommt nur einen anderen Halt.

**Dieselbe Rechnung wie vorne.** `ukHinten` ist die Sparrenunterkante an
der hinteren Pfostenachse; Trägeroberkante liegt dort, der Pfosten endet
eine Trägerhöhe darunter. Kein Sonderfall, keine zweite Regel – an beiden
Enden dieselbe Logik.

Bei 6 × 3 m und 2300 mm vorne ergibt das hinten: Sparrenunterkante
2688 mm, Träger von 2499 bis 2688 mm, hintere Pfosten 2499 mm. Hinten ist
also mehr Luft als vorne, weil das Dach ansteigt.

**Prüfung.** `scripts/pruefe-masstabelle.js` – 28 Prüfungen, alle
bestanden; Gegenprobe 28 von 28. Drei davon betreffen die freistehende
Ausführung.

## 2026-10-11 – Unter einem Statikträger gilt die 7-m-Regel für die Pfosten

**Vorgabe des Betreibers.** „unter einem statikträger gilt nicht mehr die
4000mm regel mit 3, 4, 5 pfosten etc, sondern da greift die 7000mm regel
also alle 7000mm 3,4,5 pfosten."

**Was das ändert.** Ohne Träger kommen die Stützfüße aus der Maßtabelle;
dort springt die Zahl bei 4500, 8080 und 10080 mm – also grob alle 4 m.
Trägt ein Statikträger die Last über die volle Breite, braucht es
weniger Pfosten: erst alle 7 m einen mehr.

| Breite | ohne Träger | mit Träger |
|---:|---:|---:|
| 3000 mm | 2 | 2 |
| 4500 mm | 3 | **2** |
| 7000 mm | 3 | **2** |
| 7001 mm | 3 | 3 |
| 8080 mm | 4 | **3** |
| 10080 mm | 5 | **3** |
| 14080 mm | 5 | **4** |

**Nicht zu verwechseln mit der Tiefenregel.** Die sagt „ab 4500 mm Tiefe
ein dritter Pfosten, mit Unterzug erst ab 7000 mm" und steckt getrennt in
`tabelleBauteile()`. Die hier ist die **Breiten**regel. Beide nennen die
Zahl 7000, meinen aber verschiedene Richtungen – deshalb stehen sie an
verschiedenen Stellen und der Kommentar sagt es an beiden ausdrücklich.

**Wann der Träger da ist:** Tiefe über 4500 mm, Dachvorsprung eingestellt,
oder freistehend.

**Auch der Maßhinweis rechnet mit derselben Regel.** Er nennt sonst eine
andere Pfostenzahl als das Modell daneben zeichnet – ein Widerspruch, den
der Kunde sieht und wir nicht.

**Prüfung.** `scripts/pruefe-masstabelle.js` – 35 Prüfungen, alle
bestanden; Gegenprobe 35 von 35. Die Regel wird im Prüfskript noch einmal
aufgeschrieben und gegen die Umsetzung gerechnet, an fünf Stützstellen.

## 2026-10-11 – 7-m-Regel gilt je Pfostenreihe, nicht je Bauwerk

**Anlass:** Betreiber nach dem ersten Einbau der 7-m-Regel: „und das gilt
immer nur für die seite wo der sttikträger ist, ist er auf beiden seiten
z.b bei freistehend und dachvorsprung dann gilts für beide seiten".

**Was falsch war:** Die Regel hing an einer gemeinsamen Variablen
(`hatTraeger = traegerH > 0 || frei`). Sobald irgendwo ein Statikträger
lag, wurden *beide* Reihen nach der 7-m-Regel gezeichnet. Konkret bei
8080 mm Breite, 3000 mm Tiefe, freistehend, ohne Dachvorsprung: vorne
liegt dort kein Träger, also gelten die 4 Stützfüße aus der Maßtabelle –
gezeichnet wurden aber 3 nach der 7-m-Regel.

**Was jetzt gilt:** Die Pfostenzahl wird für jede Reihe einzeln bestimmt.
Vorne greift die 7-m-Regel nur, wenn dort wirklich ein Träger liegt
(Tiefe über 4500 mm oder Dachvorsprung); sonst zählt die Maßtabelle.
Hinten gibt es eine Reihe nur freistehend, und dort liegt immer ein
Träger – also dort immer die 7-m-Regel. Liegt auf beiden Seiten einer
(freistehend *und* Dachvorsprung), kommen beide Reihen auf dieselbe Zahl,
aber aus zwei getrennten Rechnungen.

**Warum so:** Der Träger ist das tragende Teil, nicht das Bauwerk. Welche
Stützweite gilt, entscheidet sich an dem Balken, der über den Pfosten
liegt – und der kann vorne da sein und hinten fehlen oder umgekehrt.

**Verworfen:** Beide Reihen gleich zu zählen („der höhere Wert gewinnt")
wäre einfacher gewesen, hätte aber genau den Fall oben falsch gezeichnet
und bei der Anfrage-Mail eine Stückzahl genannt, die TDS nicht so baut.

**Der Maßhinweis** nennt die Reihen jetzt getrennt, wenn sie sich
unterscheiden: „9 Sparren und 4 Pfosten vorne und 3 hinten".

**Gegenzulesen:** Bei freistehend ohne Dachvorsprung und unter 4,5 m
Tiefe stehen vorne mehr Pfosten als hinten – bitte am Modell prüfen, ob
das der TDS-Praxis entspricht. Prüfung: `node scripts/pruefe-masstabelle.js`
(43 Prüfungen, Gegenprobe 43/43).

## 2026-10-11 – Statikträger steht an der Stelle der Wand, nicht unter den Sparren

**Anlass:** Betreiber am Bildschirmfoto eines freistehenden TDS: „der
statikträger is immer hochkant nicht wagrecht wie hier und er ist nicht
unter den sparren sondern hinter den sparren" und dann die Auflösung:
„quasi du machst es 1:1 als wäre der statikträger die wand, wandprofil
ist am statikträger festgeschraubt … bei freistehend".

**Was falsch war:** Ich hatte den Träger waagerecht unter die Sparren
gelegt und das Wandprofil davorgehängt – an der Rückseite entstand damit
eine dreilagige Konstruktion, die es so nicht gibt. Die Vorlage dafür war
meine eigene Auslegung des früheren Satzes „das wandprofil kommt anstatt
an die wand an den statikträger": Ich hatte „an den Träger" als „unter den
Träger gehängt" gelesen, gemeint war „auf den Träger geschraubt".

**Was jetzt gilt:** Freistehend ändert an allem vor dem Wandprofil nichts.
Das Wandprofil sitzt auf derselben Höhe, in derselben Tiefe (90 mm) und an
derselben Stelle wie bei Wandmontage. Dahinter – dort, wo sonst die Mauer
steht, also bei negativem z – steht der Statikträger hochkant,
189 mm hoch und 117 mm tief, mit der Oberkante bündig zum Wandprofil. Die
hinteren Pfosten stehen unter dem Träger, nicht mehr unter dem Dach.

**Folge für die Durchgangshöhe:** Hinten liegt die Unterkante des Trägers
49 mm unter der Oberkante des Wandprofils. Die früher genannten 189 mm
betrafen den VORDEREN Träger beim Dachvorsprung – dort gilt sie weiter.

**Mitgezogen:** Der Keil endet hinten jetzt in beiden Fällen bündig bei
z = 0. Die Ausnahme „freistehend bis an den hinteren Pfosten" stammte aus
der Zeit, als dieser Pfosten noch unter dem Dach stand.

**Auch im Datenpfad korrigiert:** Dort ersetzte `e.freistehend` das
Wandprofil durch den Träger. Das Profil bleibt jetzt, der Träger kommt
dahinter. Der Pfad ist zurzeit inaktiv (die Schnittstelle antwortet 503),
würde sonst aber denselben Fehler zeigen.

**Gegenzulesen:** Ob die Oberkante des Trägers wirklich bündig mit der
Oberkante des Wandprofils liegt oder das Profil mittig auf dem Träger
sitzt – beides ist schraubbar, ich habe bündig gewählt. Prüfung:
`node scripts/pruefe-masstabelle.js` (48 Prüfungen, Gegenprobe 48/48).

## 2026-10-11 – Freistehend zählt der Statikträger zur Tiefe

**Anlass:** „und bei freistehend das tiefe maß is immer inkl.
statikträger, bei wandmontage ja nicht" (Betreiber, 11.10.2026).

**Was falsch war:** Nachdem der Träger an die Stelle der Wand gerückt war,
hing er HINTER dem bisherigen Dach – die Anlage wurde dadurch 117 mm
tiefer als bestellt. Bei 4000 mm Bestellmaß standen 4117 mm im Bild.

**Was jetzt gilt:** An der Wand misst die Tiefe ab der Mauerflucht, das
Wandprofil liegt innerhalb. Freistehend tritt der Träger an die Stelle der
Mauer und zählt mit – das Dach wird also um 117 mm kürzer, statt dass der
Träger hinten angebaut wird. Der Nullpunkt bleibt die Rückseite des
Trägers bzw. die Mauerflucht. Die Maßlinie im Bild beginnt freistehend
entsprechend an der Trägerrückseite, nicht an der Dachkante.

**Warum das zählt:** Das Tiefenmaß ist das Bestellmaß. Würde die Zeichnung
117 mm mehr zeigen als die Anfrage-Mail nennt, stünde beim Aufmaß ein
anderes Dach als im Konfigurator – und zwar zu Lasten der Marge, weil die
Mehrtiefe niemand berechnet hat.

**Auch im Datenpfad:** dieselbe Regel, dort mit dem Trägermaß aus der
Matrix statt der festen 117 mm.

**Gegenzulesen:** Ob die Rinne bei freistehend wirklich 117 mm weiter
hinten steht als bei gleicher Bestelltiefe an der Wand – das ist die
sichtbare Folge und sollte im Bild stimmen. Prüfung:
`node scripts/pruefe-masstabelle.js` (52 Prüfungen, Gegenprobe 52/52);
eine davon rechnet Dach + Träger zurück auf das Bestellmaß.

## 2026-10-11 – VSG 10 mm und getöntes Glas im 3D-Konfigurator

**Anlass:** „bei vsg glas hast du vergessen die 10mm variante
hinzuzufügen und gls gibts auch in getönt also graphit" (Betreiber).

**Was falsch war:** Der 3D-Konfigurator kannte nur VSG klar und VSG opal
und rechnete fest mit 8 mm Scheibendicke. Der **Anfrage-Assistent fragt
die Glasstärke längst ab** (js/anfrage-wizard.js, Schritt „verglasung",
Werte „8 mm" / „10 mm") – der 3D-Konfigurator hat dieses Feld nie
übergeben. Wer dort konfigurierte, landete im Assistenten vor einer
leeren Pflichtauswahl.

**Was jetzt gilt:** Eigenes Feld „Glasstärke" (8 / 10 mm), das nur bei
Glas erscheint. Die Scheibe im Modell wird entsprechend dick. Dazu die
dritte Glasvariante „Glas graphit". Die Anfrage-Mail bekommt die
Fachbezeichnung mit Stärke, etwa „VSG 10 mm klar", und zusätzlich das
Feld `glasstaerke`, das der Assistent erwartet.

**Im Assistenten nachgezogen:** „VSG-Glas Graphit (getönt)" fehlte dort
als Auswahl. Gefunden hat das `scripts/pruefe-konfigurator.js` – die
Prüfung vergleicht die Vorgabewerte des 3D-Konfigurators gegen die
Auswahlmöglichkeiten des Assistenten und meldete: „ist im
Anfrage-Assistenten keine Auswahlmöglichkeit". Genau dafür ist sie da.

**Bewusst NICHT geändert – wichtig:** Der Sparrenabstand bleibt auch bei
10 mm das Band für **VSG 8 mm** (680–770 mm). Für 10 mm liegt keine
Herstellerangabe vor. Dickeres Glas trägt weiter, also wären WENIGER
Sparren möglich – die Zeichnung zeigt damit eher zu viele. Das ist die
sichere Richtung: zu wenige Sparren wären Glasbruch, zu viele nur ein zu
hoher Preis in der Anfrage. Steht als Hinweis unter dem Feld.

**Offen beim Betreiber:**
1. Sparrenabstand für VSG 10 mm bei TDS erfragen – sonst rechnen wir
   dauerhaft zu teuer.
2. Gibt es getöntes Glas in beiden Stärken, und gibt es VSG 10 auch opal?
   Zurzeit sind alle sechs Kombinationen wählbar – ANNAHME.
3. Lichtdurchlässigkeit von getöntem VSG; Farbe und Deckkraft im Modell
   sind GESCHÄTZT, angelehnt an graphitfarbenes Polycarbonat.

## 2026-10-11 – Glas-Schiebeanlage SG23: echte Bauarten statt Faustregel

**Anlass:** Der Betreiber hat die SG23-Unterlage (Stand 01.08.2026)
bereitgestellt: „du kannst hiervon die maße und skizzen für die
glasschiebeelemente nehmen, nur bitte die preise nirgendwo übernehmen
oder sichtbar machen".

**Preise:** Übernommen sind ausschließlich Maße und Bauarten. Im
Quelltext steht keine Zahl aus den Preistabellen; die PDF selbst liegt
nicht im Repo. `scripts/pruefe-keine-preise.sh` prüft die Seite weiterhin,
zusätzlich sucht `scripts/pruefe-masstabelle.js` gezielt nach vier Beträgen
aus dieser Liste.

**Was falsch war:** Die Flügelzahl kam aus „Breite / 150 cm, gerundet"
(GESCHÄTZT). Bei 3500 mm ergab das 2 Flügel à 1750 mm – so breit baut der
Hersteller keinen einzigen Flügel. Die breiteste Scheibe der Unterlage
misst 1500 mm (2-türig bei 3000 mm Anlagenbreite).

**Was jetzt gilt:** Acht Bauarten aus Schienen- und Flügelzahl mit je
eigenem Breitenbereich, von 3 Schienen / 2 Flügeln (1500–3000 mm) bis
4 Schienen / 8 Flügel (3000–7000 mm). Überlappen sich mehrere, gewinnt
die mit den WENIGSTEN Flügeln: breitere Scheiben, weniger Profile im
Blick, und das ist die Bauart, die der Kunde meint, wenn er nichts
weiter sagt. Eine Prüfung rechnet alle Breiten von 1500 bis 7000 mm durch
und belegt, dass keine Scheibe über 1500 mm herauskommt.

**Scheibendicke:** 10 mm ESG (unisoliertes Kaltelement), vorher 14 mm
geschätzt.

**Neuer Hinweis im Bedienfeld:** Die Anlage ist im Freien bis **2450 mm**
hoch lieferbar (Windlast; innen 2600 mm). Die Durchgangshöhe im
Konfigurator geht bis 2700 mm. Wer 2700 einstellt und Schiebetüren wählt,
bekam bisher ein Bild, das so nicht baubar ist – und eine Anfrage, auf die
VD mit „geht nicht" antwortet, nachdem der Kunde sich entschieden hat.
Dasselbe für Breiten außerhalb 1500–7000 mm.

**Noch nicht eingebaut, bewusst:** Die Unterlage nennt drei Glasarten
(ESG klar, Satinato, Grau) und die Rechnung in 500-mm-Schritten. Beides
ist eine Produktentscheidung, keine Zeichenfrage – siehe Rückfrage unten.

**Auswahlregel – nach Optik, nicht nach Flügelzahl:** „der konfigurator
soll immer das am besten passendste für das maß was der kunde auswählt
nehmen. was von der optik am besten aussieht" (Betreiber). Entschieden
wird deshalb nach der SCHEIBENBREITE: Zielwert 1050 mm, also etwa
Terrassentürbreite. Damit liegt jede lieferbare Anlagenbreite zwischen
750 und 1250 mm Scheibenbreite. Bei Gleichstand (4000 mm: 3-rails-4-türig
und 4-rails-4-türig ergeben beide 1000 mm) gewinnt die Variante mit
weniger Schienen – schmalere Bodenschiene, weniger Stolperkante.

Verworfen: „die wenigsten Flügel". Das hätte bei 3000 mm zwei Scheiben à
1500 mm ergeben – schwer und plump. Der Zielwert 1050 mm ist die eine
Zahl, an der man dreht, wenn im Verkauf eine andere Aufteilung üblich
ist; er ist eine gestalterische Festlegung, KEINE Herstellerangabe.

**Handauswahl:** „system machts automatisch, aber bei erweiterte
einstellungen kann man es selbst wählen" (Betreiber). Unter „Mehr
Einstellungen" steht ein Feld „Aufteilung der Schiebeanlage"; es listet
nur Bauarten, die es in diesem Maß wirklich gibt, mit der jeweiligen
Scheibenbreite. Voreinstellung bleibt Automatik. Ändert sich das Maß so,
dass die gewählte Bauart nicht mehr lieferbar ist, springt das Feld
zurück auf Automatik – sonst zeigte es etwas anderes als das Modell.
Links/rechts laufen über die Tiefe, vorne über die Breite: passt die
Handauswahl zu einer Seite nicht, gilt dort wieder die Automatik.

**In der Anfrage-Mail** steht ab jetzt je geschlossener Seite die Bauart
im Fachjargon, etwa „Schiebeanlage links: SG23, 3-rails, 4-türig, 10 mm
ESG, Scheiben je ca. 1000 mm (Vorschlag, Aufteilung nach Aufmaß)".
Begründung des Betreibers: „man kann es später mim kunden eh nochmal
besprechen und ändern" – besprechen kann man aber nur, was dasteht.

**Gegenzulesen:**
1. Soll der Kunde die Glasart der Schiebeanlage wählen (klar / Satinato /
   Grau)? Dann gehört sie auch in den Anfrage-Assistenten.
2. Zielwert 1050 mm Scheibenbreite – passt das zu dem, was im Verkauf
   üblich ist?
3. Querschnitte von Bodenschiene (55 × 60 mm) und Wandanschlussprofil
   (50 × 25 mm) sind weiterhin GESCHÄTZT; die Unterlage zeigt die
   Ansichtsskizzen, aber keine Profilschnitte.

## 2026-10-11 – Statikträger stand über das Dach hinaus

**Anlass:** „und bei freistehend is der statikträger immernoch waagrecht
und nicht hochkat", dann die Auflösung: „er darf nicht höher sein als die
sparren bzw. wandprofil".

**Was falsch war – und warum es nicht zu sehen war:** Der Träger WAR
hochkant gezeichnet (189 hoch × 117 tief). Nachgerechnet bei
5000 × 3000 mm, 8°, Durchgangshöhe 2300:

| Bauteil | Oberkante |
|---|---|
| Sparren hinten | 279,3 cm |
| Wandprofil | 284,5 cm |
| Statikträger | 284,5 cm |

Träger **und** Wandprofil standen 52 mm über das Dach hinaus. Von außen
sah das aus wie ein Balken, der oben auf dem Dach liegt – daher
„waagrecht". Der Querschnitt stimmte, die Höhenlage nicht.

**Die Ursache** war eine Formel, die an `hHinten` hing, also an der
Durchgangshöhe hinten. Die hat mit der Dachoberkante nichts zu tun:
dazwischen liegt das Gefälle über die ganze Tiefe, bei 3 m und 8° sind
das 42 cm. Dass beide Werte in der Nähe lagen, war Zufall der
Voreinstellungen.

**Was jetzt gilt:** Wandprofil und Träger hängen an der
SPARRENOBERKANTE hinten, Oberkante bündig, nie darüber. Das gilt in
beiden Montagearten – an der Wand stand das Profil genauso über, nur
fiel es dort weniger auf.

**Absicherung:** Die Prüfung rechnet die Lagen selbst nach, statt nur den
Quelltext zu lesen, und prüft zusätzlich, dass die ALTE Formel
übergestanden hätte (sie meldet 5,2 cm zu hoch). Ohne diesen zweiten Teil
hätte die Prüfung nur bestätigt, was ich gerade geschrieben habe.

## 2026-10-11 – Statikträger unter der Rinne auf Kundenwunsch

**Anlass:** „in den erweiterten einstellungen sol es auch ne möglichkeit
geben einen statikträger unter die rinne zu setzen ohne dachvorsprung
einfach wenn ein kunde z.b 2 pfosten anstatt 3 nur möchte mit den
jeweiligen hinweis das halt die durchgangshöhe an dieser stelle niedriger
wird".

Häkchen unter „Mehr Einstellungen". Unter dem Träger greift die
7-m-Regel statt der Stützfußspalte: bei 8080 mm Breite drei Pfosten statt
vier. Bezahlt wird das mit 189 mm Durchgangshöhe – das steht neben dem
Häkchen, im Maßhinweis und in der Anfrage-Mail. Das Häkchen erscheint
nur, wenn nicht ohnehin schon ein Träger nötig ist; ein Schalter, der
nichts ändert, verwirrt mehr als er hilft.

## 2026-10-11 – Aufteilung der Schiebeanlage je Seite

**Anlass:** „aufteilung der schiebeanlage soll pro seite sein, also für
links,rechts und vorne".

**Was falsch gedacht war:** Ein gemeinsames Feld für alle drei Seiten.
Links und rechts laufen über die TIEFE, vorne über die BREITE – zwei
verschiedene Maße, zu denen oft gar nicht dieselbe Bauart passt. Bei
6000 × 3000 mm gibt es vorne acht Bauarten zur Auswahl und an den Seiten
nur drei.

**Was jetzt gilt:** Drei Felder unter „Mehr Einstellungen", jedes mit den
Bauarten, die es im Maß DIESER Seite wirklich gibt. Offene Seiten
blenden ihr Feld aus. Voreinstellung bleibt überall Automatik.

**Gegenzulesen:** Ob die Auswahl im Bild sofort umschlägt, wenn man an
einer Seite eine andere Bauart wählt – und ob das Feld bei einer
Maßänderung korrekt auf „Automatisch" zurückspringt, wenn die gewählte
Bauart nicht mehr lieferbar ist.

## 2026-10-11 – Schiebeanlage anklicken, Maßschilder filigraner

**Schiebeanlage anklicken:** „wie bei den markisen, die jeweilige
schiebeanlage die man im 3dmodell anklickt geht auf oder zu". Umgesetzt
mit derselben Mechanik wie bei der Markise (Raycast, weiches Fahren über
650 ms). Jede Scheibe und jeder Flügelrahmen trägt die Seite, zu der er
gehört – erkannt wird also am getroffenen TEIL, nicht an der
Klickposition. Sonst öffnete sich eine Seite mit, nur weil sie zufällig
dahinter liegt.

Dafür hat jede Seite jetzt einen eigenen Öffnungsstand. Der Regler
„geöffnet" bleibt und setzt beim Ziehen alle drei gleich – er ist damit
genau das, was er vorher war. Liegt eine Markise vor dem Glas, hat sie
Vorrang; sonst würden beide auf denselben Klick reagieren.

**Maßschilder:** „die maßangaben etwas kleiner filigraner machen das es
nicht so stört" (mit Bildschirmfoto). Vorher fette 40-px-Schrift auf
einem zu 86 % deckenden schwarzen Kasten – im Bild etwa 40 % so hoch wie
das ganze Seitenelement. Jetzt normale Schrift, abgerundeter Kasten mit
62 % Deckkraft, Maßlinie halbtransparent, und die Sprite-Höhe von 24 auf
14 Welteinheiten. Die Leinwand bleibt bei 40 px Schriftgröße, damit der
Text beim Heranzoomen scharf bleibt – verkleinert wird erst beim
Anzeigen.

**Gegenzulesen:** Ob die Schilder jetzt auf dem Handy noch lesbar sind.
Kleiner geht erfahrungsgemäß schnell zu weit; 14 ist ein erster Wert,
`SCHILD_HOCH` in js/konfigurator-3d.js ist die eine Stelle dafür.

## 2026-10-11 – Türschwelle und Schiebetürführung mit echten Maßen

**Anlass:** Der Betreiber hat die SG23-Profilschnitte geschickt:
„Türschwelle sind die laufschienen unten, schiebetürführung ist das was
oben ist wo die tür drin läuft, bitte neu modellieren maße anpassen".

**Was falsch war:** Unten stand eine von mir erfundene „Bodenschiene"
mit 55 × 60 mm, und **oben war gar nichts** – die Flügel hingen an einer
dekorativen Rahmenkante in der Luft. Dass sie oben in einer Führung
laufen, hatte ich schlicht nicht modelliert.

**Was jetzt gilt – BELEGT durch die Profilschnitte:**

| Profil | Höhe | 3 Gleise | 4 Gleise | 5 Gleise |
|---|---|---|---|---|
| Türschwelle (unten) | 36 mm | 76,2 mm | 100,2 mm | 115,5 mm |
| Schiebetürführung (oben) | 35 mm | 78,4 mm | 104,0 mm | 129,6 mm |

Die Tiefe hängt an der **Gleiszahl**, nicht an der Flügelzahl: Eine
8-türige Anlage läuft 4-gleisig und braucht die 100,2-mm-Schwelle. Die
Gleiszahl kommt aus der Bauart, die der Konfigurator oder der Kunde
gewählt hat – damit zieht sich die Entscheidung bis ins Profil durch.

Der Flügel steht jetzt auf der Schwelle und endet unter der Führung;
seine Höhe ergibt sich daraus, statt bis unters Dach zu reichen.

**Rahmen- und Plankenwand** sind keine Schiebeanlage und laufen in keiner
Schwelle. Damit unten kein Spalt bleibt, stehen sie auf einem Sockel in
Schwellenhöhe – das ist weiterhin eine Vereinfachung, aber eine
sichtbare, keine erfundene Maßangabe.

**Damit erledigt sich** die offene Rückfrage nach dem Querschnitt der
Bodenschiene. Offen bleibt das **Wandanschlussprofil** (50 × 25 mm,
GESCHÄTZT) – dazu liegt kein Schnitt vor.

**Gegenzulesen:** Ob die Führung oben im Bild sichtbar ist oder hinter
dem Rahmen verschwindet, und ob der Flügel jetzt die richtige Höhe hat
(Schwelle 36 + Flügel + Führung 35 = lichte Höhe).

## 2026-10-11 – Flügelprofile der Schiebeanlage mit echten Maßen

**Anlass:** Weitere SG23-Profilschnitte vom Betreiber.

**Was falsch war:** Um jede Scheibe lag eine von mir erfundene Kante von
50 × 50 mm, und zwar nur oben und unten. Senkrecht war gar nichts.

**Was jetzt gilt – BELEGT durch die Schnitte:**

| Profil | Maß | im Modell |
|---|---|---|
| Tür-Einfaßprofil | 25 × 35 mm | Rahmen oben und unten am Flügel |
| H-Glaseinfaßprofil | 19,2 × 61,4 mm | senkrechte Kanten des Flügels |
| Bürstenprofil | 12 × 15,7 mm | **nicht gezeichnet** |

Die 25 mm Tiefe des Türprofils passen rechnerisch zur Verglasung:
10 mm Glas plus beidseitig 7,5 mm Profilwange.

**Das Bürstenprofil wird bewusst nicht gezeichnet.** Mit 12 mm Breite
wäre es im Bild kleiner als ein Pixel und kostet nur Rechenzeit – der
Konfigurator soll auf einem älteren Rechner laufen. Das Maß steht im
Code, damit es nicht verlorengeht, und eine Prüfung achtet darauf, dass
es nicht versehentlich doch gezeichnet wird.

**ANNAHME, GEGENZULESEN:** Welches Profil an welcher Kante sitzt. Die
Schnitte zeigen die Querschnitte, nicht die Einbaulage. Ich habe das
Türprofil waagerecht (oben/unten) und das H-Profil senkrecht gesetzt –
das ist die übliche Anordnung, aber nicht belegt. Beim H-Profil spricht
die Breite von 61,4 mm dafür: das ist der breite senkrechte Steg, den man
zwischen zwei Scheiben sieht.

## 2026-10-11 – Spalt zwischen Schiebewand und Keil

**Anlass:** „zwischen schiebewand und keil is ne lücke darf nicht sein"
(Betreiber, mit Bildschirmfoto).

**Was falsch war:** Die Schiebetürführung wurde an einen FESTEN Platz
oben unter dem Dach gesetzt (`okOben`). Sobald ein Keil dazukommt, wird
die Elementhöhe aber gekürzt, damit der Keil vorne seine Mindesthöhe von
150 mm behält. Der Flügel rutschte also nach unten, die Führung blieb
oben – dazwischen klaffte genau deren Höhe.

Eingeschleppt habe ich das beim Einbau der Führung selbst: Ich hatte nur
den Fall ohne Keil im Kopf, in dem beide Werte zusammenfallen.

**Was jetzt gilt:** Die Führung sitzt direkt auf dem Flügel, der Keil
beginnt über der Führung. Die Führungshöhe zählt außerdem bei der
Keil-Mindesthöhe mit – sie nimmt von der Höhe weg, die dem Keil bleibt.

**Absicherung:** Eine Prüfung rechnet die Lagen für den Fall mit
gekürztem Element durch und prüft, dass die ALTE Anordnung dort einen
Spalt gelassen hätte. Eine erste Fassung verglich zwei per Konstruktion
gleiche Werte – die konnte gar nicht anschlagen und ist wieder raus. Die
Gegenprobe hat das gefunden (89 von 90 statt 90 von 90); genau dafür ist
sie da.

**Gegenzulesen:** Ob der Übergang auch bei flacher Neigung (2°) und bei
sehr niedrigem Durchgang dicht bleibt – dort wird der Keil am
schmalsten.

## 2026-10-11 – SG23 ist rahmenlos (Korrektur des Eintrags von vorhin)

**Anlass:** „bei dem sg23 modell sind nur glasschiebetüren du hast da jz
aber rahmen dran gemacht das ist so falsch" (Betreiber, mit
Bildschirmfoto).

**Was falsch war:** Ich hatte aus den Profilschnitten geschlossen, das
Tür-Einfaßprofil und das H-Glaseinfaßprofil lägen um JEDEN Flügel herum,
und sie entsprechend gezeichnet. Das war ein Schluss von einem
Querschnitt auf eine Einbaulage, die in der Zeichnung gar nicht steht –
genau die Art Annahme, die hier als ANNAHME markiert war und sich jetzt
als falsch herausgestellt hat.

**Was jetzt gilt:** Der Flügel ist reines Glas. Sichtbar sind nur die
Türschwelle unten und die Schiebetürführung oben. Das ist der Punkt des
Systems – rahmenlose Glasschiebetüren; ein Rahmen um jede Scheibe nimmt
ihm genau das, wofür der Kunde ihn kauft.

**Die drei Profilmaße bleiben hinterlegt**, aber nichts davon wird
gezeichnet: Tür-Einfaßprofil 25 × 35, H-Glaseinfaßprofil 19,2 × 61,4,
Bürstenprofil 12 × 15,7 mm. Eine Prüfung achtet für jedes einzeln
darauf, dass es hinterlegt, aber NICHT gezeichnet ist – so geht das Maß
nicht verloren und wandert auch nicht versehentlich zurück ins Bild.

**Offene Frage an den Betreiber:** Wo sitzen diese drei Profile dann?
Vermutlich an den Festfeldern und am Anschluss zu Wand und Pfosten. Ohne
diese Auskunft wird nichts davon gezeichnet – lieber eine Scheibe ohne
Profil als ein Profil an der falschen Stelle.

**Lehre für die Doku:** Ein Querschnitt belegt den Querschnitt, nicht den
Einbauort. Wo der Einbauort nur erschlossen ist, gehört er nicht ins
Modell, sondern in die Rückfragenliste.

## 2026-10-11 – Muschelgriff am ziehenden Flügel

**Anlass:** „an die vorderste tür an der mn quasi zieht zum aufmachen nen
runden eingelassenen edelstahlgriff machen also keinen herausstehenden
wäre ja unlogisch" (Betreiber).

Der Einwand trifft die Bauart: Die Flügel laufen dicht aneinander vorbei.
Ein vorstehender Griff würde am nächsten Flügel anschlagen – er kann
also gar nicht vorstehen. Umgesetzt als runde Edelstahlschale, die in der
Scheibe sitzt und mit ihr bündig abschließt.

Der Griff sitzt nur am Flügel, der am weitesten fährt – das ist der, an
dem gezogen wird – und dort an der Ziehkante, nicht in der Mitte.

**GESCHÄTZT, GEGENZULESEN:** Durchmesser 50 mm und Höhe 1050 mm über der
Schwelle. In der Unterlage steht nur „inklusive 2 Griff", ohne Maß. Eine
Prüfung hält beide Werte in einem handgerechten Band (40–70 mm, 900 bis
1200 mm) und stellt sicher, dass der Griff nicht tiefer baut als das
10-mm-Glas.

**Zwei Griffe laut Unterlage, einer im Modell:** Der zweite sitzt
vermutlich auf der Gegenseite derselben Scheibe (innen und außen). Im
Bild ist immer nur eine Seite zu sehen, deshalb zeichne ich einen. Falls
die zwei Griffe etwas anderes meinen – etwa zwei verschiedene Flügel –
bitte sagen.

## 2026-10-11 – Schiebeanlage je Pfostenfach, Öffnung von innen nach außen

**Anlass:** „wenn wir ein mittelpfosten haben wie hier oder mehrre
pfosten, müssen für die schiebeanlage jeweils die lichten maße von
pfosten zu pfosten genommen werden, also werden es quasi mehrere
schibeanlagen. und die sollen dann von innen nach außen öffnen also von
dermitte zu den rändern links und rechts sliden" (Betreiber).

**Was falsch war:** Über die ganze Vorderseite lief EINE Anlage – über
die Mittelpfosten hinweg. Das geht baulich nicht, und es verfälscht die
Stückzahlen in der Anfrage.

**Was jetzt gilt:** Je Fach zwischen zwei Pfosten eine eigene Anlage mit
dem LICHTEN Maß (Pfostenachsen minus je eine halbe Pfostenbreite). Bei
6000 mm Breite:

| Pfosten | Felder | lichtes Maß je Feld | Bauart |
|---|---|---|---|
| 2 | 1 | 5780 mm | 6-türig, Scheiben 963 mm |
| 3 | 2 | 2835 mm | 3-türig, Scheiben 945 mm |
| 4 | 3 | 1853 mm | 2-türig, Scheiben 927 mm |

Das ändert die Bestellung spürbar: aus einer 8-türigen Anlage werden
zwei 3-türige. Genau so wird auch bestellt.

**Öffnungsrichtung:** Felder links der Mitte schieben nach links, Felder
rechts der Mitte nach rechts. Dafür kann `schiebetuer()` die Laufrichtung
jetzt spiegeln.

**Absicherung:** Eine Prüfung rechnet die Felder für 2, 3 und 4 Pfosten
nach und prüft zusätzlich, dass lichte Maße plus Pfostenbreiten exakt die
Gesamtbreite ergeben – sonst fehlte oder doppelte sich irgendwo Glas.

## 2026-10-11 – Tür-Einfaßprofil ist das Wandprofil, Griff an der Außenkante

**Profile aufgelöst:** „das tür einfassprofil war ja das an der wand und
die anderen kannst du weglasen" (Betreiber). Der Wandanschluss bekommt
damit sein echtes Maß: **25 × 35 mm** statt meiner geschätzten 50 × 25 mm.
H-Glaseinfaßprofil und Bürstenprofil sind ersatzlos entfernt – ein Maß
ohne Einbauort ist kein Wissen, sondern Ballast, der beim nächsten Mal
wieder jemanden auf eine falsche Fährte lockt.

**Griff:** „die griffe an die übliche stelle machen rechechiere im netz".
Recherchiert am 11.10.2026:

- Für Muschelgriffe an Glasschiebetüren gibt es **keine Norm-Höhe**.
- Maßgeblich ist die übliche Drückerhöhe von **1050 mm** über OFF.
- DIN 18040 nennt für barrierefreie Bedienung **850 mm**, zulässiges Band
  **750 bis 1200 mm** (HEWI-Datenblätter). 1050 mm liegt darin.
- Bohrung **50 mm** Durchmesser ist das übliche Handelsmaß (OBI,
  Hornbach).

Höhe und Durchmesser waren also richtig geraten. Falsch war die
WAAGERECHTE Lage: Der Griff saß an der Innenkante des Flügels, wo
niemand greift. Er gehört an die Kante, die geschlossen außen liegt –
also auf der dem Stapel abgewandten Seite, und die dreht sich mit der
Laufrichtung des Feldes.

**Für den Betrieb wichtig:** Wer barrierefrei bauen muss, braucht den
Griff auf 850 mm. Das steht bewusst NICHT im Konfigurator – es ist eine
Beratungsfrage, und ein zusätzliches Feld dafür würde den Hauptweg für
alle anderen verlängern. Beim Aufmaß abfragen.

## 2026-10-11 – Laufrichtung und Griffseite waren beide invertiert

**Anlass:** „der griff sitzt auf der falschen seite" und, als Bestätigung
meiner Rechnung: „er muss einmal gegenüber" (Betreiber, mit
Bildschirmfoto).

**Was falsch war:** Gleich zwei Vorzeichen, und ich hatte sie beide aus
dem Kopf gesetzt statt nachgerechnet. Nachgerechnet sieht es so aus:

| Kennzahl | Stapel | der ziehende Flügel schließt bei | Griff |
|---|---|---|---|
| `rk = -1` | nach +x (rechts) | −x (links) | linke Kante |
| `rk = +1` | nach −x (links) | +x (rechts) | rechte Kante |

Daraus folgt: `kante = lage + rk * (...)`, nicht minus. Und ein Feld
links der Mitte, das nach außen – also nach links – öffnen soll, braucht
`rk = +1`, nicht −1. Beides war genau andersherum.

**Was jetzt stimmt:** Beim linken Feld stapeln sich die Flügel am
äußeren Rand, der ziehende Flügel schließt am Mittelpfosten, und dort
sitzt auch der Griff – also genau da, wo man steht, wenn man aufmacht.
Rechts spiegelbildlich.

**Absicherung – und warum die alte Prüfung nichts taugte:** Bisher prüfte
eine Zeile nur, ob der erwartete Ausdruck im Quelltext steht. Damit lässt
sich ein Vorzeichenfehler nicht finden, denn sie bestätigt genau das, was
man gerade geschrieben hat. Jetzt rechnet die Prüfung Stapelseite und
Griffseite für ein linkes und ein rechtes Feld aus und vergleicht sie mit
der Feldmitte; dazu kommt eine Prüfung, dass der Griff nie außerhalb
seines Flügels liegt.

## 2026-10-11 – Zwei Fehler aus einer Korrektur

**Anlass:** „du hast jetzt die ganze schiebetür gespiegelt nicht nur den
griff sie geht jz zur falschen seite auf" und, aus einem früheren Bild,
„auf der vorderseite hast du die anlage nicht aufgeteilt wie besprochen".

### 1. Eine Änderung zu viel

Beim Griff-Fehler habe ich ZWEI Vorzeichen gedreht: das des Griffs – das
war richtig – und das der Laufrichtung. Letzteres war aber nur für
geteilte Felder falsch, und geteilte Felder hatte der Betreiber nie zu
sehen bekommen (siehe Punkt 2). Für das EINZELNE Feld über die ganze
Breite war die alte Richtung richtig, und die habe ich mit derselben
Zeile umgedreht.

Die Abfrage lautet jetzt `feldMitte > 0 ? -1 : 1` statt `< 0 ? 1 : -1`.
Der Unterschied betrifft genau den Fall `feldMitte === 0`, also das
einzelne Feld: Es bleibt bei „öffnet nach links", wie vorher.

**Lehre:** Wenn eine Rückmeldung einen Fehler nennt, gehört genau dieser
eine Fehler behoben. Die zweite Änderung war meine eigene Idee, mitten in
einer Korrektur, und niemand hat sie gegengelesen.

### 2. Die Aufteilung kam nie an

Die Vorderseite wird seit dem 11.10.2026 je Pfostenfach geteilt – aber
nur im GESCHÄTZTEN Baupfad. Der Datenpfad (`bauenAusDaten`) ruft dieselbe
Funktion auf und gab die Pfostenachsen nicht mit; der eingebaute Rückfall
auf zwei Eckpfosten sieht dann aus wie „nicht aufgeteilt". Dasselbe galt
für die Dachunterkante: ohne sie fehlt dort der Keil ganz.

Beide Argumente werden jetzt übergeben. Eine Prüfung schlägt an, sobald
irgendwo wieder ein Aufruf ohne Pfostenachsen steht.

**Zum Zeitpunkt der Beanstandung war der Datenpfad allerdings gar nicht
aktiv** – `/api/bauteile` antwortet weiterhin mit 503, nachgeprüft am
11.10.2026. Die Bilder stammen also vermutlich von einem Stand vor dem
Einbau der Aufteilung. Der Fehler im Datenpfad war trotzdem echt und
wäre genau dann aufgeschlagen, wenn die Schnittstelle endlich
angebunden wird.

**Nicht geändert:** Der Pergola-Pfad ruft `seitenErweiterungen` ebenfalls
ohne Achsen auf. Dort sind die Seitenelemente ein anderes System
(SunPro / Velaris), nicht SG23 – bewusst unangetastet, bis der Betreiber
sagt, ob dort dasselbe gelten soll.

### 3. Fahrdauer langsamer und an einer Stelle

„kannst du überall die öffnungs und schließ animation nen ticken
langsamer machen" (Betreiber). 650 → **950 ms**, gut ein Drittel
langsamer, aber noch keine Wartezeit.

Dabei ist aufgefallen, dass die 650 zweimal im Code stand – einmal für
die Markise, einmal für die Schiebeanlage. Jetzt gibt es dafür eine
Konstante `FAHRDAUER`, und eine Prüfung achtet darauf, dass keine zweite
feste Dauer danebenwächst. Sonst heißt „überall" beim nächsten Mal
wieder nur „an einer Stelle".

## 2026-10-11 – Handauswahl rechnete gegen das falsche Maß

**Anlass:** „das funktioniert nicht auf stirnseite prüfe alle seiten"
(Betreiber, mit Bildschirmfoto: vorne war „6-türig, 3 Schienen" gewählt,
gezeichnet wurde trotzdem automatisch).

**Was falsch war:** Das Bedienfeld rechnete die Auswahl selbst aus –
vorne gegen `Z.breite`, an den Seiten gegen `Z.tiefe`. Beides stimmte
nicht mit dem überein, was das Modell baut:

| Seite | Bedienfeld | Modell |
|---|---|---|
| vorne | volle Breite, z. B. 6000 mm | lichtes Maß je Pfostenfach, z. B. 2835 mm |
| links/rechts | volle Tiefe | Wand bis Dachvorderkante, also Tiefe minus Rinne minus halber Pfosten, bei Dachvorsprung noch weniger |

Eine Bauart, die nur zum vollen Maß passt, findet sich beim Zeichnen im
Feldmaß nicht wieder – und fällt dann **still** auf Automatik zurück.
Für den Bediener sieht das aus, als tue die Auswahl nichts.

**Was jetzt gilt:** Das Modell meldet beim Bauen, mit welchem Maß es je
Seite wirklich gerechnet hat (`SG23_LAENGE`). Auswahlfeld, Hinweis und
Anfrage-Mail lesen dieses Maß. Damit gibt es nur noch eine Wahrheit; die
Rechnung im Bedienfeld ist ersatzlos weg.

**Reihenfolge:** `sg23FeldFuellen()` wird jetzt NACH `bauen()` aufgerufen.
Vorher lief es in `seitenStandZeigen()`, also davor – das Feld hätte sonst
dauerhaft die Maße des vorigen Standes gezeigt.

**In der Anfrage** steht ab jetzt das lichte Maß und bei mehreren Feldern
deren Anzahl, etwa „Schiebeanlage vorne: 2835 mm licht · 2 Felder
zwischen den Pfosten, Maß je Feld – SG23, 3-rails, 3-türig …".

**Gegenzulesen:** Alle drei Felder einzeln durchprobieren – eine Bauart
wählen, Maß ändern, und prüfen, ob die Zeichnung folgt bzw. das Feld
sauber auf „Automatisch" zurückspringt, wenn die Bauart nicht mehr passt.

## 2026-10-11 – Die Tabellenspalten sind Obergrenzen, keine Mindestbreiten

**Anlass:** „jetzt sind die anderen möglichkeiten weg" (Betreiber, mit
Bildschirmfoto: bei einem Pfostenfach von 2336 mm stand nur noch eine
einzige Bauart zur Auswahl).

**Was falsch war – meine Leseart der Unterlage.** Über jeder Spalte steht
„Breite **bis**". Die Spalten sind also Obergrenzen, und die kleinste
Spalte deckt alles darunter mit ab. Ich hatte die kleinste Spalte als
MINDESTBREITE gelesen: 3-türig „ab 2500 mm". Richtig ist: 3-türig **bis**
2500 mm – bei 2336 mm also sehr wohl bestellbar.

**Was jetzt gilt:** Eine Bauart passt, wenn die Breite ihr Höchstmaß
nicht reißt UND die Scheibe nicht schmaler wird als **400 mm**. Diese
Untergrenze ist nicht erfunden, sondern die schmalste Scheibe, die die
Unterlage selbst führt (5-rails 10-türig bei 4000 mm). Was der Hersteller
tabelliert, baut er auch.

Bei 2336 mm stehen damit fünf Bauarten zur Auswahl statt einer, und
10-türig mit 234-mm-Scheiben bleibt zu Recht draußen.

**Die Automatik ändert sich dadurch kaum** – nachgerechnet für zehn
Breiten von 1500 bis 7000 mm bleibt dieselbe Bauart; das Scheibenband
wird sogar etwas enger (750 bis 1168 mm statt 750 bis 1250 mm).

**Mitgeändert:** Die Hinweistexte sagen nicht mehr „lieferbar 1500 bis
7000 mm", sondern „bis 7000 mm" mit dem Zusatz, dass die Scheibe
mindestens 400 mm breit sein muss.

**Gegenzulesen:** Ob VD unterhalb der kleinsten Spalte wirklich fertigt –
mein Schluss stützt sich auf das Wort „bis" in der Spaltenüberschrift,
nicht auf eine ausdrückliche Zusage. Falls es doch eine Mindestbreite je
Bauart gibt, ist `sg23Passt()` die eine Stelle dafür.

## 2026-10-11 – Schienen bündig zur Pfosteninnenseite

**Anlass:** „die führungsleisten unten und oben müssen mit der pfosten
innenseite bündig sein", ergänzt um „nur wenn die schiene dicker wird als
der pfosten dann vermitteln" (Betreiber, mit Bild).

**Was falsch war:** Schwelle und Führung saßen MITTIG auf der
Elementachse. Die Achse liegt auf der Pfosteninnenseite – also stand die
halbe Profiltiefe nach außen über den Pfosten hinaus, bei der
5-gleisigen Führung knapp 65 mm.

**Was jetzt gilt:**

| Fall | Lage |
|---|---|
| Schiene schmaler als der Pfosten (110 mm) | bündig zur Innenseite, verschwindet vollständig dahinter |
| Schiene tiefer als der Pfosten | mittig auf dem Pfosten, steht beidseitig gleich weit über |

Betroffen von der Vermittlung sind genau zwei Profile: die 5-gleisige
Schwelle (115,5 mm) und die 5-gleisige Führung (129,6 mm). Die
4-gleisige Führung (104 mm) bleibt knapp darunter und sitzt bündig.

**Mitgezogen:** Die Laufspur der Flügel folgt derselben Richtung. Vorher
stand der zweite Flügel um 24 mm nach AUSSEN versetzt, also vor dem
Pfosten statt in der Schiene.

**Zur Absicherung:** Eine erste Fassung der Prüfung verglich für den
Überstand einen Ausdruck mit sich selbst und hätte nie angeschlagen – in
der Gegenprobe nur durch ein angehängtes `&& false` „gerettet". Das ist
genau die Attrappe, vor der die Projektanweisung warnt. Sie rechnet den
Überstand jetzt aus den fertigen Lagen zurück: Schienenkanten gegen
Pfostenkanten.

## 2026-10-11 – Türschwelle wird eingelassen, nicht aufgesetzt

**Anlass:** „die schiene auf dem boden kannst du bündig mit boden machen
nicht überstehend, das wird ja eingelassen in den boden das es
barrierefrei is" (Betreiber).

**Was falsch war:** Die Schwelle stand mit ihren vollen **36 mm** auf dem
Belag. Das ist eine Stolperkante, die es in echt nicht gibt – und sie
hätte genau das zunichte gemacht, wofür so ein System gekauft wird. DIN
18040 lässt an Türen höchstens 20 mm zu, und das nur als Ausnahme.

**Was jetzt gilt:** Die Schwelle liegt bis auf 2 mm unter Belagsniveau,
die Flügel stehen praktisch auf dem Boden. Die 2 mm sind **kein
Bauteilmaß**, sondern Zeichentechnik: Läge die Oberfläche exakt auf dem
Belag, flimmerten beide Flächen ineinander. Sichtbar bleibt die
Laufschiene als Linie im Boden – wie in Wirklichkeit.

**Nebeneffekt, der stimmt:** Der Muschelgriff sitzt jetzt 1052 statt
1086 mm über dem Belag und trifft damit die recherchierten 1050 mm
genauer als vorher.

**Für den Betrieb wichtig:** Eingelassen heißt, dass der Belag unter der
Anlage vorbereitet sein muss – eine Aussparung von 36 mm Tiefe über die
ganze Länge. Wird auf einen fertigen Belag montiert, geht das nicht ohne
Weiteres, und die Schwelle steht doch auf. Das gehört ins
Aufmaßgespräch, weil es den Belag betrifft und nicht die Anlage.

**Gegenzulesen:** Ob die Schiene im Bild noch als Linie erkennbar ist
oder optisch ganz verschwindet.

## 2026-10-11 – Carport TDS ist ein Terrassendach TDS

**Anlass:** „das carport tds ist eig, genauso ein terrassendach tds, die
konfiguration sollte gleich sein, der einzige unterschied dort ist ein
dachvorsprung auch an der hinterseite möglich bei freistehender
montage" (Betreiber). Dazu zwei Entscheidungen auf Rückfrage:
Seitenelemente ja / Markisen nein, und die Tiefe auf die Maßtabelle
begrenzen.

**Was vorher getrennt war:**

| | Terrassendach TDS | Carport TDS (vorher) |
|---|---|---|
| Baupfad | echte Stückzahlen aus der Maßtabelle | geschätzt, Faustregel „Breite / 110 cm" |
| Montage | Feld „Aufbau" | eigenes Feld „Ausführung" – inhaltlich dasselbe |
| Maße | Grenzen aus der Tabelle (14080 × 7050 mm) | feste Schätzwerte, Tiefe bis 8000 mm |
| Dachvorsprung | mit Statikträger, Pfosten rücken ein | eigener Regler, wirkte nur aufs Dach |
| Seitenelemente | ja | gesperrt |

**Was jetzt gilt:** Der Carport TDS läuft über denselben Baupfad und
bekommt damit echte Stückzahlen. Die drei Ausführungen sind auf „Aufbau"
abgebildet; das zweite Feld entfällt, weil zwei Felder für dieselbe Frage
verwirren. Seitenelemente sind freigeschaltet, Markisen bleiben gesperrt.

**Die Tiefe wird bei 7000 mm gekappt.** Die alten 8000 mm waren eine
Schätzung aus der Zeit vor der Tabelle; darüber gibt es keine
Stückzahlen, und der Maßhinweis hätte Zahlen genannt, die TDS nicht baut.

**Neu: Dachvorsprung hinten**, nur beim freistehenden Carport TDS. Wie
vorne rücken die Pfosten um das Maß nach innen, und der Statikträger
wandert mit – er liegt dann unter den Sparren statt hinter ihnen. Das
Dach wird dabei nicht länger: Das Tiefenmaß ist das Bestellmaß.

**Die Anfrage-Mail behält die Carport-Begriffe.** Aus Aufbau und
Vorsprung wird wieder „Freistehender Carport", „Carport mit Wandmontage"
oder „Carport mit Überstand" – die Wörter, die der Anfrage-Assistent
kennt. Der Kunde sieht im Bedienfeld die einfache Frage, im Haus kommt
der Fachbegriff an.

**Gegenzulesen:**
1. Ob die Voreinstellung 3200 × 5500 mm bei 2300 mm Höhe für einen
   Carport passt. Die Durchfahrtshöhe lag vorher bei 2200 mm, die
   Obergrenze bei 2600 statt 2700 mm – ich habe auf die
   Terrassendach-Werte vereinheitlicht, weil es dasselbe System ist.
2. Ob am Carport wirklich alle Seitenelemente sinnvoll sind (Keil,
   Plankenwand, Senkrechtmarkise) oder nur Glas und Schiebetüren.
3. Flat Line und Flat Box sind unverändert – sie laufen weiter über den
   geschätzten Pfad.

## 2026-10-11 – Nachtrag: kein eigener Maßblock für den Carport TDS

**Anlass:** „guckmal das tds carport is eig das tds dach, du hast dafür
aber was komplett neues gemacht obwohl sich eig nur der name zu carport
ändert mehr nicht" (Betreiber).

**Was falsch war:** Ich hatte dem Carport TDS beim Vereinheitlichen einen
EIGENEN Maßblock gegeben – mit eigenen Grenzen und eigenen
Voreinstellungen (3200 × 5500 mm, Höhe 2300). Das war gut gemeint („ein
Carport ist schmaler und tiefer"), aber es ist genau die zweite Wahrheit,
die beim nächsten Umbau auseinanderläuft. Und es widerspricht dem, was
der Betreiber gesagt hat: Es ist dasselbe Dach.

**Was jetzt gilt:** Es gibt keinen eigenen Block mehr. Der Carport TDS
greift auf den des Terrassendachs zu – Grenzen UND Voreinstellungen.
Damit sind auch die beiden Punkte erledigt, die ich zum Gegenlesen
gestellt hatte: Die Durchfahrtshöhe ist dieselbe wie die Durchgangshöhe,
weil es dieselbe Höhe ist.

Was bleibt, ist der Name – in `produktName()` und in der Anfrage-Mail.

**Lehre, dieselbe wie heute schon zweimal:** Beim Vereinheitlichen nicht
nebenbei etwas Neues einführen. „Gleich" heißt gleich, nicht
„gleich, aber mit eigenen Werten".
