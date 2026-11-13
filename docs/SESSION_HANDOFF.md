# Sitzungsübergabe

Vorlage. Wird **laufend** ausgefüllt, nicht am Ende – eine Sitzung kann
abbrechen. Bei etwa 75–80 % gefülltem Kontext fertigstellen, committen
und `/clear` vorschlagen.

Der Gesprächsverlauf darf nie die einzige Quelle sein: Ein neuer Chat
muss allein mit dieser Datei weiterarbeiten können.

---

## Ziel dieser Sitzung
<Ein bis zwei Sätze. Was sollte erreicht werden?>

## Stand
<Was läuft jetzt? Was ist fertig und geprüft?>

## Offen
<Was fehlt noch, und warum. Blockaden mit Grund benennen.>

## Betroffene Dateien
<Pfade, je ein Stichwort dazu. Keine vollständigen Diffs.>

## Git
- Branch:
- Letzter Commit:
- Ungesicherte Änderungen: ja / nein
- Nach `main` zusammengeführt: ja / nein

## Geprüft
<Welche `scripts/pruefe-*` gelaufen sind und mit welchem Ergebnis.
Was NICHT geprüft wurde, gehört hierher – nicht weglassen.>

## Nächster sicherer Schritt
<Eine konkrete Handlung, mit der ein neuer Chat anfangen kann.>

## Liegt beim Betreiber
<Entscheidungen, die nicht beim Assistenten liegen.>

---

## ⇢ Aktueller Stand zum Weiterarbeiten (13.11.2026, abends)

> **Alles unten liegt auf `claude/bv-aussensysteme-setup-bq7ew4`.
> NICHTS ist veröffentlicht.** `main` und die Live-Seite sind unberührt.
> Veröffentlicht wird nur mit dem wörtlichen Satz aus `CLAUDE.md`.
> „ok", „alles gut" und „weiter" sind **keine** Freigabe – das ist in
> dieser Sitzung mehrfach so gehandhabt worden.

### Was heute fertig geworden ist

| # | Was | Geprüft durch |
|---|---|---|
| 1 | **Produktwahl kommt im Anfrage-Assistenten an.** Auf allen 16 Produktseiten, 33 Karten. Vorher warf jeder Klick einen Fehler und die Wahl verfiel | `pruefe-produktwahl.mjs` 132/132, Gegenprobe 112/112 |
| 2 | **Erster Bildschirm nennt die Produkte** (vorher kein einziger Produktname) und der Kurzweg im Assistenten ist benannt | `pruefe-assistent.mjs` 18/18, `pruefe-darstellung.mjs` 144/144 |
| 3 | **Kontaktschritt sagt den echten Ablauf** statt „Angebot zusenden" | `pruefe-assistent.mjs` 18/18 |
| 4 | **Windzonen-Rechner gibt PLZ und Ort weiter** an die Anfrage | `pruefe-standort-mitgeben.mjs` 9/9, Gegenprobe 10/10 |
| 5 | **Eigene Carport-Referenz** in der Galerie (zwei Fotos, Metadaten entfernt) | `pruefe-galerie.mjs` 11/11, Gegenprobe 10/10 |
| 6 | **„Passt, wenn ..." auf allen neun Produktkarten** der Startseite | `pruefe-darstellung.mjs` 144/144 |
| 7 | **Gegenüberstellung TDS / SkyView** auf der Terrassenseite | `pruefe-vergleich.mjs` 14/14, Gegenprobe 2/2 |

Dazu: **vier neue Prüfskripte**, jedes mit Gegenprobe (siehe
`docs/pruefungen.md`). Alle 32 schnellen Skripte grün,
`pruefe-erzeugte-seiten.sh` und `pruefe-cache-buster.sh` nach jedem
Commit grün.

### Was heute NICHT gemacht wurde, mit Grund

