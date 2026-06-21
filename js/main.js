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
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
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

      fetch('https://formspree.io/f/xnjkabdv', {
        method:  'POST',
        body:    formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.ok) {
          msgBox.innerHTML = '✅ <strong>Vielen Dank, ' + vorname + '!</strong> Wir melden uns schnellstmöglich bei Ihnen.';
          msgBox.style.color = '#C49A2A';
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

// ---- REVIEWS TAB SWITCHER ----
function switchTab(tab) {
  // hide all panels
  document.querySelectorAll('.reviews-panel').forEach(function(p) {
    p.style.display = 'none';
    p.classList.remove('active');
  });
  document.querySelectorAll('.reviews-tab').forEach(function(b) {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  var panel = document.getElementById('tab-' + tab);
  var btn   = document.getElementById('btn-' + tab);
  if (panel) { panel.style.display = 'block'; panel.classList.add('active'); }
  if (btn)   { btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); }
}

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
