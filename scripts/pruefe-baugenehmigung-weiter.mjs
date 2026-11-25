#!/usr/bin/env node
/* Fuehrt der Hauptknopf nach dem Baugenehmigungs-Check ins Formular?
 *
 * WARUM (25.11.2026, Paket A3)
 * Der Knopf wurde als '/#kontakt?produkt=Carport' gebaut. Alles nach #
 * ist Sprungmarke, eine solche ID gab es nicht: der Besucher landete
 * oben auf der Startseite statt am Formular. Ausserdem ueberschrieb
 * textContent das Symbol vor dem Knopftext.
 *
 * WAS SIE PRUEFT: Chip antippen, Knopf klicken. Der Knopf behaelt sein
 * Symbol, das Ziel #kontakt existiert, Carport und Kaltwintergarten
 * kommen vorausgewaehlt an (Assistent einen Schritt weiter), die
 * seit 25.11.2026 auch Terrassenueberdachung (TDS), Pergola / Markise
 * (Pergola) und Glasschiebewand (Direkt anfragen, Name im
 * Nachrichtenfeld; ebenso Kaltwintergarten). Chips melden aria-pressed. Carport
 * an und wieder aus: Knopf heisst wieder "Kostenlos anfragen" und waehlt
 * nichts vor.
 *
 * GEGENPROBE: --gegenprobe liefert baugenehmigung.html im Stand vor A3
 * (Commit f174971, aus git, ueber eine Playwright-Route). Dann MUSS
 * jeder Fall auffallen. Keine Datei wird geaendert.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url).pathname);
const { chromium } = require('playwright');
const W = new URL('..', import.meta.url).pathname, PORT = 8700 + Math.floor(Math.random() * 90);
const GEGENPROBE = process.argv.includes('--gegenprobe');
const ERWARTET = { carport: 'Welchen Carport', kaltwintergarten: 'Was können wir', glasschiebeanlage: 'Was können wir', terrassenueberdachung: 'Art des Aufbaus', aussenanlage: 'Welches Dach', 'carport-aus': 'Was möchten Sie konfigurieren' };
let faelle = 0, rot = 0;
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: W, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1100));
const br = await chromium.launch();
for (const stand of [GEGENPROBE ? 'VORHER' : 'NACHHER']) for (const chip of ['carport', 'kaltwintergarten', 'glasschiebeanlage', 'terrassenueberdachung', 'aussenanlage', 'carport-aus']) {
  const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/web3forms|formspree/i, r => r.abort());
  if (stand === 'VORHER') {
    const alt = execFileSync('git', ['show', 'f174971:baugenehmigung.html'], { cwd: W, encoding: 'utf8' });
    await ctx.route('**/baugenehmigung.html', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: alt }));
  }
  const pg = await ctx.newPage();
  const fehler = []; pg.on('pageerror', e => fehler.push(e.message));
  await pg.goto(`http://127.0.0.1:${PORT}/baugenehmigung.html`, { waitUntil: 'load' });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => document.querySelector('#cookieBanner')?.remove());
  /* carport-aus: an und wieder aus. Dann muss der Knopf wieder
   * "Kostenlos anfragen" heissen und darf nichts vorauswaehlen (frueher
   * blieb "Jetzt Carport anfragen" stehen). */
  const name = chip.replace('-aus', '');
  const chipEl = `.bg-chip[data-product="${name}"]`;
  await pg.evaluate((s) => bgToggleChip(document.querySelector(s)), chipEl);
  const gedrueckt = await pg.evaluate((s) => document.querySelector(s).getAttribute('aria-pressed'), chipEl);
  if (chip.endsWith('-aus')) await pg.evaluate((s) => bgToggleChip(document.querySelector(s)), chipEl);
  const k = await pg.evaluate(() => { const a = document.getElementById('bg-cta-main'); return { href: a.getAttribute('href'), text: a.textContent.trim(), symbol: !!a.querySelector('svg') }; });
  const textOk = chip.endsWith('-aus') ? k.text === 'Kostenlos anfragen' : k.text.startsWith('Jetzt ');
  const ariaOk = gedrueckt === 'true';
  await pg.evaluate(() => document.getElementById('bg-cta-main').click());
  await pg.waitForURL(/index|\/#|\/$/, { timeout: 8000 }).catch(() => {});
  await pg.waitForTimeout(1500);
  const z = await pg.evaluate(() => {
    const ziel = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const gewaehlt = [...document.querySelectorAll('#kontakt .aw-option.selected, #kontakt [aria-pressed="true"], #kontakt .aw-opt.selected, #kontakt .is-selected')].map(e => e.textContent.trim().slice(0, 30));
    const sicht = ziel ? Math.round(ziel.getBoundingClientRect().top) : null;
    const schritt = document.querySelector('#kontakt .aw-step-title, #kontakt h3, #kontakt legend')?.textContent.trim().slice(0, 50);
    return { url: location.pathname + location.hash, zielGefunden: !!ziel, zielOben: sicht, gewaehlt, schritt };
  });
    /* Bei "Direkt anfragen" muss der Produktname im Nachrichtenfeld stehen,
   * sonst kaeme die Anfrage ohne Produkt an. */
  const WUNSCH = { kaltwintergarten: 'Kaltwintergarten', glasschiebeanlage: 'Glasschiebewand' };
  const wunsch = WUNSCH[chip] ? await pg.evaluate(() => document.querySelector('#kontakt textarea')?.value || '') : '';
  const wunschOk = !WUNSCH[chip] || wunsch.includes(WUNSCH[chip]);
  const ok = wunschOk && textOk && ariaOk && k.symbol && k.href === '/#kontakt' && z.zielGefunden && (z.schritt || '').startsWith(ERWARTET[chip]) && !fehler.length;
  faelle++; if (!ok) rot++;
  console.log((ok ? '  ok      ' : '  FEHLER  ') + `${stand.padEnd(8)} ${chip.padEnd(18)} href=${k.href.padEnd(32)} Symbol=${k.symbol ? 'ja  ' : 'NEIN'} aria-pressed=${gedrueckt} Text="${k.text.slice(0, 26)}" -> ${z.url}  Ziel ${z.zielGefunden ? 'gefunden bei ' + z.zielOben + 'px' : 'NICHT GEFUNDEN'}  Schritt "${z.schritt}"${wunsch ? '  Nachricht "' + wunsch.slice(0, 30) + '"' : ''}${fehler.length ? '  JS-FEHLER ' + fehler[0] : ''}`);
  await ctx.close();
}
await br.close(); srv.kill();
if (GEGENPROBE) {
  console.log('\nErgebnis: ' + (rot === faelle ? 'die Gegenprobe faellt in allen ' + faelle + ' Faellen auf' : 'GEGENPROBE VERSAGT, nur ' + rot + ' von ' + faelle));
  process.exit(rot === faelle ? 0 : 1);
}
console.log('\nErgebnis: ' + (rot ? rot + ' von ' + faelle + ' Faellen falsch' : 'alle ' + faelle + ' Faelle richtig'));
process.exit(rot ? 1 : 0);
