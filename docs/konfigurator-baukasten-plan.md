# Konfigurator-Neubau als Baukasten aus echten Profilen

> **Stand: 28.11.2026 · ENTWURF, wartet auf Freigabe und Antworten des Betreibers.**
> Nichts davon ist gebaut. Einstieg für jede Sitzung, die daran arbeitet.

## Warum

Betreiber, 28.11.2026: Weder unser noch der Konfigurator des Kollegen bildet
Rinne, Rinnendeckel und Anschlüsse richtig ab. Bisher entstehen Formen aus
Kästen nach Augenmaß; jede Korrektur erzeugt neue Fehler, Wissen geht
zwischen Sitzungen verloren. Ziel: ein Modell, das maßlich so nah wie möglich
am Original ist, und aus dem **dieselbe Stückliste** für Bild, Maße, PDF und
CRM-Kalkulation entsteht.

## Grundidee: eine Wahrheit, drei Ausgaben

```
Profil-Katalog (Querschnitte in mm, je Profil eine Akte)
        +
Bauplan je System (Regeln: welches Teil, wo, wie lang, wie oft)
        |
        v
   Stückliste (Teil, Artikelnummer, Länge, Anzahl, Lage im Raum)
        |
   +----+-----------------+-------------------+
   v                      v                   v
 3D-Bild (Konfigurator)  PDF / Maße        CRM: VD-Listenpreise
```

Das 3D-Bild ist dann nicht mehr eine eigene Zeichnung, sondern **zeigt die
Stückliste**. Stimmt die Stückliste, stimmen Bild, Maße und Preis zugleich.

## Bausteine

1. **Profil-Akte** (eine Datei je Profil): Name, VD-Artikelnummer, Quelle
   (Datei, Seite, Datum), Querschnitt als Umriss in mm (mit Hohlkammern),
   Bezugspunkt, gegebene und abgeleitete Maße, offene Fragen, Status
   (`entwurf` · `geprueft-ki` · `freigegeben-betreiber`).
2. **Teile, die keine Strangprofile sind** (Rinnendeckel/Endkappen,
   Pfostenkappen, Konsolen, Wandhalter, Motoren): eigene Akte, als festes
   3D-Teil modelliert.
3. **Koordinaten-Vereinbarung** (einmal festgelegt, nie wieder diskutiert):
   Einheit mm; Ursprung an der Hauswand, Oberkante Wandprofil, linke Kante;
   x entlang der Wand, y nach oben, z von der Wand weg.
4. **Bauplan je System** (zuerst TDS): Regeln wie „Sparren alle n mm,
   Rinne über die ganze Breite, Pfosten unter der Rinne bei …". Quelle:
   VD-Montageanleitung und Systemzeichnungen, nicht Vermutung.
5. **Stückliste** als Ergebnis des Bauplans, mit Längen und Zuschnitten.

## Arbeitsweise gegen Fehlerketten und Kontextverlust

- **Ein Bauteil pro Arbeitsschritt.** Erst wenn es freigegeben ist, kommt
  das nächste. Keine zehn Teile auf einmal.
- **Sichtprüfung durch den Betreiber an einem Bild**: nachgebauter Umriss
  über die Originalzeichnung gelegt, dazu die 3D-Ansicht des Einzelteils.
  „Sieht gut aus" am Bild, nicht im Fließtext.
- **Maschinelle Prüfung**: Außenmaße des Umrisses gegen die Maße der
  Zeichnung (Abweichung in mm, Grenze vorher festgelegt); später im
  Zusammenbau Lücken und Überschneidungen zwischen Teilen messen.
- **Unbekanntes wird nicht geraten**: Fehlt ein Maß, steht es als offene
  Frage in der Akte, und das Teil bleibt `entwurf`.
- **Alles steht in Dateien, nicht im Chat**: Akte, Status, Prüfbild,
  offene Fragen. Nach `/clear` liest die nächste Sitzung diese Datei und
  den Katalog und macht genau dort weiter.

## Werkzeuge (Vorschlag)

| Aufgabe | Werkzeug | Warum |
|---|---|---|
| Querschnitt aus PDF holen | PyMuPDF (Python) | VD-Zeichnungen sind oft Vektor-PDFs: Linien lassen sich exakt auslesen statt abzumessen. Bei gescannten Blättern: Abmessen nach den angegebenen Maßen |
| Strangprofile in 3D | three.js `ExtrudeGeometry` aus dem Umriss | Länge beliebig, exakt, kein Zwischenformat |
| Kappen, Konsolen, Kleinteile | CadQuery (Python-CAD) oder Blender ohne Oberfläche, Export als glTF | maßgenau per Skript, wiederholbar |
| Darstellung | three.js **aktuelle Version** als Modul, lokal im Projekt (kein CDN) | neue Grundlage für den Neubau; der bestehende Konfigurator (r128) läuft bis zur Umstellung weiter |
| Leistung | wenige zusammengefasste Objekte, gleiche Teile als Instanzen | Ziel unter 100 Zeichenaufrufe je Bild, auch am Handy |

