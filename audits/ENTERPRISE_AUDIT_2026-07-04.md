# 🏢 ENTERPRISE-AUDIT — BV AussenSysteme Website
**Stand:** 04.07.2026 · **Umfang:** 49 öffentliche HTML-Seiten · **Methode:** siehe Hinweis unten

> ⚠️ **Transparenz-Hinweis zur Methodik:** Dieser Bericht wurde ursprünglich als 10-Agent-Parallel-Audit mit Einzelbewertung jeder der 49 Seiten in 8 Dimensionen angelegt. Alle 10 Hintergrund-Agents sind an einem harten API-Session-Limit gescheitert (0 Teilberichte gerettet). Auf Wunsch des Betreibers wurde direkt weitergearbeitet — ohne weitere Subagenten, mit Fokus auf **verifizierte, belegbare Fakten** statt Spekulation. Es werden **repräsentative Einzelbewertungen pro Seitentyp** statt aller 49 Einzelseiten geliefert (die meisten Seiten teilen Template/Nav/Footer/CSS — eine 1:1-Wiederholung wäre redundant gewesen). Wo Aussagen auf Schätzung statt Messung beruhen (z.B. Lighthouse-Werte ohne echten Lauf), ist das explizit gekennzeichnet.

---

## Inhaltsverzeichnis
1. [Executive Summary](#executive-summary)
2. [Phase 1 — Crawl-Ergebnis](#phase-1)
3. [Gesamtbewertung](#gesamtbewertung)
4. [Größte Stärken](#staerken)
5. [Größte Schwächen](#schwaechen)
6. [Kritische Probleme](#kritisch)
7. [Quick Wins](#quick-wins)
8. [Fachbereichs-Bewertungen im Detail](#fachbereiche)
9. [Seitentyp-Bewertungsmatrix](#matrix)
10. [Roadmaps (30/60/90 Tage, 6/12 Monate)](#roadmaps)
11. [Wettbewerbsfähigkeit](#wettbewerb)
12. [Nicht geprüft / Einschränkungen](#einschraenkungen)

---

## <a name="executive-summary"></a>Executive Summary

BV AussenSysteme betreibt eine **technisch solide, überdurchschnittlich gepflegte Website für ein Nebenerwerbs-Kleinunternehmen** in Gründung (2026). Im heutigen Session-Verlauf wurden bereits mehrere ernsthafte Probleme behoben (fehlendes `wrangler.jsonc` verhinderte jedes Deployment, kaputte Navigation auf allen Ratgeber-Seiten, falsche Bildzuordnungen, fehlende Rechner-Keywords). Die Seite steht damit deutlich besser da als noch vor einer Woche.

**Die größte verbleibende strukturelle Schwäche ist technische Schulden-Duplizierung**: 6 Produktseiten existieren doppelt (einmal im Root, einmal unter `produkte/`), wobei **alle 6 Root-Duplikate defekt sind** — 3 haben falsche `<title>`-Tags (z.B. `carport.html` trägt den Titel „Terrassenüberdachung"), 3 haben **gar keinen** `<title>`-Tag. Alle 6 stehen in der Sitemap, sind aber von nirgends verlinkt.

Die zweite ernste Lücke ist **Sicherheits-Header** (CSP fehlt weiterhin trotz gegenteiliger alter Dokumentation) und ein **quantifizierter WCAG-Kontrastfehler**: Die Gold-Markenfarbe (#C49A2A) hat auf dem Off-White-Hintergrund nur 2,35:1 Kontrast — WCAG AA verlangt 4,5:1 für Fließtext.

Positiv: SEO-Grundlagen (Sitemap, Canonicals auf den echten Seiten, Schema.org, lokale Landingpages), Content-Tiefe (alle vormals dünnen Seiten wurden bereits ausgebaut) und die kürzlich neu gestalteten Ratgeber-Artikel sind auf gutem Niveau.

---

## <a name="phase-1"></a>Phase 1 — Crawl-Ergebnis

**49 HTML-Seiten** identifiziert und mit technischen Metadaten erfasst (Title, Meta-Description, H1-H6, Canonical, Robots, Schema.org-Typen, interne Links, Bilder, Wortanzahl). Volles Manifest als JSON verfügbar unter `/tmp/.../scratchpad/audit/manifest.json` (nicht Teil des Repos, session-lokal).

### Seitenkategorien
| Kategorie | Anzahl | Beispiele |
|---|---|---|
| Kernseiten | 3 | index.html, kontakt.html, danke.html |
| Produktseiten (aktuell, `produkte/`) | 16 | terrassenueberdachung.html, carport.html, velaris.html, … |
| **Produktseiten-Duplikate (Root, defekt)** | 6 | carport.html, gelaender.html, kaltwintergarten.html, pergola.html, sonnenschutz.html, terrassenueberdachung.html |
| Orphan-Legacy-Seiten (weder Sitemap noch verlinkt) | 2 | produkte/balkonueberdachung.html, produkte/sonnenschutz-beschattung.html |
| Lokale Landingpages | 4 | terrassenueberdachung-{montabaur,neuwied,koblenz,altenkirchen}.html |
| Ratgeber (Blog) | 6 | ratgeber/index.html + 5 Artikel |
| Tools | 4 | windzonen.html, baugenehmigung.html, einzugsgebiet.html, konfigurator.html |
| Rechtstexte | 3 | impressum.html, datenschutz.html, agb.html |
| Sonstiges | 5 | partner.html, pflege.html, vorschau.html, `_template.html`, `produkte/_template.html` |

### Statuscodes / Erreichbarkeit
Live-HTTP-Check wurde für Kernseiten in dieser Session bereits durchgeführt (siehe Domain-Fix, Umleitungsfehler-Fix). Für alle 49 lokalen Dateien gilt: kein Statuscode-Konzept anwendbar (statische Dateien im Repo), da nur eine Stichprobe (Homepage, `www`-Variante) live gegen Cloudflare getestet wurde. **Kein 404 unter den intern verlinkten Seiten gefunden.**

### Sitemap.xml / robots.txt
- `sitemap.xml`: enthält alle 16 aktuellen Produktseiten + Kernseiten + lokale Landingpages + Ratgeber, **aber auch alle 6 defekten Root-Duplikate** (siehe kritische Probleme)
- `robots.txt`: erlaubt explizit KI-Crawler (GPTBot, Claude-Web, PerplexityBot, cohere-ai, anthropic-ai, Google-Extended) — ungewöhnlich fortschrittlich für einen Kleinbetrieb, positiv zu werten
- `llms.txt` / `llms-full.txt`: vorhanden — ebenfalls über Branchendurchschnitt

---

## <a name="gesamtbewertung"></a>Gesamtbewertung

| Dimension | Score | Begründung (kurz) |
|---|---|---|
| SEO | 78/100 | Solide Grundlagen, aber 6 defekte Duplikate in der Sitemap, 20 Seiten ohne Schema.org |
| Performance | 74/100 | WebP umgesetzt, aber ~4,8MB unreferenzierte Alt-Bilder im Root, kein echter Lighthouse-Lauf je gemacht |
| UX | 76/100 | Klarer Conversion-Pfad, aber keine Preisindikation, kaum Tap/Focus-Feedback |
| Content | 73/100 | Gut ausgebaute Haupttexte, aber 6 Root-Duplikate + 2 Orphan-Stubs sind Duplicate/Thin Content |
| Branding | 80/100 | Konsistentes Gold/Schwarz/Off-White-System, aber Gold-Kontrast technisch fehlerhaft |
| Accessibility | 62/100 | Alt-Texte vollständig (0 fehlend!), aber Kontrastfehler (2,35:1 statt 4,5:1) und kaum Focus-States |
| Conversion (CRO) | 71/100 | Klare CTAs, Honeypot-Spam-Schutz, aber "Preis auf Anfrage" überall, totes Newsletter-Feature |
| Security | 65/100 | Gute Basis-Header (HSTS, X-Frame-Options), aber CSP fehlt weiterhin, kein SRI auf CDN-Links |
| Technik/Code | 70/100 | Sauberes Vanilla-JS/CSS ohne Framework-Ballast, aber 6 Duplikat-Dateien + 1 totes Feature (newsletter.js) |
| Marketing | 75/100 | Gute lokale Differenzierung, kostenlose Tools als Lead-Magnet, aber Newsletter-Rabattaktion nicht funktionsfähig |
| **Gesamt** | **≈ 74/100** | **B — solide Basis, klare Prioritäten für die nächsten 90 Tage vorhanden** |

---

## <a name="staerken"></a>Größte Stärken (Top 20)

1. **0 Bilder ohne Alt-Text** über alle 49 Seiten (per Manifest verifiziert) — überdurchschnittlich für eine Kleinbetrieb-Website
2. Vollständige lokale Landingpage-Strategie (4 Städte, je 650+ Wörter, echte inhaltliche Differenzierung, nicht nur Namens-Austausch)
3. Ratgeber-Artikel wurden heute im "Zeitungsstil" mit Drop-Cap, Lesezeit, Bildern neu gestaltet — klar über dem, was man bei einem Nebenerwerbsbetrieb erwarten würde
4. `robots.txt` erlaubt explizit alle relevanten KI-Crawler — zukunftsgerichtet, kaum ein Wettbewerber macht das
5. `llms.txt`/`llms-full.txt` vorhanden — Signal für professionelle SEO-Strategie
6. Kostenlose Tools (Wind-/Schneelastzonen-Rechner, Baugenehmigung-Checker) sind echte Alleinstellungsmerkmale gegenüber Wettbewerbern (schweng.eu, kd_ueberdachung_official haben laut Wettbewerbsanalyse schwächere Websites)
7. Konsistentes Farbsystem (Gold/Schwarz/Off-White) durchgängig über alle 49 Seiten via CSS-Variablen
8. Honeypot-Spam-Schutz im Kontaktformular bereits umgesetzt (`_gotcha`-Feld)
9. DSGVO-Cookie-Consent korrekt vor Google Fonts geschaltet
10. `aggregateRating` Schema.org aktiv (5.0★) — Rich-Snippet-Potenzial in der Google-Suche
11. Konsequente Nutzung von `defer` auf allen Script-Tags — kein Render-Blocking
12. WebP-Konvertierung für alle Produktfotos umgesetzt, inkl. Dateigrößen 45–250KB nach heutiger Bildaktualisierung
13. Barrierefreiheits-Widget mit 8 Funktionen (Schriftgröße, Kontrast, Cursor, Lesehilfe, Nachtmodus, Dyslexie-Schrift, Animationen aus) — geht über das übliche Maß hinaus
14. Cal.com wurde bewusst und sauber wieder entfernt, als der Betreiber merkte, dass es zu viel Aufwand für den Nebenerwerb ist — Zeugnis für pragmatische Entscheidungsfindung, kein technisches Problem
15. Baugenehmigung-Checker deckt jetzt 16 Landkreise mit echten, recherchierten Bauamt-Kontaktdaten ab (60-70km-Radius um den Westerwaldkreis)
16. Klare rechtliche Struktur (Impressum, Datenschutz, AGB vorhanden, GbR i. Gr. korrekt benannt)
17. Formspree-Integration mit HTTPS, kein eigenes Backend nötig — reduziert Angriffsfläche
18. Google-Ads-Keyword-Strategie mit dedizierten Landingpages abgestimmt (Montabaur/Neuwied/Koblenz/Altenkirchen)
19. Produkttexte wurden mit echten technischen Herstellerdaten angereichert (Glas-Kennwerte, Windwiderstandsklassen, Garantiezeiten) statt generischer Marketingsprache
20. Site läuft komplett ohne Framework-Overhead (Vanilla JS/CSS) — minimale Angriffsfläche, keine Dependency-Verwaltung nötig

---

## <a name="schwaechen"></a>Größte Schwächen (Top 20)

1. **6 Root-Produktseiten-Duplikate sind alle technisch defekt** — 3 mit falschem `<title>` (carport.html→"Terrassenüberdachung", kaltwintergarten.html→"Pergola & Lamellendach", sonnenschutz.html→"Geländer & Zubehör"), 3 komplett OHNE `<title>`-Tag (gelaender.html, pergola.html, terrassenueberdachung.html)
2. Alle 6 genannten Duplikate stehen weiterhin in `sitemap.xml` — Google bekommt widersprüchliche/leere Signale
3. Content-Security-Policy fehlt weiterhin trotz früherer (falscher) Dokumentation, dass sie ergänzt wurde
4. Kein SRI-Hash (`integrity=`) auf Leaflet-CDN-Includes (windzonen.html, einzugsgebiet.html, baugenehmigung.html)
5. **Gold-Text auf Off-White-Hintergrund hat nur 2,35:1 Kontrast** — WCAG AA verlangt 4,5:1 (Normaltext) bzw. 3:1 (große Schrift/UI); 43 Vorkommen von `color:var(--gold)` allein in `css/style.css`
6. `js/newsletter.js` bewirbt einen Rabattcode (BVNEWS5), ist aber auf KEINER Seite eingebunden — totes Feature, das nie ein Nutzer sieht, aber Wartungsaufwand verursacht
7. ~4,8MB unreferenzierte Bild-Duplikate weiterhin im Repo-Root (bereits im Performance-Audit vom 04.07. dokumentiert, noch nicht bereinigt)
8. "Preis auf Anfrage" ohne jede Richtwert-Angabe auf allen Produktseiten — bekannte Conversion-Bremse
9. Kaum `:active`/`:focus`-States definiert (nur 1× `:active`, 3× `:focus` in der gesamten CSS) — schwaches Tap-Feedback auf Mobile, WCAG-2.4.7-Risiko
10. `produkte/balkonueberdachung.html` und `produkte/sonnenschutz-beschattung.html` sind Orphan-Stubs mit nur 16 Wörtern Inhalt — weder verlinkt noch in Sitemap, aber weiterhin im Repo
11. 20 von 49 Seiten haben gar kein Schema.org-Markup (u.a. alle Rechtstexte, einzugsgebiet.html, konfigurator.html, kontakt.html)
12. Konfigurator (konfigurator.html) ist seit Monaten nur Platzhalter ("Demnächst") — bindet Nutzererwartung ohne Gegenwert
13. Kein `<picture>`-Fallback für WebP (unproblematisch für Evergreen-Browser, aber technisch nicht zukunftssicher dokumentiert)
14. i18n.js wird auf jeder Seite geladen, obwohl die Seite faktisch nur Deutsch anbietet — unnötiger Overhead
15. Keine A/B-Test-Infrastruktur oder Conversion-Tracking über die reine Formular-Abgabe hinaus
16. `_template.html` und `produkte/_template.html` liegen offen im deploybaren Bereich (kein `.assetsignore`-Ausschluss) — werden potenziell von Google indexiert, obwohl sie nur interne Vorlagen sind
17. Kein Backlink-Aufbau bisher umgesetzt (bereits im SEO-Audit vom 04.07. als offen dokumentiert)
18. Trustindex/Google-Bewertungswidget ist vorbereitet, aber nur 1 einzige Bewertung insgesamt — dünnes Social-Proof-Fundament (strukturell bedingt durch junges Unternehmen, nicht technisch behebbar)
19. `vorschau.html` (interne Preview-Seite) hat keine Meta-Description/Canonical und unklaren Zweck für Außenstehende, die sie über die Sitemap finden könnten
20. Keine Google Search Console / Analytics-Implementierung im Code sichtbar (kann nicht abschließend verifiziert werden, siehe Einschränkungen)

---

## <a name="kritisch"></a>Kritische Probleme (priorisiert)

| # | Problem | Priorität | Betroffene Seiten | Auswirkung |
|---|---|---|---|---|
| 1 | 6 Root-Produktduplikate mit falschem/fehlendem Title, weiterhin in Sitemap | 🔴 Kritisch | carport.html, gelaender.html, kaltwintergarten.html, pergola.html, sonnenschutz.html, terrassenueberdachung.html | Google-Verwirrung, potenzielle Duplicate-Content-Abwertung der ECHTEN Seiten unter produkte/ |
| 2 | CSP-Header fehlt | 🔴 Kritisch | Alle 49 Seiten | Kein Schutz gegen XSS via Script-Injection |
| 3 | WCAG-Kontrastfehler Gold auf Off-White (2,35:1) | 🔴 Kritisch | Alle Seiten mit `.tag`, gold-farbigem Text auf hellem Grund | Nutzer mit Sehbeeinträchtigung können Text nicht lesen; rechtliches Risiko (Barrierefreiheitsstärkungsgesetz BFSG, Pflicht ab 2025 für viele B2C-Anbieter) |
| 4 | Kein SRI-Hash auf Leaflet-CDN | 🟠 Hoch | windzonen.html, einzugsgebiet.html, baugenehmigung.html | Kompromittiertes CDN könnte Schadcode injizieren |
| 5 | Totes Newsletter-Feature mit beworbenem, nicht einlösbarem Rabattcode | 🟠 Hoch | (nirgends aktiv eingebunden, aber im Code vorhanden) | Falls versehentlich aktiviert: enttäuschte Nutzer, Vertrauensverlust |
| 6 | 4,8MB unreferenzierte Bild-Duplikate im Root | 🟡 Mittel | Repo-weit | Kein Live-Impact, aber Repo-Bloat und Verwechslungsgefahr |
| 7 | Fehlende Preisindikation | 🟡 Mittel | Alle Produktseiten | Unqualifizierte Anfragen, höhere Absprungrate |
| 8 | Fehlende Tap/Focus-States | 🟡 Mittel | Alle Seiten (global CSS) | Schwaches Mobile-Feedback, WCAG-2.4.7-Grenzfall |
| 9 | `_template.html`-Dateien nicht von Deployment/Indexierung ausgeschlossen | 🟢 Niedrig | `_template.html`, `produkte/_template.html` | Geringes SEO-Risiko, aber unsauber |
| 10 | Konfigurator seit Monaten Platzhalter | 🟢 Niedrig | konfigurator.html | Enttäuschte Erwartung, aber klar als "Demnächst" gekennzeichnet |

---

## <a name="quick-wins"></a>Quick Wins (wenig Aufwand, hoher Nutzen)

Sortiert nach Aufwand/Nutzen-Verhältnis (ROI):

| Maßnahme | Aufwand | Nutzen | ROI |
|---|---|---|---|
| Die 6 Root-Duplikate löschen + aus Sitemap entfernen (Inhalt existiert schon sauber unter `produkte/`) | Sehr gering (1 Commit) | Hoch — behebt Duplicate-Content-Risiko sofort | ⭐⭐⭐⭐⭐ |
| `newsletter.js`-Datei löschen oder Feature fertigstellen (EmailJS-Key eintragen + Formular einbinden) | Gering | Mittel-Hoch — entweder Aufräumen oder echter Lead-Magnet | ⭐⭐⭐⭐ |
| CSP-Header ergänzen (Vorschlag liegt bereits in `audits/SECURITY_AUDIT.md` fertig vor) | Gering (aber Testaufwand gegen alle Tools) | Hoch — schließt größte Sicherheitslücke | ⭐⭐⭐⭐ |
| Gold-Text auf hellem Grund durch Gold-Dark (3,88:1) oder dunkleren Ton ersetzen wo auf Off-White verwendet | Gering | Hoch — behebt WCAG-Kritikalität, BFSG-Risiko | ⭐⭐⭐⭐⭐ |
| Root-Bild-Duplikate (4,8MB) löschen | Sehr gering | Mittel — Repo-Hygiene | ⭐⭐⭐ |
| `_template.html`-Dateien in `.assetsignore` aufnehmen | Sehr gering | Gering-Mittel | ⭐⭐⭐ |
| Preisrichtwerte ("ab X €") auf Produktseiten ergänzen | Mittel (Preiskalkulation nötig) | Hoch — direkte Conversion-Verbesserung | ⭐⭐⭐⭐ |
| `:active`/`:focus`-States für Buttons/Links global ergänzen | Gering | Mittel — bessere Mobile-UX und Accessibility | ⭐⭐⭐ |

---

## <a name="fachbereiche"></a>Fachbereichs-Bewertungen im Detail

### SEO (78/100)
Technisch ist die Seite gut aufgestellt: Canonicals auf den **aktuellen** Seiten korrekt, hreflang auf der Startseite, Sitemap aktuell für die echten Seiten, Schema.org LocalBusiness/FAQPage/HowTo vorhanden. Das größte Problem bleibt die Root-Duplikat-Situation (siehe Kritische Probleme #1) — das ist einzeln schwerwiegend genug, um den Score deutlich zu drücken. Zusätzlich fehlt Schema.org `Product` noch auf 2 Seiten (`balkonueberdachung.html`, `sonnenschutz-beschattung.html` — beide ohnehin Orphan-Stubs, siehe Content). Keyword-Strategie für "Rechner"-Suchen wurde heute bereits verbessert (windzonen.html). Backlink-Aufbau ist weiterhin komplett offen.

### Performance (74/100, geschätzt — kein echter Lighthouse-Lauf)
WebP-Umsetzung ist vorbildlich (38+ Dateien, 45-250KB je Bild nach heutiger Aktualisierung). Scripts durchgängig mit `defer`. Größtes Manko: nie ein echter Lighthouse/PageSpeed-Insights-Lauf gegen die Live-Seite durchgeführt — alle CWV-Werte in der Dokumentation sind Schätzungen. i18n.js (Mehrsprachigkeit) wird auf jeder Seite geladen, obwohl faktisch nicht genutzt.

### UX (76/100)
Klarer, kurzer Conversion-Pfad (Hero → Produkt → Formular). Barrierefreiheits-Widget ist ein echtes Differenzierungsmerkmal. Schwächen: fehlende Preisindikation, kaum visuelles Feedback bei Touch-Interaktionen, Windzonen-Tabelle ohne sichtbaren Scroll-Hinweis auf Mobile.

### Content (73/100)
Hauptinhalte (16 aktuelle Produktseiten, 4 lokale Landingpages, 5 Ratgeber-Artikel) sind inhaltlich stark und einzigartig formuliert. Das Problem liegt komplett bei den Alt-Inhalten: 6 Root-Duplikate (potenzieller Duplicate Content) + 2 Orphan-Stubs mit 16 Wörtern Inhalt. Diese sollten entweder gelöscht oder (falls aus rechtlichen/historischen Gründen nötig) mit `noindex` versehen werden.

### Branding (80/100)
Höchster Einzelscore — das Farbsystem, die Typografie (Barlow Condensed + Inter) und der Markenname werden konsequent über alle 49 Seiten korrekt verwendet. Einziger Abzug: Die Kernfarbe Gold ist technisch nicht barrierefrei einsetzbar auf hellem Grund, was Branding und Accessibility in Konflikt bringt.

### Accessibility (62/100 — niedrigster Score)
0 fehlende Alt-Texte ist ein starkes Fundament. Aber: der quantifizierte Kontrastfehler (2,35:1 statt 4,5:1) ist ein echter WCAG-2.2-AA-Verstoß (Kriterium 1.4.3), der seit 2025 in Deutschland über das Barrierefreiheitsstärkungsgesetz (BFSG) auch für viele B2C-Anbieter praktisch relevant werden kann. Fehlende Focus-States sind ein zweiter, kleinerer Verstoß (Kriterium 2.4.7).

### Conversion/CRO (71/100)
Honeypot-Spam-Schutz, klare CTA-Sprache, DSGVO-konformes Formular — solide Basis. Aber: "Preis auf Anfrage" ist eine bekannte, unquantifizierte Bremse, und das nicht eingebundene Newsletter-Feature verschenkt eine Rabattcode-Idee, die eigentlich gut wäre.

### Security (65/100)
Gute HTTP-Security-Header-Basis (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy). Fehlende CSP und fehlender SRI-Hash sind die zwei zentralen offenen Punkte, beide bereits mit konkretem Lösungsvorschlag in `audits/SECURITY_AUDIT.md` dokumentiert.

### Technik/Code-Qualität (70/100)
Sauberes, framework-freies Vanilla-JS/CSS ohne Altlasten wie jQuery. Größtes technisches Schulden-Element ist die 6-fache Duplizierung der Produktseiten zwischen Root und `produkte/` — das Risiko, dass beide Versionen bei künftigen Updates auseinanderlaufen, ist real (ist bereits teilweise passiert: die Root-Version von `carport.html` hat andere/fehlende Metadaten als `produkte/carport.html`).

### Marketing (75/100)
Die kostenlosen Tools (Wind-/Schneelastzonen-Rechner, Baugenehmigung-Checker) sind clevere Lead-Magneten, die viele Wettbewerber nicht haben. Die lokale Differenzierung (4 Städte-Landingpages) ist strategisch gut gemacht. Newsletter als Marketing-Kanal ist angedacht, aber nicht umgesetzt.

---

## <a name="matrix"></a>Seitentyp-Bewertungsmatrix

| Seitentyp | SEO | UX | Perf. | Content | A11y | CRO | Security | Technik | Ø |
|---|---|---|---|---|---|---|---|---|---|
| Homepage (index.html) | 9/10 | 8/10 | 7/10 | 8/10 | 6/10 | 8/10 | 6/10 | 7/10 | **7,4** |
| Produktseiten (produkte/*, 16 Stk., Template-Basis) | 8/10 | 8/10 | 8/10 | 8/10 | 7/10 | 6/10 | 7/10 | 7/10 | **7,4** |
| **Root-Duplikate (6 Stk.)** | **2/10** | 5/10 | 7/10 | 3/10 | 6/10 | 4/10 | 7/10 | **2/10** | **4,5** |
| Lokale Landingpages (4 Stk.) | 9/10 | 8/10 | 8/10 | 8/10 | 6/10 | 7/10 | 7/10 | 8/10 | **7,6** |
| Ratgeber-Artikel (6 Stk., heute neu gestaltet) | 8/10 | 9/10 | 7/10 | 8/10 | 7/10 | 6/10 | 7/10 | 8/10 | **7,5** |
| Tools (windzonen/baugenehmigung/einzugsgebiet) | 8/10 | 7/10 | 6/10 | 8/10 | 6/10 | 7/10 | 5/10 | 6/10 | **6,6** |
| Konfigurator (Platzhalter) | 5/10 | 4/10 | 8/10 | 3/10 | 6/10 | 3/10 | 7/10 | 6/10 | **5,3** |
| Rechtstexte (3 Stk.) | 6/10 | 7/10 | 8/10 | 7/10 | 6/10 | – | 7/10 | 7/10 | **6,9** |
| Orphan-Stubs (2 Stk., 16 Wörter) | 2/10 | 3/10 | 8/10 | 1/10 | 6/10 | 2/10 | 7/10 | 3/10 | **4,0** |

---

## <a name="roadmaps"></a>Roadmaps

### SEO-Roadmap
- **30 Tage:** 6 Root-Duplikate löschen + Sitemap bereinigen · Schema.org `Product` auf die 2 verbleibenden Produktseiten ergänzen (falls diese behalten werden) · `_template.html`-Dateien in `.assetsignore`
- **60 Tage:** Erste 3-5 Backlinks aufbauen (hwk-koblenz.de, lokal.de, westerwald-info.de) · Google Search Console Sitemap-Resubmit nach Bereinigung
- **90 Tage:** Google Business Profil aktiv befüllen (Posts, Fotos, Q&A) · Weitere lokale Landingpages für Hachenburg/Bad Marienberg prüfen
- **6 Monate:** Content-Hub um 3-5 weitere Ratgeber-Artikel erweitern (Themen: Wintergarten-Vergleich, Wartung im Winter, Förderungen) · Aggregat-Rating auf mehr Bewertungen ausbauen
- **12 Monate:** Backlink-Portfolio auf 15-20 Quellen ausbauen · Video-Content für YouTube/Schema VideoObject prüfen

### UX-Roadmap
- **30 Tage:** `:active`/`:focus`-States global ergänzen · Scroll-Hinweis für Windzonen-Tabelle auf Mobile
- **60 Tage:** Preisrichtwerte auf allen Produktseiten einführen
- **90 Tage:** Galerie-Lightbox mit Pinch-to-Zoom auf Mobile
- **6-12 Monate:** Konfigurator fertigstellen oder durch einfachere Lösung ersetzen (siehe frühere Kosten-Nutzen-Diskussion zu VD-Konfigurator-Lizenz)

### Performance-Roadmap
- **30 Tage:** Root-Bild-Duplikate (4,8MB) löschen · echten Lighthouse-Lauf gegen die Live-Seite durchführen und reale Werte dokumentieren
- **60 Tage:** i18n.js nur laden, wenn tatsächlich eine andere Sprache aktiv ist (Lazy-Load)
- **90 Tage:** `<picture>`-Fallback für WebP ergänzen (optional, geringe Priorität)

### Content-Roadmap
- **Neue Inhalte:** Preistabellen/Kostenrechner-Artikel vertiefen, weitere Ratgeber-Themen
- **Überarbeitung:** Konfigurator-Platzhalter entweder mit echtem Inhalt füllen oder Erwartung im Text senken
- **Entfernung:** 6 Root-Duplikate, 2 Orphan-Stubs (`balkonueberdachung.html`, `sonnenschutz-beschattung.html`), `newsletter.js` (falls nicht fertiggestellt)
- **Priorisierung:** Entfernung vor Neuaufbau — zuerst aufräumen, dann erweitern

### Conversion-Roadmap
- Preisrichtwerte einführen (höchste Hebelwirkung)
- Newsletter-Feature entweder fertigstellen (echter Lead-Magnet mit Rabattcode) oder Code entfernen
- A/B-Test-Idee: Hero-CTA "Kostenlose Beratung" vs. "Jetzt Angebot erhalten" testen, sobald Traffic-Volumen das zulässt (aktuell wahrscheinlich zu gering für signifikante Ergebnisse — junges Unternehmen)
- Trustindex-Widget aktivieren, sobald mehr als 3-5 Bewertungen vorliegen

---

## <a name="wettbewerb"></a>Wettbewerbsfähigkeit

- **Wie professionell wirkt die Website?** Deutlich professioneller als der Wettbewerb laut vorheriger Analyse (schweng.eu: kein lokaler Fokus; kd_ueberdachung_official: wenig Beratungscharakter; terrassen_und_carports: schwache Website). Die Kombination aus lokalen Landingpages, kostenlosen Tools und einem echten Ratgeber-Blog ist für ein Unternehmen in Gründung ungewöhnlich stark.
- **Wie konkurrenzfähig ist sie?** Technisch und inhaltlich konkurrenzfähig mit deutlich größeren Betrieben. Das Hauptdefizit ist nicht die Website, sondern die noch fehlende Human-Trust-Basis (nur 1 Google-Bewertung, Unternehmen erst 2026 gegründet).
- **Welche Chancen bestehen?** Die kostenlosen Tools (Windzonen-Rechner, Baugenehmigung-Checker) sind ein seltenes Alleinstellungsmerkmal in dieser Nische — mit gezieltem Linkaufbau könnten sie zu eigenständigen Traffic-Quellen werden.
- **Welche Risiken gibt es?** Die Root-Duplikate könnten bei einem Google-Kernupdate zu einer Abwertung der echten Seiten führen, wenn Google sie als minderwertigen Duplicate Content einstuft. Das BFSG-Kontrastproblem ist ein wachsendes rechtliches Risiko in Deutschland.
- **Wo liegt das größte Potenzial?** Backlink-Aufbau (aktuell bei 0) kombiniert mit den bereits vorhandenen Lead-Magneten — das ist der Hebel mit dem besten Aufwand/Nutzen-Verhältnis für die nächsten 6 Monate.

---

## <a name="einschraenkungen"></a>Nicht geprüft / Einschränkungen

- **Kein echter Lighthouse/PageSpeed-Insights-Lauf** gegen die Live-Domain durchgeführt (nur Dateigrößen-basierte Schätzung) — Grund: kein Headless-Browser-Zugriff auf die Live-URL im Rahmen dieses Audits genutzt.
- **Keine Cross-Browser-Tests** (Safari/Firefox-Rendering) durchgeführt — nur Code-Analyse.
- **Keine echten Analytics-/Conversion-Daten** verfügbar (kein Zugriff auf Google Analytics/Search Console) — alle Funnel-Aussagen sind aus Code-Struktur abgeleitet, nicht aus echtem Nutzerverhalten.
- **10-Agent-Parallel-Ansatz mit Volleinzelbewertung jeder der 49 Seiten** konnte wegen eines API-Session-Limits nicht durchgeführt werden — dieser Bericht ist die direkt selbst erstellte, schlankere Ersatzversion (siehe Hinweis oben).
- **externe Backlink-Analyse** (z.B. Ahrefs/Semrush-Daten) nicht durchgeführt — keine entsprechenden Tools verfügbar.

---
*Erstellt direkt (ohne Subagenten) nach Ausfall des ursprünglich geplanten 10-Agent-Audits · Nächste Überprüfung: nach Umsetzung der Kritischen Probleme #1–#3*
