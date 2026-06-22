# BV AussenSysteme – Projektstand

> **Für neuen Chat:** ZIP hochladen, diese Datei lesen lassen, sofort weitermachen.
> Letzte Aktualisierung: 22.06.2026

---

## KUNDE
- **Inhaber:** Alexander Becker + Josef (2. Geschäftsführer, Gründung in Vorbereitung)
- **Firma:** BV AussenSysteme
- **Tel:** 015678 696609
- **E-Mail:** info@bv-aussensysteme.de
- **Adresse:** Am Driesch 1, 56428 Dernbach (Westerwald) – Heimarbeitsplatz, kein Kundenstandort
- **Branche:** Terrassenüberdachungen, Carports, Pergolen, Kaltwintergärten, Sonnenschutz, Geländer
- **Hersteller-Partner:** VD AluSysteme Dietrich GmbH (vd-alusysteme.de)

---

## LIVE WEBSITE
- **URL:** https://bv-aussensysteme.de (ohne www funktioniert sicher)
- **www:** https://www.bv-aussensysteme.de → leitet weiter via Cloudflare Redirect Rule
- **Hosting:** Cloudflare Worker „bvlanding" (serviert statische Dateien direkt)
- **GitHub:** Repository bvaussensysteme/bvlandingpage (Public) – Dateien dort hochladen
- **DNS:** Cloudflare – nach Änderungen: dash.cloudflare.com → bv-aussensysteme.de → Caching → Purge Everything
- **Formular:** Formspree ID `xnjkabdv` → geht an info@bv-aussensysteme.de
- **Google Bewertungslink:** https://g.page/r/CQh4XlvW-1nEEBM/review

---

## TECHNISCHER AUFBAU
```
bv-aussensysteme/
├── index.html                  ← Hauptseite mit Hero-Slider
├── agb.html
├── konfigurator.html           ← Platzhalter „Demnächst verfügbar"
├── pflege.html                 ← Pflegehinweise für Überdachungen
├── einzugsgebiet.html          ← Leaflet.js Karte mit BV-Logo als Marker
├── impressum.html              ← „Gründung in Vorbereitung"
├── datenschutz.html
├── partner.html                ← Partnerseite (VD AluSysteme mit Logo)
├── kontakt.html                ← Redirect auf /#kontakt
├── sitemap.xml
├── robots.txt
├── css/style.css               ← Alle Styles (~1400 Zeilen)
├── js/
│   ├── main.js                 ← FAQ, Hamburger, Sticky CTA, Formspree
│   ├── i18n.js                 ← ENTFERNT (Sprachauswahl wurde deaktiviert)
│   ├── cookie.js               ← Cookie-Banner (speichert in localStorage + Cookie)
│   ├── accessibility.js        ← Barrierefreiheits-Widget (8 Funktionen, rechts unten)
│   └── slider.js               ← Hero-Slider (4 Slides, 6.5s, Touch/Swipe)
├── images/
│   ├── logo-hell.png           ← Navbar Logo (hell)
│   ├── logo-dunkel.png         ← Footer Logo (dunkel)
│   ├── marker-logo.png         ← BV-Logo freigestellt für Kartenmarker (36px)
│   ├── partner-vd-alusysteme.png ← VD Logo freigestellt (1256x308)
│   ├── prod_*.jpg              ← 21 Produktbilder (800x600, aus VD-Screenshots)
│   └── galerie-*.jpg           ← Galeriebilder
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

## DESIGN
- **Primärfarbe:** Gold `#C49A2A`, Gold-Dark `#9A7318`
- **Hintergrund:** Schwarz `#111111`, Off-White `#F5F2EB`
- **Fonts:** Barlow Condensed (Überschriften, 700/800) + Inter (Fließtext) via Google Fonts
- **Logo hell:** logo-hell.png (Navbar auf weißem Hintergrund)
- **Logo dunkel:** logo-dunkel.png (Footer auf schwarzem Hintergrund)
- **Border-Radius:** `--radius: 6px`

---

