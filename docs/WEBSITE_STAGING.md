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

---

# Freigabeplan 2: Auto-Merge-Schutz und Staging-Isolation (13.11.2026)

Zweiter Prüfauftrag. Der Plan oben deckt die Vorschau ab; hier kommt
dazu, was bisher fehlte: **die Veröffentlichung selbst ist technisch
nicht gesichert.** Alles unten ist in dieser Sitzung nachgesehen, nicht
übernommen.

## Was geprüft wurde – und was dabei herauskam

| Geprüft | Ergebnis |
|---|---|
| `.github/workflows/` | **existiert nicht.** Keine Automatik, die von sich aus baut, zusammenführt oder veröffentlicht. Gute Nachricht |
| `package.json` → `scripts` | nur `build` und `build:css`. Kein `deploy`, kein `wrangler deploy` |
| `CLAUDE.md` auf `main`, Zeile 25 | **„Ansage des Betreibers (05.11.2026): ‚immer auto merge'"** – mit dem Zusatz „Das hebt die frühere Regel ‚kein Deployment ohne Freigabe' auf" |
| `CLAUDE.md` auf `main`, Freigabesatz | **0 Treffer.** Der wörtliche Freigabesatz vom 08.11. steht dort nicht |
| Offene Pull Requests gegen `main` | **vier**, alle alt: #1 (17.06.), #2 (26.06.), #3 (05.07.), #53 (04.07.) |
| `werkstatt/zahlen.html`, `sicher()`-Aufrufe | `main` 17, Arbeitsbranch 25. Die XSS-Korrektur ist weiterhin **nur auf dem Branch** |

## Das eigentliche Risiko, in einem Satz

Ein neuer Chat, der auf `main` startet, liest dort „immer auto merge",
sieht vier offene Pull Requests, findet den Freigabesatz nicht – und
hält das Zusammenführen für ausdrücklich gewünscht. Die strenge Regel
vom 08.11.2026 schützt nur Sitzungen, die zufällig auf dem Arbeitsbranch
anfangen.

**Dazu kommt:** Dass es zu jedem Branch eine Cloudflare-Vorschau gibt,
heißt, dass die Git-Anbindung von Cloudflare aktiv ist. Dann ist ein
Zusammenführen nach `main` kein Zwischenschritt, sondern die
Veröffentlichung. Zwischen „merge" und „live" liegt nichts.
*Nicht selbst nachgesehen* – das steht im Cloudflare-Konto, nicht im
Repository (siehe Entscheidung 5).

## Vier Maßnahmen, nach Wirkung sortiert

### M1 – Die Regel auf `main` richtigstellen (dringend, kleinster Eingriff)

Ein eigener kleiner Branch von `main`, der **nur** `CLAUDE.md` ändert:
Abschnitt „Veröffentlichen ohne Rückfrage" raus, Abschnitt
„Veröffentlichen NUR auf ausdrückliche Freigabe" rein. Keine Datei der
Website wird angefasst, am Aussehen ändert sich nichts.

Das ist derselbe Weg, der am 12.11. bei der Broschüren-Korrektur
funktioniert hat (PR #567): eine Sache, von `main` abgezweigt, ohne den
Neubau mitzuziehen.

**Reihenfolge-Hinweis:** Diese Maßnahme *ist selbst ein Merge nach
`main`.* Sie braucht also Freigabe – aber sie ist die einzige, die
dieselbe Lücke schließt, durch die sie geht.

**Braucht vom Betreiber:** Zustimmung zu diesem einen PR.

### M2 – Die vier alten Pull Requests schließen

#1, #2, #3 und #53 zeigen alle auf `main` und sind vier bis fünf Monate
alt. Keiner davon gehört zum laufenden Neubau. Solange sie offen sind,
ist jeder von ihnen ein Knopf, der versehentlich gedrückt werden kann –
und genau der Zustand, in dem ein „auto merge" Schaden anrichtet.

Schließen löscht nichts: Die Branches bleiben, ein geschlossener PR
lässt sich wieder öffnen.

**Braucht vom Betreiber:** Zustimmung zum Schließen. Falls einer davon
doch noch gebraucht wird: welcher.

### M3 – Branch-Schutz auf `main` einschalten (GitHub-Einstellung)

Im Repository unter *Settings → Branches → Add rule* für `main`:

| Einstellung | Wert | Warum |
|---|---|---|
| Require a pull request before merging | an | kein direkter Push auf `main` |
| Require approvals (1) | an | ein Mensch bestätigt |
| Allow auto-merge (unter *Settings → General*) | **aus** | hebt den Automatismus technisch auf, nicht nur schriftlich |
| Allow force pushes | aus | Rückweg bleibt nachvollziehbar |

Das ist die einzige Maßnahme, die auch dann trägt, wenn jemand die
Dokumentation nicht liest.

**Braucht vom Betreiber:** Einrichtung im GitHub-Konto. Vier Klicks,
rückgängig zu machen.

### M4 – Staging-Isolation: unverändert die vier Schritte oben

Der Plan vom Vormittag gilt weiter und wird hier nicht wiederholt:
Messdaten trennen (eigene D1) · Zugangsschutz vor die Vorschau ·
nichts verlässt die Vorschau nach außen · Veröffentlichen bleibt ein
eigener Vorgang.

**Eine Verbindung zu M1–M3:** Der Zugangsschutz aus Schritt 2 wird über
eine Umgebungsvariable geschaltet, die es in der Produktion nicht gibt.
Dafür braucht `wrangler.jsonc` `env`-Blöcke – und sobald es die gibt,
ist auch die zweite Datenbank aus Schritt 1 nur noch ein Eintrag. Beides
ist derselbe Handgriff und sollte zusammen gemacht werden.

## Was dieser Plan NICHT enthält

- Keine Umsetzung. Kein PR eröffnet, kein PR geschlossen, keine
  GitHub-Einstellung geändert, nichts bei Cloudflare angelegt.
- Keine Aussage darüber, ob `main` heute tatsächlich automatisch
  veröffentlicht wird. Das steht im Cloudflare-Konto.
- Keine Rechtsberatung.

## Entscheidungen, die beim Betreiber liegen

| # | Frage | Empfehlung |
|---|---|---|
| 1 | M1: PR mit der korrigierten Freigaberegel nach `main`? | ja, zuerst |
| 2 | M2: die vier alten PRs schließen? | ja, alle vier |
| 3 | M3: Branch-Schutz auf `main` einschalten? | ja |
| 4 | XSS-Korrektur als eigenen PR vorziehen (seit 08.11. offen)? | ja |
| 5 | Im Cloudflare-Konto nachsehen: löst ein Push auf `main` eine Veröffentlichung aus? | bitte nachsehen und mitteilen |
| 6 | Staging-Isolation: die vier Entscheidungen aus dem Plan oben | wie dort |
