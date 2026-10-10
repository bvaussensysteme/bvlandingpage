# Erledigt – Archiv

> Abgeschlossene Arbeitsschritte, ausgelagert aus `docs/NEXT_TASK.md`.
> **Diese Datei wird durchsucht, nicht gelesen** – `grep -i "stichwort" docs/erledigt-archiv.md`.
> Neueste oben. Das *Warum* steht in `docs/entscheidungen.md`.

---

## 10.10.2026 – 3D-Konfigurator Terrassendach TDS (PR #256, live)

**Was war falsch.** `konfigurator.html` war eine „Kommt bald"-Seite mit
Benachrichtigungs-Formular – verlinkt aus der Hauptnavigation, dem Footer und
von vier Produktseiten. Sie versprach seit Monaten einen 3D-Konfigurator, den
es nicht gab. Auslöser war die Frage des Betreibers, ob so etwas wie auf
`antonov-outdoor.de/konfigurator/` machbar sei (derselbe Hersteller).

**Was jetzt gilt.** Die Seite zeigt ein dreidimensionales Modell des
Terrassendachs TDS. Wählbar sind Aufbau (Hauswand oder freistehend), Breite,
Tiefe, Durchgangshöhe, Eindeckung (VSG klar, VSG opal, Polycarbonat), vier
Farben, Seitenelemente links/rechts/vorne (offen, Festverglasung,
Schiebeelement), LED-Beleuchtung und Montage. Das Modell baut sich bei jeder
Änderung neu auf – Pfosten, Sparren, Dachneigung, Rinne, Hauswand und
Schattenwurf passen sich an, ab 6 m Breite kommt ein dritter Pfosten dazu.
Dazu Ansichten, Tag/Abend, automatisches Drehen und „Bild speichern".
„Konfiguration anfragen" übergibt alles an den Anfrage-Assistenten.

**Was gegengelesen werden soll.** Dreh- und Zoomverhalten auf einem echten
iPhone – im Container lässt sich nur emulieren. Ob die Darstellung dem
entspricht, was tatsächlich gebaut wird (Profilmaße, Dachneigung rund 6°).

---

## 16.09.2026 – Konfigurator-Fenster scrollte nicht (PR #253, #254, live)

**Was war falsch.** Meldung des Betreibers: *„wenn man mit finger scrollt dann
scrollt nur der hintergrund hinter dem pupop"*. Dazu lag die goldene
„Weiter"-Leiste über der letzten Kartenreihe.

**Ursache.** Eine Regel aus der Zeit, als der Assistent fest in der Seite
stand: `.aw-body { overflow: visible }` und `.anfrage-wizard { max-height:
none }` unter 560 px. Damals scrollte die Seite – im Bottom-Sheet gibt es
diese Seite nicht mehr, also fiel die Geste auf den Hintergrund durch und der
Inhalt lief unter die Navigationsleiste.

