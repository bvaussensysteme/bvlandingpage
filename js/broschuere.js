/* ============================================================
   BV AussenSysteme - Broschuere durchblaettern (/broschuere.html)

   Blaettert die 36 Seiten der Produktbroschuere. Die Bibliothek
   (page-flip, MIT) liegt lokal unter /assets/js/ - kein Fremdanbieter,
   kein CDN, damit beim Aufruf der Seite keine Daten nach aussen gehen.

   Bilder werden nachgeladen: beim Start nur Titel und zweite Seite,
   danach immer das Umfeld der aktuellen Seite. Darum stehen die
   Adressen in data-src und nicht in src.
   ============================================================ */
(function () {
  'use strict';

  var ANZAHL = 36;

  var behaelter = document.getElementById('broBuch');
  if (!behaelter) return;

  var seiten   = [].slice.call(behaelter.querySelectorAll('.bro-seite'));
  var bilder   = seiten.map(function (s) { return s.querySelector('.bro-bild'); });
  var zaehler  = document.getElementById('broZaehler');
  var knopfZur = document.getElementById('broZurueck');
  var knopfWei = document.getElementById('broWeiter');
  var knopfVoll= document.getElementById('broVollbild');
  var knopfUeb = document.getElementById('broUebersicht');
  var knopfZoom= document.getElementById('broZoom');
  var buehne   = document.getElementById('broBuehne');
  var hinweis  = document.getElementById('broHinweis');

  var wenigBewegung = false;
  try {
    wenigBewegung = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  /* ---- Bilder nachladen ------------------------------------ */
  function bildLaden(nr) {               // nr ist 1-basiert
    var img = bilder[nr - 1];
    if (!img) return;
    var quelle = img.getAttribute('data-src');
    if (quelle && !img.getAttribute('src')) img.setAttribute('src', quelle);
  }
  function umfeldLaden(nr) {
    for (var i = nr - 2; i <= nr + 3; i++) {
      if (i >= 1 && i <= ANZAHL) bildLaden(i);
    }
  }

  /* ---- Notfall ohne Bibliothek ------------------------------
     Wenn page-flip nicht geladen werden konnte (Skript blockiert,
     Datei fehlt), bleibt die Seite benutzbar: alle Seiten als Liste,
     die Blaetter-Knoepfe verschwinden. Der PDF-Knopf bleibt. */
  function notfallListe() {
    behaelter.classList.add('bro-buch--liste');
    for (var i = 1; i <= ANZAHL; i++) bildLaden(i);
    [knopfZur, knopfWei, knopfVoll, knopfUeb, knopfZoom].forEach(function (k) {
      if (k) k.hidden = true;
    });
    if (zaehler) zaehler.textContent = ANZAHL + ' Seiten';
    if (hinweis) hinweis.textContent = 'Alle Seiten untereinander - zum Blättern bitte die Seite neu laden.';
  }

  if (!window.St || !window.St.PageFlip) { notfallListe(); return; }

  var buch;
  try {
    buch = new window.St.PageFlip(behaelter, {
      width: 495,
      height: 700,                 /* DIN A4 Hochformat: 1 : 1,414 */
      size: 'stretch',
      /* minWidth entscheidet, WANN auf eine Seite umgeschaltet wird:
         die Bibliothek nimmt Hochformat, sobald weniger als 2 x minWidth
         Platz ist. 330 setzt diesen Punkt auf dieselbe Breite, an der
         auch das Aussehen umschaltet (Medienabfrage 700 px) - sonst
         staenden kurzzeitig zwei winzige Seiten nebeneinander. */
      minWidth: 330,
      maxWidth: 700,
      minHeight: 339,
      maxHeight: 990,
      showCover: true,             /* Titel und Rueckseite einzeln */
      usePortrait: true,           /* Handy im Hochformat: eine Seite */
      mobileScrollSupport: true,
      /* Das Umblaettern soll nach Papier aussehen: kraeftiger Schatten
         in der Falte, eine Ecke, die sich schon beim Annaehern hebt,
         und ein Tippen auf die rechte oder linke Haelfte blaettert. */
      maxShadowOpacity: 0.8,
      showPageCorners: true,
      disableFlipByClick: false,
      drawShadow: !wenigBewegung,
      flippingTime: wenigBewegung ? 1 : 800,
      swipeDistance: 15
    });
    buch.loadFromHTML(seiten);
  } catch (e) {
    notfallListe();
    return;
  }

  /* ---- Anzeige gleichziehen -------------------------------- */
  function einzelseite() {
    try { return buch.getOrientation() === 'portrait'; } catch (e) { return true; }
  }
  function aktuelleNummer() {
    var i = 0;
    try { i = buch.getCurrentPageIndex(); } catch (e) {}
    return Math.min(ANZAHL, Math.max(1, i + 1));
  }
  function aktualisieren() {
    var nr = aktuelleNummer();
    umfeldLaden(nr);
    if (zaehler) {
      if (!einzelseite() && nr > 1 && nr < ANZAHL) {
        zaehler.textContent = nr + '–' + (nr + 1) + ' / ' + ANZAHL;
      } else {
        zaehler.textContent = nr + ' / ' + ANZAHL;
      }
    }
    if (knopfZur) knopfZur.disabled = (nr <= 1);
    if (knopfWei) knopfWei.disabled = (nr >= ANZAHL) ||
      (!einzelseite() && nr + 1 >= ANZAHL);
  }

  buch.on('flip', aktualisieren);
  buch.on('changeOrientation', function () { setTimeout(aktualisieren, 30); });
  aktualisieren();

  if (knopfZur) knopfZur.addEventListener('click', function () { buch.flipPrev(); });
  if (knopfWei) knopfWei.addEventListener('click', function () { buch.flipNext(); });

  /* ---- Tastatur -------------------------------------------- */
  function ebeneOffen() {
    return !!document.querySelector('.bro-ebene[data-offen="1"]');
  }
  document.addEventListener('keydown', function (ev) {
    var z = ev.target;
    if (z && (z.tagName === 'INPUT' || z.tagName === 'TEXTAREA' || z.tagName === 'SELECT')) return;
    if (ev.key === 'Escape') { ebeneSchliessen(); return; }
    if (ebeneOffen()) return;
    if (ev.key === 'ArrowRight') { buch.flipNext(); ev.preventDefault(); }
    if (ev.key === 'ArrowLeft')  { buch.flipPrev(); ev.preventDefault(); }
  });

  /* ---- Vollbild --------------------------------------------
     iOS Safari kann kein Vollbild fuer beliebige Elemente. Dann
     wird der Knopf ausgeblendet statt ins Leere zu fuehren. */
  function vollbildMoeglich(el) {
    return !!(el && (el.requestFullscreen || el.webkitRequestFullscreen));
  }
  if (!vollbildMoeglich(buehne)) {
    if (knopfVoll) knopfVoll.hidden = true;
  } else if (knopfVoll) {
    knopfVoll.addEventListener('click', function () {
      var drin = document.fullscreenElement || document.webkitFullscreenElement;
      if (drin) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        (buehne.requestFullscreen || buehne.webkitRequestFullscreen).call(buehne);
      }
    });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (n) {
      document.addEventListener(n, function () {
        setTimeout(function () { try { buch.update(); } catch (e) {} aktualisieren(); }, 80);
      });
    });
  }

  /* ---- Ebenen (Uebersicht, Zoom) --------------------------- */
  var letzterKnopf = null;

  /* IM VOLLBILD zeigt der Browser NUR den Teilbaum des Vollbild-
     Elements. Eine Ebene, die am Ende des Dokuments haengt, waere dort
     unsichtbar - der Knopf taete scheinbar nichts. Darum wandert sie
     fuer die Dauer des Vollbilds in das Vollbild-Element und danach
     zurueck. */
  function ebeneOeffnen(id, ausloeser) {
    var el = document.getElementById(id);
    if (!el) return;
    letzterKnopf = ausloeser || null;
    var voll = document.fullscreenElement || document.webkitFullscreenElement;
    if (voll && !voll.contains(el)) voll.appendChild(el);
    el.hidden = false;
    el.setAttribute('data-offen', '1');
    var zu = el.querySelector('[data-bro-schliessen]');
    if (zu) zu.focus();
  }
  function ebeneSchliessen() {
    var offen = document.querySelectorAll('.bro-ebene[data-offen="1"]');
    if (!offen.length) return;
    [].slice.call(offen).forEach(function (el) {
      el.removeAttribute('data-offen');
      el.hidden = true;
      if (el.parentNode !== document.body) document.body.appendChild(el);
    });
    if (letzterKnopf) { letzterKnopf.focus(); letzterKnopf = null; }
  }
  document.querySelectorAll('[data-bro-schliessen]').forEach(function (k) {
    k.addEventListener('click', ebeneSchliessen);
  });

  /* Seitenuebersicht: Raster aus den kleinen Vorschaubildern */
  var raster = document.getElementById('broRaster');
  var rasterGebaut = false;
  function rasterBauen() {
    if (rasterGebaut || !raster) return;
    for (var i = 1; i <= ANZAHL; i++) {
      var nn = (i < 10 ? '0' : '') + i;
      var k = document.createElement('button');
      k.type = 'button';
      k.className = 'bro-raster-knopf';
      k.setAttribute('data-ziel', String(i));
      k.innerHTML = '<img src="/assets/broschuere/vorschau/seite-' + nn +
        '.webp" width="300" height="421" loading="lazy" alt="" />' +
        '<span>Seite ' + i + '</span>';
      k.setAttribute('aria-label', 'Zu Seite ' + i + ' springen');
      k.addEventListener('click', function () {
        var ziel = parseInt(this.getAttribute('data-ziel'), 10);
        ebeneSchliessen();
        umfeldLaden(ziel);
        try { buch.turnToPage(ziel - 1); } catch (e) {}
        setTimeout(aktualisieren, 60);
      });
      raster.appendChild(k);
    }
    rasterGebaut = true;
  }
  if (knopfUeb) knopfUeb.addEventListener('click', function () {
    rasterBauen();
    ebeneOeffnen('broUebersichtEbene', knopfUeb);
  });

  /* Zoom: die gerade sichtbaren Seiten gross und scrollbar.
     Bewusst eine eigene Ebene und kein transform auf dem Buch -
     eine Skalierung verschiebt die Zeigerkoordinaten und das
     Ziehen an der Seitenecke trifft dann daneben. */
  var STUFEN = [1, 1.5, 2];
  var stufe = 0;
  var zoomFlaeche = document.getElementById('broZoomFlaeche');
  var zoomStufeTxt = document.getElementById('broZoomStufe');

  function zoomBasis() {
    return Math.max(280, Math.min(760, (window.innerWidth || 800) - 80));
  }
  function zoomZeichnen() {
    if (!zoomFlaeche) return;
    var breite = Math.round(zoomBasis() * STUFEN[stufe]);
    [].slice.call(zoomFlaeche.querySelectorAll('img')).forEach(function (img) {
      img.style.width = breite + 'px';
    });
    if (zoomStufeTxt) zoomStufeTxt.textContent = Math.round(STUFEN[stufe] * 100) + ' %';
  }
  function zoomFuellen() {
    if (!zoomFlaeche) return;
    zoomFlaeche.innerHTML = '';
    var nr = aktuelleNummer();
    var liste = [nr];
    if (!einzelseite() && nr > 1 && nr < ANZAHL) liste.push(nr + 1);
    liste.forEach(function (i) {
      var nn = (i < 10 ? '0' : '') + i;
      var img = document.createElement('img');
      img.src = '/assets/broschuere/seite-' + nn + '.webp';
      img.alt = 'Broschüre, Seite ' + i + ' von ' + ANZAHL + ', vergrößert';
      zoomFlaeche.appendChild(img);
    });
    zoomZeichnen();
  }
  if (knopfZoom) knopfZoom.addEventListener('click', function () {
    stufe = 1;
    zoomFuellen();
    ebeneOeffnen('broZoomEbene', knopfZoom);
  });
  var zoomPlus  = document.getElementById('broZoomGroesser');
  var zoomMinus = document.getElementById('broZoomKleiner');
  if (zoomPlus)  zoomPlus.addEventListener('click',  function () {
    if (stufe < STUFEN.length - 1) { stufe++; zoomZeichnen(); }
  });
  if (zoomMinus) zoomMinus.addEventListener('click', function () {
    if (stufe > 0) { stufe--; zoomZeichnen(); }
  });

  /* Groessenaenderung: Buch neu rechnen lassen */
  var warte = null;
  window.addEventListener('resize', function () {
    clearTimeout(warte);
    warte = setTimeout(function () {
      try { buch.update(); } catch (e) {}
      aktualisieren();
    }, 150);
  });
})();
