# Neubau: Sicherheits- und Datenschutzprüfung

Stand: 08.11.2026. Geprüft: Repository `/home/user/bvlandingpage` (Stand der Arbeitskopie) und stichprobenartig die Live-Seite `bv-aussensysteme.de` (nur lesende Abrufe).

**Wichtig:** Das ist eine technische Bestandsprüfung, **keine Rechtsberatung**. Die rechtliche Bewertung (DSGVO, TDDDG, Drittlandübermittlung) holt der Betreiber bei einer Fachanwältin, einem Fachanwalt oder dem Datenschutzbeauftragten. Hier wird sie nur vorbereitet. Was nicht geprüft werden konnte, steht in Abschnitt 4.

Schweregrade: kritisch / hoch / mittel / niedrig. Zeilennummern beziehen sich auf den Stand der Arbeitskopie.

---

## Die drei dringendsten Punkte

1. **Cloudflare-Web-Analytics-Skript läuft auf der Live-Seite, steht aber weder im Repository noch in der Datenschutzerklärung** (F-B1). Messung: Auf `/`, `/ratgeber/` und `/werkstatt/` steckt `static.cloudflareinsights.com` im ausgelieferten HTML. Die CSP blockiert das Skript vermutlich im Browser, aber nur zufällig. Schnell zu beheben: im Cloudflare-Dashboard abschalten (oder bewusst erlauben und in die Erklärung aufnehmen).
2. **Fremde Texte landen ungeprüft im Werkstatt-Dashboard (gespeichertes XSS)** (F-A1). Jeder kann per POST an `/api/messung` Werte wie `kampagne`, `medium`, `utmQuelle` schreiben. `werkstatt/zahlen.html:914` setzt sie ohne Maskierung in `innerHTML`. Wegen `'unsafe-inline'` in der CSP läuft eingeschleuster Code in der angemeldeten Werkstatt-Sitzung.
3. **Keinerlei Rate-Limiting auf schreibenden und kostenpflichtigen Endpunkten** (F-A2): `/api/kontakt`, `/api/teilen`, `/api/messung` und die Passwortschranke. Folgen: Neon-/D1-Datenbank lässt sich füllen oder das Tageskontingent aufbrauchen (Denial of Wallet), Passwort lässt sich parallel durchprobieren.

Knapp dahinter: Google Fonts lädt ohne Einwilligung, wenn `localStorage` nicht lesbar ist (F-B3); Leaflet/OSM auf `einzugsgebiet.html` lädt ohne Einwilligung und ist in der Erklärung falsch beschrieben (F-B6).

---

## 1. Technische Sicherheit

### F-A1 Gespeichertes XSS im Werkstatt-Dashboard · hoch
- **Fundstelle:** `werkstatt/zahlen.html:914-915` (Funktion `reihe()` ab Zeile 401 setzt `name` roh ein); Quelle der Werte: `worker/index.js:1080-1088` (`quelle`, `kampagne`, `medium`, `utmQuelle`, nur Steuerzeichen entfernt und gekürzt, kein Maskieren). Die Schreibseite ist öffentlich (`worker/index.js:50`).
- **Was passieren kann:** Ein Angreifer sendet `{"seite":"/","neu":true,"kampagne":"<img src=x onerror=...>"}` an `/api/messung`. Sobald der Betreiber die Zahlenseite öffnet, läuft der Code im Ursprung der Werkstatt, mit gültigem Anmelde-Keks (HttpOnly schützt nur das Auslesen des Keks, nicht dessen Verwendung). Der Code kann die Auswertung lesen und über erlaubte Wege (z. B. `fetch` an `/api/kontakt` der eigenen Domain) ablegen oder Seiten verändern. Die `connect-src`-Liste begrenzt das Herausschicken, verhindert es aber nicht (Metricool-Wildcard, `formspree.io`, `api.web3forms.com` sind erlaubt).
- **Gegenstück, das schon stimmt:** An anderen Stellen der Seite wird `sicher()` benutzt (z. B. Zeilen 659, 815, 977). Es fehlt an dieser einen Stelle (und `x.medium`, `x.quelle` daneben).
- **Empfehlung:** Jede Ausgabe in `innerHTML` durch eine Maskierfunktion führen, am besten Standard: `reihe()` maskiert `name` selbst. Zusätzlich im Worker die Eingaben einengen: `kampagne`/`medium`/`utmQuelle` auf `[A-Za-z0-9 _.\-]` beschränken, `quelle` als Hostname prüfen. Beim Neubau: Auswertungsseite mit `textContent` bauen und `'unsafe-inline'` entfernen (siehe F-A5).

### F-A2 Kein Rate-Limiting, keine Missbrauchsbremse · hoch
- **Fundstellen:** `worker/index.js:36-56` (Routing ohne Bremse); `wrangler.jsonc` enthält kein Rate-Limit-Binding und keine WAF-Regel im Repository. `grep` nach `ratelimit` findet nichts.
- **Was passieren kann:**
  - `/api/kontakt` (Z. 171): Jede Sendung bis 50 KB landet in Neon. Gespeichert wird zusätzlich der **gesamte** Eingabe-JSON in `rohdaten` (Z. 203), mit beliebigen Schlüsseln. Bots können die Datenbank füllen und das Postfach/CRM mit Spam überfluten. Kein Captcha, kein Origin-Test, die Honeypot-Felder fangen nur dumme Bots.
  - `/api/teilen` (Z. 393): Beliebige Base64-Zeichenketten (20-6000 Zeichen) werden dauerhaft gespeichert. Die Route kann zudem bei jedem Fehlschlag DDL (`create schema`, `create table`, Z. 371) auslösen, gebremst nur durch eine In-Memory-Pause je Instanz (Z. 286). Auch `/k/<id>` (Z. 452) fragt die Datenbank bei jedem Aufruf, ohne Bremse.
  - `/api/messung` (Z. 1061): Jeder kann beliebig Zeilen schreiben. D1 hat ein Tageskontingent für Schreibvorgänge (Kommentar Z. 829: 100.000). Ein Skript kann es aufbrauchen, dann ist die echte Messung leer. Die Zahlen sind außerdem fälschbar.
  - `/api/bauteile` (Z. 529): Mit `?raster=1` liefert der Endpunkt alle lieferbaren Maße; danach lässt sich jede Kombination abfragen. Wer das automatisiert, rekonstruiert die Herstellermatrix, deren Schutz (Datenbankherstellerrecht, Kommentar Z. 479-486) der Grund für die serverseitige Auslagerung ist. Aktuell liefert der Endpunkt 503 (Live-Abruf; KV-Binding fehlt), das Risiko entsteht mit dem Einspielen.
  - Passwortschranke: siehe F-A3.
