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
