# Abstand zur Webseite des Lieferanten

**Stand: 22.11.2026.** Dieses Dokument hält fest, was an der Gestaltung
von bv-aussensysteme.de der Seite des Lieferanten VD AluSysteme glich,
was daraufhin geändert wurde, und welche Werte heute gelten.

**Wozu.** Ansage des Betreibers: „die seite muss jedenfalls so sein das
die nicht ankommen und heulen ich hab die kopiert." Wer das später
behauptet oder bestreitet, findet hier Zahlen statt Eindrücke.

**Das ist keine Rechtsberatung.** Ob und wann eine Ähnlichkeit
rechtlich eine Rolle spielt, beurteilt ein Anwalt. Hier steht nur, was
gemessen wurde.

---

## Wie gemessen wurde

Beide Startseiten am 22.11.2026 in Chromium bei 1440 px Breite
geladen, die **berechneten** Werte ausgelesen (`getComputedStyle`),
nicht die Quelltexte verglichen. Das Skript liegt unter
`scripts/` nicht vor, es war eine einmalige Messung; die Werte unten
sind das Ergebnis.

---

## Was vorher gleich war

| Merkmal | BV, vorher | VD AluSysteme |
|---|---|---|
| Gold als Fläche | `#C58A32` | `#C18A3E` |
| Gold als Text | `#896023` | `#8A5D22` |
| Hauptknopf | Pille, `border-radius: 999px`, Gold gefüllt, fast schwarze Schrift | dasselbe |
| Zweitknopf auf dunklem Grund | durchsichtig, 2 px Rand `rgba(255,255,255,.6)` | durchsichtig, 2 px Rand `rgba(255,255,255,.55)` |
| Eckenradius der Karten | 14 px | 14 px |
| Knopf oben rechts im Kopf | Goldpille „Jetzt anfragen" | Goldpille „Anfrage" |
| Zeile über der Überschrift | kleiner Goldstrich davor, dann Versalien mit Sperrung | derselbe Aufbau |

**Was schon vorher verschieden war:** die Schrift (Manrope gegen
Ubuntu) und der Seitenhintergrund (Warmweiß `#F8F7F4` gegen
Reinweiß).

---

## Warum das Gold bleibt

Das Gold stammt **nicht** vom Lieferanten, sondern aus dem eigenen
Logo von BV AussenSysteme. Die Markenbibliothek nennt `#c67f2d`,
daraus wurde die am 13.11.2026 freigegebene Palette mit `#C58A32`
(siehe `docs/WEBSITE_DESIGN_SYSTEM.md`). Dass beide Betriebe in
derselben Farbfamilie liegen, folgt aus ihren Logos.

Eine andere Hauptfarbe würde mit dem eigenen Logo brechen. Deshalb
entsteht der Abstand über die **Form**, nicht über die Farbe.

---

## Was am 22.11.2026 geändert wurde

Gewählt hat der Betreiber Richtung 4 („weich-eckig") aus acht
vorgelegten Entwürfen.

| Merkmal | BV, vorher | **BV, jetzt** | VD AluSysteme |
|---|---|---|---|
| Knöpfe | Pille 999 px | **10 px** | Pille 999 px |
| Hauptknopf | Gold, kein Rand | **Gold mit 3 px Materialkante unten in `#A3701F`** | Gold, kein Rand |
| Zweitknopf auf Dunkel | 2 px Rand Weiß 60 % | **2 px Rand Champagner `#EAD9BB`, Schrift Champagner** | 2 px Rand Weiß 55 % |
| Zeile über der Überschrift | Goldstrich davor, Versalien | **Kapsel: Fläche `#FAF3E8`, Radius 8 px, kein Strich** | Goldstrich davor, Versalien |
| Karten | 14 px | **20 px** | 14 px |
| Schrift | Manrope | Manrope | Ubuntu |
| Hintergrund | `#F8F7F4` | `#F8F7F4` | `#FFFFFF` |

**Nicht geändert:** runde Symbolknöpfe (die Pfeile an den
Bilderstreifen und am Karussell). Ein runder Knopf um ein einzelnes
Zeichen ist allgemeiner Standard und taugt nicht als
Erkennungsmerkmal.

**Das Erkennungszeichen, das jetzt nur BV hat:** die 3 px dicke
Materialkante am unteren Rand des Hauptknopfs, in dunklerem Gold. Sie
greift auf, was der Betrieb tatsächlich macht, nämlich geschnittene
Aluminiumprofile.

---

## Gemessen nach der Umstellung

| Prüfung | Ergebnis |
|---|---|
| Kontrast Hauptknopf (Schwarz auf Gold) | 6,61:1 |
| Kontrast Zweitknopf auf Dunkel (Champagner) | 11,80:1 bis 14,19:1 |
| Kontrast Kapsel (Goldtext auf `#FAF3E8`) | 5,07:1, auf jedem Abschnitt gleich |
| Kontrast Kapsel auf dunklem Kopf (Champagner) | 10,02:1 |
| `pruefe-mitwachsend` | 91 Messungen ohne Beanstandung |
| `pruefe-darstellung` | 144 von 144 bestanden |
| `pruefe-fokusring` | 6 von 6 bestanden |

**Ein Zwischenstand, der nicht durchging:** Die Kapsel hatte zuerst
eine durchscheinende Goldfläche (`rgba(197,138,50,.14)`). Damit hing
der Kontrast vom Abschnitt darunter ab und fiel auf Steingrau auf
**4,03:1**, also unter die 4,5:1 aus WCAG 2.2, 1.4.3. Mit einer
deckenden Farbe stimmt er überall.

---

## Was offen bleibt

- Zwei Befunde aus der Prüfung der Nutzerführung, die nichts mit der
  Form zu tun haben und eine Entscheidung des Betreibers brauchen:
  Im Kopfbereich konkurrieren fünf Handlungen, und in der unteren
  Leiste sind „Kostenlos anfragen" und „WhatsApp" beide golden
  gefüllt, also zweimal Hauptknopf.
- Die Bildsprache wurde nicht verglichen. Beide Seiten zeigen Fotos
  von Aluminiumbauten im Garten, was in der Branche üblich ist. Ein
  Teil der Fotos stammt ohnehin vom Lieferanten; das ist in
  `docs/VD-INHALTE-INVENTAR.md` festgehalten und eine eigene Frage.
