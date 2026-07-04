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

  function addMessage(text, who) {
    var wrap = document.getElementById('bvChatMessages');
    var msg = el('div', { class: 'bv-chat-msg bv-chat-msg-' + who }, linkify(escapeHtml(text)));
    wrap.appendChild(msg);
    wrap.scrollTop = wrap.scrollHeight;
    return msg;
  }

  function updateMessage(msg, text) {
    msg.innerHTML = linkify(escapeHtml(text));
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Wandelt interne Pfade (z.B. /windzonen.html, /#kontakt, /produkte/pergola.html)
  // in klickbare Links um. Läuft nach escapeHtml, daher keine rohen Tags im Input.
  function linkify(escaped) {
    return escaped.replace(/(^|[\s(])(\/[a-zA-Z0-9\-_\/]*(?:\.html)?(?:#[a-zA-Z0-9\-_]+)?)/g, function (m, pre, path) {
      if (path.length < 2) return m;
      return pre + '<a href="' + path + '" target="_top">' + path + '</a>';
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
