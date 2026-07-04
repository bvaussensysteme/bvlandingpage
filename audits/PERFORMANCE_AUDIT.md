# ⏱️ PERFORMANCE AUDIT — BV AussenSysteme
**Agent**: Performance Benchmarker + Frontend Developer | **Stand**: 04.07.2026

## Overall Score: B (WebP umgesetzt, ein Cleanup-Punkt neu gefunden)

### Aktuelle Messwerte (geschätzt, ohne Lighthouse-Zugang)
| Metrik | Aktuell | Ziel | Status |
|---|---|---|---|
| LCP (Largest Contentful Paint) | verbessert durch WebP | <2.5s | ✅ (Verifikation per Lighthouse ausstehend) |
| FID/INP | <100ms | <200ms | ✅ |
| CLS | <0.05 | <0.1 | ✅ |
| JS gesamt (unkomprimiert) | ~150KB (10 Dateien inkl. dibt-lastzonen.js) | <150KB | 🟡 knapp |
| CSS (unkomprimiert) | 1838 Zeilen / ~62KB | <80KB | ✅ |

### Status der 24.06.-Maßnahmen
#### ✅ P0 WebP-Bilder — erledigt
- 38 WebP-Dateien vorhanden, direkt als `src="…webp"` bzw. `background-image` eingebunden (kein `<picture>`-Fallback, aber für alle Evergreen-Browser unproblematisch)
- Hero-Slides, Galerie, `og:image`/`twitter:image` nutzen WebP

#### 🔴 P2 Neu gefunden: ~4,8 MB unreferenzierte Bild-Duplikate im Repo-Root
- **Problem**: Dateien wie `carport.jpg`, `pergola.jpg`, `terrasse.jpg`, `galerie-3-full.jpg`, `prod_eingang_frontline.jpg` liegen sowohl im Repo-Root als auch (aktuell) unter `images/` — die Root-Kopien werden von **keiner** HTML-Seite referenziert (per grep verifiziert)
- **Auswirkung**: Kein Einfluss auf Ladezeit der Website selbst (Browser lädt nur referenzierte Dateien), aber unnötige Repo-Größe/Deploy-Zeit und Verwechslungsgefahr bei künftigen Änderungen
- **Lösung**: Root-Duplikate löschen, einzige Quelle bleibt `images/`

#### ✅ P1 Render-Blocking — weiterhin behoben
- Alle Scripts mit `defer`

#### 🟡 P2 CSS !important — unverändert
- Refactoring weiterhin offen, nicht dringend

#### 🟡 P2 i18n.js — unverändert
- Weiterhin auf allen Seiten geladen, Code-Splitting offen

### Nächste Schritte
1. Root-Bild-Duplikate entfernen (~4,8MB, siehe oben)
2. Echten Lighthouse-Lauf nach Deployment durchführen (bisher nur geschätzte Werte)
3. `<picture>`-Fallback ist optional, aktuell keine Priorität

---
*Performance Benchmarker Agent | Nächste Messung: nach Lighthouse-Lauf*
