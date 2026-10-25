# Balkonüberdachung im 3D-Konfigurator

Stand: 25.10.2026. Fachdokument zu `js/konfigurator-3d.js` und
`js/anfrage-wizard.js`. Der Einstieg (`docs/NEXT_TASK.md`) verweist
hierher und wiederholt das hier nicht.

## Warum es sie gibt

„Ich möchte noch eine Option und zwar, Balkonüberdachungen. Es müssen
natürlich viele sachen beachtet werden, z.B hat man ein normales geländer
oder wie hier eine wand vorne, geht die tiefe nur bis zum geländer oder
baut man wie auf dem foto auf die mauer vorne" (Betreiber, 25.10.2026,
mit zwei Zeichnungen: Balkon 3,65 m breit, 1,31 m tief, Brüstung 1,00 m,
Seitenwangen 1,83 m links und 1,75 m rechts).

Entschieden hat der Betreiber am selben Tag zwei Dinge:

| Frage | Entscheidung |
|---|---|
| Umfang | **Erst nur das Dach.** Die Verglasung (sein zweites Bild, Schiebeelemente ringsum) kommt später, wenn das Dach sitzt |
| Pfosten | **Zwei Stellungen:** auf der Brüstungsmauer und dahinter auf dem Balkonboden. Freitragend und außen an die Platte geschraubt wurden verworfen |

## Was VD anbietet — und was nicht belegt ist

Von `vd-alusysteme.de/balkonueberdachung` (gelesen 25.10.2026):
VSG 8 mm klar oder opal, Polycarbonat 16 mm klar oder opal, vier
Standardfarben (7016, 9006, 9007, 9010), Wunschfarbe gegen Aufpreis,
Beschattung/LED/Lautsprecher als Erweiterung, Varianten „mit Überstand"
und „mit Verglasung". **Technisch dasselbe System wie das Terrassendach
TDS** — deshalb erbt der Konfigurator alles von dort.

**Nicht belegt, deshalb offen (gehört in `daten/rueckfragen-an-vd.md`):**

* Maßgrenzen für Breite, Tiefe und Höhe. Im Konfigurator stehen
  1500–7000 / 800–2500 / 1900–2600 mm — an gängigen Balkongrößen
  ausgerichtet, **nicht** an einer Herstellerangabe.
* Ob VD freitragend (ohne Pfosten) anbietet und bis zu welcher Tiefe.
* Ob es eine eigene Befestigung für die Montage auf einer Brüstung gibt.
* Ob die Stückliste des Servers (Preislisten-Matrix) für Balkonmaße
  überhaupt gilt — siehe unten.

## Wie es gebaut ist

Die Balkonüberdachung ist **eine Variante des Terrassendachs TDS**, kein
zweiter Bauweg. `istTdsDach()` fasst beide zusammen; wo früher
`Z.produkt === 'Terrassendach TDS'` stand, steht jetzt diese Funktion.
Dadurch gelten Neigung, Rinne, Pfostenachse, Dachvorsprung, Maßtabelle
und Farben unverändert.

Anders sind genau drei Dinge, und nur die stehen im Code eigens da:

1. **Maßgrenzen** (`MASSE['Balkonüberdachung']`).
2. **Die Brüstung** (`bruestungBauen()`): Mauer mit Abdeckblech oder
   Glasgeländer mit Hand- und Fußprofil. Sie gehört nicht zur Lieferung —
   sie steht im Modell, weil sonst niemand sieht, ob das Dach passt.
3. **Die Pfostenstellung** (`pfostenAufBruestung()`): auf der Mauerkrone
   (Pfosten um die Brüstungshöhe kürzer) oder dahinter auf der Platte.

**Das Tiefenmaß bedeutet beim Balkon etwas anderes.** Eingegeben wird die
nutzbare Balkontiefe (Hauswand bis Innenkante Brüstung) — so ist es in
der Zeichnung des Betreibers bemaßt und so misst man am Bau nach. Das
**Dach** reicht um die Brüstungsdicke weiter nach vorn, bis zur
Außenkante; sonst tropft die Rinne auf die Brüstung. Beides steht in der
Anfrage, damit es niemand verwechselt.

### Zwei Ausnahmen, die man kennen muss

