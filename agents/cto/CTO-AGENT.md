# 🔧 CTO Agent — BV AussenSysteme
**Rolle**: Chief Technology Officer | architektonische Entscheidungen, Codequalität, technische Schulden

## Stack
- **Frontend**: Vanilla HTML5/CSS3/JS (keine Frameworks) — bewusste Entscheidung für Einfachheit
- **Hosting**: Cloudflare Worker (Edge CDN)
- **Deploy**: GitHub Actions → Cloudflare
- **Geodaten**: DIBt GeoJSON (390 Kreise, Leaflet.js)
- **Formulare**: Formspree
- **Fonts**: Google Fonts (lazy, nach Consent)

## Aktuelle Architektur-Bewertung: B
Stärken: Einfach, schnell deploybar, keine Build-Komplexität
Schwächen: Kein Build-System, kein Minifier, 113KB JS unkomprimiert

## Nächste technische Entscheidungen
1. WebP-Pipeline einrichten
2. GitHub Actions Lighthouse CI
3. dibt-lastzonen.js als lazy-module laden

## Code-Standards
- Mobile First
- Semantisches HTML5
- CSS Custom Properties (keine Präprozessoren)
- Kein jQuery, kein Framework
- Rückwärtskompatibel
