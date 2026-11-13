# Audit: Der Weg des Besuchers bis zur Anfrage

Stand: 13.11.2026. Erster abgegrenzter Prüfauftrag des Neubaus.
Geprüft von `customer-journey-architect` (nur lesend), die zwei
konkretesten Code-Behauptungen vom Hauptagenten nachgeprüft.
**Nichts geändert.**

Geprüfte Dateien: `index.html`, `windzonen.html`,
`produkte/terrassenueberdachung.html`, `kontakt.html`, dazu
`js/anfrage-wizard.js`.

## Die Datenlage vorweg – sie trägt wenig

11 Tage Messung (03.–13.11.2026), **129 Seitenaufrufe insgesamt**.

| Seite | Aufrufe | Besucher | Ø Sek. |
|---|---|---|---|
| `/` | 49 | 28 | 48 |
| `/windzonen` | 28 | 19 | 70 |
| `/impressum` | 20 | 7 | 4 |
| alle übrigen | ≤ 3 | | |

Kontakte: 3 WhatsApp, 3 E-Mail, 0 Telefon, **0 abgesendete Formulare**.
Geräte: 71 Aufrufe Rechner, 58 Handy.

**Keine einzige Seite erreicht die 100 Aufrufe, ab denen eine Aussage
über diese Seite belastbar wäre** (`docs/zahlen-lesen.md`, Falle 2). Die
Befunde unten sind deshalb aus dem **Code** begründet, nicht aus den
Zahlen. Wo eine Zahl auftaucht, ist sie ein schwacher Hinweis.

**Zwei Auffälligkeiten, die kein Befund sind, sondern eine offene Frage:**
- 20 Impressum-Aufrufe bei 7 Besuchern und 4 Sekunden – das Muster passt
  zu Suchmaschinen-Robotern. Die echte Besucherzahl ist also noch kleiner.
- 0 abgesendete Formulare bei 6 Kontakten über WhatsApp und E-Mail.
  Entweder hat niemand abgeschickt, oder das Ereignis wird nicht
  ausgelöst. **Ungeklärt, gehört geprüft** – bevor jemand daraus
  schließt, das Formular sei kaputt.

## Befunde

### 1 – Der Weg zur Anfrage ist 12 bis 13 Bildschirme lang (hoch)
Wer „Jetzt anfragen" drückt, bekommt kein kurzes Formular, sondern einen
Assistenten. Schrittliste in `js/anfrage-wizard.js:216-226`:
`produkt, aufbau, fassade?, masse, verglasung, markise, stoff?,
erweiterungen, stoffzip?, led, farbe, untergrund, montage, kontakt,
summary`.

> **KORREKTUR vom Hauptagenten, 13.11.2026.** Dieser Befund ist so
> nicht richtig. **Ein Kurzweg existiert bereits:** Die sechste Karte
> „Direkt anfragen" führt über nur vier Schritte – `produkt, wunsch,
> kontakt, summary` (`js/anfrage-wizard.js:254-255`, selbst nachgesehen).
> Der Agent hat das übersehen.
>
> Der tatsächliche Mangel ist ein anderer und kleiner: Der Kurzweg steht
> als **sechste von sechs Karten** und ist nicht als Abkürzung erkennbar.
> Seine Beschriftung nennt Markise, Geländer und Vordach – nicht „ich
> weiß schon, was ich will, fragt mich kurz".
>
> **Geänderte Empfehlung:** den vorhandenen Kurzweg sichtbarer machen.
> Keinen zweiten bauen.
**Hypothese**, nicht belegt: Die 0 Formulare bei 6 Kontakten über
WhatsApp und E-Mail passen dazu. Die Zahlen sind zu dünn für einen Beweis.

### 2 – Der erste Bildschirm nennt kein einziges Produkt (hoch)
`index.html:514-517` sagt „Aluminium-Spezialist im Westerwald", „Ihr
Traumplatz draußen – das ganze Jahr", „Maßgefertigte
Aluminium-Überdachungen". Die Wörter Terrassenüberdachung, Carport,
Pergola, Kaltwintergarten stehen erst in den Karten ab Zeile 590, also
unterhalb des ersten Bildschirms. „Privat & Gewerbe" erst ab Zeile 567.
Der `<title>` sagt es bereits – wer aus der Suche kommt, findet es im
Hero nicht wieder.

**Empfehlung:** eine Zeile im Hero mit den Produktnamen, der Zielgruppe
und der Gegend. Die Überschrift kann bleiben.

### 3 – „Konfigurator" führt zum Anfrageformular (hoch)
`index.html:480` (Navigation, Beschriftung „Konfigurator") und
`index.html:519` (Knopf „Kostenlos konfigurieren") zeigen beide auf
`#kontakt`. Der 3D-Konfigurator ist seit dem 31.10.2026 gesperrt; auf
den Unterseiten ist der Navigationseintrag auskommentiert
(`windzonen.html:497-499`, `produkte/terrassenueberdachung.html:234-236`).
**Vom Hauptagenten nachgeprüft, trifft zu.**

