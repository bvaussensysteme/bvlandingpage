# Fallen, die schon Zeit gekostet haben

Stand 31.10.2026. Aus `docs/NEXT_TASK.md` ausgelagert. **Vor dem Anfangen
einmal überfliegen** — jeder Eintrag hat echte Zeit gekostet.

### Ein fehlgeschlagener Cloudflare-Bau ist oft nur ein Aussetzer *(31.10.2026)*

Am 31.10.2026 stand der Bau von PR #500 auf **Failed nach 4 Sekunden**, und
der neue Stand kam nicht live. Ich habe daraus zu früh „die Veröffentlichung
hängt" geschlossen — falsch. Der Betreiber hat in Cloudflare auf die drei
Punkte → **Retry build** gedrückt; derselbe Stand, keine Änderung, zweiter
Versuch erfolgreich.

**Faustregel:** Bei **Failed** zuerst einmal *Retry build*. Läuft es dann
durch, war es ein Aussetzer beim Starten der Bauumgebung — dazu passen auch
die wenigen Sekunden, in denen ein echter Baufehler gar nicht entstehen kann.
Erst wenn **derselbe Stand zweimal** scheitert, lohnt das Protokoll.

**Und für den Assistenten:** Nicht aus „noch nicht live" auf „Pipeline kaputt"
schließen. In der Liste unter *Workers & Pages → bvlanding → Deployments*
steht, welcher Bau rot ist und welcher gerade die aktive Version stellt — das
ist die Antwort, nicht das Abfragen der Website von außen.


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