**Was jetzt gilt.** `#bvKonfigPanel .aw-body` hat wieder einen eigenen
Scrollbereich mit `overscroll-behavior: contain`. Der Hintergrund wird
fixiert, die Scrollposition gemerkt und beim Schließen wiederhergestellt –
aber nur im Sheet-Layout. Mein erster Versuch (PR #253) fror auch den Desktop
ein, wo die Seite hinter dem schwebenden Fenster immer scrollen durfte; das
hat PR #254 korrigiert.

---

## 16.09.2026 – Pflichtfelder im Anfrage-Assistenten (PR #250–#252, #255, live)

Anrede (Frau/Herr/Divers), Nachname, E-Mail, Telefon, PLZ und Ort sind Pflicht;
Vorname ist optional. PLZ muss fünf Ziffern haben, Telefon mindestens sechs
Ziffern in beliebiger Schreibweise.

**Beim Umbau aufgefallen:** Die Fake-Erkennung prüfte ihre Zeichenmuster nur
auf dem Vornamen. Nach dem Tausch wären „xxxx" oder „qwertz" als Nachname
durchgegangen – sie läuft jetzt über beide Felder.

---

## 09.09.2026 – Baugenehmigungs-Daten: falsche Werte und Widersprüche (live)

**Was war falsch.** Meldung: *„prüfe aber die entstehenden infos teilweise
widersprüchlich"*. Die Prüfung ergab zwei Arten von Fehlern:

1. **Rheinland-Pfalz war sachlich falsch.** Überall stand „bis 50 m²
   Grundfläche und 4,50 m Wandhöhe". Tatsächlich bemisst § 62 Abs. 2 Nr. 2
   LBauO Terrassenüberdachungen nach **umbautem Raum: 50 m³** – das sind grob
   rund 20 m² bei 2,50 m mittlerer Höhe, also weniger als die Hälfte dessen,
   was die Seite versprach. Carports dagegen nach Fläche (50 m², 3,20 m
   mittlere Wandhöhe). Grenzbebauung 12 m je Grenze, nicht 9 m.
2. **Innere Widersprüche.** Der Kaltwintergarten trug das Etikett
   „genehmigungspflichtig", während der Text daneben genehmigungsfreie Fälle
   nannte. Derselbe Status hatte je nach Land mal gelbe, mal rote Farbe.
   Berlin und Hamburg behaupteten pauschal „grundsätzlich
   genehmigungspflichtig" – nicht belegt.

**Was jetzt gilt.** RLP, Hessen und NRW sind am Gesetzestext gegengeprüft
(Feld `geprueft` in `js/baugenehmigung-data.js`), die übrigen 13 Länder sind
zurückhaltend formulierte Übersichtsangaben; die Quellzeile sagt das offen.
Dieselben falschen Zahlen standen auch im FAQ-Schema, in vier Ratgebern und
auf sechs Ortsseiten – alles mitkorrigiert.

**Gesichert durch** `scripts/pruefe-lbo-daten.js`.

---

## 09.09.2026 – PDF-Download im Baugenehmigungs-Check (live)

**Was war falsch.** Erst über den Druckdialog gelöst. Meldung vom iPhone:
*„also auf dem handy lädt nix runter"* – Safari auf iOS ignoriert
`window.print()` stillschweigend.

**Was jetzt gilt.** `js/bg-pdf.js` erzeugt die Datei selbst und liefert sie
als echten Download aus: eigener schlanker PDF-Schreiber mit den in jedem
Reader eingebauten Standardschriften, rund 9 KB pro Datei, keine externe
Bibliothek. Textbreiten werden über die Canvas-API gemessen; passt der Inhalt
nicht, verkleinert der Generator schrittweise – **das Ergebnis bleibt
garantiert einseitig**.

---

## 09.09.2026 – Preis-Klarstellung (live)

**Was war falsch.** Eine ChatGPT-Antwort nannte Preisspannen („4.000–7.000 €
für 4 × 3 m") und setzte die Quellenangabe BV AussenSysteme daneben. Prüfung:
Auf der Website steht **keine einzige Preisangabe** – die Zahlen stammten aus
der zweiten zitierten Quelle, einem Vergleichsportal.

**Was jetzt gilt.** Kostenseite, FAQ-Schema und `llms.txt` sagen ausdrücklich,
dass kursierende Richtwerte nicht von BV AussenSysteme stammen. Drei
Produktseiten warben außerdem mit dem Button „Preisbeispiele" und verlinkten
auf Ratgeber, die bewusst keine enthalten – jetzt „Kostenfaktoren".

**Gesichert durch** `scripts/pruefe-keine-preise.sh`.

---

## 09.09.2026 – Datenschutzerklärung: tote Verweise, fehlender Abschnitt (live)

Beim Entfernen des KI-Chat-Abschnitts verschoben sich die Abschnittsnummern.
„Siehe Abschnitt 14" zeigte auf IONOS, das inzwischen 13 war; „siehe Punkt 17"
auf einen Abschnitt, den es nicht mehr gab. Beide verweisen jetzt auf
Abschnittsnamen. Neu ergänzt: Abschnitt zur Vertragsabwicklung und zu
Anfragen über Online-Marktplätze – dieser Teil fehlte komplett, obwohl er die
häufigste Verarbeitung im Betrieb beschreibt.

**Gesichert durch** `scripts/pruefe-datenschutz.py`.

---

## 09.09.2026 – Konfigurator-Fenster auf der Startseite (PR #249, live)

Der Button scrollte dort nur zum Assistenten, statt das Fenster zu öffnen.
Gelöst per DOM-Verschiebung statt Duplikat (doppelte IDs hätten
`anfrage-wizard.js` lahmgelegt). Dabei zwei bestehende Fehler mitbehoben:
`js/main.js` verwendete `#hamburgerBtn` und `.navbar` ungeprüft – auf den 14
Ortsseiten brach das Skript ab, **alles danach lief dort nie** (Sticky-Leiste,
Kontaktformular-Logik, Navbar-Schatten).