KI-Bildgeneratoren für 3D (z. B. Higgsfield) sind **nicht** geeignet: nicht
maßgenau.

## Agenten und Skills

Vorhanden und weiter genutzt: `cto` (Aufbau, Rückrollbarkeit),
`frontend-developer` (einziger schreibender Agent), `performance-auditor`,
`qa-accessibility-auditor`, `mobile-ux-auditor`, `reality-checker`;
Skills `three-best-practices`, `3d-high-resolution-textures`.

Neu anzulegen (eigene Dateien unter `.claude/agents/` und
`.claude/skills/`, auf Freigabe):

| Name | Aufgabe | darf schreiben |
|---|---|---|
| `profil-analyst` | liest eine Zeichnung, erstellt die Profil-Akte, listet Maße und offene Fragen | nur Profil-Akten |
| `massprufer` | prüft Umriss gegen Zeichnung und Zusammenbau auf Lücken/Überschneidungen, mit Zahlen | nein |
| `montage-pruefer` | prüft den Bauplan gegen VD-Montageanleitung | nein |
| Skill `profil-modellierung` | Hausregeln: Koordinaten, Einheiten, Aktenformat, Prüfschritte, Freigabe | – |

## Daten und Rechte

- **Die VD-Zeichnungen und Montageanleitungen kommen nicht in dieses
  öffentliche Repository**, sondern in ein privates (Vorschlag: eigenes
  privates Repo oder `bv-crm`). Hier landet nur, was der Konfigurator zum
  Zeichnen braucht.
- Die daraus abgeleiteten Umrisse sind im Browser auslesbar, wie jedes
  3D-Modell. Ob VD das so recht ist, sollte der Betreiber kurz mit VD bzw.
  im Händlervertrag klären. Das ist keine Rechtsberatung.
- Preise nur im CRM (siehe Quellen-Rangfolge in `CLAUDE.md`).

## Reihenfolge

| Phase | Inhalt | Ergebnis |
|---|---|---|
| 0 | Festlegungen: Ablageort, Koordinaten, Aktenformat, Werkzeuge testen, Agenten und Skill anlegen | Werkzeugkette läuft an einem Probeprofil |
| 1 | Betreiber lädt Unterlagen hoch; Bestandsliste je System: welche Teile, welche Zeichnung, was fehlt | vollständige Teileliste TDS |
| 2 | TDS-Teile einzeln: Wandprofil, Rinne, Rinnendeckel, Sparren, Pfosten, Glasleisten, Statikträger … | jedes Teil freigegeben |
| 3 | Bauplan TDS, Zusammenbau in der Werkstatt, Prüfung gegen Montageanleitung | TDS als Baukasten |
| 4 | Stückliste an das CRM: VD-Listenpreise für den Betreiber | Kalkulation aus dem Konfigurator |
| 5 | weitere Systeme: SkyView, Carport, Velaris, Schiebe- und Festelemente, Markisen | je System eigene Runde |
| 6 | Umstellung des öffentlichen Konfigurators, wenn alles da ist | alter Kern wird ersetzt |

Die Szenen-Verbesserungen (Himmel, Haus, Abend) und die Bedienung aus dem
Vergleich vom 28.11.2026 werden **im neuen Kern** gebaut, nicht mehr im alten,
damit nichts doppelt entsteht. Nur die gemessenen Fehler (Paket 0) werden im
bestehenden Konfigurator sofort behoben.

## Was der Betreiber liefert (Phase 1)

1. Querschnittzeichnungen aller Profile mit Maßen, möglichst als
   Original-PDF (nicht abfotografiert).
2. **Montageanleitungen bzw. Systemzeichnungen** je Produkt: Sie zeigen,
   wo welches Teil sitzt. Ohne sie bleibt der Zusammenbau Vermutung.
3. Wo vorhanden: Artikelnummern bzw. Stücklisten aus den Preislisten (liegen
   ausgewertet im CRM).
4. Je Produkt zwei, drei echte Fotos von Rinne, Ecke, Wandanschluss als
   Sichtvergleich.

## Offene Entscheidungen

- [ ] Ablageort der Zeichnungen (privates Repo)
- [ ] Freigabe: neuer Kern mit aktueller three.js-Version
- [ ] Freigabe: neue Agenten und Skill anlegen
- [ ] Erstes System: TDS?
- [ ] Rückfrage bei VD zur Nutzung der Zeichnungen
