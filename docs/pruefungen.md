# Prüfskripte

> Aus `docs/NEXT_TASK.md` ausgelagert am 04.11.2026, damit der Einstieg
> kurz bleibt. **Wird durchsucht, nicht gelesen** –
> `grep -i "stichwort" docs/pruefungen.md`.

**Bei vielen eingebauten Fehlern:** Die Gegenprobe bricht beim **ersten**
blinden Fehler ab, und jede Runde kostet so viel Zeit wie alle Fehler
zusammen. `scripts/pruefe-broschuere.mjs` kennt deshalb `BV_NUR=teil1,teil2`
– damit laufen nur die Fehler, deren Name einen dieser Teile enthält. So
lassen sich die noch nicht erreichten in einem Rutsch nachziehen. **Das
Gesamturteil gilt nur ohne `BV_NUR`**; das Skript sagt das auch selbst.

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
| `scripts/pruefe-palette.py` | Stimmen die Kontrastwerte im Designdokument noch? Reicht das Textgold auf hellem Grund? Passt das Markengold zum Gold im Logo? Erreicht der Fokusring auf jedem Untergrund 3:1? (5 Fehler in der Gegenprobe, jeder einzeln eingebaut) |
| `scripts/pruefe-bewegung.mjs` | Entwurf: Bleibt bei Bewegung, bei reduzierter Bewegung und ganz ohne JavaScript jeder Text sichtbar? Fährt die Ablaufspur wirklich, und endet sie im Bild? Fährt die Kontaktleiste unten ein? (4 Fehler in der Gegenprobe) |
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
| `scripts/pruefe-zahlenseite-maskierung.py` | **Kein Datenbankwert ungemaskiert im HTML der Zahlenseite.** Die Seite baut ihre Inhalte als Zeichenkette und setzt sie per `innerHTML` ein; die Werte kommen aus der Tabelle `ereignis`, und die fuellt der **oeffentliche** Endpunkt `POST /api/messung`. Die Pruefung liest jeden `reihe(`-Aufruf, blendet die drei unbedenklichen Faelle aus (`sicher(...)` klammertief, Nachschlagetabellen `TABELLE[x.feld]`, Bedingungen `x.feld ?`) und meldet jeden Datenbankwert, der uebrig bleibt. Gegenprobe: 3 Fehler, jeder einzeln. Anlass: Am 08.11.2026 fehlte `sicher()` an fuenf Stellen – siehe `docs/entscheidungen.md` |
| `scripts/pruefe-produktwahl.mjs` | Kommt die Produktwahl **aller sechs Produktseiten** im Anfrage-Assistenten an – über einen echten Seitenwechsel im Browser? Prüft auch, dass Geländer, Markise und Kaltwintergarten über den Kurzweg gehen und ihren Namen im Nachrichtenfeld tragen. Gegenprobe: unbekannter Schlüssel muss verworfen werden |
| `scripts/pruefe-standort-mitgeben.mjs` | Kommt der im Windzonen-Rechner gesuchte Standort als PLZ und Ort im Anfrageformular an – über einen echten Seitenwechsel im Browser? Gegenprobe: unsinnige Werte im Speicher (`abcde`, `<img src=x onerror=…>`) müssen verworfen werden |
| `scripts/pruefe-galerie.mjs` | Passen Referenz-Galerie und Lightbox zusammen? Fortlaufende Nummern, gleich viele Einträge, Alternativtexte, Herkunftsangabe, vorhandene Dateien – und jede Karte öffnet im Browser wirklich ihr eigenes Bild. Gegenprobe: ein entfernter Eintrag muss auffallen |
| `scripts/pruefe-vergleich.mjs` | Die Gegenüberstellung TDS/SkyView auf der Terrassenseite: sechs vollständige Zeilen, beide Modelle als Spaltenkopf, Beschriftung für Screenreader – und auf 390 px **kein waagerechtes Scrollen**. Gegenprobe: ein zu langes Wort in einer Zelle muss auffallen |
| `scripts/pruefe-startseite.mjs` | Die Premium-Schicht der Startseite: greift sie überhaupt, stimmen Markengold, Textgold, Tiefschwarz und Manrope, steht **nirgends Gold als Text auf hellem Grund**, sind Anfrage-Knopf und zweiter Einstieg ≥ 44 px, scrollt nichts waagerecht – und sind Navigation, Assistent, Galerie, Produktkarten, Rechner und Fuß noch da? Auf 390, 768 und 1280 px. Gegenprobe: ohne die Klasse `start-premium` muss die Palettenprüfung anschlagen |
| `scripts/pruefe-einzugsgebiet.mjs` | Erkennt der Anfrage-Assistent, ob eine PLZ im üblichen Fahrtgebiet liegt? Wichtiger noch: Bleibt der Hinweis **aus**, wenn sie es nicht tut, und steht nie eine Absage im Bedienfeld? Gegenprobe: PLZ aus Hamburg und München dürfen keinen Hinweis erzeugen |
| `scripts/pruefe-darstellung.mjs` | **Darstellung aller wichtigen Seiten im echten Browser**, zwölf Seiten in drei Breiten (390 / 820 / 1440), 144 Prüfungen. Vier Dinge, die sich am Quelltext nicht ablesen lassen: (1) **Textkontrast** 4,5:1 bzw. 3:1 ab 24 px – der Untergrund wird aus der ganzen Kette der Vorfahren gemischt, Farbverläufe mit allen Farbstopps, und gewertet wird der **schlechteste**; (2) **Eingabefelder unter 16 px** – darunter zoomt iOS Safari die Seite heran, geprüft nur dort, wo getippt wird; (3) **Tippflächen** nach WCAG 2.5.8 **mit beiden Ausnahmen der Norm** (Abstandskreis 24 px, Link im Satz) und ohne Ziele, die ein scrollbarer Kasten gerade abschneidet; (4) **nichts bleibt vom Einblenden unsichtbar** – scrollt die Seite durch und prüft danach jede Karte. Text auf einem **Foto** kann kein Skript messen; solche Stellen zählen nicht als bestanden, sondern landen in einer eigenen Liste „nicht messbar". Gegenprobe: 4 Fehler, jeder einzeln |
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
| `scripts/pruefe-broschuere.mjs` | **Die Katalogseite im Browser**, 42 Prüfungen: 36 Seitenadressen in der richtigen Reihenfolge, beim Start nur wenige Bilder geladen (Nachladen wird nach dem Blättern gemessen), **keine einzige Netzanfrage an einen fremden Host** (Grenze: gegen den oertlichen Server gemessen – was Cloudflare am Rand dazulegt, sieht diese Pruefung nicht, siehe `docs/entscheidungen.md`, 07.11.2026), Buch aufgeschlagen, Zähler, Weiter-Knopf, Pfeiltaste, Seitenübersicht mit 36 Kacheln und Sprung, Zoom (Breite vor/nach `+`), Vollbild-Knopf, PDF abrufbar, alle 72 Bilddateien da, Weg zum PDF ohne JavaScript, Verweise aus Navigation, Startseite und `sitemap.xml`, Übersetzungen eingetragen **und die Übersetzungsdatei lauffähig**; am Handy 44 px, **eine Wischgeste blättert** (touchstart am Buch, touchmove/touchend am Fenster – so hört die Bibliothek zu) und nur eine Seite liegt offen. Dazu das Menü hinter den drei Punkten (zuerst zu, danach PDF **und** Teilen) und, mit eingesetztem `navigator.share`, **welche Adresse** Teilen weitergibt – die der Seite, nicht die der Datei. Dazu: Der Zugang zum Katalog steht am Handy **ohne Scrollen** im Hero der Startseite (Lage gemessen, nicht nur Vorhandensein). Dazu seit der Design-Durchsicht: Der Zoom muss **über die Fensterbreite hinaus** gehen (die alte Prüfung verglich nur vorher/nachher und übersah, dass `img { max-width:100% }` aus `style.css` jede Vergrößerung deckelte), der linke Rand der vergrößerten Seite bleibt erreichbar, das Buch passt im **Querformat** in seinen Rahmen, der Fokus kehrt nach Escape auf die drei Punkte zurück, er bleibt in der offenen Ebene (12 Mal Tab), und nichts liegt über der offenen Ebene (vier Punkte mit `elementFromPoint`; das Einwilligungsbanner darf). Gegenprobe: 42 Fehler, jeder einzeln. **Eine Prüfung war dabei selbst zu schwach:** „Nichts liegt über der offenen Ebene" fragte vier feste Punkte ab – und die lagen neben den schwebenden Knöpfen der Website. Der eingebaute Fehler blieb unbemerkt. Jetzt werden die Knöpfe selbst gesucht (keiner darf eine Fläche haben, solange eine Ebene offen ist); der eingebaute Fehler macht die ganze CSS-Regel ungültig, nicht nur eine Zeile davon |
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


