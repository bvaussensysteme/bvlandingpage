# Herkunft und Grenzen dieser Regelsammlung

**Quelle:** https://github.com/vercel-labs/web-interface-guidelines
(`command.md`), Lizenz **MIT** (© 2025 Vercel Labs, LICENSE.txt liegt
daneben). Geholt am 06.11.2026 über `raw.githubusercontent.com`.

**Warum nur diese eine Datei:** Der zugehörige Skill aus
`vercel-labs/agent-skills` ist nur eine Hülle – er lädt die Regeln bei
**jeder** Prüfung frisch aus dem Netz. Das ist hier doppelt unbrauchbar:
Die Arbeitsumgebung wird nach jeder Sitzung weggeworfen, und eine Prüfung,
die vom Netz abhängt, ist keine verlässliche Prüfung. Darum liegt die
Regeldatei selbst im Repository (`regeln.md`, Stand 06.11.2026).
**Das `install.sh` des Ursprungsprojekts wurde nicht ausgeführt.**

**Was sie liefert:** über 100 kurze, überprüfbare Regeln zu
Barrierefreiheit, Fokus, Formularen, Animation, Typografie, Bildern,
Leistung, Navigation, Berührung, sicheren Flächen, Dunkelmodus,
Sprache/Region, Hover-Zuständen, Texten – und eine Liste von
Anti-Mustern zum Suchen.

**Grenzen, die hier gelten:**

- Die Regeln sind für **React/Next.js mit Tailwind** geschrieben
  (`focus-visible:ring-*`, `min-w-0`, `line-clamp-*`, `<Link>`, `nuqs`).
  Diese Website ist statisches HTML mit eigenem CSS – übernommen wird die
  **Absicht**, nicht die Schreibweise.
- „These preferences reflect Vercel's brand & product choices": Regeln
  zu Schreibweise (Title Case, „&" statt „und") sind **englische**
  Hausregeln und gelten hier nicht. Deutsche Überschriften stehen nicht
  in Title Case.
- Regeln zu Hydration, `useState`-Deep-Linking und React Native betreffen
  Dinge, die es hier nicht gibt.

Die Sammlung liefert Hinweise. Was gebaut wird, entscheidet der Betreiber.
