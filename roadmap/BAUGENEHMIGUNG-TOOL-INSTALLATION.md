# 🏛️ Baugenehmigung-Checker – Installationsanleitung
**Version 1.0** | BV AussenSysteme | 2026-06-24

---

## Enthaltene Dateien

```
bv-aussensysteme/
├── baugenehmigung.html           ← Hauptseite (komplettes Tool)
├── js/
│   └── baugenehmigung-data.js    ← LBO-Daten alle 16 Bundesländer
├── sitemap.xml                   ← baugenehmigung.html eingetragen
└── llms.txt                      ← KI-Sichtbarkeit ergänzt
```

---

## Deploy auf bv-aussensysteme.de (Standard)

```
1. ZIP auf GitHub hochladen (baugenehmigung.html + js/baugenehmigung-data.js
   + sitemap.xml + llms.txt + alle Footer-Seiten)
2. Cloudflare → Caching → Purge Everything
3. Fertig: https://www.bv-aussensysteme.de/baugenehmigung.html
```

---

## Einbettung als iFrame (für Nicepage oder andere CMS)

```html
<!-- In Nicepage HTML-Block einfügen: -->
<iframe
  src="https://www.bv-aussensysteme.de/baugenehmigung.html"
  width="100%"
  height="900px"
  style="border:none; border-radius:12px;"
  loading="lazy"
  title="Baugenehmigung prüfen">
</iframe>
```

Höhe ggf. auf `1200px` für mobile Ansicht anpassen.

---

## Optionale KI-Erweiterung (Claude API)

Das Tool unterstützt optional KI-gestützte Erläuterungen via Claude API.

### Aktivierung:
1. Anthropic-Account anlegen: https://console.anthropic.com
2. API Key erzeugen (Free Tier: 5$/Monat Guthaben kostenlos)
3. In `baugenehmigung.html` ganz oben im Script-Block:
   ```javascript
   var BG_CONFIG = {
     claudeApiKey: 'sk-ant-api03-DEIN-KEY-HIER',
   };
   ```

**Kosten**: ~0,003$ pro Suchanfrage mit claude-sonnet-4-6 → bei 100 Anfragen/Monat = 0,30$

### Alternative kostenfreie KI-APIs:
| Anbieter | Modell | Free Tier |
|---|---|---|
| Google Gemini | gemini-1.5-flash | 15 RPM kostenlos |
| OpenRouter | mistral-7b | viele kostenlose Modelle |
| Groq | llama-3-8b | 14.400 RPM kostenlos |

Für Gemini den `claudeApiKey` leer lassen und separaten Gemini-Block ergänzen.

---

## SEO-Keywords die das Tool abdeckt

- Baugenehmigung Terrassenüberdachung
- Carport Genehmigung [Bundesland]
- Bauamt Terrassenüberdachung
- Terrassendach Genehmigung Rheinland-Pfalz
- Carport Genehmigung Westerwald
- Baugenehmigung Kaltwintergarten
- Glasschiebewand Genehmigung
- LBO [Bundesland] Überdachung
- Verfahrensfreie Bauvorhaben [Bundesland]

---

## Datenqualität & Wartung

- **LBO-Daten**: Alle 16 Bundesländer in `js/baugenehmigung-data.js`
- **Aktualität**: Landesbauordnungen ändern sich selten (alle 5–10 Jahre)
- **Wartung**: Bei Gesetzesänderung nur `baugenehmigung-data.js` anpassen
- **Bauamt-Daten**: Westerwald-Kreise vollständig, andere generisch
- **Geocoding**: Photon (komoot.io) + Nominatim Fallback – kostenlos, DSGVO-konform

---

## DSGVO-Hinweis

Das Tool sendet:
- Sucheingabe → Photon API (photon.komoot.io) – Datenschutz: https://www.komoot.de/privacy
- Als Fallback: Nominatim (nominatim.openstreetmap.org) – Datenschutz: https://osmfoundation.org/wiki/Privacy_Policy
- Optional bei aktivierter KI: Sucheingabe + Bundesland → Anthropic API

**Empfehlung**: In der Datenschutzerklärung erwähnen:
> „Das Baugenehmigung-Tool nutzt Photon (Komoot GmbH) und OpenStreetMap Nominatim
> zur Adressauflösung. Es werden keine personenbezogenen Daten gespeichert."

---

## Verbesserungen für spätere Premium-Version

- [ ] Eigene Bauamt-Datenbank für alle 400+ deutschen Landkreise
- [ ] Direkte Links zu Online-Bauantragsformularen pro Kreis
- [ ] Ansprechpartner-Datenbank (Name, Durchwahl) pro Bauamt
- [ ] Automatische Aktualitätsprüfung der LBO-Daten via API
- [ ] PDF-Export des Ergebnisses
- [ ] Mehr Produktkategorien (Zäune, Teiche, Solaranlagen)
- [ ] B-Plan-Abfrage via WMS-Dienste der Kommunen
- [ ] Benutzer-Konto für gespeicherte Suchanfragen
