/* ============================================================
   DIASCHAU IN DEN LEISTUNGSKARTEN (20.11.2026)

   ANSAGE DES BETREIBERS: "ich wollte ja so eine Dia-Show haben,
   dass die Bilder nach einigen Zeit selber nach rechts swipen und
   alle immer durcheinander gehen."

   Also: Die Bilder wechseln von allein, laufen im Kreis, und die
   Reihenfolge ist bei jedem Seitenaufruf eine andere. Wischen und
   Pfeiltasten gehen trotzdem.

   WOHER DIE BILDER KOMMEN: aus dem Attribut data-diaschau an
   .leistung-img, gesetzt von scripts/baue-leistungen-diaschau.mjs
   aus src/_data/galerien.json. Steht dort nichts, passiert hier
   nichts, und das vorhandene Bild bleibt stehen.

   WCAG 2.2, was hier dranhaengt und NICHT verhandelbar ist:
   - 2.2.2 Pausieren, Stoppen, Ausblenden (Stufe A): Etwas, das von
     allein laeuft, laenger als fuenf Sekunden dauert und neben
     anderem Inhalt steht, MUSS sich anhalten lassen. Deshalb hat
     jede Karte einen Knopf dafuer, und er ist 44 x 44 px gross.
   - prefers-reduced-motion: dann laeuft gar nichts von allein. Das
     ist kein Zusatz, sondern der Normalfall fuer jeden, der es so
     eingestellt hat.
   - Der Wechsel haelt an, solange jemand mit Maus oder Tastatur in
     der Karte ist: Sonst springt das Bild unter dem Finger weg.
   - Laeuft der Tab im Hintergrund, ruht alles.
   - Die Bildunterschrift wandert nicht in eine aria-live-Region.
     Ein Bildwechsel alle fuenf Sekunden vorzulesen waere Laerm.
     Der Alternativtext am img wird mitgefuehrt, mehr nicht.
   ============================================================ */
(function () {
  'use strict';
  var kisten = document.querySelectorAll('.leistung-img[data-diaschau]');
  if (!kisten.length) return;

  var ruhig = false;
  try { ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var TAKT = 5200;

  function mischen(a) {
    /* Fisher und Yates. Nicht sort(() => Math.random() - .5): Das
       mischt nachweislich schief und bevorzugt die Ausgangslage. */
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var h = a[i]; a[i] = a[j]; a[j] = h;
    }
    return a;
  }

  Array.prototype.forEach.call(kisten, function (kiste) {
    var liste;
    try { liste = JSON.parse(kiste.getAttribute('data-diaschau')); } catch (e) { return; }
    if (!liste || liste.length < 2) return;
    var img = kiste.querySelector('img');
    if (!img) return;

    /* Das Bild, das schon in der Seite steht, bleibt das erste. Es
       ist vermutlich schon geladen, und ein Austausch im ersten
       Augenblick waere nur ein Flackern. */
    var erstes = { d: img.getAttribute('src'), a: img.getAttribute('alt') || '' };
    var rest = mischen(liste.slice());
    var bilder = [erstes].concat(rest);
    var i = 0, laeuft = !ruhig, uhr = null, ruhend = false;

    /* Die <source> im <picture> wuerde das webp weiter erzwingen und
       unseren Wechsel ueberstimmen. Sie muss weg, sobald wir
       uebernehmen. Die Dateien im Portfolio sind selbst webp. */
    var quelle = kiste.querySelector('picture source');
    if (quelle) quelle.parentNode.removeChild(quelle);

    var knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'diaschau-halt';
    knopf.innerHTML = '<span class="diaschau-sym" aria-hidden="true"></span>';
    beschriften();
    kiste.appendChild(knopf);

    function beschriften() {
      knopf.setAttribute('aria-label', laeuft ? 'Diaschau anhalten' : 'Diaschau weiterlaufen lassen');
      knopf.setAttribute('aria-pressed', laeuft ? 'false' : 'true');
      knopf.classList.toggle('laeuft', laeuft);
    }

    function zeigen(n) {
      i = (n + bilder.length) % bilder.length;
      var b = bilder[i];
      if (img.getAttribute('src') === b.d) return;
      var vor = new Image();
      vor.onload = function () {
        img.src = b.d;
        img.alt = b.a;
        kiste.classList.remove('diaschau-wechsel');
        void kiste.offsetWidth;
        if (!ruhig) kiste.classList.add('diaschau-wechsel');
      };
      vor.onerror = function () { /* Bild fehlt: beim naechsten Takt weiter. */ };
      vor.src = b.d;
    }

    function takten() {
      stoppen();
      if (!laeuft || ruhend || ruhig) return;
      uhr = window.setInterval(function () { zeigen(i + 1); }, TAKT);
    }
    function stoppen() { if (uhr) { window.clearInterval(uhr); uhr = null; } }

    knopf.addEventListener('click', function (e) {
      e.preventDefault();
      laeuft = !laeuft;
      beschriften();
      takten();
    });

    /* Anhalten, solange jemand da ist. Das ist KEIN Ersatz fuer den
       Knopf: Wer die Seite nur liest, fasst die Karte nie an. */
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) {
      kiste.addEventListener(ev, function () { ruhend = true; takten(); }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      kiste.addEventListener(ev, function () { ruhend = false; takten(); }, { passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      ruhend = document.hidden;
      takten();
    });

    /* Wischen. Dieselbe Schwelle wie in der Grossansicht: 45 px. */
    var x0 = null;
    kiste.addEventListener('touchstart', function (e) {
      x0 = e.changedTouches[0].clientX;
    }, { passive: true });
    kiste.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var d = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(d) < 45) return;
      zeigen(i + (d < 0 ? 1 : -1));
      ruhend = false;
      takten();
    }, { passive: true });

    takten();
  });
})();
