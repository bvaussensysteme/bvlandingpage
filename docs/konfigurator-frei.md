# Freie Planung: der interne Konfigurator

Stand 17.11.2026

## Worum es geht

Ansage des Betreibers vom 17.11.2026:

> „Ich will einen offenen Konfigurator. Für uns intern, es gibt zwei
> Konfiguratoren. Einmal, der später veröffentlicht werden soll, der
> einfache für die Leute. Und ich brauche einen internen Konfigurator,
> wo ich alles machen kann. Scheißegal, was das System sagt. Wenn ich
> will, kann ich alle Pfosten entfernen und das Dach hängt in der Luft."

Der öffentliche Konfigurator hält sich an die Maßtabelle des
Herstellers. Das schützt den Kunden vor einer Anlage, die so nicht
gebaut werden kann. Der Betreiber rechnet die Statik selbst und
braucht ein Werkzeug ohne Leitplanken.

## Die drei Seiten und was sie unterscheidet

| Datei | Zweck | Zugang |
|---|---|---|
| `konfigurator.html` | der heute veröffentlichte Konfigurator | öffentlich |
| `werkstatt/index.html` | derselbe Konfigurator im Aufbau, wird später der öffentliche | hinter der Schranke |
| `werkstatt/frei.html` | **freie Planung, nur intern** | hinter der Schranke |

Die ersten beiden laden `js/konfigurator-3d.js`.
Die dritte lädt `js/konfigurator-frei.js`.

## Warum eine Kopie und kein Schalter

Ein Schalter in der gemeinsamen Datei wäre wartungsärmer. Der Betreiber
hat sich bewusst dagegen entschieden:

> „Mach am besten noch eine Kopie, noch eine Seite daneben, wo nur
> intern ist, damit du den öffentlichen nicht zerschießt."

Das ist nachvollziehbar: Der öffentliche Konfigurator steht kurz vor der
Veröffentlichung, die freie Fassung wird sich stark von ihm entfernen
(Module, freie Pfosten, Spiegeln). Ein Schalter hieße, dass jeder
Fehler in der freien Fassung den öffentlichen mitreißen kann.

**Was das kostet, und das muss gesagt sein:** Eine Korrektur im
öffentlichen Konfigurator kommt in der freien Fassung **nicht** von
selbst an. Die beiden laufen auseinander. Damit das sichtbar bleibt
statt still zu passieren, steht im Kopf von `js/konfigurator-frei.js`
der Commit, von dem abgespalten wurde, und
`scripts/pruefe-konfigurator-frei.sh` schlägt an, sobald sich die
öffentliche Datei seitdem geändert hat. Dann ist zu entscheiden: Gehört
die Korrektur auch in die freie Fassung, ja oder nein? Danach wird die
Zeile im Kopf auf den neuen Stand gesetzt.

## Die eine Grenze, die bleibt

Alles, was die freie Planung verlässt, trägt einen sichtbaren Vermerk:
PDF, Stückliste, Teilen-Link, Übernahme ins CRM.

**Der Grund ist nicht Bevormundung.** In zwei Jahren zieht jemand,
vielleicht der Betreiber selbst, eine PDF aus der freien Planung in ein
Kundenangebot. Man sieht ihr nicht an, dass sie nie gegen die Maßtabelle
lief. Die Konstruktion trägt die Schnee- und Windlast der Zone
womöglich nicht. Auf derselben Website steht ein Lastzonen-Rechner, der
den Eindruck verstärkt, das sei geprüft. Haften würde der Betreiber.

Der Vermerk kostet fünf Zeilen und nimmt der freien Planung nichts weg.

## Was die freie Fassung nicht leisten kann

Auf einer statischen Seite lässt sich der freie Modus nicht wirklich
verstecken, das JavaScript liegt beim Besucher. Der Schutz liegt darin,
dass die Seite unter `/werkstatt/` steht und damit hinter Cloudflare
Access und der Passwortschranke des Workers, und darin, dass die
Ausgabe gekennzeichnet ist. Es liegen dort keine Daten, die jemand
holen könnte. Echte Abschottung ginge nur mit der Berechnung auf dem
Server und wäre ein eigenes Projekt.

