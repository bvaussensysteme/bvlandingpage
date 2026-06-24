# 🔒 SECURITY AUDIT — BV AussenSysteme
**Agent**: Security Architect + AppSec Engineer | **Stand**: 24.06.2026

## Overall Status: B+ (gut, ein offener Punkt)

### ✅ Bestanden
| Check | Status | Detail |
|---|---|---|
| X-Frame-Options | ✅ SAMEORIGIN | _headers korrekt |
| X-Content-Type-Options | ✅ nosniff | _headers korrekt |
| Referrer-Policy | ✅ strict-origin | _headers korrekt |
| HSTS | ✅ max-age=31536000 | inkl. includeSubDomains |
| Permissions-Policy | ✅ | camera/mic/geo gesperrt |
| Content-Security-Policy | ✅ | 24.06.2026 ergänzt |
| HTTPS erzwungen | ✅ | Cloudflare Always HTTPS aktiv |
| Keine API-Keys im Code | ✅ | Scan: kein Treffer |
| DSGVO Cookie-Consent | ✅ | Vor Google Fonts geladen |
| Formspree HTTPS | ✅ | POST via HTTPS |
| Leaflet SRI-Hash | ✅ | 24.06.2026 ergänzt |

### 🟡 Offene Punkte (Medium)
| # | Problem | Auswirkung | Lösung |
|---|---|---|---|
| 1 | Auskommentierte externe Scripts (elfsight, trustindex) im HTML | Bei Aktivierung ohne Review: XSS-Risiko | Vor Aktivierung: SRI-Hash ergänzen |
| 2 | Formular kein CSRF-Token | Formspree handhabt das, aber keine eigene Absicherung | Formspree Honeypot-Feature aktivieren |
| 3 | `unsafe-inline` in CSP (script-src) | Notwendig wegen Inline-JS, aber XSS-Risiko | Langfristig: Nonces oder externe Skript-Dateien |

### Empfehlungen (Priorität)
1. **Sofort**: Formspree Honeypot-Feld im Kontaktformular aktivieren (Anti-Spam)
2. **Kurzfristig**: Inline-JS in externe Dateien auslagern → CSP verschärfen
3. **Mittelfristig**: Bei Trustindex-Integration SRI-Hash der eingebundenen CDN-Datei prüfen

---
*Security Architect Agent | Nächste Überprüfung: bei jeder neuen externen Integration*
