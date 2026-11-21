# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach `CLAUDE.md`.
> **Stand: 13.11.2026.** Der vorherige Einstieg (Stand 07.11.) liegt
> vollständig in `docs/erledigt-archiv.md`.

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

Nichts ist halbfertig liegen geblieben. Alle Prüfungen waren zuletzt
grün (Stand siehe `docs/SESSION_HANDOFF.md`).

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

105 Dateien gegenüber `main`. Grob:

| Was | Wo | Status |
|---|---|---|
| Neubau-Entwürfe | `entwurf-bv.html`, `entwurf-apple.html`, `entwurf-produkt.html`, `entwurf/*.css` | wartet auf den Freigabesatz |
| XSS-Korrektur | `werkstatt/zahlen.html` | siehe Abschnitt 1 |
| Neue Texte | `index.html`, `produkte/*`, `ratgeber/*` | entdenglischt, nicht freigegeben |
| Agentensystem | `.claude/agents/*` (18 Dateien) | fertig, nur Konfiguration |
| Designsystem | `docs/WEBSITE_*.md` | fertig, Palette freigegeben |

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

### Werkzeuge

| # | Punkt |
|---|---|
| ~~3.14~~ | **Erledigt am 21.11.2026.** Die Gegenprobe von `pruefe-broschuere.mjs` lief über 29 Minuten und wurde deshalb übersprungen. Sie läuft jetzt vierfach nebeneinander: gemessen 9 Minuten, alle 42 eingebauten Fehler werden bemerkt. Siehe `docs/entscheidungen.md` |
| 3.15 | **18 Prüfskripte** hatten den Browserpfad fest eingebaut – repariert am 12.11. (`chromeIn()`), ist in `main` |
| 3.16 | **ZIP der geänderten Dateien** aus der Broschüren-Aufgabe – seit längerem zugesagt, nie geliefert |

---

## Offen beim Betreiber: vier Entwurfsseiten (15.11.2026)

`entwurf.html`, `entwurf-bv.html`, `entwurf-apple.html` und
`entwurf-produkt.html` sind öffentlich abrufbar, laden Schriften direkt
von Google und zeigen kein Einwilligungsbanner. Gemessen am
15.11.2026, Einzelheiten in `docs/rechtstexte-befunde.md`.

**Erledigt am 15.11.2026.** Nicht gelöscht, weil die Entwürfe zum
Neubau gehören und in sieben Dokumenten stehen. Stattdessen laden sie
die Schriften jetzt erst nach der Einwilligung. Einzelheiten in
`docs/rechtstexte-befunde.md`.

## Ortsseiten: Schritt 2 ist das Quiz (15.11.2026)

Schritt 1 ist erledigt und committet: Verlinkung, Kontrast, Übergabe
der Produktwahl. Einzelheiten in `docs/entscheidungen.md`, Eintrag vom
15.11.2026.

**Was als Nächstes gebaut wird.** Ein kurzer Anfrageweg auf der
Ortsseite selbst: höchstens drei bis vier Fragen, danach absendbar,
ohne Seitenwechsel. Vorgeschlagene erste Frage, von zwei Prüfern
unabhängig empfohlen: „Wofür soll der Carport vor allem sein?"

**Dafür zu klären, bevor gebaut wird:**
- `js/anfrage-wizard.js` hängt an `.anfrage-wizard` und den IDs
  `awTitle`, `awSub`, `awProgressBar`, `awBody`, `awNav`, `awBack`,
  `awNext`. Auf einer Ortsseite gibt es keines davon.
- Das Skript liest Vorgaben nur aus `sessionStorage`, nicht aus einem
  Datenattribut. Auf derselben Seite braucht es einen anderen Weg.
- Die Sticky-Leiste und der eingebettete Assistent dürfen sich nicht
  verdecken.
- `id="kontakt"` müsste auf der Ortsseite liegen, sonst springen die
  fünf vorhandenen `/#kontakt`-Links weiterhin weg.

**Drei Entscheidungen liegen beim Betreiber:**
1. Sollen die sieben fehlenden Orte in die Fußzeile
   (`src/_includes/layout.njk:190-195`)? Dagegen spricht eine
   Linkwand auf jeder Seite.
2. Soll der Ort aus dem Dateinamen das Ortsfeld vorbelegen? Dagegen
   spricht, dass der Ort eine Suchabsicht ist und keine Adresse.
