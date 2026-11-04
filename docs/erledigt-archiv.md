# Erledigt – Archiv

> Abgeschlossene Arbeitsschritte, ausgelagert aus `docs/NEXT_TASK.md`.
> **Diese Datei wird durchsucht, nicht gelesen** – `grep -i "stichwort" docs/erledigt-archiv.md`.
> Neueste oben. Das *Warum* steht in `docs/entscheidungen.md`.

---

## 31.10./01.11.2026 – Anklickbare Felder am Modell und Zuordnung je Feld

> Ausgelagert aus `docs/NEXT_TASK.md` am 01.11.2026. Das *Warum* steht in
> `docs/entscheidungen.md` unter den Einträgen vom 31.10. und 01.11.2026.

#### Anklickbare Felder am Modell — zweite Bauart *(31.10.2026)*

Jedes **Seitenfeld** und das **Dach** sind am Modell markiert. Fährt man mit
dem Zeiger darüber, färbt sich das ganze Feld **orange durchsichtig**; ein
Klick springt in den passenden Bereich (Feld → **Seiten**, Dach → **Dach**)
und die angesprungene Zeile leuchtet kurz auf.

**Die zweite Bauart ist der Kern dieses Eintrags.** Bis zum Nachmittag des
31.10.2026 waren die Marken **HTML-Knöpfe über der Leinwand**, deren Lage je
Bild aus der Kamera gerechnet wurde. Der Betreiber hat viermal dasselbe
gemeldet, zuletzt präzise:

> „und die Punkte drehen sich quasi immer in Kamerarichtung und bleiben nicht
> flach wie dieses Feld immer stehen … wenn man dann mit der Maus über dieses
> Feld fährt, dann sieht dieses Feld wie markiert aus … in orange
> durchsichtig."

Jetzt ist jedes Feld eine **Fläche in der Szene** (`feldGruppe` in
`js/konfigurator-3d.js`), genau dort, wo das Element säße, mit dem Zeichen
**flach darin**. Damit erledigt die Tiefenprüfung der Grafikkarte die
Verdeckung von selbst, die Fläche dreht sich mit dem Modell und wächst beim
Zoomen mit — sie *ist* an dieser Stelle. **Ersatzlos weggefallen:**
Projektion je Bild, `markeSichtbar()`, `markenVerdeckungPruefen()`,
`markenStellen()` und das Nachziehen bei Größenänderung. Alles, was am
31.10.2026 vormittags dahinter vermutet wurde, war Folge der ersten Bauart.

- **Leeres Feld:** Fläche zu 9 % weiß angedeutet, Zeichen **+**.
  **Belegtes Feld:** Fläche in Ruhe unsichtbar (sonst läge ein Schleier vor
  der fertigen Schiebeanlage), Zeichen **Stift**. Anklickbar sind beide.
- **Unter dem Zeiger:** 26 % Deckkraft in einem eigenen Orange
  (`FELD_ORANGE`, aus dem Gold der Seite `--gold #C49A2A` nach Orange
  verschoben). Beim Ziehen leuchtet nichts mit, und sobald sich die Kamera
  bewegt, erlischt es — über die Ansichtsknöpfe und das Mausrad kommt kein
  `pointermove`, sonst bliebe es stehen.
- **Das Zeichen** ist eine gezeichnete Fläche, kein Sprite und kein
  Schriftzeichen: Ein Sprite drehte sich wieder zur Kamera, und das war die
  Beschwerde. 9,3 bis 22,7 cm groß („mach die + 1/3 kleiner", Betreiber,
  01.11.2026 – verkleinert wird das Ergebnis samt seiner Grenzen, sonst
  bliebe ein kleines Feld beim alten Mindestmaß stehen), 1,2 cm vor der
  Feldfläche, damit beide nicht um dieselbe Tiefe streiten. Auf die
  Bedienung wirkt die Größe nicht: Angeklickt wird die ganze Feldfläche.
