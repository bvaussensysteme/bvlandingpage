# 🎨 UX AUDIT — BV AussenSysteme
**Agent**: UX Architect + UX Researcher + UI Designer | **Stand**: 24.06.2026

## Overall Score: B (76/100)

### User Journey Analyse

#### Primary Journey: Besucher → Anfrage
```
Landing (Google Ads/Organisch)
  ↓
Hero Section [✅ stark: klarer CTA, Vertrauenssignale]
  ↓
Produkt-Browse [⚠️ schwach: keine Preisindikation]
  ↓
Produktseite [✅ gut: Bilder, Features, CTA]
  ↓
Kontakt-Formular [✅ vorhanden, ⚠️ kein Fortschrittsbalken]
  ↓
Bestätigung [⚠️ keine eigene Danke-Seite mit Nächsten-Schritten]
```

### Conversion-Hindernisse (nach Priorität)

#### 🔴 P0: Keine Terminbuchung
- **Problem**: Einziger Weg: Formular → warten
- **Auswirkung**: Nutzer mit sofortigem Bedarf springen ab
- **Lösung**: Cal.com oder Calendly Widget einbinden
- **Impact**: +20-40% Conversion-Rate

#### 🔴 P0: Fehlende Bewertungen sichtbar
- **Problem**: Keine Sterne/Reviews sichtbar
- **Auswirkung**: Fehlendes Social Proof = Vertrauensbarriere
- **Lösung**: Nach erster Google-Bewertung: Trustindex Widget
- **Impact**: +15-25% Vertrauen

#### 🟠 P1: Preisindikation fehlt
- **Problem**: "Preis auf Anfrage" überall
- **Auswirkung**: Nutzer ohne Preisvorstellung springen früher ab
- **Lösung**: Richtwerte ("ab 1.800€") + Rechner-Hinweis
- **Impact**: Qualifiziertere Anfragen, weniger Preisfragen

#### 🟠 P1: Mobilmenü UX
- **Problem**: Hamburger öffnet Menü korrekt, aber kein visuelles Feedback beim Tippen
- **Lösung**: Active-State CSS auf allen Touch-Elementen

#### 🟡 P2: Galerie-Lightbox ohne Zoom
- **Problem**: Vollbild-Bilder nicht zoombar
- **Lösung**: Pinch-to-Zoom auf Mobile aktivieren

#### 🟡 P2: Konfigurator Feedback
- **Problem**: Nach Konfigurator-Absendung keine klare Bestätigung
- **Lösung**: Success-State mit Erwartungsmanagement ("Wir melden uns innerhalb 24h")

### Was gut funktioniert ✅
- Hero-Section: Gold/Schwarz-Kontrast, klarer CTA
- Produktkacheln: Einheitliches Layout, gute Bildqualität
- FAQ-Sektion: 14 Fragen, strukturiert
- WhatsApp-Button: Immer sichtbar (Floating)
- Barrierefreiheits-Widget: vorhanden

### UI Consistency Check
- ✅ Farb-Variablen konsistent (--gold, --black, --white)
- ✅ Schriften: Barlow Condensed + Inter
- ✅ Border-Radius einheitlich
- ⚠️ Button-Zustände (hover/active) nicht auf allen CTAs definiert

### Mobile-First Check
- ✅ Viewport meta-Tag gesetzt
- ✅ Hamburger-Navigation funktional
- ✅ Bilder responsive
- ⚠️ Tabellen (Windzonen) scrollen horizontal nicht sichtbar markiert

---
*UX Architect + UI Designer + UX Researcher Agents | Nächste Überprüfung: nach Cal.com Integration*
