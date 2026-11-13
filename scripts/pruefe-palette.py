#!/usr/bin/env python3
"""Prueft die freigegebene Farbpalette aus docs/WEBSITE_DESIGN_SYSTEM.md.

WARUM ES DIESE PRUEFUNG GIBT. Das Designdokument nennt Kontrastwerte.
Zahlen in einem Dokument veralten still: Aendert jemand einen Farbwert,
bleibt die Tabelle stehen und stimmt nicht mehr. Hier werden die Werte
aus dem Dokument gelesen und nachgerechnet.

Geprueft wird:
  1. Jede im Dokument als "ok" gefuehrte Kombination erreicht 4,5:1.
  2. Jede als "zu wenig" gefuehrte Kombination liegt wirklich darunter
     (sonst steht dort eine unnoetige Warnung).
  3. Das empfohlene Textgold erreicht 4,5:1 auf allen hellen Gruenden.
  4. Das Markengold liegt nahe am Gold des Hauptlogos (CIE76, dE < 3).

Aufruf:  python3 scripts/pruefe-palette.py [--gegenprobe]
"""
import re, sys, zlib, struct
from pathlib import Path
from collections import Counter

WURZEL = Path(__file__).resolve().parent.parent
DOK = WURZEL / 'docs/WEBSITE_DESIGN_SYSTEM.md'
LOGO = WURZEL / 'images/logo-frei.png'
GEGEN = '--gegenprobe' in sys.argv

def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

def _lin(c):
    c /= 255.0
    return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4

def leuchtkraft(rgb):
    r, g, b = (_lin(x) for x in rgb)
    return 0.2126*r + 0.7152*g + 0.0722*b

def kontrast(a, b):
    la, lb = leuchtkraft(a), leuchtkraft(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)

def _lab(rgb):
    r, g, b = (_lin(x) for x in rgb)
    X = r*0.4124 + g*0.3576 + b*0.1805
    Y = r*0.2126 + g*0.7152 + b*0.0722
    Z = r*0.0193 + g*0.1192 + b*0.9505
    def f(t): return t**(1/3) if t > 0.008856 else 7.787*t + 16/116
    fx, fy, fz = f(X/0.95047), f(Y/1.0), f(Z/1.08883)
    return (116*fy - 16, 500*(fx - fy), 200*(fy - fz))

def abstand(a, b):
    return sum((x-y)**2 for x, y in zip(_lab(a), _lab(b)))**0.5

def logo_gold(pfad):
    """Haeufigste gesaettigte Farbe im Logo. Ohne Fremdbibliothek, damit
    die Pruefung ohne Installation laeuft."""
    d = pfad.read_bytes()
    if d[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    pos, idat, pal, trns = 8, b'', None, None
    w = h = bd = ct = None
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]
        typ, dat = d[pos+4:pos+8], d[pos+8:pos+8+ln]
        pos += 12 + ln
        if typ == b'IHDR': w, h, bd, ct = struct.unpack('>IIBB', dat[:10])
        elif typ == b'IDAT': idat += dat
        elif typ == b'PLTE': pal = dat
        elif typ == b'tRNS': trns = dat
        elif typ == b'IEND': break
    if bd != 8:
        return None
    kan = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]
    roh = zlib.decompress(idat)
    zl, c, vor, i = w*kan, Counter(), bytearray(w*kan), 0
    for _ in range(h):
        f = roh[i]; i += 1
        z = bytearray(roh[i:i+zl]); i += zl
        for x in range(zl):
            a = z[x-kan] if x >= kan else 0
            b = vor[x]
            cc = vor[x-kan] if x >= kan else 0
            if f == 1: z[x] = (z[x]+a) & 255
            elif f == 2: z[x] = (z[x]+b) & 255
            elif f == 3: z[x] = (z[x]+(a+b)//2) & 255
            elif f == 4:
                p = a+b-cc; pa, pb, pc = abs(p-a), abs(p-b), abs(p-cc)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else cc)
                z[x] = (z[x]+pr) & 255
        for x in range(w):
            px = z[x*kan:(x+1)*kan]
            if ct == 3:
                idx = px[0]
                if trns and idx < len(trns) and trns[idx] < 128: continue
                col = tuple(pal[idx*3:idx*3+3])
            elif ct == 6:
                if px[3] < 200: continue
                col = (px[0], px[1], px[2])
            elif ct == 2:
                col = tuple(px)
            else:
                continue
            if max(col) - min(col) > 35 and max(col) > 90:
                c[col] += 1
        vor = z
    return c.most_common(1)[0][0] if c else None

