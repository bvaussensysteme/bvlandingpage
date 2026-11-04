import { neon } from '@neondatabase/serverless';

/* Die Rechenregeln liegen in js/bauteile.js – derselben Datei, die auch die
   Prüfskripte verwenden. Sie wird hier mitgebündelt und setzt sich auf
   globalThis.BVBauteile. Zwei Kopien derselben Regeln würden auseinander
   laufen; deshalb eine Datei für Browser, Prüfung und Worker. */
import bauteileModul from '../js/bauteile.js';

/* js/bauteile.js läuft in drei Umgebungen: im Browser setzt es sich auf
   window, unter Node liefert es module.exports, und der Worker-Bundler
   behandelt es als CommonJS – dann kommt es als Default-Export an. Deshalb
   beide Wege. */
const BV = bauteileModul || globalThis.BVBauteile;

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

    if (url.pathname === '/api/bauteile' && request.method === 'GET') {
      return handleBauteile(url, env);
    }

    if (url.pathname === '/api/teilen' && request.method === 'POST') {
      return handleTeilenNeu(request, env);
    }

    /* Eigene Reichweitenmessung. Nimmt nur ENTGEGEN - gelesen wird
       ausschliesslich hinter dem Werkstatt-Passwort, siehe unten. */
    if (url.pathname === '/api/messung' && request.method === 'POST') {
      return handleMessung(request, env);
    }

    if (url.pathname.startsWith('/k/')) {
      return handleTeilenOeffnen(url, env);
    }

    /* Der oeffentliche 3D-Konfigurator ist vorübergehend gesperrt,
       solange er ueberarbeitet wird. Zum Zurueckschalten genuegt
       KONFIGURATOR_GESPERRT = false - die Seite selbst ist unberuehrt,
       und alle Verweise aus Ratgebern und Staedteseiten bleiben
       bestehen. Die Werkstatt ist davon nicht betroffen. */
    if (KONFIGURATOR_GESPERRT && KONFIGURATOR_PFADE.has(url.pathname)) {
      return konfiguratorGesperrtSeite();
    }

    /* Werkstatt: nicht oeffentliche Erprobungsseite. Muss VOR der
       Auslieferung der Dateien stehen - sonst laege die Seite offen. */
    if (url.pathname === '/werkstatt' || url.pathname.startsWith('/werkstatt/')) {
      const abweisung = await werkstattTor(request, env, url);
      if (abweisung) return abweisung;

      /* Die Zahlen liegen UNTER /werkstatt/ und nicht unter /api/ - und
         das ist der ganze Trick: Der Anmelde-Keks hat Path=/werkstatt,
         also schickt der Browser ihn nur an Adressen darunter. Unter
         /api/zahlen kaeme er nicht mit, die Abfrage waere unangemeldet,
         und die Zahlen muessten eine zweite Schranke bekommen. Hier
         gilt dieselbe Tuer wie fuer die Seite selbst: Wer hier
         ankommt, ist schon durch werkstattTor() gegangen. */
      if (url.pathname === '/werkstatt/api/zahlen' && request.method === 'GET') {
        return handleZahlen(url, env);
      }
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


/* ============================================================
   Kurzlink für geteilte Planungen
     POST /api/teilen   {code}  ->  {id, kurz}
     GET  /k/<id>               ->  302 auf /konfigurator#k=<code>

   WARUM ÜBERHAUPT: „die links sind riesig, besser nen kurzlink wie bei
   bitly" (Betreiber, 25.10.2026, mit Bild einer WhatsApp-Nachricht, in
   der der lange Link über zehn Zeilen lief).

   WARUM NICHT BIT.LY: Deren Schnittstelle verlangt einen geheimen
   Schlüssel. Im Browser läge der offen – ein Kurzlink braucht also so
   oder so eine Serverfunktion. Und dann ist die eigene besser: kein
   Dritter sieht IP, Zeitpunkt und Browser jedes Empfängers, und der
   Link stirbt nicht mit einem fremden Konto.

   WARUM OHNE NEUE INFRASTRUKTUR: Die Datenbank für die Anfragen ist
   schon da (Neon, Secret ANFRAGEN_DB). Der Kurzlink braucht nur eine
   zweite Tabelle, die sich beim ersten Aufruf selbst anlegt. KEIN
   KV-Namensraum nötig – der fehlt bis heute und hätte das hier sonst
   aufgehalten.

   WAS GESPEICHERT WIRD: ausschließlich die Planung (Maße, Farbe,
   Ausstattung) und zwei Zeitstempel. Kein Name, keine Adresse, keine
   IP. Gleiche Planung = gleicher Kurzlink (die Prüfsumme ist eindeutig),
   deshalb wächst die Tabelle nicht mit jedem Klick.

   Sicherheit (öffentliches Repository, offener Endpunkt):
     - nur POST, Body hart auf 8 KB begrenzt
     - der Code muss aussehen wie unser Code (Base64-URL, 20–6000 Zeichen)
     - Datenbankfehler gehen nie an den Besucher; der Browser behält
       dann einfach den langen Link
   ============================================================ */
const TEILEN_MAX = 6000;          // Zeichen im Code
const TEILEN_MAX_BODY = 8 * 1024;
/* Ohne I, L, O, U: Diese Zeichen werden beim Abtippen oder Vorlesen mit
   1, 0 und V verwechselt – und vorlesbar zu sein ist der ganze Zweck. */
const TEILEN_ZEICHEN = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
/* WO DIE TABELLE STEHT – und warum der Server sich selbst zu helfen weiss.

   Zwei moegliche Orte:
     1. "public"  - der Normalfall.
     2. "bv"      - ein eigenes Schema, das sich der Server anlegt, wenn
                    er in "public" nichts anlegen darf.

   ANLASS. Ab PostgreSQL 15 darf nicht mehr jede Rolle im Schema "public"
   Tabellen anlegen. Genau daran ist der erste Versuch live gescheitert:
   POST /api/teilen antwortete 502 mit {"schritt":"tabelle"}. Der Plan
   war, den fehlenden Befehl einmal von Hand in der Neon-Konsole
   nachzutragen. Das ist am 25.10.2026 daran gescheitert, dass dem
   Betreiber SQL nichts sagt - "is mir zu kompliziert xd keine ahnung".

   Eine Funktion, die eine Handarbeit voraussetzt, die niemand machen
   will, ist nicht fertig. Deshalb raeumt sich der Server den Platz jetzt
   selbst ein: Ein eigenes Schema anzulegen braucht ein ANDERES Recht
   (CREATE an der Datenbank) als in "public" zu schreiben, und das hat
   die Rolle in aller Regel - auch dann, wenn ihr "public" verschlossen
   ist. Faellt der Normalfall aus, weicht der Server also nach "bv" aus.

   Der gefundene Ort wird je Server-Instanz gemerkt, nicht bei jedem
   Aufruf gesucht. Nach einem Fehlschlag gilt eine Pause, damit nicht
   jeder Besucher denselben aussichtslosen Versuch ausloest. */
let teilenOrt = null;                       // 'public' | 'bv' | null
let teilenPause = 0;                        // Zeitpunkt, ab dem wieder probiert wird
const TEILEN_PAUSE_MS = 5 * 60 * 1000;

/* Dieselben Abfragen, einmal je Ort. Ein Tabellenname laesst sich in SQL
   nicht als Wert einsetzen (das geht nur mit Werten), deshalb steht hier
   beides ausgeschrieben statt zusammengebaut - so kann kein Text aus
   einer Anfrage je in einen Befehl geraten. */
const TEILEN_SPALTEN =
  'id text primary key, code text not null, code_hash text not null unique, ' +
  'erstellt timestamptz not null default now(), zuletzt timestamptz';
const TEILEN_SQL = {
  public: {
    probe:     (sql) => sql`select 1 from teilen_links limit 1`,
    nachHash:  (sql, h) => sql`select id from teilen_links where code_hash = ${h}`,
    nachId:    (sql, i) => sql`select code_hash from teilen_links where id = ${i}`,
    code:      (sql, i) => sql`select code from teilen_links where id = ${i}`,
    beruehren: (sql, i) => sql`update teilen_links set zuletzt = now() where id = ${i}`,
    einfuegen: (sql, i, c, h) => sql`
      insert into teilen_links (id, code, code_hash)
      values (${i}, ${c}, ${h})
      on conflict (code_hash) do nothing`,
    anlegen:   (sql) => sql`
      create table if not exists teilen_links (
        id         text primary key,
        code       text not null,
        code_hash  text not null unique,
        erstellt   timestamptz not null default now(),
        zuletzt    timestamptz
      )`
  },
  bv: {
    probe:     (sql) => sql`select 1 from bv.teilen_links limit 1`,
    nachHash:  (sql, h) => sql`select id from bv.teilen_links where code_hash = ${h}`,
    nachId:    (sql, i) => sql`select code_hash from bv.teilen_links where id = ${i}`,
    code:      (sql, i) => sql`select code from bv.teilen_links where id = ${i}`,
    beruehren: (sql, i) => sql`update bv.teilen_links set zuletzt = now() where id = ${i}`,
    einfuegen: (sql, i, c, h) => sql`
      insert into bv.teilen_links (id, code, code_hash)
      values (${i}, ${c}, ${h})
      on conflict (code_hash) do nothing`,
    anlegen:   (sql) => sql`
      create table if not exists bv.teilen_links (
        id         text primary key,
        code       text not null,
        code_hash  text not null unique,
        erstellt   timestamptz not null default now(),
        zuletzt    timestamptz
      )`
  }
};

/* Nur die fuenfstellige Fehlernummer von PostgreSQL (42501 = keine
   Rechte, 42P01 = Tabelle gibt es nicht, 28P01 = Anmeldung abgelehnt),
   nie der Meldungstext: Der kann Rollen-, Host- oder Tabellennamen
   enthalten, und dieser Endpunkt ist oeffentlich. Die Nummer allein
   genuegt, um von aussen zu erkennen, woran es klemmt - ohne Zugang zu
   den Server-Protokollen. */
function teilenFehlerNr(err) {
  const c = err && (err.code || (err.sourceError && err.sourceError.code));
  return (typeof c === 'string' && /^[0-9A-Z]{5}$/.test(c)) ? c : null;
}

/* Nur nachsehen, nichts anlegen - fuer den Aufruf eines fertigen Links.
   Ein Besucher, der einen Link oeffnet, soll keine Tabellen erzeugen. */
async function teilenOrtSuchen(sql) {
  if (teilenOrt) return teilenOrt;
  for (const ort of ['public', 'bv']) {
    try { await TEILEN_SQL[ort].probe(sql); teilenOrt = ort; return ort; }
    catch (e) { /* naechster Ort */ }
  }
  return null;
}

/* Nachsehen und notfalls anlegen - fuer das Erzeugen eines Links. */
async function teilenOrtFinden(sql) {
  const da = await teilenOrtSuchen(sql);
  if (da) return da;
  if (Date.now() < teilenPause) return null;
  try {
    await TEILEN_SQL.public.anlegen(sql);
    teilenOrt = 'public';
    return 'public';
  } catch (e) {
    console.log('Kurzlink: "public" verschlossen (' +
                (teilenFehlerNr(e) || 'ohne Nummer') + '), weiche auf "bv" aus');
  }
  await sql`create schema if not exists bv`;
  await TEILEN_SQL.bv.anlegen(sql);
  teilenOrt = 'bv';
  return 'bv';
}

async function teilenHash(code) {
  const roh = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return [...new Uint8Array(roh)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Aus der Pruefsumme eine kurze, vorlesbare Kennung. Laenge waechst nur,
   wenn die kurze schon vergeben ist (andere Planung, gleicher Anfang). */
function teilenId(hash, laenge) {
  let aus = '';
  for (let i = 0; i < laenge; i++) {
    const wert = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
    aus += TEILEN_ZEICHEN[wert % TEILEN_ZEICHEN.length];
  }
  return aus;
}

async function handleTeilenNeu(request, env) {
  const len = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (len && len > TEILEN_MAX_BODY) return jsonResponse({ ok: false }, 413);
  let raw;
  try { raw = await request.text(); } catch { return jsonResponse({ ok: false }, 400); }
  if (raw.length > TEILEN_MAX_BODY) return jsonResponse({ ok: false }, 413);

  let code = '';
  try { code = String((JSON.parse(raw) || {}).code || ''); } catch { code = ''; }
  if (!/^[A-Za-z0-9_-]{20,6000}$/.test(code) || code.length > TEILEN_MAX) {
    return jsonResponse({ ok: false, message: 'Ungültiger Code.' }, 400);
  }
  if (!env.ANFRAGEN_DB) return jsonResponse({ ok: false }, 503);

  let schritt = 'start';
  try {
    const sql = neon(env.ANFRAGEN_DB);
    const hash = await teilenHash(code);

    schritt = 'tabelle';
    const ort = await teilenOrtFinden(sql);
    if (!ort) return jsonResponse({ ok: false, schritt: 'tabelle' }, 503);
    const Q = TEILEN_SQL[ort];

    schritt = 'suchen';
    const da = await Q.nachHash(sql, hash);
    if (da.length) return jsonResponse({ ok: true, id: da[0].id });

    schritt = 'schreiben';
    for (let laenge = 6; laenge <= 12; laenge++) {
      const id = teilenId(hash, laenge);
      const belegt = await Q.nachId(sql, id);
      if (belegt.length) {
        if (belegt[0].code_hash === hash) return jsonResponse({ ok: true, id });
        continue;                        // andere Planung, eine Stelle mehr
      }
      await Q.einfuegen(sql, id, code, hash);
      return jsonResponse({ ok: true, id });
    }
    return jsonResponse({ ok: false }, 503);
  } catch (err) {
    if (schritt === 'tabelle') { teilenOrt = null; teilenPause = Date.now() + TEILEN_PAUSE_MS; }
    console.log('Kurzlink fehlgeschlagen bei', schritt, ':', String(err));
    return jsonResponse({ ok: false, schritt, nr: teilenFehlerNr(err) }, 502);
  }
}

function teilenNichtDa(url) {
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Link nicht gefunden</title>' +
    '<body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:0 20px;line-height:1.6">' +
    '<h1>Diesen Link gibt es nicht</h1>' +
    '<p>Der Kurzlink ist unvollständig oder falsch abgetippt. ' +
    'Bitte fragen Sie den Absender nach einem frischen Link – oder planen Sie selbst.</p>' +
    '<p><a href="/konfigurator">Zum 3D-Konfigurator</a></p></body>',
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

async function handleTeilenOeffnen(url, env) {
  const id = url.pathname.slice(3).replace(/\/+$/, '').toUpperCase();
  if (!/^[0-9A-Z]{4,16}$/.test(id) || !env.ANFRAGEN_DB) return teilenNichtDa(url);
  try {
    const sql = neon(env.ANFRAGEN_DB);
    const ort = await teilenOrtSuchen(sql);
    if (!ort) return teilenNichtDa(url);
    const Q = TEILEN_SQL[ort];
    const rows = await Q.code(sql, id);
    if (!rows.length) return teilenNichtDa(url);
    /* Wann der Link zuletzt gebraucht wurde – die Grundlage dafür, später
       einmal aufzuräumen. Schlägt das fehl, ist das egal. */
    try { await Q.beruehren(sql, id); } catch { /* egal */ }
    const ziel = new URL('/konfigurator', url);
    ziel.hash = 'k=' + rows[0].code;
    return Response.redirect(ziel.toString(), 302);
  } catch (err) {
    console.log('Kurzlink-Aufruf fehlgeschlagen:', String(err));
    return teilenNichtDa(url);
  }
}

/* ============================================================
   Stückliste  →  GET /api/bauteile

   Warum überhaupt serverseitig?
   Die Sparren- und Stützfußmatrix der VD-Preislisten darf nicht an den
   Browser ausgeliefert werden: Sie ist eine systematische Übernahme aus den
   Preislisten des Herstellers, daran besteht ein Datenbankherstellerrecht
   (§§ 87a ff. UrhG). Die Quelle (privates Repository bv-crm,
   docs/konfigurator-daten/README.md) hält ausdrücklich fest, dass ein
   Konfigurator zulässig ist, der nur **Ergebnisse** zeigt – „dann liegen die
   Daten auf dem Server, nicht beim Besucher". Genau das macht dieser
   Endpunkt: Er bekommt ein Maß und antwortet mit einer Stückliste, nie mit
   der Tabelle.

   Die Matrix steht deshalb NICHT im Repository, sondern im KV-Speicher
   (Binding DACHMATRIX, Schlüssel "matrix"). Einspielen:

     npx wrangler kv namespace create DACHMATRIX
     # die ausgegebene id in wrangler.jsonc eintragen
     node scripts/baue-dachmatrix.js
     npx wrangler kv key put --binding DACHMATRIX matrix \
       --path js/dachmatrix-daten.json --remote

   Fehlt das Binding oder der Schlüssel, antwortet der Endpunkt mit 503 und
   einer verständlichen Meldung. Der Konfigurator zeigt dann die geschätzte
   Skizze – die Seite bleibt benutzbar.
   ============================================================ */

let matrixGeladen = false;

async function matrixLaden(env) {
  const B = BV;
  if (!B) return false;
  /* Erst das Binding prüfen, dann den Zwischenspeicher. Fehlt der
     KV-Speicher, soll der Endpunkt das sagen und nicht aus einem alten
     Stand antworten – sonst bliebe ein kaputter Deploy unbemerkt. */
  if (!env.DACHMATRIX) return false;
  if (matrixGeladen && B.matrixVorhanden()) return true;
  try {
    const roh = await env.DACHMATRIX.get('matrix', { type: 'json' });
    if (!roh) return false;
    B.matrixSetzen(roh);
    matrixGeladen = true;
    return B.matrixVorhanden();
  } catch (e) {
    return false;
  }
}

function zahl(wert, min, max) {
  const n = parseInt(wert, 10);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

async function handleBauteile(url, env) {
  const B = BV;
  const da = await matrixLaden(env);
  if (!B || !da) {
    return jsonResponse({
      fehler: 'Herstellerdaten nicht verfügbar',
      hinweis: 'Der Konfigurator zeigt so lange eine geschätzte Darstellung.',
    }, 503);
  }

  const p = url.searchParams;

  /* Welche Maße es überhaupt gibt – einmal beim Laden der Seite.
     Das sind die lieferbaren Größen, nicht die Stückzahlen. */
  if (p.get('raster') === '1') {
    const aus = {};
    B.systeme().forEach((system) => {
      B.materialien(system).forEach((material) => {
        aus[system + '|' + material] = {
          breiten: B.breiten(system, material),
          tiefen: B.tiefen(system, material),
        };
      });
    });
    return cacheAntwort({ raster: aus, neigung: B.NEIGUNG });
  }

  const system = String(p.get('system') || '').slice(0, 20);
  const material = String(p.get('material') || '').slice(0, 20);
  const breite = zahl(p.get('breite'), 100, 20000);
  const tiefe = zahl(p.get('tiefe'), 100, 20000);
  if (!system || !material || breite === null || tiefe === null) {
    return jsonResponse({ fehler: 'system, material, breite und tiefe werden gebraucht' }, 400);
  }

  const optionen = {};
  if (p.get('freistehend') === '1') optionen.freistehend = true;
  if (p.get('statiktraeger') === '0') optionen.statiktraeger = false;
  if (p.get('statiktraeger') === '1') optionen.statiktraeger = true;

  const e = B.bauteile(system, material, breite, tiefe, optionen);
  if (e.fehler) return jsonResponse(e, 404);
  return cacheAntwort(e);
}

/* Die Antworten hängen nur an den Eingabewerten und ändern sich erst mit
   einer neuen Preisliste – eine Stunde Cache spart Aufrufe und macht die
   Bedienung flüssig. */
function cacheAntwort(daten) {
  return new Response(JSON.stringify(daten), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

/* ===================== Werkstatt: Passwortschranke =====================

   Die Werkstatt ist die Erprobungsseite des Betreibers. Dort ist
   freigeschaltet, was auf der oeffentlichen Seite noch nichts zu suchen
   hat. Der Zugang haengt an EINEM Passwort, das als Secret in Cloudflare
   liegt (WERKSTATT_PASSWORT) - nicht im Repository.

   Grundsatz: IM ZWEIFEL ZU. Ist kein Passwort hinterlegt, ist die Seite
   fuer alle gesperrt. Ein Schutz, der bei fehlender Einstellung still
   aufmacht, ist keiner - und genau so entstehen die Faelle, in denen eine
   Testseite monatelang offen im Netz steht, ohne dass es jemand merkt.

   Was die Schranke NICHT leistet: Sie schuetzt die Seite, nicht den Code.
   js/konfigurator-3d.js wird auch von der oeffentlichen Seite geladen und
   ist damit lesbar. Einschalten laesst sich die Aussparung dort trotzdem
   nicht - das haengt am Pfad. Wer die unfertige Funktion wirklich
   verbergen muesste, braeuchte eine eigene Datei; das waere ein zweiter
   Stand und damit die groessere Gefahr.                                */

const WERKSTATT_KEKS = 'bv_werkstatt';
const WERKSTATT_TAGE = 30;

async function werkstattToken(passwort) {
  const roh = new TextEncoder().encode('bv-werkstatt:' + passwort);
  const hash = await crypto.subtle.digest('SHA-256', roh);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

function keksLesen(request, name) {
  const roh = request.headers.get('cookie') || '';
  for (const teil of roh.split(';')) {
    const i = teil.indexOf('=');
    if (i > 0 && teil.slice(0, i).trim() === name) return teil.slice(i + 1).trim();
  }
  return null;
}

/* Vergleich in konstanter Zeit: Ein Vergleich, der beim ersten
   abweichenden Zeichen abbricht, verraet ueber die Antwortzeit, wie viele
   Zeichen stimmen. Hier wird immer bis zum Ende gerechnet. */
function gleichInKonstanterZeit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let rest = 0;
  for (let i = 0; i < a.length; i++) rest |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return rest === 0;
}

function werkstattSeite(inhalt, status) {
  return new Response(
    '<!doctype html><html lang="de"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">'
    + '<title>Werkstatt</title><style>'
    + 'body{margin:0;min-height:100vh;display:grid;place-items:center;'
    + 'background:#f3f5f7;color:#1f2a33;'
    + 'font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '.k{background:#fff;border-radius:12px;padding:28px 26px;max-width:420px;'
    + 'width:calc(100% - 32px);box-shadow:0 2px 16px rgba(31,42,51,.10)}'
    + 'h1{margin:0 0 6px;font-size:20px}p{margin:0 0 16px;color:#4a5962}'
    + 'label{display:block;font-weight:600;margin:0 0 6px;font-size:14px}'
    + 'input{width:100%;box-sizing:border-box;padding:11px 12px;font-size:16px;'
    + 'border:1px solid #c6d0d6;border-radius:8px}'
    + 'button{margin-top:14px;width:100%;padding:12px;font-size:16px;font-weight:600;'
    + 'border:0;border-radius:8px;background:#1f2a33;color:#fff;cursor:pointer}'
    + '.f{margin:0 0 14px;padding:10px 12px;border-radius:8px;'
    + 'background:#fdecec;color:#8c2f2f;font-size:14px}'
    + '.h{margin:16px 0 0;font-size:13px;color:#6b7a84}'
    + '</style></head><body><div class="k">' + inhalt + '</div></body></html>',
    {
      status: status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
      },
    }
  );
}

function anmeldeSeite(fehler) {
  return werkstattSeite(
    '<h1>Werkstatt</h1>'
    + '<p>Nicht &ouml;ffentliche Erprobungsseite.</p>'
    + (fehler ? '<p class="f">' + fehler + '</p>' : '')
    + '<form method="POST">'
    + '<label for="p">Passwort</label>'
    + '<input id="p" name="passwort" type="password" autocomplete="current-password" '
    + 'autofocus required>'
    + '<button type="submit">Anmelden</button>'
    + '</form>'
    + '<p class="h">Die Anmeldung gilt auf diesem Ger&auml;t '
    + WERKSTATT_TAGE + ' Tage.</p>',
    fehler ? 401 : 200
  );
}

async function werkstattTor(request, env, url) {
  /* Leerraum aussen wird abgeschnitten - auf BEIDEN Seiten. Beim
     Einfuegen in die Cloudflare-Maske rutscht leicht ein Leerzeichen
     oder Zeilenumbruch mit ans Ende; der gehoert dann zum Passwort,
     ist aber nirgends zu sehen. Das Ergebnis waere ein Passwort, das
     niemand mehr eingeben kann - auch der Betreiber nicht. Ein
     Passwort, das absichtlich mit Leerzeichen endet, gibt es nicht. */
  const passwort = String(env.WERKSTATT_PASSWORT || '').trim();

  /* Kein Passwort hinterlegt -> zu. Mit Anleitung, damit klar ist, was
     zu tun ist, und ohne zu verraten, was auf der Seite liegt. */
  if (!passwort) {
    return werkstattSeite(
      '<h1>Werkstatt gesperrt</h1>'
      + '<p>Es ist noch kein Passwort hinterlegt. Solange bleibt die Seite '
      + 'f&uuml;r alle gesperrt.</p>'
      + '<p class="h">Cloudflare &rarr; Workers &amp; Pages &rarr; bvlanding '
      + '&rarr; Settings &rarr; Variables and Secrets &rarr; Add &rarr; Typ '
      + '<b>Secret</b>, Name <b>WERKSTATT_PASSWORT</b>, Wert: das gew&uuml;nschte '
      + 'Passwort &rarr; Deploy.</p>',
      503
    );
  }

  const erwartet = await werkstattToken(passwort);

  /* Anmeldung */
  if (request.method === 'POST') {
    let eingabe = '';
    try {
      const daten = await request.formData();
      eingabe = String(daten.get('passwort') || '').trim();
    } catch (e) { eingabe = ''; }

    if (!gleichInKonstanterZeit(await werkstattToken(eingabe), erwartet)) {
      /* Kurze Bremse: macht das Durchprobieren unattraktiv, ohne einen
         ehrlichen Tippfehler sp&uuml;rbar zu bestrafen. */
      await new Promise((r) => setTimeout(r, 700));
      return anmeldeSeite('Passwort stimmt nicht.');
    }

    return new Response(null, {
      status: 303,
      headers: {
        location: url.pathname + url.search,
        'cache-control': 'no-store',
        'set-cookie': WERKSTATT_KEKS + '=' + erwartet
          + '; Path=/werkstatt; Max-Age=' + (WERKSTATT_TAGE * 24 * 60 * 60)
          + '; HttpOnly; Secure; SameSite=Lax',
      },
    });
  }

  /* Bereits angemeldet? Der Keks haengt am Passwort: Wird es geaendert,
     sind alle alten Anmeldungen sofort ungueltig. */
  if (gleichInKonstanterZeit(keksLesen(request, WERKSTATT_KEKS) || '', erwartet)) {
    return null;                        // durchlassen
  }

  return anmeldeSeite('');
}

/* ============== Konfigurator vorübergehend gesperrt ==============

   Entscheidung des Betreibers am 31.10.2026: Der 3D-Konfigurator soll
   von der oeffentlichen Website verschwinden, bis er fertig ist und er
   ihn freigibt. Gearbeitet wird solange in der Werkstatt.

   Warum hier und nicht in den Seiten: Der Konfigurator ist von rund
   zwanzig Seiten verlinkt - Kopfzeile, Fusszeile, jeder Ratgeber, die
   Staedteseiten. Diese Verweise einzeln zu entfernen und spaeter wieder
   einzusetzen waere viel Arbeit und jedes Mal eine Gelegenheit, einen
   zu vergessen. Hier ist es EINE Zeile, in beide Richtungen.

   Warum 503 und nicht 404 oder eine Weiterleitung: 503 heisst
   "voruebergehend nicht verfuegbar". Suchmaschinen behalten die Adresse
   im Bestand und nehmen den Hinweistext nicht in den Index. Ein 404
   oder ein noindex wuerde die Seite dagegen abschreiben, und der
   aufgebaute Rang waere bei der Rueckkehr weg. Retry-After sagt
   zusaetzlich, dass es sich lohnt, wieder vorbeizuschauen.          */

const KONFIGURATOR_GESPERRT = true;
const KONFIGURATOR_PFADE = new Set([
  '/konfigurator', '/konfigurator/', '/konfigurator.html',
]);

function konfiguratorGesperrtSeite() {
  const html = '<!doctype html><html lang="de"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>3D-Konfigurator wird \u00fcberarbeitet \u2013 BV AussenSysteme</title>'
    + '<style>'
    + ':root{--ink:#1f2a33;--gold:#c8a04a}'
    + '*{box-sizing:border-box}'
    + 'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;'
    + 'background:#f3f5f7;color:var(--ink);'
    + 'font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}'
    + '.k{background:#fff;border-radius:14px;padding:34px 30px;max-width:560px;width:100%;'
    + 'box-shadow:0 2px 20px rgba(31,42,51,.10);text-align:center}'
    + 'h1{margin:0 0 10px;font-size:25px;line-height:1.25}'
    + 'p{margin:0 0 18px;color:#4a5962}'
    + '.b{display:inline-flex;align-items:center;justify-content:center;gap:8px;'
    + 'margin:5px;padding:13px 22px;border-radius:9px;text-decoration:none;font-weight:600}'
    + '.b1{background:var(--gold);color:#1a1a1a}'
    + '.b2{background:#fff;color:var(--ink);border:1px solid #c6d0d6}'
    + '.z{margin:22px 0 0;font-size:14px;color:#6b7a84}'
    + '.z a{color:#6b7a84}'
    + '</style></head><body><div class="k">'
    + '<h1>Der 3D-Konfigurator wird gerade \u00fcberarbeitet</h1>'
    + '<p>Wir bauen ihn aus und schalten ihn in K\u00fcrze wieder frei.</p>'
    + '<p>Ihr Projekt k\u00f6nnen Sie trotzdem jederzeit anfragen \u2013 '
    + 'wir melden uns mit einem Angebot und messen vor Ort kostenlos auf.</p>'
    + '<p><a class="b b1" href="/#kontakt">Jetzt anfragen</a>'
    + '<a class="b b2" href="tel:+4915678696609">0156 7869 6609</a></p>'
    + '<p class="z"><a href="/">\u2190 Zur Website</a></p>'
    + '</div></body></html>';
  return new Response(html, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '86400',
    },
  });
}


/* ============================================================
   Eigene Reichweitenmessung  →  POST /api/messung
                                 GET  /werkstatt/api/zahlen
   ------------------------------------------------------------
   ANLASS. „Wird meine Internetseite aber auch überwacht? Zum Beispiel,
   an welchen Tagen kommen die meisten Besucher? Wo klicken die Besucher
   drauf? Welche Zeit ist ein Besucher wo? Welche Aktion führt ein
   Besucher durch?" (Betreiber, 03.11.2026). Metricool laeuft seit Juni,
   kann davon aber nur die erste Frage beantworten - und zaehlt nur
   Besucher, die vorher im Banner zugestimmt haben.

   WARUM EIGEN UND NICHT EIN FREMDER DIENST:
     · Es zaehlt ALLE Besucher. Weil nichts auf dem Geraet gespeichert
       oder von dort gelesen wird, greift die Einwilligungspflicht aus
       § 25 TDDDG nicht - der Haken im Banner entscheidet hier nichts.
     · Die Daten bleiben bei uns, in der EU (D1-Datenbank in WEUR).
     · Es kostet nichts: Das Freikontingent von D1 liegt bei 100.000
       Schreibvorgaengen am Tag, gemessen werden einige Dutzend.
     · Es kann, was kein fremdes Werkzeug kann: den Weg durch den
       3D-Konfigurator Schritt fuer Schritt zeigen.

   GEAENDERT AM 04.11.2026. Hier stand, es werde kein Kennzeichen fuer
   "derselbe Besucher" gebildet, und wer das aendere, aendere die
   Rechtsgrundlage mit. Beides stimmt weiter - die Aenderung ist
   bewusst getroffen worden: „oder du baust mit pruefsumme und passt
   die datenschutzerklaerung passend an?" (Betreiber), nachdem ich auf
   den Widerspruch zur veroeffentlichten Zusage hingewiesen hatte. Die
   Datenschutzerklaerung ist im SELBEN Zug geaendert worden.

   WAS JETZT ERFASST WIRD, das vorher nicht erfasst wurde:
     · ein Tageskennzeichen je Besuch (Pruefsumme, siehe
       messungBesucher() weiter unten),
     · Browser- und Systemfamilie, ohne Fassungsnummern,
     · die drei utm-Felder an selbst gesetzten Verweisen.

   WAS WEITER NICHT ERFASST WIRD:
     · die IP-Adresse und der User-Agent als solche - sie gehen in die
       Pruefsumme ein und werden danach verworfen, gespeichert wird
       keines von beiden,
     · keine Stadt, keine Postleitzahl, keine Koordinaten,
     · keine Adresszeile mit Fragezeichen ausser den drei utm-Feldern
       (eine Suchanfrage oder ein Teilen-Link stehen dort und gehoeren
       nicht in eine Statistik).

   EINWILLIGUNG bleibt entbehrlich, weil auf dem GERAET weiterhin
   nichts gespeichert und nichts gelesen wird (§ 25 TDDDG). Die
   Verarbeitung auf dem Server stuetzt sich auf Art. 6 Abs. 1 f DSGVO.
   Die verbindliche Bewertung holt der Betreiber beim Fachmann.

   OEFFENTLICHE SCHREIBADRESSE. Jeder kann hier POSTen. Deshalb nimmt
   die Route nur an, was sie kennt: feste Liste erlaubter Arten,
   begrenzte Laengen, begrenzte Zahlenbereiche, hoechstens 20 Ereignisse
   je Sendung, hoechstens 4 KB Rumpf. Schlimmer als ein paar erfundene
   Zeilen ist eine Datenbank, die sich mit Fremdtext fuellen laesst.
   ============================================================ */
const MESSUNG_MAX_BODY = 4 * 1024;
const MESSUNG_ARTEN = new Set([
  'seite',               // ein Seitenaufruf, wert = Verweildauer in Sekunden
  'telefon', 'whatsapp', 'mail',
  'anfrage-geoeffnet',   // Anfrage-Assistent geoeffnet
  'anfrage-gesendet',    // Anfrage wirklich abgeschickt
  'konfig-start',        // 3D-Konfigurator aufgebaut
  'konfig-schritt',      // wert = Nummer des Bereichs, zusatz = sein Name
  'konfig-anfrage',      // aus dem Konfigurator in den Assistenten
  'konfig-pdf', 'konfig-teilen',
  /* Seit 03.11.2026 (zweiter Ausbau): Was auf der Seite angeklickt wird.
     zusatz traegt die BESCHRIFTUNG des Knopfes oder Verweises, nie einen
     eingegebenen Text - js/messung.js nimmt nur <a> und <button>. */
  'klick',
]);
const MESSUNG_GERAETE = new Set(['handy', 'rechner']);

/* Tag und Stunde in UNSERER Zeitzone, nicht in UTC. Sonst waere
   "Samstagabend" in der Statistik teilweise Sonntag - und genau nach
   Wochentagen ist gefragt. */
function messungZeit(jetzt = new Date()) {
  const tag = jetzt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const stunde = Number(jetzt.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin', hour: '2-digit', hour12: false,
  }).replace(/\D/g, ''));
  return { tag, stunde: Number.isFinite(stunde) ? stunde : 0 };
}

function messungText(wert, max) {
  if (wert == null) return null;
  let s = String(wert).replace(/[\u0000-\u001f]/g, ' ').trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function messungZahl(wert, min, max) {
  const n = Math.round(Number(wert));
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
}

/* Der Pfad, und nur der Pfad. Fragezeichen und Raute fallen weg (dort
   stehen Suchbegriffe und ganze Konfigurationen), und etwas, das nicht
   mit / beginnt, ist keine Seite dieser Website. */
function messungSeite(wert) {
  let s = messungText(wert, 160);
  if (!s) return null;
  s = s.split('?')[0].split('#')[0];
  if (s.charAt(0) !== '/') return null;
  return s.length > 120 ? s.slice(0, 120) : s;
}

/* Einmal je Isolat, nicht bei jedem Aufruf: Die Tabellenpflege kostet
   sonst bei JEDEM Seitenaufruf zusaetzliche Schreibvorgaenge. */
let messungSchemaGeprueft = false;

async function messungTabelle(env) {
  if (messungSchemaGeprueft) return;
  await env.MESSUNG.prepare(
    'CREATE TABLE IF NOT EXISTS ereignis ('
    + 'id INTEGER PRIMARY KEY AUTOINCREMENT, tag TEXT NOT NULL, '
    + 'stunde INTEGER NOT NULL, art TEXT NOT NULL, seite TEXT NOT NULL, '
    + 'wert INTEGER, zusatz TEXT, quelle TEXT, geraet TEXT, '
    + 'zeit INTEGER, land TEXT, region TEXT, tiefe INTEGER)'
  ).run();
  /* Nachruesten fuer Datenbanken, die vor dem Ausbau angelegt wurden.
     Jede Spalte einzeln und mit Fangnetz: "duplicate column name" ist
     hier der NORMALFALL, kein Fehler. */
  for (const spalte of ['zeit INTEGER', 'land TEXT', 'region TEXT', 'tiefe INTEGER',
    /* Ausbau 04.11.2026: Besucherkennzeichen, Kampagne, Browser, System. */
    'besucher TEXT', 'kampagne TEXT', 'medium TEXT', 'browser TEXT', 'system TEXT']) {
    try {
      await env.MESSUNG.prepare('ALTER TABLE ereignis ADD COLUMN ' + spalte).run();
    } catch (e) { /* Spalte ist schon da */ }
  }
  await env.MESSUNG.prepare(
    'CREATE INDEX IF NOT EXISTS ereignis_tag ON ereignis (tag)'
  ).run();
  await env.MESSUNG.prepare(
    'CREATE INDEX IF NOT EXISTS ereignis_zeit ON ereignis (zeit)'
  ).run();
  await env.MESSUNG.prepare(
    'CREATE INDEX IF NOT EXISTS ereignis_besucher ON ereignis (besucher, zeit)'
  ).run();
  /* Das Tagessalz. Eine Zeile je Tag, mehr steht da nicht drin. */
  await env.MESSUNG.prepare(
    'CREATE TABLE IF NOT EXISTS salz (tag TEXT PRIMARY KEY, wert TEXT NOT NULL)'
  ).run();
  messungSchemaGeprueft = true;
}

/* ============================================================
   Das Besucherkennzeichen  (eingebaut 04.11.2026)
   ------------------------------------------------------------
   ANLASS. „oder du baust mit pruefsumme und passt die
   datenschutzerklaerung passend an?" (Betreiber, 04.11.2026), nachdem
   ich darauf hingewiesen hatte, dass die veroeffentlichte
   Datenschutzerklaerung bis dahin ausdruecklich das Gegenteil zusagte.
   Der Text ist im selben Zug geaendert worden - Technik und Zusage
   duerfen nie auseinanderlaufen.

   WARUM UEBERHAUPT. Ohne ein Kennzeichen gibt es keine Besucher,
   keine Sitzungen, keine Absprungrate und keine Seiten je Besuch -
   also genau die Zahlen, an denen man ablesen kann, ob eine Seite
   traegt. Gezaehlt wurden vorher nur Aufrufe.

   WIE, und warum so:
     · Pruefsumme (SHA-256) aus TAGESSALZ + IP + Browserkennung +
       Gastgebername. Davon die ersten 16 Zeichen.
     · Das SALZ ist eine Zufallszahl, die EINMAL AM TAG neu gezogen und
       in der Tabelle `salz` abgelegt wird. Ohne das Salz laesst sich
       aus der Pruefsumme nichts zurueckrechnen; mit dem Wechsel um
       Mitternacht ist niemand ueber den Tag hinaus wiedererkennbar.
     · IP und Browserkennung werden NICHT gespeichert, nirgends. Sie
       gehen in die Pruefsumme ein und sind danach weg.
     · Das ist das Verfahren von Plausible, und es ist der Grund, warum
       dort kein Einwilligungsbanner noetig ist: Auf dem GERAET wird
       nichts gespeichert und nichts gelesen, also greift § 25 TDDDG
       nicht. Die Verarbeitung auf dem Server stuetzt sich auf das
       berechtigte Interesse (Art. 6 Abs. 1 f DSGVO) - so steht es
       seit dem 04.11.2026 auch in der Datenschutzerklaerung.

   ALTE ZEILEN HABEN KEIN KENNZEICHEN. Alles vor dem 04.11.2026 traegt
   `besucher = NULL`. Die Auswertung muss das aushalten, statt diese
   Tage als "null Besucher" zu zeigen.
   ============================================================ */
let salzHeute = { tag: null, wert: null };

async function messungSalz(env, tag) {
  if (salzHeute.tag === tag && salzHeute.wert) return salzHeute.wert;
  const treffer = await env.MESSUNG.prepare(
    'SELECT wert FROM salz WHERE tag = ?1').bind(tag).first();
  let wert = treffer && treffer.wert;
  if (!wert) {
    const roh = new Uint8Array(16);
    crypto.getRandomValues(roh);
    wert = Array.from(roh).map((b) => b.toString(16).padStart(2, '0')).join('');
    /* OR IGNORE: Zwei Aufrufe in derselben Sekunde ziehen sonst zwei
       verschiedene Salze, und dieselbe Person waere zweimal gezaehlt. */
    await env.MESSUNG.prepare(
      'INSERT OR IGNORE INTO salz (tag, wert) VALUES (?1, ?2)').bind(tag, wert).run();
    const nach = await env.MESSUNG.prepare(
      'SELECT wert FROM salz WHERE tag = ?1').bind(tag).first();
    wert = (nach && nach.wert) || wert;
    /* Aufraeumen: Ein Salz von vorgestern nuetzt niemandem mehr. */
    await env.MESSUNG.prepare('DELETE FROM salz WHERE tag < ?1').bind(tag).run();
  }
  salzHeute = { tag, wert };
  return wert;
}

async function messungBesucher(request, env, tag) {
  try {
    const ip = request.headers.get('cf-connecting-ip') || '';
    const ua = request.headers.get('user-agent') || '';
    if (!ip && !ua) return null;
    const salz = await messungSalz(env, tag);
    const roh = new TextEncoder().encode(
      salz + '|' + ip + '|' + ua + '|' + (new URL(request.url)).hostname);
    const summe = await crypto.subtle.digest('SHA-256', roh);
    return Array.from(new Uint8Array(summe)).slice(0, 8)
      .map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return null;   // Lieber keine Kennung als ein kaputter Seitenaufruf
  }
}

/* Browser und System nur als FAMILIE, nicht als Fassung. „Safari" ist
   eine Auskunft, „Safari 17.4.1 auf iOS 17.4.1" ist ein Fingerabdruck.
   Reihenfolge wichtig: Edge und Samsung nennen sich auch Chrome, und
   jeder Browser auf iOS nennt sich Safari. */
function messungBrowser(ua) {
  if (!ua) return null;
  if (/\bEdg\//.test(ua)) return 'Edge';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/\bOPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS/.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  if (/bot|crawl|spider|slurp/i.test(ua)) return 'Suchmaschine';
  return 'anderer';
}

function messungSystem(ua) {
  if (!ua) return null;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux|X11/.test(ua)) return 'Linux';
  return 'anderes';
}

async function handleMessung(request, env) {
  /* Ohne Binding wird NICHT gemessen - und das ist kein Fehlerfall, der
     den Besucher etwas angeht. Er bekommt dieselbe leere Antwort wie
     sonst; die Seite merkt nichts. Genauso wie /api/bauteile ohne
     KV-Namensraum. */
  if (!env.MESSUNG) return new Response(null, { status: 204 });

  let roh = '';
  try { roh = await request.text(); } catch (e) { return new Response(null, { status: 204 }); }
  if (!roh || roh.length > MESSUNG_MAX_BODY) return new Response(null, { status: 204 });

  let body = null;
  try { body = JSON.parse(roh); } catch (e) { body = null; }
  if (!body || typeof body !== 'object') return new Response(null, { status: 204 });

  const seite = messungSeite(body.seite);
  if (!seite) return new Response(null, { status: 204 });

  const geraet = MESSUNG_GERAETE.has(body.geraet) ? body.geraet : null;
  const quelle = messungText(body.quelle, 80);
  /* KAMPAGNE. Nur die drei festen utm-Felder, die der Betrieb selbst an
     seine Verweise haengt - nie der ganze Fragezeichen-Teil, dort
     stehen Suchbegriffe und geteilte Konfigurationen. Wie bei
     Plausible sticht utm_source die Herkunftsseite aus: Wer einen
     Verweis selbst beschriftet hat, meint diese Beschriftung. */
  const kampagne = messungText(body.kampagne, 60);
  const medium = messungText(body.medium, 40);
  const quelleEcht = messungText(body.utmQuelle, 60) || quelle;
  const dauer = messungZahl(body.dauer, 0, 3600);

  /* Wie weit wurde gescrollt (0-100 %)? Sagt mehr als die Verweildauer:
     Jemand kann eine Minute auf einer Seite stehen, ohne je unter das
     erste Bild gesehen zu haben. */
  const tiefe = messungZahl(body.tiefe, 0, 100);

  /* HERKUNFT AUS CLOUDFLARE, NICHT AUS DER IP-ADRESSE.
     request.cf traegt Land und Region bereits fertig bei; die
     IP-Adresse wird dafuer weder gelesen noch gespeichert. Gespeichert
     werden nur Laenderkuerzel und Bundesland - keine Stadt, keine
     Postleitzahl, keine Koordinaten. Fuer einen Betrieb, der im
     Westerwald montiert, ist "aus welcher Gegend kommen die Leute" die
     wichtigste Frage; eine Stadt waere in einem Dorf dagegen schon
     fast eine Person. */
  const ua = request.headers.get('user-agent') || '';
  const browser = messungBrowser(ua);
  const system = messungSystem(ua);
  const cf = request.cf || {};
  const land = messungText(cf.country, 4);
  const region = (land === 'DE') ? messungText(cf.region || cf.regionCode, 40) : null;

  const zeilen = [];
  /* Der Seitenaufruf selbst wird nur beim ERSTEN Senden gezaehlt. Wer
     den Tab wegklickt und zurueckkommt, schickt ein zweites Paket mit
     weiterer Verweildauer - das darf kein zweiter Aufruf werden. */
  if (body.neu) {
    zeilen.push(['seite', seite, dauer, null, quelleEcht, geraet, tiefe]);
  } else if (dauer) {
    zeilen.push(['verweilen', seite, dauer, null, null, geraet, tiefe]);
  }

  const liste = Array.isArray(body.ereignisse) ? body.ereignisse.slice(0, 20) : [];
  for (const e of liste) {
    if (!e || typeof e !== 'object') continue;
    const art = messungText(e.art, 30);
    if (!art || !MESSUNG_ARTEN.has(art) || art === 'seite') continue;
    zeilen.push([art, seite, messungZahl(e.wert, 0, 9999),
                 messungText(e.zusatz, 60), null, geraet, null]);
  }
  if (!zeilen.length) return new Response(null, { status: 204 });

  const { tag, stunde } = messungZeit();
  const zeit = Math.floor(Date.now() / 1000);
  try {
    await messungTabelle(env);
    const besucher = await messungBesucher(request, env, tag);
    const satz = env.MESSUNG.prepare(
      'INSERT INTO ereignis (tag, stunde, zeit, art, seite, wert, zusatz, '
      + 'quelle, geraet, land, region, tiefe, besucher, kampagne, medium, '
      + 'browser, system) '
      + 'VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, '
      + '?15, ?16, ?17)'
    );
    await env.MESSUNG.batch(zeilen.map((z) => satz.bind(
      tag, stunde, zeit, z[0], z[1], z[2], z[3], z[4], z[5], land, region, z[6],
      besucher, kampagne, medium, browser, system
    )));
  } catch (e) {
    /* Eine Statistik darf nie etwas kaputt machen. Faellt die Datenbank
       aus, fehlen Zahlen - der Besucher merkt nichts. */
  }
  return new Response(null, { status: 204 });
}

/* ---------- Die Auswertung, nur hinter dem Werkstatt-Passwort ---------- */
async function handleZahlen(url, env) {
  if (!env.MESSUNG) {
    return jsonResponse({
      fehler: 'keine-datenbank',
      hinweis: 'Die D1-Datenbank "bv-messung" ist nicht an den Worker gebunden '
        + '(wrangler.jsonc, Eintrag d1_databases). Bis dahin wird nichts gemessen.',
    }, 503);
  }
  const tage = Math.min(Math.max(Number(url.searchParams.get('tage')) || 30, 1), 400);
  const tagVon = new Date(Date.now() - (tage - 1) * 86400000);
  const berlin = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const von = berlin(tagVon);
  /* Der GLEICH LANGE Zeitraum davor. Ohne ihn ist jede Zahl eine Zahl
     ohne Richtung: 240 Aufrufe sind gut oder schlecht, je nachdem, was
     vorher war. Genau diese Einordnung hat auf der ersten Fassung der
     Zahlenseite gefehlt. */
  const vorherVon = berlin(new Date(tagVon.getTime() - tage * 86400000));

  try {
    await messungTabelle(env);

    /* AUFRAEUMEN HIER und nicht beim Messen: Diese Abfrage ruft nur der
       Betrieb auf, ein paar Mal im Monat. Beim Messen waere dasselbe
       Loeschen ein zusaetzlicher Schreibvorgang bei JEDEM Aufruf.
       400 Tage, damit ein Jahresvergleich moeglich bleibt. */
    const grenze = new Date(Date.now() - 400 * 86400000)
      .toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
    await env.MESSUNG.prepare('DELETE FROM ereignis WHERE tag < ?1').bind(grenze).run();

    const frage = (sql) => env.MESSUNG.prepare(sql).bind(von).all();
    const frageVorher = (sql) => env.MESSUNG.prepare(sql).bind(vorherVon, von).all();
    /* „Gerade aktiv" braucht einen Zeitstempel, keinen Tag - deshalb
       die Spalte zeit. 30 Minuten ist das Fenster, das auch die
       bekannten Werkzeuge nehmen. */
    const seitSekunden = Math.floor(Date.now() / 1000) - 30 * 60;

    /* ---------- Sitzungen aus den Zeitstempeln ----------
       Eine Sitzung bricht nach 30 Minuten Pause ab - dasselbe Fenster
       wie bei den bekannten Werkzeugen. Gerechnet wird das IN SQL mit
       einem Fensterausdruck: Jeder Aufruf bekommt eine 1, wenn seit
       dem vorigen Aufruf desselben Besuchers mehr als 1800 Sekunden
       vergangen sind; die laufende Summe dieser Einsen ist die
       Sitzungsnummer.

       NUR ZEILEN MIT KENNZEICHEN. Alles vor dem 04.11.2026 traegt
       keines; diese Zeilen zaehlen bei Aufrufen weiter mit, bei
       Besuchern und Sitzungen aber nicht - sonst waere jeder alte Tag
       eine Sitzung mit null Besuchern. */
    const sitzungSql = (bis) => (
      "WITH roh AS (SELECT besucher, zeit, "
      + "LAG(zeit) OVER (PARTITION BY besucher ORDER BY zeit) AS vorher "
      + "FROM ereignis WHERE art = 'seite' AND besucher IS NOT NULL "
      + "AND tag >= ?1" + (bis ? " AND tag < ?2" : "") + "), "
      + "start AS (SELECT besucher, zeit, "
      + "CASE WHEN vorher IS NULL OR zeit - vorher > 1800 THEN 1 ELSE 0 END AS neu "
      + "FROM roh), "
      + "nummer AS (SELECT besucher, SUM(neu) OVER (PARTITION BY besucher "
      + "ORDER BY zeit ROWS UNBOUNDED PRECEDING) AS sid FROM start), "
      + "je AS (SELECT besucher, sid, COUNT(*) AS seiten FROM nummer "
      + "GROUP BY besucher, sid) "
      + "SELECT COUNT(*) AS sitzungen, "
      + "COUNT(DISTINCT besucher) AS besucher, "
      + "SUM(CASE WHEN seiten = 1 THEN 1 ELSE 0 END) AS absprunge, "
      + "AVG(seiten) AS seitenJeSitzung FROM je"
    );

    const [tageRows, seitenRows, quellenRows, geraeteRows,
           handlungRows, trichterRows, stundenRows,
           vorherAufrufe, vorherHandlung, vorherDauer,
           matrixRows, laenderRows, regionenRows, klickRows, liveRows,
           beginnRows, tageMitDatenRows, sitzungRows, vorherSitzungRows,
           kampagnenRows, browserRows, systemRows, besucherReiheRows,
           einstiegRows] = await Promise.all([
      frage("SELECT tag, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 GROUP BY tag ORDER BY tag"),
      /* Je Seite: Aufrufe, Verweildauer, Scrolltiefe und wie oft sie der
         EINSTIEG war (nur beim Einstieg steht eine fremde Herkunft). */
      frage("SELECT seite, COUNT(*) AS aufrufe, "
            + "CAST(AVG(NULLIF(wert, 0)) AS INTEGER) AS dauer, "
            + "CAST(AVG(NULLIF(tiefe, 0)) AS INTEGER) AS tiefe, "
            + "SUM(CASE WHEN quelle IS NOT NULL THEN 1 ELSE 0 END) AS einstiege "
            + "FROM ereignis WHERE art = 'seite' AND tag >= ?1 GROUP BY seite "
            + "ORDER BY aufrufe DESC LIMIT 30"),
      frage("SELECT quelle, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND quelle IS NOT NULL "
            + "GROUP BY quelle ORDER BY aufrufe DESC LIMIT 20"),
      frage("SELECT geraet, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND geraet IS NOT NULL GROUP BY geraet"),
      frage("SELECT art, COUNT(*) AS anzahl FROM ereignis "
            + "WHERE tag >= ?1 AND art NOT IN ('seite', 'verweilen', 'konfig-schritt', 'klick') "
            + "GROUP BY art ORDER BY anzahl DESC"),
      frage("SELECT wert AS nr, zusatz AS name, COUNT(*) AS anzahl FROM ereignis "
            + "WHERE art = 'konfig-schritt' AND tag >= ?1 GROUP BY wert, zusatz "
            + "ORDER BY nr"),
      frage("SELECT stunde, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 GROUP BY stunde ORDER BY stunde"),
      frageVorher("SELECT COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND tag < ?2"),
      frageVorher("SELECT art, COUNT(*) AS anzahl FROM ereignis "
            + "WHERE tag >= ?1 AND tag < ?2 "
            + "AND art NOT IN ('seite', 'verweilen', 'konfig-schritt', 'klick') GROUP BY art"),
      frageVorher("SELECT CAST(AVG(NULLIF(wert, 0)) AS INTEGER) AS dauer FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND tag < ?2"),
      /* Wochentag MAL Stunde. strftime zaehlt den Sonntag als 0 - das
         rechnet die Seite auf Montag = 0 um. In SQL gruppiert statt im
         Browser: Ein Jahr einzeln ausgeliefert waeren 8.760 Zeilen,
         gruppiert sind es hoechstens 168. */
      frage("SELECT CAST(strftime('%w', tag) AS INTEGER) AS wtag, stunde, "
            + "COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 GROUP BY wtag, stunde"),
      frage("SELECT land, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND land IS NOT NULL "
            + "GROUP BY land ORDER BY aufrufe DESC LIMIT 20"),
      frage("SELECT region, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND region IS NOT NULL "
            + "GROUP BY region ORDER BY aufrufe DESC LIMIT 20"),
      frage("SELECT zusatz AS was, seite, COUNT(*) AS anzahl FROM ereignis "
            + "WHERE art = 'klick' AND tag >= ?1 AND zusatz IS NOT NULL "
            + "GROUP BY zusatz, seite ORDER BY anzahl DESC LIMIT 25"),
      env.MESSUNG.prepare(
        "SELECT seite, COUNT(*) AS aufrufe FROM ereignis "
        + "WHERE art IN ('seite', 'verweilen') AND zeit >= ?1 "
        + "GROUP BY seite ORDER BY aufrufe DESC LIMIT 10").bind(seitSekunden).all(),
      /* AB WANN GIBT ES UEBERHAUPT ZAHLEN. Ohne diese Angabe rechnet
         die Seite Durchschnitte durch 30 Tage, von denen es 28 nicht
         gibt - genau daran ist am 04.11.2026 eine Auswertung
         gescheitert, und zwar meine eigene. */
      env.MESSUNG.prepare(
        "SELECT MIN(tag) AS beginn, MIN(zeit) AS beginnZeit FROM ereignis").all(),
      frage("SELECT COUNT(DISTINCT tag) AS tage FROM ereignis WHERE tag >= ?1"),
      env.MESSUNG.prepare(sitzungSql(false)).bind(von).all(),
      env.MESSUNG.prepare(sitzungSql(true)).bind(vorherVon, von).all(),
      frage("SELECT kampagne, medium, quelle, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND kampagne IS NOT NULL "
            + "GROUP BY kampagne, medium, quelle ORDER BY aufrufe DESC LIMIT 20"),
      frage("SELECT browser, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND browser IS NOT NULL "
            + "GROUP BY browser ORDER BY aufrufe DESC LIMIT 12"),
      frage("SELECT system, COUNT(*) AS aufrufe FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND system IS NOT NULL "
            + "GROUP BY system ORDER BY aufrufe DESC LIMIT 12"),
      frage("SELECT tag, COUNT(DISTINCT besucher) AS besucher FROM ereignis "
            + "WHERE art = 'seite' AND tag >= ?1 AND besucher IS NOT NULL "
            + "GROUP BY tag ORDER BY tag"),
      /* EINSTIEGSSEITEN je Sitzung: die erste Seite, die jemand sieht.
         Die bisherige Zaehlung („quelle ist gesetzt") verfehlt jeden,
         der die Adresse direkt eintippt - und das ist hier der
         haeufigste Fall. */
      env.MESSUNG.prepare(
        "WITH roh AS (SELECT besucher, zeit, seite, "
        + "LAG(zeit) OVER (PARTITION BY besucher ORDER BY zeit) AS vorher "
        + "FROM ereignis WHERE art = 'seite' AND besucher IS NOT NULL AND tag >= ?1) "
        + "SELECT seite, COUNT(*) AS einstiege FROM roh "
        + "WHERE vorher IS NULL OR zeit - vorher > 1800 "
        + "GROUP BY seite ORDER BY einstiege DESC LIMIT 20").bind(von).all(),
    ]);

    const sitzung = ((sitzungRows.results || [])[0] || {});
    const vorherSitzung = ((vorherSitzungRows.results || [])[0] || {});
    const beginn = ((beginnRows.results || [])[0] || {});
    const aufrufeJetzt = (tageRows.results || [])
      .reduce((n, z) => n + (z.aufrufe || 0), 0);
    const handlungenGesamt = (handlungRows.results || [])
      .reduce((n, z) => n + (z.anzahl || 0), 0);

    return new Response(JSON.stringify({
      von, tage,
      /* Der ECHTE Datenbeginn und die Zahl der Tage, an denen wirklich
         etwas gemessen wurde. Beides gehoert auf die Seite, sonst
         rechnet sie Durchschnitte durch Tage ohne Daten. */
      datenBeginn: beginn.beginn || null,
      datenBeginnZeit: beginn.beginnZeit || null,
      tageMitDaten: ((tageMitDatenRows.results || [])[0] || {}).tage || 0,
      aufrufe: aufrufeJetzt,
      besucher: sitzung.besucher || 0,
      sitzungen: sitzung.sitzungen || 0,
      absprunge: sitzung.absprunge || 0,
      seitenJeSitzung: sitzung.seitenJeSitzung || 0,
      handlungenGesamt,
      besucherReihe: besucherReiheRows.results || [],
      einstiege: einstiegRows.results || [],
      kampagnen: kampagnenRows.results || [],
      browser: browserRows.results || [],
      systeme: systemRows.results || [],
      tageReihe: tageRows.results || [],
      seiten: seitenRows.results || [],
      quellen: quellenRows.results || [],
      geraete: geraeteRows.results || [],
      handlungen: handlungRows.results || [],
      trichter: trichterRows.results || [],
      stunden: stundenRows.results || [],
      matrix: matrixRows.results || [],
      laender: laenderRows.results || [],
      regionen: regionenRows.results || [],
      klicks: klickRows.results || [],
      live: liveRows.results || [],
      vorher: {
        von: vorherVon,
        aufrufe: ((vorherAufrufe.results || [])[0] || {}).aufrufe || 0,
        dauer: ((vorherDauer.results || [])[0] || {}).dauer || 0,
        handlungen: vorherHandlung.results || [],
        besucher: vorherSitzung.besucher || 0,
        sitzungen: vorherSitzung.sitzungen || 0,
        absprunge: vorherSitzung.absprunge || 0,
        seitenJeSitzung: vorherSitzung.seitenJeSitzung || 0,
      },
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return jsonResponse({ fehler: 'abfrage', hinweis: String(e && e.message || e) }, 500);
  }
}
