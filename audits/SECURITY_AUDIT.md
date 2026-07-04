# 🔒 SECURITY AUDIT — BV AussenSysteme
**Agent**: Security Architect + AppSec Engineer | **Stand**: 04.07.2026

## Overall Status: B- (zwei zuvor als "erledigt" markierte Punkte fehlen tatsächlich im Code)

> ⚠️ Diese Prüfung wurde gegen den echten Quellcode verifiziert (nicht nur gegen die Doku). Zwei Punkte, die im Stand vom 24.06.2026 als ✅ geführt wurden, sind **nicht vorhanden**.

### ✅ Bestanden (verifiziert)
| Check | Status | Detail |
|---|---|---|
| X-Frame-Options | ✅ SAMEORIGIN | `_headers` Zeile 2 |
| X-Content-Type-Options | ✅ nosniff | `_headers` Zeile 3 |
| Referrer-Policy | ✅ strict-origin-when-cross-origin | `_headers` Zeile 5 |
| HSTS | ✅ max-age=31536000 | inkl. includeSubDomains |
| Permissions-Policy | ✅ | camera/mic/geo gesperrt |
| HTTPS erzwungen | ✅ | Cloudflare Always HTTPS aktiv |
| Keine API-Keys/Secrets im Code | ✅ | Scan über alle .html/.js: kein Treffer (EmailJS-Key in `js/newsletter.js` bewusst noch nicht konfiguriert) |
| DSGVO Cookie-Consent | ✅ | Google Fonts laden erst nach `bv_consent_given` Event |
| Formspree HTTPS | ✅ | POST via HTTPS, `_gotcha`-Honeypot aktiv (`js/main.js:96`) |
| Kontaktformular Pflichtcheckbox Datenschutz | ✅ | `required` gesetzt |

### 🔴 Neu gefunden — Diskrepanz Doku vs. Code
| # | Problem | Auswirkung | Lösung |
|---|---|---|---|
| 1 | **Content-Security-Policy existiert nicht** — weder als Meta-Tag noch in `_headers`, obwohl als "24.06.2026 ergänzt" dokumentiert | Kein Schutz gegen XSS/Script-Injection über CSP-Layer | CSP in `_headers` ergänzen, siehe Vorschlag unten |
| 2 | **Kein SRI-Hash (`integrity=`) auf Leaflet CDN-Includes** — `windzonen.html` hat nur `crossorigin`, `einzugsgebiet.html` gar keins von beidem | Kompromittiertes CDN könnte unbemerkt Schadcode injizieren | `integrity="sha384-…"` für `leaflet.js`/`leaflet.css` ergänzen (Hash von unpkg/cdnjs beziehen) |

### 🟡 Offene Punkte (Medium, unverändert seit 24.06.)
| # | Problem | Auswirkung | Lösung |
|---|---|---|---|
| 3 | Auskommentierte externe Scripts (elfsight, trustindex) im HTML | Bei Aktivierung ohne Review: XSS-Risiko | Vor Aktivierung: SRI-Hash ergänzen |
| 4 | `einzugsgebiet.html` lädt Leaflet von `unpkg.com`, restliche Seiten von `cdnjs.cloudflare.com` | Uneinheitlich, zwei Vertrauensanker statt einem | Auf eine CDN-Quelle vereinheitlichen |

### Empfehlungsvorschlag CSP (noch nicht geprüft/deployt)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com app.cal.com; style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; img-src 'self' data: unpkg.com *.tile.openstreetmap.org; connect-src 'self' formspree.io nominatim.openstreetmap.org photon.komoot.io; frame-src app.cal.com;
```
(Muss vor Live-Schaltung gegen alle eingebundenen Drittanbieter getestet werden — Wind-/Baugenehmigungs-Tools nutzen Nominatim/Photon/OSM-Tiles.)

### Empfehlungen (Priorität)
1. **Sofort**: CSP-Header in `_headers` ergänzen und gegen alle Tools (windzonen.html, baugenehmigung.html, einzugsgebiet.html, Cal.com-Embed) testen
2. **Sofort**: SRI-Hash für Leaflet CDN-Includes ergänzen
3. **Kurzfristig**: Inline-JS in externe Dateien auslagern → CSP ohne `unsafe-inline` möglich
4. **Mittelfristig**: Bei Trustindex-Integration SRI-Hash der eingebundenen CDN-Datei prüfen

---
*Security Architect Agent | Nächste Überprüfung: nach CSP-Deployment*
