# Offene Nebenbefunde

> Ausgelagert aus `docs/NEXT_TASK.md` am 23.11.2026, weil der Einstieg
> auf 662 Zeilen gewachsen war und damit niemand mehr ihn liest.
> **Hier steht nichts Erledigtes.** Alles darunter ist offen, aber
> nicht dringend: Es blockiert keine Veröffentlichung und wartet
> entweder auf eine Entscheidung des Betreibers oder auf einen eigenen
> Auftrag. Der Einstieg verweist hierher.


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


## Offener Altbefund: Die Seite rollt im Konfigurator mit (22.11.2026)

`scripts/pruefe-schrittwechsel.mjs` meldet: Am großen Bildschirm
(1440 px) rollt beim Klick auf „Weiter" die ganze Seite um 64 px,
obwohl dort nur das Bedienfeld in sich rollen soll. Gemessen
`pageYOffset 64`, erwartet höchstens 4.

**Nicht von der Arbeit vom 21./22.11.2026.** Gegengeprüft in einem
eigenen Arbeitsbaum auf Commit 06ca2db, dem Stand vom
Sitzungsbeginn: derselbe Fehler, dieselbe Zahl.

Nicht angefasst, weil er im 3D-Konfigurator sitzt und damit unter
Bestandsschutz steht. Braucht einen eigenen Auftrag.

**Dazu ein Hinweis für den nächsten vollständigen Prüflauf:** Die
fünf Konfigurator-Prüfungen (`keil-editor`, `planken-editor`,
`rahmen-editor`, `schiebe-velaris`, `schrittwechsel`) brechen mit
`TimeoutError` ab, wenn zwölf Browser gleichzeitig laufen. Einzeln
laufen sie durch. Das ist Überlast, kein Befund.


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


## Offen beim Betreiber nach der SEO-Runde (22.11.2026)

- **Neuwied: 25 km oder 40 km?** `carport-neuwied.html:216` sagt „rund
  25 km", `terrassenueberdachung-neuwied.html:216` sagt „rund 40 km".
  Beides steht für Kunden sichtbar auf der Seite, eine der beiden
  Zahlen ist falsch. Gefragt am 22.11.2026, nicht beantwortet. **Nicht
  geändert**, weil es sichtbarer Text ist.
- **Einzugsgebiet: 60 km gilt.** Vom Betreiber am 22.11.2026
  bestätigt. Die Zahl steht auf 16 Seiten und im Datenblock, überall
  gleich. Die 50 km aus älteren Notizen sind damit erledigt.
- **AGB, Impressum, Datenschutz tragen `noindex`.** Ob das so bleiben
  soll, ist offen. Siehe `docs/rechtstexte-befunde.md`. Die
  widersprüchlichen Sitemap-Einträge sind raus.
- **Partnerseite:** Die Hauptüberschrift „VD AluSysteme Partner" steht
  unsichtbar 9999 px außerhalb des Bildes, sichtbar ist „Unsere
  Partner" als h2. Vorschlag beim Betreiber: die sichtbare Überschrift
  zur h1 machen und die unsichtbare löschen. Das ändert am Aussehen
  nichts. Noch nicht entschieden.
- **Weitere Befunde der SEO-Prüfung**, nicht bearbeitet, weil Text
  oder Inhalt: zu lange Seitentitel und Beschreibungen (zehn Stellen),
  die sieben `terrassenueberdachung-*`-Ortsseiten sind weitgehend
  Schablone mit einem eigenen Absatz, Brotkrumen im Datenblock ohne
  sichtbare Brotkrumen auf 19 Seiten, zwei widersprüchliche
  Geo-Koordinaten für denselben Betrieb, Carport- und
  Pergola-Ortsseiten hängen nur an Geschwisterseiten.


## Spaeter pruefen (Nebenbefunde 14.11.2026)

