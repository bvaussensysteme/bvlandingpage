/* ============================================
   BV AussenSysteme – JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ---- FAQ ACCORDION ----
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        el.querySelector('.faq-a').style.maxHeight = '';
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        var answer = item.querySelector('.faq-a');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ---- MOBILE MENU ----
  var mobileMenu = document.getElementById('mobileMenu');
  document.getElementById('hamburgerBtn').addEventListener('click', function () {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('mobileClose').addEventListener('click', function () {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ---- STICKY CTA – hide when contact section visible ----
  var stickyCta = document.getElementById('stickyCta');
  var kontaktSection = document.getElementById('kontakt');
  document.getElementById('stickyClose').addEventListener('click', function () {
    stickyCta.style.display = 'none';
  });
  window.addEventListener('scroll', function () {
    if (!stickyCta || !kontaktSection) return;
    if (kontaktSection.getBoundingClientRect().top < window.innerHeight) {
      stickyCta.style.display = 'none';
    }
  }, { passive: true });

  // ---- KONTAKT FORM ----
  // ══════════════════════════════════════════════════════
  // KONTAKTFORMULAR – Formspree Ajax SDK
  // formId: xnjkabdv → sendet an info@bv-aussensysteme.de
  // ══════════════════════════════════════════════════════
  var formSubmit = document.getElementById('formSubmit');
  if (formSubmit) {
    formSubmit.addEventListener('click', function () {
      var vorname   = document.getElementById('vorname').value.trim();
      var nachname  = document.getElementById('nachname').value.trim();
      var email     = document.getElementById('email').value.trim();
      var telefon   = document.getElementById('telefon').value.trim();
      var produkt   = document.getElementById('produkt').value;
      var nachricht = document.getElementById('nachricht').value.trim();
      var msgBox    = document.getElementById('formMsg');

      // Validierung
      if (!vorname || !email) {
        msgBox.textContent = 'Bitte füllen Sie mindestens Vorname und E-Mail aus.';
        msgBox.style.color = '#e05555';
        return;
      }

      var datenschutzCheck = document.getElementById('datenschutz-consent');
      if (datenschutzCheck && !datenschutzCheck.checked) {
        msgBox.textContent = 'Bitte stimmen Sie der Datenschutzerklärung zu.';
        msgBox.style.color = '#e05555';
        return;
      }

      formSubmit.disabled = true;
      formSubmit.textContent = 'Wird gesendet …';
      msgBox.textContent = '';

      var formData = new FormData();
      formData.append('vorname',   vorname);
      formData.append('nachname',  nachname);
      formData.append('email',     email);
      formData.append('telefon',   telefon  || '–');
      formData.append('produkt',   produkt  || 'Keine Auswahl');
      formData.append('nachricht', nachricht || '–');
      formData.append('_subject',  'Neue Anfrage: ' + vorname + ' ' + nachname + ' – BV AussenSysteme');
      formData.append('_replyto',  email);
      formData.append('_gotcha',   '');

      fetch('https://formspree.io/f/xnjkabdv', {
        method:  'POST',
        body:    formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.ok) {
          msgBox.innerHTML = '✅ <strong>Vielen Dank, ' + vorname + '!</strong> Sie werden weitergeleitet…';
          msgBox.style.color = '#C49A2A';
          setTimeout(function(){ window.location.href = '/danke.html'; }, 1500);
          formSubmit.textContent = 'Anfrage gesendet ✓';
          ['vorname','nachname','email','telefon','nachricht'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          });
          document.getElementById('produkt').value = '';
        } else {
          var errors = data.errors ? data.errors.map(function(e){ return e.message; }).join(', ') : 'Unbekannter Fehler';
          throw new Error(errors);
        }
      })
      .catch(function(err) {
        msgBox.innerHTML = '❌ Fehler beim Senden. Bitte rufen Sie uns direkt an: <a href="tel:+4915678696609" style="color:var(--gold-dark)">015678696609</a>';
        msgBox.style.color = '#e05555';
        formSubmit.disabled = false;
        formSubmit.textContent = 'Kostenlose Beratung anfordern →';
        console.error('Formspree:', err);
      });
    });
  }

  // ---- SMOOTH NAVBAR SHADOW ON SCROLL ----
  var navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) {
      navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
    } else {
      navbar.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
    }
  }, { passive: true });

});

// ---- LIGHTBOX ----
var lightboxImages = [
  { src: 'images/galerie-1-full.jpg', caption: 'Terrassenüberdachung Aluminium · Westerwaldkreis' },
  { src: 'images/galerie-2-full.jpg', caption: 'Detailansicht · Aluminium-Profile & Verglasung' },
  { src: 'images/galerie-3-full.jpg', caption: 'Gesamtansicht · Terrassenüberdachung Westerwaldkreis' },
];
var lightboxIndex = 0;

function openLightbox(index) {
  lightboxIndex = index;
  updateLightbox();
  var lb = document.getElementById('lightbox');
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function updateLightbox() {
  var item = lightboxImages[lightboxIndex];
  document.getElementById('lightbox-img').src     = item.src;
  document.getElementById('lightbox-img').alt     = item.caption;
  document.getElementById('lightbox-caption').textContent = item.caption;
  document.getElementById('lightbox-prev').classList.toggle('hidden', lightboxIndex === 0);
  document.getElementById('lightbox-next').classList.toggle('hidden', lightboxIndex === lightboxImages.length - 1);
}

function lightboxNav(dir) {
  lightboxIndex = Math.max(0, Math.min(lightboxImages.length - 1, lightboxIndex + dir));
  updateLightbox();
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded', function() {
  var lb = document.getElementById('lightbox');
  if (lb) {
    lb.addEventListener('click', function(e) {
      if (e.target === lb) closeLightbox();
    });
  }
});

// Close on ESC, navigate with arrow keys
document.addEventListener('keydown', function(e) {
  var lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   lightboxNav(-1);
  if (e.key === 'ArrowRight')  lightboxNav(1);
});

// Bild-Carousel: Lupen-Icon einfügen + Vollbild-Zoom-Overlay bereitstellen
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.vd-carousel').forEach(function (c) {
    var hint = document.createElement('span');
    hint.className = 'vd-carousel-zoom-hint';
    hint.textContent = '🔍';
    c.appendChild(hint);
  });
  if (document.querySelector('.vd-carousel') && !document.getElementById('vdZoomOverlay')) {
    var overlay = document.createElement('div');
    overlay.className = 'vd-zoom-overlay';
    overlay.id = 'vdZoomOverlay';
    overlay.innerHTML = '<button class="vd-zoom-close" aria-label="Schließen">✕</button><img src="" alt="" />';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('vd-zoom-close')) {
        overlay.classList.remove('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
  }
});

document.addEventListener('click', function (e) {
  var slide = e.target.closest('.vd-carousel-slide');
  if (slide) {
    var overlay = document.getElementById('vdZoomOverlay');
    if (overlay) {
      overlay.querySelector('img').src = slide.currentSrc || slide.src;
      overlay.querySelector('img').alt = slide.alt;
      overlay.classList.add('open');
    }
    return;
  }
});

// Bild-Carousel: Pfeil-Navigation für Produktvarianten mit mehreren Bildern
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.vd-carousel-btn');
  if (!btn) return;
  var carousel = btn.closest('.vd-carousel');
  if (!carousel) return;
  var slides = carousel.querySelectorAll('.vd-carousel-slide');
  var dots = carousel.querySelectorAll('.vd-carousel-dot');
  if (!slides.length) return;
  var current = 0;
  slides.forEach(function (s, i) { if (s.classList.contains('active')) current = i; });
  var dir = btn.classList.contains('vd-carousel-next') ? 1 : -1;
  var next = (current + dir + slides.length) % slides.length;
  slides[current].classList.remove('active');
  slides[next].classList.add('active');
  if (dots.length) {
    dots[current].classList.remove('active');
    dots[next].classList.add('active');
  }
  var count = carousel.querySelector('.vd-carousel-count');
  if (count) count.textContent = (next + 1) + ' / ' + slides.length;
  var label = carousel.querySelector('.vd-carousel-label');
  if (label) label.textContent = slides[next].getAttribute('data-label') || '';
});
