# NEXT_TASK – Einstieg für jede neue Sitzung

> Das Erste, was ein neuer Chat liest. Danach: `CLAUDE.md` und `PROJEKTSTAND.md`.
> Stand: 25.10.2026 (abends) · zuletzt bearbeitet: Teilen-Knopf mit Kurzlink,
> alle RAL-Töne mit Suche, Gefälle-Dreieck, PDF-Kacheln, **Sonderform entfernt**
>
> **Erster Schritt in der neuen Sitzung:** Branch auf den aktuellen Stand setzen
> (`git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main`),
> dann Abschnitt 1 lesen. Nichts ist halbfertig liegen geblieben – alle
> Änderungen sind veröffentlicht.
>
> **Kurz halten.** Wird diese Datei länger als etwa 400 Zeilen, wandern die
> ältesten erledigten Einträge nach `docs/erledigt-archiv.md`.

---

## 1. Was als Nächstes ansteht

### Zuerst: zwei Dinge liegen beim Betreiber, nicht am Rechner

1. **Kurzlink: vom Betreiber zurückgestellt (25.10.2026, abends).** Der
   Teilen-Dialog zeigt den langen Link – der funktioniert. Warum der kurze
   nicht kommt und was die Alternativen kosten: Abschnitt 2. **Nicht
   weiterbauen, ohne zu fragen.**
2. **Gibt es eine maximale Höhe hinten?** Frage an VD, siehe unten. Solange
   sie offen ist, wird nichts gekappt.
