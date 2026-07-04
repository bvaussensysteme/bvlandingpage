(function () {
  var history = [];
  var open = false;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function build() {
    var bubbleIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
    var bubble = el('button', { id: 'bvChatBubble', 'aria-label': 'Chat öffnen' }, bubbleIcon);
    var panel = el('div', { id: 'bvChatPanel' },
      '<div class="bv-chat-header">' +
        '<span>BV Assistent <small>(Beta)</small></span>' +
        '<button id="bvChatClose" aria-label="Chat schließen">✕</button>' +
      '</div>' +
      '<div class="bv-chat-messages" id="bvChatMessages">' +
        '<div class="bv-chat-msg bv-chat-msg-bot">Hallo! Ich bin der KI-Assistent von BV AussenSysteme (Beta). Fragen Sie mich zu unseren Produkten, dem Ablauf oder unserem Einzugsgebiet – ich helfe gerne weiter oder verlinke die passende Seite.</div>' +
      '</div>' +
      '<form id="bvChatForm" class="bv-chat-form">' +
        '<input id="bvChatInput" type="text" maxlength="500" placeholder="Ihre Frage…" autocomplete="off" />' +
        '<button type="submit" aria-label="Senden">➤</button>' +
      '</form>'
    );
    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    bubble.addEventListener('click', function () { toggle(true); });
    panel.querySelector('#bvChatClose').addEventListener('click', function () { toggle(false); });

    var form = panel.querySelector('#bvChatForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = panel.querySelector('#bvChatInput');
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      send(text);
    });
  }

  function toggle(state) {
    open = state;
    document.getElementById('bvChatPanel').classList.toggle('open', open);
    if (open) document.getElementById('bvChatInput').focus();
  }

  var WHATSAPP_URL = 'https://wa.me/4915678696609';
  var EMAIL_ADDRESS = 'info@bv-aussensysteme.de';
  var WHATSAPP_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.526 5.845L.057 23.243a.75.75 0 0 0 .916.916l5.398-1.469A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.696 9.696 0 0 1-4.964-1.366l-.356-.214-3.694 1.004 1.004-3.694-.214-.356A9.696 9.696 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>';

  var contactActionsHtml =
    '<div class="bv-chat-actions">' +
      '<a href="/#kontakt" target="_top" class="bv-chat-action bv-chat-action-gold">Kontaktformular</a>' +
      '<a href="' + WHATSAPP_URL + '" target="_blank" rel="noopener" class="bv-chat-action bv-chat-action-whatsapp">' + WHATSAPP_ICON + ' WhatsApp</a>' +
      '<a href="mailto:' + EMAIL_ADDRESS + '" class="bv-chat-action bv-chat-action-mail">✉ E-Mail schreiben</a>' +
    '</div>';

  var genericCtaHtml =
    '<div class="bv-chat-actions"><a href="/#kontakt" target="_top" class="bv-chat-action bv-chat-action-gold">Jetzt kostenlos anfragen →</a></div>';

  var PRODUCT_CARDS = {
    '/produkte/terrasse.html': { img: 'vd_prod_terrasse_tds.jpg', label: 'Terrassenüberdachung' },
    '/produkte/carport.html': { img: 'vd_prod_carport_tds.jpg', label: 'Carport' },
    '/produkte/pergola.html': { img: 'vd_prod_pergola_sunpro.jpg', label: 'Pergola & Lamellendach' },
    '/produkte/velaris.html': { img: 'vd_prod_pergola_velaris.jpg', label: 'Velaris' },
    '/produkte/kaltwintergarten.html': { img: 'vd_prod_kaltwintergarten_tds.jpg', label: 'Kaltwintergarten' },
    '/produkte/sonnenschutz.html': { img: 'vd_prod_sonnenschutz.jpg', label: 'Sonnenschutz & Markisen' },
    '/produkte/gelaender.html': { img: 'vd_prod_gelaender_glas.jpg', label: 'Geländer & Glasgeländer' },
    '/produkte/eingang.html': { img: 'vd_prod_eingang_fly.jpg', label: 'Eingang & Vordächer' },
    '/produkte/balkon-fassade.html': { img: 'vd_prod_decowall_start.jpg', label: 'Balkon & Fassade' },
    '/produkte/garten-aussenbereich.html': { img: 'vd_prod_gartenhaus.jpg', label: 'Garten & Außenbereich' },
  };

  function productCardHtml(path, info) {
    return '<div class="bv-chat-product">' +
      '<img src="/images/' + info.img + '" alt="' + info.label + '" loading="lazy" />' +
      '<div class="bv-chat-product-body">' +
        '<strong>' + info.label + '</strong>' +
        '<a href="' + path + '" target="_top" class="bv-chat-action bv-chat-action-gold">Jetzt ansehen →</a>' +
      '</div>' +
    '</div>';
  }

  function renderMessageHtml(text) {
    var wantsContact = /\/#kontakt\b|kontaktformular|kontaktieren sie uns|nehmen sie kontakt/i.test(text);
    var productPath = null;
    for (var p in PRODUCT_CARDS) {
      if (text.indexOf(p) !== -1) { productPath = p; break; }
    }
    var html = linkify(escapeHtml(text), wantsContact, productPath);
    if (productPath) html += productCardHtml(productPath, PRODUCT_CARDS[productPath]);
    if (wantsContact) {
      html += contactActionsHtml;
    } else if (!productPath) {
      html += genericCtaHtml;
    }
    return html;
  }

  function addMessage(text, who) {
    var wrap = document.getElementById('bvChatMessages');
    var msg = el('div', { class: 'bv-chat-msg bv-chat-msg-' + who }, renderMessageHtml(text));
    wrap.appendChild(msg);
    wrap.scrollTop = wrap.scrollHeight;
    return msg;
  }

  function updateMessage(msg, text) {
    msg.innerHTML = renderMessageHtml(text);
    var wrap = document.getElementById('bvChatMessages');
    // Nicht ans Ende springen (sonst muss man bei langen Antworten zum
    // Anfang zurückscrollen) - stattdessen Anfang der neuen Nachricht zeigen.
    wrap.scrollTop = Math.max(0, msg.offsetTop - 8);
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  var LINK_LABELS = {
    '/produkte/terrasse.html': 'Terrassenüberdachung',
    '/produkte/carport.html': 'Carport',
    '/produkte/pergola.html': 'Pergola & Lamellendach',
    '/produkte/velaris.html': 'Velaris',
    '/produkte/kaltwintergarten.html': 'Kaltwintergarten',
    '/produkte/sonnenschutz.html': 'Sonnenschutz & Markisen',
    '/produkte/gelaender.html': 'Geländer & Glasgeländer',
    '/produkte/eingang.html': 'Eingang & Vordächer',
    '/produkte/balkon-fassade.html': 'Balkon & Fassade',
    '/produkte/garten-aussenbereich.html': 'Garten & Außenbereich',
    '/ratgeber/': 'Ratgeber',
    '/ratgeber': 'Ratgeber',
    '/windzonen.html': 'Wind- & Schneelastzonen-Rechner',
    '/baugenehmigung.html': 'Baugenehmigungs-Check',
    '/konfigurator.html': 'Konfigurator',
    '/#kontakt': 'Kontaktformular',
    '/#faq': 'FAQ',
    '/#leistungen': 'Leistungen',
    '/#galerie': 'Galerie',
  };

  function humanize(path) {
    var slug = path.replace(/^\/(produkte\/|ratgeber\/)?/, '').replace(/\.html$/, '').replace(/^#/, '');
    if (!slug) return 'Startseite';
    return slug.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
  }

  // Wandelt interne Pfade (z.B. /windzonen.html, /#kontakt, /produkte/pergola.html)
  // in klickbare Links mit lesbarem Seitennamen um. Läuft nach escapeHtml, daher
  // keine rohen Tags im Input.
  function linkify(escaped, skipKontakt, skipPath) {
    return escaped.replace(/(^|[\s(])(\/[a-zA-Z0-9\-_\/]*(?:\.html)?(?:#[a-zA-Z0-9\-_]+)?)/g, function (m, pre, path) {
      if (path.length < 2) return m;
      if (skipKontakt && path === '/#kontakt') return pre;
      if (skipPath && path === skipPath) return pre;
      var label = LINK_LABELS[path] || humanize(path);
      return pre + '<a href="' + path + '" target="_top">' + label + '</a>';
    });
  }

  function send(text) {
    addMessage(text, 'user');
    var pending = addMessage('…', 'bot');
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: text, history: history }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var reply = data.reply || data.error || 'Entschuldigung, das hat nicht funktioniert. Bitte nutzen Sie das Kontaktformular.';
        updateMessage(pending, reply);
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: reply });
        if (history.length > 8) history = history.slice(-8);
      })
      .catch(function () {
        updateMessage(pending, 'Der Assistent ist gerade nicht erreichbar. Bitte nutzen Sie das Kontaktformular.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
