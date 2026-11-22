/* ============================================================
   BV AussenSysteme – Prozess-Schritte Ring-Fortschritt
   ============================================================ */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ============================================================
     BEI "BEWEGUNG REDUZIEREN" LAEUFT GAR NICHTS MEHR (22.11.2026)

     WAS FALSCH WAR. Bis hierher wurden nur die Zeiten verkuerzt:
     Fuellen 60 ms, Pause 500 ms, Halten 1200 ms. Der Ring sprang
     damit von leer auf voll, Kreis fuer Kreis, und der ganze Ablauf
     begann alle rund vier Sekunden von vorn. Statt weniger Bewegung
     gab es ein Blinken, das nie aufhoert.

     Meldung des Betreibers vom iPhone, mit Bild: "die animation der
     kreise is auch nicht wie auf pc das sich der kreis im kreis
     fuellt und dann der naechste, sondern es blinken die kreise
     nacheinander komplett auf". Auf dem Geraet war "Bewegung
     reduzieren" eingeschaltet.

     GEMESSEN am 22.11.2026, Fuellstand aller vier Ringe alle 120 ms
     ueber 13 Sekunden:
       - Telefon normal:      14 bis 15 Messpunkte mitten im Fuellen
                              je Ring, genau wie am Rechner.
       - Telefon mit "ruhig":  0 Messpunkte dazwischen, dafuer drei
                              vollstaendige Durchlaeufe in 13 s.

     WAS JETZT GILT. Wer weniger Bewegung eingestellt hat, sieht die
     vier Ringe sofort und dauerhaft gefuellt. Keine Schleife, kein
     Blinken, kein Zeitgeber. Das ist der Sinn der Einstellung, und
     es nimmt auch WCAG 2.2.2 ernst: Was sich endlos bewegt, muss
     anhalten koennen; am besten faengt es gar nicht erst an.
     ============================================================ */
  var FILL_MS = 1900;
  var GAP_MS = 450;
  var HOLD_MS = 2200;
  var POLL_MS = 300;

  var steps = [];

  function paused() {
    var wrap = document.getElementById('bv-a11y-page-wrap');
    return wrap && wrap.classList.contains('a11y-pause-animations');
  }

  function whenReady(cb) {
    if (paused()) { setTimeout(function () { whenReady(cb); }, POLL_MS); return; }
    cb();
  }

  function resetAll() {
    steps.forEach(function (s) {
      s.circle.classList.remove('is-done');
      s.ring.style.transition = 'none';
      s.ring.style.strokeDashoffset = s.full;
      void s.ring.getBoundingClientRect();
      s.ring.style.transition = '';
    });
  }

  function fillStep(i) {
    if (i >= steps.length) {
      setTimeout(function () { resetAll(); fillStep(0); }, HOLD_MS);
      return;
    }
    whenReady(function () {
      steps[i].ring.style.strokeDashoffset = '0';
      setTimeout(function () {
        steps[i].circle.classList.add('is-done');
        setTimeout(function () { fillStep(i + 1); }, GAP_MS);
      }, FILL_MS);
    });
  }

  function init() {
    var circles = Array.from(document.querySelectorAll('.prozess-circle'));
    if (!circles.length) return;
    steps = circles.map(function (c) {
      var ring = c.querySelector('.prozess-ring-fg');
      return { circle: c, ring: ring, full: ring.getAttribute('stroke-dasharray') };
    });
    if (reducedMotion) {
      /* Endzustand zeigen, nichts bewegen. */
      steps.forEach(function (s) {
        s.ring.style.transition = 'none';
        s.ring.style.strokeDashoffset = '0';
        s.circle.classList.add('is-done');
      });
      return;
    }
    fillStep(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
