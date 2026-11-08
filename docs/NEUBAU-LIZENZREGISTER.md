# Asset- und Lizenzregister (Stand 08.11.2026)

> **Das ist keine Rechtsberatung.** Zusammengetragen ist, was im Repository
> belegbar steht und was die Lizenzgeber öffentlich schreiben. Die
> verbindliche rechtliche Bewertung – besonders zu Markenrecht,
> Bildnutzungsrechten und Datenschutz – holt der Betreiber bei einem
> Fachanwalt. Dieses Register ist die Vorarbeit dafür: es sagt, **was
> verbaut ist**, **wo der Nachweis liegt** und **was ungeklärt ist**.
>
> Nichts geändert, nichts committet, nichts veröffentlicht. Nur gelesen.

## Wie gelesen wird

- **Lizenznachweis** nennt die Datei im Repository oder die abgerufene
  Netzadresse. „geprüft 08.11.2026" heißt: an diesem Tag selbst abgerufen.
- **offen** ist keine Höflichkeitsfloskel. Was dort steht, ist **nicht
  geklärt** und muss vom Betreiber beantwortet werden – nicht geraten.
- Eine Lizenz, die ich nicht selbst gesehen habe, steht nicht als Tatsache
  da, sondern als offene Frage.

---

## 1. Die drei größten Lizenzrisiken

| # | Risiko | Warum |
|---|---|---|
| **1** | **434 Stoffbilder** unter `images/stoffe/` sind aus der Stoffkarte des Lieferanten erzeugt – ohne nachweisbare Bildnutzungsrechte im Repository | Siehe Abschnitt 4.3. Das sind mehr als 60 % aller Bilddateien. `js/markisenstoffe.js` nennt als Quelle die „Stoffkarte ‚Markisen Stoffe' (Stand 11.06.2025), vom Betreiber am 11.10.2026 geschickt" – ein **Zuschicken ist keine Nutzungseinräumung**. Zugeschnittene Ausschnitte sind Bearbeitungen; die Dateien liegen öffentlich und werden gewerblich beworben. Der Rechteinhaber ist wahrscheinlich der Stoffhersteller, nicht einmal VD. |
| **2** | **Fremde Markenlogos als SVG-Pfade in 54 HTML-Dateien** (Facebook, Instagram, YouTube, WhatsApp) | Siehe Abschnitt 5.2. Die Pfade geben die eingetragenen Logos exakt wieder und stammen nicht aus eigener Zeichnung – obwohl `js/bv-symbole.js` ausdrücklich „Keine fremde Sammlung, kein fremder Pfad" behauptet und `CLAUDE.md` es verlangt. Die Herkunftsgarnitur ist unbekannt (Lizenz damit unbekannt), und darüber steht das Markenrecht: Meta und Google setzen eigene Brand Guidelines, die eine Lizenz des Icon-Sets **nicht** ersetzt. |
| **3** | **DIBt-Lastzonen gewerblich genutzt** – der eigene Kopfkommentar sagt „Freie Nutzung für **nichtkommerzielle** und informatorische Zwecke" | Siehe Abschnitt 6.2 (`js/dibt-lastzonen.js`, Zeile 4–5; `data/lastzonen_deutschland.geojson`). Die Seite ist gewerblich, der Windzonenrechner ist ein Verkaufswerkzeug. Entweder ist der eigene Kommentar falsch (dann gehört er korrigiert) oder die Nutzung ist nicht gedeckt (dann gehört sie geklärt). Beides kann nicht gleichzeitig stimmen. Dazu kommt die **BKG-Namensnennung in `windzonen.html` Zeile 1084**, die an den OSM-Kacheln hängt, obwohl die Kacheln nicht vom BKG kommen – entweder fehlt der Nachweis, welche BKG-Daten verbaut sind, oder die Nennung ist gegenstandslos. |

---

## 2. JavaScript- und CSS-Bibliotheken

### 2.1 Lokal ausgelieferte Bibliotheken

| Ressource | Rechteinhaber | Lizenz | Kommerziell | Bearbeitung | Namensnennung | Nachweis | offen |
|---|---|---|---|---|---|---|---|
| **three.js r128** – `js/vendor/three.min.js` (590 KB), Kopie in `export/konfigurator/js/vendor/three.min.js` | Three.js Authors | **MIT** | ja | ja | ja – Lizenzhinweis muss mitgeliefert werden | Lizenzkopf steht **in der Datei**: „Copyright 2010-2021 Three.js Authors / SPDX-License-Identifier: MIT" | – (Kopf vorhanden, Pflicht erfüllt) |
| **StPageFlip (page-flip)** – `assets/js/page-flip.browser.js` (44 KB) + `assets/js/page-flip.css` | Nodlik | **MIT** | ja | ja | ja | **`assets/js/page-flip.LICENSE.txt`** liegt daneben, vollständiger MIT-Text, „Copyright (c) 2020 Nodlik" | Versionsnummer steht nirgends – bei einem künftigen Sicherheitshinweis ist nicht feststellbar, welche Fassung verbaut ist |
| `assets/js/page-flip.css` | Nodlik | **MIT** (Teil derselben Veröffentlichung) | ja | ja | ja | kein eigener Lizenzkopf in der CSS-Datei; gedeckt durch `page-flip.LICENSE.txt` | ein Lizenzkopf in der CSS-Datei wäre sauberer, ist aber nicht zwingend |

