# Designsystem der Webseite

Stand: 13.11.2026. Vorgabe des Betreibers für die schrittweise
Modernisierung. **Noch nirgends angewendet** – weder live noch im
Arbeitsbranch.

## ⚠️ Offener Punkt: Die Zielpalette weicht vom Bestand ab

Die unten genannten Werte sind **nicht** die, mit denen die Seite heute
läuft. Das ist kein Schreibfehler, sondern eine Entscheidung, die noch
aussteht:

| | heute live (`src/css/style.css`) | Vorgabe | Abstand |
|---|---|---|---|
| Gold | `#C49A2A` | `#C58A32` | sichtbar wärmer/rötlicher |
| Schwarz | `#111111` | `#0B0B0C` | minimal dunkler |
| Warmweiß | `#F8F6F1` | `#F8F7F4` | minimal kühler |
| Anzeigeschrift | Barlow Condensed | Manrope | andere Anmutung |
| Textschrift | Inter | Manrope | eine Familie statt zwei |

**Warum das geklärt werden muss, bevor jemand damit baut:** Das
Firmenlogo bleibt unverändert, und darin steckt ein Gold. Liegt daneben
ein anderes Gold, sieht es aus wie ein Druckfehler, nicht wie eine Marke.
Welches Gold im Logo steckt, ist **noch nicht gemessen** – das gehört vor
die erste Umsetzung (Aufgabe für `ux-architect`).

Bis zur Entscheidung gilt: **Änderungen an der Live-Seite benutzen
weiter die bestehenden Werte.** Die Vorgabe unten gilt für Neubauten in
der Vorschau.

## Marke

BV AussenSysteme, Aluminium-Außensysteme im Westerwald. Haltung:
*Modern Architectural Premium* – hochwertig und exklusiv, zugleich
freundlich und leicht verständlich. Kein Luxus-Dünkel: Die Kundschaft
baut ein Dach über die Terrasse, keinen Palast.

**Die Firmenlogos bleiben unverändert.** Keine neue Zeichnung, keine
neuen Farben darin, kein Freistellen, kein Nachbauen.

## Schrift

**Manrope** für alles. Eine Familie, zwei bis drei Schnitte – jeder
weitere Schnitt kostet Ladezeit. Keine dünnen Schnitte unter 400:
Die Zielgruppe ist nicht zwanzig.

Lizenz: Manrope steht unter der SIL Open Font License und darf
kommerziell benutzt werden. **Vor dem Einbau in
`docs/NEUBAU-LIZENZREGISTER.md` eintragen**, mit Quelle und Fassung –
das Register ist die Grundlage der Freigabe.

Selbst ausliefern statt von einem fremden Dienst laden: Das spart eine
Verbindung, einen Eintrag in der Datenschutzerklärung und eine Abfrage
in der Einwilligung.

## Farben

| Name | Wert | Gedacht für |
|---|---|---|
| Tiefschwarz | `#0B0B0C` | dunkle Flächen, Grund |
| Anthrazit | `#1D2023` | abgesetzte dunkle Flächen |
| Graphit | `#34383C` | Linien und Ränder auf Dunkel |
| Markengold | `#C58A32` | Akzent, sparsam |
| Helles Gold | `#D9AB64` | Gold als Text auf dunklem Grund |
| Champagner | `#EAD9BB` | sehr sparsam, große Flächen |
| Warmweiß | `#F8F7F4` | heller Grund |
| Steingrau | `#E9E7E2` | abgesetzte helle Flächen |
| Weiß | `#FFFFFF` | Karten, Formularfelder |

**Helle und dunkle Bereiche im Wechsel**, nicht alles dunkel und nicht
alles hell.

**Gold ist ein Akzent, keine Fläche.** Faustregel: Pro Bildschirm eine
goldene Sache, die Aufmerksamkeit verdient. Gold als Fließtext auf Hell
erreicht den Kontrast nicht – dafür braucht es einen eigenen, dunkleren
Goldton (auf der bestehenden Seite heißt der `--gold-text`).

**Kontrast wird gemessen, nicht geschätzt.** 4,5:1 für Fließtext, 3:1
für große Schrift. Vor der Verwendung, nicht hinterher.
`scripts/pruefe-darstellung.mjs` misst es. Text über Fotos oder
Verläufen kann das Skript **nicht** messen – dort wird von Hand geprüft.
Diese blinde Stelle hat auf dieser Seite schon zweimal einen echten
Fehler verdeckt.

## Smartphone zuerst

70–80 % der Besucher kommen vom Telefon. Entworfen wird für 390 px
Breite, danach nach oben erweitert – nicht umgekehrt.

- Touchflächen mindestens 44 × 44 px, mit Abstand dazwischen
- Eingabefelder mindestens 16 px Schrift (darunter zoomt iOS hinein)
- Kein Querscrollen bei 320 px
- Die Telefonnummer ist am Telefon erreichbar, ohne zu suchen
- Feste Leisten unten mit `env(safe-area-inset-bottom)`

## Bilder

Hochwertige Produktfotos, gleiche Bildsprache, gleiche Lichtstimmung.
Keine Bildagentur-Stimmung, die nichts mit den eigenen Produkten zu tun
hat. Bildrechte vor der Verwendung klären und im Lizenzregister
eintragen.

## Bewegung

Zurückhaltend und begründet. Nichts Wichtiges darf nur per Animation
erscheinen. `prefers-reduced-motion` wird beachtet – und wer Bewegung
reduziert hat, bekommt trotzdem alle Bedienelemente, nur ohne Fahrt.
