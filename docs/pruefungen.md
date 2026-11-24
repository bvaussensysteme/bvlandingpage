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
| `scripts/pruefe-cache-buster.sh` | **Drei Fragen.** 1. Verweisen alle HTML-Dateien auf dieselbe Version einer CSS-/JS-Datei? 2. Wurde die Version mit der Datei hochgezählt (Dateidatum gegen das Datum der letzten Versionsänderung aus der Git-Geschichte)? 3. **Seit 22.11.2026:** Wird überhaupt jede eigene JS- und CSS-Datei mit `?v=` eingebunden? Diese dritte Frage fehlte, und genau dadurch hingen `main.js`, `cookie.js`, `accessibility.js` und `metricool.js` wochenlang ohne jede Version auf 51 bis 55 Seiten. Fremde Adressen (`http`, `https`, `//`) zählen nicht mit. Gegenprobe für alle drei, die dritte in beide Richtungen: fehlende Version muss auffallen, sauberer Stand darf nicht anschlagen |
| `scripts/pruefe-metatexte.mjs` | Titel und Suchbeschreibung jeder ausgelieferten Seite: vorhanden, Titel höchstens 60 und Beschreibung höchstens 155 Zeichen (HTML-Entities vorher aufgelöst), Marke im Titel, kein Gedankenstrich, keine zwei Seiten mit demselben Titel oder derselben Beschreibung. Rechtstexte werden auf Gedankenstriche nur als Hinweis gemeldet, nicht beanstandet. (2 Fehler in der Gegenprobe, in zwei verschiedenen Dateien) |
| `scripts/pruefe-einwilligung.mjs` | Das Cookie-Fenster: Erscheint es? Geht Ablehnen mit **einem** Klick auf derselben Ebene? Haben Ablehnen und Annehmen dieselbe Breite, Höhe, Schrift und beide mindestens 4,5:1? Ist Ablehnen nicht ausgegraut, steht es zuerst, misst die Tippfläche 44 px? Ist kein Kästchen vorangekreuzt? Auf Rechner und Handy. (2 Fehler in der Gegenprobe, in zwei verschiedenen Dateien) |
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
| `scripts/pruefe-ral-assistent.mjs` | **Die RAL-Suche im Anfrage-Assistenten**, im echten Browser: Trefferliste erscheint, ein Treffer setzt die Farbe, und das Eingabefeld behält beim Tippen den Fokus. Letzteres ist kein Schönheitsfehler: Verliert das Feld den Fokus nach dem ersten Zeichen, kann niemand einen Farbnamen eintippen. Gegenprobe: lässt die Trefferliste leer, drei Prüfungen müssen anschlagen. **Belegt derselben Port 8247 wie `pruefe-assistent.mjs`**, beide also nicht gleichzeitig starten. Stand bis zum 22.11.2026 als einziges Skript nicht in dieser Liste |
| `scripts/pruefe-assistent.mjs` | Bedienung des Anfrage-Assistenten im echten Browser: Eindeckungs-Kacheln alle gleich groß (auch bei ungerader Anzahl), Aufpreis-Hinweis bei der Wunschfarbe, RAL-Suche (Kachel, Suchfeld, „braun" findet Brauntöne, Nummer steht vorn, Unsinn erklärt sich, **Eingabefeld behält den Fokus**, Treffer setzt die Farbe) |
| `scripts/pruefe-balkon.mjs` | Balkonüberdachung am fertigen Modell im Browser: Pfostenfuß auf der Brüstung bzw. am Boden, Pfosten hinter der Brüstung, Dach bis zur Außenkante, Pfosten-Auswahl verschwindet beim Geländer, Baurechts-Hinweis, keine Javascript-Fehler. Gemessen werden Eckpunkte in Weltkoordinaten |
| `scripts/pruefe-kurzlink.mjs` | Kurzlink im Worker ohne Datenbank: Wege bedient, Unsinn mit 400 abgewiesen bevor die Datenbank angefasst wird, 503/404 ohne Datenbankmeldung, Kennung stabil und vorlesbar, Tabelle ohne Persönliches. Dazu die Ausweich-Logik an einer nachgebauten Datenbank: `public` offen / `public` verschlossen / Datenbank ganz weg, und die fertigen SQL-Befehle werden zurückgelesen |
| `scripts/pruefe-zahlenseite-maskierung.py` | **Kein Datenbankwert ungemaskiert im HTML der Zahlenseite.** Die Seite baut ihre Inhalte als Zeichenkette und setzt sie per `innerHTML` ein; die Werte kommen aus der Tabelle `ereignis`, und die fuellt der **oeffentliche** Endpunkt `POST /api/messung`. Die Pruefung liest jeden `reihe(`-Aufruf, blendet die drei unbedenklichen Faelle aus (`sicher(...)` klammertief, Nachschlagetabellen `TABELLE[x.feld]`, Bedingungen `x.feld ?`) und meldet jeden Datenbankwert, der uebrig bleibt. Gegenprobe: 3 Fehler, jeder einzeln. Anlass: Am 08.11.2026 fehlte `sicher()` an fuenf Stellen – siehe `docs/entscheidungen.md` |
| `scripts/pruefe-produktwahl.mjs` | Kommt die Produktwahl **aller sechs Produktseiten** im Anfrage-Assistenten an – über einen echten Seitenwechsel im Browser? Prüft auch, dass Geländer, Markise und Kaltwintergarten über den Kurzweg gehen und ihren Namen im Nachrichtenfeld tragen. Gegenprobe: unbekannter Schlüssel muss verworfen werden |
| `scripts/pruefe-standort-mitgeben.mjs` | Kommt der im Windzonen-Rechner gesuchte Standort als PLZ und Ort im Anfrageformular an – über einen echten Seitenwechsel im Browser? Gegenprobe: unsinnige Werte im Speicher (`abcde`, `<img src=x onerror=…>`) müssen verworfen werden |
| `scripts/pruefe-referenz-galerie.mjs` | Passen Referenz-Galerie und Lightbox **auf der Startseite** zusammen? Fortlaufende Nummern, gleich viele Einträge, Alternativtexte, Herkunftsangabe, vorhandene Dateien, und jede Karte öffnet im Browser wirklich ihr eigenes Bild. **Seit 21.11.2026 dazu die Tastatur:** keine Schaltfläche in einer Schaltfläche, jedes der 14 Bilder mit echten Tab-Drücken erreichbar, jedes öffnet auf die Eingabetaste, und nach Escape liegt der Fokus wieder auf demselben Bild (WCAG 2.2, 2.1.1, Stufe A). Gegenprobe: drei Sabotagen einzeln – ein entfernter Eintrag, `tabindex="-1"` an allen Schaltflächen, eine gekappte Fokusrückkehr – jede muss auffallen |
| `scripts/pruefe-galerie.mjs` | Die Bildergalerien „Ausführungsbeispiele" auf den sieben Produktseiten und drei Städteseiten im echten Browser. 64 Messungen, siehe Abschnitt weiter unten. Gegenprobe: 4 eingebaute Fehler |
| `scripts/pruefe-staedte-galerie.mjs` | Passt der erzeugte Bilderstreifen in den 14 Städteseiten noch zu `src/_data/galerien.json`? Lädt den Generator als Modul, baut die Blöcke neu und vergleicht sie Zeichen für Zeichen; dazu ein zweiter Weg, der die Alternativtexte direkt im HTML sucht. Gegenprobe: 2 eingebaute Fehler, einer für jeden Weg |
| `scripts/pruefe-schema-bilder.mjs` | Zeigen die Bild-URLs im Product-Schema der Produktseiten wirklich auf vorhandene Bilder, die auf derselben Seite auch **sichtbar** sind? Drei Wege: absolute URL auf eigener Domain, Datei liegt im Repository, `src` derselben Datei steht im HTML. Gegenprobe: 3 eingebaute Fehler, einer je Weg |
| `scripts/pruefe-schrift.mjs` | Steht wirklich **jede** Textstelle in Manrope? 19 Seiten in zwei Breiten, Element für Element, dazu: keine Seite lädt eine andere Familie nach, keine hat noch Arial Black als Ausweichschrift. Vier Ausnahmen mit Begründung (Monospace-Zahlenwert, `code`, SVG-Beschriftung, das kursive „i" der Hinweiszeichen). Gegenprobe: eine einzige Stelle auf eine fremde Schrift gesetzt |
| `scripts/pruefe-schwebe.mjs` | Fährt mit der Maus über jeden sichtbaren goldenen Knopf auf fünf Seiten: Antwortet er überhaupt, wird die Schrift weiß, hält Weiß auf dem neuen Grund 4,5:1, und antworten **alle** Knöpfe einer Seite gleich? Das Letzte ist der Kern: Der Fehler war kein kaputter Knopf, sondern zwei verschiedene Antworten auf dieselbe Geste. Gegenprobe: der alte Zustand wird wieder eingebaut |
| `scripts/pruefe-prozess-ringe.mjs` | **Füllen sich die vier Ringe im Ablauf, und ruhen sie, wenn sie sollen?** Liest im Browser alle 120 ms den Füllstand aller Ringe, 13 Sekunden lang, und zählt die Werte dazwischen. Ohne die Einstellung „Bewegung reduzieren“ muss jeder Ring mindestens 5 Zwischenwerte zeigen; mit ihr darf sich in 13 Sekunden **kein einziger Wert** ändern, und alle Ringe müssen voll sein. Anlass: Am 22.11.2026 meldete der Betreiber vom iPhone ein Blinken statt eines Füllens. Ursache war nicht das Telefon, sondern die Einstellung: Das Skript verkürzte dort nur die Zeiten, statt die Bewegung zu lassen, und begann alle vier Sekunden von vorn. Gegenprobe: stellt genau dieses Verhalten wieder her, das Blinken muss auffallen |
| `scripts/pruefe-menue-banner.mjs` | **Liegt der Cookie-Hinweis über dem geöffneten Handy-Menü?** Öffnet auf drei Seiten in zwei Breiten das Menü und sieht mit `elementFromPoint` nach, was an der Mitte jedes Eintrags wirklich oben liegt. Nicht die z-index-Zahlen vergleichen: Ein Stapel hängt auch an Stapelkontexten. Anlass: Am 22.11.2026 waren bei 320 px 5 von 7 Einträgen verdeckt, beim ersten Besuch war das Menü also unbedienbar (WCAG 2.2, 2.4.11, Stufe AA, sobald ein verdeckter Eintrag den Fokus hat). Gegenprobe: legt das Menü wieder unter den Hinweis, 24 verdeckte Einträge müssen auffallen |
| `scripts/pruefe-fokusring.mjs` | **Ist der Fokusring überhaupt zu sehen?** (WCAG 2.2, 2.4.7, Stufe AA.) Tabbt über vier Seiten und rechnet für jedes fokussierte Element aus, ob ein Vorfahre mit `overflow: hidden` den Ring abschneidet: Ein Ring sitzt zwischen `outline-offset` und `offset + width` außerhalb des Elements; bleibt auf keiner der vier Seiten mehr Luft als der Abstand, ist nichts zu sehen. Anlass: Am 21.11.2026 waren so **19 von 19** Fragen der Fragenliste auf `index.html` ohne sichtbaren Ring, weil `css/start.css` den Ring der ganzen Startseite nach außen schiebt. **Das ist eine andere Frage als `pruefe-fokus-verdeckung.mjs`** (liegt etwas Festes darüber), und beide waren grün, während 20 Ringe unsichtbar waren. Gegenprobe: schiebt die Ringe der Fragenliste wieder nach außen, muss auffallen |
| `scripts/pruefe-fokus-verdeckung.mjs` | Tabbt sich durch sieben Seiten in zwei Breiten, mit und ohne offenen Cookie-Hinweis, und meldet jedes fokussierte Element, das **vollständig** hinter einem festen oder klebenden Element liegt (WCAG 2.2, 2.4.11, Stufe AA). Gegenprobe: eine eingebaute feste Leiste über die obersten 220 px muss auffallen |
| `scripts/pruefe-wirkung.mjs` | **Kommt an, was im Stilblatt steht?** Zwei Fragen, eine Ursache. (a) **Ringfarbe:** Tabbt sich mit echter Tastatur durch **alle** Seiten und rechnet fuer jeden Haltepunkt die tatsaechliche Ringfarbe gegen den tatsaechlichen Untergrund dahinter, verlangt 3:1 (WCAG 2.2, 1.4.11 und 2.4.7). (b) **Schriftgewicht:** Liest alle Regeln aus `src/css/style.css`, die auf einer einzelnen Klasse ein `font-weight` setzen, und vergleicht, was davon auf der Seite ankommt. Anlass: Am 23.11.2026 wurden an einem Tag **sechs unsichtbare Fokusringe** gefunden, keiner davon von einer der 82 Pruefungen, dazu **fuenf Gewichte**, die von `.start-premium p` geschlagen werden und nie auf dem Schirm ankommen. **Das ist eine dritte Frage neben `pruefe-fokusring.mjs`** (wird der Ring abgeschnitten) **und `pruefe-fokus-verdeckung.mjs`** (liegt etwas darueber); beide waren jedes Mal gruen. Rechnet NICHT mit: schwebende Elemente (`position: fixed`, der Untergrund scrollt) und Ringe auf einem echten Foto; beide werden gezaehlt und gemeldet. Erkennt ein dunkles Innenband aus `box-shadow: inset` als Untergrund, sonst meldete sie die sorgfaeltig gebauten Zweiton-Ringe als kaputt. **Sie sucht ihre Seiten selbst** (53 Stueck, ausgenommen nur die Vorlage, der gesperrte Konfigurator und die Werkstatt): Eine feste Liste wird nie nachgezogen, und genau daran ist `pruefe-mitwachsend.mjs` gescheitert. Eine neue Seite ist automatisch mitgeprueft. Gegenprobe: setzt die Ringfarbe auf die Untergrundfarbe (hell und dunkel) und drueckt alle Absatzgewichte auf 400, beide Fehlerarten muessen auffallen |
| `scripts/pruefe-modellbilder.mjs` | Lassen sich die 34 Modellbilder in den Produktkarten antippen und wischen? Prüft alle 16 Seiten ohne Browser (Skript geladen, Alternativtexte) und zwei davon im echten Browser: öffnen, wischen, Escape, Fokusrückkehr, und der Sonderfall mit nur einem Modell. Gegenprobe: das Skript wird blockiert, der Ausfall muss auffallen |
| `scripts/pruefe-bilder-blaettern.mjs` | Blättern der Bilder in den sieben Leistungskarten der Startseite. Pfeile am Rechner (unsichtbar bis die Maus drüberfährt, 44 x 44 px, Fokus macht sie sichtbar), am Telefon **keine** Pfeile und Wischen blättert, senkrechtes Wischen nicht. Dazu die Punkte: einer je Bild, der aktive golden **und** größer, im Bild liegend, mit `aria-hidden` und ohne Schaltfläche, daneben der vorgelesene Satz „Bild 2 von 6" und oben rechts die Zahl „1 / 6". Und der Nachweis, dass sich nichts von allein bewegt. Gegenprobe: das Skript wird blockiert |
| `scripts/pruefe-referenz-lauf.mjs` | Der Lauf „Projekte, die für sich sprechen" am Telefon: Punkte statt Pfeilen, aktiver Punkt golden und größer, **`touch-action` sperrt das waagerechte Wischen nicht**, ein Bild füllt den Lauf ohne Rest am Rand, und eine **echte Fingergeste** über das Entwicklerprotokoll schiebt ihn wirklich. Gegenprobe: beide gemeldeten Fehler werden wieder eingebaut |
| `scripts/pruefe-vergleich.mjs` | Die Gegenüberstellung TDS/SkyView auf der Terrassenseite: sechs vollständige Zeilen, beide Modelle als Spaltenkopf, Beschriftung für Screenreader – und auf 390 px **kein waagerechtes Scrollen**. Gegenprobe: ein zu langes Wort in einer Zelle muss auffallen |
| `scripts/pruefe-konfigurator-verweise.mjs` | **Führt ein Verweis ins Leere?** Solange `KONFIGURATOR_GESPERRT` gilt, darf es keinen aktiven Verweis auf `/konfigurator.html` geben; auskommentierte zählen nicht, dafür werden HTML- und Nunjucks-Kommentare vorher entfernt. Fällt die Sperre, prüft dasselbe Skript die Gegenrichtung: Die 24 ausgeblendeten Stellen müssen zurück sein, sonst bliebe der fertige Konfigurator unsichtbar. Gegenprobe: ein aktiver Verweis in eine Kopie im Speicher, er fällt auf |
| `scripts/pruefe-schema-gueltig.mjs` | **Sind die strukturierten Daten überhaupt lesbar?** Jeder `application/ld+json`-Block auf jeder ausgelieferten Seite wird gelesen; 93 Blöcke auf 60 Seiten. Dazu: keine versprochene `SearchAction` auf einer Seite, die kein `?q=` auswertet. Entstanden am 22.11.2026, weil ein HTML-Kommentar in einem JSON-LD-Block ihn unbrauchbar machte und **keine** der 77 vorhandenen Prüfungen das bemerkte. Gegenprobe: Kommentar in die eine Datei, erfundene Suche in eine **andere** (ein kaputter Block verdeckt sonst den zweiten Befund), beides fällt auf |
| `scripts/pruefe-bremse.mjs` | **Bremst die Schnittstelle wirklich?** Schneidet die Bremse aus `worker/index.js` heraus und spielt ihr Anfragen vor, ohne Netz und ohne Cloudflare. Geprüft: jede öffentliche Schnittstelle hat eine Regel, unterhalb der Grenze kommt alles durch, darüber wird gesperrt mit sinnvoller Wartezeit, zwei Absender behindern sich nicht, und ein echter Besuch mit 40 Meldungen läuft nicht in die Bremse. Gegenprobe: Grenze auf 999999 gesetzt, die Sperre bleibt aus und fällt auf |
| `scripts/pruefe-sitemap.mjs` | **Indexiert Google die richtigen Seiten?** Zu jeder Adresse der Sitemap gibt es eine Datei, keine trägt `noindex`, keine vom Worker gesperrte Adresse steht drin, jedes `canonical` zeigt auf die eigene Adresse. Dazu die Erinnerung in die andere Richtung: Fällt die Konfigurator-Sperre, muss der Eintrag zurück in die Sitemap. Läuft **ohne Netz**, weil die Sperre im Worker steht und ein lokaler Dateiserver dort 200 liefern würde. Gegenprobe: drei falsche Adressen in eine Kopie der Sitemap gelegt (eine fehlende, eine mit `noindex`, die gesperrte), alle drei fallen auf |
| `scripts/pruefe-startseite.mjs` | Die Premium-Schicht der Startseite: greift sie überhaupt, stimmen Markengold, Textgold, Tiefschwarz und Manrope, steht **nirgends Gold als Text auf hellem Grund**, sind Anfrage-Knopf und zweiter Einstieg ≥ 44 px, scrollt nichts waagerecht – und sind Navigation, Assistent, Galerie, Produktkarten, Rechner und Fuß noch da? Auf 390, 768 und 1280 px. Seit dem 20.11.2026 zusätzlich: **keine einzige Textstelle in einer anderen Schrift als Manrope** (vorher las die Prüfung nur den `body` und übersah 38 Stellen in Barlow Condensed und Inter), und es wird nur Manrope nachgeladen. Seit dem 22.11.2026 zusätzlich der **Stoffstreifen**: alle 53 Kacheln, alle als Verweis auf `/stoffe.html`, alle beschriftet, mindestens 44 × 44 px, Zähler auf „1 / 53", Knopf mindestens 44 px hoch, und der Streifen scrollt **in sich** statt die Seite mitzunehmen. Zwei Gegenproben: ohne die Klasse `start-premium` muss die Palettenprüfung anschlagen, und ohne `overflow-x` am Streifen muss die Überlaufprüfung anschlagen |
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
| `scripts/pruefe-broschuere.mjs` | **Die Katalogseite im Browser**, 42 Prüfungen: 36 Seitenadressen in der richtigen Reihenfolge, beim Start nur wenige Bilder geladen (Nachladen wird nach dem Blättern gemessen), **keine einzige Netzanfrage an einen fremden Host** (Grenze: gegen den oertlichen Server gemessen – was Cloudflare am Rand dazulegt, sieht diese Pruefung nicht, siehe `docs/entscheidungen.md`, 07.11.2026), Buch aufgeschlagen, Zähler, Weiter-Knopf, Pfeiltaste, Seitenübersicht mit 36 Kacheln und Sprung, Zoom (Breite vor/nach `+`), Vollbild-Knopf, PDF abrufbar, alle 72 Bilddateien da, Weg zum PDF ohne JavaScript, Verweise aus Navigation, Startseite und `sitemap.xml`, Übersetzungen eingetragen **und die Übersetzungsdatei lauffähig**; am Handy 44 px, **eine Wischgeste blättert** (touchstart am Buch, touchmove/touchend am Fenster – so hört die Bibliothek zu) und nur eine Seite liegt offen. Dazu das Menü hinter den drei Punkten (zuerst zu, danach PDF **und** Teilen) und, mit eingesetztem `navigator.share`, **welche Adresse** Teilen weitergibt – die der Seite, nicht die der Datei. Dazu: Der Zugang zum Katalog steht am Handy **ohne Scrollen** im Hero der Startseite (Lage gemessen, nicht nur Vorhandensein). Dazu seit der Design-Durchsicht: Der Zoom muss **über die Fensterbreite hinaus** gehen (die alte Prüfung verglich nur vorher/nachher und übersah, dass `img { max-width:100% }` aus `style.css` jede Vergrößerung deckelte), der linke Rand der vergrößerten Seite bleibt erreichbar, das Buch passt im **Querformat** in seinen Rahmen, der Fokus kehrt nach Escape auf die drei Punkte zurück, er bleibt in der offenen Ebene (12 Mal Tab), und nichts liegt über der offenen Ebene (vier Punkte mit `elementFromPoint`; das Einwilligungsbanner darf). Gegenprobe: 42 Fehler, jeder einzeln. **Eine Prüfung war dabei selbst zu schwach:** „Nichts liegt über der offenen Ebene" fragte vier feste Punkte ab – und die lagen neben den schwebenden Knöpfen der Website. Der eingebaute Fehler blieb unbemerkt. Jetzt werden die Knöpfe selbst gesucht (keiner darf eine Fläche haben, solange eine Ebene offen ist); der eingebaute Fehler macht die ganze CSS-Regel ungültig, nicht nur eine Zeile davon . **Die Gegenprobe läuft seit dem 21.11.2026 nebeneinander** (vier Runden gleichzeitig, `BV_PARALLEL` stellt die Anzahl): **gemessen 9 Minuten statt 29**, alle 42 eingebauten Fehler werden bemerkt. Sie bricht auch nicht mehr beim ersten unbemerkten Fehler ab, sondern nennt am Ende alle |
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


## `pruefe-bewegung.mjs` – am 22.11.2026 ausgemustert

**Das Skript ist gelöscht.** Es prüfte ausschließlich die Entwurfsseite
`entwurf-bv.html`, und die ist auf Ansage des Betreibers („Vor der
Veröffentlichung löschen") zusammen mit `entwurf/bv.css` entfernt
worden. Seitdem brach es mit `ENOENT: entwurf/bv.css` ab, ohne etwas zu
prüfen. Ein Skript, das nichts prüft, aber rot leuchtet, verdeckt echte
Befunde im Gesamtlauf.

**Warum nicht umgeschrieben.** Jeder einzelne Prüfpunkt hing an
Bauteilen, die es nur im Entwurf gab: `.griff` (Kontaktleiste unten),
`.ablauf-buehne` und `.weg-liste` (die fahrende Ablaufspur), `.naht`,
`.kopf-bild`, `.zahlenband`. Auf der echten Seite existiert keiner
dieser Namen. Eine Neufassung wäre eine neue Prüfung gewesen, keine
Reparatur.

**Das Muster selbst gibt es auf der laufenden Seite sehr wohl**, nur
unter anderen Namen: `.bv-einblenden` auf `<html>`, `.bv-auf` je Karte
und `.ist-da` als Endzustand (siehe `src/css/style.css`, Abschnitt
„Sanftes Einblenden beim Scrollen"). Es ist also nicht so, dass die
Gefahr verschwunden wäre.

**Wovon der Gedanke heute abgedeckt ist** (alle auf echten Seiten, nicht
im Entwurf):

| Frage von damals | prüft heute |
|---|---|
| Bleibt nach dem Durchscrollen etwas auf `opacity: 0` hängen? | **`pruefe-darstellung.mjs`** – scrollt 12 Seiten in 3 Breiten komplett durch und prüft danach genau die Selektorenliste aus der Einblend-Regel; Gegenprobe baut `opacity: 0 !important` ein |
| Text sichtbar ganz ohne JavaScript | `pruefe-galerie.mjs`, `pruefe-einzugsgebiet.mjs` |
| Bewegung bei `prefers-reduced-motion: reduce` | `pruefe-prozess-ringe.mjs`, `pruefe-referenz-lauf.mjs`, `pruefe-schrift.mjs`, `pruefe-fokus-verdeckung.mjs` |
| Fährt eine Animation wirklich, statt nur im CSS zu stehen | `pruefe-prozess-ringe.mjs` (Messpunkte mitten im Füllen) |

**Damit entsteht keine Lücke.** Die wichtigste Frage der alten Prüfung,
„bleibt Inhalt unsichtbar, weil eine Bewegung nicht ausgelöst wurde",
prüft `pruefe-darstellung.mjs` auf den echten Seiten und mit derselben
Selektorenliste, die auch in der CSS-Regel steht. Dieselbe Prüfung hat
am 07.11.2026 genau diesen Fehler gefunden (13 Karten auf 5 Seiten auf
`opacity: 0`).

**Ein Zwischenstand, der falsch war und hier stehen bleibt, damit ihn
niemand noch einmal glaubt:** Beim Ausmustern stand hier zuerst, die
laufende Seite habe überhaupt keine einblendenden Klassen. Das war ein
`grep` nach den Entwurfsnamen `.auf`/`.da`, und der fand nichts. Die
echten Namen sind `.bv-einblenden`, `.bv-auf` und `.ist-da`. Korrigiert
am selben Tag.

**Die Lehre aus dem ersten Lauf bleibt gültig und steht hier weiter,
weil sie für jedes neue Bewegungs-Skript gilt:** Die Prüfung meldete
einst „letzter Schritt bleibt rechts außerhalb". Das war kein Fehler
der Seite, sondern ihr eigener: `scroll-behavior: smooth` im Stylesheet
lässt ein normales `scrollTo` über mehrere hundert Millisekunden
fahren, gemessen wurde mitten in der Fahrt. Richtig ist
`behavior: 'instant'`. Eine Prüfung mit falschem Alarm wird
abgeschaltet und prüft danach gar nichts mehr.

## `pruefe-metatexte.mjs` – warum 60 und 155 Zeichen

**Anlass (22.11.2026).** Der Betreiber hatte auf die Frage nach den zu
langen Seitentiteln geantwortet: „Kürzen und mir hinterher zeigen."
Gemessen waren **22 indexierbare Seiten** über der Grenze, der längste
Titel 94 Zeichen, die längste Beschreibung 187.

**Warum das messbar ist und nicht Geschmack.** Google schneidet nicht
nach Zeichen ab, sondern nach Pixelbreite: rund 580 px beim Titel, rund
920 px bei der Beschreibung. Als Faustzahl sind das 60 und 155 Zeichen.
Was darüber steht, sieht der Suchende nie, und ein Titel, der mitten im
Wort endet, verliert seine Aussage. Zu kurz ist kein Fehler, nur eine
verpasste Gelegenheit, deshalb prüft das Skript ausschließlich die
Obergrenze.

**Was es ausdrücklich NICHT prüft:** ob der Titel gut ist. Ob er das
richtige Stichwort trägt, zum Inhalt passt oder zum Klicken bringt.
Das steht in keinem Quelltext.

**Drei Fallen, alle am 22.11.2026 selbst hineingetreten:**

1. **`&amp;` sind fünf Zeichen im Quelltext und eines auf dem
   Bildschirm.** Die erste Messung zählte roh und meldete sechs Seiten
   zu viel. Jetzt werden Entities vorher aufgelöst.
2. **„Marke am Ende" war zu streng.** Die Produktseiten heißen
   „... | BV AussenSysteme Westerwald", der Ortszusatz dahinter ist
   Absicht. Die erste Fassung beanstandete 13 richtige Titel. Geprüft
   wird jetzt, ob die Marke **enthalten** ist.
3. **Rechtstexte dürfen nicht beanstandet werden.** `src/agb.njk`,
   `src/widerruf.njk` und `src/impressum.njk` haben Gedankenstriche im
   Titel. Nach der Regel vom 14.11.2026 werden sie nur gemeldet, nicht
   geändert. Das Skript nennt sie am Ende als **Hinweis** und verweist
   auf `docs/rechtstexte-befunde.md`. Die Gedankenstriche in den
   Beschreibungen von AGB und Impressum sind die **Firmierung** und von
   der Regel ohnehin ausgenommen.

**Zwei echte Nebenfunde beim ersten Lauf**, beides keine Textänderung
und deshalb sofort behoben:

- `_template.html` lag mit 26 KB im Web-Wurzelverzeichnis, trug
  `robots: index, follow` und hatte **denselben Titel und dieselbe
  Beschreibung** wie `produkte/gelaender.html`. Zwei Seiten mit
  demselben Titel konkurrieren in der Suche gegeneinander, und Google
  wählt selbst aus, welche es zeigt. Jetzt `noindex, follow`.
- `kontakt.html` ist ein Weiterleitungsstummel von 2 KB auf
  `/#kontakt`, hatte aber **keine** `robots`-Angabe, während
  `termin.html` und die beiden Stummel unter `produkte/` längst auf
  `noindex` standen. Jetzt auch.

**Nachgeprüft auf der Vorschau, und das korrigiert die Einordnung
beider Funde.** Beide waren **nicht** erreichbar:
`/_template.html` antwortet mit **404**, der Worker liefert Dateien mit
führendem Unterstrich gar nicht aus. `/kontakt.html` antwortet mit
**301** auf `/#kontakt`, also kommt der Stummel selbst nie beim
Besucher an. Es war damit **kein offener Mangel auf der Seite**,
sondern ein Mangel im Quelltext. Das `noindex` bleibt trotzdem
stehen: Es kostet nichts und greift, falls die Auslieferungsregel
später einmal anders aussieht. Gemessen am 22.11.2026 mit `curl` ohne
Folgen von Weiterleitungen, mit eindeutigem Abfrageanhang.

**Die Gegenprobe baut die zwei Fehler in zwei verschiedene Dateien
ein** (`index.html` und `stoffe.html`). Grund: Am 22.11.2026 fiel bei
einer anderen Prüfung der zweite eingebaute Fehler nicht auf, weil
beide in derselben Datei standen und der erste die Datei schon
unbrauchbar machte.


## `pruefe-einwilligung.mjs` – wo die Grenze liegt

**Anlass (23.11.2026).** Der Betreiber wollte das Cookie-Fenster so
gebaut haben, „das leute einfach alles akzeptieren drücken weil die kb
haben inn die einstellungen etc zu gehen", ausdrücklich „alles im
legalen rahmen". Diese beiden Sätze vertragen sich bis zu einer
bestimmten Grenze, und die ist in Pixeln nachmessbar. Genau die misst
diese Prüfung.

**Woraus die Grenze folgt.** Eine Einwilligung ist nur wirksam, wenn
sie freiwillig ist und ohne Nachteil verweigert werden kann
(Art. 4 Nr. 11 und Art. 7 DSGVO; für das Speichern auf dem Gerät
§ 25 TDDDG). Daraus werden drei messbare Forderungen:

1. **Ablehnen in einem Klick, auf derselben Ebene.** Ein Weg über
   „Einstellungen" zählt nicht als Ablehnen.
2. **Gleich auffällig.** Gleiche Breite, gleiche Höhe, gleiche
   Schriftgröße und -stärke, beide mindestens 4,5:1, keiner
   ausgegraut. Der kleinere oder blassere Ablehnen-Knopf ist der
   häufigste Abmahngrund bei Cookie-Fenstern.
3. **Nichts vorangekreuzt.** Ein Haken, der schon drin ist, ist keine
   Handlung des Besuchers.

**Was die Prüfung NICHT kann:** beurteilen, ob die Texte inhaltlich
reichen, ob alle Dienste genannt sind oder ob die
Datenschutzerklärung dazu passt. Sie misst die Form. **Sie ist keine
Rechtsberatung**, sie bereitet die Frage nur so auf, dass ein Anwalt
sie schnell beantworten kann.

**Diese Prüfung wird nicht angepasst, damit sie wieder grün wird.**
Wer sie reißt, ändert die Rechtslage mit. Soll die Gestaltung anders
werden, gehört das vorher besprochen.

**Was legal trotzdem möglich ist**, und am 23.11.2026 auch gemacht
wurde: Aus vier Knöpfen wurden zwei plus „Einstellungen". Vorher gab
es „Ablehnen" **und** „Nur notwendige", also zwei Knöpfe mit
demselben Ergebnis. Wer vier Knöpfe sieht, von denen zwei dasselbe
tun, liest erst alle und entscheidet dann oft gar nicht. Weniger
Auswahl führt zu mehr Entscheidungen. Das ist kein Trick, sondern
weniger Verwirrung.

**Eine Falle beim Bau der Gegenprobe:** Die ausgelieferte CSS-Datei
ist zusammengepresst. Gesucht wurde zuerst nach
`.cb-btn--necessary {` mit Leerzeichen, in der Datei steht aber
`.cb-btn--necessary{`. Dadurch wurde nur einer der zwei Fehler
eingebaut, und die Gegenprobe meldete sich selbst als nicht bestanden.


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

## `scripts/pruefe.sh`: die Skripte aufrufen, ohne die Endung zu raten

Die Prüfskripte sind teils `.mjs`, teils `.js`, teils `.py`, teils
`.sh`. Wer eines einzeln aufruft, rät die Endung, und ein falsch
geratenes `node scripts/pruefe-stufen.mjs` endet mit
`MODULE_NOT_FOUND`. In einer Liste von 56 Zeilen sieht das aus wie ein
abgestürztes Skript.

**Am 14.11.2026 ist das dreimal passiert**, bei `pruefe-fuehrung`,
`pruefe-stufen` und `pruefe-datenschutz`. Jedes Mal war in Wirklichkeit
alles in Ordnung, und jedes Mal habe ich erst einen Fehler berichtet
und ihn danach zurücknehmen müssen.

```
scripts/pruefe.sh stufen fuehrung datenschutz
scripts/pruefe.sh --alle
scripts/pruefe.sh --alle --gegenprobe
```

**Was er zusätzlich richtig macht:**
- **Nacheinander, nie parallel.** Browserskripte starten eigene Server
  auf festen Ports und streiten sich sonst darum.
- **600 Sekunden je Skript**, weil `pruefe-konfigurator-oberflaeche.mjs`
  mehr als 300 braucht.
- **Ein Zeitlimit wird als solches gemeldet**, nicht als Erfolg:
  „ZEITLIMIT nach 600s (nicht gelaufen, also nicht grün)". Ein Skript,
  das nicht durchläuft, ist nicht bestanden.
- Ein Name, den es nicht gibt, meldet „GIBT ES NICHT" statt still
  nichts zu tun.

## pruefe-mitwachsend.mjs (15.11.2026)

**Was sie prüft.** Lädt `index.html`, `carport-koblenz.html`,
`produkte/carport.html` und `ratgeber/index.html` in sieben
Bildschirmbreiten (320, 360, 390, 430, 768, 1024, 1440) und meldet:

1. sichtbare Elemente, die über den rechten Fensterrand hinausragen,
2. Elemente, die aus ihrem Elternkasten ragen,
3. antippbare Flächen unter 24 × 24 px (WCAG 2.2, 2.5.8).

28 Messungen je Lauf.

**Warum es sie gibt.** Der Betreiber musste am 15.11.2026 dreimal
hintereinander selbst darauf hinweisen, dass am Telefon etwas
abgeschnitten oder zu schmal war. Jedes Mal war es im Quelltext nicht
zu sehen und erst im Browser messbar.

**Gegenprobe** (`--gegenprobe`) baut zwei Fehler ein, ein zu breites
Element und einen 12 × 12 px großen Knopf, und verlangt **beide**
namentlich im Ergebnis. Sie besteht also nicht schon dann, wenn
irgendetwas gefunden wurde.

**Zwei Fallen, über die die Prüfung beim Bau selbst gestolpert ist:**

- `style.css` setzt `html, body { overflow-x: hidden }`. Über
  `scrollWidth` gemessen wäre waagerechtes Scrollen deshalb **immer
  null**, auch wenn Inhalt abgeschnitten wird. Gemessen wird daher der
  rechte Rand der Elemente, nicht der Scrollbalken.
- `style.css` setzt `* { max-width: 100% }`. Der eingebaute
  Gegenprobe-Kasten mit `width: 3000px` wurde davon stillschweigend
  zurechtgestutzt, die Gegenprobe lief durch, ohne etwas zu finden.
  Sie benutzt jetzt `min-width`.

## `pruefe-konfigurator-frei.sh`

**Was es prüft.** Dass die freie Planung (`werkstatt/frei.html`,
`js/konfigurator-frei.js`) von den beiden öffentlichen Konfiguratoren
getrennt bleibt: wer welche Skriptdatei lädt, dass die freie Seite
noindex und das sichtbare Band trägt, dass das Merkmal
`BV_KONFIGURATOR_FREI` nur in der Kopie steht, und dass außerhalb von
`werkstatt/` nichts auf die freie Fassung zeigt.

**Dazu die Abdrift.** Im Kopf der Kopie steht der Commit, von dem
abgespalten wurde. Ändert jemand `js/konfigurator-3d.js`, schlägt die
Prüfung an. Das ist Absicht: Dann ist zu entscheiden, ob die Änderung
auch in die freie Fassung gehört. Danach wird die Zeile
„ABGESPALTEN VON" auf den neuen Stand gesetzt.

**Gegenprobe:** 4 eingebaute Fehler, jeder einzeln auf einer
Wegwerfkopie. Alle 4 werden erkannt.

**Warum die Reihenfolge des Bandes mitgeprüft wird.** Am 17.11.2026 lag
das Band im Kopf der Seite, weil ein `<body>` in einem Kommentar früher
stand als das echte. Die reine Textsuche war grün, der Browser zeigte
nichts. Seitdem prüft das Skript, dass das Band nach `</head>` steht,
und sucht nach `role="note"` statt nach seinem Text: Derselbe Satz steht
auch im `<title>`.

## `pruefe-freie-planung.mjs`

**Was es prüft.** Im Browser, auf `/werkstatt/frei.html`: Doppelklick
nimmt einen Pfosten weg und holt ihn zurück, das Band zählt mit, ein
zusätzliches Dach entsteht neben der Anlage, Ziehen bewegt es, Drehen
setzt 90 Grad, Entfernen nimmt es weg. Dazu, dass die beiden
öffentlichen Konfiguratorseiten nichts davon haben und weiter zeichnen.

**Warum im Browser und nicht am Quelltext.** Ob ein Doppelklick wirklich
einen Pfosten trifft und ob ein Zug das Dach bewegt statt die Kamera zu
drehen, steht in keiner Datei. Der erste Nachweis am 17.11.2026 verglich
zwei Bildschirmfotos. Das zeigte nur, dass sich **irgendetwas** geändert
hatte, und hätte eine gedrehte Kamera für ein verschobenes Dach
gehalten.

Gemessen wird deshalb über `window.BV_FREI`, ein Lesefenster, das es nur
in `js/konfigurator-frei.js` gibt. Es liefert die Koordinaten und den
Winkel jedes Moduls und die Liste der weggenommenen Pfosten.

Seit dem 17.11.2026 zusätzlich: Breite und Tiefe gehen über die
Tabellengrenzen hinaus, 12000 × 9000 mm werden übernommen, und auf den
beiden öffentlichen Seiten bleiben die Regler bei den Werten der
Tabelle (Breite bis 14080, Tiefe bis 7050).

Seit dem 17.11.2026 wird außerdem ein **echtes PDF heruntergeladen** und
in seinen Bytes nach dem Vermerk gesucht, dazu der Dateiname geprüft.
Zum Gegenbeweis passiert dasselbe auf beiden öffentlichen Seiten: Dort
darf der Vermerk **nicht** auftauchen. Ein Vermerk, den niemand ins
Dokument bekommt, wäre keiner.

Seit dem 17.11.2026 außerdem: Die Stückliste ist auch ohne Schnittstelle
gefüllt, zieht entfernte Pfosten ab, zählt zusätzliche Dächer mit und
benennt Maße über der Tabelle. Zum Gegenbeweis bleibt der Kasten auf den
beiden öffentlichen Seiten leer.

**Gegenprobe.** Die Aussagekraft der Messung statt eingebauter Fehler:
Dieselben Messungen laufen gegen `/werkstatt/index.html` und
`/konfigurator.html`, wo es die Freiheit nicht gibt, und melden dort
richtig „kein Lesefenster und kein Knopf".

### pruefe-freie-planung.mjs: 75 Messungen (Stand 18.11.2026)

Dazugekommen am 18.11.2026: Blick auf die ganze Anlage (Kameraabstand,
Blickpunkt, acht projizierte Kastenecken je Ansicht) und Bemassung je
Dach (eigene Gruppe je Dach, Lage, Marken über die ganze Szene
gezählt, Haken „Maße" schaltet die Kopien mit).

Dazu am selben Tag die Kamera: Zoomspanne, vierzig Raddrehungen
heraus und achtzig herein, Winkel unter den Boden und fast senkrecht
von oben, Kamerafahrt mit der rechten Maustaste als echtes Ereignis,
kein Zurueckschnappen nach einem Reglerzug, Ansichtsknopf als Weg
zurueck.

### pruefe-hoehe.mjs (neu am 18.11.2026)

Prüft `/api/hoehe` im Worker, das Höhenfeld und die Adressgenauigkeit
auf `/windzonen.html`. 31 Messungen. Der fremde Höhendienst wird durch einen eigenen Ersatz
ausgetauscht, der eine gute Antwort, einen Fehler, eine leere Antwort,
einen Abbruch und zwei unsinnige Höhen (9000 m, minus 500 m) liefert.
Geprüft wird unter anderem: dass Koordinaten außerhalb Deutschlands
abgewiesen werden, ohne jemanden zu fragen; dass nur die gerundete
Koordinate den Server verlässt; dass der zweite Abruf aus dem
Zwischenspeicher kommt; dass eine von Hand eingetragene Höhe nie
überschrieben wird; und der gemessene Kontrast des Hinweistextes
(7,75:1).

Seit dem 18.11.2026 zusätzlich: zwei gleich benannte Straßen in zwei
Orten derselben Postleitzahl. Geprüft wird, dass der eingetippte Ort
gewinnt, dass ein angeklickter Vorschlag Straße und Hausnummer behält
und ohne zweite Suche seine eigenen Koordinaten benutzt, und dass die
Höhe für das Haus geholt wird und nicht für die Ortsmitte.

### 19.11.2026

`pruefe-freie-planung.mjs` jetzt 80 Messungen: dazugekommen sind die
vier Ansichten mit und ohne Bildkorrektur fuer die Masslinien und die
Probe, dass die Kamera danach wieder steht wie vorher.
`pruefe-konfigurator-frei.sh` jetzt 15: dazugekommen sind zwei
Messungen, dass die Bildkorrektur auch in der oeffentlichen Fassung
steckt und dass beide Rumpfe Zeile fuer Zeile gleich sind.

### 19.11.2026: Überdeckung von Bedienelementen

`pruefe-mitwachsend.mjs` misst als viertes, ob ein schwebendes
Bedienelement ein anderes zudeckt. Schwelle 24 × 24 px (WCAG 2.2,
2.5.8); kleinere Überdeckungen erscheinen als Hinweis und machen die
Prüfung nicht rot. Die Gegenprobe setzt einen schwebenden Knopf über
einen vorhandenen.

`pruefe-broschuere.mjs` prüft statt der ausgebauten Sprachumschaltung
jetzt, dass von ihr nichts zurückkommt; die Gegenprobe stellt sie
absichtlich wieder her.

### pruefe-einzugsgebiet.mjs (neu am 19.11.2026)

Sechs Messungen auf `/einzugsgebiet.html`, drei davon mit
abgeschaltetem JavaScript: ganze Liste vorhanden, Ortsnamen vorhanden,
Randzonen-Hinweise vorhanden; mit JavaScript keine Verdopplung, ein
Klick markiert den richtigen Ort, und die Daten stehen nur einmal in
der Seite. Gegenprobe mit vier eingebauten Fehlern, darunter der alte
Zustand mit leerer Liste.

### pruefe-referenz-galerie.mjs (hieß bis 19.11.2026 pruefe-galerie.mjs)

**Umbenannt, nicht neu.** Die Datei prüft seit dem 13.11.2026 die
Referenz-Galerie der Startseite gegen das Feld `lightboxImages` in
`js/main.js`. Am 19.11.2026 entstand eine zweite, völlig andere Prüfung
für die neuen Produkt-Galerien und bekam versehentlich denselben
Dateinamen; der alte Inhalt ging dabei verloren. Gefunden hat das der
`cto`-Prüfer am selben Tag, zurückgeholt wurde er aus Commit `ff5c7ba`.
Seitdem: `pruefe-referenz-galerie.mjs` = Startseite,
`pruefe-galerie.mjs` = Produkt- und Städteseiten. 11 Messungen,
Gegenprobe: ein entfernter Eintrag in `lightboxImages`.

### pruefe-galerie.mjs (neu am 19.11.2026)

64 Messungen auf den sieben Produktseiten mit Galerie und drei
Städteseiten. Darunter: alle
Bilder im HTML (auch ohne JavaScript), Alternativtext und feste Maße,
nur das erste Bild ohne `lazy`, nichts über dem rechten Rand, Dialog
mit role und aria-modal, Fokus hin und zurück, Escape, Pfeiltasten,
Wischen, Knöpfe 44 × 44 px, Klick zwischen den Pfeilen schließt nicht,
schwebende Knöpfe verschwinden, `inert` auf dem Hintergrund,
Fokusring-Kontrast, und die Großansicht bei 320 × 256 px sowie im
Querformat. Dazu Zähler und Pfeile: Startwert, ein Klick schiebt genau
eine Kachel, am rechten Anschlag steht die letzte Nummer, und **kein
Pfeil ist hart `disabled`** (sonst verliert er am Anschlag den
Tastaturfokus, WCAG 2.2, 2.4.3). Gegenprobe mit vier eingebauten
Fehlern.

### pruefe-referenz-lauf.mjs (neu am 20.11.2026)

**Entstanden aus zwei Meldungen des Betreibers vom Telefon:** „das
wischen klappt nicht und man sieht ein stück vom nächsten bild rechts
am rand". Beides bestätigt.

Die Ursache des ersten Fehlers ist lehrreich: Am Lauf stand
`touch-action: pan-y`, mit dem Kommentar, das lasse waagerechtes
Wischen zu. **Das Gegenteil ist richtig.** `pan-y` erlaubt dem Browser
nur senkrechtes Schieben, waagerechte Wischer werden verworfen.
Gemessen: `scrollLeft` blieb 0. Ohne die Zeile gilt `auto`, und es
geht.

**Warum kein bestehender Test das gefunden hat:** Der Fehler tritt nur
mit einer ECHTEN Fingergeste auf. Nachgebaute `TouchEvent`s aus der
Seite heraus lösen kein natives Scrollen aus. Dieses Skript schickt
deshalb `Input.dispatchTouchEvent` über das Entwicklerprotokoll.

**Falle beim Ändern:** Vor der Geste muss das sanfte Scrollen aus sein
(`reducedMotion`) und die Lage frisch gelesen werden. Sonst wandert
der Lauf unter dem Finger weg, und die Prüfung meldet einen Fehler,
den es nicht gibt. Genau das ist beim ersten Versuch passiert.

Nachgesehen wurde auch, ob dieselbe Falle anderswo steckt: Alle
übrigen `touch-action`-Regeln sind `manipulation` (Schaltflächen) oder
`none` (3D-Flächen des Konfigurators, der seine Gesten selbst führt).
Der Streifen der Produktgalerien steht auf `auto` und ließ sich mit
echter Geste schieben (0 auf 334).

### pruefe-bilder-blaettern.mjs (neu am 20.11.2026)

Sieben der zehn Leistungskarten auf der Startseite zeigen die Bilder
ihrer Produktgruppe. Geblättert wird von Hand: am Rechner mit zwei
Pfeilen, die beim Drüberfahren auftauchen, am Telefon durch Wischen.

**Hier stand erst eine Diaschau mit Takt und Anhalten-Knopf.** Sie ist
am selben Tag gebaut und auf Ansage wieder herausgenommen worden.
Deshalb prüft dieses Skript ausdrücklich mit, dass sich **nichts von
allein bewegt** und **kein Anhalten-Knopf** zurückkommt. Weil nichts
läuft, ist WCAG 2.2, 2.2.2 (Pausieren, Stoppen, Ausblenden) kein Thema
mehr: Es gibt nichts zu pausieren.

**Die Punkte sind Anzeige, keine Bedienelemente.** Ein 7 px großer
Punkt wäre eine Tippfläche weit unter den 24 x 24 px aus WCAG 2.2,
2.5.8. Geblättert wird mit Pfeilen und Wischen, beide groß genug; die
Punkte tragen `aria-hidden`, und für Hilfsmittel steht daneben ein
unsichtbarer Satz in einer höflichen Live-Region, der sich nur beim
Blättern ändert (WCAG 2.2, 4.1.3).

**Warum der aktive Punkt auch größer ist, nicht nur golden:**
Markengold und ein helles Grau liegen in der Helligkeit dicht
beieinander. Nach WCAG 1.4.1 darf Farbe nicht das einzige Mittel sein,
deshalb die zweite Unterscheidung über die Größe. Die Kontraste gegen
das Polster sind gerechnet und stehen im CSS: 3,71:1 für das Gold der
Startseite, 4,59:1 für den grauen Punkt.

**Was stattdessen geprüft wird und leicht übersehen wird:** Am Telefon
darf es die Pfeile gar nicht geben. Ein Knopf, der dort nie sichtbar
wird, aber im Tab-Weg steht, wäre genau der Fall aus WCAG 2.2, 2.4.11,
der am selben Tag an zwei anderen Stellen beseitigt wurde. Das Skript
erzeugt die Pfeile deshalb nur bei `(hover: hover) and (pointer: fine)`,
und die Prüfung zählt sie am Telefon auf null.

### pruefe-modellbilder.mjs (neu am 20.11.2026)

Die Bilder in den Produktkarten, nicht die Ausführungsbeispiele:
34 Stück auf 16 Seiten. Sie waren tote Bilder, Antippen tat nichts.
Seit dem 20.11.2026 öffnen sie dieselbe Großansicht und lassen sich
durchwischen.

Geprüft wird auf `pergola.html` (vier Modelle) und `gartenhaus.html`
(eines). Der Sonderfall mit einem Modell ist Absicht: Dort darf es
keine Pfeile geben und keinen Zähler.

**Nicht geprüft und nicht gebaut:** mehrere Bilder je Modell. Die 59
Portfoliobilder sind nach Produktgruppe sortiert, nicht nach Modell.

### pruefe-fokus-verdeckung.mjs (neu am 20.11.2026)

Punkt 3.10 aus `docs/NEXT_TASK.md`, offen seit dem 13.11.2026 mit dem
Vermerk „nur im Browser prüfbar, rechnerisch nicht". Das stimmt: Der
Fall entsteht erst beim Scrollen.

**Gemessen beim ersten Lauf: 22 von 28 Fällen**, 455 Treffer durch den
Cookie-Hinweis, 41 durch die feste Leiste unten. Nach drei Korrekturen
(siehe `docs/entscheidungen.md`, 20.11.2026) **0 von 28**.

Zwei Messfehler mussten vorher raus, beide beim ersten Lauf:
`html{scroll-behavior:smooth}` ließ jede Messung das Element noch auf
dem Weg treffen, Werte wie „top 1810" und „top -2938" waren reine
Artefakte. Gemessen wird deshalb mit `prefers-reduced-motion`, wodurch
die eigene Regel der Seite auf `scroll-behavior:auto` schaltet, und erst
nach zwei Bildern. Zweitens zählt nur Überdeckung durch `position:fixed`
oder `sticky`: Normal fließender Inhalt kann ein fokussiertes Element
nicht verdecken, ohne dass die Seite ohnehin kaputt wäre.

**Nicht geprüft:** 2.4.12 (AAA, kein Teil darf verdeckt sein).

### pruefe-schema-bilder.mjs (neu am 19.11.2026)

Entstanden aus einem eigenen Fehler. Beim Ergänzen von `"image"` im
Product-Schema fehlte der Ordnerpfad: Im Schema stand
`.../carport-01.webp` statt `.../images/portfolio/carport/carport-01.webp`.
**Alle 21 URLs waren falsch.** Die Gegenprobe, die ich dazu von Hand
geschrieben hatte, suchte nur URLs, die `images/` enthielten, konnte den
Fehler also gar nicht finden und meldete trotzdem „0 fehlende Dateien".
Aufgefallen ist es erst beim Abruf der Vorschau. Lehre: Eine Prüfung, die
nur den erwarteten Fall sucht, bestätigt die eigene Arbeit. 5 Messungen
über 18 Produktseiten, Gegenprobe mit drei eingebauten Fehlern, jeder auf
einer anderen Seite **mit** Galerie. Der erste Versuch der Gegenprobe
schlug nur einmal an, weil zwei Fehler auf Seiten ohne Galerie landeten.

### baue-staedte-galerie.mjs (neu am 19.11.2026)

Kein Prüfskript, sondern ein Generator: Er setzt den Bilderstreifen in
die 14 handgepflegten Städteseiten, aus derselben Quelle wie die
Produktseiten. Wiederholbar, ein vorhandener Block wird ersetzt. Mit
`--entfernen` baut er die Änderung wieder zurück: Block heraus,
Skript-Zeile heraus, sonst nichts. Das ist der Rückweg für die 14
handgepflegten Seiten, für die ein `git checkout` zu grob wäre.
Nachgeprüft wird er von `pruefe-staedte-galerie.mjs` (alle 14 Seiten,
Zeichen für Zeichen) und von `pruefe-galerie.mjs` (drei Seiten im
echten Browser).

## `pruefe-prozess-ringe.mjs`: bekannter Wettlauf, 24.11.2026

Das Skript misst alle 120 ms `strokeDashoffset` der vier Ablaufringe
und verlangt bei „Bewegung reduzieren" null Wechsel.
`js/prozess-animation.js` setzt die Ringe bei dieser Einstellung
sofort auf voll. Fällt die erste Messung **vor** das Seitenskript,
sieht sie den Ausgangswert und danach die 0 und meldet fälschlich
„4 von 4 Ringen blinken".

Gemessen am 24.11.2026, fünf Läufe desselben Codes: grün, grün, grün,
rot, grün. Ein rotes Ergebnis dieses Skripts ist deshalb **erst nach
Wiederholung** ein Befund. Dasselbe gilt für `pruefe-keil-editor`,
`pruefe-planken-editor`, `pruefe-freie-planung`, `pruefe-galerie` und
`pruefe-referenz-lauf`, die unter Last rot werden und allein grün
sind.

Behebung vorgeschlagen, nicht umgesetzt: die ersten 500 ms der
Mitschrift verwerfen, oder das Seitenskript eine Marke am
Wurzelelement setzen lassen, auf die das Prüfskript wartet.


## Korrektur am 24.11.2026: `pruefe-planken-editor.mjs` ist kein Wackelkandidat

Er stand hier als Skript, das unter Last rot wird und allein grün
ist. Am 24.11.2026 war er **allein rot**, zweimal, mit identischer
Meldung, und auch auf dem Stand vor den Änderungen dieses Tages.

Ein rotes Ergebnis dieses Skripts ist damit **ein Befund und keine
Störung**. Die Meldung lautet: „Die Ruecktaste leert das Hoehenfeld
wirklich (im Feld steht 900)" und „Zu klein wird erst beim Verlassen
berichtigt".

Wer den Eintrag wieder auf „wackelt" zurücksetzen will, braucht dafür
mehrere grüne Einzelläufe als Beleg, nicht einen.
