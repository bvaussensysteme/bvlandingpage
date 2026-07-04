# BV AussenSysteme – Hinweise für Claude Code

Vollständiger Projektkontext steht in `PROJEKTSTAND.md` (immer zuerst lesen).

## Sparsamer Umgang mit Nutzungsvolumen (permanent)

Der Betreiber hat einen begrenzten Claude-Plan – das Guthaben soll möglichst lange reichen. Deshalb bei jeder Aufgabe:

- Keine unnötigen Verifizierungs-Schleifen (nicht jeden Schritt einzeln per `grep`/`curl`/Dry-Run gegenchecken, nur bei wirklich riskanten Änderungen)
- Änderungen bündeln statt viele kleine Commits/PRs nacheinander
- Keine Subagenten für Recherchen, die auch direkt schnell selbst erledigt werden können
- Kurze Zwischen-Updates, nur wenn wirklich relevant
- Bei größeren Aufgaben erst kurz planen/fragen statt explorativ viele Tool-Calls zu verbrauchen