## Stand der Freiheiten

| Freiheit | Stand |
|---|---|
| eigene Seite und eigene Kopie des Skripts | **fertig** 17.11.2026 |
| Kennzeichnung auf der Seite | **fertig** 17.11.2026 |
| Pfosten einzeln entfernen und zurückholen | **fertig** 17.11.2026 |
| weitere Dächer hinzufügen, ziehen, drehen, entfernen | **fertig** 17.11.2026 |
| Stückliste folgt der Zeichnung | offen |
| Kennzeichnung in PDF, Bildern und Teilen-Link | **fertig** 17.11.2026 |
| Stückliste folgt der Zeichnung | **fertig** 17.11.2026 |
| Preis folgt der Zeichnung | offen |
| Maße über die Tabellengrenzen hinaus | **fertig** 17.11.2026 |
| Montageart je Seite, auch „lehnt am Nachbarmodul" | offen |
| eigene Maße je Modul statt Kopien | offen |

## Wie es bedient wird

| Handgriff | Wirkung |
|---|---|
| Doppelklick auf einen Pfosten | nimmt ihn weg, er bleibt als blasser Körper stehen |
| Doppelklick auf den blassen Pfosten | holt ihn zurück |
| „Alle zurückholen" im roten Band | setzt alle Pfosten zurück |
| „Dach hinzufügen" | stellt eine Kopie exakt neben die Anlage, der Blick zieht sich auf |
| Ziehen auf einem zusätzlichen Dach | verschiebt es auf dem Boden |
| Breite und Tiefe | Regler bis 30000 bzw. 20000 mm, nichts wird geklemmt |
| „Drehen 90°" | dreht das zuletzt angefasste Dach |
| „Letztes Dach entfernen" | nimmt die zuletzt gesetzte Kopie weg |

### Eckpfosten: weder anklickbar noch verschiebbar

**Gemeldet vom Betreiber am 17.11.2026**, in zwei Schritten: erst „das
mit doppelklick etc klappt alles nicht pfosten weg wieder zurück", dann
„beim mittleren pfosten gehts jz aber es soll ja bei allen pfosten
gehen, ausblenden und verschieben".

Im öffentlichen Konfigurator stehen die Eckpfosten fest. Drei Stellen
sorgen dafür:

| Stelle | was sie tut | in der freien Planung |
|---|---|---|
| `pfostenSpanne()` | gibt für Eckpfosten `null` zurück | jeder Pfosten bekommt eine weite Spanne |
| `pfostenReihe()` | wendet den Versatz nur auf 1 bis `anzahl-2` an | auf alle |
| `achsenKlemmen()` | holt jedes Feld in die Toleranz der Preisliste | entfällt |

Weil `pfostenUnterZeiger()` einen Pfosten ohne Spanne nicht zum Greifen
freigibt, macht die erste Änderung zugleich jeden Pfosten greifbar.

Gemessen am 17.11.2026: `vorne#0`, `vorne#1` und `vorne#2` lassen sich
einzeln wegnehmen, zurückholen und ziehen (Versatz 660, 540 und 410 mm).

### Vorderer und hinterer Pfosten derselben Achse

**Gemeldet vom Betreiber am 17.11.2026:** „bei flatline wenn ich einen
pfosten dopelklicke entfernt er beide auf dieser seite."

`pfostenGriff()` markierte jeden Pfosten mit Reihe und Nummer. An drei
Stellen im Code bekommen **vorderer und hinterer** Pfosten derselben
Achse dieselbe Marke (`'vorne', iP`). Fürs Verschieben ist das richtig,
sie gehören zur selben Achse. Fürs Wegnehmen war es falsch: ein
Schlüssel, zwei Pfosten.

Die Marke trägt in der freien Planung jetzt zusätzlich die Tiefe `z`.
Der Schlüssel lautet `vorne#0#294` statt `vorne#0`. Verschoben wird
weiter achsweise, weggenommen einzeln.

