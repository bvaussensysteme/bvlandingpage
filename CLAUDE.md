# BV AussenSysteme – Hinweise für Claude Code

Vollständiger Projektkontext steht in `PROJEKTSTAND.md` (immer zuerst lesen).

## Sparsamer Umgang mit Nutzungsvolumen (permanent)

Der Betreiber hat einen begrenzten Claude-Plan – das Guthaben soll möglichst lange reichen. Deshalb bei jeder Aufgabe:

- Keine unnötigen Verifizierungs-Schleifen (nicht jeden Schritt einzeln per `grep`/`curl`/Dry-Run gegenchecken, nur bei wirklich riskanten Änderungen)
- Änderungen bündeln statt viele kleine Commits/PRs nacheinander
- Keine Subagenten für Recherchen, die auch direkt schnell selbst erledigt werden können
- Kurze Zwischen-Updates, nur wenn wirklich relevant
- Bei größeren Aufgaben erst kurz planen/fragen statt explorativ viele Tool-Calls zu verbrauchen

## ⚠️ VD-Inhalte entfernen – NIEMALS sofort ausführen (permanent)

Wenn der Betreiber sinngemäß sagt **„Alle VD-Inhalte entfernen"** (oder ähnlich formuliert, z.B. bei Vertragsende/-änderung mit VD AluSysteme):

1. **Nicht sofort ausführen.** Erst zurückfragen, ob das wirklich gewünscht ist – das ist eine große, teils irreversible Änderung (Bilder, Partnerseite, Markennennungen).
2. Nach Bestätigung: `docs/VD-INHALTE-INVENTAR.md` als Grundlage nutzen (vollständige Liste aller betroffenen Bilder, Dateien, Textstellen).
3. Darauf hinweisen, dass reines Entfernen Lücken hinterlässt (fehlende Fotos, generische Produktnamen nötig) – das ist beabsichtigt, muss aber kommuniziert werden.

## ⛔ Veröffentlichen NUR auf ausdrückliche Freigabe (permanent, 08.11.2026)

**Diese Regel hebt die frühere Regel „immer auto merge" (05.11.2026)
vollständig auf.** Ansage des Betreibers vom 08.11.2026, wörtlich:

> „DU DARFST DIE NEUE WEBSITE NICHT AUTOMATISCH VERÖFFENTLICHEN. Auch
> dann nicht, wenn alle Agenten fertig sind, alle automatisierten Tests
> bestehen, die Website visuell perfekt erscheint, keine bekannten
> kritischen Probleme verbleiben."

**Es wird nichts nach `main` zusammengeführt und nichts veröffentlicht,
bis genau dieser Satz kommt:**

> ICH GEBE DIE NEUE WEBSITE ZUR VERÖFFENTLICHUNG FREI.

Andere Formulierungen gelten **nicht** als Freigabe. Insbesondere nicht:
Schweigen, „ok", „sieht gut aus", „ja", ein bestandener Testlauf, eine
grüne Prüfung oder eine allgemeine Zustimmung zu etwas anderem.

**Die Live-Seite bleibt unangetastet.** Keine Änderung an `main`, an der
Domain, am DNS, am Hosting, an der Produktionsdatenbank
(`bv-messung`), an produktiven Konfigurationen oder an Kundendaten.
Gearbeitet wird ausschließlich auf dem Arbeitsbranch; die Vorschau
unter der Branch-Adresse von Cloudflare ist die Staging-Umgebung.

**Vorher gefragt wird weiterhin** bei allem aus der VD-Regel, beim
Löschen von Daten und bei Preisen auf der Seite.

**Was deshalb nicht entfällt:** Erst grün, dann berichten. Alle
`scripts/pruefe-*` laufen lassen, nicht die vermuteten. Ehrlich
berichten, was geprüft wurde und was offen blieb.
## Nachbauten: eigene Sprache, eigene Namen (permanent)

Wird etwas nachgebaut, das es bei einem Wettbewerber schon gibt (eine Funktion,
eine Bedienidee, ein Aufbau), gilt ohne Ausnahme:

- **Keine fremden Namen.** Nirgends – nicht in Dateinamen, Funktionsnamen,
  CSS-Klassen, Kommentaren, Beschriftungen, Commit-Texten oder Doku. Der Name
  eines Wettbewerbers taucht im Repository nicht auf.
- **Eigene Benennung.** Formen, Felder, Produkte und Schalter bekommen eigene
  Namen, auch wenn die fremde Bezeichnung kürzer wäre.
- **Eigene Designsprache.** Gestaltung folgt `src/css/style.css` und dem, was
  die Seite schon hat. Ähnlich in der Funktion ja, nachgezeichnet nein: keine
  übernommenen Icons, Bilder, Farbwerte, Abstände, Anordnungen oder
  Textbausteine.
- **Übernommen werden nur Ideen und Fakten** – dass es eine Funktion gibt, wie
  sie sich bedient, technische Daten, Normbezeichnungen des Herstellers. Nie
  fremde Dateien, Bilder, Texte oder Code.

