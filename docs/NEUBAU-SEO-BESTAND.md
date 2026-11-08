# Neubau – SEO-Bestand (Stand 08.11.2026)

> Nur gelesen, nichts geändert. Quelle: die HTML-Dateien im Repo (Branch-Stand), `sitemap.xml`, `robots.txt`, `wrangler.jsonc`, `worker/index.js`, `_headers`.
> **Nicht geprüft:** das Live-Verhalten (Statuscodes, welche URL-Form Google indexiert hat). Dafür gab es hier keinen Netzzugriff mit Header-Sicht. Bitte in der Search Console gegenlesen.
> Descriptions sind unten auf den Anfang gekürzt; der volle Wortlaut steht in der jeweiligen Datei und muss beim Neubau 1:1 übernommen werden.
> Kürzel: `=` bedeutet canonical zeigt auf `https://bv-aussensysteme.de/<eigener Pfad>` (mit `.html`). OG-Bild: nur 2 von 64 Seiten haben überhaupt eines.

## 0. Auf einen Blick

| Befund | Anzahl / Seiten |
|---|---|
| HTML-Dateien (ohne `node_modules`) | 64 – davon indexierbar und echt: **49** (= Sitemap) |
| Technische Hüllen, die nie indexiert werden sollen | 15 (siehe Abschnitt 1, Gruppe E) |
| Seiten mit mehr als einer `<h1>` | **0** (Zeilensuche nach `<h1`; je Datei höchstens ein Treffer) |
| Seite mit **ausgeblendeter** `<h1>` (`left:-9999px`) | `partner.html` – Cloaking-Muster, beim Neubau sichtbar machen oder weglassen |
| Seiten ohne `<title>` | 0 (`vorschau`, `entwurf*` haben nur interne Titel) |
| Seiten ohne Description (indexierbare Gruppe) | 0; ohne Description sind nur Hüllen/Entwürfe/Werkstatt-Zahlen |
| Doppelte Titel | `gelaender.html` = `_template.html` (Wurzel!); `konfigurator.html` = `export/konfigurator/index.html` |
| Seiten mit OG-Bild | nur `index.html` (`/images/og-preview.webp`) und `broschuere.html` (`/assets/broschuere/og-broschuere.jpg`) |
| Seiten mit og:title/og:description, aber ohne og:image | Produktseiten (z. B. `garten-aussenbereich`), Ratgeber, Städteseiten – Vorschau beim Teilen unvollständig |
| Regionale Landingpages | **14**, nicht 13: 7 Terrassenüberdachung + 4 Carport + 3 Pergola |

## 1. Seitentabelle (alle 64 Dateien)

### A) Startseite und Hauptseiten

| Pfad | Title | Description (Anfang) | h1 | canonical | robots | OG-Bild |
|---|---|---|---|---|---|---|
| `/index.html` (URL `/`) | Terrassenüberdachung & Carport \| BV AussenSysteme | Terrassenüberdachung & Carport im Westerwald ✓ Montabaur ✓ Koblenz … ☎ 0156 78696609 | Ihr Traumplatz draußen – das ganze Jahr. | `https://bv-aussensysteme.de/` | index, follow | `/images/og-preview.webp` |
| `/konfigurator.html` | 3D Konfigurator: Terrassendach & Carport \| BV AussenSysteme | Terrassendach, Flachdach SkyView oder Carport in 3D selbst zusammenstellen … | Terrassendach TDS | = | index, follow | – (nur og:description) |
| `/broschuere.html` | Produktkatalog durchblättern – Terrassenüberdachung, Carport & Pergola \| … | Unsere Produktbroschüre zum Durchblättern … 36 Seiten, auch als PDF … | Unser Produktkatalog | = | index, follow | `/assets/broschuere/og-broschuere.jpg` |
| `/einzugsgebiet.html` | Einzugsgebiet Westerwald \| BV AussenSysteme | BV AussenSysteme beliefert und montiert im gesamten Westerwaldkreis – Montabaur, Neuwied, Altenkirchen, Hachenburg, Pleckhausen, Horhausen, Limburg und Koblenz. | Wir kommen zu Ihnen – im Westerwald & Umgebung | = | index, follow | – |
| `/baugenehmigung.html` | Baugenehmigung Terrassenüberdachung & Carport prüfen – kostenlos \| BV AussenSysteme Westerwald | Kostenlos prüfen: Braucht meine Terrassenüberdachung oder mein Carport eine Baugenehmigung? PLZ eingeben … | Baugenehmigung prüfen – kostenloser Tool | = | index, follow | – |
| `/windzonen.html` | Wind- & Schneelastzonen-Rechner \| BV AussenSysteme | Kostenloser Wind- & Schneelastzonen-Rechner nach PLZ … DIN EN 1991-1-3/-4 … | Wind- und Schneelastzonen-Rechner | = | index, follow | – |
| `/pflege.html` | Pflegehinweise Terrassenüberdachung \| BV AussenSysteme | Pflegehinweise für Terrassenüberdachungen & Carports – Reinigung, Wartung … | Pflegehinweise für Ihre Überdachung | = | index, follow | – |
| `/stoffe.html` | Markisenstoffe – Stoffauswahl für Markisen & Sonnenschutz \| BV AussenSysteme | Große Auswahl an hochwertigen Markisenstoffen: AC-, PA- und ZIP-Stoffe (T-Serie) … Muster von VD AluSysteme. | Markisenstoffe | = | index, follow | – |
| `/zertifikate.html` | Zertifikate & Qualifikationen \| BV AussenSysteme | Unsere Zertifikate: Nachweise der Qualifikationen und Schulungen von Alexander Becker und Josef Voronin … | Unsere Zertifikate | = | index, follow | – |
| `/partner.html` | Partner \| BV AussenSysteme – VD AluSysteme & Hersteller | Unsere Partner – BV AussenSysteme arbeitet mit führenden Herstellern und Lieferanten zusammen. | **VD AluSysteme Partner – unsichtbar** (`position:absolute;left:-9999px`) | = | index, follow | – |

