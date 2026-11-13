# Designsystem der Webseite

Stand: 13.11.2026. **Palette und Schrift sind vom Auftraggeber
freigegeben** (siehe unten). Noch nirgends angewendet – weder live noch
im Arbeitsbranch. Die Freigabe betrifft die neue Webseite, nicht die
laufende Live-Seite.

## ✅ Freigegeben: die Palette (13.11.2026)

Ansage des Auftraggebers vom 13.11.2026, ausdrücklich: Das wärmere Gold
**#C58A32** ersetzt **#C49A2A** als primäres Gold-Token der neuen
Webseite. Dazu helles Gold **#D9AB64**, Anthrazit **#1D2023**, Warmweiß
**#F8F7F4**, Schrift **Manrope**.

**Die Original-Logos bleiben unverändert und werden nicht umgefärbt.**

### Gemessen: Das neue Gold passt zum Logo, das alte passte nicht

Der offene Punkt vom Vortag – welches Gold in den Logos steckt – ist
beantwortet. Die Logodateien wurden ausgelesen und die häufigste
gesättigte Farbe bestimmt:

| Logodatei | Gold im Logo | Abstand zu #C58A32 | Abstand zu #C49A2A |
|---|---|---|---|
| `images/logo-frei.png` | `#C58930` | **ΔE 0,8** | ΔE 12,4 |
| `images/logo-mark.png` | `#C67F2D` | **ΔE 6,8** | ΔE 18,4 |
| `images/logo-hell.png` | `#E69B26` | **ΔE 15,9** | ΔE 16,0 |

ΔE nach CIE76. Unter rund 2,3 sieht das menschliche Auge keinen
Unterschied mehr.

**Das Hauptlogo trägt also praktisch exakt #C58A32.** Die Entscheidung
korrigiert eine Abweichung, die vorher bestand: Das bisherige
Webseiten-Gold #C49A2A lag sichtbar neben dem Logo-Gold. Die Freigabe
bringt Seite und Logo zusammen.

`logo-hell.png` trägt ein deutlich orangeres Gold (`#E69B26`) und bleibt
von beiden Werten weit entfernt. Das ist eine eigene Fassung des Logos,
keine Abweichung der Palette – vor der Verwendung prüfen, ob sie
überhaupt gebraucht wird.

### Gemessen: Wo das Gold als Text nicht reicht

**Das ist die Einschränkung, die vor der Umsetzung sitzen muss.**

| Kombination | Kontrast | |
|---|---|---|
| Gold `#C58A32` auf Anthrazit `#1D2023` | 5,50:1 | ok |
| Gold `#C58A32` auf Tiefschwarz `#0B0B0C` | 6,61:1 | ok |
| Helles Gold `#D9AB64` auf Anthrazit `#1D2023` | 7,76:1 | ok |
| Helles Gold `#D9AB64` auf Tiefschwarz `#0B0B0C` | 9,33:1 | ok |
| Tiefschwarz `#0B0B0C` auf Goldfläche `#C58A32` | 6,61:1 | ok |
| Anthrazit `#1D2023` auf Warmweiß `#F8F7F4` | 15,28:1 | ok |
| Warmweiß `#F8F7F4` auf Anthrazit `#1D2023` | 15,28:1 | ok |
| Champagner `#EAD9BB` auf Anthrazit `#1D2023` | 11,80:1 | ok |
| Graphit `#34383C` auf Warmweiß `#F8F7F4` | 11,03:1 | ok |
| **Gold `#C58A32` auf Warmweiß `#F8F7F4`** | **2,78:1** | **zu wenig** |
| **Gold `#C58A32` auf Weiß `#FFFFFF`** | **2,98:1** | **zu wenig** |
| **Weiß `#FFFFFF` auf Goldfläche `#C58A32`** | **2,98:1** | **zu wenig** |
| **Helles Gold `#D9AB64` auf Warmweiß `#F8F7F4`** | **1,97:1** | **zu wenig** |