3. **Farbtöne: nichts tun.** Am 27.10.2026 entschieden („so lassen").
   RAL Classic ist vollständig und mit den amtlichen Werten hinterlegt;
   Farbwerte von Beschichter-Seiten (TIGER Coatings) wurden verworfen —
   fremde Produktdatenbank, und für VD nicht genauer. Begründung und der
   saubere Weg für mehr Auswahl (RAL Design, aus der Nummer berechnet):
   `docs/entscheidungen.md`, 27.10.2026. **Nicht ungefragt nachholen.**
4. **Balkonüberdachung: Maßgrenzen bei VD erfragen.** Seit dem 25.10.2026
   im Konfigurator (Details: `docs/balkonueberdachung.md`). Breite, Tiefe
   und Höhe sind dort an gängigen Balkongrößen ausgerichtet, **nicht** an
   einer Herstellerangabe — VD nennt auf der Produktseite keine. Ebenso
   offen: freitragende Ausführung, eigene Brüstungsbefestigung.
5. **Teilen-Dialog auf schmalen Handys.** Auf dem Bildschirmfoto des
   Betreibers (25.10.2026) sind „PDF / WhatsApp / E-Mail" unten
   abgeschnitten. Noch nicht repariert.

Sonst ist nichts halbfertig: Alles ist gemergt, veröffentlicht und am
Livesystem nachgeprüft (Stand `v=20261025i`).

### Aufgabe A — Konfigurator-Produkte *(erledigt bis auf Zubehör)*

Der Konfigurator kann **Terrassendach TDS, Flachdach SkyView, Carport**
(TDS, Flat Line, Flat Box) und **Pergola / Lamellendach** (Lamellendach mit
drehbaren Lamellen, Faltdach, Velaris).

Seit dem Umbau auf das Vollbild-Layout (10.10.2026) dazu: **Sonnenschutz**
(Aufdach, Unterdach, Senkrechtmarkisen mit Ausfahr-Regler), **Seitenelemente
als einzelne Schiebeflügel** mit Öffnen-Regler, **Carport-Verkleidung** aus
Sichtschutzpaneelen, **Terrassenboden**, **zuschaltbare Maßlinien**,
Vollbild, Ansicht „Darunter“, Zahlenfeld neben jedem Regler.

Bewusst **nicht** gebaut (Begründung in `docs/entscheidungen.md`, 10.10.2026):
Richtpreis, Markisenstoff-Kollektionen, Plissee, Zaunpaneele, Holzdekore –
für die Stoff- und Dekornamen fehlt uns die Grundlage. Wenn der Betreiber sie
liefert, ist der Rahmen dafür da.

**Wenn ein Produkt dazukommt:** Zweig in `bauen()`, Eintrag in `MASSE` und im
Auswahlfeld `k3dProdukt`, Bedienfelder mit `data-k3d-fuer` kennzeichnen und
das Stichwort in `gruppeGilt()` auswerten. Übergabewerte **wörtlich** aus
`js/anfrage-wizard.js` übernehmen und in `vorgabeUebernehmen()` in die
`felder`-Liste eintragen – sonst kommt der Wert dort nie an.
`scripts/pruefe-konfigurator.js` prüft die Werte, nicht die Liste.

### Seiten — vier statt drei *(gebaut 23.10.2026)*

Bei Aufbau **„Freistehend"** gibt es im Schritt „Seiten" eine vierte Reihe
*Hinten (Rückseite)* mit denselben Möglichkeiten wie vorne (kein Keil — die
hintere Dachkante läuft waagerecht). Bei **Wandmontage** erscheint sie nicht,
und eine vorher getroffene Wahl wird beim Umschalten gelöscht. Warum das die
heikle Stelle ist, steht in `docs/entscheidungen.md`, Eintrag 23.10.2026.

### Offen am Bodengefälle *(seit 24.10.2026)*

- **Seitenelemente schräg zuschneiden.** Heute bleibt die Unterkante innerhalb
  eines Feldes waagerecht (Höhe = Boden in der Feldmitte); bei 2° und 2,3 m
  Feld sind das rund 4 cm an den Enden. Für einen sauberen Anschluss müssten
  Rahmen-, Planken- und Schiebeelemente unten schräg geschnitten werden.
- **Nur im Terrassen-Bauweg gerechnet** (TDS, SkyView, Carport TDS). Beim
  Flachdach-Carport und bei der Pergola wird das Gefälle nicht abgefragt.
- **Beantwortet (24.10.2026):** „die durchgangshöhe ist halt immer die tiefere
  seite aber erst mal soll das so bliben". Gebaut bleibt „vorne". Ein Hinweis
  „niedrigste Durchgangshöhe: X mm an der Y-Seite" wäre die kleine Lösung —
  **nicht ohne Auftrag bauen**.

### Öffentlicher Konfigurator ist gesperrt *(seit 31.10.2026)*

`/konfigurator` zeigt eine Hinweisseite („wird gerade überarbeitet") mit Knopf
zur Anfrage und Rufnummer. Menüeintrag und Startseiten-Teaser sind
ausgeblendet. Gearbeitet wird in der Werkstatt.

**Zum Zurückschalten, wenn der Betreiber freigibt:**

1. `worker/index.js`: `KONFIGURATOR_GESPERRT = false`
2. Alle Kommentare mit dem Marker `KONFIGURATOR-SPERRE 31.10.2026` auflösen:
   `grep -rl "KONFIGURATOR-SPERRE" --include=*.html --include=*.njk .`
   (betrifft `src/_includes/layout.njk`, `index.html` samt Teaser und sieben
   handgepflegte Seiten)
3. `npm run build`, dann `node scripts/baue-werkstatt.js`
4. `node scripts/pruefe-konfigurator-sperre.js` **muss jetzt rot sein** — das
   ist der Nachweis, dass die Sperre wirklich weg ist

### ⚠️ Zuerst: Passwort für die Werkstatt hinterlegen *(31.10.2026)*

Die Erprobungsseite `/werkstatt/` ist gebaut, aber **für alle gesperrt**,
solange kein Passwort hinterlegt ist — auch für den Betreiber. Das ist
Absicht: Ein Schutz, der ohne Einstellung aufmacht, ist keiner.

**Die Schritte in Cloudflare (einmalig, etwa fünf Klicks):**

1. [dash.cloudflare.com](https://dash.cloudflare.com) öffnen und anmelden
2. Links **Workers & Pages** → den Eintrag **bvlanding** anklicken
3. Oben **Settings** → Abschnitt **Variables and Secrets**
4. **+ Add** → Typ auf **Secret** stellen
   *(wichtig: Secret, nicht Text — ein Secret ist danach nicht mehr lesbar)*
5. Name: `WERKSTATT_PASSWORT` · Wert: das gewünschte Passwort
6. **Deploy** klicken

Danach `https://bv-aussensysteme.de/werkstatt/` aufrufen, Passwort eingeben.
Die Anmeldung hält 30 Tage pro Gerät. Wird das Passwort später geändert, sind
alle alten Anmeldungen sofort ungültig.

Das Passwort steht **nirgends im Projekt** und ist für niemanden außer dem
Betreiber sichtbar — auch nicht für den Assistenten.

### Werkstatt: Aussparung (Hausvorsprung) — Machbarkeitsnachweis *(31.10.2026)*

Zweiter Anlauf nach der am 25.10.2026 entfernten Sonderform, diesmal
**rechtwinklig**: Rechteck mit rechteckiger Lücke an der Wandseite. Auf der
öffentlichen Konfiguratorseite ist die Aussparung **durch nichts
einschaltbar** — sie hängt am Pfad `/werkstatt/`.

Formen über die Adresse:

```
/werkstatt/?form=rechts&ab=2000&at=1000
/werkstatt/?form=links&ab=2000&at=1000
/werkstatt/?form=mittig&ab=2000&at=1000&aa=1200
```
`ab` = Breite der Aussparung, `at` = Tiefe, `aa` = Abstand von links, in mm.

**Der Betreiber sieht es sich an und entscheidet, ob weitergebaut wird.**
Gegenzulesen: Folgen Sparren, Scheiben und Wandprofil der Lücke — und bleiben
Rinne und Pfosten vorne unverändert?

Fehlt noch (bewusst): Bedienfeld, Grundriss-Skizze, Wandfelder an den Flanken
der Aussparung, Randblende an der Stufe, Maßtabelle, Anfrage, interne Notiz.
Begründungen: `docs/entscheidungen.md`, 31.10.2026.

**Nach jeder Änderung an `konfigurator.html`:**
`node scripts/baue-werkstatt.js` — sonst hängt die Werkstatt zurück.

### Offen: Gibt es eine maximale Höhe hinten? *(seit 25.10.2026)*

Bei 7050 mm Tiefe und 8° Dachneigung ergibt sich eine **Höhe hinten von
3290 mm**. Der Höhenregler (vorne) endet bei 2700 mm, für die Höhe hinten gibt
es keine Grenze — die Pfosten hinten werden entsprechend lang. Gibt es eine
maximale Pfostenlänge oder Höhe hinten im System? Solange das niemand
beziffert hat, wird **nicht** gekappt; eine erfundene Grenze wäre schlimmer
als keine.

### Offene Rückfragen an VD (aus dem Konfigurator)

| Frage | Warum sie zählt |
|---|---|
| **Lichtdurchlässigkeit der Sechsfachstegplatte Graphit** | Für klar (76 %), opal (48 %) und bronze (35 %) gibt es Händlerangaben, für Graphit nichts. Im Modell ist die Deckkraft geschätzt |
| ~~Rippenabstand des Trapezblechs T35M-0,75~~ | **Erledigt 16.10.2026.** Teilung 210 mm, abgeleitet aus der belegten Nutzbreite 1050 mm (1050 / 5); gestützt durch das Nachbarprofil T35/207 mit 1035 mm = 5 × 207 |
| ~~Liefert der Hersteller das Trapezblech in der RAL-Farbe des Gestells?~~ | **Erledigt 16.10.2026.** Nein – der Betreiber hat den Artikel genannt: „T35M-0,75-**RAL7016**". Das Blech läuft jetzt in Anthrazit, unabhängig von der Gestellfarbe |
| **Darf das Trapezblech T35M waagerecht verlegt werden?** | Das Produktdatenblatt des Herstellers nennt **min. 3° Dachneigung (5,24 cm/m)**; das Flat Line wird ohne Gefälle gebaut. Daran hängen Dichtigkeit, stehendes Wasser und im Streitfall die Gewährleistung – bitte schriftlich bestätigen lassen |
| **Querschnitt der Blenden 16555 / 16556 und Rinnen 16553 / 16554** | Die Einzelteileliste führt sie als Meterware ohne Maß. Im Modell tragen alle vier das SkyView-Maß – ein Platzhalter |
| **Gibt es die Seitenblende 16555 wirklich nicht in Reinweiß 9010?** | Die Teileliste nennt für 16556 die Farben 7016/9006/9007/9010, für 16555 nur 7016/9006/9007. Falls das stimmt, gehört es in die Farbauswahl |
| **Aufteilung des Trapezblech-Querschnitts (Untergurt / Steg / Obergurt)** | Im Modell geschätzte 115 / 25 / 45 / 25 mm. Sie treffen die belegten 210 mm Teilung und 35 mm Höhe genau, sind aber nicht belegt – eine Querschnittzeichnung erledigt es |
| **Werden die Aluminium-Sichtschutzpaneele (140 mm) als Carport-Verkleidung angeboten?** | Die 140 mm stammen von unserer eigenen Produktseite, die Anwendung am Carport ist eine Annahme |

### Aufgabe A2 — Konfigurator auf die echten Herstellerdaten *(gebaut, wartet auf einen Handgriff)*

Fertig und geprüft. **Es fehlt nur noch, die Matrix in den KV-Speicher zu
legen** – das geht nur mit Cloudflare-Zugang.

> **Das kostet gerade etwas (gefunden 12.10.2026).** Solange `/api/bauteile`
> mit 503 antwortet, liefert `stueckliste()` `null`. Daran hängen in der
> Anfrage-Zusammenfassung: Sparrenzahl, Pfostenzahl, Statikträger,
> Dachneigung und Höhe an der Wand (UK Wandprofil). Diese Angaben stehen
> damit **in keiner Anfrage** – auch nicht die Neigung, die der Kunde
> ausdrücklich eingestellt hat. Das 3D-Modell ist nicht betroffen, es rechnet
> seit dem 11.10.2026 über `js/masstabelle.js`.
> **Erledigt am 12.10.2026:** Der Betreiber hat Weg 2 gewählt. Die Anfrage
> rechnet jetzt über `bauteileJetzt()` aus `js/masstabelle.js`. Offen bleibt
> nur: Sobald DACHMATRIX gebunden ist, gehört `stueckliste()` in
> `bauteileJetzt()` vorgeschaltet – der Platz ist im Kommentar der Funktion
> benannt. Der Zusammenfassungskasten `k3dZus` bleibt bis dahin leer, so
> gewollt.

#### Die drei Befehle

```bash
npx wrangler kv namespace create DACHMATRIX
# die ausgegebene id in wrangler.jsonc eintragen (Vorlage steht dort als Kommentar)

mkdir -p daten && cp /pfad/zu/bv-crm/docs/konfigurator-daten/* daten/
node scripts/baue-dachmatrix.js        # erzeugt js/dachmatrix-daten.json

npx wrangler kv key put --binding DACHMATRIX matrix \
  --path js/dachmatrix-daten.json --remote
```

Vorher passiert nichts Schlimmes: `/api/bauteile` antwortet mit 503 und der
Konfigurator zeigt dieselbe geschätzte Skizze wie bisher.

#### Wie es gebaut ist

| Teil | Rolle |
|---|---|
| `js/bauteile.js` | die Regeln. **Enthält keine Herstellerdaten**, bekommt die Matrix über `matrixSetzen()`. Läuft im Browser, unter Node und im Worker |
| `worker/index.js` → `/api/bauteile` | nimmt ein Maß, gibt eine Stückliste. Holt die Matrix aus KV, nie an den Browser |
| `js/konfigurator-3d.js` | freie Schieberegler (gebaut wird nach Kundenmaß), fragt den Endpunkt gebremst, zeichnet das Kundenmaß und zeigt das Rasterfeld als Abrechnungsgrundlage daneben. Ohne Antwort: geschätzte Skizze, Seite bleibt benutzbar |
| `daten/` | die Quelle – **nicht im Repository**, siehe `.gitignore` |

#### Was offen bleibt

- **Beim Hersteller:** `daten/rueckfragen-an-vd.md` (liegt lokal, nicht im
  Repo) listet neun Punkte. Die zwei wirksamsten: Systemschnitte oder
  DXF-Dateien der Profile, und die Seiten 10, 25 und 32 der
  VD-Montageanleitung abfotografieren.
- **Carport TDS und Flat Box** haben keine Matrix – sie bleiben die
  geschätzte Skizze, bis es eine Preisliste dafür gibt.
- **Profilquerschnitte** sind bis auf Pfosten und Statikträger geschätzt
  (`PROFILE_GESCHAETZT` in `js/bauteile.js`). Das Modell ist deshalb in den
  Stückzahlen richtig, in den Proportionen noch nicht.

### Aufgabe B — Baugenehmigungs-Check: weitere Bundesländer prüfen

13 der 16 Länder sind **Übersichtsangaben ohne Prüfung am Gesetzestext**.
Geprüft sind nur Rheinland-Pfalz, Hessen und Nordrhein-Westfalen (Feld
`geprueft`). Als Nächstes sinnvoll: **Bayern** und **Baden-Württemberg**.

| Datei | Wofür |
|---|---|
| `js/baugenehmigung-data.js` | die Daten, ein Block je Bundesland |
| `scripts/pruefe-lbo-daten.js` | prüft Etikett, Farbe und Text auf Widersprüche |
| `src/baugenehmigung.njk` | Anzeige, FAQ-Schema und Quellzeile |

**Wichtig:** Primärquelle verwenden (Landesrecht-Portal oder amtliche
Broschüre), nicht Vergleichsportale. Bei RLP hätte das vier Wochen früher
auffallen können – dort stand jahrelang ein falscher Wert (m² statt m³).

---

## 2. Was beim Betreiber liegt, nicht am Rechner

Diese Punkte kann niemand im Projekt erledigen – sie brauchen einen Zugang,
eine Entscheidung oder eine Rückfrage bei Dritten.

| Was | Warum es wartet |
|---|---|
| **Google-Business-Profil-URL** | Fehlt im `sameAs`-Teil des Schemas. Nur der Betreiber kommt an die Profil-Adresse |
| **Bewertungen sammeln** | Aktuell eine einzige. Kein technisches Problem – es braucht echte Kundenanfragen |
| **3D-Konfigurator am iPhone gegenlesen** | Dreh- und Zoomverhalten lässt sich im Container nur emulieren |
| **Abschnitt „Vertragsabwicklung" in der Datenschutzerklärung** | Von mir formuliert. Die Liste der Empfänger (Steuerbüro, Hersteller, Transport, Kreditinstitute) muss zur tatsächlichen Praxis passen – im Zweifel anwaltlich bestätigen lassen |
| **Rechtstext-PDFs für Kleinanzeigen** | Liegen nicht im Repository (siehe Abschnitt 5). Bei Textänderungen neu erzeugen lassen |
| **Preisgrundlage, falls je Preise gezeigt werden sollen** | Bisherige Linie: keine Preise. Eine Kalkulationsgrundlage kann nur der Betrieb liefern |
| **Kurzlink: Rechte in der Datenbank** (nur falls gewünscht, siehe Abschnitt 2) | Die Datenbank-Rolle darf **gar nichts anlegen** – weder in `public` noch ein eigenes Schema. Live gemessen am 25.10.2026: Fehlernummer `42501`. Vom Betreiber zurückgestellt: „is mir zu kompliziert xd keine ahnung". Der lange Link funktioniert, er ist nur lang |

### Kurzlink: warum er nicht läuft, und was die Wege kosten

**Stand:** Der Teilen-Knopf funktioniert und gibt den **langen** Link heraus
(565 Zeichen, gemessen an der Standard-Planung). Der kurze Link
(`bv-aussensysteme.de/k/A7K3PQ`, 36 Zeichen) braucht eine Tabelle in der
Datenbank. **Die kann der Server nicht selbst anlegen.**

**Woran es liegt – gemessen, nicht vermutet.** `/api/teilen` antwortet
`{"ok":false,"schritt":"tabelle","nr":"42501"}`. `42501` ist in PostgreSQL
„keine Berechtigung". Der Server versucht zuerst `public`, dann ein eigenes
Schema `bv` (anderes Recht, deshalb oft offen) – **beides** wird abgelehnt.
Die Rolle in `ANFRAGEN_DB` darf also nur in bestehende Tabellen schreiben.
Das ist kein Fehler im Code; es fehlt ein Recht in der Datenbank.

**Weg A – ein Klick in der Neon-Konsole.** SQL Editor öffnen, in der
Datenbank, in der auch `anfragen` liegt, diesen Befehl ausführen:

```sql
create table if not exists teilen_links (
  id        text primary key,
  code      text not null,
  code_hash text not null unique,
  erstellt  timestamptz not null default now(),
  zuletzt   timestamptz
);
```

Danach ohne Anmeldung prüfbar – `{"ok":true,"id":"…"}` heißt, er läuft:

```sh
curl -s -X POST https://bv-aussensysteme.de/api/teilen \
  -H 'Content-Type: application/json' -d '{"code":"AAAAAAAAAAAAAAAAAAAAAA"}'
```

Am Code ändert sich dafür nichts: Der Server sucht die Tabelle bei jedem
Start in `public` **und** in `bv` und nimmt, was er findet.

**Weg B – den Link selbst kürzen, ohne Datenbank.** Im Link steht heute alles
ausgeschrieben (`"Produkt":"Terrassendach TDS"`). Gemessen am 25.10.2026 mit
einer Standard-Planung (17 Felder, 392 Zeichen Klartext):

| Form | Länge des ganzen Links |
|---|---|
| heute (JSON, Base64) | 565 |
| nur zusammengepackt (deflate) | ~341 |
| nur Werte, ohne Feldnamen | ~172 |
| Nummern statt Texten + zusammengepackt | **~80–120** |
| Kurzlink über die Datenbank (Weg A) | 36 |

Weg B braucht niemanden außer den Entwickler, kostet aber ein eigenes,
**eingefrorenes** Format: Die Reihenfolge der Felder wird Teil des Links, also
Versionsnummer hochzählen und v1 weiter lesen können, sonst sterben alle
bereits verschickten Links. Dafür wäre eine Prüfung nötig, die zufällige
Planungen hin- und zurückrechnet und auf Gleichheit vergleicht.

**Entschieden am 25.10.2026:** Erst einmal gar nichts – der Betreiber hat beide
Wege gesehen und „erstmal lassen" gewählt. Nicht ohne neue Ansage anfangen.

---

## 2b. Konfigurator ins CRM übernehmen

Der 3D-Konfigurator lässt sich als eigenständiges Paket für die interne
Nutzung erzeugen: `scripts/export-konfigurator.sh`. Die vollständige
Übergabe – Dateiliste, Einbindung, Serverabhängigkeit, was bewusst nicht
mitgeht – steht in `docs/konfigurator-export.md`.

**Offen beim Betreiber:** Im Paket steckt der Anfrage-Assistent, der echte
E-Mails an `info@bv-aussensysteme.de` verschickt. Intern sollte er raus oder
stillgelegt werden; das ist bewusst nicht vorweggenommen (siehe Abschnitt 6
des Export-Dokuments).

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
| `scripts/pruefe-konfigurator-oberflaeche.mjs` | Echter Browser: Layout, Regler, Markisen, Maße, Handy-Scrollen – und liest zurück, was im Assistenten ankommt. Braucht `npm i --no-save playwright`, startet den Webserver selbst |
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
| `scripts/pruefe-api-bauteile.mjs` | Baut den Worker wie Cloudflare, stellt echte Anfragen – und prüft, dass **keine** Antwort die Matrix enthält |
| `scripts/pruefe-live.sh` | Ist der veröffentlichte Stand tatsächlich draußen? (nutzt `curl -sL`) |

**Exit-Code abfragen, nicht die letzte Zeile lesen.** Am 23.10.2026 fiel
auf, dass `pruefe-konfigurator-oberflaeche.mjs` seit PR #281 (11.10.2026)
mit einer Ausnahme abbrach, statt ein Ergebnis zu melden – zwölf Tage
unbemerkt rot. Eine Prüfung, die mit einer Ausnahme endet, ist rot.

Stand 25.10.2026: **alle Skripte laufen durch**, jedes mit vollständig
anschlagender Gegenprobe (`pruefe-konfigurator-oberflaeche.mjs` 90 Prüfungen
und alle drei eingebauten Fehler gefunden, `pruefe-masstabelle.js` 364,
`pruefe-markise.js` 190, `pruefe-fuehrung.js` 309, `pruefe-teilen.mjs` und
`pruefe-kurzlink.mjs`).

Der Browsertest ist damit wieder brauchbar. Er ersetzt **nicht** das
Nachsehen im Browser – das macht der Betreiber selbst („mach keinen browser
test ich teste selber im browse"); er fängt nur ab, dass eine Bedieneinheit
unbemerkt verschwindet.

Die beiden Datenprüfungen überspringen sich selbst, wenn `daten/` fehlt –
das ist der Normalfall in einem frischen Klon.

---

## 4. Arbeitsweise

**Branch:** immer `claude/bv-aussensysteme-setup-bq7ew4`. Nach einem gemergten
PR frisch aufsetzen:
```bash
git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main
```

**Ablauf:** bauen → prüfen → committen → pushen → PR → Build abwarten →
squash-mergen → Live-Stand prüfen (`scripts/pruefe-live.sh`). Der Betreiber
sagt meist „mergen veröffentlichen"; bei neuen öffentlichen Funktionen vorher
auf die Preview schauen lassen.

**Build:** `npm run build` (Eleventy + cleancss). Nach einem Container-Neustart
fehlen die Abhängigkeiten → vorher `npm install`.

**Cache-Buster:** `_headers` erlaubt bis zu 24 h alte CSS/JS aus dem
Browser-Cache. Nach jeder Änderung an `js/*.js` oder `src/css/style.css` die
Version in **allen** HTML-Dateien hochziehen und mit
`scripts/pruefe-cache-buster.sh` nachsehen.

**Eigenständige HTML-Dateien ohne njk-Vorlage** (werden vom Build *nicht*
erzeugt, direkt bearbeiten): `index.html`, `konfigurator.html`, alle
`terrassenueberdachung-*.html`, `carport-*.html`, `pergola-*.html`,
`danke.html`.

---

## 5. Fallen, die schon Zeit gekostet haben

- **`curl` braucht `-L`.** Die Seite leitet `/seite.html` → `/seite` weiter
  (307). Ohne `-L` kommt ein **leerer Body** zurück und jede Prüfung wirkt
  „bestanden". Hat schon zu einer falschen Erfolgsmeldung geführt.
  `scripts/pruefe-live.sh` fängt das ab.
- **CSS wird minifiziert**: in `css/style.css` steht `overscroll-behavior:contain`
  ohne Leerzeichen. Suchmuster entsprechend wählen.
- **iOS Safari ignoriert `window.print()`** – deshalb erzeugt `js/bg-pdf.js`
  die PDF-Datei selbst.
- **`body { overflow: hidden }` sperrt iOS nicht.** Der Body wird fixiert,
  aber nur im Sheet-Layout (`matchMedia('(max-width: 600px)')`).
- **Schwebe-Buttons** liegen rechts über dem Inhalt – rechtsbündige Werte auf
  schmalen Schirmen vermeiden.
- **Chromium im Container erreicht die echte Domain nicht** (Proxy-Zertifikat).
  Funktionstests gegen `http://localhost:8783`, live mit `curl -sL`.

**Testaufbau** (nach einem Container-Neustart weg, neu aufsetzen):
```bash
python3 -m http.server 8783 &                 # im Projektverzeichnis
cd "$SCRATCHPAD" && npm install playwright    # Chromium: /opt/pw-browsers/chromium
```
Für WebGL (3D-Konfigurator) mit
`args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader']` starten.
Absende-Wege mit `page.route()` auf `**/api/kontakt` und
`https://api.web3forms.com/**` abfangen, statt echt zu senden.

**Rechtstext-PDFs für Kleinanzeigen** (Widerrufsbelehrung, AGB,
Datenschutzerklärung): werden aus den echten Seiten per Playwright erzeugt und
**nicht** im Repository gehalten – zwei Fassungen desselben Textes laufen
auseinander. Bei Bedarf neu erzeugen: Inhalt aus `agb.html` (`#widerruf` plus
folgender Block) und `datenschutz.html` holen, in eine schlichte Druckvorlage
mit Briefkopf setzen, als A4-PDF ausgeben.

---

## 6. Dauerhafte Vorgaben des Betreibers

- **Sparsam mit Nutzungsvolumen** (siehe `CLAUDE.md`): keine unnötigen
  Prüfschleifen, Änderungen bündeln, bei größeren Aufgaben erst kurz fragen.
- **Keine Preise** auf der Website – weder Pauschal- noch Richtpreise.
- **VD-Inhalte niemals ungefragt entfernen** (siehe `CLAUDE.md`).
- **Vorschlagen ja, ungefragt umsetzen nein.** Was gebaut wird, entscheidet
  der Betreiber.
- Kommunikation auf Deutsch.

---

## 7. Letzte Arbeitsschritte

Vollständig und mit Begründung in `docs/erledigt-archiv.md`, die
Grundsatzentscheidungen in `docs/entscheidungen.md`.

| Datum | Was | Stand |
|---|---|---|
| 25.10.2026 | **Sonderform entfernt** – Entscheidung des Betreibers; Sonderformen laufen über Telefon und Aufmaß | live |
| 25.10.2026 | Teilen-Knopf: Link öffnet die Planung wieder, mit PDF-, WhatsApp- und E-Mail-Weg | live |
| 25.10.2026 | Kurzlink über den eigenen Worker (`/api/teilen`, `/k/<id>`) | **zurückgestellt – Datenbankrolle darf nichts anlegen (`42501`), siehe Abschnitt 2** |
| 25.10.2026 | Alle RAL-Töne (217) mit Lupensuche nach Farbe oder Nummer | live |
| 25.10.2026 | PDF: Kacheln liefen ineinander; Durchfahrt jetzt mit Statikträger | live |
| 25.10.2026 | Gefälle sichtbar: Steigungsdreieck an der Maßlinie | live |
| 24.10.2026 | Gefälle des Terrassenbodens: Pfostenlängen je Ecke, Wiese kippt mit | live |
| 24.10.2026 | Statikträger auf Wunsch auch beim Carport TDS | live |
| 24.10.2026 | Zwei Stufen im Konfigurator: Basic (Kundenfragen) und Pro (alles) | live |
| 24.10.2026 | Rückseite teilt sich an ihren eigenen Pfosten | live |
| 24.10.2026 | Maßlinien als Körper mit Endmarken, BV-Logo deutlicher | live |
| 23.10.2026 | Seitenelemente auch hinten, wenn die Anlage freistehend ist | live |
| 12.10.2026 | „PDF erstellen": mehrseitige Ausgabe mit Zustandsseiten und neu gestalteter Konfigurationsseite | live |
| 12.10.2026 | Anfrage-Text rechnet über `bauteileJetzt()` statt über die tote Schnittstelle | live |
| 12.10.2026 | Dachneigung: Rechenweg der Montageanleitung belegt, Anzeige in ganzen Grad | live |
| 12.10.2026 | Beide PDF-Erzeuger auf einen Unterbau, Baugenehmigungs-Check erstmals geprüft | live |
| 11.10.2026 | Seitenelemente, Velaris, Plankenwand, Rahmenwand, Profilmaße (siehe Archiv) | live |
| 10.10.2026 | Konfigurator rechnet serverseitig (`/api/bauteile`), Rasterauswahl, Matrix bleibt auf dem Server | **fertig, wartet auf den KV-Namensraum** |
| 10.10.2026 | 3D-Konfigurator: Carport (TDS, Flat Line, Flat Box) und Flachdach SkyView; Übergabewerte an den Assistenten korrigiert | **in Arbeit** |
| 10.10.2026 | Übergabe- und Prüfsystem eingerichtet (diese Datei, Entscheidungen, Archiv, fünf Prüfskripte) | live |
| 10.10.2026 | 3D-Konfigurator Terrassendach TDS | **live** |
| 10.10.2026 | Telefonnummer als Pflichtangabe | live |
| 16.09.2026 | Scrollen im Konfigurator-Fenster auf dem Handy repariert | live |
| 16.09.2026 | Anrede, Nachname, PLZ und Ort als Pflichtangaben | live |
| 09.09.2026 | Baugenehmigungs-Daten korrigiert (RLP rechnet in m³) | live |
| 09.09.2026 | Preis-Klarstellung auf Kostenseite, FAQ-Schema und `llms.txt` | live |
| 09.09.2026 | Datenschutz: tote Verweise repariert, Vertragsabwicklung ergänzt | live |
| 09.09.2026 | PDF-Download im Baugenehmigungs-Check | live |
| 09.09.2026 | Konfigurator-Fenster auch auf der Startseite | live |
