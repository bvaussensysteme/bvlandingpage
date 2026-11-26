import re, sys, glob
SCHREIBEN = '--schreiben' in sys.argv
ERKL = [
 (r'\bVSG\b(?:-Sicherheitsglas|-Glas)?', 'Verbundsicherheitsglas', ' (Verbundsicherheitsglas: zwei Scheiben mit Folie dazwischen, bei Bruch halten die Splitter an der Folie)'),
 (r'\bopal\b', 'milchig', ' (milchig, lässt Licht durch, schützt vor Blicken und Blendung)'),
 (r'\bTrapezblech\b', 'trapezförmig', ' (Profilblech mit trapezförmigen Rippen, blickdicht)'),
 (r'\bZIP-Führung\b', 'Reißverschluss', ' (das Tuch läuft seitlich in einer Schiene, wie in einem Reißverschluss)'),
 (r'\bprüffähige Einzelstatik\b|\bprüffähigen Einzelstatik\b', 'nachprüfen kann', ' (Statikberechnung für genau Ihre Anlage, die das Bauamt nachprüfen kann)'),
 (r'\bWindwiderstandsklasse 3\b', 'EN 13561', ' (höchste der vier Windklassen für Markisen nach der Norm EN 13561)'),
]
def sichtbare_spannen(t):
    """Bereiche, in denen NICHT ersetzt werden darf: Front matter, Kommentare,
    Skripte, Stile, Tags samt Attributen, title/meta."""
    verboten = []
    for m in re.finditer(r'^---\n.*?\n---\n', t, re.S): verboten.append(m.span())
    for pat in [r'\{#.*?#\}', r'<!--.*?-->', r'<script\b.*?</script>', r'<style\b.*?</style>', r'<title>.*?</title>', r'<h[1-6]\b.*?</h[1-6]>', r'<[^>]+>', r'\{%.*?%\}', r'\{\{.*?\}\}']:
        for m in re.finditer(pat, t, re.S): verboten.append(m.span())
    return verboten
def frei(pos, verboten): return not any(a <= pos < b for a, b in verboten)
dateien = sorted(glob.glob('src/**/*.njk', recursive=True))
RECHT = ('agb.njk','datenschutz.njk','impressum.njk','widerruf.njk','widerruf-danke.njk')
for p in dateien:
    if p.endswith(RECHT): continue
    t = open(p, encoding='utf-8').read(); neu = t
    for muster, kennwort, zusatz in ERKL:
        if kennwort in neu: continue          # schon erklaert
        verb = sichtbare_spannen(neu)
        treffer = [m for m in re.finditer(muster, neu) if frei(m.start(), verb)]
        if not treffer: continue
        m = treffer[0]
        # nicht doppelt, wenn direkt danach schon eine Klammer steht
        if neu[m.end():m.end()+2].startswith(' ('): continue
        print(f'{p:45s} {m.group(0):26s} …{neu[max(0,m.start()-45):m.start()].replace(chr(10)," ")}[{m.group(0)}]{neu[m.end():m.end()+30].replace(chr(10)," ")}…')
        neu = neu[:m.end()] + zusatz + neu[m.end():]
    if SCHREIBEN and neu != t: open(p, 'w', encoding='utf-8').write(neu)
print('GESCHRIEBEN' if SCHREIBEN else 'PROBELAUF')