Daraus drei Regeln, die nicht verhandelbar sind:

1. **Gold ist auf hellem Grund keine Textfarbe.** 2,78:1 liegt unter
   4,5:1 und sogar unter 3:1, also auch für große Schrift zu wenig.
   Als Fläche, Linie oder Symbol ist es dort in Ordnung.
2. **Auf einer Goldfläche steht dunkler Text, nicht weißer.** Weiß
   erreicht 2,98:1, Tiefschwarz 6,61:1. Goldene Knöpfe bekommen
   `#0B0B0C`.
3. **Für Gold als Text auf hellem Grund gibt es einen eigenen Wert**
   (siehe unten) – so, wie die heutige Seite es mit `--gold-text` schon
   macht.

### Entschieden von den Design-Agenten (13.11.2026)

Der Auftraggeber hat die Palette freigegeben; die abgeleiteten
Technikwerte haben `ux-architect` und `qa-accessibility-auditor`
entschieden. Alle Zahlen unten sind nachgerechnet – sieben Stichproben
aus den Agentenberichten stimmten auf die zweite Nachkommastelle.

#### Ein dunkles Gold, nicht mehrere: `--gold-text: #896023`

| auf | Kontrast | Text (4,5:1) | Bedienelement (3:1) |
|---|---|---|---|
| Warmweiß `#F8F7F4` | 5,21:1 | ja | ja |
| Weiß `#FFFFFF` | 5,58:1 | ja | ja |
| Steingrau `#E9E7E2` | 4,52:1 | ja (knapp) | ja |
| Champagner `#EAD9BB` | 4,03:1 | **nein** | ja |

Begründung des `ux-architect`: Drei Goldbrauntöne nebeneinander fallen
optisch auseinander und sind in der Pflege fehleranfällig. `#896023` ist
der dunkelste der geprüften Werte, also der sicherste.

**Zusammengeführt:** Der `qa-accessibility-auditor` hatte für
Bedienelemente auf Hell einen eigenen Wert `#9A6A1F` vorgeschlagen. Der
wird nicht gebraucht – `#896023` erreicht auf allen vier hellen Flächen
mindestens 4,03:1 und damit auch die 3:1-Schwelle für Bedienelemente.
**Ein Token statt zwei.** (Die beiden Agenten haben getrennt gearbeitet
und konnten das nicht sehen.)

#### Wo welches Gold erlaubt ist

| Untergrund | Markengold `#C58A32` | Helles Gold `#D9AB64` | Textgold `#896023` |
|---|---|---|---|
| Tiefschwarz `#0B0B0C` | alles, auch Text (6,61) | alles, auch Text (9,33) | – |
| Anthrazit `#1D2023` | alles, auch Text (5,50) | alles, auch Text (7,76) | – |
| Graphit `#34383C` | Bedienelement (3,97), **kein Text** | alles, auch Text (5,60) | – |
| Warmweiß / Weiß | **nur Dekor** (2,78 / 2,98) | **nur Dekor** (1,97 / 2,11) | alles, auch Text |
| Steingrau `#E9E7E2` | **nur Dekor** (2,41) | **nur Dekor** (1,71) | Text ab halbfett |
| Champagner `#EAD9BB` | **nur Dekor** (2,15) | **nur Dekor** (1,52) | **kein Text**, Bedienelement ja |

„Nur Dekor" heißt: Fläche, Verlauf, Akzentbalken, Trennlinie ohne
Aussage, Symbol **neben** einem Text, der dasselbe sagt. Nie als
alleiniger Träger einer Information – kein Fokusring, kein Feldrahmen,
kein Symbol ohne Beschriftung, kein Link.

**Auf einer Goldfläche steht Tiefschwarz `#0B0B0C`** (6,61:1), nie Weiß
(2,98:1). Das betrifft jeden goldenen Knopf.

