/* ============================================================
   BILDER BLAETTERN IN DEN LEISTUNGSKARTEN (20.11.2026)

   ANSAGE DES BETREIBERS, woertlich: "Ich will nicht so eine
   Dia-Show mit einem Play-Button, sondern einfach nur, dass man
   die Bilder swipen kann. [...] dass links und rechts so zwei
   Pfeile auftauchen, wenn man drueber ueber das Bild faehrt mit
   der Maus und dann die Bilder weiter swipen kann. Oder wenn man
   auf dem Handy ist, dass man mit dem Finger swipen kann."

   Also GENAU DAS und nichts weiter:
     - Am Rechner zwei Pfeile, die beim Drueberfahren auftauchen.
     - Am Telefon mit dem Finger wischen.
     - Nichts bewegt sich von allein.

   VORHER stand hier eine Diaschau mit Takt und Anhalten-Knopf.
   Sie ist am selben Tag gebaut und wieder herausgenommen worden,
   auf Ansage. Weil nichts mehr von allein laeuft, entfaellt auch
   WCAG 2.2, 2.2.2 (Pausieren, Stoppen, Ausblenden) als Thema: Es
   gibt nichts zu pausieren.

   WOHER DIE BILDER KOMMEN: aus dem Attribut data-bilder an
   .leistung-img, gesetzt von scripts/baue-leistungen-bilder.mjs
   aus src/_data/galerien.json. Steht dort nichts, passiert hier
   nichts, und das vorhandene Bild bleibt stehen.

   WARUM DIE PFEILE NUR BEI MAUS ENTSTEHEN: Auf einem Telefon
   waeren sie unsichtbar, weil es dort kein Drueberfahren gibt,
   aber trotzdem mit der Tastatur erreichbar. Genau das ist der
   Fall, den WCAG 2.2, 2.4.11 verbietet und den ich am 20.11.2026
   an zwei anderen Stellen beseitigt habe. Also: kein Pfeil, der
   nicht gesehen werden kann.

   Reihenfolge ist die aus galerien.json, nicht gemischt. Wer von
   Hand blaettert, will beim Zurueckblaettern dasselbe Bild
   wiedersehen.

   PUNKTE UNTER DEM BILD (Nachtrag, 20.11.2026). Ansage: "das muss
   natuerlich ersichtlich sein, dass da mehrere Bilder sind, dass man
   auch drauf kommt, dass man die durchgucken kann. [...] vielleicht
   so graue Punkte. Und bei dem Bild, bei dem man gerade ist, der
   Punkt ist Gold." Ohne diesen Hinweis kommt niemand auf das
   Wischen, am Telefon schon gar nicht: Dort gibt es nicht einmal
   Pfeile.

   Die Punkte sind KEINE Schaltflaechen, sondern eine Anzeige. Ein
   7 px grosser Punkt waere eine Tippflaeche weit unter den 24 x 24
   px aus WCAG 2.2, 2.5.8. Geblaettert wird mit Pfeilen und Wischen,
   beide gross genug. Die Punkte tragen deshalb aria-hidden.

   Fuer Hilfsmittel steht daneben ein unsichtbarer Satz "Bild 2 von
   6" in einer hoeflichen Live-Region. Er aendert sich nur, wenn
   jemand selbst blaettert, ist also kein Dauerlaerm (WCAG 2.2,
   4.1.3 Statusmeldungen).

   Gold allein unterscheidet den aktiven Punkt nicht: Markengold und
   ein helles Grau liegen in der Helligkeit dicht beieinander, und
   nach WCAG 1.4.1 darf Farbe nicht das einzige Mittel sein. Der
   aktive Punkt ist deshalb auch groesser.
   ============================================================ */
