# Prompt für Higgsfield: Flyer A5 (halbe DIN A4)

**Stand 21.11.2026.** Alle Angaben darin stammen aus dem eigenen
Auftritt (Impressum, Startseite, Produktseiten). Nichts ist erfunden:
keine Jahreszahlen, keine Bewertungen, keine Preise, keine Siegel.

## Einstellungen in Higgsfield

| | |
|---|---|
| Modell | **Nano Banana Pro** (setzt Text am saubersten). Zweite Wahl: GPT Image 2 |
| Auflösung | **4k** |
| Seitenverhältnis | **2:3** (A5 ist 1:1,414; 2:3 ist das nächstgelegene verfügbare) |
| Varianten | 3 bis 4 erzeugen und vergleichen |

A5 bei 300 dpi sind **1748 × 2480 px**. Das 2:3-Bild muss danach noch
auf dieses Maß beschnitten oder erweitert werden. Zum Erweitern eignet
sich *FLUX.2 Pro Outpaint* im selben Zugang.

## Der Prompt

```text
Design a print-ready A5 portrait flyer (148 x 210 mm) for a German
company that builds made-to-measure aluminium outdoor structures.
Tone: premium, calm, architectural. Not a cluttered discount leaflet.

LAYOUT, top to bottom:
1) Top third: photograph of a modern anthracite aluminium terrace roof
   with a glass roof, attached to a white plastered single-family
   house, sunny late afternoon, garden furniture underneath, seen
   slightly from the garden. The photo bleeds off the left, top and
   right edges.
2) On warm white #F8F7F4, headline in two lines, colour #0B0B0C, bold,
   tight letter spacing:
   "Ihr Traumplatz draußen."
   "Maßgefertigt aus Aluminium."
3) One line of subtext in grey:
   "Terrassenüberdachung, Carport, Pergola, Kaltwintergarten und mehr.
   Aus dem Westerwald."
4) A row of three short facts, separated by thin vertical gold #C58A32
   rules: "Maßgefertigt" | "CE-zertifiziert" | "10 Jahre
   Herstellergarantie"
5) Two columns of services, small, dark grey.
   Left column: "Terrassenüberdachung", "Carport",
   "Pergola & Lamellendach", "Kaltwintergarten".
   Right column: "Sonnenschutz & Markisen",
   "Geländer & Glasgeländer", "Eingang & Vordächer",
   "Balkon & Fassade".
6) Bottom band across the full width in near-black #0B0B0C: the
   contact line in gold #C58A32 reading "0156 78696609" and
   "bv-aussensysteme.de", and below it in warm white
   "56428 Dernbach, Westerwald".
7) Leave an EMPTY, uncluttered area of about 45 x 18 mm in the top
   left corner of the photograph, reserved for the company logo.
   Do NOT draw a logo, emblem, monogram or any lettering there.

TYPOGRAPHY: one geometric sans-serif similar to Manrope, weights 400
to 800 only. No thin weights, no script, no serif, no condensed face.

COLOURS: only #0B0B0C, #F8F7F4, #E9E7E2 and #C58A32. No other accent.

STYLE: generous white space, strict left alignment, no drop shadows,
no gradients on text, no glow, no 3D bevel, no smiling stock-photo
family, no badges, no star ratings, no price tags, no QR code, no
certification seals, no award ribbons.

TEXT: render the German text exactly as written above, including the
umlauts ä, ö, ü and the letter ß. Do not add any other words,
captions, watermarks or invented slogans anywhere in the image.

OUTPUT: 300 dpi print quality, 3 mm bleed on all sides, nothing
important within 8 mm of the trim edge.
```

## Was danach noch von Hand gemacht werden muss

1. **Jedes Wort nachlesen.** Bildmodelle verdrehen deutsche Wörter,
   besonders ä, ö, ü und ß. Erfahrungsgemäß stimmt selten alles beim
   ersten Versuch.
2. **Das Logo einsetzen.** Der Prompt lässt dafür bewusst eine Fläche
   frei. Das echte Logo liegt als SVG im Projekt
   (`images/logo-schwarz-gold.svg`, `images/logo-weiss-gold.svg`).
   Ein nachgezeichnetes Logo wäre ein anderes Logo.
3. **Auf 1748 × 2480 px bringen** und die Pflichtangaben prüfen, die
   auf einem Werbeflyer stehen müssen. Was davon Pflicht ist, sagt
   verbindlich nur ein Fachmann; hier ist nichts geprüft.

## Was bewusst NICHT im Prompt steht

Keine Preise, keine Rabatte, keine Bewertungssterne, keine
Gründungsjahre, keine Mitarbeiterzahl, kein "Testsieger", keine
Partnerlogos. All das wäre erfunden, und erfundene Vertrauenssignale
sind auf diesem Auftritt ausgeschlossen.

Die Marke des Herstellers (VD AluSysteme) ist nicht erwähnt. Ob sie
auf einen eigenen Flyer gehört, ist eine Entscheidung des Betreibers.