**Auf Champagner steht kein Goldtext.** Dort Anthrazit (11,80:1) oder
Tiefschwarz (14,19:1). Ein noch dunkleres Gold (`#7F5920`, 4,52:1)
würde rechnerisch reichen, verlässt aber die Palette – verworfen.

**Steingrau ist ein Grenzfall:** 4,52:1 bei einer Schwelle von 4,5. Der
Abstand beträgt 0,02. Für kleinen Fließtext dort besser Anthrazit.

#### Fokusring: zwei Ringe, umgeschaltet am Abschnitt

Es gibt keinen einzelnen Ring, der auf allen neun Palettenfarben 3:1
erreicht. Geprüft und bestätigt:

| Untergrund | Ring | Kontrast |
|---|---|---|
| Weiß / Warmweiß / Steingrau / Champagner | Anthrazit `#1D2023` | 11,80 – 16,37:1 |
| Anthrazit / Tiefschwarz / Graphit | Champagner `#EAD9BB` | 8,52 – 14,19:1 |
| Markengold / Helles Gold (Flächen) | Tiefschwarz `#0B0B0C` | 6,61 / 9,33:1 |

Umgeschaltet wird über eine **Abschnittsklasse** (`.hell` / `.dunkel`)
und `outline-color` – **nicht** über `prefers-color-scheme`. Helle und
dunkle Bereiche kommen auf derselben Seite vor; die Geräteeinstellung
sagt nichts darüber, worauf der Ring gerade liegt.

Offen: WCAG 2.4.11 verlangt, dass der Fokus **nicht verdeckt** wird. Bei
fester Kopfzeile oder Cookie-Banner ist das im Browser zu prüfen
(`scroll-padding-top`) – rechnerisch nicht feststellbar.

#### Manrope: Größen und Schnitte

- Fließtext mindestens **16 px** (1 rem), Schnitt **Regular 400**
- Kleintext (Hinweise, Beschriftungen) nicht unter **14 px**, dann
  mindestens **Medium 500**
- **Keine Schnitte unter 400.** ExtraLight 200 und Light 300 entfallen
  auch bei Überschriften – sie franst in Gold und auf Dunkel aus
- Überschriften **600 bis 800**

Das ist fachliche Festlegung, keine Messung – die WCAG kennen keine
Mindestgröße. Begründet mit der großen x-Höhe und den offenen Formen
der Schrift.

#### `images/logo-hell.png` fällt aus der Reihe

Es trägt `#E69B26`, ΔE 15,9 zum Markengold – deutlich oranger als das
Hauptlogo. **Das Logo wird nicht umgefärbt.** Entscheidung: Neue Seiten
und Abschnitte benutzen `logo-frei.png`. `logo-hell.png` bleibt nur
dort, wo es heute schon steht, und kommt nie direkt neben
Palettenelemente in `#C58A32` oder `#D9AB64`.

**Liegt beim Auftraggeber:** eine korrigierte Hell-Variante beim
Logo-Urheber anfragen. Bis dahin ist die Abweichung ein dokumentierter
Bestandsfall, kein Fehler.

#### Beim Umstellen der Live-Seite beachten

Der heutige Wert `--gold-text` ist `#7A5B12`, der neue `#896023` ist
**heller**. Beim Tausch können knappe Stellen kippen. Danach **alle**
`scripts/pruefe-*` laufen lassen, nicht die vermuteten.

### Was noch nicht entschieden ist

Die Freigabe gilt für die **neue Webseite**. Für die **laufende**
Live-Seite ist nichts entschieden: Dort gelten weiter die bestehenden
Werte aus `src/css/style.css`, bis du sagst, dass sie umgestellt werden
soll. Eine Umstellung der Live-Seite wäre eine eigene Änderung mit
eigener Prüfung und eigener Freigabe.

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
| Markengold | `#C58A32` | Akzent, sparsam – **nicht als Text auf Hell** |
| Textgold | `#896023` | Gold als Text **und** Bedienelement auf hellem Grund (von den Design-Agenten entschieden) |
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
