/* Ratgeber anfordern (Seite /ratgeber/, Abschnitt #kostenlose-ratgeber).
 *
 * Ablauf (27.11.2026, Wunsch des Betreibers):
 *   1. Name, E-Mail und Einwilligung gehen an den eigenen Server
 *      (POST /api/ratgeber, worker/ratgeber.js).
 *   2. Der Server legt die Anfrage an und schickt ueber Brevo eine Mail mit
 *      einem persoenlichen Link auf /ratgeber/meine-ratgeber.html.
 *   3. Erst dort gibt es die drei Downloads. So bekommt nur, wer eine echte
 *      Adresse angibt, die Ratgeber ("dann kann ja derjenige einfach
 *      irgendwelche Fake-Daten eintragen", Betreiber).
 *
 * Antwortet der Server mit mail:false (Brevo noch nicht eingerichtet), sagt
 * die Seite ehrlich, dass die Ratgeber von Hand verschickt werden.
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
    var ok = form.elements.einwilligung;
    [name, email].forEach(function (f) { f.removeAttribute('aria-invalid'); });

    if (!name.value.trim()) return feldFehler(name, 'Bitte geben Sie Ihren Namen an.');
    if (!EMAIL.test(email.value.trim())) return feldFehler(email, 'Bitte prüfen Sie Ihre E-Mail-Adresse.');
    if (!ok.checked) { ok.focus(); return zeige('Bitte bestätigen Sie die Einwilligung, damit wir Ihnen die Ratgeber schicken dürfen.', true); }

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
        einwilligung: true,
        website: form.elements.website.value,
        seite: location.pathname
      })
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false }; });
    }).then(function (d) {
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
        : 'Ihre Anfrage ist bei uns angekommen. Wir schicken Ihnen die Ratgeber in Kürze an ' + email.value.trim() + '.';
      danke.appendChild(h);
      danke.appendChild(p);
      var box = form.querySelector('.ra-felder');
      box.innerHTML = '';
      box.appendChild(danke);
      danke.focus();
    }).catch(function () {
      knopf.disabled = false;
      knopf.textContent = alt;
      zeige('Das Senden hat nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie uns an: 0156 78696609.', true);
    });
  });
})();
