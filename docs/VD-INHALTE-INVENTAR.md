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

### Nachtrag 23.11.2026: Material-, Farb- und Zubehörbilder

Auf Ansage des Betreibers („Zieh dir von den seiten alle Infos, alle
Bilder die du kriegst", dazu „von cd darf ich alles nehmen", gemeint
ist VD) von vd-alusysteme.de geholt. Geladen mit
`scripts/hole-vd-bilder.sh`, das Zielnamen ohne `vd_`-Präfix
zurückweist.

| Datei | zeigt | Herkunft |
|---|---|---|
| `images/vd_mat_vsg8_klar.webp` | VSG-Glas 8 mm klar, Plattenbild | `assets/img/klar-069dea-960.webp` |
| `images/vd_mat_vsg8_opal.webp` | VSG-Glas 8 mm opal, Plattenbild | `assets/img/opal-31261c-960.webp` |
| `images/vd_mat_pc16_klar.webp` | Polycarbonat 16 mm klar, Stegplatte | `assets/img/16mm-klar-1bebb2-960.webp` |
| `images/vd_mat_pc16_opal.webp` | Polycarbonat 16 mm opal, Stegplatte | `assets/img/16mm-opal-ec4ee3-960.webp` |
| `images/vd_ral_7016_anthrazit.webp` | Farbmuster RAL 7016 | `assets/img/anthrazit-aedbe2-960.webp` |
| `images/vd_ral_9006_weissaluminium.webp` | Farbmuster RAL 9006 | `assets/img/weissaluminium-911e04-960.webp` |
| `images/vd_ral_9007_graualuminium.webp` | Farbmuster RAL 9007 | `assets/img/graualuminium-7e9fae-960.webp` |
| `images/vd_ral_9010_reinweiss.webp` | Farbmuster RAL 9010 | `assets/img/reinweiss-a41776-960.webp` |
| `images/vd_zub_led_minispots.webp` | dimmbare LED-Minispots | `assets/img/dimmbare-minispots-e285de-960.webp` |
| `images/vd_zub_lautsprecher.webp` | Bluetooth-Mikrolautsprecher | `assets/img/bluetooth-mikrolautsprecher-5c2d54-960.webp` |

### Zwei eingefärbte Fassungen, 23.11.2026

Ansage des Betreibers: „erstelle so eine grafik auch für glas
Grau/Graphit" und „und polycarbonat graphit". Für diese beiden
Varianten gibt es beim Hersteller **kein Bild**: nicht auf den
Produktseiten, nicht im Katalog 2026 und nicht in den technischen
Datenblättern.

| Datei | entstanden aus | Ton |
|---|---|---|
| `images/vd_mat_vsg8_graphit.webp` | `vd_mat_vsg8_klar.webp` | `#75797E` |
| `images/vd_mat_pc16_graphit.webp` | `vd_mat_pc16_klar.webp` | `#6E7276` |

Erzeugt mit `scripts/faerbe-platte.mjs`. Die Vorlage hat einen
durchsichtigen Hintergrund (63 Prozent der Bildpunkte mit Alpha 0),
deshalb trifft die Einfärbung nur die Platte. Multipliziert statt
übermalt, damit Glanzlichter und Kanten bleiben.

**Sie tragen trotzdem das `vd_`-Präfix**, obwohl wir sie selbst
erzeugt haben: Die Vorlage stammt vom Hersteller, das Ergebnis also
auch. Ohne Präfix fielen sie bei einem Vertragsende durchs Raster.
Das Skript weist Zielnamen ohne `vd_` ab.

**Benutzt werden bisher** die vier Materialbilder, in den Karten
„Glas oder Polycarbonat?" auf `produkte/terrassenueberdachung.html`.
Farbmuster und Zubehörbilder liegen bereit und sind noch nicht
eingebaut.

