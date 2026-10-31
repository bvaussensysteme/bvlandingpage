# Kurzlink für geteilte Planungen

Stand 31.10.2026. Aus `docs/NEXT_TASK.md` ausgelagert, damit der Einstieg kurz
bleibt. **Vom Betreiber zurückgestellt (25.10.2026) — nicht weiterbauen, ohne
zu fragen.** Der lange Teilen-Link funktioniert.

## Warum der kurze Link nicht läuft, und was die Wege kosten

**Stand:** Der Teilen-Knopf funktioniert und gibt den **langen** Link heraus
(565 Zeichen, gemessen an der Standard-Planung). Der kurze Link
(`bv-aussensysteme.de/k/A7K3PQ`, 36 Zeichen) braucht eine Tabelle in der
Datenbank. **Die kann der Server nicht selbst anlegen.**

**Woran es liegt – gemessen, nicht vermutet.** `/api/teilen` antwortet
`{"ok":false,"schritt":"tabelle","nr":"42501"}`. `42501` ist in PostgreSQL
„keine Berechtigung". Der Server versucht zuerst `public`, dann ein eigenes
Schema `bv` (anderes Recht, deshalb oft offen) – **beides** wird abgelehnt.
Die Rolle in `ANFRAGEN_DB` darf also nur in bestehende Tabellen schreiben.
Das ist kein Fehler im Code; es fehlt ein Recht in der Datenbank.

**Weg A – ein Klick in der Neon-Konsole.** SQL Editor öffnen, in der
Datenbank, in der auch `anfragen` liegt, diesen Befehl ausführen:

```sql
create table if not exists teilen_links (
  id        text primary key,
  code      text not null,
  code_hash text not null unique,
  erstellt  timestamptz not null default now(),
  zuletzt   timestamptz
);
```

Danach ohne Anmeldung prüfbar – `{"ok":true,"id":"…"}` heißt, er läuft:

```sh
curl -s -X POST https://bv-aussensysteme.de/api/teilen \
  -H 'Content-Type: application/json' -d '{"code":"AAAAAAAAAAAAAAAAAAAAAA"}'
```

Am Code ändert sich dafür nichts: Der Server sucht die Tabelle bei jedem
Start in `public` **und** in `bv` und nimmt, was er findet.

**Weg B – den Link selbst kürzen, ohne Datenbank.** Im Link steht heute alles
ausgeschrieben (`"Produkt":"Terrassendach TDS"`). Gemessen am 25.10.2026 mit
einer Standard-Planung (17 Felder, 392 Zeichen Klartext):

| Form | Länge des ganzen Links |
|---|---|
| heute (JSON, Base64) | 565 |
| nur zusammengepackt (deflate) | ~341 |
| nur Werte, ohne Feldnamen | ~172 |
| Nummern statt Texten + zusammengepackt | **~80–120** |
| Kurzlink über die Datenbank (Weg A) | 36 |

Weg B braucht niemanden außer den Entwickler, kostet aber ein eigenes,
**eingefrorenes** Format: Die Reihenfolge der Felder wird Teil des Links, also
Versionsnummer hochzählen und v1 weiter lesen können, sonst sterben alle
bereits verschickten Links. Dafür wäre eine Prüfung nötig, die zufällige
Planungen hin- und zurückrechnet und auf Gleichheit vergleicht.

**Entschieden am 25.10.2026:** Erst einmal gar nichts – der Betreiber hat beide
Wege gesehen und „erstmal lassen" gewählt. Nicht ohne neue Ansage anfangen.

---

