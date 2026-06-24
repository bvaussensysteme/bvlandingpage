# ⏱️ PERFORMANCE AUDIT — BV AussenSysteme
**Agent**: Performance Benchmarker + Frontend Developer | **Stand**: 24.06.2026

## Overall Score: C+ → Ziel: B+ nach WebP-Implementierung

### Aktuelle Messwerte (geschätzt, ohne Lighthouse-Zugang)
| Metrik | Aktuell | Ziel | Status |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ~3.5s | <2.5s | ⚠️ |
| FID/INP | <100ms | <200ms | ✅ |
| CLS | <0.05 | <0.1 | ✅ |
| Seitengröße (index.html) | ~80KB HTML | — | ✅ |
| Gesamte Bildgröße | 4.7MB | <500KB geladen | ⚠️ |
| JS gesamt (unkomprimiert) | 113KB | <150KB | ✅ |
| CSS (unkomprimiert) | 59KB | <80KB | ✅ |

### Kritischste Performance-Probleme

#### 🔴 P0: Fehlende WebP-Bilder
- **Problem**: 38 JPG-Bilder, kein einziges WebP
- **Auswirkung**: +1-2s LCP, PageSpeed verliert ~20 Punkte
- **Lösung**: WebP-Versionen generieren + `<picture>` Tags
- **Einsparpotenzial**:
  - galerie-3-full.jpg: 871KB → ~250KB (-71%)
  - galerie-2-full.jpg: 645KB → ~185KB (-71%)
  - galerie-1-full.jpg: 479KB → ~138KB (-71%)
  - Gesamt: 4.7MB → ~1.4MB (-70%)

#### 🟠 P1: Render-Blocking (behoben für index.html)
- index.html: ✅ defer auf allen Scripts
- Produktseiten: ✅ 24.06.2026 behoben (16 Seiten)

#### 🟡 P2: CSS !important Overuse
- **Problem**: 48x `!important` in style.css
- **Auswirkung**: Erhöhte CSS-Spezifizität, schwerer zu maintainen
- **Lösung**: CSS-Refactoring bei nächstem Major-Update

#### 🟡 P2: i18n.js (41KB) immer geladen
- Auf deutschen Seiten ist Mehrsprachigkeit aktiv (40x data-i18n)
- Aber: 41KB für eine DE-only-Website ist overhead
- **Lösung**: Code-Splitting oder lazy-loading wenn nicht genutzt

#### 🟢 P3: Lazy Loading
- Hero-Bilder haben fetchpriority="high" ✅
- Restliche Bilder: loading="lazy" prüfen

### WebP-Implementierungsplan
```html
<!-- Statt: -->
<img src="images/galerie-1.jpg" alt="..." />

<!-- So: -->
<picture>
  <source srcset="images/galerie-1.webp" type="image/webp" />
  <img src="images/galerie-1.jpg" alt="..." loading="lazy" />
</picture>
```

### Nächste Schritte
1. WebP-Dateien erzeugen (Python-Script oder cwebp)
2. HTML-Templates mit `<picture>` Tags aktualisieren
3. Lighthouse-Audit nach Deployment

---
*Performance Benchmarker Agent | Nächste Messung: nach WebP-Deployment*
