#!/usr/bin/env python3
"""A1: regellosen .site-header der Ortsseiten und danke.html durch die
Kopfleiste der Vorlage (src/_includes/layout.njk) ersetzen.
Aufruf: a1-kopf.py <verzeichnis> [--schreiben]"""
import re, sys, pathlib
WURZEL = pathlib.Path(sys.argv[1]); SCHREIBEN = '--schreiben' in sys.argv
I = lambda d: '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'
HAUS = I('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>')
RASTER = I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>')
BUCH = I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>')
STIFT = I('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>')

def kopf(kontakt):
    return f'''<!-- Kopfleiste wie in src/_includes/layout.njk (25.11.2026, A1).
     Hier stand ein .site-header, fuer den es in keinem Stilblatt eine
     Regel gab: weisse Schrift auf hellem Grund (1,07:1), am Handy kein
     Menue. Diese Seite ist handgepflegt; wer die Vorlage aendert,
     zieht hier nach, bis C1 die Seite in die Vorlage holt. -->
<nav class="navbar" role="navigation" aria-label="Hauptnavigation">
  <div class="container navbar-inner">
    <a href="/" aria-label="BV AussenSysteme Startseite">
      <img src="/images/logo-weiss-gold.svg" alt="BV AussenSysteme" class="nav-logo" width="208" height="32" fetchpriority="high" />
    </a>
    <ul class="nav-links">
      <li><a href="/#leistungen">Leistungen</a></li>
      <li><a href="/#galerie">Galerie</a></li>
      <li><a href="/broschuere.html">Katalog</a></li>
      <li><a href="/#faq">FAQ</a></li>
      <li><a href="{kontakt}" class="nav-cta">Jetzt anfragen</a></li>
    </ul>
    <button class="hamburger" id="hamburgerBtn" aria-label="Menü öffnen">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<div class="mobile-menu" id="mobileMenu">
  <button class="mobile-close" id="mobileClose" aria-label="Menü schließen">✕</button>
  <a href="/">{HAUS}Startseite</a>
  <a href="/#leistungen">{RASTER}Leistungen</a>
  <a href="/broschuere.html">{BUCH}Katalog ansehen</a>
  <a href="{kontakt}" class="mobile-cta">{STIFT}Jetzt anfragen</a>
</div>'''

KOPF = re.compile(r'<header class="site-header"[^>]*>.*?</header>', re.S)
# Schlussknopf, der nur noch das Symbol traegt (A1, "Dazu").
NUR_SYMBOL = re.compile(r'(<a href="#kontakt" class="btn btn-gold" aria-label="Kostenlos anfragen">(<svg\b.*?</svg>))</a>', re.S)
dateien = sorted(WURZEL.glob('carport-*.html')) + sorted(WURZEL.glob('pergola-*.html')) + \
          sorted(WURZEL.glob('terrassenueberdachung-*.html')) + [WURZEL / 'danke.html']
for p in dateien:
    t = p.read_text(encoding='utf-8')
    kontakt = '#kontakt' if 'id="kontakt"' in t else '/#kontakt'
    n = len(KOPF.findall(t))
    t2 = KOPF.sub(lambda m: kopf(kontakt), t)
    # danke.html laedt main.js nicht, das Menue blieb dort stumm.
    if 'js/main.js' not in t2:
        t2 = t2.replace('  <script src="js/bv-symbole.js?v=20261031n" defer></script>\n',
                        '  <script src="js/bv-symbole.js?v=20261031n" defer></script>\n  <script src="js/main.js?v=20261122b" defer></script>\n', 1)
        assert 'js/main.js' in t2, p.name
    t2, k = NUR_SYMBOL.subn(lambda m: m.group(1) + 'Kostenlos anfragen</a>', t2)
    print(f'  {p.name:46s} Kopf {n}  Schlussknopf {k}  Kontakt {kontakt}')
    if SCHREIBEN and t2 != t: p.write_text(t2, encoding='utf-8')
