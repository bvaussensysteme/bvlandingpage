# Sichere Vorschau: Anforderungen

Stand: 13.11.2026. **Anforderungen, kein Fertigstand.** Eine
Vorschau-Adresse wird erst genannt, wenn sie eingerichtet und selbst
abgerufen wurde.

## Was heute schon da ist

Cloudflare baut zu jedem Branch automatisch eine Vorschau unter
`https://<branch>-bvlanding.bv-verwaltung.workers.dev`. Sie läuft über
HTTPS und ist von der Produktion getrennt, **was die Dateien angeht**.

## Was daran noch nicht sicher ist

### 1. Die Vorschau schreibt in die produktive Messdatenbank
Die Konfiguration (`wrangler.jsonc`) bindet für jede Auslieferung
dieselbe D1-Datenbank `bv-messung` ein. Es gibt keine getrennte
Vorschau-Umgebung. Jeder Aufruf der Vorschau – auch jeder eigene
Testlauf – legt damit Zeilen in den produktiven Messdaten ab.

Das ist am 08.11.2026 gemessen worden: 98 Zeilen an einem Testtag
gegenüber 16 am Vortag, ohne Spalte, an der sich Testaufrufe von echten
unterscheiden ließen. Die Zahlen dieses Tages sind unbrauchbar.

**Anforderung:** eigene Datenbank für die Vorschau, oder mindestens eine
Spalte für den Ursprung, nach der sich filtern lässt.
**Bis dahin:** Browsertests laufen gegen `localhost`, nicht gegen die
Vorschau und nie gegen die Live-Seite.

### 2. Die Vorschau ist öffentlich erreichbar
Wer die Adresse kennt, sieht alles. Für Entwürfe einer Firmenseite ist
das vertretbar, für Preisangaben, Kundendaten oder interne Werkzeuge
nicht.

**Anforderung:** Zugangsschutz (Passwort oder Cloudflare Access) vor der
Vorschau, sobald dort etwas steht, das nicht jeder sehen soll.

### 3. `.assetsignore` gilt auch für die Vorschau
Das Wurzelverzeichnis des Repositorys wird komplett ausgeliefert. Was
nicht in `.assetsignore` steht, ist öffentlich – in der Produktion **und
in der Vorschau**. Ein Eintrag, der etwas vor der Produktion verbirgt,
verbirgt es auch vor der Vorschau; das hat schon einmal alle Entwürfe
unerreichbar gemacht.

### 4. Keine echten Benachrichtigungen aus der Vorschau
Formulare, die in der Vorschau abgeschickt werden, dürfen keine
E-Mails, keine CRM-Einträge und keine Benachrichtigungen auslösen. Wo
ein Formular in der Vorschau nichts sendet, muss das **auf der Seite
sichtbar** stehen, sonst hält jemand es für kaputt.

## Regeln für die Veröffentlichung

- **Kein automatisches Zusammenführen, kein automatisches Deployment.**
- Vor jeder Veröffentlichung ausdrückliche Freigabe des Betreibers
  einholen. Schweigen, "ok", "sieht gut aus" oder ein grüner Testlauf
  sind keine Freigabe.
- Keine Änderung an DNS, Domain, Hosting, produktiver Datenbank,
  produktiven Konfigurationen oder Kundendaten.
- Keine Geheimnisse in Git, in Protokollen oder in der Vorschau.

## Nach einer Veröffentlichung: nachsehen, nicht glauben

1. `origin/main` gegen den geprüften Stand vergleichen (`sha256`).
2. Die **ausgelieferte** Datei abrufen und gegen `main` vergleichen.
3. **Achtung Zwischenspeicher:** Die erste Abfrage kann eine alte Kopie
   aus dem Cloudflare-Cache treffen (`cf-cache-status: HIT`). Mit einem
   eindeutigen Abfrageanhang gegenprüfen, bevor man "ist noch alt" meldet
   – genau dieser Irrtum ist am 12.11.2026 passiert.
4. Cache-Buster hochgezählt? Ohne das bekommen wiederkehrende Besucher
   weiter die alte Datei und sehen die Änderung nie.
5. `scripts/pruefe-live.sh` laufen lassen.

## Rückweg

Zu jeder Veröffentlichung gehört der Commit davor, notiert in
`docs/entscheidungen.md`. Zurück geht es durch Zurücksetzen auf diesen
Stand – nicht durch Nachbessern unter Zeitdruck.

---

# Freigabeplan für eine sichere Vorschau (13.11.2026)

Beauftragt als Plan, **nicht als Umsetzung**. Nichts davon wird
eingerichtet, bevor der Betreiber je Schritt zustimmt. Grundlage sind
die oben dokumentierten Befunde und die tatsächliche Konfiguration in
`wrangler.jsonc` – keine neue Untersuchung.

## Ausgangslage, belegt

`wrangler.jsonc` hat **keine `env`-Blöcke**. Es gibt also genau eine
Konfiguration, und jede Auslieferung – Produktion wie Branch-Vorschau –
benutzt dieselbe D1-Datenbank `bv-messung` und dieselben Einstellungen.
Das ist die Wurzel von Risiko 1 und 2.

**Was es schon gibt und wiederverwendet werden kann:** Die Werkstatt
liegt hinter einer Passwortschranke im Worker (`run_worker_first` für
`/werkstatt*` in `wrangler.jsonc`, Logik in `worker/index.js`, geprüft
von `scripts/pruefe-werkstatt.js`). Dieselbe Mechanik trägt auch eine
Schranke vor der ganzen Vorschau. **Kein neues Werkzeug nötig.**

