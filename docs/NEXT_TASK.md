# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach `CLAUDE.md`.
> **Stand: 26.11.2026 (spät).**

## Wo wir stehen (26.11.2026, spät)

**Nichts ist live.** Alles liegt auf dem Arbeitsbranch und der Vorschau
(https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev).
`main` steht seit 12.11.2026 unverändert. Veröffentlicht wird nur mit dem
Satz aus `CLAUDE.md`. **Push auf den Arbeitsbranch ist ohne Rückfrage
erlaubt** (Regel in `CLAUDE.md`, 26.11.2026), alles andere nicht.

**Webseite, heute erledigt** (Einträge in `docs/entscheidungen.md`):
- **B9 Startbild** umgesetzt: Wechsel erst nach Eingabe, Überschrift
  sofort, ruhige Einblendung, Startbild bei reduzierter Bewegung wieder
  sichtbar (war unsichtbar). Vorschau gemessen: LCP 1,4 s statt 9,3 s.
  Prüfung `scripts/pruefe-heldenbereich.mjs` (mit Gegenprobe).
- **Lieferzeit 4 bis 12 Wochen** (Startseite, FAQ, Schema, `llms.txt`).
- **SkyView auch mit 16 mm Polycarbonat** (Produktseite, `llms.txt`).
- **Prüfstand:** volle Suite nach B9: 95 Skripte, 93 grün; rot nur
  `pruefe-konfigurator-oberflaeche.mjs` (Altbefund) und
  `pruefe-cache-buster.sh` (Ursache behoben, einzeln grün). Nach der
  SkyView-Änderung die betroffenen Seitenprüfungen einzeln nachgelaufen,
  alle grün.
- **Als Nächstes auf der Webseite:** B10 bis B13 aus
  `docs/UEBERGABE-VERBESSERUNGEN-2026-11-25.md`, dann Block C.

**Ratgeber (Leadmagnet), in Arbeit:** Plan `docs/ratgeber-plan.md`,
Hausregeln und Ablauf des Agententeams `.claude/skills/ratgeber-pdf/SKILL.md`.
- Ratgeber 1 (Terrassendach & Kaltwintergarten) ist **fertig gesetzt
  (27.11.2026)**: 39 Seiten, fünf Teile mit Auftaktseiten, Raster aus
  Lesespalte und Randspalte, anklickbares Inhaltsverzeichnis (110 interne
  Verweise, alle mit Ziel), 105 Lesezeichen, Knöpfe mit
  `utm_source=ratgeber`, Teil „Preis und Wert", eigene Grafiken. Nur
  Manrope eingebettet, Titel/Autor/Sprache gesetzt, getaggt. Keine Preise.
  Durchlaufen: Redakteur, Lektor, Faktenprüfer (zwei Runden),
  Conversion-Prüfer, Verkaufsstratege, Gestaltungsprüfer mit Abnahme,
  Lesertest. Offen nur noch: eigene Fotos statt der vier Platzhalter
  (S. 2, 15, 18, 38) und die Anwaltspunkte, bevor er an Kunden geht.
- **Arbeitsdateien liegen NUR im Notizordner der Sitzung**
  (`…/scratchpad/ratgeber/`: Text, Faktenbasis, Konzept, Satzprogramm
  `baue-ratgeber.mjs`, `grafiken.mjs`, `lesezeichen.py`, Vorlage,
  Herstellerbilder in hoher Auflösung). Sie gehören ins private Repository
  `bv-marketing` (Ordner `ratgeber/`); dafür braucht es das Ja des
  Betreibers (Push in ein anderes Repository). **Geht die Sitzung verloren
  ohne diesen Schritt, sind sie weg.**
- Danach: Ratgeber 2 (Carport & Vordach), 3 (Pergola & Lamellendach),
  dann Formular, Versand und Kasten auf den Ortsseiten (siehe Plan,
  Freigabe-Hindernisse Anwalt).

**FÜR DEN BETREIBER, WENN ER AM RECHNER IST (Ratgeber-Versand über das CRM, Stand 27.11.2026):**
Brevo ist verworfen: Das CRM verschickt schon über Resend (Absender
info@bv-aussensysteme.de) und hat R2. Ablauf und Schnittstellen im
CRM-Repository `docs/ratgeber.md`, Abstimmung im CRM-Issue #303.
1. Bei Cloudflare im Worker `bvlanding` das Secret `ANFRAGEN_TOKEN` anlegen,
   derselbe Wert wie `ANFRAGEN_TOKEN` im CRM (Einstellungen, Variablen und
   Secrets). NICHT in den Chat kopieren. Erst danach, wenn der CRM-Teil live
   ist, nimmt `/api/ratgeber` Anmeldungen an; vorher antwortet er mit 503
   und die Seite meldet ehrlich einen Fehler.