Wer „konfigurieren" erwartet, bekommt eine Fragenfolge. Das ist keine
Absicht, sondern ein Rest der Sperre.

> **WIDERSPRUCH vom Hauptagenten, 13.11.2026. Nicht umgesetzt.**
> Der Agent nennt das irreführend. Ich sehe das anders und habe deshalb
> nichts geändert: Der Assistent fragt Produkt, Aufbau, Maße, Verglasung,
> Farbe, LED, Untergrund und Montage ab – **das ist ein Konfigurator**,
> nur ohne 3D-Bild. Sein eigener erster Schritt heißt „Was möchten Sie
> kostenlos konfigurieren?" (`js/anfrage-wizard.js:433`). Nirgends auf
> der Seite wird eine 3D-Ansicht versprochen.
>
> Eine Beschriftung zu ändern, die niemanden täuscht, wäre Textarbeit
> ohne Nutzen. **Bleibt als Beobachtung stehen, nicht als Aufgabe.**
> Wenn du es anders siehst, sag Bescheid – es sind zwei Zeilen.

### 4 – Der Windzonen-Rechner führt weiter, gibt das Ergebnis aber nicht mit (mittel)
Keine Sackgasse: Nach dem Ergebnis folgen Erklärsatz,
Genehmigungs-Check und drei Wege (`windzonen.html:685-706`). Aber der
Text verspricht „Schicken Sie uns Ihre Maße, dann rechnen wir das für
Ihren Standort durch" (Zeile 689-690) – und übergibt den Standort nicht.
Zone und PLZ muss der Besucher im Assistenten neu eintippen.

Zweitens steht dieser Absatz **nur im Ergebnisblock**. Wer die Seite nur
liest, ohne zu rechnen, sieht ihn nie.

**Empfehlung:** PLZ an die Anfrage weitergeben, falls das ohne Änderung
an der Datenschutzerklärung geht – sonst im Satz sagen, dass PLZ und Ort
im Formular erneut gefragt werden.

### 5 – Telefon ist Pflicht, auch für Schreiber (mittel)
Pflichtfelder im Kontaktschritt: Anrede, Nachname, E-Mail, Telefon, PLZ,
Ort, Datenschutz-Haken (`js/anfrage-wizard.js:967-983`, Prüfungen
`:1001-1021`). Keine Anmeldung nötig. Die Begründung steht im Code
(Zeile 1007-1008): „Rueckfragen zu Massen und Untergrund lassen sich am
Telefon in Minuten klaeren".

**Empfehlung:** Telefon freiwillig stellen, wenn E-Mail oder WhatsApp da
ist – und dazusagen, was sich dadurch ändert.
**Das ist eine Geschäftsentscheidung des Betreibers**, keine technische.
Der Code zeigt nur die heutige Regel.

### 6 – „Was passiert danach" wird dreimal verschieden gesagt (mittel)
Hero: „Antwort meist in 24 Std." (`index.html:537`). Kontaktschritt: nur
„Damit wir Ihnen Ihr persönliches Angebot zusenden können"
(`js/anfrage-wizard.js:964`). Nach dem Absenden: „in der Regel innerhalb
von 24 Stunden" (`:1563`). Die FAQ nennt ein Angebot erst nach
Maßaufnahme vor Ort (`index.html:273-278`).

