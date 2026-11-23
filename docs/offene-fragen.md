# Offene Fragen an den Betreiber

> Ausgelagert aus `docs/NEXT_TASK.md` am 23.11.2026. Jede Frage hier
> hält etwas auf oder lässt eine Aussage auf der Seite ungedeckt.
> Erledigte Fragen bleiben mit dem Vermerk stehen, bis sie ins Archiv
> wandern: So ist nachvollziehbar, was schon beantwortet wurde.


## Frage an den Betreiber: dritter Pfosten über 4 m (23.11.2026)

Gemeldet: „und über 4m wird kein 3 pfosten etc hinzugefüget".
Gemessen im freien Konfigurator bei Tiefe 3000 mm:

| System | 4000 | 4100 | 5000 | 5300 |
|---|---|---|---|---|
| TDS · VSG Glas | 2 | **3** | 3 | 3 |
| TDS · Polycarbonat | 2 | 2 | 2 | **3** |
| SkyView · VSG Glas | 2 | 2 | 2 | **3** |
| SkyView · Polycarbonat | 2 | 2 | 2 | **3** |

Die Zahl kommt aus `js/masstabelle.js` (Preisliste, freigegeben am
11.10.2026). Dort springen die Stützfüße je System anders: TDS · Glas
bei 4500, TDS · Polycarbonat bei 5080, SkyView · Glas bei 5900,
SkyView · Polycarbonat bei 6000.

**Nicht ohne Ansage geändert**, weil eine Pfostenzahl eine
Statikaussage ist und die Tabelle im Kopf „ACHTUNG, NICHT KORRIGIEREN"
trägt.

**Zu klären:** Gilt die 4-m-Regel („alle 4000 mm ein Pfosten mehr") für
alle Systeme und Eindeckungen gleich? Dann bekäme
`tabelleBauteile()` eine Untergrenze `2 + floor((Breite − 1) / 4000)`,
und die Tabellenzeilen bleiben unangetastet. Oder liegen die Sprünge
bei SkyView und bei Polycarbonat wirklich später, weil dort ein anderes
Sparrenprofil trägt? Dann ist der Konfigurator richtig und nur das
Gefühl täuscht.


## Drei Fragen aus den Herstellerseiten (23.11.2026)

Beim Auslesen von Balkonüberdachung, Deco Wall, Geländer, Easy Rail
und Sichtschutz sind drei Stellen aufgefallen, an denen unsere Seite
mehr behauptet oder anders behauptet als die Quelle. **Nichts davon
wurde geändert**, weil es Produkt- und Zusageaussagen sind.

**1. Easy Rail: VSG oder nur „Sicherheitsglas"?**
Unsere Seite schrieb „VSG-Sicherheitsglas: klar, opal oder getönt"
und „Verschiedene Glasdicken". Die Herstellerseite nennt für Easy Rail
nur „Sicherheitsglas", ohne Art und ohne Stärke. Ich habe die Zeile
auf „Sicherheitsglas" geändert, weil eine Glasart ohne Beleg eine
technische Zusage wäre. **Wenn in Ihren Unterlagen VSG steht, sagen
Sie Bescheid, dann kommt es zurück, dann aber mit Stärke.**

**2. Deco Wall: 25 Jahre Seaside Beschichtungs-Garantie.**
Steht auf der Herstellerseite wörtlich, gilt dort den Farben. Nicht
auf unsere Seite genommen: Eine Garantieaussage über 25 Jahre ist
nichts, was ich ohne Ihre Bestätigung aufschreibe. **Gilt die
gegenüber Ihren Kunden?**

**3. „10 Jahre Garantie" bei Geländer, Easy Rail und Sichtschutz.**
Diese Zahl steht auf den Herstellerseiten nur im Abschnitt für
Fachhandelspartner, nicht als Zusage an Endkunden. Auf der
Balkonseite steht bei uns „10 Jahre Herstellergarantie auf
Alu-Produkte". **Deckt Ihr Liefervertrag das?** Falls nein, gehört
die Zeile weg, und zwar überall.

**Offen geblieben, weil keine Angabe vorliegt:** Maße der
Balkonüberdachung (Breite, Tiefe, Höhe), Glasstärke und Profilmaß beim
Easy Rail, Maße des DW233. Der Hersteller nennt sie auf seinen Seiten
nicht. Die technische Zeichnung zum Easy Rail könnte sie enthalten;
sie ist ein Bild und wurde nicht gelesen.


## Zwei weitere Fragen aus den Herstellerseiten (23.11.2026)

**4. Velaris: Motorisierung. ERLEDIGT am 23.11.2026.** Antwort des
Betreibers: „velaris is nicht motoresiert, es lässt sich die obere
hälfte und untere hälfte getrennt einstellen". An fünf Stellen
korrigiert, siehe `docs/entscheidungen.md`.

**5. Fahrradüberdachung: „2 bis 20+ Fahrräder". ERLEDIGT am
23.11.2026.** Ansage: „mach modular erweiterbar". An sechs Stellen
ersetzt.

**Weiterhin ohne Angabe beim Hersteller:** Maße von Gartenhaus,
Fahrradüberdachung, Bushaltestelle und Velaris. Keine Breite, keine
Tiefe, keine Höhe, kein Profilquerschnitt, keine Stellplatzzahl. Diese
Zahlen stehen womöglich in den technischen Datenblättern oder im
Produktkatalog 2026 (PDF, 20,5 MB). Beides wurde nicht abgerufen.
**Soll ich die PDFs holen und auswerten?**


## Offen beim Hersteller: Holzdekorprofile, Farbzahl (23.11.2026)

Der Produktkatalog 2026 überschreibt die Farbliste der
Holzdekorprofile TDS mit „ERHÄLTLICH IN 3 FARBEN" und zählt darunter
sechs auf: Optik Eiche, Optik Kiefer, RAL 7016, RAL 9006, RAL 9007,
RAL 9010. Auf unserer Seite steht „Sechs Ausführungen" und die Liste;
die 3 ist nicht übernommen. **Beim Hersteller nachfragen, welche Zahl
gilt.**


## Noch nicht entschieden (23.11.2026)

- **Garantie. ENDGÜLTIG GEKLÄRT am 23.11.2026** und als Dauerregel in
  `CLAUDE.md` festgeschrieben: 10 Jahre auf Aluminium, 5 Jahre auf
  Markisen, 2 Jahre auf Elektrik. **Nicht mehr fragen.** Alle 34
  Produktkarten tragen die passende Zeile.
- **Fremde Modellnamen. ERLEDIGT am 23.11.2026.** Ansage: „fremde
  namen nicht übernehmen". Sie standen bereits auf
  `produkte/sonnenschutz.html` und in 26 Bilddateinamen; beides
  bereinigt, siehe `docs/entscheidungen.md`.