## FEATURES IM DETAIL

### Hero-Slider (js/slider.js)
- 4 Slides: 1) Hauptbotschaft+Karten, 2) Terrassendach, 3) Carport, 4) Pergola
- Auto-Slide alle **6,5 Sekunden** mit goldener Fortschrittsleiste
- Pause nur beim Hover über Pfeile/Punkte (NICHT bei allgemeinem Hover)
- Touch/Swipe Mobile, Mausdrag Desktop, Pfeiltasten Keyboard
- Ken Burns Zoom-Effekt auf Hintergrundbilder
- Stoppt wenn Barrierefreiheits-Widget „Animationen stoppen" aktiv

### Barrierefreiheits-Widget (js/accessibility.js)
- Button: unten **rechts**, goldener Kreis mit Rollstuhl-Icon
- 8 Funktionen: Schriftgröße, Hoher Kontrast, Links unterstreichen, Großer Cursor, Lesehilfe, Nachtmodus, Leseschrift, Animationen stoppen
- Filter (Kontrast/Nachtmodus) werden auf `#bv-page-wrapper` angewendet → Widget bleibt immer sichtbar
- Einstellungen in localStorage gespeichert
- Early-Script im `<head>` verhindert Flash beim Laden

### Cookie-Banner (js/cookie.js)
- Speichert in **localStorage** (primär) + Browser-Cookie (Fallback)
- Cloudflare-kompatibel (Browser-Cookies wurden von Cloudflare Worker manchmal blockiert)
- Optionen: Alle akzeptieren / Nur notwendige / Ablehnen / Einstellungen (mit Toggles)

### Einzugsgebiet-Karte (einzugsgebiet.html)
- Leaflet.js mit OpenStreetMap
- Marker: BV-Logo (marker-logo.png) – Hauptorte 36px, normale Orte 28px
- Absoluter Bildpfad via `window.location.origin + '/images/marker-logo.png'`
- Liste rechts: normale Punkte (nicht Logo)
- Unten: „Ihr Standort nicht dabei? Melden Sie sich trotzdem – wir prüfen individuell..."

### Beta-Hinweis-Modal
- Erscheint beim ersten Besuch (einmal pro Session via sessionStorage)
- Zeigt: Entschuldigung für Baustelle + alle Kontakte (Tel, WhatsApp, E-Mail) als klickbare Kacheln
- Button „Verstanden – weiter zur Seite"

### Partner-Seite (partner.html)
- VD AluSysteme Dietrich GmbH mit freigestelltem Logo
- Link: vd-alusysteme.de
- Im Footer unter „Unternehmen" verlinkt

### Konfigurator (konfigurator.html)
- Platzhalter „Demnächst verfügbar"
- 6 Feature-Karten: Maße, Farben, 3D Vorschau, Preisanfrage, Direkte Anfrage, Mobil & Desktop
- E-Mail-Benachrichtigungs-Formular (Formspree)

### Kontakt-Redirect (kontakt.html)
- `bv-aussensysteme.de/kontakt` → leitet direkt zu `/#kontakt`

---

