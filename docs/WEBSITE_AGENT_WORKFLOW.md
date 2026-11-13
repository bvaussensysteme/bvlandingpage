# Agenten für die Webseite: Zuständigkeiten und sparsame Arbeitsweise

Stand: 13.11.2026. Ergänzt `docs/agents/AGENT-INDEX.md` (die
Langform-Rollen unter `agents/`); hier steht, **wann** welcher Agent läuft
und wie das Guthaben geschont wird.

## Die zehn Rollen und wo sie liegen

Vier Rollen gab es schon unter anderem Namen. Sie wurden **erweitert, nicht
verdoppelt** – zwei Agenten mit demselben Auftrag kosten doppelt und
niemand weiß, welchen er nehmen soll.

| Rolle aus dem Auftrag | Agent (Datei unter `.claude/agents/`) | neu? |
|---|---|---|
| website-architect | `cto` | erweitert |
| premium-design-guardian | `ux-architect` | erweitert, jetzt nur lesend |
| conversion-psychology-auditor | `conversion-psychology-auditor` | neu |
| customer-journey-architect | `customer-journey-architect` | neu |
| mobile-ux-auditor | `mobile-ux-auditor` | neu |
| seo-content-auditor | `seo-specialist` | erweitert, jetzt nur lesend |
| performance-auditor | `performance-auditor` | neu |
| security-privacy-auditor | `security-architect` | erweitert |
| qa-accessibility-auditor | `qa-accessibility-auditor` | neu |
| staging-release-guardian | `staging-release-guardian` | neu |

Zusätzlich bleiben `ceo`, `product-manager`, `growth-hacker` und
`frontend-developer` unverändert bestehen.

**`frontend-developer` ist der einzige Agent, der Code ändern darf.**
Alle Prüfer sind lesend. Das ist Absicht: Ein Prüfer, der selbst
umbaut, prüft hinterher die eigene Arbeit.

## Wann ein Agent läuft – und wann nicht

**Kein Agent** bei: Tippfehlern, einzelnen Textänderungen, einer Farbe,
einem Link, einer Frage, die eine Dateisuche beantwortet. Der Hauptagent
macht das direkt. Ein Subagent fängt bei null an und liest sich erst
wieder ein – das ist der teure Weg.

**Ein Agent** bei einem klar abgegrenzten Prüfauftrag, zum Beispiel:
- Layout oder Bedienelemente geändert → `mobile-ux-auditor`
- neue Bibliothek, Bild oder Schrift geplant → `performance-auditor`
- neues Formular oder neue fremde Einbindung → `security-architect`
- vor einer Freigabe → `qa-accessibility-auditor`, dann
  `staging-release-guardian`

**Nie alle Agenten auf einmal.** Kein zweiter Agent mit demselben
Prüfauftrag. Keine zwei vollständigen Durchsuchungen des Repositorys für
dieselbe Frage.

## Wie die Kosten niedrig bleiben

1. **Erst nachsehen, dann fragen.** Vorhandene Dokumente wiederverwenden:
   `docs/entscheidungen.md` (Logbuch), `docs/pruefungen.md` (Prüfskripte),
   `docs/fallen.md`, `docs/NEUBAU-*.md`. Vieles ist schon untersucht.
2. **Nur die passenden Prüfungen laufen lassen**, nicht alle. Ausnahme:
   nach einer Änderung an Code, den mehrere Bereiche benutzen – dann alle.
3. **Ein Auftrag, eine Abfrage.** Dem Agenten sagen, welche Dateien er
   ansehen soll, statt ihn suchen zu lassen.
4. **Kurze Antworten verlangen:** Befund · Priorität · Beleg ·
   Empfehlung, höchstens zehn Befunde.
5. **Keine Schleifen.** Ein Prüflauf, der zweimal erfolglos war, wird
   nicht ein drittes Mal gestartet – dann stimmt die Annahme nicht.
6. **Keine kostenpflichtigen Werkzeuge** und keine neuen Abhängigkeiten
   ohne Rückfrage.

## Kontext und Übergabe

Bei etwa 75–80 % gefülltem Kontextfenster: am nächsten sicheren Punkt
`docs/SESSION_HANDOFF.md` ausfüllen, committen und `/clear` **vorschlagen**
– nicht selbst ausführen.

Der Kontextstand lässt sich im laufenden Gespräch nicht exakt ablesen.
Wo die Umgebung echte Werte anzeigt, gelten die; sonst ist es eine
Schätzung und wird so benannt. Dass die automatische Verdichtung
ausbleibt, kann niemand zusichern – deshalb steht die Übergabe in einer
Datei und nicht im Gesprächsverlauf. Dauerlaufende Agenten zur
Kontextüberwachung gibt es nicht.

## Ausgabeform für jeden Prüfagenten

```
Befund:      was ist (ein Satz)
Priorität:   hoch | mittel | niedrig
Beleg:       Datei:Zeile, gemessene Zahl oder Zitat
Empfehlung:  was zu tun ist (ein bis zwei Sätze)
```

Keine Zusammenfassung der Arbeitsschritte. Was nicht geprüft werden
konnte, wird benannt statt weggelassen.