Gemessen bei Carport Flat Line: vier Pfosten `vorne#0#294`,
`vorne#0#6`, `vorne#1#294`, `vorne#1#6`; ein Doppelklick entfernt genau
einen.

**Wie die Prüfung das misst:** am Modell über `BV_FREI.pfostenAlle()`,
nicht am Bild. `pfostenPunkte()` liefert nur sichtbare Pfosten; aus
einem ungünstigen Blickwinkel sind die hinteren verdeckt, und eine
Prüfung darauf meldet einen Fehler, den es nicht gibt. Genau das ist
beim ersten Lauf passiert.

### Jeder Pfosten einzeln verschiebbar

**Ansage des Betreibers vom 17.11.2026:** „ja will auch einzeln
schieben können."

`Z.pfostenVersatz` gilt je **Achse**: Vorderer und hinterer Pfosten
bewegen sich zusammen, weil beide aus demselben `x` der Reihe gebaut
werden. Im öffentlichen Konfigurator ist das richtig.

In der freien Planung gibt es dafür einen zweiten Topf,
`Z.pfostenEinzeln`, mit dem Schlüssel je physischem Pfosten
(`vorne#0#294`). Angewendet wird er erst am Bauteil selbst, in
`pfostenGriff()`.

**Was das bedeutet, und es ist gewollt:** Der Träger darüber spannt
weiter über die Achsen. Ein einzeln verschobener Pfosten steht also
nicht mehr unter seiner Achse. In einer Planung ohne Statikprüfung ist
genau das der Zweck.

Gemessen bei Flat Line, alle vier einzeln:
`{"vorne#0#294":530,"vorne#0#6":650,"vorne#1#294":340,"vorne#1#6":450}`.

Die Auswahl merkt sich die Tiefe mit, deshalb leuchtet beim Anklicken
nur der eine Pfosten auf und nicht die ganze Achse.

### Der Zwischenspeicher, der eine Korrektur verschluckt hat

Zwischen den beiden Meldungen lag eine Korrektur, die der Betreiber
**nicht zu sehen bekam**: Die Seite lädt das Skript mit einer
Versionsnummer, und die hatte ich nicht hochgezählt. Sein Browser nahm
weiter die alte Datei.

Deshalb steht in `werkstatt/frei.html` jetzt der Stand der Skriptdatei
als Prüfsumme, und `pruefe-konfigurator-frei.sh` vergleicht ihn mit der
Datei. Ändert sich die Datei ohne neue Versionsnummer, schlägt die
Prüfung an.

### Alt: Eckpfosten waren nicht anklickbar

**Gemeldet vom Betreiber am 17.11.2026:** „das mit doppelklick etc
klappt alles nicht pfosten weg wieder zurück."

