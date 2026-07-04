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
