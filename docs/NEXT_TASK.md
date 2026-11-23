# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach `CLAUDE.md`.
> **Stand: 23.11.2026.**
>
> **Am 23.11.2026 auf ein Drittel gekürzt.** Dieser Einstieg war auf
> 662 Zeilen gewachsen. Ein Einstieg, den niemand mehr liest, ist
> keiner. Ausgelagert, nichts gelöscht:
> `docs/offene-fragen.md` (Fragen an den Betreiber),
> `docs/offene-nebenbefunde.md` (offen, aber nicht dringend),
> `docs/erledigt-archiv.md` (abgeschlossen).

## Erster Schritt in der neuen Sitzung

```bash
git fetch origin claude/bv-aussensysteme-setup-bq7ew4
git checkout claude/bv-aussensysteme-setup-bq7ew4
git reset --hard origin/claude/bv-aussensysteme-setup-bq7ew4
npm ci                       # node_modules fehlen in frischen Umgebungen
```

**Achtung, zwei Fallen beim Start:**
1. Der Arbeitsbranch enthält `main` **nicht** – er ist eigenständig
   gewachsen. Nicht `git checkout -B ... origin/main` benutzen, das
   würde die ganze Arbeit abschneiden.
2. Browser-Prüfskripte brauchen Playwright. Liegt es nicht in
   `node_modules`, hilft
   `ln -s /opt/node-tools/node_modules/playwright node_modules/playwright`.

**Stand der Prüfungen am 22.11.2026, ehrlich.** Von 77 Skripten laufen
71 bis 73 grün durch. Der Rest verhält sich so:

- `pruefe-schrittwechsel.mjs` schlägt fehl. Bekannter Altbefund B3 aus
  `docs/AUDIT-2026-11-22.md`: Am großen Bildschirm rollt beim Klick auf
  „Weiter" die ganze Seite um 64 px mit.
