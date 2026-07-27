/**
 * Cloudflare Pages Function – POST /api/kontakt
 * ------------------------------------------------------------------
 * Nimmt Kontakt-/Anfrage-Einsendungen der Website entgegen und
 *   1. schreibt sie in die PostgreSQL-Datenbank (Neon, über HTTP)
 *   2. schickt sie parallel per E-Mail an info@bv-aussensysteme.de
 *      (kostenloser Versand über Web3Forms)
 *
 * Sicherheit (öffentliches Repository!):
 *   - Verbindungsdaten NUR als Cloudflare-Secrets (ANFRAGEN_DB,
 *     WEB3FORMS_KEY) – niemals im Quelltext.
 *   - Nur POST, Einsendungen > 50 KB werden abgelehnt.
 *   - Honeypot-Feld gegen Bots (unsichtbares "website"-Feld).
 *   - Längenbegrenzung aller Eingaben.
 *   - Datenbankfehler werden NIE an den Besucher durchgereicht.
 *
 * Wichtig für „nichts darf kaputtgehen": Die E-Mail an info@ ist der
 * kritische Pfad (wie bisher bei Formspree). Schlägt der DB-Schreib-
 * vorgang fehl, wird das nur geloggt – die Anfrage geht trotzdem als
 * E-Mail raus und der Besucher bekommt eine Bestätigung.
 */

import { neon } from '@neondatabase/serverless';

interface Env {
  ANFRAGEN_DB: string;   // Neon-Connection-String (Secret)
  WEB3FORMS_KEY: string; // Web3Forms Access Key (Secret)
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

/* Antwort abhängig davon, ob der Aufruf per JS (fetch) oder als
   klassisches HTML-Formular (ohne JS) kam. */
function ok(request: Request): Response {
  const accept = request.headers.get('Accept') || '';
  if (accept.indexOf('application/json') > -1) {
    return json({ ok: true, message: 'Vielen Dank! Ihre Anfrage ist bei uns eingegangen.' });
  }
  // Klassisches Formular ohne JS → auf die Danke-Seite weiterleiten
  return Response.redirect(new URL('/danke.html', request.url).toString(), 303);
}

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
async function readData(request: Request): Promise<Record<string, string>> {
  const ct = (request.headers.get('Content-Type') || '').toLowerCase();
  const out: Record<string, string> = {};
  if (ct.indexOf('application/json') > -1) {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === 'object') {
      for (const k of Object.keys(body as object)) {
        const v = (body as Record<string, unknown>)[k];
        if (v != null && typeof v !== 'object') out[k] = String(v);
      }
    }
  } else {
    const form = await request.formData();
    for (const [k, v] of form.entries()) {
      if (typeof v === 'string') out[k] = v;
    }
  }
  return out;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // 1) Größenlimit (früh, anhand Content-Length falls vorhanden)
  const len = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (len && len > MAX_BODY) {
    return json({ ok: false, message: 'Anfrage zu groß.' }, 413);
  }

  // 2) Rohtext lesen und Größe hart begrenzen
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(request);
  }
  if (raw.length > MAX_BODY) {
    return json({ ok: false, message: 'Anfrage zu groß.' }, 413);
  }

  // Request mit bereits gelesenem Body nachbilden, um readData zu nutzen
  const rebuilt = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: raw,
  });

  let data: Record<string, string>;
  try {
    data = await readData(rebuilt);
  } catch {
    return fail(request);
  }

  // 3) Honeypot: ist das unsichtbare Feld ausgefüllt → Bot.
  //    So tun als wäre alles gut, aber nichts speichern/senden.
  if ((data.website && data.website.trim()) || (data._gotcha && data._gotcha.trim())) {
    return ok(request);
  }

  // 4) Felder normalisieren
  const name = clean(
    data.name || [data.vorname, data.nachname].filter(Boolean).join(' '),
    LIMITS.name
  );
  const email = clean(data.email, LIMITS.email);
  const telefon = clean(data.telefon, LIMITS.telefon);
  const plz = clean(data.plz, LIMITS.plz);
  const ort = clean(data.ort, LIMITS.ort);
  const produkt = clean(data.produkt, LIMITS.produkt);
  const betreff = clean(
    data.betreff || data._subject || (produkt ? 'Anfrage: ' + produkt : 'Neue Anfrage über die Website'),
    LIMITS.betreff
  );
  const nachricht = clean(
    data.nachricht || data.Zusammenfassung || data.message,
    LIMITS.nachricht
  );

  const externeId = crypto.randomUUID();
  const rohdaten = JSON.stringify({ ...data, _empfangen: new Date().toISOString(), _externe_id: externeId });

  // 5) Kritischer Pfad zuerst: E-Mail an info@ (wie bisher).
  //    Schlägt sie fehl, bekommt der Besucher die Bitte anzurufen.
  let mailOk = false;
  try {
    mailOk = await sendEmail(env, { name, email, telefon, plz, ort, produkt, betreff, nachricht, externeId });
  } catch (err) {
    console.log('E-Mail-Versand fehlgeschlagen:', String(err));
  }

  // 6) Datenbank (best effort). Fehler NIE an den Besucher durchreichen.
  try {
    const sql = neon(env.ANFRAGEN_DB);
    await sql`
      insert into anfragen
        (quelle, externe_id, name, email, telefon, plz, ort, produkt, betreff, nachricht, rohdaten)
      values
        ('website', ${externeId}, ${name}, ${email}, ${telefon}, ${plz}, ${ort}, ${produkt}, ${betreff}, ${nachricht}, ${rohdaten}::jsonb)
    `;
  } catch (err) {
    // Nur loggen – die Anfrage ist per E-Mail bereits raus.
    console.log('DB-Insert fehlgeschlagen (Anfrage', externeId, '):', String(err));
  }

  // Erfolg, sobald mindestens die E-Mail durchging (Business-kritisch).
  return mailOk ? ok(request) : fail(request);
}

/* E-Mail-Versand über Web3Forms (kostenlos). Gibt true bei Erfolg. */
async function sendEmail(
  env: Env,
  f: {
    name: string | null; email: string | null; telefon: string | null;
    plz: string | null; ort: string | null; produkt: string | null;
    betreff: string | null; nachricht: string | null; externeId: string;
  }
): Promise<boolean> {
  if (!env.WEB3FORMS_KEY) return false;

  const ortLine = [f.plz, f.ort].filter(Boolean).join(' ');
  const payload = {
    access_key: env.WEB3FORMS_KEY,
    subject: f.betreff || 'Neue Anfrage über die Website',
    from_name: 'BV AussenSysteme Website',
    // Web3Forms schickt alle Felder lesbar in der E-Mail mit:
    Name: f.name || '–',
    'E-Mail': f.email || '–',
    Telefon: f.telefon || '–',
    Ort: ortLine || '–',
    Produkt: f.produkt || '–',
    Nachricht: f.nachricht || '–',
    'Anfrage-ID': f.externeId,
    replyto: f.email || '',
  };

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return false;
  const body = (await res.json().catch(() => ({}))) as { success?: boolean };
  return body.success === true;
}
