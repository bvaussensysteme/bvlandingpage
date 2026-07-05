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

### 💰 Sparsamer Umgang mit Claude-Nutzungsvolumen (permanent, seit 04.07.2026)
> Der Betreiber nutzt einen begrenzten Claude-Plan – das Guthaben soll möglichst lange reichen. Gilt für **jede Session, dauerhaft**:
- Keine unnötigen Verifizierungs-Schleifen (nicht jeden Schritt einzeln per `grep`/`curl`/Dry-Run gegenchecken, nur bei wirklich riskanten Änderungen)
- Änderungen bündeln statt viele kleine Commits/PRs nacheinander
- Keine Subagenten für Recherchen, die auch direkt schnell selbst erledigt werden können
- Kurze Zwischen-Updates, nur wenn wirklich relevant
- Bei größeren Aufgaben erst kurz planen/fragen statt explorativ viele Tool-Calls zu verbrauchen

### ⚠️ VD-Inhalte entfernen – NIEMALS sofort ausführen (permanent, seit 04.07.2026)
Wenn der Betreiber sinngemäß sagt **„Alle VD-Inhalte entfernen"** (z.B. bei Vertragsende/-änderung mit VD AluSysteme):
1. **Nicht sofort ausführen** – erst zurückfragen, ob wirklich gewünscht (große, teils irreversible Änderung)
2. Nach Bestätigung: `docs/VD-INHALTE-INVENTAR.md` als vollständige Grundlage nutzen (alle betroffenen Bilder, Dateien, Markennennungen, VD-Modellnamen)
3. Darauf hinweisen, dass reines Entfernen Lücken hinterlässt (fehlende Fotos, generische Produktnamen nötig)

---

## UNTERNEHMEN

- **Firma:** BV AussenSysteme
- **Branche:** Terrassenüberdachungen, Carports, Pergolen, Lamellendächer, Sonnenschutz, Geländer, Außensysteme aus Aluminium
- **Region:** Westerwaldkreis, **60 km Radius** um den Mittelpunkt Dernbach ↔ Pleckhausen (nahe Dierdorf/Giershofen, 50.526°N 7.666°E) – so kommuniziert auf der Website. Bei größeren/gewerblichen Aufträgen auch darüber hinaus nach Absprache.
  - Innerhalb 60 km: Montabaur, Neuwied, Altenkirchen, Hachenburg, Koblenz, Bad Ems, Diez, Limburg, Bad Neuenahr-Ahrweiler, Siegburg, Bonn, Siegen, Bad Schwalbach, Cochem
  - Knapp außerhalb (bewusst noch bedient, nur nicht als "60 km" beworben): Simmern, Wetzlar (je ~61 km)
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
**Score: 83/100** | Stand: 05.07.2026 (10-Agenten-Audit Runde 2, gegen echten Code verifiziert)

Hinweis: Der Score ist niedriger als am 04.07. (86/100), obwohl an diesem Tag viele echte Bugs behoben wurden. Grund: tiefere Prüfung hat mehrere ernsthafte, vorher übersehene Probleme aufgedeckt (fehlende Sticky-CTA auf 33 Seiten, kaputtes Logo auf 5 Seiten, fehlende Telefonnummer auf 29 Seiten, eine echte XSS-Lücke, öffentlich einsehbare CLAUDE.md). Alle unten aufgeführten Funde sind bereits behoben, der niedrigere Score spiegelt die höhere Prüftiefe wider, nicht eine Verschlechterung.

