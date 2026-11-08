# Warum hier nur eine Datei liegt

Der Skill bringt im Original 123 weitere Dateien mit: die **Human Interface
Guidelines von Apple**, Wort für Wort von developer.apple.com übernommen.

Die liegen hier bewusst **nicht** im Repository:

- Das Quell-Repository hat **keine Lizenzdatei**. Im README steht
  wörtlich: „The guideline text belongs to Apple Inc. … provided as they
  are; use them at your own discretion."
- Damit wäre dieses Geschäfts-Repository der Ort, von dem aus Apples
  Dokumentation weiterverbreitet wird. Das kollidiert mit der eigenen
  Regel in `CLAUDE.md`: „Übernommen werden nur Ideen und Fakten – nie
  fremde Dateien, Bilder, Texte oder Code."
- `liquid-glass.md` bleibt, weil es laut README vom Autor des Skills
  selbst geschrieben ist und nicht von Apple stammt.

**Wer die Seiten braucht**, holt sie mit dem mitgelieferten Skript
direkt bei Apple:

    node .claude/skills/apple-design/scripts/pull-hig.mjs

Das Skript ist vor dem ersten Einsatz gelesen worden: Es lädt JSON von
`developer.apple.com`, schreibt Markdown nach `references/hig/` und tut
sonst nichts – kein Shell-Aufruf, kein Löschen außerhalb des eigenen
Ausgabeordners.