| Punkt | Grund |
|---|---|
| Staging-Isolation | Betreiber hat die unumkehrbare Umstellung auf „Worker Previews" **abgelehnt** (13.11.). Eine private, isolierte Vorschau ist damit nicht herstellbar. **Nicht erneut vorschlagen.** Die leere Vorschau-Datenbank `bv-messung-vorschau` bleibt ungenutzt stehen |
| Auto-Merge-Schutz auf `main` | Betreiber hat die GitHub-Einstellungen übersprungen. `main` trägt weiterhin „immer auto merge" in `CLAUDE.md` |
| Telefon-Pflicht im Formular | Geschäftsentscheidung des Betreibers, offen |
| Verborgener Ergebnisblock auf `/windzonen` | Zweiter Teil von Befund 4, nicht beauftragt |

### Zwei fertige Branches, die einzeln live gehen könnten

| Branch | Inhalt | Status |
|---|---|---|
| `claude/xss-zahlenseite` | XSS-Korrektur in `werkstatt/zahlen.html` + Prüfskript | fertig, **wartet auf Freigabe** – die Lücke ist live weiterhin offen |
| `claude/freigaberegel-main` | `CLAUDE.md` auf `main` richtigstellen | fertig, wartet auf Freigabe |

### Beim Betreiber offen

1. **Einwilligung des Hauseigentümers** für die Carport-Fotos – vor einer Veröffentlichung zu klären. Keine Rechtsberatung.
2. **Ort und Eindeckung** des Carports (für Beschriftung und lokale Suche).
3. Telefon-Pflicht: ja oder nein.
4. Die „2–3 Werktage" bis zum Angebot: betrieblich haltbar?
5. Lizenz- und Datenschutzpunkte 3.5 bis 3.9 in `docs/NEXT_TASK.md` – **Release-Blocker**.

### Ein Hinweis für den nächsten Chat

Browser-Prüfskripte: `browser.newPage()` und danach `setViewportSize()`
benutzen. `browser.newContext({viewport})` ließ in dieser Umgebung drei
Läufe hängen – die Ursache ist dokumentiert in `docs/entscheidungen.md`.

---

## ⇢ Aktueller Stand zum Weiterarbeiten (13.11.2026)

> **Es läuft eine Folge von fünf Aufträgen.** Auftrag 1 (Staging-Plan)
> ist fertig. Nach dem Leeren des Verlaufs kommt **Auftrag 2 von 5** –
> Inhalt noch unbekannt. Diese Sitzung hat ihn nicht vorbereitet und
> soll ihm nicht vorgreifen: erst den Auftrag lesen, dann handeln.
>
> **Seit dem 13.11.2026 gilt der Fokus- und Tokensparmodus**
> (`CLAUDE.md`, erster Abschnitt): nur der aktuelle Auftrag,
> Nebenbefunde nur notieren, Fertig-Kriterium vorher festlegen,
> stoppen wenn fertig, Bericht in vier Teilen.

**Einstieg ist `docs/NEXT_TASK.md`.** Dort stehen die offenen Punkte
vollständig und nach Dringlichkeit. Diese Seite hier ist die Kurzfassung.

### Ziel der letzten Sitzungen
Agentensystem für die schrittweise Modernisierung einrichten, Palette
freigeben lassen, Designwerte von den Fachrollen entscheiden lassen.
Dazwischen: gemeldeter Fehler in der Broschürenanzeige behoben und
veröffentlicht.

