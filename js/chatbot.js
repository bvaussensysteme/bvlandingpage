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
    var bubble = el('button', { id: 'bvChatBubble', 'aria-label': 'Chat öffnen' }, '💬');
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
    var msg = el('div', { class: 'bv-chat-msg bv-chat-msg-' + who }, escapeHtml(text));
    wrap.appendChild(msg);
    wrap.scrollTop = wrap.scrollHeight;
    return msg;
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
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
        pending.textContent = reply;
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: reply });
        if (history.length > 8) history = history.slice(-8);
      })
      .catch(function () {
        pending.textContent = 'Der Assistent ist gerade nicht erreichbar. Bitte nutzen Sie das Kontaktformular.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
