# BV AussenSysteme – Projektstand (Website / KI-Referenz)

> Nur Website-technische Informationen. Vertrauliche Geschäftsdaten → `PROJEKTSTAND-VERTRAULICH.md`
> Letzte Aktualisierung: 26.06.2026

---

## ⚙️ MULTI-AGENT-SYSTEM — ARBEITSANWEISUNG

> Diese Anweisung gilt für **jeden neuen Chat** und **jede Anfrage** uneingeschränkt.

### Pflicht-Reihenfolge bei jedem Chat-Start
1. `PROJEKTSTAND.md` vollständig lesen
2. Gesamtes Projektverzeichnis analysieren
3. Aufgabe bearbeiten

### Kontextquellen
| Quelle | Pfad | Priorität |
|---|---|---|
| Projektstand | `PROJEKTSTAND.md` | 🔴 Pflicht |
| Projektverzeichnis | `bv-aussensysteme/` | 🔴 Pflicht |
| Roadmap | `roadmap/MASTER_ROADMAP.md` | 🟠 Bei Planung |
| Security Audit | `audits/SECURITY_AUDIT.md` | 🟠 Bei Sicherheit |
| Performance Audit | `audits/PERFORMANCE_AUDIT.md` | 🟠 Bei Performance |
| SEO Audit | `audits/SEO_AUDIT.md` | 🟠 Bei SEO |
| UX Audit | `audits/UX_AUDIT.md` | 🟠 Bei Design/UX |
| Feature Backlog | `roadmap/FEATURE_BACKLOG.md` | 🟡 Bei Features |
| Technical Debt | `roadmap/TECHNICAL_DEBT.md` | 🟡 Bei Refactoring |

### Prioritätenreihenfolge (verbindlich)
```
1. Sicherheit
2. Stabilität
3. Performance (Core Web Vitals, LCP < 2.5s)
4. Benutzerfreundlichkeit (Mobile First, WCAG 2.2 AA)
5. SEO (Lokale SEO, Schema.org, Content)
6. Wartbarkeit
7. Conversion
8. Neue Features
```

### Dokumentationspflicht nach Änderungen
- `PROJEKTSTAND.md` (immer)
- `roadmap/MASTER_ROADMAP.md` (bei Roadmap-Änderungen)
- `audits/SECURITY_AUDIT.md` (bei Sicherheitsänderungen)
- `improvements/IMPROVEMENT-LOG.md` (bei jeder Implementierung)

---

## UNTERNEHMEN

- **Firma:** BV AussenSysteme
- **Branche:** Terrassenüberdachungen, Carports, Pergolen, Lamellendächer, Sonnenschutz, Geländer, Außensysteme aus Aluminium
- **Region:** Westerwaldkreis, 50 km Radius um Dernbach
- **Tel:** 015678 696609
- **E-Mail:** info@bv-aussensysteme.de
- **WhatsApp:** https://wa.me/4915678696609
- **Website:** https://bv-aussensysteme.de

---

## LIVE WEBSITE

- **URL:** https://bv-aussensysteme.de (kanonisch, OHNE www)
- **www:** https://www.bv-aussensysteme.de → Cloudflare 301 Redirect auf die Version ohne www
- **Deploy:** Dateien auf GitHub hochladen → Cloudflare: Caching → Purge Everything

> ⚠️ Alle Canonical-Tags, hreflang, og:url, Sitemap, robots.txt und llms.txt MÜSSEN auf `https://bv-aussensysteme.de` (ohne www) zeigen — sonst meldet Google Search Console "Umleitungsfehler" für die Startseite (Vorfall 01.07.2026, behoben 04.07.2026).

---

## UPDATE-ZIP SYSTEM

Nur geänderte Dateien packen. Immer aus dem Ordner `bv-aussensysteme/` heraus:
```bash
cd /home/claude/bv-aussensysteme && zip /mnt/user-data/outputs/BVsite-update-DATUM.zip datei1.html datei2.css
```

---

## DATEISTRUKTUR

