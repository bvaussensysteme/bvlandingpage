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

## 2026-10-11 – Beim Carport kein automatischer Statikträger

**Anlass:** „du machst beim carport automatisch nen statikträger ab
bestimmte maß. lass das. mach es mit häckchen wie bei tds normal"
(Betreiber).

**Was war:** Der Carport TDS erbte mit dem Terrassendach-Pfad auch dessen
Tiefenregel – ab 4500 mm Tiefe kommt laut Maßtabelle ein Unterzug. Ein
Carport ist aber von Haus aus tief (Voreinstellung 5500 mm, Fahrzeuglänge
plus Bewegungsraum), die Regel hätte dort also praktisch immer gegriffen
und dem Kunden die Wahl genommen.

**Was jetzt gilt:** Beim Carport TDS entscheidet allein das Häkchen
„Statikträger unter der Rinne" bzw. ein Dachvorsprung. Beim
Terrassendach bleibt die Tiefenregel unverändert.

Die Abfrage steckt in einer Funktion `unterzugGilt(tb)`; Modell,
Pfostenzahl und Maßhinweis fragen alle dort. Eine Prüfung schlägt an,
sobald wieder irgendwo roh `tb.unterzug` abgefragt wird.

**OFFEN und dem Betreiber vorgelegt:** Die Maßtabelle sieht den Unterzug
ab 4500 mm Tiefe vor – das ist eine Statikangabe, keine Ausstattung. Wer
jetzt einen 5,5 m tiefen Carport ohne Häkchen bestellt, bekommt
möglicherweise eine Rückfrage von VD. Ob im Bedienfeld ein Hinweis
darauf stehen soll, habe ich NICHT entschieden, sondern gefragt –
nachdem ich heute dreimal bei einer Korrektur ungefragt etwas
mitgeändert hatte.

## 2026-10-11 – Freistehender Carport: beide Höhen getrennt einstellbar

**Anlass:** „bei carport tds will ich nur höhe vorne und höhe hinten
unabhängig voneinander verstellen können in erweiterte einstellungen,
und dachvorsprung vorne machen können und hinten auch" – auf Rückfrage
präzisiert: „also nur bei der freistehenden version" (Betreiber).

**Was jetzt gilt:** Beim **freistehenden** Carport TDS steht unter „Mehr
Einstellungen" ein Regler „Höhe hinten". Die Dachneigung ist dort ein
ERGEBNIS und wird nur noch angezeigt; das Neigungsfeld verschwindet
dafür. Zwei Regler für dieselbe Sache wären ein Widerspruch – wer am
einen dreht, verstellte den anderen.

| | Terrassendach / Carport an der Wand | Carport freistehend |
|---|---|---|
| Eingabe | Höhe vorne + Neigung | Höhe vorne + Höhe hinten |
| Ergebnis | Höhe an der Wand | Dachneigung |
| Dachvorsprung | vorne | vorne und hinten |

**Warum nur freistehend:** An der Hauswand bestimmt die Wand die hintere
Höhe, und nach hinten auskragen kann das Dach dort nicht. Beides hängt
deshalb an einer gemeinsamen Bedingung `hoehenGetrennt()`, damit die
zwei Felder nicht auseinanderlaufen können.

**Gekappt auf 2 bis 14°** – das zulässige Band des Systems. Extremere
Höhen zeigt die Zeichnung gekappt; die eingegebene Höhe hinten steht
trotzdem in der Anfrage, damit das Aufmaß sie sieht.

**In der Anfrage** stehen freistehend beide Höhen und die daraus
folgende Neigung.

**Gegenzulesen:** Ob der Bereich 2000–3200 mm für die hintere Höhe
passt. Er ist von mir gesetzt, nicht belegt.

## 2026-10-11 – Dachvorsprung beim Carport bis 1500 mm

**Anlass:** „dachvorsprung bei carport ruhig machen möglich bis 1500mm
nicht nur 800mm" (Betreiber).

Beim Carport TDS gehen beide Vorsprünge – vorne und hinten – jetzt bis
1500 mm. Beim Terrassendach bleibt es bei 800 mm.

**Mitgedacht:** Die Grenze wird am Regler gesetzt und der WERT mitgezogen.
Wer am Carport 1400 mm einstellt und dann auf Terrassendach wechselt,
bekäme sonst ein Maß, das der Regler gar nicht mehr hergibt – und es
stünde trotzdem in der Anfrage. Jetzt wird es auf 800 gekappt, sichtbar
im Regler und im Zahlenfeld.

**Gegenzulesen:** Ob 1500 mm statisch gedeckt sind. Die Maßtabelle sagt
zum Vorsprung nichts; ich habe nur die Grenze im Bedienfeld gesetzt, die
du genannt hast. Bei großem Vorsprung trägt der Statikträger die ganze
Auskragung – ab welchem Maß TDS einen stärkeren Träger vorsieht, weiß
ich nicht.

## 2026-10-11 – Höhe hinten: gekoppelt, aber entkoppelbar

**Anlass:** „das soll gekopplt sein an vorne aber man soll es entkoppeln
können und getrennt einstellen" (Betreiber, mit Bildschirmfoto).

**Was jetzt gilt:** Voreingestellt FOLGT die hintere Höhe der vorderen.
Man gibt die Dachneigung vor und liest die Höhe hinten ab; ihr Regler ist
dabei sichtbar, aber gesperrt – man sieht also, was herauskommt. Mit dem
Häkchen „Höhe hinten getrennt einstellen" wird er frei, und dann ist die
NEIGUNG das Ergebnis; ihr Eingabefeld verschwindet.

Immer ist genau eines von beidem Eingabe. Beides gleichzeitig wäre ein
Widerspruch: Wer am einen dreht, verstellte den anderen.

**Nebenbei gefunden – Anzeigefehler:** Im Bild stand „5,2° (9,100712926493951 %)".
`neigungProzent()` hat eine Tabelle für ganze Grad; seit der Carport
Zwischenwerte erzeugt, fiel sie auf die Rechnung zurück – ungerundet.
Jetzt auf eine Nachkommastelle gerundet, mit einer Prüfung, die genau
das nachrechnet.

**Gegenzulesen:** Ob die gekoppelte Höhe hinten im Bedienfeld sofort
mitläuft, wenn man vorne oder an der Neigung dreht.

## 2026-10-11 – VSG-Glas wird ab 4,50 m quer gestoßen

**Anlass:** „und vsg glas kann ja ab ner bestimmten länge nict am stück
verbaut werden sondern is dann getrennt und muss gekopelt werden" –
auf die Rückfrage nach dem Maß: „ich glaube geht nur bis 4,50 oder 5m am
stück" (Betreiber).

**Die Zahl ist belegt, nicht geschätzt.** Die Maßtabelle führt einen
„Innenkern" ausschließlich ab der Tiefe **4600 mm**; die letzte Tiefe
ohne ihn ist damit 4500 mm. Das deckt sich mit der unteren der beiden
Schätzungen des Betreibers – zwei unabhängige Quellen, dieselbe Zahl.
Deshalb: größte Scheibe am Stück 4500 mm.

**Was jetzt gezeichnet wird:** Ab 4600 mm Tiefe zwei Scheiben
hintereinander statt einer, dazwischen ein Kopplungsprofil über die
volle Dachbreite. Der Querschnitt des Profils ist GESCHÄTZT (60 × 30 mm)
– die Lage und das Vorhandensein sind es nicht.

**Nur bei Glas.** Polycarbonat-Stegplatten kommen in langen Bahnen und
werden nicht gestoßen.

**Im Bedienfeld und in der Anfrage:** Der Hinweis nennt die 4,50 m im
Klartext, die Anfrage-Mail hängt „quer gestoßen und gekoppelt
(Innenkern)" an die Eindeckung. Das steht in `eindeckungFach()`, also an
EINER Stelle – die Zeile wird an zwei Orten gebraucht.

**Warum das zählt:** Der Innenkern ist bei TDS ein eigenes Bauteil und
wird getrennt geführt (im Datenpfad gibt es dafür `innenkernImPreis`).
Fehlt er in der Anfrage, fehlt er im Angebot.

## 2026-10-11 – Glasstoß sichtbar und verschiebbar

**Anlass:** „falls eine kopplung nötig is soll diese im 3d modell
sichtbar sein und ne einstellung geben das ich sie verschieben kann im
erlaubten bereich" (Betreiber). Dazu die Bestätigung: „bei polycarbonat
zählt das nicht das geht immer in einem stück".

**Sichtbar:** Das Kopplungsprofil läuft quer über die volle Dachbreite,
auf Scheibenhöhe und in der Dachneigung mitgedreht.

**Verschiebbar:** Neuer Regler unter „Mehr Einstellungen" – „Glasstoß,
Abstand von der Rinne". Gemessen wird ab der Rinne, weil das die Kante
ist, die man im Bild sieht.

**Der erlaubte Bereich ergibt sich, er wird nicht gesetzt.** Beide
Scheiben müssen für sich am Stück machbar bleiben, also höchstens
4500 mm:

| Tiefe | erlaubter Bereich |
|---|---|
| 4600 mm | 100 bis 4500 mm |
| 5500 mm | 1000 bis 4500 mm |
| 7000 mm | 2500 bis 4500 mm |

Voreingestellt mittig – das ist die Lage mit der größten Reserve nach
beiden Seiten. Verändert man die Tiefe, wird die Einstellung in den neuen
Bereich gezwungen, statt still ein unmögliches Maß stehen zu lassen.

**Polycarbonat:** unverändert ohne Stoß. Das war schon so gebaut
(`glasGeteilt()` prüft `!istPolycarbonat()`), und eine Prüfung deckt den
Fall ab: 7000 mm Polycarbonat → am Stück.

**Absicherung:** Eine Prüfung rechnet für 7000 mm Tiefe an beiden Enden
und in der Mitte des Bereichs nach, dass keine Scheibe über 4500 mm
hinausgeht.

## 2026-10-11 – Korrektur: Innenkern ist keine Glaskopplung

**Anlass:** „innenkern is keine glaskopplung das is für das 3d modell
egal" und „das kann raus" (Betreiber).

**Was falsch war:** Ich hatte die Schwelle für den Glasstoß aus dem
„Innenkern" der Maßtabelle hergeleitet (dort ab Tiefe 4600 mm) und das
im vorigen Eintrag als **zweite, unabhängige Quelle** für die 4,50 m
ausgegeben. Das stimmt nicht: Zwei Dinge, die zufällig in derselben
Gegend liegen, sind nicht dasselbe. Der Innenkern hat mit der Verglasung
nichts zu tun.

**Was jetzt gilt:**
- Die größte Scheibe am Stück ist **4500 mm – Angabe des Betreibers,
  nicht belegt.** Er schätzte „4,50 oder 5m"; genommen ist der niedrigere
  Wert, weil einmal zu früh stoßen harmloser ist als eine Scheibe zu
  zeichnen, die es nicht gibt. **GEGENZULESEN: 4,50 oder 5,00 m?**
- Gestoßen wird bei Tiefe über 4500 mm, nicht mehr ab 4600 mm.
- Das Wort „Innenkern" steht nicht mehr in der Anfrage. Dort heißt es
  jetzt „quer gestoßen und gekoppelt bei X mm ab Rinne" – mit der Lage,
  die eingestellt ist.
- Die Innenkern-Zeile in den technischen Angaben ist entfernt. Die
  Felder kommen weiterhin aus der Matrix, sie werden nur nicht mehr
  angezeigt.

**Lehre:** Eine Zahl aus einer anderen Spalte herzuleiten, weil sie
plausibel passt, ist keine Quelle. Sie sah hier sogar besonders
überzeugend aus, weil sie die Schätzung des Betreibers bestätigte – und
genau das hätte mich misstrauisch machen müssen.

## 2026-10-11 – Glaskopplungsprofil mit echtem Maß

Der Betreiber hat die Querschnittszeichnung geschickt: **28 mm breit,
6 mm hoch**. Vorher standen hier geschätzte 60 × 30 mm – mehr als
doppelt so breit und fünfmal so hoch wie das echte Teil.

Die Zeichnung zeigt ein flaches T-Profil: oben die 28 mm breite Auflage,
darunter ein schmaler Steg zwischen den Scheiben. Modelliert wird nur
die Auflage; der Steg liegt im Stoß und ist von außen nicht zu sehen.

Eine Prüfung achtet zusätzlich darauf, dass das Profil nie höher baut
als die dünnste Scheibe (VSG 8 mm) – sonst stünde es wie eine Schwelle
auf dem Dach.

**Nachtrag Material:** „und das is durchsichtiges gummi … also ganz
leicht matt" (Betreiber). Das Profil ist deshalb kein Alu, sondern ein
halbtransparentes, nur leicht mattes Material ohne Metallanteil. Es
wirft außerdem KEINEN Schatten – sonst läge ein dunkler Streifen quer
über die Terrasse, den es in echt nicht gibt.

Mein erster Rauheitswert (0,55) war zu matt; auf Hinweis des Betreibers
auf 0,28 gesetzt.

## 2026-10-11 – 4,50 m bestätigt, Kopplungsprofil dunkler

**Größte Scheibe am Stück:** Auf die Rückfrage „4,50 oder 5,00 m?"
entschieden: **4,50 m**. Damit ist die Zahl keine Schätzung mehr,
sondern die Festlegung des Betreibers. Betroffen ist jede Anlage
zwischen 4,5 und 5 m Tiefe – die bekommt einen Stoß.

**Farbton:** „mach das kopplungsprofil leicht dunkler das man es besser
im 3d sieht". Das Profil ist jetzt deutlich dunkler und etwas weniger
durchsichtig als das echte Gummi.

Das ist eine **bewusste Abweichung von der Naturtreue**: Ein nahezu
farbloses Profil auf durchsichtigem Glas verschwindet am Bildschirm. Hier
geht Erkennbarkeit vor – und es steht als Kommentar im Code, damit es
niemand später als Farbfehler „korrigiert".

**Zur Absicherung:** Die erste Fassung der Farbprüfung hatte für beide
Schranken (nicht zu hell, nicht zu dunkel) denselben Gegenprobe-Versatz.
Der macht die eine Prüfung falsch und die andere erst recht wahr – sie
hätte nie anschlagen können. Jede Schranke hat jetzt ihren eigenen
Versatz. Die Gegenprobe hat das gemeldet (181 von 182).

## 2026-10-11 – Ansicht „Darunter": von drinnen statt von draußen

**Anlass:** „die ansicht darunter sollte eher aussehen wie hier auf dem
bild also quasi als ob man im terrassendach etc drinsteht" (Betreiber,
mit Bildschirmfoto aus dem Lamellendach).

**Was war:** Die Kamera stand AUSSEN vor der Vorderkante und schaute
hinein. Der Grund stand als Kommentar im Code: Die Kugelkamera kann
nicht über 90° hinaus, sonst stünde das Bild auf dem Kopf.

**Was jetzt gilt:** Die Kamera steht DRIN – bei 3 m Tiefe 75 cm vor der
Wand, auf 1,60 m Augenhöhe – und schaut nach draußen und leicht nach
oben. Die Dachunterseite füllt den oberen Bildrand, wie wenn man
darunter steht.

Möglich wird das, weil die Winkelgrenze jetzt **je Ansicht** gilt statt
fest im Code zu stehen. Für diese eine Ansicht darf sie über 90° gehen;
überall sonst bleibt alles wie bisher.

**Zwei Dinge, die vorher auch kaputt waren und jetzt mitgelöst sind:**
Die gewählte Ansicht überlebt eine Maßänderung – sie wird mit den neuen
Maßen neu gerechnet, statt in die Standardlage zu springen. Und wer
selbst dreht, verlässt die Ansicht, damit die Kamera beim nächsten
Neubau nicht zurückspringt.

## 2026-10-11 – Flüssigere Bewegungen ohne sichtbare Änderung

**Anlass:** „prüfe was man machen kann das die bewegungen smooother ohne
laggs werden, aber ohne was am konfigurator kaputt zu machen".

Drei Stellschrauben, alle ohne Folge für das Bild:

| | vorher | jetzt |
|---|---|---|
| Zeichnen | jedes Bild, auch im Stillstand | nur, wenn es etwas zu zeigen gibt |
| Schattenkarte 2048 × 2048, weich | jedes Bild neu gerechnet | nur nach Modell- oder Lichtwechsel |
| Regler ziehen | ganzes Modell je `input`-Ereignis | höchstens einmal je Bild |

Der teuerste Posten war die Schattenkarte: weiche Schatten in 2048 ×
2048 jedes Bild neu, obwohl sich zwischen zwei Änderungen nichts bewegt.

**Das Risiko dieser Optimierung ist ein stehendes Bild** – deshalb
vorsichtig gebaut:
- `frisch` ist ein ZÄHLER, kein Schalter. Jede Änderung setzt ihn auf
  mehrere Bilder, damit auch verzögert eintreffende Texturen mitkommen.
- `neuZeichnen()` verwendet bewusst kein `Math.max`: Läge dort je NaN,
  würde nie wieder gezeichnet.
- Beim Ziehen und beim Drehen wird immer gezeichnet.
- Vier Prüfungen halten die Pflichtstellen fest, an denen die Flagge
  gesetzt sein MUSS (Kamera, Größenänderung, zwei Texturpfade).

**Nicht angefasst:** `setPixelRatio` bis 2. Auf hochauflösenden
Bildschirmen wären das viermal so viele Bildpunkte, und ein Absenken
beim Ziehen würde man sehen. Das wäre der nächste Hebel, wenn es immer
noch hakt – aber nicht ungefragt, weil es die Bildschärfe kostet.

## 2026-10-11 – „Was daraus folgt" verschwindet, statt sich zu entschuldigen

**Anlass:** „lass das weg" (Betreiber, mit Bildschirmfoto des Kastens).

**Was war:** Bei Produkten ohne Herstellerzahlen stand der Kasten da und
sagte zweimal dasselbe – einmal als Listenzeile, einmal als Kleingedrucktes
darunter: es lägen keine Zahlen vor, die Darstellung sei eine Skizze.

**Was jetzt gilt:** Ohne Zahlen ist der Kasten **ganz weg**. Mit Zahlen
erscheint er wie bisher.

**Warum so:** Ein Kasten, der nur erklärt, dass er nichts zu sagen hat,
verunsichert beim Produkt, statt zu informieren – und das zu Unrecht: Das
3D-Modell ist auch ohne Matrix nach den Regeln gezeichnet, und für TDS,
SkyView und Flat Line kommen die Stückzahlen seit dem 11.10. ohnehin aus
`js/masstabelle.js`. Der Kasten fehlt nur dort, wo es wirklich nichts
Belegtes zu zeigen gibt.

**Mitgeändert:** Der Satz unter den Maßreglern verwies auf „siehe ‚Was
daraus folgt'" – ein Verweis auf etwas, das fehlen kann. Der Verweis ist
raus, die Aussage (abgerechnet wird nach dem nächsten Rasterfeld) bleibt.
Die Gruppenregel `geschaetzt` wird nicht mehr gebraucht und ist entfernt.

**Gegenzulesen:** Bei einem Produkt **ohne** Matrix (Carport TDS, Flat Box)
darf rechts kein leerer gelber Kasten stehen; bei TDS mit Maßen muss er
vollständig erscheinen.

## 2026-10-11 – „Wände verkleiden?" war ein leerer Schritt an der falschen Stelle

**Anlass:** „diese seite macht nix und ist ohnehin da falsch, das gehört zu
der abteilung wo man auch senkrechtmarkise etc auswählt" (Betreiber, mit
Bildschirmfoto von Schritt 9 von 11 – Überschrift, Untertitel, sonst nichts).

**Warum sie leer war:** Das Überspringen leerer Schritte hängt an den
**Gruppen**, nicht am Abschnitt. Der Abschnitt „Verkleidung" war beim
Terrassendach ausgeblendet, die Gruppe darin hatte aber **kein eigenes
`data-k3d-fuer`** – sie galt damit als sichtbar, der Schritt als „hat
Inhalt" und wurde angezeigt. Zu sehen war trotzdem nichts, weil der
Abschnitt drumherum weg war.

**Was jetzt gilt:** Die Verkleidung steht im Abschnitt **„Seiten &
Erweiterungen"** und im Schritt „Sollen Seiten geschlossen werden?" – dort,
wo auch Senkrechtmarkise und Schiebeelemente gewählt werden. Es ist
dieselbe Frage: was passiert mit den Seiten. Der eigene Schritt ist weg,
die Führung hat noch zehn statt elf Schritte.

Der Abschnitt zeigt sich jetzt auch beim Carport (`data-k3d-fuer="terrasse
pergola verkleidung"`), und im zugeklappten Kopf steht **nur das, was zum
Produkt gehört** – sonst stünde beim Carport „offen" (Seiten) neben der
Verkleidung.

**Die eigentliche Lehre** steckt in der neuen Prüfung: *In einem
produktabhängigen Abschnitt braucht jede Gruppe ihr eigenes Stichwort.*
Sonst entsteht wieder ein Schritt, der sich nicht überspringen lässt und
leer dasteht. `scripts/pruefe-fuehrung.js` prüft das jetzt für **alle**
Abschnitte, nicht nur für diesen einen Fall.

**Gegenzulesen:** Beim Carport müssen die Verkleidungs-Häkchen in „Seiten &
Erweiterungen" stehen und wirken; beim Terrassendach darf es den Schritt
„Wände verkleiden?" nicht mehr geben.

## 2026-10-11 – Plankenwand nach den echten Profilen

**Anlass:** Der Betreiber hat die Herstellerzeichnungen geschickt:
Rechteckprofil 25 × 70 (**70,4 × 25,3 mm**, BELEGT) und den **Winkel
40 × 20**, der an die Pfosten kommt – „an diesen winkeln werden die
planken bzw rechteckprofile geschraubt". Dazu die Oberflächen: Eiche
Mocca, Rovere Pechino hell, oder RAL 7016 / 9006 / 9007 / 9010.

**Was war:** Die Planken waren 140 mm hohe Paneele mit 12 mm Fuge – ein
Wert von unserer eigenen Produktseite, also für ein anderes Bauteil. Die
Winkel fehlten ganz.

**Was jetzt gilt:**

| | Wert | Grundlage |
|---|---|---|
| Sichtbare Plankenhöhe | 70,4 mm | Zeichnung |
| Plankendicke | 25,3 mm | Zeichnung |
| Winkel am Pfosten | 40 × 20 mm | Zeichnung |
| Materialstärke des Winkels | 2 mm | **GESCHÄTZT** |
| Zielfuge der Automatik | 10 mm | **GESCHÄTZT** |