| Bereich | Score | Wichtigste Funde (bereits behoben) |
|---|---|---|
| Security | 90/100 | CLAUDE.md war öffentlich abrufbar; DOM-XSS im Kontaktformular; SRI-Hashes für Leaflet ergänzt |
| SEO | 87/100 | Fehlende Verlinkung Ratgeber↔Produkte ergänzt; danke.html aus Sitemap entfernt |
| Content | 87/100 | Unbelegte "ZDH-zertifiziert"-Behauptung entfernt; Fakten-Inkonsistenzen (Radius, Reaktionszeit) vereinheitlicht |
| Code-Qualität | 85/100 | Kaputtes HTML in _template.html (Kopiervorlage!) und einem Ratgeber-Artikel behoben |
| UX/UI | 83/100 | Icon-Überlappung bei geöffnetem Mobilmenü behoben; Enter-Taste im Kontaktformular repariert |
| Branding | 78/100 | Kaputtes Logo (falscher Dateiname) auf 5 Seiten behoben, u.a. danke.html |
| Accessibility | 78/100 | BFSG gilt aktuell nicht für die Firma (kein Online-Shop/Buchungstool); fehlender Fokus-Ring behoben |
| Marketing/Local SEO | 78/100 | Telefonnummer + Social-Links fehlten auf 29 von 44 Seiten komplett |
| CRO | 75/100 | Sticky-Kontakt-Leiste fehlte auf 33 von 34 Seiten (stiller JS-Fehler) |
| Performance | B+ | Falsches Bild im LCP-Preload-Hint; 4,1MB unreferenzierte Bild-Duplikate gelöscht; Cache-Control ergänzt |

> Details je Bereich: siehe `audits/SECURITY_AUDIT.md`, `audits/PERFORMANCE_AUDIT.md` (alle Stand 05.07.2026)

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
- [x] **CSP-Header ergänzen** ✅ 05.07.2026 – vollständig, deckt alle aktiven Drittanbieter ab
- [x] **SRI-Hash für Leaflet-CDN ergänzen** ✅ 05.07.2026 – windzonen.html, einzugsgebiet.html, baugenehmigung.html
- [x] **DOM-XSS im Kontaktformular** ✅ 05.07.2026 – unescaped Vorname-Ausgabe behoben
- [x] **CLAUDE.md war öffentlich abrufbar** ✅ 05.07.2026 – in .assetsignore ergänzt
- [ ] Cloudflare Rate-Limiting für `/api/chat` einrichten (Dashboard → Security → WAF, verhindert Kostenmissbrauch der Workers-AI-Anbindung) — nur der Geschäftsführer kann das im Cloudflare-Dashboard

