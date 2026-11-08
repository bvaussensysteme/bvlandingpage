#!/usr/bin/env python3
"""
Prueft, dass die Zahlenseite keine Datenbankwerte ungemaskiert als HTML
einsetzt.

Warum es diese Pruefung gibt (08.11.2026):
Die Zahlenseite baut ihre Inhalte als Zeichenkette zusammen und setzt
sie mit innerHTML ein. Die Werte dafuer kommen aus der Tabelle
`ereignis` - und die wird vom OEFFENTLICHEN Endpunkt POST /api/messung
gefuellt. Wer dort eine Kampagne namens "<img src=x onerror=...>"
meldet, bekommt seinen Code in der ANGEMELDETEN Sitzung des Betreibers
ausgefuehrt, sobald der die Zahlenseite oeffnet.

Die Maskierfunktion sicher() gab es die ganze Zeit. Sie war an fuenf
Stellen schlicht vergessen worden: seite, kampagne, quelle, medium,
browser, system.

    python3 scripts/pruefe-zahlenseite-maskierung.py
    python3 scripts/pruefe-zahlenseite-maskierung.py --gegenprobe
"""
import io, re, sys

DATEI = 'werkstatt/zahlen.html'
# Eigenschaften, die aus der Datenbank stammen und damit von aussen
# beeinflussbar sind.
AUS_DER_DATENBANK = ('seite', 'kampagne', 'quelle', 'medium', 'browser',
                     'system', 'region', 'land', 'was', 'name', 'art')


def erstes_argument(text, start):
    """Gibt das erste Argument eines Aufrufs ab der oeffnenden Klammer."""
    tiefe, i, anfang = 0, start, start + 1
    while i < len(text):
        c = text[i]
        if c in '([{':
            tiefe += 1
        elif c in ')]}':
            tiefe -= 1
            if tiefe == 0:
                return text[anfang:i]
        elif c == ',' and tiefe == 1:
            return text[anfang:i]
        i += 1
    return ''


def leeren(text, start, ende):
    """Ersetzt einen Bereich durch Leerzeichen - so bleiben alle
       Positionen erhalten, der Inhalt zaehlt aber nicht mehr mit."""
    return text[:start] + ' ' * (ende - start) + text[ende:]


def unbedenklich_machen(arg):
    """Blendet die drei Stellen aus, an denen ein Datenbankwert NICHT als
       HTML landet. Ohne das schlaegt die Pruefung falschen Alarm - und
       eine Pruefung mit falschem Alarm wird abgeschaltet.

       1. sicher(...)        - genau dafuer da, mit Klammern darin
       2. TABELLE[x.feld]    - der Wert ist nur der Schluessel; heraus
                               kommt ein fest verdrahteter Text
       3. x.feld ?           - der Wert steht in einer Bedingung, nicht
                               in der Ausgabe
    """
    # 1. sicher(...) - klammertief, damit "(Startseite)" darin nicht stoert
    while True:
        m = re.search(r'\bsicher\s*\(', arg)
        if not m:
            break
        tiefe, i = 0, m.end() - 1
        while i < len(arg):
            if arg[i] == '(':
                tiefe += 1
            elif arg[i] == ')':
                tiefe -= 1
                if tiefe == 0:
                    break
            i += 1
        arg = leeren(arg, m.start(), min(i + 1, len(arg)))
    # 2. Nachschlagetabellen
    arg = re.sub(r'\b[A-Z_][A-Z_0-9]*\s*\[[^\]]*\]', ' ', arg)
    # 3. Bedingungen eines Fragezeichen-Ausdrucks
    arg = re.sub(r'\b[a-zA-Z]\.[a-zA-Z]+\s*\?', ' ? ', arg)
    return arg


def ungemaskiert(quelle):
    """Alle reihe()-Aufrufe, deren erstes Argument einen Datenbankwert
       ungemaskiert als HTML einsetzt."""
    treffer = []
    for m in re.finditer(r'\breihe\s*\(', quelle):
        arg = erstes_argument(quelle, m.end() - 1)
        ohne = unbedenklich_machen(arg)
        for eig in AUS_DER_DATENBANK:
            if re.search(r'\b[a-zA-Z]\.' + eig + r'\b', ohne):
                zeile = quelle[:m.start()].count('\n') + 1
                treffer.append((zeile, eig, ' '.join(arg.split())[:70]))
                break
    return treffer


def lauf(quelle, name):
    t = ungemaskiert(quelle)
    if t:
        print(f'  FEHLER  {name}: {len(t)} Datenbankwert(e) ohne sicher()')
        for z, e, a in t[:6]:
            print(f'          Zeile {z}: {e} in  reihe({a}…')
    else:
        print(f'  ok      {name}: kein Datenbankwert ohne sicher()')
    return len(t)


quelle = io.open(DATEI, encoding='utf-8').read()

if '--gegenprobe' in sys.argv:
    print('Gegenprobe: 3 eingebaute Fehler\n')
    fehler = [
        ('sicher(x.kampagne || \'–\')', "(x.kampagne || '–')"),
        ('reihe(sicher(x.browser),', 'reihe(x.browser,'),
        ('reihe(sicher(x.seite), eH', 'reihe(x.seite, eH'),
    ]
    gut = 0
    for alt, neu in fehler:
        if alt not in quelle:
            print(f'  ENTGEHT  Baustein nicht gefunden: {alt[:40]}')
            continue
        n = lauf(quelle.replace(alt, neu, 1), f'mit Fehler „{alt[:34]}…"')
        if n:
            gut += 1
        else:
            print('  ENTGEHT  Der eingebaute Fehler wurde NICHT erkannt.')
    print(f'\n{gut} von {len(fehler)} eingebauten Fehlern erkannt.')
    sys.exit(0 if gut == len(fehler) else 1)

print('Zahlenseite: Datenbankwerte im HTML\n')
n = lauf(quelle, DATEI)
print('\nErgebnis: ' + ('bestanden' if not n else 'DURCHGEFALLEN'))
sys.exit(1 if n else 0)
