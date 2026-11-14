# Prüfer: Fachbereiche und Reihenfolge

Ansage des Betreibers vom 14.11.2026: „IMMER die prüfer nach
fachbereich und reihenfolge schauen lassen."

Anlass: Änderungen wurden gebaut und danach nur stichprobenartig
geprüft. Am 14.11.2026 fand eine erst nachträglich gestartete
Gegenprüfung vier übersehene Stellen und ein Prüfskript, das gar nicht
lief.

## Die Regel in einem Satz

Nach jeder Änderung läuft **jeder Fachbereich, den die Änderung
berührt**, mit **genau einem** lesenden Prüfer, und zwar in der
Reihenfolge unten. Nicht alle Bereiche bei jeder Änderung, aber jeder
berührte Bereich immer.

## Reihenfolge

Die Reihenfolge ist nicht beliebig. Sie läuft von „bricht etwas" zu
„ist es gut", weil ein kaputter Zustand nicht schön geprüft werden
muss, und sie endet mit der Freigabeprüfung.

| # | Prüfer | Fachbereich | Wird ausgelöst durch |
|---|---|---|---|
| 1 | `cto` | Architektur, Bestandsschutz, Rückrollbarkeit | gemeinsam genutzter Code, Umbauten, gelöschte Dateien, Abhängigkeiten |
| 2 | `security-architect` | Sicherheit, Einwilligung, Datenschutz | neue externe Skripte, Formulare, Messung, Cookies, Datenflüsse |
| 3 | `qa-accessibility-auditor` | Funktion, Regression, WCAG 2.2 AA | **jede** Code-Änderung, ohne Ausnahme |
| 4 | `mobile-ux-auditor` | Darstellung und Bedienung am Handy | alles Sichtbare, Formulare, Bedienelemente |
| 5 | `ux-architect` | Marke, Typografie, Farbe, Konsistenz | alles Gestalterische |
| 6 | `seo-specialist` | Meta, Schema.org, Struktur, interne Links | Texte, Überschriften, Titel, strukturierte Daten |
| 7 | `performance-auditor` | Ladezeit, Core Web Vitals | neue Bibliotheken, Bilder, Schriften, große Layoutänderungen |
| 8 | `conversion-psychology-auditor` | Verständlichkeit, Vertrauen, Hürden | Texte am Weg zur Anfrage, Formulare, Vertrauenssignale |
| 9 | `customer-journey-architect` | Wege durch die Seite | Navigation, Einstiege, Verknüpfung von Seiten |
| 10 | `staging-release-guardian` | Trennung Arbeit / Vorschau / Produktion | vor jeder Veröffentlichung |
| 11 | `reality-checker` | Stimmt der Bericht mit dem Code überein | vor jeder Veröffentlichung, und wenn etwas „fertig" heißt |

## Was dabei gilt

- **Prüfer ändern nichts.** Der einzige schreibende Agent bleibt
  `frontend-developer`. Wer baut, prüft nicht die eigene Arbeit.
- **Ein Prüfer je Bereich.** Nicht zwei mit demselben Auftrag, kein
  zweiter vollständiger Durchlauf für dieselbe Frage.
- **Nummer 3 läuft immer.** Funktion und Barrierefreiheit sind kein
  Fachbereich unter anderen, sondern die Grundlinie.
- **Nummer 10 und 11 vor jeder Veröffentlichung**, zusätzlich zu dem,
  was die Änderung sonst auslöst.
- **Der Auftrag an den Prüfer nennt die geänderten Dateien.** Ein
  Prüfer, der bei null anfängt, liest das halbe Repository und kostet
  entsprechend.
- **Befunde werden berichtet, nicht stillschweigend behoben.** Was
  außerhalb des Auftrags liegt, kommt unter „Später prüfen" in
  `docs/NEXT_TASK.md`.
- **Ein Prüfbericht ist keine Freigabe.** Veröffentlicht wird nur nach
  dem Freigabesatz des Betreibers.
- **Gleichzeitig starten ja, Befunde der Reihe nach ja.** Prüfer lesen
  nur, sie schreiben nicht. Mehrere dürfen deshalb gleichzeitig laufen,
  solange **niemand** in der Zwischenzeit am Code arbeitet. Verbindlich
  ist die Reihenfolge beim **Lesen und Abarbeiten** der Befunde: erst
  1 bis 3, und was dort auffällt, wird behoben, bevor die Befunde aus
  4 bis 9 angefasst werden. Grund für die Lockerung: Schritt 3 braucht
  allein etwa 40 Minuten, weil er alle Prüfskripte laufen lässt. Streng
  nacheinander wären sechs Prüfer ein halber Arbeitstag, ohne dass das
  Ergebnis besser würde.
- **Ein Prüfbericht beschreibt den Stand beim Start des Prüfers**, nicht
  den bei seiner Rückkehr. Läuft er lange, steht in seinem Bericht
  möglicherweise etwas, das inzwischen erledigt ist. Vor dem
  Weitergeben am Code nachsehen.