### 🟠 P1 — Kurzfristig
- [x] WebP-Konvertierung ✅ 26.06.2026 – 38 Bilder, 1,74MB gespart
- [x] Cal.com Terminbuchung wieder entfernt ✅ 04.07.2026 – bewusste Entscheidung: als Nebenerwerb Termine lieber manuell nach Absprache per Telefon/WhatsApp statt über Buchungstool
- [x] 7 Produktseiten 300+ Wörter ✅ 26.06.2026 – alle jetzt 700+ Wörter
- [ ] Trustindex Widget vollständig aktivieren (Tab vorbereitet, CDN-Script noch auskommentiert) — braucht mehr echte Bewertungen zuerst
- [ ] Impressum + AGB: USt-ID nach Gründung ergänzen — nur der Geschäftsführer
- [x] Schema.org `Product` auf `balkonueberdachung.html` + `sonnenschutz-beschattung.html` geprüft ✅ 05.07.2026 – sind noindex-Redirect-Stubs, kein Handlungsbedarf
- [x] Verwaiste Datei `produkte/eingangs├╝berdachung.html` gelöscht ✅ 04.07.2026 – war Ursache für 404 in der Sitemap
- [x] ~4,1MB unreferenzierte Bild-Duplikate im Repo-Root gelöscht ✅ 05.07.2026
- [x] Sticky-Kontakt-Leiste fehlte auf 33 von 34 Seiten ✅ 05.07.2026 – stiller JS-Fehler behoben
- [x] Telefonnummer/Social-Links fehlten im Footer auf 29 von 44 Seiten ✅ 05.07.2026
- [x] Kaputtes Logo (`logo-hell.webp` existiert nicht) auf 5 Seiten ✅ 05.07.2026
- [ ] TikTok-Profil-URL fehlt auf der Website — nur der Geschäftsführer kennt die korrekte URL, dann site-weit ergänzbar
- [ ] FAQPage-Schema bildet nur 13 von 19 sichtbaren FAQ ab (Rich-Snippet-Potenzial ungenutzt)
- [ ] Gold-Text (#C49A2A) auf Weiß hat nur 2,6:1 Kontrast (AA verlangt 4,5:1) bei Hover-Zuständen — Marken-Entscheidung ob auf --gold-dark umgestellt wird
- [ ] `js/newsletter.js` unfertiges Feature (Platzhalter-API-Key) — Entscheidung: fertigstellen oder verwerfen

### 🟡 P2 — Mittelfristig
- [x] Lokale Landingpages ✅ 26.06.2026 – montabaur/neuwied/koblenz/altenkirchen
- [x] Blog-Sektion ✅ 26.06.2026 – ratgeber/ mit 5 Pillar-Artikeln
- [x] Danke-Seite ✅ 26.06.2026 – danke.html mit Redirect nach Formular
- [ ] Eigene Produktfotos nach VD-Vertragsunterzeichnung
- [ ] Preisindikation auf Produktseiten ("ab X €") ergänzen
- [ ] Mobilmenü: Active/Tap-State CSS ergänzen
- [ ] Neuer Ratgeber-Artikel "Förderung & Zuschüsse" (Gliederung steht, braucht Bestätigung zu Förder-Fakten)
- [ ] Skip-to-Content-Link ergänzen (WCAG 2.4.1, müsste auf allen Seiten einzeln rein)
- [ ] Mehr hyperlokale Ortsseiten (Konkurrent hat deutlich granularere Ortsseiten als unsere 4)
- [ ] Doppelte `.mobile-lang-switcher`-CSS-Regel in style.css bereinigen (unklar welcher Wert der gewollte ist)

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

### 05.07.2026 — 10-Agenten-Audit Runde 2 (Zusammenfassung)
Zweite komplette Multi-Agenten-Prüfung (SEO, Performance, UX/UI, CRO, Content, Branding, Security, Accessibility, Marketing, Code-Qualität), jeder Agent in eigenem isoliertem Worktree, alle Ergebnisse anschließend manuell zusammengeführt (1 Merge-Konflikt, alle anderen automatisch). Wichtigste Funde (Details siehe Tabelle oben und einzelne History-Einträge):
- Sticky-Kontakt-Leiste fehlte auf 33 von 34 Seiten (stiller JS-Fehler)
- Telefonnummer/Social-Links fehlten im Footer auf 29 von 44 Seiten
- Kaputtes Logo (falscher Dateiname `logo-hell.webp`) auf 5 Seiten inkl. danke.html
- CLAUDE.md war öffentlich unter /CLAUDE.md abrufbar
- Eine echte DOM-XSS-Lücke im Kontaktformular
- Falsches Bild im LCP-Preload-Hint auf der Startseite
- BFSG-Rechercheergebnis: gilt aktuell nicht für diese Firma (kein Online-Shop/Buchungstool, Kleinstunternehmen-Ausnahme)
- Alle Funde bereits behoben und auf `main` gemerged, außer den unter P0-P2 als offen markierten Punkten.

### 05.07.2026 — Content-Audit: Fakt-Konsistenz & FAQ-Redundanz
- **Fund:** 6 Produktseiten (`carport.html`, `gelaender.html`, `kaltwintergarten.html`, `pergola.html`, `sonnenschutz.html`, `terrassenueberdachung.html`) hatten im Schema.org-Code noch `"geoRadius": "50000"` (50 km) – Rest der Seite wurde am 04.07. auf 60 km umgestellt, diese 6 Dateien wurden dabei übersehen. Jetzt auf `"60000"` korrigiert.
- **Fund:** `terrassenueberdachung-montabaur.html` + `terrassenueberdachung-neuwied.html` behaupteten „ZDH-Zertifikat"/„ZDH-zertifiziert" für die VD-AluSysteme-Produkte – dieser Fakt taucht nirgends sonst auf der Website auf (nicht in Koblenz/Altenkirchen-Pendants, nicht in PROJEKTSTAND, nicht im Impressum/AGB-Kontext) und ist nicht verifizierbar (ZDH = Zentralverband des Deutschen Handwerks, keine bekannte Produktzertifizierungsstelle für Aluminium-Außensysteme). Da unbelegte Zertifizierungsaussagen ein Wettbewerbsrecht-Risiko sind, entfernt. Falls es einen echten Nachweis gibt, gerne wieder ergänzen.
- **Fund:** `terrassenueberdachung-altenkirchen.html` versprach Angebot „innerhalb von 48 Stunden nach dem Aufmaß-Termin" – alle anderen Seiten (Startseite FAQ + Schema.org, 2×) nennen „2–3 Werktage". Auf den durchgängig verwendeten Wert vereinheitlicht.
- **Fund:** Startseiten-FAQ (`index.html`) enthielt 2 Paar nahezu identischer Fragen: „Kommen Sie auch außerhalb des Westerwaldkreises?" / „Arbeitet ihr auch außerhalb des Westerwalds?" sowie „Was kostet eine Terrassenüberdachung oder ein Carport ungefähr?" / „Was kostet eine Terrassenüberdachung im Westerwald?" (insgesamt 21 statt effektiv 19 unterschiedliche Themen). Jeweils zusammengeführt (die vollständigere Städteliste bzw. die Polycarbonat/Glas-Preisnuance in die verbleibende Frage übernommen), Duplikate entfernt. Sichtbare FAQ hat jetzt 19 statt 21 Einträge – FAQPage-Schema war davon nicht betroffen (hatte ohnehin nur 13 der 21 Fragen abgebildet, siehe offener SEO-Punkt unten).
- **Neuer P1-Punkt (SEO/Content-Schnittstelle):** FAQPage-Schema.org auf der Startseite bildet nur 13 der jetzt 19 sichtbaren FAQ ab – 6 Fragen (u.a. Freistehend-Montage, Pflege, Erweiterbarkeit, Gewerbe/Gastronomie) fehlen im strukturierten Daten. Für Rich-Snippet-Potenzial nachziehen.
- Recherchiert (WebSearch, nicht umgesetzt – braucht Betreiber-Entscheidung): Content-Lücken zu Förderung/Zuschüsse und Wertsteigerung Immobilie identifiziert, siehe Audit-Bericht.

### 04.07.2026 (6) — Einzugsgebiet neu definiert: 60 km statt 50 km
- Mittelpunkt neu berechnet: zwischen Dernbach (Westerwald) und Pleckhausen statt nur Dernbach – liegt nahe Dierdorf/Giershofen
- Kommunizierter Radius von 50 km auf 60 km erhöht (echte Koordinaten-Berechnung, siehe UNTERNEHMEN-Sektion für die volle Liste)
- "50 km" → "60 km" aktualisiert in: `einzugsgebiet.html` (og:description + sichtbarer Text), 4 lokale Landingpages (Montabaur/Neuwied/Koblenz/Altenkirchen, FAQ-Antwort)
- Bewusst nicht angepasst: `windzonen.html` (unabhängiger Geo-Sanity-Check, kein Einzugsgebiet-Bezug)

### 04.07.2026 (5) — Automatisches Deployment repariert (Cloudflare Workers Build)
- Ursache für "nichts ändert sich live" gefunden: Der Cloudflare-Workers-Git-Integration (`bvlanding`) fehlte eine `wrangler.jsonc` → jeder Build brach sofort mit "Missing entry-point to Worker script or to assets directory" ab, unabhängig von unseren Code-Änderungen
- `wrangler.jsonc` angelegt: `assets.directory` = Repo-Root
- `.assetsignore` angelegt, damit interne Dateien NICHT öffentlich ausgeliefert werden: `PROJEKTSTAND.md`, `google-ads-keywords.md`, `README.md`, `audits/`, `roadmap/`, `agents/`, `docs/`, `improvements/`, `.git/`
- Lokal mit `npx wrangler deploy --dry-run` verifiziert: Konfiguration wird akzeptiert, alle internen Dateien werden korrekt ausgeschlossen
- Zweite Datei mit kaputt kodiertem Dateinamen im Repo-Root gefunden und gelöscht (enthielt fälschlich eine veraltete Kopie von `js/slider.js` statt HTML)
- `.gitignore` ergänzt (`.wrangler/`, `node_modules/`)

### 04.07.2026 (4) — Cal.com-Terminbuchung entfernt
- Bewusste Entscheidung: als Nebenerwerb ist ein Online-Buchungstool zu viel Aufwand – Termine werden künftig manuell nach Absprache per Telefon oder WhatsApp vereinbart
- `termin.html` gelöscht (war noch nicht von Google indexiert, kein SEO-Verlust)
- Link „📅 Termin online buchen" aus dem Kontaktbereich von `index.html` entfernt, durch Hinweistext ersetzt
- Sitemap-Eintrag entfernt

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
- Cal.com-Buchung (damals bestätigt), Danke-Seite, Konfigurator-Feedback als erledigt bestätigt
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