# ── Die vier eingebauten Fehler der Gegenprobe ──────────────────────
# JEDER WIRD EINZELN EINGEBAUT. Erster Entwurf baute alle vier auf
# einmal ein - dabei trafen zwei dieselbe Pruefung, die nur einmal rot
# werden kann, und die Gegenprobe meldete 3 von 4. Eine Gegenprobe, die
# ihre eigenen Fehler nicht auseinanderhalten kann, beweist weniger,
# als sie behauptet.
FEHLER = [
    ('eine zu schwache Kombination steht als "ok" im Dokument',
     '| Gold `#C58A32` auf Anthrazit `#1D2023` | 5,50:1 | ok |',
     '| Gold `#C58A32` auf Warmweiß `#F8F7F4` | 5,50:1 | ok |'),
    ('eine ausreichende Kombination steht als "zu wenig" im Dokument',
     '| **Gold `#C58A32` auf Weiß `#FFFFFF`** | **2,98:1** | **zu wenig** |',
     '| **Gold `#C58A32` auf Tiefschwarz `#0B0B0C`** | **2,98:1** | **zu wenig** |'),
    ('das Textgold ist zu hell',
     '`--gold-text: #896023`', '`--gold-text: #C8A050`'),
    ('das Markengold passt nicht mehr zum Logo',
     '#C58A32** ersetzt', '#44AA88** ersetzt'),
    # Graphit als Ring auf dunklem Grund: 1,38 auf Anthrazit, 1,66 auf
    # Tiefschwarz. Erster Entwurf nahm hier Markengold - das erreicht auf
    # allen drei dunklen Gruenden ueber 3:1 und war damit gar kein Fehler.
    # Die Gegenprobe hat ihren eigenen untauglichen Fehler aufgedeckt.
    ('ein Fokusring erreicht seinen Untergrund nicht',
     '| Anthrazit / Tiefschwarz / Graphit | Champagner `#EAD9BB` |',
     '| Anthrazit / Tiefschwarz / Graphit | Graphit `#34383C` |'),
]

# ── Werte aus dem Dokument lesen ────────────────────────────────────
ORIGINAL = DOK.read_text(encoding='utf-8')