## Die vier Schritte, in dieser Reihenfolge

Die Reihenfolge ist nicht beliebig: Schritt 1 ist der einzige, der
heute schon Schaden anrichtet.

### Schritt 1 – Messdaten trennen (dringend)

**Problem.** Jeder Aufruf der Vorschau legt Zeilen in den produktiven
Messdaten ab. Gemessen am 08.11.2026: 98 Zeilen an einem Testtag gegen
16 am Vortag, ohne Spalte, an der sich Testaufrufe unterscheiden ließen.
Die Zahlen dieses Tages sind unbrauchbar.

**Zwei Wege, einer davon sofort machbar:**

| | Weg A: eigene Datenbank | Weg B: Herkunftsspalte |
|---|---|---|
| Was | zweite D1 für die Vorschau, über einen `env`-Block gebunden | Spalte `herkunft` in `bv-messung`, Vorschau schreibt „vorschau" |
| Trennung | vollständig | nur per Filter |
| Eingriff in Produktion | keiner | **Migration der produktiven Datenbank** |
| Aufwand | gering | gering, aber riskanter |
| Kosten | im kostenlosen Rahmen von D1 | keine |

**Empfehlung: Weg A.** Weg B ändert die produktive Datenbank – genau
das, was die Sicherheitsregeln ausschließen. Eine zweite Datenbank
berührt die produktive nicht.

**Braucht vom Betreiber:** Zustimmung, eine zweite D1 anzulegen (externe
Aktion bei Cloudflare).

**Sofort und ohne Freigabe wirksam, als Zwischenlösung:** Browsertests
laufen gegen `localhost`, nicht gegen die Vorschau. Das gilt bereits.

### Schritt 2 – Zugangsschutz vor die Vorschau

**Problem.** Wer die Adresse kennt, sieht alles. Für Entwürfe einer
Firmenseite vertretbar, für Preisangaben, Kundendaten oder interne
Werkzeuge nicht.

**Empfehlung:** dieselbe Passwortschranke wie bei der Werkstatt, aber
für **alle** Pfade – aktiv nur, wenn die Auslieferung nicht die
Produktion ist. Unterschieden wird an einer Umgebungsvariablen, nicht
am Hostnamen (ein Hostname lässt sich fälschen, eine Variable nicht).

**Alternative:** Cloudflare Access davorsetzen. Sauberer, aber
Einrichtung im Cloudflare-Konto und je nach Tarif kostenpflichtig –
deshalb nicht die Empfehlung.

**Braucht vom Betreiber:** ein Vorschau-Passwort (nicht im Chat nennen,
nicht in Git) und die Entscheidung Worker-Schranke oder Access.

### Schritt 3 – Nichts verlässt die Vorschau nach außen

**Regel:** Formulare in der Vorschau senden keine E-Mails, legen nichts
im CRM an und lösen keine Benachrichtigung aus. Wo ein Formular nichts
sendet, steht das **sichtbar auf der Seite** – sonst hält es jemand für
kaputt (so ist es auf `entwurf-produkt.html` schon gelöst).

**Zusätzlich zu prüfen, noch nicht untersucht:** `wrangler.jsonc`
schaltet `observability.logs` mit `invocation_logs` ein. Ob und welche
Eingaben dort landen, ist offen. Gehört geklärt, bevor die Vorschau
Testdaten sieht.

**Braucht vom Betreiber:** nichts. Das ist eine Arbeitsregel.

### Schritt 4 – Veröffentlichen bleibt ein eigener Vorgang

Unverändert gültig, hier nur zusammengefasst:

- Kein automatisches Zusammenführen, kein automatisches Deployment
- Freigabe nur mit dem wörtlichen Satz aus `CLAUDE.md`
- Vor der Freigabe: Cache-Buster hochgezählt? Alle `scripts/pruefe-*`
  grün? Rückweg notiert (welcher Commit ist der Stand davor)?
- Nach der Veröffentlichung: ausgelieferte Datei byteweise gegen `main`,
  **mit eindeutigem Abfrageanhang gegen den Zwischenspeicher** – ein
  `cf-cache-status: HIT` hat am 12.11.2026 schon einmal zu der falschen
  Meldung „ist noch alt" geführt

## Was dieser Plan ausdrücklich NICHT enthält

- Keine Einrichtung. Kein Befehl wurde ausgeführt, nichts bei Cloudflare
  angelegt oder geändert.
- Keine Nennung einer Vorschau-Adresse als „gesichert". Die heutige
  Branch-Vorschau ist weiterhin öffentlich und teilt sich die Datenbank.
- Keine Aussage zur Rechtslage. Ob die Messung in der heutigen Form
  zulässig ist, ist eine Frage für den Fachmann, nicht für diesen Plan.

## Entscheidungen, die beim Betreiber liegen

| # | Frage | Empfehlung |
|---|---|---|
| 1 | Zweite D1 für die Vorschau anlegen? | ja (Weg A) |
| 2 | Worker-Schranke oder Cloudflare Access? | Worker-Schranke |
| 3 | Vorschau-Passwort festlegen | über eine Umgebungsvariable, nie in Git |
| 4 | Reihenfolge wie oben, oder anders? | Schritt 1 zuerst |
