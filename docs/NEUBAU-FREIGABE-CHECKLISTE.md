# Freigabe-Checkliste

> Abzuarbeiten **vor** jeder Veröffentlichung nach `main`. Nicht aus
> dem Kopf abhaken – jeder Punkt wird ausgeführt und das Ergebnis
> notiert.

## 0. Die Voraussetzung

Es liegt der wörtliche Satz des Betreibers vor:

> ICH GEBE DIE NEUE WEBSITE ZUR VERÖFFENTLICHUNG FREI.

Ohne diesen Satz endet die Liste hier. Schweigen, „ok", „ja" oder eine
grüne Prüfung sind keine Freigabe (`CLAUDE.md`, 08.11.2026).

## 1. Entwürfe entfernen

Die Entwurfsseiten stehen **absichtlich nicht** in `.assetsignore` –
sonst wären sie auch aus der Vorschau verschwunden (am 08.11.2026 genau
so passiert, alle vier auf 404 geprüft).

Vor dem Veröffentlichen also eines von beiden:

- [ ] `entwurf.html`, `entwurf-apple.html`, `entwurf-produkt.html`,
      `entwurf-bv.html` und `entwurf/` löschen, **oder**
- [ ] sie in `.assetsignore` eintragen

Danach prüfen: `bash scripts/pruefe-nicht-oeffentlich.sh`

## 2. Was auf dem Branch liegt, aber nicht freigegeben ist

Der Arbeitsbranch enthält neben dem Neubau auch Änderungen an der
**bestehenden** Seite (Stand 08.11.2026: rund 60 Dateien aus den
Umbauten vom 07.11.). Vor dem Zusammenführen klären, ob die mit
hinausgehen sollen:

- [ ] Liste ansehen: `git diff --name-only origin/main HEAD`
- [ ] Je Datei entschieden: mit raus / zurücknehmen

## 3. Rechtliche Blocker

- [ ] Bildrechte VD und Stoffkarte – **erledigt 08.11.2026** (Aussage
      des Betreibers, siehe `docs/NEUBAU-LIZENZREGISTER.md`, Abschnitt 0)
- [ ] Herkunft der Markenlogo-Pfade in 54 Dateien geklärt
- [ ] DIBt-Lastzonen: gewerbliche Nutzung geklärt
- [ ] Datenschutzerklärung an den Code angeglichen (16 Abweichungen)
- [ ] Cloudflare Web Analytics: abgeschaltet oder benannt

## 4. Technik

- [ ] Alle `scripts/pruefe-*` grün – **alle**, nicht die vermuteten
- [ ] Cache-Buster hochgezählt
- [ ] Keine Konfliktmarken: `bash scripts/pruefe-konfliktmarken.sh`
- [ ] XSS-Korrektur in `werkstatt/zahlen.html` ist dabei

## 5. Nach dem Veröffentlichen

- [ ] Geänderte Dateien byteweise gegen `origin/main` vergleichen (sha256)
- [ ] `bash scripts/pruefe-live.sh`
- [ ] Echter Browser auf der veröffentlichten Adresse
- [ ] Rückweg bereit: `git revert` des Merge-Commits
