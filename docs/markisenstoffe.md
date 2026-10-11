# Markisenstoffe

Welche Stoffe es gibt, warum sie streng getrennt bleiben müssen und was an
den Bildern nicht stimmt. Die Liste selbst steht in `js/markisenstoffe.js` –
das ist die einzige Quelle im Projekt, hier wird sie nicht wiederholt.

## Die Regel, um die es geht

Es gibt **zwei Stoffwelten, die sich nicht überschneiden.**

| Gruppe | Umfang | Gilt für |
|---|---|---|
| `dach` | 53 Stoffe | VD LINEA, SOLARA, PERGOLA, LUNA, LUXORA – also Aufdachmarkise (Linea A/AZ), Unterdachmarkise (Linea U/UZ) und die Pergolamarkise |
| `zip` | 44 Stoffe | VD EZIP 105 und EZIP 125 – die Senkrechtmarkisen links, rechts und an der Stirnseite |

Kein Code kommt in beiden Gruppen vor. **Ein Sergé-Stoff ist für eine
Aufdachmarkise nicht bestellbar** und umgekehrt.

**Warum das in die Software gehört und nicht nur in den Kopf:** Wer im
Konfigurator einen Stoff der falschen Gruppe wählen könnte, schickt eine
Anfrage los, die sich erst beim Angebot als nicht bestellbar erweist –
nach Rückruf, nach Aufmaß, nach der Zeit, die beides kostet. Die Prüfung
`scripts/pruefe-stoffe.js` rechnet die Trennung bei jedem Lauf nach.

**Plissee und Sonnensegel bekommen keine Stoffwahl.** Die Stoffkarte nennt
als Produktgruppe ausdrücklich LINEA / SOLARA / PERGOLA / LUNA / LUXORA;
diese beiden stehen dort nicht. Im Code steht das in
`STOFF_DACH_MARKISEN`.

## Konfektion A und B

Jeder `zip`-Stoff hat **zwei Muster, Konfektion A und B. Der Kunde wählt
eins davon.** (Angabe des Betreibers, 11.10.2026 – vorher stand hier die
falsche Annahme, es seien Außen- und Innenseite desselben Tuchs.)

Im Bild der Stoffkarte liegen beide Muster nebeneinander in einem
Streifen: links A, rechts B. Daraus sind die Einzelbilder erzeugt worden.

## Eigenschaften

Alle `dach`-Stoffe haben **Lichtechtheit 4/5** – deshalb steht das nicht
je Zeile in der Liste, sondern nur hier. Die **Wassersäule** steht je
Stoff (`w`), meist 350 mm; Ausnahmen sind PA522 (370), PA612/614/616/617
und PA632 (380), PA627 und PA639 (370), PA633 und PA645 (450).

## Bilder

| Ordner | Inhalt | Verwendung |
|---|---|---|
| `images/stoffe/` | die vorhandenen Originale der Stoffseite | `stoffe.html` |
| `images/stoffe/mini/` | 96 px breite Musterstreifen | Auswahlraster in beiden Konfiguratoren |
| `images/stoffe/tex/` | 512 px breite Muster | das Tuch im 3D-Modell |

Zusammen rund 1 MB; die Auswahlbilder laden verzögert (`loading="lazy"`),
die Texturen erst, wenn jemand einen Stoff anklickt.

## Was an den Farben nicht stimmt — bitte lesen

Die Originalbilder der **EZIP-Stoffe** (`T…jpg`) liegen im **CMYK-Farbraum
ohne eingebettetes Farbprofil**. Für die Anzeige im Browser müssen sie
nach sRGB umgerechnet werden, und ohne Profil ist diese Umrechnung eine
Schätzung. **Die Farben weichen sichtbar ab** – beim Vergleich mit der
gedruckten Stoffkarte wirkt die Umrechnung kühler und grünlicher als das
Original.

Das betrifft auch `stoffe.html`, wo dieselben CMYK-Dateien direkt
eingebunden sind; Browser rechnen sie ebenfalls ohne Profil um.

**Abgesichert ist das derzeit nur durch den Hinweistext** im Konfigurator
(„Die Darstellung dient nur der Orientierung und bildet Farben,
Materialien und Details nicht verbindlich ab") und im Stoffschritt des
Assistenten. Das ist rechtlich vertretbar, aber es ist keine Lösung.

**Was es besser machen würde**, in dieser Reihenfolge:

1. Die Stoffbilder beim Lieferanten **als sRGB-Dateien** anfordern. Das
   ist der einzige Weg, der die Farben wirklich richtig macht.
2. Ersatzweise ein CMYK-Profil (z. B. ISO Coated v2) besorgen und die
   Umrechnung damit fahren. Besser als jetzt, aber immer noch nicht das
   Original.
3. Nichts tun und beim Hinweistext bleiben. Vertretbar, solange niemand
   nach einem Muster am Bildschirm bestellt.

Die 53 `dach`-Stoffe sind davon **nicht** betroffen: deren Vorlagen
(`…-flat.png`) liegen bereits in sRGB.

## Wenn sich die Stoffkarte ändert

`js/markisenstoffe.js` anpassen, die Bilder in `images/stoffe/`
ergänzen und daraus `mini/` und `tex/` erzeugen:

```
convert images/stoffe/<CODE>-flat.png -colorspace sRGB -resize 512x \
        -strip -quality 80 images/stoffe/tex/<CODE>.webp
convert images/stoffe/tex/<CODE>.webp -resize 96x -quality 58 \
        images/stoffe/mini/<CODE>.webp
```

Für EZIP-Stoffe zusätzlich links/rechts trennen (`-crop 50%x100%+0+0`
bzw. `-gravity east`). Danach `node scripts/pruefe-stoffe.js` laufen
lassen – es meldet fehlende Bilder und Dubletten.
