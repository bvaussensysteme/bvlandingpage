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

    function zeigen(n) {
      i = (n + bilder.length) % bilder.length;
      var b = bilder[i];
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
  });
})();
