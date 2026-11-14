# BV AussenSysteme – Hinweise für Claude Code

Vollständiger Projektkontext steht in `PROJEKTSTAND.md` (immer zuerst lesen).

## Webseiten-Modernisierung: Agenten und Regeln (permanent, 13.11.2026)

Die Modernisierung läuft schrittweise, über abgegrenzte Prüfaufträge.
Vier Dokumente, jeweils kurz:

| Datei | Inhalt |
|---|---|
| `docs/WEBSITE_AGENT_WORKFLOW.md` | Welcher Agent wofür, wann **kein** Agent, wie die Kosten niedrig bleiben |
| `docs/WEBSITE_DESIGN_SYSTEM.md` | Marke, Manrope, Farben – **freigegeben am 13.11.2026**, mit den gemessenen Kontrasten und Logo-Abständen |
| `docs/WEBSITE_STAGING.md` | Anforderungen an eine sichere Vorschau und was daran heute noch fehlt |
| `docs/SESSION_HANDOFF.md` | Vorlage für die Übergabe an den nächsten Chat |

**Bestandsschutz.** Diese Dinge bleiben, auch wenn ein Umbau sie
unbequem macht: bestehende URLs und Weiterleitungen, Produktseiten,
Produktkatalog, 3D-Konfigurator, Wind- und Schneelastzonen-Rechner,
Baugenehmigungs-Check, Referenzen und alle Kontaktwege. Nichts davon
wird ohne ausdrückliche Ansage entfernt.

**Prüfende Agenten ändern keinen Code.** Der einzige schreibende Agent
ist `frontend-developer`. Ein Prüfer, der selbst umbaut, prüft hinterher
die eigene Arbeit.

**Keine pauschalen Aufrufe.** Nie alle Agenten auf einmal, nie zwei mit
demselben Auftrag, kein zweiter vollständiger Durchlauf durch das
Repository für dieselbe Frage. Kleine Änderungen macht der Hauptagent
direkt – ein Subagent fängt bei null an und liest sich erst wieder ein.

**Nutzerpsychologie ehrlich.** Keine aggressiven Pop-ups, keine Dark
Patterns, keine künstliche Verknappung, keine erfundenen
Vertrauenssignale. Conversion-Aussagen ohne Daten sind **Hypothesen**
und werden so benannt.

**Vorschau und Freigabe.** Kein automatisches Zusammenführen, kein
automatisches Deployment. Eine Vorschau-Adresse wird erst genannt, wenn
sie eingerichtet und selbst abgerufen wurde. Testdaten sind erfunden;
keine echten Anfragen an Kunden, CRM oder produktive
Benachrichtigungswege.

## Prüfer nach Fachbereich und in Reihenfolge (permanent, 14.11.2026)

Ansage des Betreibers: „IMMER die prüfer nach fachbereich und
reihenfolge schauen lassen."

Nach jeder Änderung läuft **jeder Fachbereich, den die Änderung
berührt**, mit **genau einem** lesenden Prüfer, in der festen
Reihenfolge aus **`docs/PRUEFER_REIHENFOLGE.md`**. Nicht alle Bereiche
bei jeder Änderung, aber jeder berührte Bereich immer, und nicht nach
Gutdünken ausgewählt.

Kurzfassung der Reihenfolge: `cto` · `security-architect` ·
`qa-accessibility-auditor` · `mobile-ux-auditor` · `ux-architect` ·
`seo-specialist` · `performance-auditor` ·
`conversion-psychology-auditor` · `customer-journey-architect` ·
`staging-release-guardian` · `reality-checker`.

`qa-accessibility-auditor` läuft bei **jeder** Code-Änderung.
`staging-release-guardian` und `reality-checker` zusätzlich vor jeder
Veröffentlichung.

Das ersetzt nicht die Regel „keine pauschalen Aufrufe" darunter,
sondern füllt sie: Die Auswahl erfolgt über den berührten Fachbereich,
nicht über das Bauchgefühl des Hauptagenten. Jeder Prüfauftrag nennt
die geänderten Dateien, sonst liest der Prüfer das halbe Repository.

## Fokus- und Tokensparmodus (permanent, 13.11.2026)

Ergänzt den Abschnitt darunter. Dort steht, **wie** sparsam gearbeitet
wird; hier, **wie eng** der Auftrag gefasst ist.

**Nur der aktuelle Auftrag.** Keine Nebenarbeiten, spontanen Umbauten,
zusätzlichen Funktionen, ungefragten Optimierungen oder umfangreichen
Folgeanalysen.

