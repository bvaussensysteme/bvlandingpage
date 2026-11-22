# Übergabe an den nächsten Chat

**Stand: 22.11.2026.** Arbeitsbranch
`claude/bv-aussensysteme-setup-bq7ew4`, alles committet und gepusht.
`main` ist unberührt, nichts veröffentlicht.

Erst diese Datei lesen, dann `docs/NEXT_TASK.md`, dann `CLAUDE.md`.

## Vorschau

`https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev`

Öffentlich. Nach einem Push ein bis zwei Minuten warten und mit
Abfrageanhang (`?x=<zufall>`) abrufen, sonst antwortet der
Zwischenspeicher. **Die Adresse erst nennen, wenn sie selbst abgerufen
und gegen den eigenen Stand geprüft wurde.**

## Was in dieser Sitzung entschieden wurde

| Entscheidung des Betreibers | Folge |
|---|---|
| „alle seiten manrope machen, alle seiten design anpassen" | Die laufende Seite ist auf Manrope umgestellt. Damit ist die Frage beantwortet, die `docs/WEBSITE_DESIGN_SYSTEM.md` offen gelassen hatte |
| „lass die Scheißknöpfe doch in Ruhe" | Die drei schwebenden Knöpfe bleiben, obwohl sie am Telefon auf dem Text liegen. Gemessen, dokumentiert, **nicht erneut vorschlagen** |
| „Kachel bleibt, aber ruhig gestaltet" | Die letzte Kachel der Referenzgalerie ist weiß statt schwarz, ohne gestrichelte Linie und ohne zweiten Knopf |
| Keine Diaschau, sondern Pfeile und Wischen | In den Leistungskarten bewegt sich nichts von allein |

## Was diese Sitzung gebaut hat

Bilder zum Blättern an drei Stellen: Leistungskarten der Startseite
(Pfeile bei Maus, Wischen am Telefon, Punkte und Zahl), Modellbilder
der 16 Produktseiten (antippen öffnet groß), Referenz-Lauf der
Startseite (Punkte statt Pfeilen). Dazu Manrope überall und sieben
neue Prüfskripte.

Einzelheiten stehen im Logbuch `docs/entscheidungen.md`, Einträge vom
19. bis 21.11.2026. Nicht hier wiederholen.

## Die sieben neuen Prüfungen

`pruefe-referenz-galerie.mjs` · `pruefe-staedte-galerie.mjs` ·
`pruefe-schema-bilder.mjs` · `pruefe-fokus-verdeckung.mjs` ·
`pruefe-modellbilder.mjs` · `pruefe-bilder-blaettern.mjs` ·
`pruefe-referenz-lauf.mjs` · `pruefe-schrift.mjs` ·
`pruefe-schwebe.mjs`

Alle mit `--gegenprobe`, alle in `docs/pruefungen.md` beschrieben.

## Das Muster dieser Sitzung, bitte ernst nehmen

**Vier Prüfungen haben in drei Tagen nur ihre eigene Annahme
bestätigt.** Eine las die Schrift nur am `body` und meldete tagelang
„Manrope", während 38 Stellen daneben lagen. Eine suchte Bild-URLs nur
dort, wo sie sie erwartete, und übersah, dass alle 21 falsch waren.
Eine baute ihre Fehler auf Seiten ein, die den Fall gar nicht hatten.
Eine prüfte Wischen mit nachgebauten Ereignissen, die kein echtes
Scrollen auslösen.

**Lehre: Eine Gegenprobe muss am Gegenstand ansetzen, nicht am
erwarteten Muster.** Nicht „alle URLs, die `images/` enthalten",
sondern „jede URL im Schema". Nicht „die Schrift am `body`", sondern
„jede Textstelle".

Dazu einmal eine Prüfung überschrieben, weil der Dateiname schon
belegt war. Vor `cat > scripts/pruefe-*` nachsehen, ob es die Datei
gibt.

## Erledigt und gemessen, kurz vor Schluss

Die Gegenprobe der Broschürenprüfung lief über 29 Minuten und wurde
deshalb übersprungen. Sie läuft jetzt vierfach nebeneinander:
**gemessen 9 Minuten**, alle 42 eingebauten Fehler werden bemerkt.
Damit ist Punkt 3.14 weg.

## Was offen ist

Steht vollständig in `docs/NEXT_TASK.md`. Die drei, die am meisten
hängen:

1. **Die XSS-Korrektur für `werkstatt/zahlen.html` liegt seit dem
   08.11. unveröffentlicht.** Live ist die Lücke offen. Branch
   `claude/xss-zahlenseite` ist fertig vorbereitet. Es fehlt nur die
   Freigabe des Betreibers.
2. **Erledigt am 21./22.11.2026.** Die Startseiten-Galerie öffnet
   sich jetzt mit der Tastatur (vorher 0 von 14, jetzt 14 von 14).
   Dabei kamen zwei weitere gemessene Verstöße heraus und sind
   ebenfalls behoben: 19 von 19 Fragen der Fragenliste ohne
   sichtbaren Fokusring (2.4.7) und Fokusverlust am Ende der
   Bilderreihe (2.4.3). Einzelheiten in `docs/entscheidungen.md`,
   Einträge vom 21. und 22.11.2026. Neu:
   `scripts/pruefe-fokusring.mjs`.
3. **Die Palette ist nicht umgestellt.** Nur die Schrift. Laut
   Designsystem ist das ein eigener Schritt: `--gold-text` würde
   heller, knappe Kontraste können kippen.

## Veröffentlichen

Nur auf genau diesen Satz:

> ICH GEBE DIE NEUE WEBSITE ZUR VERÖFFENTLICHUNG FREI.

Nichts anderes zählt. Kein „ok", kein grüner Prüflauf.