**Die Teilung** (Betreiber: „anhand der terrassenüberdachung lichten maße
wo die planken hinkommen, und an den maßen der planken sollen sie
gleichmäßig verteilt werden"): Die Fuge ist **kein fester Wert**.
Gerechnet wird andersherum – wie viele Planken passen in das lichte Maß,
wenn die Fuge ungefähr 10 mm sein soll? Diese Zahl wird gerundet, danach
ergibt sich die Fuge aus dem Rest. Unterste und oberste Planke liegen
damit immer bündig am Rand, alle Fugen sind gleich breit. Bei fester Fuge
bliebe oben je nach Höhe ein unterschiedlich breiter Streifen offen.

Nachgerechnet über 201 lichte Höhen von 600 bis 2600 mm: Jede geht exakt
auf. Die Gegenprobe rechnet mit fester Fuge – und schlägt an.

**Einstellbar** (Betreiber: „der abstand soll wie bei glasschiebewände der
perfekte automatisch berechnet werden aber man kann es dann einstellen"):
Häkchen „Fuge automatisch berechnen" ist gesetzt, der Regler gesperrt.
Haken weg → Regler 0 bis 60 mm. **0 ist ein eigener Fall:** bündig
aufeinander, ohne Verteilung – sonst zöge die Verteilung die Planken
wieder auseinander, obwohl „bündig" gewählt wurde.

Was gebaut wurde (Zahl der Planken und tatsächliche Fuge), liest das
Bedienfeld aus dem **fertigen Modell** zurück, nicht aus der Eingabe –
derselbe zweite Weg wie bei den Schiebeanlagen.

**Oberfläche:** eigene Auswahl, unabhängig vom Gestell. Die beiden
Holzdekore sind im Modell **Farbwerte nach den Produktbildern,
GESCHÄTZT** – ein Dekorbild des Herstellers haben wir nicht, die Maserung
fehlt deshalb. Im Bedienfeld steht das als Satz („die Maserung sehen Sie
am Muster").

**In der Anfrage-Mail** stehen Profil, Winkel, Oberfläche und Fuge in
Fachbegriffen – danach wird kalkuliert.

**Offene Rückfragen:**
1. **Materialstärke des Winkels 40 × 20** – 2 mm angenommen.
2. **Welcher Schenkel liegt am Pfosten?** Im Modell der lange (40 mm) in
   der Wandebene, der kurze (20 mm) zeigt nach innen hinter die Planken.
   Aus der Zeichnung geht es nicht hervor.
3. **Übliche Fuge** – 10 mm angenommen; davon hängt ab, was „automatisch"
   baut.
4. **Dekorbilder** Eiche Mocca und Rovere Pechino hell, damit die Maserung
   ins Modell kommt.

## 2026-10-11 – Plankenwand nur halb hoch

**Anlass:** „noch nen schieberegler normal steht er genau in der mitte, und
man kann ihn nach links oder rechts ziehen und dadurch werden entweder von
unten oder von oben planken entfernt, also quasi wenn jemand nur zur hälfte
planken will oder nur 2/3 etc."

**Was jetzt gilt:** Ein zweiter Regler unter den erweiterten Einstellungen,
in der Mitte auf „volle Höhe". Nach links bleiben die **unteren** Planken
stehen und oben wird frei, nach rechts umgekehrt. Ganz außen bleibt immer
mindestens eine Planke.

**Der Kniff, der leicht falsch gemacht wird:** Die Teilung bleibt die der
**vollen** Höhe. Es werden nur Planken weggelassen, die übrigen werden
nicht gestreckt. Sonst änderte sich mit dem Regler auch die Fuge – die
halbe Wand sähe anders aus als die ganze, und zwei Seiten mit
unterschiedlicher Höhe hätten unterschiedliche Fugen.

Die Winkel stehen nur dort, wo auch Planken hängen – sie tragen sie ja.

**Gegenprobe:** Die Prüfung rechnet in der Gegenprobe mit vertauschtem
Vorzeichen. Das ist genau der Fehler, der sonst durchginge: Die Zahl der
Planken stimmt, nur die Seite ist falsch.

**In der Anfrage-Mail** steht bei Teilhöhe, wie viele von wie vielen
Planken gebaut werden, die Höhe in Millimetern und ob ab Boden oder unter
dem Dach.

## 2026-10-11 – Planken gibt es nur bis 7 m am Stück

**Anlass:** „maximale länge einer planke sind 7m mximales lieferbares maß,
geht es darüber muss es gleich aufgeteilt werden mit zwischenprofil"
(Betreiber).

**Was jetzt gilt:** Über 7 m lichter Länge wird die Wand in **gleich lange**
Felder geteilt, an jeder Stoßstelle steht ein senkrechtes Zwischenprofil.
Bei 9 m sind das zwei Felder zu 4480 mm, nicht 7000 + 2000.

**Warum gleichmäßig und nicht „volle Planke plus Rest":** Zwei gleiche
Felder sehen aus wie gewollt, ein schmaler Reststreifen am Ende wie ein
Fehler. Technisch ginge beides.

Das Zwischenprofil geht nur über die Höhe, die die Planken wirklich
einnehmen – bei halbhoher Wand also nicht weiter.

**Nachgerechnet** über alle Längen von 1 bis 24 m in 10-cm-Schritten: kein
Feld länger als 7 m, alle Felder gleich lang, und Felder plus Profile
ergeben wieder genau die lichte Länge. Die Gegenprobe rechnet mit „volle
7 m, Rest hinten dran" – und schlägt an.

**GESCHÄTZT:** die Breite des Zwischenprofils, hier 40 mm wie der Schenkel
des Winkels, damit es im Bild zusammenpasst. Als Rückfrage notiert.

**In der Anfrage-Mail** steht bei geteilter Wand, in wie viele Felder zu
welcher Länge geteilt wird.

## 2026-10-11 – Teilhöhe: Standard-Häkchen, Maßangabe, Winkel an der Planke

**Anlass (drei Dinge in einem):** „mach bei höhe auch ein häckchen für
standart (automatisch), und die winkel sollen auch nur so hoch gehen wie
die planken nicht höher, niedriger" sowie „und natürlch auch maß anzeigen
wv mm die entweder von unten sind die planken bis zur ausgewählten höhe
und von oben andersherum auch".

**1. Häkchen „Standard: ganz zugesetzt"** – wie bei der Fuge. Gesetzt ist
es volle Höhe, der Regler ist gesperrt.

**2. Maßangabe.** Neben dem Regler steht jetzt die Höhe in Millimetern
(„1240 mm ab Boden"), nicht mehr nur „von unten". In der Zeile darunter
zusätzlich, **was offen bleibt**: „980 mm hoch ab Boden (1020 mm bleiben
oben frei)". Beide Zahlen kommen aus dem fertigen Modell, nicht aus der
Eingabe.

**3. Winkel.** Sie standen schon seit der Teilhöhe auf Plankenhöhe – aber
über eine **zweite Rechnung** daneben. Das läuft früher oder später
auseinander. Jetzt werden Unter- und Oberkante beim Zeichnen der Planken
**mitgeschrieben** und genau so an den Winkel weitergegeben: Er kann gar
nicht mehr höher stehen als die Planke, die er trägt.

**Gegenzulesen:** Bei halbhoher Wand darf über der obersten Planke kein
Winkelstück stehenbleiben – von schräg oben schauen.

## 2026-10-11 – Was das VD-Anfrageformular SG23 korrigiert hat

**Anlass:** Der Betreiber hat das Bestellformular „SG23 SlideGlas
Schiebeelemente" geschickt. Vier Dinge daraus, drei davon waren vorher
falsch oder fehlten ganz.

**1. Griffhöhe 1100 mm, nicht 1050.** Im Formular angekreuzt: „1100 mm
Standard", daneben ein Feld „andere Höhe ___ mm". Die 1050 mm stammten
aus einer Netzrecherche zur üblichen Drückerhöhe und waren als Annahme
gekennzeichnet – 50 mm daneben, und am Modell sichtbar. **BELEGT.**

**2. Es gibt genau zwei Glasarten:** ESG 10 mm klar und ESG 10 mm
satinato. Damit ist die offene Frage „soll ESG grau wählbar sein?"
beantwortet: **Grau gibt es nicht.** Beide sind jetzt wählbar; satinato
ist im Modell deutlich weniger durchsichtig, rauer und ohne Spiegelung –
sonst sähe es aus wie klares Glas mit Schleier. Die 10 mm im Modell
waren richtig.

**3. Die Blickrichtung.** Im Formular rot hervorgehoben: **„Ansicht der
Elemente von Innen gesehen!"** Unser Modell benennt die Seiten ebenso,
aber in der Anfrage-Mail stand das nirgends. Dieselbe Angabe lässt sich
spiegelverkehrt lesen, und das merkt niemand vor der Montage. Steht
jetzt als eigene Zeile in der Mail und als Satz am Schloss-Feld.

**4. Zwei Bestellpositionen fehlten:** das **Schloss** (links oder
rechts, stückweise) und die **Bürstendichtung** („Bürstenprofil inkl.
Bürsten 2500 mm", stückweise). Das Schloss ist jetzt wählbar – es wird
im Modell NICHT gezeigt, das steht auch so im Bedienfeld. Die
Bürstendichtung steht als Position in der Mail, mit der Lieferlänge
2500 mm und dem Zusatz „Bedarf nach Aufmaß": Wie viele Stangen gebraucht
werden, hängt an der Aufteilung und wird hier nicht geraten.

**Nicht übernommen:** Preise stehen keine im Formular, und die
Kundendaten-Felder gehen uns nichts an.

**Was ich NICHT sicher lesen konnte:** die genauen Flügelzahlen je
Ausführungsbild. Unsere Bauartentabelle stammt aus der Preisliste und
sieht stimmig aus – geprüft ist sie damit nicht. Bleibt offen.

## 2026-10-11 – Velaris war in der Hauptachse falsch

**Anlass:** „velaris haben wir noch garnicht modeliert" (Betreiber), dazu
das VD-Bestellformular Velaris und die Produktseite.

**Was war:** Der Konfigurator zeichnete **senkrechte** Lamellen ohne
Rahmen, die sich um die Hochachse drehten. Die Produktbilder zeigen das
Gegenteil: einen Aluminiumrahmen mit **waagerechten** Lamellen, die um
ihre Längsachse kippen, und oben ein Kopfprofil.

**Was jetzt gilt – BELEGT aus dem Bestellformular:**

| | |
|---|---|
| Element | 500 bis 1500 mm breit |
| Anlage | höchstens 7000 mm |
| feststehend | 1 bis 5 Elemente |
| verschiebbar | 1 Schiene/1 Element, 1/2, 2 Schienen/2, 2/3, 2/4, 3/3 |
| Bautiefe oben | 61,3 / 112,6 / 163,9 mm bei 1 / 2 / 3 Schienen |
| Bautiefe unten | 51,2 / 102,5 / 153,8 mm |
| Rahmenfarbe | die vier bekannten RAL-Töne |
| Lamellenfarbe | Anthrazit oder Holzoptik Golden OAK |

Breitere Seiten teilt der Konfigurator in gleich breite Elemente – so
wenige wie möglich, keines über 1500 mm. Unter 500 mm lichter Breite gibt
es kein Velaris; das Modell zeichnet dann nichts.

**Teilöffnung** („man kann velars teilöffnen also den unteren oder oberen
teil oder alles auf oder zu"): Auswahl ganze Wand / oben / unten, dazu der
Anteil. Die Grenze läuft über die **Lamellenzahl**, nicht über die Höhe –
eine Lamelle lässt sich nicht halb kippen.

**Animation:** Öffnen und Schließen laufen mit derselben Dauer und
derselben weichen Kurve wie Markise und Schiebetür.

**Widerspruch – noch am selben Tag geklärt** (Betreiber mit der
Auswahlseite): Die vier RAL-Standardtöne gelten für den **Rahmen**. Für
die **Lamellen** gibt es genau drei Möglichkeiten: Anthrazit RAL 7016,
Holzoptik Golden OAK oder eine RAL-Sonderfarbe gegen Aufpreis. Im
Konfigurator standen zwischenzeitlich alle vier RAL-Töne zur Wahl – das
war falsch und ist korrigiert. Die Sonderfarbe zeigt das Modell in der
Rahmenfarbe, weil niemand weiß, welche es wird; in der Anfrage steht sie
als offener Punkt mit Aufpreis-Hinweis.

**GESCHÄTZT bleiben:** Ansichtshöhe einer Lamelle (70 mm), Ansichtsbreite
der Rahmenprofile (45 mm), Höhe des Kopfprofils (60 mm) und der Farbwert
der Echtholzoptik. Keines davon steht im Formular.

## 2026-10-11 – Velaris: die Querschnittzeichnung gelesen

**Anlass:** Der Betreiber hat die Maßzeichnung in groß geschickt, dazu
den Satz „Element min 50 cm max. Breite 150 cm" für die schiebbare
Ausführung – was wir schon so hatten.

**Drei Dinge stehen in der Zeichnung, die im Formulartext nicht stehen:**

**1. Der Schienenabstand ist nicht zu raten, er fällt heraus.**
61,3 → 112,6 → 163,9 mm oben und 51,2 → 102,5 → 153,8 mm unten: jeder
Schritt ist **51,3 mm**, oben wie unten derselbe Wert. Zwei unabhängige
Wege zum selben Ergebnis – stärker als jede einzelne Angabe. Das Modell
hatte 51 mm angenommen; jetzt steht die gerechnete Zahl drin, mit der
Rechnung als Prüfung daneben.

**2. Die Elemente hängen.** Über jedem Element sitzt ein kurzer Träger im
Kopfprofil, darunter beginnt erst der Rahmen. Auf den Produktbildern ist
das der dunkle Streifen oben. Das Modell zog den Rahmen bisher bis unter
das Kopfprofil durch.

**3. Die Bodenschiene ist Führung, kein Auflager.** Das Element steht
nicht darauf, es läuft darin. Sie ist flach.

**GESCHÄTZT bleiben** die Höhe der Aufhängung (30 mm) und die Höhe der
Bodenschiene (10 mm) – beides ist in der Zeichnung nicht bemaßt.

## 2026-10-11 – Velaris: die Aufteilungsbilder gelesen

**Anlass:** Die Bilder „Schiebbar" und „Feststehend" von der Produktseite,
dazu der Betreiber: „5 elemente möglich nur bei feststehend, bei schiebbar
nur so".

**1. Verschiebbar endet bei vier Elementen.** Es gibt genau sechs
Kombinationen: 1 Schiene/1 Element, 1/2, 2 Schienen/2, 2/3, 2/4 und
3 Schienen/3. **Fünf Elemente nur feststehend.** Verschiebbar reicht
damit bis 4 × 1500 = 6000 mm Anlagenbreite.

Wer eine breitere Seite verschiebbar wählt, bekommt sie **feststehend**
gebaut und liest den Grund unter dem Regler. Das Modell baut nichts, was
es nicht gibt, aber es verschweigt auch nicht, dass es den Wunsch
geändert hat – und in der Anfrage steht die GEBAUTE Art, nicht die
gewünschte.

**2. Feststehend teilen sich zwei Elemente einen Pfosten.** In der
Zeichnung steht zwischen zwei Feldern ein Profil, nicht zwei
nebeneinander. Vorher zeichnete das Modell beide Rahmen voll – an jeder
Stoßstelle doppelt so breit wie richtig. Verschiebbar hat jedes Element
seinen eigenen Rahmen; dort stimmte es.

**3. Elementbreite: gleichmäßig oder Wunsch.** Das Bestellformular hat
dieses Feld, der Konfigurator jetzt auch. Bei Wunsch-Breite zeigt das
Modell weiter die gleichmäßige Aufteilung – in der Anfrage steht dann
ausdrücklich, dass die Einzelbreiten beim Aufmaß festgelegt werden.

## 2026-10-11 – Lamellenfarbe ohne Wirkung: Feld und Code hießen anders

**Anlass:** „bei oberfläche der lamellen ändert sich nix wenn man es
ändert" (Betreiber).

**Was war:** Das Auswahlfeld schickte `Holzoptik Golden OAK`, die Tabelle
im Code kannte den Schlüssel aber noch unter dem alten Namen
`Echtholzoptik (Golden OAK)` – übriggeblieben aus einer früheren Fassung,
beim Auflösen eines Merge-Konflikts mitgeschleppt. Ein unbekannter
Schlüssel fällt stillschweigend auf die Rahmenfarbe zurück. Bei
Anthrazit-Gestell sahen deshalb **alle drei** Möglichkeiten gleich aus.

**Warum es keine Prüfung gefangen hat:** Die bisherigen Prüfungen haben
das Feld und den Code **getrennt** angesehen – das Feld hatte die
richtigen drei Werte, der Code eine plausible Tabelle. Dass beide nicht
zueinander passen, fiel zwischen die Prüfungen.

**Was jetzt gilt:** Eine Prüfung liest die Werte **aus dem Auswahlfeld**
und sucht für jeden die Entsprechung **im Code**. Sie prüft damit die
Verbindung, nicht zwei Absichten nebeneinander. Dieselbe Falle gibt es
überall, wo ein Feldwert als Schlüssel dient.

## 2026-10-11 – Velaris: Lücke an der Stirnseite, Aufteilung wählbar, Verschieben

**Anlass (drei Meldungen):** „bei den velaris für stirnseite entsteht in
der mitte so ne fslsche lücke die sollte nicht sein, mach am besten bei
elementbreite genauso wie bei schiebeelemente", „bei ausführung
verschiebbar gibts keine animation zum öffnen schließen" und „die
schiebbaren lassen sich wie die glasschiebewände verschieben".

**1. Die Lücke.** Seit die feststehenden Elemente sich einen Pfosten
teilen, lässt das zweite Element sein linkes Profil weg – **der Platz
dafür blieb aber reserviert**. Genau dort klaffte die Lücke. Jetzt
reichen die Lamellen bis an die Elementkante, wenn kein eigenes Profil
davorsteht. Das ist der typische Fehler beim Weglassen: Das Bauteil ist
weg, die Rechnung kennt es noch.

**2. Aufteilung wählbar wie bei den Schiebeanlagen.** Das System rechnet
sie aus, in den erweiterten Einstellungen steht die Liste der
Möglichkeiten – und darin **nur, was lieferbar ist** (jedes Element
500 bis 1500 mm). Die Liste wird aus dem **fertigen Modell** gefüllt,
nicht aus der Eingabe: Erst dort steht das lichte Maß dieser Seite. Ein
Wunsch, der nicht aufgeht, fällt still auf die Automatik zurück; was
wirklich gebaut wurde, steht darunter.

**3. Verschieben mit Animation.** Die verschiebbaren Elemente fahren wie
die Glasschiebewände – erstes bleibt stehen, die übrigen stapeln sich
darauf, gleiche Dauer und Kurve wie überall.

Dabei fiel auf: **Kopfprofil und Bodenschiene gehören zur Anlage, nicht
zum Element.** Sie wurden je Element gezeichnet und wären beim Fahren
mitgewandert. Jetzt zeichnet sie die Anlage einmal über die ganze Länge.

## 2026-10-11 – Velaris teilt sich immer 50/50

**Anlass:** „das kann weg, die velaris sind immer in 2 hälften geteilt
also 50/50" (Betreiber, zum Regler „Anteil davon").

Der Regler ließ 10 bis 90 % einstellen. Das war meine Erfindung – am
Bauteil gibt es nur zwei Hälften. Eine Einstellung anzubieten, die der
Hersteller nicht baut, ist schlimmer als keine: Sie landet über die
Anfrage in einer Bestellung, die so nicht geht.

**Was jetzt gilt:** Zwei Hälften mit je **eigener Stellung** – „man kann
obere hälfte und untere hälfte seprat öffnen/schließen" (Betreiber,
unmittelbar danach). Also zwei Regler mit je eigenen Knöpfen statt eines
Reglers mit Auswahlfeld daneben. Das Auswahlfeld „Was soll sich öffnen?"
ist damit auch weg: Es konnte nur sagen, welche Hälfte gemeint ist –
nicht, dass die andere zu ist. Bei ungerader Lamellenzahl bekommt die
untere Hälfte die eine mehr.

Die Prüfung sieht beides nach: dass der Regler **weg** ist und dass die
Hälfte über alle Lamellenzahlen von 1 bis 60 wirklich die Hälfte ist.

## 2026-10-11 – Velaris: die Aufhängung läuft durch

**Anlass:** „du hast oben nur so ein stück gemacht es is ja durchgehende
schiene pro tür etc, bzw. die 2er 3er schiene is ja durchgehend lichtes
maß" (Betreiber).

Zwischen Kopfprofil und Rahmen saß ein kurzes Stück von höchstens 20 cm
in der Mitte – meine Lesart der Querschnittzeichnung, in der über dem
Element ein schmaler Träger zu sehen ist. Im Querschnitt sieht man aber
nur den **Schnitt** durch ein Teil, das in die Tiefe weiterläuft. Ein
Element, das an einem Punkt hängt, gibt es nicht.

**Was jetzt gilt:** Die Aufhängung läuft über die ganze Elementbreite.
Das Kopfprofil darüber geht ohnehin über die ganze Anlage – es gehört
zur Anlage und wird dort gezeichnet, nicht je Element.

**Die Lehre:** Aus einem Querschnitt lässt sich die Länge eines Teils
nicht ablesen. Derselbe Fehler steckte schon einmal in den
SG23-Profilen, die ich aus Querschnitten um jeden Flügel gelegt hatte.

## 2026-10-11 – Velaris: zwei Elemente auf einem Laufweg stoßen aneinander

**Anlass:** „wenn 2 elemente auf 1 laufweg sind kann man die ja nicht
ineinander schieben die stoßen ja gegeneinander das is noch falsch in der
animation" (Betreiber). Dazu die Bestätigung, dass die drei Querschnitte
die **1er-, 2er- und 3er-Schiene** zeigen – also die Laufwege im Schnitt.

**Was war:** Beim Aufschieben fuhr jedes Element um denselben Betrag,
unabhängig vom Laufweg. Zwei Elemente auf demselben Weg schoben sich
glatt ineinander – im Bild hübsch, in Wirklichkeit unmöglich.

**Was jetzt gilt:** Element i läuft auf Laufweg `i % Schienenzahl`.
Gerechnet wird der Reihe nach, und jedes Element wird an dem gebremst,
das auf **seinem** Weg davor liegt – bündig anstoßen ja, überlappen nein.
An Elementen auf anderen Wegen fährt es vorbei.

Daraus folgt von selbst, ohne Sonderfall:

| | |
|---|---|
| 1 Schiene | nichts bewegt sich – die Elemente stehen schon aneinander |
| 2 Schienen, 3 Elemente | zwei stapeln sich, das dritte stößt an das erste |
| 3 Schienen, 3 Elemente | alle drei stapeln sich |

**Nachgerechnet** über alle sechs Kombinationen des Formulars und den
ganzen Fahrweg in Zehntelschritten: keine Überschneidung auf einem
Laufweg, kein Element außerhalb der Anlage. Die Gegenprobe rechnet ohne
die Bremse – und meldet die Überschneidungen.

## 2026-10-11 – Verschiebbar: nur anbieten, was sich bewegen lässt

**Anlass:** „bei der aufteilung der elemente darfst du bei der
verschiebbaren version nur soviel anbieten wie sich auch wirklich
schieben lassen" (Betreiber, mit „4 Elemente à 713 mm" im Bild).

**Was war:** Das Auswahlfeld bot alles an, was von der Breite her passt –
auch ein oder zwei Elemente. Die stehen aber auf **einem** Laufweg
aneinander und können nirgendwohin. Man hätte „verschiebbar" bestellt
und etwas bekommen, das sich nicht verschieben lässt.

**Was jetzt gilt:** Bei verschiebbar stehen nur **drei oder vier**
Elemente zur Wahl – erst ab drei gibt es zwei Laufwege, und mehr als vier
gibt es nicht. Das ergibt eine lichte Breite von 1500 bis 6000 mm.
Außerhalb davon ist verschiebbar nicht möglich; die Anlage wird
feststehend gebaut, und der Grund steht unter dem Feld und in der
Anfrage.

**Die Prüfung sieht nicht die Liste nach, sondern fährt.** Für jede
angebotene Aufteilung wird der Fahrweg bis 100 % gerechnet und
festgestellt, ob sich überhaupt etwas bewegt. Eine Liste gegen eine
Liste zu prüfen hätte nur meine eigene Annahme bestätigt.

## 2026-10-11 – Holzmaserung für die Dekore

**Anlass:** „finde im netz gutaufösende lizenzfreie texturen für golden
oak und die anderen holzarten z.b bei planken in waagrechter maserung und
baue diese ein" – dazu: „also nur holzarten die wir anbieten keine
andere".

**Was jetzt gilt:** Die Holzdekore sind keine flachen Farbflächen mehr,
sondern haben eine echte Maserung. **Es kommt keine einzige neue Holzart
dazu** – wählbar bleiben genau die drei, die wir führen:

| Bauteil | Dekor |
|---|---|
| Plankenwand | Eiche Mocca · Rovere Pechino hell |
| Velaris | Holzoptik Golden OAK |

**Wie es gebaut ist:** EIN Maserungsbild für alle drei. Quelle
ambientCG.com **Wood049**, Lizenz **CC0** (Eiche, feine waagerechte
Maserung, nahtlos kachelbar, 2K). Für uns entsättigt und aufgehellt
(Mittelwert 0,83), damit die Dekorfarbe darübergelegt werden kann: Die
Maserung bringt die Struktur, die Farbe kommt aus dem Dekor.

**Warum ein Bild und nicht drei:** Drei Bilder wären drei
Behauptungen – wir haben keine Dekorbilder des Herstellers. Ein
neutrales Maserungsbild plus der jeweilige Farbton sagt genau das, was
wir wissen, und nicht mehr. Dass es kein Herstellerdekor ist, steht im
Bedienfeld („maßgeblich bleibt das Muster").

**Zwei Fallen, die dabei lauerten:**
1. **Gestauchte Maserung.** Die Wiederholung folgt dem Seitenverhältnis
   des Bauteils, nicht dessen Fläche. Sonst zöge sie sich auf einer 7 m
   langen Planke zu Streifen. Geprüft über vier Bauteilmaße.
2. **Eine Textur für alle.** Jedes Bauteil bekommt seine **eigene
   Kopie**; sonst teilten sich Planke und Lamelle eine Wiederholung, und
   eine von beiden sähe falsch aus.

Die Textur kommt verzögert. Wer vorher fragt, landet in einer
Warteliste und wird beim Eintreffen nachgetragen – ohne Neubau des
Modells.

## 2026-10-11 – Velaris: Schienen auf den Pfosten, Bodenschiene in den Boden

**Anlass:** „noch gucken die schienen aus den pfosten raus mach es bei
schienen die schmaler als der pfosten sind vermittelt im pfosten und bei
breiteren schienen als der pfosten pfosten außen bündig, bodenschiene ist
im boden barrierefrei eingelassen" (Betreiber).

**Was war:** Kopfprofil und Bodenschiene lagen auf der Elementebene,
16 mm außerhalb der Pfostenachse – sie schauten seitlich heraus. Die
Bodenschiene stand außerdem AUF dem Belag.

**Was jetzt gilt:**

| Schiene | Lage |
|---|---|
| schmaler als der Pfosten (61,3 · 102,5 · 51,2 mm) | mittig auf dem Pfosten |
| breiter (112,6 · 163,9 · 153,8 mm) | außen bündig, der Überstand geht nach innen |

Die Bodenschiene liegt **im** Boden: Oberkante bündig mit dem Belag,
barrierefrei – wie die Bodenschiene der Glasschiebeelemente.

**Mitgezogen:** Die Laufwege werden jetzt ab der **Schienenmitte**
gemessen und liegen symmetrisch um sie herum. Vorher zählten sie ab der
Elementebene – sobald die Schiene versetzt sitzt, hinge das Element
neben seiner eigenen Schiene.

**ACHTUNG, zwei verschiedene Regeln:** Für die **SG23-Schiebeanlagen**
gilt die umgekehrte („schmaler = bündig innen, breiter = mittig",
Betreiber am selben Tag). Beide stehen so im Code, jede mit ihrer
Begründung. Nicht vereinheitlichen, ohne zu fragen.

**Eine Prüfung, die sich selbst korrigiert hat:** Die erste Fassung
erwartete zwei mittige Schienen und bekam drei – 102,5 mm passen auch
noch auf den 110er Pfosten. Jetzt wird gezählt statt angenommen.

## 2026-10-11 – Velaris anklicken, und die Animation ohne Neubau

**Anlass:** „wie bei glasschiebeelementen machen, anklicken öffnet/schließt
das jeweilige modul. und guck was du machen kannst damit die animation
nicht so laggt" – dazu „bei feststehenden velaris kannst du sie bündig
pfosten außen machen".

**1. Anklicken.** Ein Klick auf die Lamellen öffnet oder schließt **die
angeklickte Hälfte**. Welche gemeint ist, steht am Teil selbst, nicht an
der Klickposition – sonst öffnete sich die falsche, nur weil sie
zufällig dahinterliegt. Dieselbe Mechanik wie bei den Glasschiebewänden
und der Markise; in der Klickkette steht Velaris zwischen beiden.

**2. Das Ruckeln.** Die Fahrfunktionen riefen 25-mal je Sekunde
`aendern()` auf – und das baut das **ganze** Modell neu: Dach, Pfosten,
Rinne, Texturen, Schatten. Für eine Drehung von ein paar Lamellen.

Jetzt merkt sich das Modell beim Bauen, welche Lamelle zu welcher Hälfte
gehört und welche Gruppe welches Element ist. Die Animation dreht bzw.
verschiebt nur noch diese Teile und zeichnet; gebaut wird **einmal am
Ende**, damit Zusammenfassung und Anfrage wieder stimmen. Dafür liegt
jedes Element in einer eigenen Gruppe – verschieben heißt dann, eine
Position zu setzen statt Dutzende Teile neu zu erzeugen.

Die Lagenrechnung (welches Element steht bei welchem Öffnungsgrad wo,
samt Bremse auf dem eigenen Laufweg) steht jetzt **einmal** da und wird
von Modell und Animation gemeinsam benutzt. Zwei Kopien wären zwei
Wahrheiten – und beim Fahren sähe man es sofort.

**3. Feststehend liegt die Schiene immer außen bündig** am Pfosten. Dort
gibt es nur eine Schiene, und bündig sieht man von außen nur den
Pfosten. Verschiebbar bleibt es bei der Regel von vorhin: schmaler als
der Pfosten mittig, breiter außen bündig.

## 2026-10-11 – Velaris an der Stirnseite: von der Mitte nach außen

**Anlass:** „auf der stirnseite soll es wie bei glasschiebewände sein bei
zwischenpfosten gehen die module von der mitte nach außen auf"
(Betreiber).

**Was war:** Die Elemente fuhren immer nach links – egal, in welchem Feld
sie standen. An der Stirnseite mit Zwischenpfosten lief damit das rechte
Feld zum Mittelpfosten hin statt von ihm weg.

**Was jetzt gilt:** Die Laufrichtung kommt von der Seite, genau wie bei
den Glasschiebeanlagen: Links vom Mittelpfosten öffnet nach links,
rechts davon nach rechts. An den Seiten bleibt es, wie es war.

**Wie es gebaut ist:** Dieselbe Rechnung, spiegelbildlich – nach rechts
bleibt das LETZTE Element stehen und gerechnet wird von hinten nach
vorn, mit der Bremse auf demselben Laufweg. Kein zweiter Satz Regeln.

**Die Prüfung prüft nicht die Absicht, sondern die Symmetrie:** Nach
rechts geöffnet muss exakt das Spiegelbild von „nach links" sein, und
geschlossen müssen beide gleich sein. Über vier Schienen-Element-
Kombinationen und den ganzen Fahrweg. Die Gegenprobe dreht das
Vorzeichen der Fahrt um.

## 2026-10-11 – Velaris anklicken: ein Ziel, feste Reihenfolge

**Anlass:** „das mit anklicken klappt aber es steuert nur die gradzahl
der lamellen nicht die schiebewand schlag mir eine vernünftige für
kunden verständliche lösung vor" – der Betreiber wählte aus drei
Vorschlägen Variante **B**.

**Verworfen wurde (A):** Lamellen anklicken kippt, Rahmen anklicken
schiebt. Das entspricht zwar der Wirklichkeit, ist aber am Handy nicht
zu treffen – der Rahmen ist 45 mm breit. Wer danebentippt, kippt
stattdessen die Lamellen und wundert sich. Zwei Bedeutungen auf engem
Raum sind keine gute Nachahmung der Glasschiebewand, wo ein Klick nur
eine Bedeutung hat.

**Was jetzt gilt:** Ein Ziel, eine Reihenfolge – so, wie man das Bauteil
auch bedient:

| verschiebbar | feststehend |
|---|---|
| zu → Lamellen offen → Element zur Seite → zu | zu → offen → zu |

Bei feststehenden Anlagen entfällt der Schiebeschritt von selbst, es gibt
also keinen toten Klick. Unter dem Modell steht, was der nächste Klick
tut – in einer eigenen Zeile, die am Handy **sichtbar bleibt**: Die
vorhandene Maus-Zeile wird dort ausgeblendet, und gerade am Handy gibt
es keinen Mauszeiger, der etwas verrät.

**Eine Feinheit:** „Schließen" räumt beides auf – Lamellen zu UND
Elemente zurück. Sonst bliebe die Anlage halb geschoben stehen und der
nächste Klick öffnete wieder; in den Ausgangszustand käme man nie
zurück.

**Die Prüfung spielt die Reihenfolge nach**, statt nur nachzusehen, ob
es sie gibt. Die Gegenprobe behandelt ein feststehendes Element als
schiebbar – dann entsteht der tote Klick, und sie schlägt an.

## 2026-10-11 – Rahmenwand: Glas im Rahmen, mit Sprossen

**Anlass:** „dann machen wir weiter mit rahmenwand" – dazu die
VD-Montageanleitung FR23/FRF23 und die Übersicht der Festelemente.

**Was war:** Die Rahmenwand war eine **undurchsichtige Platte** mit zwei
Kantenprofilen. Die Unterlagen zeigen etwas anderes: einen
Aluminiumrahmen mit **Glasfüllung** – Rahmenprofil, Sprossenprofil,
Glasleiste stehen so in der Teileliste.

**Was jetzt gilt:** Rahmen aus vier Profilen, darin Glas, bei Bedarf
durch Sprossen geteilt. Es gibt genau **acht belegte Aufteilungen**:

| | |
|---|---|
| 1-teilig | ohne Sprosse |
| 2-teilig | 1 waagerechte **oder** 1 senkrechte |
| 3-teilig | 2 senkrechte |
| 4-teilig | 3 senkrechte **oder** 1 senkrechte + 1 waagerechte |
| 6-teilig | 2 senkrechte + 1 waagerechte |
| 8-teilig | 3 senkrechte + 1 waagerechte |

Die Automatik wählt die wenigsten Sprossen, mit denen keine Scheibe zu
groß wird; in den erweiterten Einstellungen lässt sich eine der acht
vorgeben – wie bei den Schiebeanlagen.

**GESCHÄTZT sind alle Profilmaße** (Rahmen 50 mm, Sprosse 40 mm, Bautiefe
50 mm, Glas 8 mm): Die Anleitung **zeigt** die Profile, bemaßt sie aber
nicht.

**Die wichtigste offene Frage:** das **Höchstmaß einer Scheibe**. Meine
Richtwerte (1200 × 1600 mm) sind geraten, und sie bestimmen, wann die
Automatik eine Sprosse setzt. Bei 6 m Feldbreite reicht die größte
dokumentierte Aufteilung ohnehin nicht aus, um darunter zu bleiben –
dort entstehen Scheiben von rund 1480 mm. Ob das zulässig ist, weiß nur
der Hersteller.

**Noch nicht gebaut** (steht in der Anleitung, wäre der nächste Schritt):
das **Fenster FRF23** mit Griff als Teil der Wand und die Ausführung
**mit Neigung**, bei der der Rahmen dem Dachgefälle folgt.

## 2026-10-11 – Rahmenwand ohne Keil geht bis ans Dach

**Anlass:** „wenn kein keil ausgewählt is soll das die wand normal bis
ganz oben gehen also quasi wie mit keil nur ohne waagrechte sprosse"
(Betreiber, mit Bild: Wand endete waagerecht, darüber blieb das Dreieck
offen). Danach: „bei der automatischen auswahl soll keine wagrechte
sprosse sein und die senkrechten sollen sich nach den selben maßen
orientieren wie der keil".

**1. Bis ans Dach.** An den Seiten ohne Keil hört die Rahmenwand nicht
mehr waagerecht auf: Das obere Rahmenprofil entfällt – es wäre genau die
Sprosse, die nicht sein soll –, das Glas geht bis zur Dachschräge, und
darauf liegt ein Rahmenband, das der Schräge folgt.

Das Band wird **wie der Keil** gebaut und mit **derselben Lage und
Drehung** eingesetzt. Damit kann die Schräge nicht in die falsche
Richtung zeigen, ohne dass es auch beim Keil auffiele – eine eigene
Drehung hätte ich nicht nachrechnen können, ohne im Browser zu schauen.

**2. Die Automatik richtet sich nach dem Keil.** Der bekommt alle
**1500 mm** (KEIL_FELD_MAX, belegt) einen Pfosten. Die Wand teilt sich
jetzt nach derselben Zahl – dann stehen Sprosse und Keilpfosten
übereinander statt versetzt. Waagerechte Sprossen setzt die Automatik
keine mehr; von Hand bleiben alle acht Varianten wählbar.

Meine geratenen Richtwerte „Scheibe höchstens 1200 × 1600 mm" sind damit
aus der Automatik verschwunden. Übrig bleibt eine Grenze des
Herstellers: mehr als drei senkrechte Sprossen gibt es nicht, also
höchstens vier Felder. Ab 6 m Seitenlänge wird ein Feld deshalb breiter
als 1500 mm – das ist eine Grenze der dokumentierten Aufteilungen, keine
Rechenschwäche.

**Die Prüfung vergleicht Wand und Keil** bei jeder Länge von 0,5 bis 9 m:
Bis zur Vierfeld-Grenze muss die Feldzahl übereinstimmen. Die Gegenprobe
rechnet die Wand nach einem eigenen Richtwert – dann stehen die Sprossen
versetzt, und sie schlägt an.

## 2026-10-11 – Vierfeld-Grenze gilt jetzt auch für den Keil

**Anlass:** „dann mach beim keil bei 7000 auch 4 felder wenn der
hersteller mehr nicht hergibt" (Betreiber).

**Was jetzt gilt:** Keil und Rahmenwand teilen sich gleich – ein Feld je
angefangene 1,5 m, höchstens aber **vier**. Damit stehen Keilpfosten und
Sprossen über die ganze Seitenlänge übereinander, auch bei 7 m.

**⚠️ Hier stoßen zwei Angaben aneinander**, und das soll nicht untergehen:

| | |
|---|---|
| früher (Betreiber, belegt) | Keil bekommt **je angefangene 1,5 m** eine Unterteilung |
| jetzt (Betreiber) | höchstens **vier Felder**, weil der Hersteller nicht mehr hergibt |

Bei 7 m Tiefe wird ein Keilfeld dadurch **1750 mm** breit, bei 9 m sogar
2250 mm – beides über den früher genannten 1,5 m. Gewollt ist die
gemeinsame Teilung; **ob die breiteren Felder zulässig sind, muss VD
bestätigen.** Der Hinweis steht als Kommentar an der Konstante, damit er
beim nächsten Anfassen auffällt.

Die Vierfeld-Grenze selbst stammt aus den acht Festelement-Zeichnungen:
Mehr als drei senkrechte Sprossen zeigt keine davon.

## 2026-10-11 – Rahmen und Sprossen bis ans Dach, nicht nur das Glas

**Anlass:** „da oben beim dreieck is kein rahmen und der mitelsprossen
geht nicht bis hoch" (Betreiber, mit Bild).

**Was war:** Beim Schritt davor ging nur das **Glas** bis zur
Dachschräge. Die senkrechten Rahmenprofile und die Sprossen hörten dort
auf, wo vorher die Oberkante des Rechtecks lag – im Dreieck stand die
Scheibe ohne Rahmen.

**Was jetzt gilt:** Die senkrechten Profile und jede Sprosse laufen bis
zur Dachunterkante durch. Ihre Höhe wird **an ihrer eigenen Stelle** aus
derselben Funktion geholt, die auch das Dach zeichnet (`dachUk`) – nicht
aus einer zweiten Rechnung. Deshalb treffen sie die Schräge exakt, egal
wie geneigt sie ist.

**Dabei gefunden:** Ohne oberes Profil war die lichte Fläche um eine
Profilbreite zu niedrig angesetzt – Glas und Sprossen endeten 50 mm
unter der Schräge. Die neue Prüfung rechnet mit einer geneigten
Dachunterkante nach und vergleicht Oberkante gegen Dach an fünf Stellen;
sie hat genau diesen Fehler gemeldet, bevor er im Browser auffiel.

## 2026-10-11 – Spalt über den Schiebetüren an der Stirnseite

**Anlass:** „wieso gehen die glaschibetüren an den stirnseiten nicht oben
bis zur rinnenunterknte so entsteht sonst ein spalt" (Betreiber, mit
Bild).

**Der Fehler, in einer Zeile:** Die Oberkante der Seitenelemente war
`hVorn - PROFIL / 2` – also eine **halbe Pfostenbreite**, abgezogen von
einer **Höhe**. Ein Maß aus der Breite in einer Höhenrechnung. Zusammen
mit der Schiebetürführung (35 mm) blieb an der Stirnseite ein Spalt von
rund **90 mm** zum Dach.

An den Seiten fiel es nicht auf: Dort sitzt der Keil darüber und füllt
alles bis zur Schräge.

**Was jetzt gilt:** Oberkante = Rinnenunterkante. `hVorn` ist an dieser
Stelle genau das (der Aufrufer übergibt `hRinne`). Element und Führung
zusammen reichen bis dorthin.

**Die Prüfung rechnet nach**, statt die Zeile zu lesen: Unterkante plus
Elementhöhe plus Führung muss die Rinnenunterkante treffen. Die
Gegenprobe setzt den alten Wert ein und meldet den 55-mm-Spalt.

## 2026-10-11 – Wandprofil TD: liegend, nicht stehend
## 2026-10-11 – Wandprofil TD (zwei Anläufe, der zweite stimmt)

**Anlass:** Der Betreiber hatte das Rechteck hinter dem äußeren Sparren
bemerkt und dazu den Querschnitt geschickt: „das wandprofil sieht in
wirklichkeit so aus, es ist jetzt liegend abgebildet, die geschlossene
seite is eig an der wand, oder bei freistehend am statikträger, und es
ist ein querschnitt waagrecht".

**Was war:** Ein stehender Balken **140 × 90 mm**, Oberkante bündig mit
der Sparrenoberkante. In Form und Lage falsch.

**Was jetzt gilt:** Ein **liegendes** Profil mit **143,6 mm Ausladung**
(BELEGT aus der Zeichnung) – es steht so weit von der Wand ab, die
geschlossene Seite liegt an der Wand bzw. freistehend am Statikträger.

**GESCHÄTZT und als Rückfrage notiert:**
1. die **Höhe** (26,5 mm, am Maßbild abgegriffen – die beiden kleinen
   Maße sind in der geschickten Auflösung nicht sicher zu lesen);
2. die **Lage in der Höhe**: Hier liegt die Oberkante an der
   Sparnunterkante, die Sparren liegen also darauf. Bündig mit der
   Sparrenoberkante wie bisher kann es nicht sein – ein 26,5 mm flaches
   Profil wäre dort verschwunden.

**Drei Prüfungen mussten mitwandern**, weil sie den alten Balken
festhielten (gleiche Tiefe, einmaliges Zeichnen, Oberkante am Dach). Sie
prüfen jetzt dasselbe an der neuen Form; die Begründung steht jeweils
dabei. Eine Prüfung, die den Fehler festschreibt, ist schlimmer als
keine.

### Nachtrag am selben Tag: der Querschnitt war falsch herum gelesen

Der Betreiber hat die Zeichnung **aufrecht** gestellt: „so wäre es quasi
richtig wenn links die wand wäre." Damit ist klar, was das lange Maß ist:

| | |
|---|---|
| **143,6 mm** | **Höhe** des geschlossenen Rückens an der Wand (BELEGT) |
| rund 31 mm | Ausladung der Schenkel nach vorne (GESCHÄTZT) |

Meine erste Lesart hatte die Zeichnung genommen, **wie sie auf dem Blatt
lag** – 143,6 mm waagerecht als Ausladung, 26,5 mm hoch. Die Oberkante
hatte ich dafür extra unter die Sparren gelegt, weil ein so flaches
Profil oben verschwunden wäre. Beides zurückgenommen: Das Profil steht
wieder aufrecht, Oberkante bündig mit der Sparrenoberkante, der Rücken
an der Wand bzw. am Statikträger.

**Was daraus zu lernen ist:** Ein Querschnitt sagt nichts über die
Einbaulage. Genau dieser Fehler steckte vorher schon in den
SG23-Profilen und in der Velaris-Aufhängung. Das Maßbild zeigt die Form,
die Montage zeigt die Lage – und nur der Betreiber kennt beide.

Die Prüfungen wurden ein zweites Mal nachgezogen; sie halten jetzt die
aufrechte Lage fest. Der Statikträger (189 mm) steht damit noch 45 mm
unter dem Wandprofil hervor.

### Und noch ein Nachtrag: das Profil endet an der Eindeckung

„in die untere hälfte kommen die sparren und oben drüber halt glas,
glasleisten etc." (Betreiber).

Das Profil hört also **nicht** an der Sparrenoberkante auf: Unten liegen
die Sparren darin, darüber das Glas mit seiner Leiste. Die Oberkante
hängt jetzt an der **Glasoberseite**.

Nachgerechnet mit den Maßen, die im Modell stehen: 143,6 mm Profil,
120 mm Sparren, 8 mm Glas – bleiben **16 mm** für Glasleiste und Luft.
Das passt zur Beschreibung, bestätigt sie aber nicht: Wie hoch die
Glasleiste wirklich baut, steht in keiner Unterlage. Falls die Sparren
in Wahrheit niedriger sind, verschiebt sich das.

## 11.10.2026 – Wandprofil: Sparren beginnen vor dem Profil, nicht darin

**Anlass.** „kannst du das wandprofil noch richtig machen jetzt liegt es
waagrecht im 3d unter den sparren, es muss ja hinten an den sparren dran
sein" (Betreiber). Die Maße aus dem Querschnitt waren seit PR #346
richtig – 143,6 mm hoch, Oberkante an der Eindeckung –, die LAGE nicht.

**Was falsch war.** Die Sparren begannen bei z = 0, also an der
Mauerflucht – genau dort, wo das Profil steht. Die ersten 31 mm jedes
Sparrens lagen damit im Profil. Sichtbar blieb nur der Rand, der unten
15,6 mm heraussteht: ein durchgehendes waagerechtes Band unter den
Sparren über die ganze Breite. Dass dahinter ein aufrechtes Profil
steht, war nicht zu sehen. Dazu wurde die Dachoberkante an einer frei
gewählten Stelle gerechnet (45 mm vor der Wand statt am Sparrenende),
weshalb das Dach dort 6 mm über der Profiloberkante stand.

**Was jetzt gilt.** Das Profil steht an der Wand (z = 0 bis 31 mm), die
Sparren fangen an seiner Vorderkante an und sind mit der Stirnseite
daran angeschraubt. Die Dachoberkante hängt am Sparrenende, dadurch
schließt die Profiloberkante genau mit der Glasoberseite ab. Die
Scheibe reicht hinten bis an das Profil; der frühere Rücksprung von
10 mm wäre jetzt ein offener Schlitz unter der Glasleiste (vorne bleibt
er, dort läuft das Wasser über die Rinne).

**Was gegengelesen werden soll.** Von innen an der Wand entlang: ein
aufrechtes Profil zwischen Mauer und Sparrenköpfen, kein waagerechtes
Band unter den Sparren, kein Spalt zwischen Scheibe und Profil.

**Prüfungen.** `scripts/pruefe-masstabelle.js` jetzt 189 Prüfungen,
Gegenprobe 189 von 189. Neu darin, jeweils gegen die ALTE Rechnung
gegengeprobt: Sparrenanfang an der Profilvorderkante, Profiloberkante
gleich Glasoberseite am Sparrenende, Glashinterkante ohne Schlitz
(Zahl aus der gebauten Formel zurückgelesen, nicht aus der Absicht).

## 11.10.2026 – Sonnensegel und Plissee nach den Bestellformularen

**Anlass.** „sonnensegel und plisees sind noch falsch abgebildet hier die
bestellformulare dort sind maße und bilder" (Betreiber), dazu die beiden
VD-Bestellformulare.

**Was die Formulare sagen.**
*Sonnensegel:* bestellt wird je Bahn Breite und Länge in cm, bis zu 15
Bahnen. Stofffarben: Platin, Perlmutt, Gold, Taupe, Grau. Dazu „ohne /
mit Verstärkung", die Installationsart (Holz oder Aluminium/Stahl) und
eine Teleskopstange (ja/nein). Die Fotos zeigen Bahnen UNTER dem Glas,
die zwischen den Aufhängungen in Wellen durchhängen.
*Plissee:* Breite × Tiefe in mm, Anzahl der Bahnen, Bedienstab 120 cm in
Weiß oder Schwarz. Gestellfarben Weiss, Alu, Anthrazit, Schwarz;
Stofffarben Weiss, Hellgrau, Grau, Anthrazit, Hellbeige, Braun. Die
Zeichnung zeigt Falten quer über die Breite, gestapelt über die Tiefe,
zwischen zwei seitlichen Schienen.

**Was falsch war.** Das Sonnensegel lag ÜBER dem Dach (16 cm über der
Sparrenoberkante) und bestand aus fünf geraden Streifen über die ganze
Breite – gespannt statt durchhängend und auf der falschen Seite des
Glases. Das Plissee bestand aus versetzten Kästchen ohne Schienen. Beide
rechneten ihre Felder aus dem Richtwert 110 cm Sparrenabstand statt aus
den wirklichen Sparren.

**Was jetzt gilt.** Beide sitzen in den echten Sparrenfeldern (die
Achsen kommen aus dem Dachbau), hängen an der Sparrenunterkante und sind
je Bahn EINE verformte Fläche statt bis zu zwanzig Kästen – das ist auch
im Bild schneller. Das Segel hängt in Wellen durch (Wellenlänge 65 cm,
Durchhang 11 cm, beides GESCHÄTZT aus den Fotos), das Plissee hat Falten
quer zur Tiefe und je Sparren eine Schiene in Gestellfarbe. Wie bei den
Markisen bleibt bei 0 % das zusammengeschobene Paket hinten stehen –
montiert ist es ja trotzdem.

**Nicht gebaut, bewusst.** Die Auswahlfelder aus den Formularen
(Stofffarbe, Gestellfarbe, Bedienstab, Verstärkung, Installationsart,
Teleskopstange, Bahnenzahl) gibt es im Bedienfeld noch nicht. Im Modell
steht solange Perlmutt (Segel), Hellgrau auf Alu (Plissee). Das ist ein
Vorschlag an den Betreiber, keine stillschweigende Lücke.

**Was gegengelesen werden soll.** Von unten unter das Dach schauen:
Segel in Wellen unter dem Glas, Plissee flach mit sichtbaren Schienen.
Regler auf 0 %: nur das Paket hinten und (beim Plissee) die Schienen.

**Prüfungen.** `scripts/pruefe-markise.js` jetzt 151 Prüfungen,
Gegenprobe 151 von 151. Die Farblisten werden gegen die aus dem Formular
abgeschriebenen Listen gehalten (Gegenprobe: eine Farbe, die es nicht
gibt), die Tuchform wird ausgerechnet statt behauptet.

## 11.10.2026 – LED-Spots: sichtbar, ohne die äußersten Sparren, nach Set verteilt

**Anlass.** „die ledspots werden in den sparren leider nicht angezeigt, an
die äußersten sparren sind keine led spots möglich, die led spots müssen je
nach kundenwahl 6,8,12 perfekt wie es schön aussehen würde in den sparren
aufgeteilt werden, geht das nicht kann man dem kunden einen kleinen hinweis
anzeigen z.b welche set oder wieviele von welchem led set besser wären."

**Warum man sie nicht sah.** Die Sparrenunterkante wurde ab `T / 2`
gerechnet, die Sparren liegen aber zwischen Wandprofil und Rinne – ihre
Mitte ist `zMitte`. Bei 3 m Tiefe und 8° saß der Spot dadurch 11 mm zu
hoch, also IM Profil. Nachgerechnet in `scripts/pruefe-fuehrung.js`.

**Was jetzt gilt.** Die äußersten beiden Sparren bleiben frei. Die Zahl
der Spots kommt aus dem bestellten Set (6, 8 oder 12 × Anzahl) – vorher
waren es immer zwei je Sparren, unabhängig von der Bestellung. Verteilt
wird gleich viele je Sparren; von mehreren Möglichkeiten gewinnt das
quadratischste Raster, und die genutzten Sparren liegen gespiegelt um die
Mitte. Geht die Zahl nicht auf, steht unter der Set-Auswahl, was gebaut
wurde und welches Set gleichmäßig aufginge.

**Verworfen:** krumme Verteilung (ein Sparren mehr als die anderen). Dann
zeigt das Bild eine Aufteilung, die es nicht gibt. Lieber das nächste
gleichmäßige Raster und ein ehrlicher Hinweis.

## 11.10.2026 – Plissee und Sonnensegel: Lage, Stoffe, versetzte Fahrt

**Anlass.** Drei Rückmeldungen des Betreibers am selben Nachmittag:
„sind in der 3d ansicht zu tief sie sitzen genau zwischen den sparren
sind quasi an den sparren links und rechts jeweils befestigt" (mit zwei
Bildschirmfotos), „fehlen ebenfalls die stoffe aus der bestell pdf
jeweils", und „einzeln pro sparrenzwischenraum handbetrieben … deswegen
würde ich bei der animation es so machen das sie nacheinander versetzt
schließen und öffnen".

**Was jetzt gilt.**
*Lage:* Beide hängen nicht mehr unter den Sparren, sondern dazwischen –
oben an den Flanken befestigt, tiefster Punkt über der Sparrenunterkante.
Unter dem Dach ragt nichts heraus.
*Stoffe:* Die Farben aus den Bestellformularen sind wählbar und gehen in
die Anfrage: Segel Platin/Perlmutt/Gold/Taupe/Grau, Plissee
Weiß/Hellgrau/Grau/Anthrazit/Hellbeige/Braun. Geprüft wird, dass jede
Option im Feld auch im Code bekannt ist – derselbe Fehler wie bei den
Velaris-Lamellen, wo eine unbekannte Farbe still auf die Vorgabe fiel.
*Bedienung:* Jede Bahn fährt einzeln, mit 220 ms Versatz zur nächsten.
Das erklärt die Handbedienung ohne Worte; zusätzlich steht der Satz im
Bedienfeld und in der Anfrage-Mail. Gestaucht statt neu gebaut: Falten
und Wellen rücken zusammen, das Modell wird während der Fahrt nicht neu
aufgebaut.

**Was die Prüfung gefunden hat, nicht das Auge.** Die neue Fahrt hieß
`sonneFahren`/`sonneLaeuft` – genau wie die der Markise. Zwei `var` mit
demselben Namen im selben Gültigkeitsbereich: die zweite gewinnt, eine
der beiden Animationen wäre ins Leere gelaufen. Jetzt `bahnenFahren` /
`bahnLaeuft`, und eine Prüfung zählt die Deklarationen.

**Noch offen beim Betreiber:** Gestellfarbe des Plissees, Bedienstab in
Weiß oder Schwarz, Verstärkung und Installationsart des Segels, die
Bahnenmaße. Dafür gibt es noch kein Feld.

## 11.10.2026 – Versatz der Bahnen gehört in die Aufteilung, nicht in die Animation

**Anlass.** „plissees und sonnensegel öffnen in der animation alle noch
gleichzeitig, mach es etwas versetzt" (Betreiber, mit Bildschirmfoto) –
obwohl der Versatz schon eingebaut war.

**Warum er nicht zu sehen war.** Er steckte nur in der ANIMATION: 220 ms
je Bahn, wenn gefahren wird. Gefahren wird aber nur bei einem großen
Sprung. Am Regler kommt der Wert in kleinen Schritten an, und jeder
Schritt wurde sofort für alle Bahnen gleich gesetzt – also bewegte sich
alles gemeinsam, genau wie vorher.

**Was jetzt gilt.** Der Versatz steckt in der Aufteilung selbst: Jede
Bahn hat ihren eigenen Anteil am Gesamtweg (`bahnAnteil`, 0,35 Bahnen
Versatz zur nächsten). Bei 50 % steht Bahn 1 und 2 offen, Bahn 3 bei
68 %, Bahn 4 bei 33 %, Bahn 5 und 6 noch zu. Das gilt am Regler genauso
wie beim Klick – und es ist das richtige Bild: Man geht mit der Stange
die Felder nacheinander durch. Bei 0 % sind alle zu, bei 100 % alle
offen; nur dazwischen laufen sie versetzt.

**Lehre.** Ein Versatz, der nur in der Animation liegt, verschwindet,
sobald nicht animiert wird. Gehört er zum Zustand, muss er in den
Zustand. Die Prüfung läuft jetzt die echte Funktion und verlangt bei
50 % mindestens drei verschiedene Stände – die Gegenprobe setzt den
Versatz auf 0 und muss anschlagen.

## 11.10.2026 – Restliche Bestellangaben für Plissee und Sonnensegel

**Anlass.** „ja bau restliche" (Betreiber) – auf den Vorschlag, die
übrigen Angaben aus den beiden Bestellformularen einzubauen.

**Was dazugekommen ist.**
*Sonnensegel:* Ausführung (ohne/mit Verstärkung), Befestigung (Holz oder
Aluminium/Stahl), Teleskopstange ja/nein.
*Plissee:* Gestellfarbe (Weiß, Alu, Anthrazit, Schwarz) – sie färbt jetzt
auch die Schienen im Modell – und der Bedienstab 120 cm in Weiß oder
Schwarz.
Alles geht in die Anfrage-Mail und in den Anfrage-Assistenten.

**Die Bahnenzahl wird nicht erfragt.** Das Formular hat ein Feld dafür,
aber sie ergibt sich aus dem Dach: je Sparrenfeld eine Bahn. Gefragt
würde eine Zahl, die der Kunde nicht wissen kann und die dann der
Zeichnung widerspricht. Sie wird deshalb aus dem gebauten Modell
gelesen (`SONNE_IST`) und als „N Bahnen à ca. B × L mm, Aufmaß vor Ort"
in die Anfrage geschrieben; dieselbe Zahl steht als Standzeile im
Bedienfeld.

**Noch nicht abgebildet:** die Verstärkung ist im 3D nicht zu sehen (sie
sind kleine Dreiecke an den Aufhängungen) – sie steht nur in der Mail.

**Prüfungen.** `scripts/pruefe-markise.js` jetzt 167, Gegenprobe
167 von 167. Neu: Jede Option der Gestellfarbe muss im Code bekannt
sein, jede Formularangabe muss in der Anfrage auftauchen, jedes neue
Feld muss auch gelesen werden – genau die drei Fehlerarten, die bei den
Velaris-Lamellen schon einmal passiert sind (Feld sendet einen Wert, den
der Code nicht kennt, und fällt still auf die Vorgabe zurück).

## 11.10.2026 – Statikträger endet bündig mit dem Wandprofil

**Anlass.** „das wandprofil muss oben mit dem statikträger bei
freistehend bündig sein bzw sogar leicht dahinter, damit die glasleisten
nicht überstehen und das wandprofil soll die glasleisten abdecken also
selbe höhe bis zu den glasleisten" (Betreiber, mit Bildschirmfoto).

**Was falsch war.** Der Träger endete an der SPARRENOBERKANTE, das
Wandprofil eine Glasdicke höher. Das Profil stand also über den Träger
hinaus und gab die Glasleiste frei – im Bild eine Kante, die oben
übersteht.

**Was jetzt gilt.** Beide enden auf derselben Höhe: an der Oberkante des
Wandprofils, die über dem Glas liegt und die Glasleiste verdeckt. Bei
hinterem Dachvorsprung bleibt es wie bisher – dort liegt der Träger
unter den Sparren, nicht hinter ihnen.

**Was weiter offen ist.** Die Höhe der Glasleiste selbst steht in keiner
Unterlage. Angenommen ist, dass sie innerhalb der 143,6 mm Profilhöhe
Platz hat: Sparren 120 mm, Glas 8 oder 10 mm, der Rest Leiste und
Luft. Stimmt das nicht, verschiebt sich die Oberkante – dann bitte
melden.

**Prüfung.** `scripts/pruefe-masstabelle.js` jetzt 190, Gegenprobe
190 von 190; die neue vergleicht beide Oberkanten rechnerisch und
rechnet in der Gegenprobe mit der alten Formel.

## 11.10.2026 – Seitenglasleiste TD an den äußersten Sparren

**Anlass.** „die glasleisten an den sparren ganz links und rechts haben
so einen abschluss das man einen sauberen übergang außen hat … hier auf
dem bild is sie liegend, einmal nach rechts drehen, dann is sie richtig
für die rechte seite und gespiegelt für die linke seite" (Betreiber, mit
Teilebild „Seitenglasleiste TD").

**Was falsch war.** Auf allen Sparren lag dieselbe runde Abdeckleiste
(55,3 × 22,6 mm). Außen braucht es ein anderes Teil: eines, das über die
Sparrenflanke herunterreicht und das Dach zur Seite abschließt.

**Was jetzt gilt.** Die beiden äußersten Sparren bekommen die
Seitenglasleiste, 63,1 mm breit und 59,4 mm hoch (BELEGT aus dem
Teilebild). Der Schenkel reicht außen über den Sparren herunter, innen
greift eine Nase aufs Glas. Links ist dieselbe Form, gespiegelt.
Dazwischen bleibt die runde Abdeckleiste.

**GESCHÄTZT bleibt die Form zwischen den Maßen** – Wandstärke, Radius
und die Nase. Das Teilebild ist dafür zu klein; das Umrissmaß stimmt,
die Rundung ist nachempfunden.

**Der Querschnitt steht im Code in der EINBAULAGE**, nicht so, wie er
auf dem Blatt liegt – mit einem Kommentar dazu. Genau diese
Verwechslung ist heute schon dreimal passiert (SG23-Profile,
Velaris-Aufhängung, Wandprofil).

**Prüfung.** `scripts/pruefe-masstabelle.js` jetzt 194, Gegenprobe
194 von 194. Die neue misst den Querschnitt wirklich aus: Sie liest die
Punkte aus dem Code, rechnet den größten Abstand in x und y und
vergleicht ihn mit dem Teilebild – statt nur die Konstante zu lesen.

## 11.10.2026 – „Woran wird befestigt?" fliegt aus dem Bedienfeld

**Anlass.** „diese frage kann weg es is intern" (Betreiber, mit
Bildschirmfoto der Frage).

**Warum sie weg kann.** Das Sonnensegel hängt an unserem eigenen
Terrassendach, und das ist aus Aluminium. Die Frage hat genau eine
richtige Antwort, die der Kunde nicht besser weiß als wir. Jede Frage im
Bedienfeld, die nur eine richtige Antwort hat, kostet den Kunden Zeit
und kann falsch beantwortet werden – das ist der schlechtere Tausch.

**Was bleibt.** Der Wert steht fest im Code und geht weiter in die
Anfrage („Befestigung: Aluminium oder Stahl (unser Dach)"), damit VD ihn
nicht erfragen muss. Nur das Feld ist weg.

**Prüfung.** `scripts/pruefe-markise.js` prüft jetzt beides zusammen:
kein Feld im Bedienfeld, Angabe aber in der Anfrage. Die Gegenprobe
verlangt das Feld zurück.

## 11.10.2026 – Glasleisten: lange Zunge an der Flanke, volle Glaslänge

**Zwei Beanstandungen hintereinander, beide an denselben Teilen.**

**1. „an den äußeren sparren sieht man immer noch den spalt zwischen
sparren und glasleiste, das sollte eig mit diesen endleisten behoben
werden, dafür war in der zeichnung diese lange zunge."**
Die Zunge der Seitenglasleiste bog im ersten Versuch nach INNEN ein und
endete 1,5 mm innerhalb der Sparrenflanke – also in der Luft über dem
Sparren. Der Spalt blieb offen. Jetzt läuft sie bündig an der Flanke
senkrecht nach unten; ihre Spitze liegt 1,0 mm außerhalb der Flanke und
überdeckt den Spalt. Genau dafür ist sie so lang.

**2. „die glasleisten sind jz generell alle zu kurz, die gehen bis
anfang rinne und glas geht ja noch etwas drüber."**
Die Leisten hingen an der SPARRENlänge und endeten an der hinteren
Rinnenwange. Die Eindeckung reicht 118 mm weiter, bis über die Kehle –
dort lag sie frei. Jetzt bekommen alle Leisten Länge und Mitte der
Scheibe: Sie halten das Glas, also gehören sie auf dessen Länge.

**Dazu ein Fehler, den niemand gesehen hätte.** Die linke Leiste wurde
mit einem negativen Maßstab gespiegelt. Das dreht die Flächen nach
innen – sie werden weggeschnitten, das Teil sieht von außen hohl aus.
Jetzt wird zusätzlich die Reihenfolge der Dreiecksecken getauscht.

**Prüfungen.** `scripts/pruefe-masstabelle.js` jetzt 198, Gegenprobe
198 von 198. Neu: Die Zungenspitze wird gegen die belegte Sparrenbreite
gerechnet (Gegenprobe mit dem alten, eingebogenen Wert), und der
Längenunterschied zur Scheibe wird beziffert statt behauptet.

## 11.10.2026 – Die Seitenglasleiste ist dieselbe Leiste, nur mit Zunge

**Anlass.** „ne du hast die äußeren glasleisten jz komplett verändert,
die sehen aus wie die anderen nur mit dieser abschlusszunge,
abschlussprofil was den spalt schließt" (Betreiber).

**Was falsch war.** Aus dem Teilebild war ein eigenes, flaches
Kastenprofil geworden. Dadurch fiel die Dachkante aus der Reihe: innen
halbrunde Leisten, außen ein Kasten.

**Was jetzt gilt.** Außen liegt DIESELBE halbrunde Leiste wie überall
(55,3 × 22,6 mm), nur nach außen um die Zunge verlängert, die den Spalt
zum Sparren schließt. Das Umrissmaß aus dem Teilebild – 63,1 × 59,4 mm –
ist das Maß des GANZEN Teils: in der Breite Halbrund plus Außenwange, in
der Höhe vom Scheitel des Halbrunds bis zur Zungenspitze. Die Zunge
reicht damit 37 mm unter die Glasebene und liegt 1,0 mm außerhalb der
Sparrenflanke.

**Prüfung umgebaut, und das war nötig.** Vorher klaubte sie die Punkte
als Text aus dem Code – das ging schief, sobald im Querschnitt gerechnet
wird (`Math.cos`). Jetzt wird die echte Querschnittsfunktion mit einem
Mini-Shape aufgerufen und ausgemessen: Umrissmaß, Scheitelhöhe und
Breite des Halbrunds, Lage und Tiefe der Zunge. Die Prüfung rechnet
damit dasselbe wie der Browser. `scripts/pruefe-masstabelle.js` 199,
Gegenprobe 199 von 199.

## 11.10.2026 – Höchstmaße 14080 × 7050 mm sind jetzt einstellbar

**Anlass.** „bei tds is die maximale tiefe 7050mm und maximale breite
14080mm warum lässt sich das im konfigurator vor allem bei carport tds
nicht einstellen" (Betreiber).

**Zwei Fehler, die zusammen das Bild ergaben.**

**1. Ein Wert für zwei Dinge.** In der Maßtabelle stand
`tiefeMaxMitUnterzug: 7000` – gemeint war damit der Punkt, ab dem MIT
Unterzug ein Pfosten dazukommt. Der Konfigurator hat diesen Wert
zusätzlich als Höchstmaß benutzt und die Tiefe dort gekappt. Die letzte
Spalte der Tabelle ist aber 7050. Jetzt stehen beide getrennt:
`tiefeMaxMitUnterzug: 7000` (Pfosten dazu) und `tiefeMaxLieferbar: 7050`
(Höchstmaß). Die Regel „Pfosten mit Unterzug = Stützfüße + (Tiefe > 7000
? 1 : 0)" blieb damit unangetastet – sie hätte ohne lieferbare 7050 gar
nie greifen können, was schon ein Hinweis auf den Fehler war.

**2. Der Carport bekam die Grenzen nicht.** `masseSetzen()` stellt beim
Produktwechsel die Regler auf den Maßblock des Produkts (7000 × 4500).
Aufgezogen auf das echte Raster (14080 × 7050) wurden sie nur, wenn sich
der SYSTEMschlüssel ändert – und Carport TDS hat denselben Schlüssel wie
das Terrassendach TDS (`TDS|Glas`). Beim Wechsel blieb es deshalb bei
7000 × 4500. Jetzt werden die Grenzen bei jedem Produktwechsel
nachgezogen.

**Prüfungen.** `scripts/pruefe-masstabelle.js` jetzt 204, Gegenprobe
204 von 204. Neu: Höchstmaß und Pfostengrenze müssen zwei verschiedene
Werte bleiben (Gegenprobe setzt sie gleich), die Reglergrenzen werden
aus der Tabelle nachgerechnet (muss 14080 × 7050 ergeben), und bei
7050 mm muss ein Pfosten dazukommen.

## 11.10.2026 – Schwebende Knöpfe nur über dem Konfigurator ausblenden

**Anlass.** „beim konfigurator stören diese buttons, kannst du es so
umschreiben das diese NUR im bereich des konfigurators ausgeblendet
werden, sobald man aber z.b weiter runter scrollt z.b ab dem footer
sollen die wieder auftauchen" (Betreiber, mit Bildschirmfoto).

**Was jetzt gilt.** Ein Beobachter (`IntersectionObserver`) meldet, ob
der Konfigurator im Bild ist, und setzt dann die Klasse `k3d-im-bild`
auf den Body. Solange sie steht, sind Barrierefreiheits-Knopf,
Konfigurator-Blase und Nach-oben-Knopf ausgeblendet. Scrollt man unter
den Konfigurator – Hinweise, Fußzeile –, kommen sie zurück.

**Warum nicht einfach dauerhaft auf dieser Seite ausblenden.** Der
Barrierefreiheits-Knopf ist die einzige Stelle, an der Schriftgröße,
Kontrast und Bewegung umgestellt werden können. Ihn auf einer ganzen
Seite zu entfernen wäre ein Rückschritt für genau die Besucher, die ihn
brauchen – und bei einer Seite mit öffentlichem Angebot auch rechtlich
kein guter Platz zum Sparen. Deshalb nur im Bereich des 3D-Bildes, wo er
das Drehen und Tippen stört.

**Ohne Beobachter** (sehr alte Browser) bleibt alles sichtbar: lieber ein
störender Knopf als ein verschwundener.

**Prüfung.** `scripts/pruefe-fuehrung.js` jetzt 148, Gegenprobe
148 von 148. Darunter eine, die verbietet, den Knopf später doch
dauerhaft auszublenden.

## 11.10.2026 – Ansichtsleiste am Handy: randlos und flacher

**Anlass.** „die anzeige bitte etwas schmaler machen in der höhe aber
das alles gut lesbar bleibt, aber in der breite bitte von bildschirmrand
zu bildschirmrand" (Betreiber, mit Bildschirmfoto der Leiste
Perspektive / Vorne / Seite / Von oben / Darunter).

**Was jetzt gilt.** Die Leiste läuft am Handy von Rand zu Rand (links
und rechts 0, keine Rundung) und sitzt bündig unten. Der frühere Abstand
von 74 px rechts hielt die Schwebe-Knöpfe frei – die sind im Bereich des
Konfigurators jetzt ausgeblendet, also ist der Platz frei.

**Flacher über die Polster, nicht über die Schrift.** Die Schriftgröße
bleibt bei 0,72 rem; gespart wird an den Polstern (Knopf 7 → 4 px,
Leiste 5 → 3 px). Das ist etwa ein Viertel weniger Höhe, ohne dass etwas
schlechter zu lesen ist. Eine Prüfung hält beides zusammen: randlos UND
Schrift nicht unter 0,7 rem.

**Dazu der Platz für die Streifenleiste des iPhones**
(`env(safe-area-inset-bottom)`) – ohne den liegt sie bei randlosen
Geräten über den Knöpfen.

**Prüfung.** `scripts/pruefe-fuehrung.js` jetzt 150, Gegenprobe
150 von 150.

## 11.10.2026 – Ansichtsleiste: Schalter nach vorn, Sonne und Mond

**Anlass.** „die angaben maße, abend, drehen bitte vor der angabe
perspektive mit trennstrich wie es jetzt schon is, bei Tag/abend sonne
und mond symbol davor" (Betreiber).

**Was jetzt gilt.** Reihenfolge: Maße, Abend, Drehen – Trennstrich –
Perspektive, Vorne, Seite, Von oben, Darunter. Am Handy ist die Leiste
seitlich scrollbar; was vorne steht, sieht man ohne Wischen, und das
sind jetzt die Schalter. Der Abend-Schalter trägt ein Symbol:
Mond, solange der Abend erst kommt, Sonne, wenn man zurück in den Tag
schalten kann.

**Eine Falle dabei.** Die Beschriftung wurde mit
`querySelector('span')` gesetzt – also am ERSTEN span im Knopf. Seit
dort das Symbol steht, hätte das den Mond mit dem Wort „Abend"
überschrieben. Beschriftung und Symbol haben jetzt eigene Klassen, und
eine Prüfung verbietet den alten Zugriff.

**Prüfung.** `scripts/pruefe-fuehrung.js` jetzt 153, Gegenprobe
153 von 153. Die Reihenfolge wird wirklich aus dem HTML gelesen, nicht
nur das Vorhandensein geprüft.

## 11.10.2026 – Bild speichern: am Handy ein Knopf, dafür mehrere Ansichten

**Anlass.** „bei mobile klappen auf handy die ersten 2 symbole nicht
deswegen lass sie auf handy weg, mach den download button bissl breiter
das man sieht bild download, und wenn man draufdrückt kann man direkt
mehrere perspektiven in bilder runterladen" (Betreiber).

**Was jetzt gilt.** Am Handy sind „Bedienfeld" und „Vollbild"
ausgeblendet – das Zuklappen bringt dort nichts, weil das Bedienfeld
unter der Bühne steht statt daneben, und Vollbild gibt es auf iPhones
gar nicht. Der Bild-Knopf wird dafür breiter und behält seine
Beschriftung.

Ein Druck öffnet ein kleines Menü: aktuelle Ansicht, jede der fünf
Ansichten einzeln – oder **alle fünf in einem Bild**, als Blatt mit
Beschriftung und der Konfigurationszeile darunter.

**Warum ein Blatt und nicht fünf Dateien.** Handy-Browser lassen in der
Regel nur einen Download je Tipp zu; der Rest wird still verworfen. Fünf
Downloads hintereinander hätten also so ausgesehen, als funktioniere es
– und vier Bilder wären verschwunden. Das Blatt kommt immer an und lässt
sich als Ganzes weiterschicken.

**Nach dem Speichern steht die Kamera wieder, wo sie war** – auch beim
Sammelbild, das dafür durch alle fünf Ansichten fährt.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 159, Gegenprobe
159 von 159. Darunter: Die Beschriftung darf nicht die Klasse tragen,
die am Handy ausgeblendet wird (sonst ist der Knopf breiter, aber leer),
und im Zweig „alle" darf genau EIN Download stehen.

## 11.10.2026 – Blick von hinten: Hauswand wird durchsichtig

**Anlass.** „sobald man so hinter die wand scrollt soll die wand
durchsichtig werden, man soll aber noch leicht sehen das da ne wand is
aber nicht zu krass" (Betreiber, mit Bildschirmfoto: Die Wand stand wie
eine weiße Platte vor dem ganzen Dach).