* **`keilErlaubt()` nennt die Produktnamen ausgeschrieben**, obwohl es
  `istTdsDach()` gäbe. `scripts/pruefe-konfigurator.js` liest aus dieser
  Funktion und aus `keilAllowed()` im Anfrage-Assistenten die Namen und
  vergleicht beide Listen. Hinter einer Hilfsfunktion versteckt, könnte
  die Prüfung nichts mehr vergleichen — genau das ist beim Einbau
  passiert und sofort aufgefallen. **Wer hier ein Produkt ergänzt,
  ergänzt es auch in `js/anfrage-wizard.js`.**
* **`datenSystem()` kennt den Balkon absichtlich nicht.** Die Stückliste
  des Servers rechnet mit Terrassenmaßen (Pfostenlängen ab Boden,
  Statikträger ab 4,5 m Tiefe). Ein Balkondach ist 1,3 m tief und seine
  Pfosten stehen oft auf der Brüstung — dieselbe Tabelle gäbe falsche
  Stückzahlen. Der Balkon läuft deshalb über den geschätzten Bauweg.

### Was bewusst NICHT gebaut ist

* **Die Seitenwangen** aus der Zeichnung (1,83 m / 1,75 m). Sie sind an
  jedem Haus anders hoch; zwei falsche Wände im Modell wären schlechter
  als keine. Wer Seiten will, nimmt die vorhandenen Erweiterungen
  (Glaswand, Plankenwand).
* **„Freistehend".** Ein Balkondach hängt immer an der Hauswand. Der Wert
  wird in `aendern()` gesetzt, nicht nur das Feld ausgeblendet — sonst
  käme ein geteilter Link mit „Freistehend" als unbaubares Modell zurück.
* **Die Verglasung** (zweites Bild des Betreibers). Zurückgestellt.

## Das Baurecht ist hier ein anderes

Die Erleichterungen der Landesbauordnungen gelten für Anbauten **„zu
ebener Erde"** — so wörtlich die LBO Rheinland-Pfalz. Ein Dach auf einem
Balkon im Obergeschoss fällt nicht automatisch darunter. Dazu kommen
Abstandsflächen, das Erscheinungsbild der Fassade und in einer
Eigentümergemeinschaft ein Beschluss der übrigen Eigentümer.

Deshalb steht im Bedienfeld ein **eigener Hinweis** (`.k3d-notiz`), der
beim Terrassendach nicht erscheint. Er bewertet nichts — er sorgt dafür,
dass vorher gefragt wird. **Die Seite `/baugenehmigung.html` behandelt
bisher nur ebenerdige Terrassenüberdachungen. Wer dort Balkone ergänzt,
braucht die Länderregelungen dafür eigens — sie sind nicht dieselben.**

Offen und nicht geprüft: ob Balkonplatte und Brüstung die Lasten
aufnehmen (Windsog an der Gebäudekante ist bei Balkonen erheblich). Das
entscheidet der Statiker oder der Monteur beim Aufmaß; der Konfigurator
sagt das auch.

## Wie es geprüft wird

`node scripts/pruefe-balkon.mjs` — 14 Prüfungen im echten Browser, am
fertigen Modell. Gemessen werden **Eckpunkte in Weltkoordinaten**, nicht
achsparallele Hüllquader (die lügen bei geneigten Teilen) und nicht die
Eingabefelder. Geprüft wird unter anderem: Pfostenfuß auf 100 cm bei
Pfosten auf der Brüstung, auf 0 cm bei Pfosten auf dem Boden; der Pfosten
steht hinter der Brüstung und nicht in ihr; das Dach reicht bis zur
Außenkante; beim Geländer verschwindet die Pfosten-Auswahl; der
Baurechts-Hinweis steht da; keine Javascript-Fehler.

`--gegenprobe` baut den naheliegendsten Fehler ein (Pfostenfuß ignoriert
die Brüstung, Brüstung wird nicht gebaut) und verlangt namentlich, dass
drei bestimmte Prüfungen anschlagen. **Beim ersten Lauf hat die
Gegenprobe eine echte Schwäche der Prüfung aufgedeckt:** Fehlt die
Brüstung ganz, lief der Vergleich „Pfosten steht dahinter" ins Leere und
bestand ausgerechnet im Fehlerfall. Seitdem gehört `br.length >= 1` ins
Kriterium.