**Bewusst NICHT geholt:** Die Beschattungsbilder des Herstellers. Ihre
Dateinamen beginnen mit `warema-`. Nach der Ansage des Betreibers vom
22.11.2026 („Ganz raus, überall") gehört dieser Herstellername nicht
mehr auf unsere Seite, auch nicht in einem Dateinamen.

**Zusätzlich (kein `vd_`-Prefix, aber identisch/VD-Partnerlogo):**
```
images/partner-vd-alusysteme.png   ← Duplikat von vd_partner-vd-alusysteme.png, gehört mit dazu
```

Befehl zum Entfernen aller Bilder: `git rm images/vd_* images/partner-vd-alusysteme.png`

### ⚠️ Lücke: die Kachelbilder des Anfrage-Assistenten

`images/wizard/wz_*.webp` (rund 45 Dateien) tragen **kein `vd_`-Prefix** und
fallen damit **nicht** unter den Lösch-Befehl oben. Mindestens zwei davon sind
belegt Herstellerbilder von VD – am 29.10.2026 vom Betreiber geliefert, das
VD-Logo ist auf der Eckkappe sichtbar:

```
images/wizard/wz_poly_graphit.webp
images/wizard/wz_poly_bronze.webp
images/wizard/wz_vsg_graphit.webp
```

Bei den übrigen Kachelbildern ist die Herkunft **nicht dokumentiert**. Vor einer
Vertragsbeendigung muss der Betreiber Datei für Datei klären, welche davon von
VD stammen und welche eigene Aufnahmen sind – sonst bleiben Herstellerbilder
auf der Seite stehen, obwohl sie gelöscht sein sollten. Das ist der einzige
bekannte blinde Fleck dieses Inventars.

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


## 19.11.2026 – 59 Portfoliobilder des Herstellers dazugekommen

Aus dem Paket `VD_Bilde_Portfolio` des Betreibers, abgelegt unter
`images/portfolio/<produkt>/`, eingebunden über
`src/_data/galerien.json` und `src/_includes/galerie.njk`.

| Ordner | Dateien | eingebunden auf |
|---|---|---|
| terrassenueberdachung | 12 | /produkte/terrassenueberdachung.html |
| eingang | 8 | /produkte/eingang.html |
| gartenhaus | 4 | /produkte/gartenhaus.html |
| carport | 11 | /produkte/carport.html |
| kaltwintergarten | 3 | /produkte/kaltwintergarten.html |
| pergola | 3 | /produkte/pergola.html |
| balkon-fassade | 18 | /produkte/balkon-fassade.html |

Dazu kommen **14 Städteseiten** mit je vier Bildern desselben Produkts
(`carport-*.html`, `pergola-*.html`, `terrassenueberdachung-*.html`).
Sie sind handgepflegtes HTML und laufen nicht durch Eleventy; den Block
setzt `scripts/baue-staedte-galerie.mjs` hinein.

Es sind Renderings des Herstellers, keine Fotos ausgeführter Anlagen.

### Rückweg, falls VD-Inhalte entfernt werden

Zuerst zurückfragen, siehe die Regel in `CLAUDE.md`. Dann in dieser
Reihenfolge:

1. `node scripts/baue-staedte-galerie.mjs --entfernen` nimmt den Block
   und die Skript-Zeile aus den 14 Städteseiten. **Nur das**, kein
   `git checkout`: Die Seiten tragen auch fremde Änderungen, die
   bleiben sollen. Geprüft am 19.11.2026: 0 hinzugefügte, 22 bis 23
   entfernte Zeilen je Seite.
2. Ordner `images/portfolio/` löschen.
3. `src/_data/galerien.json`, `src/_includes/galerie.njk`,
   `js/galerie.js`, `scripts/baue-staedte-galerie.mjs`,
   `scripts/pruefe-galerie.mjs` und
   `scripts/pruefe-staedte-galerie.mjs` löschen.
4. Den CSS-Block „AUSFUEHRUNGSBEISPIELE" in `src/css/style.css`
   entfernen.
5. Die **sieben** Include-Zeilen `{% set galerieSchluessel … %}` und
   die sieben `js/galerie.js`-Skriptzeilen in den Produktvorlagen
   entfernen, dazu das Feld `"image"` im Product-Schema derselben
   sieben Seiten.
6. In `docs/pruefungen.md` die drei Einträge streichen.

`scripts/pruefe-referenz-galerie.mjs` bleibt: Es prüft die
Referenz-Galerie der Startseite und hat mit dem Portfolio nichts zu
tun. Die Seiten bleiben dann ohne Galerie, aber heil.

**Nicht geprüft** wurde dieser Rückweg als Ganzes, nur Schritt 1.
