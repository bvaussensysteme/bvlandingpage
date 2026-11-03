# Bedienung des 3D-Konfigurators: Analyse eines fremden Vorbilds

> Grundlage: zehn Bildschirmfotos eines fremden Konfigurators, die der
> Betreiber am 03./04.11.2026 geschickt hat – „finde diesen aufbau richtig
> schön vom design ui uix, es sol nicht 1:1 geklaut werden aber ähnlich und
> rechtlich unanfechtbar".
>
> **Der fremde Anbieter wird hier nicht genannt**, auch nicht in Dateinamen,
> Klassen oder Commits (`CLAUDE.md`, Abschnitt „Nachbauten"). Die Bilder
> liegen nicht im Repository. Übernommen werden **Ideen und Mechanik**, nie
> Ausführung: keine fremden Zeichnungen, Farben, Texte oder Klassennamen.

## Warum das rechtlich die Grenze ist

Eine Funktion ist frei, ihre konkrete Ausführung nicht. Frei nachbaubar sind
**Abläufe und Gedanken**: dass erledigte Bereiche abgehakt werden, dass ein
Knopf sein Ziel nennt, dass eine Entscheidung als „empfohlen gegen
Alternative" dasteht. Geschützt sind die **Werke**: Strichzeichnungen,
Symbole, Farbklang, Formulierungen, Layout in seiner konkreten Ausprägung.
Gegenüber einem direkten Wettbewerber ist eine Abmahnung ein reales, teures
Risiko – und sie kommt ohne Gericht.

## Was auf den zehn Bildern zu sehen ist

| # | Beobachtung | Idee (übernommen) | Ausführung (nicht übernommen) |
|---|---|---|---|
| 1 | Reiterleiste mit Symbol je Bereich, zentrierte Überschrift, Produktkarte mit Miniatur und Kurzdaten, Auswahl als Bildkarten, feste Fußzeile | Reiter mit Zeichen; Fußzeile, die das Ziel nennt; Bildkarten statt Textknöpfen | ihre Symbole, ihr Grün, ihre Kartenmaße |
| 2 | Große Maße als Zahlenfeld **mit** Regler und sichtbarem Min/Max; kleine Maße als − Zahl + in zwei Spalten; Buchstabenmarken A–D | Grenzen sichtbar machen; Zahlenfeld vor Regler; Buchstabenmarken als Verweis auf eine Skizze | ihre Abstände, ihre Marken-Gestaltung |
| 3 | Aufklappbare „Maßskizze & Informationen"; Wasserablauf und Farbe als Karten mit Farbfläche, RAL-Nummer, Hex-Wert | Skizze zum Aufklappen; Farbkarte mit RAL-Nummer | ihre Skizze, ihre Farbkarten |
| 4 | Eindeckung als Bildkarten mit kleiner Marke für die Stärke („8 mm") | Stärke als Marke auf der Karte | ihre Zeichnungen |
| 5 | Konstruktion: **abgehakte Fakten** („3 Pfosten vorne – Feld ≤ 3,6 m"), danach „EMPFOHLEN" gegen „ALTERNATIVE" | Berechnetes als Häkchenliste statt als Frage; zwei Wege, einer empfohlen | ihre Kartenzeichnungen, ihr Wortlaut |
| 6 | Pfostenzahl als Steller, über dem Knopf eine Sprechblase mit der erlaubten Spanne („3 – 8 St"), darunter die Folge („2 Felder") | Spanne am Steller zeigen; Folge der Eingabe benennen | ihre Sprechblase |
| 7 | Seiten als Zeilen mit Zustand („Front · 2 × Offen", Marke „2 Felder", Pfeil zum Aufklappen) | Seiten als Liste mit Zustand statt als Knopfreihe | ihre Zeilen-Gestaltung |
| 8 | Extras mit Untergruppen („Über dem Dach" / „Unter dem Dach"), Bildkarten; im letzten Schritt wird aus „Weiter" der Anfrage-Knopf | Untergruppen mit eigener kleiner Überschrift; letzter Schritt endet im Absenden | ihre Zeichnungen |
| 9 | Beleuchtung als Karten, Montage als einzelne Karte mit Hinweis „wird mit angefragt" | Montage als Karte mit Folgehinweis | ihr Firmenname und Logo |
| 10 | Anfrage-Dialog: Planung als Karte mit Miniatur und Merkmalen als Marken, aufklappbare Stückliste, „Entwurf bearbeiten", weitere Konstruktion hinzufügen, Kontaktformular, Fußleiste mit „6 Angaben fehlen" | Planung als Karte mit Merkmalsmarken; Zahl der fehlenden Pflichtfelder in der Fußleiste; „unverbindlich und kostenlos" am Knopf | ihr Dialog, ihre Texte, ihr Name |

## Was davon gebaut ist (04.11.2026, erste Runde)

1. **Reiterleiste mit Zeichen und Haken.** Fünf eigene Symbole im Stil der
   vorhandenen Sammlung (24er Raster, nur Striche). „Erledigt" heißt **schon
   dagewesen** – nicht „ausgefüllt": Fast alles hat eine Vorgabe und wäre
   formal ausgefüllt, auch wenn niemand hingesehen hat. Das wäre eine
   Behauptung, keine Auskunft.
2. **Feste Fußzeile.** Sie bleibt beim Blättern stehen: Fortschrittsbalken,
   `Zurück` mit dem Namen des vorigen Bereichs, der Zähler, `Weiter` mit dem
   Namen des nächsten. Vorher stand das am Ende des Bedienfeldes – wer in der
   Mitte eines Schrittes war, musste erst ans Ende scrollen.
3. **Der Weg zur Anfrage steht in jedem Schritt da.** Vorher nur im letzten.
   Wer nach drei Schritten genug gesehen hat, soll fragen können.
4. **Zwei Wege statt eines Hakens.** Aus „Statikträger unter der Rinne" wird
   `Mittelpfosten (empfohlen)` neben `Statikträger (freie Front · Durchgang
   189 mm niedriger)`. Der Haken bleibt als Quelle der Wahrheit bestehen, ist
   aber nicht mehr sichtbar – zwei Bedienungen für dieselbe Entscheidung wären
   genau die Verwirrung, um die es geht.

## Was als Nächstes ansteht

- **Eigene Miniaturen statt fremder Zeichnungen.** Produkt, Aufbau, Grundriss
  und Eindeckung sollen Bildkarten werden. Die Bilder **rendern wir aus
  unserem eigenen 3D-Modell** – das ist originär, kostenlos, zeigt unser
  echtes Produkt in unseren Farben und stimmt immer mit dem überein, was der
  Kunde danach sieht. Ein Skript erzeugt sie einmalig.
- **Seiten als Liste mit Zustand** statt als Knopfreihe.
- **Berechnetes als Häkchenliste** im Maße-Schritt (Pfostenzahl, Feldbreite).
- **Anfrage-Dialog** mit Planungskarte, Merkmalsmarken und der Zahl der noch
  fehlenden Pflichtangaben.
