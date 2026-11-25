# Übergabe: Verbesserungen nach dem Volldurchgang vom 25.11.2026

> **Für wen:** das nächste Modell, das an der BV-AussenSysteme-Webseite
> weiterarbeitet. Diese Datei ist ein fertiger Arbeitsauftrag und
> kommt ohne den Chat aus, in dem sie entstand.
>
> **Woher:** Am 25.11.2026 liefen zehn Prüfer, einer je Fachbereich,
> in der Reihenfolge aus `docs/PRUEFER_REIHENFOLGE.md` über die ganze
> Seite. Umgesetzt wurde danach **nichts**: Der Betreiber hat
> entschieden, dass die Verbesserungen an das nächste Modell gehen.
> Alles unten ist also offen.

## Startprompt zum Einfügen

```
Lies zuerst CLAUDE.md, dann docs/UEBERGABE-VERBESSERUNGEN-2026-11-25.md
vollständig. Arbeite Block A von oben nach unten ab, ein Paket nach dem
anderen, jedes mit Messung vorher und nachher. Frag mich nach den
Entscheidungen aus Block B, bevor du etwas davon anfasst; fang mit B1
an, das ist dringend. Nichts veröffentlichen, nichts nach main.
Schick mir nach jedem Paket den geprüften Vorschaulink.
```

## 1. Lage in sieben Sätzen

1. Gearbeitet wird nur auf dem Branch
   `claude/bv-aussensysteme-setup-bq7ew4`. Veröffentlicht wird erst
   nach dem wörtlichen Freigabesatz des Betreibers (`CLAUDE.md`).
2. Vorschau, öffentlich und ohne Passwort:
   `https://claude-bv-aussensysteme-setup-bq7ew4-bvlanding.bv-verwaltung.workers.dev`.
   Nach einem Push ein bis zwei Minuten warten und mit `?x=<zufall>`
   abrufen, sonst antwortet der Zwischenspeicher.