- **Empfehlung:** Cloudflare Rate-Limiting-Regeln (WAF) oder das Workers-Rate-Limit-Binding für `/api/*` und `/werkstatt*`. Für `/api/kontakt` zusätzlich Cloudflare Turnstile (datenschutzfreundlicher als Google reCAPTCHA; als Drittdienst ebenfalls in Erklärung und CSP aufnehmen) und Allowlist der Felder statt `rohdaten` mit allen Schlüsseln. Für `/api/bauteile` Kontingent je IP/Tag und Auslieferung nur für plausible Maße. Für `/api/teilen` die Struktur des Codes prüfen (gültiges Base64-JSON mit erwarteter Version), Obergrenze der Zeilenzahl, DDL nicht aus einer öffentlichen Route auslösen (Tabelle per Migration anlegen).

### F-A3 Passwortschranke `/werkstatt*` · mittel
- **Fundstelle:** `worker/index.js:606-747`.
- **Gut gelöst:** Ohne Secret ist die Seite zu (Z. 698). Vergleich in konstanter Zeit (Z. 628). Keks mit `HttpOnly; Secure; SameSite=Lax; Path=/werkstatt` (Z. 733-735). `run_worker_first` deckt `/werkstatt` und `/werkstatt/*` ab (wrangler.jsonc). Live bestätigt: `/werkstatt/` liefert die Anmeldeseite. Die zugehörigen Dateien liegen nicht offen.
- **Schwächen:**
  1. **Brute-Force:** Nur 700 ms Verzögerung je Anfrage (Z. 724), aber parallel beliebig oft, kein Sperrzähler, keine IP-Bremse. Die Stärke des Passworts ist unbekannt (Secret).
  2. **Keks = ungesalzene Passwort-Prüfsumme** (`SHA-256("bv-werkstatt:" + Passwort)`, Z. 609-614, 733). Jeder, der den Keks erlangt (Browser-Erweiterung, geteilter Rechner, Proxy-Log in Unternehmensnetzen), kann das Passwort offline mit GPU-Tempo raten, wenn es kurz ist. Außerdem ist der Keks ein dauerhafter Zugangsschlüssel: Der Server prüft nie ein Ablaufdatum (Max-Age gilt nur im Browser), es gibt keine Abmeldung. Widerruf geht nur über Passwortwechsel.
  3. **Fehlende Schutzheader auf der Anmeldeseite:** Antworten des Workers bekommen die Header aus `_headers` nicht (siehe F-A6). Die Anmeldeseite hat kein `X-Frame-Options`/CSP/HSTS (live geprüft: nur die selbst gesetzten Header). Rahmen-Einbettung (Clickjacking) ist möglich.
  4. `handleZahlen` gibt im Fehlerfall `e.message` zurück (Z. 1369), das kann Datenbankdetails zeigen. Hinter der Anmeldung, daher niedrig.
- **Empfehlung:** Zufälliges Sitzungstoken (Zufallswert, serverseitig als HMAC mit Secret signiert, mit Ablaufzeit) statt Passwort-Hash. Rate-Limit je IP. Alternativ gleich Cloudflare Access (Einmalcode/SSO) vor `/werkstatt*` schalten und die eigene Schranke entfallen lassen. Passwortlänge mindestens 16 Zeichen.

### F-A4 Eingabevalidierung und Injection gegen die Datenbank · niedrig (positiv)
- **Befund:** Alle SQL-Zugriffe sind parametrisiert: Neon über Tagged-Template (`worker/index.js:208, 297-333`), D1 über `.bind()` (Z. 998-1013, 1136-1146, 1182-1309). Tabellennamen stehen ausgeschrieben (Kommentar Z. 288-291). Die dynamische Stelle `ALTER TABLE ... + spalte` (Z. 940) nimmt nur Konstanten. Auch `/api/bauteile` begrenzt Zahlen (`zahl()`, Z. 523) und Textlängen. Kurzlinks: `/k/<id>` prüft `^[0-9A-Z]{4,16}$` (Z. 454); der gespeicherte Code ist durch die Regex `^[A-Za-z0-9_-]{20,6000}$` beim Schreiben eingegrenzt, daher ist die Weiterleitung mit `#k=` nicht für Header-/Open-Redirect-Tricks nutzbar.
- **Restpunkte (niedrig):**
  - `/api/kontakt` liest den Body vollständig (`request.text()`, Z. 178), bevor die Größe geprüft wird; ohne Content-Length hilft die Vorabprüfung nicht. Cloudflare begrenzt den Body ohnehin; trotzdem lieber `request.body` mit Zähler lesen.
  - `/api/kontakt` und `/api/teilen` prüfen keine `Origin`/`Content-Type`-Herkunft. Kein Login, daher kein klassisches CSRF; Spam-Relevanz siehe F-A2.
  - Antworten ohne `nosniff` (siehe F-A6).
  - Gespeicherte Anfragen enthalten Fremdtext. Falls das CRM (`bv-crm`, nicht Teil dieses Repos, nicht geprüft) sie als HTML anzeigt, gilt dort dasselbe XSS-Risiko wie in F-A1.

### F-A5 `'unsafe-inline'` in `script-src` · mittel (vermeidbar, aber mit Aufwand)
- **Fundstelle:** `_headers:8` (CSP), live identisch ausgeliefert.
- **Zählung im Repo (ohne `export/`, `docs/`):** 63 HTML-Dateien, **151 Inline-Skriptblöcke**, **135 Inline-Event-Handler** (`onclick=` …), 1046 `style=`-Attribute, 93 `application/ld+json`-Blöcke (die brauchen kein `unsafe-inline`). Auch `js/cookie.js` erzeugt `onclick="…"` im Banner (Z. 184-191), `js/newsletter.js:139` ebenso.
- **Bewertung:** Nötig ist `'unsafe-inline'` im Bestand, vermeidbar im Neubau. Solange es drin steht, schützt die CSP kaum gegen XSS (F-A1 wäre sonst bei Skripten durch die CSP zu stoppen). Es ist ein bestehender Schwachpunkt, kein neu entstandener.
- **Zusatz: `https://unpkg.com` in `script-src` und `style-src`** ist eine bekannte CSP-Umgehung, weil dort beliebige npm-Pakete abrufbar sind. Es wird nur wegen `einzugsgebiet.html` gebraucht (Leaflet). Die Leaflet-Dateien mit SRI-Hash sind aber bereits per cdnjs verfügbar (und in `windzonen`/`baugenehmigung` dort geladen).
- **Empfehlung für den Neubau:**
  1. Alle Skripte als Dateien (`defer`), Event-Handler per `addEventListener`.
  2. `style=`-Attribute in Klassen überführen; sonst bleibt nur `style-src 'unsafe-inline'` (deutlich geringeres Risiko als bei Skripten) oder man verwendet `style-src-attr`.
  3. Für unvermeidbare Inline-Blöcke (z. B. JSON-LD ist unkritisch) pro Antwort ein Nonce vom Worker setzen oder SHA-256-Hashes in die CSP schreiben.
  4. Leaflet selbst ausliefern (`/js/vendor/`, wie `three.min.js`), dann entfallen `unpkg.com` **und** `cdnjs.cloudflare.com` aus der CSP und aus der Datenschutzerklärung. Das ist auch die datenschutzfreundlichste Lösung (F-B6).
  5. Einführung zuerst als `Content-Security-Policy-Report-Only`, um Brüche zu sehen.
