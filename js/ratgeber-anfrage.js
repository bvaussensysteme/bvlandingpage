/* Ratgeber anfordern (Seite /ratgeber/, Abschnitt #kostenlose-ratgeber).
 *
 * Ablauf (27.11.2026, Wunsch des Betreibers):
 *   1. Name, E-Mail und das freiwillige Haekchen gehen an den eigenen Server
 *      (POST /api/ratgeber, worker/ratgeber.js), der sie an unser CRM
 *      weiterreicht.
 *   2. Das CRM schickt eine Mail mit einem persoenlichen Link. Erst dort gibt
 *      es die drei Downloads. So bekommt nur, wer eine echte Adresse angibt,
 *      die Ratgeber ("dann kann ja derjenige einfach irgendwelche Fake-Daten
 *      eintragen", Betreiber).
 *   3. Das Haekchen fuer Hinweise per E-Mail ist freiwillig. Mitgeschickt
 *      werden Fassung und Wortlaut, wie sie auf der Seite stehen; das CRM
 *      speichert eine Einwilligung nur bei bekannter Fassung.
 *
 * Kein Fremddienst im Browser: alles laeuft ueber die eigene Adresse.
 */
(function () {
  'use strict';
  var form = document.getElementById('raForm');
  if (!form) return;
  var status = document.getElementById('raStatus');
  var knopf = document.getElementById('raSenden');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function zeige(text, fehler) {
    status.textContent = text;
    status.className = 'ra-status' + (fehler ? ' ra-status--fehler' : '');
  }

  function feldFehler(feld, text) {
    feld.setAttribute('aria-invalid', 'true');
    feld.focus();
    zeige(text, true);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name;
    var email = form.elements.email;
    var hinweise = form.elements.hinweise;
    var hinweisText = document.getElementById('raHinweisText');
    [name, email].forEach(function (f) { f.removeAttribute('aria-invalid'); });

    if (!name.value.trim()) return feldFehler(name, 'Bitte geben Sie Ihren Namen an.');
    if (!EMAIL.test(email.value.trim())) return feldFehler(email, 'Bitte prüfen Sie Ihre E-Mail-Adresse.');

    knopf.disabled = true;
    var alt = knopf.textContent;
    knopf.textContent = 'Wird gesendet …';
    zeige('', false);

    fetch('/api/ratgeber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        hinweise: hinweise.checked,
        fassung: hinweise.checked ? hinweise.getAttribute('data-fassung') : undefined,
        wortlaut: hinweise.checked && hinweisText ? hinweisText.textContent : undefined,
        website: form.elements.website.value,
        seite: location.pathname
      })
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false }; });
    }).then(function (d) {
      if (d && d.fehler === 'begrenzt') throw new Error('begrenzt');
      if (!d || !d.ok) throw new Error('nicht ok');
      if (window.bvMessung) window.bvMessung('ratgeber-angefordert');
      var danke = document.createElement('div');
      danke.className = 'ra-danke';
      danke.setAttribute('tabindex', '-1');
      var h = document.createElement('h3');
      h.textContent = 'Danke! Bitte sehen Sie in Ihr Postfach.';
      var p = document.createElement('p');
      p.textContent = d.mail
        ? 'Wir haben Ihnen eben eine E-Mail an ' + email.value.trim() + ' geschickt. Der Link darin führt zu Ihren drei Ratgebern. Keine Mail da? Sehen Sie bitte auch im Spam-Ordner nach.'
        : 'Ihre Anfrage ist bei uns angekommen. Die E-Mail konnte gerade nicht automatisch verschickt werden. Wir schicken Ihnen die Ratgeber in Kürze an ' + email.value.trim() + '.';
      danke.appendChild(h);
      danke.appendChild(p);
      var box = form.querySelector('.ra-felder');
      box.innerHTML = '';
      box.appendChild(danke);
      danke.focus();
    }).catch(function (fehler) {
      knopf.disabled = false;
      knopf.textContent = alt;
      zeige(fehler && fehler.message === 'begrenzt'
        ? 'An diese Adresse haben wir heute schon mehrere E-Mails geschickt. Bitte sehen Sie in Ihr Postfach und den Spam-Ordner, oder versuchen Sie es morgen noch einmal.'
        : 'Das Senden hat nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie uns an: 0156 78696609.', true);
    });
  });
})();
