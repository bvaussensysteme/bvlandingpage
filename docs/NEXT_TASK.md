# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach: `CLAUDE.md` und `PROJEKTSTAND.md`.
> Stand: 10.10.2026 · letzter Chat wurde hier beendet (`/clear`)
>
> **Erster Schritt in der neuen Sitzung:** Branch auf den aktuellen Stand setzen
> (`git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main`),
> dann Abschnitt 1 lesen. Nichts ist halbfertig liegen geblieben – alle
> Änderungen sind veröffentlicht.
>
> **Kurz halten.** Wird diese Datei länger als etwa 400 Zeilen, wandern die
> ältesten erledigten Einträge nach `docs/erledigt-archiv.md`.

---

## 1. Was als Nächstes ansteht

### Aufgabe A — Weitere Produkte im 3D-Konfigurator *(direkte Fortsetzung)*

Der Konfigurator kann bisher nur das **Terrassendach TDS**. Die Seite weist
selbst darauf hin und verlinkt für die übrigen Systeme auf den
Anfrage-Assistenten. Als Nächstes, in dieser Reihenfolge sinnvoll:

1. **Carport** (TDS, Flat Line, Flat Box) – freistehend, vier Pfosten
2. **Flachdach SkyView** – schmalere Profile, flachere Neigung
3. **Pergola / Lamellendach** – drehbare Lamellen als eigene Geometrie
4. Danach optional: Markise, Verkleidung, Terrassenboden

**Wegweiser – diese Dateien braucht genau diese Aufgabe:**

| Datei | Wofür |
|---|---|
| `js/konfigurator-3d.js` | Modell, Kamera, Bedienung. Einstieg: `bauen()` – hier nach Produkt verzweigen |
| `konfigurator.html` | Oberfläche und Stile (eigenständige Datei, **keine** njk-Vorlage) |
| `js/anfrage-wizard.js` | nimmt die Konfiguration entgegen: `vorgabeUebernehmen()` am Dateiende |
| `js/vendor/three.min.js` | three.js r128, liegt bewusst im Projekt (siehe `docs/entscheidungen.md`) |

**Vorgehen:** Geometrie in `bauen()` nach Produkt verzweigen, Produktauswahl
oben ins Panel, Übergabe an den Assistenten um die neuen Felder erweitern.
Danach `scripts/pruefe-cache-buster.sh` laufen lassen – die Versionsnummer in
allen 50 HTML-Dateien muss hochgezogen werden.

### Aufgabe B — Baugenehmigungs-Check: weitere Bundesländer prüfen

13 der 16 Länder sind **Übersichtsangaben ohne Prüfung am Gesetzestext**.
Geprüft sind nur Rheinland-Pfalz, Hessen und Nordrhein-Westfalen (Feld
`geprueft`). Als Nächstes sinnvoll: **Bayern** und **Baden-Württemberg**.

| Datei | Wofür |
|---|---|
| `js/baugenehmigung-data.js` | die Daten, ein Block je Bundesland |
| `scripts/pruefe-lbo-daten.js` | prüft Etikett, Farbe und Text auf Widersprüche |
| `src/baugenehmigung.njk` | Anzeige, FAQ-Schema und Quellzeile |

**Wichtig:** Primärquelle verwenden (Landesrecht-Portal oder amtliche
Broschüre), nicht Vergleichsportale. Bei RLP hätte das vier Wochen früher
auffallen können – dort stand jahrelang ein falscher Wert (m² statt m³).

---

## 2. Was beim Betreiber liegt, nicht am Rechner

Diese Punkte kann niemand im Projekt erledigen – sie brauchen einen Zugang,
eine Entscheidung oder eine Rückfrage bei Dritten.

| Was | Warum es wartet |
|---|---|
| **Google-Business-Profil-URL** | Fehlt im `sameAs`-Teil des Schemas. Nur der Betreiber kommt an die Profil-Adresse |
| **Bewertungen sammeln** | Aktuell eine einzige. Kein technisches Problem – es braucht echte Kundenanfragen |
| **3D-Konfigurator am iPhone gegenlesen** | Dreh- und Zoomverhalten lässt sich im Container nur emulieren |
| **Abschnitt „Vertragsabwicklung" in der Datenschutzerklärung** | Von mir formuliert. Die Liste der Empfänger (Steuerbüro, Hersteller, Transport, Kreditinstitute) muss zur tatsächlichen Praxis passen – im Zweifel anwaltlich bestätigen lassen |
| **Rechtstext-PDFs für Kleinanzeigen** | Liegen nicht im Repository (siehe Abschnitt 5). Bei Textänderungen neu erzeugen lassen |
| **Preisgrundlage, falls je Preise gezeigt werden sollen** | Bisherige Linie: keine Preise. Eine Kalkulationsgrundlage kann nur der Betrieb liefern |

---

## 3. Prüfskripte

Jederzeit ausführbar. Jedes Skript kennt `--gegenprobe`: es baut einen
absichtlichen Fehler und erwartet, dass die Prüfung anschlägt. **Eine Prüfung,
die nie anschlägt, ist keine.**

| Skript | Was es prüft |
|---|---|
| `scripts/pruefe-cache-buster.sh` | Verweisen alle HTML-Dateien auf dieselbe Version einer CSS-/JS-Datei? |
| `scripts/pruefe-keine-preise.sh` | Steht irgendwo ein Preis für unsere Leistungen? (Ausnahmen in `scripts/preise-ausnahmen.txt`) |
| `scripts/pruefe-datenschutz.py` | Nummerierung, Inhaltsverzeichnis, Sprungmarken, Querverweise |
| `scripts/pruefe-lbo-daten.js` | Widersprüche zwischen Etikett, Farbe und Text der Baugenehmigungs-Daten |
| `scripts/pruefe-live.sh` | Ist der veröffentlichte Stand tatsächlich draußen? (nutzt `curl -sL`) |