(function () {
  'use strict';
  var kisten = document.querySelectorAll('.leistung-img[data-bilder]');
  if (!kisten.length) return;

  var mitMaus = false;
  try {
    mitMaus = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) {}

  var PFEIL_LINKS = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"'
    + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  var PFEIL_RECHTS = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"'
    + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  Array.prototype.forEach.call(kisten, function (kiste) {
    var liste;
    try { liste = JSON.parse(kiste.getAttribute('data-bilder')); } catch (e) { return; }
    if (!liste || liste.length < 2) return;
    var img = kiste.querySelector('img');
    if (!img) return;

    /* Das Bild, das schon in der Seite steht, bleibt das erste. Es ist
       vermutlich geladen, und ein Austausch im ersten Augenblick waere
       nur ein Flackern. */
    var bilder = [{ d: img.getAttribute('src'), a: img.getAttribute('alt') || '' }].concat(liste);
    var i = 0;

    /* Die <source> im <picture> wuerde das alte webp weiter erzwingen
       und den Wechsel ueberstimmen. Sie muss weg, sobald wir
       uebernehmen; die Portfoliobilder sind selbst webp. */
    var quelle = kiste.querySelector('picture source');
    if (quelle) quelle.parentNode.removeChild(quelle);

    /* Punkte und der unsichtbare Satz daneben. */
    var punkte = document.createElement('div');
    punkte.className = 'bildwechsel-punkte';
    punkte.setAttribute('aria-hidden', 'true');
    for (var n = 0; n < bilder.length; n++) {
      punkte.appendChild(document.createElement('span'));
    }
    kiste.appendChild(punkte);

    /* Die Zahl in der Ecke. Ansage des Betreibers, zweimal genannt:
       "da muss vielleicht das in der Ecke oder irgendwie steht zum
       Beispiel 1 von 6 oder 1 von 3, also welches Bild von wie viel
       das ist, aber so, dass das nicht sehr das Bild stoert."
       Deshalb oben rechts, klein, und mit aria-hidden: Fuer
       Hilfsmittel sagt der unsichtbare Satz darunter dasselbe in
       ganzen Worten. */
    var zahl = document.createElement('span');
    zahl.className = 'bildwechsel-zahl';
    zahl.setAttribute('aria-hidden', 'true');
    kiste.appendChild(zahl);

    var sage = document.createElement('p');
    sage.className = 'sr-only';   /* die vorhandene Klasse der Seite */
    sage.setAttribute('aria-live', 'polite');
    kiste.appendChild(sage);

    function anzeigen() {
      var k = punkte.children;
      for (var n = 0; n < k.length; n++) k[n].className = (n === i ? 'ist-da' : '');
      zahl.textContent = (i + 1) + ' / ' + bilder.length;
      sage.textContent = 'Bild ' + (i + 1) + ' von ' + bilder.length;
    }

    function zeigen(n) {
      i = (n + bilder.length) % bilder.length;
      var b = bilder[i];
      anzeigen();
      if (img.getAttribute('src') === b.d) return;
      var vor = new Image();
      vor.onload = function () { img.src = b.d; img.alt = b.a; };
      vor.onerror = function () { /* Bild fehlt: dann bleibt das alte stehen. */ };
      vor.src = b.d;
    }

    if (mitMaus) {
      [['zurueck', -1, PFEIL_LINKS, 'Vorheriges Bild'],
       ['vor', 1, PFEIL_RECHTS, 'Nächstes Bild']].forEach(function (s) {
        var k = document.createElement('button');
        k.type = 'button';
        k.className = 'bildwechsel-pfeil bildwechsel-' + s[0];
        k.innerHTML = s[2];
        k.setAttribute('aria-label', s[3]);
        k.addEventListener('click', function (e) {
          /* Die ganze Karte ist anklickbar; ohne das landet man auf der
             Produktseite statt beim naechsten Bild. */
          e.preventDefault();
          e.stopPropagation();
          zeigen(i + s[1]);
        });
        kiste.appendChild(k);
      });
    }

    /* Wischen. Dieselbe Schwelle wie in der Grossansicht: 45 px.
       Senkrechtes Wischen ist Scrollen und darf nicht blaettern. */
    var x0 = null, y0 = null;
    kiste.addEventListener('touchstart', function (e) {
      x0 = e.changedTouches[0].clientX;
      y0 = e.changedTouches[0].clientY;
    }, { passive: true });
    kiste.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      x0 = null; y0 = null;
      if (Math.abs(dx) < 45 || Math.abs(dy) > Math.abs(dx)) return;
      zeigen(i + (dx < 0 ? 1 : -1));
    }, { passive: true });

    anzeigen();
  });
})();
