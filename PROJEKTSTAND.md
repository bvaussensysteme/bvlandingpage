# BV AussenSysteme – Projektstand

> **Für neuen Chat:** ZIP hochladen, diese Datei lesen lassen, sofort weitermachen.
> Letzte Aktualisierung: 23.06.2026

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
├── einzugsgebiet.html            ← Leaflet.js Karte mit BV-Marker
├── partner.html                  ← VD AluSysteme
├── kontakt.html                  ← Redirect → /#kontakt
├── sitemap.xml                   ← 24 Seiten
├── robots.txt                    ← KI-Crawler erlaubt
├── llms.txt                      ← KI-Optimierung (ChatGPT, Perplexity etc.)
├── llms-full.txt                 ← Alle Produkttexte für KI
├── _headers                      ← Cloudflare Security Headers
├── PROJEKTSTAND.md
├── README.md
├── css/style.css
├── js/
│   ├── main.js                   ← FAQ, Hamburger, Sticky CTA, Formspree
│   ├── cookie.js                 ← DSGVO Cookie-Banner (localStorage)
│   ├── accessibility.js          ← Barrierefreiheits-Widget (8 Funktionen)
│   └── slider.js                 ← Hero-Slider (4 Slides, 6.5s)
├── images/
│   ├── logo-hell.png / logo-dunkel.png / favicon.ico etc.
│   ├── marker-logo.png           ← BV-Logo für Kartenmarker
│   ├── vd_prod_*.jpg             ← 21 VD-Bilder (Prefix vd_ = bei Vertragsende löschen!)
│   └── vd_partner-vd-alusysteme.png
└── produkte/
    ├── terrassenueberdachung.html ← inkl. Stirnseiten, Schiebeelemente, Velaris, Festelemente
    ├── carport.html
    ├── pergola.html               ← SunPro, Warema L50, Lamaxa L50
    ├── kaltwintergarten.html
    ├── sonnenschutz.html          ← inkl. Velaris als 4. Karte
    ├── gelaender.html
    ├── eingangsüberdachung.html   ← alte Seite, Link zeigt jetzt auf eingang.html
    ├── eingang.html               ← NEU: Vordach FLY, Front Line, TDS
    ├── balkon-fassade.html        ← NEU: Balkon, Deco Wall, Sichtschutz
    ├── garten-aussenbereich.html  ← NEU: Gartenhaus, Fahrrad, Bushaltestelle, Faltdach
    ├── velaris.html
    ├── faltdach.html
    ├── balkonueberdachung.html
    ├── fassade.html
    ├── sichtschutz.html
    ├── fahrradueberdachung.html
    ├── gartenhaus.html
    ├── bushaltestelle.html
    └── sonnenschutz-beschattung.html