## `pruefe-bewegung.mjs` – warum es diese Prüfung gibt

Nicht wegen der Bewegung. Wegen des Gegenteils.

Im Entwurf standen am 08.11.2026 **drei fertige CSS-Regeln, die nie
eingeschaltet wurden**: die Kontaktleiste unten (`.griff.da` wurde
nirgends gesetzt), der Fortschrittsbalken (kein Skript füllte ihn) und
die Goldlinie über den Ablaufschritten (die Regel hieß `.ist-da`, die
Klasse, die wirklich gesetzt wird, heißt `.da`). Alle drei sahen im
Quelltext vollkommen richtig aus und taten nichts. Im Screenshot fällt
so etwas nur auf, wenn man genau danach sucht.

Die größere Gefahr ist die Umkehrung: Bewegung, die Inhalt **versteckt**,
solange sie nicht ausgelöst wird. Dann steht der Besucher vor einer
leeren Seite. Deshalb prüft das Skript in drei Zuständen, und in allen
dreien muss jeder Text lesbar sein:

1. **normal** – Bewegung erlaubt, JavaScript an, nach dem Durchscrollen
2. **ruhig** – `prefers-reduced-motion: reduce`, **ohne** Scrollen: Wer
   Ruhe eingestellt hat, darf nicht erst scrollen müssen, damit Text
   erscheint