3. Die sieben Terrassenüberdachungs-Ortsseiten geben keine
   Produktwahl mit, weil `PRODUKTWEGE` nur `terrassendach-tds` und
   `flachdach-skyview` kennt. Entweder einen gemeinsamen Schlüssel im
   Assistenten anlegen oder es so lassen.

## 4. Der nächste sinnvolle Arbeitsschritt

> **Hinweis:** Der Betreiber arbeitet eine Folge von fünf Aufträgen ab.
> Auftrag 1 (Staging-Plan) ist fertig. Kommt ein neuer Auftrag, hat der
> Vorrang vor dem Vorschlag unten – und es gilt der Fokusmodus aus
> `CLAUDE.md`: nur der beauftragte Umfang.

**Der erste echte Audit.** Alles bisher war Vorbereitung: Agenten,
Designsystem, Palette. Jetzt wäre der erste abgegrenzte Prüfauftrag
dran.

Vorschlag: `customer-journey-architect` auf der Startseite. Der
beantwortet, ob Besucher überhaupt verstehen, was angeboten wird – die
Frage, die vor jeder Gestaltung kommt.

**Vorher in die Zahlen sehen** (`docs/zahlen-lesen.md`). Drei Fallen
dort beachten, besonders: Unter rund 100 Aufrufen je Seite ist jede
Aussage über diese Seite geraten.

**Ein Agent, nicht mehrere.** Siehe `docs/WEBSITE_AGENT_WORKFLOW.md`.

---

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

## Beim Betreiber (Stand 14.11.2026)

- **Produktbilder.** Der Betreiber ersetzt spaeter die Bilder **aller**
  Produkte. Bis dahin keine Arbeit an Bildzuschnitten, Bildgroessen
  oder Galerie-Reihenfolge investieren, das waere doppelt. Wenn die
  neuen Bilder kommen: Dateinamen und `srcset`/`sizes` pruefen,
  `js/main.js` (`lightboxImages`) mitziehen,
  `scripts/pruefe-referenz-galerie.mjs` laufen lassen (hieß bis zum
  19.11.2026 `pruefe-galerie.mjs`; dieser Name gehört jetzt den
  Produkt-Galerien).
- **Vektorlogos** kommen, wenn alles fertig ist.
- **Fuenf Sterne** im Bewertungskasten: fest eingebaut, ohne Quelle.
  Vor einer Veroeffentlichung entfernen oder durch die echte
  Google-Bewertung ersetzen.
- **Einverstaendnis des Hauseigentuemers** fuer die beiden
  Carport-Fotos, dazu Ort und Dachmaterial.
- **Statik auf den sieben Produktseiten.** Dort steht weiterhin
  „Statiknachweis inklusive". Auf der Startseite steht seit 14.11.2026
  „vereinfachte Statik". Angleichen, sobald freigegeben.
- **Telefonnummer-Pflicht** im Formular: Geschaeftsentscheidung.

## Spaeter pruefen (Nebenbefunde 14.11.2026)

- **Vier JavaScript-Dateien ohne Cache-Buster.** `metricool.js`,
  `cookie.js` und `accessibility.js` auf je 53 Seiten, `main.js` auf
  52, jeweils **ohne** `?v=`. `_headers` erlaubt bis zu 24 Stunden
  alten Code aus dem Browser-Cache. Eine Aenderung an `cookie.js`
  (Einwilligung!) erreicht wiederkehrende Besucher also bis zu einen
  Tag lang nicht. `scripts/pruefe-cache-buster.sh` findet das nicht,
  weil es nur Dateien prueft, die **schon** ein `?v=` tragen. Zwei
  Dinge waeren zu tun: Versionen ergaenzen und das Skript um eine
  Pruefung „JS/CSS ohne Version" erweitern.
- **`data-i18n` auf der Startseite wirkt nicht.** `index.html` laedt
  `js/i18n.js` gar nicht, und die Attribute haben keine Entsprechung
  in der Tabelle. Die Startseite ist einsprachig. Entweder aufraeumen
  oder die Uebersetzung wirklich anschliessen.
- **Gedankenstriche:** rund 530 Fundstellen auf den uebrigen Seiten,
  dazu 24 Seitentitel. Entscheidung des Betreibers steht aus.
- **Entwurfsseiten** (`entwurf*.html`) tragen die alte Statik-Zusage.
  Nicht verlinkt, aber abrufbar.
- **`js/accessibility.js`** enthaelt das alte Gold `#C49A2A` fest
  verdrahtet.
