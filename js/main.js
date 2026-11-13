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
  // Hinweis: body-Klasse "bv-menu-open" blendet Konfigurator-/A11y-/Scroll-Top-Icons
  // aus (siehe css/style.css), da diese sonst mit z-index > mobile-menu
  // über dem Vollbild-Menü schweben und noch anklickbar bleiben.
  // Die 14 Ortsseiten haben kein Mobilmenue. Ohne diese Pruefung brach
  // main.js hier mit "Cannot read properties of null" ab und ALLES
  // danach lief dort nie: Sticky-Kontaktleiste, Formular-Logik,
  // Navbar-Schatten.
  var mobileMenu = document.getElementById('mobileMenu');
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var mobileClose = document.getElementById('mobileClose');
  if (mobileMenu && hamburgerBtn && mobileClose) {
    hamburgerBtn.addEventListener('click', function () {
      mobileMenu.classList.add('open');
      document.body.classList.add('bv-menu-open');
      document.body.style.overflow = 'hidden';
    });
    mobileClose.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('bv-menu-open');
      document.body.style.overflow = '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        document.body.classList.remove('bv-menu-open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- STICKY CTA – erst nach dem Hero einblenden (nicht redundant zum Hero-CTA),
  //      bei Erreichen der Kontakt-Sektion wieder ausblenden ----
  var stickyCta = document.getElementById('stickyCta');
  var kontaktSection = document.getElementById('kontakt');
  var stickyClose = document.getElementById('stickyClose');
  var heroEl = document.getElementById('heroSlider');
  var stickyClosed = false;
  if (stickyClose) {
    stickyClose.addEventListener('click', function () {
      stickyClosed = true;
      if (stickyCta) stickyCta.style.display = 'none';
    });
  }
  function updateSticky() {
    if (!stickyCta || stickyClosed) return;
    var pastHero = window.pageYOffset > (heroEl ? heroEl.offsetHeight - 120 : 560);
    var kontaktVisible = kontaktSection && kontaktSection.getBoundingClientRect().top < window.innerHeight;
    stickyCta.style.display = (pastHero && !kontaktVisible) ? 'flex' : 'none';
  }
  window.addEventListener('scroll', updateSticky, { passive: true });
  updateSticky();

  // ---- KONTAKT FORM ----
  // ══════════════════════════════════════════════════════
  // KONTAKTFORMULAR – Formspree Ajax SDK
  // formId: xnjkabdv → sendet an info@bv-aussensysteme.de
  // ══════════════════════════════════════════════════════
  var formSubmit = document.getElementById('formSubmit');
  if (formSubmit) {
    // Kein <form>-Element vorhanden (nur type="button") – daher löst die
    // Enter-Taste in den Textfeldern bisher kein Absenden aus. Das
    // erwarten Nutzer aber (v.a. mobil nach dem letzten Feld). Nachbilden:
    ['vorname', 'nachname', 'email', 'telefon'].forEach(function (id) {
      var field = document.getElementById(id);
      if (field) {
        field.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            formSubmit.click();
          }
        });
      }
    });

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
          // Vorname kommt aus dem eigenen Formularfeld des Nutzers und wird hier
          // ins DOM zurückgespiegelt – ohne Escaping wäre das eine DOM-XSS-Lücke
          // (z.B. Name = "<img src=x onerror=...>"). Daher escapen statt roh einsetzen.
          var vornameEscaped = String(vorname)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          msgBox.innerHTML = (window.bvSymbol ? window.bvSymbol('haken') : '') +
            ' <strong>Vielen Dank, ' + vornameEscaped + '!</strong> Sie werden weitergeleitet…';
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
        msgBox.innerHTML = (window.bvSymbol ? window.bvSymbol('kreuz') : '') + ' Fehler beim Senden. Bitte rufen Sie uns direkt an: <a href="tel:+4915678696609" style="color:var(--gold-dark)">015678696609</a>';
        msgBox.style.color = '#e05555';
        formSubmit.disabled = false;
        formSubmit.textContent = 'Kostenlose Beratung anfordern →';
        console.error('Formspree:', err);
      });
    });
  }

  // ---- SMOOTH NAVBAR SHADOW ON SCROLL ----
  // Auch hier pruefen: die Ortsseiten haben eine eigene, schlanke
  // Kopfzeile ohne .navbar - ohne Pruefung feuerte bei jedem
  // Scroll-Ereignis ein Fehler.
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
      } else {
        navbar.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
      }
    }, { passive: true });
  }

});