- **Hinweis zur Standing Rule:** Bis dahin keine Direktive lockern. Neue externe Skripte nur mit SRI und CSP-Passung.

### F-A6 Sicherheitsheader (`_headers`) · mittel
- **Fundstelle:** `_headers:1-9`, live gegengeprüft auf `/`.
- **Vorhanden und in Ordnung:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Cross-Origin-Opener-Policy: same-origin`, `X-Frame-Options: SAMEORIGIN` plus `frame-ancestors 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`.
- **Befunde:**
  1. **Worker-Antworten haben diese Header nicht.** `_headers` gilt nur für Dateien, die aus den Assets kommen. Live geprüft: `/api/bauteile`, `/k/ABCDEF` und die Werkstatt-Anmeldeseite liefern weder HSTS noch CSP noch `X-Frame-Options`. Betrifft auch die Sperrseite des Konfigurators (Z. 773) und die Fehlerseiten. Lösung: gemeinsame Funktion im Worker, die jede Antwort um die Standardheader ergänzt.
  2. `X-XSS-Protection: 1; mode=block` (Z. 4) ist veraltet; in alten Browsern kann es selbst Lücken erzeugen. Entfernen oder auf `0` setzen.
  3. `Permissions-Policy` (Z. 6) sperrt nur Kamera, Mikrofon, Geolokalisierung. Sinnvoll ergänzen: `payment=(), usb=(), interest-cohort=()` und was die Seite nicht braucht. Hinweis: Vor der Aufnahme von `geolocation=()` prüfen, ob eine Funktion Standort anfragt (Karte/PLZ-Suche nutzen Texteingabe, keine Standortabfrage gefunden).
  4. HSTS ohne `preload` und Laufzeit 1 Jahr: akzeptabel. `includeSubDomains` setzt voraus, dass alle Subdomains (z. B. Mail, falls vorhanden) HTTPS können. Prüfen, bevor `preload` eingetragen wird (schwer rückgängig zu machen).
  5. `img-src` enthält weder `data:` noch `blob:`. Wenn der Neubau Inline-Bilder oder Canvas-Exporte nutzt, wird er blockieren; **nicht** durch Lockerung lösen, sondern gezielt ergänzen.
  6. CSP-Breite: `https://*.metricool.com` in `img-src`/`connect-src` ist ein Wildcard auf eine ganze Domain. Wird Metricool nicht mehr gebraucht, ersatzlos streichen.
  7. Die CSP erlaubt `static.cloudflareinsights.com` **nicht**. Das ist der Grund, warum das automatisch eingefügte Skript (F-B1) im Browser vermutlich scheitert.
  8. Eine Reporting-Stelle (`report-to`/`report-uri`) fehlt; CSP-Brüche bleiben unbemerkt.

### F-A7 Secrets im Repository · niedrig (kein Geheimnis gefunden, ein Hinweis)
- **Vorgehen:** Alle versionierten Dateien (`git ls-files`, 1225 Stück, inklusive `docs/`, `audits/`, `scripts/`) nach Mustern für Datenbank-URLs mit Passwort, private Schlüssel, AWS-/GitHub-/Slack-/Stripe-Token, JWT und generische `api_key=`/`secret=`/`access_key=`-Zuweisungen durchsucht; Historie nach hinzugefügten `.env`-, `.dev.vars`-, `.pem`-Dateien. **Treffer für echte Geheimnisse: keine.** Die Datenbank-Verbindung (`ANFRAGEN_DB`) und das Werkstatt-Passwort liegen laut Code als Cloudflare-Secrets (`worker/index.js:107, 207`).
- **Öffentliche Kennungen (kein Geheimnis, aber wissen):**
  - Web3Forms-Access-Key: `js/anfrage-wizard.js:11` und `widerruf.html:153` / `src/widerruf.njk:39`. Ein solcher Schlüssel ist bei Web3Forms für den Browser vorgesehen, erlaubt aber jedem, in Ihrem Namen Mails an Ihr Postfach zu schicken (Spam-/Phishing-Zustellung an Sie, Kontingent verbrauchen). **mittel.** Empfehlung: Schlüssel im Web3Forms-Konto an die Domain binden, Turnstile/Captcha aktivieren, Versand besser über den Worker (Secret) abwickeln.
  - Formspree-Formular-ID: `js/anfrage-wizard.js:9`, `js/main.js:139`. Gleiche Überlegung, niedrig.
  - Metricool-Tracker-Hash: `js/metricool.js:28`. Öffentlich per Design.
  - Cloudflare-D1-`database_id` in `wrangler.jsonc`: Kennung, kein Zugangsschlüssel.
  - Das Web-Analytics-Token der Live-Seite steht im ausgelieferten HTML (nicht im Repo). Nicht abgedruckt.