**Gut gelöst:** Beide liegen **lokal**, nicht am CDN. Das ist in
`js/broschuere.js` Zeile 5–6 auch so begründet („kein Fremdanbieter, kein
CDN, damit beim Aufruf der Seite keine Daten nach aussen gehen"). Für MIT
heißt lokal zugleich: der Lizenztext muss **mit**, und das ist bei beiden
erfüllt.

### 2.2 Vom Fremd-Host nachgeladen

| Ressource | Rechteinhaber | Lizenz | Kommerziell | Bearbeitung | Namensnennung | Nachweis | offen |
|---|---|---|---|---|---|---|---|
| **Leaflet 1.9.4** von `unpkg.com` – `einzugsgebiet.html` Z. 208/209 | Volodymyr Agafonkin, CloudMade | **BSD-2-Clause** | ja | ja | ja – Copyright-Vermerk muss bei Weitergabe erhalten bleiben (hier nicht weitergegeben, nur verlinkt) | <https://raw.githubusercontent.com/Leaflet/Leaflet/main/LICENSE>, geprüft 08.11.2026 | – |
| **Leaflet 1.9.4** von `cdnjs.cloudflare.com` – `windzonen.html` Z. 478/1010, `baugenehmigung.html` Z. 1088/1094 (dort per JS nachgeladen) | wie oben | **BSD-2-Clause** | ja | ja | wie oben | wie oben | Zwei verschiedene CDNs für dieselbe Bibliothek (unpkg **und** cdnjs). Keine Lizenzfrage, aber zwei Fremd-Hosts statt einem |
| **Leaflet-Standardvermerk im Kartenrahmen** | Leaflet | – | – | – | Leaflet setzt von sich aus „Leaflet" als `prefix` in die Attributionszeile | kein `attributionControl`/`prefix`-Override gefunden (geprüft in allen drei Kartenseiten) | – (Vermerk steht automatisch) |

### 2.3 In der CSP erlaubt, aber **nicht** benutzt

Geprüft in `_headers`. Erlaubt sind dort Hosts, die teils nichts laden:

| Host in der CSP | tatsächlich benutzt? | Befund |
|---|---|---|
| `https://unpkg.com` (script/style/img) | **ja**, nur `einzugsgebiet.html` | – |
| `https://cdnjs.cloudflare.com` (script/style/img) | **ja**, `windzonen.html` + `baugenehmigung.html` | – |
| `https://formspree.io` (connect) | **ja, aber nur als Notfall-Rückfallweg** – `js/anfrage-wizard.js` Z. 9 („nur noch Notfall-Backup"), `js/main.js` Z. 139 | siehe Abschnitt 7 |
| `https://api.web3forms.com` (connect) | **ja**, primärer Weg – `js/anfrage-wizard.js` Z. 10, `widerruf.html` Z. 152 (`<form action=…>`) | siehe Abschnitt 7 |
| `https://tracker.metricool.com`, `https://*.metricool.com` | **ja**, erst nach Einwilligung – `js/metricool.js` | siehe Abschnitt 7 |
| `img-src https://unpkg.com` / `https://cdnjs.cloudflare.com` | nur für Leaflets eigene Marker-/Schattenbilder | keine Lizenzfrage (Teil von Leaflet, BSD-2) |

**Kein** Treffer für Google Maps, YouTube-Einbettung, reCAPTCHA, jQuery,
Bootstrap, Tailwind, GSAP oder Font Awesome als geladene Datei. Die beiden
`<iframe>` im Projekt zeigen auf `about:blank` und `index.html`, also nicht
nach außen.

### 2.4 Build-Abhängigkeiten (npm) – laufen nie im Browser

`package.json` nennt drei direkte Abhängigkeiten; installiert sind 134
Pakete. Alle ausgelesenen Lizenzfelder:

| Lizenz | Pakete |
|---|---|
| MIT | 114 |
| ISC | 16 |
| BSD-2-Clause | 6 |
| BSD-3-Clause | 4 |
| Apache-2.0 | 2 |
| Python-2.0 | 1 |
| BlueOak-1.0.0 | 1 |

Direkt: `@11ty/eleventy` 3.1.6 (MIT), `clean-css-cli` 5.6.3 (MIT),
`@neondatabase/serverless` 0.10.4 (MIT) – ausgelesen aus den jeweiligen
`node_modules/*/package.json`. Kein Paket **ohne** Lizenzfeld, kein
Copyleft (GPL/AGPL/LGPL).

`node_modules/` steht in `.assetsignore` und wird **nicht** ausgeliefert.
`@neondatabase/serverless` läuft im Cloudflare Worker (`worker/index.js`
Z. 1), also serverseitig – nicht beim Besucher.

**offen:** Das `Python-2.0`-Paket und `BlueOak-1.0.0` sind nicht
identifiziert. Beides ist permissiv und beides ist Build-Werkzeug, das
nicht ausgeliefert wird – deshalb hier nicht weiter aufgelöst. Wer eine
vollständige SBOM braucht, muss sie erzeugen; dieses Register leistet das
nicht.

---

## 3. Schriften

| Ressource | Rechteinhaber | Lizenz | Kommerziell | Bearbeitung | Namensnennung | Nachweis | offen |
|---|---|---|---|---|---|---|---|
| **Inter** (400/500/600), von `fonts.googleapis.com` | The Inter Project Authors | **SIL Open Font License 1.1** | ja | ja (abgeleitete Schrift muss unter OFL bleiben) | **nein** für Websites – OFL verlangt keine Namensnennung auf der Seite | <https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt>, geprüft 08.11.2026: „Copyright 2020 The Inter Project Authors" | – |
| **Barlow Condensed** (400/600/700/800), von `fonts.googleapis.com` | The Barlow Project Authors | **SIL Open Font License 1.1** | ja | ja (wie oben) | **nein** | <https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt>, geprüft 08.11.2026: „Copyright 2017 The Barlow Project Authors" | – |

**Keine eigenen Schriftdateien im Repository.** Gesucht nach `@font-face`
sowie nach `*.woff`, `*.woff2`, `*.ttf`, `*.otf` – **kein Treffer**. Die
Schriften kommen ausschließlich vom Google-Fonts-Host. Verbaut sind sie in
`src/css/style.css` (ab Z. 111) als `font-family: 'Inter'` und
`'Barlow Condensed'`.

Vier verschiedene Gewichtskombinationen werden angefordert (je Seite
unterschiedlich). Lizenzrechtlich gleichgültig, aber uneinheitlich.

**Der eigentliche Punkt bei Google Fonts ist nicht die Lizenz, sondern der
Datenschutz.** Lizenzseitig ist alles frei (OFL 1.1). Aber:
`fonts.googleapis.com` und `fonts.gstatic.com` stehen in der CSP
(`style-src`, `font-src`), die Schrift wird also **beim Besucher vom
Google-Server** geholt – dabei geht dessen IP-Adresse an Google. Das LG
München I hat am 20.01.2022 (Az. 3 O 17493/20) für genau diese
Konstellation Schadensersatz zugesprochen; seither gibt es eine
Abmahnwelle. **Das ist kein Lizenzproblem, aber es ist ein Geldproblem.**
Weil die Schriften unter OFL stehen, wäre die Lösung billig: Dateien ins
Repository legen und per `@font-face` lokal ausliefern. Die Lizenz erlaubt
das ausdrücklich.

**offen (an den Betreiber):** Ist der Google-Fonts-Abruf in
`datenschutz.html` beschrieben und von der Einwilligung gedeckt? Das ist in
diesem Register nicht geprüft – es ist ein Datenschutz-, kein
Lizenzgegenstand. Empfehlung: **lokal ausliefern**, dann entfällt die Frage.

---

## 4. Bilder

**713 Bilddateien** unter `images/` (nicht 205 – das trifft nur die oberste
Ebene annähernd: dort liegen 200). Dazu 77 Dateien unter `assets/`
(Broschüre) und 9 Dateien in der Wurzel (Logos, Favicons,
`apple-touch-icon.png`, zwei `scratch_dd_*.png`).

Die Herkunft lässt sich **nicht abschließend klären**. Das Repository
kennt nur eine Konvention (`vd_`-Präfix) und eine Dokumentation
(`docs/VD-INHALTE-INVENTAR.md`), die ihre eigene Lücke benennt. Alles
Folgende ist nach **erkennbarer** Herkunft gruppiert, nicht nach
nachgewiesener.

### 4.1 Herstellerbilder VD AluSysteme – Präfix `vd_` (135 Dateien)

| | |
|---|---|
| **Name/Herkunft** | `images/vd_prod_*.jpg` / `.webp` (116 Dateien), `images/vd_*` übrige (19), darunter `vd_partner-vd-alusysteme.png` |
| **Rechteinhaber** | VD AluSysteme (Lieferant) – bei einigen Motiven womöglich deren Vorlieferanten (die Dateinamen nennen `warema`, `velaris`, `sunpro`) |
| **Lizenztyp** | **Vertragliche Bildnutzung** aus dem Liefervertrag. `docs/VD-INHALTE-INVENTAR.md` Abschnitt 1: „Bildnutzung vertraglich erlaubt, siehe vertrauliche Doku" |
| **Kommerziell** | laut Inventar ja – der Vertrag ist ein Liefervertrag für den Vertrieb |
| **Bearbeitung** | **offen** – nirgends geregelt. Zuschnitt und WebP-Umwandlung sind bereits erfolgt (`.jpg` **und** `.webp` je Motiv) |
| **Namensnennung** | **offen** – kein Bildnachweis auf der Website vorhanden (gesucht nach „Bildnachweis", „Bildquelle", „Credits": kein Treffer in irgendeiner HTML-Datei) |
| **Lizenznachweis** | **liegt nicht im Repository.** Das Inventar verweist auf eine „vertrauliche Doku", die dieses Register nicht einsehen kann |
| **offen** | (a) Wo liegt der Vertrag, und welche Klausel deckt die Bildnutzung? (b) Deckt sie **Bearbeitung** (Zuschnitt, Format, Komprimierung)? (c) Deckt sie Nutzung **nach Vertragsende** – oder müssen die Bilder dann herunter? (d) Verlangt sie einen Bildnachweis? (e) Sind die Motive mit Fremdmarken im Namen (`warema`, `velaris`) von VD überhaupt weitergabefähig? |

### 4.2 Produktbilder ohne `vd_`-Präfix – Präfix `prod_` (22 Dateien)

| | |
|---|---|
| **Name/Herkunft** | `images/prod_*.jpg` – 22 Dateien. **Dieselben Motivnamen wie die `vd_prod_*`-Dateien** (`prod_carport_tds.jpg` ↔ `vd_prod_carport_tds.jpg`, `prod_pergola_warema.jpg` ↔ `vd_prod_pergola_warema.jpg`, …) |
| **Rechteinhaber** | **vermutlich VD AluSysteme** – dieselben Motive, nur ohne Präfix |
| **Lizenztyp** | **offen** |
| **Kommerziell / Bearbeitung / Namensnennung** | **offen** |
| **Lizenznachweis** | keiner |
| **offen** | **Das ist eine Falle, nicht nur eine Lücke.** Wenn das Präfix `vd_` die Markierung für „gehört VD" ist, dann sind diese 22 Dateien entweder (a) ältere, unmarkierte Kopien derselben VD-Bilder – dann würde `git rm images/vd_*` sie **stehen lassen** und das Inventar-Versprechen in `docs/VD-INHALTE-INVENTAR.md` wäre falsch; oder (b) eigene Aufnahmen derselben Anlagen – dann wäre die Namensgleichheit Zufall, was unwahrscheinlich ist. Der Betreiber muss das Datei für Datei klären. Bis dahin: **nicht annehmen, dass das `vd_`-Präfix vollständig ist.** |

### 4.3 Stoffbilder – `images/stoffe/` (434 Dateien) → **Risiko 1**

| | |
|---|---|
| **Name/Herkunft** | `images/stoffe/*.jpg` + `*-flat.png` (152), `images/stoffe/tex/*.webp` (141, Tuch im 3D-Modell), `images/stoffe/mini/*.webp` (141, Auswahlbilder). Codes `AC…`, `PA…` (Dachstoffe) und `T7…` (EZIP-Senkrechtmarkisen) |
| **Rechteinhaber** | **offen** – wahrscheinlich der **Stoffhersteller**, nicht VD. `js/markisenstoffe.js` nennt VD-Systemnamen (LINEA, SOLARA, EZIP), aber Stoffkollektionen stammen üblicherweise von Webereien, nicht vom Systemhersteller |
| **Lizenztyp** | **offen – kein Nachweis irgendeiner Art** |
| **Kommerziell** | **offen** |
| **Bearbeitung** | **tatsächlich erfolgt, Erlaubnis offen.** `docs/markisenstoffe.md` Z. 36–37: „Im Bild der Stoffkarte liegen beide Muster nebeneinander in einem Streifen: links A, rechts B. Daraus sind die Einzelbilder erzeugt worden." Z. 99 nennt den Zuschnittbefehl (`-crop 50%x100%+0+0`). Dazu Umwandlung nach WebP und CMYK→sRGB |
| **Namensnennung** | **offen** – keine vorhanden |
| **Lizenznachweis** | **keiner.** `js/markisenstoffe.js` Z. 3–4: „Quelle: Stoffkarte ‚Markisen Stoffe' (Stand 11.06.2025), vom Betreiber am 11.10.2026 geschickt." Das belegt, **woher die Datei kam**, nicht, **was damit erlaubt ist** |
| **offen** | (1) Wer ist Rechteinhaber der Stoffbilder – VD oder die Weberei? (2) Liegt für die **Bilder** (nicht nur die Daten) eine Nutzungseinräumung vor, schriftlich? (3) Deckt sie das **Zuschneiden** und die Farbraumumrechnung? (4) `docs/markisenstoffe.md` Z. 59–82 beschreibt, dass die Originalbilder im CMYK-Farbraum vorliegen – das ist der Farbraum einer **Druckvorlage**. Druckvorlagen eines Lieferanten sind praktisch nie zur freien Weiterverwendung im Netz gedacht. (5) Falls keine Einräumung vorliegt: Was tritt an die Stelle – eigene Fotos der Musterstücke, oder nur Farbflächen ohne Foto? |

Das ist nicht hypothetisch: 434 Dateien sind mehr als die Hälfte aller
Bilder im Projekt, sie liegen öffentlich abrufbar, und sie bewerben eine
gewerbliche Leistung.

### 4.4 Kachelbilder des Anfrage-Assistenten – `images/wizard/` (49 Dateien)

| | |
|---|---|
| **Name/Herkunft** | `wz_*.webp` (43), `erw_*.webp` (6) |
| **Rechteinhaber** | **gemischt und überwiegend undokumentiert.** `docs/VD-INHALTE-INVENTAR.md` belegt für **drei** Dateien VD als Quelle (`wz_poly_graphit.webp`, `wz_poly_bronze.webp`, `wz_vsg_graphit.webp` – „am 29.10.2026 vom Betreiber geliefert, das VD-Logo ist auf der Eckkappe sichtbar") |
| **Lizenztyp** | für die drei: wie 4.1 (vertraglich). Für die **übrigen 46: offen** |
| **Kommerziell / Bearbeitung / Namensnennung** | **offen** |
| **Lizenznachweis** | nur der Inventareintrag für drei Dateien |
| **offen** | Das Inventar nennt das selbst „der einzige bekannte blinde Fleck dieses Inventars": die Dateien tragen **kein** `vd_`-Präfix und fallen damit nicht unter das Lösch-Kommando. Zu klären ist Datei für Datei: eigene Aufnahme oder Herstellerbild? |

### 4.5 Eigene Fotos – Präfix `galerie-` (18 Dateien)

| | |
|---|---|
| **Name/Herkunft** | `images/galerie-1…6` je als `.jpg`/`.webp`, drei davon zusätzlich als `-full` |
| **Rechteinhaber** | **vermutlich BV AussenSysteme GbR** (eigene Referenzaufnahmen) |
| **Lizenztyp** | eigenes Werk – keine Lizenz nötig |
| **Kommerziell / Bearbeitung** | ja, sofern eigenes Werk |
| **Namensnennung** | nein |
| **Lizenznachweis** | **keiner** |
| **offen** | (a) Hat sie der Betrieb selbst aufgenommen, oder ein beauftragter Fotograf? Bei beauftragten Aufnahmen gilt das, was im Fotografenvertrag steht – oft nur Nutzung „für die eigene Website", nicht für Prospekte oder Social Media. (b) Zeigen die Bilder **Anlagen bei Kunden**? Dann ist die Einwilligung des Kunden nötig (Hausrecht, bei erkennbaren Grundstücken auch Persönlichkeitsrecht). (c) Sind Personen, Kennzeichen oder Hausnummern erkennbar? |

### 4.6 3D-Texturen – `images/textur/` (14 Dateien) ✅ **sauber**

| | |
|---|---|
| **Name/Herkunft** | **ambientCG.com** – je Material eine Farbtextur + eine Normalmap: Grass004, PavingStones028, WoodFloor043, Plaster002, Bricks075A, Concrete034 |
| **Rechteinhaber** | ambientCG (Lennart Demes) – Rechte per CC0 freigegeben |
| **Lizenztyp** | **CC0 1.0 Universal (Public Domain Dedication)** |
| **Kommerziell** | **ja** |
| **Bearbeitung** | **ja** |
| **Namensnennung** | **nein** |
| **Lizenznachweis** | `docs/texturen.md` Abschnitt „Lizenz" (mit Zuordnung Datei ↔ ambientCG-Material und Prüfdatum 11.10.2026) **und** gegengeprüft am 08.11.2026 unter <https://docs.ambientcg.com/license/>: „even for commercial purposes", „You don't need to give credit" |
| **offen** | – |

Das ist der einzige Bildbestand im Projekt mit **vollständigem**
Lizenznachweis. `docs/texturen.md` hält auch die Regel für die Zukunft
fest: „nur CC0 oder eine eigene Aufnahme".

### 4.7 Konfigurator-Bilder – `images/konfigurator/` (14 Dateien)

| | |
|---|---|
| **Name/Herkunft** | `aufbau-*.jpg`, `dach-glas-*.jpg`, `dach-poly-*.jpg`, `produkt-*.jpg` |
| **Rechteinhaber** | **offen** – die Motivnamen (`produkt-skyview`, `produkt-terrassendach`) entsprechen VD-Modellbezeichnungen |
| **Lizenztyp / Kommerziell / Bearbeitung / Namensnennung** | **offen** |
| **Lizenznachweis** | keiner |
| **offen** | Herstellerbilder oder eigene Aufnahmen? Dieselbe Frage wie 4.4 |

### 4.8 Zertifikatsabbildungen – `images/zertifikate/` (2 Dateien)

| | |
|---|---|
| **Name/Herkunft** | `alexander-becker-vd-zertifikat.jpg`, `josef-voronin-vd-zertifikat.jpg` |
| **Rechteinhaber** | Urkundengestaltung und Logo: **VD AluSysteme**. Der genannte Name: die jeweilige Person |
| **Lizenztyp** | **offen** |
| **Namensnennung** | – |
| **Lizenznachweis** | keiner |
| **offen** | **Hier geht es weniger um Urheberrecht als um Personen.** (a) Haben die beiden Genannten der Veröffentlichung ihres Namens auf einer öffentlichen Website zugestimmt (Art. 6 DSGVO), und liegt das schriftlich vor? (b) Erlaubt VD die Abbildung seiner Urkunde samt Logo? (c) Was passiert mit den Bildern, wenn eine der Personen den Betrieb verlässt – oder der VD-Vertrag endet? |

### 4.9 Logos und Favicons (Wurzel + `images/logo-*`)

| | |
|---|---|
| **Name/Herkunft** | `logo-dunkel.png`, `logo-hell.png`, `logo-mark.png`, `marker-logo.png`, `apple-touch-icon.png`, `favicon*.png`, `favicon.ico`, dazu `images/logo-*` (5), `images/og-preview.*`, `images/marker-logo.png` |
| **Rechteinhaber** | **BV AussenSysteme GbR** (eigenes Firmenzeichen) |
| **Lizenztyp** | eigenes Werk / eigene Marke |
| **Kommerziell / Bearbeitung** | ja |
| **Namensnennung** | nein |
| **Lizenznachweis** | keiner nötig, sofern selbst beauftragt |
| **offen** | (a) Wer hat das Logo gestaltet, und liegen die Nutzungsrechte **vollständig** beim Betrieb (bei Agenturarbeit oft eingeschränkt)? (b) Ist die Wort-/Bildmarke angemeldet? Das ist kein Lizenz-, sondern ein Schutzthema – ohne Anmeldung gibt es keinen Markenschutz |
| **Nebenbefund** | `images/partner-vd-alusysteme.png` **und** `images/vd_partner-vd-alusysteme.png` sind laut Inventar Duplikate desselben VD-Logos. Das Logo ist eine **Fremdmarke**: Verwendung nur im Rahmen des Vertrags |
| **Nebenbefund** | `scratch_dd_closed.png` und `scratch_dd_open.png` liegen in der Wurzel, werden von keiner Seite benutzt und sind Arbeitsrückstände – werden aber mit ausgeliefert (siehe Abschnitt 9) |

### 4.10 Broschüre – `assets/broschuere/` (77 Dateien)

| | |
|---|---|
| **Name/Herkunft** | `BV-Broschuere.pdf` (4,4 MB, 36 Seiten) + 36 Seitenbilder (`seite-NN.webp`) + 36 Vorschauen + `og-broschuere.jpg` |
| **Rechteinhaber** | **PDF-Metadaten (ausgelesen 08.11.2026):** Title „BV AussenSysteme Produktbroschüre", **Author „BV AussenSysteme GbR"**, Creator Chromium, Producer Ghostscript, erstellt 06.11.2026. Das Dokument ist also **selbst erzeugt** |
| **Lizenztyp** | Layout und Text: eigenes Werk. **Die abgebildeten Fotos darin: offen** |
| **Kommerziell / Bearbeitung** | für das eigene Layout ja |
| **Namensnennung** | **offen** (hängt an den verwendeten Fotos) |
| **Lizenznachweis** | PDF-Metadaten für die Urheberschaft des Dokuments; **kein** Nachweis für die Bilder darin |
| **offen** | Die Broschüre ist selbst gesetzt, aber sie bebildert sich aus dem Bestand – also mit hoher Wahrscheinlichkeit aus 4.1 bis 4.4. Damit **erbt sie deren offene Fragen und verschärft sie**: Ein PDF zum Herunterladen ist eine Verbreitung in neuer Form, und zwar eine, die der Besucher behält. Wenn die VD-Bildrechte nur die Website decken, deckt sie dieses PDF unter Umständen nicht. Zu klären: Welche Fotos stecken drin, und deckt der Vertrag eine **Printable/Download-Nutzung**? |

### 4.11 Nicht erfasst

`pruefbilder/` (Prüfbilder aus Testläufen) und
`konfigurator-crm-export.zip` (1,4 MB in der Wurzel) sind nicht
durchgesehen. Das ZIP enthält laut Namen eine Konfigurator-Ausfertigung
für ein CRM; `export/konfigurator/` daneben ist eine entpackte
Entsprechung und enthält eine zweite Kopie von three.js (MIT-Kopf
vorhanden, geprüft).

---

## 5. Icons und SVG

### 5.1 Eigene Symbolsammlung ✅ **sauber, soweit prüfbar**

| | |
|---|---|
| **Name/Herkunft** | `js/bv-symbole.js` – 10 Symbole (kekse, geschenk, haken, kreuz, ort, lupe, pause, abspielen, zuruecksetzen, zahnrad); dazu ein Sprite mit **25 `<symbol>`** direkt in `konfigurator.html` (Z. 1772–1805) |
| **Rechteinhaber** | BV AussenSysteme (selbst gezeichnet) |
| **Lizenztyp** | eigenes Werk |
| **Kommerziell / Bearbeitung** | ja |
| **Namensnennung** | nein |
| **Lizenznachweis** | Kopfkommentar `js/bv-symbole.js` Z. 15–16: „Jedes Symbol ist ein eigener Pfad, 24 x 24, nur Striche in currentColor … Keine fremde Sammlung, kein fremder Pfad, keine nachgeladene Datei". Anlass: Betreiberansage vom 31.10.2026. Geprüft von `scripts/pruefe-symbole.js` |
| **Vergleich mit bekannten Garnituren** | Verglichen mit Feather/Lucide-Konventionen: **gleiches Raster** (24 × 24, Strich in `currentColor`) – das ist die Konvention, nicht die Zeichnung. Die **Koordinaten weichen durchweg ab**: Haken hier `M5 12.5l4.6 4.6L19 7.3`, Feather `M20 6L9 17l-5-5`; Ortsmarke hier `M12 21.5s6.5-6.3 6.5-11a6.5 6.5 0 1 0-13 0…`, Lucide anders aufgebaut. **Kein übernommener Pfad gefunden.** Im Repository gibt es auch keinen Verweis auf Feather, Lucide, Heroicons, Bootstrap Icons, Font Awesome, Material Icons, Phosphor oder Tabler als geladene Datei |
| **offen** | `js/anfrage-wizard.js` Z. 167 trägt den Kommentar „SVG-Icons (**Feather-Stil**, stroke=currentColor)". „Stil" ist keine Übernahme, und die Pfade dort sind nicht aus Feather. Aber: Der Hinweis gehört präziser formuliert, damit niemand später daraus liest, hier dürfe Feather eingebaut werden |

### 5.2 Fremde Markenlogos als SVG-Pfade → **Risiko 2**

| | |
|---|---|
| **Name/Herkunft** | Inline-SVG in **54 HTML-Dateien** (u. a. `index.html`, alle Standortseiten, alle Ratgeberseiten, `datenschutz.html`, `agb.html`, `werkstatt/index.html`, `export/konfigurator/index.html`): die Logos von **Facebook**, **Instagram**, **YouTube** und **WhatsApp**, jeweils `viewBox="0 0 24 24"`, `fill="currentColor"` |
| **Rechteinhaber** | **Marken:** Meta Platforms, Inc. (Facebook, Instagram, WhatsApp), Google LLC (YouTube). **Pfadzeichnung:** unbekannte Icon-Garnitur |
| **Lizenztyp** | **unbekannt.** Verglichen mit Simple Icons (CC0): Der dortige Facebook-Pfad beginnt `M9.101 23.691v-7.98H6.627…` und ist **ein anderer**. Die hier verbauten Pfade (`M24 12.073C24 5.405 18.627 0 12 0S0 5.405…` für Facebook, `M12 2.163c3.204 0 3.584.012 4.85.07…` für Instagram) entsprechen der weit verbreiteten 24er-Fassung der Font-Awesome-Markenzeichen, ließen sich aber am 08.11.2026 **keiner Garnitur sicher zuordnen** |
| **Kommerziell** | **offen** (Icon-Lizenz unbekannt). **Daneben** steht das Markenrecht, das von keiner Icon-Lizenz berührt wird |
| **Bearbeitung** | **offen** – und markenrechtlich ohnehin heikel: Brand Guidelines verbieten Verzerren, Umfärben und Zusammensetzen. `fill="currentColor"` färbt das Logo in die Textfarbe um |
| **Namensnennung** | **offen.** Wenn die Pfade aus **Font Awesome Free** stammen, ist das **CC BY 4.0** – dann ist eine Namensnennung **Pflicht** und fehlt. Wenn aus Simple Icons (CC0), wäre keine nötig – aber die Pfade passen nicht zu Simple Icons |
| **Lizenznachweis** | **keiner.** Weder ein Lizenzkopf an den SVG-Stellen noch eine Lizenzdatei noch ein Eintrag in der Doku |
| **offen** | (1) **Aus welcher Garnitur stammen die Pfade?** Davon hängt ab, ob eine Namensnennung fehlt. (2) Erlauben Metas und Googles Brand Guidelines die Verwendung in dieser Form (eingefärbt, als Schaltfläche mit eigener Hintergrundfarbe `social-btn--facebook`)? (3) **Der Widerspruch im Haus:** `CLAUDE.md` verlangt „Keine fremden Namen … keine übernommenen Icons", und `js/bv-symbole.js` behauptet „Keine fremde Sammlung, kein fremder Pfad". Beides gilt für die eigene Sammlung – an den Markenlogos aber vorbei. Entweder wird die Regel präzisiert („Markenlogos sind ausgenommen, weil die Marke nur so wiedererkennbar ist") oder die Logos werden ersetzt. Schweigen lässt eine Prüfregel entstehen, die ihre eigene Hauptausnahme nicht kennt |

**Einschätzung (keine Rechtsberatung):** Markenlogos als Link zum eigenen
Profil zu verwenden, ist branchenüblich und in der Regel als
Bestimmungshinweis zulässig – riskant ist nicht der Zweck, sondern (a) die
**unklare Icon-Lizenz** mit möglicher Namensnennungspflicht und (b) die
**Einfärbung**. Beides lässt sich ohne Aufwand beseitigen: Garnitur klären,
Herkunft und Lizenz in einer `HERKUNFT.md` festhalten, oder auf die
offiziellen Markenzeichen der Anbieter wechseln.

### 5.3 Trustindex-Siegel

| | |
|---|---|
| **Name/Herkunft** | `index.html` Z. 1024 – Link auf `trustindex.io/reviews/bv-aussensysteme.de`, CSS-Klasse `trust-badge` |
| **Lizenztyp** | **offen** – Nutzungsbedingungen von Trustindex nicht geprüft |
| **Lizenznachweis** | keiner; `datenschutz.html` Z. 411 verweist auf deren Datenschutzerklärung |
| **offen** | Wird nur verlinkt oder auch ein Siegel/Logo von Trustindex gezeigt? Falls ein Siegel: Deckt der (ggf. kostenlose) Tarif die Verwendung? **Kein** Trustindex-Skript in der CSP – es wird also nichts von dort geladen, nur verlinkt |

---

## 6. Kartendienste und Geodaten

### 6.1 OpenStreetMap-Kacheln, Nominatim, Photon

| Ressource | Rechteinhaber | Lizenz / Bedingungen | Kommerziell | Bearbeitung | Namensnennung | Nachweis | offen |
|---|---|---|---|---|---|---|---|
| **OSM-Kacheln** `{s}.tile.openstreetmap.org` – `einzugsgebiet.html` Z. 432, `windzonen.html` Z. 1083, `baugenehmigung.html` Z. 1105 | OpenStreetMap-Mitwirkende / OSM Foundation (Betrieb) | **Daten: ODbL 1.0.** Kacheldienst: **Tile Usage Policy**, keine Lizenz, keine Zusage | **nicht zugesagt.** Die Policy erlaubt sie nicht und verbietet sie nicht; sie schreibt ausdrücklich, dass kommerzielle Nutzer besonders damit rechnen müssen, **ohne Vorwarnung gesperrt** zu werden | – | **Pflicht:** sichtbarer Vermerk „© OpenStreetMap-Mitwirkende" | <https://operations.osmfoundation.org/policies/tiles/>, geprüft 08.11.2026 | siehe unten |
| **Nominatim** `nominatim.openstreetmap.org/search` – `windzonen.html` Z. 1355, `baugenehmigung.html` Z. 1539 | OSM Foundation | **Nominatim Usage Policy**; Daten ODbL | wie oben: nicht zugesagt, Sperrung möglich | – | **Pflicht** (ODbL) | <https://operations.osmfoundation.org/policies/nominatim/>, geprüft 08.11.2026 | siehe unten |
| **Photon** `photon.komoot.io/api/` – `windzonen.html` Z. 1335 + 1555, `baugenehmigung.html` Z. 1067 + 1480 | komoot GmbH (Betrieb), Software: Photon-Urheber; Daten: OSM | **Software Apache-2.0.** Öffentliche API: frei „for your project", **„extensive usage will be throttled"**, keine Verfügbarkeitszusage | **nicht ausdrücklich geregelt** – weder erlaubt noch verboten | – | laut README der API **keine** Pflicht; die OSM-Daten dahinter stehen aber unter ODbL | <https://github.com/komoot/photon>, geprüft 08.11.2026 | siehe unten |

**Was gut gelöst ist:**

- Der **OSM-Vermerk steht auf allen drei Kartenseiten** und ist sichtbar
  im Kartenrahmen (`attribution:` im `L.tileLayer`-Aufruf) – nicht
  versteckt, nicht ausblendbar. Das ist die Hauptpflicht, und sie ist
  erfüllt.
- Die **Nominatim-Policy verbietet Autovervollständigung ausdrücklich**
  („The API must not be used to implement client-side autocomplete"). Die
  Vorschlagsliste während des Tippens läuft hier über **Photon**
  (`wzAcFetch()`, `windzonen.html` Z. 1553 ff.; `baugenehmigung.html`
  Z. 1067) – Nominatim wird **nur als Rückfallweg für eine einzelne,
  abgeschickte Abfrage** benutzt, mit `limit=1`. Je Seite genau zwei
  Nominatim-Vorkommen. **Die Policy ist damit eingehalten** – das ist kein
  Zufall, sondern sieht nach Absicht aus.
- `Referrer-Policy: strict-origin-when-cross-origin` in `_headers` sendet
  die Herkunft weiter. Die Tile Policy verbietet das **Entfernen** des
  Referrers; hier wird er gesendet.

**offen (an den Betreiber):**

1. **Betriebsrisiko, nicht Lizenzrisiko:** Beide OSM-Dienste und Photon
   sagen „kann jederzeit gesperrt werden, keine Zusage, erst recht für
   gewerbliche Nutzung". Fällt der Dienst aus, fällt der Windzonen- und
   der Baugenehmigungsrechner aus – zwei Werkzeuge, die Anfragen bringen.
   Zu entscheiden: hinnehmen, oder auf einen bezahlten Anbieter mit
   Zusage wechseln (MapTiler, Stadia, Geoapify – alle ab wenigen Euro im
   Monat für diese Mengen).
2. **Nominatim verlangt einen identifizierenden `User-Agent` oder
   `Referer`.** Aus dem Browser sendet der Browser seinen eigenen
   `User-Agent` – ein eigener ist per `fetch()` **nicht setzbar**.
   Getragen wird die Identifizierung also allein vom `Referer`. Das ist
   zulässig („a valid HTTP Referer **or** User-Agent"), aber es ist der
   einzige Faden. Besucher mit strenger Referrer-Einstellung erscheinen
   dort als anonym.
3. **Photon-API: keine Zusage für gewerbliche Nutzung.** Die Seite nennt
   kommerzielle Nutzung nicht – weder erlaubend noch verbietend. Wer
   Verlässlichkeit braucht, betreibt Photon selbst (Apache-2.0 erlaubt
   das) oder zahlt.

### 6.2 Lastzonendaten DIBt / BKG → **Risiko 3**

| | |
|---|---|
| **Name/Herkunft** | `js/dibt-lastzonen.js` (Windzonen nach Landkreisen, Stand 02.06.2022; Schneelastzonen, Stand 07.02.2023) und `data/lastzonen_deutschland.geojson` (148 KB, Kreismittelpunkte als Punkt-Features) |
| **Rechteinhaber** | **Deutsches Institut für Bautechnik (DIBt)**, Berlin. Normbezug: DIN EN 1991-1-4/NA und DIN EN 1991-1-3/NA (Eurocode 1) – die **Normtexte selbst** liegen beim DIN |
| **Lizenztyp** | **widersprüchlich dokumentiert.** `js/dibt-lastzonen.js` Z. 4–5: „Die Quelldaten sind öffentliche Technische Baubestimmungen des DIBt – **Freie Nutzung für nichtkommerzielle und informatorische Zwecke**". Die GeoJSON-Metadaten sagen weicher: „Öffentliche Technische Baubestimmungen, kostenfrei zugänglich" |
| **Kommerziell** | **offen – und genau hier liegt das Problem.** Die Seite ist gewerblich; der Windzonenrechner ist ein Verkaufswerkzeug für Terrassenüberdachungen. Wenn der eigene Kommentar stimmt, ist die Nutzung **nicht gedeckt** |
| **Bearbeitung** | **tatsächlich erfolgt:** aus den amtlichen Zuordnungstabellen ist eine JS-Datenstruktur und eine GeoJSON-Punktdatei mit Kreismittelpunkten geworden |
| **Namensnennung** | DIBt wird in den Kopfkommentaren genannt; **auf der Seite selbst** nennt `windzonen.html` Z. 1084 „© OpenStreetMap-Mitwirkende \| © BKG 2025 dl-de/by-2-0" |
| **Lizenznachweis** | **nur die eigenen Kommentare.** Keine abgerufene Lizenzaussage des DIBt im Repository, kein Prüfdatum |
| **offen** | (1) **Woher kommt die Angabe „nichtkommerziell"?** Entweder sie ist belegt – dann ist die gewerbliche Nutzung ungedeckt und muss geklärt werden. Oder sie ist nicht belegt – dann ist der Kommentar falsch und gehört korrigiert, weil er künftige Leser in die Irre führt. (2) **Die BKG-Namensnennung in Z. 1084 hängt an den OSM-Kacheln, obwohl die Kacheln nicht vom BKG kommen.** Welche BKG-Daten sind verbaut, und ist `dl-de/by-2-0` die richtige Lizenz dafür? Falls keine BKG-Daten verbaut sind: Die Nennung ist gegenstandslos und sollte weg – eine falsche Quellenangabe ist schlechter als keine. (3) **Haftung statt Lizenz:** Lastzonen sind standsicherheitsrelevant. `js/dibt-lastzonen.js` hat dafür den richtigen Hinweis („Verbindlich sind die amtlichen Bekanntmachungen der Länder") – der muss auch **auf der Seite** sichtbar stehen, nicht nur im Quelltext |

### 6.3 Landesbauordnungen – `js/baugenehmigung-data.js`

| | |
|---|---|
| **Name/Herkunft** | Verfahrensfreiheitsgrenzen der 16 Bundesländer, Stand 2025/2026 |
| **Rechteinhaber** | Gesetzestexte: **amtliche Werke, § 5 UrhG – gemeinfrei.** Die Zusammenstellung, Auswahl und Formulierung: eigenes Werk |
| **Lizenztyp** | gemeinfrei (Quelle) + eigenes Werk (Darstellung) |
| **Kommerziell / Bearbeitung / Namensnennung** | **alles erlaubt, keine Nennung nötig** – § 5 UrhG |
| **Lizenznachweis** | Kopfkommentar mit Paragraphenangaben; drei Länder sind „am Gesetzestext gegengeprüft (Stand 09/2026)" |
| **offen** | Lizenzrechtlich **nichts**. Aber: 13 der 16 Länder sind laut Kopfkommentar „Übersichtsangaben ohne Einzelprüfung am Gesetzestext". Das ist ein **Haftungs**thema – ein Besucher, der sich auf eine falsche Freigrenze verlässt und ohne Genehmigung baut, hat einen Schaden. Der Hinweis „Ohne Gewähr" steht im Kopfkommentar; er muss auf der Seite stehen |

---

## 7. Formular-, Mess- und Datendienste

Hier geht es nicht um Urheberrecht – diese Dienste liefern keine Assets,
sie verarbeiten Daten. Erfasst, weil sie in der CSP stehen und der Auftrag
danach fragt.

| Dienst | In der CSP? | Benutzt? | Wo | Lizenz/Bedingungen | offen |
|---|---|---|---|---|---|
| **Web3Forms** | ja – `connect-src https://api.web3forms.com` | **ja, primär** | `js/anfrage-wizard.js` Z. 10 („primärer E-Mail-Weg (kostenlos)"); `widerruf.html` Z. 152 als `<form action>` | Nutzungsbedingungen des Anbieters; **am 08.11.2026 nicht abrufbar (HTTP 403 auf `web3forms.com/terms`)** | Anbieter, Firmensitz, Serverstandort und AVV nach Art. 28 DSGVO sind hier **nicht geprüft**. `datenschutz.html` Z. 286–288 sagt pauschal „Soweit erforderlich, bestehen … Auftragsverarbeitungsverträge (AVV)". **„Soweit erforderlich" ist keine Aussage.** Entweder liegt ein AVV vor oder nicht – und der Satz soll sagen, was zutrifft |
| **Formspree** | ja – `connect-src https://formspree.io` | **ja, aber nur als Rückfall** | `js/anfrage-wizard.js` Z. 9 („nur noch Notfall-Backup"), `js/main.js` Z. 139, Formular-ID `xnjkabdv` | Nutzungsbedingungen des Anbieters; **nicht geprüft** | Formspree, Inc. sitzt in den **USA** (so auch in `datenschutz.html` Z. 279 benannt). Drittlandübermittlung – liegt ein AVV mit Standardvertragsklauseln vor? Nebenbefund: Ein „Notfall-Backup", das mit einem festen Formular-Endpunkt in der ausgelieferten Datei steht, ist ein dauerhaft offener Weg in ein Drittland |
| **Metricool** | ja – `script-src` + `img-src` + `connect-src` | **ja, erst nach Einwilligung** | `js/metricool.js`; eingebunden auf praktisch allen Seiten | Nutzungsbedingungen des Anbieters; nicht geprüft | **Gut gelöst:** Das Skript wird erst geladen, wenn `bv_cookie_consent` eine Analyse-Einwilligung enthält (`hasAnalyticsConsent()`), und reagiert auf `bv_consent_given`. Das ist die richtige Reihenfolge |
| **Neon (Postgres)** | nein – läuft serverseitig | **ja** | `worker/index.js` Z. 1, 207, 409, 456 über `@neondatabase/serverless` (MIT) | Treiber MIT; Dienst nach Vertrag mit Neon, Inc. | `datenschutz.html` Z. 270–273 nennt Serverstandort Frankfurt am Main. AVV-Frage wie oben |
| **Eigene Messung** | – | ja | `messungBesucher()` in `worker/index.js` | eigenes Werk | Kein Lizenzthema. **Aber die Dauerregel aus `CLAUDE.md` gilt:** Ändert sich der Umfang der Messung, muss `datenschutz.html` im selben Zug mitgeändert werden |

---

## 8. Die Skills unter `.claude/skills/`

14 Unterordner. Sie werden **nicht ausgeliefert** (`.claude/` steht in
`.assetsignore`), liegen aber im Repository und werden damit
weitergegeben, wenn das Repository weitergegeben wird.

| Skill | Quelle | Rechteinhaber | Lizenz | Kommerz. | Bearb. | Nennung | Nachweis | offen |
|---|---|---|---|---|---|---|---|---|
| `ui-ux-pro-max` | `github.com/nextlevelbuilder/ui-ux-pro-max-skill` v2.15.0 | Next Level Builder | **MIT** | ja | ja | ja | `LICENSE` („© 2024") + `HERKUNFT.md` | – |
| `animate`, `animation-performance`, `break-ui`, `emil-design-eng`, `mobile-native`, `review-animations` (6) | `github.com/emilkowalski/skills` | Emil Kowalski | **MIT** | ja | ja | ja | je `LICENSE.txt` („© 2026") + `HERKUNFT.md` | – |
| `accessibility-audit`, `design-critique` | `github.com/cuellarfr/design-skills` | Carlos C. | **MIT** | ja | ja | ja | je `LICENSE.txt` („© 2026") + `HERKUNFT.md` | – |
| `frontend-design` | `github.com/anthropics/skills` | Anthropic | **Apache-2.0** | ja | ja | ja – plus Pflicht, Änderungen zu kennzeichnen und `NOTICE` mitzuführen, falls vorhanden | `LICENSE.txt` + `HERKUNFT.md` | Gibt es im Ursprung eine `NOTICE`-Datei? Apache-2.0 § 4 d verlangt, sie mitzuführen. Nicht geprüft |
| `3d-high-resolution-textures` | `github.com/MengTo/Skills` | Meng To | **MIT** | ja | ja | ja | `LICENSE` („© 2026 Meng To") + `HERKUNFT.md` | – |
| `web-interface-guidelines` | `github.com/vercel-labs/web-interface-guidelines` | Vercel Labs | **MIT** | ja | ja | ja | `LICENSE.txt` („© 2025") + `HERKUNFT.md` | – |
| `three-best-practices` | `github.com/emalorenzo/three-agent-skills` v1.2.0 | „die Urheber von three-agent-skills" | **MIT** – aber **belegt nur über `package.json`** | ja | ja | ja | `HERKUNFT.md`: „eine LICENSE-Datei liegt dem Ursprungsverzeichnis nicht bei – der Urhebervermerk wird deshalb hier geführt" | **Kleine Lücke:** MIT verlangt, Copyright-Vermerk **und** Lizenztext mitzuführen. Hier fehlt beides als Datei, und der Rechteinhaber ist namentlich unbekannt. Abhilfe: MIT-Text + Verweis auf die `package.json`-Angabe hinterlegen, oder beim Urheber nachfragen |
| `apple-design` | `github.com/dickwu/apple-design-skill` | unbekannt (Skill), **Apple Inc.** (die HIG-Texte) | **KEINE** – „das Repository enthält keine Lizenzdatei" | **offen** | **offen** | **offen** | `HERKUNFT.md` | **Die einzige echte Lücke.** Ohne Lizenz gilt der gesetzliche Zustand: alle Rechte beim Urheber, keine Nutzung oder Weitergabe erlaubt. Dass die Dateien hier liegen, ist bereits eine Vervielfältigung – im Geschäfts-Repository eines Betriebs. **Gut gelöst ist die Hauptsache:** Die 123 HIG-Seiten mit Apples Originaltext wurden **nicht** mitkopiert, mit Begründung in `references/hig/HINWEIS.md` („Das Quell-Repository hat keine Lizenzdatei … Damit wäre dieses Geschäfts-Repository der Ort, von dem aus Apples Dokumentation weiterverbreitet wird"). Das war die richtige Entscheidung. Offen bleibt der **Rest** des Skills (`SKILL.md`, `code-audit.md`, `cross-platform.md`, `hig-lookup.md`, `scripts/`): auch der ist unlizenziert |

**Gesamtbild:** 13 von 14 Skills sind sauber belegt – MIT oder Apache-2.0,
Lizenzdatei liegt daneben, Herkunft mit Datum und Prüfvermerk in einer
`HERKUNFT.md`. **Das ist deutlich sorgfältiger als der Rest des
Projekts**, und es ist die Vorlage, nach der die Bilder behandelt werden
sollten: Herkunft, Lizenz, Prüfdatum, Nachweisdatei daneben.

Zwei Dinge gehören angefasst: `apple-design` (keine Lizenz) und
`three-best-practices` (Lizenztext fehlt als Datei).

**Nebenbefund, kein Lizenzthema:** Mehrere `HERKUNFT.md` halten fest, dass
die Installationsskripte der Ursprungsprojekte **nicht ausgeführt** wurden
und dass die Dateien vor dem Einbau auf Skripte und Netzaufrufe geprüft
wurden. Mehrere notieren, dass vorgeschriebene Begrüßungszeilen der
Urheber („respond only with …") als Eigenwerbung behandelt und nicht
befolgt werden. Das ist genau das richtige Vorgehen bei fremden Skills.

---

## 9. Nebenbefund: was öffentlich ausgeliefert wird

Kein Lizenzthema, aber es berührt dieses Register, weil es bestimmt,
welche Dateien überhaupt nach außen gehen.

`wrangler.jsonc` liefert das Verzeichnis `"."` aus – **alles**, was nicht
in `.assetsignore` steht. Ausgeschlossen sind unter anderem `docs/`,
`daten/`, `scripts/`, `src/`, `node_modules/`, `.claude/`, `worker/`,
`CLAUDE.md`, `PROJEKTSTAND.md`.

`.assetsignore` hält selbst fest, dass das am 05.11.2026 **nachgemessen**
wurde, weil vorher 2250 Dateien aus `node_modules/` und mehrere
Prüfskripte offen lagen. Diese Datei ist also schon einmal die
Reißleine gewesen.

**Nicht ausgeschlossen** und damit öffentlich: `export/`,
`konfigurator-crm-export.zip` (1,4 MB), `pruefbilder/`, `entwurf/`,
`entwurf.html`, `entwurf-apple.html`, `entwurf-produkt.html`,
`scratch_dd_closed.png`, `scratch_dd_open.png`, `_template.html`.

Für dieses Register heißt das: **Jede offene Bildrechtsfrage aus
Abschnitt 4 gilt auch für die Kopien in `export/` und im ZIP.** Wer später
VD-Bilder entfernt, muss dort ebenfalls nachsehen – `git rm images/vd_*`
erreicht sie nicht.

---

## 10. Offene Fragen an den Betreiber, gebündelt

Nach Dringlichkeit. Keine davon lässt sich aus dem Repository beantworten.

**Zuerst – es geht um viele Dateien oder um Geld:**

1. **Stoffbilder (434 Dateien):** Liegt für die Bilder aus der Stoffkarte
   eine schriftliche Nutzungseinräumung vor? Von wem – VD oder der
   Weberei? Deckt sie Zuschnitt und Veröffentlichung im Netz?
2. **`prod_*`-Bilder (22 Dateien):** Sind das unmarkierte Kopien der
   VD-Bilder? Falls ja, ist das `vd_`-Präfix als Lösch-Markierung
   unvollständig und `docs/VD-INHALTE-INVENTAR.md` muss nachgezogen
   werden.
3. **Markenlogos (54 Dateien):** Aus welcher Icon-Garnitur stammen die
   Pfade? Falls Font Awesome Free: CC BY 4.0 verlangt eine Namensnennung,
   die fehlt.
4. **Google Fonts:** Lokal ausliefern? Die OFL erlaubt es, es kostet einen
   Nachmittag, und es nimmt das Abmahnrisiko aus der Seite.
5. **DIBt-Daten:** Woher kommt die Angabe „nichtkommerzielle Nutzung" im
   eigenen Kommentar – belegt oder geraten?

**Danach – einzelne Dateien, aber unangenehm:**

6. **Zertifikatsbilder:** Liegt die schriftliche Einwilligung der beiden
   genannten Personen vor? Erlaubt VD die Abbildung der Urkunde?
7. **Broschüren-PDF:** Welche Fotos stecken drin, und deckt der
   VD-Bildvertrag eine Download-Nutzung – nicht nur die Website?
8. **Galeriefotos:** Selbst aufgenommen oder beauftragt? Zeigen sie
   Kundenanlagen, und liegt die Einwilligung vor?
9. **Wizard-Kacheln (46 ungeklärte) und Konfigurator-Bilder (14):** Je
   Datei – eigene Aufnahme oder Herstellerbild?
10. **BKG-Namensnennung** in `windzonen.html` Z. 1084: Welche BKG-Daten
    sind verbaut? Falls keine: Nennung entfernen.

**Formell, aber schnell erledigt:**

11. **AVV:** Liegen Auftragsverarbeitungsverträge mit Web3Forms,
    Formspree, Metricool und Neon vor? `datenschutz.html` sagt „soweit
    erforderlich" – das soll sagen, was zutrifft.
12. **`apple-design`-Skill:** unlizenziert. Entfernen, oder beim Urheber
    nach einer Lizenz fragen.
13. **`three-best-practices`:** MIT-Lizenztext als Datei nachlegen.
14. **Logo:** Liegen die Nutzungsrechte vollständig beim Betrieb? Ist die
    Marke angemeldet?
15. **Kartendienste:** OSM-Kacheln, Nominatim und Photon ohne Zusage
    weiter nutzen, oder auf einen bezahlten Anbieter wechseln? Das ist
    eine Betriebs-, keine Lizenzentscheidung – aber sie betrifft zwei
    Werkzeuge, die Anfragen bringen.

---

## 11. Was geprüft wurde – und was nicht

**Geprüft am 08.11.2026:**

- `package.json` und alle 134 Pakete unter `node_modules/` (Lizenzfeld
  ausgelesen)
- alle 64 HTML-Dateien auf `<script src>` / `<link href>` zu fremden Hosts
- `_headers` (CSP) gegen die tatsächliche Verwendung jedes erlaubten Hosts
- `assets/js/`, `js/vendor/`, `export/konfigurator/js/vendor/` –
  Lizenzköpfe in den Dateien
- alle Bilder unter `images/`, `assets/`, Wurzel – nach Präfix gezählt und
  gruppiert
- `js/bv-symbole.js` und das Sprite in `konfigurator.html`, verglichen mit
  Feather/Lucide/Simple-Icons-Pfaden
- alle 14 `HERKUNFT.md` und alle 12 Lizenzdateien unter `.claude/skills/`
- Netzabrufe: OSM Tile Policy, Nominatim Policy, Photon (GitHub), Leaflet
  LICENSE, Google-Fonts OFL für Inter und Barlow Condensed,
  ambientCG-Lizenz
- `pdfinfo` auf `assets/broschuere/BV-Broschuere.pdf`

**Nicht geprüft – bewusst:**

- **Bildinhalte.** Kein Bild wurde angesehen. Die Gruppierung folgt
  Dateinamen und der vorhandenen Dokumentation. Ein als eigenes Foto
  geführtes Bild kann ein Herstellerbild sein und umgekehrt.
- **Verträge.** Der VD-Liefervertrag und die „vertrauliche Doku" liegen
  nicht im Repository.
- **`pruefbilder/` und `konfigurator-crm-export.zip`** – nicht
  durchgesehen.
- **Nutzungsbedingungen von Web3Forms, Formspree, Metricool, Neon und
  Trustindex** – nicht gelesen. Web3Forms antwortete am 08.11.2026 mit
  HTTP 403.
- **Eine vollständige SBOM.** Zwei Build-Pakete (Python-2.0,
  BlueOak-1.0.0) sind nicht namentlich aufgelöst; sie werden nicht
  ausgeliefert.
- **Datenschutz.** Nur dort erwähnt, wo er an einer Lizenzfrage hängt
  (Google Fonts, Zertifikatsbilder, Formulardienste). Eine
  Datenschutzprüfung ist das hier nicht.

**Nichts geändert.** Diese Datei ist die einzige neue Datei; kein Commit,
kein Push.
