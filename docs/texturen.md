# Texturen im 3D-Konfigurator

Wo die Bilder herkommen, unter welcher Lizenz sie stehen und was beim
Austauschen zu beachten ist. Der Code dazu steht in
`js/konfigurator-3d.js` (`TEXTUR_DATEI`, `TEXTUR_KACHEL`, `fotoTextur`,
`fotoAuftragen`).

## Lizenz

Alle Dateien unter `images/textur/` stammen von **ambientcg.com** und
stehen unter **CC0 1.0 Universal (Public Domain Dedication)**.

Das bedeutet konkret:

- **Keine Namensnennung nötig.** Eine Quellenangabe ist erlaubt, aber
  nicht Pflicht. Ein Bildnachweis auf der Website ist deshalb nicht
  erforderlich – wer einen will, kann diese Seite als Grundlage nehmen.
- **Kommerzielle Nutzung erlaubt**, auch verändert und weiterverbreitet.
- **Keine Wasserzeichen** in den Dateien.
- Geprüft am 11.10.2026 auf <https://ambientcg.com/license>.

Wer später eine Textur ersetzt: **nur CC0 oder eine eigene Aufnahme.**
Kostenlose Texturseiten verlangen oft doch eine Namensnennung oder
verbieten die kommerzielle Nutzung – das wäre hier eine Abmahnung wert,
weil die Seite gewerblich ist.

## Welche Datei wofür

| Datei | Verwendung im Modell | ambientCG-Material |
|---|---|---|
| `rasen.webp` | Wiese rund um die Anlage | Grass004 |
| `steinplatten.webp` | Boden „Steinplatten" | PavingStones028 |
| `holzdielen.webp` | Boden „Holzdielen" | WoodFloor043 |
| `putz.webp` | Hauswand „Rauputz" | Plaster002 |
| `klinker.webp` | Hauswand „Verklinkert" | Bricks075A |
| `zufahrt.webp` | Fläche vor dem Carport | Concrete034 |

Zu jeder Datei gehört eine `…-normal.webp`: die Normalmap. Sie enthält
keine Farbe, sondern die Oberflächenneigung – daher kommt die Struktur im
Streiflicht. Sie darf **nicht** als sRGB geladen werden, sonst wirkt die
Oberfläche falsch beleuchtet; der Code setzt `encoding` deshalb nur auf
der Farbtextur.

## Größen

Farbtextur 1024 × 1024, Normalmap 512 × 512, beide WebP. Zusammen rund
1,0 MB für alle sechs Materialien. Sie werden nur auf
`konfigurator.html` geladen, nicht auf den übrigen Seiten, und erst
während der Konfigurator läuft.

Wer größere Dateien einbaut, sollte das Gesamtgewicht im Auge behalten:
Die Seite lädt bereits three.js (~600 KB).

## Maßstab

`TEXTUR_KACHEL` sagt, wie viele Zentimeter eine Kachel in der Wirklichkeit
breit ist. Diese Zahlen sind **nach Augenmaß geschätzt**, nicht gemessen.
Sie entscheiden, ob eine Platte im Bild wie 40 cm oder wie 2 m wirkt –
wer sie ändert, ändert den wahrgenommenen Maßstab der ganzen Anlage.

## Wenn das Laden fehlschlägt

Fehlt eine Datei oder kann der Browser kein WebP, bleibt das bisherige
gezeichnete Canvas-Muster stehen (`bodenTextur`, `wandTextur`). Das ist
Absicht: ein Konfigurator ohne Boden wäre schlimmer als einer mit einem
groben Muster. Deshalb sind diese Funktionen nicht entfernt worden.

## Nachgeschlagen werden kann

- Neue Materialien suchen: <https://ambientcg.com/list>
- Download-Link-Muster: `https://ambientcg.com/get?file=<AssetId>_1K-JPG.zip`
- Umwandeln (so wurden diese Dateien erzeugt):
  `convert <Asset>_Color.jpg -resize 1024x1024 -strip -quality 78 ziel.webp`
  und für die Normalmap `…_NormalGL.jpg -resize 512x512 -quality 72`.
  **NormalGL**, nicht NormalDX – three.js erwartet die OpenGL-Richtung.
