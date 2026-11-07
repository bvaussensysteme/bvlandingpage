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
  /* Kleinste Seitenbreite, mit der die Bibliothek rechnet. Sie taucht
     zweimal auf: als minWidth in den Einstellungen (dort entscheidet
     sie zusaetzlich, ab wann auf EINE Seite umgeschaltet wird - naemlich
     unter 2 x diesem Wert) und als Untergrenze fuer den Rahmen. Beide
     muessen denselben Wert benutzen, sonst macht die Bibliothek das
     Buch breiter als seinen Rahmen und es wird am Rand abgeschnitten.
     Gemessen am 06.11.2026 am Handy im Querformat (844 x 390): Rahmen
     226 px, Buch 330 px - 52 px standen links und rechts ueber. */
  var MIN_SEITE = 300;

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
  var knopfMehr= document.getElementById('broMehr');
  var mehrMenue= document.getElementById('broMehrMenue');
  var ende     = document.getElementById('broEnde');
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
    /* knopfMehr bleibt sichtbar: darin steckt der Weg zum PDF. */
    [knopfZur, knopfWei, knopfVoll, knopfUeb, knopfZoom].forEach(function (k) {
      if (k) k.hidden = true;
    });
    if (ende) ende.hidden = false;   /* Liste: der Weg weiter steht am Schluss */
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
      /* siehe MIN_SEITE oben */
      minWidth: MIN_SEITE,
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

  /* ---- Breite des Rahmens ------------------------------------
     Die Bibliothek rechnet die HOEHE des Buches aus seiner BREITE.
     Wer will, dass eine Seite in den Bildschirm passt, muss also die
     Breite begrenzen. Das stand vorher in Medienabfragen - das ging
     schief, weil die Umschaltung auf eine Seite bei der Bibliothek an
     einer anderen Zahl haengt als der Haltepunkt im Stilblatt. Jetzt
     rechnet dieselbe Regel beides:

     - Grundlage ist der PLATZ IM CONTAINER, nicht die Breite des
       Rahmens selbst. Sonst beeinflusst das Ergebnis seine eigene
       Eingabe und die Anzeige kann hin- und herspringen.
     - Untergrenze ist MIN_SEITE (bzw. das Doppelte bei zwei Seiten),
       damit das Buch nie breiter wird als sein Rahmen. */
  /* HOEHE STABIL MESSEN. window.innerHeight ist auf dem Telefon die
     GERADE sichtbare Hoehe - sie waechst, sobald die Adresszeile beim
     Scrollen einklappt. Danach waere das Buch ploetzlich groesser und
     die Seite ruckt. Gefragt ist die KLEINSTE Hoehe (100svh); die
     bleibt gleich. Gemessen wird sie mit einem unsichtbaren Streifen,
     weil es dafuer keine Javascript-Angabe gibt. */
  var hoehenMesser = null;
  function sichtbareHoehe() {
    if (!hoehenMesser) {
      hoehenMesser = document.createElement('div');
      hoehenMesser.setAttribute('aria-hidden', 'true');
      hoehenMesser.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;' +
        'pointer-events:none;visibility:hidden';
      document.body.appendChild(hoehenMesser);
    }
    var h = hoehenMesser.offsetHeight;
    return h > 200 ? h : (window.innerHeight || 800);
  }

  function rahmenBreite() {
    var rahmen = behaelter.parentElement;
    if (!rahmen || !rahmen.classList.contains('bro-rahmen')) return;
    var platz = rahmen.parentElement ? rahmen.parentElement.clientWidth : 0;
    if (!platz) return;
    var hoch = platz < 2 * MIN_SEITE;
    var hoehe = sichtbareHoehe();
    /* Abzug: Navigationsleiste, Seitenkopf, Hinweis und Bedienleiste.
       Am Telefon ist mehr davon zu sehen als am Schreibtisch. */
    var frei = hoch ? (hoehe - 190) / 1.4142 : (hoehe - 230) * 1.4142;
    var breite = Math.max(hoch ? MIN_SEITE : 2 * MIN_SEITE, frei);
    breite = Math.min(1000, breite, platz);
    rahmen.style.maxWidth = Math.round(breite) + 'px';
  }
  rahmenBreite();

  /* ---- Anzeige gleichziehen -------------------------------- */
  function einzelseite() {
    try { return buch.getOrientation() === 'portrait'; } catch (e) { return true; }
  }
  function aktuelleNummer() {
    var i = 0;
    try { i = buch.getCurrentPageIndex(); } catch (e) {}
    return Math.min(ANZAHL, Math.max(1, i + 1));
  }
  function abschalten(knopf, aus, ersatz) {
    if (!knopf) return;
    if (aus && document.activeElement === knopf && ersatz && !ersatz.disabled) ersatz.focus();
    knopf.disabled = !!aus;
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
    /* Einen Knopf abzuschalten, WAEHREND er den Fokus hat, wirft die
       Tastaturbedienung an den Seitenanfang zurueck. Darum wandert der
       Fokus in dem Fall zum Gegenknopf. */
    abschalten(knopfZur, (nr <= 1), knopfWei);
    abschalten(knopfWei, (nr >= ANZAHL) || (!einzelseite() && nr + 1 >= ANZAHL), knopfZur);
    if (zaehler) zaehler.setAttribute('aria-label', 'Seite ' + nr + ' von ' + ANZAHL);
    /* Auf der letzten Seite steht, wie es weitergeht - vorher nicht. */
    if (ende) ende.hidden = !(nr >= ANZAHL || (!einzelseite() && nr + 1 >= ANZAHL));
  }

  /* DIE ADRESSE TRAEGT DIE SEITENZAHL. Wer "Diesen Katalog teilen"
     antippt, teilt damit die Seite, auf der er gerade steht - der
     Empfaenger landet nicht auf dem Titel, sondern dort. Mit
     replaceState, nicht pushState: sonst wuerde die Zurueck-Taste des
     Browsers zum Rueckwaertsblaettern und man kaeme nie von der Seite
     herunter. */
  var hashEigen = false;
  function adresseSchreiben(nr) {
    if (!window.history || !window.history.replaceState) return;
    var ziel = nr > 1
      ? window.location.pathname + window.location.search + '#seite-' + nr
      : window.location.pathname + window.location.search;
    try { hashEigen = true; window.history.replaceState(null, '', ziel); } catch (e) {}
  }
  function hashSeite() {
    var m = /^#seite-(\d+)$/.exec(window.location.hash || '');
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return (n >= 1 && n <= ANZAHL) ? n : 0;
  }

  buch.on('flip', function () { aktualisieren(); adresseSchreiben(aktuelleNummer()); });
  /* Beim Aufschlagen: steht eine Seite in der Adresse, dorthin. */
  (function () {
    var start = hashSeite();
    if (start > 1) {
      umfeldLaden(start);
      setTimeout(function () {
        try { buch.turnToPage(start - 1); } catch (e) {}
        setTimeout(aktualisieren, 60);
      }, 120);
    }
  })();
  /* Aendert jemand die Adresse von Hand oder kommt ueber einen Verweis
     zurueck, wird auch das befolgt. */
  window.addEventListener('hashchange', function () {
    if (hashEigen) { hashEigen = false; return; }
    var n = hashSeite();
    if (!n) return;
    umfeldLaden(n);
    try { buch.turnToPage(n - 1); } catch (e) {}
    setTimeout(aktualisieren, 60);
  });

  buch.on('changeOrientation', function () {
    rahmenBreite();
    setTimeout(function () { try { buch.update(); } catch (e) {} aktualisieren(); }, 30);
  });
  aktualisieren();

  var knopfVornZurueck = document.getElementById('broVonVorn');
  if (knopfVornZurueck) knopfVornZurueck.addEventListener('click', function () {
    umfeldLaden(1);
    try { buch.turnToPage(0); } catch (e) {}
    setTimeout(function () { aktualisieren(); adresseSchreiben(1); }, 60);
    if (behaelter.scrollIntoView) behaelter.scrollIntoView({ block: 'center' });
  });
  if (knopfZur) knopfZur.addEventListener('click', function () { buch.flipPrev(); });
  if (knopfWei) knopfWei.addEventListener('click', function () { buch.flipNext(); });

  /* ---- Tastatur -------------------------------------------- */
  function ebeneOffen() {
    return !!document.querySelector('.bro-ebene[data-offen="1"]');
  }
  document.addEventListener('keydown', function (ev) {
    var z = ev.target;
    if (z && (z.tagName === 'INPUT' || z.tagName === 'TEXTAREA' || z.tagName === 'SELECT')) return;
    if (ev.key === 'Escape') { mehrZu(true); ebeneSchliessen(); return; }
    if (ebeneOffen() || (mehrMenue && !mehrMenue.hidden)) return;
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
  /* aria-modal="true" verspricht, dass der Rest der Seite ruht.
     Gemessen am 06.11.2026: Mit offener Zoom-Ebene wanderte der Fokus
     nach fuenf Mal Tab auf die Fusszeilen-Knoepfe DAHINTER - sichtbar
     war er dort nicht. Also: Fokus einfangen und den Hintergrund nicht
     mitscrollen lassen. */
  function fangbar(el) {
    return [].slice.call(el.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(function (e) {
      var r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  }
  function ebeneOeffnen(id, ausloeser) {
    var el = document.getElementById(id);
    if (!el) return;
    letzterKnopf = ausloeser || null;
    var voll = document.fullscreenElement || document.webkitFullscreenElement;
    if (voll && !voll.contains(el)) voll.appendChild(el);
    el.hidden = false;
    el.setAttribute('data-offen', '1');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('bro-ebene-offen');
    var zu = el.querySelector('[data-bro-schliessen]');
    if (zu) zu.focus();
  }
  /* Tab im Kreis innerhalb der offenen Ebene */
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Tab') return;
    var el = document.querySelector('.bro-ebene[data-offen="1"]');
    if (!el) return;
    var liste = fangbar(el);
    if (!liste.length) return;
    var erster = liste[0], letzter = liste[liste.length - 1];
    if (!el.contains(document.activeElement)) { erster.focus(); ev.preventDefault(); return; }
    if (ev.shiftKey && document.activeElement === erster) { letzter.focus(); ev.preventDefault(); }
    else if (!ev.shiftKey && document.activeElement === letzter) { erster.focus(); ev.preventDefault(); }
  });
  function ebeneSchliessen() {
    var offen = document.querySelectorAll('.bro-ebene[data-offen="1"]');
    if (!offen.length) return;
    [].slice.call(offen).forEach(function (el) {
      el.removeAttribute('data-offen');
      el.hidden = true;
      if (el.parentNode !== document.body) document.body.appendChild(el);
    });
    document.body.style.overflow = '';
    document.body.classList.remove('bro-ebene-offen');
    if (letzterKnopf) { letzterKnopf.focus(); letzterKnopf = null; }
  }
  document.querySelectorAll('[data-bro-schliessen]').forEach(function (k) {
    k.addEventListener('click', ebeneSchliessen);
  });
  /* Klick auf die dunkle Flaeche neben dem Inhalt schliesst ebenfalls -
     das erwartet jeder, der so eine Ebene schon einmal gesehen hat. */
  document.querySelectorAll('.bro-ebene').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      if (ev.target === el) ebeneSchliessen();
    });
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
  /* Beim Oeffnen zeigen, wo man gerade ist, und dorthin scrollen -
     sonst sucht man in 36 gleich grossen Kacheln. */
  function rasterMarkieren() {
    if (!raster) return;
    var nr = aktuelleNummer();
    var jetzt = null;
    [].slice.call(raster.querySelectorAll('.bro-raster-knopf')).forEach(function (k) {
      var ist = parseInt(k.getAttribute('data-ziel'), 10) === nr;
      if (ist) { k.setAttribute('aria-current', 'true'); jetzt = k; }
      else k.removeAttribute('aria-current');
    });
    if (jetzt && jetzt.scrollIntoView) {
      try { jetzt.scrollIntoView({ block: 'center' }); } catch (e) { jetzt.scrollIntoView(); }
    }
  }
  if (knopfUeb) knopfUeb.addEventListener('click', function () {
    rasterBauen();
    ebeneOeffnen('broUebersichtEbene', knopfUeb);
    rasterMarkieren();
  });

  /* Zoom: die gerade sichtbaren Seiten gross und scrollbar.
     Bewusst eine eigene Ebene und kein transform auf dem Buch -
     eine Skalierung verschiebt die Zeigerkoordinaten und das
     Ziehen an der Seitenecke trifft dann daneben. */
  /* 100 % heisst: so breit wie der Bildschirm. Die Bilder sind
     1400 px breit, mehr als 4-fach bringt also nichts mehr.
     VORHER WAR DER ZOOM WIRKUNGSLOS: style.css setzt global
     img { max-width: 100% } - damit konnte das Bild nie breiter
     werden als sein Kasten. Gemessen am Handy: 150 % und 200 %
     ergaben beide 362 px. Die Gegenregel steht jetzt im Stilblock. */
  var STUFEN = [1, 1.5, 2.5, 4];
  var stufe = 0;
  var zoomFlaeche = document.getElementById('broZoomFlaeche');
  var zoomStufeTxt = document.getElementById('broZoomStufe');
  var zoomPlus = document.getElementById('broZoomGroesser');
  var zoomMinus = document.getElementById('broZoomKleiner');

  function zoomBasis() {
    return Math.max(280, (window.innerWidth || 800) - 24);
  }
  function zoomZeichnen() {
    if (!zoomFlaeche) return;
    /* Mehr als das Doppelte der echten Bildbreite bringt nichts mehr -
       die Dateien sind 1400 px breit, darueber wird es nur weich. */
    var breite = Math.min(2800, Math.round(zoomBasis() * STUFEN[stufe]));
    [].slice.call(zoomFlaeche.querySelectorAll('img')).forEach(function (img) {
      img.style.width = breite + 'px';
    });
    if (zoomStufeTxt) zoomStufeTxt.textContent = Math.round(STUFEN[stufe] * 100) + ' %';
    if (zoomMinus) zoomMinus.disabled = (stufe === 0);
    if (zoomPlus) zoomPlus.disabled = (stufe === STUFEN.length - 1);
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
      img.alt = 'Katalog, Seite ' + i + ' von ' + ANZAHL + ', vergrößert';
      zoomFlaeche.appendChild(img);
    });
    zoomZeichnen();
  }
  if (knopfZoom) knopfZoom.addEventListener('click', function () {
    stufe = 1;
    zoomFuellen();
    ebeneOeffnen('broZoomEbene', knopfZoom);
  });
  if (zoomPlus)  zoomPlus.addEventListener('click',  function () {
    if (stufe < STUFEN.length - 1) { stufe++; zoomZeichnen(); }
  });
  if (zoomMinus) zoomMinus.addEventListener('click', function () {
    if (stufe > 0) { stufe--; zoomZeichnen(); }
  });

  /* ---- Drei-Punkte-Menue: PDF und Teilen ---------------------
     Der PDF-Knopf stand vorher breit und golden in der Leiste. Jetzt
     ein Knopf in derselben Form wie die anderen; was er oeffnet, ist
     ein kleines Menue mit zwei Eintraegen. */
  var teilenStatus = document.getElementById('broTeilenStatus');

  function mehrZu(fokusZurueck) {
    if (!mehrMenue || mehrMenue.hidden) return;
    var drin = mehrMenue.contains(document.activeElement);
    mehrMenue.hidden = true;
    if (knopfMehr) {
      knopfMehr.setAttribute('aria-expanded', 'false');
      /* Wer mit der Tastatur im Menue war, darf den Fokus nicht
         verlieren - sonst beginnt das Tabben wieder von vorn. */
      if ((fokusZurueck || drin) && knopfMehr.focus) knopfMehr.focus();
    }
    if (teilenStatus) teilenStatus.textContent = '';
  }
  function mehrAuf() {
    if (!mehrMenue) return;
    mehrMenue.hidden = false;
    if (knopfMehr) knopfMehr.setAttribute('aria-expanded', 'true');
    var erster = mehrMenue.querySelector('.bro-mehr-eintrag');
    if (erster) erster.focus();
  }
  if (knopfMehr && mehrMenue) {
    knopfMehr.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (mehrMenue.hidden) { mehrAuf(); } else { mehrZu(); }
    });
    /* Ein Klick irgendwo sonst schliesst das Menue. */
    document.addEventListener('click', function (ev) {
      if (mehrMenue.hidden) return;
      if (mehrMenue.contains(ev.target) || knopfMehr.contains(ev.target)) return;
      mehrZu(false);
    });
    /* Ebenso, wer mit Tab hinausgeht. */
    document.addEventListener('focusin', function (ev) {
      if (mehrMenue.hidden) return;
      if (mehrMenue.contains(ev.target) || knopfMehr.contains(ev.target)) return;
      mehrZu(false);
    });
  }
  var menuePdf = document.getElementById('broMenuePdf');
  if (menuePdf) menuePdf.addEventListener('click', function () { setTimeout(function () { mehrZu(true); }, 50); });

  var knopfTeilen = document.getElementById('broTeilen');
  function kopierHinweis() {
    if (!teilenStatus) return;
    teilenStatus.textContent = 'Link kopiert';
    setTimeout(function () { if (teilenStatus) teilenStatus.textContent = ''; }, 4000);
  }
  function adresseKopieren() {
    var adresse = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(adresse).then(kopierHinweis, altKopieren);
    } else {
      altKopieren();
    }
    function altKopieren() {
      try {
        var feld = document.createElement('input');
        feld.value = adresse;
        feld.setAttribute('readonly', 'readonly');
        feld.style.position = 'fixed';
        feld.style.opacity = '0';
        document.body.appendChild(feld);
        feld.select();
        document.execCommand('copy');
        document.body.removeChild(feld);
        kopierHinweis();
      } catch (e) {
        if (teilenStatus) teilenStatus.textContent = adresse;
      }
    }
  }
  if (knopfTeilen) knopfTeilen.addEventListener('click', function () {
    /* Geteilt wird der KATALOG, also diese Seite - nicht die
       PDF-Datei: Wer den Link antippt, landet im Katalog und kann
       blaettern; das PDF findet er dort auch.
       Ohne Teilen-Dialog (die meisten Schreibtisch-Browser) wandert
       die Adresse in die Zwischenablage. */
    var daten = {
      title: 'Produktkatalog von BV AussenSysteme',
      text: 'Unseren Katalog zum Durchblättern ansehen',
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(daten).then(function () { mehrZu(true); }, function () {});
      return;
    }
    adresseKopieren();
  });

  /* Groessenaenderung: Buch neu rechnen lassen */
  var warte = null;
  var letzteBreite = window.innerWidth;
  var letzteHoehe = window.innerHeight;
  window.addEventListener('resize', function () {
    /* Auf dem Telefon meldet der Browser eine Groessenaenderung, sobald
       die Adresszeile ein- oder ausklappt. Die Breite bleibt dabei
       gleich. Wuerde das Buch dann neu gerechnet, zappelte es beim
       Scrollen. Darum: nur bei echter Aenderung. */
    var breiteGleich = (window.innerWidth === letzteBreite);
    var kleineHoehe = Math.abs(window.innerHeight - letzteHoehe) < 120;
    letzteBreite = window.innerWidth;
    letzteHoehe = window.innerHeight;
    if (breiteGleich && kleineHoehe) return;
    clearTimeout(warte);
    warte = setTimeout(function () {
      rahmenBreite();
      try { buch.update(); } catch (e) {}
      aktualisieren();
    }, 150);
  });
})();
