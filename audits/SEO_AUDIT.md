# 🔍 SEO AUDIT — BV AussenSysteme
**Agent**: SEO Specialist | **Stand**: 04.07.2026

## Overall Score: A- (88/100) — Fortschritt seit 24.06., ein neuer Fund

### Technische SEO: A
| Kriterium | Status | Detail |
|---|---|---|
| Canonical Tags | ✅ | 100% der indexierbaren Seiten |
| hreflang | ✅ | de + x-default auf index.html |
| Sitemap | ✅ | aktuell |
| robots.txt | ✅ | KI-Crawler explizit erlaubt |
| llms.txt / llms-full.txt | ✅ | vorhanden |
| Schema.org LocalBusiness | ✅ | index.html vollständig |
| Schema.org FAQPage | ✅ | vorhanden |
| Schema.org HowTo | ✅ | Ablauf-Sektion |
| Schema.org aggregateRating | ✅ **aktiviert** | `ratingValue: 5.0`, `reviewCount: 1` — im PROJEKTSTAND noch fälschlich als offen (P0) geführt |
| HTTPS | ✅ | Cloudflare Always HTTPS |
| Mobile-friendly | ✅ | Responsive, viewport korrekt |

### On-Page SEO: A-
- Lokale Landingpages (Montabaur, Neuwied, Koblenz, Altenkirchen): je 650–670 Wörter ✅ deutlich über dem 500-Wörter-Ziel
- Vormals zu kurze Produktseiten (velaris, faltdach, bushaltestelle, fahrradueberdachung, gartenhaus): jetzt alle 700+ Wörter ✅ — Content-Ausbau ist erfolgt
- Blog/Ratgeber: 5 Artikel vorhanden (aluminium-terrasse-pflegen, baugenehmigung-terrassenueberdachung, carport-oder-garage, pergola-kaufen-ratgeber, terrassenueberdachung-kosten) ✅

### Schema.org `Product`: 16 von 20 Seiten unter `produkte/`
| Seite | Status |
|---|---|
| `balkonueberdachung.html` | ❌ fehlt noch |
| `sonnenschutz-beschattung.html` | ❌ fehlt noch |
| `eingang.html` (aktuelle Seite) | ✅ vorhanden |
| `_template.html` | – (kein echter Content, Template) |

### 🔴 Neu gefunden: Verwaiste Fehlkodierungs-Datei im Repo
- **Problem**: `produkte/eingangs├╝berdachung.html` (Dateiname doppelt-UTF-8-kodiert, korrekt wäre „eingangsüberdachung") liegt im Repo, ist aber **nirgends verlinkt und nicht in der Sitemap** — vermutlich Überbleibsel eines fehlgeschlagenen Rename zu `eingang.html`
- **Auswirkung**: Kein direkter SEO-Schaden (nicht indexiert, da nicht verlinkt), aber Repo-Müll und Verwechslungsgefahr
- **Lösung**: Datei löschen (Inhalt ist durch `eingang.html` bereits abgedeckt) — Rückfrage an dich vor dem Löschen, da Datei-Löschungen bewusst nicht automatisch gemacht werden

### Keyword-Chancen (weiterhin offen)
| Keyword | Potenzial | Empfohlene Seite |
|---|---|---|
| Pergola motorisiert RLP | 🟡 Mittel | pergola.html ausbauen |
| Kosten Carport 2026 | ✅ erledigt | `ratgeber/carport-oder-garage.html` deckt das ab |
| Backlinks | 🔴 Hoch, weiterhin offen | hwk-koblenz.de, baulinks.de, lokal.de, westerwald-info.de |

### Offene SEO-Aufgaben
- [ ] Schema.org `Product` auf `balkonueberdachung.html` und `sonnenschutz-beschattung.html` ergänzen
- [ ] Verwaiste Datei `produkte/eingangs├╝berdachung.html` löschen (nach Rückfrage)
- [ ] Backlinks von: hwk-koblenz.de, baulinks.de, lokal.de, westerwald-info.de
- [ ] Google Business: Posts, Fotos, Q&A regelmäßig befüllen
- [ ] PROJEKTSTAND.md P0-Punkt "aggregateRating aktivieren" abhaken (ist bereits live)

---
*SEO Specialist Agent | Nächste Überprüfung: monatlich*
