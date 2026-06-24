# BV AussenSysteme – Projektstand

> **Für neuen Chat:** ZIP hochladen, diese Datei lesen lassen, sofort weitermachen.
> Letzte Aktualisierung: 24.06.2026

---

## ⚙️ MULTI-AGENT-SYSTEM — ARBEITSANWEISUNG

> Diese Anweisung gilt für **jeden neuen Chat** und **jede Anfrage** uneingeschränkt.

### Pflicht-Reihenfolge bei jedem Chat-Start
1. `PROJEKTSTAND.md` vollständig lesen
2. Gesamtes Projektverzeichnis analysieren
3. `agency-agents-main` Repository berücksichtigen
4. Aufgabe bearbeiten

### Kontextquellen (alle berücksichtigen)
| Quelle | Pfad | Priorität |
|---|---|---|
| Projektstand | `PROJEKTSTAND.md` | 🔴 Pflicht |
| Projektverzeichnis | `bv-aussensysteme/` | 🔴 Pflicht |
| Agenten-Bibliothek | `agency-agents-main/` | 🔴 Pflicht |
| Roadmap | `roadmap/MASTER_ROADMAP.md` | 🟠 Bei Planung |
| Security Audit | `audits/SECURITY_AUDIT.md` | 🟠 Bei Sicherheit |
| Performance Audit | `audits/PERFORMANCE_AUDIT.md` | 🟠 Bei Performance |
| SEO Audit | `audits/SEO_AUDIT.md` | 🟠 Bei SEO |
| UX Audit | `audits/UX_AUDIT.md` | 🟠 Bei Design/UX |
| Feature Backlog | `roadmap/FEATURE_BACKLOG.md` | 🟡 Bei Features |
| Technical Debt | `roadmap/TECHNICAL_DEBT.md` | 🟡 Bei Refactoring |

### Agenten-Bibliothek: agency-agents-main
Das Repository `agency-agents-main` (github.com/msitarzewski/agency-agents) ist **fester Bestandteil der Entwicklungsumgebung**.

**Verfügbare Agenten-Kategorien:**
| Kategorie | Agenten | Einsatz bei |
|---|---|---|
| Engineering | Frontend Developer, Backend Architect, DevOps Automator, Code Reviewer, AI Engineer, Autonomous Optimization Architect | Code, Architektur, Deploy |
| Design | UX Architect, UI Designer, UX Researcher, Brand Guardian | Design, Usability |
| Marketing | SEO Specialist, Content Strategist, Growth Hacker, Multi-Platform Publisher | SEO, Content, Ads |
| Security | Security Architect, AppSec Engineer, Penetration Tester | Sicherheit, DSGVO |
| Testing | Reality Checker, Accessibility Auditor, Performance Benchmarker, QA Engineer | Qualität, Tests |
| Product | Product Manager, Business Analyst, Sprint Prioritizer | Planung, Backlog |
| Strategy | NEXUS Coordinator, Business Strategist, Chief of Staff | Roadmap, Entscheidungen |

### Agenten-Aktivierungsregel
Bei jeder Anfrage automatisch:
1. **Relevante Agenten identifizieren** (welche Fachgebiete sind betroffen?)
2. **Empfehlungen simulieren** (was würde jeder Agent empfehlen?)
3. **Konflikte lösen** (z. B. Security vs. Performance – Sicherheit hat Vorrang)
4. **Beste Gesamtstrategie wählen** (Business Impact × Aufwand × Risiko)
5. **Änderungen dokumentieren** (PROJEKTSTAND.md + relevante Audit-Dateien)

### Prioritätenreihenfolge (verbindlich)
```
1. Sicherheit          ← niemals kompromittieren
2. Stabilität          ← keine Regression, rückwärtskompatibel
3. Performance         ← Core Web Vitals, LCP < 2.5s
4. Benutzerfreundlichkeit ← Mobile First, WCAG 2.2 AA
5. SEO                 ← Lokale SEO, Schema.org, Content
6. Wartbarkeit         ← Clean Code, Dokumentation
7. Conversion          ← CTAs, Vertrauen, Buchung
8. Neue Features       ← nach Prüfung aller obigen Punkte
```

