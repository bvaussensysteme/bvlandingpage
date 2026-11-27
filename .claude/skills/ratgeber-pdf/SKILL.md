---
name: ratgeber-pdf
description: Hausregeln, Gestaltung und Bauablauf für die BV-Ratgeber (PDF-Leadmagnete, A4, deutsch). Laden, bevor ein Ratgebertext geschrieben, geprüft oder ein Ratgeber-PDF gesetzt wird.
---

# BV-Ratgeber als PDF

Drei Ratgeber, je etwa 20 bis 28 Seiten A4, nur Deutsch:
1. Terrassendach & Kaltwintergarten (mit Sonnenschutz, Markisen, Seitenwänden)
2. Carport & Vordach
3. Pergola & Lamellendach

Sie werden nach Angabe von Kontaktdaten verschickt (Plan:
`docs/ratgeber-plan.md`). **Keine Preise** (Entscheidung des Betreibers,
26.11.2026). Kein Ausfüllteil: Es ist ein Ratgeber, kein Arbeitsheft.

## 1. Inhaltliche Hausregeln

- **Quellen:** eigene Webseite, eigene Broschüre, vd-alusysteme.de, Ansagen
  des Betreibers, amtliche Gesetzestexte. Nichts erfinden. Fehlender Beleg =
  `[BELEG FEHLT]`, nicht glätten.
- **Feste Angaben des Betreibers** (gehen jeder Quelle vor):
  - Garantie: Aluminium 10 Jahre, Markisen/Tuch 5 Jahre, Elektrik 2 Jahre.
  - Lieferzeit: in der Regel 4 bis 12 Wochen vom Auftrag bis zur Montage.
  - Montage: je nach Größe und Ausstattung 1 bis 3 Tage.
  - Beratung und Aufmaß vor Ort kostenlos.
  - Fundamente macht BV selbst.
  - Licht, Lautsprecher, Antriebe baut BV ein; anschließen muss ein
    zugelassener Elektriker (Kundenseite).
  - Statik: vereinfachter Statiknachweis inklusive; prüffähige Einzelstatik
    gegen Aufpreis. Bauantrag übernimmt BV gern, wo möglich; Kosten für
    Architekt, Statiker, Gebühren trägt der Bauherr.
  - Noch keine eigenen Referenzprojekte: keine erfundenen Projekte, Bilder als
    Herstellerdarstellung kennzeichnen.
- **Sprache:** Sie-Form, keine Gedankenstriche im Text (Zahlenspannen wie
  4–12 erlaubt), kurze Sätze, Fachwort sofort erklärt, keine Werbefloskeln.
- **Verkaufspsychologie, ehrlich:** Nutzen konkret machen, Einwände
  beantworten, Sicherheit durch Wissen, Vergleichbarkeit herstellen
  (Anbieterfragen), pro Kapitel höchstens ein klarer nächster Schritt.
  Verboten: Verknappung, Zeitdruck, Angstmache, erfundene Vertrauenssignale.
- **Recht:** Paragraf nennen, Stand nennen, „ersetzt keine Auskunft des
  Bauamts". Nie „rechtssicher" oder „garantiert".
- **Fremdes:** keine Texte, Bilder, Namen oder Gestaltung von Wettbewerbern.

## 2. Gestaltung

Verbindlich: `docs/WEBSITE_DESIGN_SYSTEM.md` (Neubau-Palette).

**Seitengestaltung „Leitsatz" (vom Betreiber gewählt am 27.11.2026):**
große Aussagen in Manrope 800, starke Größenkontraste, große goldene
Kapitelziffern, asymmetrische Seiten, Wechsel zwischen weißen und
anthrazitfarbenen Seiten, Bilder randabfallend. Keine Schatten, keine
Verläufe, keine Karten mit Rahmen oder runden Ecken. Titel: Anthrazitfläche
oben mit dem länglichen weiß-goldenen Logo mittig, Foto unten randabfallend.
Vorlage: `varianten/gestaltungen.mjs`, Funktion `variantB`.