```
bv-aussensysteme/
├── index.html                    ← Hauptseite mit Hero-Slider (4 Slides)
├── agb.html
├── datenschutz.html
├── impressum.html
├── konfigurator.html             ← Platzhalter "Demnächst"
├── pflege.html
├── windzonen.html                ← Wind- & Schneelastzonen-Tool (DIBt-Daten)
├── baugenehmigung.html           ← Baugenehmigung-Checker (alle 16 Bundesländer)
├── einzugsgebiet.html            ← Leaflet.js Karte
├── partner.html
├── kontakt.html                  ← Redirect → /#kontakt
├── vorschau.html                 ← noindex, intern
├── sitemap.xml                   ← 26 Seiten
├── robots.txt
├── llms.txt / llms-full.txt      ← KI-Optimierung
├── _headers                      ← Cloudflare Security Headers
├── css/style.css                 ← ~60KB, 35 Media Queries
├── js/
│   ├── main.js                   ← FAQ, Hamburger, Sticky CTA, Formspree
│   ├── cookie.js                 ← DSGVO Cookie-Banner (localStorage)
│   ├── accessibility.js          ← Barrierefreiheits-Widget (8 Funktionen)
│   ├── slider.js                 ← Hero-Slider (4 Slides, 6.5s)
│   ├── i18n.js                   ← Mehrsprachigkeit
│   ├── dibt-lastzonen.js         ← 406 Landkreise Wind/Schnee (nur windzonen.html)
│   └── baugenehmigung-data.js    ← LBO-Daten alle 16 Bundesländer
├── data/
│   └── lastzonen_deutschland.geojson
├── images/                       ← vd_* Prefix = VD-Lieferantenbilder
├── agents/ audits/ roadmap/ docs/ improvements/
└── produkte/ (16 Seiten)
```

---

## AKTUELLER PROJEKTSTATUS
**Score: 86/100** | Stand: 04.07.2026 (kompletter Audit gegen echten Code verifiziert)

| Bereich | Status | Score |
|---|---|---|
| Security | ⚠️ B- | HSTS/Headers ok, aber **CSP fehlt trotz gegenteiliger Doku**, Leaflet ohne SRI-Hash |
| Deployment | ✅ | HTTPS, Google Business, GitHub |
| SEO Technik | ✅ A- | Canonical, Sitemap, Schema, hreflang; 2 von 20 Produktseiten ohne Product-Schema |
| Accessibility | ✅ B | WCAG 2.2 AA |
| Performance | ✅ B | WebP umgesetzt; 4,8MB unreferenzierte Bild-Duplikate im Repo-Root gefunden |
| Content | ✅ A- | Alle vormals kurzen Seiten jetzt 700+ Wörter, Blog + lokale Landingpages live |
| Conversion | ✅ B+ | Cal.com-Buchung + Bewertung live; Preisindikation weiterhin offen |

> Details je Bereich: siehe `audits/SECURITY_AUDIT.md`, `audits/PERFORMANCE_AUDIT.md`, `audits/SEO_AUDIT.md`, `audits/UX_AUDIT.md` (alle Stand 04.07.2026)

---

## DESIGN-SYSTEM

- Gold: `#C49A2A` | Gold-Dark: `#9A7318`
- Schwarz: `#111111` | Off-White: `#F5F2EB`
- WhatsApp-Grün: `#25D366`
- Fonts: Barlow Condensed (Überschriften) + Inter (Text) – erst nach Cookie-Consent
- Border-Radius: `--radius: 6px`

---

## FEATURES

### Hero-Slider (js/slider.js)
- 4 Slides: Hauptbotschaft, Terrassendach, Carport, Pergola
- 6,5 Sekunden Auto-Slide | Touch/Swipe | ⏸ Pause-Button fixed

### Sticky CTA Banner
- „Kostenlos anfragen" (Gold) + „WhatsApp" (Grün)
- Schließbar mit ✕

### Barrierefreiheits-Widget (js/accessibility.js)
- 8 Funktionen: Schriftgröße, Kontrast, Links, Cursor, Lesehilfe, Nacht, Leseschrift, Animationen
- Filter auf `#bv-page-wrapper` → Widget immer sichtbar
- Scroll-to-Top Button darüber

