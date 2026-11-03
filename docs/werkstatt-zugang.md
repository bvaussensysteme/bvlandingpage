# Zugang zur Werkstatt: Cloudflare Access einrichten

> Anlass: „kommt man da ohne passwort rein?" und „ja mach das mit cloudflare
> wenns kostenlos is, dann hat josef und ich eigenes konto etc." (Betreiber,
> 03.11.2026).

## Worum es geht

Die Werkstatt (`/werkstatt/`, darin der Konfigurator und die Zahlenseite) ist
heute durch **ein gemeinsames Passwort** geschützt. Das hält Fremde draußen –
aber es hat drei Schwächen:

1. **Ein Passwort für alle.** Wer es hat, ist drin; wer ausscheidet, muss es
   für alle geändert bekommen.
2. **Niemand sieht, wer drin war.** Es gibt kein Protokoll.
3. **Raten wird nur gebremst, nicht verhindert.** Gemessen am 03.11.2026:
   Zehn gleichzeitige Fehlversuche gingen in 1,7 Sekunden durch, nach 13
   Fehlversuchen kam **keine** Sperre. Die Bremse von 0,7 s wirkt pro
   Anfrage, nicht insgesamt. Der Schutz ist also genau so stark wie die
   Länge des Passworts.

**Cloudflare Access** legt eine Anmeldung per E-Mail davor: Jeder bekommt
einen Einmalcode an seine eigene Adresse. Damit hat jeder sein eigenes Konto,
im Protokoll steht, wer wann drin war, und Raten ist ausgeschlossen – es gibt
kein Passwort zu raten.

**Kosten: 0 €.** Der Free-Tarif von Cloudflare Zero Trust gilt dauerhaft für
Teams unter 50 Personen. Nachgesehen am 03.11.2026 auf der Preisseite von
Cloudflare; der Bezahltarif beginnt erst bei 7 $ je Person und Monat und wird
hier nicht gebraucht.

## ⚠️ Die Falle: NICHT „Access für diesen Worker" anklicken

Cloudflare bietet seit einiger Zeit einen Knopf, der **einen ganzen Worker**
hinter Access legt – mit einem Klick, und es sieht nach der bequemen Lösung
aus. **Das wäre hier ein Ausfall der Website.** Dieselbe Worker-Datei
(`worker/index.js`) liefert auch die öffentliche Seite aus: jede
Terrassenüberdachungs-Seite, jeden Ratgeber, das Anfrageformular. Alles davon
läge dann hinter einer Anmeldung, und Google käme auch nicht mehr hin.

Richtig ist eine **Self-hosted-Anwendung auf den Pfad `/werkstatt`**. Dann
betrifft die Anmeldung genau die Werkstatt und sonst nichts.

Geprüft wird das danach, nicht gehofft:
`bash scripts/pruefe-werkstatt-zugang.sh` ruft die echte Adresse ab und sagt,
welche Tür geantwortet hat – und die öffentliche Startseite muss darin
weiterhin als „offen" erscheinen.

## Die Einrichtung, Schritt für Schritt

Alles im Cloudflare-Dashboard, nichts davon im Code.

1. **Zero Trust öffnen.** Cloudflare → links im Menü **Zero Trust**. Beim
   ersten Mal fragt Cloudflare nach einem Teamnamen – zum Beispiel
   `bv-aussensysteme`. Daraus wird die Anmeldeadresse
   `bv-aussensysteme.cloudflareaccess.com`. Als Tarif **Free** wählen.
2. **Anwendung anlegen.** Zero Trust → **Access** → **Applications** →
   *Add an application* → **Self-hosted**.
3. **Name:** `Werkstatt`. **Session Duration:** 24 Stunden oder 1 Woche –
   so lange hält die Anmeldung, danach kommt wieder ein Code.
4. **Adresse eintragen** (der entscheidende Schritt):
   - Domain: `bv-aussensysteme.de`
   - Path: `werkstatt`
   Keine weitere Domain, keinen anderen Pfad.
5. **Anmeldeweg:** bei *Identity providers* **One-time PIN** aktivieren. Das
   ist eingebaut, kostet nichts und braucht kein Google- oder Microsoft-Konto.
6. **Regel anlegen:** Policy name `Nur wir zwei`, Action **Allow**,
   Include → **Emails** → beide Adressen einzeln eintragen (deine und die
   von Josef).
7. **Speichern.**

## Danach: nachsehen, ob es wirklich greift

```
bash scripts/pruefe-werkstatt-zugang.sh
```

Erwartet wird für jeden Werkstatt-Pfad `Access`, für die öffentliche
Startseite `offen`, und die Messung der Besucher muss weiter annehmen
(HTTP 204). Steht bei einem Werkstatt-Pfad noch `Passwort`, deckt die
Access-Regel diesen Pfad **nicht** ab – dann stimmt der Pfad in Schritt 4
nicht.

Die Gegenprobe (`--gegenprobe`) prüft die Erkennung selbst: Sie muss
Werkstatt, öffentliche Seite und eine erfundene Adresse unterscheiden können.

## Warum das Passwort trotzdem bleibt

Die eigene Schranke in `worker/index.js` wird **nicht** entfernt. Zwei Gründe,
und beide sind praktisch:

- **Rückfallebene.** Access hängt am E-Mail-Postfach. Kommt da einmal kein
  Code an (Postfach gesperrt, Anbieter streikt, Tippfehler in der Adresse),
  wäre die Werkstatt ohne das Passwort für niemanden mehr erreichbar – auch
  nicht für den Betreiber.
- **Falls die Access-Regel nicht greift.** Ein falscher Pfad in Schritt 4 ist
  schnell passiert, und im Dashboard sieht das richtig aus. Solange das
  Passwort dahinter steht, ist eine falsch gesetzte Regel ein Ärgernis und
  kein offenes Tor.

Der Preis sind zwei Anmeldungen hintereinander: erst der E-Mail-Code, dann das
Passwort. Beide halten danach wochenlang (Access je nach Einstellung, das
Passwort 30 Tage pro Gerät). Wenn das Prüfskript über eine Weile zuverlässig
`Access` vor **allen** Werkstatt-Pfaden meldet, kann die Passwortschranke auf
Wunsch entfernt werden – das ist eine Zeile. Vorschlag: erst eine Woche
laufen lassen.

## Was Access nicht betrifft

- **Die öffentliche Website** – sie bleibt für alle offen.
- **Die Besuchermessung** (`POST /api/messung`). Sie liegt außerhalb von
  `/werkstatt`, wird also nicht abgefragt. Wäre das anders, würde ab sofort
  nichts mehr gezählt; deshalb steht genau das im Prüfskript.
- **Die Zahlen selbst** (`/werkstatt/api/zahlen`) liegen dagegen *innerhalb*
  und sind damit doppelt geschützt.