2. Die drei PDFs in den CRM-Speicher (R2) legen: `ratgeber/terrassendach.pdf`,
   `ratgeber/carport.pdf`, `ratgeber/pergola.pdf`. Die PDFs kommen NICHT ins
   öffentliche Repository.
3. Texte freigeben: Häkchen „Hinweise per E-Mail" (Webseite
   `src/ratgeber/index.njk` und CRM `src/lib/ratgeber.ts`, Fassung
   2026-11-27, Wortlaut muss in beiden gleich bleiben), Link-Mail, Nachfass-Mail.
4. Zum Anwalt: Häkchen-Wortlaut, Nachfass-Mail mit Abmeldelink, geänderte
   Datenschutzerklärung (Resend, R2, Download-Protokoll, Nachfass).
5. Löschfrist für Ratgeber-Anfragen ohne Auftrag festlegen.
6. Danach (eigener Auftrag): Kontaktformular über das CRM, Web3Forms und
   Formspree raus, Datenschutzerklärung entsprechend. Veröffentlicht wird
   weiter nur mit dem Freigabesatz.

**Beim Betreiber offen:**
- Ja zum Ablegen der Ratgeber-Quellen in `bv-marketing`.
- Eigene Fotos für die Platzhalter im Ratgeber (Inhaber, Aufmaß, Winter,
  Montage, Beratung).
- Für den Anwalt (`docs/rechtstexte-befunde.md`): AGB § 3.2 (Dritte)
  gegen „wir montieren selbst"; AGB § 4.4 (Genehmigung holt der Kunde)
  gegen „Bauantrag übernehmen wir gern"; Widerruf-E-Mail; Datenschutz
  Abschnitt 19; Leadmagnet-Einwilligung (Kopplung, Anruf).
- Unbelegt in `llms.txt`: „wetterfest bis Windstärke 8", „direkter
  Händlerpartner von VD".
- Google-Unternehmensprofil: Adresse ausblenden.

**Später prüfen (Nebenbefunde, nichts davon angefasst):**
- Baurecht-Seiten der Webseite: § 62 Abs. 2 Nr. 2 gilt nur für Anbauten
  (freistehend fehlt); „an der Hauswand entfällt der Abstand" und
  „Zustimmung des Nachbarn" sind verkürzt; Hessen: `baugenehmigung` sagt
  30 m², der Ratgeber zur Baugenehmigung „ohne Flächengrenze".
- `src/zertifikate.njk` Z. 72 „nach DIN EN 1090 statisch geprüft"
  (1090 ist keine Statiknorm), Z. 33 „regelmäßig weitergebildete".
- `images/markise.jpg` ist ein Platzhalterbild, `prod_*.jpg` sind
  Bildschirmausschnitte; benutzt nur in `_template.html`.
- Konfigurator: Direktlink mit vorgewähltem Produkt wäre für Ratgeber-Knöpfe
  hilfreich (heute öffnet er mit der Grundeinstellung).
- Hamburger 38 × 28 px, Menü-Kreuz 27 × 39 px; `vorgabeProdukt` in
  `js/anfrage-wizard.js` wird nie benutzt.

**Startauftrag für die nächste Sitzung:** „Lies `CLAUDE.md`, dann diesen
Abschnitt. Wenn die Ratgeber-Quellen noch nicht in `bv-marketing` liegen,
frag mich danach. Dann weiter mit dem, was ich sage. Nach jedem Paket den
geprüften Vorschaulink."

**Ältere Hinweise** (Fallen, Werkzeuge, ausgelagerte Listen) folgen
unten. Ausgelagert, nichts gelöscht: `docs/offene-fragen.md`,
`docs/offene-nebenbefunde.md`, `docs/erledigt-archiv.md`.

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

**Prüfstand:** siehe „Wo wir stehen" oben. Ältere Prüfstände (23. und 25.11.2026) liegen in `docs/erledigt-archiv.md`.

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

### 3.17 Acht belegte Widersprüche, entschieden wird vom Betreiber

Aus dem Prüferdurchgang vom 23.11.2026. **Alle acht sind im Quelltext
belegt, keiner ist Geschmack.**

