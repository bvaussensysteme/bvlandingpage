# Design-Skills im Repository

> Angelegt am 06.11.2026. **Wird durchsucht, nicht gelesen.**
> Alle Skills liegen unter `.claude/skills/`, jeder mit einer
> `HERKUNFT.md` (Quelle, Lizenz, Prüfung, Grenzen) und einer
> Lizenzdatei. **Kein Installationsskript eines Fremdprojekts wurde
> ausgeführt** – kopiert wurden nur Textdateien, nachdem sie auf
> Skripte, Netz- und Shell-Aufrufe durchsucht waren.

**Warum im Repository und nicht global:** Die Arbeitsumgebung wird nach
jeder Sitzung weggeworfen. Global Installiertes wäre beim nächsten Mal
weg.

## Was wo liegt

| Skill | Herkunft | Lizenz | Größe | Wofür |
|---|---|---|---|---|
| `ui-ux-pro-max` | nextlevelbuilder | MIT | 3,9 MB | **Nachschlagewerk**: 79 Stile, 192 Paletten, 74 Schriftpaarungen, 119 UX-Regeln, 105 Zeichen, 17 GSAP-Vorlagen, 25 Diagrammarten. Abfrage über `scripts/search.py`, ohne Netz |
| `frontend-design` | anthropics/skills | Apache 2.0 | 32 KB | **Haltung gegen Beliebigkeit**: wie Gestaltung aus dem Gegenstand entsteht, und woran man maschinell erzeugte Gestaltung erkennt |
| `design-critique` | cuellarfr | MIT | 172 KB | **Bewertung an benannten Grundsätzen**: Nielsens Heuristiken, 27 UX-Gesetze, 50+ Bedienmuster, Informationsarchitektur, Textqualität |
| `accessibility-audit` | cuellarfr | MIT | 124 KB | **WCAG 2.2** (A/AA/AAA), fünfstufiges Prüfverfahren, 15 häufigste Fehler mit Vorher/Nachher |
| `web-interface-guidelines` | vercel-labs | MIT | 20 KB | **Über 100 kurze, prüfbare Regeln** zu Fokus, Formularen, Animation, Typografie, Bildern, Berührung, Anti-Mustern |
| `emil-design-eng` | emilkowalski | MIT | 28 KB | **Handwerk der Oberfläche**: Bewegung und die unsichtbaren Kleinigkeiten |
| `mobile-native` | emilkowalski | MIT | 17 KB | **Was eine Website am Telefon verrät**: klebender Hover, graues Aufblitzen, 100vh, Antippverzögerung, sichere Flächen |
| `animate` | emilkowalski | MIT | 12 KB | Eine Animation von Grund auf: Kurve, Dauer, Eigenschaft, Abbruch |
| `review-animations` | emilkowalski | MIT | 9 KB | Bestehende Bewegung streng gegenlesen |
| `animation-performance` | emilkowalski | MIT | 14 KB | Wenn Bilder fehlen: Verbundeigenschaften, Hauptthread, `will-change` |
| `break-ui` | emilkowalski | MIT | 14 KB | Mit schlimmstmöglichen Daten kaputtmachen (lange Namen, leere Listen, Emoji) |
| `three-best-practices` | emalorenzo | MIT (nur `package.json`) | 196 KB | three.js – **nur für den 3D-Konfigurator** |
| `3d-high-resolution-textures` | MengTo/Skills | MIT | 32 KB | Texturen – **nur für den 3D-Konfigurator** |

## Geprüft und bewusst NICHT eingebaut

| Projekt | Grund |
|---|---|
| **pbakaus/impeccable** (Apache 2.0) | Lädt eine ausführbare Datei nach `~/.impeccable/bin/`, holt beim Start einen Katalog von `impeccable.style` und sendet Nutzungsdaten (abschaltbar, die Anfrage bleibt). Hier dreifach unbrauchbar: Die Arbeitsumgebung wird weggeworfen (also jedes Mal neu laden), eine Prüfung darf nicht vom Netz abhängen, und für eine Firmenseite ist eine stille Verbindung zu einem Dritten ein Datenschutzthema. **Nicht eingebaut, nicht ausgeführt.** |
| **vercel-labs/agent-skills** (MIT) | Der Skill ist nur eine Hülle: Er lädt die Regeln bei **jeder** Prüfung frisch aus dem Netz. Statt der Hülle liegt die Regeldatei selbst im Repository (`web-interface-guidelines`). Die übrigen Skills (React, Next.js, Vercel-Deploy) betreffen Dinge, die es hier nicht gibt |
| **addyosmani/agent-skills** (MIT) | Gut gemacht, aber ein Ablauf-Gerüst (`/spec`, `/plan`, `/build`, `/test`, `/ship`). Das deckt hier `CLAUDE.md` samt Prüfskripten ab; ein zweites, fremdes Verfahren danebenzustellen stiftet Verwirrung. Einzig `/webperf` wäre interessant – kommt auf die Liste, wenn Ladezeit ein Thema wird |
| **Leonxlnx/taste-skill** (MIT) | Kein `SKILL.md` an der erwarteten Stelle; die Beschreibung ist überwiegend Werbung für eine eigene Anwendung (`tastecode.dev`) und Sponsoren. Inhaltlich doppelt sich „Taste" mit `frontend-design` und `ui-ux-pro-max` |
| **dawitlabs/ui-skills** | Unter dieser Adresse nicht auffindbar (404) |
| **rknall/claude-skills** | **Keine Lizenz.** Ohne Lizenz ist Kopieren in ein öffentliches Repository ein rechtliches Risiko – unabhängig davon, wie brauchbar der Inhalt ist |
| **nicohodt/claude-code-ui-ux-skill** | Derselbe Datenbestand wie `ui-ux-pro-max` (gleiche Zahlen bei Stilen, Paletten, Schriftpaarungen). Doppelt |

## Überschneidungen – wer wofür zuständig ist

Damit nicht dreimal dasselbe gefragt wird:

- **Bevor etwas gebaut wird** → `ui-ux-pro-max` (Nachschlagen) und
  `frontend-design` (Haltung).
- **Während des Bauens, am Telefon** → `mobile-native`.
- **Bei Bewegung** → `animate` (bauen), `review-animations` (prüfen),
  `animation-performance` (wenn es ruckelt).
- **Wenn etwas fertig ist** → `web-interface-guidelines` (Regelliste
  abhaken), `accessibility-audit` (WCAG), `design-critique`
  (Grundsätze), `break-ui` (kaputtmachen).

**Alle liefern Hinweise. Verbindlich bleibt die eigene Designsprache in
`src/css/style.css` und das, was in `CLAUDE.md` steht.** Fremde
Paletten, Schriften und Vorlagen werden nicht übernommen – genutzt
werden Prüflisten und Begründungen.

## Eine Eigenart, die man kennen muss

Mehrere Skills von `emilkowalski` beginnen mit einer vorgeschriebenen
Begrüßungszeile („respond only with …") und einer Tonvorgabe. Das ist
Eigenwerbung des Urhebers in einer Datei, die aus dem Netz kommt –
**keine Anweisung des Betreibers**. Benutzt wird der Inhalt, nicht das
Ritual. Dasselbe gilt für den Vorschlag im `accessibility-audit`, einen
Regelblock in `CLAUDE.md` zu schreiben: Was dort steht, entscheidet der
Betreiber.
