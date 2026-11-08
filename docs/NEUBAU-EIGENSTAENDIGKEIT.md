# Neubau: Eigenständigkeit, Markenkonsistenz, Zielgruppe

Stand 08.11.2026. Geprüft: `entwurf.html`, `entwurf-produkt.html` (nur Kopf und Struktur), `entwurf-apple.html`, `entwurf/stil.css`, `entwurf/apple.css`, `src/css/style.css` (Token), Skill `apple-design` (SKILL.md, liquid-glass.md, HINWEIS.md).

**Grenze dieser Prüfung:** Das ist eine gestalterische Einschätzung, keine Designrechtsprüfung. Mir fehlen Quellen (Apples Marken-, Geschmacksmuster- und Nutzungsbedingungen, Rechtsprechung) und die Befugnis für eine rechtliche Bewertung. Ich habe apple.com nicht aufgerufen und nicht Wert für Wert verglichen. Wo unten steht „Apples Wert", beruht das auf meiner Kenntnis der öffentlich sichtbaren Seite und ist nicht belegt. Ob etwas rechtlich problematisch ist, entscheidet der Fachanwalt (Marken-/Wettbewerbsrecht). Hier wird nur vorbereitet.

---

## 1. Eigenständigkeit

### Gesamturteil

- **Einzeln ist fast nichts davon Apple-spezifisch.** Mittige Überschrift über einem Vollbild-Foto, Pillen-Knöpfe, abgerundete Kacheln, ein waagerechter Bildlauf mit Einrasten und Einblenden beim Scrollen sind im Netz verbreitet.
- **Auffällig ist die Häufung, verbunden mit mehreren Maßen, die ich als Apples Werte kenne.** Ein Kenner der Apple-Produktseiten erkennt den Aufbau wieder: Kopfbereich, Kachelraster, Farben, Bewegung und Tonfall der Texte stimmen zugleich überein.
- **Entwurf 1 und 2 (`entwurf.html`, `entwurf-produkt.html`, `stil.css`)** erinnern nicht an Apple. Ihr eigenes Problem ist ein anderes: Sie folgen einem verbreiteten Muster (nahezu schwarz mit einem Akzent, Haarlinien, kein Radius, Ziffern und Rubrikzeilen). Das ist beliebig, aber nicht anlehnend. Rechtlich unauffällig, gestalterisch austauschbar.
- **Entwurf 3 (`apple.css`, `entwurf-apple.html`) ist an mehreren Stellen zu nah dran.** Die Stellen stehen unten. Die Vorlage ist hier mit Absicht gewählt, der Dateiname und mehrere Kommentare sagen es offen (siehe 1.1, letzter Punkt).

### 1.1 Stellen, die zu nah dran sind (nach Gewicht)