### Kontinuierliche Optimierung (bei jeder Analyse suchen nach)
- 🐛 Bugs (funktionale Fehler)
- 🔒 Sicherheitslücken (XSS, fehlende Header, offene Abhängigkeiten)
- ⚡ Performance-Probleme (LCP, CLS, INP, Bildgrößen)
- 🎨 UX-Probleme (Conversion-Hindernisse, Accessibility)
- 🔍 SEO-Probleme (fehlende Tags, Kannibalisierung, Thin Content)
- 🏗️ Technische Schulden (Code-Qualität, fehlende Tests)
- 📈 Skalierungsprobleme (Engpässe, fehlende Automatisierung)
- 🤖 Automatisierungspotenzial (repetitive Aufgaben, CI/CD)

### Dokumentationspflicht nach größeren Änderungen
Folgende Dateien automatisch aktualisieren:
- `PROJEKTSTAND.md` (immer)
- `roadmap/MASTER_ROADMAP.md` (bei Roadmap-Änderungen)
- `audits/SECURITY_AUDIT.md` (bei Sicherheitsänderungen)
- `audits/PERFORMANCE_AUDIT.md` (bei Performance-Änderungen)
- `roadmap/FEATURE_BACKLOG.md` (bei neuen/erledigten Features)
- `improvements/IMPROVEMENT-LOG.md` (bei jeder Implementierung)

---

## KUNDE
- **Inhaber:** Alexander Becker + Josef (2. Geschäftsführer, Gründung in Vorbereitung)
- **Firma:** BV AussenSysteme
- **Tel:** 015678 696609 | WhatsApp: https://wa.me/4915678696609
- **E-Mail:** info@bv-aussensysteme.de
- **Adresse Beratung:** Am Driesch 1, 56428 Dernbach (Westerwald)
- **Adresse Montage:** Pleckhausen (Westerwald) – Josef startet von dort
- **Branche:** Terrassenüberdachungen, Carports, Pergolen, Lamellendächer, Sonnenschutz, Geländer, Außensysteme
- **Hersteller-Partner:** VD AluSysteme Dietrich GmbH (vd-alusysteme.de, Viktor Dietrich GF)
- **Kalender:** Aktuell TimeTree, geplanter Wechsel zu Google Calendar + Cal.com

---

## LIVE WEBSITE
- **URL:** https://bv-aussensysteme.de
- **www:** https://www.bv-aussensysteme.de → Cloudflare 301 Redirect
- **Hosting:** Cloudflare Worker „bvlanding"
- **GitHub:** Repository bvaussensysteme/bvlandingpage (Public)
- **Deploy:** Dateien auf GitHub hochladen → Cloudflare: Caching → Purge Everything
- **Formular:** Formspree ID `xnjkabdv` → info@bv-aussensysteme.de
- **Google Bewertung:** https://g.page/r/CQh4XlvW-1nEEBM/review

---

## UPDATE-ZIP SYSTEM
Ab 23.06.2026: Nur geänderte Dateien in `BVsite-update-DATUM.zip` packen.
**Wichtig:** Immer aus dem Ordner `bv-aussensysteme/` heraus packen:
```
cd /home/claude/bv-aussensysteme && zip /mnt/user-data/outputs/BVsite-update-DATUM.zip datei1.html datei2.css
```
So haben Dateien den richtigen Pfad ohne `bv-aussensysteme/` Prefix.

---