| Rolle | Wert |
|---|---|
| Gold (Fläche, Linie) | `#C58A32` |
| Gold als Text auf hell | `#896023` |
| Helles Gold auf dunkel | `#D9AB64` |
| Anthrazit | `#1D2023` |
| Graphit | `#34383C` |
| Warmweiß (Papier) | `#F8F7F4` |
| Steingrau (Kästen) | `#E9E7E2` |
| Schrift | Manrope (OFL), eingebettet, keine Schnitte unter 400 |

- **Format** A4, 210 × 297 mm. Ränder innen 18 mm, außen 16 mm, oben 20 mm,
  unten 22 mm (Fußzeile). 12-Spalten-Raster.
- **Schriftgrößen:** Fließtext 10,5 pt / 1,55; Zwischentitel 13 pt 700;
  Kapiteltitel 26 bis 30 pt 800; Marginalien und Bildunterschriften 8,5 pt;
  Kapitelnummer groß in Gold. Höchstens drei Größen je Seite.
- **Seitentypen:** Titel (vollflächiges Foto, Logo, Titel), Kapitelauftakt
  (großes Foto, Nummer, Frage), Textseite (zweispaltig oder Text mit
  Randspalte), Vergleichsseite (Tabelle), Merkkasten-Seite, Rückseite.
- **Bausteine:** Merkkasten „Gut zu wissen", Praxistipp, Fehlerwarnung (ohne
  Angstfarben: Anthrazit-Kasten mit goldener Linie), Kennzahl groß,
  Vergleichstabelle, Link-Knopf (Goldfläche, Text Tiefschwarz `#0B0B0C`).
- **Bilder:** nur echte Fotos (Hersteller oder eigene), keine KI-Bilder.
  Herstellerbilder in der Bildunterschrift oder im Impressum kennzeichnen.
  Platzhalter für eigene Fotos sichtbar als solche markieren.
- **Logo** unverändert aus `images/logo-*.svg`, nicht umfärben.

## 3. Technik

- Quelle: eine HTML-Datei je Ratgeber, jede Seite ein `<section class="seite">`
  mit fester A4-Größe. Schrift lokal per `@font-face` (WOFF2), kein Netz.
- PDF mit Playwright/Chromium: `page.pdf({ format: 'A4',
  printBackground: true, preferCSSPageSize: true, outline: true,
  tagged: true })`. `outline` erzeugt Lesezeichen aus den Überschriften,
  `tagged` die Struktur für Vorleseprogramme.
- **Inhaltsverzeichnis anklickbar:** `<a href="#kapitel-3">` auf
  `id="kapitel-3"`. Jede Seite hat in der Fußzeile „Zum Inhalt".
- **Externe Knöpfe** immer mit
  `?utm_source=ratgeber&utm_medium=pdf&utm_campaign=<ratgeber-kurzname>`.
  Ziele: `/konfigurator.html`, `/#kontakt`, `/windzonen.html`,
  `/baugenehmigung.html`, `/stoffe.html`, `tel:`, `https://wa.me/`, `mailto:`.
- PDF-Metadaten: Titel, Autor „BV AussenSysteme", Sprache `de`.

**Werkzeuge (Ordner `ratgeber/` in `bv-marketing`, Stand 26.11.2026):**
- `baue-ratgeber.mjs <text.md> <ausgabe> [--entwurf]`: setzt Text mit
  Satzkennzeichen ([BILD], [GRAFIK], [KNOPF], [ZAHL], [LINK],
  [FOTO-PLATZHALTER], `{#anker}`) in die Vorlage, Seitentypen Titel,
  Vorwort, Inhalt, Teilauftakt, Textseite, Vergleich, Merkseite, Rückseite.
  **Seitenraster:** Lesespalte (ca. 115 mm) plus Randspalte (48 mm) für
  Kästen und Kennzahlen; Tabellen, Grafiken, Bildreihen über volle Breite.
  **Satzautomatik:** Läuft eine Seite über, wandert der Rest auf eine
  Folgeseite; danach werden Seitenzahlen und Inhaltsverzeichnis neu
  berechnet. Ziel bleibt trotzdem, dass jede Seite ohne Folgeseite passt
  (`fuellstand.mjs` misst den Füllstand je Seite).
