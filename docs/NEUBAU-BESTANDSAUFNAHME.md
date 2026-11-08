# Neubau – Phase A: Bestandsaufnahme (08.11.2026)

> Nur gelesen, nichts geändert. Beleg für den Zustand der Live-Seite
> steht unten unter „Isolation geprüft".

## 1. Isolation geprüft

| Prüfung | Ergebnis |
|---|---|
| `main` | `0fc1810` – unverändert seit 07.11.2026 |
| Arbeitsbranch | `claude/bv-aussensysteme-setup-bq7ew4` |
| `style.css` live vs. `main` | sha256 **identisch** (`ffaf495969…`) |
| `style.css` Branch | weicht ab (`abf5713171…`) – **nicht veröffentlicht** |
| `/entwurf`, `/entwurf-apple`, `/entwurf-produkt` live | **404** |
| Produktionsdatenbank `bv-messung` (D1) | nicht angefasst |
| DNS, Domain, Hosting, produktives CI/CD | nicht angefasst |

**Staging** ist die Branch-Adresse, die Cloudflare automatisch baut:
`https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev`

## 2. Offenes Risiko: der Arbeitsbranch ist nicht sortenrein

Auf dem Branch liegen **zwei Dinge gemischt**:

1. **Entwürfe** (`entwurf*.html`, `entwurf/`, `images/logo-frei*.png`,
   `.claude/skills/apple-design/`) – reiner Neubau, berührt nichts.
2. **Änderungen an der bestehenden Seite** – 62 Dateien, darunter
   `index.html`, `css/style.css`, `js/main.js`, alle Produktseiten.
   Das sind die Umbauten vom 07.11. (Kopfbereich links, Magazinraster,
   Karussell, Bildwechsel). Sie sind **nicht freigegeben und nicht
   veröffentlicht**.

**Folge:** Würde dieser Branch als Ganzes zusammengeführt, ginge Punkt 2
mit raus. Das ist mit Regel 1 und Regel 5 nicht vereinbar.

**Einschränkung, die ich nicht selbst auflösen kann:** Diese
Arbeitsumgebung darf **nur** auf den oben genannten Branch pushen. Ein
zweiter, sortenreiner Branch lässt sich hier anlegen, aber nicht
veröffentlichen. Deshalb:

- Der Neubau entsteht vollständig unter `neu/` – einem Ordner, den es
  auf der bestehenden Seite nicht gibt. Keine bestehende Datei wird
  dafür angefasst.
- Die Umbauten aus Punkt 2 bleiben liegen, bis der Betreiber
  entscheidet: freigeben, verwerfen oder weiter liegen lassen.

## 3. Technischer Aufbau

| | |
|---|---|
| Generator | Eleventy 3 (`src/` → Wurzel), dazu 30 handgepflegte HTML-Seiten |
| CSS | eine Datei: `src/css/style.css` → `css/style.css` (cleancss) |
| Hosting | Cloudflare Workers (`wrangler.jsonc`, Worker `bvlanding`) |
| Backend | `worker/index.js` |
| Datenbank | Cloudflare D1, `bv-messung` (eigene Reichweitenmessung) |
| Abhängigkeiten | `@11ty/eleventy`, `clean-css-cli`, `@neondatabase/serverless` |

### Worker-Routen

`/api/bauteile` · `/api/kontakt` · `/api/messung` · `/api/teilen` ·
`/k/<kurzlink>` · `/werkstatt` · `/werkstatt/api/zahlen` · `/werkstatt/*`

### Externe Dienste (aus `_headers`, CSP)

Google Fonts · cdnjs · unpkg · OpenStreetMap-Kacheln · Nominatim ·
Photon (Komoot) · web3forms · formspree · Metricool
— **dazu Cloudflare Web Analytics**, das Cloudflare selbst in jede
Seite einfügt und das **nicht in der Datenschutzerklärung steht**
(offener Punkt seit 06.11.2026).

## 4. Funktionsmatrix

| Bereich | Umfang | Im Neubau zu erhalten |
|---|---|---|
| Seiten | 64 HTML (34 aus `src/`, 30 handgepflegt) | ja |
| Produktseiten | 16 unter `produkte/` | ja |
| Regionale Landingpages | 13 (Städte × Produkt) | ja |
| Ratgeber | 5 Artikel + Übersicht | ja |
| Rechtstexte | Impressum, Datenschutz, AGB, Widerruf | ja, **unverändert im Wortlaut** |
| 3D-Konfigurator | `js/konfigurator-3d.js` (892 KB) | ja – öffentlich derzeit gesperrt |
| Anfrage-Assistent | `js/anfrage-wizard.js` (89 KB) | ja |
| Windzonen-Rechner | `js/dibt-lastzonen.js` | ja |
| Baugenehmigungs-Check | `js/baugenehmigung-data.js` + PDF | ja |
| Katalog zum Blättern | `/broschuere.html`, 36 Seiten | ja |
| Barrierefreiheits-Bedienfeld | `js/accessibility.js` | ja |
| Cookie-Einwilligung | `js/cookie.js` | ja |
| Eigene Reichweitenmessung | `js/messung.js` + D1 | ja |
| Übersetzung DE/EN/RU | `js/i18n.js` | Entscheidung offen |
| Werkstatt (Passwortschranke) | `/werkstatt/` | ja |
| Prüfskripte | 50 unter `scripts/pruefe-*` | ja, müssen weiter laufen |

## 5. Bilder und Schriften

- **205 Bilddateien, 42 MB.** Herkunft überwiegend VD AluSysteme
  (Produktbilder) und eigene Fotos (`galerie-1` bis `-3`).
  `galerie-4` bis `-6` sind Platzhalter unter 4 KB.
- **Schriften:** Barlow Condensed + Inter, geladen von Google Fonts
  **erst nach Einwilligung**. Beide stehen unter der SIL Open Font
  License – kommerzielle Nutzung und Einbettung erlaubt. Das
  **Nachladen von Google** ist die datenschutzrechtliche Frage, nicht
  die Lizenz.

## 6. Was in Phase A nicht geprüft werden konnte

- Ob die Produktbilder von VD AluSysteme vertraglich für die eigene
  Website freigegeben sind. **Das weiß nur der Betreiber.**
- Marken- und Designrechte Dritter. Eine Register- oder Websuche ist
  **keine Markenfreigabe** – das gehört zum Fachanwalt.
- Ob Cloudflare Web Analytics ohne Einwilligung laufen darf.
