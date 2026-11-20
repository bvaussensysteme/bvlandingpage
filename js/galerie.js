/* ============================================================
   AUSFUEHRUNGSBEISPIELE: Grossansicht

   Der Bilderstreifen steht fest in der Seite (siehe
   src/_includes/galerie.njk). Dieses Skript ergaenzt nur die
   Grossansicht. Faellt es aus, bleibt der Streifen bedienbar - er
   laesst sich waagerecht wischen, und jedes Bild ist zu sehen.

   WCAG 2.2, was hier dranhaengt:
   - 2.1.2 Keine Tastaturfalle: Tab laeuft im Fenster im Kreis.
   - 2.4.3 Fokus-Reihenfolge: Beim Oeffnen geht der Fokus ins
     Fenster, beim Schliessen zurueck auf die Kachel, von der aus
     geoeffnet wurde.
   - 1.4.13: Escape schliesst.
   - 2.5.8: Alle Schaltflaechen mindestens 44 x 44 px.
   - prefers-reduced-motion: ohne Einblenden.
   ============================================================ */
(function () {
  'use strict';
  var streifen = document.querySelectorAll('.galerie-streifen[data-galerie]');
  var karten = document.querySelectorAll('.produkt-card-img');
  if (!streifen.length && !karten.length) return;

  var fenster = null, bildEl = null, textEl = null, zaehlerEl = null;
  var aktuelleListe = [], aktuellerIndex = 0, rueckkehr = null;

  function bauen() {
    if (fenster) return;
    fenster = document.createElement('div');
    fenster.className = 'galerie-gross';
    fenster.hidden = true;
    fenster.setAttribute('role', 'dialog');
    fenster.setAttribute('aria-modal', 'true');
    fenster.setAttribute('aria-label', 'Große Ansicht');
    fenster.innerHTML =
      '<div class="gg-huelle">' +
        '<button type="button" class="gg-knopf gg-zu" aria-label="Große Ansicht schließen">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<button type="button" class="gg-knopf gg-zurueck" aria-label="Vorheriges Bild">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
        '</button>' +
        '<figure class="gg-figur">' +
          '<img class="gg-bild" alt="">' +
          /* aria-live: Beim Blaettern bleibt der Fokus auf dem Pfeil,
             nur Bild und Text wechseln. Ohne Live-Bereich erfaehrt ein
             Screenreader davon nichts (WCAG 2.2, 4.1.3). */
          '<figcaption class="gg-text" aria-live="polite" aria-atomic="true">' +
          '<span class="gg-beschriftung"></span>' +
          '<span class="gg-zaehler"></span></figcaption>' +
        '</figure>' +
        '<button type="button" class="gg-knopf gg-vor" aria-label="Nächstes Bild">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
        '</button>' +
      '</div>';
    document.body.appendChild(fenster);
    bildEl = fenster.querySelector('.gg-bild');
    textEl = fenster.querySelector('.gg-beschriftung');
    zaehlerEl = fenster.querySelector('.gg-zaehler');

    fenster.querySelector('.gg-zu').addEventListener('click', schliessen);
    fenster.querySelector('.gg-zurueck').addEventListener('click', function () { springen(-1); });
    fenster.querySelector('.gg-vor').addEventListener('click', function () { springen(1); });
    /* NUR der dunkle Grund schliesst, NICHT die Huelle. Die Huelle
       liegt auch in den 8 px zwischen "Zurueck" und "Weiter"; ein
       knapp danebengesetzter Daumen schloss damit die Ansicht,
       statt zu blaettern. Befund vom 19.11.2026. */
    fenster.addEventListener('click', function (e) {
      if (e.target === fenster) schliessen();
    });
    /* AM DOKUMENT UND NICHT AM FENSTER. Nach einer Wischgeste liegt
       der Fokus wieder auf <body>; ein Hoerer am Fenster bekommt die
       Taste dann nicht mehr, und Escape schloss nicht mehr. Gemessen
       am 19.11.2026: offen blieb offen. */
    document.addEventListener('keydown', function (e) {
      if (!fenster || fenster.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); schliessen(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); springen(-1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); springen(1); return; }
      if (e.key !== 'Tab') return;
      /* Tastaturschleife: Der Fokus verlaesst das Fenster nicht. */
      var ziele = fenster.querySelectorAll('button:not([disabled])');
      if (!ziele.length) return;
      var erste = ziele[0], letzte = ziele[ziele.length - 1];
      if (e.shiftKey && document.activeElement === erste) { e.preventDefault(); letzte.focus(); }
      else if (!e.shiftKey && document.activeElement === letzte) { e.preventDefault(); erste.focus(); }
    });
  }

  function zeigen(i) {
    aktuellerIndex = (i + aktuelleListe.length) % aktuelleListe.length;
    var b = aktuelleListe[aktuellerIndex];
    bildEl.src = b.src;
    /* alt bleibt leer: Die Bildunterschrift traegt denselben Text,
       sonst liest ein Screenreader ihn zweimal. */
    bildEl.alt = '';
    textEl.textContent = b.alt;
    var mehr = aktuelleListe.length > 1;
    /* Bei einem einzigen Bild kein "(1 von 1)". Das kommt auf den
       Produktseiten vor, die nur ein Modell zeigen. */
    zaehlerEl.textContent = mehr
      ? ' (' + (aktuellerIndex + 1) + ' von ' + aktuelleListe.length + ')' : '';
    fenster.querySelector('.gg-zurueck').hidden = !mehr;
    fenster.querySelector('.gg-vor').hidden = !mehr;
  }

  function springen(d) { zeigen(aktuellerIndex + d); }

  /* Der Rest der Seite wird fuer Hilfsmittel stillgelegt. aria-modal
     allein reicht bei aelteren Screenreadern nicht. */
  function hintergrund(aus) {
    ['main', 'header', 'footer', '.navbar'].forEach(function (w) {
      Array.prototype.forEach.call(document.querySelectorAll(w), function (e) {
        if (aus) e.setAttribute('inert', ''); else e.removeAttribute('inert');
      });
    });
  }

  function oeffnen(liste, i, kachel) {
    bauen();
    aktuelleListe = liste;
    rueckkehr = kachel;
    fenster.hidden = false;
    document.body.classList.add('galerie-offen');
    hintergrund(true);
    zeigen(i);
    fenster.querySelector('.gg-zu').focus();
  }

  function schliessen() {
    if (!fenster || fenster.hidden) return;
    fenster.hidden = true;
    document.body.classList.remove('galerie-offen');
    hintergrund(false);
    bildEl.removeAttribute('src');
    if (rueckkehr) { try { rueckkehr.focus(); } catch (e) {} }
    rueckkehr = null;
  }

  /* WISCHEN IN DER GROSSANSICHT. Am Telefon erwartet man es; ohne
     das muss man den schmalen Pfeil treffen. Nur waagerecht und erst
     ab 45 px, damit ein Antippen nicht versehentlich blaettert. */
  (function () {
    var start = null;
    document.addEventListener('touchstart', function (e) {
      if (!fenster || fenster.hidden || e.touches.length !== 1) return;
      if (!fenster.contains(e.target)) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!start || !fenster || fenster.hidden) { start = null; return; }
      var t = e.changedTouches[0];
      var dx = t.clientX - start.x, dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      springen(dx < 0 ? 1 : -1);
      /* Der Fokus soll im Fenster bleiben, sonst laeuft die naechste
         Tabulatortaste in die stillgelegte Seite dahinter. */
      try { fenster.querySelector('.gg-zu').focus(); } catch (x) {}
    }, { passive: true });
  })();

  /* ---- Zaehler und Pfeile am Streifen ----
     Welche Kachel ist gemeint? Die, die am weitesten links noch ganz
     oder fast ganz zu sehen ist. Gerechnet wird aus der Scrollweite
     und der Kachelbreite, nicht ueber einen Beobachter je Kachel: Das
     kommt mit einer Zahl aus und stimmt auch, wenn jemand mitten in
     der Bewegung stoppt.

     Die Pfeile schieben um eine Kachel weiter, nicht um eine ganze
     Breite: Sonst ueberspringt man bei schmalen Fenstern Bilder. */
  function steuerung(s) {
    var kopf = s.closest('.container');
    if (!kopf) return;
    var zaehler = kopf.querySelector('[data-zaehler]');
    var zurueck = kopf.querySelector('[data-pfeil="zurueck"]');
    var vor = kopf.querySelector('[data-pfeil="vor"]');
    var kacheln = s.querySelectorAll('.galerie-kachel');
    if (!kacheln.length) return;

    function schritt() {
      var a = kacheln[0].getBoundingClientRect();
      var b = kacheln.length > 1 ? kacheln[1].getBoundingClientRect() : null;
      return b ? Math.round(b.left - a.left) : Math.round(a.width + 14);
    }
    function nachziehen() {
      var w = schritt() || 1;
      var nr = Math.min(kacheln.length, Math.max(1, Math.round(s.scrollLeft / w) + 1));
      var ende = s.scrollWidth - s.clientWidth - 2;
      /* Am rechten Anschlag steht die LETZTE Nummer. Sonst meldete der
         Zaehler dort "16 / 18", weil am Schreibtisch drei Kacheln
         nebeneinander passen und die linke davon gezaehlt wird.
         Gemessen am 19.11.2026. */
      if (s.scrollLeft >= ende) nr = kacheln.length;
      if (zaehler) zaehler.textContent = nr + ' / ' + kacheln.length;
      sperren(zurueck, s.scrollLeft <= 2);
      sperren(vor, s.scrollLeft >= ende);
    }
    /* NICHT disabled, sondern aria-disabled. Ein disabled-Knopf verliert
       den Tastaturfokus in dem Moment, in dem er gesperrt wird: Man
       drueckt sich mit der Tastatur durch den Streifen, der Pfeil wird am
       Anschlag hart, und der Fokus landet unvermittelt am Seitenanfang.
       Das ist WCAG 2.2, 2.4.3 Fokus-Reihenfolge. Mit aria-disabled bleibt
       der Knopf erreichbar, sagt aber an, dass er nichts mehr tut, und
       die Klickroutine faengt ihn ab. Befund des qa-Pruefers 19.11.2026. */
    function sperren(knopf, aus) {
      if (!knopf) return;
      knopf.setAttribute('aria-disabled', aus ? 'true' : 'false');
    }
    function gesperrt(knopf) {
      return knopf.getAttribute('aria-disabled') === 'true';
    }
    function schieben(richtung) {
      s.scrollBy({ left: richtung * schritt(), behavior:
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto' : 'smooth' });
    }
    if (zurueck) zurueck.addEventListener('click', function () {
      if (!gesperrt(zurueck)) schieben(-1);
    });
    if (vor) vor.addEventListener('click', function () {
      if (!gesperrt(vor)) schieben(1);
    });

    var warte = null;
    s.addEventListener('scroll', function () {
      if (warte) return;
      warte = requestAnimationFrame(function () { warte = null; nachziehen(); });
    }, { passive: true });
    window.addEventListener('resize', nachziehen, { passive: true });
    nachziehen();
  }

  /* ============================================================
     MODELLBILDER AUF DEN PRODUKTSEITEN (20.11.2026)

     ANLASS: Der Betreiber hat am 20.11.2026 einen Bildschirmabzug
     geschickt und dazu geschrieben, er wolle "einfach nur, dass man
     die Bilder wischen kann". Gemeint waren nicht die
     Ausfuehrungsbeispiele weiter unten, sondern die Bilder der
     Modelle: je Produktseite drei bis zehn Stueck, jedes in einer
     eigenen Karte, jedes ein totes Bild. Antippen tat nichts.

     JETZT: Jedes Modellbild wird zur Schaltflaeche und oeffnet
     dieselbe Grossansicht wie die Ausfuehrungsbeispiele. Darin
     laesst sich durch ALLE Modellbilder der Seite wischen, mit
     Pfeiltasten blaettern und mit Escape schliessen.

     WARUM IM SKRIPT UND NICHT IM HTML: Die Karten stehen in 16
     Vorlagen und in 16 gebauten Seiten. Hier ist es eine Stelle.
     Faellt das Skript aus, bleibt das Bild sichtbar, es laesst sich
     dann nur nicht vergroessern. Nichts geht verloren.

     NICHT GEMACHT: Mehrere Bilder je Modell. Die 59 Bilder im
     Portfolio sind nach Produktgruppe sortiert, nicht nach Modell.
     Welches Bild ein TDS zeigt und welches ein SkyView, kann ich
     nicht erfinden; am 19.11.2026 lag ich mit genau so einer
     Zuordnung daneben. Das waere Inhalt und gehoert dem Betreiber.
     ============================================================ */
  if (karten.length) {
    var modellListe = [];
    var modellKnoepfe = [];
    Array.prototype.forEach.call(karten, function (huelle) {
      var img = huelle.querySelector('img');
      if (!img || huelle.querySelector('button')) return;
      var alt = img.getAttribute('alt') || '';
      var knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'produkt-bild-knopf';
      knopf.setAttribute('aria-label', alt ? alt + ' groß anzeigen' : 'Bild groß anzeigen');
      img.parentNode.insertBefore(knopf, img);
      knopf.appendChild(img);
      modellListe.push({ src: img.getAttribute('src'), alt: alt });
      modellKnoepfe.push(knopf);
    });
    modellKnoepfe.forEach(function (k, i) {
      k.addEventListener('click', function () { oeffnen(modellListe, i, k); });
    });
  }

  Array.prototype.forEach.call(streifen, function (s) {
    steuerung(s);
    var kacheln = s.querySelectorAll('.galerie-kachel');
    var liste = Array.prototype.map.call(kacheln, function (k) {
      var img = k.querySelector('img');
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    });
    Array.prototype.forEach.call(kacheln, function (k, i) {
      k.addEventListener('click', function () { oeffnen(liste, i, k); });
    });
  });
})();