## SPRACHAUSWAHL
- **Status: DEAKTIVIERT** – wurde entfernt weil der TreeWalker den Sprachbutton-Text überschrieben hat („DE DE" Bug) und trotz mehrerer Fixes nicht zuverlässig funktioniert hat
- i18n.js ist noch im Projekt aber hat keinen Sprachswitcher mehr in der Navbar

---

## SEO & GOOGLE
- **Google Search Console:** Verifiziert, Sitemap `sitemap.xml` eingereicht (14 Seiten erkannt, Status: Erfolgreich)
- **Indexierung:** Seite bereits in Google-Suchergebnissen sichtbar
- **Schema.org:** LocalBusiness, FAQ, HowTo in index.html
- **Google Business Profil:** Aktiv, verifiziert via DNS
  - Adressänderung ausstehend (Wartung/Verifizierung via Google Meet nötig)
  - Toggle „Unternehmensadresse für Kunden einblenden" = AUS
- **Google Bewertungs-Button:** Echter Google-Style Button auf Startseite (weiß, G-Logo, Sterne)

---

## CLOUDFLARE SETUP
- **Worker:** bvlanding → serviert die statische Website
- **Custom Domain:** bv-aussensysteme.de (direkt am Worker)
- **www-Redirect:** Redirect Rule „Redirect from WWW to root" (Active) + CNAME www → bv-aussensysteme.de
- **DNS Records:**
  - Worker: bv-aussensysteme.de → bvlanding (Proxied)
  - CNAME: www → bv-aussensysteme.de (Proxied)
  - MX: mx00/mx01.ionos.de (E-Mail via Ionos)
  - TXT: google-site-verification + SPF
- **Wartungsfenster:** 22.06.2026 12:00-13:00 UTC (kurzer Ausfall war normal)

---

## OFFENE AUFGABEN

### Nach Gründung (Pflicht)
- [ ] Impressum: Straße, USt-ID, Handelsregisternummer nachtragen
- [ ] AGB: Straße im Widerrufsrecht ergänzen
- [ ] Google Business: Adress-Verifizierung via Google Meet abschließen
- [ ] Google Business: „Vorübergehend geschlossen" auf „Geöffnet" stellen
- [ ] Rahmenliefervertrag VD unterschreiben → Händlerportal-Bilder dürfen dann verwendet werden

### Geplant / Nice-to-have
- [ ] Trustindex Widget einbauen (nach erster Google-Bewertung)
- [ ] Terminbuchung: Cal.com mit Google Calendar (wenn auf Google Calendar umgestellt)
  - Aktuell: TimeTree (kein Cal.com-Sync möglich)
  - Plan: Google Calendar testen, dann Cal.com einbinden
- [ ] Produktbilder: Durch echte Fotos ersetzen (aktuell Platzhalter aus VD-Screenshots)
- [ ] Galerie: Mit echten Referenzfotos befüllen
- [ ] 3D Konfigurator: Entwickeln lassen wenn Budget vorhanden
- [ ] Weitere Partner zur partner.html hinzufügen

---

## WAS GUT FUNKTIONIERT
- ✅ Website live, 100/100 Ionos Score (Präsenz, Gefunden, Abgesichert, Schnell)
- ✅ Google indexiert, Search Console aktiv
- ✅ Formspree-Formular funktioniert
- ✅ Cookie-Banner (localStorage-basiert, Cloudflare-kompatibel)
- ✅ Beta-Hinweis-Modal beim ersten Besuch
- ✅ Hero-Slider mit 4 Slides (6,5s, Touch, Swipe, Ken Burns)
- ✅ Barrierefreiheits-Widget (8 Funktionen, rechts unten)
- ✅ Partner-Seite mit VD AluSysteme Logo
- ✅ Einzugsgebiet-Karte mit BV-Logo als Marker
- ✅ SEO: Schema.org, Sitemap, robots.txt
- ✅ Mobile-responsive (Audit durchgeführt)
- ✅ 7 Produktseiten
- ✅ Pflegehinweise-Seite
- ✅ Konfigurator-Platzhalter
- ✅ Google-Style Bewertungsbutton
- ✅ /kontakt Redirect
- ✅ Barrierefreiheits-Widget stoppt Hero-Slider bei „Animationen stoppen"

---

## WICHTIG FÜR NEUEN CHAT
1. ZIP hochladen und entpacken
2. Diese PROJEKTSTAND.md lesen
3. Änderungen immer in `/home/claude/bv-aussensysteme/` vornehmen
4. Am Ende ZIP neu packen: `cd /home/claude && zip -r /mnt/user-data/outputs/bv-aussensysteme.zip bv-aussensysteme/`
5. **PROJEKTSTAND.md nach jeder Änderung aktualisieren**
6. Auf GitHub: Dateien direkt ins Repository hochladen (kein Git nötig, Upload via Web-UI)
7. Nach GitHub-Upload: Cloudflare Purge Everything (Cache leeren)