Alle fünf mit Gegenprobe am 10.10.2026 geprüft: bestanden.

---

## 4. Arbeitsweise

**Branch:** immer `claude/bv-aussensysteme-setup-bq7ew4`. Nach einem gemergten
PR frisch aufsetzen:
```bash
git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main
```

**Ablauf:** bauen → prüfen → committen → pushen → PR → Build abwarten →
squash-mergen → Live-Stand prüfen (`scripts/pruefe-live.sh`). Der Betreiber
sagt meist „mergen veröffentlichen"; bei neuen öffentlichen Funktionen vorher
auf die Preview schauen lassen.

**Build:** `npm run build` (Eleventy + cleancss). Nach einem Container-Neustart
fehlen die Abhängigkeiten → vorher `npm install`.

**Cache-Buster:** `_headers` erlaubt bis zu 24 h alte CSS/JS aus dem
Browser-Cache. Nach jeder Änderung an `js/*.js` oder `src/css/style.css` die
Version in **allen** HTML-Dateien hochziehen und mit
`scripts/pruefe-cache-buster.sh` nachsehen.

**Eigenständige HTML-Dateien ohne njk-Vorlage** (werden vom Build *nicht*
erzeugt, direkt bearbeiten): `index.html`, `konfigurator.html`, alle
`terrassenueberdachung-*.html`, `carport-*.html`, `pergola-*.html`,
`danke.html`.

---

## 5. Fallen, die schon Zeit gekostet haben

- **`curl` braucht `-L`.** Die Seite leitet `/seite.html` → `/seite` weiter
  (307). Ohne `-L` kommt ein **leerer Body** zurück und jede Prüfung wirkt
  „bestanden". Hat schon zu einer falschen Erfolgsmeldung geführt.
  `scripts/pruefe-live.sh` fängt das ab.
- **CSS wird minifiziert**: in `css/style.css` steht `overscroll-behavior:contain`
  ohne Leerzeichen. Suchmuster entsprechend wählen.
- **iOS Safari ignoriert `window.print()`** – deshalb erzeugt `js/bg-pdf.js`
  die PDF-Datei selbst.
- **`body { overflow: hidden }` sperrt iOS nicht.** Der Body wird fixiert,
  aber nur im Sheet-Layout (`matchMedia('(max-width: 600px)')`).
- **Schwebe-Buttons** liegen rechts über dem Inhalt – rechtsbündige Werte auf
  schmalen Schirmen vermeiden.
- **Chromium im Container erreicht die echte Domain nicht** (Proxy-Zertifikat).
  Funktionstests gegen `http://localhost:8783`, live mit `curl -sL`.

**Testaufbau** (nach einem Container-Neustart weg, neu aufsetzen):
```bash
python3 -m http.server 8783 &                 # im Projektverzeichnis
cd "$SCRATCHPAD" && npm install playwright    # Chromium: /opt/pw-browsers/chromium
```
Für WebGL (3D-Konfigurator) mit
`args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader']` starten.
Absende-Wege mit `page.route()` auf `**/api/kontakt` und
`https://api.web3forms.com/**` abfangen, statt echt zu senden.

**Rechtstext-PDFs für Kleinanzeigen** (Widerrufsbelehrung, AGB,
Datenschutzerklärung): werden aus den echten Seiten per Playwright erzeugt und
**nicht** im Repository gehalten – zwei Fassungen desselben Textes laufen
auseinander. Bei Bedarf neu erzeugen: Inhalt aus `agb.html` (`#widerruf` plus
folgender Block) und `datenschutz.html` holen, in eine schlichte Druckvorlage
mit Briefkopf setzen, als A4-PDF ausgeben.

---

## 6. Dauerhafte Vorgaben des Betreibers

- **Sparsam mit Nutzungsvolumen** (siehe `CLAUDE.md`): keine unnötigen
  Prüfschleifen, Änderungen bündeln, bei größeren Aufgaben erst kurz fragen.
- **Keine Preise** auf der Website – weder Pauschal- noch Richtpreise.
- **VD-Inhalte niemals ungefragt entfernen** (siehe `CLAUDE.md`).
- **Vorschlagen ja, ungefragt umsetzen nein.** Was gebaut wird, entscheidet
  der Betreiber.
- Kommunikation auf Deutsch.

---

## 7. Letzte Arbeitsschritte

Vollständig und mit Begründung in `docs/erledigt-archiv.md`, die
Grundsatzentscheidungen in `docs/entscheidungen.md`.

| Datum | Was | Stand |
|---|---|---|
| 10.10.2026 | Übergabe- und Prüfsystem eingerichtet (diese Datei, Entscheidungen, Archiv, fünf Prüfskripte) | live |
| 10.10.2026 | 3D-Konfigurator Terrassendach TDS | **live** |
| 10.10.2026 | Telefonnummer als Pflichtangabe | live |
| 16.09.2026 | Scrollen im Konfigurator-Fenster auf dem Handy repariert | live |
| 16.09.2026 | Anrede, Nachname, PLZ und Ort als Pflichtangaben | live |
| 09.09.2026 | Baugenehmigungs-Daten korrigiert (RLP rechnet in m³) | live |
| 09.09.2026 | Preis-Klarstellung auf Kostenseite, FAQ-Schema und `llms.txt` | live |
| 09.09.2026 | Datenschutz: tote Verweise repariert, Vertragsabwicklung ergänzt | live |
| 09.09.2026 | PDF-Download im Baugenehmigungs-Check | live |
| 09.09.2026 | Konfigurator-Fenster auch auf der Startseite | live |
