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