- **Veröffentlichungsumfang (`.assetsignore`):** Wirksam; live bestätigt 404 für `/CLAUDE.md`, `/package.json`, `/worker/index.js`, `/scripts/…`, `/.claude/settings.json`, `/entwurf.html`, `/docs/…`. Nicht abgedeckt und **live offen** (200): `/scratch_dd_open.png` (Überrest, `scratch_dd_*.png` im Wurzelverzeichnis) und `/data/lastzonen_deutschland.geojson` (vermutlich gewollt, wird von den Karten-Tools genutzt, Herkunft/Lizenz prüfen). Außerdem versioniert und potenziell ausgeliefert: `entwurf*.html`, `entwurf/`, `_template.html`, `vorschau.html` (Entwürfe; `/entwurf.html` ist live 404, die Ursache habe ich nicht geklärt). Lokal vorhanden und nicht in `.assetsignore`: `export/`, `pruefbilder/`, `konfigurator-crm-export.zip`. Sie sind in `.gitignore`, aber bei einem lokalen `wrangler deploy` aus dem Arbeitsordner würden sie hochgeladen. Empfehlung: im Neubau `assets.directory` auf einen eigenen Ausgabeordner (`dist/`) setzen statt `"."`. Das beseitigt die ganze Klasse „versehentlich ausgeliefert" und macht `.assetsignore` weitgehend überflüssig.
- `.claude/settings.json` ist versioniert und erlaubt breit (`Bash(curl *)`, `Bash(git *)`, Merge/PR-Werkzeuge). Nicht öffentlich ausgeliefert, aber Betriebsrisiko für automatisierte Sitzungen. Niedrig.
- `js/newsletter.js` enthält Platzhalter-Schlüssel (`DEIN_PUBLIC_KEY`), wird von keiner Seite eingebunden, setzt aber (wenn je eingebunden) Cookies ohne Einwilligung (Z. 22-38). Datei löschen oder nicht in den Neubau übernehmen.

### F-A8 Fehlermeldungen, die zu viel verraten · niedrig
- `worker/index.js:436`: `/api/teilen` antwortet im Fehlerfall mit `{"ok":false,"schritt":"…","nr":"<Postgres-Fehlercode>"}`. Das verrät Aufbau und Fehlerzustand der Datenbank (z. B. 42501, 28P01 = Anmeldung abgelehnt). Der Kommentar (Z. 336-341) begründet das bewusst; für den Neubau: nur ins Log schreiben, nicht an Fremde ausgeben.
- Z. 414: `{"schritt":"tabelle"}` ebenso.
- Z. 533-536: `/api/bauteile` nennt „Herstellerdaten nicht verfügbar" — verrät, dass Herstellerdaten verwendet werden. Neutraler formulieren.
- Z. 1369: Werkstatt-API gibt `e.message` aus (hinter Anmeldung).
- Z. 215, 435: Fehler werden mit `console.log` protokolliert; `observability.logs` ist in `wrangler.jsonc` aktiv. Die Logs enthalten Anfrage-UUIDs und Fehlertexte, aber keine Formularinhalte. Gut. Fehlertexte von Neon können Host-/Rollennamen enthalten (Kommentar Z. 336-341 weiß das). Aufbewahrung der Worker-Logs bei Cloudflare in der Erklärung berücksichtigen.

### F-A9 Abhängigkeiten · niedrig bis mittel
Geprüft mit `npm audit` (Abruf am 08.11.2026) und `npm view`.

| Paket | installiert | aktuell | Befund |
|---|---|---|---|
| `@11ty/eleventy` | 3.1.6 | 3.1.8 | Keine eigene Meldung. Über Unterpakete 4 Meldungen **hoch** (siehe unten). |
| `clean-css-cli` | 5.6.3 | 5.6.3 | Keine Meldung. |
| `@neondatabase/serverless` | 0.10.4 | **1.2.0** | Keine Meldung in `npm audit`, aber zwei Hauptversionen zurück. Update prüfen (Treiber-API ist stabil, `neon()`-Tagged-Template bleibt). |

- Unterpakete (alle nur über Eleventy, also Bauwerkzeug, **nicht** im ausgelieferten Worker): `brace-expansion` (DoS), `js-yaml` (CPU-DoS), `liquidjs` (Ressourcenverbrauch/`ownPropertyOnly`-Umgehung), `markdown-it` (quadratische Laufzeit). Risiko nur, wenn fremde Vorlagen oder Markdown gebaut werden; hier baut der Betrieb eigene Vorlagen. Behebung: `npm update @11ty/eleventy`, danach `npm audit` erneut.
- Zur Laufzeit im Browser: Three.js liegt als `js/vendor/three.min.js` (Version nicht geprüft), Leaflet 1.9.4 mit SRI-Hashes (windzonen/einzugsgebiet/baugenehmigung). SRI ist dort gesetzt. **Bei `js/metricool.js:26` ist SRI technisch nicht möglich** (Skript wird nachgeladen und ändert sich beim Anbieter). Das ist ein Restrisiko, das nur durch Verzicht auf Metricool entfällt.
- Fremde Laufzeitabhängigkeiten, die Besucherdaten sehen: Web3Forms, Formspree, Photon (komoot), Nominatim, OSM-Kacheln, Metricool, Google Fonts.

---

## 2. Datenschutz (DSGVO / TDDDG)

### F-B1 Cloudflare Web Analytics: Skript im Live-HTML, nicht im Repository, nicht in der Erklärung · hoch
- **Messung (08.11.2026, Browser-Kennung gesetzt):** `static.cloudflareinsights.com` und `data-cf-beacon` stehen im ausgelieferten HTML von `/`, `/ratgeber/` und `/werkstatt/`; nicht gefunden auf `/datenschutz.html`, `/impressum.html`, `/einzugsgebiet.html`, `/windzonen.html` (warum es auf manchen Seiten fehlt, ist unbekannt; vermutlich Auslieferung/Cache). Im Repository kein Treffer (`cdn-cgi`, `beacon`, `cloudflareinsights`), in `datenschutz.html` ebenfalls nicht.
- **Zusätzlich:** Die Live-Antworten tragen die Header `report-to` / `nel` mit Ziel `a.nel.cloudflare.com` (Network Error Logging, `success_fraction: 0.0`, also nur bei Netzfehlern). Das ist eine weitere Cloudflare-Datenverbindung, die ebenfalls in der Erklärung fehlt. Browser senden Fehlerberichte damit an Cloudflare; geringes Risiko, aber ungenannt.
- **Was passieren kann / Bewertung:**
  - Technisch: Die CSP (`_headers:8`) erlaubt `static.cloudflareinsights.com` weder in `script-src` noch `cloudflareinsights.com` in `connect-src`. Ein CSP-konformer Browser blockiert das Skript vermutlich; es entstehen Konsolenfehler (Verstöße), aber vermutlich keine Datenübertragung. **Nicht in allen Browsern gleich garantiert; ich habe es nicht im Browser nachgestellt.** Die Verhinderung beruht auf einem Zufall der CSP, nicht auf einer Entscheidung.
  - Wird die CSP irgendwann für Cloudflare geöffnet (oder entfällt sie im Neubau), läuft eine Messung, die der Besucher nicht kennt. Cloudflare beschreibt die Messung als cookielos; ob dafür nach § 25 TDDDG eine Einwilligung nötig ist (das Skript liest Leistungsdaten des Browsers) und wie es mit Art. 13 DSGVO steht, ist rechtlich zu klären. Fest steht: Eine Verarbeitung, die nicht in der Erklärung steht, ist ein eigener Verstoß (Transparenz), gleichgültig ob sie zulässig wäre.
  - Die Messung doppelt außerdem die eigene Messung (`/api/messung`) und Metricool.
