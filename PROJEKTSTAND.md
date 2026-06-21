# BV AussenSysteme – Projektstand für neuen Chat

## SOFORT SAGEN: 
"Hier ist der vollständige Projektstand von BV AussenSysteme. Bitte lies alles durch bevor du antwortest."

---

## KUNDE
- **Name:** Alexander Becker
- **Firma:** BV AussenSysteme (Gründung in Vorbereitung)
- **Tel:** 015678696609
- **E-Mail:** info@bv-aussensysteme.de
- **Standort:** Dernbach, Westerwaldkreis, Rheinland-Pfalz
- **Branche:** Terrassenüberdachungen, Carports, Pergolen, Kaltwintergärten, Sonnenschutz, Geländer
- **Hersteller-Partner:** VD AluSysteme (vd-alusysteme.de)

---

## LIVE WEBSITE
- **URL:** https://bv-aussensysteme.de
- **Hosting:** GitHub Pages (Repository: bvaussensysteme/bvlandingpage, Public)
- **DNS:** Cloudflare (Cache bei Änderungen leeren: dash.cloudflare.com → Purge Everything)
- **Formular:** Formspree ID `xnjkabdv` → geht an info@bv-aussensysteme.de
- **Google Bewertungslink:** https://g.page/r/CQh4XlvW-1nEEBM/review

---

## TECHNISCHER AUFBAU
```
bv-aussensysteme/
├── index.html              ← Hauptseite
├── agb.html                ← AGB (basierend auf VD, umgeschrieben)
├── konfigurator.html       ← Konfigurator-Platzhalter
├── pflege.html             ← Pflegehinweise
├── einzugsgebiet.html      ← Karte (Leaflet.js + 50km Radius)
├── impressum.html          ← "Gründung in Vorbereitung"
├── datenschutz.html        ← DSGVO
├── sitemap.xml
├── robots.txt
├── css/style.css           ← Alle Styles
├── js/
│   ├── main.js             ← FAQ-Accordion, Hamburger-Menü, Formspree
│   ├── i18n.js             ← Übersetzung DE/EN/RU (TreeWalker-Methode)
│   └── cookie.js           ← DSGVO Cookie-Banner
├── images/                 ← 40+ Bilder inkl. Produktfotos
└── produkte/               ← 7 Produktseiten
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
- **Farben:** Gold `#C49A2A`, Schwarz `#111111`, Weiß `#FFFFFF`
- **Fonts:** Barlow Condensed (Überschriften) + Inter (Text) via Google Fonts
- **Logo:** logo-hell.png (für helle Navbar), logo-dunkel.png (für Footer)

---

## SPRACHAUSWAHL (DE/EN/RU)
- **Methode:** TreeWalker – geht durch alle Textknoten, kein innerHTML-Reset
- **Wichtig:** Event-Listener (FAQ, Cookie, Hamburger) bleiben beim Sprachwechsel erhalten
- **Dropdown:** Button `id="langBtn"`, Label `id="langLabel"`, Menü `id="langMenu"`, Container `id="langDropdown"`
- **Flaggen:** `data-notranslate="1"` auf allen Dropdown-Elementen (verhindert Übersetzung der Flaggen)
- **Mobile:** `class="mobile-lang-switcher"` im Hamburger-Menü
- **Speicherung:** localStorage `bv_lang`
- **Position:** Steht nach dem "Jetzt anfragen" Button in der Navbar, vor dem Hamburger

---

## BEKANNTE BUGS / NOCH OFFEN
- [ ] Sprachauswahl zeigt evtl. noch "DE DE" statt "🇩🇪 DE" → fix war letzter Stand
- [ ] Produktbilder neu zugeschnitten aus Screenshots IMG_8508–IMG_8515 (bessere Qualität)
- [ ] Dropdown-Klick manchmal nicht zuverlässig → wurde per addEventListener gefixt

---

## OFFENE AUFGABEN (NACH GRÜNDUNG)
- [ ] Impressum: Straße, UStID, Handelsregisternummer nachtragen  
- [ ] AGB: Straße im Widerrufsrecht ergänzen
- [ ] Rahmenliefervertrag VD unterschreiben → Händlerportal-Bilder dürfen dann verwendet werden
- [ ] Trustindex Widget einbauen nach erster Google-Bewertung
- [ ] Google Search Console: sitemap.xml einreichen
- [ ] „Vorübergehend geschlossen" → Geöffnet stellen bei Google Business
- [ ] "Vorübergehend geschlossen" entfernen sobald gegründet

---

## GOOGLE BUSINESS
- **Profil:** BV AussenSysteme, Dernbach
- **Kategorien:** Anbieter v. Terrassenüberdachungen (PRIMÄR), + 6 weitere
- **Einzugsgebiet:** Westerwaldkreis, Montabaur, Neuwied, Altenkirchen, Hachenburg, Bad Marienberg, Westerburg, Ransbach-Baumbach, Pleckhausen, Horhausen, Limburg an der Lahn, Koblenz
- **Bewertungslink:** https://g.page/r/CQh4XlvW-1nEEBM/review

---

## PRODUKTBILDER (in images/)
Aus VD-Katalog-PDF + Screenshots von vd-alusysteme.de extrahiert:
- prod_terrasse_tds.jpg, prod_terrasse_skyview.jpg
- prod_carport_tds.jpg, prod_carport_flatline.jpg, prod_carport_flatbox.jpg
- prod_pergola_velaris.jpg, prod_pergola_sunpro.jpg, prod_pergola_warema.jpg
- prod_kaltwintergarten_tds.jpg
- prod_sonnenschutz.jpg
- prod_gelaender_glas.jpg, prod_gelaender_easyrail.jpg
- prod_eingang_fly.jpg, prod_eingang_frontline.jpg, prod_eingang_frontline2.jpg
- prod_balkon_tds.jpg, prod_gartenhaus.jpg, prod_fahrrad.jpg
- prod_sichtschutz.jpg, prod_fassade.jpg, prod_faltdach.jpg
- Galerie-Fotos: galerie-1/2/3.jpg (echte Fotos der Terrasse der Eltern)

---

## LETZTER ZIP-STAND
Die fertige ZIP liegt immer als Output bereit.
Im neuen Chat: "Kannst du mir die aktuelle ZIP geben?" – dann muss Claude die Dateien 
aus dem internen Arbeitsverzeichnis `/home/claude/bv-aussensysteme/` neu packen.

**WICHTIG FÜR NEUEN CHAT:**
Der neue Chat hat KEINEN Zugriff auf die alten Dateien. 
Alexander muss die ZIP aus diesem Chat herunterladen und ggf. hochladen,
oder die Änderungen direkt auf GitHub machen.

---

## WAS GUT FUNKTIONIERT
- ✅ Website live auf bv-aussensysteme.de
- ✅ GitHub Pages aktiv (Repository public)
- ✅ Formspree-Formular funktioniert
- ✅ Cookie-Banner DSGVO-konform
- ✅ SEO: Schema.org (LocalBusiness, FAQ, HowTo), Sitemap, robots.txt
- ✅ Mobile-responsive
- ✅ 3 Sprachen DE/EN/RU
- ✅ FAQ mit 16 Fragen (DE/EN/RU übersetzt)
- ✅ AGB-Seite vorhanden
- ✅ Einzugsgebiet-Karte (Leaflet.js)
- ✅ 7 Produktseiten mit echten Produktfotos