**Nebenbefunde nur notieren.** Was dabei auffällt, kommt kurz unter
„Später prüfen" in den Bericht und in `docs/NEXT_TASK.md` – nicht in die
Arbeit. **Ausnahme:** Bei unmittelbarem Sicherheitsrisiko die betroffene
Aktion stoppen und den Betreiber informieren.

**Vor dem Anfangen intern festlegen:** Ziel · minimale Schritte ·
Fertig-Kriterium · was ausdrücklich **nicht** bearbeitet wird.

**Grenzen beim Arbeiten.** Höchstens ein Spezialagent je Teilaufgabe,
sofern nicht ausdrücklich anders freigegeben. Kein vollständiger
Durchlauf durch das Repository, wenn die Dateien bekannt sind. Keine
Wiederholung bereits dokumentierter Analysen. Keine zusätzlichen Pakete
oder Werkzeuge ohne Notwendigkeit. Scheitert ein Test zweimal aus
demselben Grund: stoppen und die Ursache berichten. Nach höchstens zwölf
wesentlichen Tool-Aktionen einen kurzen Zwischenstand geben und prüfen,
ob der Auftrag noch im Rahmen liegt.

Das sind Arbeitsregeln, **keine Zusicherung** einer Laufzeit oder
Tokenzahl.

**Fertig heißt fertig.** Ist das beauftragte Ergebnis erreicht: knapp
prüfen, Ergebnis zusammenfassen, offene Punkte nennen, **stoppen**.
Keine weitere Verbesserungsrunde ohne neuen Auftrag.

**Abschlussbericht in vier Teilen:** Erledigt · Geprüft · Offen und
Risiken · Nächster empfohlener Schritt.

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

## Neubau: eigenständig, nicht Apple nachgebaut (permanent, 08.11.2026)

Der Neubau orientiert sich an den **Prinzipien** der Apple Human
Interface Guidelines (Skill unter `.claude/skills/apple-design/`).
Das ist eine Referenz für Benutzerführung, keine Erlaubnis:

- **Keine Apple-Schriften.** SF Pro und New York dürfen laut Apples
  Lizenz nur für Oberflächen-Entwürfe für Apple-Systeme benutzt werden,
  nicht für den Webauftritt eines Unternehmens.
- **Keine Apple-Symbole, -Bilder, -Farben oder -Textbausteine.**
- **Kein Eindruck, ein Angebot von Apple zu sein.**
- Übernommen werden Prinzipien: Lesbarkeit vor Effekt, klare Rangfolge,
  großzügige Leere, Glas nur für Bedienelemente und nie für Inhalt,
  Farben in hell **und** dunkel mitdenken, keine dünnen Schriftschnitte.

Die Regel „Nachbauten: eigene Sprache, eigene Namen" weiter oben gilt
unverändert und zusätzlich.

## Rechtstexte nicht anfassen, nur warnen (permanent, 14.11.2026)

Ansage des Betreibers: „rechtstexte nicht verändern nur aufmerksam
machen auf mögliche fehler/gefahren."

**Betroffen:** `src/agb.njk`, `src/datenschutz.njk`,
`src/impressum.njk`, `src/widerruf.njk` und alles, was daraus erzeugt
wird. Dazu gehören auch Rechtshinweise, die anderswo stehen, etwa der
Haftungsausschluss im Baugenehmigungs-Check.

**Es wird dort nichts geändert.** Keine Umformulierung, keine
Gedankenstriche, keine Rechtschreibkorrektur, kein „nur schnell
schöner machen". Auch dann nicht, wenn eine andere Regel in diesem
Dokument es nahelegt: Die Gedankenstrich-Regel endet an der Tür zum
Rechtstext.

**Stattdessen:** Was auffällt, wird dem Betreiber gemeldet, mit
Fundstelle, konkretem Risiko und, wo möglich, der Vorschrift oder dem
Grund. Gesammelt in `docs/rechtstexte-befunde.md`.

**Grund für beides.** Ein Rechtstext ist kein Marketingtext. Eine
Umformulierung kann eine Frist, eine Einschränkung oder eine
Pflichtangabe verschieben, ohne dass man es ansieht. Umgekehrt ist
Schweigen über einen erkannten Fehler schlimmer als der Fehler selbst,
denn der Betreiber haftet und kann nicht sehen, was er nicht liest.

**Was hier gesagt wird, ist keine Rechtsberatung.** Formeln wie
„rechtskonform", „100 % sicher" oder „garantiert fehlerfrei" sind
verboten. Die verbindliche Bewertung holt der Betreiber beim Anwalt;
hier wird sie vorbereitet.

## Rechtliche Risiken sind Release-Blocker (permanent, 08.11.2026)