3. **ohne Skript** – JavaScript aus: Überschrift, Telefonnummer und
   Kopfbild müssen da sein

**Lehre aus dem ersten Lauf:** Die Prüfung meldete „letzter Schritt
bleibt rechts außerhalb". Das war kein Fehler der Seite, sondern ihr
eigener: `scroll-behavior: smooth` im Stylesheet lässt ein normales
`scrollTo` über mehrere hundert Millisekunden fahren, gemessen wurde
mitten in der Fahrt. Jetzt `behavior: 'instant'`. Eine Prüfung mit
falschem Alarm wird abgeschaltet und prüft danach gar nichts mehr.

## Zwei Skripte, die schon vor dem 14.11.2026 nicht grün waren

Festgestellt am 14.11.2026 durch einen Vergleichslauf auf dem Stand
`ac6364c`, also **vor** den Änderungen des Tages, in einem eigenen
Arbeitsbaum. Beide verhalten sich dort genauso. Sie sind **nicht** durch
die Statik-Texte oder den Sterne-Umbau verursacht.

| Skript | Verhalten | Beleg |
|---|---|---|
| `pruefe-broschuere.mjs` | 43 bestanden, 1 nicht bestanden: „Das Buch zappelt nicht, wenn die Adresszeile einklappt", gemessen 366 gegen 318 px | vorher wie nachher dasselbe Ergebnis |
| `pruefe-konfigurator-oberflaeche.mjs` | läuft in das Zeitlimit, wartet auf `#k3dHoeheGetrennt` | vorher Abbruch nach 290 s, nachher ebenso |

**Der Broschüren-Befund ist echt und offen.** Es ist dieselbe Art
Fehler, die am 14.11.2026 im Kopfbereich der Startseite behoben wurde:
Die Seite rechnet mit der vollen Fensterhöhe, und wenn die Adresszeile
am Handy einklappt, springt der Inhalt. Auf der Startseite half `svh`
und ein mitwachsender Kopfbereich. Für die Broschüre ist das **nicht**
untersucht und nicht beauftragt.