### Cookie-Banner (js/cookie.js)
- localStorage primär + Browser-Cookie Fallback
- Feuert `bv_consent_given` Event → lädt Google Fonts
- DSGVO-konform

### Wind- & Schneelastzonen-Tool (windzonen.html)
- Nominatim Geocoding (OpenStreetMap)
- Leaflet.js Karte mit BV-Goldmarker
- Nearest-Neighbor-Lookup gegen 390-Punkte GeoJSON
- Quellen: DIBt Wind 02.06.2022, DIBt Schnee 07.02.2023

### Baugenehmigung-Checker (baugenehmigung.html)
- Photon (komoot.io) Geocoding + Nominatim Fallback
- LBO-Daten aller 16 Bundesländer in baugenehmigung-data.js
- Produkt-Chips (Terrassenüberdachung, Carport, etc.) filtern Ergebnisse
- FAQPage Schema.org

### Einzugsgebiet-Karte (einzugsgebiet.html)
- Leaflet.js, CSS-Marker (kein divIcon!)

---

## TECHNISCHE REGELN

- **Leaflet-Marker:** Immer Standard-OSM-Marker – kein divIcon
- **Cloudflare Workers:** Kein Standard-Cookie-API → localStorage als primärer Speicher
- **VD-Bilder:** Prefix `vd_` → bei Vertragsende alle entfernen
- **Google Fonts:** Erst nach Cookie-Consent laden
- **Scripts:** defer auf allen Seiten
- **Rechtlicher Hinweis:** TMG ersetzt durch DDG (seit März 2024)
- **Formular:** Datenschutz-Pflichtcheckbox, Honeypot (`_gotcha`)

---

## SEO & KI-OPTIMIERUNG

- Google Search Console: verifiziert, Sitemap eingereicht
- Schema.org: LocalBusiness, FAQPage (21 Fragen), HowTo, Service, Product (6 Hauptseiten)
- aggregateRating: vorbereitet → nach erster Bewertung aktivieren
- hreflang: www + non-www auf allen Seiten
- `llms.txt` + `llms-full.txt` für ChatGPT, Perplexity, Claude
- robots.txt: GPTBot, Claude-Web, PerplexityBot, Google-Extended erlaubt

### Lokale Keywords
Westerwald, Montabaur, Hachenburg, Altenkirchen, Bad Marienberg, Ransbach-Baumbach, Wirges, Pleckhausen, Neuwied, Koblenz, Limburg, Diez

---

## SOCIAL MEDIA (Metricool)
- Instagram: bv.aussensysteme
- Facebook, TikTok: BV Aussensysteme
- YouTube: UCU2_F-qZlN7KyfHY4G2oSFg
- Workflow: Foto/Video → Text → Canva → Metricool planen

---

## RECHTLICHER STATUS
- Impressum: § 5 DDG ✅ | ⚠️ USt-ID fehlt noch
- Datenschutz: Cloudflare, Formspree, Google Fonts (consent) ✅
- Cookie-Banner: DSGVO-konform ✅
- Garantie: 10 J. Alu, 5 J. Markisen/Antriebe ✅
- AGB: Widerrufsrecht §312g BGB (Maßanfertigung) ✅ | ⚠️ USt-ID fehlt

---

## OFFENE AUFGABEN (Website)

### 🔴 P0 — Sofort
- [x] aggregateRating aktivieren ✅ bereits live (5.0 ⭐, 1 Bewertung) – vorher fälschlich als offen geführt
- [ ] Google Ads schalten
- [ ] **CSP-Header ergänzen** (Audit 04.07.: fehlt trotz gegenteiliger Doku, siehe SECURITY_AUDIT.md)
- [ ] **SRI-Hash für Leaflet-CDN ergänzen** (windzonen.html, einzugsgebiet.html)

