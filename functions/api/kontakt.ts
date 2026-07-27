/**
 * Cloudflare Pages Function – POST /api/kontakt
 * ------------------------------------------------------------------
 * Nimmt Kontakt-/Anfrage-Einsendungen der Website entgegen und schreibt
 * sie in die PostgreSQL-Datenbank (Neon, über HTTP).
 *
 * Der E-Mail-Versand an info@bv-aussensysteme.de läuft NICHT hier, sondern
 * client-seitig im Browser über Web3Forms (dessen Free-Plan keine Server-
 * Aufrufe erlaubt) – genau wie zuvor der Formspree-Versand. Diese Function
 * ist damit der zusätzliche, dauerhafte Datenbank-Speicher.
 *
 * Sicherheit (öffentliches Repository!):
 *   - Verbindungsdaten NUR als Cloudflare-Secret (ANFRAGEN_DB) – nie im Code.
 *   - Nur POST, Einsendungen > 50 KB werden abgelehnt.
 *   - Honeypot-Feld gegen Bots (unsichtbares "website"-Feld).
 *   - Längenbegrenzung aller Eingaben.
 *   - Datenbankfehler werden NIE an den Besucher durchgereicht.
 */

import { neon } from '@neondatabase/serverless';

interface Env {
  ANFRAGEN_DB: string; // Neon-Connection-String (Secret)
}

const MAX_BODY = 50 * 1024; // 50 KB
const LIMITS: Record<string, number> = {
  name: 200, email: 200, telefon: 60, plz: 20,
  ort: 200, produkt: 200, betreff: 300, nachricht: 5000,
};

/* Eingaben säubern: zu String, trimmen, auf Maximallänge kürzen. */
function clean(value: unknown, max: number): string | null {
  if (value == null) return null;
  let s = String(value).trim();
  if (!s) return null;
  if (s.length > max) s = s.slice(0, max);
  return s;
}

/* JSON-Antwort für fetch()-Aufrufe. */
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/* Erfolgsantwort – abhängig davon, ob per JS (fetch) oder als klassisches
   HTML-Formular (ohne JS) gesendet wurde. */
function ok(request: Request): Response {
  const accept = request.headers.get('Accept') || '';
  if (accept.indexOf('application/json') > -1) {
    return json({ ok: true, message: 'Vielen Dank! Ihre Anfrage ist bei uns eingegangen.' });
  }
  return Response.redirect(new URL('/danke.html', request.url).toString(), 303);
}

/* Fehlerantwort – generisch, ohne technische Details. */
function fail(request: Request): Response {
  const accept = request.headers.get('Accept') || '';
  const msg = 'Es gab ein technisches Problem beim Senden. Bitte rufen Sie uns direkt an: 015678 696609.';
  if (accept.indexOf('application/json') > -1) {
    return json({ ok: false, message: msg }, 502);
  }
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Senden fehlgeschlagen</title>' +
    '<body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:0 20px;line-height:1.6">' +
    '<h1>Senden fehlgeschlagen</h1><p>' + msg + '</p>' +
    '<p><a href="/">Zurück zur Startseite</a></p></body>',
    { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/* Eingehende Daten aus JSON- oder Formular-POST einlesen. */
function parseData(raw: string, contentType: string): Record<string, string> {
  const ct = (contentType || '').toLowerCase();
  const out: Record<string, string> = {};
  if (ct.indexOf('application/json') > -1) {
    let body: unknown = {};
    try { body = JSON.parse(raw); } catch { body = {}; }
    if (body && typeof body === 'object') {
      for (const k of Object.keys(body as object)) {
        const v = (body as Record<string, unknown>)[k];
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

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // 1) Größenlimit vorab (Content-Length, falls vorhanden)
  const len = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (len && len > MAX_BODY) return json({ ok: false, message: 'Anfrage zu groß.' }, 413);

  // 2) Body lesen und Größe hart begrenzen
  let raw: string;
  try { raw = await request.text(); } catch { return fail(request); }
  if (raw.length > MAX_BODY) return json({ ok: false, message: 'Anfrage zu groß.' }, 413);

  const data = parseData(raw, request.headers.get('Content-Type') || '');

  // 3) Honeypot: ist das unsichtbare Feld ausgefüllt → Bot.
  //    So tun als wäre alles gut, aber nichts speichern.
  if ((data.website && data.website.trim()) || (data._gotcha && data._gotcha.trim())) {
    return ok(request);
  }

  // 4) Felder normalisieren + begrenzen
  const name = clean(data.name || [data.vorname, data.nachname].filter(Boolean).join(' '), LIMITS.name);
  const email = clean(data.email, LIMITS.email);
  const telefon = clean(data.telefon, LIMITS.telefon);
  const plz = clean(data.plz, LIMITS.plz);
  const ort = clean(data.ort, LIMITS.ort);
  const produkt = clean(data.produkt, LIMITS.produkt);
  const betreff = clean(
    data.betreff || data._subject || (produkt ? 'Anfrage: ' + produkt : 'Neue Anfrage über die Website'),
    LIMITS.betreff
  );
  const nachricht = clean(data.nachricht || data.Zusammenfassung || data.message, LIMITS.nachricht);

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
    return fail(request);
  }

  return ok(request);
}
