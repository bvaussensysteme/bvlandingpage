/* Google-Bewertungen auf der Startseite (#bewertungen), 27.11.2026.
 *
 * Holt /api/bewertungen (worker/bewertungen.js) erst, wenn der Abschnitt in
 * die Naehe des Bildschirms kommt: Jede Abfrage bei Google kostet
 * Kontingent, und wer nie so weit scrollt, braucht keine.
 * Antwortet der Server nicht mit echten Daten, passiert nichts: Der Abschnitt
 * zeigt dann wie bisher nur die Links zu Google und Trustindex.
 * Alle Texte kommen per textContent auf die Seite, nie als HTML.
 */
(function () {
  'use strict';
  var box = document.getElementById('bw');
  if (!box || !window.fetch) return;
  var liste = document.getElementById('bwListe');

  function sterne(n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆';
    return s;
  }

  function karte(b) {
    var li = document.createElement('li');
    li.className = 'bw-karte';
    var kopf = document.createElement('div');
    kopf.className = 'bw-kopf';
    var ini = document.createElement('span');
    ini.className = 'bw-initiale';
    ini.setAttribute('aria-hidden', 'true');
    ini.textContent = (b.name.trim().charAt(0) || '?').toUpperCase();
    var wer = document.createElement('div');
    var name = document.createElement('p');
    name.className = 'bw-name';
    name.textContent = b.name;
    var wann = document.createElement('p');
    wann.className = 'bw-wann';
    wann.textContent = b.wann || '';
    wer.appendChild(name);
    wer.appendChild(wann);
    kopf.appendChild(ini);
    kopf.appendChild(wer);
    var st = document.createElement('p');
    st.className = 'bw-sterne';
    var sichtbar = document.createElement('span');
    sichtbar.setAttribute('aria-hidden', 'true');
    sichtbar.textContent = sterne(b.sterne);
    var vorlesen = document.createElement('span');
    vorlesen.className = 'sr-only';
    vorlesen.textContent = b.sterne + ' von 5 Sternen, Google-Bewertung';
    var quelle = document.createElement('span');
    quelle.className = 'bw-quelle';
    quelle.setAttribute('aria-hidden', 'true');
    quelle.textContent = 'Google-Bewertung';
    st.appendChild(sichtbar);
    st.appendChild(vorlesen);
    st.appendChild(quelle);
    var text = document.createElement('p');
    text.className = 'bw-text';
    text.textContent = b.text;
    li.appendChild(kopf);
    li.appendChild(st);
    li.appendChild(text);
    if (b.text.length > 220) {
      text.classList.add('bw-text--kurz');
      var knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.className = 'bw-mehr';
      knopf.setAttribute('aria-expanded', 'false');
      knopf.textContent = 'Weiterlesen';
      knopf.addEventListener('click', function () {
        var offen = text.classList.toggle('bw-text--kurz') === false;
        knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
        knopf.textContent = offen ? 'Weniger' : 'Weiterlesen';
      });
      li.appendChild(knopf);
    }
    return li;
  }

  function zeigen(d) {
    if (!d || d.ok !== true || !d.note || !d.anzahl || !d.bewertungen || !d.bewertungen.length) return;
    document.getElementById('bwNote').textContent = String(d.note.toFixed ? d.note.toFixed(1) : d.note).replace('.', ',');
    document.getElementById('bwSterne').textContent = sterne(Math.round(d.note));
    document.getElementById('bwAnzahl').textContent = d.anzahl + (d.anzahl === 1 ? ' Bewertung bei Google' : ' Bewertungen bei Google');
    d.bewertungen.forEach(function (b) { liste.appendChild(karte(b)); });
    var h = document.getElementById('bewertungen-h');
    if (h) h.textContent = 'Das sagen unsere Kunden bei Google';
    box.hidden = false;
    var schritt = function (r) {
      var k = liste.querySelector('.bw-karte');
      liste.scrollBy({ left: r * (k ? k.offsetWidth + 16 : 300), behavior: 'smooth' });
    };
    document.getElementById('bwZurueck').addEventListener('click', function () { schritt(-1); });
    document.getElementById('bwVor').addEventListener('click', function () { schritt(1); });
  }

  function laden() {
    fetch('/api/bewertungen', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(zeigen)
      .catch(function () {});
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { io.disconnect(); laden(); }
    }, { rootMargin: '600px 0px' });
    io.observe(document.getElementById('bewertungen') || box);
  } else {
    laden();
  }
})();