**Was jetzt gilt.** Steht die Kamera hinter der Vorderkante der Wand,
schaut sie durch die Wand auf das Bauwerk – dann bleiben 18 % Deckkraft
stehen: genug, um die Mauer als Mauer zu erkennen, wenig genug, um das
Dach zu sehen. Die Grenze kommt aus dem Modell (Wandmitte plus halbe
Tiefe), nicht aus einer festen Zahl; sie wandert mit, falls die Wand
einmal anders steht.

**Zwei Dinge gehen mit.** Die Tür gehört zur Wand und verblasst
ebenfalls, sonst schwebt sie allein im Bild. Und der Schattenwurf der
Wand geht aus – eine durchsichtige Wand mit vollem Schatten sieht aus
wie ein Fehler.

**Infozeile gekürzt.** „die wörter überdachte fläche weg, nur maße und
qm stehen lassen": Oben links steht jetzt nur noch
`5000 × 3000 mm · 15,00 m²`. Die Zeile lief vorher zweizeilig und hat
Platz gekostet, den das Modell besser gebrauchen kann.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 166, Gegenprobe
166 von 166. Darunter eine, die die Grenze nachrechnet (vor der Wand
voll, knapp dahinter durchsichtig), und eine, die die Deckkraft zwischen
10 und 40 % hält – darunter sieht man die Wand nicht mehr, darüber
verdeckt sie weiter die Anlage.

