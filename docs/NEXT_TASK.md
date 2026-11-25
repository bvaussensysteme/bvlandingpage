# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach `CLAUDE.md`.
> **Stand: 25.11.2026.**
>
> **WAS ALS NÄCHSTES ANSTEHT, steht nicht hier, sondern in
> `docs/UEBERGABE-VERBESSERUNGEN-2026-11-25.md`.** Das ist der
> Arbeitsauftrag aus dem Volldurchgang vom 25.11.2026 mit zehn
> Prüfern: Block A gemessene Fehler zum Beheben, Block B
> Entscheidungen des Betreibers, Block C größere Umbauten. Dort
> anfangen. **Dringend und beim Betreiber offen: B1, das
> Online-Widerrufsformular lässt sich nicht absenden, auch live.**
> Dieser Einstieg hier bleibt für Startschritte, Fallen und die
> älteren offenen Punkte.
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

**Stand der Prüfungen am 23.11.2026, ehrlich.** Es sind **82 Skripte**
(48 `.mjs`, 21 `.js`, 9 `.sh`, 4 `.py`). Zuletzt vollständig gelaufen
am 23.11.2026 nach den Garantie- und Überlaufkorrekturen: **80 grün,
2 rot.** Beide Roten sind Altbefunde:
`pruefe-konfigurator-oberflaeche.mjs` (1 von 182 Teilprüfungen) und
`pruefe-schrittwechsel.mjs` (Altbefund B3, flackert, siehe unten).

**Ein Runner muss alle vier Endungen abdecken.** `.js` mit `node`,
nicht nur `.mjs`. Zwei selbst geschriebene Läufe an diesem Tag haben
die 21 `.js`-Skripte stillschweigend übersprungen und hätten
„59 grün" gemeldet, obwohl ein Viertel nicht lief.

Der Rest verhält sich so:

- `pruefe-schrittwechsel.mjs` schlägt fehl. Bekannter Altbefund B3 aus
  `docs/AUDIT-2026-11-22.md`: Am großen Bildschirm rollt beim Klick auf
  „Weiter" die ganze Seite mit. Gemessen am 23.11.2026:
  `pageYOffset 362`, nicht die früher notierten 64 px.
  **Achtung, dieses Skript flackert in beide Richtungen.** Gemessen am
  23.11.2026 über zwei unabhängige Läufe: im Reihenlauf einmal grün und
  einmal rot, einzeln achtmal gefahren mit **sechs rot und zwei grün**.
  Weder ein grüner noch ein roter Einzellauf beweist etwas. Der Befund
  selbst ist offen, die Meldung lautet immer gleich
  (`pageYOffset 362`). Einzelheiten in `docs/offene-nebenbefunde.md`.
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

## Prüfstand vom 25.11.2026

**83 Skripte, 81 grün, 2 rot, 0 übersprungen.** Rot sind allein die
zwei bekannten Dauerbefunde: `pruefe-konfigurator-oberflaeche.mjs`
(1 von 182, „Der Zeiger auf dem Schild ändert das Bild") und
`pruefe-schrittwechsel.mjs` (Altbefund B3).

Auf der Vorschau gegengeprüft, nicht nur lokal:

| | Handy 390 | 700 px | Rechner 1280 |
|---|---|---|---|
| Knöpfe im Heldenbereich | **3** | 6 | 6 |
| Knopfhöhe, alle einzeilig | 52 px | 52 px | 56 px |
| Vertrauenszeile | sichtbar | sichtbar | sichtbar |
| Kopfleiste | 66 px, bleibt stehen | 66 px, bleibt stehen | 72 px, bleibt stehen |
| waagerechtes Scrollen | nein | nein | nein |

Die drei Knöpfe am Handy sind „Kostenlos anfragen", „Anrufen",
„WhatsApp", in dieser Reihenfolge.

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

## Pausiert am 25.11.2026 abends (Paket B1 fertig, A1 bis A3 vorbereitet)

- **B1 erledigt** auf dem Arbeitsbranch: `_headers` form-action erweitert,
  auf der Vorschau gemessen, Prüfer 2 und 3 gelaufen. Folgebefunde in
  `docs/rechtstexte-befunde.md` (Danke-Seite sagt „Anfrage", Labels ohne
  `for`), beide brauchen eine Ansage, weil Rechtstext.
- **Volle Suite nach B1 bis A3 (25.11.2026 abends): 87 Skripte, 86 grün,** rot nur der Altbefund `pruefe-konfigurator-oberflaeche.mjs` (1 von 182, Zeiger auf dem Schild).
  bei Skript 19 von 84 angehalten, bis dahin 0 rot. Nachholen.
- **A1 angewendet (25.11.2026 abends), siehe entscheidungen.md.** War: `python3 scripts/umbau-a1-ortsseiten-kopf.py . --schreiben`
  ersetzt in den 14 Ortsseiten und `danke.html` den Kopf durch die
  Leiste der Vorlage, gibt dem Schlussknopf seinen Text zurück und lädt
  in `danke.html` `main.js` nach. An einer Kopie gemessen: Kontrast
  1,07:1 auf mindestens 6,61:1, Handy-Menü da, Leiste bleibt stehen.
  `scripts/pruefe-ortsseiten-kopf.mjs` ist **absichtlich rot**, bis A1
  angewendet ist (vorher 15 von 15 Seiten rot). Danach Cache-Buster,
  Prüfer, Suite, Vorschau.
- **A2** nur eine Zeile: `js/anfrage-wizard.js:1141`, Wortlaut in der
  Übergabe; Version `20261122o` in 54 Dateien hochzählen.
- **A3** zusätzlich gefunden: `ctaMain.textContent` in
  `src/baugenehmigung.njk:1182` löscht das Symbol des Knopfs. Symbol
  erhalten, `href` auf `/#kontakt`, `bv-produktwahl` nur für `carport`
  und `kaltwintergarten`. Die anderen drei beim Betreiber erfragen.
- **A2 erledigt** (25.11.2026 abends).
- **Später prüfen:** Hamburger 38 × 28 px, Schließen-Kreuz 27 × 39 px auf
  allen Seiten. Pflichtgrenze 24 × 24 erfüllt, Empfehlung 44 × 44 nicht.
  Gestaltung, also mit dem Betreiber.
- **A3 erledigt** bis auf drei Fragen an den Betreiber (Zuordnung der
  Chips Terrassenüberdachung, Glasschiebewand, Pergola / Markise).
- **A4 erledigt** (25.11.2026 abends), Prüfung `scripts/pruefe-assistent-tastatur.mjs`.
- **A6 bis A9 erledigt**, **A5 wartet** auf eine Gestaltungsentscheidung (Kreuz überdeckt WhatsApp-Knopf am Handy, 320 px ragt links heraus).
