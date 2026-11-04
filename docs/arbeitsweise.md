# Arbeitsweise

> Aus `docs/NEXT_TASK.md` ausgelagert am 04.11.2026, damit der Einstieg
> kurz bleibt.

## 4. Arbeitsweise

**Branch:** immer `claude/bv-aussensysteme-setup-bq7ew4`. Nach einem gemergten
PR frisch aufsetzen:
```bash
git fetch origin main && git checkout -B claude/bv-aussensysteme-setup-bq7ew4 origin/main
```

**Wenn der Zweig schon eigene Commits trägt** (frisch aufsetzen ginge nur mit
`--force-with-lease`, und das lehnt die automatische Freigabe ab): `main`
hereinholen statt überschreiben. PRs werden hier **squash**-gemergt — dadurch
meldet git beim nächsten Mal 50+ Konflikte, obwohl inhaltlich nichts
auseinanderläuft. Am 31.10.2026 dreimal hintereinander passiert. Der eigene
Zweig ist dabei der neuere Stand:

```bash
git merge origin/main
git diff --name-only --diff-filter=U | xargs git checkout --ours --
git diff --name-only --diff-filter=U | xargs git add
git commit --no-edit
bash scripts/pruefe-konfliktmarken.sh
git diff --stat <letzter-eigener-commit> HEAD   # MUSS LEER SEIN
```

Die letzte Zeile ist der Nachweis, dass durch das Hereinholen keine Datei
ihren Inhalt verändert hat. Ohne sie ist `--ours` geraten, nicht geprüft.

**Ablauf:** bauen → prüfen → committen → pushen → PR → Build abwarten →
squash-mergen → Live-Stand prüfen (`scripts/pruefe-live.sh`). Der Betreiber
sagt meist „mergen veröffentlichen"; bei neuen öffentlichen Funktionen vorher
auf die Preview schauen lassen.

**Build:** `npm run build` (Eleventy + cleancss). Nach einem Container-Neustart
fehlen die Abhängigkeiten → vorher `npm install`.

**Cache-Buster:** `_headers` erlaubt bis zu 24 h alte CSS/JS aus dem
Browser-Cache. Nach jeder Änderung an `js/*.js` oder `src/css/style.css` die
Version in **allen** HTML-Dateien hochziehen und mit
`scripts/pruefe-cache-buster.sh` nachsehen.

**Eigenständige HTML-Dateien ohne njk-Vorlage** (werden vom Build *nicht*
erzeugt, direkt bearbeiten): `index.html`, `konfigurator.html`, alle
`terrassenueberdachung-*.html`, `carport-*.html`, `pergola-*.html`,
`danke.html`.

> ⚠️ **Dieser Liste nicht vertrauen.** Am 04.11.2026 fehlte `widerruf.html`
> darauf – es *hat* eine Vorlage. Vier Änderungen desselben Tages landeten
> deshalb nur in erzeugten Dateien, darunter 110 Zeilen Datenschutztext.
> Ein `npm run build` hätte sie alle stillschweigend zurückgenommen.
>
> **Maßgeblich ist nicht diese Liste, sondern `ls src/*.njk`** – und vor
> dem Veröffentlichen `bash scripts/pruefe-erzeugte-seiten.sh`. Das Skript
> baut und sieht nach, ob sich etwas verändert hat; es beantwortet die
> Frage, ohne dass jemand eine Liste pflegen muss.

---

