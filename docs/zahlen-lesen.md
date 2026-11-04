# Die eigenen Zahlen lesen – und was sie entscheiden

> Für jede neue Sitzung: **Bevor eine Seite oder eine Landingpage gebaut
> oder umgebaut wird, erst hier nachsehen.** Was gebaut wird, entscheidet
> der Betreiber – aber ein Vorschlag ohne Blick in die Zahlen ist geraten.

## Woher die Zahlen kommen

| | |
|---|---|
| Erfassung | `js/messung.js` → `POST /api/messung` (in `worker/index.js`) |
| Speicher | Cloudflare **D1**, Datenbank `bv-messung`, Region WEUR (EU) |
| Auswertung | `GET /werkstatt/api/zahlen?tage=N` → `werkstatt/zahlen.html` |
| Messbeginn | **03.11.2026, 13:07 Uhr** (Anlage der Datenbank) |
| Besucherkennzeichen | erst seit **04.11.2026** – ältere Zeilen haben `besucher = NULL` |

## Direkt abfragen (für den Assistenten)

Die D1-Datenbank lässt sich mit dem Cloudflare-Werkzeug direkt abfragen.
Datenbank-Kennung: `f8867de0-2ee5-446b-bd91-d234173cb100`.

```sql
-- Was gibt es überhaupt, und seit wann?
SELECT MIN(tag) AS beginn, MAX(tag) AS ende, COUNT(*) AS zeilen FROM ereignis;

-- Aufrufe und Besucher je Tag
SELECT tag, COUNT(*) AS aufrufe, COUNT(DISTINCT besucher) AS besucher
FROM ereignis WHERE art = 'seite' GROUP BY tag ORDER BY tag;

-- Welche Seite zieht, und wie weit wird sie gelesen?
SELECT seite, COUNT(*) AS aufrufe,
       CAST(AVG(NULLIF(wert,0)) AS INT) AS sekunden,
       CAST(AVG(NULLIF(tiefe,0)) AS INT) AS gelesen
FROM ereignis WHERE art = 'seite' GROUP BY seite ORDER BY aufrufe DESC;

-- Kontaktaufnahmen
SELECT art, COUNT(*) FROM ereignis
WHERE art IN ('telefon','whatsapp','mail','anfrage-gesendet','anfrage-geoeffnet')
GROUP BY art;
```

**Tabelle `ereignis`:** `tag, stunde, zeit, art, seite, wert, zusatz, quelle,
geraet, land, region, tiefe, besucher, kampagne, medium, browser, system`.
Die Spalte `art` ist die Ereignisart; `wert` ist bei `seite`/`verweilen` die
Verweildauer in Sekunden, bei `konfig-schritt` die Nummer des Bereichs.

**Tabelle `salz`:** eine Zeile je Tag, die Zufallszahl für die Prüfsumme.
Sie wird täglich neu gezogen und ältere Zeilen werden gelöscht. **Nie
exportieren, nie in eine Dokumentation schreiben** – mit ihr und einer
IP-Adresse ließe sich eine Prüfsumme nachrechnen.

## Die drei Fallen

1. **Der Zeitraum ist nicht der Datenbestand.** Eine Auswahl „30 Tage" bei
   zwei Tagen Daten ergibt Durchschnitte, die um das Fünfzehnfache daneben
   liegen. Genau daran ist am 04.11.2026 eine Auswertung gescheitert, und
   zwar eine von mir. Immer `datenBeginn` und `tageMitDaten` mitlesen.
2. **Wenige Zeilen sind kein Befund.** Eine Seite mit zwei Aufrufen und
   „100 % gelesen" sagt nichts. Unter etwa 100 Aufrufen je Seite ist jede
   Aussage über diese Seite geraten.
3. **Ein Teil der Aufrufe ist der Betrieb selbst.** Die Werkstatt wird
   nicht gemessen, die öffentlichen Seiten aber schon. Auf der Zahlenseite
   gibt es dafür einen Abschalter.

## Was daraus für den Bau folgt

- **Welche Seiten ziehen**, bestimmt, wovon es mehr geben sollte. Ein
  Fachthema, das Einstiege bringt, ist mehr wert als eine weitere
  Produktseite, die niemand findet.
- **Einstiegsseiten** sind die Seiten, deren erster Bildschirm zählt.
- **„Nur eine Seite"** (Absprungrate) auf einer Einstiegsseite heißt: Der
  Anfang trägt nicht. Dort lohnt sich Arbeit, nicht weiter unten.
- **Geräteanteil** entscheidet, welche Ansicht zuerst stimmen muss.
- **Bundesland** entscheidet über Ortsseiten – aber nur für Orte, in denen
  wirklich montiert wird.
