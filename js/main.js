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
    /* ============================================================
       FOKUS IM GEOEFFNETEN MENUE (22.11.2026)

       WAS FALSCH WAR, gemessen bei 390 px mit 40 Tabulatordruecken
       nach dem Oeffnen: Der Fokus blieb auf der Seite DAHINTER. Auf
       index.html lagen 31 von 31 Haltepunkten ausserhalb des Menues,
       auf der Produktseite 35 von 35, auf windzonen und
       baugenehmigung je 33 von 33. Das Menue liegt als Vollbild
       darueber, also tabbte man unsichtbar durch die verdeckte
       Seite. WCAG 2.2, 2.4.3 (Stufe A), und in der Folge 2.4.7.
       Escape schloss nichts, und der Hamburger hatte kein
       aria-expanded (4.1.2).

       WAS JETZT GILT: Beim Oeffnen geht der Fokus auf den
       Schliessen-Knopf, der Tabulator bleibt im Menue, Escape
       schliesst, und danach steht der Fokus wieder auf dem
       Hamburger. aria-expanded sagt, was Sache ist.

       WARUM KEIN inert AUF DEM REST: Das waere sauberer, braucht
       aber einen Elternknoten, der die ganze uebrige Seite umfasst.
       Den gibt es hier nicht; header, main und footer liegen
       nebeneinander. Die Falle unten kommt ohne Umbau aus.
       ============================================================ */
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    var menueVorher = null;

    function menueOeffnen() {
      menueVorher = document.activeElement;
      mobileMenu.classList.add('open');
      document.body.classList.add('bv-menu-open');
      document.body.style.overflow = 'hidden';
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      try { mobileClose.focus(); } catch (e) {}
    }
    function menueSchliessen(zurueck) {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('bv-menu-open');
      document.body.style.overflow = '';
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      if (zurueck) {
        /* <body> zaehlt NICHT als Rueckkehrziel: Wer das Menue per
           Skript oder per Fingertipp geoeffnet hat, stand vorher auf
           body, und dorthin zurueckzukehren heisst, den Fokus zu
           verlieren. Gemessen am 22.11.2026: nach Escape stand er auf
           BODY. Dann lieber auf den Hamburger, von dem aus das Menue
           kam. */
        var ziel = (menueVorher && menueVorher.focus && menueVorher !== document.body)
          ? menueVorher : hamburgerBtn;
        try { ziel.focus(); } catch (e) {}
      }
      menueVorher = null;
    }

    hamburgerBtn.addEventListener('click', menueOeffnen);
    mobileClose.addEventListener('click', function () { menueSchliessen(true); });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      /* Beim Verweis NICHT den Fokus zurueckholen: Der Besucher
         springt an eine andere Stelle, dorthin gehoert er auch. */
      a.addEventListener('click', function () { menueSchliessen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (!mobileMenu.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); menueSchliessen(true); return; }
      if (e.key !== 'Tab') return;
      var ziele = [].slice.call(mobileMenu.querySelectorAll('a, button'))
        .concat([mobileClose])
        .filter(function (el) { return el.offsetParent !== null || el === mobileClose; });
      if (!ziele.length) return;
      var erste = ziele[0], letzte = ziele[ziele.length - 1];
      if (!mobileMenu.contains(document.activeElement) && document.activeElement !== mobileClose) {
        e.preventDefault(); erste.focus(); return;
      }
      if (e.shiftKey && document.activeElement === erste) { e.preventDefault(); letzte.focus(); }
      else if (!e.shiftKey && document.activeElement === letzte) { e.preventDefault(); erste.focus(); }
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

  /* HIER STAND EIN KONTAKTFORMULAR-ZWEIG (Formspree, rund 100 Zeilen).
     Er haengte an id="formSubmit", und diese id gibt es auf keiner
     Seite mehr. Gefunden am 14.11.2026, entfernt am 19.11.2026.

     Warum entfernt und nicht nur kommentiert: Toter Code mit
     Formularlogik ist gefaehrlich, weil beim naechsten Umbau jemand
     annimmt, er sei in Betrieb, und sich darauf stuetzt. Die Anfragen
     laufen ueber js/anfrage-wizard.js und /api/kontakt. Der alte Weg
     steht in der Versionsgeschichte. */

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
     Geprueft von scripts/pruefe-referenz-galerie.mjs. */
  { src: 'images/galerie-4-full.webp', caption: 'Carport Aluminium anthrazit · Referenz BV AussenSysteme' },
  { src: 'images/galerie-5-full.webp', caption: 'Carport · Ansicht von der Seite · Referenz BV AussenSysteme' },
  { src: 'images/vd_ref_1-full.webp', caption: 'Terrassenüberdachung mit Glasdach · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_2-full.webp', caption: 'Große Aluminium-Terrassenüberdachung · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_3-full.webp', caption: 'Terrassenüberdachung mit Lounge · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_4-full.webp', caption: 'Glas-Terrassendach über Holzterrasse · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_5-full.webp', caption: 'Freistehender Glasanbau / Kaltwintergarten · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_6-full.webp', caption: 'Freistehende Terrassenüberdachung · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_7-full.webp?v=b', caption: 'Aluminium-Carport · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_8-full.webp', caption: 'Carport mit Flachdach · Beispielbild VD AluSysteme' },
  { src: 'images/vd_ref_9-full.webp', caption: 'Eingangsüberdachung / Vordach · Beispielbild VD AluSysteme' },
];
var lightboxIndex = 0;