Grund: Eine Funktion ist frei, ihre konkrete Ausführung nicht. Gegenüber einem
direkten Wettbewerber ist eine Abmahnung ein reales, teures Risiko – und sie
kommt ohne Gericht.

## Übergabe und Absicherung (permanent)

Der Chatverlauf darf nie die einzige Quelle sein – ein neuer Chat muss jederzeit
nahtlos weiterarbeiten können.

### Die drei Dateien
| Datei | Rolle |
|---|---|
| `docs/NEXT_TASK.md` | **Einstieg.** Was steht an, welche Dateien braucht genau diese Aufgabe, was liegt beim Betreiber. Kurz halten (max. ~400 Zeilen) |
| `docs/entscheidungen.md` | **Logbuch.** Datum / Entscheidung / Begründung / Anlass. Wird durchsucht, nicht gelesen |
| `docs/erledigt-archiv.md` | **Archiv.** Abgeschlossenes aus dem Einstieg. Wird durchsucht, nicht gelesen |
| `docs/pruefungen.md` | **Prüfskripte.** Welche es gibt, was sie prüfen, wie viele Fehler die Gegenprobe einbaut |
| `docs/arbeitsweise.md` | **Handgriffe.** Branch, Veröffentlichung, Cache-Buster, Konfliktmarken |
| `docs/zahlen-lesen.md` | **Zahlen.** Abfragen, Spalten, die drei Fallen |

Fachdokumente kommen als `docs/<thema>.md` dazu, sobald ein Bereich mehr als ein
paar Absätze braucht. Der Einstieg verweist darauf, wiederholt sie nicht.

### Wie ein Eintrag aussieht
Nicht „Feature X eingebaut", sondern: **was war falsch** (mit Beleg – Zitat der
Meldung, Datum, gemessene Zahl), **was jetzt gilt** (in Sätzen, nicht in
Funktionsnamen), **warum so und nicht anders** (der Code zeigt das Was; das
Warum steht nirgends sonst), **was gegengelesen werden soll** (konkret).
Auch festhalten, **was verworfen wurde und warum** – sonst baut es beim
nächsten Mal jemand ein.

### Wann geschrieben wird
Laufend, nicht am Ende. Ein Arbeitsschritt ist erst fertig, wenn er
dokumentiert ist. Bei etwa 80 % gefülltem Kontextfenster: Übergabe
fertigstellen, committen und `/clear` empfehlen – mit einem Satz dazu, was
drinsteht.

### Keine zwei Wahrheiten
Nichts dokumentieren, was der Code schon sagt (Feldnamen, Signaturen,
Dateistrukturen laufen auseinander) – stattdessen auf die Datei verweisen.
Die **Begründung** gehört als Kommentar an die Stelle im Code, wo sie gilt:
ein Kommentar, der sagt *warum es nicht anders geht*, verhindert, dass es
jemand „aufräumt".

### Absicherung
Eine Prüfung, die nur die eigene Arbeit bestätigt, ist keine. Deshalb:
- Vor dem Anfangen aufschreiben, **woran der Erfolg gemessen wird** – als Liste
  von Prüfungen mit erwartetem Ergebnis. Danach wirklich laufen lassen, nicht
  aus der Erinnerung abhaken.
- Prüfungen als eigene Skripte unter `scripts/pruefe-*` anlegen, in
  **`docs/pruefungen.md`** auflisten und **jeweils mit `--gegenprobe`**
  versehen: Schlägt die Prüfung auch an, wenn sie soll? **Nach einer
  Änderung an Code, den mehrere Bereiche benutzen, alle Skripte laufen
  lassen – nicht die vermuteten.**
- Wo möglich ein **zweiter, anders gebauter Weg** zum selben Ergebnis – etwa
  eine Zahl aus dem fertigen Dokument zurücklesen statt aus der Eingabe.
- **Ehrlich berichten.** Läuft eine Prüfung nicht durch, steht das im Bericht.
  Übersprungenes benennen. Nie mehr behaupten, als geprüft wurde.

### Mitdenken gehört dazu
Der Betreiber ist kein Entwickler. Welche Vorschrift, Frist oder welches
Risiko an einer Änderung hängt, ist Aufgabe des Assistenten: Recht und Steuern
(Pflichtangaben, Fristen, Aufbewahrung), Geld (wo geht still Marge verloren),
Nachweisbarkeit, Datenschutz, Betrieb (fehlende Datei, kein Netz), Fristen mit
Außenwirkung (Widerruf, Gewährleistung, Zahlungsziel).
**Die eigentliche Fehlerart ist Schweigen, nicht Irrtum** – im Zweifel
ansprechen, recherchiert und beziffert statt geraten. Die verbindliche
rechtliche oder steuerliche Bewertung holt der Betreiber beim Fachmann; hier
wird sie vorbereitet.

**Vorschlagen ja, ungefragt umsetzen nein.** Was gebaut wird, entscheidet der
Betreiber.