## 11.10.2026 – Unter das Dach schauen: Kamera darf unter den Horizont

**Anlass.** „man kann momentan nicht unter die überdachung scrollen oder
mit der kamera fahren weil der boden blockiert, das soll gehen und der
boden soll nur in diesem kamerabereich für diesen moment durchsichtig
werden … das man gut drunter gucken kann" (Betreiber).

**Was falsch war.** Die Kamera endete knapp über dem Horizont (90° minus
ein Haar). Von außen an die Dachunterseite kam man damit nicht – und
selbst wenn, hätte der Bodenbelag zwischen Auge und Bauwerk gelegen.

**Was jetzt gilt.** Die Kamera darf rund 26° unter den Horizont
(`PHI_MAX_UNTEN`). Nachgerechnet mit 2300 mm Durchgangshöhe und 6 m
Abstand steht sie dann 151 cm unter dem Blickziel – weit genug, um unter
das Dach zu sehen. Weiter nicht: Bei 90° plus einem rechten Winkel
stünde das Bild auf dem Kopf.

Sobald sie unter die Bodenebene fährt, werden Rasen und Belag auf 12 %
heruntergesetzt – nur für diesen Moment, beim Hochfahren ist der Boden
sofort wieder da. Der Bodenschatten geht mit aus; sonst läge er als
dunkler Fleck in der Luft.

**Eine Prüfung musste korrigiert werden.** Sie hielt fest, die
Winkelgrenze werde NUR für die Innenansicht angehoben – das war einmal
richtig und ist es nicht mehr. Statt die Prüfung zu löschen, prüft sie
jetzt die neue Wahrheit: Die Innenansicht geht am weitesten, und keine
Grenze darf so weit gehen, dass das Bild kippt. Eine Prüfung, die den
alten Stand festschreibt, ist schlimmer als keine.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 170, Gegenprobe
170 von 170.

## 11.10.2026 – Kopfzeile und Bild-Knopf so flach wie die Leiste unten

**Anlass.** „die beiden sachen in der höhe bissl schmaler ähnlich wie
die leiste unten wo maße tag abend steht" (Betreiber, mit
Bildschirmfoto).

**Was jetzt gilt.** Am Handy sind Produktzeile und Bild-Knopf auf
dasselbe Maß wie die Ansichtsleiste gebracht: Polster 4 bis 5 px statt 7
bis 8, engere Zeilenhöhe in der Infozeile. Die Schrift bleibt
unangetastet – der Produktname ist weiter die größte Schrift im Bild,
die Maßzeile liegt bei 0,72 rem wie die Knöpfe unten.

**Eine Prüfung festigte eine Zahl statt einer Form.** Sie verlangte für
den Bild-Knopf wörtlich `padding: 8px 14px`. Beim Flachermachen schlug
sie an, obwohl nichts kaputt war. Jetzt prüft sie, was wirklich gemeint
ist: Das seitliche Polster muss mindestens doppelt so groß sein wie das
obere – der Knopf soll breit wirken, nicht hoch. Die Zahlen dürfen sich
ändern, die Form nicht.

**Prüfung.** `scripts/pruefe-fuehrung.js` jetzt 171, Gegenprobe
171 von 171. Die neue vergleicht die Polster von Kopfzeile und Leiste
miteinander und hält die Schrift bei mindestens 0,7 rem.

## 11.10.2026 – Sammelbild hing: fünf Rückrufe, von denen einer ausblieb

**Anlass.** „das erstellen alles 5 bilder in einem bild funktioniert
nicht, steht nur wird erstellt, passiert nix" (Betreiber, mit
Bildschirmfoto).

**Was falsch war.** Das Blatt entstand über fünf `Image`-Objekte: je
Ansicht ein Datenbild erzeugen, dessen `onload` abwarten, und erst beim
fünften fertig melden. Bleibt auch nur ein `onload` aus – und bei
Datenbildern von mehreren Megabyte passiert genau das –, zählt der
Zähler nie auf null und der Knopf wartet für immer. Ein Fehler, der sich
nicht meldet, sondern stehen bleibt.

**Was jetzt gilt.** Es wird gar nichts mehr abgewartet: Eine Leinwand
lässt sich direkt in eine andere zeichnen (`drawImage` mit der
WebGL-Leinwand als Quelle). Fünfmal Ansicht einstellen, zeichnen,
hineinkopieren – alles in einem Durchgang. Damit „Wird erstellt …"
vorher auch wirklich auf dem Schirm steht, startet die Arbeit zwei
Bilder später; und ein `finally` setzt die Beschriftung zurück, falls
unterwegs doch etwas schiefgeht.

**Lehre.** Fünf Rückrufe abzuwarten, von denen jeder ausbleiben kann,
ist fünfmal die Gelegenheit zu hängen. Geht es ohne Rückruf, geht es
ohne Rückruf.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 174, Gegenprobe
174 von 174. Neu: kein `onload` mehr im Sammelbild, die Leinwand wird
direkt kopiert, und der Knopf fällt auch bei einem Fehler zurück.

## 11.10.2026 – Schrift über dem Bild wird abends weiß

**Anlass.** „die angabe muss im abendmodus weiß werden sonst kann man es
nicht lesen" (Betreiber, mit Bildschirmfoto).

**Was jetzt gilt.** Produktname und Maßangabe werden im Abendmodus weiß,
mit weichem Schatten statt eines harten Kastens – so bleibt das Bild
ruhig. Umgeschaltet wird mit einer Klasse an der Bühne, gesetzt in
`stimmung()`: der einen Stelle, an der der Abend ohnehin ein- und
ausgeht. Die Farben selbst stehen im Stilblatt, nicht im Code.

**Warum nicht zwei Stellen.** Es wäre naheliegend gewesen, die Klasse
auch am Abend-Knopf zu setzen. Dann gäbe es zwei Wahrheiten, die beim
nächsten Umbau auseinanderlaufen – eine Prüfung zählt deshalb die
Umschaltstellen und besteht auf genau einer.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 177, Gegenprobe
177 von 177. Darunter eine, die verlangt, dass BEIDE Zeilen hell werden:
Die Maßangabe war die beanstandete, und eine Regel nur für die
Überschrift hätte wie eine Lösung ausgesehen.

## 11.10.2026 – Eckdaten ins freie Feld, „Darunter" weiter weg

**1. Das sechste Feld des Sammelbildes.** „bei dem erstellten bild is ja
unten rechts zumindest bei mobile dieses schwarze freie rechteck, dort
könnte man z.b die wichtigsten eckdaten schreiben" (Betreiber). Dort
steht jetzt „Ihre Konfiguration" mit der vollständigen Liste – Produkt,
Maße, Eindeckung, Farbe, Ausstattung – und darunter der Satz, dass die
Darstellung unverbindlich ist und das Angebot nach dem Aufmaß gilt.

Die Angaben kommen aus `zusammenfassung()`, derselben Liste, die auch in
die Anfrage-Mail geht: keine zweite Quelle, die auseinanderlaufen kann.
Vorher lief sie als winzige Zeile unter dem Blatt und war am Handy nicht
zu lesen. Zu lange Angaben werden gekürzt statt umgebrochen – ein
Umbruch mitten im Satz liest sich schlechter als drei Punkte.

**2. Die Ansicht „Darunter" stand zu nah.** „sollte es so aussehen
rausgescrollt wie auf meinem screen" (Betreiber, mit Bildschirmfoto).
Nachgerechnet: Auf Augenhöhe mitten unter dem Dach waren bei 42°
Bildwinkel nur **1,73 m** Breite im Bild – ein Ausschnitt, kein Dach.
Mit dem doppelten Abstand sind es **4,61 m**, auf breiteren Bildschirmen
mehr. Die Kamera steht dann hinter der Wand und 44 cm über dem Boden;
beides ist kein Problem mehr, seit Wand und Boden in dieser Lage
durchsichtig werden. Hineinzoomen bleibt möglich – bei etwa halbem
Abstand steht man wieder mitten darunter.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 184, Gegenprobe
184 von 184. Darunter: Das Eckdatenfeld muss rechnerisch im Blatt liegen
(Gegenprobe schiebt es hinaus), und die sichtbare Breite der Ansicht
„Darunter" wird aus Bildwinkel und Abstand ausgerechnet – die Gegenprobe
setzt den alten Abstand ein und muss anschlagen.

## 11.10.2026 – Ansichtsleiste wieder etwas höher, Kopfblock entfällt

**1. Die Leiste war zu flach geworden.** „mach diese leiste in der höhe
doch etwas breiter, auf iphone 17 pro is es leicht zu schmal"
(Betreiber). Erst war sie zu hoch, dann auf Wunsch flacher – jetzt der
Mittelweg: 6 px Polster am Knopf statt 4, Leiste 4 statt 3. Das sind
rund 38 px Gesamthöhe, nah an den 44 px, die Apple als Mindestmaß für
eine Fläche zum Antippen nennt. Die Prüfung verlangt jetzt einen
BEREICH (5 bis 7 px) statt einer Zahl: zu flach ist genauso falsch wie
zu hoch.

**2. Der Kopfblock im Bedienfeld ist weg.** „dieser bereich kann weg
damit mehr platz für den konfigurator entsteht … weil is
selbsterklärend, die leute sehen was es is" (Betreiber). Kennzeichnung,
Überschrift und Erklärtext sind entfallen, ebenso ihre CSS-Regeln.

**Die Überschrift ist dabei NICHT verschwunden, sondern umgezogen.** Sie
steht jetzt im Bild selbst (`k3dTitelBuehne`) und nennt dort dasselbe
Produkt. Ohne eine sichtbare Hauptüberschrift ordnet Google die Seite
schlechter ein, und Screenreader verlieren den Einstieg – das wäre ein
stiller Preis für den Platzgewinn gewesen. Verstecken statt umziehen
kam nicht in Frage: Text, den nur Suchmaschinen sehen, ist
Verschleierung und verstößt gegen Googles Richtlinien.

Zwei Prüfungen halten das fest: genau eine Hauptüberschrift, und sie
darf nicht per CSS unsichtbar gemacht werden.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 186, Gegenprobe
186 von 186.

## 11.10.2026 – Schwebeknöpfe kommen am Firmenlogo zurück

**Anlass.** „diese 3 buttons können wieder sichtbar werden auf höhe des
weißen bv firmenlogos" (Betreiber, mit zwei Bildschirmfotos).

**Was falsch war.** Die Knöpfe blieben weg, solange auch nur ein Pixel
des Konfigurators im Bild war. Auf einem hohen Bildschirm steht man
damit schon in der Fußzeile und hat trotzdem keine Knöpfe.

**Was jetzt gilt.** Zwei Beobachter, ein Ergebnis: Versteckt wird nur,
solange der Konfigurator im Bild ist UND das Firmenlogo in der Fußzeile
noch nicht. Sobald das Logo auftaucht, sind die Knöpfe wieder da – auch
wenn der Konfigurator oben noch hereinragt.

**Prüfung.** `scripts/pruefe-fuehrung.js` jetzt 188, Gegenprobe
188 von 188. Darunter eine, die die Bedingung in allen vier Fällen
durchspielt (oben im Konfigurator, Logo im Bild, weit darunter,
Fußzeile) – nicht nur prüft, dass sie dasteht.

## 11.10.2026 – 3D-Bild bleibt am Handy oben stehen

**Anlass.** „ich hätte ganz gerne auf dem handy das die 3d ansicht immer
stehen bleibt, weil wenn man z.b runterscrollt oder weitere
einstellungen öffnet … muss man wieder komplett hoch scrollen um die
änderung zu sehen" (Betreiber).

**Was jetzt gilt.** Am Handy klebt die Bühne oben (`position: sticky`),
45 svh hoch – etwa die obere Hälfte. Darunter scrollt das Bedienfeld.
Wer eine Einstellung ändert, sieht die Änderung sofort, ohne
hochzuscrollen. Die Ansichtsleiste liegt im Bild und bleibt damit
ebenfalls immer erreichbar.

**Warum sticky und nicht fixed.** Sticky klebt nur innerhalb des
Konfigurators. Unterhalb davon – Hinweise, Fußzeile, Impressum – gibt es
die Seite wieder frei. Mit `fixed` läge das Bild über allem, auch über
den Pflichtangaben.

**Warum 45 svh und nicht mehr.** Nimmt das Bild zwei Drittel, bleibt für
das Bedienfeld ein Schlitz von wenigen Zentimetern – dann scrollt man
sich dort zu Tode, und genau das sollte die Änderung ja abstellen. Die
Prüfung lässt deshalb nur 30 bis 50 svh zu. `svh` statt `vh`, weil die
Adressleiste des Handys sonst Teile abschneidet.

**Prüfung.** `scripts/pruefe-fuehrung.js` jetzt 190, Gegenprobe
190 von 190; darunter eine, die `fixed` ausdrücklich verbietet.

## 11.10.2026 – Warum das klebende Bild nicht klebte

**Anlass.** „scheint nicht zu klappen" (Betreiber, mit Bildschirmfoto:
das Bedienfeld gescrollt, kein 3D-Bild oben).

**Der Grund.** In `css/style.css` steht für die ganze Seite
`html, body { overflow-x: hidden }` – eine alte Vorsichtsmaßnahme gegen
waagerechtes Verrutschen einzelner Abschnitte. Genau das macht aus
`html` und `body` einen eigenen Scrollbehälter. Ein Element mit
`position: sticky` orientiert sich dann an diesem Behälter statt am
Fenster – und klebt nie. Von außen sieht es aus, als sei `sticky`
kaputt; tatsächlich hat es nie eine Chance bekommen.

**Was jetzt gilt.** Auf dieser Seite steht `overflow-x: clip` statt
`hidden`. Clip schneidet genauso ab, erzeugt aber keinen
Scrollbehälter. Gesetzt wird es nur hier (`html.k3d-html`,
`body.k3d-app-seite`), damit die übrigen 50 Seiten unberührt bleiben.
Browser, die `clip` nicht kennen, ignorieren die Zeile und verhalten
sich wie bisher – schlimmstenfalls klebt das Bild dort nicht.

**Prüfung.** Eine neue liest `css/style.css` mit: Steht dort die globale
Regel, MUSS auf dieser Seite die Gegenregel stehen. So fällt es auf,
wenn jemand später das eine ändert und das andere vergisst.
`scripts/pruefe-fuehrung.js` jetzt 191, Gegenprobe 191 von 191.

## 11.10.2026 – Sonderfarbe: RAL eingeben, sehen, mitschicken

**Anlass.** „wenn man das wählt soll in dem freien feld rechts daneben
nen feld (optionales feld) auftauchen wo man einen anderen RAL code
eintragen kann, der 3d konfi soll diesen dann berechnen und anzeigen …
und aufpreis hinweis" (Betreiber).

**Was jetzt gilt.** Bei „Andere / Beratung" erscheint ein Feld für die
RAL-Nummer. Erkannt werden „7016", „RAL 7016" und „ral7016". Ist der Ton
hinterlegt, färbt er das ganze Gestell; sonst bleibt das Modell
anthrazit und sagt das auch. In der Anfrage steht „RAL 7016
(Sonderfarbe, aufpreispflichtig)".

**Warum unbekannte Nummern NICHT geraten werden.** Ein falscher Ton ist
schlimmer als keiner: Der Kunde bestellt nach dem, was er gesehen hat.
Hinterlegt sind 53 Töne, die im Metallbau wirklich vorkommen – Grau,
Weiß, Schwarz, dazu die gängigen Bunttöne.

**Die Werte sind Näherungen, und das steht auch da.** RAL ist in Lab
festgelegt; matt, glänzend und Feinstruktur sehen verschieden aus, und
ein Bildschirm kann es ohnehin nur annähern. Im Bedienfeld steht
deshalb: verbindlich ist der RAL-Fächer, nicht das Bild.

**Aufpreis ohne Zahl.** „Sonderfarben sind aufpreispflichtig, den
Aufpreis nennen wir mit dem Angebot" – eine Zahl steht bewusst nirgends:
Sie hängt von Menge und Oberfläche ab, und Preise gehören nach der
Abmachung nicht auf die Seite. Wichtig ist, dass der Hinweis AUCH in der
Anfrage-Mail steht; sonst geht eine Anfrage mit Sonderfarbe durch, als
wäre sie zum Standardpreis zu haben.

**Nebenbei aufgeräumt.** Die Zeile `FARBEN[Z.farbe] || FARBEN['Anthrazit']`
stand an vier Stellen; jetzt steht sie einmal in `gestellFarbe()`. Eine
Prüfung zählt sie – vier Stellen laufen beim nächsten Mal auseinander.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 195, Gegenprobe
195 von 195. Die neue lässt die echte Funktion laufen: vier
Schreibweisen, eine unbekannte Nummer, und der Fall, dass eine normale
Farbe gewählt ist.

## 11.10.2026 – Satinato auch im Keil

**Anlass.** „die glasschiebetüren gibts ja in satinato, hab vergessen
das glas bei den keilen auch" (Betreiber).

**Was jetzt gilt.** Unter „Seiten" gibt es, sobald irgendwo ein Keil
sitzt, die Wahl „Glas im Keil: klar oder satinato". Sie geht ins Modell
und in die Anfrage – satinato ist eine andere Scheibe, nicht nur eine
andere Ansicht.

**Eigene Wahl, nicht an die Schiebeelemente gekoppelt.** Der Keil sitzt
oben: dort geht es um Sonne und Einblick von der Seite. Unten will man
oft klare Sicht in den Garten. Beides zusammenzulegen hieße, dem Kunden
eine Entscheidung abzunehmen, die er so nicht träfe. Eine Prüfung hält
fest, dass die Wahl der Schiebeelemente NICHT auf den Keil abfärbt.

**Nebenbei.** Die Satinato-Rechnung (Deckkraft, Rauheit, keine
Spiegelung) stand nur im Schiebeglas; jetzt steht sie in `satiniert()`
und wird von beiden benutzt. Eine Prüfung zählt die Stelle – zwei
Fassungen desselben Tons würden beim nächsten Mal auseinanderlaufen.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 200, Gegenprobe
200 von 200; die neue lässt die echte Funktion in drei Fällen laufen.

## 11.10.2026 – Warum das RAL-Feld nicht erschien

**Anlass.** „das mit den ralfarben von eben klappt noch nicht"
(Betreiber).

**Der Fehler.** Der Klick auf ein Farbfeld rief `bauen()` und
`textAktualisieren()`. Beide zeichnen neu – aber KEINES von beiden
entscheidet, welche Bedienfelder sichtbar sind. Das macht
`panelAnpassen()`, und das steckt in `aendern()`. Das Feld für den
RAL-Ton tauchte nach dem Klick auf „Andere / Beratung" deshalb gar
nicht erst auf; die ganze Mechanik dahinter war richtig und lief nur
ins Leere.

**Was jetzt gilt.** Der Farbklick ruft `aendern()`. Das zeichnet, liest
die Felder und stellt das Bedienfeld nach – die gewählte Farbe steht in
`Z` und wird dabei nicht überschrieben.

**Lehre.** Eine neue Bedingung in `gruppeGilt()` nützt nichts, wenn der
auslösende Klick die Sichtbarkeit nie neu berechnet. Beim nächsten
optionalen Feld zuerst prüfen: Ruft der Auslöser `aendern()`?

**Prüfung.** Die neue verfolgt die Kette Klick → `aendern` →
`panelAnpassen` und verbietet die alte Abkürzung.
`scripts/pruefe-fuehrung.js` jetzt 201, Gegenprobe 201 von 201.

## 11.10.2026 – RAL-Feld neben den Knopf, und warum 3015 nichts ändert

