/* ============================================================
   BV AussenSysteme – Prozess-Schritte Ring-Fortschritt
   ============================================================ */
(function () {
  'use strict';

  var FILL_MS = 1100;
  var GAP_MS = 250;
  var HOLD_MS = 1400;
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
    fillStep(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