- `pruefe-konfigurator-oberflaeche.mjs` meldet 1 von 182 nicht
  bestanden („Der Zeiger auf dem Schild ändert das Bild"). Altbefund.
  **Am 23.11.2026 gegengeprüft** in einem eigenen Arbeitsbaum auf
  Commit `4f3f135`: Dieselbe Prüfung schlägt dort genauso fehl. Der
  Befund stammt also nicht aus der laufenden Arbeit. Einzelheiten in
  `docs/offene-nebenbefunde.md`.
- `pruefe-freie-planung.mjs`, `pruefe-keil-editor.mjs`,
  `pruefe-prozess-ringe.mjs`, `pruefe-referenz-lauf.mjs` und
  `pruefe-rahmen-editor.mjs` **flackern**: Nebeneinander gestartet
  laufen sie in Zeitgrenzen oder Verbindungsfehler, einzeln gestartet
  sind sie grün. Belegt an diesem Tag von zwei unabhängigen Läufen.
  **Ein roter Konfigurator-Lauf ist deshalb erst dann ein Befund, wenn
  er einzeln wiederholt wurde.**

Wer „alle grün" behaupten will, muss die flackernden einzeln
nachfahren. Das steht hier, weil genau diese Behauptung am 22.11.2026
zweimal zu früh gemacht wurde.

---

## 1. Das Dringendste: eine Sicherheitskorrektur liegt unveröffentlicht

**Gespeichertes XSS in `werkstatt/zahlen.html` – gefunden am 08.11.2026,
korrigiert, aber nur auf dem Arbeitsbranch.**

- **Live ist die Lücke offen.** `main` hat 17 Aufrufe von `sicher()`,
  der Branch 25. Die fehlenden acht sind die Korrektur an fünf Stellen:
  `seite`, `kampagne`, `quelle`, `medium`, `browser`, `system`.
- **Der Weg:** öffentliches `POST /api/messung` → `messungText()` filtert
  nur Steuerzeichen → D1 → `werkstatt/zahlen.html` setzt den Wert per
  `innerHTML` ein. Selbst nachgeprüft, nicht nur vermutet.
- **Betroffen** ist die interne Auswertung, nicht die Kundenseite. Wer
  sie öffnet, führt fremden Code im eigenen Browser aus.
- **Abgesichert durch** `scripts/pruefe-zahlenseite-maskierung.py`
  (Gegenprobe 3/3).

**Vorschlag, seit dem 08.11. unbeantwortet:** Diese Korrektur als
eigenen kleinen Branch von `main` vorziehen – wie es am 12.11. mit der
Broschüren-Korrektur gemacht wurde (PR #567). Dann geht sie live, ohne
den Neubau mitzunehmen. **Entscheidung liegt beim Betreiber.**

---

## 2. Was auf dem Arbeitsbranch liegt und nicht veröffentlicht ist

**405 Dateien** und 1634 Commits gegenüber `main`, Stand 23.11.2026. Grob:

| Was | Wo | Status |
|---|---|---|
| Neue Gestaltung, überall ausgerollt | `src/css/start.css`, `src/_includes/layout.njk`, alle Seiten | wartet auf den Freigabesatz |
| XSS-Korrektur | `werkstatt/zahlen.html` | siehe Abschnitt 1 |
| Neue Texte, Titel und Beschreibungen | `index.html`, `produkte/*`, `ratgeber/*`, Ortsseiten | nicht freigegeben, Liste in `docs/titel-liste-22-11-2026.md` |
| Markisenstoffe auf der Startseite | `index.html`, `scripts/baue-stoffstreifen.mjs`, 53 Miniaturen | fertig |
| Bremse gegen Überlastung der Schnittstellen | `worker/index.js` | fertig, `scripts/pruefe-bremse.mjs` grün |
| Agentensystem | `.claude/agents/*` (18 Dateien) | fertig, nur Konfiguration |
| Designsystem | `docs/WEBSITE_*.md` | fertig, Palette freigegeben |
| Inhalte vom Hersteller, Runde 23.11.2026 | 14 Produktseiten, `src/_includes/eindeck-karten.njk`, `src/css/style.css` | inhaltlich fertig, Prüferdurchgang offen |
| Freier Konfigurator: Unterzug anfassen, lichte Maße | `js/konfigurator-frei.js` | fertig und gemessen |

**Die Entwurfsseiten sind weg.** `entwurf-bv.html`, `entwurf-apple.html`,
`entwurf-produkt.html`, `vorschau.html` und der Ordner `entwurf/` wurden
am 22.11.2026 auf Ansage gelöscht („Vor der Veröffentlichung löschen").
Mit ihnen `scripts/pruefe-bewegung.mjs`, das nur sie prüfte.

**Veröffentlicht wird nichts**, bis genau dieser Satz kommt:
> ICH GEBE DIE NEUE WEBSITE ZUR VERÖFFENTLICHUNG FREI.

Die Regel steht in `CLAUDE.md`. Andere Formulierungen gelten nicht.

---

## 3. Offene Punkte, nach Dringlichkeit

### Sicherheit und Betrieb

| # | Punkt | Wer entscheidet |
|---|---|---|
| 3.1 | **XSS-Korrektur vorziehen** – am 13.11. als Branch `claude/xss-zahlenseite` von `main` fertig vorbereitet, Prüfung grün, Gegenprobe 3/3. **Kein PR, kein Merge.** Es fehlt nur die Freigabe | Betreiber |
| 3.2 | **`main` enthält noch „immer auto merge"** – am 13.11. nachgeprüft (Zeile 25 in `CLAUDE.md` auf `main`, Freigabesatz dort 0 mal). Korrektur als Branch `claude/freigaberegel-main` fertig vorbereitet. **Kein PR, kein Merge.** Vier alte PRs (#1, #2, #3, #53) sind geschlossen, null offen. Branch-Schutz fehlt weiter | Betreiber |
| 3.3 | **Die Vorschau schreibt in die produktive Messdatenbank** `bv-messung`. Jeder Testaufruf verfälscht die Zahlen (gemessen 08.11.: 98 statt 16 Zeilen). Es gibt keine getrennte Vorschau-Umgebung. | Betreiber (Cloudflare) |
| 3.4 | **Die Vorschau ist öffentlich** – kein Passwort, kein Zugangsschutz. | Betreiber |

**Für 3.2 bis 3.4 liegen seit dem 13.11.2026 zwei fertige Pläne vor**
(`docs/WEBSITE_STAGING.md`): „Freigabeplan" für die Vorschau,
„Freigabeplan 2" für den Auto-Merge-Schutz. Zusammen **sechs**
Entscheidungen beim Betreiber, nichts davon eingerichtet.

Im Einzelnen zur Vorschau:
`docs/WEBSITE_STAGING.md`, Abschnitt „Freigabeplan". Vier Schritte,
Messdaten zuerst. **Vier Entscheidungen warten auf den Betreiber:**
zweite D1 anlegen (empfohlen) · Worker-Schranke oder Cloudflare Access
(empfohlen: Worker) · Vorschau-Passwort festlegen · Reihenfolge
bestätigen. Nichts davon ist eingerichtet.

Details zu 3.3 und 3.4 in `docs/WEBSITE_STAGING.md`.

### Recht und Lizenzen – blockieren die Freigabe

| # | Punkt |
|---|---|
| 3.5 | **Herkunft der Marken-SVG-Pfade** in 54 Dateien ungeklärt |
| 3.6 | **DIBt-Windzonendaten**: Klausel zur gewerblichen Nutzung ungeklärt |
| 3.7 | **16 Abweichungen in der Datenschutzerklärung** gegenüber dem, was wirklich gemessen wird |
| 3.8 | **Cloudflare Web Analytics**: legt auf jeder Seite ein Skript dazu – in der Datenschutzerklärung nicht genannt |
| 3.9 | **Manrope** vor dem Einbau in `docs/NEUBAU-LIZENZREGISTER.md` eintragen (SIL Open Font License, kommerziell nutzbar) |

Alle fünf in `docs/NEUBAU-LIZENZREGISTER.md` und
`docs/NEUBAU-SICHERHEIT.md`. **Keine Rechtsberatung** – die verbindliche
Bewertung holt der Betreiber beim Fachmann.

### Design und Umsetzung

| # | Punkt |
|---|---|
| 3.9b | **Später prüfen:** `wrangler.jsonc` schaltet `observability.logs` mit `invocation_logs` ein. Ob und welche Eingaben in den Protokollen landen, ist ungeklärt. Vor den ersten Testdaten in der Vorschau klären |
| 3.10 | **Fokus-Verdeckung** (WCAG 2.4.11) bei fester Kopfzeile und Cookie-Banner – nur im Browser prüfbar, rechnerisch nicht |
| 3.11 | **`images/logo-hell.png`** trägt `#E69B26` (ΔE 15,9 zum Markengold). Korrigierte Hell-Variante beim Logo-Urheber anfragen – **Aufgabe des Betreibers** |
| 3.12 | **Live-Seite auf die neue Palette umstellen?** Noch nicht entschieden. `--gold-text` würde von `#7A5B12` auf `#896023` **heller** werden; danach alle `scripts/pruefe-*` laufen lassen |
| 3.13 | **Texte der übrigen 55 Seiten** entdenglischen – zurückgestellt auf Wunsch des Betreibers („du veränderst eher wieder texte anstatt das design endlich richtig gut zu machen") |

### Weiteres, ausgelagert

- **Fragen an den Betreiber**, offene wie beantwortete:
  `docs/offene-fragen.md`. Darunter: dritter Pfosten über 4 m,
  Garantie im Liefervertrag, Holzdekor-Farbzahl, Easy-Rail-Glasart,
  Deco-Wall-Beschichtungsgarantie.
- **Offen, aber nicht dringend:** `docs/offene-nebenbefunde.md`.
  Darunter die Ortsseiten-Quizfrage, rund 530 Gedankenstriche auf den
  übrigen Seiten, SEO- und Tonbefunde, die Galerie-Nebenbefunde.

### Werkzeuge

| # | Punkt |
|---|---|
| ~~3.14~~ | **Erledigt am 21.11.2026.** Die Gegenprobe von `pruefe-broschuere.mjs` lief über 29 Minuten und wurde deshalb übersprungen. Sie läuft jetzt vierfach nebeneinander: gemessen 9 Minuten, alle 42 eingebauten Fehler werden bemerkt. Siehe `docs/entscheidungen.md` |
| 3.15 | **18 Prüfskripte** hatten den Browserpfad fest eingebaut – repariert am 12.11. (`chromeIn()`), ist in `main` |
| 3.16 | **ZIP der geänderten Dateien** aus der Broschüren-Aufgabe – seit längerem zugesagt, nie geliefert |

---

## Der vollständige Prüfdurchgang vom 22.11.2026

Elf Prüfer, zwei vollständige Skriptläufe. **Alles, was offen ist und
beim Betreiber liegt, steht gesammelt in `docs/AUDIT-2026-11-22.md`.**
Dieses Dokument wiederholt es nicht.

Kurz: Sechs Punkte blockieren eine Veröffentlichung (Merge mit `main`,
fehlende Ratenbegrenzung, geteilte Datenbanken, widersprüchliche
Garantie- und Statikzusagen, gesperrter Konfigurator in der Sitemap,
die vier Rechtsfragen). Sechs weitere sollten vorher entschieden
werden. Behoben wurden zehn gemessene Fehler, Einzelheiten in
`docs/entscheidungen.md`.

## 4. Was gerade läuft: die Lieferanten-Runde

Auftrag des Betreibers vom 23.11.2026, in vier Schritten:

1. **Alle Inhalte vom Hersteller holen** – erledigt. 26 Produktseiten,
   zwei Themenseiten und fünf Dokumente gelesen, darunter der
   Produktkatalog 2026 mit 96 Seiten. Wegweiser: `docs/vd-quellen.md`.
2. **Zu unserem System umschreiben, prüfen lassen, verbessern** –
   inhaltlich fertig. Alle belegten Fakten stehen in eigener
   Formulierung auf den Seiten. **Der Durchgang der Fachprüfer nach
   `docs/PRUEFER_REIHENFOLGE.md` steht noch aus.**
3. **Auf der Vorschau umsetzen** – läuft mit, jeder Stand ist gepusht
   und wurde abgerufen.
4. **Am Design arbeiten** mit den UI/UX-Skills – noch nicht begonnen.

**Die Quellen des Herstellers liegen nicht im Repository.** Es ist
öffentlich (nachgesehen am 23.11.2026). An einer systematisch
übernommenen Maßtabelle besteht ein Datenbankherstellerrecht. Die
Erlaubnis des Betreibers („von cd darf ich alles nehmen") betrifft die
Verwendung auf der Webseite, nicht die Veröffentlichung der
Quelldateien. Wer die Zahlen braucht, lädt die Dokumente in der
Sitzung neu; wo sie stehen, sagt `docs/vd-quellen.md`.

**Was in dieser Runde an Seiten geändert wurde:** Terrassendach und
SkyView, Carport, Pergola, Kaltwintergarten, Sonnenschutz, Eingang,
Balkon und Fassade, Geländer, Sichtschutz, Gartenhaus,
Fahrradüberdachung, Bushaltestelle, Velaris. Dazu der Baustein
`src/_includes/eindeck-karten.njk` und die Materialkarten in
`src/css/style.css`.

**Der nächste Schritt ist Schritt 2 zu Ende bringen:** jeden berührten
Fachbereich mit genau einem lesenden Prüfer, in der festen Reihenfolge
aus `docs/PRUEFER_REIHENFOLGE.md`. Jeder Prüfauftrag nennt die
geänderten Dateien, sonst liest der Prüfer das halbe Repository.

## 5. Wo was steht

| Datei | Wofür |
|---|---|
| `CLAUDE.md` | Grundregeln, Freigaberegel, Bestandsschutz |
| `docs/SESSION_HANDOFF.md` | Letzter Stand der Sitzungen |
| `docs/entscheidungen.md` | Logbuch – **durchsuchen, nicht lesen** |
| `docs/pruefungen.md` | Welche Prüfskripte es gibt, was sie prüfen |
| `docs/WEBSITE_AGENT_WORKFLOW.md` | Welcher Agent wofür, wann **keiner** |
| `docs/WEBSITE_DESIGN_SYSTEM.md` | Palette, Manrope, Kontraste, Fokusringe |
| `docs/WEBSITE_STAGING.md` | Vorschau – Anforderungen und was fehlt |
| `docs/AUDIT-CUSTOMER-JOURNEY.md` | Erster Audit: Weg bis zur Anfrage, 8 Befunde, nichts geändert |
| `docs/arbeitsweise.md` | Branch, Cache-Buster, Konfliktmarken |
| `docs/zahlen-lesen.md` | Messdaten abfragen, die drei Fallen |
| `docs/offene-fragen.md` | Fragen an den Betreiber, offen und beantwortet |
| `docs/offene-nebenbefunde.md` | Offen, aber nicht dringend |
| `docs/vd-quellen.md` | Wo beim Hersteller was steht, Katalogseiten |
| `docs/PRUEFER_REIHENFOLGE.md` | Welcher Prüfer wann, in welcher Folge |
