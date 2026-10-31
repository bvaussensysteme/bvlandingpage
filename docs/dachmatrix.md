# Herstellerdaten im Konfigurator (DACHMATRIX)

Stand 31.10.2026. Aus `docs/NEXT_TASK.md` ausgelagert. Gebaut und geprüft;
es fehlt nur der KV-Namensraum, der Cloudflare-Zugang braucht.

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

