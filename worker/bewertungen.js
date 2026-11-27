/* Google-Bewertungen  →  GET /api/bewertungen  (27.11.2026)

   Holt Gesamtnote, Anzahl und die bis zu fuenf Bewertungen, die Google fuer
   unser Unternehmensprofil herausgibt, und reicht sie als schlankes JSON an
   die Startseite weiter (js/bewertungen.js).

   WARUM UEBER DEN WORKER und nicht mit einem Widget im Browser: Im Browser
   laedt dann nichts von Google oder einem Widget-Anbieter. Kein fremdes
   Skript, kein Cookie, keine Einwilligung noetig, und die Darstellung folgt
   unserem eigenen Design. Wunsch des Betreibers: Bewertungen „wie bei VD".

   NIE ERFINDEN. Fehlt der Schluessel oder antwortet Google nicht, liefert der
   Endpunkt {ok:false}; die Seite zeigt dann nur die Links zu Google und
   Trustindex wie bisher. Frueher standen auf der Seite erfundene Sterne,
   die wurden entfernt (docs/entscheidungen.md).

   Konfiguration (setzt der Betreiber bei Cloudflare):
     - Secret GOOGLE_PLACES_KEY  (Google Cloud, „Places API (New)")
     - Variable GOOGLE_PLACE_ID  (Kennung unseres Unternehmensprofils)

   ZWISCHENSPEICHER: 6 Stunden, im Speicher des Workers und im Cloudflare-
   Cache. Jede Abfrage bei Google kostet Kontingent; Bewertungen aendern sich
   selten. Auf der Vorschau-Adresse (workers.dev) greift der Cloudflare-Cache
   nicht, dort hilft nur der Speicher des Workers. */

const HALTEZEIT_S = 6 * 3600;
let speicher = null; // { bis: ms, daten: {...} }

function antwort(daten, status = 200) {
  return new Response(JSON.stringify(daten), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': daten.ok ? `public, max-age=${HALTEZEIT_S}` : 'no-store',
    },
  });
}

/* Nur das, was die Seite anzeigt. Text unveraendert (Google verlangt, dass
   Bewertungen nicht veraendert werden), Name wie bei Google angegeben. */
function aufbereiten(roh) {
  const bewertungen = (roh.reviews || [])
    .map((r) => ({
      name: String((r.authorAttribution && r.authorAttribution.displayName) || '').slice(0, 80),
      sterne: Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0))),
      text: String((r.originalText && r.originalText.text) || (r.text && r.text.text) || '').slice(0, 2000),
      wann: String(r.relativePublishTimeDescription || '').slice(0, 40),
      datum: String(r.publishTime || '').slice(0, 10),
      link: typeof r.googleMapsUri === 'string' ? r.googleMapsUri : '',
    }))
    .filter((b) => b.name && b.text && b.sterne > 0);
  return {
    ok: true,
    note: Number(roh.rating) || null,
    anzahl: Number(roh.userRatingCount) || 0,
    profil: typeof roh.googleMapsUri === 'string' ? roh.googleMapsUri : '',
    bewertungen,
    stand: new Date().toISOString(),
  };
}

export async function handleBewertungen(request, env, ctx) {
  const schluessel = String(env.GOOGLE_PLACES_KEY || '').trim();
  const ort = String(env.GOOGLE_PLACE_ID || '').trim();
  if (!schluessel || !/^[A-Za-z0-9_-]{10,200}$/.test(ort)) {
    return antwort({ ok: false, grund: 'nicht eingerichtet' });
  }

  const jetzt = Date.now();
  if (speicher && speicher.bis > jetzt) return antwort(speicher.daten);

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(new URL('/api/bewertungen?v=1', request.url).toString());
  if (cache) {
    const treffer = await cache.match(cacheKey).catch(() => null);
    if (treffer) return treffer;
  }

  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(ort)}?languageCode=de`, {
      headers: {
        'X-Goog-Api-Key': schluessel,
        'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
      },
    });
    if (!r.ok) return antwort({ ok: false, grund: 'google ' + r.status }, 502);
    const daten = aufbereiten(await r.json());
    if (!daten.note || !daten.anzahl) return antwort({ ok: false, grund: 'keine bewertungen' });
    speicher = { bis: jetzt + HALTEZEIT_S * 1000, daten };
    const fertig = antwort(daten);
    if (cache) {
      const ablage = cache.put(cacheKey, fertig.clone()).catch(() => {});
      if (ctx && ctx.waitUntil) ctx.waitUntil(ablage);
    }
    return fertig;
  } catch {
    return antwort({ ok: false, grund: 'nicht erreichbar' }, 502);
  }
}