3. Stand der Prüfskripte am 25.11.2026: **83 Skripte, 81 grün, 2 rot.**
   Rot sind nur `pruefe-konfigurator-oberflaeche.mjs` (1 von 182, „Der
   Zeiger auf dem Schild ändert das Bild") und
   `pruefe-schrittwechsel.mjs` (Altbefund B3). Alles andere Rote ist
   neu und gehört dir.
4. Starter für alle Skripte: `bash scripts/alle-pruefungen.sh`, etwa
   40 Minuten, Ergebnis in `/tmp/bv-pruefergebnis.txt`.
5. Die Seite hat **gebaute** Seiten (Quelle `src/**/*.njk`, Bau mit
   `npm run build`) und **handgepflegte** HTML-Dateien ohne Quelle:
   `index.html`, 14 Ortsseiten, `konfigurator.html`, `danke.html`,
   `kontakt.html`, `termin.html`, `_template.html`, `werkstatt/*`.
   Eine Änderung an Kopf oder Fuß muss in beide Welten.
6. Rechtstexte (`src/agb.njk`, `src/datenschutz.njk`,
   `src/impressum.njk`, `src/widerruf.njk`) werden nicht angefasst,
   nur gemeldet, gesammelt in `docs/rechtstexte-befunde.md`.
7. Was der Betreiber diese Woche entschieden hat und **nicht wieder
   aufgerollt** wird, steht in Abschnitt 6.

## 2. Fallen, in die diese Woche jemand getreten ist

Jede hat mindestens einen falschen Bericht oder einen Schaden
gekostet. Lies sie, bevor du misst.

**CSS**
- `src/css/start.css` wird nach `src/css/style.css` geladen und
  definiert Marken um: `--dark` (#1a1a1a wird #1D2023), `--radius`
  (10 wird 14 px), `--gold-text`, `--black`. Wer einen Wert in
  `style.css` nachschlägt, sieht nicht, was gerendert wird. Immer den
  berechneten Wert im Browser lesen.
- `.start-premium p` hat das Gewicht (0,1,1) und schlug stillschweigend
  jede einfache Klasse. Behoben mit `:where(.start-premium) p`. Eine
  Restfalle derselben Art liegt bei `start.css:99-101`.
- `overflow-x` darf **nur auf `html`** stehen, nie auf `body`. Am
  Körper macht es `position: sticky` an der Kopfleiste kaputt. Die
  Lösung über `overflow-x: clip` wirkte in Safari vor 16 nicht und ist
  wieder ausgebaut.

**Messen**
- `:focus-visible` gilt nur nach echten Tab-Anschlägen
  (`page.keyboard.press('Tab')`), nicht nach `.focus()` und nicht nach
  einem Mausklick davor.
- `@media (hover: none)` greift in Playwright nur mit
  `isMobile: true, hasTouch: true`.
- Die Anfrageleiste `#stickyCta` ist bis zum Scrollen `display: none`.
  Wer nicht scrollt, misst sie nicht.
- Lokal (`python3 -m http.server`) gibt es keine CSP, keinen Worker,
  keine Kopfzeilen. Die Vorschau hat alle drei. Lokal grün heißt nicht
  Vorschau grün. Auf der Vorschau ist der Konfigurator gesperrt (503).
- **Niemals ein Formular wirklich absenden.** Die Formulare senden aus
  dem Browser direkt an Web3Forms und Formspree, auch von der Vorschau
  aus, und erzeugen echte Mails an den Betrieb. Beim Testen jede
  Anfrage an diese Dienste abfangen und verwerfen
  (`context.route(/web3forms|formspree/i, r => r.abort())`).

**Gegenproben**
- Eine Gegenprobe muss **jede** geänderte Datei zurücknehmen. Am
  24.11. wurden `produkte/` und `css/` zurückgeholt, aber nicht
  `konfigurator.html`; das Ergebnis war das Gegenteil des Wahren und
  ging so an den Betreiber. Vorher `git diff <stand> HEAD --stat`
  lesen.
- Eine Gegenprobe, die nichts entfernt, bestätigt alles. Am 25.11.
  suchte eine nach `/#leistungen`, im Markup stand `#leistungen`.

**Markup**
- Der Inhalt von `#k3dWeiter` in `konfigurator.html` gehört dem
  Skript (`js/konfigurator-3d.js:11071`, `:11078` setzen `innerHTML`).
  Kein Symbol, kein Markup dort einfügen; es steht ein Kommentar.
- Zwischen Symbol und Knopftext kein Leerzeichen. Es ändert
  `textContent`, und Prüfungen vergleichen Beschriftungen.
- `\bbtn\b` trifft auch `vd-carousel-btn`. `btn` muss als eigenes
  Klassenwort gesucht werden.

**Betrieb**
- Die Abrufversion `?v=JJJJMMTT<buchstabe>` steht in
  `src/_includes/layout.njk` **und** in rund 55 HTML-Dateien. Nach
  jeder Änderung an `style.css`, `start.css` oder einer JS-Datei
  hochzählen. `scripts/pruefe-cache-buster.sh` liest Zeitstempel aus
  der Git-Historie und ist deshalb erst **nach dem Commit** grün.
- Kein einzelner CSS-Commit seit dem 22.11. lässt sich mit
  `git revert` zurücknehmen (58 bis 85 Konflikte wegen der
  Versionszeile). Rückweg ist: Quelle ändern, neu bauen.
- Skripte, die ohne Fehler rot werden können: `pruefe-prozess-ringe`
  (Wettlauf, etwa jeder fünfte Lauf), unter Last `pruefe-keil-editor`,
  `pruefe-planken-editor`, `pruefe-freie-planung`, `pruefe-galerie`,
  `pruefe-referenz-lauf`. Ein rotes Ergebnis dort erst nach einem
  Einzellauf glauben. Näheres in `docs/pruefungen.md`.

## 3. Block A: Gemessene Fehler, ohne Rückfrage zu beheben

Diese Punkte fallen unter die Regel „Messbare Fehler sofort überall
beheben" in `CLAUDE.md` oder unter eine feststehende Ansage. Texte,
Gestaltung und Rechtliches gehören **nicht** hierher, die stehen in
Block B. Zeilennummern stammen vom 25.11. und können verrutscht sein;
mit `grep` suchen.

Nach jedem Paket: Messung nachher, betroffene Prüfskripte, die Prüfer
der berührten Fachbereiche (Nummer 3 immer), Eintrag in
`docs/entscheidungen.md`, Commit, Push, Vorschau abrufen, Link an den
Betreiber.

### A1. Kopf der 14 Ortsseiten ist unlesbar, am Handy fehlt das Menü

Das schwerste sichtbare Problem des Durchgangs.

- **Dateien:** alle `carport-*.html`, `pergola-*.html`,
  `terrassenueberdachung-*.html` im Wurzelverzeichnis (14 Stück,
  handgepflegt).
- **Befund, gemessen:** Der Kopf nutzt `.site-header`, `.header-inner`,
  `.main-nav`. Für diese Klassen gibt es in keinem Stilblatt eine
  Regel. Am Rechner: weiße Menüschrift auf `rgb(248,247,244)`,
  **1,07:1**; das weiße Logo ist auf hellem Grund unsichtbar. Am Handy
  (390 px): **0 von 3** Menüpunkten sichtbar, kein Hamburger, kein
  Handy-Menü. Der Kopf ist `static`, bleibt also nicht stehen wie auf
  allen anderen Seiten.
- **Einordnung:** Am Rechner ist das ein Rückschritt des Neubaus (live
  steht dort ein dunkles Logo mit dunkler Schrift). Das fehlende
  Handy-Menü besteht auch live.
- **Dazu auf denselben Seiten:**
  - `href="/#produkte"` im Menü zeigt ins Leere. Die Startseite kennt
    nur `id="leistungen"`.
  - Der Schlussknopf enthält nur ein Symbol und keinen Text
    (`carport-koblenz.html`, etwa Zeile 267).
  - In der Fußzeile fehlen Markisenstoffe, Zertifikate, Pflege und
    Widerruf (35 statt 43 Verweise bei zehn Seiten).
- **Empfohlener Weg (Architekturprüfer):** die 14 Seiten in eine
  Eleventy-Vorlage mit `src/_includes/layout.njk` überführen. Der Kopf
  ist auf allen 14 gleich, der Fuß liegt in zwei Fassungen vor. Das
  behebt alle Punkte auf einmal und entfernt 14 von 20 Handkopien.
- **Woran es brechen kann:** relative Pfade (`images/…`,
  `css/style.css`), `#kontakt` als eigener Abschnitt der Ortsseite
  gegen `/#kontakt`, drei JSON-LD-Blöcke je Seite, die Adressen
  (müssen exakt bleiben, Bestandsschutz). `index.html` und
  `konfigurator.html` **nicht** überführen.
- **Kleinster Weg, falls die Überführung zu groß ist:** das Kopf- und
  Menü-Markup aus `layout.njk` in die 14 Dateien übernehmen. Das
  vermehrt die Handkopien und ist nur die Notlösung.
- **Fertig, wenn:** auf allen 14 Seiten bei 390 und 1280 px der
  Menükontrast mindestens 4,5:1 beträgt, am Handy ein bedienbares Menü
  da ist, die Kopfleiste stehen bleibt, kein Verweis ins Leere führt
  und der Vergleich des gebauten `<main>` mit der alten Datei keine
  inhaltliche Abweichung zeigt.
- **Prüflücke schließen:** `carport-koblenz.html` steht in
  `scripts/pruefe-mitwachsend.mjs:37`, gemeldet wurde nie etwas. Die
  Prüfung muss den Kopf dieser Seiten mitmessen.

### A2. Falsche Garantie im Anfrage-Assistenten

- **Datei:** `js/anfrage-wizard.js`, etwa Zeile 1141.
- **Steht dort:** „10 Jahre auf Aluminium-Produkte und 5 Jahre auf
  Markisen, Antriebe & Elektro".
- **Gilt ohne Rückfrage (`CLAUDE.md`, Abschnitt Garantie):** 10 Jahre
  Aluminium, 5 Jahre Markisen und Tuch, **2 Jahre Elektrik**
  (Antriebe, Motoren, LED, Lautsprecher, Steuerungen).
- **Nur die Zahlen richtigstellen.** Der Rest des Satzes („Bei
  Selbstmontage können Garantie- und Gewährleistungsansprüche
  eingeschränkt sein") ist ein Rechtshinweis und wird nicht
  umformuliert, sondern in `docs/rechtstexte-befunde.md` gemeldet.
- Danach Abrufversion der Datei hochzählen.

### A3. Hauptknopf nach dem Baugenehmigungs-Check führt nicht zum Formular

- **Datei:** `src/baugenehmigung.njk`, etwa Zeile 1183.
- **Befund:** Der Verweis wird als `'/#kontakt?produkt=…'` gebaut.
  Alles nach `#` ist Sprungmarke, eine solche ID gibt es nicht, und
  der Assistent liest keine Adresse.
- **Weg:** Adresse `/#kontakt` lassen und die Produktwahl über
  `bv-produktwahl` mitgeben, so wie es die Produktseiten tun.
- **Fertig, wenn:** der Klick im Browser beim Kontaktabschnitt landet
  und das Produkt vorausgewählt ist.

### A4. Anfrage-Assistent: Tastatur und Vorlesesoftware

Alles in `js/anfrage-wizard.js`, vom Barrierefreiheits-Prüfer im
Browser gemessen. Beim Testen Versand abfangen (Abschnitt 2).

| Befund | WCAG | Stelle |
|---|---|---|
| Nach einer Auswahl per Tastatur fällt der Fokus auf `BODY` (Eindeckung, LED, Lautsprecher, Aufklappfeld, Höhenbezug) | 2.4.3, 3.2.2 | um 1561, 1623–1627, 1660–1710 |
| Gewählt und aufgeklappt nur als CSS-Klasse, kein `aria-pressed`, kein `aria-expanded` | 4.1.2 | um 398, 1249, 1272, 1282 |
| Lupe ist ein `span` mit `tabIndex -1` in einem Knopf; Großansicht per Tastatur nicht zu öffnen, ohne Rolle | 2.1.1, 4.1.2 | um 1256, 1564–1576 |
| Platzhaltertext 3,70:1 (#757575 auf rgb(28,28,29)) | 1.4.3 | um 1304 |
| Kontaktschritt: kein `required` oder `aria-required`, kein `aria-invalid`; nach einem Fehler bleibt der Fokus auf „Weiter", das bemängelte Feld liegt rund 700 px darüber | 3.3.1, 3.3.2 | um 1164–1188, 1730 |

- **Kern der Lösung:** Beim Neuzeichnen eines Schritts den Fokus auf
  das zuvor bediente Element zurücksetzen, Zustände als ARIA
  mitführen.
- **Nicht ändern:** welche Felder Pflicht sind (Entscheidung des
  Betreibers) und den Wortlaut der Sternchen-Erklärung (Text, B).
- **Fertig, wenn:** ein Durchgang nur mit der Tastatur möglich ist,
  ohne dass `document.activeElement` je `body` ist, und die Zustände
  im Zugänglichkeitsbaum stehen. Dafür ein eigenes Prüfskript
  `scripts/pruefe-assistent-tastatur.mjs` mit Gegenprobe anlegen.

### A5. Schließen-Kreuz der Anfrageleiste zu klein

- **Datei:** `src/css/style.css`, `.sticky-close`, etwa Zeile 1691.
- **Gemessen, zweimal:** 14,8 × 21,0 px, verlangt sind 24 × 24 px
  (WCAG 2.5.8).
- Der Prüfer meldete zusätzlich, die Mitte des Kreuzes liege bei
  390 px im WhatsApp-Knopf. Das ließ sich in der Nachmessung **nicht**
  nachstellen; nach der Vergrößerung den Abstand trotzdem messen.
- **Prüflücke schließen:** `scripts/pruefe-mitwachsend.mjs` scrollt
  nicht und sieht die Leiste deshalb nie.

### A6. Marke über der Überschrift in drei Seitenköpfen

- **Gemessen:** 3,52:1 (`rgb(137,96,35)` auf `rgb(11,11,12)`, 12,5 px)
  auf `pflege.html`, `einzugsgebiet.html`, `agb.html`. Zum Vergleich
  Carport: 9,33:1.
- **Ursache:** `src/css/start.css:307` schlägt `style.css:203-205`.
  Die Ausnahmeliste bei `start.css:777-781` kennt `.pflege-hero`,
  `.gebiet-hero` und `.legal-hero` nicht.
- **Weg:** die drei Klassen in die Ausnahmeliste. Das geschieht in
  `start.css`, **nicht** in den Rechtstext-Dateien. Die übrigen
  Rechtstextseiten mitmessen (`datenschutz`, `impressum`, `widerruf`).

### A7. Kontrast in der RAL-Suche des Assistenten

- **Datei:** `src/css/style.css`, um 3718–3720, Grund um 3491.
- **Bisher nur gerechnet:** `var(--muted)` #55595E auf #0B0B0C ergibt
  2,79:1 bei 10,9 px. **Erst im Browser messen**, dann beheben. Bleibt
  es eine Vermutung, wandert es nach `docs/NEXT_TASK.md`.

### A8. Stoffsymbole ohne zugänglichen Text

- **Datei:** `src/stoffe.njk`, um 95–99.
- **Befund:** 159 Symbole sind nur per `title` beschriftet, der am
  Handy nicht abrufbar ist. 0 fokussierbar, 0 mit Rolle oder
  `aria-label`. 53 Tropfen stehen ganz ohne Text, „4/5" und „UPF"
  ohne Erklärung (WCAG 1.1.1).
- **Ohne Rückfrage:** unsichtbaren Text für Vorlesesoftware ergänzen
  (`.sr-only` existiert, `style.css:3187`).
- **Mit Rückfrage (B):** eine sichtbare Legende.

### A9. Kleinere eindeutige Fehler

| Befund | Stelle |
|---|---|
| `aria-label="Mehr entdecken"`, sichtbar steht „Alle Leistungen entdecken" (WCAG 2.5.3) | `index.html`, um 672 |
| `aria-label` auf einem `div` ohne Rolle, wirkungslos | `index.html`, um 2101 |
| Fußzeile der Vorlage: Hachenburg und Limburg zeigen auf `einzugsgebiet.html`, obwohl eigene Ortsseiten existieren; Ransbach-Baumbach fehlt. Richtig steht es in `index.html:2188-2191` | `src/_includes/layout.njk`, um 214–217 |
| Handy-Menü der Vorlage ohne Galerie und FAQ, die Kopfnavigation hat beide | `layout.njk`, um 157–164 gegen 138, 146 |
| `danke.html`: Telefonnummer anders geschrieben als sonst („015678 696609"), WhatsApp-Knopf trägt ein Hörersymbol | `danke.html`, um 91, 97 |
| `galerie-1.webp` lädt sofort (`loading="eager"`), liegt aber weit unter dem ersten Bildschirm: 197 KB | `index.html`, um 1408 |
| Karten laden JPG statt WebP, weil das Skript das `<source>` entfernt: 877 KB, also 61 % des Erstaufrufs | `js/bilder-blaettern.js`, um 93 |
| 173 von 593 Bildern ohne `width` und `height`, davon 108 in `stoffe.html` | `src/stoffe.njk` |
| `lastmod` in der Sitemap höchstens 06.11.2026, obwohl am 22.11. 45 Seiten geändert wurden; `dateModified` der Ratgeber 15.07.2026 | `sitemap.xml`, Ratgeber-Quellen |
| Kommentare behaupten, `start.css` gelte „nur Startseite"; sie lädt auf 51 Seiten | `index.html`, um 476, 498; `start.css:4-14` |
| `_headers:29` sagt, es gebe keinen Cache-Buster; alle 52 Seiten tragen einen | `_headers` |
| Die CSP verbietet `data:`-Bilder, das eigene Stilblatt benutzt welche | `style.css`, um 2279, 3900; `src/baugenehmigung.njk:218-219`; `js/accessibility.js:408` |

Beim letzten Punkt erst auf der **Vorschau** messen, ob etwas sichtbar
fehlt.

### A10. Prüfungen, die fehlen

Der Durchgang hat gezeigt, was 83 Skripte nicht sehen:

1. **Formulare gegen die CSP.** Kein Skript prüft, ob ein Formular
   unter der ausgelieferten Richtlinie überhaupt senden darf. Genau so
   blieb B1 wochenlang unbemerkt. Ein Skript, das auf der Vorschau
   jedes `<form action>` gegen `form-action` hält und nichts absendet.
2. **Ortsseiten.** Kopf, Menü und Verweise der 14 Seiten.
3. **Anfrageleiste.** Messen nach dem Scrollen.
4. **Sprungmarken.** Jeder `href` mit `#` gegen die vorhandenen IDs
   der Zielseite; hätte `/#produkte` und A3 gefunden.

Jedes neue Skript unter `scripts/pruefe-*`, mit `--gegenprobe`, in
`docs/pruefungen.md` eingetragen.

## 4. Block B: Braucht eine Ansage des Betreibers

Nichts hiervon ohne seine Antwort anfassen. Er ist kein Entwickler:
knapp fragen, mit Zahl und Empfehlung, eine Frage nach der anderen.

### B1. DRINGEND: Das Online-Widerrufsformular lässt sich nicht absenden, auch live

- `src/widerruf.njk:38` sendet klassisch an
  `https://api.web3forms.com/submit`. `_headers:14` erlaubt nur
  `form-action 'self'`. Der Browser blockiert das Absenden; der Nutzer
  sieht keine Bestätigung und keine Fehlermeldung.
- Gefahrlos nachgestellt und live lesend bestätigt. In der Historie
  seit mindestens dem 01.11.2026. Alle Belege in
  `docs/rechtstexte-befunde.md`, Eintrag vom 25.11.2026.
- **Dem Betreiber am 25.11. gemeldet, Antwort steht aus.**
- Zwei Wege: (1) `_headers` um `https://api.web3forms.com` bei
  `form-action` erweitern, kein Rechtstext berührt, empfohlen;
  (2) Formular per Skript senden, ändert `src/widerruf.njk` und
  braucht deshalb seine ausdrückliche Ansage.
- Live wirkt beides erst nach einer Veröffentlichung. Ob diese eine
  Korrektur vorab nach `main` soll, entscheidet allein er.
- Keine Rechtsberatung geben. Ob Fristen betroffen sind, klärt sein
  Anwalt.
- Dazu melden: Das Widerrufsformular kommt in `src/datenschutz.njk`
  nicht vor, obwohl es Daten an Web3Forms gibt. Felder ohne
  `autocomplete` und Datumsfelder als Text
  (`src/widerruf.njk:52-70`). Nach dem Absenden landet man auf
  `danke.html` mit „Vielen Dank für Ihre Anfrage".

### B2. Das Wort „Konfigurator", solange der Konfigurator gesperrt ist

Der 3D-Konfigurator ist seit dem 31.10.2026 gesperrt
(`worker/index.js`, `KONFIGURATOR_GESPERRT`). Trotzdem:

- Menüpunkt „Konfigurator" in `index.html` (um 580 und 598) führt zu
  `#kontakt`, nur auf der Startseite.
- Der Schwebeknopf heißt auf jeder Seite „Konfigurator öffnen"
  (`js/konfigurator-widget.js:77-78`) und öffnet den
  Anfrage-Assistenten.
- Dessen erster Schritt fragt „Was möchten Sie konfigurieren?"
  (`js/anfrage-wizard.js:504`).

Frage an ihn: ausblenden, umbenennen (etwa „Anfrage starten") oder so
lassen. Empfehlung: umbenennen, bis das Werkzeug wieder offen ist.

### B3. „Bei Google lesen" öffnet den Schreibdialog

`index.html:1729` trägt dieselbe `/review`-Adresse wie „Bewertung
hinterlassen" in Zeile 1764. Gebraucht wird die Adresse des
Google-Profils. Nicht raten.

### B4. Telefon in der Anfrageleiste

Die Leiste unten (`layout.njk:273-282`) steht auf jeder Seite und trägt
Anfrage und WhatsApp, aber keinen Anruf. Im ganzen `layout.njk` gibt
es einen einzigen `tel:`-Verweis, in der Fußzeile. Ein Telefonknopf in
der Leiste löst den alten Befund B4 („Telefonnummer weit unten") auf
allen Seiten zugleich. Braucht kürzere Beschriftungen, weil zwei
Knöpfe schon 345 von 358 px füllen.

### B5. Vertrauensaussagen ohne Beleg im Repository

Keine davon ändern, nur vorlegen. Unbelegte Tatsachenbehauptungen
sind ein Vertrauens- und ein Rechtsrisiko; die Bewertung liegt beim
Anwalt.

| Aussage | Stelle | Einstufung |
|---|---|---|
| „Alle Produkte CE-gekennzeichnet" | `index.html:1620` | riskant |
| „nach DIN EN 1090 statisch geprüft" | `src/zertifikate.njk:72` | riskant |
| „Unsere Referenzen": 9 von 14 Bildern sind Herstellerbilder, nur per i-Marke kenntlich | `index.html:1401-1516` | riskant |
| „Somfy-Antrieben aus eigener Herstellung" | `src/produkte/sonnenschutz.njk:180` | riskant, missverständlich |
| „erhöht nachweislich den Wiederverkaufswert" | `src/produkte/fassade.njk:234` | riskant |
| „hagelfest" | `src/_includes/eindeck-karten.njk:66` | riskant |
| „deutsches Qualitätsprodukt" | `src/ratgeber/pergola-kaufen-ratgeber.njk:80` | unbelegt |
| „windstabil bis 150 km/h" | `sonnenschutz.njk:238` | unbelegt |
| „Autorisierter Herstellerpartner" | `index.html:1648` | unbelegt, im Repository nur Schulungszertifikate |
| „führender Aluminium-Hersteller" | `index.html:1578` | unbelegt |
| „unser Bestseller", „kein Preisaufschlag" | `terrassenueberdachung.njk:206`, `:180` | unbelegt |
| „Antwort meist in 24 Std." | `index.html:666`, `danke.html:67`, `anfrage-wizard.js:1161` | plausibel, Wochenende ungeklärt |
| „Festpreisangebot" | `carport-limburg.html:204` | prüfen, Grundsatz „keine Preise" |

In Ordnung: Garantie 10/5/2 (`index.html:1610`), „zertifizierte
Installateure" (zwei Zertifikate liegen vor), „9 Produktkategorien",
Bewertungen ohne Sterne. Kein Dark Pattern gefunden: keine
vorangekreuzte Einwilligung, „Nur notwendige" steht vor „Alle
akzeptieren", keine Verknappung.

### B6. Texte, die sich widersprechen oder verschrieben sind

Wird ein sichtbarer Text geändert, muss derselbe Text im
strukturierten Datenblock mit.

- „SunPro Plus oder SunPro Plus", sichtbar und im Schema
  (`index.html:2021` und `:396`, dort zusätzlich „Pergola-Seite .").
- `llms.txt`: Montage „2–4 Wochen" (`:72`) gegen „2 bis 6 Wochen" auf
  der Seite; ein Inhaber (`:9`) gegen GbR mit zwei; „Beispielprojekte"
  (`:90`) gegen „Herstellerdarstellungen"; „Lamaxa L50" doppelt.
- Zwei Standortkoordinaten, knapp 6 km auseinander: Schema
  50.4833/7.8167 (`index.html:120`, alle Ortsseiten) gegen Karte
  50.522/7.764 (`einzugsgebiet.html:343`). Welche stimmt, weiß nur er.
- Kosten-Ratgeber: 4 von 5 FAQ-Antworten weichen zwischen Schema und
  sichtbarem Text ab
  (`src/ratgeber/terrassenueberdachung-kosten.njk:56-59` gegen
  `:119-131`). Derselbe Ratgeber verspricht „Preise 2026" in H1,
  Brotkrume und `headline` und nennt bewusst keine.
- Brotkrume sichtbar „Leistungen", im Schema „Produkte", auf 16
  Seiten.
- Carport und Kaltwintergarten schicken auf
  `terrassenueberdachung.html#eindeckung` (`carport.njk:190`,
  `kaltwintergarten.njk:165`).
- Bildtext „Kostenfaktoren im Überblick" für ein Produktfoto
  (`ratgeber/terrassenueberdachung-kosten.html:209`).
- Fachwörter ohne Erklärung: VSG, opal, 36 dB, Trapezblech,
  „prüffähige Einzelstatik", „Windwiderstandsklasse 3", ZIP (benutzt
  in Zeile 238, erklärt erst in 331), „Shutters".
- Alte Reste aus `docs/NEXT_TASK.md` 3.17.

### B7. Die Ortsseiten sind inhaltlich dünn

Koblenz gegen Neuwied: alle drei FAQ-Antworten wortgleich bis auf den
Ortsnamen, eigen sind etwa 150 Wörter je Seite. Vorschlag des
Suchmaschinenprüfers: je Ort Bauordnung, Lastzone aus dem eigenen
Rechner, eigene FAQ. Dass Suchmaschinen das abwerten, ist eine
**Hypothese**. Großer Aufwand, Texte. Dazu:
`src/einzugsgebiet.njk` verlinkt keine einzige Ortsseite (31 Orte als
`<button>`), die Terrassenüberdachung verlinkt ihre sieben nicht.
`LocalBusiness` auf den Ortsseiten ohne `@id` und Öffnungszeiten.

### B8. Länge des Anfrage-Assistenten, und dass man sie nicht messen kann

- Terrassendach: 12 bis 15 Schritte, Kontakt als vorletzter, 6
  Pflichtfelder plus Einwilligung. Schritt 1 nennt keine Gesamtzahl;
  der Zähler springt („2 von 12", danach „3 von 13"). Den Kurzweg mit
  4 bis 6 Schritten gibt es nur auf Ortsseiten.
- **Messlücke:** Der Assistent meldet nur `anfrage-gesendet`. Start
  und Abbruch je Schritt sind unbekannt. Ob die Länge schadet, ist
  deshalb nicht entscheidbar.
- Mehr messen heißt: die Datenschutzerklärung muss im selben Zug
  mitgeändert werden (`CLAUDE.md`, „Zahlen vor Meinung"). Das ist
  Rechtstext, also Ansage nötig.
- `js/anfrage-wizard.js:164`: `vorgabeProdukt` wird gelesen und nie
  benutzt. Anfrageknöpfe im Hero und am Schluss der Produktseiten
  geben keine Vorauswahl mit (`carport.njk:163`, `:341`), die
  Zubehörknöpfe ebenso.
- Nach dem Absenden: Der Assistent zeigt Nummer und Fotoweg, aber
  nicht die nächsten Schritte; `danke.html` zeigt die Schritte, aber
  keine Nummer. Eine Bestätigungsmail an den Kunden ist im Code nicht
  erkennbar.

### B9. Der Heldenbereich und die Ladezeit

Gemessen gegen die Vorschau, gedrosseltes Handyprofil, ein Durchgang
je Seite:

- Das Heldenbild steht nach 2,66 s. Weil alle 6,5 s das Bild wechselt
  (`js/karussell.js:183-188`), meldet der Browser als letzten
  LCP-Kandidaten **9,31 s**. Vorschlag: Wechsel erst nach der ersten
  Nutzereingabe. Berührt Gestaltung.
- Die Überschrift bleibt bis 4,07 s unsichtbar, weil sie auf Deckkraft
  0 gesetzt wird und auf 17 Skripte wartet (`index.html:452-456`,
  `:550`). Vorschlag: nicht an `DOMContentLoaded` hängen.
- Die Knopfreihe ist erst nach 1140 ms voll da; die Claim-Wörter
  kommen mit Überschwinger, unruhig für die Marke (`index.html:519-533`).
- Vier bildschirmgroße Ebenen laufen dauerhaft mit `hintergrundFahrt`
  (`style.css:4549`), drei davon unsichtbar. Kosten nicht gemessen.

### B10. Gestaltung

- **Kleintext.** `docs/WEBSITE_DESIGN_SYSTEM.md:194` verlangt
  mindestens 14 px. 243 Zeilen in 32 Dateien liegen darunter. Die
  eigenen Marken `--txt-xs` (13 px) und `--txt-2xs` (12 px) verletzen
  die Regel selbst. Lesetext darunter: Einwilligung 13,1 px
  (`style.css:3915`), Merkmalslisten 13,6 px, Vertrauensband 12 px,
  Hinweise im Assistenten 12,5 px, Stoffband 11,5 px.
- **Zu viel gefülltes Gold.** `terrassenueberdachung.njk` hat neun
  `.btn-gold`, gegen die eigene Regel bei `start.css:623-627`.
- **Schwebende Knöpfe** kehren nach 1,2 s Stillstand zurück
  (`js/main.js:382-384`), also beim Lesen. Vorschlag: nur beim
  Hochscrollen zeigen; die Blase weglassen, solange die Anfrageleiste
  steht, weil beide zum selben Ziel führen. Erstbesuch am Handy:
  Cookie-Karte plus Kopfleiste belegen mindestens 57 % der Höhe.
- **Pergola-Vergleichstabelle** am Handy: `min-width: 620px` im rund
  350 px breiten Kasten, zwei von vier Modellen außerhalb, kein
  Wischhinweis (`src/produkte/pergola.njk:80`). Vorschlag: erste
  Spalte festhalten, Randschatten.
- **Startseite am Handy** über 15.000 px. Leistungen (neun Karten
  einspaltig) geschätzt 4.500 px, FAQ mit 19 Fragen 1.500 px. Kontakt
  beginnt bei rund 13.000 px. Vorschläge: Leistungen verdichten, FAQ
  sechs zeigen und den Rest aufklappen, „Ablauf" und „Warum wir" vor
  die Stoffe. Alles Hypothese ohne Daten.
- **Statusleistenfarbe** steht auf dem alten Gold `#C49A2A`
  (`layout.njk:49`, `index.html:56`), die Kopfleiste ist dunkel.
- **Hover am Handy:** 74 von 92 `:hover`-Regeln ohne
  `(hover: hover)`. Im Assistenten bleibt nach dem Antippen der
  Goldrand stehen und sieht wie gewählt aus (`style.css:3672`, `3734`,
  `3886`).
- **Sicherer Rand am iPhone:** kein `viewport-fit=cover`, die
  `env()`-Werte ergeben 0; `.sticky-cta` ohne sicheren Rand.
- **Prozessringe** laufen endlos ab dem Laden statt einmal beim
  Sichtbarwerden (`js/prozess-animation.js:65`, `:93`).
- **Kaum Querverweise zwischen Produkten.** Die Terrassenüberdachung
  verweist nicht auf Sonnenschutz, Kaltwintergarten oder den
  Genehmigungs-Check. `stoffe.html` führt nur zu `/#kontakt`, nicht
  zum Sonnenschutz, und hat keine Brotkrume. `partner.html` hat als
  einzigen Ausgang die Herstellerseite.

### B11. Die Vorschau verhält sich wie die Produktion

- Der Assistent der Vorschau schickt **echte Mails** an die
  Info-Adresse. Die Werkstatt ist dort mit dem Produktionspasswort
  erreichbar. `wrangler.jsonc` hat keinen Vorschau-Block.
- **Im Repository lösbar**, etwa 20 Zeilen plus Gegenprobe: den Host
  `*.workers.dev` erkennen; das Formularskript sendet dann nicht und
  zeigt einen sichtbaren Hinweis; der Worker schreibt bei
  `/api/kontakt` und `/api/teilen` nichts und sperrt `/werkstatt`.
  Das ist ein Eingriff in Worker und Formular, also vorher fragen.
- **Nur der Betreiber:** Cloudflare Access vor die Vorschau-Adressen.

### B12. Sicherheit, soweit sie eine Entscheidung braucht

- Mails gehen aus dem Browser direkt an Web3Forms und Formspree, mit
  öffentlichem Schlüssel; die Bremse im Worker sieht das nie.
  `/api/kontakt` hat keine Pflichtfelder, ein leeres `{}` schreibt eine
  Zeile (`worker/index.js:281-304`). Vorschlag: Turnstile im Formular,
  im Worker geprüft.
- Die Werkstatt-Anmeldung fehlt in `BREMSE_REGELN`
  (`worker/index.js:61-67`), nur 700 ms je Versuch, der Keks ist ein
  fester Hash des Passworts (`:902`). Sie lässt sich einbetten: kein
  `frame-ancestors`, kein `X-Frame-Options` (`:828-834`).
- CSP mit `'unsafe-inline'` und ganz `cdnjs.cloudflare.com`, nötig
  wegen 32 Inline-Handlern in `index.html`. SRI fehlt bei Metricool
  (`js/metricool.js:26`).
- Google Fonts laden ohne Einwilligung, wenn `localStorage` klemmt
  (`index.html:492`, `layout.njk:91`), alter Punkt B2.
- Der Cookie-Hinweis nennt Trustindex (`js/cookie.js:180`), geladen
  wird keins.

### B13. Schon länger offen

`docs/NEXT_TASK.md` 3.17 (inhaltliche Widersprüche), 3.18 (Kopfleiste
im Querformat: 33 bis 35 % der Höhe belegt), 3.19 (zwei Knöpfe in
Rechtstexten ohne Symbol; wiederholte Knopflisten; drei alte Knöpfe
mit Inline-Stil).

## 5. Block C: Größere Umbauten, erst planen

Keiner davon nebenbei. Jeder braucht einen Plan, den der
Architekturprüfer (`cto`) gegenliest, und die Zustimmung des
Betreibers.

1. **Eine Quelle für Kopf und Fuß.** Es gibt fünf Fußzeilen-Fassungen.
   Nach A1 bleiben `index.html`, `konfigurator.html`, `danke.html` als
   Handkopien.
2. **Seitenkopf und Produktkarte einmal anlegen.** Die 16
   Produktseiten definieren `.produkt-hero` und `.produkt-card` je
   selbst, zusammen 496 Zeilen; es gibt 9 Seitenköpfe, 28 Karten- und
   Kastenklassen, 22 eigene Knopfklassen neben `.btn`. Eine gemeinsame
   Klasse behebt A6 an der Wurzel.
3. **Designsystem durchziehen.** Schriftgrößen stehen an 629 Stellen
   als feste Zahl und an 17 als Marke; Abstände 1191 gegen 51; Radien
   211 gegen 45; 581 Inline-Stile. Meiste Altlasten: `style.css` 772,
   `windzonen.njk` 179, `baugenehmigung.njk` 149.
4. **Zwei CSS-Schichten zusammenlegen.** Alle 51 Seiten tragen
   `.start-premium`; der Geltungsbereich ist nur noch Fiktion. Erst
   **nach** dem Einarbeiten von `main`, weil `src/css/style.css`
   Konfliktdatei ist.
5. **Bilder.** `images/` hat 45,9 MB in 840 Dateien, kein AVIF, kein
   `srcset`; 19 von 27 geladenen Bildern sind mehr als doppelt so
   breit wie angezeigt (Carport 2200 px bei 344 px). `stoffe.html`: 53
   PNG mit 5,9 MB und 97 JPG mit 11,9 MB ohne WebP.
6. **Zwischenspeicher.** CSS und JS gelten eine Stunde; mit dem
   vorhandenen Cache-Buster könnten sie ein Jahr mit `immutable`
   gelten (`_headers:31-35`).
7. **`js/anfrage-wizard.js`** (119 KB, 37 KB gzip) lädt auf 51 von 57
   Seiten sofort; ließe sich bis zum ersten Öffnen aufschieben.

## 6. Entschieden, nicht wieder aufrollen

Vom Betreiber in dieser Woche festgelegt. Begründungen in
`docs/entscheidungen.md`.

- Logo bleibt 208 × 32 px. Die Kopfleiste ist 66 px am Handy, 72 px am
  Rechner. Die Tabelle mit kleineren Logogrößen ist Hintergrund, keine
  offene Frage.
- Die Kopfleiste bleibt beim Scrollen stehen, der schwarze Streifen
  darüber scrollt weg.
- Am Handy (bis 699 px) drei Knöpfe im Heldenbereich: Kostenlos
  anfragen, Anrufen, WhatsApp. Ab 700 px alle sechs. Alle Knöpfe
  gleich groß.
- Vor jedem Knopf ein Symbol (436 von 439). Ausnahmen: zwei in
  Rechtstexten, `#k3dWeiter` im Konfigurator.
- Stoffnamen am Handy dauerhaft sichtbar, Band im Anthrazit der
  Kopfzeile.
- Garantie: 10 Jahre Aluminium, 5 Jahre Tuch, 2 Jahre Elektrik.
- Keine Preise auf der Seite. Kein `aggregateRating`. Keine
  Gedankenstriche in sichtbarem Text.

## 7. Vor einer Veröffentlichung

Nur zur Kenntnis; nichts davon ohne den Freigabesatz. Stand der
Punkte aus `docs/AUDIT-2026-11-22.md`:

| Punkt | Stand am 25.11.2026 |
|---|---|
| A1 Merge mit `main` | schlechter: 65 Konflikte statt 63, elf außerhalb erzeugter HTML-Dateien |
| A2 Ratenbegrenzung | teilweise: Bremse im Worker, nur je Instanz, nur im Branch, ohne `/k/*` und Werkstatt |
| A3 Geteilte Datenbanken | offen, siehe B11 |
| A4 Widersprüchliche Zusagen | Garantie auf der Startseite einheitlich; CE und Statik offen, siehe B5; neu A2 |
| A5 Konfigurator 503 | Sperre steht, Sitemap bereinigt; Wort „Konfigurator" offen, siehe B2 |
| A6 Rechtliche Punkte | offen; neu B1 |
| B1 Werkstatt einbettbar | offen |
| B2 Google Fonts | offen |
| B3 Konfigurator-Altbefunde | offen, die zwei roten Skripte |
| B4 Telefon weit unten | offen, siehe B4 hier |
| B5 Ruhezustand der Felder | offen, nicht neu gemessen |
| B6 Zwei Designsprachen | Schrift erledigt; Gold, Radien, Fokusliste teilweise, siehe Block C |

Neu vom Freigabeprüfer:

- **Kein benannter Rückweg.** 0 Tags; der Live-Stand `7db6f7a` steht
  in keiner Doku. Vor einer Veröffentlichung einen Tag setzen und die
  Worker-Fassung notieren.
- **`main` trägt in seiner `CLAUDE.md` weiter „immer auto merge"**; der
  Freigabesatz steht dort nicht. `main` ist ungeschützt.
- **29 Bilder fehlen nach einer Veröffentlichung** (umbenannt oder
  gelöscht), keine Weiterleitung. Beim Auflösen der Konflikte muss
  `src/produkte/sonnenschutz.njk` die Branch-Fassung behalten, sonst
  zeigen 13 Bilder ins Leere.
- Bau- und Deploy-Befehl stehen nur im Cloudflare-Dashboard. Läuft
  dort kein `npm run build`, geht das eingecheckte HTML hinaus.
- `docs/NEUBAU-FREIGABE-CHECKLISTE.md:16-28` nennt Entwurfsseiten, die
  es nicht mehr gibt.

Berichtigte Reihenfolge einer späteren Veröffentlichung: (0) Widerruf
und die Regel auf `main` vorab entscheiden; (1) Freigabesatz;
(2) Rückweg festhalten; (3) offene Punkte aus A und B entscheiden,
dazu die Bildadressen; (4) Vorschau absichern; (5) `main` hereinholen,
auflösen, neu bauen; (6) Versionen hochzählen; (7) alle Prüfskripte
mit Gegenprobe; (8) Vorschau selbst abrufen; (9) Betreiber bestätigt
erneut; (10) erst dann nach `main`; (11) Nachkontrolle; (12) Messdaten
nullen.

## 8. Woher die Befunde stammen

| # | Fachbereich | Skill | gemessen oder gelesen |
|---|---|---|---|
| 1 | Architektur | – | gelesen, eine Browsermessung, `git merge-tree` |
| 2 | Sicherheit | – | gelesen, Kopfzeilen abgerufen |
| 3 | Funktion und Barrierefreiheit | `accessibility-audit` | im Browser gemessen, lokal |
| 4 | Handy | `mobile-native` | nur gelesen und gerechnet |
| 5 | Marke und Konsistenz | `design-critique`, `review-animations` | nur gelesen, Kontraste gerechnet |
| 6 | Suchmaschinen | – | nur gelesen, 12 von 93 JSON-LD-Blöcken |
| 7 | Ladezeit | `animation-performance` | Vorschau gemessen, ein Durchgang; `stoffe.html` nicht |
| 8 | Vertrauen und Hürden | – | nur gelesen, keine Datenbank |
| 9 | Wege durch die Seite | – (Skill-Datei fehlte) | nur gelesen |
| 10 | Freigabereife | – | gelesen, Vorschau und Live per Prüfsumme verglichen |

Vom Hauptagenten nachgemessen: A1 (Kontrast, Menü), A5 (Größe), A6
(Kontrast), B1 (Blockade nachgestellt, live lesend bestätigt), A2 und
B3 (im Code nachgelesen). **Alles andere ist der Bericht eines
Prüfers und vor dem Beheben selbst zu messen.**

Bekannte Schwächen dieses Durchgangs: Der Ladezeit-Lauf blieb auf der
Produktseite hängen. Der Handy- und der Gestaltungsprüfer hatten
keinen Browser. Der Suchmaschinenprüfer hat keinen vollständigen
Linkcheck gemacht. `.claude/skills/web-interface-guidelines/SKILL.md`
existiert nicht, obwohl der Ordner da ist.
