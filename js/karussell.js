/* ============================================================
   BV AussenSysteme – Karussell (Referenzen)
   ------------------------------------------------------------
   Macht aus einem vorhandenen Raster einen waagerechten Lauf mit
   Einrasten, Pfeilen und Fortschrittsbalken.

   Drei Entscheidungen, die man spaeter nicht "aufraeumen" sollte:

   1. Das Scrollen macht der Browser, nicht dieses Skript. Einrasten
      per CSS (scroll-snap), Wischen am Finger ist damit nativ - mit
      der richtigen Beschleunigung, dem richtigen Gummiband am Rand
      und ohne dass die Seite blockiert. Jede selbstgebaute Loesung
      ist hier schlechter.
   2. Pfeile und Balken werden HIER eingefuegt, nicht ins HTML
      geschrieben. Ohne JavaScript bleibt ein Raster, das sich ganz
      normal scrollen laesst - keine toten Knoepfe.
   3. Die Bilder behalten ihren Klick auf die Lightbox. Deshalb wird
      beim Ziehen mit der Maus gemerkt, ob wirklich gezogen wurde,
      und nur dann der Klick geschluckt.
   ============================================================ */
(function () {
  'use strict';

  function ruhig() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function aufbauen(raster) {
    if (!raster || raster.dataset.karussell === 'ja') return;
    var kinder = raster.children;
    if (kinder.length < 3) return;
    raster.dataset.karussell = 'ja';
    raster.classList.add('ist-karussell');

    // Huelle um das Raster legen, damit Pfeile und Balken einen Platz haben.
    var huelle = document.createElement('div');
    huelle.className = 'karussell';
    raster.parentNode.insertBefore(huelle, raster);
    huelle.appendChild(raster);

    var leiste = document.createElement('div');
    leiste.className = 'karussell-leiste';

    var balken = document.createElement('div');
    balken.className = 'karussell-balken';
    balken.setAttribute('aria-hidden', 'true');
    var fuellung = document.createElement('span');
    balken.appendChild(fuellung);

    var knoepfe = document.createElement('div');
    knoepfe.className = 'karussell-knoepfe';
    var zurueck = knopf('zurueck', 'Vorheriges Bild');
    var vor = knopf('vor', 'Nächstes Bild');
    knoepfe.appendChild(zurueck);
    knoepfe.appendChild(vor);

    leiste.appendChild(balken);
    leiste.appendChild(knoepfe);
    huelle.appendChild(leiste);

    function schritt() {
      var erstes = raster.children[0];
      if (!erstes) return raster.clientWidth;
      var abstand = parseFloat(getComputedStyle(raster).columnGap || '0') || 0;
      return erstes.getBoundingClientRect().width + abstand;
    }

    function fahren(richtung) {
      raster.scrollBy({ left: richtung * schritt(), behavior: ruhig() ? 'auto' : 'smooth' });
    }
    zurueck.addEventListener('click', function () { fahren(-1); });
    vor.addEventListener('click', function () { fahren(1); });

    function stand() {
      var weg = raster.scrollWidth - raster.clientWidth;
      var anteil = weg > 1 ? raster.scrollLeft / weg : 0;
      fuellung.style.transform = 'scaleX(' + Math.max(0.06, Math.min(1, anteil || 0.06)) + ')';
      zurueck.disabled = raster.scrollLeft < 4;
      vor.disabled = raster.scrollLeft > weg - 4;
    }
    raster.addEventListener('scroll', function () {
      window.requestAnimationFrame(stand);
    }, { passive: true });
    window.addEventListener('resize', stand);
    stand();

    // Ziehen mit der Maus. Am Finger macht das der Browser selbst,
    // deshalb nur fuer Zeigergeraete mit feiner Spitze.
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var zieht = false, startX = 0, startLinks = 0, bewegt = 0;
      raster.addEventListener('pointerdown', function (ev) {
        if (ev.button !== 0) return;
        zieht = true; bewegt = 0;
        startX = ev.clientX; startLinks = raster.scrollLeft;
        raster.classList.add('zieht');
      });
      window.addEventListener('pointermove', function (ev) {
        if (!zieht) return;
        var d = ev.clientX - startX;
        bewegt = Math.max(bewegt, Math.abs(d));
        raster.scrollLeft = startLinks - d;
      });
      window.addEventListener('pointerup', function () {
        if (!zieht) return;
        zieht = false;
        raster.classList.remove('zieht');
        // Nur ein echtes Ziehen schluckt den Klick - sonst liesse sich
        // kein Bild mehr oeffnen.
        if (bewegt > 6) {
          raster.addEventListener('click', schlucken, true);
          window.setTimeout(function () {
            raster.removeEventListener('click', schlucken, true);
          }, 0);
        }
      });
      function schlucken(ev) { ev.stopPropagation(); ev.preventDefault(); }
    }
  }

  function knopf(art, beschriftung) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'karussell-knopf karussell-knopf--' + art;
    b.setAttribute('aria-label', beschriftung);
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="' + (art === 'vor' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6') + '"/></svg>';
    return b;
  }

  /* ----------------------------------------------------------------
     Kopfbild: mehrere Fotos, die sich ueberblenden
     ------------------------------------------------------------------
     Gewechselt wird NUR das Bild - Ueberschrift, Claim, Text und
     Knoepfe bleiben stehen. Das ist Absicht: ein Wechsel ganzer
     Folien braeuchte fuer jede Folie eine eigene Ueberschrift, also
     neue Inhalte und eine zweite h1 auf der Seite. Beides war nicht
     gewollt. So ist es ein Bildwechsel, kein zweiter Seiteninhalt.

     Das erste Bild bleibt im Stylesheet stehen und wird hier nicht
     angefasst: es ist das Bild, mit dem die Seite oeffnet, und es
     soll ohne JavaScript und ohne Wartezeit da sein. Die weiteren
     werden erst geladen, wenn sie an der Reihe sind.
     ---------------------------------------------------------------- */
  var WEITERE = [
    '/images/vd_prod_pergola_sunpro.webp',
    '/images/vd_prod_carport_tds.webp',
    '/images/vd_prod_kaltwintergarten_tds.webp'
  ];
  var WECHSEL = 6500;

  function kopfbilder() {
    try {
      if (ruhig()) return;
      var folie = document.querySelector('.hero--neu .hs-slide--active');
      if (!folie) return;
      var erstes = folie.querySelector('.hs-slide-bg');
      if (!erstes) return;

      var ebenen = [erstes];
      WEITERE.forEach(function (pfad) {
        var e = document.createElement('div');
        e.className = 'hs-slide-bg hs-slide-bg--weiter';
        e.setAttribute('aria-hidden', 'true');
        e.dataset.bild = pfad;
        folie.insertBefore(e, erstes.nextSibling);
        ebenen.push(e);
      });

      var jetzt = 0, timer = null;

      function angehalten() {
        var w = document.getElementById('bv-a11y-page-wrap');
        return !!(w && w.classList.contains('a11y-pause-animations'));
      }

      function weiter() {
        if (angehalten() || document.hidden) return planen();
        var naechste = (jetzt + 1) % ebenen.length;
        var e = ebenen[naechste];
        if (e.dataset.bild) {
          e.style.backgroundImage = "url('" + e.dataset.bild + "')";
          delete e.dataset.bild;
        }
        ebenen[jetzt].classList.remove('ist-sichtbar');
        e.classList.add('ist-sichtbar');
        jetzt = naechste;
        planen();
      }
      function planen() {
        window.clearTimeout(timer);
        timer = window.setTimeout(weiter, WECHSEL);
      }
      ebenen[0].classList.add('ist-sichtbar');
      planen();
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) planen();
      });
    } catch (e) { /* Ohne Wechsel bleibt das erste Bild stehen - voellig in Ordnung. */ }
  }

  function los() {
    try {
      document.querySelectorAll('.galerie-grid').forEach(aufbauen);
    } catch (e) { /* Lieber ein Raster ohne Pfeile als eine kaputte Seite. */ }
    kopfbilder();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los);
  else los();
})();
