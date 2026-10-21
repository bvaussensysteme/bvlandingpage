# 3D-Konfigurator als Paket für die interne Nutzung (CRM)

> Dieses Dokument ist die Übergabe an einen **anderen** Chat / ein anderes
> Projekt. Es setzt nichts voraus außer dem erzeugten Paket.
> Erzeugt wird es mit `scripts/export-konfigurator.sh` aus diesem Repository
> (`bvaussensysteme/bvlandingpage`).

## 1. Was das ist

Ein 3D-Konfigurator für Terrassendächer, Carports und Flachdachsysteme
(Hersteller VD AluSysteme). Der Kunde stellt System, Maße, Farbe, Eindeckung,
Seitenelemente und Beschattung ein und sieht das Ergebnis als 3D-Modell.

Technisch: **eine HTML-Seite, reines JavaScript, kein Build, kein Framework.**
three.js r128 liegt als Datei bei. Es gibt keine npm-Abhängigkeiten zur
Laufzeit. Die Seite läuft aus jedem Webserver-Verzeichnis heraus
(`file://` reicht **nicht**, weil Texturen geladen werden).

## 2. Paket erzeugen

```bash
scripts/export-konfigurator.sh                 # nach export/konfigurator
scripts/export-konfigurator.sh /pfad/zum/ziel  # woandershin
scripts/export-konfigurator.sh --gegenprobe    # prüft die Prüfungen selbst
```

Das Skript prüft das fertige Paket und bricht ab, wenn etwas fehlt:
Website-Skripte draußen, keine absoluten Pfade, alle Skripte verlinkt, jede
angeforderte Datei vorhanden, keine Beträge enthalten. `--gegenprobe` baut
das Paket, macht es anschließend absichtlich kaputt und verlangt, dass jede
dieser Prüfungen anschlägt.

**Das Paket wird nicht ins Repository eingecheckt.** Eine zweite Kopie des
Konfigurators würde still auseinanderlaufen. Änderungen gehören immer in
`js/konfigurator-3d.js` im Hauptrepository, danach neu exportieren.

## 3. Was im Paket liegt

| Datei | Wofür |
|---|---|
| `index.html` | die Seite selbst, abgeleitet aus `konfigurator.html` |
| `js/konfigurator-3d.js` | **der Kern.** Bedienfeld, Schritte, gesamtes 3D-Modell (~538 KB, stark kommentiert) |
| `js/vendor/three.min.js` | three.js r128, MIT-Lizenz, unverändert |
| `js/masstabelle.js` | verdichtete Maßtabelle: welche Breiten/Tiefen lieferbar sind, Sparren- und Stützfußzahlen. **Enthält keine Preise** |
| `js/markisenstoffe.js` | Stoffkollektionen für die Beschattung |
| `js/pdf-blatt.js` | PDF-Erzeugung der Konfiguration |
| `js/anfrage-wizard.js` | der Anfrage-Assistent – **siehe Abschnitt 6, der versendet E-Mails** |
| `js/konfigurator-widget.js` | der schwebende Knopf, der den Assistenten öffnet |
| `js/main.js`, `js/accessibility.js` | Kopf-/Fußzeile und Bedienhilfen der Seite |
| `css/style.css` | das gesamte Stylesheet der Website |
| `images/textur/*.webp` | Boden-, Wand- und Holztexturen für das 3D-Modell |
| `images/logo-*.png`, `favicon*` | Logo und Icons |

## 4. Einbinden ins CRM

**Empfohlen: als eigene Seite in einem `<iframe>`.** Der Konfigurator bringt
ein vollständiges Stylesheet mit, das auf das CRM-Layout durchschlagen würde.
Ein iframe hält beides auseinander.

```html
<iframe src="/konfigurator/index.html"
        style="width:100%;height:900px;border:0"
        title="3D-Konfigurator"></iframe>
```

Das Paket muss dafür über HTTP ausgeliefert werden (statischer Ordner reicht).
Unterordner sind in Ordnung: Alle Pfade im Paket sind relativ.

Direkte Integration ohne iframe ist möglich, bedeutet aber: `css/style.css`
in das CRM-Stylesheet einpassen und Namenskollisionen bei IDs prüfen
(der Konfigurator benutzt durchgehend das Präfix `k3d`).

## 5. Serverabhängigkeit – wichtig zu wissen

