# 📈 IMPROVEMENT LOG — BV AussenSysteme
**Automatisch geführt durch Multi-Agenten-System**

---

## 2026-06-24 — Agency System Launch

### Agenten aktiviert
- CEO, CTO, Frontend Developer, SEO Specialist, Growth Hacker
- UX Architect, Security Architect, Product Manager, Reality Checker

### Implementierte Verbesserungen

#### Engineering (Frontend Developer)
- [x] Schema.org Product auf 6 Hauptproduktseiten ergänzt
- [x] dibt-lastzonen.js (28KB) aus globaler Ladesreihenfolge entfernt
- [x] _template.html bereinigt

#### Marketing (SEO Specialist) — Vorherige Session
- [x] Keyword-Kannibalisierung aufgelöst (3 Redirect-Seiten)
- [x] 4 Titles auf ≤65 Zeichen korrigiert
- [x] 26-URL Sitemap komplett

#### Security (Security Architect) — Vorherige Session
- [x] Content-Security-Policy Header hinzugefügt
- [x] SRI-Hashes für Leaflet CDN
- [x] prefers-reduced-motion CSS (WCAG)

#### Deployment — Alexander manuell
- [x] Cloudflare Always Use HTTPS
- [x] Google Business freigeschaltet

### Aktueller Score
- Reality Checker: 82/100 — CONDITIONAL READY
- Verbleibende P0-Items: Google Ads + Bewertung + WebP

---

## 2026-07-05 — CRO-Audit: Sticky-CTA-Lücke geschlossen, Preistransparenz auf Hauptprodukten

### Gefunden
- Sticky-CTA-Leiste (WhatsApp + „Kostenlos anfragen") existierte technisch nur auf `index.html` — auf allen 33 anderen Seiten (16 Produktseiten, 4 lokale Landingpages, 6 Ratgeber-Artikel, Tools wie windzonen/baugenehmigung) fehlte sie komplett, obwohl `main.js` sie überall erwartet hat
- Dadurch warf `main.js` auf allen 33 Seiten einen unbehandelten JS-Fehler (`stickyClose` war `null`), der die restliche Ausführung des DOMContentLoaded-Handlers auf diesen Seiten abbrach
- Kein WhatsApp-Link in der Topbar von `index.html` (nur Telefon/E-Mail) — bei geschlossenem Sticky-Banner keine schnelle WhatsApp-Option mehr sichtbar
- Vor dem Formular-Absenden gab es keine Reaktionszeit-Erwartung (nur auf `danke.html` danach) — erhöht Absprungrisiko direkt vor der Anfrage
- Produktseiten Terrassenüberdachung/Carport/Pergola verlinkten nicht auf die bereits vorhandenen, faktenbasierten Preisbeispiel-Ratgeberartikel (`ratgeber/terrassenueberdachung-kosten.html`, `ratgeber/carport-oder-garage.html`, `ratgeber/pergola-kaufen-ratgeber.html`) — "Preis auf Anfrage" blieb dadurch ohne jede Orientierung, obwohl echte Preisspannen längst auf der Seite existieren

### Umgesetzt
- [x] Sticky-CTA-Komponente (unverändertes, bereits gestyltes Markup) auf allen 33 betroffenen Seiten ergänzt inkl. `_template.html` für künftige Seiten
- [x] `js/main.js`: Null-Check für `stickyClose` ergänzt, damit der Fehler nicht mehr auftritt (unabhängig von künftigen Seiten ohne die Komponente)
- [x] `index.html` Topbar: WhatsApp-Link zwischen Telefon und E-Mail ergänzt
- [x] `index.html` Kontaktformular: „⏱ Antwort in der Regel innerhalb von 24 Stunden" direkt über dem Absenden-Button ergänzt (deckt sich mit dem bestehenden Versprechen auf `danke.html`)
- [x] `produkte/terrassenueberdachung.html`, `produkte/carport.html`, `produkte/pergola.html`: dritter Button „Was kostet das? Preisbeispiele →" zu den jeweiligen Ratgeber-Preisartikeln ergänzt (keine neuen/erfundenen Zahlen, nur Verlinkung auf bereits publizierte echte Preisspannen)

### Offen (braucht Betreiber-OK, größerer Umfang)
- [ ] „ab X €"-Preisindikation direkt auf allen Produktseiten (bereits als P1 in PROJEKTSTAND/UX_AUDIT dokumentiert)
- [ ] Gleiche Preisbeispiel-Verlinkung auch für restliche Produktseiten ohne passenden Ratgeber-Artikel (müsste zuerst Content erstellt werden)
- [ ] `geoRadius: 50000` in Schema.org auf 6 Produktseiten weiterhin auf altem 50-km-Wert (nicht CRO-Scope, an SEO/Content-Agent weiterzugeben)

---

## Nächste geplante Improvements

### Sprint 1 (sofort)
- [ ] WebP-Konvertierung aller 38 JPGs
- [ ] aggregateRating aktivieren (nach erster Bewertung)
- [ ] Cal.com Widget Integration

### Sprint 2 (diese Woche)
- [ ] Content-Ausbau 7 Unterseiten
- [ ] Lokale Landingpages (Montabaur, Neuwied)
- [ ] Blog-Sektion anlegen

---
*Multi-Agenten-System | CEO → CTO → Engineering → Testing*