Ungeklärte Fragen zu Nutzungsrechten, Marken, Lizenzen, Datenschutz
oder Einwilligungspflicht blockieren die Freigabe, bis sie **fachlich**
geklärt sind. Eine Einschätzung aus diesem Chat ist **keine
Rechtsberatung** und darf nie als solche ausgegeben werden. Formeln wie
„vollständig rechtskonform", „100 % sicher" oder „garantiert
fehlerfrei" sind verboten.

## Vorschaulink immer mitschicken (permanent, 14.11.2026)

Ansage des Betreibers: „musst mir den vorschaulink schon immer
mitschicken".

**Bei jedem Bericht über eine Änderung an der Webseite steht die
Vorschau-Adresse dabei** – nicht nur beim ersten Mal, nicht nur auf
Nachfrage. Der Betreiber sieht sich die Seite selbst an; ohne Link muss
er danach suchen.

Vorschau des Arbeitsbranches:
`https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev`
(Branch-Name, Schrägstrich durch Bindestrich ersetzt, dann
`-bvlanding.bv-verwaltung.workers.dev`.)

**Vorher abrufen, nicht nur nennen.** Die Regel aus
`docs/WEBSITE_STAGING.md` gilt weiter: Eine Adresse wird erst genannt,
wenn sie selbst abgerufen und gegen den eigenen Stand geprüft wurde. Der
Cloudflare-Bau braucht nach dem Push ein bis zwei Minuten; eine zu frühe
Abfrage zeigt den alten Stand. Am 14.11.2026 ist genau das passiert.
Dazu einen eindeutigen Abfrageanhang benutzen (`?x=<zufall>`), sonst
antwortet der Zwischenspeicher.

**Die Adresse ist öffentlich** – das gehört dazugesagt, wenn ein Dritter
sie bekommen könnte.

**Nicht mehr dazusagen:** dass Vorschau-Aufrufe in die Messdaten
schreiben. Ansage des Betreibers vom 14.11.2026: „das is mir egal,
sobald alles 100% fertig is werde ich alles nullen." Der Hinweis ist
damit beantwortet und wird nicht wiederholt.

## Sprache: keine Gedankenstriche (permanent, 14.11.2026)

Ansage des Betreibers: „Also diese Gedankenstriche versucht ihr
irgendwie wegzulassen, das sieht zu viel nach KI aus."

**Gilt für jeden Text, der auf der Seite steht** – Überschriften,
Beschreibungen, Knöpfe, Beschriftungen, FAQ, Schema.org. Statt des
Gedankenstrichs: ein Punkt und ein neuer Satz, ein Doppelpunkt, ein
Komma, oder gar nichts.

| statt | besser |
|---|---|
| „Ihr Traumplatz draußen – maßgefertigt aus Aluminium." | „Ihr Traumplatz draußen. Maßgefertigt aus Aluminium." |
| „Warum Aluminium – und nicht Holz?" | „Warum Aluminium und nicht Holz?" |
| „Wenn eine Kante gesichert werden muss – Balkon, Treppe." | „Wenn eine Kante gesichert werden muss: Balkon, Treppe." |

**Ausgenommen, weil es Typografie ist und kein Stil:** Zahlen- und
Zeitspannen (`Mo–Fr`, `8–17 Uhr`, `2–3 Werktage`) und die Firmierung im
Impressum.

**Wird ein Text im sichtbaren Bereich geändert, muss der gleiche Text in
Schema.org mitgeändert werden** – die FAQ-Fragen stehen doppelt in
`index.html`, einmal sichtbar und einmal im strukturierten Datenblock.

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
**eigene Designsprache der Seite**. Welche das ist, hängt davon ab, woran
gearbeitet wird – seit der Freigabe vom 13.11.2026 gibt es zwei:

- **Laufende Live-Seite:** `src/css/style.css` und das, was die Seite
  schon hat (`--gold #C49A2A`, `--gold-dark #9A7318`,
  `--gold-text #7A5B12`, `--black #111111`, Barlow Condensed und Inter).
  Hier ändert sich nichts, bis dazu eigens entschieden wird.
- **Neue Webseite:** `docs/WEBSITE_DESIGN_SYSTEM.md` (Markengold
  `#C58A32`, Manrope). Vom Auftraggeber freigegeben.

Beides nebeneinander ist Absicht, nicht Schlamperei: Die Freigabe gilt
dem Neubau, die Live-Seite läuft unverändert weiter. Fremde Paletten,
Schriften oder Tailwind-Vorlagen werden nicht übernommen – das wäre ein Bruch mit der Regel „Nachbauten: eigene Sprache,
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