// ---- LIGHTBOX ----
var lightboxImages = [
  { src: 'images/galerie-1-full.jpg', caption: 'Terrassenüberdachung Aluminium · Westerwaldkreis' },
  { src: 'images/galerie-2-full.jpg', caption: 'Detailansicht · Aluminium-Profile & Verglasung' },
  { src: 'images/galerie-3-full.jpg', caption: 'Gesamtansicht · Terrassenüberdachung Westerwaldkreis' },
  /* Eigene Referenz, 13.11.2026. Die Reihenfolge hier MUSS der
     Reihenfolge der .galerie-item in index.html entsprechen - die
     onclick-Nummern zeigen in genau dieses Feld. Wird oben etwas
     eingefuegt, verschieben sich alle folgenden Nummern.
     Geprueft von scripts/pruefe-galerie.mjs. */
  { src: 'images/galerie-4-full.webp', caption: 'Carport Aluminium anthrazit · Referenz BV AussenSysteme' },
  { src: 'images/galerie-5-full.webp', caption: 'Carport · Ansicht von der Seite · Referenz BV AussenSysteme' },
  { src: 'images/vd_ref_1-full.webp', caption: 'Terrassenüberdachung mit Glasdach · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_2-full.webp', caption: 'Große Aluminium-Terrassenüberdachung · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_3-full.webp', caption: 'Terrassenüberdachung mit Lounge · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_4-full.webp', caption: 'Glas-Terrassendach über Holzterrasse · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_5-full.webp', caption: 'Freistehender Glasanbau / Kaltwintergarten · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_6-full.webp', caption: 'Freistehende Terrassenüberdachung · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_7-full.webp?v=b', caption: 'Aluminium-Carport · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_8-full.webp', caption: 'Carport mit Flachdach · Referenz VD AluSysteme' },
  { src: 'images/vd_ref_9-full.webp', caption: 'Eingangsüberdachung / Vordach · Referenz VD AluSysteme' },
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
    hint.innerHTML = (window.bvSymbol ? window.bvSymbol('lupe') : '');
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

/* ============================================================
   SCHWEBENDE KNOEPFE GEHEN BEIM LESEN AUS DEM WEG (07.11.2026)

   GEMESSEN am Handy (390 x 844, /stoffe): Die drei runden Knöpfe
   stehen bei x 334-378, y 618-770 - mitten in der Textspalte, die
   bis x 374 reicht. Beim Lesen liegen sie also auf den Wörtern.

   Statt sie kleiner zu machen oder wegzulassen (beides nimmt
   Funktion weg): Sie weichen zur Seite, solange nach unten gelesen
   wird, und kommen zurück, sobald jemand anhält oder nach oben
   geht. Das ist genau der Augenblick, in dem man sie wieder braucht.

   Nur bei grobem Zeiger - am Schreibtisch stören sie nicht, und wer
   "Bewegung reduzieren" eingestellt hat, bekommt gar keine.
   ============================================================ */
(function () {
  'use strict';
  var grob = false, wenigBewegung = false;
  try {
    grob = window.matchMedia('(pointer: coarse)').matches;
    wenigBewegung = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { return; }
  if (!grob || wenigBewegung) return;

  var letzte = window.pageYOffset || 0;
  var weg = false, warte = null;

  function setzen(verbergen) {
    if (verbergen === weg) return;
    weg = verbergen;
    document.body.classList.toggle('bv-schwebe-weg', verbergen);
  }

  window.addEventListener('scroll', function () {
    var jetzt = window.pageYOffset || 0;
    /* Erst ab 240 px: ganz oben soll nichts wandern. */
    if (jetzt > 240 && jetzt > letzte + 8) setzen(true);
    else if (jetzt < letzte - 8 || jetzt <= 240) setzen(false);
    letzte = jetzt;
    /* Nach einer Ruhepause wieder da, auch ohne Hochscrollen. */
    clearTimeout(warte);
    warte = setTimeout(function () { setzen(false); }, 1200);
  }, { passive: true });
})();

/* ============================================================
   Zahlen zaehlen hoch, wenn sie ins Bild kommen
   ------------------------------------------------------------
   Nur die Ziffern laufen, der Rest des Textes bleibt stehen:
   aus "100%" wird waehrend des Laufs "37%", nicht "37". Das
   Ergebnis steht IMMER im HTML - gezaehlt wird nur, wenn der
   Browser mitspielt und niemand weniger Bewegung wuenscht.
   Faellt irgendetwas aus, steht die richtige Zahl schon da.
   ============================================================ */
(function () {
  'use strict';
  try {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var felder = [].slice.call(document.querySelectorAll('.stat-box .num'));
    if (!felder.length) return;

    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        beobachter.unobserve(e.target);
        zaehlen(e.target);
      });
    }, { threshold: 0.4 });

    felder.forEach(function (el) {
      var text = (el.textContent || '').trim();
      var treffer = text.match(/^(\d+)(.*)$/);
      if (!treffer) return;
      el.dataset.ziel = treffer[1];
      el.dataset.rest = treffer[2] || '';
      beobachter.observe(el);
    });

    function zaehlen(el) {
      var ziel = parseInt(el.dataset.ziel, 10);
      var rest = el.dataset.rest || '';
      if (!(ziel > 0)) return;
      var dauer = 900, start = null;
      function schritt(jetzt) {
        if (start === null) start = jetzt;
        var t = Math.min(1, (jetzt - start) / dauer);
        // Weich auslaufen: schnell los, ruhig ankommen.
        var w = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(ziel * w) + rest;
        if (t < 1) window.requestAnimationFrame(schritt);
        else el.textContent = ziel + rest;
      }
      window.requestAnimationFrame(schritt);
    }
  } catch (e) { /* Die Zahl steht ohnehin im HTML. */ }
})();