### 🟠 P1 — Kurzfristig
- [x] WebP-Konvertierung ✅ 26.06.2026 – 38 Bilder, 1,74MB gespart
- [x] Cal.com Terminbuchung ✅ 26.06.2026 – termin.html mit cal.com/bv-aussensysteme
- [x] 7 Produktseiten 300+ Wörter ✅ 26.06.2026 – alle jetzt 700+ Wörter
- [ ] Trustindex Widget vollständig aktivieren (Tab vorbereitet, CDN-Script noch auskommentiert)
- [ ] Impressum + AGB: USt-ID nach Gründung ergänzen
- [ ] Schema.org `Product` auf `balkonueberdachung.html` + `sonnenschutz-beschattung.html` ergänzen
- [x] Verwaiste Datei `produkte/eingangs├╝berdachung.html` gelöscht ✅ 04.07.2026 – war Ursache für 404 in der Sitemap
- [ ] ~4,8MB unreferenzierte Bild-Duplikate im Repo-Root aufräumen

### 🟡 P2 — Mittelfristig
- [x] Lokale Landingpages ✅ 26.06.2026 – montabaur/neuwied/koblenz/altenkirchen
- [x] Blog-Sektion ✅ 26.06.2026 – ratgeber/ mit 5 Pillar-Artikeln
- [x] Danke-Seite ✅ 26.06.2026 – danke.html mit Redirect nach Formular
- [ ] Eigene Produktfotos nach VD-Vertragsunterzeichnung
- [ ] Preisindikation auf Produktseiten ("ab X €") ergänzen
- [ ] Mobilmenü: Active/Tap-State CSS ergänzen

---

## PRODUKTTEXTE (eigene Formulierungen)

### Terrassenüberdachung
**TDS:** Bestseller – klare Linien, robuste Aluminiumprofile, Polycarbonat oder Glas. Wandanbau oder freistehend, erweiterbar.
**SkyView:** Flach, modern. Innenliegendes Gefälle unsichtbar von außen. 8mm VSG-Glas, LED und Lautsprecher optional.
**Zusatzelemente:** Stirn-/Seitenelemente, Glasschiebetür, Velaris, Festelemente mit Tür.

### Carport
**TDS:** Wandanbau oder freistehend, Glas/Polycarbonat, alle RAL-Farben.
**Flat Line:** Flach, modern, ideal für PV-Anlage oder Dachbegrünung.
**Flat Box:** Aus Flat Line wird vollwertige Garage – Sandwichplatten, Rolltor, Tür, Fenster.

### Pergola & Lamellendach
**SunPro Plus:** Motorisiert, wetterfest bis Windstärke 8, alle RAL-Farben.
**Warema L50:** Deutsches Qualitätslamellendach, breite Lamellen.
**Lamaxa L50:** Premium-Lamellendach. Ganzjährig nutzbar.
**Velaris:** Einsteuerbare Alu-Lamellen – Licht, Sichtschutz & Belüftung.

### Sonnenschutz
**Aufdach:** Linea (kompakt), Solara (große Flächen), Rolax (Rollo mit Dämmwirkung).
**Unterdach:** Linea, Solara, Plissee, Sonnensegel.
**Senkrecht:** Sonne, Wind, Sichtschutz. Solar-Variante mit Akku + LED.

### Geländer
**Alu + VSG-Glas:** 8 oder 10mm, klar oder opal.
**Easy Rail:** Minimaler Rahmen, maximale Transparenz.

### Eingang & Vordächer
**FLY:** Schlanker Aluminiumträger, 17mm ESG. Ab 100cm Breite.
**Front Line:** LED standard, Bewegungsmelder optional.

### Balkon & Fassade
**Deco Wall:** Klicksystem, unsichtbare Befestigung, vertikal/horizontal.
**Sichtschutz:** 14cm Paneele kombinierbar, alle RAL-Farben.

### Garten & Außenbereich
**Gartenhaus TDS:** Alu-Profil, Sicherheitsglas, wartungsfrei, erweiterbar.
**Fahrradüberdachung:** Modular, 2 bis 20+ Räder.
**Bushaltestelle:** Alu + Glas oder Holzoptik, Maßanfertigung.
**Faltdach OpenAir:** Modular, für Gastronomie, patentiertes Wasserableitungssystem.

---

## ÄNDERUNGSHISTORIE