- **Die Form ist die des alten Knopfes** – leer eine helle Scheibe mit
  Goldring und goldenem **+**, belegt eine goldene Scheibe mit weißem
  **Stift**. „nur das alte design von den + hat mir mehr gefallen und am
  dach is kein + sondern ein pfeil es soll ein + oder wie damals stift
  sein" (Betreiber, 31.10.2026). Im ersten Anlauf hatte ich das Zeichen
  frei auf die Leinwand gemalt; der Stift geriet dabei zu einem **Pfeil**,
  weil ein Strich mit zwei Haken am Ende genau das ist. Jetzt kommen die
  Umrisse aus **demselben Zeichensatz**, den auch die Knopfliste benutzt
  (`symbolUmriss()` liest `bvs-punkt` / `bvs-stift` aus dem Sprite in
  `konfigurator.html`) – sonst gäbe es zwei Wahrheiten. Welches Zeichen
  gilt, entscheidet `markenZeichen()`, ebenfalls nur an einer Stelle.
- **Das Dachfeld** liegt in der *gemessenen* Dachneigung: Ein Strahl von oben
  auf die Mitte liefert Höhe **und** Richtung der getroffenen Fläche. Von
  unten („Darunter") ist es nicht anklickbar — die Eindeckung nimmt den
  Strahl, und das ist richtig.
- **Die Flächen sind Bedienung, kein Bauteil:** `bildVonAnsicht()` und
  `schuss()` schalten sie vor jeder Aufnahme aus, damit sie nicht im
  gespeicherten Bild und nicht im PDF landen. Als HTML fiel das früher von
  selbst weg.
- **Tastatur und Screenreader:** Eine Fläche in der Szene ist kein HTML.
  Deshalb bleibt unter der Leinwand eine **unsichtbare Knopfliste**
  (`k3dMarkenHuelle`, `clip-path`, *nicht* `display:none`). Sie klappt unten
  links auf, sobald einer ihrer Knöpfe den Fokus hat.
- Abschaltbar an zwei Stellen, die denselben Wert halten: Schalter
  **„+ Felder"** in der Ansichtsleiste und Häkchen unter *Anzeige*.
  Voreingestellt **an**.

**Im Browser gemessen (31.10.2026, Software-Rendering):**

| Was | Messung |
|---|---|
| Zeiger auf einem Feld | 100 602 Bildpunkte ändern sich, **99 % davon orange** |
| Liegt die Fläche in der Ebene? | Perspektive: linke Kante 417 px, rechte 306 px → **27 % Unterschied**. In „Vorne" und „Seite" (Blick senkrecht darauf) 0 % — genau das Muster einer Fläche im Raum, nicht einer am Bildschirm |
| Nach Ansichtswechsel | Hervorhebung 108 111 → **0** geänderte Punkte |
| Klick auf ein Feld | Fokus landet auf dem Knopf „Rahmenwand" im Bereich *Seiten*, Gruppe leuchtet auf |

**Dabei gefunden, nicht vermutet:** Ein Klick brauchte im Versuch 549 ms
zwischen Druck und Loslassen und fiel durch die Grenze `zeit < 500`. Die
Grenze steht jetzt bei **900 ms**. Was einen Klick von einer Drehung trennt,
ist der **Weg** (`weg < 6`), nicht die Zeit; die Obergrenze fängt nur ab, dass
jemand den Finger liegen lässt. Am Handy zielt man langsamer als am Zeiger —
mit 500 ms wäre jeder bedächtige Tipp ins Leere gelaufen.

> **Was vorher vergeblich gesucht wurde** — fünf Erklärungen, vier verworfen
> (Betreiber, 31.10.2026: *„Tauchen an Feldern auf, die man gar nicht sieht"*,
> *„erst nach dem Drehen"*). Steht hier, damit es niemand wiederholt:
>
> | Verdacht | Messung | Ergebnis |
> |---|---|---|
> | Seitenverhältnis Leinwand/Bühne | auch mit `deviceScaleFactor: 3` | passt, Abweichung < 0,01 |
> | Hauswand fehlte als Verdecker | A/B über 12 Drehschritte | **identisch** |
> | Zustand veraltet nach dem Drehen | 6 Drehungen, direkt / nach 1,6 s / nach Stups | **unverändert** |
> | Punkte hängen in der Luft statt am Bauwerk | Bildpunkt unter jedem Punkt ausgelesen | stimmt, war aber **nicht der Wunsch** — zurückgenommen („das hab ich nie gesagt") |
> | Unsichtbare Wand im Feld als Verdecker | A/B über 12 Drehschritte | **identisch** |
> | Der Punkt schluckte den Druck (`stopPropagation`) | Umriss über 16 Drehungen | **war ein echter Fehler**, aber nicht der gemeldete |
>
> **Die eigentliche Ursache war die Bauart selbst.** Ein HTML-Knopf kann nicht
> flach in einer Fläche liegen; er schaut immer zum Betrachter. Alles andere
> waren Folgeerscheinungen. Die Lehre: Wenn vier Messungen nacheinander
> „identisch" sagen, stimmt die Frage nicht.

- **Die Bühne wird beobachtet, nicht nur das Fenster** (`ResizeObserver`).
  Gemessen am 31.10.2026: Wird die Bühne kleiner, ohne dass sich das Fenster
  ändert — am iPhone fährt dabei die Adressleiste ein und aus —, blieb der
  Zeichenpuffer auf der alten Größe (Bühne 390 × 360, Puffer 390 × 380) und
  das Bild wurde per CSS **gedehnt**. Seit die Felder im Modell liegen,
  verzieht das nicht mehr nur die Punkte, sondern das ganze Bild.
- Lage: `markenFelder()` in `js/konfigurator-3d.js`, mit denselben Achsen, mit
  denen `eineSeite()` baut.
- Geprüft von **`scripts/pruefe-marken.js`** (62 Prüfungen, Gegenprobe mit
  65 einzeln eingebauten Fehlern, alle bemerkt).

**Beim ersten Bauen schiefgegangen** (steht hier, damit es niemand wiederholt):
Die Hülle über der Leinwand und das Häkchen im Bedienfeld trugen beide die
Kennung `k3dMarken`. `getElementById` nahm das erste Element im Dokument, also
das Häkchen — alle Punkte landeten **darin** und saßen im Browserlauf zu viert
auf einem Fleck bei 0/0. Die Hülle heißt `k3dMarkenHuelle`, und
`pruefe-marken.js` prüft, dass beide Kennungen verschieden sind.

**Nachgebessert am 31.10.2026 (zweite Meldung):** „die leiste hat sich
verändert es, ragen schrften rein". Die Umbenennung „Punkte" → „Felder"
machte die Ansichtsleiste zwei Zeichen breiter als den Platz – die Knöpfe
schrumpften, der Text nicht, also fiel er aus seinem goldenen Hintergrund.
Jetzt schrumpfen die Knöpfe nicht mehr und die Leiste lässt sich schieben
(wie am Handy schon). Dabei kam ein nie bemerkter Fall mit heraus: Maus- und
Klickhinweis lagen hinter der Leiste (202 bis 347 px bzw. 215 px bei jeder
Breite). Beide stehen jetzt darüber. Gemessen bei 1440, 1100 und 1000 px:
Überlappung 0 px; mit den alten Werten 202/336/347 px – die vier neuen
Prüfungen in `pruefe-konfigurator-oberflaeche.mjs` schlagen also an.

**Und am 01.11.2026 der Rest davon:** „auf dem pc knn die leiste breiter sein
das alles drauf passst" – „Darunter" war angeschnitten. Die Leiste steht
absolut mit `left: 50 %` und bekam ohne eigene Breitenangabe nur den Platz von
ihrem linken Rand bis zum Bühnenrand: Sie braucht 735 px, bekam bei JEDER
Fensterbreite 683 px – auch bei 1600 px Fenster mit 1120 px breiter Bühne.
`width: max-content` behebt es; nachgemessen passt es ab 1280 px Fenster
vollständig, darunter lässt sich die Leiste schieben.

**Vom Betreiber gegenzulesen:**
1. Am Handy: Lassen sich die Felder mit dem Finger treffen? Ohne Zeiger gibt
   es kein Überfahren — der erste Tipp ist gleich der Klick.
2. Orange ist abgenommen („deckkraft is oke", 31.10.2026).
3. Stören die angedeuteten leeren Felder (9 % weiß), wenn man nur schauen
   will? Der Schalter **„+ Felder"** nimmt sie weg.

#### Zuordnung Element → Feld — gebaut *(01.11.2026)*

„bei dieser terassengröße sind es zwei felder vorne … man kann aber nur die
stirnseite komplett bearbeiten und nicht pro feld" (Betreiber, mit Bildern).
Auf Rückfrage entschieden: **Zuordnung je Feld**, bedient **über das + im
Feld**.

Die Auswahl bleibt je Seite; dazu kommt `Z.erwFeld` (`"Seite|Element" →
Feldnummer`). **Steht nichts drin, gilt das Element in allen Feldern** – also
genau wie bisher. Alte Konfigurationen und Teilen-Links sind unberührt. Die
Zeilen „in welchem Feld?" erscheinen nur, wenn eine Seite mehr als ein Feld
hat. Anfrage und Kurzfassung nennen das Feld, die Anfrage zusätzlich die
Feldzahl je Seite.

**Im Browser gemessen (01.11.2026):** Nach der Zuweisung baut Feld 1 nur die
Plankenwand, Feld 2 nur die Schiebetür; der Teilen-Link trägt
`{"vorne|Plankenwand":0,"vorne|Schiebetür":1}` und stellt nach dem Laden
genau dasselbe wieder her.

**Dabei gefunden: die Rückseite wurde DREIMAL gebaut** – zweimal nach den
Fächern der Vorderseite, einmal nach den eigenen, alle übereinander (gemessen
bei 7 m freistehend mit Plankenwand hinten). Rest der Korrektur vom
24.10.2026. Jetzt: ein Aufbau. Einzelheiten: `docs/entscheidungen.md`,
01.11.2026.

**Dritte Fassung** (01.11.2026): Die Fächer heissen **Feld 1, Feld 2 …** –
ein Richtungsname trägt nicht, sobald es fünf Fächer gibt. Wo Feld 1 liegt,
steht in der Anfrage-Mail. **Und jedes Fach ist wirklich für sich:**
Unverträglichkeiten gelten nur gegen den Inhalt DIESES Fachs – Velaris in
Feld 1 und Schiebetür in Feld 2 geht jetzt. Vorher prüften nur die Knöpfe je
Fach, das Umschalten aber gegen die ganze Seite: Der Knopf liess sich drücken
und tat nichts. Einzelheiten: `docs/entscheidungen.md`, 01.11.2026 (dritte
Fassung).

**Zweite Fassung der Bedienung** („die umsetzung ist etwas verwirrend und
kompliziert"): Hat eine Seite mehrere Fächer, bekommt **jedes einen eigenen
Block** mit denselben Knöpfen und einem Namen („rechtes Fach", „linkes Fach",
an den Längsseiten „hinteres"/„vorderes"). Die Reihe für die ganze Seite wird
dann ausgeblendet. Das + springt nur noch dorthin und merkt sich nichts mehr.
Bei einem Fach bleibt alles wie vorher. `Z.erwFeld` trägt je Element eine
**Liste** von Fächern. Einzelheiten und der dabei gefundene CSS-Fehler, der
die ganze Handy-Darstellung aushebelte: `docs/entscheidungen.md`, 01.11.2026
(nachts, zweite Fassung).

**Vorher nachgebessert** – „die feldzuordnung geht noch nicht":
Das + landete nie in der Feldzeile (`querySelectorAll` liefert in der
Reihenfolge des Dokuments, nicht der Abfrage), und Springen allein ist keine
Bedienung. Jetzt merkt sich das +, von welchem Feld es kam, und das **nächste**
gewählte Element bekommt dieses Feld – einmalig. Einzelheiten:
`docs/entscheidungen.md`, 01.11.2026 (nachts).

Geprüft von **`scripts/pruefe-feldwahl.js`** (31 Prüfungen, Gegenprobe mit 32
einzeln eingebauten Fehlern) und von fünf Prüfungen im Browserlauf – darunter
eine, die wirklich tippt und nachsieht, wo die Auswahl landet. Genau die hat
den Fehler gefunden, den die Quelltextprüfung nicht sehen konnte.

**Offen (bewusst, braucht eine Entscheidung):**
1. **Volle, unabhängige Auswahl je Feld** – also zwei verschiedene
   Plankenwände mit verschiedenen Höhen. Am 01.11.2026 bewusst NICHT gebaut;
   sie müsste durch Datenmodell, Bedienfeld, Anfrage, Teilen-Link, PDF und
   Maßtabelle gehen. `Z.erwFeld` müsste dann je Feld eine eigene Liste tragen
   statt einer Feldnummer je Element.
2. **Kein Feld am Terrassenboden, an den Pfosten und am Zubehör.** Auftrag
   waren Seitenfelder und Dach; mehr Marken sind schnell zu viele.
3. **Der Hinweis zum Testbetrieb liegt beim ersten Aufruf über dem Modell.**
   Er verschwindet nach dem Wegklicken (einmal je Browser-Sitzung).

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
es nicht gab. Auslöser war die Frage des Betreibers, ob so etwas wie beim
Konfigurator eines Wettbewerbers machbar sei (derselbe Hersteller).

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

---

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

## 31.10.2026 — aus dem Einstieg hierher verschoben

Der Einstieg `docs/NEXT_TASK.md` war auf 529 Zeilen gewachsen (Richtwert ~400).
Verschoben wurde, was fertig ist: die vollständige Produktliste des
Konfigurators, die vierte Seitenreihe, und die Klickanleitung für das
Werkstatt-Passwort (ist hinterlegt, Werkstatt läuft). Im Einstieg steht
dafür eine kurze Fassung mit Verweis hierher.

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

### ⚠️ Zuerst: Passwort für die Werkstatt hinterlegen *(31.10.2026)*

Die Erprobungsseite `/werkstatt/` ist gebaut, aber **für alle gesperrt**,
solange kein Passwort hinterlegt ist — auch für den Betreiber. Das ist
Absicht: Ein Schutz, der ohne Einstellung aufmacht, ist keiner.

**Die Schritte in Cloudflare (einmalig, etwa fünf Klicks):**

1. [dash.cloudflare.com](https://dash.cloudflare.com) öffnen und anmelden
2. Links **Workers & Pages** → den Eintrag **bvlanding** anklicken
3. Oben **Settings** → Abschnitt **Variables and Secrets**
4. **+ Add** → Typ auf **Secret** stellen
   *(wichtig: Secret, nicht Text — ein Secret ist danach nicht mehr lesbar)*
5. Name: `WERKSTATT_PASSWORT` · Wert: das gewünschte Passwort
6. **Deploy** klicken

Danach `https://bv-aussensysteme.de/werkstatt/` aufrufen, Passwort eingeben.
Die Anmeldung hält 30 Tage pro Gerät. Wird das Passwort später geändert, sind
alle alten Anmeldungen sofort ungültig.

Das Passwort steht **nirgends im Projekt** und ist für niemanden außer dem
Betreiber sichtbar — auch nicht für den Assistenten.

### Werkstatt: Aussparung (Hausvorsprung) — Machbarkeitsnachweis *(31.10.2026)*

Zweiter Anlauf nach der am 25.10.2026 entfernten Sonderform, diesmal
**rechtwinklig**: Rechteck mit rechteckiger Lücke an der Wandseite. Auf der
öffentlichen Konfiguratorseite ist die Aussparung **durch nichts
einschaltbar** — sie hängt am Pfad `/werkstatt/`.

Formen über die Adresse:

```
/werkstatt/?form=rechts&ab=2000&at=1000
/werkstatt/?form=links&ab=2000&at=1000
/werkstatt/?form=mittig&ab=2000&at=1000&aa=1200
```
`ab` = Breite der Aussparung, `at` = Tiefe, `aa` = Abstand von links, in mm.

**Der Betreiber sieht es sich an und entscheidet, ob weitergebaut wird.**
Gegenzulesen: Folgen Sparren, Scheiben und Wandprofil der Lücke — und bleiben
Rinne und Pfosten vorne unverändert?

Fehlt noch (bewusst): Bedienfeld, Grundriss-Skizze, Wandfelder an den Flanken
der Aussparung, Randblende an der Stufe, Maßtabelle, Anfrage, interne Notiz.
Begründungen: `docs/entscheidungen.md`, 31.10.2026.

**Nach jeder Änderung an `konfigurator.html`:**
`node scripts/baue-werkstatt.js` — sonst hängt die Werkstatt zurück.

---

## Aus dem Einstieg verschoben am 31.10.2026

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

## Kurzliste 23.–25.10.2026 (aus dem Einstieg verschoben, 02.11.2026)

| Datum | Was | Stand |
|---|---|---|
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

## Aus dem Einstieg verschoben am 04.11.2026 – Arbeitsschritte vom 31.10. und 01.11.2026

> Nur die Kurzfassung; das *Warum* steht in `docs/entscheidungen.md`.

| Datum | Was | Stand |
|---|---|---|
| 01.11.2026 | **Pfosten wieder gleichmäßig stellen**: Schalter je Zwischenpfosten, erscheint nur wenn verschoben; nimmt den Versatz weg statt einen Wert zu setzen | neu |
| 01.11.2026 | **Hausfarben statt Grau**: Maßschild doppelt so groß, weiß mit goldenem Rand, unter dem Zeiger gold gefüllt wie die Knöpfe der Seite; Maßlinien wieder schwarz; + Scheiben gold mit weißem Zeichen | neu |
| 01.11.2026 | **Bemaßung neu**: dünnere Linien (0,9 statt 1,6 cm), Pfeilspitzen, Maßhilfslinien mit Überstand; das Maß selbst als Bedienelement (heller Grund, Rahmen, Stift, Gold beim Darüberfahren). Klickgrenze von 0,9 auf 2,5 s — gemessen 689 ms für einen Druck von 120 ms | neu |
| 01.11.2026 | **Maßkasten**: „Übernehmen" ragte 10 px heraus (190 px breit, Knöpfe brauchten 187 + 24 px Polster); eigene − / + Schalter statt der Browser-Pfeilchen, die am Handy gar nicht da sind | neu |
| 01.11.2026 | **Zwischenpfosten: erst antippen, dann schieben** — und die Toleranz war zu eng hergeleitet (nur eigene Pfostenspalte statt ganzer Tabelle): bei 7.000 mm jetzt ±520 statt ±200 mm | neu |
| 01.11.2026 | **Zwischenpfosten verschiebbar** — Ziehen am Modell plus Regler, Toleranz aus der Maßtabelle hergeleitet; Lage geht in Teilen-Link und Anfrage mit | live |
| 01.11.2026 | Jedes Feld entscheidet für sich („Feld 1 … n"), rundes Zeichen nur im leeren Feld, kräftigere Farbe, dünnere Ränder | live |
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

## Aus dem Einstieg verschoben am 04.11.2026 (abends) – abgeschlossene Abschnitte

> Anklickbare Felder am Modell, Zuordnung je Feld, verschiebbare Zwischenpfosten.
> Das *Warum* steht in `docs/entscheidungen.md`.

### Erledigt am 31.10.2026, Einzelheiten im Archiv

- **Aussparung (Hausvorsprung)** in der Werkstatt — Machbarkeit gezeigt.
- **Menü in fünf Bereichen** — gebaut.
- **Maße voreingestellt an und antippbar** — gebaut.

Volltext mit Begründungen: `docs/erledigt-archiv.md`, Eintrag 31.10.2026.

### Anklickbare Felder am Modell und Zuordnung je Feld — fertig *(31.10./01.11.2026)*

Jedes Seitenfeld und das Dach sind am Modell markiert (Flächen **in** der Ebene
des Feldes, orange durchsichtig beim Überfahren, rundes Zeichen nur im leeren
Feld). Jedes Feld entscheidet **für sich**, was darin steht — „Feld 1", „Feld 2"
…, von rechts gezählt, bei Längsseiten von der Wand nach vorne. Unverträglich
wird nur innerhalb eines Feldes geprüft.

Einzelheiten im Archiv (`docs/erledigt-archiv.md`, 31.10./01.11.2026), das
*Warum* in `docs/entscheidungen.md`. Geprüft von `scripts/pruefe-marken.js` und
`scripts/pruefe-feldwahl.js`.

### Zwischenpfosten verschieben — fertig *(01.11.2026)*

„kann man außer die eckpfosten die zwischenpfosten verschieben innerhalb den
erlaubten toleranzen" (Betreiber). Gebaut: Grenze **aus unserer Maßtabelle
hergeleitet**, bedient durch **Antippen, dann Ziehen** am Modell **plus Regler**
im Bedienfeld unter „Zwischenpfosten". Die Lage geht in Teilen-Link, Anfrage und
Kurzfassung mit.

**Erst antippen, dann schieben** (Betreiber, 01.11.2026 nachmittags): Ein Tipp
wählt den Pfosten (orange Hülle am Pfosten, markierte Zeile im Bedienfeld, Band
mit Achsmaß und lichter Breite), erst dann lässt er sich ziehen. Zweiter Tipp,
Tipp daneben oder `Esc` heben die Wahl auf. Ohne Auswahl dreht das Ziehen nur
die Kamera — am Handy sonst eine unbemerkte Planänderung.

**Die Spanne wurde am 01.11.2026 nachmittags korrigiert**: Sie wird jetzt über
die **ganze** Maßtabelle gesucht, nicht in der eigenen Pfostenspalte. TDS/Glas
bei flachem Dach: 970–3970 mm statt 2195–3645 mm; bei 7.000 mm Breite also
2.980–4.020 mm statt 3.300–3.700 mm. Begründung in `docs/entscheidungen.md`.

**Die Spanne ist abgeleitet, nicht belegt** — siehe die Rückfrage an VD unten.
Sie ist jetzt breiter, die Rückfrage damit wichtiger. Unter dem Bedienfeld
steht, woher die Zahl kommt und dass beim Aufmaß die Lage verbindlich
festgelegt wird.

**Vom Betreiber gegenzulesen:**
1. Bei 5.000 und 7.000 mm Breite den Mittelpfosten antippen (Hülle muss
   erscheinen) und ziehen: Ist der Spielraum jetzt genug?
2. Ohne Auswahl über den Pfosten ziehen: Dreht sich nur die Ansicht?
3. Am Handy mit dem Finger: Antippen und Ziehen, und lässt sich das Modell
   weiterhin bequem drehen, wenn der Finger auf einem Pfosten aufsetzt?
4. Teilen-Link öffnen — stehen die Pfosten dort genauso?
5. Sind „Achsmaße" und „lichte Breite" die Zahlen, mit denen Sie arbeiten?

Geprüft von `scripts/pruefe-pfosten.js` (88 Prüfungen, darunter 4.000
Zufallsfälle) und im Browser von `scripts/pruefe-konfigurator-oberflaeche.mjs`.


## Aus dem Einstieg verschoben am 04.11.2026 (abends) – Schritte vom 02. und 03.11.2026

> Kurzfassung; das *Warum* steht in `docs/entscheidungen.md`.

| Datum | Was | Stand |
|---|---|---|
| 03.11.2026 | **Konfigurator: ein Weg statt sechs.** Basic/Pro und „Alles auf einen Blick" entfallen, Fachliches liegt hinter „Mehr Einstellungen". Maße haben einen Zahlensteller (−/+) statt Schieberegler; Regler nur noch für Sichtbares (Lamellen, Markise, Tür). Gemessen: 0 statt 6 sichtbare Regler, Schritt 1 von 3,0 auf 1,9 Bildschirme, 129 → 113 Bedienelemente | neu |
| 03.11.2026 | **Zahlenseite gestalterisch überarbeitet**: Gold nur noch für den Spitzenwert, Abstandsleiter, tabulare Ziffern, Ladeplatzhalter, Wolke am Diagramm, aufklappbare Listen, hell/dunkel. Dabei zwei echte Fehler gefunden (Wolke zog die Seite breiter, `min-width:0` auf Rasterfeldern) | neu |
| 03.11.2026 | **Zahlenseite ausgebaut**: gerade aktiv (30 Min.), Land und Bundesland (von Cloudflare, ohne IP – keine Stadt, keine PLZ), Lesetiefe, worauf geklickt wird, Wochentag × Stunde, Einstiegsseiten, Anfragen je Aufruf, CSV-Export und ein Block **„Was auffällt"**, der die Zahlen in Sätze übersetzt | neu |
| 03.11.2026 | **Zahlenseite neu gebaut** — in der ersten Fassung fehlten alle Beschriftungen (`max-width:0` ohne feste Tabellenbreite quetscht die Spalte auf null). Jetzt Kennzahlen mit Vergleich zum Zeitraum davor, Tagesdiagramm, Stundendiagramm, Balken **hinter** dem Text statt in eigener Spalte. Die Prüfung misst seitdem die **gerenderte Breite** jeder Beschriftung, nicht ihren Text | neu |
| 03.11.2026 | **Eigene Reichweitenmessung** (`/api/messung` → D1 in der EU) mit Auswertung unter `/werkstatt/zahlen.html`: Tage, Wochentage, Seiten, Verweildauer, Handlungen, Konfigurator-Trichter. Ohne Cookies, ohne Einwilligung, ohne Besucherkennzeichen – deshalb **keine Zahl „einzelne Besucher"** | neu |
| 03.11.2026 | **Cookie-Banner: vorbelegter Haken „Externe Dienste" entfernt** (vorbelegte Einwilligung ist keine Einwilligung) und die drei Vorab-Verbindungen zu Google aus dem Kopf der Startseite genommen | neu |
| 02.11.2026 | **Letzter Knopf schickt ab** („Anfrage abschicken") und der **Konfigurationslink geht in jede Anfrage** — das alte `hidden` wirkte nie, weil `.btn` `display:inline-block` setzt; PDF-Anhang geht nicht kostenlos (Begründung in `docs/entscheidungen.md`) | neu |
| 02.11.2026 | **„Zurück" stand auf dem iPhone in Safaris Blau** — dritter Fall derselben Art: eine Knopfregel ohne `color` | neu |
| 02.11.2026 | **„Abbrechen" in Rot** — trug nur `.btn`, und das setzt keine Schriftfarbe: Auf dem iPhone blieb Safaris Blau | neu |
| 02.11.2026 | **„Zurücksetzen" statt „Bild speichern"** — mit Rückfrage; das PDF hing am entfernten Menü und ruft jetzt direkt | neu |
| 02.11.2026 | **Unterkante Wandprofil im Modell** — anklickbar; dabei gefunden: Maßschilder standen in der Klickkette hinter den Feldflächen und waren dort nicht erreichbar | neu |
| 02.11.2026 | **Doppelpfeil am gewählten Pfosten** — die orange Hülle sagt „ausgewählt", der Pfeil sagt „seitlich verschiebbar" | neu |
