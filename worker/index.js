import { neon } from '@neondatabase/serverless';

const SYSTEM_PROMPT = `Du bist der Chat-Assistent von BV AussenSysteme (Alexander Becker & Josef Voronin, GbR i. Gr.), einem Handwerksbetrieb mit Sitz in Dernbach im Westerwaldkreis. Antworte auf Deutsch, natürlich und locker wie ein echter Mitarbeiter im direkten Kontakt mit Kunden – nicht wie eine Standard-FAQ. Variiere deine Formulierungen, wiederhole nicht bei jeder Antwort denselben Satzbau oder dieselben Floskeln.

Angebot / Leistungen (mit passender interner Seite, relativ zur Startseite):
- Terrassenüberdachung TDS & SkyView – /produkte/terrassenueberdachung.html
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

Einzugsgebiet (interaktive Karte: /einzugsgebiet.html):
- Zentrum/Standort: Dernbach im Westerwaldkreis.
- Reguläres Einzugsgebiet, ca. 60 km Umkreis – hier IMMER ein klares, uneingeschränktes "Ja" ohne Einschränkungen wie "aber nicht täglich" oder "nur bei größeren Aufträgen": der gesamte Westerwaldkreis (Montabaur, Ransbach-Baumbach, Westerburg, Bad Marienberg, Hachenburg), Pleckhausen, Horhausen, Dierdorf, Neuwied, Koblenz, Altenkirchen, Limburg an der Lahn.
- Erweitertes Gebiet (60-70 km, angrenzende Landkreise wie Rhein-Lahn-Kreis, Rhein-Sieg-Kreis, Siegen-Wittgenstein, Lahn-Dill-Kreis, Rheingau-Taunus-Kreis, Rhein-Hunsrück-Kreis, Cochem-Zell, Ahrweiler): ebenfalls Ja, hier reicht ein einfacher Hinweis, dass es etwas außerhalb des Kerngebiets liegt, aber problemlos machbar ist.
- Nur bei Orten deutlich über 70 km (anderes Bundesland, erkennbar weit weg): ehrlich sagen, dass das normalerweise außerhalb liegt, aber bei größeren Aufträgen fragen wir gerne nach, ob es sich einrichten lässt.
- Wenn jemand fragt, ob wir zu einem bestimmten Ort kommen: Antworte SOFORT mit Ja oder Nein (nicht ausweichen, keine künstlichen Einschränkungen erfinden), dann 1 kurzer Satz Begründung, dann CTA. Verweise bei Bedarf zusätzlich auf die Karte /einzugsgebiet.html.

Preise (echte, auf der Seite veröffentlichte Richtwerte – nur diese nennen, keine anderen Zahlen erfinden):
- Terrassenüberdachung: ab ca. 3.000-5.000 € (einfache Alu/Polycarbonat-Ausführung), Glasüberdachungen entsprechend höher.
- Carport: ab ca. 2.500 €.
- Das sind grobe Richtwerte, keine Festpreise – der genaue Preis hängt von Größe, Material, Verglasung und Montageaufwand ab und wird nach kostenloser Maßaufnahme vor Ort ermittelt. Für alles andere (Pergola, Markisen, Geländer etc.) gibt es keine veröffentlichten Richtwerte – dafür auf ein unverbindliches Angebot über /#kontakt oder den Konfigurator /konfigurator.html verweisen.

Wichtige Regeln:
- OBERSTE REGEL, gilt für ALLES: Wenn du bei irgendeiner Frage nicht sicher bist, weil du hier keine gesicherte Information dazu hast (egal ob Preis, Technik, Kontaktdaten Dritter, Verfügbarkeit etc.) - rate NIEMALS und erfinde NIEMALS eine plausibel klingende Antwort. Sag stattdessen ehrlich, dass du das nicht sicher weißt, und verweise auf die inhaltlich passende Seite dieser Website oder aufs Kontaktformular /#kontakt, wo ein Mensch weiterhelfen kann. Eine ehrliche "weiß ich nicht, aber hier findest du das" ist immer besser als eine erfundene Antwort.
- Erfinde keine technischen Details (Maße, Garantiezeiten, Windlasten), die dir hier nicht genannt wurden. Wenn du unsicher bist, sag das ehrlich und verweise auf die passende Produktseite oder das Kontaktformular.
- Du kennst KEINE Kontaktdaten (Adresse, Telefon, E-Mail, Ansprechpartner) von Bauämtern, Behörden, Landkreisen oder irgendeiner anderen externen Stelle/Firma. Erfinde solche Daten NIEMALS, auch nicht ungefähr oder als Schätzung, und nenne dafür auch nicht die Telefonnummer oder E-Mail von BV AussenSysteme (das wäre falsch zugeordnet). Verweise bei Fragen zu Bauamt/Baugenehmigung IMMER direkt auf /baugenehmigung.html - dort gibt es eine echte Datenbank mit den passenden Ansprechpartnern je nach Standort. Das gilt genauso für alle anderen Fragen zu externen Institutionen, zu denen du hier keine Informationen hast: ehrlich sagen, dass du das nicht sicher weißt, und auf die passende Seite oder das Kontaktformular verweisen statt zu raten.
- Wind- und Schneelastzonen sind ortsabhängig und hängen von exakten Koordinaten ab. Nenne dafür NIEMALS eine konkrete Zone oder Zahl (auch nicht als Schätzung) – verweise ausschließlich auf den Rechner /windzonen.html, der den echten Wert für den genauen Standort ermittelt.
- Kontakt: Anfragen laufen über das Formular /#kontakt auf der Startseite, telefonisch/per WhatsApp unter 0156 78696609 (dies ist die EINZIGE echte Telefonnummer – erfinde niemals eine andere Nummer, z.B. keine Festnetznummer). Antwortzeit meist innerhalb von 24h.
- Öffnungszeiten (laut Google-Business-Profil): Mo-Fr 08:00-17:00 Uhr, Sa 09:00-13:00 Uhr, So geschlossen. Nenne NIEMALS andere Zeiten. Konkrete Termine vor Ort laufen trotzdem individuell nach Absprache per Telefon/WhatsApp.
- Wenn eine Frage zu einem Produkt passt, nenne kurz den relevanten internen Link.
- Beantworte gestellte Fragen immer direkt und konkret (v.a. Ja/Nein-Fragen) – geh nicht auf ein anderes Thema aus, weiche nicht mit generischen Standardsätzen aus.
- Bleibe beim Thema BV AussenSysteme / Außenbereich-Produkte. Bei fachfremden Fragen freundlich abweisen und auf das eigentliche Angebot hinweisen.
- Wenn die Frage inhaltlich abgeschlossen ist (z.B. nach Produkt-, Preis- oder Einzugsgebiets-Fragen), lade natürlich zum nächsten Schritt ein (Kontaktformular, anrufen, Produktseite ansehen) – aber nicht bei jeder einzelnen Antwort stur denselben Aufruf wiederholen, das wirkt aufdringlich.
- Antworten SEHR kurz halten wie eine echte Chat-Nachricht (max. 2-3 kurze Sätze), kein Fließtext-Aufsatz, keine Marketing-Floskeln, keine Emojis außer wenn thematisch passend.
- Kein Markdown verwenden (keine [Text](Link)-Syntax, keine Sternchen für fett/kursiv, keine Überschriften mit #). Wenn du auf eine Seite verweist, schreibe einfach den nackten Pfad in den Fließtext, z.B. "/#kontakt" oder "/produkte/pergola.html" - das wird automatisch zu einem Link.
- Nicht bei jeder Antwort einen Kontakt-Aufruf anhängen. Bei kurzen Nachfragen, Zwischenfragen oder wenn im Gespräch gerade schon ein Kontakt-Hinweis kam, reicht eine normale Antwort ohne erneuten Kontakt-Aufruf.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    if (url.pathname === '/api/kontakt' && request.method === 'POST') {
      return handleKontakt(request, env);
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

  if (isZeroDividedByZero(message)) {
    return jsonResponse({ reply: ZERO_DIVIDE_JOKE });
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
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
      messages,
      max_tokens: 220,
      temperature: 0.5,
    });
    const reply = result && result.response ? sanitizePhoneNumbers(result.response.trim()) : 'Entschuldigung, dazu kann ich gerade keine Antwort geben. Bitte nutzen Sie das Kontaktformular.';
    return jsonResponse({ reply });
  } catch (err) {
    return jsonResponse({ error: 'Der Assistent ist gerade nicht erreichbar. Bitte nutzen Sie das Kontaktformular.' }, 503);
  }
}

const REAL_PHONE = '015678696609';
const REAL_PHONE_DISPLAY = '0156 78696609';

const ZERO_DIVIDE_JOKE = 'Stell dir vor, du hast 0 Kekse und verteilst sie gleichmäßig auf 0 Freunde. Wie viele Kekse bekommt jeder? Siehst du? Das ergibt keinen Sinn. Das Krümelmonster ist traurig, weil es keine Kekse gibt. Und du bist traurig, weil du keine Freunde hast. Aber wenn du schon keine Freunde hast, hol dir wenigstens eine Dachterrasse: /produkte/terrassenueberdachung.html';

// Fester Sonderfall (Easter Egg), bewusst nicht dem Modell überlassen, damit
// die Antwort immer exakt gleich kommt - nur bei "0 geteilt durch 0" o.ä.,
// nicht bei anderen Rechnungen mit einer 0.
function isZeroDividedByZero(message) {
  const m = message.toLowerCase().replace(/\s+/g, ' ').trim();
  return /\b(0|null)\s*(geteilt durch|dividiert durch|durch|:|\/)\s*(0|null)\b/.test(m);
}

// Modelle erfinden gelegentlich eine Telefonnummer trotz gegenteiliger Anweisung.
// Als Absicherung: jede erkannte Telefonnummer, die nicht der echten BV-Nummer
// entspricht, wird nur dann durch die echte ersetzt, wenn der Kontext klar
// erkennen lässt, dass es um BV AussenSysteme selbst geht (z.B. "unsere
// Nummer"). Sonst wird die (mutmaßlich erfundene) Nummer komplett entfernt,
// statt sie fälschlich als BV-Kontakt auszugeben - z.B. wenn nach der
// Telefonnummer eines Bauamts o.ä. gefragt wird und das Modell trotzdem eine
// Nummer erfindet.
function sanitizePhoneNumbers(text) {
  return text.replace(/\b0\d[\d\s/-]{5,14}\d\b/g, function (match, offset, full) {
    const digits = match.replace(/\D/g, '');
    if (digits === REAL_PHONE) return match;
    const context = full.slice(Math.max(0, offset - 60), offset).toLowerCase();
    const isAboutUs = /unser|uns\b|bv aussensysteme|erreichen sie uns|rufen sie uns/.test(context);
    return isAboutUs ? REAL_PHONE_DISPLAY : '';
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/* ============================================================
   Kontakt-/Anfrage-Speicherung  →  POST /api/kontakt
   ------------------------------------------------------------
   Schreibt Einsendungen in die Neon-PostgreSQL-Datenbank
   (@neondatabase/serverless, HTTP-Treiber). Der E-Mail-Versand an
   info@bv-aussensysteme.de läuft NICHT hier, sondern client-seitig
   im Browser über Web3Forms (dessen Free-Plan keine Server-Aufrufe
   erlaubt) – wie zuvor der Formspree-Versand. Diese Route ist der
   zusätzliche, dauerhafte Datenbank-Speicher.

   Sicherheit (öffentliches Repository!):
     - Verbindungsstring NUR als Secret env.ANFRAGEN_DB – nie im Code.
     - Nur POST, Einsendungen > 50 KB werden abgelehnt.
     - Honeypot-Feld ("website") gegen Bots.
     - Längenbegrenzung aller Eingaben.
     - Datenbankfehler werden NIE an den Besucher durchgereicht.
   ============================================================ */
const KONTAKT_MAX_BODY = 50 * 1024; // 50 KB
const KONTAKT_LIMITS = {
  name: 200, email: 200, telefon: 60, plz: 20,
  ort: 200, produkt: 200, betreff: 300, nachricht: 5000,
};

function kontaktClean(value, max) {
  if (value == null) return null;
  let s = String(value).trim();
  if (!s) return null;
  if (s.length > max) s = s.slice(0, max);
  return s;
}

function kontaktParse(raw, contentType) {
  const ct = (contentType || '').toLowerCase();
  const out = {};
  if (ct.indexOf('application/json') > -1) {
    let body = {};
    try { body = JSON.parse(raw); } catch { body = {}; }
    if (body && typeof body === 'object') {
      for (const k of Object.keys(body)) {
        const v = body[k];
        if (v != null && typeof v !== 'object') out[k] = String(v);
      }
    }
  } else {
    // application/x-www-form-urlencoded (klassisches <form> ohne JS)
    const params = new URLSearchParams(raw);
    for (const [k, v] of params.entries()) out[k] = v;
  }
  return out;
}

// Erfolg/Fehler abhängig davon, ob per JS (fetch, Accept: json) oder als
// klassisches HTML-Formular (ohne JS) gesendet wurde.
function kontaktOk(request) {
  const accept = request.headers.get('Accept') || '';
  if (accept.indexOf('application/json') > -1) {
    return jsonResponse({ ok: true, message: 'Vielen Dank! Ihre Anfrage ist bei uns eingegangen.' });
  }
  return Response.redirect(new URL('/danke.html', request.url).toString(), 303);
}
function kontaktFail(request) {
  const accept = request.headers.get('Accept') || '';
  const msg = 'Es gab ein technisches Problem beim Senden. Bitte rufen Sie uns direkt an: 015678 696609.';
  if (accept.indexOf('application/json') > -1) {
    return jsonResponse({ ok: false, message: msg }, 502);
  }
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Senden fehlgeschlagen</title>' +
    '<body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:0 20px;line-height:1.6">' +
    '<h1>Senden fehlgeschlagen</h1><p>' + msg + '</p>' +
    '<p><a href="/">Zurück zur Startseite</a></p></body>',
    { status: 502, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

async function handleKontakt(request, env) {
  // 1) Größenlimit vorab (Content-Length, falls vorhanden)
  const len = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (len && len > KONTAKT_MAX_BODY) return jsonResponse({ ok: false, message: 'Anfrage zu groß.' }, 413);

  // 2) Body lesen und Größe hart begrenzen
  let raw;
  try { raw = await request.text(); } catch { return kontaktFail(request); }
  if (raw.length > KONTAKT_MAX_BODY) return jsonResponse({ ok: false, message: 'Anfrage zu groß.' }, 413);

  const data = kontaktParse(raw, request.headers.get('Content-Type') || '');

  // 3) Honeypot: unsichtbares Feld ausgefüllt → Bot. So tun als wäre alles
  //    gut, aber nichts speichern.
  if ((data.website && data.website.trim()) || (data._gotcha && data._gotcha.trim())) {
    return kontaktOk(request);
  }

  // 4) Felder normalisieren + begrenzen
  const name = kontaktClean(data.name || [data.vorname, data.nachname].filter(Boolean).join(' '), KONTAKT_LIMITS.name);
  const email = kontaktClean(data.email, KONTAKT_LIMITS.email);
  const telefon = kontaktClean(data.telefon, KONTAKT_LIMITS.telefon);
  const plz = kontaktClean(data.plz, KONTAKT_LIMITS.plz);
  const ort = kontaktClean(data.ort, KONTAKT_LIMITS.ort);
  const produkt = kontaktClean(data.produkt, KONTAKT_LIMITS.produkt);
  const betreff = kontaktClean(
    data.betreff || data._subject || (produkt ? 'Anfrage: ' + produkt : 'Neue Anfrage über die Website'),
    KONTAKT_LIMITS.betreff
  );
  const nachricht = kontaktClean(data.nachricht || data.Zusammenfassung || data.message, KONTAKT_LIMITS.nachricht);

  const externeId = crypto.randomUUID();
  const rohdaten = JSON.stringify({ ...data, _empfangen: new Date().toISOString(), _externe_id: externeId });

  // 5) In die Datenbank schreiben. Fehler NIE an den Besucher durchreichen.
  try {
    const sql = neon(env.ANFRAGEN_DB);
    await sql`
      insert into anfragen
        (quelle, externe_id, name, email, telefon, plz, ort, produkt, betreff, nachricht, rohdaten)
      values
        ('website', ${externeId}, ${name}, ${email}, ${telefon}, ${plz}, ${ort}, ${produkt}, ${betreff}, ${nachricht}, ${rohdaten}::jsonb)
    `;
  } catch (err) {
    console.log('DB-Insert fehlgeschlagen (Anfrage', externeId, '):', String(err));
    return kontaktFail(request);
  }

  return kontaktOk(request);
}