- ~~**Vier JavaScript-Dateien ohne Cache-Buster.**~~ **Erledigt am
  22.11.2026.** Beides gemacht: Alle eigenen JS- und CSS-Verweise
  tragen jetzt `?v=`, und `scripts/pruefe-cache-buster.sh` hat eine
  dritte Prüfung „ganz ohne Version", mit Gegenprobe in beide
  Richtungen. Dabei kam heraus, dass `main.js` auf `index.html` eine
  andere Version trug als auf den übrigen Seiten, und dass die
  Version von `style.css` nach der Änderung am Fokusring stehen
  geblieben war. Einzelheiten in `docs/entscheidungen.md`.
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
- **Beliebtheit der Stoffe: ab jetzt doch messbar** (22.11.2026,
  Befund der Gegenprüfung). `js/messung.js` meldet bei jedem Klick auf
  ein `<a>` oder `<button>` dessen Beschriftung als Ereignis `klick`.
  Die 53 neuen Stoffkacheln tragen ein `aria-label` („Acrylstoff
  Dessin AC112 auf der Stoffseite ansehen"), werden also ab sofort
  einzeln gezählt. **Kein neuer Umfang der Messung**, das gab es
  vorher schon für alle Knöpfe, und die Datenschutzerklärung
  beschreibt es in `src/datenschutz.njk` (Beschriftung eines
  angeklickten Knopfes). Nach einigen Wochen steht die Rangfolge
  damit in den eigenen Zahlen. Abfrage: Ereignisse der Art `klick`
  mit `zusatz LIKE '%Dessin%'` gruppieren.
- **Alt, überholt durch den Punkt darüber:** Beliebtheit der Stoffe ist
  rückwirkend nicht messbar.
- **Beliebtheit der Stoffe ist nicht messbar** (22.11.2026). Die
  Tabelle `ereignis` speichert nichts über Stoffe, der Konfigurator
  schickt sein Feld `stoff` nicht in die Messung. Der Betreiber will
  die beliebten Muster vorne im Streifen haben; bis er seine
  Reihenfolge nennt, steht in `scripts/stoff-reihenfolge.txt` die
  Katalogreihenfolge. Wer das messen will, müsste den Konfigurator
  die Stoffnummer melden lassen. **Das ändert den Umfang der Messung
  und zieht eine Änderung der Datenschutzerklärung nach sich.**
- **Keine Sprungmarken je Dessin auf `stoffe.html`** (22.11.2026). Die
  acht Musterkacheln im Abschnitt „Markisenstoffe" der Startseite
  führen auf den Anfang der Stoffseite, nicht auf das angetippte
  Dessin. IDs an den Stoffzeilen würden das lösen; das sind rund 40
  Zeilen in `stoffe.html` und war nicht beauftragt.


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


## Altbefund: Maßschild wird beim Überfahren nicht gold (23.11.2026)

`scripts/pruefe-konfigurator-oberflaeche.mjs`, 1 von 182 Prüfungen:

```
FEHLER  Der Zeiger auf dem Schild ändert das Bild   Rahmen und Stift werden gold
```

**Nicht neu.** Gegengeprüft am 23.11.2026 auf einem Arbeitsbaum des
Standes **vor** der Unterzug-Änderung (Commit `4f3f135`): Dieselbe
Prüfung schlägt dort genauso fehl. Der Befund ist also älter und
unabhängig von den lichten Maßen.

**Was die Prüfung tut.** Sie sucht ein anklickbares Maßschild, klickt
es (das klappt, der Kasten „Breite in mm" geht auf), fährt dann weg,
macht ein Bild, fährt auf das Schild und macht ein zweites. Sind beide
Bilder gleich, gilt der Wechsel auf die goldene Fassung als
ausgeblieben.

**Noch nicht untersucht:** ob der Wechsel wirklich nicht stattfindet
oder ob die Prüfung ihn nur nicht sieht (Zeitfenster, 60-ms-Bremse im
`pointermove`-Hörer, oder ein Schild, das sich beim zweiten Bild an
anderer Stelle befindet). Die Reihenfolge der Aufrufe steht in
`massSchweben()` / `massUnterZeiger()` in `js/konfigurator-frei.js`.


## Nebenbefunde des Prüferdurchgangs 23.11.2026 (Lieferanten-Runde)

Neun Fachbereiche nach `docs/PRUEFER_REIHENFOLGE.md`, Umfang
`9d6f290..HEAD`. Die vier gemessenen Fehler sind behoben, siehe
`docs/entscheidungen.md`. Was hier steht, blieb offen.

### Werkzeuge und Absicherung

- **`scripts/pruefe-mitwachsend.mjs` deckt 11 der 29 geänderten
  Seiten nicht ab.** Die Liste in Zeile 37 bis 41 nennt sieben Seiten.
  **`fassade`, `sonnenschutz` und `pergola` fehlen, also genau die
  drei mit den breitesten Wertetabellen.** Der 320-px-Befund auf
  `fassade` entstand nur, weil ein Prüfer außerhalb der Liste gemessen
  hat. In `CLAUDE.md` steht, dieses Skript sorge dafür, dass „weder
  der Betreiber noch der Assistent daran denken" muss. Für diese
  Seiten stimmt das bis jetzt nicht.
  **Vorsicht beim Nachtragen:** Mit 29 Seiten meldet das Skript 18
  Beanstandungen, davon 15 auch auf dem alten Stand `9d6f290`. Wer die
  Seiten einträgt, muss die 15 Altbefunde mitbehandeln, sonst steht
  die Prüfung dauerhaft auf rot. Das ist ein eigenes Arbeitspaket.
- **Keine der 82 Prüfungen prüft die Farbe eines Fokusrings gegen den
  tatsächlichen Hintergrund.** `pruefe-fokusring.mjs` und
  `pruefe-fokus-verdeckung.mjs` prüfen nur Abschneiden und Verdeckung.
  Genau deshalb blieben die beiden 1,00:1-Ringe unbemerkt, obwohl
  beide Skripte grün waren. Eine Prüfung, die den Ring gegen den
  gemessenen Grund rechnet, fehlt.
- **`scripts/pruefe-einwilligung.mjs` prüft nur die Form des
  Cookie-Fensters, nicht sein Verhalten.** Nicht gemessen wird: ob vor
  dem Klick Anfragen an fremde Hosts hinausgehen, ob nach „Nur
  notwendige" nichts nachlädt, ob `localStorage` vorher leer bleibt,
  ob die Entscheidung ein Neuladen übersteht. Das ist die Kernfrage
  der Einwilligung. Vorschlag: mit `page.on('request')` belegen, dass
  vor der Zustimmung kein Host außer `self` angefragt wird.
  Weiter: Das Skript akzeptiert „Nur notwendige" als Ablehnen-Knopf,
  ohne zu prüfen, **was** der Knopf tut. Ein Knopf „Nur notwendige",
  der `all` speichert, würde bestehen. Und die Gegenprobe zählt nur
  die Anzahl der Beanstandungen, nicht, ob jeder eingebaute Fehler von
  der passenden Prüfung gefunden wurde.
- **`scripts/hole-vd-bilder.sh`**: `curl -L` folgt Weiterleitungen auf
  beliebige Hosts, auch auf `http`. Der MIME-Prüfer lässt
  `image/svg+xml` durch. Derzeit liegt keine SVG unter den 40 Bildern,
  gemessen. Vorschlag: `--proto '=https' --proto-redir '=https'` und
  nur `jpeg`, `png`, `webp` zulassen. Die Liste der Quell-URLs liegt
  nicht im Repository, die Herkunft einzelner Bilder ist später nur
  über `docs/VD-INHALTE-INVENTAR.md` belegbar.

### Barrierefreiheit, offen weil nicht belegbar

- **Scrollbare Wertetabellen ohne `tabindex`.** `.vergleich-wrap` in
  `carport`, `pergola`, `sonnenschutz`, `terrassenueberdachung` und
  `.dw-wrap` in `fassade` scrollen innerhalb ihres Kastens. Gemessen
  bei 390 px: Pergola 620 px Inhalt in 362 px Kasten, Carport 443 px,
  Sonnenschutz 380 px. Die **Seite** scrollt nicht waagerecht, der
  Befund fällt also nicht unter „ragt aus dem Kasten".
  Ob das WCAG 2.1.1 verletzt, ließ sich **nicht belegen**: Seit Chrome
  127 sind scrollbare Bereiche von sich aus tastaturfokussierbar, in
  Safari nicht. In dieser Umgebung steht nur Chromium zur Verfügung.
  Ein `tabindex` fügt auf jeder Produktseite einen Tabulatorhalt
  hinzu, deshalb nicht auf Verdacht gemacht. Zu prüfen auf echtem
  Safari.
  Dazu: Es fehlt ein **sichtbarer** Hinweis, dass gewischt werden
  kann. Beim Carport-Vergleich sieht ein Besucher bei 390 px nur
  Zeilenkopf und etwa eine Modellspalte. Die Überschrift „Die drei
  Carports nebeneinander" liegt **innerhalb** von `.vergleich-wrap`
  und wandert beim Wischen mit aus dem Bild.
- **Überdeckung schwebender Knöpfe, Altbefund.**
  `button#bvKonfigBubble` und `#bv-a11y-trigger` liegen bei 1024 px
  mit 43 × 24 bis 43 × 48 px auf `.produkt-bild-knopf` („Bild groß
  anzeigen"). Betroffen: `bushaltestelle`, `faltdach`, `gartenhaus`,
  `kaltwintergarten`, `sichtschutz`, `velaris`,
  `fahrradueberdachung`, dazu `kaltwintergarten` bei 768 px. Auf dem
  Stand `9d6f290` identisch, also nicht aus dieser Runde. WCAG 2.5.8.
- **`konfigurator.html`, Altbefund.** Fünf `.k3d-marke` messen 18 × 66
  bis 18 × 81 px, Vorgabe 24 px, in allen sieben Breiten. Bei 320 px
  ragt `button#k3dWeiter` 10 px aus dem Kasten. Die Seite ist per 503
  gesperrt und steht nicht in der Liste von `pruefe-mitwachsend`.
- **Der Link „Licht-, Wärme- und Schallwerte im Vergleich"** in
  `src/produkte/kaltwintergarten.njk:165` misst 287 × 22 px bei 1024
  und 1440 px, also unter 24 px Höhe. Er ist **neu** in dieser Runde.
  Er steht mitten im Satz, die Ausnahme für Fließtext-Links nach WCAG
  2.5.8 greift vermutlich. Derselbe Link in `carport.njk:190` wird
  nicht gemeldet. Ungeklärt, ob Befund oder Fehlalarm.
- **Das Cookie-Fenster steht am Ende des Dokuments.** Mit 80
  Tabulatorschritten kam der Prüfer nicht hinein, die Tastatur
  erreicht die Knöpfe also erst nach der ganzen Seite. Es ist kein
  modaler Dialog, deshalb kein formaler Verstoß, aber schwer
  bedienbar. Es trägt `aria-modal="true"`, obwohl die Seite dahinter
  bedienbar bleibt und kein Fokus-Käfig gesetzt ist.
- **Fußzeilen-Überschrift `h4` folgt direkt auf `h2`**, auf allen
  Seiten, in beiden Ständen gleich. Altbefund, 1.3.1 und 2.4.6.

### Ladezeit

- **`produkte/sonnenschutz.html`, Zeilen 501 bis 506:** Vier
  Markisen-JPGs mit zusammen etwa 570 KB werden auf 170 × 130 CSS-px
  dargestellt. Die Dateien sind 1200 px breit. Von jedem existiert ein
  WebP-Zwilling, der 30 bis 40 % kleiner ist (`gelenkarm_offen_b`
  207 KB JPG gegen 131 KB WebP, `kassette_b` 157 gegen 92). Die Seite
  nimmt das JPG. Dazu fehlen `width` und `height`; der gemessene CLS
  war 0, weil das CSS die Höhe festlegt, das Sprungrisiko entsteht
  also erst, wenn dieses CSS wegfällt.
- **`src/produkte/terrassenueberdachung.njk`, Zeile 298 und 313:**
  Zwei Materialbilder ohne `loading="lazy"`, obwohl sie bei y = 4436
  und y = 4963 px liegen, also weit unter dem ersten Bildschirm.
  Geladen werden sie trotzdem sofort, 36 KB plus 39 KB. Zeile 358
  derselben Gruppe **hat** das Attribut, und im Baustein
  `eindeck-karten.njk` ist es überall gesetzt. Es ist also eine
  Unachtsamkeit in der handgeschriebenen Kopie. **Quelle und gebaute
  Seite stimmen überein, es gibt keinen veralteten Build**, das war
  nachgeprüft.
- **`style.css` ist in dieser Runde um 10,7 KB gewachsen** (185,2 auf
  195,9 KB) und hängt an jeder Seite, auch an denen ohne Produkte.
  Ob die neuen Regeln dort überhaupt wirken, ist nicht Regel für
  Regel belegt.
- **Nicht aus dieser Runde, aber die größte Einsparung der
  Startseite:** Neben den WebP werden auch die JPG-Zwillinge
  abgerufen, `vd_prod_terrasse_tds.jpg` 423 KB und
  `vd_prod_carport_tds.jpg` 450 KB. Sieht nach einem
  `<picture>`-Rückfall oder einem Vorlade-Eintrag aus. Ursache nicht
  untersucht.

### Gestaltung und Konsistenz

- **Drei Zwischenradien neben der Skala.** Die Seite hat
  `--radius-sm` 6, `--radius` 10, `--radius-lg` 16, `--radius-xl` 22.
  Die Materialkarten benutzen 14 px (`style.css:4486`), die
  Zubehörbilder 12 px (`:4469`), das Cookie-Fenster 14 px (`:1800`),
  der heller Einstellungsbereich 8 px, die Wertetabellen 12 px.
- **Der Baustein `eindeck-karten.njk` benutzt keine einzige Stufe der
  Schriftleiter.** `0.86rem`, `0.92rem`, `0.82rem`, `0.84rem` gegen
  `--txt-xs` 0,8125, `--txt-sm` 0,9375, `--txt-base` 1. Abstände 20,
  28, 14 und 18 px liegen außerhalb des Rasters 4/8/12/16/24/32/48.
- **Textstile stehen inline im Baustein** (Zeile 26 bis 28, 36, 91),
  obwohl der Kommentar in `style.css:4435` das Verschieben der
  Karten-CSS ausdrücklich mit „gegen zwei Wahrheiten" begründet.
- **Vier eigene Kopien von `.vergleich`**, dazu `.dw-tab` in
  `fassade` als fünfte unter anderem Namen. Sie weichen voneinander
  ab: `thead th` 0,9 rem gegen 0,88 rem, Breite der ersten Spalte
  22 / 18 / 26 % oder keine, `min-width: 620px` nur bei der Pergola,
  `tabular-nums` nur bei `fassade`. Der Kommentar in `carport.njk`
  erklärt die Kopien als Absicht („eine gemeinsame Datei wäre eine
  Abhängigkeit"). Zielkonflikt, nicht ohne Ansage umbauen.
- **Ausgeschriebene Farbwerte statt Token** in `style.css`: `#ccc`
  (Zeile 1838, inzwischen ersetzt), `rgba(196,154,42,0.15)` (1830),
  `#1a1a1a` (1883), `#111111` (1888), `rgba(0,0,0,.92)` (2366), und
  ein eigener Schatten `0 10px 44px rgba(0,0,0,0.42)` (1801) neben den
  vorhandenen `--schatten-1..3`.
- **`docs/WEBSITE_DESIGN_SYSTEM.md` enthält keine Logo-Abstände**,
  obwohl `CLAUDE.md` sie dort verortet („mit den gemessenen Kontrasten
  und Logo-Abständen"). Sie stehen nur in `style.css:360-381`: halbe
  Zeichenhöhe rundum frei, Mindestbreite 160 px. Eine der beiden
  Stellen gehört angepasst.
- **Logo-Abstand am Handy ungemessen.** Rechnerisch bleiben unter dem
  Logo nur rund 10 px bis zum Goldrand, verlangt sind 16. Bei 390 px
  im Browser nachmessen.
- **`images/logo-schwarz-gold.svg` wird nirgends mehr geladen**, ist
  aber noch in `scripts/pruefe-palette.py` und der Doku genannt.
- **Kleintext unter 14 px** an vielen Stellen des Cookie-Fensters und
  der Karten (0,72 bis 0,86 rem bei Gewicht 400). Das Designsystem
  verlangt ab unter 14 px mindestens Medium 500. Die Live-Seite hat
  selbst `--txt-xs` 13 px, das wäre also eine seitenweite
  Entscheidung.
- **Das Cookie-Fenster verdeckt bei 320 × 568 px 75 % des
  Bildschirms**, bei 360 × 640 px 64 %, bei 390 × 844 px 46 %. Kein
  Verstoß gegen eine Pflichtgrenze, aber sehr dominant. Es gibt kein
  festgelegtes Zielmaß, deshalb kein Befund.
- **`env(safe-area-inset-*)` am Cookie-Fenster nicht geprüft.**

### Struktur und Schema.org

- **Produktkarten sind auf allen Seiten `h2`** und stehen damit auf
  derselben Ebene wie ihre eigene Abschnittsüberschrift („X: unsere
  Modelle"). Semantisch wären sie `h3`. Kein WCAG-Fehler, eine
  Gliederungsfrage.
- **Die fünf Ratgeber tragen `dateModified` 2026-07-15** (Kosten:
  2026-07-28), obwohl die Garantiezeilen jetzt geändert wurden. Ob das
  angehoben wird, hängt davon ab, ob der Betreiber die Änderung als
  inhaltlich ansieht.
- **Product-Schema ohne `Offer`, ohne `image`** (außer Carport,
  Terrasse, Pergola) und ohne Bewertung. Bewusst, weil keine Preise.
  Die Rich-Results-Prüfung meldet dafür Warnungen.
- **Alle Product-Blöcke nennen „VD AluSysteme"** als Marke, einige als
  Hersteller mit URL. Fällt unter die VD-Regel, nicht bewertet.
- **`gelaender.njk`**: Schema und `ogTitle` schreiben „EasyRail",
  sichtbar steht „Easy Rail".
- **Drei Meta-Beschreibungen benutzen „✓"** (`fassade`,
  `sichtschutz`, `fahrradueberdachung`). Unproblematisch, wird von
  Google im Snippet manchmal entfernt.

### Wege durch die Seite

- **Sammelseiten ohne Rückweg.** `balkon-fassade` und
  `garten-aussenbereich` führen zu sechs Detailseiten, die keinen Weg
  zurück zur Sammelseite haben. Ihre Brotkrumen führen nur zu
  `/#leistungen`.
- **`fassade.njk` und `sichtschutz.njk` haben außer Anfrage, Telefon
  und Brotkrume keinen weiteren Verweis**, kein Werkzeug, kein
  Nachbarprodukt.
- **Die Fußzeile nennt nur sieben Leistungen.** Faltdach, Velaris,
  Eingang, Balkon-Fassade, Garten-Außenbereich, Fahrrad,
  Bushaltestelle, Gartenhaus, Fassade und Sichtschutz sind nur über
  `/#leistungen` oder einen Verweis erreichbar.
- **Rückweg aus den Werkzeugen führt zu anderen Produkten.**
  `windzonen.njk:1474` bietet nur „Terrassenüberdachungen ansehen".
  `baugenehmigung.njk:1387` bietet Terrasse, Carport und Pergola,
  aber nicht Kaltwintergarten, Faltdach oder Gartenhaus.
- **Pergola, Faltdach und Velaris sind untereinander nicht
  verknüpft** und nicht vergleichbar: Das Faltdach hat eine Karte
  ohne Maße und Farben, aber mit „bis 120 km/h"; die Pergola hat
  Maße, Winkel und Farben, aber keinen Windwert.
- **Doppelte Verweise mit unpassender Beschriftung.** Der Hero-Knopf
  „Was kostet das? Kostenfaktoren" und „Mehr zum Thema" zeigen auf
  dasselbe Ziel (`carport.njk:166` und `:295`, `pergola.njk:164` und
  `:346`, `terrassenueberdachung.njk:185` und `:522`). Bei Carport und
  Pergola passt „Was kostet das?" nicht zum Ziel, das ein Vergleich
  beziehungsweise ein Kaufratgeber ist.
- **`pruefe-mitwachsend` meldet 9 Hinweise** zu Überdeckungen unter
  24 × 24 px, die unterhalb der Beanstandungsschwelle liegen.

### Noch zu klären, inhaltlich

- **`eingang.njk:109`**: Das Vordach FLY nennt „17 mm ESG, klar (88 %
  Licht) oder opal (63 %)". Das sind dieselben Prozentwerte wie bei
  8 mm VSG. Möglich, aber bei anderem Glas ungewöhnlich. Gegen die
  Herstellerquelle prüfen.
- **`fassade.njk:133` „Profilbreiten 30 und 80 mm"** gegen
  `balkon-fassade.njk:132` „Profile von 30 bis 80 mm Breite". „bis"
  ist ein Bereich, die Tabelle zeigt zwei Stufen.
- **`carport.njk:218` und `:220`**: Flat Line führt „CE-gekennzeichnet"
  doppelt. Dachbegrünung steht neben „vereinfachter Statiknachweis
  inklusive", ob das bei Begrünung gilt, sagt die Seite nicht.
- **`bushaltestelle.njk:119` sagt „mattiertes Glas"**, die Karten
  sagen „opal". Zwei Begriffe für vermutlich dasselbe.
- **`terrassenueberdachung.njk:280`**: „Passt, wenn: Sie zwischen Glas
  und Polycarbonat wählen möchten" ist keine Entscheidungshilfe, weil
  die Wahl nicht erklärt wird.
- **Auf keiner Produktseite stehen Lieferzeit und Preisrahmen.** Vor
  der Anfrage bleiben Preis, Dauer und Genehmigung offen. Preise und
  Zusagen sind Betreibersache.

## Wichtig: `pruefe-schrittwechsel.mjs` meldet unter Last falsches Grün (23.11.2026)

**Gemessen am 23.11.2026** beim vollständigen Lauf über alle 82
Prüfskripte nach den Fokusring-Korrekturen.

**Was passiert ist.** Im Reihenlauf meldete
`scripts/pruefe-schrittwechsel.mjs` nach 22 Sekunden **grün**.
Einzeln nachgefahren war es dreimal von drei rot, jedes Mal mit
derselben Meldung:

```
FEHLER  Am grossen Bildschirm bleibt die Seite stehen  (pageYOffset 362)
```

**Warum das wichtiger ist als der Befund selbst.** Die Übergabe kennt
fünf Konfigurator-Prüfungen, die **flackernd rot** werden, wenn sie
nebeneinander laufen, und einzeln grün sind. Daraus ist die Regel
entstanden: Ein roter Konfigurator-Lauf ist erst ein Befund, wenn er
einzeln wiederholt wurde.

`pruefe-schrittwechsel.mjs` flackert **in beide Richtungen**.

**RICHTIGGESTELLT am 23.11.2026, noch am selben Tag.** Die erste
Fassung dieses Eintrags behauptete, das Skript sei einzeln verlässlich
rot und melde nur unter Last falsches Grün. Das war aus drei Läufen
geschlossen und ist falsch. Ein zweiter, unabhängiger Prüfer hat es
fünfmal einzeln gefahren: **drei rot, zwei grün.** Zusammen mit meinen
drei Läufen sind das **sechs rot und zwei grün aus acht Einzelläufen**,
dazu im Reihenlauf einmal grün und einmal rot.

**Was daraus folgt.** Weder ein grüner noch ein roter Lauf dieses
Skripts beweist etwas, einzeln so wenig wie in der Reihe. Das ist
schlimmer als die fünf bekannten Flacker-Skripte: Bei denen gilt die
Regel „rot erst nach Einzelwiederholung glauben", und die greift hier
nicht, weil auch der Einzellauf schwankt. Eine Prüfung, die fälschlich
grün meldet, verdeckt eine echte Verschlechterung, und niemand fährt
eine grüne Prüfung nach.

**Daraus folgt für die Berichtspraxis:** „Alle grün" ist für dieses
Skript **kein Beleg**, und „alle rot" auch nicht. Der Altbefund B3 aus
`docs/AUDIT-2026-11-22.md` ist unverändert offen, bestätigt mit
`pageYOffset 362`, nicht mit den früher notierten 64 px. Solange das
Skript schwankt, ist es als Absicherung unbrauchbar und müsste
überarbeitet werden, bevor jemand sich darauf stützt.

**Zu prüfen:** Warum die Prüfung unter Last besteht. Vermutlich wartet
sie auf ein Zeitmaß statt auf einen Zustand, und bei langsamer
Maschine ist der Rollvorgang beim Messen noch nicht gelaufen. Dann
wäre die Wartebedingung zu ersetzen, nicht die Zeit zu erhöhen. Das
ist vermutet, nicht gemessen.

**Nebenbefund zum Runner:** Ein selbst geschriebener Reihenlauf muss
alle vier Endungen abdecken. Die 82 Skripte verteilen sich auf 48
`.mjs`, 21 `.js`, 9 `.sh` und 4 `.py`. Ein erster Lauf am 23.11.2026
übersprang die 21 `.js` stillschweigend und hätte „59 grün" gemeldet,
obwohl ein Viertel nicht gelaufen war. Nachgefahren: alle 21 grün.

## Garantierunde 23.11.2026: was geprüft und was richtiggestellt wurde

Nach der Ergänzung der 2 Jahre auf Elektrik liefen die Prüfer der
Fachbereiche 3, 4, 6 und 8. Zwei Angaben aus dem Bericht des
Fachbereichs 8 haben sich beim Nachsehen **nicht bestätigt**. Das steht
hier, weil beide sonst als offene Punkte weitergetragen würden.

**Nicht bestätigt, kein Handlungsbedarf:**

- Der Bericht nennt `src/produkte/kaltwintergarten.njk:161` mit „auf
  Wunsch einen Heizstrahler" und schließt daraus, dort fehle eine
  Elektrikzeile. **Der Kaltwintergarten hat keine Heizung.** Zeile 136
  sagt „ohne Heizung", Zeile 161 „kein beheizter Wohnraum". Die Seite
  verkauft keine Elektrik und braucht die Zeile nicht.
- Der Bericht nennt `src/pflege.njk:397` mit „2 Jahre
  Herstellergarantie auf die Antriebe" und daraus einen Widerspruch zur
  Sonnenschutz-Seite. **An dieser Stelle steht keine Garantieangabe**,
  sondern ein Pflegehinweis zum Einölen von Laufschienen. Der
  Widerspruch existiert nicht. In ganz `src/pflege.njk` kommt „2 Jahre"
  nicht vor.

**Bestätigt und behoben:** `src/produkte/sonnenschutz.njk` nannte in
den Zeilen 186, 207 und 229 nur „5 Jahre Herstellergarantie (VD
AluSysteme)", obwohl diese drei Modelle Somfy-Antrieb beziehungsweise
Solarantrieb und LED führen. Die 5 Jahre bleiben stehen, denn die
Dauerregel nennt für Markisen 5 Jahre. Ergänzt wurde nur die Elektrik.
Das Modell in Zeile 255 sagt „ohne Motor" und behält seine 10 Jahre.

**Weiterhin offen, Ansage des Betreibers nötig:** Ob die
Aluminiumkonstruktion einer Gelenkarmmarkise 10 Jahre trägt. Die
Dauerregel nennt als Beispiele für „Alu plus Tuch" das Faltdach und die
Pergolamarkise, also Dachkonstruktionen. Eine Erhöhung von 5 auf 10
Jahre vergrößert ein Versprechen und wird deshalb nicht geraten. Falls
sie kommt, muss **auch die Seitenbeschreibung in Zeile 5
mitgeändert** werden, die ebenfalls 5 Jahre nennt.

**Nicht anzufassen:** `broschuere.html` gibt über
`src/_data/katalogtext.json` die Katalogtexte des Herstellers im
Wortlaut wieder, neun Garantienennungen darunter, teils „10 Jahre
Herstellergarantie" ohne Elektrikzusatz. Das ist die Wiedergabe einer
fremden Quelle und kein Versprechen des Betriebs. Ein geänderter
Katalogtext wäre ein verfälschtes Zitat. Wer hier etwas ändern will,
muss das mit dem Betreiber klären und begründen, warum ein Zitat
abweicht.

**Offen, Formulierung, kein Fehler:** Die Garantiezeile hat vier
Formen. „auf Alu-Produkte, 2 Jahre auf die Elektrik"
(`balkon-fassade.njk:109`, `gartenhaus.njk:107`), „auf die
Aluminiumkonstruktion, 2 Jahre auf die Elektrik" (die übrigen), „auf
Alu" (`eingang.njk:165`, kein Strom) und „auf Alu-Produkte"
(`garten-aussenbereich.njk:104`, kein Strom). Alle sagen sachlich
dasselbe. Eine Vereinheitlichung wäre Text und damit Betreibersache.

**Offen, inhaltlich:** Auf keiner Produktseite steht, an wen sich ein
Kunde im Garantiefall wendet. Nur
`src/ratgeber/aluminium-terrasse-pflegen.njk:95` sagt es. Ebenso ist
nirgends erklärt, was „Elektrik" umfasst; die Aufzählung steht nur in
Zeile 94 desselben Ratgebers.

**Gemessen, nichts gebrochen:** Fachbereich 4 hat alle zehn geänderten
Seiten bei 320, 360 und 390 px geladen, also 30 Seitenaufrufe. Kein
waagerechtes Scrollen, `scrollWidth` gleich Fensterbreite in allen
Fällen, 0 Überlauf in den Listenpunkten und in den Fußzeilen der
Vergleiche. Der Mittelpunkt in „· CE-gekennzeichnet" bricht sauber um,
weil Leerzeichen daneben stehen. Die längste Zeile wird bei 320 px
etwa vier Zeilen hoch, die Pergola-Fußzeile etwa neun.

## Spezifitätsfalle: fünf Schriftgewichte erreichen den Bildschirm nicht (23.11.2026)

**Gefunden** beim Prüferdurchgang zu Schritt 4 (Fachbereich 1), als
Folge eines Einzelfalls, der dabei behoben wurde.

### Was dahintersteckt

`src/css/start.css` Zeile 102 enthält:

```css
.start-premium p  { font-weight: 400; }
```

Dieser Selektor ist eine Klasse **plus ein Typ**, hat also Spezifität
(0,1,1). Eine einzelne Klasse wie `.stoff-dessin` hat (0,1,0) und
verliert damit immer. Dazu kommt, dass `start.css` nach `style.css`
geladen wird, was in `src/_includes/layout.njk` ausdrücklich so
gewollt ist („Die Designschicht baut darauf auf").

Ergebnis: **Jedes `font-weight` in `style.css`, das an einem `<p>` per
einzelner Klasse hängt, ist wirkungslos**, ohne dass irgendwo ein
Fehler auftaucht. Die Regel steht da, sieht richtig aus und kommt nie
auf dem Bildschirm an.

### Gemessen

55 erzeugte Seiten bei 1280 px, einmal mit und einmal ohne `start.css`,
verglichen wurde das berechnete `font-weight`:

| Regel in `style.css` | gewollt | tatsächlich | betroffen |
|---|---|---|---|
| `.kontakt-quick-lead` (Zeile 1401) | 700 | **400** | `index.html` und zwei weitere |
| `.vd-model-tile p` (Zeile 3153) | 600 | **400** | Sonnenschutz-Seiten |
| `.bg-search-label` | 600 | **400** | `baugenehmigung.html` |
| `.bro-ende-frage` | 700 | **400** | `broschuere.html` |
| `.stoff-dessin` | 600 | **400** | `stoffe.html` |

Betroffen sind nur Seiten mit `start-premium` am `<body>`, und das ist
laut `layout.njk:126` der Normalfall.

### Was am 23.11.2026 davon behoben wurde

Nur der sechste Fall, weil er in der laufenden Arbeit auftrat:
`.eindeck-fuss` sollte 500 tragen und trug 400, was gegen die Vorgabe
des Designsystems verstieß (Kleintext unter 14 px braucht mindestens
Medium 500). Behoben mit `.start-premium .eindeck-fuss` in `start.css`.

**Die fünf Zeilen oben sind absichtlich nicht angefasst.** Sie liegen
außerhalb des Auftrags, und sie sichtbar fetter zu machen ist eine
Gestaltungsänderung auf fünf Seiten, die der Betreiber sehen sollte.

### Zwei Wege, und was sie kosten

1. **Je Zeile eine Ausnahme in `start.css`**, nach dem Muster von
   `.eindeck-fuss`. Sicher und klein, behebt aber nur die bekannten
   Fälle. Die nächste Klasse mit eigenem Gewicht tappt wieder hinein.
2. **`start.css:102` auf `:where(.start-premium) p` umstellen.**
   `:where()` zählt mit Spezifität 0, der Selektor fällt damit auf
   (0,0,1) und verliert gegen jede Klasse. Das beseitigt die ganze
   Fehlerklasse auf einmal. Es ändert aber das Aussehen **aller**
   `<p>`, die ein Klassengewicht tragen, also mindestens der fünf oben.
   Braucht eine Messung vorher und nachher und eine Freigabe.

### Was dabei zusätzlich fehlt

**Keine der 82 Prüfungen vergleicht das berechnete Schriftgewicht mit
dem, was in `style.css` steht.** `pruefe-darstellung.mjs` und
`pruefe-mitwachsend.mjs` messen Gewichte nicht. Das ist dieselbe Art
Lücke wie bei den Fokusringen: Eine Regel kann im Quelltext stehen,
komplett wirkungslos sein, und alle Prüfungen bleiben grün. Eine
Prüfung „berechnetes Gewicht entspricht der Absicht in style.css",
mit Gegenprobe, würde beide Fälle abdecken.

### Weitere Stellen derselben Art, nicht bewertet

- `start.css:101` `.start-premium h2 { letter-spacing }` schlägt jede
  Einzelklasse an einem `h2`.
- `start.css:220` setzt `.hero-slogan` auf 600 statt 700,
  `start.css:300` `.leistung-body h3` auf 700, `start.css:99` h1 bis h3
  auf 800. Diese drei sind vermutlich gewollt.

## Nebenbefunde aus Schritt 4 (23.11.2026)

- **Zeilenhöhen 1.6 und 1.5 stehen roh** in `src/css/style.css` bei
  `.eindeck-intro` und `.eindeck-beschreibung`. Ob es Tokens für
  Zeilenhöhen gibt, ist ungeprüft. Zwei Werte für zwei Absatzarten in
  derselben Komponente.
- **`.eindeck-text h4` setzt `color` und `font-family` erneut**,
  obwohl beides geerbt wird. Redundanz, kein Fehler.
- **Die Überschriftenstufe passt nicht zur Tag-Stufe.**
  `.eindeck-text h4` benutzt `--txt-base`, das ist die Größe des
  globalen `h5`. Semantisch ist die Gliederung richtig (h3, dann h4),
  optisch liegt sie eine Stufe tiefer.
- **Die Rangfolge in der Karte hängt an Gewicht und Farbe, nicht an
  der Größe.** Kartenüberschrift 16 px gegen Werteliste 15 px ist der
  kleinste Schritt der Leiter, und die Zahl in der Werteliste ist
  ebenfalls 700 und schwarz. Im Screenshot bei 390 px trägt die
  Rangfolge trotzdem, weil die Zahlen rechtsbündig in einer Zeile mit
  heller Beschriftung stehen und der Titel allein links. Wenn es
  flacher wirken soll: Titel auf `--txt-md` oder Zahlen auf Gewicht
  600. Gestaltungsentscheidung.
- **Die Materialkarte ist die einzige Karte mit 16 px Radius.**
  `.start-premium .produkt-card` hat 10 px mit Schatten,
  `.produkt-grid .produkt-card` gar keinen Kasten. Die Karte sitzt auf
  der Skala, aber auf einer anderen Stufe als die Produktkarten.
  Gestaltungsentscheidung.
- **Zwei Wahrheiten bleiben beim Markup**, nicht mehr beim Stil:
  `terrassenueberdachung.njk` führt sechs Karten mit eigenen Texten,
  der Baustein vier. Das ist ein Inhaltsunterschied und braucht eine
  Entscheidung.
- **Beim Zurücknehmen von `69b48e7`** die Versionsnummern auf einen
  **neuen** Wert setzen, nicht zurück auf `h` und `b`. Browser halten
  Dateien laut `_headers` bis zu 24 Stunden; wer zwischendurch `i`
  geladen hat, behielte sonst den neuen Stand. Danach
  `scripts/pruefe-cache-buster.sh` laufen lassen.
- **Kein Befund, geprüft:** Auf einem Screenshot der Kartenkomponente
  blieben zwei von vier Bildflächen grau. Nachgemessen laden alle vier
  Bilder einwandfrei mit 960 × 540. Der Screenshot nahm ein 5260 px
  hohes Element auf einmal auf, und die `loading="lazy"`-Bilder
  unterhalb des Sichtfensters waren zu dem Zeitpunkt nicht geladen.
