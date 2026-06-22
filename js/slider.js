/* ============================================================
   BV AussenSysteme – Hero Slider
   Auto-slide, Touch/Swipe, Keyboard, Dots, Arrows
   Respects prefers-reduced-motion + a11y-pause-animations
   ============================================================ */
(function () {
  'use strict';

  var INTERVAL = 5000; // ms between slides
  var slider, slides, dots, progress;
  var current = 0;
  var timer = null;
  var progressTimer = null;
  var touchStartX = 0;
  var touchStartY = 0;
  var isDragging = false;

  function init() {
    slider = document.getElementById('heroSlider');
    if (!slider) return;

    slides = Array.from(slider.querySelectorAll('.hs-slide'));
    dots   = Array.from(slider.querySelectorAll('.hs-dot'));

    // Progress bar
    progress = document.createElement('div');
    progress.className = 'hs-progress';
    slider.appendChild(progress);

    // Arrows
    var prev = slider.querySelector('.hs-arrow--prev');
    var next = slider.querySelector('.hs-arrow--next');
    if (prev) prev.addEventListener('click', function () { go(current - 1, true); });
    if (next) next.addEventListener('click', function () { go(current + 1, true); });

    // Dots
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        go(parseInt(dot.dataset.goto, 10), true);
      });
    });

    // Touch / Swipe
    slider.addEventListener('touchstart', onTouchStart, { passive: true });
    slider.addEventListener('touchmove',  onTouchMove,  { passive: true });
    slider.addEventListener('touchend',   onTouchEnd,   { passive: true });

    // Mouse drag (Desktop)
    slider.addEventListener('mousedown', onMouseDown);
    slider.addEventListener('mousemove', onMouseMove);
    slider.addEventListener('mouseup',   onMouseUp);
    slider.addEventListener('mouseleave',onMouseUp);

    // Keyboard
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  go(current - 1, true);
      if (e.key === 'ArrowRight') go(current + 1, true);
    });

    // Pause on hover
    slider.addEventListener('mouseenter', pauseAuto);
    slider.addEventListener('mouseleave', startAuto);

    // Pause on focus (accessibility)
    slider.addEventListener('focusin',  pauseAuto);
    slider.addEventListener('focusout', startAuto);

    // Show first slide
    goTo(0);
    startAuto();
  }

  function animationsPaused() {
    // Check both prefers-reduced-motion AND our a11y widget setting
    var prefersReduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var wrapper = document.getElementById('bv-page-wrapper');
    var a11yPaused = wrapper && wrapper.classList.contains('a11y-pause-animations');
    return prefersReduced || a11yPaused;
  }

  function go(index, userAction) {
    var total = slides.length;
    index = ((index % total) + total) % total; // wrap around
    if (index === current && !userAction) return;
    goTo(index);
    if (userAction) {
      pauseAuto();
      startAuto();
    }
  }

  function goTo(index) {
    // Deactivate current
    slides[current].classList.remove('hs-slide--active');
    dots[current].classList.remove('hs-dot--active');
    dots[current].setAttribute('aria-selected', 'false');

    current = index;

    // Activate new
    slides[current].classList.add('hs-slide--active');
    dots[current].classList.add('hs-dot--active');
    dots[current].setAttribute('aria-selected', 'true');

    resetProgress();
  }

  function startAuto() {
    if (animationsPaused()) return;
    pauseAuto();
    startProgress();
    timer = setTimeout(function () {
      go(current + 1, false);
      startAuto();
    }, INTERVAL);
  }

  function pauseAuto() {
    clearTimeout(timer);
    clearInterval(progressTimer);
    timer = null;
    if (progress) { progress.style.transition = 'none'; progress.style.width = '0%'; }
  }

  function resetProgress() {
    if (!progress) return;
    progress.style.transition = 'none';
    progress.style.width = '0%';
  }

  function startProgress() {
    if (!progress || animationsPaused()) return;
    progress.style.transition = 'none';
    progress.style.width = '0%';
    // Force reflow
    progress.offsetHeight;
    progress.style.transition = 'width ' + INTERVAL + 'ms linear';
    progress.style.width = '100%';
  }

  /* ── Touch ── */
  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    // Allow vertical scroll
  }
  function onTouchEnd(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      go(dx < 0 ? current + 1 : current - 1, true);
    }
  }

  /* ── Mouse drag ── */
  var mouseStartX = 0;
  function onMouseDown(e) {
    mouseStartX = e.clientX;
    isDragging = true;
  }
  function onMouseMove(e) {}
  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    var dx = e.clientX - mouseStartX;
    if (Math.abs(dx) > 50) {
      go(dx < 0 ? current + 1 : current - 1, true);
    }
  }

  /* ── Watch for a11y pause toggle ── */
  var observer = new MutationObserver(function () {
    if (animationsPaused()) {
      pauseAuto();
    } else {
      startAuto();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    init();
    var wrapper = document.getElementById('bv-page-wrapper');
    if (wrapper) {
      observer.observe(wrapper, { attributes: true, attributeFilter: ['class'] });
    }
  });

})();
