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

## 6. Kein Anfrage-Versand – das ist der Unterschied zur Website

> „Ich will im crm eine eigenen 3d konfigurator 1:1 wie den auf der webseite
> nur ohne formular abschicken" (Betreiber, 21.10.2026).

Das Paket ist der Konfigurator der Website, **ohne jeden Weg, eine Anfrage
abzuschicken**. Entfernt sind:

- `js/anfrage-wizard.js` – der Assistent, der die E-Mail verschickt hat
- `js/konfigurator-widget.js` – der schwebende Knopf, der ihn öffnete
- der Knopf **„Konfiguration anfragen →"** am Ende des Bedienfelds.
  Er wird aus `index.html` herausgeschnitten, nicht nur stillgelegt –
  sonst stünde ein toter Knopf da.

**Ein Rest brauchte eine eigene Behandlung.** `js/main.js` bleibt im Paket
(Navigation, Mobilmenü, Lightbox) und trägt den Formular-Versand der Website
mit sich. Laufen kann der dort nicht: Er steckt vollständig in
`if (formSubmit) { … }`, und die Seite hat kein Formular. In einem internen
Werkzeug soll die Versandadresse aber gar nicht erst stehen, deshalb ersetzt
das Export-Skript sie durch `about:blank#kein-versand-im-internen-paket`.
Eine Ersetzung, kein Umbau – die Datei bleibt Zeile für Zeile dieselbe
(321 Zeilen, hier wie im Repository).

**Geprüft wird das bei jedem Export**, nicht nur behauptet:

- kein Knopf mit `id="k3dAnfrage"`
- kein `<form>`, kein `id="formSubmit"`, kein `name="email"`
- kein Versandziel im gesamten Paket – weder Web3Forms noch Formspree

**Was an der Website unverändert bleibt:** alles. Der Anfrage-Assistent läuft
dort weiter wie bisher. Entfernt wird er nur beim Erzeugen des Pakets.

**Was bleibt:** Kopf- und Fußzeile verlinken weiter auf
`bv-aussensysteme.de` – das ist Absicht, sonst liefen die Links ins Leere.
Wer im CRM darauf klickt, landet auf der öffentlichen Website und könnte
*dort* ein Formular ausfüllen. Im Paket selbst gibt es keines.

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
