# Übergabe an den nächsten Chat

**Stand: 23.11.2026.** Arbeitsbranch
`claude/bv-aussensysteme-setup-bq7ew4`, alles committet und gepusht.
`main` ist unberührt, nichts veröffentlicht.

Erst diese Datei lesen, dann `docs/NEXT_TASK.md`, dann `CLAUDE.md`.

## Vorschau

`https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev`

Öffentlich. Nach einem Push ein bis zwei Minuten warten und mit
Abfrageanhang (`?x=<zufall>`) abrufen, sonst antwortet der
Zwischenspeicher. **Die Adresse erst nennen, wenn sie selbst abgerufen
und gegen den eigenen Stand geprüft wurde.** Der freie Konfigurator
unter `/werkstatt/frei.html` liegt hinter dem Werkstatt-Passwort; von
außen kommt nur die Passwortseite, geprüft wird er lokal im Browser.

## Was in dieser Sitzung entschieden wurde

| Entscheidung des Betreibers | Folge |
|---|---|
| „velaris is nicht motoresiert, es lässt sich die obere hälfte und untere hälfte getrennt einstellen" | An fünf Stellen korrigiert. Die Seite behauptete eine Motorisierung, die es nicht gibt |
| „mach modular erweiterbar" | „Für 2 bis 20+ Fahrräder skalierbar" an sechs Stellen ersetzt |
| „fremde namen nicht übernehmen" | 15 Kacheln und 26 Bilddateinamen bereinigt. Die Namen standen längst bei uns |
| „Glaszuschnitt machen wir nicht, Holdekor bieten wir aber an mit reinnehmen" | Holzdekorprofile als eigener Abschnitt auf der Fassadenseite, Glaszuschnitt bleibt draußen |
| „10 Jahre, auf markisen 5 Jahre auf Elektro 2 Jahre" | Als Dauerregel in `CLAUDE.md`. Alle 34 Produktkarten tragen die passende Zeile. Der Versuch, sie nach dem Herstellerkatalog auszurichten, war ein Fehler und ist zurückgenommen |

## Was diese Sitzung gebaut hat

**Freier Konfigurator.** Der Unterzug lässt sich jetzt anklicken und
in der Tiefe ziehen; er trug im Modell gar keine Kennzeichnung und war
für den Mauszeiger nicht vorhanden. Dazu die lichten Maße in der
Zeichnung: Feld für Feld von Innenkante zu Innenkante, in der Tiefe
von der Wand bis zur vorderen Pfostenreihe, am Unterzug geteilt.

**Inhalte vom Hersteller.** Alle 26 Produktseiten und fünf Dokumente
gelesen, darunter der Produktkatalog 2026 mit 96 Seiten. Die belegten
Fakten stehen in eigener Formulierung auf vierzehn Produktseiten:
Maße, RAL-Nummern mit Nummer, Eindeckungswerte, Profilmaße, Optionen.

**Der Baustein `src/_includes/eindeck-karten.njk`.** Die vier
Eindeckungen mit Tageslicht, Sonnenwärme, Schalldämmung und Stärke
stehen einmal und werden von vier Seiten eingebunden. Der Kartenstil
ist aus dem Kopf der Terrassenseite nach `src/css/style.css`
gewandert.

Einzelheiten im Logbuch `docs/entscheidungen.md`, Einträge vom
23.11.2026. Nicht hier wiederholen.

## Was als Nächstes dran ist

**Schritt 2 der Lieferanten-Runde zu Ende bringen:** jeden berührten
Fachbereich mit genau einem lesenden Prüfer, in der festen Reihenfolge
aus `docs/PRUEFER_REIHENFOLGE.md`. Jeder Prüfauftrag nennt die
geänderten Dateien.

Danach **Schritt 4: das Design**, mit dem Skill unter
`.claude/skills/ui-ux-pro-max/` und den Gestaltungsagenten.

## Was gegengelesen werden soll

1. **Die Garantiezeilen sind geklärt und stehen überall.** 10 Jahre
   auf Aluminium, 5 Jahre auf Markisen, 2 Jahre auf Elektrik. Als
   Dauerregel in `CLAUDE.md`. Alle 34 Produktkarten geprüft, keine
   ohne Zeile. **Diese Frage ist nicht erneut zu stellen.**
2. **Die Eindeckungswerte auf Gartenhaus und Fahrradüberdachung.** Der
   Hersteller nennt sie dort nicht; sie gelten der Platte, nicht dem
   Produkt. Der Fußtext unter den Karten sagt das.
3. **Der Holzdekor-Abschnitt.** Der Katalog überschreibt die Farbliste
   mit „3 Farben" und zählt sechs auf. Auf der Seite steht die Liste
   ohne die Zahl.

## Was offen blieb und warum

- **Der vollständige Prüflauf über alle rund 82 Skripte** ist in
  dieser Sitzung **nicht** gelaufen. Gelaufen sind die fachlich
  betroffenen, jeweils genannt im Logbuch. `src/css/style.css` wurde
  geändert, also wäre ein vollständiger Lauf vor einer
  Veröffentlichung Pflicht.
- **`pruefe-konfigurator-oberflaeche.mjs`** meldet weiterhin 1 von 182
  nicht bestanden. Am 23.11. gegengeprüft auf Commit `4f3f135`:
  derselbe Fehler, also kein Befund aus dieser Arbeit.
- **Die Quellen des Herstellers liegen nicht im Repository.** Es ist
  öffentlich. Wer die Zahlen braucht, lädt die Dokumente neu; wo sie
  stehen, sagt `docs/vd-quellen.md`.

## Die Regel, die alles überlagert

Veröffentlicht wird nichts, bis genau dieser Satz kommt:

> ICH GEBE DIE NEUE WEBSITE ZUR VERÖFFENTLICHUNG FREI.

Andere Formulierungen gelten nicht. Weder „ok" noch „sieht gut aus"
noch ein bestandener Testlauf.
