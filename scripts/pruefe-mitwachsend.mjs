/* Prueft, ob die Seiten sich an jede Bildschirmbreite anpassen.
 *
 * ANLASS (15.11.2026): Der Betreiber musste dreimal hintereinander
 * selbst darauf hinweisen, dass etwas am Telefon abgeschnitten war
 * oder zu schmal stand: die rechte Kachelspalte im Quiz, die Breite
 * des Kastens, die Sprünge zwischen zwei Bildschirmgrößen. Jedes Mal
 * war es im Quelltext nicht zu sehen und erst im Browser messbar.
 *
 * Diese Prüfung ersetzt das Hinsehen durch Messen. Sie laedt jede
 * Seite in mehreren Breiten und meldet drei Dinge:
 *   1. waagerechtes Scrollen der ganzen Seite,
 *   2. sichtbare Elemente, die aus ihrem Elternkasten ragen,
 *   3. antippbare Flaechen unter 24 x 24 px (WCAG 2.2, 2.5.8).
 *
 * Was sie NICHT kann: beurteilen, ob etwas haesslich ist. Sie findet
 * nur, was messbar falsch liegt.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const GEGENPROBE = process.argv.includes('--gegenprobe');
const PORT = 8231;
const SEITEN = ['/index.html', '/carport-koblenz.html', '/produkte/carport.html', '/ratgeber/index.html'];
const BREITEN = [320, 360, 390, 430, 768, 1024, 1440];

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));

const browser = await chromium.launch();
const seite = await browser.newPage();
const befunde = [];

for (const pfad of SEITEN) {
  for (const breite of BREITEN) {
    await seite.setViewportSize({ width: breite, height: 900 });
    await seite.goto('http://127.0.0.1:' + PORT + pfad, { waitUntil: 'load' });
    await seite.waitForTimeout(400);
    /* Einwilligungsbanner wegklicken: Es liegt fest ueber dem Inhalt
       und wuerde jede Messung verfaelschen. */
    try { await seite.click('text=Nur notwendige', { timeout: 1200 }); } catch (e) {}
    await seite.waitForTimeout(250);

    if (GEGENPROBE && breite === 390) {
      /* Ein absichtlich zu breites Element und ein zu kleiner Knopf.
         Schlaegt die Pruefung hier NICHT an, misst sie nichts. */
      await seite.evaluate(() => {
        const d = document.createElement('div');
        d.style.cssText = 'width:3000px;height:30px;background:red';
        d.id = 'gegenprobe-breit';
        document.body.appendChild(d);
        const b = document.createElement('button');
        b.textContent = 'x';
        b.style.cssText = 'width:12px;height:12px;padding:0';
        b.id = 'gegenprobe-klein';
        document.body.appendChild(b);
      });
      await seite.waitForTimeout(150);
    }

    const ergebnis = await seite.evaluate(() => {
      const raus = [];
      const klein = [];
      const sichtbar = (e) => {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      document.querySelectorAll('body *').forEach(e => {
        if (!sichtbar(e)) return;
        const p = e.parentElement;
        if (!p || p === document.body || p === document.documentElement) return;
        const ps = getComputedStyle(p);
        /* Kaesten, die absichtlich abschneiden oder scrollen, zaehlen
           nicht: Dort ist das Hinausragen gewollt. */
        if (ps.overflowX !== 'visible' || ps.position === 'absolute') return;
        if (getComputedStyle(e).position === 'fixed' || getComputedStyle(e).position === 'absolute') return;
        const r = e.getBoundingClientRect(), q = p.getBoundingClientRect();
        const ueber = Math.round(Math.max(r.right - q.right, q.left - r.left));
        if (ueber > 2) raus.push({ kennung: e.tagName.toLowerCase() +
          (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ?
          '.' + e.className.trim().split(/\s+/)[0] : ''), ueber });
      });
      document.querySelectorAll('a, button, input[type=checkbox], input[type=radio], select').forEach(e => {
        if (!sichtbar(e)) return;
        const s = getComputedStyle(e);
        /* Links mitten im Fliesstext sind von 2.5.8 ausgenommen. */
        if (e.tagName === 'A' && s.display.indexOf('inline') === 0) return;
        const r = e.getBoundingClientRect();
        if (r.width < 24 || r.height < 24) klein.push({
          kennung: e.tagName.toLowerCase() + (e.id ? '#' + e.id : ''),
          groesse: Math.round(r.width) + 'x' + Math.round(r.height) });
      });
      return {
        waagerecht: document.documentElement.scrollWidth - window.innerWidth,
        raus: raus.slice(0, 5), rausGesamt: raus.length,
        klein: klein.slice(0, 5), kleinGesamt: klein.length
      };
    });

    if (ergebnis.waagerecht > 2)
      befunde.push(`${pfad} bei ${breite} px: Seite scrollt waagerecht um ${ergebnis.waagerecht} px`);
    if (ergebnis.rausGesamt)
      befunde.push(`${pfad} bei ${breite} px: ${ergebnis.rausGesamt} Element(e) ragen aus ihrem Kasten, z. B. ` +
        ergebnis.raus.map(r => `${r.kennung} um ${r.ueber} px`).join(', '));
    if (ergebnis.kleinGesamt)
      befunde.push(`${pfad} bei ${breite} px: ${ergebnis.kleinGesamt} Flaeche(n) unter 24x24 px, z. B. ` +
        ergebnis.klein.map(k => `${k.kennung} ${k.groesse}`).join(', '));
  }
}

await browser.close();
server.kill();

const geprueft = SEITEN.length * BREITEN.length;
if (befunde.length) {
  befunde.forEach(b => console.log('  ' + b));
  console.log(`Ergebnis: ${befunde.length} Beanstandung(en) in ${geprueft} Messungen`);
  process.exit(GEGENPROBE ? 0 : 1);
}
if (GEGENPROBE) {
  console.log('Ergebnis: GEGENPROBE FEHLGESCHLAGEN, die Pruefung schlaegt nicht an');
  process.exit(1);
}
console.log(`Ergebnis: alle ${geprueft} Messungen ohne Beanstandung`);
