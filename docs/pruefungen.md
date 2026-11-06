# Prüfskripte

> Aus `docs/NEXT_TASK.md` ausgelagert am 04.11.2026, damit der Einstieg
> kurz bleibt. **Wird durchsucht, nicht gelesen** –
> `grep -i "stichwort" docs/pruefungen.md`.

Jedes Skript liegt unter `scripts/pruefe-*` und kennt `--gegenprobe`:
Die baut jeden Fehler **einzeln** ein und verlangt, dass jede Prüfung in
mindestens einem Durchgang rot wird. Eine Prüfung, die nie rot wird,
prüft nichts.

**Nach einer Änderung an Code, den mehrere Bereiche benutzen, alle Skripte
laufen lassen – nicht die vermuteten.** Am 04.11.2026 war
`pruefe-markise.js` dadurch einen halben Tag unbemerkt rot: `schildBild()`
zeichnet die Maßschilder sowohl für die Bemaßung als auch für die Markise.

## 3. Prüfskripte

Jederzeit ausführbar. Jedes Skript kennt `--gegenprobe`: es baut einen
absichtlichen Fehler und erwartet, dass die Prüfung anschlägt. **Eine Prüfung,
die nie anschlägt, ist keine.**

| Skript | Was es prüft |
|---|---|
| `scripts/pruefe-cache-buster.sh` | Verweisen alle HTML-Dateien auf dieselbe Version einer CSS-/JS-Datei? |
| `scripts/pruefe-keine-preise.sh` | Steht irgendwo ein Preis für unsere Leistungen? (Ausnahmen in `scripts/preise-ausnahmen.txt`) |
| `scripts/pruefe-datenschutz.py` | Nummerierung, Inhaltsverzeichnis, Sprungmarken, Querverweise |
| `scripts/pruefe-lbo-daten.js` | Widersprüche zwischen Etikett, Farbe und Text der Baugenehmigungs-Daten |
| `scripts/pruefe-konfigurator.js` | Kennt der Anfrage-Assistent jeden Wert, den der 3D-Konfigurator übergibt? |
| `scripts/pruefe-masstabelle.js` | Stimmt die Maßtabelle mit den Regeln überein, nach denen sie verdichtet wurde? Deckt sie alle 1316 Datensätze ab? |
| `scripts/pruefe-fuehrung.js` | Gehört jede Bedieneinheit des 3D-Konfigurators zu einem Schritt der geführten Reihenfolge? Nennt die Anfrage alle drei Seiten? |
| `scripts/pruefe-stoffe.js` | Sind beide Stoffgruppen vollständig, überschneidungsfrei und in beiden Konfiguratoren gleich? Sind alle Musterbilder da? |
| `scripts/pruefe-markise.js` | Stimmen die Maße der Aufdachmarkise (Kassette, Schiene, Stützen) mit der Herstellerzeichnung Linea A/AZ überein? `--gegenprobe` verfälscht die Sollwerte |
| `scripts/pruefe-werkstatt-zugang.sh` | Ruft die **echte Adresse** ab und sagt, welche Tür vor der Werkstatt antwortet (Cloudflare Access, eigene Passwortschranke, Inhalt offen, nicht vorhanden). Prüft mit, dass die öffentliche Startseite offen **bleibt** und die Besuchermessung weiter annimmt. `--gegenprobe` prüft die Erkennung selbst |
| `scripts/pruefe-messung.js` | Die eigene Reichweitenmessung als **Datenschutz-Zusage**: kein Speicherzugriff außer dem Abschalter, kein User-Agent, keine Spalte für IP oder Besucherkennung, Auswertung hinter dem Werkstatt-Tor, Abschnitt 19 der Datenschutzerklärung, kein vorbelegter Haken, keine Vorab-Verbindung zu Google. Führt die Rechenfunktionen aus `worker/index.js` wirklich aus (39 Prüfungen) |
| `scripts/pruefe-messung.mjs` | Dasselbe im Browser: fängt die Messpakete ab und liest, was abgegangen **wäre** – Verweildauer, Telefonklick, kein Kennzeichen im Paket, Kekse und Speicher unverändert; dazu die Darstellung der Zahlenseite (20 Prüfungen) |
| `scripts/pruefe-konfigurator-oberflaeche.mjs` | Echter Browser, 145 Prüfungen: Layout, Regler, Markisen, Maße, Handy-Scrollen, Zurücksetzen – und liest zurück, was im Assistenten ankommt **und was den Browser beim Absenden verlassen hätte** (Mailweg abgefangen, Konfigurationslink ausgepackt und zurückgerechnet). Braucht `npm i --no-save playwright`, startet den Webserver selbst |
| `scripts/pruefe-symbole.js` | **Keine Emoji in der Oberfläche.** Sucht die Zeichen selbst (nicht das Aussehen) in Knopfbeschriftungen, in allem, was Javascript in die Seite schreibt, und in den sechs Skripten der Website. Dazu: Jedes benutzte Symbol gibt es, keines liegt ungenutzt herum, jedes hat eine viewBox, keines bringt fremde Bilddaten mit, das Sprite steht vor der ersten Verwendung. Gegenprobe: 17 Fehler, jeder einzeln |
| `scripts/pruefe-feldwahl.js` | Zuordnung Element → Feld: ohne Zuordnung gilt ein Element in ALLEN Feldern (alte Links bleiben unverändert), das Modell baut danach, verwaiste Zuordnungen werden geloescht, ein weggefallenes Feld lässt nichts verschwinden, Teilen-Link trägt und liest sie, Anfrage nennt Feld und Feldzahl, die Rückseite wird nicht mehr doppelt gebaut. 25 Prüfungen, Gegenprobe: 26 Fehler einzeln |
| `scripts/pruefe-marken.js` | Anklickbare Felder am Modell: ein Feld je Seitenfeld (auch bei Unterzug und Mittelpfosten), keins hinten bei Wandmontage, hinten nach den **hinteren** Achsen, keins steckt in einem Pfosten; die Fläche liegt IN der Ebene ihres Feldes (Quaternion, kein Sprite), Hervorhebung orange und durchsichtig, Klick führt ins Bedienfeld, Verdecktes ist nicht anklickbar, Flächen bleiben aus Bild und PDF heraus. `markenFelder()` wird **ausgeführt**, nicht im Quelltext nachgelesen. 58 Prüfungen, Gegenprobe: 61 Fehler einzeln |
| `scripts/pruefe-werkzeugseiten.mjs` | **Fuehrt vom Rechnerergebnis ein Weg weiter?** Prueft `/windzonen` und `/baugenehmigung` **im Browser auf Handybreite**: Der Weg darf VOR dem Ergebnis nicht sichtbar sein, danach muss er da sein, ein Satz muss die Zahl mit dem Vorhaben verbinden, es muss je ein Weg zur Anfrage, zu den Produkten und zum jeweils anderen Werkzeug geben, und **kein Knopf unter 44 px Hoehe**. 11 Pruefungen, Gegenprobe: 8 Fehler einzeln. Begruendung: Eintrag „/windzonen: vom Ergebnis zum Vorhaben" in `docs/entscheidungen.md` |
| `scripts/pruefe-farbtreue.mjs` | **Kommen die Farben der Bedienelemente so an, wie sie gesetzt sind?** Laedt den Konfigurator im Browser und zaehlt im **fertigen Bild** der Leinwand die Bildpunkte, die genau `#C49A2A` sind (das Gold der Website) und die, die auf dem alten, ausgewaschenen `#CBBD75` liegen. Liest dafuer **keinen** Quelltext; zusaetzlich wird die Regel selbst geprueft (jedes Bedienelement im Bild traegt `uiBild()` und `toneMapped: false`). 3 Pruefungen, Gegenprobe: 3 Fehler einzeln. Begruendung: Eintrag vom 04.11.2026 in `docs/entscheidungen.md` |
| `scripts/pruefe-pfosten.js` | Verschiebbare Zwischenpfosten: Spanne über die **ganze** Maßtabelle (Achse zu Achse, Zählregel des Produkts, Profil der Reihe, gleichmäßige Lage immer enthalten), Auswahl durch Antippen (ohne Auswahl kein Griff, zweiter Tipp hebt sie auf, Esc, Hülle in eigener Gruppe und nicht im Bild/PDF), Reglerraster trifft die gleichmäßige Lage, Klemmen in Feldbreiten, Spanne je Pfosten gegen die **wirkliche** Lage der Nachbarn, Eckpfosten unbeweglich, Griff hat Vorrang vor dem Drehen, Einrasten, Verdecktes nicht greifbar, Teilen-Link und Anfrage tragen die Lage. `achsenKlemmen()` wird **ausgeführt**: 4.000 Zufallsfälle müssen alle in der Toleranz landen – genau daran ist die erste Fassung gescheitert (1.413 außerhalb). 50 Prüfungen, Gegenprobe: 50 Fehler einzeln |
| `scripts/pruefe-aussparung.js` | Form der Anlage mit Aussparung: Lage links/rechts/mittig, Begrenzungen, wandert die Hinterkante genau dort, bleibt der Randsparren lang, bekommt kein Sparren Länge null (200 Stellen abgetastet). Die Gegenprobe baut **jeden Fehler einzeln** ein und verlangt, dass jede Prüfung in mindestens einem Durchgang anschlägt |
| `scripts/pruefe-konfigurator-sperre.js` | Ist der öffentliche Konfigurator wirklich gesperrt (503, nicht 404), führt die Hinweisseite zur Anfrage, ist die Werkstatt **nicht** mitgesperrt, verlinkt keine Seite ihn noch aktiv im Menü? **Beim Zurückschalten muss dieses Skript rot werden** |
| `scripts/pruefe-werkstatt.js` | Passwortschranke vor `/werkstatt/`: gesperrt ohne hinterlegtes Passwort, falsches Passwort abgewiesen, Keks HttpOnly/Secure/SameSite und nicht im Klartext, alte Anmeldung nach Passwortwechsel ungültig — **und ob die Seite überhaupt durch den Worker läuft** (`run_worker_first`). Gegenprobe: 10 Fehler, jeder einzeln |
| `scripts/miss-aussparung.mjs` | **Messwerkzeug, keine Prüfung** (keine `--gegenprobe`): misst die Aussparung im echten Browser nach — Scheiben, Lage, Hausvorsprung, fehlende Dateien. Hat am 31.10.2026 drei Fehler auf einmal gefunden. **Offen: eine echte Browser-Prüfung mit Gegenprobe daraus machen** |
| `scripts/baue-werkstatt.js` | Erzeugt `werkstatt/index.html` aus `konfigurator.html`. Mit `--pruefen` meldet es, wenn die Werkstatt nicht mehr auf dem Stand ist |
| `scripts/pruefe-konfliktmarken.sh` | **Nach jedem Merge, vor jedem Commit:** liegengebliebene Merge-Marken im ganzen Projekt. Gegenprobe legt eine Datei mit Marken an und muss sie finden |
| `scripts/pruefe-assistent.mjs` | Bedienung des Anfrage-Assistenten im echten Browser: Eindeckungs-Kacheln alle gleich groß (auch bei ungerader Anzahl), Aufpreis-Hinweis bei der Wunschfarbe, RAL-Suche (Kachel, Suchfeld, „braun" findet Brauntöne, Nummer steht vorn, Unsinn erklärt sich, **Eingabefeld behält den Fokus**, Treffer setzt die Farbe) |
| `scripts/pruefe-balkon.mjs` | Balkonüberdachung am fertigen Modell im Browser: Pfostenfuß auf der Brüstung bzw. am Boden, Pfosten hinter der Brüstung, Dach bis zur Außenkante, Pfosten-Auswahl verschwindet beim Geländer, Baurechts-Hinweis, keine Javascript-Fehler. Gemessen werden Eckpunkte in Weltkoordinaten |
| `scripts/pruefe-kurzlink.mjs` | Kurzlink im Worker ohne Datenbank: Wege bedient, Unsinn mit 400 abgewiesen bevor die Datenbank angefasst wird, 503/404 ohne Datenbankmeldung, Kennung stabil und vorlesbar, Tabelle ohne Persönliches. Dazu die Ausweich-Logik an einer nachgebauten Datenbank: `public` offen / `public` verschlossen / Datenbank ganz weg, und die fertigen SQL-Befehle werden zurückgelesen |
| `scripts/pruefe-teilen.mjs` | Teilen-Link: plant im Browser, teilt, öffnet den Link in einem frischen Tab und vergleicht alle 91 Einstellungen, 14 Knopfreihen und die Farbe. Gegenprobe verfälscht den Link und erwartet den Hinweis |
| `scripts/pruefe-ral.js` | RAL-Tabelle und Farbsuche: führt beide aus – 217 Töne, Stichproben Nummer → Name, Helligkeit der Schwarz-/Weißtöne nachgerechnet, neun Suchfragen mit erwartetem erstem Treffer, Lupe im HTML verdrahtet |
| `scripts/pruefe-bodengefaelle.js` | Gefälle des Terrassenbodens: Führt `bodenY()` aus und rechnet nach – ebener Boden ändert nichts, 2° auf 4 m sind 140 mm, vier Ecken auf vier Höhen. Dazu: Dach wird verschoben statt gekippt, Pfostenlängen gehen in die Anfrage. **Misst mit three.js nach**, dass Wiese und Plattenoberseite senkrecht gemessen auf derselben Ebene liegen wie die gerechneten Pfosten |
| `scripts/pruefe-stufen.js` | Basic und Pro: Ist Basic voreingestellt? Trägt jede Fachangabe `data-k3d-pro`? Bleibt jede Kundenfrage in Basic sichtbar? Verbirgt die Stufenregel nur, statt aufzudecken? Und vor allem: Wird beim Umschalten **kein** Wert zurückgesetzt |
| `scripts/pruefe-rueckseite.js` | Die vierte Seite: Gibt es sie nur freistehend? Verschwindet die Wahl beim Zurückschalten auf Wandmontage wieder? Kein Keil hinten, Höhe aus der Dachunterkante, Assistent kennt `erw_hinten` |
| `scripts/pruefe-bauteile.js` | Liefert `js/bauteile.js` für jede Zeile der Preisliste dieselben Sparren- und Pfostenzahlen? |
| `scripts/pruefe-hinweise.js` | Bleibt getrennt, was der Kunde sieht, und was nur in die Anfrage-Mail gehört? Prüft Hinweisbox, Kasten „Ihre Konfiguration", Assistenten-Anzeige und alle drei Versandwege – einmal aus dem Quelltext, einmal an wirklich erzeugten Hinweisen |
| `scripts/pruefe-pdf.js` | Erzeugt die PDFs **beider** Stellen (Konfigurator und Baugenehmigungs-Check) und liest sie mit **pdfinfo, pdftotext und pdfimages** zurück – fremden Werkzeugen, die unsere Annahmen nicht kennen. Seitenzahl, Format, Bildgröße, Umlaute, und vor allem: Steht jede Angabe **vollständig** da, auch bei 34 langen Zeilen über zwei Seiten? Zweispaltige Seiten werden dafür spaltenweise ausgeschnitten – am Stück gelesen zerreißt pdftotext die umgebrochenen Zeilen |
| `scripts/pruefe-schrittwechsel.mjs` | **Landet man nach „Weiter“ am Anfang des nächsten Schritts?** Rollt am Handy erst wirklich ans Seitenende und sieht danach nach, wo der Anfang des Bedienfelds liegt – nicht, ob `scrollTo` gerufen wurde (genau diese Prüfung hätte den Fehler gehabt). Dazu: Das klebende 3D-Bild darf den Anfang weder verdecken noch weggerollt sein, und die Fußzeile darf danach nicht mehr im Bild stehen. Am großen Bildschirm gegenläufig: Dort muss das Bedienfeld in sich selbst rollen und die Seite stehen bleiben |
| `scripts/pruefe-angaben-wand-hoehe.mjs` | **Höhenbezug und Fassaden-Notiz.** Prüft nicht die Felder, sondern **bis in die Anfrage**: die Zusammenfassung, aus der die Anfrage gebaut wird, und den geteilten Link. Eine Angabe, die der Kunde macht und die niemanden erreicht, ist schlimmer als keine – er glaubt, er habe es gesagt. Dazu: Der Hinweis bei „Oberkante Hauswand" muss **das Maß nennen, das das Modell dort misst** (gegengerechnet: Unterkante Wandprofil + 143,6 mm), die Vorgabe darf **nicht** in der Anfrage stehen, und am Handy müssen die Textfelder 16 px groß sein. 20 Prüfungen, 12 eingebaute Fehler, **jeder einzeln gefahren** (das Skript ruft sich selbst auf; im Sammellauf verdecken sie sich). Prüft außerdem, dass **kein Testlauf eine echte Anfrage abschickt**: Auf der Zusammenfassung ist „Weiter" der Absenden-Knopf, und genau das hat am 06.11.2026 echte Post verursacht. Der Test hört am Knopftext „Absenden" auf, die Versandadressen sind abgeschnitten, und eine Prüfung schlägt fehl, sobald ein Lauf es auch nur versucht. Prüft **beide Konfiguratoren**: den 3D-Konfigurator und den Anfrage-Assistenten auf der Website. Dazu der Abgleich, dass beide die drei Bezüge **Wort für Wort** gleich nennen – der 3D-Konfigurator übergibt seine Wahl an das Feld des Assistenten, und was dort nicht genau passt, landet auf „Bitte wählen …": die Angabe wäre stillschweigend weg |
| `scripts/pruefe-schiebe-velaris.mjs` | **Schiebetür- und Velaris-Editor.** Beide führen keine eigene Einstellung, sondern spiegeln die Felder des Bedienfelds – geprüft wird darum beides: dass der Dialog zeigt, was im Bedienfeld steht (und zwar **nach** einer Verstellung, sonst steht beides zufällig auf der Vorgabe und die Prüfung ist blind), und dass eine Änderung im Dialog **bis ins Modell** durchschlägt – gemessene Flügelzahl bzw. Lamellenwinkel. Dazu: Der Velaris-Dialog muss sagen, dass seine Einstellungen für die ganze Anlage gelten. 22 Prüfungen, 5 eingebaute Fehler. **Die Gegenprobe fährt jeden Fehler einzeln** (sie ruft sich dafür selbst auf): Bei allen auf einmal verdecken sie sich gegenseitig – ist das Maß schon auf null gesetzt, kann der Fehler daneben nichts mehr zeigen. Der Sammellauf meldete deshalb fälschlich „eine Prüfung ist blind". Eine Gegenprobe, die falschen Alarm schlägt, ist fast so schädlich wie eine, die schweigt |
| `scripts/pruefe-rahmen-editor.mjs` | **Rahmen-Editor.** Zahnrad nur mit Rahmenwand; neun Aufteilungen, deren Namen **aus dem Bedienfeld** stammen und nicht aus einer zweiten Liste; B und H gemessen aus dem Modell. Misst die **wirklich gebauten Sprossen**, nicht die leuchtende Kachel, und dass jede Seite ihre eigene Aufteilung behält. Dazu der **echte Rundlauf über den geteilten Link** (teilen, Link in frischem Tab öffnen, nachmessen) – dieser Fehler war vorher in beiden Editor-Prüfungen blind. 17 Prüfungen, 6 eingebaute Fehler |
| `scripts/pruefe-planken-editor.mjs` | **Planken-Editor.** Zahnrad erscheint nur mit Plankenwand und holt **nicht** das Keil-Zahnrad; beide Richtungen (waagerecht/hochkant); B gemessen aus dem Modell; Höhe in mm **im Modell nachgemessen**, nicht an der Oberfläche. Deckt zwei Fälle ab, die zuerst blind waren: die Begrenzung auf den vorhandenen Platz (nur über einen alten Link erreichbar, darum mit direkt gesetztem Plan geprüft) und das Zusammenspiel mit dem Prozentregler (die Prüfung stellt ihn selbst auf −66). Dazu die Rücktasten-Regel wie beim Keil und zwei Handy-Prüfungen. 23 Prüfungen, 9 eingebaute Fehler (darunter der Rundlauf über den geteilten Link), `BV_FEHLER=<n>` / `BV_CSS_FEHLER=<n>` einzeln |
| `scripts/pruefe-keil-editor.mjs` | **Keil-Editor.** Zahnrad erscheint nur mit Keil; beide Wege hinein (Zahnrad und Klick ins 3D-Modell); acht Teilungen; B gemessen aus dem Modell; H1/H2 vorbelegt und **gekoppelt** (H2 folgt H1 über die Dachschräge); Versatz verkleinert H2 und wird begrenzt; Glas je Feld bis ins Modell – **gezählt werden die wirklich gebauten Scheiben**, nicht nur die Oberfläche, denn ein Editor, dessen Wahl das Bild nicht erreicht, ist eine Attrappe. Prüft auch, dass sich **Ober- und Unterkante nie kreuzen** – gemessen an den Vierecken der Zeichnung, nicht an der Rechnung dahinter. Dazu fünf **Handy-Prüfungen**: Deckt der Dialog das Fenster ab, liegt nichts über seiner Kopfzeile, ist „Fertig“ zu sehen, kein Querscrollen, alle acht Teilungen im Bild. Prüft **gemessen am Modell**, dass die Glasschiebewand unter dem Keil bündig anschließt – auch bei eigener Keilhöhe; gemessen wird der **ungeklemmte** Abstand, sonst bliebe ein Element, das zu weit nach oben läuft, unsichtbar. Tippt mit **echten Tastendrücken** in die Maßfelder (Rücktaste, Ziffern, Feld verlassen) – `fill()` setzt den ganzen Wert auf einmal und hätte den iPhone-Fehler vom 05.11.2026 nie gezeigt. 39 Prüfungen, 15 eingebaute Fehler. **`BV_FEHLER=<n>` baut einen Fehler allein ein**: Mit allen auf einmal zerfällt die Zeichnung so weit, dass die Kantenmessung ins Leere läuft – ein Fehler kann einen anderen verdecken |
| `scripts/pruefe-nicht-oeffentlich.sh` | **Liegen interne Dateien offen?** Fragt 18 Pfade an der LIVE-Seite ab (`scripts/`, `src/`, `node_modules/`, `.claude/`, `worker/`, `docs/`, `.git/`) – keiner darf 200 liefern. Die Gegenprobe fragt umgekehrt sieben Pfade ab, die 200 liefern **müssen**, sonst hätte die Ausnahmeliste zu viel erwischt; und sie bricht ab, wenn die Seite gar nicht antwortet – sonst meldete die Prüfung bei abgeschalteter Website grün. Eine Dateiprüfung hätte den Fehler **nicht** gefunden: `.assetsignore` anzusehen beweist nichts, nur der Abruf zeigt, was Cloudflare herausgibt |
| `scripts/pruefe-erzeugte-seiten.sh` | **Würde ein `npm run build` etwas zurücknehmen, was schon im Repository liegt?** Baut und sieht nach, ob sich eine Datei verändert hat. Deckt auf, wenn jemand eine erzeugte HTML-Datei von Hand bearbeitet hat statt ihrer `.njk`-Vorlage. Überspringt sich bei ungesichertem Arbeitsbaum – dann wäre der Vergleich bedeutungslos |
| `scripts/pruefe-tippfelder.mjs` | **Zoomt iOS beim Antippen hinein?** Misst jedes Tippfeld von Konfigurator, Widerruf, Windzonen, Baugenehmigung und Assistent bei 390 px mit nachgestellter Tippbedienung – alles unter 16 px lässt Safari die Seite heranziehen, ohne wieder herauszuzoomen. Prüft zusätzlich, dass **kein** Viewport `maximum-scale`/`user-scalable=no` trägt (das wäre der bequeme Weg und bricht WCAG 1.4.4), und misst gegenläufig an der Maus: Dort müssen die Felder klein bleiben, sonst hängt die Regel nicht wirklich an `pointer: coarse`. Eine eigene Prüfung stellt sicher, dass der Testbrowser Finger und Maus überhaupt unterscheidet – sonst liefe alles gegen eine Regel, die gar nicht gilt |
| `scripts/pruefe-api-bauteile.mjs` | Baut den Worker wie Cloudflare, stellt echte Anfragen – und prüft, dass **keine** Antwort die Matrix enthält |
| `scripts/pruefe-kommentare.py` | **Steht ein Kommentarrest sichtbar in der Seite?** Entfernt aus jeder `.html` und `.njk` alle richtigen Kommentare und verlangt, dass kein Abschlusszeichen uebrig bleibt; sucht zusaetzlich Kommentare, die in anderen stecken. Anlass: Beim Sperren des Konfigurators (31.10.2026) wurden zwei Kommentare ineinander gesetzt — das kennt HTML nicht, und ein Reststueck stand eine Woche lang als Text im Navigationsbalken von 35 Seiten, direkt neben „Galerie". Gegenprobe: 2 Fehler |
| `scripts/pruefe-broschuere.mjs` | **Die Katalogseite im Browser**, 28 Prüfungen: 36 Seitenadressen in der richtigen Reihenfolge, beim Start nur wenige Bilder geladen (Nachladen wird nach dem Blättern gemessen), **keine einzige Netzanfrage an einen fremden Host**, Buch aufgeschlagen, Zähler, Weiter-Knopf, Pfeiltaste, Seitenübersicht mit 36 Kacheln und Sprung, Zoom (Breite vor/nach `+`), Vollbild-Knopf, PDF abrufbar, alle 72 Bilddateien da, Weg zum PDF ohne JavaScript, Verweise aus Navigation, Startseite und `sitemap.xml`, Übersetzungen eingetragen **und die Übersetzungsdatei lauffähig**; am Handy 44 px, **eine Wischgeste blättert** (touchstart am Buch, touchmove/touchend am Fenster – so hört die Bibliothek zu) und nur eine Seite liegt offen. Dazu das Menü hinter den drei Punkten (zuerst zu, danach PDF **und** Teilen) und, mit eingesetztem `navigator.share`, **welche Adresse** Teilen weitergibt – die der Seite, nicht die der Datei. Dazu: Der Zugang zum Katalog steht am Handy **ohne Scrollen** im Hero der Startseite (Lage gemessen, nicht nur Vorhandensein). Gegenprobe: 28 Fehler, jeder einzeln |
| `scripts/pruefe-broschuere-bilder.sh` | **Zweiter, anders gebauter Weg zur selben Frage.** Rendert jede PDF-Seite neu (20 dpi) und vergleicht sie mit dem ausgelieferten WebP (RMSE): gleiche Seite liegt bei 0,06–0,07, verschiedene bei 0,28+, Schwelle 0,15. Dazu: PDF hat 36 Seiten, alle Seitenbilder 1400 px, alle Vorschaubilder 300 px, keine Seite passt besser auf ihre Nachbarin, jedes Vorschaubild gehört zu seinem Seitenbild. Fängt, was die Browser-Prüfung **nicht** sehen kann: eine Adressliste bleibt makellos, auch wenn im Bild die falsche Seite steht. Braucht `pdftoppm`, `pdfinfo`, `convert`, `compare` – fehlen sie, bricht es mit Hinweis ab statt grün zu melden. Gegenprobe: 6 Fehler |
| `scripts/pruefe-live.sh` | Ist der veröffentlichte Stand tatsächlich draußen? (nutzt `curl -sL`). Marker mit `gesperrt:` ruhen, solange der öffentliche Konfigurator abgeschaltet ist — aber nur, wenn wirklich die **Hinweisseite** kommt; etwas Drittes ist ein Fehler. Gegenprobe dafür: `SPERRE_BELEG=XX bash scripts/pruefe-live.sh` muss die sechs rot machen. **Beim Zurückschalten sagt das Skript selbst, dass `gesperrt:` zu entfernen ist** |

**Exit-Code abfragen, nicht die letzte Zeile lesen.** Am 23.10.2026 fiel
auf, dass `pruefe-konfigurator-oberflaeche.mjs` seit PR #281 (11.10.2026)
mit einer Ausnahme abbrach, statt ein Ergebnis zu melden – zwölf Tage
unbemerkt rot. Eine Prüfung, die mit einer Ausnahme endet, ist rot.

**Stand 31.10.2026: alle Skripte laufen durch**, jedes mit vollständig
anschlagender Gegenprobe
(`pruefe-marken.js` 28 Prüfungen und 25 Fehler, `pruefe-masstabelle.js` 364,
`pruefe-markise.js` 190, `pruefe-fuehrung.js` 313, `pruefe-teilen.mjs`,
`pruefe-kurzlink.mjs`, `pruefe-assistent.mjs`, `pruefe-werkstatt.js`).

> **Am 31.10.2026 repariert: Dieses Skript brach bei Prüfung 67 von 90 ab**
> — die letzten 23 Prüfungen (Untergrund, Montage, Verkleidung, der ganze
> Handy-Teil) liefen seit PR #500 gar nicht, und in der **Gegenprobe** war es
> dieselbe Stelle. Es lag **nicht** an den Anklickpunkten: derselbe Abbruch am
> unberührten Programmstand mit unverändertem Skript, in eigenen Läufen
> nachgewiesen.
>
> **Ursache, gemessen statt geraten:** `page.check('#k3dSound')` lief in eine
> Zeitüberschreitung. An der Stelle war das Kästchen sichtbar, nicht gesperrt,
> im Bild, und `elementFromPoint` in seiner Mitte war es selbst — ein Klick
> im Browser setzte es sofort, nur der Mausklick von außen kam nicht an. Der
> Unterschied zu den Häkchen weiter oben: **das Bedienfeld war 6944 von
> 8683 px gescrollt.** Playwright scrollt heran und klickt sofort danach; der
> Browser hat die neue Scrollstelle da noch nicht übernommen, der Klick
> landet auf den alten Koordinaten. Alle sieben Häkchen laufen jetzt über
> `haken()` — heranscrollen, zwei Bilder warten, dann klicken.
>
> **Dahinter lag ein zweites Hindernis verdeckt:** Die Gegenprobe quetscht
> die Bühne absichtlich auf 0 px. Die Ansichtsleiste liegt darin und ist
> mittig begrenzt, hat dann also keine Fläche zum Anklicken — der Klick auf
> „Darunter" scheiterte. Gelöst über `ansicht()`: im normalen Lauf ein echter
> Mausklick, in der Gegenprobe wird der Knopf direkt ausgelöst (dasselbe tut
> das Skript seit längerem beim Umschalter `#k3dModus`).
>
> **Stand jetzt: 91 von 91 Prüfungen grün, Gegenprobe bestanden** — alle
> eingebauten Fehler werden gefunden.

Ebenfalls am 31.10.2026 gefunden: Eine Prüfung desselben Skripts war seit
der Bereichs-Aufteilung (PR #500) **unbemerkt rot**. Sie erwartete, dass das
Maßfeld im Produktschritt unsichtbar ist — seit den fünf Bereichen steht
„Maße" aber absichtlich im Bereich *Anlage*. Sie prüft jetzt dieselbe
Absicht am neuen Aufbau: Während „Anlage" offen ist, darf die Montagefrage
(Bereich *Fertig*) nicht sichtbar sein. **Zwei Prüfungen in einem Skript,
beide unbemerkt rot** — das ist der Grund, warum oben „Exit-Code abfragen"
steht.

Der Browsertest ist damit wieder brauchbar. Er ersetzt **nicht** das
Nachsehen im Browser – das macht der Betreiber selbst („mach keinen browser
test ich teste selber im browse"); er fängt nur ab, dass eine Bedieneinheit
unbemerkt verschwindet.

Die beiden Datenprüfungen überspringen sich selbst, wenn `daten/` fehlt –
das ist der Normalfall in einem frischen Klon.

---


## 04.11.2026 (nachts) – Was der nächste Durchlauf aller Skripte fand

Anlass war eine Meldung vom iPhone („beim Antippen zoomt alles rein"). Die
Regel „nach einer Änderung an etwas, das mehrere Bereiche benutzen, **alle**
Skripte laufen lassen" deckte dabei zwei Prüfungen auf, die **seit Tagen
nichts mehr prüften**:

| Skript | Seit wann tot | Warum |
|---|---|---|
| `pruefe-teilen.mjs` | 03.11., 22:22 Uhr | Klickte `#k3dModus` – den Umschalter zwischen „Schritt für Schritt" und „Alles auf einen Blick". Mit dem Umbau auf **einen** Bedienweg fiel der Knopf weg, das Skript stürzte beim Start ab. 91 verglichene Einstellungen liefen einen Tag lang ins Leere |
| `pruefe-api-bauteile.mjs` | mit PR #497 | Prüfte die Durchreichung statischer Seiten ausgerechnet an `/konfigurator.html` – dem einen Pfad, den der Worker seit der Sperre absichtlich mit 503 beantwortet. Dauerhaft rot, und dauerhaft rot heißt: Niemand sieht mehr hin |

Beide sind repariert und prüfen jetzt die Absicht statt die alte Mechanik:
der Teilen-Test stellt sich die Felder selbst her, der Worker-Test prüft die
Durchreichung an `/index.html` **und** die Sperre an ihrem eigenen Pfad.

**Die Lehre ist nicht „öfter laufen lassen", sondern:** Ein Skript, das
abstürzt, und eines, das dauerhaft rot ist, sind derselbe Zustand – beide
sagen nichts mehr. Ein rotes Skript gehört am selben Tag repariert oder
begründet stillgelegt.

Dazu geschlossen: `pruefe-cache-buster.sh` sah nur JavaScript nach, ob die
Version mit der Datei hochgezählt wurde. `src/css/style.css` fehlte – obwohl
das Stylesheet nach `_headers` genauso 24 Stunden im Browser-Cache liegt.
Eine Änderung am Aussehen wäre einen Tag lang unsichtbar geblieben, ohne
dass eine Prüfung etwas gemeldet hätte.

## 04.11.2026 (nachts) – Vier Änderungen, die ein Build zurückgenommen hätte

Beim Nachprüfen des veröffentlichten Standes fiel auf, dass `widerruf.html`
und `windzonen.html` eine `.njk`-Vorlage haben. Ein `npm run build` im
leeren Arbeitsbaum zeigte dann das Ausmaß:

| Datei | Zeilen | was verloren gegangen wäre |
|---|---|---|
| `datenschutz.html` | 110 | **der ganze Abschnitt 19** zur eigenen Reichweitenmessung |
| `windzonen.html` | 68 | der Weg vom Ergebnis zum Vorhaben, dazu die 16-px-Regel |
| `baugenehmigung.html` | 25 | die Querverweise zwischen den Werkzeugseiten |
| `widerruf.html` | 14 | die 16-px-Felder |

Alle vier waren **veröffentlicht und sichtbar** – sie standen nur in der
erzeugten Datei, nicht in ihrer Vorlage.

**Der Datenschutzfall ist der schwerste.** Die Messung läuft. Eine
Datenschutzerklärung, die sie nicht nennt, ist ein eigener Verstoß –
unabhängig davon, ob die Messung zulässig wäre. Dieser Verstoß wäre
entstanden, **ohne dass jemand etwas ändert**: allein durch ein Bauen.

`scripts/pruefe-erzeugte-seiten.sh` prüft das jetzt. Die Liste der
eigenständigen HTML-Dateien in `docs/arbeitsweise.md` war unvollständig –
statt sie zu pflegen, beantwortet das Bauen die Frage selbst.

**Nebenbei die Lehre für Gegenproben:** Der erste Entwurf dieser Gegenprobe
änderte die *erzeugte* Datei von Hand. Der Build schrieb sie im selben Lauf
zurück, danach war nichts mehr zu finden, und die Gegenprobe meldete die
Prüfung als blind. Geändert wird jetzt die *Vorlage* – derselbe Zustand,
aber einer, der stehen bleibt.