### B) Produktseiten (`/produkte/`)

| Pfad | Title | Description (Anfang) | h1 | canonical | robots |
|---|---|---|---|---|---|
| `produkte/terrassenueberdachung.html` | Terrassenüberdachung \| BV AussenSysteme Westerwald | Terrassenüberdachungen im Westerwald – TDS und SkyView … 10 J. Herstellergarantie … | Terrassenüberdachung | = | index, follow |
| `produkte/carport.html` | Carport Westerwald – TDS, Flat Line & Flat Box \| BV AussenSysteme | Carports im Westerwald – Carport TDS, Flachdach Flat Line und Flat Box … | Carport im Westerwald | = | index, follow |
| `produkte/pergola.html` | Pergola & Lamellendach \| BV AussenSysteme Westerwald | Pergola und Lamellendach im Westerwald – Lamellendach SunPro Plus … | Pergola & Lamellendach | = | index, follow |
| `produkte/kaltwintergarten.html` | Kaltwintergarten \| BV AussenSysteme Westerwald | Kaltwintergarten im Westerwald – Kaltwintergarten TDS … | Kaltwintergarten | = | index, follow |
| `produkte/sonnenschutz.html` | Sonnenschutz & Beschattung Westerwald – Markisen \| BV AussenSysteme | Sonnenschutz & Beschattung im Westerwald: Markisen, Aufdach-, Unterdach- und Senkrechtbeschattung … | Sonnenschutz & Beschattung im Westerwald | = | index, follow |
| `produkte/gelaender.html` | Geländer & Zubehör \| BV AussenSysteme Westerwald | Aluminium-Geländer im Westerwald – Geländer mit VSG-Glas und Ganzglasgeländer … | Geländer & Zubehör | = | index, follow |
| `produkte/velaris.html` | Velaris Lamellensystem \| BV AussenSysteme Westerwald | Velaris einsteuerbare Lamellen im Westerwald … | Velaris – Einsteuerbare Lamellen | = | index, follow |
| `produkte/faltdach.html` | Faltdach OpenAir \| BV AussenSysteme Westerwald | Faltdach OpenAir im Westerwald – flexibles Glasdach … | Faltdach OpenAir | = | index, follow |
| `produkte/fassade.html` | Deco Wall Fassade Aluminium Westerwald \| BV AussenSysteme | Deco Wall Fassadenverkleidung aus Aluminium im Westerwald … | Fassadenverkleidung Deco Wall | = | index, follow |
| `produkte/sichtschutz.html` | Sichtschutz Aluminium Westerwald \| BV AussenSysteme | Aluminium-Sichtschutz im Westerwald – 14 cm Paneele … | Sichtschutz aus Aluminium | = | index, follow |
| `produkte/fahrradueberdachung.html` | Fahrradüberdachung Aluminium Westerwald \| BV AussenSysteme | Fahrradüberdachungen aus Aluminium im Westerwald – modular, 2 bis 20+ Räder … | Fahrradüberdachung | = | index, follow |
| `produkte/gartenhaus.html` | Gartenhaus Aluminium Westerwald – TDS System \| BV AussenSysteme | Aluminium-Gartenhäuser TDS im Westerwald … | Gartenhaus TDS | = | index, follow |
| `produkte/bushaltestelle.html` | Bushaltestelle Aluminium \| BV AussenSysteme Westerwald | Bushaltestellen aus Aluminium und Glas im Westerwald … | Bushaltestelle aus Aluminium | = | index, follow |
| `produkte/eingang.html` | Eingang & Vordächer \| BV AussenSysteme Westerwald | Vordach FLY, Front Line & Eingangsüberdachungen im Westerwald … | Eingang & Vordächer | = | index, follow |
| `produkte/balkon-fassade.html` | Balkon & Fassade \| BV AussenSysteme Westerwald | Balkonüberdachungen, Fassadenverkleidung Deco Wall & Sichtschutz im Westerwald … | Balkon & Fassade | = | index, follow |
| `produkte/garten-aussenbereich.html` | Garten & Außenbereich \| BV AussenSysteme Westerwald | Gartenhaus TDS, Fahrradüberdachung, Bushaltestelle & Faltdach OpenAir im Westerwald … | Garten & Außenbereich | = | index, follow |