- **Empfehlung:** Im Cloudflare-Dashboard (Workers & Pages → Projekt → Metrics/Web Analytics) die automatische Einrichtung ausschalten; danach live nachmessen (kein `data-cf-beacon` mehr im HTML). Wenn man sie behalten will: Entscheidung des Betreibers, dann in Datenschutzerklärung (Abschnitt 3) aufnehmen und CSP bewusst und eng ergänzen; nicht umgekehrt. NEL ebenfalls in Abschnitt 3 nennen oder über Cloudflare-Einstellung abschalten.

### F-B2 Einwilligungsbanner `js/cookie.js` · niedrig bis mittel (überwiegend in Ordnung)
- **Gut:** Kein vorbelegter Haken (`cbExternal`/`cbAnalytics` ohne `checked`, Z. 163, 176; Kommentar Z. 171-175). Rückfall bei fehlendem Kästchen ist `false` (Z. 114). „Ablehnen" und „Nur notwendige" sind gleichwertig zu „Alle akzeptieren" (Z. 188-191). Widerruf: Fußzeilen-Link „Cookie-Einstellungen" ruft `openCookieSettings()` (`index.html:1501`, `src/_includes/layout.njk:231`), der Banner lässt sich jederzeit wieder öffnen, gespeicherte Auswahl wird vorbelegt (Z. 78-84).
- **Schwächen:**
  1. **Widerruf wirkt nicht sofort:** Ein bereits geladenes Metricool-Skript (`mc-tracker`) und bereits geladene Google-Fonts-Verknüpfung (`gfonts-loaded`) werden nach Widerruf nicht entfernt, und `rejectAll()` (Z. 104) sendet gar kein Ereignis. Bis zum nächsten Seitenaufruf läuft das Tracking weiter. **mittel.** Lösung: nach Widerruf `location.reload()` oder Skript entfernen.
  2. **Kein Nachweis der Einwilligung** (Art. 7 Abs. 1 DSGVO): Es wird nur der Wert in `localStorage`/Keks abgelegt, ohne Zeitpunkt und Banner-Version. Bei Textänderung gilt die alte Einwilligung weiter. **niedrig bis mittel.**
  3. **Banner-Text** (Z. 151-152) nennt als Beispiel nur Google Fonts. Die Kategorie „Externe Dienste" nennt „Google Fonts, Trustindex" (Z. 180); **Trustindex ist im Code nirgends eingebunden** (nur Verweislinks, `index.html:1024`), OpenStreetMap/Leaflet/Photon/Nominatim fehlen in der Beschreibung (F-B6).
  4. `role="dialog" aria-modal="true"` ohne Fokusfalle (Barrierefreiheit, nicht Datenschutz).
  5. Keks `bv_cookie_consent` wird zusätzlich zu `localStorage` gesetzt (Z. 19). Ohne `Secure`-Flag. Niedrig.
  6. Die Entscheidung für „Analyse" und „Externe Dienste" liest `js/metricool.js:10` und das Font-Skript nur aus `localStorage`; der Keks als Rückfall (Z. 30) wird dort nicht gelesen.