Der Doppelklick benutzte `pfostenUnterZeiger()`. Diese Funktion liefert
nur **verschiebbare** Pfosten; Eckpfosten haben keine Spanne und werden
dort ausdrücklich übergangen („sonst hänge man an einem Pfosten, der
sich nicht rührt"). Fürs Verschieben ist das richtig, fürs Wegnehmen
falsch: Bei einem Dach mit drei Pfosten war nur der mittlere
anklickbar.

Die freie Planung hat jetzt einen eigenen Treffer-Test,
`pfostenUnterZeigerFrei()`, der jeden Pfosten zurückgibt. Die
Verdeckungsregel bleibt: Was den Blick nimmt, nimmt auch den Griff.

**Warum die eigene Prüfung das nicht gefunden hat:** Sie holte ihren
Klickpunkt aus derselben Funktion und traf damit immer den mittleren
Pfosten. Eine Prüfung, die sich ihr Ziel von der geprüften Logik geben
lässt, prüft nichts. Sie klickt jetzt **jeden** Pfosten einzeln an und
holt die Punkte über `BV_FREI.pfostenPunkte()`.

### Warum der weggenommene Pfosten stehen bleibt

Ein verschwundener Pfosten wäre nicht mehr anklickbar, und dann
bräuchte es eine Liste am Rand, um ihn zurückzuholen. Als
durchscheinender Körper bleibt er greifbar, und man **sieht** beim
Planen, wo etwas fehlt. Bei einer Anlage ohne Statikprüfung ist das die
wichtigere Information.

Technisch kommt dazu: `pfostenUnterZeiger()` überspringt unsichtbare
Körper, damit man nicht durch Glas hindurch etwas anfasst. Ein auf
`visible = false` gesetzter Pfosten wäre also auch für den Zeiger weg.

### Was die zusätzlichen Dächer sind und was nicht

Ein zusätzliches Dach ist eine **Kopie** des eingestellten Dachs. Ändert
man Produkt oder Maße, ändern sich alle Kopien mit. Eigene Maße je Modul
sind der nächste Schritt.

**Warum Kopien des fertigen Baus und kein zweiter Durchlauf:** Der
Aufbau hängt an rund fünfzig Einstellungen und schreibt in geteilte
Zwischenstände (`MARKEN`, `PFOSTEN_REIHE`, `FELD_ANZAHL`). Ein zweiter
Durchlauf mit anderen Werten würde die überschreiben und die Bemaßung
des Hauptdachs verfälschen. Eine Kopie des fertigen Baums kann das
nicht.

**Die Kopien zählen nicht** in Stückliste, Preis oder PDF. Sie sind eine
Planungshilfe.

## Offene Fragen an den Betreiber

1. **Flat Line mit Wandmontage:** Wie heißt die Ausführung bei VD?
   Beim TDS heißt sie „Carport mit Wandmontage".
2. **Welche Seite an der Wand:** Der Betreiber hat am 17.11. gesagt,
   beim Flat Line könne die tiefe oder die breite Seite an die Wand.
   Offen ist, ob dabei das **Gefälle mitwandert**. Wandert es mit, ist
   es im Modell ein Tausch von Breite und Tiefe und überschaubar.
   Bleibt es, wo es war, laufen die Sparren parallel zur Wand und die
   Maßtabelle wird mit anderen Spannweiten gefragt. Das ist ein
   Umbau.

## Was im Code heute steckt, und warum es für Module wichtig ist

Gefunden am 17.11.2026 in `js/konfigurator-3d.js`:

- **Die Wand ist immer hinten.** Das ist keine Einstellung, das steckt
  in der Geometrie. Kommentare im Code: „die WANDseite (hinten, hoch)",
  „Spalte 0 liegt an der WAND", „x = Tiefe ab der Wandseite".
- **„Breite" heißt nicht „die breitere Seite".** Es heißt: die Richtung
  entlang der Wand, in der der Träger läuft. Die Sparren laufen immer
  von der Wand nach vorn, die Rippen quer dazu.
- **Die Maßtabelle wird immer gleich gefragt:**
  `tabelleBauteile(Z.breite, Z.tiefe)`, an sieben Stellen.
- **Die Pfostenzahl ist ein Ergebnis, keine Eingabe:**
  `pfostenUnterTraeger(breiteMm)` ist `2 + Math.floor((breiteMm - 1) / 7000)`,
  dazu die Tabelle für Sparren, Pfosten und Unterzug.
- **Wandmontage gibt es nur beim Carport TDS.** In `CP_VARIANTEN` hat
  „Flachdach Flat Line" nur „Flat Line" und „Flat Line mit Nebenraum".
  Dieselbe verkürzte Liste steht im Anfrage-Assistenten
  (`js/anfrage-wizard.js`, Zeile 678), und der füttert das CRM. Wird
  die Ausführung ergänzt, müssen **beide** Listen mit, sonst passen
  Anfrage und Konfigurator nicht mehr zusammen.

## Maße ohne Tabellengrenze

Ansage des Betreibers vom 17.11.2026: „sperre auch nicht die tiefen und
breiten."

| | öffentlich | freie Planung |
|---|---|---|
| Breite | 1080 bis 14080 mm | 1000 bis 30000 mm |
| Tiefe | 550 bis 7050 mm | 1000 bis 20000 mm |
| Klemmen | ja, in den Bereich der Tabelle | nein |

Die Obergrenzen sind keine technische Aussage, sondern nur das Ende des
Schiebereglers. Liegt ein Wert darüber, wächst der Regler mit, damit der
Griff nicht am Anschlag klebt.

**Was dabei passiert und beachtet werden muss:** `tabelleBauteile()`
nimmt bei Maßen über der Tabelle die größte Zeile, die es gibt. Sparren,
Pfosten und Unterzug stammen dann aus einer **kleineren** Anlage. Die
Zeichnung stimmt, die Bauteile darunter nicht. Das ist der Preis der
Freiheit und der Grund für das rote Band.

**Nicht angefasst:** Höhe, Neigung und Dachüberstand sind weiterhin
begrenzt. Der Betreiber hat Tiefe und Breite genannt.

## Kennzeichnung dessen, was die Seite verlässt

Das rote Band steht auf dem Bildschirm. Ein PDF aus der freien Planung
sieht einem geprüften zum Verwechseln ähnlich. Deshalb trägt seit dem
17.11.2026 jede Ausgabe einen Vermerk:

| wo | was |
|---|---|
| Fußzeile **jeder** PDF-Seite | „FREIE PLANUNG, NICHT GEPRUEFT. Nicht gegen die Masstabelle gerechnet. Pfosten koennen fehlen, Masse koennen ausserhalb der Tabelle liegen. Kein Angebot und keine Statikaussage." |
| Kopfzeile der PDF-Seiten | „FREIE PLANUNG · Terrassendach TDS, 12000 x 9000 mm" |
| Dateiname von PDF und Bild | `FREIE-PLANUNG-...` |
| Text des Teilen-Links | „FREIE PLANUNG, nicht geprüft. ... Kein Angebot." |

**Der Konfigurator verschickt selbst keine Anfragen.** Geprüft am
17.11.2026: Er ruft nur `/api/bauteile` und `/api/teilen`. Es gibt also
keinen Weg von dieser Seite direkt ins CRM, der zu kennzeichnen wäre.

**`js/pdf-blatt.js` wurde nicht angefasst.** Die Datei wird vom
öffentlichen Konfigurator mitbenutzt. Die Kennzeichnung sitzt
ausschließlich in `js/konfigurator-frei.js`, und
`pruefe-freie-planung.mjs` lädt zum Gegenbeweis auch die PDFs der
beiden öffentlichen Seiten herunter und prüft, dass dort **kein**
Vermerk steht.

## Stückliste folgt der Zeichnung

Im öffentlichen Konfigurator kommen die Zahlen aus `/api/bauteile`.
Fehlt die Antwort, bleibt der Kasten „Was daraus folgt" leer: „lass das
weg" (Betreiber, 11.10.2026), weil ein Kasten, der nur erklärt, dass er
nichts zu sagen hat, beim Produkt verunsichert.

**In der freien Planung gilt das Gegenteil.** Wer frei plant, braucht
die Zahlen, und zwar die der Zeichnung. Gerechnet wird aus
`js/masstabelle.js`, der vom Betriebsinhaber freigegebenen Tabelle.

Beispiel, gemessen am 17.11.2026 bei 20000 × 9000 mm, einem entfernten
Pfosten und einem zusätzlichen Dach:

| | |
|---|---|
| Ihr Maß | 20000 × 9000 mm |
| Dächer | 2 (ein eingestelltes und 1 Kopie) |
| Sparren | 21 je Dach, insgesamt 42 |
| Pfosten | 4 statt 5 (1 entfernt), insgesamt 8 |
| Über der Maßtabelle | Breite 20000 mm, Tabelle endet bei 14080 mm. Sparren und Pfosten stammen aus der kleineren Anlage. |
| Freie Planung | Nicht gegen die Maßtabelle gerechnet. Kein Angebot und keine Statikaussage. |

Liegt eine Antwort von `/api/bauteile` vor, bleiben deren Zahlen stehen
und die Abweichung der Zeichnung steht **daneben**. Beides, damit man
den Unterschied sieht statt ihn zu erraten.

**Auf den beiden öffentlichen Seiten ändert sich nichts.** Der Kasten
bleibt dort ohne Schnittstelle leer; `pruefe-freie-planung.mjs` prüft
das ausdrücklich nach.
