# Herkunft und Grenzen dieses Skills

**Quelle:** https://github.com/cuellarfr/design-skills (`skills/accessibility-audit/`),
Lizenz **MIT** (© 2026 Carlos C., LICENSE.txt liegt daneben).
Geholt am 06.11.2026 über `raw.githubusercontent.com`.

**Geprüft vor dem Einbau:** 9 Dateien, ausschließlich Markdown. Keine
Skripte, keine `allowed-tools`-Angabe, keine Netz- oder Shell-Aufrufe.
Der einzige Treffer auf `<script>` steht in einem Codebeispiel in
`references/common-issues-and-fixes.md`. **Das Installationsskript des
Ursprungsprojekts wurde nicht ausgeführt** – kopiert wurden nur die
Textdateien.

**Was er liefert:** WCAG 2.2 (A/AA/AAA), ein fünfstufiges Prüfverfahren
(automatisch, Tastatur, Vorlesesoftware, visuell, Ablauf), die 15
häufigsten Fehler mit Vorher/Nachher-Code, Prüflisten und Berichtsvorlagen.

**Grenzen, die hier gelten:**

- Die Werkzeugempfehlungen (axe DevTools, WAVE, Pa11y, Lighthouse) laufen
  hier nicht – diese Arbeitsumgebung hat nur Playwright. Gemessen wird
  deshalb mit eigenen Skripten im Browser; das Ergebnis ist dasselbe,
  der Weg ein anderer.
- Beispiele sind React/JSX. Diese Website ist **statisches HTML mit
  eigenem CSS**; `className`, Hooks und Komponentenbeispiele sind
  sinngemäß zu übertragen, nicht abzuschreiben.
- `templates/accessibility-rules-file.md` schlägt vor, einen Regelblock
  in `CLAUDE.md` zu schreiben. **Nicht ungefragt tun** – was in
  `CLAUDE.md` steht, entscheidet der Betreiber.
- AAA ist laut Skill „aspirational". Verbindlich bleibt hier **AA**.

Der Skill liefert Hinweise. Was gebaut wird, entscheidet der Betreiber.