Alle 16 Produktseiten ohne OG-Bild. Hinweis: Titel enden fast alle auf „… Westerwald" – kein Duplikat, aber austauschbar.

### C) Regionale Landingpages (14, alle in der Sitemap, alle ohne OG-Bild, robots nicht gesetzt = Standard index)

| Pfad | Title | Description (Anfang) | h1 | canonical |
|---|---|---|---|---|
| `terrassenueberdachung-montabaur.html` | Terrassenüberdachung & Carport Montabaur \| BV AussenSysteme | Terrassenüberdachung, Carport und Pergola in Montabaur – … montiert Aluminium-Außensysteme von VD AluSysteme … | Terrassenüberdachung & Carport in Montabaur | = |
| `terrassenueberdachung-koblenz.html` | Terrassenüberdachung & Carport Koblenz \| BV AussenSysteme | … Fachbetrieb für Aluminium-Außensysteme. Kostenlose Beratung und Aufmaß vor Ort. | Terrassenüberdachung & Carport in Koblenz | = |
| `terrassenueberdachung-neuwied.html` | Terrassenüberdachung & Carport Neuwied \| BV AussenSysteme | … regionaler Fachbetrieb für Aluminium-Außensysteme … | Terrassenüberdachung & Carport in Neuwied | = |
| `terrassenueberdachung-altenkirchen.html` | Terrassenüberdachung & Carport Altenkirchen \| BV AussenSysteme | … Altenkirchen (Westerwald) – … regionaler Fachbetrieb … | Terrassenüberdachung & Carport in Altenkirchen | = |
| `terrassenueberdachung-limburg.html` | Terrassenüberdachung & Carport Limburg an der Lahn \| BV AussenSysteme | … Limburg an der Lahn – … nach Maß … | Terrassenüberdachung & Carport in Limburg an der Lahn | = |
| `terrassenueberdachung-hachenburg.html` | Terrassenüberdachung & Carport Hachenburg \| BV AussenSysteme | … Hachenburg – … aus dem Westerwald, maßgefertigte Aluminium-Außensysteme … | Terrassenüberdachung & Carport in Hachenburg | = |
| `terrassenueberdachung-ransbach-baumbach.html` | Terrassenüberdachung & Carport Ransbach-Baumbach \| BV AussenSysteme | … Ihr Fachbetrieb aus dem direkt benachbarten Dernbach … | Terrassenüberdachung & Carport in Ransbach-Baumbach | = |
| `carport-montabaur.html` | Carport Montabaur – Aluminium nach Maß \| BV AussenSysteme | Aluminium-Carport in Montabaur nach Maß – Einzel- und Doppelcarport … 10 Jahre Garantie. | Carport in Montabaur – Aluminium nach Maß | = |
| `carport-koblenz.html` | Carport Koblenz – Aluminium nach Maß \| BV AussenSysteme | Aluminium-Carport in Koblenz nach Maß … fachgerechte Montage … | Carport in Koblenz – Aluminium nach Maß | = |
| `carport-neuwied.html` | Carport Neuwied – Aluminium nach Maß \| BV AussenSysteme | Aluminium-Carport in Neuwied nach Maß … mit Abstellraum oder PV möglich … | Carport in Neuwied – Aluminium nach Maß | = |
| `carport-limburg.html` | Carport Limburg an der Lahn – Aluminium nach Maß \| BV AussenSysteme | Aluminium-Carport in Limburg an der Lahn nach Maß … | Carport in Limburg an der Lahn – Aluminium nach Maß | = |
| `pergola-montabaur.html` | Pergola & Lamellendach Montabaur \| BV AussenSysteme | Pergola und Lamellendach in Montabaur – motorisiert … | Pergola & Lamellendach in Montabaur | = |
| `pergola-koblenz.html` | Pergola & Lamellendach Koblenz \| BV AussenSysteme | Pergola und Lamellendach in Koblenz – motorisiert … | Pergola & Lamellendach in Koblenz | = |
| `pergola-neuwied.html` | Pergola & Lamellendach Neuwied \| BV AussenSysteme | Pergola und Lamellendach in Neuwied – … wetterfest bis Windstärke 8 … | Pergola & Lamellendach in Neuwied | = |

Auffällig: Montabaur-Description nennt „VD AluSysteme" (Markenregel beachten, falls VD-Inhalte je entfernt werden). Einzugsgebiet nennt Pleckhausen und Horhausen, dafür gibt es keine Seite.

### D) Ratgeber (6 Dateien, davon 5 Artikel; alle ohne OG-Bild)

