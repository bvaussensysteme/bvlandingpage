# 📦 Inventar: VD AluSysteme – Inhalte auf der Website

> Zweck: Falls der Liefervertrag mit VD AluSysteme endet oder sich ändert, muss schnell erkennbar sein,
> welche Inhalte auf der Website an VD gebunden sind. Diese Liste ist die Grundlage für den Befehl
> **„Alle VD-Inhalte entfernen"** (oder sinngemäß).
>
> ⚠️ **Sicherheitsregel (dauerhaft, siehe auch PROJEKTSTAND.md/CLAUDE.md):**
> Wird dieser Befehl gegeben, NICHT sofort ausführen. Erst zurückfragen, ob es wirklich gewünscht ist,
> und darauf hinweisen, dass reines Entfernen Lücken hinterlässt (siehe Abschnitt 5).
>
> Stand: 04.07.2026

---

## 1. Bilder (Prefix `vd_` – Konvention seit Projektstart)

Alle Dateien unter `images/` mit Prefix `vd_` stammen aus dem VD-Liefervertrag (Bildnutzung vertraglich erlaubt, siehe vertrauliche Doku). Bulk-löschbar über das Präfix:

```
images/vd_prod_balkon_tds.jpg / .webp
images/vd_prod_bushaltestelle.jpg / .webp
images/vd_prod_carport_flatbox.jpg / .webp
images/vd_prod_carport_flatline.jpg / .webp
images/vd_prod_carport_tds.jpg / .webp
images/vd_prod_eingang_fly.jpg / .webp
images/vd_prod_eingang_frontline.jpg / .webp
images/vd_prod_eingang_frontline2.jpg / .webp
images/vd_prod_fahrrad.jpg / .webp
images/vd_prod_faltdach.jpg / .webp
images/vd_prod_farben_uebersicht.jpg / .webp
images/vd_prod_fassade.jpg / .webp
images/vd_prod_gartenhaus.jpg / .webp
images/vd_prod_gelaender_easyrail.jpg / .webp
images/vd_prod_gelaender_glas.jpg / .webp
images/vd_prod_kaltwintergarten_tds.jpg / .webp
images/vd_prod_pergola_sunpro.jpg / .webp
images/vd_prod_pergola_velaris.jpg / .webp
images/vd_prod_pergola_warema.jpg / .webp
images/vd_prod_sichtschutz.jpg / .webp
images/vd_prod_sonnenschutz.jpg / .webp
images/vd_prod_sonnenschutz_senkrecht.jpg
images/vd_prod_sonnenschutz_unterdach.jpg
images/vd_prod_terrasse_skyview.jpg / .webp
images/vd_prod_terrasse_tds.jpg / .webp
images/vd_partner-vd-alusysteme.png
```

**Zusätzlich (kein `vd_`-Prefix, aber identisch/VD-Partnerlogo):**
```
images/partner-vd-alusysteme.png   ← Duplikat von vd_partner-vd-alusysteme.png, gehört mit dazu
```

Befehl zum Entfernen aller Bilder: `git rm images/vd_* images/partner-vd-alusysteme.png`

## 2. Direkte Markennennungen im Code

| Datei | Was |
|---|---|
| `partner.html` | **Komplette Seite** über die VD-Partnerschaft – müsste ganz entfernt oder neu geschrieben werden |
| `index.html` (Zeilen ~65, 714, 748) | Schema.org-Description, Abschnitt „VD AluSysteme – Direktbezug", Garantietext |
| `produkte/*.html` (alle 16 Produktseiten) | JSON-LD `"brand": {"@type":"Brand","name":"VD AluSysteme"}` |

**Verlinkungen zu `partner.html`, die mit entfernt werden müssten:**
- `index.html` Footer: `<li><a href="partner.html">🤝 Partner</a></li>`
- `sitemap.xml`: `<loc>https://bv-aussensysteme.de/partner.html</loc>`

## 3. VD-Modellbezeichnungen in Produkttexten (nicht automatisch löschbar – Umbenennung nötig)

Diese Produktnamen sind VD-spezifische Markennamen, keine generischen Begriffe. Bei Lieferantenwechsel müssten sie durch die Modellnamen des neuen Lieferanten ersetzt werden (betrifft `<h2>`-Überschriften + zugehörige Feature-Listen in den jeweiligen `produkte/*.html`):

- **TDS** (Terrassenüberdachung, Carport, Eingangsüberdachung, Gartenhaus)
- **SkyView** (Flachdach-Terrassenüberdachung)
- **Flat Line / Flat Box** (Carport-Flachdach)
- **FLY / Front Line** (Vordächer)
- **SunPro Plus / Warema L50 / Lamaxa L50** (Lamellendächer)
- **Deco Wall** (Fassadenverkleidung)
- **Easy Rail** (Ganzglasgeländer)
- **Velaris** (Lamellensystem)
- **Linea / Solara / Rolax** (Beschattung, in Fließtext erwähnt)

## 4. Was NICHT betroffen ist

- Die Produktkategorien selbst (Terrassenüberdachung, Carport, Pergola, …) bleiben – BV bietet diese Leistungen unabhängig vom Lieferanten an
- Eigene Texte/Formulierungen (nicht kopiert, siehe Commit-Historie vom 04.07.2026) – rechtlich unproblematisch, aber inhaltlich an VD-Spezifikationen angelehnt und müssten ggf. sachlich angepasst werden, sobald ein anderer Lieferant andere technische Daten liefert

## 5. ⚠️ Wichtig: Reines Entfernen hinterlässt Lücken

Nach Ausführung von „Alle VD-Inhalte entfernen" fehlen:
- Alle Produktfotos (Platzhalter oder neue Fotos nötig)
- Das VD-Partnerlogo/-seite
- Konkrete technische Kennwerte (Maße, Glaswerte, Garantiezeiten), die VD-spezifisch sind

**Das ist beabsichtigt** – der Befehl räumt auf, ersetzt aber nichts automatisch. Neue Inhalte (Fotos, Daten) vom neuen Lieferanten müssten danach separat eingepflegt werden.

---
*Diese Datei wird nicht öffentlich ausgeliefert (siehe `.assetsignore`, `docs/` ist ausgeschlossen).*