```

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

### Einzugsgebiet-Karte (einzugsgebiet.html)
- Leaflet.js + OpenStreetMap
- BV-Marker: schwarzer Kreis goldener Rand „BV" Text (CSS, kein Bild)
- Absoluter Bildpfad für Marker

### Leistungen Startseite
- 9 Kacheln: Terrassendach, Carport, Pergola, Kaltwintergarten, Sonnenschutz & Markisen, Geländer, Eingang & Vordächer, Balkon & Fassade, Garten & Außenbereich
- Alle verlinken auf eigene Produktseiten

---

## SEO & KI-OPTIMIERUNG

### Google
- Search Console: verifiziert, Sitemap eingereicht (24 Seiten)
- Schema.org: LocalBusiness (erweitert), FAQPage (21 Fragen), HowTo, Service
- Alle Produkte im OfferCatalog mit Beschreibungen
- Beide Standorte (Dernbach + Pleckhausen) im Schema
- hreflang: www + non-www auf allen Seiten
- Canonical auf allen Seiten
- Meta-Descriptions: alle unter 155 Zeichen

### KI-Optimierung (GEO/AEO)
- `llms.txt` – Standard für ChatGPT, Perplexity, Claude
- `llms-full.txt` – alle Produkttexte
- `robots.txt` – GPTBot, Claude-Web, PerplexityBot, Google-Extended explizit erlaubt
- `knowsAbout` im Schema mit allen 16 Fachgebieten

### Lokale Keywords eingebaut
Westerwald, Montabaur, Hachenburg, Altenkirchen, Bad Marienberg, Ransbach-Baumbach, Wirges, Pleckhausen, Neuwied, Koblenz, Limburg, Diez

---

## SOCIAL MEDIA (Metricool verbunden)
- Instagram: bv.aussensysteme
- Facebook: verbunden
- TikTok: BV Aussensysteme
- YouTube: UCU2_F-qZlN7KyfHY4G2oSFg
- **Workflow:** Foto/Video hier hochladen → Text schreiben → Canva bearbeiten → Metricool planen
- **Content-Tipp:** Vorher/Nachher, Montage-Zeitraffer, Kundenreaktionen, Wettervideos

### Konkurrenten für Metricool eintragen:
- `schweng.eu` (18K Follower) – Marktführer
- `kd_ueberdachung_official` (21K Follower)
- `terrassen_und_carports` (10K Follower) – am ähnlichsten
- `ra_sonnenschutzsysteme` (lokal, 606 Follower)

---

## RECHTLICHER STATUS
- Impressum: § 5 DDG ✅, Gründungshinweis ✅
- Datenschutz: Cloudflare, Formspree, sipgate, Google Fonts (consent) ✅
- Cookie-Banner: DSGVO-konform ✅
- Kontaktformular: Datenschutz-Pflichtcheckbox ✅
- Garantieaussagen: 10 J. Alu, 5 J. Markisen/Antriebe korrekt differenziert ✅
- AGB: Straße in Widerrufsbelehrung ✅
- VD-Bilder: alle mit `vd_` Prefix → bei Vertragsende löschen ✅
- Google Fonts: erst nach Cookie-Einwilligung ✅

---

## ZULETZT GEÄNDERT (24.06.2026 – v2)
- `windzonen.html` NEU: Wind- & Schneelastzonen-Tool (Nominatim Geocoding, Leaflet.js, Turf.js)
- `data/windzonen.geojson` NEU: GeoJSON-Platzhalter Windzonen (WZ 1–4)
- `data/schneelastzonen.geojson` NEU: GeoJSON-Platzhalter Schneelastzonen (SLZ 1–3)
- `index.html` GEÄNDERT: Footer → Link „Wind- & Schneelastzonen" ergänzt
- `sitemap.xml` GEÄNDERT: windzonen.html eingetragen (25 Seiten)

---

## OFFENE AUFGABEN

### Nach Gründung (Pflicht)
- [ ] Impressum: USt-ID + ggf. HRB ergänzen
- [ ] AGB: USt-ID ergänzen
- [ ] Google Business: Meet-Verifizierung abschließen
- [ ] Google Business: „Geöffnet" stellen
- [ ] Cloudflare: „Always Use HTTPS" einschalten (SSL/TLS → Edge Certificates)
- [ ] Google Ads: 400€ + 400€ Guthaben nutzen (ich bereite Anzeigentexte + Keywords vor)

### Geplant
- [ ] Terminbuchung: Google Calendar einrichten → Cal.com einbinden
- [ ] Trustindex Widget (nach erster Bewertung)
- [ ] aggregateRating im Schema (nach erster echter Bewertung)
- [ ] Eigene Produktfotos (Händlerportal VD nach Vertragsunterzeichnung)
- [ ] HeyGen: KI-Avatar-Video testen (heygen.com, kostenlos)
- [ ] Cloudflare Pages statt Worker (auto-deploy bei GitHub-Push)

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

---

## CLOUDFLARE SETUP
- Worker: bvlanding → bv-aussensysteme.de
- www-Redirect: Redirect Rule „Redirect from WWW to root" (301, Active)
- SSL: „Always Use HTTPS" → MUSS noch aktiviert werden!
- Nach Änderungen: Caching → Purge Everything

## WICHTIG FÜR NEUEN CHAT
1. ZIP hochladen und entpacken nach `/home/claude/bv-aussensysteme/`
2. PROJEKTSTAND.md lesen
3. Änderungen nur in `/home/claude/bv-aussensysteme/`
4. Update-ZIP: `cd /home/claude/bv-aussensysteme && zip /mnt/user-data/outputs/BVsite-update-DATUM.zip geänderteDatei.html`
5. Backup-ZIP: `cd /home/claude && zip -r /mnt/user-data/outputs/backup.zip bv-aussensysteme/`
6. PROJEKTSTAND.md + README.md nach jeder Änderung aktualisieren

## UPDATE 24.06.2026 – v2: DIBT-Echtdaten integriert
- `js/dibt-lastzonen.js` NEU: Vollständige DIBt-Lookup-Tabelle
  - 406 Landkreise/kreisfreie Städte – Windzonen (Stand 02.06.2022, DIN EN 1991-1-4/NA)
  - 407 Landkreise/kreisfreie Städte – Schneelastzonen (Stand 07.02.2023, DIN EN 1991-1-3/NA)
  - Quelle: DIBt (Deutsches Institut für Bautechnik), www.dibt.de
  - Lizenz: Öffentliche Technische Baubestimmungen, freie Nutzung zu Informationszwecken
- `windzonen.html` AKTUALISIERT: GeoJSON/Turf.js → DIBt-Landkreis-Lookup
  - Nominatim liefert `county` → normalisierter Name → direkter JS-Lookup
  - Sonderfußnoten: Norddeutsches Tiefland (2,3-fach), Harzinsel (5,5 kN/m²)
  - Kein Fallback auf Demo-Daten – immer echte DIBt-Quelle
- Alte Placeholder-GeoJSON-Dateien (`data/`) vollständig entfernt
