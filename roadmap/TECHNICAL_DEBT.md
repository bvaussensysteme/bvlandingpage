# 🏗️ TECHNICAL DEBT — BV AussenSysteme
**Agent**: CTO + Engineering Code Reviewer | **Stand**: 24.06.2026

## Debt-Score: 34 Punkte (Ziel: <20)

### Kritische Schulden

| # | Problem | Datei(en) | Aufwand | Impact |
|---|---|---|---|---|
| TD-01 | 38 JPGs ohne WebP | images/ | 2h | Sehr hoch |
| TD-02 | 48× !important in CSS | css/style.css | 4h | Mittel |
| TD-03 | Inline-JS in HTML-Dateien | alle .html | 8h | Mittel |
| TD-04 | Kein Build-System (minify/bundle) | — | 4h | Mittel |
| TD-05 | i18n.js 41KB bei DE-only | js/i18n.js | 2h | Gering |
| TD-06 | dibt-lastzonen.js 28KB überall geladen | js/ | 1h | Gering |
| TD-07 | Keine GitHub Actions CI/CD | .github/ | 3h | Mittel |
| TD-08 | Schema.org fehlt auf 18 Produktseiten | produkte/ | 2h | Hoch |
| TD-09 | Kein automatisches Bildoptimierungs-Pipeline | — | 4h | Hoch |
| TD-10 | `_template.html` leer im Repo | produkte/ | 0.5h | Gering |

### Erledigte Schulden (Referenz)
- ~~Keine CSP-Header~~ → Behoben 24.06.2026
- ~~Doppelte Favicon-Links~~ → Behoben 24.06.2026
- ~~Scripts ohne defer~~ → Behoben 24.06.2026 (alle 16 Produktseiten)
- ~~Keyword-Kannibalisierung~~ → Behoben 24.06.2026
- ~~Hamburger ohne aria-label~~ → Behoben 24.06.2026

### Priorisierter Abbauplan

#### Sprint 1 (sofort, 1 Tag):
- TD-01: WebP-Konvertierung (Python cwebp oder ffmpeg)
- TD-06: dibt-lastzonen.js nur auf windzonen.html laden

#### Sprint 2 (kurzfristig, 1 Woche):
- TD-08: Schema.org Product auf alle Produktseiten
- TD-10: _template.html bereinigen

#### Sprint 3 (mittelfristig, 1 Monat):
- TD-07: GitHub Actions (Lighthouse CI + HTML-Validation)
- TD-04: Einfaches Build-Script (html-minifier, imagemin)

#### Sprint 4 (langfristig):
- TD-02: CSS-Refactoring (Spezifizität normalisieren)
- TD-03: JS auslagern

---
*CTO Agent + Code Reviewer | Aktualisierung bei jedem Sprint*
