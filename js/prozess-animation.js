/* ============================================================
   BV AussenSysteme – Prozess-Schritte Umlauf-Highlight
   ============================================================ */
(function () {
  'use strict';

  var INTERVAL = 1800;
  var circles, current = -1, timer = null;

  function animationsPaused() {
    var wrapper = document.getElementById('bv-a11y-page-wrap');
    return wrapper && wrapper.classList.contains('a11y-pause-animations');
  }

  function next() {
    if (animationsPaused()) return;
    if (current >= 0) circles[current].classList.remove('is-active');
    current = (current + 1) % circles.length;
    circles[current].classList.add('is-active');
  }

  function init() {
    circles = Array.from(document.querySelectorAll('.prozess-circle'));
    if (!circles.length) return;
    next();
    timer = setInterval(next, INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
