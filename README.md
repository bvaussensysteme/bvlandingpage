# BV AussenSysteme – Website

Offizielle Website von BV AussenSysteme, Ihr Spezialist für Terrassenüberdachungen, Carports, Pergolen und Sonnenschutz im Westerwald.

## 📁 Projektstruktur

```
bv-aussensysteme/
├── index.html          ← Hauptseite (Startseite)
├── impressum.html      ← Impressum
├── datenschutz.html    ← Datenschutzerklärung
├── css/
│   └── style.css       ← Alle Styles
├── js/
│   └── main.js         ← Interaktionen (FAQ, Menü, Formular)
├── images/
│   ├── logo-hell.png   ← Logo (weiß/hell Hintergrund) – für Navbar
│   ├── logo-dunkel.png ← Logo (schwarz Hintergrund)   – für Footer
│   │
│   ├── terrasse.jpg    ← BILD EINFÜGEN: Terrassenüberdachung
│   ├── carport.jpg     ← BILD EINFÜGEN: Carport
│   ├── pergola.jpg     ← BILD EINFÜGEN: Pergola / Lamellendach
│   ├── wintergarten.jpg← BILD EINFÜGEN: Kaltwintergarten
│   ├── markise.jpg     ← BILD EINFÜGEN: Markise / Sonnenschutz
│   ├── gelaender.jpg   ← BILD EINFÜGEN: Geländer
│   │
│   ├── galerie-1.jpg   ← BILD EINFÜGEN: Galerie Referenz 1 (groß)
│   ├── galerie-2.jpg   ← BILD EINFÜGEN: Galerie Referenz 2
│   ├── galerie-3.jpg   ← BILD EINFÜGEN: Galerie Referenz 3
│   ├── galerie-4.jpg   ← BILD EINFÜGEN: Galerie Referenz 4
│   ├── galerie-5.jpg   ← BILD EINFÜGEN: Galerie Referenz 5 (groß)
│   ├── galerie-6.jpg   ← BILD EINFÜGEN: Galerie Referenz 6
│   └── og-preview.jpg  ← BILD EINFÜGEN: Vorschaubild für Social Media (1200x630px)
└── README.md
```

## 🖼️ Bilder einfügen

Kopiere die Produktbilder von VD AluSysteme in den `images/` Ordner mit den oben genannten Dateinamen.
Falls ein Bild fehlt, zeigt die Seite automatisch ein Emoji als Platzhalter.

**Empfohlene Bildgrößen:**
- Leistungskarten (terrasse.jpg etc.): 800×600px, max. 200KB
- Galerie groß (galerie-1.jpg, galerie-5.jpg): 1200×675px, max. 300KB
- Galerie klein (galerie-2 bis 4, 6): 800×600px, max. 200KB
- Social-Media-Vorschau (og-preview.jpg): genau 1200×630px

## 🚀 Deployment auf GitHub Pages

### Schritt-für-Schritt:

1. **GitHub-Konto erstellen** (falls noch nicht vorhanden): https://github.com

2. **Neues Repository erstellen:**
   - Auf GitHub: Klick auf "+" → "New repository"
   - Name: `bv-aussensysteme` (oder `bv-aussensysteme.github.io` für direkte URL)
   - Sichtbarkeit: Public (für GitHub Pages kostenlos)
   - Klick: "Create repository"

3. **Dateien hochladen:**
   - Klick auf "uploading an existing file"
   - Alle Dateien und Ordner aus diesem Projektordner hochladen
   - Commit-Nachricht: "Website launch"
   - Klick: "Commit changes"

4. **GitHub Pages aktivieren:**
   - Repository → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "main" → Ordner: "/ (root)"
   - Klick: "Save"
   - Nach 1–2 Minuten ist die Seite unter `https://DEIN-USERNAME.github.io/bv-aussensysteme/` live

5. **Eigene Domain (bv-aussensysteme.de) verknüpfen:**
   - In GitHub Pages Settings: "Custom domain" eingeben: `www.bv-aussensysteme.de`
   - Bei Ihrem Domain-Anbieter DNS-Eintrag setzen:
     - Typ: CNAME | Name: www | Ziel: `DEIN-USERNAME.github.io`
   - HTTPS wird automatisch aktiviert (Let's Encrypt)

## 📊 Nächste SEO-Schritte nach Go-Live

1. Google Search Console: https://search.google.com/search-console
   → Domain hinzufügen → Sitemap einreichen
2. Google Business Profil anlegen: https://business.google.com
3. Bilder einfügen und Galerie füllen
4. Erste echte Kundenbewertungen einholen (Google + Website)
