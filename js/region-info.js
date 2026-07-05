/* BV AussenSysteme – Regionen-Chips: Info-Popover mit Wind-/Schneelastzone */
(function () {
  'use strict';

  var CITY_DATA = {
    'Westerwaldkreis':   { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' },
    'Montabaur':         { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' },
    'Neuwied':            { kreis: 'Neuwied',                   bundesland: 'Rheinland-Pfalz' },
    'Altenkirchen':       { kreis: 'Altenkirchen (Westerwald)',  bundesland: 'Rheinland-Pfalz' },
    'Hachenburg':         { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' },
    'Limburg':            { kreis: 'Limburg-Weilburg',          bundesland: 'Hessen' },
    'Koblenz':            { kreis: 'Koblenz',                   bundesland: 'Rheinland-Pfalz' },
    'Bad Marienberg':     { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' },
    'Westerburg':         { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' },
    'Ransbach-Baumbach':  { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' },
    'Pleckhausen':        { kreis: 'Neuwied',                   bundesland: 'Rheinland-Pfalz' },
    'Horhausen':          { kreis: 'Neuwied',                   bundesland: 'Rheinland-Pfalz' },
    'Wirges':             { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' },
    'Bad Ems':            { kreis: 'Rhein-Lahn-Kreis',          bundesland: 'Rheinland-Pfalz' },
    'Diez':               { kreis: 'Rhein-Lahn-Kreis',          bundesland: 'Rheinland-Pfalz' },
    'Höhr-Grenzhausen':   { kreis: 'Westerwaldkreis',           bundesland: 'Rheinland-Pfalz' }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var tags = document.querySelectorAll('.region-tag--link');
    if (!tags.length || typeof getWindzone !== 'function') return;

    var tip = document.createElement('div');
    tip.id = 'regionInfoTip';
    tip.innerHTML = '<button type="button" class="rit-close" aria-label="Schließen">✕</button><div class="rit-body"></div>';
    document.body.appendChild(tip);
    var body = tip.querySelector('.rit-body');
    var openFor = null;

    function render(city) {
      var data = CITY_DATA[city];
      if (!data) return '';
      var wz = getWindzone(data.kreis);
      var sz = getSchneelastzone(data.kreis);
      var szLabel = sz.slz ? sz.slz + (sz.fn ? ' (' + sz.fn + ')' : '') : 'unbekannt';
      return (
        '<span class="rit-title">📍 ' + city + '</span>' +
        '<div class="rit-zone">Windzone: <strong>' + (wz !== null ? wz : 'unbekannt') + '</strong> · ' +
        'Schneelastzone: <strong>' + szLabel + '</strong></div>' +
        '<div class="rit-bau">Baugenehmigung: abhängig vom Bundesland (' + data.bundesland + '). ' +
        'Für Terrassenüberdachung/Carport in ' + city + ' individuell prüfen.</div>' +
        '<div class="rit-links">' +
          '<a href="/baugenehmigung.html">Genehmigung prüfen →</a>' +
          '<a href="/einzugsgebiet.html">Alle Regionen →</a>' +
        '</div>'
      );
    }

    function showTip(el) {
      var city = el.getAttribute('data-city');
      body.innerHTML = render(city);
      tip.style.display = 'block';
      var r = el.getBoundingClientRect();
      var top = r.bottom + 8;
      if (top + 160 > window.innerHeight) top = r.top - 8 - tip.offsetHeight;
      var left = Math.max(8, Math.min(r.left, window.innerWidth - tip.offsetWidth - 8));
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';
      openFor = el;
    }
    function hideTip() {
      tip.style.display = 'none';
      openFor = null;
    }

    tags.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        if (openFor === el) { hideTip(); } else { showTip(el); }
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (openFor === el) { hideTip(); } else { showTip(el); }
        }
      });
    });
    tip.querySelector('.rit-close').addEventListener('click', hideTip);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#regionInfoTip') && !e.target.closest('.region-tag--link')) hideTip();
    });
    document.addEventListener('scroll', hideTip, true);
  });
})();