**Anlass.** „bitte neben den button ‚Andere / Beratung' nicht dadrunter
und die farbe des der konstruktion ändert sich nicht" (Betreiber, mit
Bildschirmfoto: eingetippt war RAL 3015).

**Zur Lage.** Das Feld sitzt jetzt als eigene Zelle IM Farbraster,
direkt hinter dem Knopf – die Zelle daneben war ohnehin leer. Gestrichelter
Rahmen, damit man sieht: gehört dazu, ist aber keine Farbe zum Anklicken.

**Zur Farbe: das ist kein Fehler, sondern eine Lücke.** RAL 3015
(Hellrosa) steht nicht in der Liste der hinterlegten Töne – hinterlegt
sind 53 Farben, die im Metallbau vorkommen, überwiegend Grau, Weiß,
Schwarz und ein paar gängige Bunttöne. Für alles andere zeigt das Modell
weiter Anthrazit.

**Warum ich die fehlenden Werte nicht einfach ergänze.** RAL hat 213
Farben der Classic-Reihe. Ich könnte Zahlenwerte aus dem Gedächtnis
hinschreiben – bei den gängigen Grautönen stimmt das, bei Rosa, Oliv
oder Purpur wäre es geraten. Ein um zwei Nuancen falscher Ton ist
schlimmer als gar keiner: Der Kunde bestellt nach dem, was er gesehen
hat, und reklamiert später die Farbe. Deshalb bleibt es bei den belegten
Werten, bis eine Liste vorliegt (VD-Farbkarte oder die RAL-Werte, mit
denen beschichtet wird).

**Was stattdessen passiert.** Steht die Nummer nicht in der Liste, sagt
das Bedienfeld es jetzt deutlich – gold hervorgehoben statt im Kleingedruckten:
„RAL 3015 können wir im Modell noch nicht darstellen. Das Bild bleibt
anthrazit – lieferbar ist die Farbe trotzdem, sie steht in Ihrer
Anfrage." Vorher stand dasselbe grau und unscheinbar da; deshalb wirkte
die Eingabe wirkungslos.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 203, Gegenprobe
203 von 203; neu: Das Feld muss IM Farbraster hinter dem Knopf stehen,
und der Hinweis muss als Warnung hervorgehoben werden.

## 11.10.2026 – Der RAL-Ton zeigt seinen Namen

**Anlass.** „wenn man ein code eingetragen hat und der erkannt wurde
sollte daneben auftauchen wie er heißt z.b bei 9005 Tiefschwarz"
(Betreiber).

**Was jetzt gilt.** Die Tabelle hält zu jeder Nummer Farbwert UND Namen;
der Name steht unter dem Eingabefeld, sobald die Nummer erkannt ist, und
geht mit in die Anfrage: „RAL 9005 Tiefschwarz (Sonderfarbe,
aufpreispflichtig)".

**Warum das mehr ist als Beiwerk.** Der Name ist die Kontrolle. Eine
vertippte Ziffer fällt am Namen sofort auf – „7106" gibt es nicht,
„7016 Anthrazitgrau" schon. Am Farbfleck allein sieht man das nicht,
und in der Werkstatt wird nach der Nummer beschichtet.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 206, Gegenprobe
206 von 206. Neu: Jeder hinterlegte Ton MUSS einen Namen haben (sonst
steht irgendwann ein leeres Feld da), 9005 heißt Tiefschwarz, und der
Name muss im Bedienfeld wie in der Anfrage auftauchen.

## 11.10.2026 – Warum das RAL-Feld immer dastand

**Anlass.** „das feld etwas breiter und es sollte erst angezeigt werden
wenn man andere ausgewählt hat nicht immer" (Betreiber).

**Der Fehler.** Das Attribut `hidden` wirkt über die Standardregel
`display: none`. Die Zelle hatte eine eigene Regel `display: flex` –
und eine eigene Regel schlägt die Standardregel. Das Feld war also
immer sichtbar, obwohl `hidden` korrekt gesetzt und wieder entfernt
wurde. Dazu kam `.k3d-ral-zelle[hidden] { display: none; }` – damit
greift das Verstecken wieder.

**Breiter.** Die Zelle geht jetzt über zwei Spalten des Farbrasters, und
der Platzhalter heißt nur noch „7016" statt „z. B. 7016" – der war
abgeschnitten. Bei zwei Spalten (sehr schmale Handys) bleibt es bei
einer Spalte, sonst rutscht das Feld wieder unter den Knopf.

**Die Prüfung ist allgemein geworden.** Sie sucht ALLE Bedieneinheiten
mit eigener `display`-Angabe, die über `hidden` gesteuert werden, und
verlangt für jede die `[hidden]`-Regel. Der Fehler kann sich damit nicht
an anderer Stelle wiederholen. Nebenbei hat sie sich selbst korrigiert:
Der erste Entwurf zählte `aria-hidden` mit und meldete einen Balken, der
gar nicht versteckt wird.

**Prüfungen.** `scripts/pruefe-fuehrung.js` jetzt 208, Gegenprobe
208 von 208.

## 2026-10-11 – Das Dach schaltet die Beschattung

**Was war falsch.** „bei den ganzen sachen, ändere es so man muss wenn eine
davon ausgewählt is nur das dach also sparren oder glas anklicken damit die
animation öffnen / schließen stattfindet" (Betreiber, 11.10.2026). Bis jetzt
musste man das Tuch selbst treffen. Eingefahren ist das ein Streifen von
wenigen Zentimetern; am Handy mit dem Finger praktisch nicht zu treffen – und
wer daneben tippt, hält die Animation für kaputt. Von oben auf das Modell
geschaut lag ohnehin das Glas davor, der Klick ging also ins Leere.

**Was jetzt gilt.** Jedes Dachteil – Sparren, Eindeckung (ganz und geteilt),
Abdeck- und Seitenglasleiste – ist gekennzeichnet (`dachTeil()` setzt
`userData.dach`). Ein Klick auf das Dach fährt die Beschattung aus oder ein,
genau wie ein Klick auf das Tuch; gilt für alle Beschattungsarten
(Aufdach-, Unterdach-, Senkrechtmarkise, Plissees, Sonnensegel). Der Hinweis
unter dem Schieberegler nennt jetzt das Dach statt der Markise.

**Warum so und nicht anders.** Es zählt weiter nur das vorderste getroffene
Teil (`break` in `markiseGeklickt`). Steht ein Velaris-Element oder eine
Glasschiebeanlage vor dem Dach, gehört der Klick ihnen – sonst hätte ein Tippen
auf eine Lamelle nebenbei die Beschattung bewegt. Verworfen: das ganze Modell
klickbar machen. Dann würde ein Tippen auf Pfosten oder Boden mitschalten, und
beim Drehen der Kamera wäre nie klar, ob man gerade schaltet oder dreht.

**Was gegengelesen werden soll.** Mit gewählter Beschattung auf Sparren und
auf Glas tippen – beide fahren. Bei Velaris oder Glasschiebetür auf das
Element tippen: das Element bewegt sich, die Beschattung nicht. Prüfung:
`node scripts/pruefe-fuehrung.js` (213 Prüfungen, Gegenprobe 213/213).

## 2026-10-11 – Senkrechtmarkise: durchsichtiger Streifen unter der Kassette

**Was war falsch.** „die senkrechtmarkisen lnks rechts haben oben noch so ne
durchsichtige lücke die is falsch" (Betreiber, 11.10.2026, mit Screenshot).
Das Tuch begann eine volle Kassettenhöhe (105 mm) unter der Oberkante. Die
gezeichnete Kassette ist aber die halbrunde der Serie Z-R – die reicht nur mit
ihrem **Radius** (52,5 mm) nach unten. Die Differenz stand offen: ein
durchsichtiger Streifen von gut 5 cm zwischen Kassette und Tuch, durch den man
hindurchsah.

**Was jetzt gilt.** Das Tuch läuft bis zur Kassettenoberkante durch und
verschwindet oben hinter der Kassette – so wie in echt, wo es auf der Welle im
Kasten sitzt. Die Fallstange wandert entsprechend mit. Unten ändert sich
nichts: ausgefahren endet das Tuch weiter genau an der Unterkante des
Elements.

**Warum so und nicht anders.** Verworfen: das Tuch einfach um den Radius höher
setzen. Das hätte nur für die runde Kassette gestimmt; schaltet jemand über
`KASSETTE_RUND` auf die eckige Serie Z-E um (die Serienfrage ist weiter offen
und steht in `docs/NEXT_TASK.md`), wäre die Lücke wieder da. Mit dem Durchlauf
bis zur Oberkante kann dort keine Lücke mehr entstehen, gleich welche
Kassettenform gezeichnet wird.

**Was gegengelesen werden soll.** Senkrechtmarkise links, rechts und vorne,
jeweils halb und ganz ausgefahren: oben kein heller Streifen mehr, unten
schließt das Tuch bündig ab. Prüfung: `node scripts/pruefe-markise.js`
(170 Prüfungen, Gegenprobe 170/170). Die beiden neuen Prüfungen rechnen die
Lage aus den Formeln des Modellcodes nach und haben **je eine eigene**
Verfälschung – der alte Fehler saß nur oben, mit einer gemeinsamen Gegenprobe
hätte die Prüfung der Unterkante nie angeschlagen und nichts bewiesen.

## 2026-10-11 – Plankenwand und Rahmenwand liegen nicht mehr ineinander

**Was war falsch.** „eine rahmenwand und plankenwand dürfen nicht ineinander
liegen, wenn eine plankenwand vorhanden is, kann die rahmenwand nur bis zur
plankenwand gehen und nicht in sie rein" (Betreiber, 11.10.2026, mit Bild). Die
Rahmenwand lief über die volle Höhe durch, die Planken standen als unteres
Drittel im selben Raum davor. Im Bild sah man die Glasfläche und die
Rahmenprofile durch die Planken hindurch.

**Was jetzt gilt.** Die Plankenwand teilt die Höhe auf: Sie belegt den unteren
Teil (34 % wie bisher), Rahmenwand bzw. Schiebetür setzen auf deren Oberkante
auf. Die Gesamthöhe bleibt unverändert, auch Keil und Wandanschluss liegen
unverändert. Das untere Abschlussprofil der Rahmenwand und – bei Schiebetüren –
die Türschwelle wandern mit auf die Plankenoberkante; sonst lägen sie unter der
Plankenwand im Boden, während das Element darüber anfängt.

**Warum auch die Schiebetür.** Eine Tür, die in der Plankenwand steckt, ist
derselbe Fehler. Geometrisch ist das jetzt sauber – **ob die Kombination
Schiebetür + Plankenwand überhaupt angeboten werden soll, ist offen**: Eine
Schiebetür über einer Brüstung von einem Drittel der Höhe ist kein Durchgang
mehr. Steht in `docs/NEXT_TASK.md`.

**Nebenbei geklärt: Kassettenform der Senkrechtmarkise.** „Z-E Eckig"
(Betreiber, 11.10.2026). Bisher war die halbrunde Serie Z-R gezeichnet, als
ungeprüfte Annahme. `KASSETTE_RUND` steht jetzt auf `false`; die runde Form
bleibt im Code, falls die Serie dazukommt. Die Prüfung der Tuchlage bleibt
grün – sie war von Anfang an formunabhängig gebaut.

**Was gegengelesen werden soll.** Plankenwand zusammen mit Rahmenwand auf einer
Seite: Planken unten, darüber die Rahmenwand, keine Sprosse mehr hinter den
Planken sichtbar. Dasselbe mit Schiebetür. Plankenwand allein und Rahmenwand
allein: unverändert. Prüfungen: `node scripts/pruefe-markise.js` (176,
Gegenprobe 176/176), `node scripts/pruefe-fuehrung.js` (213, Gegenprobe
213/213). Die drei neuen Lageprüfungen haben **je eine eigene** Verfälschung –
die alte Anordnung war nur oben falsch, an der Gesamthöhe stimmte sie.

## 2026-10-11 – Wasserzeichen auf dem Terrassenboden

**Anlass.** „ich hätte gerne auf dem terassenboden indirekt aber trz gut
sichtbar unser BV AussenSysteme Logo mit copyright symbol falls erlaubt quasi
als waserzeichen das keine andere firma unsern konfigurator ausnutzt"
(Betreiber, 11.10.2026).

**Was jetzt gilt.** Auf dem Belag liegt flach das Firmenlogo mit der Zeile
„© <laufendes Jahr> BV AussenSysteme", mit 28 % Deckkraft und halb so breit wie
die Anlage (höchstens 3,2 m). Es liegt **in der Szene**, nicht als Rahmen um
das Bild: So ist es auf jedem Bildschirmfoto und in jedem Download mit drauf,
aus jeder Blickrichtung, und lässt sich nicht wegschneiden, ohne das Bild zu
zerstören. „bei tag logo hell bei abend logo dunkel" (Betreiber) – gemeint sind
`images/logo-hell.png` (dunkle Schrift, heller Belag am Tag) und
`images/logo-dunkel.png` (weiße Schrift, Abend). Die Fußzeile des Sammelbilds
trägt jetzt ebenfalls das ©.

**Recht – bitte lesen.** Das **©** darf jeder an eigene Werke setzen; in
Deutschland ist es keine Voraussetzung für den Schutz (der entsteht mit dem
Werk), aber zulässig und macht die Urheberschaft sichtbar. Ein **®** ist etwas
anderes: Es steht nur einer **eingetragenen** Marke zu. Ohne Eintrag ist es
irreführend und abmahnfähig (§ 5 UWG). Deshalb steht im Konfigurator **kein ®**,
und eine Prüfung verhindert, dass versehentlich eines hineinrutscht. **Offen:
Ist „BV AussenSysteme" als Wort- oder Wort-/Bildmarke beim DPMA eingetragen?**
Wenn ja, kann das ® ergänzt werden – das ist eine Zeile.

**Grenzen, die genannt sein müssen.** Ein Wasserzeichen schreckt ab, es schützt
nicht technisch: Wer will, schneidet es weg oder retuschiert es. Und es wirkt
nur auf Bilder, nicht auf den Konfigurator selbst – wer die Seite nachbaut,
kopiert Code, nicht Screenshots. Beides ist hier nicht Thema, sollte aber nicht
mit „jetzt ist es geschützt" verwechselt werden.

**Was gegengelesen werden soll.** Tag und Abend umschalten: Logo wechselt die
Fassung und bleibt in beiden gut lesbar, ohne aufdringlich zu sein. Schmale und
sehr breite Anlagen: Das Zeichen wächst mit, aber nicht über 3,2 m. Ansicht
„Darunter": Von unten ist es unsichtbar (einseitige Fläche) – dort trägt das
gespeicherte Bild die ©-Zeile in der Fußzeile. Prüfung:
`node scripts/pruefe-fuehrung.js` (219 Prüfungen, Gegenprobe 219/219).

## 2026-10-11 – Plankenwand: Höhenregler wirkt auch neben der Rahmenwand

**Was war falsch.** „bei der plankenwnd funktioniert die einstellung der höhe
etc nicht mehr, das soll funktionieren und die rahmenwand soll sich dazu
anpassen" (Betreiber, 11.10.2026). In der Kombination nahm die Plankenwand
starr 34 % der Höhe – der Regler „Wie hoch zugesetzt" lief ins Leere.

**Was jetzt gilt.** Derselbe Regler gilt in beiden Fällen und bedeutet
dasselbe: Er sagt, wie viel weggelassen wird. Bei −66 bleiben 34 % Planken,
darüber die Rahmenwand bzw. Tür. Das Vorzeichen bestimmt die Lage: nach links
wachsen die Planken von unten (Rahmenwand darüber), nach rechts hängen sie oben
(Rahmenwand darunter) – inklusive Türschwelle und unterem Abschlussprofil, die
dann wieder am Boden sitzen. Der Standard bleibt das Drittel unten: „ganz
zugesetzt" kann in der Kombination nicht gelten, sonst bliebe für die
Rahmenwand nichts. Gerechnet wird über die Plankenzahl der **vollen** Wand,
damit die Fuge dieselbe bleibt wie bei der ganzen Wand und die Planken bündig
abschließen. Der Rahmenwand bleibt immer mindestens eine Planke Platz, sonst
stünde ein Element mit null Höhe im Modell.

**Dazu: Wasserzeichen deutlicher.** „das logo bitte einiges sichtbarer und
größer", dann genauer „15% sichtbarer" (Betreiber). Gelesen als 15
Prozentpunkte mehr Deckkraft: 28 % → **43 %**. Dazu zwei Drittel der
Anlagenbreite statt knapp der Hälfte und 4,6 m statt 3,2 m Obergrenze.
Feiner stellen heißt: eine Zeile (`var WZ = …`) ändern.

**Was gegengelesen werden soll.** Plankenwand + Rahmenwand auf einer Seite, den
Regler „Wie hoch zugesetzt" von links nach rechts durchfahren: Das Plankenband
wird höher und niedriger, die Rahmenwand passt sich an, in der Mitte bleibt es
beim Drittel. Nach rechts: Planken oben, Rahmenwand darunter bis zum Boden.
Die Zeile „Gebaut: …" darunter muss zur gebauten Höhe passen. Prüfungen:
`node scripts/pruefe-markise.js` (179, Gegenprobe 179/179),
`node scripts/pruefe-fuehrung.js` (220, Gegenprobe 220/220).

## 2026-10-11 – Statikträger: unten bündig mit den Sparren

**Was war falsch.** „der statikträger ist tiefer als der sparren mach ihn unten
bündig mit sparren und oben bündig mit glasleiste" (Betreiber, 11.10.2026, mit
Bild). Der Träger wurde mit seinem belegten Querschnittsmaß von 189 mm
gezeichnet. Oben schloss er richtig mit der Glasleiste ab – unten stand er
damit rund 60 mm unter der Sparrenunterkante hervor, als Stufe über die ganze
Breite.

**Was jetzt gilt.** Steht der Träger **hinter** den Sparren (freistehend ohne
hinteren Dachvorsprung), ist er die Wand: Seine Höhe ergibt sich aus dem Dach –
Sparrenhöhe plus Eindeckung, rund 128 mm bei TDS. Oben Glasleiste, unten
Sparrenunterkante. Liegt er dagegen **unter** den Sparren (hinterer
Dachvorsprung), trägt er wirklich und behält seine vollen 189 mm. Die hinteren
Pfosten enden weiter genau unter dem Träger und werden dadurch etwas länger.

