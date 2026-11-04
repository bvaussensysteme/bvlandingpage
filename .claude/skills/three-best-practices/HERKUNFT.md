# Herkunft und Grenzen dieses Skills

**Quelle:** https://github.com/emalorenzo/three-agent-skills (`skills/three-best-practices/`),
Fassung 1.2.0, Lizenz **MIT** (`package.json`; eine LICENSE-Datei liegt dem
Ursprungsverzeichnis nicht bei – der Urhebervermerk wird deshalb hier
geführt: © die Urheber von `three-agent-skills`, MIT).

**Geprüft am 04.11.2026:** nur Textdateien, keine Skripte, keine
`allowed-tools`-Angabe, keine Netz- oder Shell-Aufrufe. Die Treffer auf
„env" sind `envMap` und `process.env` in Beispielcode.

**Grenze, die hier gilt:** Dieses Projekt verbaut **three.js r128** (2021,
`js/vendor/three.min.js`). Alle Regeln zu WebGPU, TSL, Node-Materialien,
`scene.environmentIntensity` und `outputColorSpace` betreffen r152 und
neuer und gelten hier **nicht**. Brauchbar sind vor allem
`draw-call-optimization.md`, `memory-dispose-geometry.md`,
`mobile-optimization.md`, `raycasting-optimization.md` und
`lighting-shadows-advanced.md` – und auch dort gilt: was der Konfigurator
schon tut (Zeichnen nur bei Bedarf, gedrosseltes Überfahren, Schattenkarte
ohne Daueraktualisierung), wird nicht „nach Regel" umgebaut.

Der Skill liefert Hinweise. Was gebaut wird, entscheidet der Betreiber.
