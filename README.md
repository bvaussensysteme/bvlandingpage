# BV AussenSysteme – Website

Offizielle Website von BV AussenSysteme – Ihr Spezialist für Terrassenüberdachungen, Carports, Pergolen und Sonnenschutz im Westerwald.

🌐 **Live:** https://bv-aussensysteme.de

---

## 📁 Projektstruktur

```
bv-aussensysteme/
├── index.html                  ← Startseite mit Hero-Slider
├── agb.html                    ← AGB
├── datenschutz.html            ← Datenschutzerklärung
├── impressum.html              ← Impressum (Gründung in Vorbereitung)
├── konfigurator.html           ← 3D Konfigurator (Platzhalter)
├── pflege.html                 ← Pflegehinweise
├── einzugsgebiet.html          ← Einzugsgebiet-Karte (Leaflet.js)
├── partner.html                ← Partnerseite
├── kontakt.html                ← Redirect → /#kontakt
├── sitemap.xml
├── robots.txt
├── PROJEKTSTAND.md             ← Vollständiger Projektstand für KI-Chats
├── css/
│   └── style.css               ← Alle Styles
├── js/
│   ├── main.js                 ← FAQ, Hamburger, Sticky CTA, Formspree
│   ├── cookie.js               ← DSGVO Cookie-Banner
│   ├── accessibility.js        ← Barrierefreiheits-Widget
│   └── slider.js               ← Hero-Slider
├── images/
│   ├── logo-hell.png           ← Logo für Navbar
│   ├── logo-dunkel.png         ← Logo für Footer
│   ├── marker-logo.png         ← BV-Logo für Kartenmarker
│   ├── partner-vd-alusysteme.png
│   └── prod_*.jpg              ← 21 Produktbilder (800×600)
└── produkte/
    ├── terrassenueberdachung.html
    ├── carport.html
    ├── pergola.html
    ├── kaltwintergarten.html
    ├── sonnenschutz.html
    ├── gelaender.html
    └── eingangsüberdachung.html
```

---

## 🚀 Deployment

**Hosting:** Cloudflare Worker „bvlanding"
**GitHub:** Repository `bvaussensysteme/bvlandingpage` (Public)

### Änderungen veröffentlichen:
1. Dateien im GitHub Repository aktualisieren (Web-UI Upload)
2. Cloudflare Cache leeren: dash.cloudflare.com → bv-aussensysteme.de → Caching → **Purge Everything**

---

## 🎨 Design

| Element | Wert |
|---------|------|
| Gold | `#C49A2A` |
| Gold Dark | `#9A7318` |
| Schwarz | `#111111` |
| Off-White | `#F5F2EB` |
| Schrift Überschriften | Barlow Condensed 700/800 |
| Schrift Text | Inter 400/500 |

---

## ⚙️ Features

- **Hero-Slider** – 4 Slides, 6,5s Auto-Slide, Touch/Swipe, Ken Burns Effekt
- **Barrierefreiheits-Widget** – 8 Funktionen, rechts unten, localStorage
- **Cookie-Banner** – DSGVO-konform, localStorage + Cookie Fallback
- **Beta-Modal** – Erscheint beim ersten Besuch mit Kontaktinfos
- **Einzugsgebiet-Karte** – Leaflet.js + BV-Logo als Marker
- **Formspree-Formular** – ID `xnjkabdv` → info@bv-aussensysteme.de
- **Google Bewertungsbutton** – Echter Google-Style Button

---

## 📋 Offene Aufgaben

### Nach Gründung (Pflicht)
- [ ] Impressum vervollständigen (USt-ID, Handelsregisternummer)
- [ ] Google Business Verifizierung via Google Meet abschließen
- [ ] Google Business auf „Geöffnet" stellen

### Geplant
- [ ] Trustindex Widget (nach erster Bewertung)
- [ ] Terminbuchung via Cal.com + Google Calendar
- [ ] Echte Produktfotos einbauen
- [ ] 3D Konfigurator entwickeln lassen

---

## 📞 Kontakt

- **Tel:** 015678 696609
- **E-Mail:** info@bv-aussensysteme.de
- **WhatsApp:** https://wa.me/4915678696609