## DATEISTRUKTUR
```
bv-aussensysteme/
├── index.html                    ← Hauptseite mit Hero-Slider (4 Slides)
├── agb.html
├── datenschutz.html
├── impressum.html                ← "Gründung in Vorbereitung"
├── konfigurator.html             ← Platzhalter "Demnächst"
├── pflege.html
├── windzonen.html                ← Wind- & Schneelastzonen-Tool (DIBt-Daten)
├── einzugsgebiet.html            ← Leaflet.js Karte mit BV-Marker
├── partner.html                  ← VD AluSysteme
├── kontakt.html                  ← Redirect → /#kontakt
├── vorschau.html                 ← noindex, intern
├── sitemap.xml                   ← 26 Seiten (aktuell)
├── robots.txt                    ← KI-Crawler erlaubt
├── llms.txt                      ← KI-Optimierung
├── llms-full.txt                 ← Alle Produkttexte für KI
├── _headers                      ← Cloudflare Security Headers (inkl. CSP)
├── PROJEKTSTAND.md
├── README.md
├── google-ads-keywords.md        ← Kampagnenstruktur 400€+400€
├── css/style.css                 ← 59KB, 35 Media Queries, prefers-reduced-motion
├── js/
│   ├── main.js                   ← FAQ, Hamburger, Sticky CTA, Formspree
│   ├── cookie.js                 ← DSGVO Cookie-Banner (localStorage)
│   ├── accessibility.js          ← Barrierefreiheits-Widget (8 Funktionen)
│   ├── slider.js                 ← Hero-Slider (4 Slides, 6.5s)
│   ├── i18n.js                   ← Mehrsprachigkeit (40 data-i18n Tags)
│   └── dibt-lastzonen.js         ← 406 Landkreise Wind/Schneelast (nur windzonen.html)
├── data/
│   └── lastzonen_deutschland.geojson ← 390 Kreise, Nearest-Neighbor-Lookup
├── images/                       ← 38 JPGs (kein WebP, P0-Aufgabe!)
├── agents/                       ← Multi-Agenten-System
│   ├── ceo/CEO-AGENT.md
│   ├── cto/CTO-AGENT.md
│   ├── engineering/FRONTEND-DEVELOPER.md
│   ├── marketing/SEO-SPECIALIST.md + GROWTH-HACKER.md
│   ├── design/UX-ARCHITECT.md
│   ├── security/SECURITY-ARCHITECT.md
│   ├── product/PRODUCT-MANAGER.md
│   └── testing/REALITY-CHECKER.md
├── audits/                       ← Audit-Dokumente
│   ├── SECURITY_AUDIT.md
│   ├── SEO_AUDIT.md
│   ├── PERFORMANCE_AUDIT.md
│   └── UX_AUDIT.md
├── roadmap/                      ← Strategische Dokumente
│   ├── MASTER_ROADMAP.md
│   ├── FEATURE_BACKLOG.md
│   └── TECHNICAL_DEBT.md
├── docs/agents/AGENT-INDEX.md    ← Agenten-Übersicht
├── improvements/IMPROVEMENT-LOG.md ← Änderungsprotokoll
└── produkte/
    ├── terrassenueberdachung.html ← Schema.org Product ✅
    ├── carport.html               ← Schema.org Product ✅
    ├── pergola.html               ← Schema.org Product ✅
    ├── sonnenschutz.html          ← Schema.org Product ✅
    ├── gelaender.html             ← Schema.org Product ✅
    ├── kaltwintergarten.html      ← Schema.org Product ✅
    ├── eingang.html
    ├── balkon-fassade.html
    ├── garten-aussenbereich.html
    ├── velaris.html               ← ⚠️ <300 Wörter
    ├── faltdach.html              ← ⚠️ <300 Wörter
    ├── fassade.html
    ├── sichtschutz.html
    ├── fahrradueberdachung.html   ← ⚠️ <300 Wörter
    ├── gartenhaus.html            ← ⚠️ <300 Wörter
    ├── bushaltestelle.html        ← ⚠️ <300 Wörter
    ├── eingangsüberdachung.html   ← noindex, Redirect → eingang.html
    ├── balkonueberdachung.html    ← noindex, Redirect → balkon-fassade.html
    └── sonnenschutz-beschattung.html ← noindex, Redirect → sonnenschutz.html
```

---

## AKTUELLER PROJEKTSTATUS (Reality Checker)
**Score: 82/100 — CONDITIONAL READY** | Stand: 24.06.2026

| Bereich | Status | Score |
|---|---|---|
| Security | ✅ B+ | CSP, HSTS, SRI, DSGVO |
| Deployment | ✅ | HTTPS, Google Business, GitHub |
| SEO Technik | ✅ A | Canonical, Sitemap, Schema, hreflang |
| Accessibility | ✅ B | WCAG 2.2 AA, kein Critical |
| Performance | ⚠️ C+ | WebP fehlt (4.7MB Bilder!) |
| Content | ⚠️ B- | 7 Seiten < 300 Wörter |
| Conversion | ⚠️ C | Keine Buchung, keine Bewertungen |

---

## DESIGN
- Gold: `#C49A2A` | Gold-Dark: `#9A7318`
- Schwarz: `#111111` | Off-White: `#F5F2EB`
- Fonts: Barlow Condensed (Überschriften) + Inter (Text) – erst nach Cookie-Consent geladen
- Border-Radius: `--radius: 6px`

---

## FEATURES