**Drei davon sind am 23.11.2026 erledigt**, nämlich b, c und d. Sie
betrafen die Garantie, und dort gilt die Ansage „Nicht mehr fragen.
Diese Zahlen stehen fest.“ Damit waren sie keine offene Frage,
sondern eine Vorgabe. Zahlen und Begründung in
`docs/entscheidungen.md`.

**Die übrigen fünf liegen weiter beim Betreiber**, weil sie Texte,
Produktaussagen oder Werbeaussagen sind.

| # | Fundstelle | Was sich widerspricht |
|---|---|---|
| a | `src/_includes/eindeck-karten.njk:81` | Polycarbonat opal heißt dort „am wenigsten Sonnenwärme von außen". Die eigenen Werte im selben Baustein: Polycarbonat opal **54 %** (Zeile 84), VSG opal **52 %** (Zeile 54). Die Aussage ist nach den eigenen Zahlen falsch. Der Baustein steht auf fünf Seiten |
| b | `src/ratgeber/pergola-kaufen-ratgeber.njk:80` | SunPro Plus „mit 5 Jahren Garantie", `pergola.njk:196` sagt „10 Jahre". Nach der Dauerregel gilt bei Alukonstruktion 10 Jahre. Zu klären, ob die 5 Jahre Tuch oder Motor meinen. Dieselbe Zeile sagt „deutsches Qualitätsprodukt", ein Herkunftsversprechen ohne Beleg im Repository **ERLEDIGT 23.11.2026:** Der Ratgeber nennt jetzt 10 Jahre auf die Aluminiumkonstruktion und 2 Jahre auf die Elektrik. „deutsches Qualitätsprodukt“ steht weiter und bleibt offen. |
| c | `src/produkte/pergola.njk:335` | „Bei allen vieren gleich: 10 Jahre Herstellergarantie". Zeile 281 (Lamaxa L50 Tex) sagt „10 Jahre auf die Aluminiumkonstruktion, 5 Jahre auf das Tuch". Die Fußzeile ist nicht falsch, aber unvollständig **ERLEDIGT 23.11.2026:** Die Fußzeile nennt jetzt die Elektrik mit, und der Tuch-Zusatz für das Lamaxa L50 Tex steht am Ende. |
| d | alle Produktseiten mit Elektrik | **Die 2 Jahre auf Elektrik stehen auf keiner Produktseite**, nur im Ratgeber `aluminium-terrasse-pflegen.njk:94`. Verkauft werden Antriebe, Motoren, LED, Lautsprecher und Steuerungen auf Sonnenschutz, Pergola, Terrasse, Eingang und Faltdach. Wer „10 Jahre" neben „motorisierte Lamellen" liest, versteht 10 Jahre auf alles. Bei einem Motorschaden nach drei Jahren entsteht Streit **ERLEDIGT 23.11.2026:** Die 2 Jahre stehen jetzt in 18 Zeilen auf 10 Seiten, überall wo Elektrik verkauft wird. Nicht ergänzt bei Carport, Geländer, Sichtschutz, Fassade, Kaltwintergarten und Velaris, die keine Elektrik führen. Offen bleibt allein die Markisen-Konstruktion, siehe unten. |
| e | `src/produkte/sonnenschutz.njk:224` gegen `:329` | Die Karte sagt Senkrechtbeschattung „bis 6 x 3 m". Die Tabelle nennt „bis 600 x 240 cm oder 300 x 300 cm". 600 x 300 kommt nirgends vor |
| f | `eindeck-karten.njk:66`, `fahrradueberdachung.njk:110` | „hagelfest" bei Polycarbonat, während `terrassenueberdachung.njk:332` nur „hell und bruchfest" sagt und `aluminium-terrasse-pflegen.njk:94` Hagelschäden auf die Gebäudeversicherung verweist. Beim ersten Hagelschaden steht die Zusage gegen den Ratgeber |
| g | `src/produkte/eingang.njk:74` | Das Product-Schema sagt „Vordach FLY, Front Line und TDS … ESG-Glas standard". Sichtbar belegt ist das nur für FLY. Front Line nennt keine Verglasung, TDS nennt „Glas oder Polycarbonat". Das Schema behauptet gegenüber Suchmaschinen mehr, als die Seite trägt |
| h | `src/ratgeber/terrassenueberdachung-kosten.njk` | Im FAQPage-Block weichen **vier von fünf** Antworten im Wortlaut von den sichtbaren `<details>` ab (Zeile 56 bis 60 gegen 118 bis 137). Das ist der Fall, den die Dauerregel „sichtbarer Text und Schema.org zusammen ändern" adressiert |

