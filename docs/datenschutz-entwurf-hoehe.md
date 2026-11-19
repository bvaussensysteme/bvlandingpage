# Entwurf: Datenschutzerklärung, Abschnitt zur Höhenermittlung

**Stand 19.11.2026. Das ist ein Entwurf, keine Rechtsberatung.** Die
verbindliche Fassung gehört zum Anwalt. Dieser Text ist dafür
vorbereitet: Er beschreibt, was technisch nachweisbar passiert, und
benennt die Punkte, die ein Anwalt entscheiden muss.

Der Entwurf wurde **nicht** in `src/datenschutz.njk` eingefügt. Siehe
`CLAUDE.md`, Abschnitt „Rechtstexte nicht anfassen, nur warnen".

---

## 1. Was tatsächlich passiert, nachgemessen

Auf `/windzonen.html` gibt es das Feld „Geländehöhe über NN". Klappt
der Besucher es auf, wird die Höhe automatisch ermittelt.

| Frage | Antwort |
|---|---|
| Wer ruft den fremden Dienst? | Der Server von BV AussenSysteme, nicht der Browser des Besuchers |
| Warum? | Der Dienst sendet keinen `Access-Control-Allow-Origin`-Kopf; ein Aufruf aus dem Browser würde verworfen. Gemessen am 18.11.2026 |
| Was wird übermittelt? | Ausschließlich die auf vier Nachkommastellen gerundete Koordinate, rund 10 Meter |
| Was nicht? | Name, Adresse, IP-Adresse des Besuchers, Kennungen, Cookies |
| Woher stammt die Koordinate? | Aus der Adresssuche, die der Besucher selbst ausgelöst hat |
| Wann? | Erst beim Aufklappen des Feldes, nicht bei jeder Suche |
| Speicherung | Antwort 30 Tage im Zwischenspeicher des Servers, Schlüssel ist die gerundete Koordinate. Keine Datenbank, keine Protokollierung |
| Empfänger | Open Topo Data, `api.opentopodata.org`, ersatzweise derselbe Dienst mit dem Datensatz NASA SRTM 30 m |

## 2. Textvorschlag

Einzufügen in **Abschnitt 7** („OpenStreetMap"), weil es dieselbe Seite
und dasselbe Werkzeug betrifft. Dann muss keine Nummer und kein Anker
geändert werden.

**a) In der Aufzählung der Dritten, nach dem Punkt „Adress-/PLZ-Suche":**

```html
<li><strong>Geländehöhe über NN:</strong> Wenn Sie im Schneelast-Werkzeug
    den Bereich „Höhe über NN" aufklappen, ermittelt <strong>unser eigener
    Server</strong> die Geländehöhe Ihres Standorts. Ihr Browser baut dabei
    <strong>keine</strong> Verbindung zu einem Dritten auf; Ihre IP-Adresse
    wird an den Höhendienst <strong>nicht</strong> übermittelt. Unser Server
    übermittelt an den Dienst <strong>Open Topo Data</strong>
    (api.opentopodata.org) ausschließlich die auf etwa 10 Meter gerundete
    geografische Koordinate. Name, Anschrift, IP-Adresse oder sonstige
    Kennungen werden nicht übermittelt. Die Antwort speichern wir bis zu
    30 Tage zwischen, um wiederholte Abfragen zu vermeiden.</li>
```

**b) Im Absatz darunter, nach dem Satz zum Vereinigten Königreich:**

```html
<br /><br />
Der Betreiber von Open Topo Data macht keine Angaben zu Sitz und
Serverstandort; ein Datentransfer in ein Drittland ist daher nicht
auszuschließen. Da ausschließlich eine gerundete Koordinate ohne
Personenbezug übermittelt wird, sehen wir das Risiko als gering an.
Datenschutzhinweise des Dienstes:
<a href="https://www.opentopodata.org/" target="_blank" rel="noopener noreferrer">opentopodata.org</a>
```

## 3. Was der Anwalt entscheiden muss

1. **Ist die gerundete Koordinate ein personenbezogenes Datum?** Sie
   bezeichnet einen Ort auf etwa 10 Meter genau, ohne Namen und ohne
   IP. Bei einer Adresssuche entsteht der Bezug aber erst durch die
   Eingabe des Besuchers selbst.
2. **Auftragsverarbeitung nach Art. 28 DSGVO.** Open Topo Data bietet
   keinen AVV an. Falls einer erforderlich ist, ist der Dienst so nicht
   nutzbar.
3. **Drittlandübermittlung, Art. 44 ff. DSGVO.** Sitz und
   Serverstandort sind nicht öffentlich benannt.
4. **Formulierung des Satzes zum Risiko** in Teil b. Er enthält eine
   Bewertung, und Bewertungen gehören nicht von einem Assistenten in
   einen Rechtstext.

## 4. Der technische Ausweg, falls Punkt 2 oder 3 im Weg steht

Das Bundesamt für Kartographie und Geodäsie stellt das Geländemodell
für ganz Deutschland als offene Daten bereit (DGM200, 34 MB, 200-Meter-
Raster, Erreichbarkeit am 18.11.2026 geprüft). Damit käme die Höhe vom
eigenen Server, **ohne jeden Dritten**. Dann entfällt dieser Abschnitt
vollständig, und mit ihm beide Rechtsfragen.

Das ist die saubere Lösung. Sie kostet einmalig Bauzeit, danach nichts
mehr, und sie hat kein Tageslimit. Beim ersten Mal wurde sie zugunsten
des schnellen Weges zurückgestellt; wenn der Anwalt an Punkt 2 oder 3
hängenbleibt, ist sie der kürzere Weg zum Ziel.
