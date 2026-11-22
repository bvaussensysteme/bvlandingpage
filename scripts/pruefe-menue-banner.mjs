#!/usr/bin/env node
/* ============================================================
   LIEGT DER COOKIE-HINWEIS UEBER DEM GEOEFFNETEN HANDY-MENUE?

   ANLASS (22.11.2026). Der mobile-ux-auditor meldete es, selbst
   nachgemessen: Der Hinweis stand auf z-index 9999, das Menue auf
   999. Bei 320 px Fensterbreite waren 5 von 7 Menueeintraegen
   verdeckt (Leistungen, Katalog, Ueber uns, Ablauf, Jetzt anfragen),
   bei 390 px 3 von 7. Beim ERSTEN Besuch, also genau dann, wenn der
   Hinweis erscheint, war das Menue damit unbedienbar.

   WARUM DAS EIN VERSTOSS IST: Ein Menueeintrag, der den
   Tastaturfokus bekommt und vollstaendig verdeckt ist, faellt unter
   WCAG 2.2, 2.4.11 "Fokus nicht verdeckt (Minimum)", Stufe AA. Mit
   dem Finger ist er ohnehin nicht zu treffen.

   WIE GEMESSEN WIRD: Menue oeffnen, dann fuer jeden sichtbaren
   Eintrag mit elementFromPoint nachsehen, WAS an seiner Mitte
   tatsaechlich oben liegt. Nicht die z-index-Werte vergleichen,
   sondern das Ergebnis - ein Stapel haengt auch an
   Stapelkontexten, nicht nur an Zahlen.

   WARUM NICHT IN pruefe-fokus-verdeckung.mjs: Das misst beim
   Durchtabben der normalen Seite. Hier ist ein Zustand noetig, den
   es dort nicht gibt: geoeffnetes Menue UND sichtbarer Hinweis.

   Aufruf:     node scripts/pruefe-menue-banner.mjs
   Gegenprobe: node scripts/pruefe-menue-banner.mjs --gegenprobe
   Die Gegenprobe setzt das Menue auf den alten z-index 999 zurueck.
   Dann MUSS die Verdeckung auffallen.
   ============================================================ */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8913;

function chromeIn(o) {
  for (const w of [`${o}/chrome-linux/chrome`, `${o}/chrome-linux64/chrome`, `${o}/chrome`])
    if (existsSync(w)) return w;
  return undefined;
}
function chromiumPfad() {
  if (process.env.BV_CHROMIUM) return process.env.BV_CHROMIUM;
  const b = '/opt/pw-browsers';
  if (!existsSync(b)) return undefined;
  const o = readdirSync(b).filter((d) => /^chromium-\d+$/.test(d)).sort();
  return o.length ? chromeIn(`${b}/${o[o.length - 1]}`) : undefined;
}

const WURZEL = new URL('..', import.meta.url).pathname;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: WURZEL, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
process.on('exit', () => server.kill());

let fehler = 0, geprueft = 0;
function pruef(name, ok, beleg) {
  geprueft++;
  if (ok) console.log(`  ok      ${name.padEnd(48)} ${beleg || ''}`);
  else { fehler++; console.log(`  FEHLER  ${name.padEnd(48)} ${beleg || ''}`); }
}

/* Drei Bauarten: Startseite, eine Unterseite mit Rechner, eine
   Produktseite. Das Menue steht ueberall im selben Baustein, aber die
   Seiten bringen unterschiedliche Stapelkontexte mit. */
const SEITEN = ['/index.html', '/windzonen.html', '/produkte/carport.html'];
const BREITEN = [320, 390];

console.log(GEGENPROBE ? 'Gegenprobe: Menue wieder unter den Hinweis gelegt'
                       : 'Cookie-Hinweis ueber dem Handy-Menue?');

const browser = await chromium.launch({ executablePath: chromiumPfad(), args: ['--no-sandbox'] });
let gesamtVerdeckt = 0;

for (const pfad of SEITEN) {
  for (const breite of BREITEN) {
    const ctx = await browser.newContext({
      viewport: { width: breite, height: breite === 320 ? 568 : 844 },
      hasTouch: true, isMobile: true,
    });
    const seite = await ctx.newPage();
    await seite.goto(`http://127.0.0.1:${PORT}${pfad}`, { waitUntil: 'domcontentloaded' });
    await seite.waitForTimeout(900);

    if (GEGENPROBE) {
      await seite.addStyleTag({ content: '.mobile-menu { z-index: 999 !important; }' });
    }

    const d = await seite.evaluate(() => {
      const knopf = document.getElementById('hamburgerBtn');
      if (knopf) knopf.click();
      return !!knopf;
    });
    await seite.waitForTimeout(400);

    const m = await seite.evaluate(() => {
      const menue = document.getElementById('mobileMenu');
      const banner = document.getElementById('cookieBanner');
      if (!menue || !banner) return { fehlt: true };
      const sichtbar = (e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0;
      const eintraege = [...menue.querySelectorAll('a, button')].filter(sichtbar);
      const verdeckt = [];
      for (const e of eintraege) {
        const r = e.getBoundingClientRect();
        const oben = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (oben && banner.contains(oben)) verdeckt.push((e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 16));
      }
      /* NICHT offsetParent: Das ist bei position: fixed immer null,
         und der Hinweis ist fix. Beim ersten Versuch am 22.11.2026
         meldete die Pruefung deshalb sechsmal "Hinweis nicht
         sichtbar" und haette nie etwas gefunden. */
      const bs = getComputedStyle(banner);
      const br = banner.getBoundingClientRect();
      return { gesamt: eintraege.length, verdeckt,
               bannerSichtbar: bs.display !== 'none' && bs.visibility !== 'hidden' && br.height > 10 };
    });

    if (m.fehlt) {
      pruef(`${pfad} bei ${breite} px`, false, 'Menue oder Hinweis nicht gefunden');
    } else if (!m.bannerSichtbar) {
      pruef(`${pfad} bei ${breite} px`, false, 'der Hinweis war gar nicht sichtbar, Messung wertlos');
    } else {
      gesamtVerdeckt += m.verdeckt.length;
      pruef(`${pfad} bei ${breite} px: kein Eintrag verdeckt`,
        m.verdeckt.length === 0 && d,
        m.verdeckt.length ? `${m.verdeckt.length} von ${m.gesamt} verdeckt: ${m.verdeckt.join(', ')}`
                          : `${m.gesamt} Eintraege frei`);
    }
    await ctx.close();
  }
}

await browser.close();

if (GEGENPROBE) {
  console.log('');
  const ok = gesamtVerdeckt > 0;
  console.log(`  ${ok ? 'ok     ' : 'FEHLER '} Die Verdeckung faellt auf`.padEnd(58) +
    `${gesamtVerdeckt} verdeckte Eintraege insgesamt`);
  console.log(`\nErgebnis: ${ok ? 'die Gegenprobe faellt auf' : 'die Gegenprobe blieb unbemerkt'}`);
  process.exit(ok ? 0 : 1);
}

console.log(`\nErgebnis: ${fehler === 0 ? `alle ${geprueft} Prüfungen bestanden`
  : `${fehler} von ${geprueft} Prüfungen fehlgeschlagen`}`);
process.exit(fehler === 0 ? 0 : 1);
