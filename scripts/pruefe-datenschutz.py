#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prüft die Struktur der Datenschutzerklärung.

Hintergrund: Beim Entfernen des KI-Chat-Abschnitts verschoben sich alle
Abschnittsnummern dahinter. Zwei Querverweise zeigten danach ins Leere
("Siehe Abschnitt 14" für IONOS, das inzwischen 13 war; "siehe Punkt 17" für
Metricool, wo es nur noch 16 Abschnitte gab). Gefunden wurde das erst Wochen
später beim Erstellen der PDF-Fassung.

Geprüft wird deshalb:
  1. Abschnitte sind lückenlos von 1 an durchnummeriert
  2. Inhaltsverzeichnis hat genauso viele Einträge wie es Abschnitte gibt
  3. Keine Sprungmarke zeigt auf eine nicht vorhandene id
  4. Kein Querverweis nennt eine Abschnittsnummer (die verschiebt sich)

Gegenprobe: scripts/pruefe-datenschutz.py --gegenprobe
lässt dieselben Prüfungen über eine absichtlich kaputte Fassung laufen und
erwartet, dass jede einzelne anschlägt.
"""
import io
import os
import re
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEITE = os.path.join(WURZEL, 'datenschutz.html')


def pruefen(html):
    """Gibt die Liste der Beanstandungen zurück. Leer heißt: in Ordnung."""
    fehler = []

    nummern = [int(n) for n in re.findall(r'<h2[^>]*>(\d+)\.\s', html)]
    if not nummern:
        fehler.append('keine nummerierten Abschnitte gefunden')
    elif nummern != list(range(1, len(nummern) + 1)):
        fehler.append('Abschnitte nicht lückenlos nummeriert: %s' % nummern)

    verzeichnis = re.search(r'<div class="toc">(.*?)</ol>', html, re.S)
    if not verzeichnis:
        fehler.append('kein Inhaltsverzeichnis gefunden')
    else:
        eintraege = len(re.findall(r'<li>', verzeichnis.group(1)))
        if eintraege != len(nummern):
            fehler.append('Inhaltsverzeichnis: %d Einträge, aber %d Abschnitte'
                          % (eintraege, len(nummern)))

    ids = set(re.findall(r'id="([^"]+)"', html))
    tot = sorted({a for a in re.findall(r'href="#([^"]+)"', html)
                  if a and a not in ids})
    if tot:
        fehler.append('Sprungmarken ohne Ziel: %s' % ', '.join(tot))

    # Querverweise über Nummern sind der eigentliche Auslöser dieser Prüfung.
    verweise = re.findall(r'(?:siehe\s+)?(?:Abschnitt|Punkt|Ziffer)\s+\d+', html)
    if verweise:
        fehler.append('Querverweis nennt eine Abschnittsnummer (verschiebt sich '
                      'beim nächsten Umbau): %s' % ', '.join(sorted(set(verweise))))

    return fehler


KAPUTTE_PROBE = u'''<html><body>
<div class="toc"><ol><li><a href="#a">Eins</a></li><li><a href="#fehlt">Zwei</a></li></ol></div>
<div id="a"><h2>1. Erster Abschnitt</h2><p>Siehe Abschnitt 14.</p></div>
<div id="b"><h2>3. Dritter Abschnitt</h2><p>Text</p></div>
<div id="c"><h2>4. Vierter Abschnitt</h2><p>Text</p></div>
</body></html>'''


def gegenprobe():
    print('Gegenprobe: absichtlich kaputte Fassung')
    fehler = pruefen(KAPUTTE_PROBE)
    erwartet = ['nicht lückenlos', 'Inhaltsverzeichnis', 'Sprungmarken', 'Abschnittsnummer']
    fehlend = [e for e in erwartet if not any(e in f for f in fehler)]
    for f in fehler:
        print('  erkannt:  %s' % f)
    if fehlend:
        print('  FEHLGESCHLAGEN – diese Fehlerarten wurden NICHT erkannt: %s'
              % ', '.join(fehlend))
        return 1
    print('  bestanden – alle vier eingebauten Fehler wurden gefunden')
    return 0


def main():
    if '--gegenprobe' in sys.argv:
        return gegenprobe()

    if not os.path.exists(SEITE):
        print('datenschutz.html nicht gefunden – erst "npm run build" ausführen')
        return 2

    html = io.open(SEITE, encoding='utf-8').read()
    fehler = pruefen(html)
    anzahl = len(re.findall(r'<h2[^>]*>\d+\.\s', html))
    print('Datenschutzerklärung: %d Abschnitte' % anzahl)
    if not fehler:
        print('  ok      Nummerierung, Verzeichnis, Sprungmarken und Verweise stimmen')
        print('Ergebnis: bestanden')
        return 0
    for f in fehler:
        print('  FEHLER  %s' % f)
    print('Ergebnis: nicht bestanden')
    return 1


if __name__ == '__main__':
    sys.exit(main())