- **Google-Link beschriftet mit „Bewertungen ansehen"** zeigt auf
  `g.page/r/.../review`, also auf die Abgabe einer Bewertung. Entweder
  Beschriftung oder Ziel angleichen.
- **Drei schwebende Knoepfe** ueberlagern Inhalt, auf allen 56 Seiten.

## Ton: Befunde ohne Auftrag (Prüfschritt 5, 14.11.2026)

Vom Prüfer gefunden, **älter als die Gedankenstrich-Arbeit**, deshalb
nicht angefasst. Erst auf Ansage:

- **Werbesprache in langen Produkttexten.** „eine der vielseitigsten
  Lösungen", „hochwertigen Aluminium-Lamellen", „fügt sich harmonisch
  in jede Architektur ein" (`src/produkte/velaris.njk`), „Billige
  Systeme müssen oft schon nach wenigen Jahren ersetzt werden"
  (`src/ratgeber/terrassenueberdachung-kosten.njk`).
- **„Modelle" oder „Lösungen"?** Der Wechsel wirkt zufällig. Auf
  einigen Seiten steht „Unsere Modelle" doppelt, als Marke und als
  Überschrift.
- **Glas: „opal" gegen „satiniert".** Im Konfigurator heißt dieselbe
  Glasart je nach Stelle anders. Zu klären, welches Wort der
  Hersteller benutzt, dann durchgängig verwenden.
