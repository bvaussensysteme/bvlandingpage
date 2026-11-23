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

