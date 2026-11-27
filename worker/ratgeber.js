/* Ratgeber anfordern  →  POST /api/ratgeber  (27.11.2026)

   Der Browser schickt Name, E-Mail und das freiwillige Haekchen hierher.
   Der Worker prueft Bot-Falle und Groesse und reicht die Anmeldung an das
   CRM weiter, das den Link per Mail verschickt (Ablauf: Seite /ratgeber/,
   js/ratgeber-anfrage.js).

   WARUM UEBER DEN WORKER und nicht direkt vom Browser ans CRM: Das CRM
   nimmt nur Anfragen mit dem gemeinsamen Geheimnis im Kopf X-BV-Token an.
   Das Geheimnis darf nie in den Browser und nie in dieses oeffentliche
   Repository. Es liegt nur als Cloudflare-Secret ANFRAGEN_TOKEN beim Worker
   (setzt der Betreiber selbst).

   Konfiguration:
     - Secret ANFRAGEN_TOKEN (Pflicht)
     - Variable RATGEBER_ZIEL (optional), Adresse des CRM-Endpunkts.
   Fehlt das Secret, antwortet der Endpunkt mit 503 und die Seite sagt dem
   Besucher ehrlich, dass es gerade nicht geht. */

const ZIEL_STANDARD = 'https://crm.bv-aussensysteme.de/api/ratgeber/anmeldung';
const MAX_BODY = 4 * 1024;

function antwort(daten, status = 200) {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function sauber(wert, max) {
  return String(wert == null ? '' : wert).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

export async function handleRatgeber(request, env) {
  let roh;
  try { roh = await request.text(); } catch { return antwort({ ok: false }, 400); }
  if (roh.length > MAX_BODY) return antwort({ ok: false }, 413);
  let d;
  try { d = JSON.parse(roh); } catch { return antwort({ ok: false }, 400); }
  if (!d || typeof d !== 'object') return antwort({ ok: false }, 400);

  /* Bot-Falle: unsichtbares Feld ausgefuellt. So tun, als waere alles gut. */
  if (d.website && String(d.website).trim()) return antwort({ ok: true, mail: true });

  const token = String(env.ANFRAGEN_TOKEN || '').trim();
  if (!token) return antwort({ ok: false, fehler: 'nicht eingerichtet' }, 503);

  const nutzlast = {
    name: sauber(d.name, 120),
    email: sauber(d.email, 200),
    hinweise: d.hinweise === true,
    fassung: d.hinweise === true ? sauber(d.fassung, 20) : undefined,
    wortlaut: d.hinweise === true ? sauber(d.wortlaut, 1000) : undefined,
    seite: sauber(d.seite, 200),
    /* Kennung gegen doppelte Zustellung, falls der Abruf wiederholt wird. */
    externeId: crypto.randomUUID(),
  };
  if (!nutzlast.name || !nutzlast.email) return antwort({ ok: false }, 400);

  try {
    const r = await fetch(String(env.RATGEBER_ZIEL || ZIEL_STANDARD), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-bv-token': token },
      body: JSON.stringify(nutzlast),
    });
    const e = await r.json().catch(() => ({}));
    if (r.status === 429) return antwort({ ok: false, fehler: 'begrenzt' }, 429);
    if (!r.ok || !e.ok) return antwort({ ok: false }, 502);
    return antwort({ ok: true, mail: !!e.mail });
  } catch {
    /* Fehler nie an den Besucher durchreichen. */
    return antwort({ ok: false }, 502);
  }
}