| Pfad | Title | Description (Anfang) | h1 | canonical | robots |
|---|---|---|---|---|---|
| `ratgeber/index.html` (URL `/ratgeber/`) | Ratgeber – Terrassenüberdachung, Carport & Pergola \| BV AussenSysteme | Ratgeber und Tipps zu Terrassenüberdachung, Carport, Pergola … | Ratgeber Aluminium-Außensysteme | `…/ratgeber/` | index, follow |
| `ratgeber/terrassenueberdachung-kosten.html` | Was kostet eine Terrassenüberdachung? Preise & Kosten 2026 \| BV AussenSysteme | Was kostet eine Terrassenüberdachung – mit oder ohne Montage? … | Was kostet eine Terrassenüberdachung? Preise 2026 | = | index, follow |
| `ratgeber/baugenehmigung-terrassenueberdachung.html` | Baugenehmigung Terrassenüberdachung 2026 – alle Bundesländer \| BV AussenSysteme | Wann braucht eine Terrassenüberdachung eine Baugenehmigung? Alle … 16 Bundesländer … | Baugenehmigung Terrassenüberdachung – wann nötig? | = | index, follow |
| `ratgeber/carport-oder-garage.html` | Carport oder Garage? Der ehrliche Vergleich 2026 \| BV AussenSysteme | Carport oder Garage – was ist besser? … für den Westerwald. | Carport oder Garage? Der große Vergleich | = | index, follow |
| `ratgeber/pergola-kaufen-ratgeber.html` | Pergola kaufen 2026 – Ratgeber: Typen, Kosten & Tipps \| BV AussenSysteme | Pergola kaufen: offene Pergola, Lamellendach oder Faltdach? … | Pergola kaufen: Was Sie wissen müssen | = | index, follow |
| `ratgeber/aluminium-terrasse-pflegen.html` | Aluminium Terrassenüberdachung pflegen – Tipps & Anleitung \| BV AussenSysteme | Aluminium-Außensysteme pflegen: So reinigen Sie … | Aluminium-Außensysteme pflegen – so einfach geht es | = | index, follow |

Titel mit Jahreszahl „2026" (4 Artikel): beim Neubau mit übernehmen, aber Aktualisierung einplanen.

### E) Hüllen, Rechtliches, Technik, Entwürfe (nicht oder bewusst nicht indexierbar)

| Pfad | Title | Description | h1 | canonical | robots | Anmerkung |
|---|---|---|---|---|---|---|
| `impressum.html` | Impressum \| BV AussenSysteme – Dernbach, Westerwald | vorhanden | Impressum | = | **noindex, follow** | steht trotzdem in der Sitemap |
| `datenschutz.html` | Datenschutzerklärung \| BV AussenSysteme | vorhanden | Datenschutzerklärung | = | **noindex, follow** | steht trotzdem in der Sitemap |
| `agb.html` | AGB – Allgemeine Geschäftsbedingungen \| BV AussenSysteme | vorhanden | Allgemeine Geschäftsbedingungen | = | **noindex, follow** | steht trotzdem in der Sitemap |
| `widerruf.html` | Widerruf – Muster-Widerrufsformular \| BV AussenSysteme | vorhanden | Widerruf | = | noindex, follow | nicht in Sitemap (stimmig) |
| `danke.html` | Vielen Dank – Ihre Anfrage ist eingegangen \| BV AussenSysteme | vorhanden | Vielen Dank für Ihre Anfrage! | = | noindex, nofollow | Ziel des Formular-Redirects (303) – URL muss bleiben |
| `kontakt.html` | Kontakt \| BV AussenSysteme | **fehlt** | **fehlt** | `…/#kontakt` (Fragment, unzulässig) | – | Worker antwortet 301 → `/#kontakt`; Datei ist nur Rückfall |
| `termin.html` | Termin \| BV AussenSysteme | **fehlt** | **fehlt** | `…/#kontakt` | noindex, follow | Worker 301 → `/#kontakt` |
| `produkte/balkonueberdachung.html` | Balkonüberdachung \| BV AussenSysteme Westerwald | **fehlt** | **fehlt** | `…/produkte/balkon-fassade.html` | noindex, follow | Worker 301 → `produkte/balkon-fassade.html` |
| `produkte/sonnenschutz-beschattung.html` | Sonnenschutz & Beschattung \| BV AussenSysteme Westerwald | **fehlt** | **fehlt** | `…/produkte/sonnenschutz.html` | noindex, follow | Worker 301 → `produkte/sonnenschutz.html` |
| `_template.html` (Wurzel) | Geländer & Zubehör \| BV AussenSysteme Westerwald (**doppelt** zu `produkte/gelaender.html`) | gleicher Text wie Gelaender | Geländer & Zubehör | `…/produkte/gelaender.html` | **index, follow** | Vorlage liegt öffentlich unter `/_template` – nicht in Sitemap, aber erreichbar; beim Neubau nicht ausliefern |
| `produkte/_template.html` | keine Meta-Felder gefunden | – | – | – | – | Vorlage, nicht ausliefern |
| `export/konfigurator/index.html` | 3D Konfigurator: Terrassendach & Carport … (**doppelt** zu `konfigurator.html`) | gleich | Terrassendach TDS | `…/konfigurator.html` | index, follow | Exportkopie – Duplicate Content, nicht ausliefern |
| `werkstatt/index.html` | Werkstatt – nicht veroeffentlicht | Konfigurator-Text | Terrassendach TDS | fehlt | **widersprüchlich**: `noindex, nofollow, …` und danach `index, follow` | zusätzlich `X-Robots-Tag: noindex` per `_headers` und Passwortschranke im Worker |
| `werkstatt/zahlen.html` | Besucher – Werkstatt | fehlt | Besucher | fehlt | noindex, nofollow, noarchive, nosnippet | intern |
| `vorschau.html` | BV AussenSysteme – Lokale Vorschau | fehlt | fehlt | fehlt | noindex, nofollow | intern |
| `entwurf.html`, `entwurf-apple.html`, `entwurf-produkt.html` | „Entwurf …" | fehlt | je eine | fehlt | noindex, nofollow | laut Bestandsaufnahme live 404; reine Neubau-Entwürfe |

