# BV AussenSysteme – Website

Offizielle Website von BV AussenSysteme – Ihr Spezialist für Aluminium-Außensysteme im Westerwald.

🌐 **Live:** https://bv-aussensysteme.de

---

## 📁 Projektstruktur

```
bv-aussensysteme/
├── index.html                    ← Startseite mit Hero-Slider
├── agb.html / datenschutz.html / impressum.html
├── konfigurator.html             ← Platzhalter
├── pflege.html / einzugsgebiet.html / partner.html
├── kontakt.html                  ← Redirect → /#kontakt
├── sitemap.xml / robots.txt / llms.txt / llms-full.txt
├── PROJEKTSTAND.md               ← Vollständiger Projektstand für KI-Chats
├── css/style.css
├── js/main.js / cookie.js / accessibility.js / slider.js
├── images/vd_*.jpg (VD-Bilder) / logo / favicon / marker
└── produkte/ (16 Seiten)
```

---

## 🚀 Deployment

**Hosting:** Cloudflare Workers
**GitHub:** Privates Repository

### Änderungen veröffentlichen:
1. Dateien auf GitHub hochladen
2. **Cloudflare → Caching → Purge Everything**

### Update-ZIP (nur geänderte Dateien):
```bash
cd /home/claude/bv-aussensysteme
zip /mnt/user-data/outputs/BVsite-update-DATUM.zip datei1.html css/style.css
```

---

## 🎨 Design

| Element | Wert |
|---------|------|
| Gold | `#C49A2A` |
| Gold Dark | `#9A7318` |
| Schwarz | `#111111` |
| Off-White | `#F5F2EB` |
| WhatsApp Grün | `#25D366` |
| Überschriften | Barlow Condensed 700/800 |
| Fließtext | Inter 400/500/600 |

---

## ⚙️ Features

- **Hero-Slider** – 4 Slides, 6,5s, kein Hover-Pause, ⏸ Button fixed
- **Sticky CTA** – „Kostenlos anfragen" + „WhatsApp" zentriert
- **Barrierefreiheits-Widget** – 8 Funktionen, rechts unten + Scroll-to-Top
- **Cookie-Banner** – DSGVO, localStorage + Cookie Fallback
- **Einzugsgebiet-Karte** – Leaflet.js, BV-CSS-Marker
- **9 Leistungskacheln** – alle mit eigenen Produktseiten
- **Formular** – Formspree + Datenschutz-Pflichtcheckbox
- **KI-Optimierung** – llms.txt, llms-full.txt, robots.txt

---

## 📦 Produktseiten (16)

| Seite | Produkte |
|-------|---------|
| terrassenueberdachung.html | TDS, SkyView + Zusatzelemente |
| carport.html | TDS, Flat Line, Flat Box |
| pergola.html | SunPro Plus, Warema L50, Lamaxa L50 |
| sonnenschutz.html | Aufdach, Unterdach, Senkrecht, Velaris |
| kaltwintergarten.html | TDS |
| gelaender.html | Alu+Glas, Easy Rail |
| eingang.html | FLY, Front Line, TDS |
| balkon-fassade.html | Balkon, Deco Wall, Sichtschutz |
| garten-aussenbereich.html | Gartenhaus, Fahrrad, Bushaltestelle, Faltdach |
| velaris.html | Velaris |
| faltdach.html | OpenAir |
| balkonueberdachung.html | Balkon |
| fassade.html | Deco Wall |
| sichtschutz.html | Sichtschutz |
| fahrradueberdachung.html | Fahrrad |
| gartenhaus.html | TDS |

---

## 📋 Offene Aufgaben

### Nach Gründung
- [ ] USt-ID in Impressum + AGB
- [ ] Google Business Verifizierung
- [ ] Google Ads (400€ + 400€ Guthaben)

### Geplant
- [ ] Cal.com + Google Calendar
- [ ] Trustindex nach erster Bewertung
- [ ] Eigene Fotos (Händlerportal VD)
- [ ] HeyGen KI-Avatar-Video
- [ ] Cloudflare Pages (Auto-Deploy)

---

## 📞 Kontakt

- **Tel:** 015678 696609
- **E-Mail:** info@bv-aussensysteme.de
- **WhatsApp:** https://wa.me/4915678696609