/* WOHIN DER FOKUS BEIM SCHLIESSEN ZURUECK GEHT.
   Seit dem 21.11.2026 oeffnen die Galeriebilder ueber eine echte
   Schaltflaeche und damit auch mit der Tastatur (vorher: onclick an
   einem div, WCAG 2.2, 2.1.1, Stufe A). Damit entsteht ein zweites
   Problem, das es vorher nicht geben konnte: Wer das Bild mit der
   Tastatur oeffnet und schliesst, stand ohne diese Zeile auf
   <body> und musste sich von oben durch die ganze Seite tabben.
   Dasselbe macht js/galerie.js fuer die Produktseiten. */
var lightboxRueckkehr = null;

function openLightbox(index, ausloeser) {
  lightboxIndex = index;
  lightboxRueckkehr = (ausloeser && ausloeser.focus) ? ausloeser : document.activeElement;
  updateLightbox();
  var lb = document.getElementById('lightbox');
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  /* Der Fokus muss IN das Fenster, sonst liegt er weiter hinter dem
     Vorhang auf der Seite - aria-modal verdeckt ihn nur fuer
     Vorlesesoftware, nicht fuer den Tabulator. */
  var zu = document.getElementById('lightbox-close');
  if (zu) { try { zu.focus(); } catch (e) {} }
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
  if (lightboxRueckkehr) { try { lightboxRueckkehr.focus(); } catch (e) {} }
  lightboxRueckkehr = null;
}