Zählprobe: A 10 + B 16 + C 14 + D 6 = 46 Inhaltsseiten; dazu `impressum`, `datenschutz`, `agb` (in der Sitemap, aber noindex) = 49 Sitemap-Einträge. Die übrigen 15 Dateien (widerruf, danke, kontakt, termin, 2 Weiterleitungshüllen, 2 Vorlagen, export, 2 Werkstatt, vorschau, 3 Entwürfe = 17, davon 2 Vorlagen/Doppel bereits mitgezählt) sind Technik. Die genaue Aufteilung A–E ergibt zusammen alle 64 Dateien; Quelle der Zählung ist die Dateiliste des Repos ohne `node_modules`.

**Lücken-Zusammenfassung**
- Fehlende Description: `kontakt`, `termin`, `balkonueberdachung`, `sonnenschutz-beschattung` (alles Weiterleitungshüllen, unkritisch), `zahlen`, `vorschau`, `entwurf*`.
- Fehlende `<h1>`: dieselben Hüllen.
- Canonical mit Fragment (`#kontakt`): `kontakt.html`, `termin.html` – ungültig, aber folgenlos, solange der Worker vorher 301 sendet.
- Fehlendes OG-Bild: **62 von 64**; unter den 49 indexierbaren Seiten 47.
- Widersprüchliche robots-Metas in `werkstatt/index.html` (noindex und index auf derselben Seite).

## 2. Strukturierte Daten (JSON-LD)

| Seite(n) | Typen |
|---|---|
| `index.html` | LocalBusiness (2×), Service (6×), FAQPage, BreadcrumbList |
| 14 Städteseiten (alle terrassenueberdachung-*, carport-*, pergola-*) | BreadcrumbList, LocalBusiness, FAQPage (je 3 Fragen sichtbar vorgesehen) |
| `baugenehmigung.html` | BreadcrumbList, FAQPage (mind. 5 Fragen), WebApplication, LocalBusiness |
| `pflege.html` | BreadcrumbList, HowTo |
| `produkte/terrassenueberdachung`, `carport`, `pergola`, `kaltwintergarten`, `sonnenschutz`, `gelaender` | BreadcrumbList, Product (+ Brand, Organization), LocalBusiness |
| `produkte/velaris`, `faltdach`, `fassade`, `sichtschutz`, `fahrradueberdachung`, `gartenhaus`, `bushaltestelle`, `eingang`, `balkon-fassade`, `garten-aussenbereich` | BreadcrumbList, Product (+ Brand), LocalBusiness |
| `ratgeber/terrassenueberdachung-kosten.html` | BreadcrumbList, Article (+ Organization), FAQPage |
| `ratgeber/baugenehmigung-terrassenueberdachung`, `carport-oder-garage`, `pergola-kaufen-ratgeber`, `aluminium-terrasse-pflegen` | BreadcrumbList, Article (+ Organization) – **kein** FAQPage |
| **Ohne** JSON-LD | `einzugsgebiet`, `windzonen`, `stoffe`, `zertifikate`, `partner`, `broschuere`, `konfigurator`, `ratgeber/index`, `impressum`, `datenschutz`, `agb`, `widerruf`, `danke` und alle Hüllen |

Hinweise für den Neubau:
- LocalBusiness steht auf fast jeder Inhaltsseite; Name, Adresse (Dernbach) und Telefon (`0156 78696609`) müssen überall identisch bleiben.
- FAQPage-Daten müssen den sichtbaren Fragen entsprechen (Städteseiten und Startseite: beim Umbau Text und JSON-LD gemeinsam führen).
- `ratgeber/index`, `einzugsgebiet`, `windzonen` haben keine BreadcrumbList – Lücke im Bestand, kein Verlust.
- Product ohne Preis/Bewertung (Preisregel des Betreibers) – so beibehalten.

