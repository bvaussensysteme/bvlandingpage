# Zusagen auf der Webseite: Entscheidungsvorlage

**Stand 22.11.2026.** Für den Betreiber. Hier wird nichts geändert,
hier wird gesammelt, was die Seite verspricht, und wo sie sich
widerspricht.

**Warum das eine Vorlage und keine Korrektur ist.** Welche Garantie
der Hersteller tatsächlich gibt und bei welchem Produkt wirklich ein
Statiknachweis mitgeliefert wird, steht in keinem Dokument dieses
Repositories. Das weiß der Betreiber oder sein Hersteller. Erfundene
Garantiezeiten wären schlimmer als widersprüchliche.

**So wird die Vorlage benutzt:** In jeder Tabelle die Spalte „gilt"
ausfüllen. Danach gleiche ich sämtliche Fundstellen daran an, in einem
Arbeitsgang, und prüfe mit einem neuen Skript nach, dass keine Stelle
übrig bleibt.

**Keine Rechtsberatung.** Garantiezusagen und CE-Aussagen haben
Außenwirkung. Die verbindliche Bewertung gehört zum Anwalt; hier wird
sie vorbereitet.

---

## 1. Garantie

### Was die Seite heute sagt

**Alle Zahlen hier sind gezählt, nicht geschätzt.** Gezählt wurde in
den 51 Seiten, die wirklich ausgeliefert werden; Entwürfe, Vorlagen,
Werkstatt und Rechtstexte sind ausgenommen.

Es gibt ein erkennbares Schema: **10 Jahre auf Aluminium, 5 auf
Markisen, 2 auf Elektro.** Vollständig ausgeschrieben steht es auf
**5 Seiten** (`index.html`, drei Pergola-Ortsseiten,
`terrassenueberdachung-koblenz.html`), zum Beispiel so:

> „10 Jahre Herstellergarantie, auf Markisen 5 Jahre und auf die
> Antriebe 2 Jahre" — `index.html:1085`

Daneben stehen **37 Fundstellen mit „Herstellergarantie" auf 13
Seiten** und **34 Fundstellen „N Jahre Garantie"**, fast alle
verkürzt auf eine einzige Zahl. Zwei Gruppen davon passen nicht ins
Schema.

### Widerspruch 1: Lamellendächer sind aus Aluminium, bekommen aber 5 Jahre

| Fundstelle | Text |
|---|---|
| `index.html:1079` | „Auf **alle** Aluminium-Produkte unseres Herstellers gibt es 10 Jahre" |
| `src/produkte/pergola.njk:236` | Lamaxa L50 Lamelle: „5 Jahre Herstellergarantie" |
| `src/produkte/pergola.njk:258` | Lamaxa L50 Tex: „5 Jahre Herstellergarantie" |
| `src/ratgeber/pergola-kaufen-ratgeber.njk:74` | Warema L50: „5 Jahren Garantie" |

Ein Lamellendach ist keine Markise. Entweder ist „alle
Aluminium-Produkte" zu weit gefasst, oder die 5 Jahre sind falsch.

**Zu entscheiden:**

| Produktgruppe | gilt (bitte ausfüllen) |
|---|---|
| Terrassenüberdachung, Carport, Kaltwintergarten, Geländer, Vordach (Alu) | |
| Lamellendach (Lamaxa L50 / Warema L50) | |
| Markisen und textiler Sonnenschutz | |
| Antriebe, Motoren, Steuerungen, Elektro | |
| Glas und Polycarbonat | |
| Montageleistung von BV AussenSysteme | |

### Widerspruch 2: Elektro mit 5 Jahren statt 2

| Fundstelle | Text |
|---|---|
| `index.html:61` (Teilen-Beschreibung) | „Garantie auf Alu, **5 J.** auf Elektro/Markisen" |
| `index.html:1085` (sichtbar) | „auf die Antriebe **2 Jahre**" |
| `src/pflege.njk:397` | „**2 Jahre** Garantie auf die Antriebe" |

Die Teilen-Beschreibung ist das, was beim Weiterleiten in WhatsApp
oder Facebook erscheint. Sie verspricht mehr als die Seite selbst.

**Zu entscheiden:** Welche der beiden Zahlen stimmt für Elektro.

### Hinweis zum Wort „Herstellergarantie"