**Zeitlimits.** Mehrere Browser-Skripte brauchen länger als 100
Sekunden. `pruefe-darstellung.mjs` besteht mit 144 von 144, wenn es
280 Sekunden bekommt, und meldet bei 100 Sekunden einen Abbruch, der
wie ein Fehler aussieht. Wer sie sammelt, gibt jedem **mindestens 280
Sekunden**.

## Browserskripte nacheinander, nicht parallel (14.11.2026)

Jedes Browserskript startet einen eigenen Webserver auf einem festen
Port. Laufen mehrere gleichzeitig, streiten sie sich darum, und das
Ergebnis ist zufällig rot.

Belegt am 14.11.2026: `pruefe-keil-editor.mjs` meldete im Sammellauf
drei Fehler und bestand einzeln. `pruefe-konfigurator-oberflaeche.mjs`
brach mit `ERR_CONNECTION_REFUSED` auf Port 8783 ab und bestand einzeln
mit 182 von 182.

**Also: nacheinander, und je Skript mindestens 280 Sekunden.**

## `scripts/pruefe-schema-faq.mjs` (neu am 14.11.2026)

**Was es prüft.** Steht im strukturierten Datenblock (Schema.org
FAQPage) wortgleich das, was der Besucher sieht? Zusätzlich: Hat jede
Frage im Datenblock ein sichtbares Gegenstück?

**Warum es entstanden ist.** Beim Entfernen der Gedankenstriche
schützte mein Skript `<script>`-Blöcke. Die strukturierten Daten
liegen in genau so einem Block. Ergebnis: 35 FAQ-Einträge auf 14
Ortsseiten sagten etwas anderes als die Seite, und auf
`baugenehmigung.html` standen sechs Fragen im Datenblock, von denen
fünf auf der Seite gar nicht vorkamen. Beides fällt ohne Prüfung
niemandem auf, weil jede Fassung für sich richtig aussieht.

**Fehler gegen Hinweis.** Eine Frage, die nur im Datenblock steht, ist
ein **Fehler**: das ist eine Behauptung über eine Seite, die es nicht
gibt. Eine Antwort, die auf der Seite nur gekürzt steht, ist ein
**Hinweis**: zulässig, solange die Aussage dort steht. Betrifft
derzeit `ratgeber/terrassenueberdachung-kosten.html`, das seine Fragen
als Überschriften führt und nicht als Aufklapper.

**Gegenprobe:** `node scripts/pruefe-schema-faq.mjs --gegenprobe`
baut vier Fälle nach (Antwort um ein Wort abweichend, Gedankenstrich
nur im Datenblock, Frage ohne sichtbares Gegenstück, kaputtes JSON)
und erwartet, dass jeder einzelne anschlägt. **4 von 4 erkannt.**

Umfang heute: 17 Seiten mit FAQ-Auszeichnung, 74 Einträge.

## Drei Skripte, die grün aussehen und nichts geprüft haben (14.11.2026)

Beim vollständigen Lauf nach einer Änderung an `src/css/style.css`
aufgefallen. **Exit-Code 0 heißt hier nicht bestanden.**

| Skript | Was wirklich passiert |
|---|---|
| `pruefe-api-bauteile.mjs` | bricht ab, weil `daten/` fehlt. Meldung: „Dieses Repository ist öffentlich; die Herstellermatrix gehört nicht hinein." Zum Prüfen müssen die Dateien aus `bv-crm/docs/konfigurator-daten/` nach `daten/` kopiert werden. |
| `pruefe-bauteile.js` | dasselbe |
| `pruefe-hinweise.js` | der Block „Dieselbe Prüfung an erzeugten Hinweisen" wird übersprungen, ebenfalls wegen `daten/`. In der Gegenprobe schlagen deshalb nur 14 von 15 an. |

Dazu, aus demselben Grund in der anderen Richtung:

| Skript | Was wirklich passiert |
|---|---|
| `pruefe-konfigurator.js --gegenprobe` | meldet „NICHT ERKANNT: Stegplatte aus der Artikelliste fehlt im Konfigurator", Ergebnis fehlgeschlagen. Die Prüfung ist an dieser Stelle blind. Fundstelle `scripts/pruefe-konfigurator.js:233-246` und `:501`. Belegt älter als der 14.11.2026: derselbe Lauf auf `ac6364c` ergibt dasselbe. |
| `pruefe-konfigurator-oberflaeche.mjs` | braucht auf dieser Maschine **mehr als 300 Sekunden**. Bei 290 s Abbruch mit „Target page … closed", einzeln und ohne Limit: 182 Prüfungen bestanden. |

**Merke:** Wer die Skripte sammelt, liest nicht nur den Exit-Code,
sondern die letzte Zeile. Ein Skript, das sagt „kopiere erst die
Daten", hat nichts geprüft.

## `scripts/pruefe-umbruch.mjs` (neu am 14.11.2026)

**Was es prüft.** Läuft sichtbarer Text aus seinem Kasten heraus?
Gemessen wird je Element `scrollWidth` gegen `clientWidth`, bei
**320 und 390 px**, auf allen Seiten außer Entwürfen. Erfasst werden
Überschriften, Knöpfe, Beschriftungen und `strong`.

**Warum es entstanden ist.** Im Kopf von sieben Ortsseiten stand bei
390 px „Terrassenüberdach" und dann nichts mehr: 451 px Inhalt in
einem 362 px breiten Kasten. **Die Seite scrollte dabei nicht
waagerecht**, deshalb hat keines der 56 vorhandenen Skripte es gesehen,
obwohl mehrere auf Querscrollen prüfen. Gefunden hat es ein Prüfer von
Hand. Deutsche Komposita sind lang, das Problem kommt wieder.

**Ausgenommen, mit Absicht:**
- Elemente in einem Kasten mit `overflow-x: auto` oder `scroll`, auch
  wenn es am Elternteil steht. Die Lastzonen-Tabelle und die
  Bildergalerie scrollen absichtlich seitwärts.
- Unsichtbare Elemente, sonst meldet jede eingeklappte Navigation
  einen Fehler.

**Gegenprobe:** `node scripts/pruefe-umbruch.mjs --gegenprobe`
setzt eine Überschrift auf 140 px und erwartet einen Befund, wo vorher
keiner war. **Erkannt.**

**Erster Durchlauf: zehn Treffer, alle falsch.** Es waren die
Markierungsknöpfe im 3D-Modell. Ihr Kasten ist absichtlich 1 × 1 px
groß mit `overflow: hidden` und `clip-path` und klappt erst bei
Tastaturfokus auf, das übliche Muster für Sprunglinks und
Screenreader-Hilfen.

**Der erste Reflex war die falsche Lösung.** „Elemente ohne Text
überspringen" hätte funktioniert, aber aus dem falschen Grund: Diese
Knöpfe tragen ihre Beschriftung über `::after { content:
attr(aria-label) }`. Sie **haben** sichtbaren Text, nur nicht dort, wo
man ihn sucht. Die Prüfung wäre an genau dieser Stelle dauerhaft und
unbemerkt blind geworden.

**Jetzt zwei präzise Ausnahmen:** versteckte Kästen (1 px mit
abgeschnittenem Inhalt oder `clip-path: inset(50%)`) und Elemente, die
auch über Pseudoelemente keinen Text zeigen. Beide mit Begründung im
Code, damit sie niemand als überflüssig entfernt.

**Stand nach der Korrektur:** 110 Kombinationen, kein Befund.

**Dabei selbst in die Falle getappt:** Im ersten Entwurf wurde die
Messfunktion als Zeichenkette an den Browser übergeben. Playwright
wertete sie als Ausdruck aus, das Ergebnis kam als `undefined`
zurück, und die Prüfung hätte **immer null Befunde** gemeldet. Also
eine Prüfung, die dauerhaft grün ist, ohne je zu messen. Aufgefallen
ist es nur, weil die Gegenprobe sofort mitlief. Der vierte Fall dieser
Art an einem Tag.