## 3. sitemap.xml und robots.txt

**sitemap.xml:** 49 URLs, alle mit `.html` (Ausnahmen: `/` und `/ratgeber/`), alle Domains `https://bv-aussensysteme.de`.

| Prüfung | Ergebnis |
|---|---|
| Einträge ohne Datei (ins Leere) | **0** – jede der 49 URLs hat eine Datei |
| Einträge, die live nicht 200 liefern | **`/konfigurator.html`** – Worker antwortet absichtlich **503** (`KONFIGURATOR_GESPERRT = true`, Entscheid 31.10.2026). Sitemap-URL mit 503 ist gewollt (Rang halten), aber gehört in den Neubau-Plan: Rückkehr des Konfigurators = gleiche URL |
| Einträge mit `noindex` | `/agb.html`, `/impressum.html`, `/datenschutz.html` – Widerspruch (noindex in Sitemap); Google meldet das als „Gesendete URL mit noindex". Vorschlag: aus Sitemap nehmen oder noindex bewusst belassen und entscheiden |
| Indexierbare Seiten, die in der Sitemap fehlen | **keine** (stoffe, zertifikate, partner, windzonen, pflege, broschuere, baugenehmigung, einzugsgebiet, ratgeber/ + 5 Artikel, 16 Produktseiten, 14 Städteseiten, Start: alle drin) |
| Seiten in Sitemap, die nur dort stehen (verwaist) | siehe Abschnitt 4 – **keine echte Waise** |
| `lastmod` | Alle Daten liegen zwischen 2026-07-15 und 2026-11-06; `index.html` 2026-09-06, aber Branch-Änderungen vom 07.11. sind nicht eingetragen. Beim Neubau lastmod nur bei echter Inhaltsänderung setzen |
| `changefreq`/`priority` | gepflegt, werden von Google ignoriert – kein Verlust |

**robots.txt:** `User-agent: *  Allow: /` plus ausdrückliche `Allow: /` für ~30 KI-Crawler (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot u. a.); `Sitemap: https://bv-aussensysteme.de/sitemap.xml`. **Kein einziges Disallow.** `/werkstatt` ist bewusst nicht erwähnt (Schutz per Passwort + `X-Robots-Tag`). Passt zu den Seiten; Neubau muss `Sitemap:`-Zeile und die bewusste „alle zugelassen"-Haltung übernehmen. Ablage: Datei liegt im Wurzelverzeichnis, wird als Asset ausgeliefert.

## 4. Interne Verlinkung

Alle internen Links im Bestand haben die Form `/pfad.html` (Wurzel-absolut) bzw. `/ratgeber/`; innerhalb von `/produkte/` auch relativ (`gartenhaus.html`).

| Ebene | Seiten |
|---|---|
| Direkt von der Startseite UND im Fuß (jede Seite) | 7 Produktlinks (terrassenueberdachung, carport, pergola, kaltwintergarten, sonnenschutz, stoffe, gelaender), einzugsgebiet, partner, zertifikate, konfigurator, pflege, ratgeber/, windzonen, baugenehmigung, impressum, agb, datenschutz, widerruf, broschuere |
| Nur von der Startseite (Kartenbereich), nicht im Fuß | velaris, eingang, balkon-fassade, garten-aussenbereich; Städteseiten Hachenburg, Limburg, Ransbach-Baumbach |
| Im Fuß (Beispiel `impressum.html`) nur 4 Städte | Montabaur, Neuwied, Altenkirchen, Koblenz (Hachenburg, Limburg, Ransbach-Baumbach fehlen im Fuß) |
| Nur 2 Klicks (über Städteseiten) | `carport-montabaur/koblenz/neuwied/limburg`, `pergola-montabaur/koblenz/neuwied` – verlinkt aus der jeweiligen `terrassenueberdachung-<stadt>.html` bzw. gegenseitig; nicht von Startseite oder Fuß |
| Nur über Hub-Seiten (relativ verlinkt) | faltdach, fassade, sichtschutz, fahrradueberdachung, gartenhaus, bushaltestelle – von `garten-aussenbereich` / `balkon-fassade`; Startseite verlinkt sie nicht |
| Ratgeber-Artikel (5) | nur über `ratgeber/index` (Fuß verlinkt `/ratgeber/`), dazu 1–3 Querlinks aus Produktseiten (`carport`→carport-oder-garage, `pergola`→pergola-kaufen, `terrassenueberdachung`→kosten/baugenehmigung/pflege) und Artikel→Artikel (kosten↔baugenehmigung) |
| Verlinkt, aber live 503 | `/konfigurator.html`: von rund 20 Seiten (Kopf, Fuß, Ratgeber, Städteseiten) – Linkwert fließt auf eine 503-Seite |
| Weiterleitungsziele | `termin`/`kontakt` → `/#kontakt`; nirgends mehr verlinkt (nur `werkstatt/*` verweist auf Hüllen) |

