# Herkunft und Grenzen dieses Skills

**Quelle:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
(UI/UX Pro Max v2.15.0), Lizenz **MIT** (© 2024 Next Level Builder,
LICENSE liegt daneben). Eingebaut am 04.11.2026 auf Ansage des
Betreibers: „installiere und führe diesen skill wenns um ui uix und
design geht immer aus" – die Daueranweisung steht in `CLAUDE.md`.

**Nachgetragen am 06.11.2026:** Diese Datei fehlte als einzige unter
`.claude/skills/`; die Herkunft stand nur in `CLAUDE.md`.

**Geprüft:** Textdateien und CSV-Daten, dazu ein Python-Skript
(`scripts/search.py`), das nur die mitgelieferten Dateien durchsucht –
**kein Netzzugriff**. Aufruf:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<frage>" --domain ux
```

Bereiche: `ux`, `style`, `color`, `typography`, `icons`, `chart`,
`product`, `gsap`, `stack`.

**Warum er im Repository liegt und nicht global:** Die Arbeitsumgebung
wird nach jeder Sitzung weggeworfen; global Installiertes wäre beim
nächsten Mal weg.

**Grenzen, die hier gelten:** Er liefert allgemeine Regeln und
Vorschläge für Paletten, Schriftpaarungen und Stile. Verbindlich bleibt
die **eigene Designsprache** (`src/css/style.css`: `--gold #C49A2A`,
`--gold-dark #9A7318`, `--gold-text #7A5B12`, `--black #111111`).
Fremde Paletten, Schriften oder Tailwind-Vorlagen werden **nicht**
übernommen – genutzt werden seine Prüflisten und Begründungen.

Mit 3,9 MB ist er der mit Abstand größte Skill im Repository. Das ist
der Datenbestand (CSV), nicht Code.