**Empfehlung:** im Kontaktschritt den echten Ablauf in einem Satz:
Rückmeldung in 24 Stunden, dann Termin oder Aufmaß, dann schriftliches
Angebot. „Angebot zusenden" ist verkürzt, weil vorher ein Aufmaß nötig ist.

### 7 – Keine Hilfe bei der Produktwahl (mittel)
Fünf Karten nebeneinander ohne Auswahlhilfe (`index.html:590-633`). Die
Abgrenzung Pergola / Lamellendach / Velaris steht nur in der FAQ
(`index.html:393-398`). Auf der Produktseite stehen TDS und SkyView als
zwei lange Karten, nicht vergleichbar nebeneinander
(`produkte/terrassenueberdachung.html:279-327`).

**Empfehlung:** je Karte eine Zeile „Passt, wenn …", und eine kleine
Gegenüberstellung TDS / SkyView. Ergänzung, kein Umbau.

### 8 – Die Produktseite wirft beim Anfrage-Klick einen Fehler (mittel)
`produkte/terrassenueberdachung.html:298` und `:320`:
`onclick="document.getElementById('produkt').value='Terrassenüberdachung'"`.
**Nachgemessen: `id="produkt"` kommt in dieser Datei 0 mal vor.**

**Vom Hauptagenten zu Ende geprüft:** Der Assistent übernimmt eine
Vorauswahl ausschließlich über `window.bvKonfigVorgabe`
(`js/anfrage-wizard.js:1579-1612`) – nicht über die Adresse, nicht über
`sessionStorage`. Die Produktwahl geht damit **sicher** verloren, nicht
nur vermutlich. Der Besucher wird trotzdem weitergeleitet (ein Fehler im
`onclick` unterbindet das Folgen des Links nicht), startet den
Assistenten aber bei null.

> **BEHOBEN am 13.11.2026** (nur auf dem Arbeitsbranch, nicht live).
> Der Fehler war schlimmer als gemeldet: Der gesetzte Wert
> „Terrassenüberdachung" steht **nicht einmal in der Auswahlliste** des
> Produktschritts – dort heißt es „Terrassendach TDS". Die Vorauswahl
> wäre also auch mit vorhandenem Feld verfallen.
>
> **Gelöst über `sessionStorage`**, nicht über einen Adressparameter:
> Ein Parameter hätte eine zweite Adresse der Startseite erzeugt, mit
> eigenem Zwischenspeicher-Eintrag und einer zusätzlichen Zeile in der
> Reichweitenmessung. Nur Werte aus der Auswahlliste werden übernommen –
> ein fremder Wert darf nicht über die Antworten in die Anfrage-E-Mail
> geraten.
>
> Abgesichert durch `scripts/pruefe-produktwahl.mjs` (Browser, echter
> Seitenwechsel): 7 von 7 bestanden, Gegenprobe 7 von 7 – ein fremder
> Wert wird verworfen.

## Was NICHT geprüft wurde

`windzonen.html` ab Zeile 866 (FAQ und Rechner-Skript – ob das Ergebnis
überhaupt erscheint), `index.html` 634-1299 (Galerie, Ablauf, FAQ,
Referenzen), die Startschritte des Assistenten (`produkt`, Zeile
430-700), und **das Verhalten im Browser** – es wurde nichts ausgeführt,
nur gelesen.

## Einordnung des Hauptagenten

Die Befunde 1, 2, 3, 6 und 7 sind Textarbeit und Gestaltung. Befund 8
ist ein Fehler, der sich in einer Zeile beheben lässt. Befund 5 gehört
dem Betreiber.

**Wichtiger als alle acht:** Bei 28 Besuchern auf der Startseite in 11
Tagen ist die Umwandlung nicht der Engpass, sondern die Sichtbarkeit.
Ein Umbau, der aus 3 % Anfragen 5 % macht, bringt bei dieser Menge
rechnerisch unter eine zusätzliche Anfrage im Monat. **Hypothese zur
Priorität**, kein Befund – aber sie sollte beantwortet sein, bevor
größere Gestaltungsarbeit beginnt.