**Verwaiste Seiten (nur in der Sitemap, nirgends verlinkt):** keine gefunden. Die schwächste Anbindung haben `carport-limburg` (nur von `terrassenueberdachung-limburg`), die vier Hub-Unterseiten (faltdach … bushaltestelle) und die 5 Ratgeber-Artikel. Einschränkung: nur statisches HTML geprüft; per JavaScript erzeugte Links wurden nicht erfasst.

## 5. URLs, die beim Neubau unverändert bleiben MÜSSEN

Alle Pfade exakt wie unten (inkl. `.html`, Kleinschreibung, `/ratgeber/` mit Schrägstrich). Wenn der Neubau eine andere Form wählt, ist je URL eine **301** vom alten Pfad nötig (siehe Abschnitt 6).

**Muss exakt bleiben (49 Sitemap-URLs)**

| Gruppe | URLs |
|---|---|
| Start | `/` |
| **14 regionale Landingpages (ranken auf Ortsbegriffe)** | `/terrassenueberdachung-montabaur.html`, `-koblenz`, `-neuwied`, `-altenkirchen`, `-limburg`, `-hachenburg`, `-ransbach-baumbach`; `/carport-montabaur.html`, `-koblenz`, `-neuwied`, `-limburg`; `/pergola-montabaur.html`, `-koblenz`, `-neuwied` |
| **5 Ratgeber-Artikel + Übersicht** | `/ratgeber/` ; `/ratgeber/terrassenueberdachung-kosten.html`, `/ratgeber/baugenehmigung-terrassenueberdachung.html`, `/ratgeber/carport-oder-garage.html`, `/ratgeber/pergola-kaufen-ratgeber.html`, `/ratgeber/aluminium-terrasse-pflegen.html` |
| 16 Produktseiten (`/produkte/<name>.html`; es gibt keine `/produkte/`-Übersicht) | `terrassenueberdachung`, `carport`, `pergola`, `kaltwintergarten`, `sonnenschutz`, `gelaender`, `velaris`, `faltdach`, `fassade`, `sichtschutz`, `fahrradueberdachung`, `gartenhaus`, `bushaltestelle`, `eingang`, `balkon-fassade`, `garten-aussenbereich` (je `.html`) |
| Werkzeuge/Info | `/baugenehmigung.html`, `/windzonen.html`, `/konfigurator.html`, `/einzugsgebiet.html`, `/pflege.html`, `/broschuere.html`, `/stoffe.html`, `/zertifikate.html`, `/partner.html` |
| Rechtliches (Pflicht) | `/impressum.html`, `/datenschutz.html`, `/agb.html`, `/widerruf.html` |

**Zusätzlich zu erhalten (Funktion, nicht Ranking)**
- `/danke.html` (Ziel der Formularübermittlung, `303` aus `/api/kontakt`).
- `/api/kontakt`, `/api/bauteile`, `/api/messung`, `/api/teilen`, `/werkstatt/*` (Worker-Routen; Passwortschranke).
- Statische Dateien mit eigenen Adressen: `/sitemap.xml`, `/robots.txt`, `/images/og-preview.webp`, `/assets/broschuere/og-broschuere.jpg`, Broschüren-PDF unter `/assets/`.
- Die 4 Weiterleitungen (Worker, 301): `/termin.html` und `/kontakt.html` → `/#kontakt`; `/produkte/balkonueberdachung.html` → `/produkte/balkon-fassade.html`; `/produkte/sonnenschutz-beschattung.html` → `/produkte/sonnenschutz.html`. Search Console meldete sie früher als „Seite mit Weiterleitung"; nicht wieder auf Meta-Refresh zurückfallen. Wichtig: `run_worker_first` in `wrangler.jsonc` führt sie auf; ein anderes Hosting muss sie nachbauen.

**Hinweis Zahl:** Auftrag nennt 13 regionale Seiten; im Bestand sind es **14**. Falls im Neubau tatsächlich nur 13 geplant sind, fehlt eine – wahrscheinlich eine der 4 Carport- oder 3 Pergola-Seiten.

**Nicht ausliefern / darf entfallen:** `_template.html`, `produkte/_template.html`, `export/konfigurator/index.html`, `vorschau.html`, `entwurf*.html`, `werkstatt/zahlen.html` (nur intern).

## 6. Cloudflare-Besonderheit: `.html` ↔ Endung ohne `.html`

Belegt aus dem Code: `wrangler.jsonc` setzt keine `html_handling`-Option, es gilt Cloudflare-Standard (`auto-trailing-slash`). Dabei leitet `/x.html` auf `/x` weiter (nach Ihrer Angabe mit 307; das konnte hier nicht live gegengemessen werden). Eigene 301 gibt es nur für die 4 Hüllen oben.