- **Dreierformeln** in Überschriften („Wertsteigernd, pflegeleicht,
  modern") in `fassade.njk`, `gartenhaus.njk`, `sichtschutz.njk`.

## SEO-Befunde beim Betreiber (Prüfschritt 6, 14.11.2026)

- **Titel versprechen mehr als der Text hält.**
  `src/ratgeber/baugenehmigung-terrassenueberdachung.njk` heißt „alle
  Bundesländer", behandelt aber RLP, NRW und Hessen.
  `terrassenueberdachung-kosten.njk` heißt „Preise & Kosten 2026",
  nennt aber bewusst keine Preise. `pergola-kaufen-ratgeber.njk`
  verspricht „Kosten", hat keinen Kostenabschnitt. Entweder Text
  erweitern oder Titel ehrlich fassen. **Titel ändern ist
  Betreibersache.**
- **„CE-zertifiziert" gegen „CE-gekennzeichnet".** Produktseiten sagen
  das eine, `index.html` und `src/zertifikate.njk` das andere. Ob
  „zertifiziert" belegt ist, gehört fachlich geklärt.
- **Velaris heißt vier Dinge:** „Lamellenmarkise" (Schema),
  „Lamellensystem" (Titel), „Einsteuerbare Lamellen" (H1),
  „steuerbares Lamellensystem" (FAQ). Einen Begriff festlegen.
- **Produktkarten tragen H2 statt H3**, auf allen 16 Produktseiten.
  Bestand, nicht neu.
- **60 km oder 50 km?** Sichtbar und im Datenblock steht 60 km.
- **`index.html` Velaris-FAQ verlinkt auf die Pergola-Seite**, obwohl
  es eine eigene Velaris-Seite gibt.
- **`carport-oder-garage.njk`: „Carport ist 3-5× günstiger"** ist eine
  Zahl ohne Beleg auf einer Seite, die sonst keine Preise nennt.

## Höhenermittlung: Stand 19.11.2026

Der Abschnitt steht in der Datenschutzerklärung (Abschnitt 7,
`src/datenschutz.njk`). Eine anwaltliche Prüfung hat der Betreiber am
19.11.2026 abgelehnt, ebenso den technischen Ausweg über eigene
Höhendaten. Beides ist in `docs/entscheidungen.md` festgehalten. Aus
diesem Chat kommt dazu keine rechtliche Bewertung. Nicht erneut
vorschlagen, solange sich nichts ändert.

## Später prüfen: Tageslimit des Höhendienstes

Open Topo Data erlaubt 1000 Abfragen am Tag und eine je Sekunde,
gerechnet über alle Besucher zusammen, weil der eigene Server fragt.
Bei der heutigen Reichweite ist das weit weg, und jede Antwort wird 30
Tage zwischengespeichert. Wird die Grenze doch einmal erreicht, bleibt
das Feld leer und die Seite sagt „bitte von Hand eintragen". Dauerhaft
sauber wäre das eigene Geländemodell des Bundesamts für Kartographie
(DGM200, 34 MB, offene Daten, Erreichbarkeit am 18.11.2026 geprüft).

## Nebenbefunde der Galerie-Prüfrunde (19.11.2026)

Alles gefunden, nichts davon umgesetzt. Reihenfolge nach Nutzen.

1. **Städteseiten durch Eleventy laufen lassen.** Die 14 Seiten sind
   handgepflegtes HTML; der Bilderstreifen muss deshalb von
   `scripts/baue-staedte-galerie.mjs` hineingeschrieben werden. Das ist
   der eigentliche Grund für die zwei Wahrheiten. Abgesichert ist das
   jetzt durch `scripts/pruefe-staedte-galerie.mjs`, aber die Ursache
   bleibt. Umbau rührt 14 gepflegte Seiten an, gehört also in einen
   eigenen Auftrag.
2. **Eigene Fotos ausgeführter Anlagen.** Liegt beim Betreiber. Alle
   59 Galeriebilder sind Renderings des Herstellers; das steht an jeder
   Galerie dabei. Ein einziges eigenes Foto je Produkt wäre mehr wert
   als zehn Renderings, und die Referenz-Galerie der Startseite wartet
   bis heute auf „Weitere Referenzfotos folgen".
3. **Dateinamen der Portfoliobilder** (Hypothese, nicht gemessen).
   Google nennt den Dateinamen als schwaches Signal. `carport-01.webp`
   sagt nichts. Umbenennen kostet Pfade in `galerien.json` und in den
   Seiten und hat ein Rückwegrisiko, wenn Bilder schon indexiert sind.
   Nur lohnend, wenn ohnehin neu benannt wird.
4. **Material im Alternativtext.** Bei 47 der 59 Texte fehlt das Wort
   Aluminium, obwohl es das Produkt ausmacht. Die zwölf, die allein
   nichts sagten, sind geändert; der Rest ist Textarbeit und braucht
   eine Ansage.
5. **Echte Auslieferung messen.** Die Ladezeit-Zahlen vom 19.11. kommen
   von einem lokalen Server ohne Komprimierung, sind also zu hoch. Eine
   belastbare Aussage braucht eine Messung gegen die Vorschau oder die
   Live-Seite, dazu ein Budget je Seite.
6. **Kein Bildbudget.** Eine Städteseite lädt nach dem Scrollen 716 KB.
   Es gibt keine Grenze, gegen die eine Prüfung anschlagen könnte.

## Offen beim Betreiber: mehrere Bilder je Modell (20.11.2026)

Seit dem 20.11. lassen sich die 34 Modellbilder in den Produktkarten
antippen und durchwischen. Gewischt wird dabei durch die **Modelle
einer Seite**, nicht durch mehrere Bilder desselben Modells.

Mehr geht erst, wenn klar ist, welches Portfoliobild welches Modell
zeigt. Die 59 Bilder sind nach Produktgruppe sortiert (Carport,
Terrasse, Pergola), nicht nach Modell (TDS, SkyView, Flat Line). Das
lässt sich nicht erraten; am 19.11. lag genau so eine Zuordnung daneben
und musste korrigiert werden.

**Gebraucht wird vom Betreiber:** je Modell eine Liste, welche
Bilddateien es zeigen. Dann ist der Rest Arbeit von einer Stunde, die
Technik steht.

## Gemessener Altbefund: Startseiten-Galerie ohne Tastatur (20.11.2026)

Die 15 Bilder im Abschnitt „Projekte, die für sich sprechen" öffnen
die Großansicht über `onclick` an einem `<div>`. **Mit der Tastatur
lässt sich kein einziges Bild öffnen.** Das ist WCAG 2.2, 2.1.1,
Stufe A. Gemessen am 20.11.2026 im Browser: 28 Elemente mit `onclick`,
kein `tabindex` an den Bildern.

Der Befund ist alt und hat mit dem Umbau auf Punkte nichts zu tun.

**Warum nicht nebenbei behoben:** Eine saubere Korrektur macht aus
jedem Bild eine `<button>`. In jedem Bild sitzt aber schon eine
Schaltfläche („Referenz BV AussenSysteme"), und verschachtelte
Schaltflächen sind ungültiges HTML. Es braucht also eine Entscheidung,
wie beides nebeneinander funktioniert, und eine Anpassung von
`scripts/pruefe-referenz-galerie.mjs`. Das ist ein eigener Auftrag.
