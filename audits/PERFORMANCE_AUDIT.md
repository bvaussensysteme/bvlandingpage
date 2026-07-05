# ⏱️ PERFORMANCE AUDIT — BV AussenSysteme
**Agent**: Performance Benchmarker + Frontend Developer | **Stand**: 05.07.2026

## Overall Score: B+ (echter LCP-Bug behoben, Caching-Header ergänzt, Root-Duplikate entfernt)

### Aktuelle Messwerte (geschätzt, ohne Lighthouse-Zugang)
| Metrik | Aktuell | Ziel (2026) | Status |
|---|---|---|---|
| LCP (Largest Contentful Paint) | WebP + jetzt korrekt gepreloadet | <2,5s | ✅ (Verifikation per Lighthouse ausstehend) |
| INP (ersetzt FID) | <200ms erwartet | <200ms | ✅ |
| CLS | <0,05 | <0,1 | ✅ |
| JS gesamt (unkomprimiert) | ~206KB (13 Dateien, nicht alle auf jeder Seite geladen) | – | 🟡 knapp, unverändert |
| CSS (unkomprimiert) | ~72KB | <80KB | ✅ |

### 05.07.2026 — Neue Funde, direkt behoben
- 🔴→✅ **Echter Bug in `index.html`**: `<link rel="preload" as="image" href="images/terrasse.webp">` zeigte auf eine 2,7KB-Mini-Datei, die auf der Seite gar nicht angezeigt wird. Das tatsächliche LCP-Element (Hero-Hintergrund, `background-image` in Slide 1) ist `images/vd_prod_terrasse_tds.webp` (112KB) — wurde **nicht** gepreloadet. Der Preload-Hint war komplett wirkungslos, während das echte LCP-Bild normal (spät, weil CSS-`background-image` erst nach Style-Berechnung entdeckt wird) geladen wurde. Href korrigiert auf die echte Datei.
- ✅ **~4,1MB unreferenzierte Root-Bild-Duplikate entfernt** (36 Dateien wie `carport.jpg`, `pergola.jpg`, `galerie-*.jpg`, `prod_*.jpg`, `partner-vd-alusysteme.png`). Präzise per Pfad-Grep verifiziert: alle Seiten referenzieren ausschließlich die `images/`-Version. Favicons/Logos im Root (`favicon-*.png`, `apple-touch-icon.png`, `logo-*.png`) NICHT angefasst — die werden tatsächlich direkt aus dem Root referenziert.
- ✅ **Cache-Control-Header ergänzt** (`_headers`) — vorher komplett gefehlt, Cloudflare-Default war `public, max-age=0, must-revalidate` für alle Assets (Browser muss bei jedem Request revalidieren). Neu:
  - `/images/*`: `max-age=86400, stale-while-revalidate=604800` (1 Tag, bewusst moderat statt "immutable" — es gibt keine Cache-Busting-Query-Parameter im HTML und Bilder wurden laut Historie schon mehrfach unter demselben Dateinamen überschrieben)
  - `/css/*`, `/js/*`: `max-age=3600, stale-while-revalidate=86400` (kurz gehalten, damit Bugfixes zeitnah bei wiederkehrenden Besuchern ankommen)
- ✅ **Preconnect für tatsächlich genutzte Leaflet-CDN-Hosts**: `windzonen.html` → cdnjs.cloudflare.com, `einzugsgebiet.html` → unpkg.com (beide Seiten nutzten bisher unterschiedliche CDNs ohne jeden Resource-Hint)
- ✅ **dns-prefetch für Geocoding-APIs** (photon.komoot.io, nominatim.openstreetmap.org) auf `windzonen.html` + `baugenehmigung.html` ergänzt — werden bei jeder Adresssuche in den beiden interaktiven Tools angefragt
- Geprüft, aber unbedenklich: viele `<img>` ohne HTML-`width`/`height` in Produktseiten-Galerien (v.a. `sonnenschutz.html`, `eingang.html`, `velaris.html`, `fassade.html`, `balkon-fassade.html`) — CSS erzwingt bereits feste `aspect-ratio`/`height`/`position:absolute` auf den Containern (`.produkt-card-img`, `.vd-carousel-slide`), daher kein reales CLS-Risiko trotz fehlender HTML-Attribute
- Zur Kenntnis: CSP existiert entgegen dem 04.07.-Audit-Eintrag inzwischen (Commits #61–#64, Security-Bereich zuständig)

### Status der 24.06./04.07.-Maßnahmen
#### ✅ P0 WebP-Bilder — erledigt
- 38 WebP-Dateien vorhanden, direkt als `src="…webp"` bzw. `background-image` eingebunden (kein `<picture>`-Fallback, aber für alle Evergreen-Browser unproblematisch)

#### ✅ P1 Render-Blocking — weiterhin behoben
- Alle Scripts mit `defer`

#### 🟡 P2 CSS !important / i18n.js — unverändert
- Refactoring bzw. Code-Splitting weiterhin offen, nicht dringend

### Nur mit Bildbearbeitungs-Tools möglich (hier nicht verfügbar, daher nicht umgesetzt)
- AVIF zusätzlich zu WebP für Hero-/große Produktbilder (nochmal ~20-25% kleiner als WebP, aber Encode-Aufwand + `<picture>`-Fallback nötig)
- Nachträgliche Kompression/Downscale einzelner besonders großer Originale (z.B. `images/galerie-3-full.jpg` 891KB, `images/prod_eingang_frontline.jpg` 892KB laut `ls -la`)

### Nächste Schritte
1. Echten Lighthouse-Lauf nach Deployment durchführen (bisher nur geschätzte Werte)
2. Cache-Busting (z.B. `?v=` Query-Parameter oder Dateinamen-Hash) einführen, um später aggressiveres Caching (`immutable`, 1 Jahr) für CSS/JS/Bilder risikofrei zu ermöglichen
3. `<picture>`-Fallback mit AVIF ist optional, aktuell keine Priorität

---
*Performance Benchmarker Agent | Nächste Messung: nach Lighthouse-Lauf*
