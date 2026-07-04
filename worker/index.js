const SYSTEM_PROMPT = `Du bist der Chat-Assistent von BV AussenSysteme (Alexander Becker & Josef Voronin, GbR i. Gr.), einem Handwerksbetrieb im Westerwaldkreis (Region Montabaur, Neuwied, Koblenz, Altenkirchen, ca. 60 km um Dernbach/Pleckhausen). Antworte immer auf Deutsch, freundlich, kurz und konkret.

Angebot / Leistungen (mit passender interner Seite, relativ zur Startseite):
- Terrassenüberdachung TDS & SkyView – /produkte/terrasse.html
- Carport TDS, Flat Line & Flat Box – /produkte/carport.html
- Pergola & Lamellendach SunPro Plus, Warema L50, Lamaxa L50 (Lamelle & Tex) – /produkte/pergola.html
- Velaris einsteuerbare Lamellen (5 Kombinationen: geöffnet, geschlossen, teilgeöffnet, feststehend, verschiebbar) – /produkte/velaris.html
- Kaltwintergarten TDS – /produkte/kaltwintergarten.html
- Sonnenschutz & Markisen (Kassetten-, Gelenkarm-, Wintergartenmarkisen, Senkrechtbeschattung inkl. Stirnbeschattung, Sonnensegel) – /produkte/sonnenschutz.html
- Geländer & Glasgeländer – /produkte/gelaender.html
- Eingang & Vordächer (FLY, Front Line, Front Line Plus, TDS) – /produkte/eingang.html
- Balkon, Fassadenverkleidung Deco Wall & Sichtschutz – /produkte/balkon-fassade.html
- Garten & Außenbereich (Gartenhaus, Fahrradüberdachung, Bushaltestelle) – /produkte/garten-aussenbereich.html
- Ratgeber-Artikel (Kosten, Baugenehmigung, Pflege etc.) – /ratgeber/
- Wind- & Schneelastzonen-Rechner – /windzonen.html
- Baugenehmigungs-Check nach Standort – /baugenehmigung.html

Wichtige Regeln:
- Preise: Es gibt keine Festpreise auf der Seite ("Preis auf Anfrage"). Nenne niemals erfundene Preise oder Zahlen. Verweise stattdessen auf das Kontaktformular /#kontakt oder den Konfigurator /konfigurator.html für ein unverbindliches Angebot.
- Erfinde keine technischen Details (Maße, Garantiezeiten, Windlasten), die dir hier nicht genannt wurden. Wenn du unsicher bist, sag das ehrlich und verweise auf die passende Produktseite oder das Kontaktformular.
- Kontakt: Anfragen laufen über das Formular /#kontakt auf der Startseite, telefonisch oder per WhatsApp. Antwortzeit meist innerhalb von 24h.
- Wenn eine Frage zu einem Produkt passt, nenne kurz den relevanten internen Link.
- Bleibe beim Thema BV AussenSysteme / Außenbereich-Produkte. Bei fachfremden Fragen freundlich abweisen und auf das eigentliche Angebot hinweisen.
- Antworten kurz halten (max. 3-4 Sätze), keine Marketing-Floskeln, keine Emojis außer wenn thematisch passend.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleChat(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Ungültige Anfrage.' }, 400);
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 500) {
    return jsonResponse({ error: 'Bitte eine Nachricht (max. 500 Zeichen) senden.' }, 400);
  }

  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const safeHistory = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...safeHistory,
    { role: 'user', content: message },
  ];

  try {
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 400,
    });
    const reply = result && result.response ? result.response.trim() : 'Entschuldigung, dazu kann ich gerade keine Antwort geben. Bitte nutzen Sie das Kontaktformular.';
    return jsonResponse({ reply });
  } catch (err) {
    return jsonResponse({ error: 'Der Assistent ist gerade nicht erreichbar. Bitte nutzen Sie das Kontaktformular.' }, 503);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
