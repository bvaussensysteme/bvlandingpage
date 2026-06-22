/* ============================================================
   BV AussenSysteme – Hero Slider
   ============================================================ */
(function () {
  'use strict';

  var INTERVAL = 6500;
  var slider, slides, dots, progress, pauseBtn;
  var current = 0;
  var timer = null;
  var paused = false;
  var touchStartX = 0;
  var touchStartY = 0;
  var progressStart = null;
  var progressRaf = null;

  /* ── Animationen pausiert? ── */
  function animationsPaused() {
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var wrapper = document.getElementById('bv-page-wrapper');
    return prefersReduced || (wrapper && wrapper.classList.contains('a11y-pause-animations'));
  }

  /* ── Slide wechseln ── */
  function goTo(index) {
    var total = slides.length;
    index = ((index % total) + total) % total;
    slides[current].classList.remove('hs-slide--active');
    dots[current].classList.remove('hs-dot--active');
    dots[current].setAttribute('aria-selected', 'false');
    current = index;
    slides[current].classList.add('hs-slide--active');
    dots[current].classList.add('hs-dot--active');
    dots[current].setAttribute('aria-selected', 'true');
  }

  function go(index) {
    goTo(index);
    if (!paused) {
      resetTimer();
    }
  }

  /* ── Timer ── */
  function resetTimer() {
    clearTimeout(timer);
    cancelAnimationFrame(progressRaf);
    if (paused || animationsPaused()) return;
    startProgress();
    timer = setTimeout(function () {
      go(current + 1);
    }, INTERVAL);
  }

  /* ── Progress Bar ── */
  function startProgress() {
    if (!progress || animationsPaused()) {
      if (progress) { progress.style.width = '0%'; }
      return;
    }
    progressStart = performance.now();
    progress.style.transition = 'none';
    progress.style.width = '0%';

    function tick(now) {
      var elapsed = now - progressStart;
      var pct = Math.min(elapsed / INTERVAL * 100, 100);
      progress.style.transition = 'none';
      progress.style.width = pct + '%';
      if (pct < 100 && !paused) {
        progressRaf = requestAnimationFrame(tick);
      }
    }
    progressRaf = requestAnimationFrame(tick);
  }

  /* ── Pause/Resume ── */
  function pause() {
    if (paused) return;
    paused = true;
    clearTimeout(timer);
    cancelAnimationFrame(progressRaf);
    if (pauseBtn) { pauseBtn.innerHTML = '▶'; pauseBtn.setAttribute('aria-label', 'Slider fortsetzen'); }
  }

  function resume() {
    if (!paused) return;
    paused = false;
    if (pauseBtn) { pauseBtn.innerHTML = '⏸'; pauseBtn.setAttribute('aria-label', 'Slider pausieren'); }
    resetTimer();
  }

  function togglePause() {
    paused ? resume() : pause();
  }

  /* ── Init ── */
  function init() {
    slider = document.getElementById('heroSlider');
    if (!slider) return;

    slides = Array.from(slider.querySelectorAll('.hs-slide'));
    dots   = Array.from(slider.querySelectorAll('.hs-dot'));

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
      togglePause();
    });
    // Insert pause button into dots container
    var dotsEl = slider.querySelector('.hs-dots');
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

    // Pause ONLY when hovering clickable elements (arrows, dots, pause btn, slide buttons)
    var clickables = Array.from(slider.querySelectorAll('.hs-arrow, .hs-dots, .hs-slide-btns, .hero-btns'));
    clickables.forEach(function(el) {
      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', resume);
    });

    // Touch swipe
    slider.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    slider.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        go(dx < 0 ? current + 1 : current - 1);
      }
    }, { passive: true });

    // Keyboard
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft')  go(current - 1);
      if (e.key === 'ArrowRight') go(current + 1);
      if (e.key === ' ') { e.preventDefault(); togglePause(); }
    });

    // Watch a11y widget pause toggle
    var wrapper = document.getElementById('bv-page-wrapper');
    if (wrapper) {
      new MutationObserver(function() {
        if (animationsPaused()) pause();
        else resume();
      }).observe(wrapper, { attributes: true, attributeFilter: ['class'] });
    }

    // Start
    goTo(0);
    resetTimer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