function updateLightbox() {
  var item = lightboxImages[lightboxIndex];
  document.getElementById('lightbox-img').src     = item.src;
  document.getElementById('lightbox-img').alt     = item.caption;
  document.getElementById('lightbox-caption').textContent = item.caption;
  document.getElementById('lightbox-prev').classList.toggle('hidden', lightboxIndex === 0);
  document.getElementById('lightbox-next').classList.toggle('hidden', lightboxIndex === lightboxImages.length - 1);
  /* WENN DER KNOPF UNTER DEM FOKUS VERSCHWINDET.
     Gemessen am 21.11.2026: Wer mit der Tastatur auf "Nächstes Bild"
     bis ans Ende der Reihe blättert, verliert den Fokus an <body> -
     der Knopf bekommt .hidden (display: none) und nimmt ihn mit.
     Am Anfang der Reihe dasselbe mit "Vorheriges Bild". Das ist
     WCAG 2.2, 2.4.3. Erst ein weiterer Tabulatordruck holt den Fokus
     zurueck; dazwischen steht er nirgends.
     Also: zum Gegenpfeil, und wenn der auch weg ist, zum Schliessen. */
  var aktiv = document.activeElement;
  if (aktiv && aktiv.classList && aktiv.classList.contains('hidden')) {
    var ersatz = document.getElementById(
      aktiv.id === 'lightbox-next' ? 'lightbox-prev' : 'lightbox-next');
    if (!ersatz || ersatz.classList.contains('hidden')) {
      ersatz = document.getElementById('lightbox-close');
    }
    if (ersatz) { try { ersatz.focus(); } catch (e) {} }
  }
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
  /* Tabulator bleibt im Fenster. Ohne das wandert der Fokus hinter
     den Vorhang auf die Seite, und zwar unsichtbar. */
  if (e.key === 'Tab') {
    var ziele = lb.querySelectorAll('button:not(.hidden)');
    if (!ziele.length) return;
    var erste = ziele[0], letzte = ziele[ziele.length - 1];
    if (e.shiftKey && document.activeElement === erste) { e.preventDefault(); letzte.focus(); }
    else if (!e.shiftKey && document.activeElement === letzte) { e.preventDefault(); erste.focus(); }
    else if (!lb.contains(document.activeElement)) { e.preventDefault(); erste.focus(); }
  }
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
   SCHWEBENDE KNOEPFE DECKEN KEINE ANDEREN KNOEPFE ZU (19.11.2026)

   GEMESSEN mit scripts/pruefe-mitwachsend.mjs: Bei 390 x 750 deckte
   der Bedienhilfen-Knopf 42 x 31 px von "Katalog ansehen" ab und die
   Konfigurator-Blase 42 x 36 px von "WhatsApp"; auf
   /produkte/carport.html bei 320 px 42 x 30 px eines Verweises. Ein
   Tipp auf diese Stelle oeffnete also das Bedienfeld statt der Seite,
   auf die der Verweis zeigt.

   Die Bremse im Block darueber hilft nicht: Sie greift erst ab 240 px
   Scrollweg und bringt die Knoepfe nach einer Ruhepause zurueck -
   also genau dorthin, wo sie wieder zudecken.

   WANN GILT ETWAS ALS ZUGEDECKT: wenn unter dem Knopf auf einer
   Flaeche von 24 x 24 px durchgehend derselbe andere Knopf liegt.
   24 x 24 px ist die Mindestgroesse einer antippbaren Flaeche nach
   WCAG 2.2, 2.5.8. Weniger kann keine ganze Trefferflaeche
   schlucken; mehr schon. Dieselbe Schwelle benutzt die Pruefung.

   GEMESSEN WIRD MIT elementsFromPoint, nicht mit Rechtecken: Das
   beantwortet genau die Frage, auf die es ankommt ("was liegt hier
   unter meinem Finger"), kostet vier Abfragen je Knopf statt eines
   Durchlaufs durch hunderte Elemente, und es stimmt auch dann, wenn
   etwas anderes dazwischenliegt.

   WARUM DIE LAGE GERECHNET UND NICHT GEMESSEN WIRD: Sobald die Klasse
   gesetzt ist, sind die Knoepfe unsichtbar. Eine zweite Messung an
   ihrem Element faende dann nichts mehr, die Klasse fiele weg, die
   Knoepfe kaemen zurueck, und das Ganze von vorn. Ihre Abstaende zur
   rechten unteren Ecke aendern sich aber nie, also wird daraus
   gerechnet. Gemessen am 19.11.2026: ohne das ging die Klasse an und
   sofort wieder aus.
   ============================================================ */
(function () {
  'use strict';
  var ziele = ['#bv-a11y-trigger', '#bv-scroll-top', '#bvKonfigBubble'];
  var BEDIEN = 'a[href], button, [role="button"]';
  var basis = null;     /* [{rechts, unten, w, h}] */
  var an = false;

  function basisMessen() {
    if (document.body.classList.contains('bv-schwebe-hero')) return;
    var neu = [];
    ziele.forEach(function (w) {
      var e = document.querySelector(w);
      if (!e) return;
      var cs = window.getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      neu.push({ rechts: window.innerWidth - r.right, unten: window.innerHeight - r.bottom,
                 w: r.width, h: r.height });
    });
    /* Nur uebernehmen, wenn mehr gefunden wurde als bisher: Der
       Nach-oben-Knopf entsteht erst beim Scrollen. */
    if (!basis || neu.length > basis.length) basis = neu;
  }

  function lagenJetzt() {
    if (!basis) return [];
    var bw = window.innerWidth, bh = window.innerHeight;
    return basis.map(function (b) {
      return { left: bw - b.rechts - b.w, right: bw - b.rechts,
               top: bh - b.unten - b.h, bottom: bh - b.unten };
    });
  }

  /* Welcher fremde Knopf liegt an diesem Punkt? Eigene schwebende
     Knoepfe und die Kopfzeile zaehlen nicht. */
  function knopfAn(x, y) {
    if (!document.elementsFromPoint) return null;
    var liste = document.elementsFromPoint(x, y) || [];
    for (var i = 0; i < liste.length; i++) {
      var e = liste[i];
      if (!e || !e.closest) continue;
      var k = e.closest(BEDIEN);
      if (!k) continue;
      if (window.getComputedStyle(k).position === 'fixed') continue;
      /* Eine FESTE Kopfzeile, unter der Inhalt durchlaeuft, ist
         Absicht. Eine Liste von Sprungmarken mitten auf der Seite
         steht aber auch in einem <nav> und ist ganz normaler Inhalt.
         Ausgenommen wird deshalb nur, was wirklich festklebt.
         Gemessen am 19.11.2026: Ohne diese Unterscheidung blieb eine
         Ueberdeckung von 42 x 30 px auf /produkte/carport.html
         unbemerkt, weil der Verweis in einem <nav> stand. */
      var leiste = k.closest('header, nav, [role="banner"], .navbar, .mobile-menu');
      if (leiste) {
        var lp = window.getComputedStyle(leiste).position;
        if (lp === 'fixed' || lp === 'sticky') continue;
      }
      return k;
    }
    return null;
  }

  function pruefen() {
    var lagen = lagenJetzt();
    var treffer = false;
    for (var j = 0; j < lagen.length && !treffer; j++) {
      var f = lagen[j];
      var cx = (f.left + f.right) / 2, cy = (f.top + f.bottom) / 2;
      if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) continue;
      /* ERST SUCHEN, DANN RECHNEN. Neun Tastpunkte ueber den Knopf
         verteilt sagen, WELCHE fremden Knoepfe ueberhaupt darunter
         liegen; die Ueberdeckung selbst wird danach aus den
         Rechtecken gerechnet und ist damit exakt.

         Der Umweg ueber feste Quadrate ging schief: Eine Ueberdeckung
         von 42 x 30 px in der Mitte eines 44 px hohen Knopfes passt
         in kein Quadrat, das an einer Ecke klebt. Gemessen am
         19.11.2026 auf /produkte/carport.html bei 320 px. */
      var kandidaten = [];
      for (var sx = 0; sx < 3; sx++) {
        for (var sy = 0; sy < 3; sy++) {
          var px = f.left + 2 + sx * ((f.right - f.left - 4) / 2);
          var py = f.top + 2 + sy * ((f.bottom - f.top - 4) / 2);
          var kand = knopfAn(px, py);
          if (kand && kandidaten.indexOf(kand) < 0) kandidaten.push(kand);
        }
      }
      for (var ki = 0; ki < kandidaten.length && !treffer; ki++) {
        var kr = kandidaten[ki].getBoundingClientRect();
        var ux = Math.min(f.right, kr.right) - Math.max(f.left, kr.left);
        var uy = Math.min(f.bottom, kr.bottom) - Math.max(f.top, kr.top);
        if (ux >= 24 && uy >= 24) treffer = true;
      }
    }
    if (treffer === an) return;
    an = treffer;
    document.body.classList.toggle('bv-schwebe-hero', treffer);
  }

  var lauft = false;
  function anstossen() {
    if (lauft) return;
    lauft = true;
    requestAnimationFrame(function () { lauft = false; pruefen(); });
  }

  /* Die schwebenden Knoepfe kommen aus eigenen Skripten und stehen
     beim ersten Durchlauf noch nicht unbedingt da. */
  function start() { basisMessen(); pruefen(); }
  start();
  /* KURZ GETAKTET IN DEN ERSTEN SEKUNDEN. Die schwebenden Knoepfe
     entstehen aus eigenen Skripten; bis dahin gibt es nichts zu
     messen. Mit nur drei Versuchen (0, 400, 1200 ms) lag auf
     /produkte/carport.html bei 320 px noch nach 650 ms eine
     Ueberdeckung von 42 x 30 px offen. Alle 200 ms nachsehen kostet
     fast nichts und endet, sobald alles dasteht. */
  var versuche = 0;
  var takt = setInterval(function () {
    versuche++;
    start();
    if ((basis && basis.length >= 2) || versuche > 25) clearInterval(takt);
  }, 200);

  window.addEventListener('scroll', anstossen, { passive: true });
  window.addEventListener('resize', function () { anstossen(); }, { passive: true });
  window.addEventListener('load', start);
  /* UND BEI JEDER UMBRUCHAENDERUNG. Bilder, Schriften und nachgeladene
     Abschnitte verschieben den Inhalt noch Sekunden nach dem ersten
     Zeichnen. Auf /produkte/carport.html bei 320 px rutschte ein
     Verweis erst dadurch unter den Knopf, und ohne diesen Beobachter
     blieb die Ueberdeckung stehen, bis jemand scrollte. Das Ein- und
     Ausblenden der Knoepfe aendert die Hoehe des Dokuments nicht, es
     kann sich also nicht selbst aufschaukeln. */
  if (window.ResizeObserver) {
    try {
      new ResizeObserver(function () { anstossen(); }).observe(document.documentElement);
    } catch (e) {}
  }
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

/* ============================================
   FOKUS NICHT VERDECKT (WCAG 2.2, 2.4.11) – 20.11.2026

   GEMESSEN, nicht vermutet. scripts/pruefe-fokus-verdeckung.mjs
   tabbte sich durch sieben Seiten in zwei Breiten: In 22 von 28
   Faellen war ein fokussiertes Element VOLLSTAENDIG verdeckt,
   455 mal vom Cookie-Hinweis, 41 mal von der festen Leiste unten.

   WARUM DAS PASSIERT: Der Browser holt ein fokussiertes Element in
   den sichtbaren Bereich, nicht unter eine feste Leiste vorbei. Er
   haelt sich dabei aber an scroll-padding des Scroll-Behaelters, und
   das hatte die Seite nicht. body hat 60 px Polster unten fuer die
   Leiste, das hilft dem letzten Element der Seite, aber nicht dem
   Scrollen dorthin.

   WARUM NICHT inert AUF DEM HINTERGRUND, wie bei der Grossansicht
   der Galerie: Das waere technisch der saubere Modal-Weg, wuerde
   aber heissen, dass man die Seite ohne Entscheidung ueber Cookies
   nicht mehr mit der Tastatur bedienen kann. Das ist eine
   Cookie-Schranke und eine rechtliche Frage, keine technische. Nicht
   ohne Ansage. Siehe docs/rechtstexte-befunde.md.

   Die Hoehen werden gemessen und nicht geraten: Der Cookie-Hinweis
   ist am Telefon ueber 400 px hoch und am Rechner halb so hoch, die
   Leiste unten laesst sich schliessen, und die Kopfzeile waechst mit
   der Schriftgroesse.
   ============================================ */
(function () {
  var OBEN = ['.navbar'];
  var UNTEN = ['#cookieBanner', '.sticky-cta'];

  function hoehe(liste) {
    var h = 0;
    for (var i = 0; i < liste.length; i++) {
      var el = document.querySelector(liste[i]);
      if (!el) continue;
      var s = window.getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      if (s.position !== 'fixed' && s.position !== 'sticky') continue;
      /* KEINE Abfrage auf Deckkraft. Der erste Versuch am 20.11.2026
         sprang bei opacity < 0.05 heraus, und genau das war der
         Zustand, in dem der Beobachter feuerte: Der Cookie-Hinweis
         blendet ueber 0,4 s ein, die Klasse ist sofort da, die
         Deckkraft noch 0. Gemessen wurde dann 0 px, und danach kam
         kein Ereignis mehr. Die Lage im Bild genuegt als Kriterium:
         Vor dem Einblenden steht der Hinweis per translateY(110%)
         unterhalb des Bildrands. */
      var r = el.getBoundingClientRect();
      if (r.height < 1 || r.bottom <= 0 || r.top >= window.innerHeight) continue;
      h = Math.max(h, Math.round(r.height));
    }
    return h;
  }

  var letztO = -1, letztU = -1;
  function setzen() {
    var o = hoehe(OBEN), u = hoehe(UNTEN);
    if (o !== letztO || u !== letztU) {
      letztO = o; letztU = u;
      var w = document.documentElement.style;
      w.setProperty('--fokus-frei-oben', o + 'px');
      w.setProperty('--fokus-frei-unten', u + 'px');
    }
    leisteSperren();
  }

  /* Die feste Leiste unten liegt auf z-index 200, der Cookie-Hinweis auf
     9999. Solange der Hinweis offen ist, ist die Leiste vollstaendig
     dahinter und trotzdem mit der Tastatur erreichbar: "Kostenlos
     anfragen", "WhatsApp" und "Banner schliessen" bekommen den Fokus,
     ohne dass man sie sieht (WCAG 2.2, 2.4.11; gemessen am 20.11.2026).
     Scrollen hilft hier nicht, beide Leisten sind fest. inert nimmt die
     untere aus dem Tab-Weg, solange sie unsichtbar ist, und gibt sie
     danach wieder frei.

     Das betrifft NUR Elemente, die hinter einer undurchsichtigen Leiste
     liegen. Der Inhalt der Seite bleibt mit der Tastatur bedienbar; eine
     Cookie-Schranke waere eine rechtliche Frage und wird hier nicht
     gebaut. */
  function leisteSperren() {
    var hinweis = document.querySelector('#cookieBanner');
    var leiste = document.querySelector('.sticky-cta');
    if (!leiste) return;
    var offen = false;
    if (hinweis) {
      var s = window.getComputedStyle(hinweis);
      var r = hinweis.getBoundingClientRect();
      offen = s.display !== 'none' && s.visibility !== 'hidden'
        && r.height > 1 && r.top < window.innerHeight && r.bottom > 0;
    }
    if (offen) leiste.setAttribute('inert', '');
    else leiste.removeAttribute('inert');
  }

  /* Mehrfach nachmessen statt einmal. GRUND, gemessen am 20.11.2026:
     Der Cookie-Hinweis wird in einem Schritt auf display:flex gesetzt
     und bekommt die Klasse cb-visible. Beide Mutationen laufen in
     derselben Aufgabe, der Beobachter feuert danach gesammelt, und zu
     dem Zeitpunkt steht der Hinweis per translateY(110%) noch
     unterhalb des Bildrands. Gemessen wurden dann 0 px. Ein einzelnes
     transitionend reicht auch nicht: Bei prefers-reduced-motion
     dauert die Einblendung 0,001 ms. Deshalb ein kurzer Nachschlag. */
  function spaeter() {
    setzen();
    [60, 150, 500, 1000].forEach(function (ms) { window.setTimeout(setzen, ms); });
  }

  spaeter();
  window.addEventListener('resize', setzen, { passive: true });
  window.addEventListener('scroll', setzen, { passive: true });
  window.addEventListener('load', setzen);
  document.addEventListener('focusin', setzen, { passive: true });
  /* FREIRUECKEN (26.11.2026). scroll-padding allein reicht nicht: Der
     Browser scrollt beim Fokuswechsel nur, wenn das Element AUSSERHALB
     des Fensters liegt. Liegt es in den untersten 70 px, also unter der
     festen Anfrageleiste, gilt es fuer ihn als sichtbar, und es bleibt
     verdeckt (WCAG 2.2, 2.4.11). Gemessen auf /produkte/carport.html bei
     1440 x 900: Verweis bei 878 bis 900 px, Leiste ab 830 px.
     Deshalb hier nachruecken, aber nur bei Tastaturfokus (:focus-visible),
     damit ein Mausklick die Seite nicht springen laesst, und nicht fuer
     Elemente IN einer festen Leiste, die liegen ja richtig.
     Laeuft nach setzen() (frueher angemeldet), also mit frischen Hoehen. */
  function freiRuecken(el) {
    if (!el || el === document.body || !el.getBoundingClientRect) return;
    try { if (!el.matches(':focus-visible')) return; } catch (x) { /* alter Browser */ }
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var pos = window.getComputedStyle(n).position;
      if (pos === 'fixed' || pos === 'sticky') return;
    }
    /* Die Anfrageleiste erscheint erst, WEIL der Fokus die Seite
       scrollt; im Augenblick von focusin steht sie noch auf display:none
       (gemessen). Ein Scroll-Ereignis laesst updateSticky() und setzen()
       jetzt schon nachziehen, beide hoeren darauf. */
    window.dispatchEvent(new Event('scroll'));
    var leiste = document.querySelector('.sticky-cta');
    var unten = letztU;
    if (leiste && window.getComputedStyle(leiste).display !== 'none') unten = Math.max(unten, leiste.offsetHeight);
    var r = el.getBoundingClientRect();
    var zuTief = r.bottom - (window.innerHeight - unten);
    var zuHoch = letztO - r.top;
    /* Selbst scrollen statt scrollIntoView: Dessen Rand ist
       scroll-padding, und das steht in diesem Augenblick noch auf 0.
       'instant', weil ein weicher Bildlauf vom Fokuswechsel des Browsers
       abgebrochen wird (gemessen). 8 px Luft fuer den Fokusrahmen. */
    if (zuTief > 0 && r.height < window.innerHeight - unten - letztO) {
      window.scrollBy({ top: zuTief + 8, left: 0, behavior: 'instant' });
    } else if (zuHoch > 0) {
      window.scrollBy({ top: -(zuHoch + 8), left: 0, behavior: 'instant' });
    }
  }
  document.addEventListener('focusin', function (ev) {
    var el = ev.target;
    freiRuecken(el);
    /* Zweiter Blick. Gemessen: Im Moment des Fokuswechsels ist die
       Anfrageleiste oft noch gar nicht da (letztU = 0); sie erscheint erst,
       weil der Fokus die Seite scrollt, und schiebt sich dann ueber das
       Element. 350 ms reichen fuer ihre Einblendung. */
    window.setTimeout(function () {
      if (document.activeElement !== el) return;
      setzen();
      freiRuecken(el);
    }, 350);
  });
  /* Nach dem Einblenden noch einmal: Erst dann steht der Hinweis an
     seinem Platz. */
  document.addEventListener('transitionend', function (e) {
    if (e.target && e.target.id === 'cookieBanner') setzen();
  }, { passive: true });

  /* Der Cookie-Hinweis erscheint und verschwindet ueber eine Klasse
     und display, die Leiste unten kann geschlossen werden. Beides
     beobachten statt zu pollen. */
  try {
    var beobachter = new MutationObserver(spaeter);
    for (var i = 0; i < UNTEN.length; i++) {
      var el = document.querySelector(UNTEN[i]);
      if (el) beobachter.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    if (window.ResizeObserver) {
      var gr = new ResizeObserver(setzen);
      for (var j = 0; j < UNTEN.concat(OBEN).length; j++) {
        var e2 = document.querySelector(UNTEN.concat(OBEN)[j]);
        if (e2) gr.observe(e2);
      }
    }
  } catch (e) { /* Dann bleibt es bei den Ereignissen oben. */ }
})();
