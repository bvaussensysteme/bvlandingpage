/* ============================================================
   BV AussenSysteme – Hero Slider
   ============================================================ */
(function () {
  'use strict';

  var INTERVAL = 6500;
  var slider, slides, dots, progress, pauseBtn;
  var current = 0;
  var timer = null;
  var manualPause = false; // nur durch Pause-Button, NICHT durch Hover
  var progressStart = null;
  var progressRaf = null;

  function animationsPaused() {
    // Nur durch a11y-Widget stoppen, NICHT durch prefers-reduced-motion
    // (sonst stoppt der Slider bei vielen Windows-PCs automatisch)
    var wrapper = document.getElementById('bv-page-wrapper');
    return wrapper && wrapper.classList.contains('a11y-pause-animations');
  }

  function goTo(index) {
    var total = slides.length;
    index = ((index % total) + total) % total;
    slides[current].classList.remove('hs-slide--active');
    if (dots[current]) { dots[current].classList.remove('hs-dot--active'); dots[current].setAttribute('aria-selected', 'false'); }
    current = index;
    slides[current].classList.add('hs-slide--active');
    if (dots[current]) { dots[current].classList.add('hs-dot--active'); dots[current].setAttribute('aria-selected', 'true'); }
  }

  function go(index) {
    goTo(index);
    resetTimer();
  }

  function resetTimer() {
    clearTimeout(timer);
    cancelAnimationFrame(progressRaf);
    if (manualPause || animationsPaused()) return;
    startProgress();
    timer = setTimeout(function () {
      go(current + 1);
    }, INTERVAL);
  }

  function startProgress() {
    if (!progress || animationsPaused()) {
      if (progress) progress.style.width = '0%';
      return;
    }
    progressStart = performance.now();
    progress.style.width = '0%';
    function tick(now) {
      if (manualPause) return;
      var pct = Math.min((now - progressStart) / INTERVAL * 100, 100);
      progress.style.width = pct + '%';
      if (pct < 100) progressRaf = requestAnimationFrame(tick);
    }
    progressRaf = requestAnimationFrame(tick);
  }

  function toggleManualPause() {
    manualPause = !manualPause;
    if (pauseBtn) {
      pauseBtn.innerHTML = manualPause ? '▶' : '⏸';
      pauseBtn.setAttribute('aria-label', manualPause ? 'Slider fortsetzen' : 'Slider pausieren');
    }
    if (manualPause) {
      clearTimeout(timer);
      cancelAnimationFrame(progressRaf);
    } else {
      resetTimer();
    }
  }

  function init() {
    slider = document.getElementById('heroSlider');
    if (!slider) return;

    slides = Array.from(slider.querySelectorAll('.hs-slide'));
    dots   = Array.from(document.querySelectorAll('.hs-dot'));

    // Progress bar
    progress = document.createElement('div');
    progress.className = 'hs-progress';
    slider.appendChild(progress);

    // Pause button neben den Punkten
    pauseBtn = document.createElement('button');
    pauseBtn.className = 'hs-pause-btn';
    pauseBtn.innerHTML = '⏸';
    pauseBtn.setAttribute('aria-label', 'Slider pausieren');
    pauseBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleManualPause();
    });
    var dotsEl = document.querySelector('.hs-dots-inline');
    if (dotsEl) dotsEl.appendChild(pauseBtn);

    // Arrows
    var prev = slider.querySelector('.hs-arrow--prev');
    var next = slider.querySelector('.hs-arrow--next');
    if (prev) prev.addEventListener('click', function(e) { e.stopPropagation(); go(current - 1); });
    if (next) next.addEventListener('click', function(e) { e.stopPropagation(); go(current + 1); });

    // Dots
    dots.forEach(function(dot) {
      dot.addEventListener('click', function(e) {
        e.stopPropagation();
        go(parseInt(dot.dataset.goto, 10));
      });
    });

    // Touch swipe
    slider.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    var touchStartX = 0, touchStartY = 0;
    slider.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) go(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });

    // Keyboard
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft')  go(current - 1);
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === ' ') { e.preventDefault(); toggleManualPause(); }
    });

    // a11y widget
    var wrapper = document.getElementById('bv-page-wrapper');
    if (wrapper) {
      new MutationObserver(function() {
        if (animationsPaused()) { clearTimeout(timer); cancelAnimationFrame(progressRaf); }
        else if (!manualPause) resetTimer();
      }).observe(wrapper, { attributes: true, attributeFilter: ['class'] });
    }

    goTo(0);
    resetTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
