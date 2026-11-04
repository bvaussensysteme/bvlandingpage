# Herkunft und Grenzen dieses Skills

**Quelle:** https://github.com/MengTo/Skills (`agent-skills/3d/3d-high-resolution-textures/`),
Lizenz **MIT**, © 2026 Meng To (LICENSE liegt bei).

**Geprüft am 04.11.2026:** nur Textdateien, keine Skripte, keine
Netz- oder Shell-Aufrufe.

**Grenze:** Dieses Projekt verbaut **three.js r128**. Hinweise zu
`colorSpace`/`outputColorSpace` sind hier als `encoding`/`outputEncoding`
zu lesen (siehe `uiBild()` in `js/konfigurator-3d.js`). Anisotropie,
Mipmap-Verzicht bei Strichgrafik und UV-Dichte gelten unverändert.

Von denselben 16 Skills des Ursprungs wurden die übrigen **nicht**
übernommen (Wasser, Lichtschächte, Jahreszeiten, Stoff, Papier, Metall,
Rundgang …): keiner davon trifft eine Terrassenüberdachung, und `metal`
und `wood` setzen three.js r163+ voraus.
