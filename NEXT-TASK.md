# NÄCHSTE SCHRITTE – Wiedereinstieg nach Chat-Reset

> Stand: 10.10.2026 · Diese Datei ist der Einstiegspunkt für die nächste Sitzung.
> Danach gilt wie immer: `CLAUDE.md` und `PROJEKTSTAND.md` lesen.

---

## 1. Wo wir gerade stehen

**Offen: PR #256 – 3D-Konfigurator für das Terrassendach TDS.**
Build grün, keine Review-Kommentare, **wartet auf die Durchsicht des Betreibers**.
Preview: `https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev/konfigurator.html`

Der Betreiber wollte einen Konfigurator wie auf `antonov-outdoor.de/konfigurator/`
(derselbe Hersteller, VD AluSysteme). Entschieden wurde:

| Frage | Entscheidung |
|---|---|
| Vorschau | Echtes 3D mit three.js, zuerst nur Terrassendach TDS |
| Preise | **Keine** – wie auf der Kostenseite und in `llms.txt` zugesagt |
| Maße | Durchgehend **Millimeter**, auch im Anfrage-Assistenten |

**Erste Frage in der neuen Sitzung:** Hat er sich die Preview angesehen? Wenn ja
und er sagt „mergen" → mergen und veröffentlichen (Ablauf siehe Abschnitt 4).

---

## 2. Was als Nächstes ansteht

### 2.1 Konfigurator ausbauen (direkte Fortsetzung)
Im 3D-Modell fehlen noch die anderen Systeme. Die Seite weist selbst darauf hin
und verlinkt dafür auf den Anfrage-Assistenten.

1. **Carport** (TDS, Flat Line, Flat Box) – freistehend, vier Pfosten, andere Dachform
2. **Flachdach SkyView** – schmalere Profile, flachere Neigung
3. **Pergola / Lamellendach** – drehbare Lamellen, sichtbar als eigene Geometrie
4. Optional danach: Markise, Verkleidung, Terrassenboden (hat Antonov auch)

Vorgehen wie bei TDS: Geometrie in `bauen()` nach Produkt verzweigen,
Auswahlfeld „Produkt" oben ins Panel, Übergabe an den Assistenten erweitern.

### 2.2 Ältere offene Punkte (aus früheren Sitzungen)
- **13 Bundesländer im Baugenehmigungs-Check** sind weiterhin Übersichtsangaben
  ohne Prüfung am Gesetzestext. Geprüft sind nur RLP, Hessen, NRW (Feld `geprueft`
  in `js/baugenehmigung-data.js`). Als Nächstes sinnvoll: Bayern, Baden-Württemberg.