### 04.07.2026 (3) — GSC "Umleitungsfehler" auf Startseite behoben
- Ursache: Cloudflare leitet `www.bv-aussensysteme.de` → `bv-aussensysteme.de` (so gewollt, echte Seite läuft ohne www), aber Canonical-Tags, hreflang, og:url, Sitemap, robots.txt und llms.txt zeigten überall auf die `www`-Version
- Für Google: die als kanonisch deklarierte URL lieferte nur eine Weiterleitung statt Inhalt → "Umleitungsfehler"
- Fix: 193 Vorkommen in 49 Dateien von `www.bv-aussensysteme.de` auf `bv-aussensysteme.de` umgestellt (Canonical, hreflang, og:url, JSON-LD, Sitemap, robots.txt, llms.txt/llms-full.txt)
- Sitemap bleibt valides XML, alle Domain-Referenzen jetzt konsistent mit der tatsächlichen Cloudflare-Konfiguration
- Nächster Schritt (manuell, GSC-Login nötig): Sitemap neu einreichen + Indexierung für die Startseite erneut beantragen

### 04.07.2026 (2) — GSC-Indexierungsproblem behoben
- Ursache: 36 von 37 URLs nie von Google gecrawlt ("Nicht zutreffend")
- `garten-aussenbereich.html`: 4 Produktkarten (Gartenhaus, Fahrradüberdachung, Bushaltestelle, Faltdach) verlinkten fälschlich auf `/#kontakt` statt auf die echten Detailseiten – jetzt korrigiert
- `balkon-fassade.html`: Links zu `fassade.html` (Deco Wall) + `sichtschutz.html` ergänzt
- `pergola.html`: Querverweis zu `velaris.html` ergänzt (war bisher komplett unverlinkt)
- Sitemap-Eintrag `produkte/eingangsüberdachung.html` (doppelt-UTF-8-kodierter Dateiname) führte zu 404 – Datei gelöscht, Sitemap-Eintrag entfernt
- `index.html`-Footer: 4 lokale Landingpages (Montabaur/Neuwied/Koblenz/Altenkirchen) direkt statt nur `einzugsgebiet.html` verlinkt; Ratgeber-Blog erstmals im Footer verlinkt
- Nächster Schritt (manuell, GSC-Login nötig): Sitemap neu einreichen + Indexierung für Schlüsselseiten beantragen

### 04.07.2026 — Kompletter Audit (Security, Performance, SEO, UX)
- Alle 4 Audit-Dateien gegen echten Code verifiziert (nicht nur gegen alte Doku) und aktualisiert
- **Kritisch**: CSP-Header existiert entgegen bisheriger Doku nicht – neuer P0-Punkt
- **Kritisch**: Leaflet-CDN-Includes ohne SRI-Hash – neuer P0-Punkt
- aggregateRating war bereits aktiv, aber fälschlich als offen geführt – korrigiert
- Cal.com-Buchung, Danke-Seite, Konfigurator-Feedback als erledigt bestätigt
- WebP-Umsetzung bestätigt (kein `<picture>`-Fallback, aber unproblematisch)
- Neu gefunden: ~4,8MB unreferenzierte Bild-Duplikate im Repo-Root
- Neu gefunden: verwaiste Datei `produkte/eingangs├╝berdachung.html` mit doppelt-kodiertem Dateinamen, nirgends verlinkt
- 2 von 20 Produktseiten weiterhin ohne Schema.org Product
- Gesamt-Score: 82 → 86/100

### 26.06.2026
- Baugenehmigung-Checker: JS-Bug (kaputte Anführungszeichen) behoben
- FAQ-Accordion: von details/summary auf styled accordion umgestellt
- Produkt-Chips: CSS + Filterfunktion ergänzt
- SEO: Title/Meta für baugenehmigung.html + windzonen.html verbessert
- PROJEKTSTAND aufgeteilt in public + vertraulich

### 25.06.2026
- Gründungsberatung HWK erledigt
- GbR als Rechtsform entschieden
- Mails an HWK Rechtsberatung + Rolf Müller abgeschickt

### 24.06.2026
- Multi-Agenten-System, alle Audits, Schema.org Product
- 82/100 Reality Checker Score
- Baugenehmigung-Checker live

### 23.06.2026
- Initiales Launch: 24 Seiten, Hero-Slider, Cookie-Banner, Widget
