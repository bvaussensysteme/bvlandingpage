import { neon } from '@neondatabase/serverless';

// Alte URLs, die früher nur per <meta http-equiv="refresh"> + JS
// weitergeleitet wurden (von der Search Console als "Seite mit
// Weiterleitung" mit fehlgeschlagener Validierung gemeldet, da kein
// echter HTTP-Statuscode gesendet wurde). Hier als serverseitiger
// 301 (dauerhaft verschoben), damit Google die Weiterleitung sauber
// validieren und den Linkwert auf das Ziel übertragen kann.
const REDIRECTS = {
  '/produkte/balkonueberdachung.html': '/produkte/balkon-fassade.html',
  '/produkte/sonnenschutz-beschattung.html': '/produkte/sonnenschutz.html',
  '/termin.html': '/#kontakt',
  '/kontakt.html': '/#kontakt',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (Object.prototype.hasOwnProperty.call(REDIRECTS, url.pathname)) {
      return Response.redirect(new URL(REDIRECTS[url.pathname], url).toString(), 301);
    }

    if (url.pathname === '/api/kontakt' && request.method === 'POST') {
      return handleKontakt(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

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
