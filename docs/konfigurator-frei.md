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
| Kennzeichnung in PDF, Stückliste, Teilen-Link, CRM | offen |
| Maße über die Tabellengrenzen hinaus | offen |
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
| „Drehen 90°" | dreht das zuletzt angefasste Dach |
| „Letztes Dach entfernen" | nimmt die zuletzt gesetzte Kopie weg |

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