Der Konfigurator fragt beim Laden `GET /api/bauteile` ab. Das ist ein
Cloudflare Worker im Hauptprojekt, der aus der Herstellermatrix eine
Stückliste rechnet.

**Dieser Endpunkt existiert im CRM nicht – und das ist kein Problem.**
Der Konfigurator fängt das ab und baut dann die *geschätzte* Variante:
Sparren- und Pfostenzahlen kommen aus `js/masstabelle.js` statt vom Server.
Genau so läuft es derzeit auch auf der öffentlichen Website, weil der
KV-Speicher dort noch nicht angebunden ist. Es gibt also **keinen Unterschied**
zum heutigen Live-Stand.

Will man später die Serverzahlen auch im CRM, muss `/api/bauteile` dort
erreichbar sein (Proxy auf die Website oder eigener Worker). Sonst nichts tun.

## 6. Der Anfrage-Assistent – bitte entscheiden

`js/anfrage-wizard.js` verschickt **echte E-Mails** an
`info@bv-aussensysteme.de`, über den Dienst Web3Forms mit einem öffentlichen
Access Key, der in der Datei steht (Kopf der Datei, Konstante `WEB3FORMS_KEY`).

Im CRM heißt das: Wer intern durch den Konfigurator klickt und am Ende auf
„Anfrage senden" drückt, löst eine **echte Kundenanfrage-Mail** aus.

**Empfehlung für die interne Nutzung:** die beiden Skript-Zeilen für
`js/anfrage-wizard.js` und `js/konfigurator-widget.js` aus `index.html`
entfernen und im Browser prüfen, ob der Konfigurator sauber durchläuft.
Alternativ `WEB3FORMS_KEY` leeren – dann läuft der Assistent weiter, aber der
Versand schlägt fehl.

Das ist bewusst **nicht** vorweggenommen: Was gebaut wird, entscheidet der
Betreiber. Der zweite Weg, `/api/kontakt`, existiert im CRM ohnehin nicht und
läuft still ins Leere.

## 7. Was absichtlich nicht mitgeht

| | Warum |
|---|---|
| `js/metricool.js` | lädt einen externen Social-Analytics-Tracker. Hat in einem internen Werkzeug nichts zu suchen |
| `js/cookie.js` | Einwilligungsbanner. Intern gibt es nichts einzuwilligen |
| `daten/` (Matrix, Preislisten, Einzelteile) | liegt bewusst **nicht** im Repository. Datenbankherstellerrecht an der Herstellermatrix; die Quelle erlaubt nur, *Ergebnisse* zu zeigen |
| Preise | im Konfigurator gibt es keine. Das Export-Skript prüft darauf |

## 8. Rechtlich und inhaltlich

- **three.js** r128 steht unter MIT, der Lizenztext liegt im Dateikopf.
- **Herstellerdaten:** `js/masstabelle.js` ist eine verdichtete Tabelle aus
  der VD-Preisliste – **ohne Preise**, nur lieferbare Maße und Stückzahlen.
  Sie ist bereits öffentlich (Website). Die vollständige Matrix und die
  Einzelteileliste sind es nicht und gehören nicht ins CRM.
- **Produktfotos und Marken:** Das Paket enthält keine VD-Produktfotos, nur
  eigene Texturen und das BV-Logo.
- **Maße im Modell:** Nicht jedes Maß ist belegt. Im Code sind geschätzte
  Werte mit `GESCHÄTZT` markiert, hergeleitete mit `ABGELEITET`. Offene
  Punkte stehen in `daten/rueckfragen-an-vd.md` (nicht im Paket).
  **Für Angebote ist das Modell keine Quelle** – es ist eine Darstellung.

## 9. Wenn etwas geändert werden soll

Nicht im Paket ändern. Das Paket ist ein Erzeugnis.

1. Änderung in `bvaussensysteme/bvlandingpage` (meist `js/konfigurator-3d.js`)
2. `node scripts/pruefe-masstabelle.js` und die übrigen `scripts/pruefe-*`
   laufen lassen, jeweils auch mit `--gegenprobe`
3. `npm run build`, Cache-Buster hochzählen
4. `scripts/export-konfigurator.sh` neu laufen lassen

Warum so umständlich: Das Hauptprojekt hat über 360 Prüfungen auf dieses
Modell, inklusive Gegenproben. Eine Änderung nur im Paket verliert die alle
und ist beim nächsten Export wieder weg.