**Offen geblieben, obwohl es die Garantie betrifft:** `src/produkte/sonnenschutz.njk` nennt an vier Stellen „5 Jahre Herstellergarantie“. Die Elektrikangabe ist dort ergänzt, die 5 Jahre sind unverändert. Ob die Aluminiumkonstruktion einer Gelenkarmmarkise 10 Jahre trägt, sagt die Dauerregel nicht: Sie nennt als Beispiele für „Alu plus Tuch“ das Faltdach und die Pergolamarkise, also Dachkonstruktionen. Eine Erhöhung von 5 auf 10 Jahre **vergrößert** ein Versprechen und wird deshalb nicht geraten. Kommt die Ansage, muss auch die Seitenbeschreibung in Zeile 5 mitgeändert werden, die ebenfalls 5 Jahre nennt.

**Dazu zwei Entscheidungen zur Wegführung, ebenfalls belegt:**

- **`carport.njk:190` und `kaltwintergarten.njk:165`** schicken auf
  `/produkte/terrassenueberdachung.html#eindeckung`. Der Besucher
  landet mitten auf einer fremden Produktseite, ohne Rückweg. **Die
  „Jetzt anfragen"-Knöpfe dort setzen `bv-produktwahl` auf
  `terrassendach-tds`.** Wer vom Carport kommt und dort anfragt,
  startet den Assistenten mit Terrassendach. Das ist eine falsche
  Anfrage im Posteingang. Balkon, Gartenhaus, Bushaltestelle und
  Fahrrad machen es anders und binden den Baustein auf der eigenen
  Seite ein.
- **Terrassenüberdachung, Carport und Kaltwintergarten haben keinen
  Weg zum Baugenehmigungs-Check**, obwohl dort die Genehmigung die
  häufigste Frage ist. Der Kaltwintergarten behauptet „ohne
  Baugenehmigung in den meisten Fällen" (`:136`) und bietet den Check
  nicht an. Die Bushaltestelle sagt „benötigen in der Regel eine
  Baugenehmigung" (`:121`) und verlinkt nur die Windzonen. Umgekehrt
  haben Pergola, Faltdach, Velaris, Gartenhaus und Eingang den Check,
  aber keinen Windzonen-Weg. Sechs Seiten haben keines von beiden.

**Weiter offen, aus derselben Runde, aber kein Widerspruch:** Die
Breadcrumb-Position 2 heißt auf allen 16 Produktseiten „Produkte",
sichtbar steht „Leistungen", und das Ziel ist `/#leistungen`. Eine
Seite „Produkte" gibt es nicht. Welcher Name bleibt, ist eine Ansage.

### 3.18 Stehende Kopfleiste im Querformat: eine Entscheidung

Die Kopfleiste bleibt seit dem 24.11.2026 beim Scrollen oben stehen
(Wunsch des Betreibers). Gemessen, was sie zusammen mit der
Anfrageleiste unten dauerhaft belegt:

| Bildschirm | belegt | Inhalt bleibt |
|---|---|---|
| 390 × 844 (üblich) | 137 px = 16 % | 707 px |
| 320 × 568 (kleines Handy) | 137 px = 24 % | 431 px |
| 844 × 390 (Handy quer) | 138 px = 35 % | 252 px |
| 320 × 256 (Reflow-Prüfmaß, 400 % Zoom) | 137 px = 54 % | 119 px |

Die ersten zwei Zeilen sind unauffällig. Die letzten zwei sind eng.
**Kein gemessener WCAG-Verstoß**, deshalb nicht eigenmächtig geändert:
Sprungmarken und Tastaturfokus sind nachweislich frei (0 von 70
Haltepunkten verdeckt), der Inhalt scrollt weiter.

Drei Möglichkeiten, der Betreiber entscheidet:

1. **So lassen.** Der Wunsch ist erfüllt, die Zahlen sind nur im
   Querformat unbequem, und wer am Handy quer liest, dreht meist
   zurück.
2. **Im Querformat nicht stehend.** Eine Regel
   `@media (orientation: landscape) and (max-height: 500px)` nimmt
   das Stehenbleiben dort heraus. Kleinste Änderung, drei Zeilen.
   Nachteil: Das Verhalten ist dann nicht überall gleich.