37 Fundstellen sagen „Herstellergarantie", 34 sagen nur „Garantie"
(zum Beispiel alle vier Carport-Ortsseiten, Zeile 31 und 181). Das ist
kein Widerspruch in der Zahl, aber einer in der Frage, **wer** haftet.
Eine Herstellergarantie gibt der Hersteller, nicht BV AussenSysteme.

**Zu entscheiden:** Soll überall „Herstellergarantie" stehen?

---

## 2. Statik

### Was die Seite heute sagt

Ein Satz steht wörtlich gleich auf sechs Produktseiten:

> „Alle Produkte werden maßgefertigt, CE-zertifiziert und mit
> vereinfachtem Statiknachweis geliefert."

Fundstellen: `src/produkte/carport.njk:174`,
`terrassenueberdachung.njk:213`, `pergola.njk:174`,
`kaltwintergarten.njk:173`, `gelaender.njk:167`,
`sonnenschutz.njk:168`.

### Der Widerspruch

Bei Geländer und Sonnenschutz steht derselbe Satz wie bei einem
Carport. Ein Nachweis für Wind- und Schneelasten nach Lastklassen
passt zu einem Dach. Ob ein Geländer oder eine Markise so einen
Nachweis überhaupt bekommt, ist eine Frage an den Hersteller.

Dazu zwei Formulierungen, die mehr versprechen:

| Fundstelle | Text | Problem |
|---|---|---|
| `src/zertifikate.njk:67` | „CE-gekennzeichnet und nach DIN EN 1090 **statisch geprüft**" | „statisch geprüft" klingt nach Prüfstatik. Die ist laut `index.html:1091` **nicht** enthalten |
| `src/pflege.njk:381` | „Statik ist für regionaltypische Schneelasten ausgelegt" | Eigenschaftszusage ohne Verweis auf den Nachweis |
| `src/windzonen.njk:633`, `:1430` | „Prüfung durch einen Statiker oder Fachplaner" nötig | Passt nicht zu „inklusive" ohne Einschränkung |

**Zu entscheiden:**

| Produktgruppe | vereinfachter Statiknachweis dabei? |
|---|---|
| Terrassenüberdachung | |
| Carport | |
| Kaltwintergarten | |
| Lamellendach / Pergola | |
| Geländer | |
| Markise / textiler Sonnenschutz | |
| Vordach, Fahrradüberdachung, Bushaltestelle | |

Dazu: Soll „statisch geprüft" auf `zertifikate.njk` bleiben, und wenn
ja, mit welchem Beleg?

---

## 3. CE-Kennzeichnung

| Fundstelle | Text |
|---|---|
| `index.html:1093`, `:1447` und im Datenblock `:365` | „**Alle** unsere Produkte sind CE-gekennzeichnet" |
| sechs Produktseiten | „Alle Produkte werden … CE-zertifiziert … geliefert" |
| `src/produkte/pergola.njk:229-258` | zwei Lamellendach-Modelle nennen **weder** CE **noch** Statik |
| `src/produkte/bushaltestelle.njk:121` | „typengeprüfte VD-Aluminiumprofile" |
| `src/ratgeber/carport-oder-garage.njk:82` | „typengeprüft" ohne Prüfzeugnis oder Nummer |

**Zu entscheiden:** Gilt CE für alle Produkte, oder soll die Aussage
auf die Gruppen beschränkt werden, für die Unterlagen vorliegen? Und
was belegt „typengeprüft"?

**Hinweis:** „CE-zertifiziert" ist sprachlich schief. CE ist eine
Kennzeichnung in eigener Verantwortung des Herstellers, kein
Zertifikat einer Prüfstelle. `index.html` sagt richtig
„CE-gekennzeichnet", die Produktseiten sagen „CE-zertifiziert".

---

## 4. Preis

| Fundstelle | Text |
|---|---|
| `src/broschuere.njk:349`, `:373` | „wir melden uns mit einem Vorschlag und einem **Festpreis**" |
| `index.html:1305` | „Statt **Pauschalpreisen** … unverbindliches Angebot" |
| `src/ratgeber/terrassenueberdachung-kosten.njk:104` | „Deshalb nennen wir bewusst **keinen Pauschalpreis**" |

Festpreis und unverbindliches Angebot sind zwei verschiedene Dinge.
Ein Festpreis bindet.

**Zu entscheiden:** Ist das Angebot ein Festpreis, und wenn ja, wie
lange gültig?