### Hero-Slider (js/slider.js)
- 4 Slides: 1) Hauptbotschaft zentriert, 2) Terrassendach, 3) Carport, 4) Pergola
- 6,5 Sekunden Auto-Slide, kein Hover-Pause
- ⏸ Pause-Button: fixed unten rechts im Slider-Container (auf allen Slides sichtbar)
- Touch/Swipe Mobile, Mausdrag Desktop
- Stoppt bei Barrierefreiheits-Widget „Animationen stoppen"
- Punkte wurden entfernt – nur Pause-Button

### Sticky CTA Banner (index.html)
- Zwei zentrierte Buttons: „Kostenlos anfragen" (Gold) + „WhatsApp" (Grün #25D366)
- Schließbar mit ✕

### Barrierefreiheits-Widget (js/accessibility.js)
- Button: unten rechts, goldener Kreis
- Scroll-to-Top Button darüber (erscheint nach 300px Scroll)
- 8 Funktionen: Schriftgröße, Kontrast, Links, Cursor, Lesehilfe, Nacht, Leseschrift, Animationen
- Filter auf `#bv-page-wrapper` → Widget bleibt immer sichtbar
- localStorage gespeichert

### Cookie-Banner (js/cookie.js)
- localStorage primär + Browser-Cookie Fallback
- Feuert `bv_consent_given` Event → lädt dann Google Fonts
- DSGVO-konform

### Wind- & Schneelastzonen-Tool (windzonen.html)
- Nominatim Geocoding (OpenStreetMap, DSGVO-freundlich)
- Leaflet.js Karte mit BV-Goldmarker
- Nearest-Neighbor-Lookup gegen 390-Punkte GeoJSON
- Quellen: DIBt Wind 02.06.2022 (DIN EN 1991-1-4/NA), DIBt Schnee 07.02.2023 (DIN EN 1991-1-3/NA)
- BKG VG250 Geometrien (dl-de/by-2-0, © BKG 2025)

### Einzugsgebiet-Karte (einzugsgebiet.html)
- Leaflet.js + OpenStreetMap
- BV-Marker: schwarzer Kreis goldener Rand „BV" Text (CSS, kein Bild)

---

## SEO & KI-OPTIMIERUNG

### Google
- Search Console: verifiziert, Sitemap eingereicht (26 Seiten)
- Schema.org: LocalBusiness (erweitert), FAQPage (21 Fragen), HowTo, Service, **Product auf 6 Hauptprodukten**
- aggregateRating: vorbereitet (reviewCount nach erster Bewertung anpassen!)
- hreflang: www + non-www auf allen Seiten
- Canonical auf allen Seiten
- Meta-Descriptions: alle unter 160 Zeichen

### KI-Optimierung (GEO/AEO)
- `llms.txt` – Standard für ChatGPT, Perplexity, Claude
- `llms-full.txt` – alle Produkttexte
- `robots.txt` – GPTBot, Claude-Web, PerplexityBot, Google-Extended explizit erlaubt

### Lokale Keywords
Westerwald, Montabaur, Hachenburg, Altenkirchen, Bad Marienberg, Ransbach-Baumbach, Wirges, Pleckhausen, Neuwied, Koblenz, Limburg, Diez

---

## SOCIAL MEDIA (Metricool verbunden)
- Instagram: bv.aussensysteme
- Facebook: verbunden
- TikTok: BV Aussensysteme
- YouTube: UCU2_F-qZlN7KyfHY4G2oSFg
- **Workflow:** Foto/Video → Text → Canva → Metricool planen

### Konkurrenten für Metricool:
- `schweng.eu` (18K Follower) – Marktführer
- `kd_ueberdachung_official` (21K Follower)
- `terrassen_und_carports` (10K Follower)
- `ra_sonnenschutzsysteme` (lokal, 606 Follower)

---

## RECHTLICHER STATUS
- Impressum: § 5 DDG ✅, Gründungshinweis ✅ | **⚠️ USt-ID fehlt noch**
- Datenschutz: Cloudflare, Formspree, sipgate, Google Fonts (consent) ✅
- Cookie-Banner: DSGVO-konform ✅
- Kontaktformular: Datenschutz-Pflichtcheckbox ✅
- Garantieaussagen: 10 J. Alu, 5 J. Markisen/Antriebe korrekt differenziert ✅
- AGB: Straße in Widerrufsbelehrung ✅ | **⚠️ USt-ID fehlt noch**
- VD-Bilder: alle mit `vd_` Prefix → bei Vertragsende löschen ✅
- Google Fonts: erst nach Cookie-Einwilligung ✅

---

## CLOUDFLARE SETUP
- Worker: bvlanding → bv-aussensysteme.de
- www-Redirect: Redirect Rule „Redirect from WWW to root" (301, Active)
- SSL: **Always Use HTTPS ✅ (aktiviert 24.06.2026)**
- Nach Änderungen: Caching → Purge Everything

---

## OFFENE AUFGABEN (priorisiert)

### 🔴 P0 — Sofort (diese Woche)
- [ ] **Google Ads schalten** – 400€ + 400€ Guthaben → Kampagnen aus `google-ads-keywords.md`
- [ ] **Erste Google-Bewertung** generieren (Bewertungslink: https://g.page/r/CQh4XlvW-1nEEBM/review)
- [ ] **aggregateRating aktivieren** – reviewCount + ratingValue nach erster Bewertung eintragen

### 🟠 P1 — Kurzfristig (2–4 Wochen)
- [ ] **WebP-Konvertierung** aller 38 JPGs (~2.8MB Ersparnis, LCP -1-2s)
- [ ] **Cal.com Terminbuchung** einbinden (+20-40% Conversion)
- [ ] **7 Unterseiten** auf 300+ Wörter ausbauen (velaris, faltdach, fassade, sichtschutz, bushaltestelle, fahrradueberdachung, gartenhaus)
- [ ] **Trustindex Widget** einbinden (nach erster Bewertung)
- [ ] **Impressum + AGB**: USt-ID ergänzen (nach Gründung)

### 🟡 P2 — Mittelfristig (1–2 Monate)
- [ ] **Lokale Landingpages** (Montabaur, Neuwied, Koblenz, Altenkirchen)
- [ ] **Blog-Sektion** anlegen (5 Pillar-Artikel)
- [ ] **Formular-Danke-Seite** mit Erwartungsmanagement
- [ ] **GitHub Actions CI/CD** (Lighthouse CI automatisch)
- [ ] **Eigene Produktfotos** (Händlerportal VD nach Vertragsunterzeichnung)

### ✅ Erledigt
- [x] Cloudflare Always Use HTTPS ✅ (24.06.2026)
- [x] Google Business freigeschaltet ✅ (24.06.2026)
- [x] CSP-Header ergänzt ✅ (24.06.2026)
- [x] Leaflet SRI-Hashes ✅ (24.06.2026)
- [x] Scripts defer auf allen 16 Produktseiten ✅ (24.06.2026)
- [x] Hamburger + Mobile-Close aria-label ✅ (24.06.2026)
- [x] Skip-to-Content Link (WCAG 2.4.1) ✅ (24.06.2026)
- [x] prefers-reduced-motion CSS ✅ (24.06.2026)
- [x] Keyword-Kannibalisierung aufgelöst (3 Redirects) ✅ (24.06.2026)
- [x] Sitemap: 26 URLs vollständig ✅ (24.06.2026)
- [x] Schema.org Product auf 6 Hauptproduktseiten ✅ (24.06.2026)
- [x] windzonen.html mit echten DIBt-Daten (390 Kreise) ✅ (24.06.2026)
- [x] vorschau.html noindex ✅ (24.06.2026)
- [x] partner.html H1 ergänzt ✅ (24.06.2026)
- [x] Multi-Agenten-System eingerichtet ✅ (24.06.2026)

---

## ÄNDERUNGSHISTORIE

### 24.06.2026 — Agency System + Multi-Agent Launch
- Multi-Agenten-System vollständig eingerichtet (9 aktive Agenten)
- agency-agents-main als Agenten-Bibliothek integriert
- NEXUS-Strategie (Koordination, Handoff-Templates) aktiv
- Alle Audit-Dokumente erstellt (Security, SEO, Performance, UX)
- Roadmap, Feature-Backlog, Technical Debt dokumentiert
- Schema.org Product auf 6 Hauptproduktseiten
- dibt-lastzonen.js aus globalem Load entfernt (28KB gespart)
- Vollständiger Security/Accessibility/SEO/Performance Audit
- 82/100 Reality Checker Score

### 24.06.2026 — Full Audit & Fixes
- CSP-Header, SRI-Hashes, Defer-Scripts (16 Produktseiten)
- WCAG-Fixes: aria-labels, prefers-reduced-motion, Skip-Link
- Sitemap: 26 URLs, vorschau.html noindex
- Title-Korrekturen (4 Seiten)

### 24.06.2026 — windzonen.html v3 (Echtdaten)
- DIBt-GeoJSON: 390 Kreismittelpunkte, Nearest-Neighbor-Lookup
- Quellen: DIBt + BKG VG250 (dl-de/by-2-0)

### 23.06.2026 — Initiales Launch
- 24 Seiten live, Hero-Slider, Cookie-Banner, Barrierefreiheits-Widget
- SEO-Grundstruktur, Schema.org, llms.txt

---

## WICHTIG FÜR NEUEN CHAT
1. **ZIP hochladen** und entpacken nach `/home/claude/bv-aussensysteme/`
2. **PROJEKTSTAND.md lesen** (diese Datei)
3. **agency-agents-main** berücksichtigen (im ZIP oder separat hochladen)
4. Änderungen nur in `/home/claude/bv-aussensysteme/`
5. Update-ZIP: `cd /home/claude/bv-aussensysteme && zip /mnt/user-data/outputs/BVsite-update-DATUM.zip geänderteDatei.html`
6. **PROJEKTSTAND.md + relevante Audit-Dateien** nach jeder Änderung aktualisieren

---

## PRODUKTTEXTE (eigene Formulierungen)

### Terrassenüberdachung
**TDS:** Das TDS ist unser Bestseller – klare Linien, robuste Aluminiumprofile, Polycarbonat oder Glas. Passt an jede Wand, steht freistehend, lässt sich erweitern.
**SkyView:** Flach, modern, beeindruckend. Innenliegendes Gefälle – von außen unsichtbar. 8mm VSG-Glas Standard. LED und Lautsprecher auf Wunsch.
**Zusatzelemente:** Feststehende Stirn-/Seitenelemente, Glasschiebetür, Velaris als Seitenelement, Festelemente mit Tür (mit/ohne Glas)

### Carport
**TDS:** Wandanbau oder freistehend, Glas/Polycarbonat, alle RAL-Farben. Witterungsbeständig, wartungsfrei.
**Flat Line:** Flach, modern, ideal für PV-Anlage oder Dachbegrünung.
**Flat Box:** Aus Flat Line wird vollwertige Garage – Sandwichplatten, Rolltor, Tür, Fenster.

### Pergola & Lamellendach
**SunPro Plus:** Motorisiert, wetterfest bis Windstärke 8, alle RAL-Farben.
**Warema L50:** Deutsches Qualitätslamellendach, breite Lamellen, präzise Mechanik.
**Lamaxa L50:** Premium-Lamellendach. Stil, Funktion, Langlebigkeit. Ganzjährig nutzbar.
**Velaris:** Einsteuerbare Aluminium-Lamellen – Licht, Sichtschutz & Belüftung gleichzeitig.

### Sonnenschutz
**Aufdach:** Linea (kompakt), Solara (große Flächen), Rolax (Rollo mit Dämmwirkung).
**Unterdach:** Linea, Solara, Plissee, Sonnensegel. Dezent unter dem Glasdach.
**Senkrecht:** Sonne, Wind, Sichtschutz. Solar-Variante mit Akku + LED.

### Geländer
**Alu + VSG-Glas:** 8 oder 10mm, klar oder opal. Klassisch, robust.
**Easy Rail:** Fast kein Rahmen, nur Glas. Maximale Transparenz.

### Eingang & Vordächer
**FLY:** Schlanker Aluminiumträger, 17mm ESG. Ab 100cm Breite, 90cm Tiefe.
**Front Line:** Mit/ohne Seitenteil, PLUS 125cm, LED standard, Bewegungsmelder optional.
**TDS:** Gleiche Profilsprache wie Terrassendach.

### Balkon & Fassade
**Balkon:** Alu, Maßanfertigung, Glas/Polycarbonat, wartungsfrei.
**Deco Wall:** Klicksystem, unsichtbare Befestigung, vertikal/horizontal.
**Sichtschutz:** 14cm Paneele kombinierbar, alle RAL-Farben.

### Garten & Außenbereich
**Gartenhaus TDS:** Alu-Profil, Sicherheitsglas, wartungsfrei, erweiterbar.
**Fahrradüberdachung:** Modular, 2 bis 20+ Räder, Glas/Polycarbonat.
**Bushaltestelle:** Alu + Glas oder Holzoptik, 4 Standardfarben, Maßanfertigung.
**Faltdach OpenAir:** Modular, patentiertes Wasserableitungssystem, für Gastronomie.
