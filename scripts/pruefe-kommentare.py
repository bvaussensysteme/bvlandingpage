#!/usr/bin/env python3
"""Sucht sichtbaren Rest von HTML-Kommentaren in allen Seiten.

ANLASS (06.11.2026). Beim Sperren des Konfigurators am 31.10.2026 wurde
ein Eintrag der Navigation auskommentiert - und dabei ein Kommentar IN
einen anderen gesetzt. Das kennt HTML nicht: Der erste Abschluss beendet
den ganzen Kommentar. Uebrig blieb ein Reststueck, das im
Navigationsbalken von 35 Seiten als Text stand, direkt neben "Galerie".
Niemandem ist es eine Woche lang aufgefallen, weil es wie ein Pfeil
aussieht.

GEPRUEFT WIRD: Nach dem Entfernen aller richtigen Kommentare darf in
keiner Seite ein Kommentarabschluss uebrig bleiben. Zusaetzlich wird die
Schachtelung selbst gesucht, damit die Meldung sagt, wo der Fehler
entstand und nicht nur, wo er auffaellt.

Aufruf:  python3 scripts/pruefe-kommentare.py [--gegenprobe]
"""
import re
import sys
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
KOMMENTAR = re.compile(r'<!--.*?-->', re.S)
# Ein "<!--", das vor dem naechsten Abschluss noch ein "<!--" enthaelt.
SCHACHTEL = re.compile(r'<!--(?:(?!-->).)*<!--', re.S)

UEBERGEHEN = {'node_modules', '.git', 'export'}


def seiten():
    for p in sorted(WURZEL.rglob('*.html')):
        if any(teil in UEBERGEHEN for teil in p.parts):
            continue
        yield p
    for p in sorted(WURZEL.glob('src/**/*.njk')):
        yield p


def pruefe(texte):
    """texte: {Pfad: Inhalt} -> Liste [(name, ok, info)]"""
    rest = []
    schachtel = []
    for pfad, inhalt in texte.items():
        if '-->' in KOMMENTAR.sub('', inhalt):
            rest.append(pfad)
        if SCHACHTEL.search(inhalt):
            schachtel.append(pfad)
    return [
        ('Kein sichtbarer Kommentarrest in den Seiten', not rest,
         (str(len(rest)) + ' Seiten, z. B. ' + rest[0]) if rest else f'{len(texte)} Dateien sauber'),
        ('Kein Kommentar steckt in einem anderen', not schachtel,
         (str(len(schachtel)) + ' Stellen, z. B. ' + schachtel[0]) if schachtel else 'keine Schachtelung'),
    ]


def lies():
    return {str(p.relative_to(WURZEL)): p.read_text(encoding='utf-8', errors='replace')
            for p in seiten()}


def main():
    gegen = '--gegenprobe' in sys.argv
    texte = lies()
    if not gegen:
        schlecht = 0
        for name, ok, info in pruefe(texte):
            print(('  ok      ' if ok else '  FEHLER  ') + name.ljust(46) + info)
            schlecht += 0 if ok else 1
        print()
        print('Ergebnis: alles bestanden' if not schlecht else f'Ergebnis: {schlecht} nicht bestanden')
        return 0 if not schlecht else 1

    gut = pruefe(texte)
    if any(not ok for _, ok, _ in gut):
        print('ABBRUCH: Der normale Lauf ist nicht gruen - Gegenprobe sinnlos.')
        return 1
    ziel = 'index.html'
    fehler = [
        ('Ein Kommentarabschluss steht sichtbar in der Seite',
         lambda t: t.replace('<body', 'Rest --><body', 1)),
        ('Ein Kommentar steckt in einem anderen',
         lambda t: t.replace('<body', '<!-- aussen <!-- innen --><body', 1)),
    ]
    offen = {name for name, _, _ in gut}
    for name, baue in fehler:
        kopie = dict(texte)
        kopie[ziel] = baue(kopie[ziel])
        rot = [n for n, ok, _ in pruefe(kopie) if not ok]
        if not rot:
            print(f'FEHLER: Eingebauter Fehler "{name}" bleibt unbemerkt.')
            return 1
        print(f'  Fehler "{name}": {len(rot)} Pruefung(en) schlagen an')
        for n in rot:
            offen.discard(n)
    if offen:
        print('FEHLER: Diese Pruefungen wurden von keinem Fehler rot:')
        for n in offen:
            print('   ' + n)
        return 1
    print()
    print('Gegenprobe in Ordnung: jede Pruefung schlaegt an.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