3. **Leiste schrumpft beim Herunterscrollen** (Logo kleiner, Polster
   weg) und wächst beim Hochscrollen. Spart etwa 20 px, braucht
   JavaScript und einen Prüflauf. Der Betreiber wollte ausdrücklich
   nichts, was sich wegklicken lässt; schrumpfen ist kein Wegklicken,
   aber es bewegt sich.

Empfehlung: Möglichkeit 1, bis es jemand bemerkt. Die Zahl, die
dagegen sprechen würde, wäre der Anteil Besucher im Querformat. Der
liegt in den eigenen Messdaten, siehe `docs/zahlen-lesen.md`, und ist
noch nicht abgefragt.

### 3.19 Knopfsymbole: drei Entscheidungen des Betreibers

Am 25.11.2026 tragen **436 von 439 Knöpfen** auf 60 Seiten ein
Symbol (Ansage: „Stelle sicher das vor jedem button … ein icon is").
Drei Punkte blieben bewusst offen.

**a) Die zwei Knöpfe in den Rechtstexten.** „Online-Widerrufsformular
ausfüllen" steht auf **`agb.html`**, „Widerruf absenden" auf
`widerruf.html`. Beide haben kein Symbol. Grund: Die Hausregel vom 14.11.2026 verbietet Änderungen an
`agb`, `datenschutz`, `impressum` und `widerruf`. Ein Symbol wäre
„nur schnell schöner machen", und genau das schließt die Regel aus.
**Wenn der Betreiber sie trotzdem will, ist es eine Zeile je Knopf.**

**b) Wiederholte Knopflisten.** Die Gestaltungsprüfung hält es für
unruhig, wenn fünf „Details zu …"-Knöpfe untereinander alle denselben
Pfeil tragen, etwa auf `garten-aussenbereich`. Ihr Vorschlag: solche
Listen ausnehmen und Symbole nur bei den Hauptaktionen behalten
(Anfrage, Termin, Download). Dagegen steht die wörtliche Ansage „vor
jedem button". Als Wirkungsaussage ist beides **Hypothese ohne
Daten**.

**c) Zwei alte Knöpfe in `index.html`** (Zeilen 633, 1716, 2237)
tragen ihr Symbol als `<svg>` mit Inline-Stil statt mit der Klasse
`btn-icon`. Sie sehen gleich aus, folgen aber nicht derselben Regel.
Kosmetisch, nicht dringend.

**Später prüfen:** Ob die Knöpfe in Produktkarten bei 360 px
umbrechen und das Symbol dabei oben hängen bleibt. Das gehört nach
`scripts/pruefe-mitwachsend.mjs` und ist bisher nicht abgedeckt.

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

## 4. Was gerade läuft: die Lieferanten-Runde

Auftrag des Betreibers vom 23.11.2026, in vier Schritten:

1. **Alle Inhalte vom Hersteller holen** – erledigt. 26 Produktseiten,
   zwei Themenseiten und fünf Dokumente gelesen, darunter der
   Produktkatalog 2026 mit 96 Seiten. Wegweiser: `docs/vd-quellen.md`.
2. **Zu unserem System umschreiben, prüfen lassen, verbessern** –
   inhaltlich fertig, **Prüferdurchgang am 23.11.2026 erledigt.** Alle
   neun berührten Fachbereiche sind gelaufen, je ein lesender Prüfer,
   in der Reihenfolge aus `docs/PRUEFER_REIHENFOLGE.md`. Die 10 und
   11 laufen erst vor einer Veröffentlichung.
   **Vier gemessene Fehler wurden behoben** (Fokusringe und
   Cookie-Schalter, Zahlen in `docs/entscheidungen.md`). **Offen ist
   nur noch Inhaltliches**, und das liegt beim Betreiber: siehe
   Abschnitt 3.17 unten. Nebenbefunde in
   `docs/offene-nebenbefunde.md`.
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

**Der nächste Schritt ist Schritt 4: am Design arbeiten** mit den
UI/UX-Skills. Schritt 2 ist abgeschlossen, Schritt 3 läuft mit.

**Vorher braucht es eine Ansage zu 3.17** (Abschnitt 3 oben). Dort
stehen acht inhaltliche Widersprüche, die die Prüfer belegt haben und
die ohne den Betreiber niemand ändern darf. Zwei betreffen die
Garantie, einer schickt eine falsche Produktwahl in den
Anfrage-Assistenten.

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