### Was fertig ist
- **Broschüren-Zoom korrigiert und live** (PR #567, `main` = `7db6f7a`).
  Live nachgeprüft: ausgelieferte Datei byteweise identisch mit `main`.
- **18 Prüfskripte repariert** (Browserpfad), ebenfalls in `main`.
- **Agentensystem**: 6 neu, 4 erweitert, Zuordnung in
  `docs/WEBSITE_AGENT_WORKFLOW.md`. Alle 15 Dateien geladen und gültig.
- **Palette freigegeben** (`#C58A32`), nachgemessen: Das Hauptlogo trägt
  `#C58930`, ΔE 0,8. Die Entscheidung korrigiert eine Abweichung, die
  vorher bestand.
- **Abgeleitete Werte entschieden** von `ux-architect` und
  `qa-accessibility-auditor`: ein Token `--gold-text: #896023`, Gold auf
  Hell nur Dekor, zwei Fokusringe, Manrope ab 16 px / 400.
- **Neue Prüfung** `scripts/pruefe-palette.py`, Gegenprobe 5/5.

### Das Dringendste, das offen ist
**Die XSS-Korrektur in `werkstatt/zahlen.html` liegt seit dem 08.11. nur
auf dem Arbeitsbranch.** `main` hat 17 Aufrufe von `sicher()`, der
Branch 25. Live ist die Lücke offen. Vorschlag seit dem 08.11.
unbeantwortet: als eigenen kleinen Branch von `main` vorziehen, wie es
am 12.11. mit der Broschüre gemacht wurde. **Entscheidung beim
Betreiber.**

Dahinter: `main` enthält noch die Regel „immer auto merge"; die Vorschau
schreibt in die produktive Messdatenbank und ist ohne Passwort
erreichbar. Alles in `docs/NEXT_TASK.md`, Abschnitt 3.

### Git
- Branch: `claude/bv-aussensysteme-setup-bq7ew4`, alles committet und
  geschoben
- `main`: `7db6f7a`, enthält den Broschüren-Fix
- **Der Arbeitsbranch enthält `main` NICHT** – er ist eigenständig
  gewachsen. Nicht von `main` neu aufsetzen

### Zuletzt geprüft
`pruefe-palette` (+Gegenprobe 5/5), `pruefe-broschuere` 44/44,
`pruefe-darstellung` 144/144, Konfliktmarken, Preisangaben, Kommentare,
erzeugte Seiten, Cache-Buster – alle bestanden.

**Nicht gelaufen:** die vollständige Gegenprobe von `pruefe-broschuere`
(über 30 Minuten Laufzeit, zweimal abgebrochen). Die zwei neuen
Zoom-Prüfungen wurden gezielt gegengeprüft, die 19 übrigen nicht.

### Zuletzt erledigt (13.11.2026, Auftrag 1 von 5)
- **Fokus- und Tokensparmodus** in `CLAUDE.md` aufgenommen
- **Staging-Freigabeplan** in `docs/WEBSITE_STAGING.md`: vier Schritte,
  Messdaten zuerst. Belegt an `wrangler.jsonc` – keine `env`-Blöcke,
  deshalb benutzt jede Auslieferung dieselbe Datenbank. Die
  Passwortschranke der Werkstatt ist wiederverwendbar, kein neues
  Werkzeug nötig. **Nichts eingerichtet.**

### Nächster sicherer Schritt
Zuerst den neuen Auftrag abwarten. Falls er offen lässt, was zu tun ist,
gibt es zwei sinnvolle Anschlüsse:
1. **XSS-Korrektur vorziehen** – schließt ein offenes Risiko, in einer
   Sitzung erledigt (`docs/NEXT_TASK.md`, Abschnitt 1)
2. **Erster abgegrenzter Audit** – `customer-journey-architect` auf der
   Startseite, vorher in die Zahlen sehen (`docs/zahlen-lesen.md`)

---

## Letzte Übergabe

**13.11.2026 (3) – Abgeleitete Designwerte von den Agenten entschieden**

- **Ziel:** Der Auftraggeber wollte die Technikentscheidungen von den
  Design-Agenten, nicht von sich. Richtig so.
- **Stand:** `ux-architect` und `qa-accessibility-auditor` haben
  getrennt entschieden, Ergebnisse in `docs/WEBSITE_DESIGN_SYSTEM.md`.
  Kernpunkte: ein Token `--gold-text: #896023` für Text **und**
  Bedienelemente auf Hell; Gold auf Hell nur Dekor; auf Goldfläche
  Tiefschwarz statt Weiß; zwei Fokusringe, umgeschaltet per
  Abschnittsklasse; Manrope ab 16 px / 400, keine Schnitte darunter.
- **Vom Hauptagenten zusammengeführt:** Der zweite Agent schlug einen
  eigenen Wert `#9A6A1F` für Bedienelemente vor. Nachgerechnet:
  `#896023` erreicht auf allen vier hellen Flächen über 3:1 – ein Token
  statt zwei. Die getrennt arbeitenden Agenten konnten das nicht sehen.
- **Offen:** Fokus-Verdeckung (WCAG 2.4.11) bei fester Kopfzeile ist nur
  im Browser prüfbar, nicht gerechnet. Korrigierte Hell-Variante von
  `logo-hell.png` liegt beim Auftraggeber. Auto-Merge-Regel auf `main`
  und Vorschau-Datenbank weiter vorrangig.
- **Git:** Branch `claude/bv-aussensysteme-setup-bq7ew4`.
- **Geprüft:** `pruefe-palette` bestanden, Gegenprobe 5/5. Sieben
  Stichproben aus den Agentenberichten nachgerechnet, alle exakt.
- **Nächster sicherer Schritt:** erster abgegrenzter Audit
  (`customer-journey-architect` auf der Startseite).

**13.11.2026 (2) – Goldfarbe freigegeben und nachgemessen**

- **Ziel:** Freigabe `#C58A32` dokumentieren, Kontrast und Logo-Harmonie
  vor der Umsetzung prüfen.
- **Stand:** Beide Messungen erledigt. Das Hauptlogo trägt `#C58930` –
  ΔE 0,8 zum neuen Gold, ΔE 12,4 zum alten. Die Freigabe bringt Seite
  und Logo zusammen. Neue Prüfung `scripts/pruefe-palette.py`,
  Gegenprobe 4/4 (jeder Fehler einzeln).
- **Offen:** Textgold `#896023` ist **vorgeschlagen, nicht freigegeben**.
  Gold auf hellem Grund erreicht nur 2,78:1 – darf dort kein Text sein.
  Auto-Merge-Regel auf `main` und die Vorschau-Datenbank bleiben
  vorrangig (siehe unten).
- **Git:** Branch `claude/bv-aussensysteme-setup-bq7ew4`.
- **Geprüft:** pruefe-palette (+Gegenprobe), Konfliktmarken, Preise,
  Kommentare. Kein Seitencode angefasst, also keine Webseiten-Prüfung
  nötig.
- **Nächster sicherer Schritt:** Entscheidung zum Textgold einholen,
  dann der erste abgegrenzte Audit (`customer-journey-architect` auf der
  Startseite).

**13.11.2026 (1) – Agentensystem eingerichtet**

- **Ziel:** Zehn Prüfrollen als Agenten einrichten, Dokumentation anlegen.
- **Stand:** Sechs Agenten neu, vier vorhandene erweitert (Zuordnung in
  `docs/WEBSITE_AGENT_WORKFLOW.md`). Vier Dokumente angelegt.
  Frontmatter aller 15 Agentendateien maschinell geprüft: gültig.
- **Offen:** Die Zielpalette in `docs/WEBSITE_DESIGN_SYSTEM.md` weicht
  von den live benutzten Werten ab (Gold, Schrift) – Entscheidung des
  Betreibers steht aus. Das Gold im Firmenlogo ist noch nicht gemessen.
  Die Vorschau schreibt weiter in die produktive Messdatenbank.
- **Git:** Branch `claude/bv-aussensysteme-setup-bq7ew4`.
- **Geprüft:** Agenten-Frontmatter, Konfliktmarken, Kommentare.
  Keine Webseiten-Prüfung nötig – es wurde kein Seitencode angefasst.
- **Nächster sicherer Schritt:** Entscheidung zur Farbpalette einholen,
  dann einen ersten abgegrenzten Audit (Vorschlag:
  `customer-journey-architect` auf der Startseite).