Dazu kleiner: `index.html:301` sagt „beliebige RAL-Farben" ohne
Aufpreishinweis, der Assistent sagt „Sonderfarben sind
aufpreispflichtig" (`js/anfrage-wizard.js:368`).

---

## 5. Lieferzeit

| Fundstelle | Text |
|---|---|
| `index.html:684` | „**Kurze** Lieferzeiten" |
| `index.html:261`, `:1279` | „deutlich **kürzer** als bei klassischen Händlern" |
| `index.html:1276` | „in der Regel **2-4 Wochen**, je nach Produktart und Auslastung" |

„Kurz" und „kürzer als" sind nirgends belegt. Die Spanne ist belegbar,
aber für alle Produkte gleich genannt, auch für Lamellendach mit
Antrieb oder Sonderfarbe.

**Zu entscheiden:** Soll überall die Spanne stehen statt „kurz"? Und
gilt dieselbe Spanne für alle Produktgruppen?

---

## Was danach passiert

Sobald die Spalten ausgefüllt sind:

1. Ich gleiche alle Fundstellen an, auch die im strukturierten
   Datenblock von `index.html` (die FAQ steht dort doppelt) und in den
   Teilen-Beschreibungen.
2. Ein neues Prüfskript `scripts/pruefe-zusagen.mjs` vergleicht jede
   Fundstelle gegen diese Tabelle. Gegenprobe: eine abweichende Zahl
   muss auffallen. Damit kann der Widerspruch nicht zurückkommen.
3. Danach der übliche Durchgang: betroffene Fachbereiche prüfen,
   Vorschau abrufen, berichten.

**Ohne ausgefüllte Tabelle ändere ich an diesen Texten nichts.**

---

# ENTSCHIEDEN AM 22.11.2026

Der Betreiber hat die offenen Punkte im Chat beantwortet, Frage für
Frage. Hier steht, was gilt und was daraufhin geändert wurde.

| Punkt | Entscheidung des Betreibers | Umgesetzt |
|---|---|---|
| Garantie Lamellendach | **10 Jahre**, die 5 waren falsch | `src/produkte/pergola.njk`, zwei Stellen |
| Garantie Elektro | **2 Jahre** | Teilen-Beschreibung auf `index.html` berichtigt; sie versprach 5 |
| Statiknachweis | **Terrassenüberdachung, Carport, Kaltwintergarten, Vordach, Fahrradüberdachung, Bushaltestelle.** Nicht Lamellendach, nicht Geländer, nicht Markise | offen, siehe unten |
| CE | gilt für alle, aber überall **„CE-gekennzeichnet"** statt „zertifiziert" | 36 Stellen in 13 Dateien |
| Preis | **unverbindliches Angebot**, „Festpreis" raus | `src/broschuere.njk`, zwei Stellen |
| Wer haftet | überall **„Herstellergarantie"** | offen, siehe unten |
| Lieferzeit | **„In der Regel ab Auftragsbestätigung 2 bis 4 Wochen, in einigen Fällen wie Hochsaison auch 6 Wochen und mehr"** | drei Stellen auf `index.html`, sichtbar und im Datenblock |
| Neuwied | **25 km** | `terrassenueberdachung-neuwied.html` |
| Warema L50 | **ganz raus, überall**. „Wir haben nur Sun Pro One und Sun Pro Plus" | Produktkarte samt Bild entfernt, 11 Dateien bereinigt, drei Bilddateien gelöscht |
| Schreibweise | **SunPro Plus und SunPro One** | in den Aufzählungen gesetzt |

**Zum Warema-Befund, damit die Tragweite klar ist.** Das war nicht nur
ein Name: Auf `produkte/pergola.njk` stand ein **eigenes Produkt mit
Foto, Beschreibung und Maßangaben**, dazu Erwähnungen in zehn weiteren
Dateien. Die Seite hat damit ein Produkt beworben, das der Betrieb
nicht liefert. Das ist schwerer als ein Markenrechtsproblem.

**Noch offen und beim Betreiber:** Für eine eigene Produktkarte
„SunPro One" fehlen Beschreibung und Foto. Ohne beides würde ich
erfinden, und das unterbleibt. In den Aufzählungen wird der Name
genannt, eine eigene Karte bekommt er erst mit Material vom
Betreiber.
