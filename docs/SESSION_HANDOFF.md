# Übergabe an den nächsten Chat

**Stand 14.11.2026, Ende des Arbeitstages.**
Branch `claude/bv-aussensysteme-setup-bq7ew4`, Arbeitsbaum sauber.
Vorschau: `https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev`
(öffentlich). **Nichts ist nach `main` gegangen. Die Live-Seite ist
unverändert.**

## Was heute passiert ist, in einem Absatz

Die Startseite wurde neu gebaut und abgenommen. Danach lief ein langer
Durchgang durch Inhalte und Prüfungen: Statik-Zusagen zurückgenommen,
erfundene Vertrauenssignale entfernt, 566 Gedankenstriche aus dem
sichtbaren Text geholt, strukturierte Daten an den sichtbaren Text
angeglichen, eine abgeschnittene Überschrift auf sieben Ortsseiten
behoben, neue Öffnungszeiten eingetragen. Dazu vier Prüfskripte
repariert oder entschärft, die stillschweigend nichts geprüft haben.

Einzelheiten stehen in `docs/entscheidungen.md`, chronologisch, jeweils
mit Begründung. **Dieses Dokument wiederholt sie nicht.**

## Die vier Dauerregeln, die heute dazugekommen sind

Alle in `CLAUDE.md`:
1. **Prüfer nach Fachbereich und in Reihenfolge**, Einzelheiten in
   `docs/PRUEFER_REIHENFOLGE.md`.
2. **Rechtstexte nicht anfassen, nur warnen.** Befunde in
   `docs/rechtstexte-befunde.md`.
3. **Keine Gedankenstriche** im sichtbaren Text (galt schon, ist jetzt
   durchgezogen).
4. **Vorschaulink in jeden Bericht.**

## Was beim Betreiber liegt, nach Dringlichkeit

**Vor einer Veröffentlichung zu klären:**
- **Datenschutz gegen Wirklichkeit.** `einzugsgebiet.html` und
  `windzonen.html` verbinden sich **beim Seitenaufruf** mit `unpkg.com`
  bzw. `cdnjs.cloudflare.com`, die Erklärung sagt „erst beim Nutzen des
  Tools". `unpkg.com` fehlt dort ganz. **Das betrifft die laufende
  Live-Seite.** Siehe `docs/rechtstexte-befunde.md` Abschnitt 7.
- **Widerrufsrecht bei Maßanfertigung.** Widerrufsseite und AGB sagen
  Verschiedenes. Abschnitt 1 derselben Datei.
- **Vier Entwurfsseiten** (`entwurf*.html`) laden Google Fonts ohne
  Einwilligung. Nur auf dem Arbeitsbranch, nicht live, aber vor einer
  Veröffentlichung zu klären.

**Entscheidungen, die Arbeit freigeben:**
- Sprachumschaltung: fertig bauen oder ausbauen?
- Bewertungsabschnitt: Überschrift verspricht Bewertungen, es gibt
  keine.
- Telefonnummer fehlt auf 50 von 58 Seiten. Absicht?
- Seitentitel mit Gedankenstrich (24 Stück) und Titel, die mehr
  versprechen als der Text hält.
- Produktseiten: „vereinfachter Statiknachweis" ohne die
  Einschränkung, die auf der Startseite steht.

Vollständig in `docs/NEXT_TASK.md`.

## Womit der nächste Chat anfängt

1. `docs/NEXT_TASK.md` lesen. Nur das.
2. Prüfen, ob eine der offenen Entscheidungen beantwortet wurde.
3. Vor jeder Änderung: `docs/PRUEFER_REIHENFOLGE.md`.

## Drei Dinge, die heute Zeit gekostet haben

- **Browserskripte nacheinander laufen lassen**, nicht parallel, und
  **mindestens 300 Sekunden** je Skript. Feste Ports und knappe
  Zeitlimits erzeugen Fehlalarme, die wie echte Fehler aussehen.
- **Nicht am Code arbeiten, während ein Prüfer läuft.** Sein Bericht
  beschreibt sonst einen Stand, den es nicht mehr gibt.
- **Ein Prüferbericht ist eine Vermutung.** Zweimal stand heute etwas
  darin, das am Code nachgesehen nicht stimmte.