### Am Ende jedes Schritts
Kurzer Bericht: was jetzt läuft, was gegengelesen werden soll (konkret), was
offen blieb und warum. Keine Zusammenfassung der Arbeitsschritte – die stehen
in der Doku.

## UI, UX und Gestaltung: Design-Skill immer mitlaufen lassen (permanent)

Ansage des Betreibers (04.11.2026): „installiere und führe diesen skill wenns
um ui uix und design geht immer aus."

Installiert im Repository unter `.claude/skills/ui-ux-pro-max/`
(UI/UX Pro Max v2.15.0, MIT-Lizenz, Quelle
`github.com/nextlevelbuilder/ui-ux-pro-max-skill`). Er liegt absichtlich im
Repository und nicht global: Die Arbeitsumgebung wird nach jeder Sitzung
weggeworfen, global Installiertes wäre beim nächsten Mal weg.

**Wann.** Bei allem, was aussieht, sich anfühlt, sich bewegt oder bedient
wird: neue Abschnitte und Seiten, Umbauten am Bedienfeld, Farben, Schrift,
Abstände, Raster, Knöpfe, Formulare, Barrierefreiheit, Animation,
Darstellung am Handy, Diagramme. Nicht bei reiner Rechenlogik, Geometrie im
3D-Modell, Serverarbeit oder Dokumentation.

**Wie.** Vor dem Bauen abfragen, nicht hinterher:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<frage>" --domain ux
```

Bereiche: `ux`, `style`, `color`, `typography`, `icons`, `chart`, `product`,
`gsap`, `stack`. Für eine ganze neue Seite `--design-system`. Das Skript
braucht nur Python 3 und geht nicht ins Netz.

Achtung: Die Anleitung im Skill nennt `${CLAUDE_PLUGIN_ROOT}` – das gilt für
die Plugin-Installation. Hier liegt der Skill im Projekt, also der Pfad
oben.

**Was er NICHT entscheidet.** Der Skill liefert allgemeine Regeln und
Vorschläge für Paletten, Schriftpaarungen und Stile. Verbindlich bleibt die
**eigene Designsprache der Seite**: `src/css/style.css` und das, was die
Seite schon hat (`--gold #C49A2A`, `--gold-dark #9A7318`,
`--gold-text #7A5B12`, `--black #111111`, die bestehenden Abstände und
Schriften). Fremde Paletten, Schriften oder Tailwind-Vorlagen werden nicht
übernommen – das wäre ein Bruch mit der Regel „Nachbauten: eigene Sprache,
eigene Namen" weiter oben. Genutzt werden seine **Prüflisten und
Begründungen**: Kontrast 4,5:1, Mindestfläche 44 × 44 px zum Antippen,
sichtbare Beschriftungen, kein waagerechtes Scrollen, Rücksicht auf
`prefers-reduced-motion`.

**Sparsam bleiben.** Eine Abfrage mit 2–5 Begriffen und einem Bereich, nicht
fünf Abfragen hintereinander, und `references/quick-reference.md` nur lesen,
wenn eine Abfrage nicht reicht (siehe „Sparsamer Umgang mit
Nutzungsvolumen").

## Zahlen vor Meinung: erst nachsehen, dann bauen (permanent)

Ansage des Betreibers (04.11.2026): „auch du sollst auf die daten immer
zugriff haben und es soll in die entscheidungen einfließen wie zukünftig die
webseite gebaut und optimiert wird und zukünftige landingpages."

**Vor** jedem Umbau einer Seite und vor jeder neuen Landingpage erst in die
eigenen Zahlen sehen – wie das geht, steht in **`docs/zahlen-lesen.md`**
(Abfragen, Spalten, Fallen). Die Datenbank lässt sich direkt abfragen, die
Zahlenseite liegt unter `/werkstatt/zahlen.html`.

Drei Regeln dazu, alle drei aus einem Fehler vom 04.11.2026 entstanden:

1. **Immer den echten Datenbeginn mitlesen.** Ein gewählter Zeitraum ist
   nicht der Datenbestand. „28 Aufrufe in 30 Tagen" waren in Wirklichkeit
   28 Aufrufe in anderthalb Tagen – darauf stützte sich dann ein falscher
   Rat an den Betreiber.
2. **Wenige Zeilen sind kein Befund.** Unter etwa 100 Aufrufen je Seite ist
   jede Aussage über diese Seite geraten. Das gehört dazugesagt.
3. **Was die Zahlen nicht hergeben, wird nicht behauptet.** Lieber „dafür
   reicht es noch nicht" als eine Empfehlung mit erfundener Grundlage.

**Datenschutz ist Teil davon.** Die Messung speichert ein Tageskennzeichen
(Prüfsumme, täglich wechselnd) – siehe `messungBesucher()` in
`worker/index.js`. Wird am Umfang der Messung etwas geändert, **muss die
Datenschutzerklärung im selben Zug mitgeändert werden**. Eine
Datenschutzerklärung, die nicht stimmt, ist ein eigener Verstoß – unabhängig
davon, ob die Messung selbst zulässig wäre.