def pruefen(text):

    ergebnis = []
    def p(ok, name, info): ergebnis.append((ok, name, info))

    zeile = re.compile(r'^\|\s*\*{0,2}([A-Za-zÄÖÜäöüß ]+?)\s*`(#[0-9A-Fa-f]{6})`\*{0,2}\s+auf\s+'
                       r'\*{0,2}([A-Za-zäöüÄÖÜß ]+?)\s*`(#[0-9A-Fa-f]{6})`\*{0,2}\s*\|'
                       r'\s*\*{0,2}([\d,]+):1\*{0,2}\s*\|\s*\*{0,2}([^|*]+?)\*{0,2}\s*\|', re.M)
    paare = zeile.findall(text)

    m = re.search(r'`--gold-text:\s*(#[0-9A-Fa-f]{6})`', text)
    textgold = m.group(1) if m else None
    m = re.search(r'\*\*(#[0-9A-Fa-f]{6})\*\* ersetzt', text)
    markengold = m.group(1) if m else None


    # 1 + 2: jede Zeile der Kontrasttabelle nachrechnen
    if not paare:
        p(False, 'Kontrasttabelle gefunden', 'keine Zeile erkannt')
    else:
        schlecht = []
        for vn, vorder, hn, hinter, soll, urteil in paare:
            ist = kontrast(hx(vorder), hx(hinter))
            reicht = ist >= 4.5
            behauptet = 'zu wenig' not in urteil.lower()
            if reicht != behauptet:
                schlecht.append(f'{vn} {vorder} auf {hn} {hinter}: gemessen {ist:.2f}:1, '
                                f'Dokument sagt "{urteil.strip()}"')
            elif abs(ist - float(soll.replace(',', '.'))) > 0.06:
                schlecht.append(f'{vn} {vorder} auf {hn} {hinter}: gemessen {ist:.2f}:1, '
                                f'Dokument nennt {soll}:1')
        p(not schlecht, 'Kontrasttabelle stimmt',
          schlecht[0] if schlecht else f'{len(paare)} Kombinationen nachgerechnet')

    # 3: Textgold auf allen hellen Gruenden
    if not textgold:
        p(False, 'Textgold im Dokument', 'kein Token --gold-text gefunden')
    else:
        # Entscheidung der Design-Agenten vom 13.11.2026: EIN Wert fuer
        # Text UND Bedienelemente auf hellem Grund. Auf Champagner darf
        # er nur Bedienelement sein (4,03:1), nicht Text.
        fuerText = [('Warmweiß', '#F8F7F4'), ('Weiß', '#FFFFFF'), ('Steingrau', '#E9E7E2')]
        fuerElement = fuerText + [('Champagner', '#EAD9BB')]
        schlecht = [f'Text auf {n} {g}: {kontrast(hx(textgold), hx(g)):.2f}:1'
                    for n, g in fuerText if kontrast(hx(textgold), hx(g)) < 4.5]
        schlecht += [f'Bedienelement auf {n} {g}: {kontrast(hx(textgold), hx(g)):.2f}:1'
                     for n, g in fuerElement if kontrast(hx(textgold), hx(g)) < 3.0]
        p(not schlecht, f'Textgold {textgold}: Text 4,5:1 und Bedienelement 3:1',
          schlecht[0] if schlecht else
          'drei helle Gründe über 4,5:1, alle vier über 3:1 (ein Token statt zwei)')

    # 4: Fokusring - jede Zeile der Tabelle muss 3:1 erreichen
    ring = re.compile(r'^\|\s*([^|]*?)\s*\|\s*[A-Za-zäöüÄÖÜß ]*`(#[0-9A-Fa-f]{6})`\s*\|'
                      # Trenner zwischen zwei Zahlen: Gedankenstrich ODER
                      # Schraegstrich. Erster Entwurf kannte nur den Strich -
                      # die Zeile "6,61 / 9,33:1" fiel durch, zwei Untergruende
                      # blieben ungeprueft (7 statt 9).
                      r'\s*[\d,]+\s*(?:[–/-]\s*[\d,]+\s*)?:1\s*\|', re.M)
    abschnitt = text[text.find('#### Fokusring'):text.find('Umgeschaltet wird')] \
        if '#### Fokusring' in text else ''
    zeilen = ring.findall(abschnitt)
    if not zeilen:
        p(False, 'Fokusring-Tabelle gefunden', 'keine Zeile erkannt')
    else:
        gefunden = {'Weiß': '#FFFFFF', 'Warmweiß': '#F8F7F4', 'Steingrau': '#E9E7E2',
                    'Champagner': '#EAD9BB', 'Anthrazit': '#1D2023',
                    'Tiefschwarz': '#0B0B0C', 'Graphit': '#34383C',
                    'Markengold': '#C58A32', 'Helles Gold': '#D9AB64'}
        schwach, geprueft = [], 0
        for gruende, ringfarbe in zeilen:
            for name, wert in gefunden.items():
                if name in gruende:
                    geprueft += 1
                    kk = kontrast(hx(ringfarbe), hx(wert))
                    if kk < 3.0:
                        schwach.append(f'Ring {ringfarbe} auf {name} {wert}: {kk:.2f}:1')
        p(not schwach and geprueft >= 8, 'Fokusring erreicht überall 3:1',
          schwach[0] if schwach else f'{geprueft} Untergründe geprüft')

    # 5: Markengold nahe am Logo
    gold_im_logo = logo_gold(LOGO)
    if not markengold:
        p(False, 'Markengold im Dokument', 'kein Wert gefunden')
    elif not gold_im_logo:
        p(False, 'Logo auslesbar', f'{LOGO.name} konnte nicht gelesen werden')
    else:
        d = abstand(hx(markengold), gold_im_logo)
        lg = '#%02X%02X%02X' % gold_im_logo
        p(d < 3.0, f'Markengold {markengold} passt zum Logo',
          f'Logo trägt {lg}, Abstand ΔE {d:.1f} (Soll: unter 3)')
    return ergebnis

# ── Bericht ─────────────────────────────────────────────────────────
if GEGEN:
    print(f'Gegenprobe: {len(FEHLER)} eingebaute Fehler, jeder einzeln\n')
    sauber = [e[1] for e in pruefen(ORIGINAL) if not e[0]]
    if sauber:
        print('  ABBRUCH: Schon ohne eingebauten Fehler beanstandet:', sauber[0])
        sys.exit(1)
    erkannt = 0
    for name, alt, neu in FEHLER:
        if alt not in ORIGINAL:
            print(f'  NICHT GEFUNDEN  {name}  (Stelle fehlt im Dokument)')
            continue
        schlecht = [e for e in pruefen(ORIGINAL.replace(alt, neu, 1)) if not e[0]]
        if schlecht:
            erkannt += 1
            print(f'  erkannt   {name}')
            print(f'            -> {schlecht[0][1]}: {schlecht[0][2]}')
        else:
            print(f'  UEBERSEHEN  {name}')
    print()
    print(f'{erkannt} von {len(FEHLER)} eingebauten Fehlern erkannt.')
    print('Gegenprobe bestanden.' if erkannt == len(FEHLER) else 'Gegenprobe NICHT bestanden.')
    sys.exit(0 if erkannt == len(FEHLER) else 1)

ergebnis = pruefen(ORIGINAL)
schlecht = [e for e in ergebnis if not e[0]]
print('Farbpalette (docs/WEBSITE_DESIGN_SYSTEM.md)\n')
for ok, name, info in ergebnis:
    print(f'  {"ok    " if ok else "FEHLER"}  {name:<46} {info}')
print()
print(f'Ergebnis: {len(schlecht)} Beanstandungen' if schlecht else 'Ergebnis: bestanden')
sys.exit(1 if schlecht else 0)
