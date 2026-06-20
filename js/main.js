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
  var formSubmit = document.getElementById('formSubmit');
  if (formSubmit) {
    formSubmit.addEventListener('click', function () {
      var vorname  = document.getElementById('vorname').value.trim();
      var email    = document.getElementById('email').value.trim();
      var msgBox   = document.getElementById('formMsg');
      if (!vorname || !email) {
        msgBox.textContent = 'Bitte füllen Sie mindestens Name und E-Mail aus.';
        msgBox.style.color = '#e05555';
        return;
      }
      formSubmit.disabled = true;
      formSubmit.textContent = 'Wird gesendet …';
      // Simulate send (replace with real fetch/FormSubmit/Netlify Forms)
      setTimeout(function () {
        msgBox.textContent = '✓ Vielen Dank! Wir melden uns schnellstmöglich bei Ihnen.';
        msgBox.style.color = '#C49A2A';
        formSubmit.textContent = 'Anfrage gesendet ✓';
      }, 1000);
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
