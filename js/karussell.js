/* ============================================================
   BV AussenSysteme – Karussell (Referenzen)
   ------------------------------------------------------------
   Macht aus einem vorhandenen Raster einen waagerechten Lauf mit
   Einrasten und Punkten darunter.

   GEAENDERT AM 20.11.2026, Ansage des Betreibers: "Mach das bei
   Projekten, die fuer sich sprechen, auch mit diesen Punkten. Also
   graue Punkte und bei dem Bild, bei dem man ist, ist dann Gold.
   Und mach diese Pfeile unten rechts weg." Vorher standen dort ein
   Fortschrittsbalken und zwei runde Pfeile.

   Drei Entscheidungen, die man spaeter nicht "aufraeumen" sollte:

   1. Das Scrollen macht der Browser, nicht dieses Skript. Einrasten
      per CSS (scroll-snap), Wischen am Finger ist damit nativ - mit
      der richtigen Beschleunigung, dem richtigen Gummiband am Rand
      und ohne dass die Seite blockiert. Jede selbstgebaute Loesung
      ist hier schlechter.
   2. Die Punkte werden HIER eingefuegt, nicht ins HTML geschrieben.
      Ohne JavaScript bleibt ein Raster, das sich ganz normal
      scrollen laesst - keine tote Anzeige.
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

    /* Punkte statt Fortschrittsbalken, einer je Bild. Sie sind eine
       ANZEIGE, keine Schaltflaeche: Ein 7-px-Punkt waere eine
       Tippflaeche weit unter den 24 x 24 px aus WCAG 2.2, 2.5.8.
       Geschoben wird mit dem Finger, dem Mausrad, dem Ziehen mit
       der Maus und der Tabulatortaste. */
    var punkte = document.createElement('div');
    punkte.className = 'karussell-punkte';
    punkte.setAttribute('aria-hidden', 'true');
    for (var n = 0; n < kinder.length; n++) {
      punkte.appendChild(document.createElement('span'));
    }

    /* Fuer Hilfsmittel dasselbe in Worten, hoeflich angesagt und nur
       beim Schieben (WCAG 2.2, 4.1.3). */
    var sage = document.createElement('p');
    sage.className = 'sr-only';
    sage.setAttribute('aria-live', 'polite');

    leiste.appendChild(punkte);
    leiste.appendChild(sage);
    huelle.appendChild(leiste);

    function schritt() {
      var erstes = raster.children[0];
      if (!erstes) return raster.clientWidth;
      var abstand = parseFloat(getComputedStyle(raster).columnGap || '0') || 0;
      return erstes.getBoundingClientRect().width + abstand;
    }

    function stand() {
      var weg = raster.scrollWidth - raster.clientWidth;
      var br = schritt() || 1;
      var nr = Math.min(kinder.length - 1, Math.max(0, Math.round(raster.scrollLeft / br)));
      /* Am rechten Anschlag der LETZTE Punkt. Sonst bliebe er am
         vorletzten haengen, wenn zwei Bilder nebeneinander passen.
         Dasselbe war am 19.11.2026 beim Zaehler der Produktgalerien
         zu korrigieren. */
      if (weg > 1 && raster.scrollLeft >= weg - 4) nr = kinder.length - 1;
      for (var n = 0; n < punkte.children.length; n++) {
        punkte.children[n].className = (n === nr ? 'ist-da' : '');
      }
      sage.textContent = 'Bild ' + (nr + 1) + ' von ' + kinder.length;
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