### F-B3 Google Fonts laden ohne Einwilligung, wenn `localStorage` nicht lesbar ist · hoch
- **Fundstelle:** `src/_includes/layout.njk:81` und `index.html:448` (`} catch(e){ loadFonts(); }`); in den erzeugten Seiten findet sich dieselbe Zeile **in 38 HTML-Dateien**.
- **Was passieren kann:** In Browsern, in denen `localStorage` eine Ausnahme wirft (Safari bei „Alle Cookies blockieren", einige private Fenster, Firefox mit deaktiviertem Speicher, eingebettete Ansichten), werden Google-Fonts-Dateien ohne Einwilligung geladen und die IP geht an Google. Das widerspricht `datenschutz.html` Abschnitt 6 (Z. 329-343: „kein Datentransfer zu Google" vor Einwilligung) und dem Kommentar im Code („nur nach Einwilligung"). Gerade datenschutzbewusste Besucher mit gesperrtem Speicher sind betroffen. Rechtlich ist das Laden von Google Fonts von Google-Servern ohne Einwilligung der Auslöser der bekannten Abmahn- und Schadensersatzfälle (LG München I, Urteil 3 O 17493/20).
- **Empfehlung:** Rückfall umdrehen (`catch` → keine Fonts laden). Besser: Schriften selbst ausliefern (`/css/fonts/` mit `font-display: swap`). Dann entfallen `fonts.googleapis.com` und `fonts.gstatic.com` aus CSP und Erklärung, und das Banner muss für Schriften nichts mehr einholen.

### F-B4 Eigene Messung `/api/messung`, Funktion `messungBesucher()` · mittel
- **Was gespeichert wird** (`worker/index.js:1019-1033`, `1136-1146`): Datum, Stunde, Zeitstempel, Art, Seitenpfad, Verweildauer, Scrolltiefe, Klick-Beschriftung (60 Zeichen), Herkunfts-Hostname, Gerät (handy/rechner), Land, Bundesland (nur DE), Browser- und Systemfamilie, utm-Felder und ein **Tageskennzeichen** `besucher`.
- **Tageskennzeichen:** Ja. SHA-256 über `Tagessalz | IP | User-Agent | Hostname`, davon die ersten 8 Byte (16 Hexzeichen). Das Salz ist eine Zufallszahl pro Tag in der Tabelle `salz` (Z. 996-1017). **IP (`cf-connecting-ip`) und User-Agent werden gelesen, aber nicht gespeichert**, auch nicht gekürzt. Die Browser-/Systemfamilie wird aus dem User-Agent abgeleitet und gespeichert (Z. 1105-1106). Der Browser-Kommentar in `js/messung.js:14-20` behauptet das Gegenteil („kein User-Agent", „kein Kennzeichen") und ist veraltet; `worker/index.js` Z. 834-860 nennt die Änderung. Veralteter Kommentar sollte nicht in den Neubau wandern.
- **Befunde:**
  1. **Löschfrist wird nicht automatisch eingehalten.** Erklärung (Abschnitt 19): „nach 400 Tagen gelöscht". Das Löschen läuft nur, wenn jemand `/werkstatt/api/zahlen` abruft (`worker/index.js:1176-1182`). Wird die Zahlenseite nicht geöffnet, bleiben Daten länger. **mittel.** Lösung: Cron-Trigger (`triggers.crons`) für eine tägliche Löschung.
  2. **Tagessalz liegt in derselben Datenbank** wie die Kennungen und wird nur beim ersten Aufruf des Folgetags gelöscht (Z. 1013). Wer Datenbankzugriff hat, kann tagsüber IP-Kandidaten gegen die Kennung prüfen (IPv4-Raum ist klein). Die Erklärung sagt zwar „ohne die geheime Zufallszahl", aber „praktisch ausgeschlossen" gilt dann nur, wenn das Salz fehlt. Für den Betrieb heißt das: Daten sind pseudonym, nicht anonym (steht in der Erklärung auch so: „pseudonym"). Besser: Salz nur im Speicher des Workers halten und bei Neustart verwerfen, oder täglich per Cron löschen.
  3. **Das Argument „§ 25 TDDDG greift nicht" ist rechtlich angreifbar.** Es wird zwar nichts auf dem Gerät gespeichert, aber `js/messung.js` liest per Skript Gerätedaten aus dem Browser: `screen.width`, `window.innerWidth/innerHeight`, `document.referrer`, Scrollposition, `location.search` (Z. 46-49, 61, 98-110, 160-170). Die Datenschutzkonferenz (Orientierungshilfe Telemedien) sieht auch das Auslesen von Informationen aus der Endeinrichtung per Skript als „Zugriff" nach § 25 Abs. 1 TDDDG. Ob die Ausnahme „unbedingt erforderlich" (§ 25 Abs. 2 Nr. 2) greift, ist bei Reichweitenmessung nach üblicher Auslegung zweifelhaft. Das ist **keine Gewissheit in die eine oder andere Richtung**; die Behauptung der Seite („Eine Einwilligung ist dafür nicht erforderlich") ist aber zu glatt. Fachperson fragen. Alternative mit weniger Angriffsfläche: Messung rein auf dem Server aus HTTP-Anfragen (Seitenaufrufe), ohne Skript, oder Messung hinter die Einwilligung „Analyse".
  4. **Erklärung sagt „fest vorgegebene Beschriftungen"** (Abschnitt 19), der Code erfasst aber den Text beliebiger `<a>`/`<button>` (bis 60 Zeichen, `js/messung.js:151-155`), und der Worker nimmt `zusatz` von jedem beliebigen Absender (Z. 1127). Ob dynamische Schaltflächen (z. B. Vorschläge der Adresssuche) Personenbezug in einen Knopftext schreiben, ist nicht geprüft; die Autovervollständigung in `baugenehmigung.html:1040` nutzt `<li>`, nicht `<button>`, und fällt damit voraussichtlich nicht darunter (Stichprobe).
  5. Fälschbar und missbrauchbar (F-A1, F-A2). Wer keine Antworten prüft, bekommt keine Fehlermeldung.
  6. Widerspruch (Art. 21): Die Erklärung sagt „wir stellen die Messung für Sie dann ab". Technisch gibt es dafür keinen Schalter für Besucher (nur den Betreiber-Abschalter im `localStorage`, `js/messung.js:30`). Ein Widerspruch müsste manuell umgesetzt werden, und ohne Personenbezug (nur Tageskennzeichen) kann man einen einzelnen Besucher gar nicht herausfiltern. Praktisch: Opt-out-Link oder DNT/GPC-Beachtung einbauen und in der Erklärung nennen.
  7. „Aus der Prüfsumme lässt sich nicht zurückrechnen": 64 Bit Prüfsumme sind für den Zweck in Ordnung.

### F-B5 `js/metricool.js` · mittel (Erklärung fehlt in einem Punkt)
- **Fundstelle:** `js/metricool.js:21-39`.
- **Was passiert:** Nur wenn `bv_cookie_consent` ein `all` oder `custom:…analytics=1` enthält (Z. 8-19) wird `https://tracker.metricool.com/resources/be.js` per `<script>` angehängt (Z. 26) und `beTracker.t({hash: …})` aufgerufen (Z. 28). Bei Ablehnen/Nur notwendig/keiner Entscheidung: nichts, kein Aufruf. Beim ersten Einwilligen lädt es sofort (`bv_consent_given`, Z. 36). Das ist sauber gebaut.
- **Offen:**
  1. **Was `be.js` im Browser tut (Keks, Fingerprint, Datenfluss), kann aus dem Repository nicht gelesen werden**, und kein SRI ist möglich (Quelle ändert sich). Die Erklärung sagt „IP-Adresse (gekürzt)", „anonymisiert" (Abschnitt 17): Das ist eine Behauptung des Anbieters, die hier nicht nachgeprüft ist. Die Formulierung „anonymisierte Analyse" ist bei Einwilligungsbasis trotzdem unscharf.
  2. **Metricool fehlt in der AVV-Liste** (`datenschutz.html:549-596`, Abschnitt 15), obwohl er Daten im Auftrag verarbeitet. Zu klären: Vertrag vorhanden?
  3. Drittlandübermittlung nicht angesprochen (Metricool ist spanisch, setzt aber ggf. US-Unterauftragsverarbeiter ein). Fachperson fragen.
  4. In den Betreiber-Dokumenten steht, dass in der Werkstatt Aufrufe mitgezählt wurden (`js/messung.js:21-24`); `metricool.js` ist per `scripts/baue-werkstatt.js` dort vermutlich nicht entfernt (nicht geprüft).

### F-B6 Karten und andere Dienste, die ohne Banner laden · hoch
- **Befund:** Die Einwilligungskategorie „Externe Dienste" steuert **nur** Google Fonts. Alle anderen Fremdverbindungen sind nicht damit verknüpft:
  - `einzugsgebiet.html:207-209` lädt `leaflet.css/js` von **unpkg.com** beim Seitenaufruf; `einzugsgebiet.html:432` fordert sofort Kacheln von `*.tile.openstreetmap.org`. Beides geschieht ohne Nutzeraktion und ohne Einwilligung. Die Datenschutzerklärung (Abschnitt 7, Z. 348-383) nennt **diese Seite nicht** und **unpkg.com nirgends**; sie behauptet: „die Verbindung wird erst beim Nutzen des jeweiligen Tools aufgebaut".
  - `windzonen.html:477-478, 1010`: Leaflet von cdnjs beim Seitenaufruf (nicht erst beim Nutzen), außerdem `dns-prefetch` auf Photon und Nominatim. Kacheln erst bei Initialisierung der Karte (`windzonen.html:1083`; Auslöser nicht geprüft).
  - `baugenehmigung.html:1081-1103`: Leaflet wird erst bei Bedarf nachgeladen (Lazy-Loader), das passt zur Erklärung.
  - Adresssuche (Photon, Nominatim): sendet Texteingaben des Besuchers an Dritte (`baugenehmigung.html:1067, 1480, 1539`; `windzonen.html:1335, 1355`); in der Erklärung erwähnt, die Eingabe ist freiwillige Handlung des Besuchers.
- **Was passieren kann:** IP-Adresse (und Referrer, Browserkennung) gehen bei Seitenaufruf an unpkg.com bzw. OSM/cdnjs. Das ist derselbe Mechanismus wie bei Google Fonts, bei dem die Rechtsprechung Einwilligung oder tragfähiges berechtigtes Interesse verlangt. Ob Art. 6 Abs. 1 lit. f hier trägt (OSM ist deutlich unproblematischer als Google), ist Rechtsfrage; falsch beschrieben ist es jedenfalls.
- **Empfehlung:** Leaflet selbst ausliefern (entfernt unpkg/cdnjs vollständig). Kacheln erst nach Klick auf „Karte laden" (Zwei-Klick-Lösung) oder hinter die Einwilligung „Externe Dienste" stellen; Einwilligungstext um Karten ergänzen; Erklärung für `einzugsgebiet.html` ergänzen. Alternativ eigene Kartengrafik/Vektorbild ohne Fremdverbindung.

### F-B7 Weitere Weitergaben bei Formularversand · mittel
- **Fundstelle:** `js/anfrage-wizard.js:9-11, 1516-1535`; `js/main.js:139`; `widerruf.html:153`.
- **Befund:** Eine Anfrage geht auf drei Wegen: eigene Neon-Datenbank (`/api/kontakt`), Web3Forms (primär), Formspree (Rückfall, bei Fehlschlag **zusätzlich** an US-Anbieter). Die Erklärung (Abschnitt 4 und 15) nennt alle drei; Formspree als „DPF-zertifiziert". Offen:
  - Für Web3Forms nennt die Erklärung weder Sitz noch Rechtsgrundlage der Übermittlung noch Drittlandgarantie. Für Neon (US-Gesellschaft, Serverstandort laut Erklärung Frankfurt) fehlt jede Aussage zu Zugriff durch das Mutterunternehmen/SCC. **Serverstandort Frankfurt ist aus dem Repository nicht prüfbar** (Verbindungsstring ist Secret).
  - Der erste Satz „Diese Daten geben wir nicht ohne Ihre Einwilligung weiter" (Abschnitt 4) steht im Widerspruch zum Absatz darunter (Weitergabe an Dienste). Als Auftragsverarbeiter ist das zulässig; der Satz sollte es sagen.
  - Löschung „nach vollständiger Bearbeitung": Im Code existiert **keine Löschroutine** für `anfragen` (nur manuell). Auch Aufbewahrungsfristen (Angebote/Handelsbriefe, steuerlich bis zu 6 bzw. 10 Jahre) stehen in Spannung zu „gelöscht"; Fachperson/Steuerberater.
  - `rohdaten` (Z. 203) speichert alle Felder unverändert, auch Felder, die nicht in der Erklärung stehen (z. B. Konfigurator-Zusammenfassung, Adressteile). Datensparsamkeit: nur benötigte Felder speichern.
  - Die Anfrage geht ohne Einwilligungskasten ab (Art. 6 Abs. 1 lit. b, vertragsanbahnend). Ein sichtbarer Hinweis auf die Datenschutzerklärung am Formular gehört dazu (Art. 13); Vorhandensein am Formular nicht geprüft.

### F-B8 Kurzlinks `/api/teilen` · niedrig
- Die Erklärung (Abschnitt 18) sagt, es würden nur Maße, Farbe, Eindeckung, Ausstattung gespeichert. Der Server prüft das nicht (nur Zeichensatz und Länge). Jeder kann beliebigen Inhalt ablegen, auch Personenbezogenes; der Betreiber ist dann Speichernder. Ein Konfigurator-Code enthält laut `js/konfigurator-3d.js:16690-16720` ein JSON mit Feldern (`d.f`), aber der Worker validiert es nicht. Kurzlinks sind mit 6 Zeichen aus 30 Symbolen erratbar (ca. 7·10^8); Inhalt ist harmlos, solange die Regel eingehalten wird. Keine Löschfrist im Code (Erklärung: „solange der Link funktionieren soll").

### F-B9 Weitere Beobachtungen
- Cookie/Storage-Inventar laut Code: `bv_cookie_consent` (localStorage + Keks), `bv_messung_aus` (nur Betreiber), Werkstatt-Keks `bv_werkstatt` (nur nach Anmeldung). Die Erklärung (Abschnitt 11) nennt nur „Cookie-Einstellungen". Genauere Angabe (Name, Zweck, Dauer 365 Tage) fehlt. Niedrig.
- Server-Logs: Erklärung Abschnitt 2 behauptet „IP-Adresse (anonymisiert)" in Logfiles. Der Worker schreibt selbst keine IP-Logs; wie Cloudflare protokolliert, steht nicht im Code. Die Aussage „anonymisiert" ist hier **nicht belegbar** und sollte entweder von Cloudflare-Einstellungen gedeckt oder entfernt werden.
- Impressum/Plattformhinweise nicht Teil dieser Prüfung.

---

## 3. Abweichungen `datenschutz.html` ↔ Code (einzeln)

| Nr. | Erklärung (Abschnitt, Zeile) | Code/Realität | Schwere |
|---|---|---|---|
| D1 | Abschnitt 3 (Z. 231-250): Cloudflare nur als Hosting/CDN/DNS | Cloudflare Web Analytics wird live ins HTML eingefügt (`static.cloudflareinsights.com`), NEL-Header an `a.nel.cloudflare.com` (F-B1) | hoch |
| D2 | Abschnitt 6 (Z. 329-343): Google Fonts „erst nach Einwilligung … kein Datentransfer zu Google" | Rückfall `catch(e){ loadFonts(); }` lädt ohne Einwilligung (`layout.njk:81`, `index.html:448`, 38 Seiten) (F-B3) | hoch |
| D3 | Abschnitt 7 (Z. 348-383): Karte nur auf Wind-/Schnee- und Baugenehmigungs-Seite; „Verbindung erst beim Nutzen" | `einzugsgebiet.html` lädt Leaflet von **unpkg.com** und OSM-Kacheln sofort; `windzonen.html` lädt Leaflet (cdnjs) beim Aufruf; unpkg.com nirgends genannt (F-B6) | hoch |
| D4 | Abschnitt 19 (Z. 658-): Löschung nach 400 Tagen | Löschung läuft nur beim Abruf der Zahlenseite (`worker/index.js:1176-1182`) (F-B4.1) | mittel |
| D5 | Abschnitt 19: „fest vorgegebene Beschriftungen unserer eigenen Bedienelemente" | Text jedes `<a>`/`<button>` (60 Zeichen) wird übertragen; Worker nimmt `zusatz` ungeprüft von jedem Absender (`js/messung.js:151-155`, `worker/index.js:1127`) | mittel |
| D6 | Abschnitt 19: „Es werden … keine Informationen … von dort ausgelesen … § 25 TDDDG findet nicht statt" | `js/messung.js` liest Bildschirm-/Fenstergröße, Referrer, Scrollposition, URL-Parameter per Skript (F-B4.3) | mittel |
| D7 | Abschnitt 19: „Sie können widersprechen … wir stellen die Messung für Sie dann ab" | Kein technischer Weg dafür für Besucher; einzelner Besucher nicht auffindbar (F-B4.6) | niedrig |
| D8 | Abschnitt 19: „Zufallszahl geheim, Rückrechnung praktisch ausgeschlossen" | Salz liegt in der Betreiber-Datenbank (Tabelle `salz`) bis zum nächsten Tageswechsel (F-B4.2) | niedrig |
| D9 | Abschnitt 17 (Z. 612-628): Metricool, „anonymisierte Analyse", „IP gekürzt" | Unprüfbar (Fremdskript, kein SRI); Metricool fehlt in AVV-Liste Abschnitt 15 (F-B5) | mittel |
| D10 | Abschnitt 4 (Z. 252-): „Diese Daten geben wir nicht ohne Einwilligung weiter" | Weitergabe an Neon, Web3Forms, Formspree im folgenden Absatz selbst genannt; widersprüchlich formuliert. Rückfall-Weg Formspree sendet zusätzlich in die USA (F-B7) | niedrig |
| D11 | Abschnitt 4: „nach vollständiger Bearbeitung gelöscht" | Keine Löschroutine im Code für `anfragen`; `rohdaten` speichert alle Felder (F-B7) | mittel |
| D12 | Abschnitt 2 (Z. 208-): „IP-Adresse (anonymisiert)" in Server-Logfiles | Nicht aus dem Code belegbar | niedrig |
| D13 | Abschnitt 9 (Z. 397-): Trustindex-Widget „sofern eingebunden"; `cookie.js:180` nennt Trustindex als externen Dienst | Kein Widget im Code, nur Link `index.html:1024`. Banner nennt einen Dienst, der nicht geladen wird | niedrig |
| D14 | Abschnitt 11 (Z. 444-): Cookies „z. B. Cookie-Einstellungen" | Tatsächlich zusätzlich localStorage-Eintrag; Bezeichnung und Dauer (365 Tage) nicht genannt (F-B9) | niedrig |
| D15 | Abschnitt 18 (Z. 629-): „ausschließlich die Planung" | Server prüft nur Zeichensatz/Länge; beliebiger Inhalt speicherbar (F-B8) | niedrig |
| D16 | Abschnitt 15 (Z. 549-): Drittlandübermittlung bei Neon/Web3Forms/Metricool | Keine Angabe zu Garantien; Standort Neon (Frankfurt) nicht aus Repo prüfbar | mittel |

Übereinstimmungen, die ich im Code bestätigt habe: Tageskennzeichen aus Salz+IP+Browserkennung+Domain, IP/User-Agent nicht gespeichert (D1-Spalten enthalten kein Feld dafür), Land/Bundesland aus `request.cf`, nur Pfad ohne Parameter (`messungSeite`), nur drei utm-Felder, Browser-/Systemfamilie ohne Version, Metricool erst nach Einwilligung, Kurzlinks ohne IP-Speicherung.

---

## 4. Nicht geprüft / Grenzen

- **Live-Verhalten im Browser** (CSP-Blockade des Cloudflare-Skripts, Netzwerk-Panel, tatsächliche Keks-Setzung von Metricool) nicht gemessen; nur Quelltext und HTTP-Antworten.
- Cloudflare-Dashboard-Einstellungen (WAF, Rate-Limits, Web Analytics, Logs, Zugriffsregeln), Neon-Projekt (Region, Rollen, Backups), D1-Inhalt, CRM `bv-crm` und `bv-crm`-Anzeige von Anfragen nicht eingesehen.
- Stärke des Werkstatt-Passworts und des Datenbankpassworts unbekannt.
- Rechtliche Bewertung (Einwilligungspflicht, Drittland, Aufbewahrung) nicht Teil dieser Prüfung.
- Keine aktiven Angriffsversuche auf die Live-Seite (insbesondere kein Last- oder Brute-Force-Test), nur wenige lesende Abrufe.

## 5. Mitzunehmen in den Neubau (Kurzliste)

1. Ausgabeordner `dist/` statt `"."` als Asset-Verzeichnis.
2. Eine Worker-Funktion, die jeder Antwort die Sicherheitsheader gibt; Nonce/Hashes statt `'unsafe-inline'`; kein unpkg.
3. Rate-Limits auf allen `/api/*`-Routen und der Werkstatt; Turnstile für das Kontaktformular; Feld-Allowlist statt `rohdaten`.
4. Werkstatt: Cloudflare Access oder signierte Sitzung mit Ablauf; Ausgaben immer maskieren.
5. Schriften und Leaflet selbst ausliefern; Kartenkacheln erst nach Klick; Einwilligungsbanner ehrlich auf das beschränken, was wirklich geladen wird; Fehlerfall von `localStorage` = nichts laden.
6. Cron für Löschfristen (Messung, Anfragen, Kurzlinks); Salz nicht in die Datenbank.
7. Erklärung und Code zusammen ändern; Prüfskript, das jeden Host im Code mit der Erklärung abgleicht.
8. Cloudflare Web Analytics abschalten oder bewusst aufnehmen.
9. Abhängigkeiten aktualisieren (`@neondatabase/serverless` 1.x, Eleventy 3.1.8).
