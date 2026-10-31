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
  `docs/NEXT_TASK.md` auflisten und **jeweils mit `--gegenprobe`** versehen:
  Schlägt die Prüfung auch an, wenn sie soll?
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