| # | Stelle | Was daran auffällt | Eigenständige Alternative |
|---|---|---|---|
| 1 | `apple.css:47-49, 59-62` Farben `#F5F5F7`, `#1D1D1F`, `rgba(245,245,247,…)` | Das sind die Grau- und Schriftwerte, die ich aus Apples Webauftritt kenne (helle Fläche `#F5F5F7`, Text `#1D1D1F`). Zusammen mit Wechsel „weiß / hellgrau" der Abschnitte (`entwurf-apple.html:60, 86`, Inline-Style `var(--flaeche)`) ist das der erkennbarste Einzelpunkt. | Eigene Neutrale aus den Markenwerten ableiten: warmes Grau passend zu Off-White `#F5F2EB` aus dem Designsystem für hell, `#111111` (`--black`) als Text- und Dunkelwert. Das ist zugleich markentreuer. |
| 2 | `apple.css:56` `--kurve: cubic-bezier(.28,.11,.32,1)` | Diese Kurve kenne ich als die auf apple.com verwendete. Sie ist ein Fingerabdruck, der im Code liegt, nicht im Auge. Das Risiko ist klein, aber die Behebung kostet nichts. | `cubic-bezier(.22,.61,.36,1)` (allgemeine „ease-out"-Familie) oder die bereits im Stil 1 genutzte `(.16,1,.3,1)`. Dauern kürzer (0,25 s) und ohne Skalierung. |
| 3 | `apple.css:54` `--rund-pille: 980px`, `:113`, `:119` | 980px als Pillenradius ist ein Wert, den ich Apples Knöpfen zuordne. Pillenform allein ist frei. Die Kombination mit 46 px Höhe, 16 px/500 und `scale(.975)` beim Drücken (`:124`) ergibt aber den Apple-Knopf. | Knopfform der Seite behalten: `--radius` 10 px aus `src/css/style.css` (`.btn`, Zeile 183), Gold-Fläche, dunkle Schrift. Der bestehende Knopf ist bereits eigenständig und bekannt. |
| 4 | `apple.css:89-107` Kopfzeile: 52 px hoch, Milchglas mit `saturate(180%) blur(26px)`, 13 px Navigation mittig/rechts, kleiner Knopf rechts, Haarlinie unten | Dieses Rezept ist das der Apple-Navigationsleiste fast eins zu eins (Höhe, Glas, kleine Nav-Schrift, farbiger Kleinknopf rechts). | Hellere, höhere Kopfzeile (64–72 px) mit deckender Fläche statt Glas, Telefonnummer sichtbar neben dem Knopf (Vertrauen, siehe Teil 3). Glas braucht eine Website nicht; der Skill selbst verlangt Sparsamkeit (`liquid-glass.md › Where the material belongs`). |
| 5 | `apple.css:138-157` und `entwurf-apple.html:32-47` Kopfbereich | Mittig, Text unten im Bild, Überschrift 600 mit −0,032 em Laufweite und Zeilenhöhe 1,05, darunter ein kurzer Satz bei `34ch`, zwei Pillen, kleine graue Fußzeile. Das ist der bekannte Apple-Produktaufbau. | Textblock linksbündig (z. B. unten links, wie `stil.css` es tut) und Überschrift in Barlow Condensed 700 großgeschrieben, wie `src/css/style.css:155`. Eine einzige gut sichtbare Telefonzeile statt zwei gleichwertiger Pillen. |
| 6 | `entwurf-apple.html:39, 53, 64, 80, 90, 103` Texttonfall | Reihung kurzer Sätze mit Punkt: „Ihr Traumplatz draußen. Das ganze Jahr." – „Alles für draußen. Aus einer Hand." – „Kostenlose Beratung. Wir kommen zu Ihnen." Und „Kostenlos konfigurieren" als Knopf. Der Rhythmus ist Apple-typisch (Textbausteine dürfen laut `CLAUDE.md` nicht nachgezeichnet werden). | Aussagesätze in der Sprache eines Handwerkers: konkret, mit Zahl, Ort und Handlung („Wir messen bei Ihnen zu Hause aus. Das Angebot kommt in 24 Stunden."). Das ist auch überzeugender. Knopf: „Beratung anfragen". |
| 7 | `apple.css:169-182` Kacheln | Radius 28 px, Fläche `#101010`/`#F5F5F7`, Bild oben, Titel, Satz, „Mehr erfahren ›" unten; Hover hebt um 4 px und zoomt das Bild (`:175, :178`). Dreier-/Zweierraster mit 22 px Abstand. | Radius aus dem Token (`--radius-lg` 16 px, `src/css/style.css:92`), Karte mit `--shadow` statt flächiger Farbe, Hover nur Schatten/Rahmen in Gold, kein Zoom. |
| 8 | `apple.css:127-135` Textlink mit Winkel (Kommentar sagt selbst „Apples ‚Learn more ›'") | Gleiche Funktion, gleiche Form: Text mit „›" in Akzentfarbe. Der Winkel ist ein verbreitetes Muster, aber hier absichtlich als Nachbau benannt. | Pfeil „→" in Barlow Condensed Großbuchstaben, oder Unterstrich in Gold. |
| 9 | `apple.css:204-224` Referenzlauf mit zwei runden Pfeilknöpfen (40 px, graue Fläche), zentriert unter dem Lauf | Apples Galerie-Bedienung. Der Stil 1 hat stattdessen einen Fortschrittsbalken und gerahmte 52-px-Knöpfe (`stil.css:188-201`), also schon abweichend. | Vom Stil 1 den Fortschrittsbalken übernehmen oder eine ruhige Raster-Galerie ohne Lauf (für 45+ ohnehin klarer, siehe Teil 3). |
| 10 | `apple.css:190-194` Zahlenkacheln mit großer 600er Zahl über kleinem grauem Text | Das ist zugleich das Muster, das der Skill selbst als Schablone nennt (`SKILL.md`, Lens 3: „a hero built from a big number over a small label"). Außerdem sind die vier Zahlen inhaltlich schwach (`entwurf-apple.html:153`: „1 Ansprechpartner", „9 Produktkategorien"). | Echte Zahlen mit Ortsbezug (fertige Projekte, Jahre am Markt, Anfahrt), sobald belegbar. Sonst weglassen. |
| 11 | Benennung: Dateiname `entwurf-apple.html`, `entwurf/apple.css`, Kopfkommentar `apple.css:1-34`, `:127`, `:31-33`, Skill-Ordner | `CLAUDE.md` („Nachbauten: eigene Sprache, eigene Namen") verlangt: kein fremder Name in Dateinamen, Kommentaren, Doku. Apple ist kein Wettbewerber im Sinn der Regel, aber der Grundgedanke (nichts nachzeichnen, nichts benennen) gilt hier sinngemäß, und der Kopfkommentar dokumentiert die Anlehnung ausdrücklich. Das ist, falls es je zum Streit käme, ein schlechter Beleg. | Vor einer Übernahme in die Produktion umbenennen (z. B. `entwurf-ruhig.html`, `entwurf/ruhig.css`) und Kommentar auf die Prinzipien kürzen (Gewicht ≥ 400, 17-px-Grundschrift, ein Gedanke je Abschnitt) ohne Apple zu nennen. Der Skill-Ordner `.claude/skills/apple-design/` selbst ist ein Werkzeug und nicht Teil der Seite. |

### 1.2 Was in Entwurf 3 unkritisch ist

- **Funktionen und Prinzipien:** Lesbarkeit (Grundschrift 17 px, keine Gewichte unter 400), ein Gedanke je Abschnitt, Hell/Dunkel nach Geräteeinstellung, `prefers-reduced-motion` und `prefers-reduced-transparency`, Fokusrahmen. Das sind Regeln guter Gestaltung, kein Markenauftritt.
- **Schrift:** Inter (offene Lizenz) mit Systemschrift als Ersatz. Apples Schriften werden nicht geladen (`apple.css:31`). Hinweis: `-apple-system` und `BlinkMacSystemFont` in `apple.css:53` zeigen nur dann Apples Systemschrift, wenn Inter nicht geladen ist. Technisch üblich, aber zusammen mit allem anderen könnte es auf Apple-Geräten noch ähnlicher wirken. Entfernen kostet nichts: `Inter, system-ui, sans-serif`.
- **Logo, Bilder, Icons:** nicht übernommen, eigene Logos. Das Gold ist die eigene Markenfarbe.

### 1.3 Nebenbefunde (kein Eigenständigkeitsthema, aber beim Lesen aufgefallen)

- **Fehler im hellen Modus, `apple.css:81, 147-149, 151, 153`:** Die Überschrift im Kopfbereich nimmt `var(--schrift)` (im hellen Modus `#1D1D1F`, dunkel). Das Schleierbild bleibt aber dunkel (`rgba(0,0,0,.4–.52)`). Folge: dunkle Schrift auf dunklem Foto, `.marke` mit `#7A5B12` ebenso. Das ist ein Lesbarkeitsfehler, kein Gestaltungsgeschmack. Behebung: Im Kopfbereich Schriftfarben fest hell setzen (wie `.lauf figcaption`, Zeile 214) oder das Schleierbild im hellen Modus aufhellen. Nicht per Rendering geprüft, aus dem Code gelesen.
- **Kontrast im hellen Modus, `apple.css:62`:** `--schrift-3` ist 50 % von `#1D1D1F` auf Weiß, grob `#8E8E8F`, nach meiner Schätzung rund 3,3:1. Verwendet für 14–14,5 px Text (`:157, :194, :234`). Das liegt unter 4,5:1. Geschätzt, nicht gemessen.
- **Kontrast Stil 1, `stil.css:15`:** `--text-schwach: rgba(255,255,255,.48)` auf `#0C0C0C` liegt grob bei 4,4–4,6:1, an der Grenze. Wird für Fließtext in `.stueck p`, `.punkte p`, `.schritt p` (`:179, :211, :239`) verwendet, also kein Randtext.
- **Quelle der Bilder:** Die Entwürfe zeigen `vd_prod_*`-Bilder und den Namen „VD AluSysteme" (`entwurf-apple.html:146`). Das gilt nach `CLAUDE.md` für die Regel zu VD-Inhalten, nicht für diese Prüfung. Nur zur Kenntnis.
- **Google Fonts per Link (`entwurf-apple.html:10-12`, `entwurf.html:8-10`):** Externe Schriftbindung überträgt IP-Adressen an Google. Ob die Produktivseite lokal hostet, habe ich nicht geprüft. Falls nicht, ist das ein Datenschutzthema (Datenschutzerklärung mitziehen, `CLAUDE.md`).

---

## 2. Konsistenz zur Marke

**Fakt:** Die verbindliche Sprache steht in `src/css/style.css`: Gold `#C49A2A`, Radius 10 px (`--radius`, `:20`), Barlow Condensed für Überschriften und Knöpfe (`:130, :155, :180`), Inter für Fließtext.

### Was Entwurf 3 mit nur Inter kostet

1. **Die Seite verliert ihre wichtigste Stimme.** Barlow Condensed in Großbuchstaben mit Gold ist das, was die Marke von der Masse der Handwerker-Websites unterscheidet, und es ist das Element, das *nicht* nach Apple aussieht. Wer es weglässt, entfernt genau den Teil, der die Seite eigenständig macht. Das verbindet Frage 1 und 2.
2. **Bruch zu allem Bestehenden.** Neue Seite in Inter 600, bestehende Seite, Broschüre, Fahrzeug, Angebot in Condensed: Der Besucher, der von Google-Maps-Eintrag, Flyer oder Anzeige kommt, erkennt das Unternehmen nicht wieder. Für ein Unternehmen, dessen Verkaufsargument „Ihr Fachbetrieb aus der Region" ist, wiegt das schwerer als bei einem Weltkonzern.
3. **Gold wird zu einem Akzent unter vielen** statt zum Markenzeichen, weil Form und Schrift die Marke nicht mehr tragen.

### Was es gewinnt

1. **Ruhe und Lesbarkeit:** Eine breite, offene Schrift in 17 px ist für Fließtext bei 45+ besser als eine schmale. Das gilt aber nur für **Fließtext**, und dort setzt die bestehende Seite ohnehin Inter ein.
2. **Eine Schriftdatei weniger** (weniger Ladezeit, weniger externe Anfragen).
3. **Weniger Gewichtsstufen**, klarere Hierarchie.

Der zweite und dritte Gewinn ist klein. Der erste hängt gar nicht von der Weglassung ab.

### Empfehlung

**Barlow Condensed bleibt in Überschriften, Rubrikzeilen und Knöpfen (Gewicht 700, wie `src/css/style.css`), Inter bleibt im Fließtext.** Vom Apple-Entwurf übernommen wird die **Struktur und die Lesbarkeitsregeln** (17-px-Grundschrift, ein Gedanke je Abschnitt, mehr Luft, Fokus, reduzierte Bewegung), **nicht** die Optik (Pillen, 28-px-Radius, Grautöne, Glas). Radien und Schatten kommen aus den vorhandenen Token (`--radius`, `--radius-lg`, `--shadow`), Gold als Knopf- und Linienfarbe, `--gold-text` auf hellem Grund.

Das löst beide Probleme zugleich: Die Marke bleibt erkennbar, und die Ähnlichkeit zu Apple entfällt, weil die auffälligsten Merkmale (andere Schrift, andere Knöpfe) markeneigen sind. Fließtext in Condensed ist ausdrücklich nicht gemeint.

---

## 3. Zielgruppe: Hausbesitzer ab ca. 45, Westerwald, Terrassenüberdachung

**Einschränkung:** Ich habe keine Daten über diese Besucher (Gerät, Tageszeit, Absprungrate je Seite). `docs/zahlen-lesen.md` wurde nicht ausgewertet; die Argumente unten sind Sachargumente aus Lesbarkeit und Kaufverhalten, keine Messung. Sobald genug Aufrufe je Seite vorliegen (Richtwert: über 100), gehört das gegengeprüft.

### Argumente

1. **Lesbarkeit nimmt ab 45 messbar ab** (Altersweitsichtigkeit, geringere Kontrastempfindlichkeit). Daraus folgt: größere Grundschrift, kräftiger Kontrast, keine dünnen Gewichte, keine großbuchstaben-gesperrten Kleintexte.
   - **Entwurf 1/2:** viele 12,5–13 px Rubrikzeilen in Großbuchstaben mit 0,18–0,3 em Sperrung (`stil.css:46-52, 269, 367-369`), Fließtext 16 px, schwacher Text 48 % Weiß, Umrissziffern (`:234-237`). Das ist das ungünstigste Profil für diese Gruppe.
   - **Entwurf 3:** 17 px Grundschrift, nichts unter Gewicht 400, die kleinsten Texte 13–14,5 px. Deutlich besser, bis auf den hellen-Modus-Kontrast aus 1.3.
2. **Dunkel als Voreinstellung ist für diese Zielgruppe die falsche Wahl.** Helle Schrift auf Schwarz wirkt bei Altersweitsichtigkeit unschärfer (Lichthöfe), und Hausbesitzer, die eine Terrasse planen, erwarten Tageslicht, Holz, Garten, nichts Nächtliches. Entwurf 3 folgt wenigstens der Geräteeinstellung. Es ist der einzige mit hellem Modus. Eine Seite mit dem Bestand (hell, `src/css/style.css`) als Standard ist noch näher an dem, was die Kunden bei Google und auf Flyern schon gesehen haben.
3. **Vertrauen ist bei einer Investition von mehreren tausend Euro das Hauptargument, nicht Ästhetik.** Alle drei Entwürfe zeigen **keine Gesichter, keine Kundenstimmen, keine Orts-Referenzen mit Namen, keine Telefonnummer in der Kopfzeile**. Entwurf 1 und 2 haben immerhin den „Anrufen"-Knopf im Kopf (`entwurf.html:43`), Entwurf 3 bietet die Nummer erst ganz unten (`entwurf-apple.html:106`). Das ist nach den Grundsätzen der UX-Rolle („Lokales Vertrauen > globales Design") ein Mangel, den **keiner** der Entwürfe behebt.
4. **Mobil dominiert vermutlich, aber nicht belegt.** Dafür sprechen Antippflächen: Entwurf 3 hat Pillen mit 46 px, aber den Kopfzeilenknopf nur 34 px hoch (`apple.css:123`, unter dem 44-px-Wert, den `CLAUDE.md` als Prüfliste nennt) und die Pfeilknöpfe 40 px (`:217`). Entwurf 1 hat 50 px und 52 px.
5. **Querläufe mit Wischen sind für diese Gruppe riskant.** Alle drei verstecken die neun Leistungen bzw. die Referenzen in einem waagerechten Lauf. Wer den Lauf nicht entdeckt, sieht nur einen Teil. Entwurf 3 zeigt die Leistungen immerhin im festen Raster (`apple.css:166-168`), nur die Referenzen laufen. Entwurf 1 versteckt die **Leistungen** im Lauf (`entwurf.html:70`), das ist für einen Besucher mit konkretem Wunsch („Terrassenüberdachung") der falsche Ort.
6. **Das Magazinhafte (Entwurf 1/2)** (Laufband mit Wörtern, Umrissziffern, Haarlinien) spricht eher Designinteressierte an als jemanden, der ein Angebot einholen will. Das ist Sache der Konversion (Prinzip 1), nicht des Geschmacks: Je mehr Stilmittel, desto mehr Aufmerksamkeit geht vom Anrufen weg.

### Rangfolge

1. **Entwurf 3** als Grundlage, aber mit den Änderungen aus Teil 1 und 2. Er ist ruhiger, größer geschrieben und hat den Hellmodus.
2. **Entwurf 2 (Produktseite)**: gute Struktur (Modell, Merkmale, Ausklapper, Formular), aber dieselben Lesbarkeitsprobleme wie 1.
3. **Entwurf 1**: stärkste Markenbindung (Barlow, Gold), schwächste Lesbarkeit für die Zielgruppe, Leistungen im Lauf versteckt.

---

## 4. Empfehlung

Entwurf 3 als Gerüst weiterverfolgen, aber in der Ausführung eigenständig machen: Barlow Condensed für Überschriften und Knöpfe zurückholen, Radien, Schatten und Knopfform aus `src/css/style.css` nehmen, die Apple-typischen Grautöne, Easing, 980-px-Pillen, Glas-Kopfzeile und den Satzrhythmus ersetzen, und den hellen Modus als Standard setzen (mit dem Kontrastfehler im Kopfbereich zuerst behoben). Dazu fehlt allen drei Entwürfen, was bei dieser Zielgruppe am meisten zählt: sichtbare Telefonnummer in der Kopfzeile und echte Referenzen mit Ortsnamen.