**Bewusste Abweichung vom belegten Maß – bitte prüfen.** Die Maßtabelle nennt
den Statikträger mit 189 × 117 mm. Hinter den Sparren wird er jetzt flacher
gezeichnet, als die Tabelle sagt. **Offene Frage an den Hersteller:** Ist an
dieser Stelle ein anderes, flacheres Profil verbaut, oder liegen die Sparren
tiefer im Träger? Steht in `docs/NEXT_TASK.md`. Die **Tiefe** (117 mm) bleibt
unangetastet – an ihr hängt das Tiefenmaß der ganzen Anlage („bei freistehend
das tiefe maß is immer inkl. statikträger").

**Was gegengelesen werden soll.** Freistehend, von hinten und von der Seite
anschauen: Träger oben bündig mit der Glasleiste, unten bündig mit der
Sparrenunterkante, keine Stufe mehr. Mit hinterem Dachvorsprung (Carport TDS):
Träger unter den Sparren, wieder in voller Höhe. Prüfung:
`node scripts/pruefe-masstabelle.js` (207 Prüfungen, Gegenprobe 207/207) – die
beiden neuen rechnen die Lage nach, nicht nur den Text.

## 2026-10-11 – Werkbilder: gerillte Rinnenfront und geschlossener Dachrand

**Anlass.** „hier ein perfekter querschnitt unserer überdachung kannst du es so
neu modellieren" – auf Rückfrage: „nicht 100% 1:1 aber ähnlich und einfach"
(Betreiber, 11.10.2026, fünf Werkbilder des Eckausschnitts).

**Was aus den Bildern übernommen wurde.** Zwei Dinge, die das Bild prägen und
ohne Maße auskommen:
1. **Die Rinnenfront ist fein waagerecht gerillt**, nicht glatt. Statt der
   zwei einzelnen Schattenfugen läuft jetzt ein gleichmäßiges Rillenband über
   die Vorderfläche. Es kostet nur Linien im Querschnitt – die Rinne wird
   weiter in einem Zug gezogen, kein zusätzliches Teil.
2. **Der Dachrand ist seitlich geschlossen.** Die Anlage hat einen umlaufenden
   Rahmen: vorne Rinne, hinten Wandprofil, an beiden Seiten ein ebenso hohes
   Profil. Im Modell endete das Dach seitlich mit dem nackten Sparrenprofil –
   man sah von außen in die Sparrenkammer. Jetzt liegt dort eine Blende, außen
   bündig mit der Dachkante, von der Sparrenunterkante bis an die Glasoberseite.

**Warum als Verkleidung und nicht als neues Tragprofil.** Die Blende ist
bewusst nur Optik: Sparrenachsen, Sparrenzahl aus der Maßtabelle, Statik und
alles, was daran hängt, bleiben unberührt. Ein echter umlaufender Rahmen hätte
die Achsrechnung angefasst – aus einer Optikänderung wäre ein Maßfehler
geworden. Eine Prüfung hält die Achsformel ausdrücklich fest.

**Was NICHT übernommen wurde.** Die Bilder sind Renderings ohne eine einzige
Bemaßung. Nicht gebaut sind deshalb: die Eckkappen in Gehrung, der
Wasserablauf-Deckel am Pfostenkopf, die Glasauflagen und Dichtungen aus dem
Schnittbild, die genaue Form des seitlichen Trägerprofils. Rillenteilung
(15 mm) und Blendendicke (30 mm) sind **GESCHÄTZT**.

**Zwei Funde der eigenen Prüfungen** (beide in der Prüfung, nicht im Modell):
Die Rinnenkehle reicht bewusst über die Oberkante hinaus; der erste Messstub
zählte sie zum Umriss und warf den Rillen 10 mm zu viel Höhe vor. Und ein
Regex griff ein gleichnamiges `blendeH` der Markise. Beides zeigt, wofür die
Gegenprobe da ist – und dass eine Prüfung auch selbst falsch sein kann.

**Was gegengelesen werden soll.** Dach von vorne: Rinnenfront gerillt, Maße
unverändert (186,3 × 136,7 mm). Von der Seite und von schräg oben: Dachrand
geschlossen, keine offene Sparrenkammer, Blende bündig mit der Dachkante, oben
an der Glasoberseite. Polycarbonat (16 mm) und VSG 10 mm gegenprüfen – die
Blende wächst mit der Scheibendicke. Prüfung:
`node scripts/pruefe-masstabelle.js` (211, Gegenprobe 211/211).

## 2026-10-11 – Seitliche Abdeckungen: Rinne und Wandprofil identisch

**Anlass.** „miir is wichtig das die abdeckungen links rechts von rinne und von
wandprofil abdeckung links rechts identisch sind aber ohne vd gravur"
(Betreiber, 11.10.2026, mit beiden Werkbildern).

**Was jetzt gilt.** Es gibt nur noch **eine** Kappenform im Code
(`kappeQuerschnitt`): ein Rechteck mit abgeschrägter oberer Vorderecke,
172 × 175 mm, Fase 34 mm (belegtes Maß des Rinnendeckels). Rinne und
Wandprofil bauen beide darüber; die frühere Sonderfassung für die Rinne ist
weg. Am Wandprofil ist die Kappe **nicht** auf die 31 mm Profiltiefe
geschrumpft – das zweite Werkbild zeigt, dass sie dort die ganze Stirnseite
des Dachanschlusses abdeckt und unten über das Profil hinaussteht.

**Drei Annahmen zur Lage am Wandprofil – bitte prüfen.** Belegt ist nur die
Lage an der Rinne („gleich den deckel mittig aus huptsache vorne is bündig").
Für das Wandprofil wurde angenommen: hinten bündig mit der Wand (z = 0) und
nach vorne unter das Dach reichend; oben bündig mit der Profiloberkante statt
mittig (mittig stünde sie über die Glasleiste hinaus); Fase oben an der freien
Kante, also vorne.

**Keine Gravur – und das bleibt so.** Auf dem Werkbild trägt die Kappe das
Zeichen des Herstellers. Das ist dessen Marke; wir sind Verarbeiter. Ein
fremdes Markenzeichen im eigenen Konfigurator nachzubilden wäre weder
rechtlich sauber noch sachlich richtig, denn es stünde an einem Bild, das
**wir** verantworten. Eine Prüfung hält fest, dass die Kappen nur Material und
keine Beschriftung tragen.

**Was gegengelesen werden soll.** Links und rechts an Rinne und Wandprofil:
gleiche Form, gleiche Größe, gleiche Farbe. Am Wandprofil prüfen, ob Lage und
Überstand so stimmen – das sind die drei Annahmen oben. Prüfung:
`node scripts/pruefe-masstabelle.js` (216, Gegenprobe 216/216); eine davon
zeichnet beide Umrisse und vergleicht sie Punkt für Punkt.

## 2026-10-11 – Korrektur: die beiden Deckel sind NICHT dieselbe Form

**Was falsch war.** Auf „die abdeckungen … identisch" hin hatte ich beide
Deckel aus einer Form gebaut – der des Rinnendeckels. Rückmeldung des
Betreibers: „du hast die deckel nicht richtig abgebildet sondern selbst
modeliert", und auf Nachfrage: Rinne und Wandprofil sind **doch verschieden**.
Gemeint war mit „identisch" offenbar links/rechts je Profil, nicht Rinne gegen
Wandprofil.

**Was jetzt gilt.** Zwei Formen, jede nach ihrem Werkbild:
- **Rinne:** eckig, gerade Schräge an der oberen Vorderecke, 172 × 175 mm,
  Fase 34 mm – BELEGT aus dem Teilebild, unverändert.
- **Wandprofil:** rund. Die vordere Kante läuft in einem großen Bogen aus.
  140 mm tief, 175 mm hoch, Radius 70 mm – alle drei **GESCHÄTZT** am
  unbemaßten Werkbild. Steht als offener Punkt in `docs/NEXT_TASK.md`.

Gemeinsam bleibt die Machart: eine Bauweise (`profilKappen`), ein Material,
links und rechts gleich – und keine Gravur.

**Lehre.** „Identisch" war zweideutig, und ich habe die für mich bequemere
Lesart genommen, statt zu fragen. Eine Prüfung hat das dann sogar noch
festgeschrieben („beide ergeben denselben Umriss") – die Prüfung war genauso
falsch wie das Modell und ist ersetzt. **Eine Prüfung, die eine ungeprüfte
Annahme zementiert, ist schlimmer als keine.**

**Was gegengelesen werden soll.** Rinne links/rechts: eckig mit Schräge.
Wandprofil links/rechts: runde Vorderkante. Ob Größe und Rundung des
Wandprofil-Deckels passen, lässt sich nur am Bild beurteilen – die Maße sind
geschätzt. Prüfung: `node scripts/pruefe-masstabelle.js` (216, Gegenprobe
216/216); sie misst beide Formen und besteht darauf, dass sie verschieden sind.

## 2026-10-11 – Flachdach SkyView nach der Montageanleitung gebaut

**Anlass.** „so dann analysiere das, lies alles durch und wir modellieren jetzt
das flachdach skyview richtig" (Betreiber, 11.10.2026) – dazu die
Montageanleitung „VD FLACHDACH GLAS SKY VIEW", Stand 07.11.2025, 33 Seiten,
vollständig gelesen.

**Was falsch war.** Das SkyView-Dach war bisher ein TDS-Dach mit 2° Neigung,
über das eine 26 cm hohe Attika-Blende gelegt wurde – ein Versuch, das kubische
Aussehen ohne die echten Profile nachzustellen. Rinne, Träger und Sparren waren
reine Schätzungen.

**Was jetzt gilt (BELEGT aus der Anleitung).**
- **WAAGE statt Gefälle:** „Die Oberkante des Daches muss an allen Punkten in
  WAAGE sitzen" (S. 8). SkyView hat kein Gefälle in der Konstruktion; das
  Wasser läuft in der Rinne und durch den Pfosten ab. `neig = 0`.
- **Sparren:** Länge = Spannweite − 150 mm, an jedem Ende ein Ausschnitt
  65 mm tief × 86 mm hoch als Auflager (S. 22). Oberkante bündig, waagerecht.
- **Randsparren bündig:** „an den Seiten jeweils ein Abstand von 0 mm" (S. 25) –
  anders als bei TDS mit 30 mm.
- **Rahmen rundum:** Rinne Flat (16553) vorne, Träger TD (15698) hinten,
  Seitenblende Sky (6069) an den Seiten, alle mit derselben Oberkante.
  Die Seitenblende wird 5 cm länger geliefert (S. 20) – ein Liefermaß, kein
  Einbaumaß, deshalb steht sie im Modell nicht über.
- **Glasleisten (15184)** auf den Sparren, auch bei SkyView.
- Pfosten 110 × 110, Fallrohr Ø 75 im Pfosten, Rinnenablauf Ø 68, Laubfänger.

**ABGELEITET, nicht gedruckt.** Aus „Sparrenlänge = Spannweite − 150 mm" und
„Auflager 65 mm je Seite" folgt für Rinne und Träger zusammen 280 mm Bautiefe,
also je 140 mm. Vorher standen dort 90 mm als reine Schätzung. Eine Prüfung
rechnet diese Ableitung nach: Ändert jemand eines der drei Maße, schlägt sie
an.

**GESCHÄTZT bleibt** (die Anleitung bemaßt keine Querschnitte): Rahmenhöhe
220 mm, Sparren 70 × 110 mm, Blendendicke, Glasleiste. Steht in
`docs/NEXT_TASK.md`.

**Nebenbefund zum Prüfen.** `js/masstabelle.js` führt SkyView als
`montage: 'wandmontage'`. Die Anleitung beschreibt durchgehend die
**freistehende** Anlage mit vier Pfosten und Fundamenten; für die Wand gibt es
eine eigene Wand-Rinnen-Blende (15185). Beides gibt es also – die Angabe
gehört geprüft.

**Was gegengelesen werden soll.** SkyView wählen: Das Dach steht waagerecht,
der Rahmen ist rundum gleich hoch, die Randsparren sitzen bündig an der Kante,
auf den Sparren liegen Glasleisten, und über dem Dach steht nichts mehr. Eine
Neigung lässt sich bei SkyView nicht einstellen (gilt nur für TDS) – das war
schon vorher so und passt jetzt zum Modell. Prüfung:
`node scripts/pruefe-masstabelle.js` (229, Gegenprobe 229/229), davon 15 neue
zu SkyView.

## 2026-10-11 – SkyView: Sparren und Glasleisten sind die des TDS-Systems

**Was war falsch.** „sparren, glasleiste etc is wie bei tds" (Betreiber,
11.10.2026). Im SkyView-Zweig standen geschätzte 70 × 110 mm für den Sparren
und eine selbst erfundene flache Glasleiste – beides daneben.

**Was jetzt gilt.** Es gibt nur noch **einen** Sparrenbau und **einen**
Leistenbau für beide Systeme: der TDS-Sparren 61 × 120 mm mit seinem Steg, die
halbrunde Abdeckleiste 55,3 × 22,6 mm und außen die Seitenglasleiste mit der
Abschlusszunge. Daraus folgt auch die Scheibenbreite: Sie liegt jetzt in beiden
Systemen beidseitig 20 mm auf dem Sparrensteg auf (TDS-Anleitung S. 9), vorher
lag sie bei SkyView nur zwischen den Sparren.

**Warum das zusammenpasst.** Die SkyView-Anleitung verlangt an den Sparrenenden
eine Ausklinkung von 86 mm Höhe. Beim TDS-Sparren mit 120 mm Gesamthöhe bleiben
darüber genau 34 mm – der obere Steg, auf dem die Eindeckung liegt. Zwei
unabhängige Quellen, die dasselbe sagen; die Prüfung rechnet diesen Rest aus
und zeigt ihn an.

**Was gegengelesen werden soll.** SkyView: Sparrenprofil und Glasleisten sehen
aus wie beim Terrassendach TDS, außen die Seitenglasleiste mit Abschluss.
Prüfung: `node scripts/pruefe-masstabelle.js` (230, Gegenprobe 230/230).

## 2026-10-11 – SkyView: außen Flachdach, innen 2° Gefälle

**Korrektur meiner eigenen Lesart.** Ich hatte „Die Oberkante des Daches muss
an allen Punkten in WAAGE sitzen" (Montageanleitung S. 8) als „die Dachfläche
ist waagerecht" gelesen und das Gefälle auf 0 gesetzt. Richtig ist: „das sky
view sieht von außen aus wie flachdach hat aber ein innenliegendes gefälle von
immer 2 grad" (Betreiber, 11.10.2026). Die WAAGE gilt dem **Rahmen**, nicht der
Dachfläche.

**Was jetzt gilt.** Rinne, Träger und Seitenblende bilden ein waagerechtes Band
mit gleicher Ober- und Unterkante rundum. Die Sparren und die Eindeckung darin
fallen mit festen 2° zur Rinne. Von außen sieht man nur das Band – genau das
beschreibt die Anleitung, und genau so war es im Modell vor dem Umbau.

**Neu daraus: die Rahmenhöhe wächst mit der Tiefe.** Das Band muss die geneigte
Dachfläche an ihrer höchsten Stelle noch überdecken, sonst stünde das Glas
hinten darüber hinaus. Rahmenhöhe = Gefälle über die Tiefe + Sparren +
Eindeckung + Rinnenplatz: bei 3 m rund 33 cm, bei 6 m rund 44 cm. Das ist eine
**Modellregel, kein Herstellermaß** – wie das echte System das bei großen
Tiefen löst, steht in keiner Unterlage und ist als Frage in
`docs/NEXT_TASK.md` vermerkt.

**Was die Prüfung gefunden hat.** Beim Schreiben des zweiten Wegs fiel auf: Der
Träger hinten behielt seine feste Höhe, während die Rinne mit der Tiefe wuchs –
oben bündig, unten 11 cm auseinander. Das Band wäre nur auf einer Seite gerade
gewesen. Behoben; die Prüfung rechnet jetzt alle vier Kanten (Rinne, Träger,
Blende) gegeneinander.

**Was gegengelesen werden soll.** SkyView von der Seite: ein gerades Band,
oben und unten waagerecht, rundum gleich hoch. Von innen/unten: die Dachfläche
fällt sichtbar nach vorne zur Rinne. Mehrere Tiefen durchfahren (2 m bis 7 m) –
das Band wird höher, aber das Glas bleibt immer darin. Prüfung:
`node scripts/pruefe-masstabelle.js` (232, Gegenprobe 232/232).

## 2026-10-11 – SkyView: nur die Sparren sind geneigt, der Kasten nicht

**Klarstellung des Betreibers.** „nur die sparren sind 2grad geneigt, der
kasten außen die verblendung ist wie flachdach, da is nix geneigt"
(11.10.2026). Dazwischen hatte ich kurz den Träger hinten der Dachfläche folgen
lassen – damit wäre der Kasten hinten höher gewesen als vorne, also schief.
Zurückgenommen.

**Was jetzt gilt.** Rinne, Träger und Seitenblende bilden einen waagerechten
Kasten: gleiche Oberkante, gleiche Unterkante, rundum. Darin liegen die Sparren
mit 2° und tragen die Eindeckung. Von außen ist nichts geneigt.

**Was daraus folgt – und was offen bleibt.** Das Gefälle über die ganze Tiefe
muss irgendwo hin. Im Modell steckt es jetzt in der Kastenhöhe: Der Kasten
wächst mit der Tiefe (3 m → rund 33 cm, 7 m → rund 48 cm). Die Alternative wäre
ein **keilförmiger Sparren** – und genau so sieht das Profil auf Seite 22 der
Montageanleitung aus: vorne niedrig, nach hinten höher. Dann bliebe der Kasten
immer gleich hoch. Beides erfüllt „außen Flachdach"; welches davon stimmt,
entscheidet, wie hoch die Blende beim Kunden wirklich wirkt. **Frage an den
Hersteller**, vermerkt in `docs/NEXT_TASK.md`.

**Was gegengelesen werden soll.** SkyView von vorne, von der Seite und von
hinten: Der Kasten ist überall gleich hoch, oben und unten waagerecht. Von
unten: die Sparren fallen sichtbar nach vorne zur Rinne.

**Nachtrag am selben Tag: der Kasten ist gerillt.** „hier siehst du es doch so
perfekt, einfach 1:1 nachbauen" (Betreiber, mit dem Querschnittsbild). Auf dem
Bild ist der Außenkasten nicht glatt, sondern fein waagerecht gerillt –
dieselbe Oberfläche wie die TDS-Rinnenfront. Er wird deshalb als gezogenes
Profil mit gerillter Außenseite gebaut, rundum dasselbe Profil (vorne, hinten,
beide Seiten), mit derselben Rillenteilung wie die Rinne; ein zweiter Wert
daneben liefe über kurz oder lang davon weg. Die Prüfung zeichnet den
Querschnitt und misst nach, dass die Rillen die Außenmaße nicht verändern.

## 2026-10-11 – SkyView: das Gefälle steckt im Keilsparren

**Die Klärung.** „die blende außen is immer gleich, einfach rechteckig"
(Betreiber, 11.10.2026). Zusammen mit „nur die sparren sind 2grad geneigt"
folgt daraus zwingend: Das Gefälle kann nicht im Kasten stecken, es muss im
**Sparren** sein. Genau das zeigt Seite 22 der Montageanleitung – das Profil
wird nach hinten höher, und dort steht „wenn diese vor Ort gefertigt werden
sollen": Der Keil wird zugeschnitten.

**Was jetzt gilt.** Der Sparren liegt mit **waagerechter Unterkante** auf Rinne
und Träger und steigt nach hinten an; darauf die Eindeckung, die mit 2° zur
Rinne fällt. Der Kasten außen ist ein Rechteckprofil fester Höhe (260 mm),
rundum gleich. Nachgerechnet über acht Tiefen: Bis 4 m bleibt der Kasten bei
seinen 260 mm, der Sparren wird vorne dünner (bei 4 m noch 48 mm). Die
Eindeckung bleibt bei jeder Tiefe im Kasten.

**Was offen bleibt.** Ab etwa 5 m Tiefe braucht das Gefälle mehr Platz, als
260 mm hergeben; dann wächst der Kasten im Modell mit (bei 7 m auf 364 mm).
Wie das echte System das löst – höheres Profil, zweite Blendenhöhe oder
flacheres Gefälle –, ist die verbliebene Frage in `docs/NEXT_TASK.md`.

**Vorher falsch gedacht.** Ich hatte den geraden Sparren schräg in den Kasten
gelegt; dann musste der Kasten mit jeder Tiefe mitwachsen, um ihn zu
überdecken. Die Form des Sparrens war die Antwort, nicht die Höhe des Kastens.

**Was gegengelesen werden soll.** SkyView bei 2,5 m, 3,5 m und 4,5 m Tiefe: Die
Blende ist jeweils gleich hoch. Von unten: Der Sparren ist vorne schmal und
hinten hoch, die Eindeckung fällt zur Rinne. Prüfung:
`node scripts/pruefe-masstabelle.js` (238, Gegenprobe 238/238).

## 2026-10-11 – Seitenblende: die Sparren blitzten hindurch

**Was war falsch.** „an den außenblenden links und rechts sieht man die sparren
durch, die blende sind ja dafür da um die sparren eben nicht zu sehen"
(Betreiber, 11.10.2026). Der Randsparren endet bündig an der Dachkante, und die
Blende lag genau davor – beide Außenflächen auf **derselben Ebene**. Welche von
zwei exakt gleich weit entfernten Flächen der Bildschirm zeigt, entscheidet
dann die Rechengenauigkeit, Pixel für Pixel neu: Die Sparren blitzen durch die
Blende, und beim Drehen flackert es.

**Was jetzt gilt.** Die Blende liegt 2,5 mm vor der Dachkante (`RANDBLENDE.vor`)
und damit eindeutig vor dem Sparren. Das ist **kein Bauteilmaß, sondern
Zeichentechnik** – es steht so im Code kommentiert, damit es niemand später als
„unsauberes Maß" wegräumt.

**Was gegengelesen werden soll.** Links und rechts am Dach entlangdrehen: eine
geschlossene Fläche, kein Flackern, keine Sparren mehr sichtbar. Bei TDS und
bei SkyView. Prüfung: `node scripts/pruefe-masstabelle.js` (240, Gegenprobe
240/240) – zwei davon rechnen für beide Systeme nach, dass die Blendenaußenkante
wirklich vor der Sparrenaußenkante liegt.

## 2026-10-11 – SkyView: Keilsparren zurückgenommen

**Was falsch war.** Ich hatte aus „die blende außen is immer gleich" geschlossen,
das Gefälle müsse im Sparren stecken, und einen Keilsparren gebaut – vorne spitz
auslaufend, hinten 18 cm hoch. Antwort des Betreibers mit Bildschirmfoto:
„ehhhhm wasn da passiert", und danach klar: „die sparren haben keine keilform,
die sind normal wie bei tds nur eben 2 grad geneigt".

**Was jetzt gilt.** Die Sparren sind dieselben schlanken TDS-Profile
(61 × 120 mm), um 2° geneigt eingebaut. Der Kasten außen bleibt rechteckig und
rundum gleich hoch; seine Höhe ergibt sich aus der Geometrie, weil das Gefälle
irgendwo hin muss: 2,5 m → 285 mm, 4 m → 338 mm, 6 m → 408 mm.

**Die Geometrie, in einem Satz.** Bei 4 m Tiefe sind 2° genau 14 cm
Höhenunterschied. Entweder nimmt sie der Sparren auf (dann ist er hinten hoch
und vorne spitz) oder der Kasten (dann ist er höher). Beides klein geht nicht.
Die Entscheidung ist gefallen: schlanke Sparren, höherer Kasten.

**Offen.** Wie hoch die Blende beim echten System wirklich ist – gestaffelte
Profilhöhen? Flacheres Gefälle bei großen Tiefen? Steht in
`docs/NEXT_TASK.md`.

## 2026-10-11 – Maßtabelle gegen die Preislisten-PDF geprüft

**Anlass.** Frage des Betreibers, ob für SkyView andere Pfostenabstände gelten;
dazu die PDF „Masstabelle Terrassendaecher" (Stand 2026-10-11, Quelle
VD-Preislisten, ohne Preise), 1316 Datensätze für TDS, SkyView und Flat Line.

**Geprüft, alles in Ordnung.** Alle Breiten-, Sparren- und Pfostenzahlen in
`js/masstabelle.js` stimmen mit der PDF überein – auch die 616 SkyView-Sätze.
Die beiden verdichteten Regeln halten über **alle 1316 Datensätze ohne eine
einzige Abweichung**: Pfosten = Liste + (Tiefe > 4500 bzw. > 7000 ? 1 : 0),
Unterzug ab Tiefe > 4500.

Die Pfostenzahlen für SkyView unterscheiden sich tatsächlich von TDS – bei
10 m Breite 3 statt 5 Stützfüße, bei 12–14 m 4 statt 5. Das Modell nimmt die
richtige Spalte, weil es nach Produkt unterscheidet.

**Zwei Widersprüche, die der Betreiber entscheiden muss.**
1. **TDS-Tiefe 7050 mm.** Die PDF führt diese Tiefe in **allen 30 Breiten** als
   `LIEFERBAR=nein` (= über dem Maximum); letzte lieferbare Tiefe wäre 6550 mm.
   Am 11.10.2026 hieß es dagegen: „bei tds is die maximale tiefe 7050mm".
   Im Modell steht jetzt 7050. Das hat Außenwirkung: Wer 7050 einstellt und
   ein Angebot bekommt, erwartet eine Lieferung.
2. **Pfostenachse in der Tiefe.** Die PDF nennt belegt
   `PFOSTENACHSE_AB_VORDERKANTE_MM=55`. Im Modell steht die Achse mittig unter
   der Rinne (93 mm) – nach der Angabe vom 10.10.2026. Beides kann nicht
   stimmen.

**Was die PDF ausdrücklich NICHT belegt** (eigener Abschnitt „nicht raten,
sondern nachfragen"): Profilquerschnitte, **Pfostenverteilung über die
Breite**, ob B/T Außen- oder Achsmaß ist, Lage der Querfuge, Trapezblech-Details.
Die gleichmäßige Verteilung im Modell bleibt also eine Annahme.

**Weitere belegte Werte aus dem Kopf der PDF, noch nicht eingebaut.**
Pfostenlänge Standard je System (TDS 2500, SkyView 3000, Flat Line 3000),
Pfostenquerschnitt 110 × 110 × 2,5, Feldbreite Glas 680–770 mm, Polycarbonat
1016–1080 mm, Scheibenbreite max. VSG8 720 mm / VSG10 980 mm, Rinnenkopplung
ab 7000 mm Breite, Durchgangshöhe min. 2000 mm, Neigung 2–14° (Standard 8°),
Terrassengefälle 2 %, Glasanteil am Rohmaß TDS 96,9–98,5 % / SkyView
95,0–95,9 %, Einbindung Punktfundament 550/600 mm bei 60 × 60 × 80 cm.
**Farben je System:** TDS 7016/9006/9007/9010, **SkyView nur
7016/9006/9007** – der Konfigurator bietet Reinweiß 9010 derzeit für alle
Systeme an.

Die PDF selbst bleibt außerhalb des Repos (Datenbankherstellerrecht); geprüft
wurde im Scratchpad.

**Entschieden am 11.10.2026:** Zum ersten Widerspruch – „7m war schon richtig,
tiefe wie ich gesagt hab" (Betreiber). Es bleibt bei **7050 mm** Höchsttiefe
für TDS; die `LIEFERBAR=nein`-Spalte der PDF ist an dieser Stelle überholt. Der
Hinweis steht jetzt auch in `js/masstabelle.js` an der Zahl selbst, damit
niemand sie später „nach der Tabelle korrigiert". Offen bleibt der zweite
Punkt: Pfostenachse 55 mm hinter der Vorderkante (PDF) gegen mittig unter der
Rinne, 93 mm (Angabe vom 10.10.2026).

## 2026-10-11 – Pfostenachse nach Liste, Reinweiß nur bei TDS

Zwei Entscheidungen des Betreibers zum Prüfbericht von eben.

**Pfostenachse: „dann mach es nach liste".** Die Achse liegt jetzt 55 mm hinter
der Vorderkante der Rinne (`PFOSTENACHSE`), nicht mehr 93 mm („mittig unter der
Rinne", Angabe vom 10.10.2026). Bei 110 mm Pfosten steht seine Vorderkante
damit bündig mit der Rinnenvorderkante. Gilt für alle Systeme – die Tabelle
trennt dort nicht. Die Seitenelemente enden weiter an der hinteren
Pfostenfläche und wandern automatisch mit.

**Reinweiß 9010: „korregieren".** Die Serienfarben stehen jetzt in
`js/masstabelle.js` (`farben`), je System aus dem Kopf der Preisliste: TDS
führt 7016/9006/9007/9010, SkyView und Flat Line nur 7016/9006/9007. Der
Konfigurator liest sie von dort, sobald die Herstellerschnittstelle nichts
liefert – also zurzeit immer. Vorher standen bei SkyView und Flat Line alle
vier Farben zur Wahl, und ein Kunde konnte eine Farbe anfragen, die es für sein
System nicht gibt. „Andere / Beratung" (Sonderfarbe) bleibt überall.

**Nicht eingebaut, auf Ansage: „nein".** Die übrigen belegten Kopfwerte der
Preisliste (Pfostenlänge je System, Feldbreiten, Scheibenbreiten,
Rinnenkopplung, Durchgangshöhe, Neigungsbereich, Glasanteil, Fundamentmaße)
bleiben draußen. Sie stehen im Prüfbericht weiter oben, falls sie später
gebraucht werden.

**Was gegengelesen werden soll.** Produkt auf SkyView stellen: Reinweiß ist
weg, die anderen drei und „Andere / Beratung" bleiben. War Reinweiß vorher
gewählt, springt die Farbe auf Anthrazit. Bei Terrassendach TDS und Carport TDS
bleibt Reinweiß. Pfosten: steht jetzt weiter vorne, bündig unter der
Rinnenvorderkante. Prüfung: `node scripts/pruefe-masstabelle.js` (242,
Gegenprobe 242/242).

## 2026-10-12 – Dachneigung: beide Wege sichtbar und nutzbar

**Was war falsch.** „hier darunter soll man noch die grad der neigung einstellen
können … Möglichkeit 1: man gibt die grad zahl ein, und es wird nach der
eingegebenen durchgangshöhe geguckt wie die höhe an der wand ausfällt;
Möglichkeit 2: man kann zusätzlich zur durchgangshöhe die wandprofil unterkante
höhe angeben und es wird daraus die grad zahl berechnet" (Betreiber,
11.10.2026, mit Bildschirmfoto).

Beide Wege waren **gebaut** – aber nicht zu sehen:
- Die Neigungsgruppe hing an `datenSystem()`, also an der Antwort von
  `/api/bauteile`. Die kommt nicht (503, KV-Namensraum nicht gebunden). Damit
  war die Dachneigung beim Terrassendach komplett unsichtbar: Unter „Höhe
  vorne" kam gleich „Mehr Einstellungen". Ob ein TDS-Dach geneigt ist, weiß das
  Modell aber auch ohne Server.
- Weg 2 (Höhe hinten vorgeben) gab es nur beim **freistehenden Carport TDS**
  und auch dort nur unter „Mehr Einstellungen".

**Was jetzt gilt.** Beide Wege stehen bei allen TDS-Anlagen direkt unter der
Durchgangshöhe. Ohne Häkchen: Grad eingeben, darunter steht die Höhe an der
Wand (Unterkante Wandprofil) samt Rechenweg. Mit Häkchen: Höhe an der Wand
vorgeben, darunter steht die Neigung in Grad und Prozent. Das Neigungsfeld
verschwindet dann – zwei Regler für dieselbe Sache wären nur verwirrend.

Die Reglergrenzen für die Höhe hinten sind jetzt die zulässigen Neigungen,
umgerechnet: 2° bis 14° bei der eingestellten Tiefe. Fest eingetragene
2000–3200 mm reichten nicht – bei 7 m Tiefe sind 14° allein 1745 mm Anstieg.

**Beinahe-Fehler, der dabei aufgefallen ist.** Der **hintere Dachvorsprung**
hing an derselben Funktion `hoehenGetrennt()`. Mit der Erweiterung auf alle
TDS-Anlagen wäre er still auch dort aufgetaucht, wo es ihn nicht geben darf –
„also nur bei der freistehenden version" (Betreiber, 11.10.2026). Er hat jetzt
seine eigene Bedingung `vorsprungHintenMoeglich()`.

**Was gegengelesen werden soll.** Terrassendach TDS: Unter „Höhe vorne" steht
jetzt die Dachneigung mit Grad, Prozent und Höhe an der Wand. Häkchen setzen:
Der Regler zeigt die Höhe an der Wand, darunter die errechnete Neigung. Tiefe
verstellen – die Werte müssen zusammenbleiben. Carport TDS mit Wandmontage:
Neigung ja, hinterer Dachvorsprung nein. Prüfungen:
`node scripts/pruefe-fuehrung.js` (224, Gegenprobe 224/224) und
`node scripts/pruefe-masstabelle.js` (242, 242/242); eine davon rechnet 20
Fälle hin und zurück – Grad zu Höhe und wieder zurück, größte Abweichung 0,00°.

**Nachtrag am 12.10.2026: gerechnet wird wie beim Hersteller.** „Hersteller
koppelt die berechnung an Unterkante Rinne und Unterkante Wandprofil, dann wird
durch die tiefe des daches und andere angaben die grad zahl berechnet"
(Betreiber). Im Bedienfeld stand bis dahin „Durchgangshöhe + Gefälle über die
volle Tiefe" – eine gedachte Linie. Nachgerechnet gegen das, was das Modell
baut, lag sie **23 bis 68 mm zu hoch** (je nach Neigung: 2° → 23 mm, 8° →
48 mm, 14° → 68 mm). Wer danach anreißt, hängt das Wandprofil zu hoch.

Jetzt rechnet das Bedienfeld dieselbe Kette wie der Dachaufbau:
Rinnenunterkante → Sparrenauflager in der Rinne → Gefälle über die **Dachtiefe
ohne Rinne und Wandprofil** → Sparrenhöhe → Eindeckung → Wandprofilhöhe. Die
„anderen Angaben" des Herstellers sind genau diese Profilmaße. Beide Richtungen
nutzen dieselben Funktionen (`wandUkAus`, `gradAusWandUk`), und das Wandprofil
hat jetzt eine gemeinsame Konstante statt zwei Zahlen an zwei Stellen.

Eine Prüfung rechnet die Kette aus den Einzelmaßen noch einmal nach und
vergleicht sie mit der Anzeige: 2745 gegen 2746 mm – ein Millimeter Rundung.

**Nachtrag: Beschriftung nach dem Bestellformular.** Der Betreiber hat die
beiden Formularseiten geschickt. Der Hersteller fragt dort: „Möchten Sie die
Dachneigung oder die Unterkante Rinne und die Unterkante Wandprofil angeben?" –
genau die beiden Wege, die der Konfigurator jetzt hat. Die Beschriftungen sind
daran angeglichen: „Höhe vorne (Durchgang)" trägt zusätzlich „Unterkante
Rinne", das Häkchen heißt „Statt der Dachneigung die Unterkante Wandprofil
angeben", und der Hinweis nennt die Grenzen des Formulars („Mindestgefälle
2–3°, Höchstmaß 13–14°"). So lässt sich die Anfrage ohne Umrechnen in die
Bestellung übertragen.

**Offen geblieben:** Das Formular kennt beim Statikträger drei Möglichkeiten –
„ohne / überstehend / unter Rinne". Der Konfigurator hat nur das Häkchen
„unter der Rinne". Was „überstehend" baulich bedeutet, steht in
`docs/NEXT_TASK.md`.

## 2026-10-12 – Dachneigung: Rechenweg des Herstellers belegt, eigene Korrektur zurückgenommen

**Anlass:** Der Betreiber lieferte zuerst einen Referenzfall aus dem
Bestellformular (5000 breit, 3000 tief, Unterkante Rinne 2200, Unterkante
Wandprofil 2500 → laut Hersteller 6°) und danach die Seite der
Montageanleitung mit Skizze, Prozenttabelle und Rechenbeispiel.

**Was falsch war:** Ich hatte die Umrechnung zwischen Grad und Unterkante
Wandprofil um Rinnenbreite, Wandprofiltiefe, Sparrensitz und Glasstärke
korrigiert, damit die angezeigte Zahl der gezeichneten Kante entspricht.
Der Referenzfall allein hat das nicht widerlegt – vier durchgerechnete
Varianten (volle Tiefe 5,71°, ohne Rinne 6,09°, ohne Rinne und Wandprofil
6,15°, mit Profilhöhen 6,46°) runden alle auf 6°, weil das Formular nur
ganze Grad zeigt.

**Was jetzt gilt:** Die Montageanleitung entscheidet es wörtlich: *„Nehmen
Sie die gewünschte Höhe an der Innenseite, zum Beispiel 200 cm. Die
Überdachung hat einen festen Gefällewinkel von 14%. … Wenn der Ausfall 3 m
beträgt, dann liegt die Unterkante des Wandanschlussprofils 3 × 14 cm höher
als die Unterkante der Rinne. In diesem Beispiel würde das
Wandanschlussprofil also in einer Höhe von 242 cm angebracht."* Also: über
die **volle Bestelltiefe**, Prozentwert aus der Tabelle, **ohne jeden
Abzug**. Die Skizze daneben bestätigt es mit 14 / 28 / 42 / 56 cm bei 1 bis
4 m. Meine Korrektur ist zurückgenommen (`wandUkBasis()` = Höhe vorne,
`wandUkSpanne()` = Tiefe).

**Warum so und nicht anders:** Die Zahl im Bedienfeld geht in die
Bestellung. Sie muss die sein, die der Hersteller nachrechnet – nicht die,
die zum gezeichneten Modell passt. Technisch „genauer" wäre hier falsch.

**Was das kostet:** Die gezeichnete Unterkante des Wandprofils liegt rund
4 cm unter der angezeigten Zahl (gemessen bei 3,5 m Tiefe und 8°: Bedienfeld
2790 mm, Modell 2746 mm). Das ist Modellgenauigkeit, kein Bestellfehler. Ein
Maß der Kette ist geschätzt (`RINNE.sparrenUnterNase`); solange kein
Profilquerschnitt vorliegt, bleibt der Abstand. Eine Prüfung hält ihn unter
80 mm, damit er nicht unbemerkt wächst.

**Was gegengelesen werden soll:** Im Konfigurator bei Terrassendach TDS auf
„Unterkante Rinne und Unterkante Wandprofil" umschalten, Tiefe 3000 und
Rinne 2200 eingeben und prüfen, dass bei 2500 mm 6° angezeigt werden – wie
im Bestellformular des Herstellers.

**Verworfen:** Die profilkorrigierte Rechnung (siehe oben). Nicht noch
einmal einbauen, auch wenn sie zur Zeichnung besser passt.

## 2026-10-12 – SkyView: festes Gefälle 2°, abgesichert

**Anlass:** „bei skyview sind es immer 2 grad man kann keine unterkante
rinne und unterkante wandprofil eingeben" (Betreiber).

**Was jetzt gilt:** So war es bereits – SkyView ist ein eigenes Produkt,
`neigungMoeglich()` deckt nur Terrassendach TDS und Carport TDS, und das
Modell neigt die SkyView-Sparren fest um 2°. Neu sind drei Prüfungen, die
beides zusammen festhalten, damit es beim nächsten Umbau der Neigungslogik
nicht versehentlich auch für SkyView freigeschaltet wird.

**Warum das wichtig ist:** Stünde die Eingabe dort, ginge eine Neigung in
die Anfrage, die das System gar nicht hat – ein Bestellfehler, der erst beim
Hersteller auffällt.

**Dabei aufgefallen (nicht geändert):** In der Anfrage-Zusammenfassung hängen
Sparrenzahl, Pfostenzahl, Statikträger, Dachneigung und Höhe an der Wand an
`stueckliste()`. Die wird ausschließlich aus `/api/bauteile` gefüllt, und die
antwortet derzeit 503 (KV-Namensraum DACHMATRIX nicht gebunden). Damit stehen
diese Angaben aktuell in **keiner** Anfrage. Entscheidung des Betreibers
abwarten – siehe docs/NEXT_TASK.md.

## 2026-10-12 – Anfrage rechnet mit der Maßtabelle statt mit der toten Schnittstelle

**Was falsch war:** In der Anfrage, die beim Betrieb ankommt, hingen
Sparrenzahl, Pfostenzahl, Statikträger, Dachneigung und Höhe an der Wand
allein an `stueckliste()` – also an `/api/bauteile`. Die antwortet 503,
solange der KV-Namensraum DACHMATRIX nicht gebunden ist. Diese Angaben
standen damit **in keiner einzigen Anfrage**. Aufgefallen beim Nachsehen,
nicht durch eine Beschwerde: Die Anfrage sah vollständig aus, es fehlten
nur Zeilen, die niemand vermisst, solange er sie nie gesehen hat.

Zwei weitere Fehler lagen im selben Block:
- Die Höhe an der Wand rechnete mit `Z.neigung` statt mit der wirklich
  geltenden Neigung. Wer den zweiten Weg benutzt (Unterkante Wandprofil
  eingeben), hätte dort eine Zahl stehen gehabt, die nicht zu seiner
  Eingabe passt.
- `ed.geneigt` wird nirgends im Code gesetzt. Die Bedingung war also immer
  falsch – selbst mit gebundenem KV wäre die Neigung nicht erschienen.

**Was jetzt gilt:** Beide Zahlenquellen laufen über eine neue Funktion
`bauteileJetzt()`, die aus `js/masstabelle.js` rechnet. Sie bedient den
Maßhinweis unter den Maßen **und** die Anfrage – vorher rechnete der
Hinweis richtig und die Anfrage gar nicht. Dazu kommen neu in die Anfrage:
die nächste lieferbare Breite, wenn das Wunschmaß dazwischen liegt, und
eine Warnzeile, wenn die Tiefe über dem Höchstmaß liegt. Die Neigung steht
nur noch beim Terrassendach TDS – SkyView hat ein festes Gefälle von 2°.
Die Höhe an der Wand ist bei Weg 2 genau die eingegebene Zahl, nicht die
über gerundete Grad zurückgerechnete.

**Warum so und nicht anders:** Der Betreiber hat Weg 2 gewählt („2") statt
KV zu binden. Geschätzte Zahlen kommen bewusst **nicht** in die Anfrage:
Gibt die Maßtabelle nichts her (Pergola, Carport Flat Box), bleiben die
Zeilen weg. Lieber keine Zahl als eine erfundene in einer Bestellung.

**Was offen bleibt:** Sobald DACHMATRIX gebunden ist, gehört
`stueckliste()` in `bauteileJetzt()` vorgeschaltet – der Platz dafür ist
im Kommentar der Funktion benannt. Der Zusammenfassungskasten im Panel
(`k3dZus`) hängt weiterhin an der Schnittstelle und bleibt leer; das ist
so gewollt („lass das weg", Betreiber 11.10.2026).

**Was gegengelesen werden soll:** Terrassendach TDS, 5000 × 3000,
Anfrage-Text aufklappen. Es müssen jetzt Sparrenzahl, Pfosten,
Dachneigung und Höhe an der Wand dastehen. Dann auf Flachdach SkyView
umstellen: Sparren und Pfosten bleiben, **die Dachneigung muss
verschwinden**. Danach Breite auf 5800 stellen – es muss der Hinweis auf
die nächste lieferbare Breite erscheinen, und die Sparrenzahl muss
dieselbe sein wie im Kasten unter den Maßen.

## 2026-10-12 – „Alle fünf in einem Bild" wird ein PDF mit Zustandsseiten

**Anlass:** „wenn man auf alle bilder sichern geht sol anstatt ein bild,
eine pdf erstell werden mit den wichtigsten ansichten, + wenn so sachen
gibt wie aufdach ode unterdachmarkisen, etc. auch davon bilder im
geschlossenen zustand, die normalen ansichtsbilder alles im offenen
zustnd" (Betreiber).

**Was jetzt gilt:** Der Menüpunkt heißt „Alle Ansichten als PDF" und
liefert eine mehrseitige Datei: fünf Ansichtsseiten, eine Seite „Ihre
Konfiguration" in Worten, danach je eine Seite für jedes bewegliche Teil
im anderen Zustand (Markise ausgefahren, Schiebeelemente geschlossen,
Lamellen zu, Velaris zu).

**Was „offen" heißt – auf Rückfrage festgelegt:** In den fünf
Hauptansichten sind die Markisen **eingefahren** (das Dach ist zu sehen)
und die Schiebeelemente **aufgeschoben**. Die Zusatzseiten zeigen das
Gegenteil. Der Lamellenwinkel bleibt in den Hauptansichten so, wie der
Kunde ihn eingestellt hat – er ist Teil der Konfiguration, kein
Betriebszustand.

**Warum ein eigener PDF-Erzeuger (`js/pdf-blatt.js`, rund 230 Zeilen):**
jsPDF und pdfmake kämen über ein Fremd-CDN, wiegen mehrere hundert
Kilobyte und müssten in die Inhaltssicherheitsrichtlinie in `_headers`
aufgenommen werden. Gebraucht wird nur ein Bruchteil: Seiten mit je einem
JPEG und ein paar Zeilen Text. Kein Nachladen, keine Abhängigkeit, die
irgendwann nicht mehr gepflegt wird.

**Zwei Fallen, die beim Bauen aufgefallen sind:**
- Es reicht **nicht**, `Z.sonneAus` direkt zu setzen. `aendern()` liest
  die Werte aus den Formularfeldern zurück und überschreibt die Änderung
  sofort. Darum geht alles über `feldSetzen()` – denselben Weg geht auch
  `sonneFahren()`.
- Die Leinwand wird für den Druck kurz auf 1800 Pixel Breite gestellt.
  Ohne das käme das Bild in Bildschirmgröße ins PDF und wäre auf A4 quer
  sichtbar grob – auf dem Handy sind das keine 400 Pixel. Dabei muss
  `pixelRatio` auf 1, sonst rechnet three.js die Zielgröße ein zweites Mal
  hoch.

**Absicherung:** `scripts/pruefe-pdf.js` erzeugt ein PDF und liest es mit
**pdfinfo, pdftotext und pdfimages** zurück – Werkzeugen aus poppler, die
von unseren Annahmen nichts wissen. Geprüft werden Seitenzahl, Format,
alle Überschriften (mit Umlauten), die Fußzeile auf jeder Seite und die
Größe der eingebetteten Bilder. 11 Prüfungen, Gegenprobe 11/11.

**Verworfen – und warum das wichtig ist:** Die erste Gegenprobe kippte ein
Byte in der xref-Tabelle und erwartete, dass alle elf Prüfungen anschlagen.
Es schlugen nur drei an: **poppler repariert eine kaputte xref
stillschweigend.** Acht Prüfungen hätten also nichts bewiesen. Jetzt hat
jede ihre eigene Verfälschung. Auch ein überschriebener `%PDF`-Kopf reicht
nicht – poppler sucht ihn im ganzen Vorspann; die Datei muss abgeschnitten
werden.

**Was gegengelesen werden soll:** Ein Terrassendach mit Aufdachmarkise und
Schiebetüren zusammenstellen, dann „Bild speichern" → „Alle Ansichten als
PDF". Die Datei muss sich öffnen lassen und enthalten: fünf Ansichten mit
eingefahrener Markise und offenen Schiebetüren, die Konfigurationsseite,
dann zwei Seiten mit ausgefahrener Markise bzw. geschlossenen Türen.
**Wichtig:** Danach muss der Konfigurator genau so dastehen wie vorher –
gleiche Ansicht, gleiche Reglerstellungen.

## 2026-10-12 – Ein PDF-Unterbau statt zwei, Konfigurationsseite ans Ende

**Zwei Änderungen auf einmal, beide vom Betreiber:**

### 1. „die seite Ihre Konfiguration also die zusammenfassung soll das letzte blatt sein"

Die Zusammenfassung stand bisher auf Seite 6, mitten zwischen Ansichten
und Zustandsseiten. Jetzt wird sie nach den Zustandsseiten angehängt und
bleibt damit die letzte, auch wenn später weitere Zustände dazukommen.
Eine Prüfung sichert die **Reihenfolge im Code** ab, nicht nur das
Vorkommen – sonst rutscht sie beim nächsten Umbau wieder in die Mitte.

### 2. Zwei PDF-Erzeuger zusammengeführt

**Was falsch war:** Beim Bau des Konfigurator-PDFs ist mir `js/bg-pdf.js`
entgangen – der Baugenehmigungs-Check hatte seit Längerem einen eigenen
PDF-Erzeuger, mit derselben Begründung geschrieben (keine fremde
Bibliothek). Damit standen dieselben rund 40 Zeilen Dateiaufbau
(Katalog, Seitenbaum, Schriften, xref-Tabelle, Trailer) zweimal im
Projekt.

**Was jetzt gilt:** `js/pdf-blatt.js` enthält mit `ausStroemen()` den
gemeinsamen Unterbau. Er weiß nichts vom Layout und nimmt fertige
Inhaltsströme entgegen. Darauf sitzen zwei Layouts:
- `erzeugen()` – A4 quer, je Seite ein Bild (Konfigurator)
- `js/bg-pdf.js` – A4 hoch, Kästen und Tabellen (Baugenehmigungs-Check)

`js/pdf-blatt.js` muss in `src/baugenehmigung.njk` **vor** `js/bg-pdf.js`
geladen werden; fehlt es, wirft `alsBlob()` eine verständliche Meldung,
statt eine kaputte Datei zu liefern.

**Die Falle dabei:** `bg-pdf.js` schickt seinen Text durch ein eigenes
`kodieren()`, das WinAnsi und das Escapen von Klammern in einem Schritt
macht. Der Unterbau macht daraus nur noch Bytes. Würde er ein zweites Mal
umkodieren, verschöben sich die Byte-Längen und die xref-Tabelle zeigte
ins Leere – die Datei ließe sich nicht mehr öffnen. Das steht jetzt als
Warnung am Kopf von `ausStroemen()`.

**Was das wert war:** Der Baugenehmigungs-Check war **nirgends geprüft**.
`scripts/pruefe-pdf.js` erzeugt jetzt auch sein PDF und liest es mit
poppler zurück: eine Seite, A4 hoch, Inhalt vorhanden, Umlaute korrekt
(das fängt genau das doppelte Umkodieren ab). 16 Prüfungen, Gegenprobe
16/16.

**Grenze, die genannt gehört:** Geprüft wird der Dateiaufbau, nicht die
Typografie. Die Textbreite misst `bg-pdf.js` über die Canvas-API des
Browsers; im Prüfskript ersetzt eine grobe Schätzung über die Zeichenzahl.
Zeilenumbrüche können dort anders fallen als im Browser.

**Was gegengelesen werden soll:** Den Baugenehmigungs-Check auf
`/baugenehmigung.html` durchlaufen lassen und das PDF speichern – es muss
sich öffnen lassen und wie vorher aussehen. Dann im Konfigurator ein PDF
erstellen: „Ihre Konfiguration" muss die **letzte** Seite sein.

## 2026-10-12 – Höhe hinten nimmt jeden Millimeter, Neigung in ganzen Grad

**Was falsch war (beides vom Betreiber im Bild gemeldet):**

1. „das übernimmt nicht mein maß habe 2600 eingegeben es macht daraus
   2602". Der Schieberegler für die Höhe hinten hatte `step="50"`, seine
   Untergrenze ist aber `wandUkAus(2)` und damit krumm – im Beispiel
   2402 mm. Der Browser rastet auf **min + n × step**, also auf 2402,
   2452, 2502, 2552, 2602. Die 2600 gab es in diesem Raster überhaupt
   nicht; das Zahlenfeld schrieb den Wert in den Regler, und der rückte
   ihn auf den nächsten Rasterpunkt. Das betraf jede Eingabe, nicht nur
   diese eine.

2. „kene neigung wie 5,7 oderso angeben runde es nach den richtigen
   regeln auf oder ab". Angezeigt wurde die auf eine Nachkommastelle
   gerundete Rechengröße.

**Was jetzt gilt:**
- `step="1"` am Regler. Damit ist jeder Millimeterwert erreichbar,
  unabhängig davon, wo die Untergrenze gerade liegt.
- Neue Funktion `neigungAnzeige()` rundet kaufmännisch auf ganze Grad.
  Sie wird im Bedienfeld **und** in der Anfrage benutzt; der Prozentwert
  kommt aus der Tabelle zu genau dieser Gradzahl, sonst stünden dort zwei
  Zahlen, die nicht zueinander passen.

**Warum nur die Anzeige rundet:** Bindend sind die beiden Höhen, die der
Kunde eingibt – danach wird gebaut, die Gradzahl ist das abgeleitete Maß.
Würde das Modell nach der gerundeten Zahl zeichnen, stünde im Bedienfeld
eine Höhe hinten, die das Bild nicht zeigt. Dass beide dadurch leicht
auseinanderliegen (2600 mm sind genau 5,7°, angezeigt werden 6°), ist
dieselbe Ungenauigkeit, die auch das Bestellformular des Herstellers hat.
Beide Höhen stehen in der Anfrage, damit es nachrechenbar bleibt.

**Absicherung – beide Prüfungen rechnen, statt Text zu lesen:**
- „Jeder glatte Millimeterwert ist einstellbar" rechnet mit dem `step` aus
  dem HTML und der echten Untergrenze durch: Ist `(wert − min) % step`
  für jeden Hunderter null? Mit `step="50"` schlägt sie an – genau der
  gemeldete Fehler.
- „Angezeigte Neigung ist eine ganze Zahl" lädt `neigungAnzeige()` und
  `neigungGrad()` aus dem Code und prüft sechs Höhen durch; dazu der
  Einzelfall 2600 mm → 6°, damit nicht abgeschnitten statt gerundet wird.

**Was gegengelesen werden soll:** Höhe hinten auf 2600 stellen – es muss
2600 stehen bleiben, und darunter „6°" ohne Nachkommastelle. Dann einige
andere Werte durchprobieren, auch krumme wie 2637.

## 2026-10-12 – Die Konfigurationsseite im PDF neu gebaut

**Anlass:** „wenn die austattung größer wird, wird diese liste
unübersichtlich, mache es übersichtlich, design technisch ansprechend,
alle infos sollen lesbar bleiben, verkaufspsychologisch stark"
(Betreiber, mit Bild).

**Was falsch war:** Eine flache Liste in zwei Spalten, und zu lange
Angaben wurden mit „…" abgeschnitten – ausgerechnet bei den
Schiebeanlagen, also bei dem, was am meisten kostet und am meisten
erklärt werden muss. Je mehr der Kunde auswählte, desto unleserlicher
wurde das Blatt.

**Was jetzt gilt:**
- Kopf mit Produkt und Montageart, darunter vier Eckdaten als Kacheln
  (Breite × Tiefe, Durchgangshöhe, Eindeckung, Farbe)
- die Angaben nach sechs Themen gruppiert, mit Zwischentiteln
- Zeilen werden **umgebrochen, nie abgeschnitten**; reicht der Platz
  nicht, entsteht eine weitere Seite
- unten der Ablauf in drei Schritten (Aufmaß, Angebot, Montage) – der
  Grund, warum das Blatt beim Kunden liegt. Die Texte stehen in
  `pdfSeiten()` und sind leicht zu ändern.

**Woher die Gruppen kommen:** `zusammenfassung()` bleibt die einzige
Quelle – dieselbe Liste, die in die Anfrage geht. `pdfGruppen()` sortiert
nur um. Was auf kein Muster passt, landet unter „Weitere Angaben"; eine
Prüfung rechnet nach, dass jede Zeile genau einmal herauskommt. Ohne das
würde beim nächsten neuen Eintrag still eine Angabe vom Blatt fallen.

**Drei Dinge, die beim Bauen schiefgingen:**

1. *Zeichenbreiten geschätzt.* Erst fasste ich Zeichen grob zu Gruppen
   zusammen – im fertigen Blatt klafften Lücken hinter den Doppelpunkten.
   Jetzt stehen die amtlichen Helvetica-Werte in `js/pdf-blatt.js`,
   nachgerechnet gegen bekannte Sollwerte.

2. *Spalten nur gefüllt statt verteilt.* Die linke Spalte wurde voll,
   der Rest rutschte nach rechts: links halb leer, rechts überlang. Jetzt
   werden die Gruppen erst vermessen und dann so verteilt, dass beide
   Spalten etwa gleich weit reichen; eine zu große Gruppe wird geteilt und
   trägt dann „(Fortsetzung)" im Titel. Das ist auch nötig, damit eine sehr
   lange Gruppe nicht unten aus der Seite läuft.

3. *Die Prüfung log.* `pdftotext -layout` liest über **beide** Spalten
   hinweg; eine umgebrochene Angabe wird vom Text der Nachbarspalte
   unterbrochen. Die Prüfung meldete 29 von 34 fehlenden Zeilen, obwohl im
   gerenderten Bild alle dastanden. Hätte ich das geglaubt, hätte ich einen
   Fehler gesucht, den es nicht gibt – und womöglich das Layout dafür
   kaputtgemacht. Jetzt wird jede Spalte einzeln ausgeschnitten (`-x/-W`)
   und erst danach zusammengehängt.

**Absicherung:** `scripts/pruefe-pdf.js` baut zwei Konfigurationsseiten –
eine normale und eine mit 34 langen Zeilen – schreibt sie als PDF und
liest sie mit poppler zurück: alle Zeilen vollständig, kein „…", Umbruch
auf zwei Seiten, „(Fortsetzung)" vorhanden, Abschluss auf der letzten
Seite. 24 Prüfungen, Gegenprobe 24/24. Zusätzlich habe ich die Seiten als
Bild gerendert und angesehen – Layoutfehler sieht man nicht im Text.

**Was gegengelesen werden soll:** Ein Dach mit viel Ausstattung
zusammenstellen (Schiebetüren auf allen Seiten, Markise, LED), PDF
erstellen und die letzte(n) Seite(n) ansehen: Steht jede Angabe
vollständig da? Sind die Gruppen sinnvoll? Der Ablauf unten ist ein
Vorschlag – Wortlaut und Reihenfolge gern anpassen.

## 2026-10-12 – Kein Lieferantenname im Kunden-PDF, Layout nachgeschärft

**Anlass:** „verbessere es noch, und von VD soll nix drin stehen"
(Betreiber, mit Bild).

### Lieferantenname

Auf Rückfrage eingegrenzt: **nur die wörtliche Nennung, und nur im PDF.**
Die Anfrage-Mail an den Betrieb behält sie – dort wird nach ihr bestellt.
Die Systembezeichnungen (TDS, SkyView, SG23, FR23) bleiben: Sie sagen
einem Kunden nichts über den Lieferanten, und mit den Produktnamen wird
geworben.

Neue Funktion `ohneLieferant()` filtert die Zeilen auf dem Weg ins PDF.
Betroffen war eine Stelle: „(links/rechts wie im VD-Anfrageformular)".
Zusätzlich ein Sicherheitsnetz für Klammerzusätze, die den Namen später
wieder hereintragen.

**Die Prüfung ist hier wichtiger als die Funktion:** Sie sucht im
Ergebnis von `pdfGruppen()` nach „VD" als eigenständigem Wort. Damit
fällt auch eine künftig neu formulierte Zeile auf. Gegenprobe: „VSG 8 mm"
enthält dieselben Buchstaben und **muss** stehen bleiben – auch das wird
geprüft.

### Drei Verbesserungen am Layout

1. **Einheitliche Label-Spalte je Gruppe.** Vorher begann jeder Wert
   direkt hinter seinem eigenen Label; bei unterschiedlich langen Labeln
   sprangen die Werte hin und her und das Auge fand keine Kante zum
   Entlanglesen. Ein Label über 45 % der Spaltenbreite bekommt seine
   eigene Zeile.

2. **„Weitere Angaben" war nicht leer.** Im Bild des Betreibers stand
   dort „Stoff Senkrechtmarkise" – ein fehlendes Muster. Ergänzt, und
   eine Prüfung hält fest, dass bei einer gewöhnlichen Konfiguration
   **nichts** mehr in der Auffanggruppe landet. Die Gruppe bleibt als
   Netz bestehen, sie soll nur leer sein.

3. **Der Abschlussblock fiel um 0,8 Punkte aus der Seite.** Er war 40
   Punkte hoch und entfiel ersatzlos, wenn der Inhalt knapp zu tief
   reichte – ausgerechnet der Teil, der sagt, wie es weitergeht.
   *Verworfen:* ihm den Platz fest zu reservieren – das drückte eine
   ganze Gruppe auf eine zweite, fast leere Seite. *Jetzt:* zweistufig –
   erst ohne Reservierung verteilen, reicht es nicht, noch einmal mit;
   entstünde dadurch eine zusätzliche Seite, bleibt es bei der ersten
   Verteilung. Dazu ist der Block auf 34 Punkte geschrumpft: Jede Zugabe
   dort kostet genau den Platz, an dem es scheitert.

**Was gegengelesen werden soll:** PDF erstellen und prüfen, dass nirgends
„VD" steht (auch nicht bei Schiebetüren mit Senkrechtmarkisen), dass die
Werte einer Gruppe untereinander auf gleicher Höhe beginnen und dass der
Block „So geht es weiter" unten steht.

## 2026-10-12 – Fett und kursiv mit Bedeutung

**Anlass:** „arbeite auch mit dicken schriften und cursiv vllt. wo nötig"
(Betreiber).

**Was jetzt gilt:** Das PDF nutzt drei Schnitte. Kursiv ist
Helvetica-Oblique – wie die beiden anderen eine Schrift, die jeder
Betrachter mitbringt, also ohne Einbettung und ohne zusätzliche Dateigröße.

Beide Auszeichnungen tragen eine **Bedeutung**, sie sind keine Verzierung:

- **Kursiv = unter Vorbehalt.** Ein Klammerzusatz wie „(Vorschlag,
  Aufteilung nach Aufmaß)" steht abgesetzt in eigener Zeile. Beim
  Überfliegen ist damit sofort klar, welche Zahl fest ist und welche erst
  das Aufmaß entscheidet. Auch die Fußzeile ist kursiv – sie ist selbst
  ein Vorbehalt.
- **Fett = die Kernangabe.** Kurze Werte („Graualuminium", „2774 mm",
  „12er-Set") springen ins Auge, lange Beschreibungen bleiben mager.

**Drei Fehler, die erst das gerenderte Bild gezeigt hat:**

1. *Jeder Klammerausdruck galt als Vorbehalt.* Damit wurden auch
   „(15,8 %)" hinter der Dachneigung und „(links/rechts)" herausgerissen
   und kursiv abgesetzt – beides sind Präzisierungen derselben Angabe und
   gehören in dieselbe Zeile. Jetzt entscheidet der Inhalt: nur
   „Vorschlag", „Aufmaß", „Richtwert", „unverbindlich", „optional",
   „geschätzt".
2. *Zu viel fett.* Das erste Kriterium war „passt in eine Zeile" – damit
   stand fast die halbe Spalte fett und das Hervorheben sagte nichts mehr.
   Jetzt: höchstens 22 Zeichen.
3. *„nicht vorgesehen" war fett.* Fett zu setzen, was der Kunde **nicht**
   gewählt hat, betont ausgerechnet die Lücke im Angebot. Werte, die mit
   „nicht", „ohne" oder „kein" beginnen, bleiben mager.

**Absicherung:** `pdffonts` liest aus der fertigen Datei, welche Schriften
wirklich benutzt werden – fällt eine weg, merkt das sonst niemand, denn
der Text bleibt ja lesbar. Dazu zwei Prüfungen an den **rohen** Zeilen
(nicht am normalisierten Text): „7 Grad (12,3 %)" muss zusammenstehen,
„(Vorschlag …)" muss eine eigene Zeile beginnen.

**Verworfen:** Die erste Fassung dieser Prüfung verglich normalisiert und
suchte „7 Grad (12,3" – ein Teilstring des richtigen Textes, also immer
wahr, auch in der Gegenprobe. Schon wieder eine Prüfung, die nichts
beweist; sie fiel nur auf, weil die Gegenprobe 25 von 26 meldete statt
26 von 26. **Die Zahl am Ende der Gegenprobe ist deshalb wichtiger als
das „bestanden" davor.**

**Was gegengelesen werden soll:** Im PDF muss „(Vorschlag, Aufteilung
nach Aufmaß)" kursiv in eigener Zeile stehen, „Dachneigung: 9° (15,8 %)"
dagegen zusammen in einer.

## 2026-10-12 – Interne Angaben und wiederholte Vorbehalte raus aus dem Kunden-PDF

**Anlass, beides vom Betreiber:**
- „das mit nächste lieferbare breite weglassen, es wird nach kundenmaß
  gefertig das nächst lieferbare maß is nur für mich intern wichtig für
  den preis"
- „du musst nicht bei jedem element schreiben (vorschlag, Aufteilung nach
  aufmaß) reicht wenn es unten im rechtstext einmal alles drinsteht"

**Was jetzt gilt – beides nur im PDF:**

1. Die Zeile „Gerechnet mit der nächsten lieferbaren Breite" entfällt auf
   dem Kundenblatt. Gefertigt wird nach Kundenmaß; die lieferbare Breite
   ist eine Kalkulationsgröße und hätte nur die Frage aufgeworfen, warum
   dort ein anderes Maß steht als bestellt. **In der Anfrage an den
   Betrieb bleibt sie** – daran hängt der Preis. Eine Prüfung hält beide
   Seiten fest.
2. Die Zusätze „(Vorschlag, Aufteilung nach Aufmaß)" und „– Bedarf nach
   Aufmaß" fallen an der einzelnen Angabe weg. Bei drei Schiebeanlagen
   stand derselbe Satz dreimal; das liest niemand mehr, und wiederholte
   Einschränkungen lassen ein Angebot unsicher wirken. Stattdessen steht
   im Fuß, kursiv: *„Alle Maße und Aufteilungen sind Vorschläge und werden
   beim kostenlosen Aufmaß vor Ort verbindlich festgelegt; gefertigt wird
   nach Ihrem Maß."*

**Folge im PDF-Modul:** Der Fuß trägt jetzt zwei Zeilen, der Block „So
geht es weiter" ist entsprechend höher gerückt. Die gestern eingebaute
Logik, Vorbehalte je Zeile abzutrennen und kursiv abzusetzen, ist wieder
entfernt – sie hätte keine Eingabe mehr gefunden und wäre toter Code
geworden. Kursiv bleibt die Auszeichnung für genau diese Art Aussage, nur
eben im Fuß.

**Was gegengelesen werden soll:** Im PDF darf „Gerechnet mit der nächsten
lieferbaren Breite" nicht mehr stehen, in der Anfrage-Mail dagegen schon.
Hinter den Schiebeanlagen darf kein „(Vorschlag …)" mehr stehen; unten
müssen zwei kursive Zeilen stehen.

## 2026-10-14 – SkyView: Profilmaße belegt, Rahmen halb so hoch

**Anlass:** „wieso sind im 3d konfigurator die pfosten von skyview so dünn
wir haben pfosten die sind 110x110" (Betreiber).

**Was falsch war – und was nicht:** Die Pfosten stimmten. Belegt sind sie
sogar doppelt: im Modell seit jeher 110 × 110, und die Einzelteile-Liste
des Herstellers führt „Pfosten 110 × 110 × 2,5 mm" (Artikel 15190).
Falsch war der **Rahmen darüber**: Er wuchs im Modell mit der Dachtiefe
auf 268 bis 355 mm – also auf das Zwei- bis Dreifache der Pfostenbreite.
Dagegen sieht jeder Pfosten schmal aus.

**Woher die neuen Maße kommen:** Der Betreiber hat die Einzelteile-Liste
geschickt (Stand 07.10.2026). Sie liegt **nicht im Projekt** – sie enthält
Preise und fällt unter das Datenbankherstellerrecht; verarbeitet wurde sie
nur im Scratchpad. Übernommen sind ausschließlich die Querschnittsmaße,
jeweils mit Artikelnummer zum Nachschlagen:

| Profil | Artikel | Belegt | Vorher im Modell |
|---|---|---|---|
| Pfosten | 15190 | 110 × 110 × 2,5 | 110 × 110 (richtig) |
| Rinne 2 TD | 16913 | 186,3 × 136,7 | 186,3 × 136,7 (richtig) |
| Träger TD | 15698 | Kasten 96,7 × 61, mit Nut 120 | 140 tief (falsch) |
| Rinnen Blende Sky | 6079 | 89,3 breit, 29,8 / 55 hoch | fehlte |
| Seitenblende Sky | 6069 | 252 × 38,9 | als hohe Blende modelliert (falsch) |

**Der Grundfehler:** Ich hatte die „Seitenblende Sky" für die hohe
Außenblende gehalten. Sie ist mit 38,9 mm Schenkel ein flaches
Winkelprofil, das die Sparrenenden abdeckt. **Im ganzen System gibt es
kein Profil über 136,7 mm Höhe** – der Rahmen kann also gar nicht höher
sein.

**Wie das Gefälle hineinpasst:** Das war die Frage, an der ich zweimal
falsch abgebogen bin. Die Antwort steht in der Montageanleitung und im
Bild des Betreibers: **Der Sparren ist vorne ausgeklinkt**, 65 mm tief und
86 mm hoch, und taucht damit in die Rinne ein („die sparren werden beim
sky lediglich vorne so ausgeschnitten"). Hinten liegt er voll auf dem
Träger. Seine Unterkante fällt nach vorne also nur um *Gefälle minus
Ausklinkung* – bei 3 m um 19 mm statt um 105 mm. Deshalb bleibt der Rahmen
rundum gleich hoch, so wie es der Betreiber beschreibt: „außenrum sieht er
in echt auch gleich hoch aus."

Die Sparren selbst sind unverändert die des TDS: „sparren sind gleich bis
auf beim flatline dach da sind sie anders."

**Verhältnis jetzt:** Rahmen 136,7 mm zu Pfosten 110 mm = **1,24 ×**
(vorher 2,4 bis 3,2 ×). Das entspricht den Produktbildern.

**Was offen bleibt – zwei Punkte, beide dokumentiert:**
1. Ab etwa 2,6 m Tiefe reicht die Rahmenhöhe rechnerisch nicht mehr für
   das volle 2°-Gefälle; im Modell wird der Sparren dann vorne stärker
   ausgeklinkt gezeichnet, als die Anleitung angibt. Ob das echte System
   dort flacher neigt, tiefer ausklinkt oder die Rinne tiefer hängt, ist
   nicht belegt.
2. Die alte Ableitung „Rinne + Träger = 150 + 2 × 65 = 280 mm" stimmt
   nicht mit den echten Maßen überein (186,3 + 120 = 306,3). Wie der
   Sparren genau aufliegt, ergibt sich aus diesen Zahlen allein nicht.

**Was gegengelesen werden soll:** Flachdach SkyView im Konfigurator
aufrufen, Tiefe durchfahren. Der Rahmen muss bei jeder Tiefe gleich hoch
bleiben und die Pfosten müssen kräftig wirken. Von der Seite darf kein
Sparren unter dem Rahmen hervorschauen.

## 2026-10-14 – TDS gegen die Einzelteile-Liste geprüft

**Auftrag:** „in der preisliste die sachen System TD raussuchen,
analysieren und das TDS dach dann noch verbessern" (Betreiber).

**Vorgehen:** Alle elf Positionen mit System „TD" aus der Liste gezogen,
die Querschnittsskizzen in hoher Auflösung ausgelesen und gegen das
Modell gerechnet. Die Liste bleibt außerhalb des Projekts (Preise,
Datenbankherstellerrecht); übernommen sind nur Maße mit Artikelnummer.

**Das Erfreuliche:** Die meisten Maße stimmten bereits – sie kamen aus
den Einzelzeichnungen, die der Betreiber im Oktober geliefert hatte.
Bestätigt sind damit Sparren (61 × 120, Körper 96,7), Rinne (186,3 ×
136,7, Kehle 130, Schräge 82,2), Glasleiste (55,3 × 22,6),
Seitenglasleiste (63,1 × 59,4) und Statikträger (189,2 × 117).

**Korrigiert:**

| Maß | war | ist | Quelle |
|---|---|---|---|
| Wandprofil, Ausladung | 31 mm (geschätzt) | **38,6 mm** | 15188 |
| Pfosten | 110 mm | 110,2 mm | 15190 |
| Statikträger, Höhe | 189 mm | 189,2 mm | 15187 |

Die Ausladung des Wandprofils ist die einzige sichtbare Änderung – gut
7 mm mehr. Die beiden anderen sind Zeichnungsmaße, die das Modell bisher
gerundet hatte.

**Zur Einbaulage, zum vierten Mal:** Die Zeichnung zeigt das Wandprofil
LIEGEND (143,6 waagerecht, 38,6 senkrecht). Eingebaut steht es aufrecht –
143,6 hoch an der Wand, 38,6 Ausladung; das hat der Betreiber am
11.10.2026 bestätigt. Der Querschnitt sagt nichts über die Einbaulage;
genau das war schon bei SG23, Velaris und der Seitenglasleiste der Fehler.

**Nicht übernommen**, weil im Modell nicht sichtbar: Statikträgerblende
(117 × 15), Rinnenkopplung (125 × 136,7), Tropfkantenprofil (21,6 × 20),
Wand-Rinnen Blende (98,85 × 23,1), Innenkerne. Die Maße stehen hier,
falls eines davon einmal gebraucht wird.

**Absicherung:** Eine neue Prüfung stellt elf Maße gegen die Liste, jedes
mit Artikelnummer. Sie schlägt an, wenn jemand eine Zahl „glättet" –
genau das war mit den 110 statt 110,2 passiert.

**Was gegengelesen werden soll:** Terrassendach TDS mit Wandmontage, von
der Seite betrachtet. Das Wandprofil steht jetzt knapp 8 mm weiter von
der Wand ab.

## 2026-10-14 – SkyView: Sparren standen über dem Rahmen (Folgefehler)

**Anlass:** „ähm was hast du gemacht, das sieht garnicht nach dem aus was
ich geschickt hab" (Betreiber, mit Bildschirmfoto) und: „du hast die
rinnenblenden und seitenblenden ausgelassen".

**Was falsch war:** Nicht die Blenden – die wurden gezeichnet. **Sparren
und Glas standen 8 cm über den Rahmen hinaus**, deshalb verdeckten die
Blenden nichts mehr und das Dach sah aus wie ein TDS mit aufgelegten
Sparren.

**Das war ein Folgefehler meiner eigenen Korrektur von heute Vormittag.**
Mit dem alten, zu hohen Rahmen (268–355 mm) fiel es nicht auf; erst der
belegte Rahmen von 136,7 mm hat es sichtbar gemacht. In der Sparrenlage
stand ein `Math.max(hRinne, …)` – eine Untergrenze, die den Sparren nach
**oben** schob, statt ihn im Rahmen zu lassen.

**Die Rechnung dahinter:** In 136,7 mm Rahmen passen Sparren (120) und
Glas (8) – für das Gefälle bleiben **8,7 mm**. Das echte 2°-Gefälle
(bei 3 m sind das 105 mm) passt dort nicht hinein.

**Was jetzt gilt:** Die Sparrenlage wird von der Rahmenoberkante nach
unten gerechnet – Glas schließt oben mit dem Rahmen ab, der Sparren liegt
darunter, und das Gefälle ist so flach, wie der Platz es zulässt. Von
außen ist das richtig: Das Gefälle liegt innen und ist durch Rahmen und
Blenden verdeckt, genau das macht die Optik eines Flachdachs aus.

**Was offen bleibt – drei Möglichkeiten, keine belegt:** Entweder hat
SkyView ein flacheres Sparrenprofil als das TDS, oder die Sparren hängen
unten aus dem Rahmen heraus, oder der Rahmen ist an den Seiten höher als
die Rinne vorne. Was hier gezeichnet wird, ist die äußere Erscheinung,
nicht die Statik.

**Die Lehre – und die neue Prüfung:** Alle Einzelmaße waren richtig, nur
ihre **Lage zueinander** nicht. Keine der 248 bestehenden Prüfungen hat
das gefunden, weil jede nur einzelne Zahlen gegen die Liste stellte. Neu
ist deshalb eine Prüfung, die aus den Formeln des Modells die
Glasoberkante und die Sparrenunterkante rechnet und über acht Tiefen
gegen den Rahmen stellt. Sie hätte den Fehler gefunden.

**Was gegengelesen werden soll:** SkyView aufrufen und von schräg oben
ansehen. Es darf kein Sparren über den Rahmen stehen, und die Glasfläche
muss bündig mit der Rahmenoberkante abschließen.

## 2026-10-14 – SkyView: Rahmen 252 mm, belegt durch die Eckabdeckung

**Anlass:** Der Betreiber nannte zwei Artikel, die ich übersehen hatte:
„6073 6074 ZBHFLT das sind die eckblenden". Auf die Rückfrage, ob ein
25-cm-Rahmen über einem 11-cm-Pfosten stimmt: „ja richtig".

**Was die Eckabdeckung beweist:** Eckabdeckung Sky HL/HR (6073/6074) ist
**124 + 124 mm breit und 252 mm hoch**. Sie steckt über die Rahmenecke –
also ist der Rahmen dort 252 mm hoch. Die Seitenblende Sky (6069) nennt
dieselbe 252.

**Zum fünften Mal derselbe Fehler:** Die Skizze der Seitenblende zeigt
252 waagerecht und 38,9 senkrecht. Ich hatte sie deshalb für ein flaches,
liegendes Winkelprofil gehalten und die Rinnenhöhe (136,7) für die
Rahmenhöhe genommen. Mit der Eckabdeckung daneben ist klar: **252 ist die
Höhe**, 38,9 die Tiefe des Schenkels. Ein Querschnitt sagt nichts über die
Einbaulage – dasselbe war schon bei SG23, Velaris, Wandprofil und
Seitenglasleiste passiert.

**Damit geht die Geometrie endlich auf:**

| | |
|---|---|
| Rahmen | 252 mm |
| Sparren (120) + Glas (8) | 128 mm |
| bleibt fürs Gefälle | **124 mm** |
| 2° über 3,5 m braucht | 122 mm ✓ |

Die vollen 2° werden jetzt bis 3,5 m Tiefe gezeichnet. Darüber begrenzt
das Modell auf das, was hineinpasst (bei 4,5 m sind es 1,58°) – sonst
stünde das Glas wieder über dem Rahmen. Was dort real passiert, ist
weiterhin nicht belegt.

**Der Weg dorthin, ehrlich:** Heute Vormittag hatte ich den Rahmen von
268–355 mm (wachsend) auf 136,7 mm gesetzt – zu niedrig. Dann standen die
Sparren oben heraus, was ich erst nach dem Bildschirmfoto des Betreibers
bemerkt habe. Richtig ist: Der Rahmen war nie grundsätzlich zu hoch, er
durfte nur **nicht mit der Tiefe wachsen**. Genau das ließ die Pfosten je
nach Maß unterschiedlich schlank wirken – der ursprüngliche Anlass.

**Was gegengelesen werden soll:** SkyView bei 2,5 m und bei 4,5 m Tiefe
ansehen. Der Rahmen muss in beiden Fällen gleich hoch sein, kein Sparren
darf über- oder unten herausstehen.

## 2026-10-14 – Blende: fünf Rillen

**Anlass:** Auf die Frage, ob die Blende glatt mit einer Fuge oder
durchgehend gerillt ist: „5 rillen" (Betreiber).

**Was falsch war:** Die Rillenzahl wurde aus der Blendenhöhe geteilt
durch eine feste Teilung von 15 mm gerechnet. Bei der jetzt belegten
Blendenhöhe von 252 mm ergab das **sechzehn** Rillen – das sieht aus wie
ein Lamellenprofil, nicht wie die Blende auf den Produktbildern. Solange
die Blende im Modell 26 cm hoch war, fiel es weniger auf.

**Was jetzt gilt:** Fest fünf Rillen, für alle drei Blenden (vorne,
hinten, seitlich) – sie haben dieselbe Höhe.

**Absicherung:** Die Prüfung zählt die Rillen am erzeugten Querschnitt,
nicht an der Zahl im Code: Jede Rille legt vier Punkte an, dazu die vier
Eckpunkte. Die benachbarte Prüfung „Rillen ändern die Kastenmaße nicht"
rechnete noch mit alten Beispielmaßen (33,4 × 14,0 cm); sie prüft jetzt
mit den echten 252 × 186,3 mm.

**Was gegengelesen werden soll:** SkyView von vorne – die Blende muss
fünf waagerechte Rillen zeigen.

## 2026-10-14 – Die vordere Blende war 19 cm dick

**Anlass:** „die blenden links und rechts sind gut aber warum is die
vorderseite so fett" (Betreiber, mit Bildschirmfoto).

**Was falsch war:** Vorne wurde die **ganze Rinnentiefe** (186,3 mm) als
gerillter Block gezeichnet, hinten die Trägertiefe (120 mm) – seitlich
dagegen nur die Blendendicke (30 mm). Von vorne sah das Dach dadurch aus,
als hätte es eine 19 cm dicke Kante.

**Der Denkfehler:** Ich hatte Profil und Blende gleichgesetzt. Die Rinne
ist 186,3 mm tief, aber **sichtbar ist davon nur die vorderste Schicht** –
die Blende, so dünn wie an den Seiten. Die Rinne liegt dahinter.

**Was jetzt gilt:** Vorne und hinten je zwei Teile – die gerillte Blende
in Blendendicke, dahinter ein glatter Kasten über die restliche
Profiltiefe. Der schließt die Unteransicht, ohne nach vorne aufzutragen.

**Absicherung:** Eine Prüfung stellt sicher, dass **jeder**
`blendeProfil`-Aufruf die Blendendicke als Tiefe bekommt und keiner mehr
eine Profiltiefe. Dabei ist aufgefallen, dass die erste Fassung der
Prüfung die Funktionsdefinition mitzählte (deren drittes Argument heißt
„tiefe") – sie meldete 1 von 4 falsch, obwohl alle drei Aufrufe stimmten.

**Was gegengelesen werden soll:** SkyView von schräg vorne – die vordere
Kante muss genauso schlank sein wie die seitlichen.

## 2026-10-14 – Die Rillen zeigten nach innen

**Anlass:** „und von der innenseite is nix geriffelt" (Betreiber).

**Was falsch war:** Im Profil liegt die gerillte Fläche auf der Seite +x;
nach `rotateY(d)` zeigt sie in Richtung −sin(d) auf der z-Achse. Für
„nach vorne" braucht es also **−90°, nicht +90°**. Vorne und hinten war
die Drehung vertauscht – die Rillen zeigten ins Dach hinein, die glatte
Seite nach außen. Seitlich stimmte es, deshalb fiel es dort nicht auf
(„die blenden links und rechts sind gut").

**Absicherung:** Die Prüfung rechnet aus Drehwinkel und Position jedes
Aufrufs, wohin die Rillen zeigen – vorne nach +z, hinten nach −z,
seitlich nach außen. Eine Textsuche hätte das nicht gefunden: Im Code
stand eine plausible Zahl, nur mit falschem Vorzeichen.

## 2026-10-14 – SkyView: Seitenelemente schließen waagerecht an

**Anlass:** „man sieht beim sky das rahmenwand, etc. der rahmen oben
schief unter die blende geht, beim sky ist alles immer rechtwinklig an
der blende unterkante" (Betreiber, mit Bildschirmfoto der Unteransicht).

**Was falsch war:** Rahmenwand, Schiebetür und Plankenwand bekamen auch
beim SkyView die **geneigte Dachunterkante** als Oberkante – dieselbe
Rechnung wie beim TDS. Dort ist das richtig, weil die Dachunterseite
wirklich schräg ist. Beim SkyView liegt darüber der waagerechte Rahmen;
das Gefälle steckt innen und ist verdeckt.

**Was jetzt gilt:** Beim SkyView enden die Seitenelemente an der
Blendenunterkante, rechtwinklig. Übergeben wird dafür **beides**:
Neigung 0 und eine Dachunterkante, die für jede Tiefe dieselbe Höhe
liefert. Nur eines von beiden reicht nicht – die Profile richten sich
nach der Neigung, ihre Länge nach der Unterkante.

**Kein Problem ist der Keil:** Er ist beim SkyView ohnehin gesperrt
(`keilErlaubt()` lässt nur TDS und Carport TDS zu) – sonst stünde dort
jetzt ein Dreieck ohne Schräge.

**Absicherung:** Die Prüfung ruft die übergebene Funktion selbst auf und
vergleicht vier Tiefen: Sie muss überall dieselbe Höhe liefern. Eine
Textsuche hätte nicht gezeigt, ob die Höhe wirklich konstant ist.

**Was gegengelesen werden soll:** SkyView mit Rahmenwand oder
Schiebetüren, Ansicht „Darunter". Die Elemente müssen oben eine gerade,
waagerechte Kante an der Blende haben.

## 2026-10-14 – Die richtigen Seitendeckel aus der Einzelteile-Liste

**Anlass:** „beim tds gefallen mir die rinnenblenden und die
wandprofilblenden links und rechts nicht, suche die richtigen in der
einzelteileliste: Seitendeckel Wandprofil TD 6013, Seitendeckel Rinne 2
links 6011, rechts 6012" (Betreiber).

### Seitendeckel Wandprofil TD (6013) – jetzt belegt

| | war | ist |
|---|---|---|
| Breite | 140 mm (geschätzt) | **89,16 mm** |
| Höhe | 175 mm (geschätzt) | **146,27 mm** |
| Bogen | nur über der oberen Ecke | über die ganze Außenkante |

**Zum sechsten Mal dieselbe Falle:** Die Skizze zeigt den Deckel
**liegend**, mit dem Bogen oben. Eingebaut steht er: „146,27 is höhe,
89,16 is breite", „der flache bogen muss nach rechts zeigen, das bild is
falsch gedreht" (Betreiber). Diesmal hat er es gesagt, **bevor** es im
Modell stand – bei SG23, Velaris, Wandprofil, Seitenglasleiste und der
SkyView-Seitenblende war es jedes Mal andersherum.

### Seitendeckel Rinne 2 links/rechts (6011/6012)

Im Modell stand die Form des Artikels **6017** („Seitendeckel Rinne 2 TD
beidseitig") – ein Rechteck mit **einer** abgeschrägten Ecke. Die
seitenspezifischen Deckel, die der Betreiber nennt, haben **zwei**: oben
und unten an der Vorderkante, dazu eine leicht fallende Oberkante.

Die Hauptmaße 172 × 175 bleiben: Sie stammen aus der bemaßten Skizze zu
6017, und der Betreiber hat ausdrücklich darauf hingewiesen, dass dort
Maße stehen. Für 6011/6012 selbst gibt es in der Liste nur ein Foto –
Fasentiefe und Fall der Oberkante sind daran abgeschätzt.

**Der alte Widerspruch bleibt:** Deckel 172 × 175 gegen Rinne 186,3 ×
136,7. Die Maße passen nicht zueinander, und keine der beiden Quellen
erklärt es.

**Absicherung:** Die Prüfung misst beide Umrisse am erzeugten Querschnitt
und zählt die Ecken – sechs bei der Rinnenkappe (zwei Fasen), zwei
Bogenstücke bei der Wandkappe. Sie prüft zusätzlich, dass die Wandkappe
**höher als breit** ist; genau das war vorher verdreht.

**Was gegengelesen werden soll:** Terrassendach TDS von der Seite. Am
Wandprofil muss der Deckel hochkant stehen und außen rund auslaufen, an
der Rinne oben und unten eine Fase haben.

### 14.10.2026 – Der Widerspruch Deckel/Rinne ist aufgelöst (Bild des Betreibers)

Zwei Tage lang stand hier „**Der alte Widerspruch bleibt:** Deckel
172 × 175 gegen Rinne 186,3 × 136,7. Die Maße passen nicht zueinander, und
keine der beiden Quellen erklärt es." Das war die falsche Schlussfolgerung
aus richtigen Zahlen: Beide Angaben stimmen, sie beschreiben nur nicht
dieselbe Fläche.

Der Betreiber hat es zweimal gesagt und dann gezeigt:

> „Rinne 2 TD 16913 TD das is der querschnitt der rinne also quasi wenn man
> die terassenüberdachung die breite in der mitte durchschneidet und dann
> von der seite draufguckt bzw. so sieht die rinne auf der rechten seite aus
> wenn man den rinnendeckel weglässt und der rinnendeckel muss damit matchen"

> „du musst nicht nur doof die maße nehmen, du musst dir die technische
> zeichnung angucken und das design auch nachbauen"

Dazu ein Bild: der Rinnenquerschnitt aus der Einzelteileliste, in den der
Deckelumriss **gelb eingezeichnet** ist, dazu Dachsparren (grün), Glas
(blau) und der 110×110-Pfosten (rot). Nachgemessen ist der gelbe Umriss
dort 503 × 522 Pixel bei 540 Pixeln Rinnenbreite (186,3 mm), also rund
**169 × 176 mm** – das sind die 172 × 175 der Skizze.

**Was jetzt gilt.** Der Deckel ist nicht so groß wie der Rinnenquerschnitt,
sondern größer in der Höhe und kürzer in der Tiefe:

* vorne bündig mit der Rinnenvorderkante,
* oben 5 mm über die Nase hinaus,
* unten 33 mm unter den Rinnenboden – dort deckt er den Übergang zum
  Pfosten ab,
* hinten 14 mm kürzer als die Rinne tief ist; der untere Flansch schaut
  heraus (im Bild deutlich zu sehen),
* und seine **hintere Kante steht schräg**: oben rund 32 mm weiter vorne
  als unten. Diese Schräge fehlte bisher ganz, der Deckel hatte eine
  senkrechte Hinterkante.

Die vier Lagewerte sind am markierten Bild abgemessen, Genauigkeit rund
± 5 mm.

**Was verworfen wurde.** Ein erster Versuch an diesem Tag hat den Deckel
auf den Rinnenumriss geschrumpft (186,3 × 136,7 plus 2,5 mm Überstand),
weil „muss damit matchen" so gelesen wurde. Das Bild zeigt das Gegenteil.
Verworfen wurde damit auch die Prüfung „Deckel deckt den Wasserquerschnitt
der Rinne ab" – sie würde dauerhaft fehlschlagen, denn die 14 mm hinten
sind gewollt. Ebenso hinfällig: die frühere Notlösung „in der Höhe mittig",
die nur solange galt, wie unklar war, wie die beiden Teile zueinander
stehen.

**Absicherung.** Drei neue Prüfungen in `scripts/pruefe-masstabelle.js`,
jede mit eigener Verfälschung gegengeprüft:

| Prüfung | schlägt an, wenn |
|---|---|
| hintere Kante steht schräg | jemand wieder `lineTo(0, h)` schreibt |
| sitzt wie im markierten Bild | die Lageformel auf „mittig" zurückgedreht wird |
| übergreift das Profil in der Höhe | der Deckel kleiner wird als die Rinne hoch ist |

Beide Verfälschungen wurden einzeln eingebaut und haben **nur** die
jeweils zuständige Prüfung rot gemacht – nicht die anderen. Zusätzlich
wurde der Querschnitt als Bild gerendert (Rinne schwarz, Deckel gelb) und
mit dem Bild des Betreibers verglichen. In `scripts/pruefe-markise.js`
stand die alte Lage als eigene Prüfung („in der Höhe mittig") und ist
mitgezogen.

**Was gegengelesen werden soll:** Terrassendach TDS von der Seite. Der
Deckel muss die Rinne oben knapp und unten deutlich überragen, seine
hintere Kante schräg stehen, und der Rinnenflansch hinten unten darf
herausschauen.

### 14.10.2026 – Wandprofil: echtes Profil statt Quader, und es deckt die Glasleiste ab

> „das wandprofil is zu tief brudiiiiiii das musst du doch sehen, die
> glasleiten können dochnicht höher wie das profil sein amk"
> (Betreiber, mit zwei Bildschirmfotos der Seitenansicht)

Drei Fehler auf einmal, alle im Bild zu sehen.

**1. Der Seitendeckel stand 5 cm frei in der Luft.** Die Einzelteileliste
nennt den Seitendeckel Wandprofil TD (6013) mit 146,27 × 89,16 mm. Das
Wandprofil lädt aber nur 38,6 mm aus. Der Deckel ragte damit um gut 5 cm
vor das Profil hinaus – das ist der schwarze Klotz auf dem Bild. Gezeichnet
wird er jetzt profilbündig (38,6 + 2 mm Überstand), die Höhe 146,27 bleibt.

*Bewusste Abweichung vom belegten Maß, und sie ist nicht geklärt:* Was die
89,16 mm am echten Teil sind, weiß ich nicht. Entweder deckt der Deckel
außer dem Profil noch die Stirnseite des äußeren Sparrens mit ab
(38,6 + 50 = 88,6 – das käme fast genau hin), oder das Maß ist über den
Bogen abgewickelt. **Das muss am Teil nachgesehen werden.**

**2. Die Glasleiste stand über dem Profil.** Die Oberkante des Profils hing
an der Glas*oberseite* – auf dem Glas sitzt aber noch die Abdeckleiste,
22,6 mm hoch. Genau um dieses Maß stand sie über. Die Vorgabe dazu stand
seit dem 11.10.2026 im Code („das wandprofil soll die glasleisten abdecken
also selbe höhe bis zu den glasleisten"), umgesetzt war sie nur bis zur
Scheibe.

*Dabei wurde ein Konflikt sichtbar, der vorher niemandem auffiel:* Sparren
(120 mm) + Glas (8) + Abdeckleiste (22,6) sind zusammen 150,6 mm, das
Profil ist 143,6 mm hoch. **Beides gleichzeitig geht nicht** – entweder
steht die Leiste oben über oder der Sparren unten vor. Nach der Vorgabe des
Betreibers schließt das Profil oben ab; der Sparren steht unten um 7 mm
vor. Die Prüfung rechnet diesen Überstand nach und lässt höchstens 10 mm
zu – mehr wäre ein Rechenfehler, nicht die Bauart.

**3. Das Profil war ein glatter Quader.** Gebaut wurde es mit
`balken(...)`, also als massiver Block.

> „die unterseite hier auf dem bild die zwei offenen kammern müssen nach
> rechts gucken nicht nach unten"

> „links die flache seite muss bündig an der wand anliegen quasi is das
> profil dann etwas geneigt"

> „ja die vorderseite is geneigt weil die sparren die in der kammer liegen
> haben ja gefälle nach vorne"

Jetzt ein gezogenes Profil: geschlossene Rückwand an der Wand, drei
Schenkel nach vorne, dazwischen zwei nach vorne offene Kammern. Die
Vorderkante läuft keilig – oben 38,6 mm, unten 37 mm, beide Maße aus der
Zeichnung zu 15188; der Grund dafür steht jetzt als Kommentar an der
Stelle.

**Was ich falsch gelesen hatte:** Ich hatte zuerst geschlossen, 143,6 sei
die Tiefe und 38,6 die Höhe – die siebte Auflage derselben Falle. Der
Betreiber hat sofort widersprochen: „143,6 is höhe, 37 is breite unten,
38,6 is breite oben". Der Code hatte es an dieser Stelle richtig.

**Absicherung:** vier Prüfungen, jede einzeln mit einer echten
Verfälschung gegengeprüft:

| Verfälschung | schlägt an |
|---|---|
| wieder `balken(...)` statt Profil | „Wandprofil wird nicht ersetzt" |
| Deckel wieder 89,16 tief | „Seitendeckel steht nicht vor dem Wandprofil" |
| Oberkante wieder nur bis Glas | „Wandprofil deckt die Glasleiste ab" |
| Mittelsteg entfernt | „Profil mit zwei Kammern, kein Quader" |

Die letzte rutschte im ersten Anlauf **durch** – sie zählte nur Ecken, und
ein Profil ohne Mittelsteg hat genauso viele. Sie zählt jetzt die Punkte,
die vorne an den Schenkeln liegen (sechs: zwei je Schenkel).

**Was gegengelesen werden soll:** TDS von der Seite und von unten. Der
Deckel darf nicht mehr vor dem Profil schweben, die Glasleisten müssen an
der Wand unter dem Profil verschwinden, und von unten müssen die zwei
Kammern zu sehen sein.

### 14.10.2026 – Sparren in die untere Kammer, Glasleiste in die obere

> „wie ich schon gesagt hatte der sparren muss in dem wandprofil in die
> untere öffnun reingehen bis an die wandprofilwand, und die glasleiste
> muss in die obere öffnung" (Betreiber, mit Bild von unten)

Die Sparren begannen an der **Vorderkante** des Wandprofils und stießen
stumpf davor; Glas und Abdeckleiste hängen an derselben Größe und endeten
deshalb ebenfalls davor. Jetzt reicht der Sparren bis an die **Rückwand**
des Profils, also durch die untere Kammer hindurch – Glas und Leiste laufen
mit in die obere.

**Warum vorher das Gegenteil im Code stand.** Am 11.10.2026 wurde genau
diese Zeile andersherum gesetzt („Sparrenanfang = Profilvorderkante"), und
das war damals richtig: Das Wandprofil war ein **massiver Quader**, ein
Sparren darin wäre spurlos verschwunden und das Profil hätte als
waagerechtes Band unter den Sparren gewirkt – genau die Rückmeldung von
damals. Seit das Profil echte Kammern hat (siehe Eintrag davor), gilt
wieder die Bauart. Beide Entscheidungen sind richtig, nur zu
verschiedenen Modellen.

**Lage des Mittelstegs.** Die Zeichnung zu 15188 bemaßt ihn nicht. Er wird
deshalb aus den Teilen abgeleitet, die in die Kammern gehören: oben Scheibe
(8 mm) und Abdeckleiste (22,6 mm) plus die Blechstärken von Schenkel und
Steg, zusammen 35,6 mm von 143,6 – also 24,8 % von oben. Der Rest ist die
große Kammer für den Sparren.

**Was nicht aufgeht, und warum das so bleibt.** Sparren (120) + Scheibe (8)
+ Leiste (22,6) sind 150,6 mm, das Profil ist 143,6 mm hoch. Die obere
Kammer bekommt ihr volles Maß, dafür ragt der Sparren 2,5 mm in den Steg
und 7 mm unter die Profilunterkante. Im Bild ist davon nichts zu sehen –
es sind Bleche, die ineinanderstehen. **Offen bleibt, wie das am echten
Teil gelöst ist** (Ausklinkung am Sparren? anderes Profil?).

**Absicherung:** drei Prüfungen, jede mit eigener Verfälschung gegengeprüft
– Sparren wieder vor dem Profil, Steg zu weit oben (obere Kammer 16,5 statt
30,6 mm), Steg zu weit unten (untere Kammer 76,5 statt 105,5 mm). Jede hat
nur die zuständige Prüfung rot gemacht.

**Was gegengelesen werden soll:** Blick von unten an die Wand. Der Sparren
muss in der unteren Öffnung stecken und an der Profilrückwand anstoßen, die
Glasleiste in der oberen Öffnung liegen. Kein Spalt zwischen Sparrenstirn
und Profil.

### 14.10.2026 – Seitendeckel Wandprofil: die 89,16 mm stimmen doch

> „der seitendeckel für das wandprofil ist unterdeminsioniert bzw. in der
> höhe ok aber in der breite etwas zu schmal" (Betreiber, mit Bild)

Wenige Stunden vorher war der Deckel (6013) hier von 89,16 mm auf
Profiltiefe gestutzt worden, weil er im Bild 5 cm frei vor dem Profil zu
schweben schien. **Das war die falsche Abhilfe für ein echtes Problem.**
Der Grund für das Schweben war nicht der Deckel, sondern dass die Sparren
damals erst *vor* dem Profil begannen – der Bereich, den er abdeckt, war
schlicht leer.

Seit die Sparren in der unteren Kammer stecken und nach vorne weiterlaufen,
ist klar, was die 89,16 mm sind: **Profil (38,6) + Stirnseite des äußeren
Sparrens (rund 50).** Beide Maße des Deckels sind damit belegt und bleiben:
146,27 hoch × 89,16 breit.

**Lehre, schon wieder dieselbe:** Ein Teil, das im Bild falsch aussieht,
ist nicht automatisch falsch bemaßt. Hier hing es an einem *anderen* Teil,
das nicht an seinem Platz war. Die Korrektur war eine Woche Arbeit am
falschen Ende – gerettet nur dadurch, dass der Betreiber sofort
widersprochen hat.

**Absicherung:** Die Prüfung misst jetzt nicht mehr nur den Deckel, sondern
auch, ob der Bereich davor überhaupt gefüllt ist (also ob die Sparren im
Profil beginnen). Gegengeprüft mit zwei Verfälschungen: Deckel wieder
gestutzt → schlägt an; Sparren wieder vor dem Profil → schlägt ebenfalls
an, obwohl der Deckel unverändert ist. Genau diese zweite Verfälschung
hätte den ursprünglichen Fehler gefunden.

**Was gegengelesen werden soll:** TDS schräg von vorne an der Wand. Der
Deckel muss das Profil UND die Sparrenstirn abdecken und dabei am Sparren
anliegen, nicht davor schweben.