| Fundstelle | Verwendete Form | Passt zur Weiterleitung? |
|---|---|---|
| `sitemap.xml` | **`.html`** (47×) plus `/` und `/ratgeber/` | **Nein** – Sitemap nennt URLs, die weiterleiten |
| `<link rel="canonical">` | **`.html`** auf allen Seiten (z. B. `…/carport-koblenz.html`) | **Nein** – canonical zeigt auf die weiterleitende Adresse |
| Interne Links (Kopf, Fuß, Karten, Querlinks) | **`.html`** (`/produkte/carport.html` …) | **Nein** – jeder Klick läuft über eine Weiterleitung |
| JSON-LD (`url`, `item` in BreadcrumbList) | **nicht gezielt geprüft**; in `ratgeber/*` und `index.html` bei Gelegenheit gegenlesen | offen |
| Weiterleitungsziele im Worker | `/produkte/balkon-fassade.html`, `/produkte/sonnenschutz.html`, `/danke.html` | **Nein** – Worker leitet auf `.html`, die Plattform dann weiter auf die Endung ohne `.html` (Kette 301 → 307, so aus dem Code abgeleitet, nicht live gemessen) |

Bewertung:
1. Alle drei Signale (Sitemap, canonical, Links) sind untereinander **einheitlich** (`.html`), widersprechen aber dem **tatsächlich ausgelieferten** Zustand (Adresse ohne Endung). Google kann dann die endungslose Form als kanonisch wählen und die canonical-Angabe überstimmen. Welche Form tatsächlich im Index steht, ist **nicht belegt** – in der Search Console unter „Seiten" gegenprüfen (URL-Prüfung: „Vom Nutzer deklarierte" vs. „Von Google ausgewählte" Canonical).
2. 307 ist temporär; Linkwert wird dabei schwächer weitergereicht als bei 301/308.
3. Die Weiterleitungsketten bei den 4 Hüllen: Worker 301 zu `….html` und dann Plattform auf Endung ohne `.html` – zwei Sprünge.
4. `/` und `/ratgeber/` sind frei von dem Problem.

Empfehlung für den Neubau (Entscheidung beim Betreiber): **eine** Form festlegen und in canonical, Sitemap, Links, JSON-LD und Worker-Weiterleitungen gleichzeitig durchziehen. Wird auf endungslose URLs umgestellt, braucht **jede** der 49 alten `.html`-Adressen eine dauerhafte Weiterleitung (301/308) auf die neue Form, sonst ist das identisch mit einem Umzug. Bleibt es bei `.html`, sollte die Plattform diese ausliefern statt weiterzuleiten.

## 7. Die fünf Dinge, deren Verlust am meisten wehtun würde

1. **Die 14 regionalen Landingpages mit unveränderter URL, Title, h1 und LocalBusiness-/FAQ-Schema.** Sie tragen die Ortssuchen (Montabaur, Koblenz, Neuwied, Limburg …); jeder Pfadwechsel ohne 301 setzt den Ranggewinn zurück.
2. **Die 5 Ratgeber-Artikel plus `/ratgeber/` samt Article-/FAQ-Daten und Querlinks.** Einzige Informationsseiten; „Terrassenüberdachung Kosten" und „Baugenehmigung" sind die breitesten Suchbegriffe. Sie hängen intern nur an einem dünnen Faden (`/ratgeber/` und wenige Produktlinks) – im Neubau besser verlinken, nicht schlechter.
3. **Die Produktseiten (16) mit ihren URLs, Titeln und Product-Schema** – dazu die Hubs; vier Unterseiten (faltdach, fassade, sichtschutz, fahrradueberdachung, gartenhaus, bushaltestelle) hängen nur an einem Hub.
4. **Die Startseite `/` mit LocalBusiness-, Service-, FAQ-Daten, der Description mit Telefonnummer und dem einzigen vollständigen OG-Bild** – plus die Rechenwerkzeuge `baugenehmigung.html` und `windzonen.html`, die als Verlinkungsziel dienen können.
5. **Die technische Absicherung: gleiche URL-Form überall, die 4 Worker-301, die 503-Sperre von `/konfigurator.html` (Adresse bleibt im Bestand, bis der Konfigurator wiederkehrt), `robots.txt` mit Sitemap-Zeile, `/danke.html` und die Rechtstexte.** Ein stiller Wechsel zwischen `.html` und endungsloser Form ohne 301 ist das größte Einzelrisiko für den Rangverlust.

## 8. Offene Punkte zum Gegenlesen

- 307 und Kette: `curl -I https://bv-aussensysteme.de/carport-koblenz.html` und die 4 Hüllen, hier nicht gemessen.
- Search Console: welche URL-Form ist indexiert (mit oder ohne `.html`)?
- Description und Titel der Hüllen sind unkritisch; `partner.html`-Verstecktext (`left:-9999px`) vor dem Neubau entscheiden.
- Zahl 13 vs. 14 klären.
- `_template.html` in der Wurzel ist öffentlich erreichbar (`index, follow`, canonical auf `gelaender`) – prüfen, ob live indexiert.
