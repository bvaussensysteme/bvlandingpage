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

## Letzte Übergabe

**13.11.2026 – Agentensystem eingerichtet**

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