- `lesezeichen.py`: korrigiert die Lesezeichentitel (Chromium verschluckt
  Leerzeichen an Zeilenumbrüchen) und setzt Titel, Autor, Sprache.
- `grafiken.mjs`: eigene Grafiken (Farbtafel, zwei Angebote, Schnitt,
  Kosten je Nutzungsjahr, Garantie/Gewährleistung).
- Schrift: feste Manrope-Schnitte 400 bis 800 (nicht die variable Datei,
  die Chromium als Type-3-Schrift einbettet).

## 4. Prüfung vor jeder Abgabe (alle Punkte gemessen)

1. Kein Inhalt läuft aus seiner Seite (Messung `scrollHeight` gegen
   `clientHeight` je Seite und je Textrahmen).
2. Seitenzahl im PDF = Zahl der `.seite`-Abschnitte.
3. Jeder interne Link zeigt auf ein vorhandenes Ziel und landet auf der
   richtigen Seite; Lesezeichen vorhanden.
4. Alle externen Links mit UTM-Kennung, keine toten Ziele.
5. Schriften eingebettet (`pdffonts`), nur Manrope.
6. Text zurücklesen (`pdftotext`): keine Gedankenstriche außer in
   Zahlenspannen, Garantiezahlen 10/5/2, keine `[BELEG FEHLT]`,
   keine `[PRÜFEN]` in der Endfassung.
7. Seitenbilder (PNG) an `ratgeber-gestaltungspruefer`, Text an
   `ratgeber-lektor`, Aussagenliste an `ratgeber-faktenpruefer`,
   Gesamtwirkung an `conversion-psychology-auditor`.
8. Lesertest: ein frischer Agent ohne Vorwissen liest das PDF und
   beantwortet fünf Verständnisfragen (Methode aus Anthropics
   doc-coauthoring).

## 5. Ablauf mit dem Ratgeber-Team (feste Reihenfolge)

| Schritt | Agent | Darf schreiben? | Liefert |
|---|---|---|---|
| 1 | Hauptagent | ja | Faktenbasis `fakten-ratgeber-N.md` (jede Zeile mit Quelle) |
| 2 | `ratgeber-verkaufsstratege` | nein | Argumentation, v. a. „Preis gegen Wert" |
| 3 | `ratgeber-redakteur` | nur Ratgeber-Ordner | Text nach Faktenbasis und Konzept |
| 4 | `ratgeber-lektor`, `ratgeber-faktenpruefer`, `conversion-psychology-auditor` | nein | drei getrennte Berichte, parallel |
| 5 | `ratgeber-redakteur` | nur Ratgeber-Ordner | Überarbeitung nach allen Berichten in einem Zug |
| 6 | Hauptagent | ja | Satz mit `baue-ratgeber.mjs`, gemessene Prüfungen (Abschnitt 4) |
| 7 | `ratgeber-gestaltungspruefer` | nein | Bericht zu den Seitenbildern |
| 8 | `ratgeber-lesertest` | nein | Leserbericht, Verständnisfragen |
| 9 | Hauptagent | ja | letzte Korrekturen, Bericht an den Betreiber |

Nie zwei Agenten mit demselben Auftrag. Prüfer bekommen die Dateipfade,
nicht das halbe Repository. Fragen, die nur der Betreiber beantworten kann,
werden gesammelt gestellt und mit Antwort in die Faktenbasis eingetragen.

**Preis gegen Wert (Ansage des Betreibers, 26.11.2026):** Der Leser soll von
A bis Z verstehen, warum der Preis allein nichts sagt, was ein Angebot
wirklich enthält und warum Angebote verschieden ausfallen. Nie schreiben,
dass BV teurer oder günstiger ist, nie andere Anbieter abwerten.

## 6. Ablage

Quellen (HTML, Bilder, Bauskript) und fertige PDFs gehören NICHT ins
öffentliche Website-Repository, sondern ins private Repository
`bvaussensysteme/bv-marketing` (Ordner `ratgeber/`). Ausgeliefert wird das PDF
später aus einem privaten Speicher, nicht als öffentliche Datei.
