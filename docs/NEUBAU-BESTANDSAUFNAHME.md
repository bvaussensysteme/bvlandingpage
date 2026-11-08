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

---

## 7. Funde der unabhängigen Isolationsprüfung (08.11.2026)

Ein zweiter Agent hat meine Behauptungen aus Abschnitt 1 nachgeprüft –
nicht geglaubt, sondern mit eigenen Befehlen belegt. Vier von fünf
bestätigt, eine eingeschränkt. Drei Lücken kamen dabei heraus:

### 7.1 Entwürfe wären bei einem Produktiv-Deploy öffentlich gewesen — behoben

`wrangler.jsonc` liefert mit `assets.directory: "."` **das ganze
Projektverzeichnis** aus. Alles, was nicht in `.assetsignore` steht, ist
nach einem Deploy öffentlich. Die Entwurfsseiten standen dort **nicht**.

Geschützt waren sie nur durch `<meta name="robots" content="noindex">` –
das hält Suchmaschinen ab, aber niemanden, der die Adresse kennt.

**Behoben:** `entwurf/`, `entwurf.html`, `entwurf-apple.html` und
`entwurf-produkt.html` stehen jetzt in `.assetsignore`, zusätzlich
`X-Robots-Tag: noindex, nofollow` in `_headers`. Auf der
Branch-Vorschau bleiben sie erreichbar – dort sollen sie es sein.

### 7.2 `main` ist ungeschützt — liegt beim Betreiber

Laut GitHub-API ist **kein** Branch geschützt, auch `main` nicht. Ein
einzelner Merge oder Push löst das Cloudflare-Deployment aus.

Die Regel, die das gefährlich machte („immer auto merge"), ist am
08.11.2026 aus `CLAUDE.md` entfernt. **Technisch** abgesichert ist es
damit nicht. Empfehlung an den Betreiber: In den
GitHub-Repository-Einstellungen unter *Branches* eine Schutzregel für
`main` anlegen (mindestens: Pull Request erforderlich). Das kann ich
nicht selbst tun.

### 7.3 Die Vorschau schreibt in die Produktionsdatenbank — nicht behoben

`wrangler.jsonc` hat **keine getrennte Umgebung**. Das D1-Binding
`MESSUNG` → `bv-messung` gilt für Produktion **und** Vorschau. Die
Tabelle `ereignis` hat **keine Spalte für den Hostnamen** – in den
Zahlen ist also nicht zu unterscheiden, ob ein Aufruf von der echten
Seite oder von einer Vorschau kam.

**Nachgemessen am 08.11.2026:** In der Tabelle stehen für heute 98
Zeilen gegenüber 16 am Vortag. Keine davon nennt eine Entwurfsseite –
die Entwürfe binden `js/messung.js` gar nicht ein. **Aber:** Meine
eigenen Browser-Prüfungen gegen die **echte** Adresse
(`bv-aussensysteme.de`, je zweimal `/`, `/baugenehmigung`, `/pflege`)
sind mit hoher Wahrscheinlichkeit in diesen 98 Zeilen enthalten. Wie
viele es genau sind, lässt sich **nicht** feststellen, weil nichts
Testverkehr kennzeichnet.

**Das betrifft die Regel „Zahlen vor Meinung" unmittelbar:** Die Zahlen
der letzten Tage sind durch meine Tests verunreinigt. Wer sie für eine
Entscheidung heranzieht, muss das wissen.

**Zwei Wege, beide gehören dem Betreiber:**

1. **Getrennte Datenbank für die Vorschau.** In `wrangler.jsonc` eine
   eigene Umgebung mit eigenem D1-Binding. Sauber, aber eine Änderung
   an der produktiven Konfiguration – nach Regel 1 nicht ohne Wort.
2. **Nicht mehr gegen die echte Adresse testen.** Ab sofort laufen alle
   Browser-Prüfungen gegen `localhost` oder die Branch-Vorschau. Das
   kostet nichts und ändert an der Produktion nichts. **So mache ich es
   ab jetzt**, bis anders entschieden.

Was ich **nicht** tue: an der Messung oder an der Datenbank etwas
ändern. Eine Änderung am Umfang der Messung zieht nach eigener Regel
eine Änderung der Datenschutzerklärung nach sich.

## 8. Was von hier aus nicht prüfbar ist

- Die Cloudflare-Oberfläche: Build-Einstellungen, welche Branches
  gebaut werden, DNS.
- Ob ein Vorschau-Build weitere produktive Bindungen erbt.
- Die Schutzregeln des GitHub-Repositorys ändern.

Diese drei Punkte kann nur der Betreiber einsehen oder ändern.