- **Google Business Profile URL** fehlt für `sameAs` im Schema.
- **Bewertungen**: aktuell nur eine. Kampagne wurde vorgeschlagen, nie umgesetzt.
- **Produktseiten-Schema**: `price` fehlt auf 16 Seiten (bewusst, da keine Preise –
  der Betreiber wollte das „erstmal nur analysieren").
- **Sitemap `lastmod`** wird von Hand gepflegt; Erzeugung beim Build wurde angeboten.
- `.claude/agents/security-architect.md` nennt noch `/api/chat` als Beispiel –
  die Route gibt es seit dem Entfernen des KI-Chats nicht mehr.
- **Tote CSS-Reste** in `konfigurator.html`: Die Klassen `kp-sorry*`, `kp-notify*`
  und `kp-timeline*` gehören zur alten „Kommt bald"-Seite und werden nicht mehr
  verwendet.

---

## 3. Was in dieser Sitzung fertig wurde (alles live)

| Thema | Stand |
|---|---|
| Konfigurator-Fenster öffnet auch auf der Startseite | live |
| Baugenehmigungs-Check: Ergebnis als einseitiges PDF (`js/bg-pdf.js`) | live |
| LBauO-Werte korrigiert (RLP rechnet in **m³**, nicht m²) | live |
| Klarstellung „kursierende Preisangaben stammen nicht von uns" | live |
| Datenschutz: tote Querverweise + neuer Abschnitt Vertragsabwicklung | live |
| Konfigurator: Anrede-Auswahl (Pflicht) | live |
| Pflichtfelder: Anrede, Nachname, E-Mail, Telefon, PLZ, Ort | live |
| Sheet-Scrollen auf dem Handy repariert | live |
| 3D-Konfigurator TDS | **PR #256, offen** |

Außerdem erstellt (liegen **nicht** im Repo, nur als Chat-Dateien geliefert):
Widerrufsbelehrung, AGB und Datenschutzerklärung als PDF für Kleinanzeigen.
Erzeugt aus den echten Seiten per Playwright – bei Textänderungen neu erzeugen.

---

## 4. Arbeitsweise (bitte beibehalten)

**Branch:** immer `claude/bv-aussensysteme-setup-bq7ew4`.
Nach einem gemergten PR frisch von `main` aufsetzen:
```bash
git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main
```

**Ablauf:** bauen → testen → committen → pushen → PR → Build abwarten → squash-mergen
→ Live-Stand prüfen. Der Betreiber sagt meist „mergen veröffentlichen"; bei neuen
öffentlichen Funktionen vorher auf die Preview schauen lassen.

**Build:** `npm run build` (Eleventy + cleancss).
Nach einem Container-Neustart fehlen die Abhängigkeiten → vorher `npm install`.

**Wichtig – Cache-Buster:** `_headers` erlaubt bis zu 24 h alte CSS/JS aus dem Browser-Cache.
Bei jeder Änderung an `js/*.js` oder `src/css/style.css` die Version in **allen** HTML-Dateien
hochziehen:
```bash
grep -rl "anfrage-wizard.js?v=ALT" --include=*.html . | xargs sed -i 's|anfrage-wizard.js?v=ALT|anfrage-wizard.js?v=NEU|g'
sed -i 's|/js/anfrage-wizard.js?v=ALT|/js/anfrage-wizard.js?v=NEU|' src/_includes/layout.njk
```
Aktuelle Versionen: `anfrage-wizard.js?v=20261010i`, `konfigurator-3d.js?v=20261010i`,
`konfigurator-widget.js?v=20260916e`, `style.css?v=20260916e`.

**Eigenständige HTML-Dateien ohne njk-Vorlage** (werden vom Build *nicht* erzeugt,
müssen direkt bearbeitet werden): `index.html`, `konfigurator.html`,
alle `terrassenueberdachung-*.html`, `carport-*.html`, `pergola-*.html`, `danke.html`.

---

## 5. Fallen, die schon Zeit gekostet haben

- **`curl` braucht `-L`.** Die Seite leitet `/seite.html` → `/seite` weiter (307).
  Ohne `-L` kommt ein **leerer Body** zurück und jede Prüfung wirkt „bestanden".
  Live-Prüfungen immer mit `curl -sL`.
- **CSS wird minifiziert.** In `css/style.css` steht `overscroll-behavior:contain`
  ohne Leerzeichen – Suchmuster entsprechend wählen.
- **iOS Safari ignoriert `window.print()`** stillschweigend. Deshalb erzeugt
  `js/bg-pdf.js` die PDF-Datei selbst und liefert sie als echten Download aus.
- **`body { overflow: hidden }` sperrt iOS nicht.** Der Body wird fixiert,
  `konfigurator-widget.js` merkt sich die Scrollposition – aber **nur** im
  Sheet-Layout (`matchMedia('(max-width: 600px)')`); auf dem Desktop darf die
  Seite hinter dem schwebenden Fenster weiterscrollen.
- **Schwebe-Buttons** (nach oben, Bedienhilfen, Konfigurator) liegen rechts über
  dem Inhalt. Rechtsbündige Werte auf schmalen Schirmen vermeiden.
- **Chromium im Container erreicht die echte Domain nicht** (Zertifikat des
  Proxys). Funktionstests laufen gegen `http://localhost:8783`, live wird mit
  `curl -sL` auf Inhalte geprüft.

---

## 6. Test-Aufbau (wird nach dem Reset neu gebraucht)

Die Testskripte lagen im Scratchpad und sind nach einem Reset **weg**. Neu aufsetzen:

```bash
# lokalen Server starten (aus dem Projektverzeichnis)
python3 -m http.server 8783 &

# Playwright im Scratchpad
cd "$SCRATCHPAD" && npm install playwright
```
Chromium liegt unter `/opt/pw-browsers/chromium`; für WebGL (3D-Konfigurator)
mit `args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader']` starten.

Bewährtes Muster: Seite laden → Cookie-Banner wegklicken → `#bvKonfigBubble`
klicken → durchklicken; Absende-Wege mit `page.route()` auf `**/api/kontakt`
und `https://api.web3forms.com/**` abfangen, statt echt zu senden.

---

## 7. Dauerhafte Vorgaben des Betreibers

- **Sparsam mit Nutzungsvolumen** (siehe `CLAUDE.md`): keine unnötigen
  Prüfschleifen, Änderungen bündeln, bei größeren Aufgaben erst kurz fragen.
- **Keine Preise** auf der Website – weder Pauschal- noch Richtpreise.
- **VD-Inhalte niemals ungefragt entfernen** (siehe `CLAUDE.md`), erst rückfragen.
- Kommunikation auf Deutsch.
