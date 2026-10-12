# Erledigt – Archiv

> Abgeschlossene Arbeitsschritte, ausgelagert aus `docs/NEXT_TASK.md`.
> **Diese Datei wird durchsucht, nicht gelesen** – `grep -i "stichwort" docs/erledigt-archiv.md`.
> Neueste oben. Das *Warum* steht in `docs/entscheidungen.md`.

---

## 10.10.2026 – Carport und Flachdach SkyView im 3D-Konfigurator

**Was war falsch.** Der Konfigurator konnte nur das Terrassendach TDS. Für
Carport, Flachdach und Pergola stand unter dem Fenster nur der Hinweis, diese
Systeme kämen später – obwohl der Carport das zweitstärkste Produkt ist und im
Anfrage-Assistenten längst den ausführlichsten Ablauf hat (Typ, Ausführung,
Dach, Nebenraum).

Beim Abgleich mit dem Assistenten fielen drei stille Übergabefehler auf, die
seit dem Bau des Konfigurators bestanden: Übergeben wurde `verglasung:
"VSG-Glas"`, `led: "Ja"` und `farbe: "Anthrazit"`. Der Assistent kennt dort
aber nur `"VSG-Glas Opal (milchig)"`, `"Ja, mit LED-Spots"` und
`"Anthrazit (RAL 7016)"`. Folge: Wer zurückblätterte, fand keine Auswahl
markiert – und in der E-Mail an den Betrieb stand bei der Beleuchtung eine
**leere Zeile** (`LED-Beleuchtung: `), weil die Set-Größe fehlte. Der
Kundenwunsch „mit LED" ging damit verloren, ohne dass irgendwo eine
Fehlermeldung kam.

**Was jetzt gilt.** Oben im Bedienfeld steht die Produktauswahl mit drei
Einträgen:

- **Terrassendach TDS** – wie bisher
- **Flachdach SkyView** – flachere Neigung (2,5° statt 6°), schmalere Profile,
  hohe gerade Frontblende
- **Carport** – mit Carport-Typ (Carport TDS, Flat Line, Flat Box) und der
  dazu passenden Ausführung; bei Flat Line und Flat Box tritt an die Stelle
  der Eindeckung die Dachauswahl (Trapezblech, Solar, Dachbegrünung)

Je Produkt gelten eigene Maßbereiche: ein Carport ist tiefer (4,5–8 m) und
niedriger (2,0–2,6 m) als ein Terrassendach. Beim Produktwechsel springen die
Schieberegler auf die Voreinstellung des neuen Produkts. Nicht passende
Bedienfelder blenden sich aus (`data-k3d-fuer` in der Seite, ausgewertet in
`gruppeGilt()`).

Neu in der Geometrie: vier Pfosten statt zwei Reihen an der Wand, Längsträger,
Dachüberstand (eigener Regler, 500–1500 mm), umlaufende waagerechte Blende mit
innenliegendem Gefälle bei den Flachdächern, Solarmodule beziehungsweise
Gründachaufbau, Seiten- und Hinterwandverkleidung, Sektionaltor und der
abgetrennte Nebenraum im hinteren Drittel.

Die Übergabe an den Anfrage-Assistenten verwendet jetzt durchgehend dessen
eigene Auswahlwerte (`VORGABE_VERGLASUNG`, `VORGABE_LED`, `VORGABE_FARBE`,
Carport-Typ und Ausführung wörtlich). Der Assistent nimmt zusätzlich die
Felder `dach` und `ueberstand` entgegen. Steht „Ja" bei LED ohne gewählte
Set-Größe, schreibt der Assistent „Ja – Set noch offen" statt einer leeren
Zeile.

**Was geprüft wurde.** `scripts/pruefe-konfigurator.js` (neu) liest aus den
fertigen Dateien zurück und vergleicht jeden Übergabewert mit den
Auswahlwerten des Assistenten – bewusst nicht über eine gemeinsame Liste, die
den Fehler mitwandern ließe. Gegenprobe mit fünf eingebauten Fehlern:
bestanden. Dazu ein Browser-Durchlauf (Playwright, SwiftShader) über sieben
Produkt- und Ausführungskombinationen: jede erzeugt ein anderes Bild
(Bildsignaturen alle verschieden), keine JS-Fehler, Querscrollen auf dem
iPhone-Format nein. Nach der Übergabe wurde im Assistenten zurückgeblättert
und abgelesen, welche Karten als gewählt markiert sind – Produkt, Carport-Typ,
Ausführung, Dach, Eindeckung, LED, Farbe und Montage standen alle richtig.

**Was gegengelesen werden soll.** Ob die Carport-Darstellung dem entspricht,
was tatsächlich gebaut wird: Pfostenmaß (angenommen 14 cm), Tiefe des
Nebenraums (gedeckelt auf 1,6 m), Höhe der Flachdach-Blende (26 cm) und die
Standardmaße, die beim Umschalten erscheinen (3200 × 5500 mm, Durchfahrt
2200 mm). Außerdem: Darf Flat Box wirklich alle vier Standardfarben (nur Flat
Line ist auf drei beschränkt)?

**Was verworfen wurde.** Eine eigene Konfigurator-Seite je Produkt – vier
Seiten mit fast gleichem Inhalt hätten sich gegenseitig Konkurrenz gemacht und
viermal gepflegt werden müssen. Ebenso die Idee, die Maße beim Produktwechsel
umzurechnen statt zurückzusetzen: ein 3 m tiefes Terrassendach ergibt als
Carport keinen sinnvollen Startwert.

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


---

# Aus dem Einstieg verschoben am 12.10.2026

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
  (07.11.2025) ist eingearbeitet, bemaßt aber keine Profilquerschnitte.
  Sparren und Glasleisten sind laut Betreiber dieselben wie bei TDS und
  damit belegt; die Sparren sind normale TDS-Profile, nur 2° geneigt –
  keine Keile. GESCHÄTZT bleiben die Blendendicke und der Platz, den die
  Rinne unter dem Dach braucht (55 mm).
  *(An dieser Stelle standen bis zum 12.10.2026 drei sich
  widersprechende Fassungen übereinander – ein Überbleibsel aus
  aufgelösten Merge-Konflikten. Der aktuelle Stand steht in
  `docs/NEXT_TASK.md`.)*
- **SkyView freistehend oder Wandmontage?** `js/masstabelle.js` führt
  SkyView als `montage: 'wandmontage'`. Die Montageanleitung beschreibt
  durchgehend die FREISTEHENDE Anlage mit vier Pfosten, Fundamenten und
  Träger TD hinten; für die Wand gibt es eine eigene Wand-Rinnen-Blende
  (15185). Beides gibt es also – die Angabe in der Maßtabelle sollte
  geprüft werden
- **Statikträger: dritte Variante „überstehend"?** Das Bestellformular
  des Herstellers kennt drei Möglichkeiten: „ohne / überstehend / unter
  Rinne". Im Konfigurator gibt es nur das Häkchen „Statikträger unter
  der Rinne". Was „überstehend" baulich bedeutet und ob es angeboten
  werden soll, ist offen
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
