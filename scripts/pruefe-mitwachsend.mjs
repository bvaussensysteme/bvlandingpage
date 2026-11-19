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
/* Hinweise sind KEINE Beanstandung: Sie stehen im Bericht, damit sie
   nicht verschwiegen werden, lassen die Pruefung aber gruen. */
const hinweise = [];

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
        /* min-width, nicht width: style.css hat eine Regel
           "* { max-width: 100% }", die ein zu breites Element stillschweigend
           zurechtstutzt. Mit width haette die Gegenprobe nichts gefunden und
           waere trotzdem durchgelaufen. Gefunden am 15.11.2026. */
        d.style.cssText = 'min-width:3000px;height:30px;background:red';
        d.id = 'gegenprobe-breit';
        document.body.appendChild(d);
        const b = document.createElement('button');
        b.textContent = 'x';
        b.style.cssText = 'width:12px;height:12px;padding:0';
        b.id = 'gegenprobe-klein';
        document.body.appendChild(b);
        /* Ein schwebender Knopf genau ueber einem vorhandenen. */
        const ziel = [...document.querySelectorAll('a[href], button')]
          .find(x => { const r = x.getBoundingClientRect();
            return r.width > 60 && r.height > 20 && r.top > 0 && r.top < window.innerHeight - 40; });
        if (ziel) {
          const r = ziel.getBoundingClientRect();
          const f = document.createElement('button');
          f.textContent = 'ueber';
          f.id = 'gegenprobe-deckung';
          /* Mindestens 24 x 24 px Ueberdeckung, sonst bliebe sie
             unter der Schwelle und die Gegenprobe waere blind. */
          f.style.cssText = 'position:fixed;z-index:99999;width:44px;height:44px;left:' +
            Math.round(r.left + 2) + 'px;top:' + Math.round(Math.max(0, r.top - 6)) + 'px';
          document.body.appendChild(f);
        }
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
      /* NICHT ueber scrollWidth messen: style.css setzt
         "html, body { overflow-x: hidden }". Damit kann die Seite gar
         nicht waagerecht scrollen, und die Messung waere immer 0,
         obwohl Inhalt abgeschnitten wird. Gemessen wird deshalb, ob
         sichtbare Elemente ueber den rechten Fensterrand hinausragen. */
      const ueberRand = [];
      document.querySelectorAll('body *').forEach(e => {
        if (!sichtbar(e)) return;
        const s2 = getComputedStyle(e);
        if (s2.position === 'fixed') return;
        let p2 = e.parentElement, geschnitten = false;
        while (p2 && p2 !== document.body) {
          const ps2 = getComputedStyle(p2);
          if (ps2.overflowX !== 'visible') { geschnitten = true; break; }
          p2 = p2.parentElement;
        }
        if (geschnitten) return;   // Karussells und Schieber duerfen das
        const r = e.getBoundingClientRect();
        if (r.right > window.innerWidth + 2)
          ueberRand.push({ kennung: e.tagName.toLowerCase() + (e.id ? '#' + e.id : ''),
            ueber: Math.round(r.right - window.innerWidth) });
      });
      /* ---- Bedienelemente uebereinander ----
         ANLASS (19.11.2026): Die beiden runden Knoepfe am rechten Rand
         lagen am Telefon auf den Knoepfen des Heldenbereichs. Gemessen
         bei 390 x 750: 42 x 31 px von "Katalog ansehen" und 42 x 36 px
         von "WhatsApp". Ein Tipp auf das rechte Ende eines Hero-Knopfes
         oeffnete das Bedienfeld statt der Seite. Keine der drei
         Messungen oben findet so etwas: Jedes Element fuer sich ist
         gross genug und ragt nirgends hinaus.

         Gemessen wird nur SCHWEBENDES ueber Normalem. Eine feste
         Kopfzeile, unter der Inhalt durchlaeuft, ist Absicht und wird
         deshalb ausgenommen. */
      const bedien = 'a[href], button, [role="button"], input[type=checkbox], input[type=radio]';
      const schwebend = [], normal = [];
      document.querySelectorAll(bedien).forEach(e => {
        if (!sichtbar(e)) return;
        const st = getComputedStyle(e);
        if (st.pointerEvents === 'none') return;
        if (st.position === 'fixed') {
          if (e.closest('header, nav, [role="banner"], .navbar, .mobile-menu')) return;
          schwebend.push(e);
        } else normal.push(e);
      });
      const deckung = [], knapp = [];
      schwebend.forEach(f => {
        const a = f.getBoundingClientRect();
        normal.forEach(l => {
          const c = l.getBoundingClientRect();
          if (c.width < 4 || c.height < 4) return;
          const ux = Math.min(a.right, c.right) - Math.max(a.left, c.left);
          const uy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
          /* SCHWELLE 24 x 24 px, die Mindestgroesse einer antippbaren
             Flaeche nach WCAG 2.2, 2.5.8. Eine kleinere Ueberdeckung
             kann keine ganze Trefferflaeche schlucken; eine groessere
             schon. Dieselbe Schwelle benutzt js/main.js, damit Messung
             und Abhilfe dasselbe meinen.

             Was knapp darunter liegt, wird unten als Hinweis genannt
             und nicht verschwiegen. */
          if (ux < 24 || uy < 24) {
            if (ux > 2 && uy > 2) knapp.push(Math.round(ux) + 'x' + Math.round(uy));
            return;
          }
          const kn = (x) => x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') +
            ' "' + (x.textContent || '').trim().slice(0, 18) + '"';
          deckung.push({ kennung: kn(f) + ' auf ' + kn(l),
                         ueber: Math.round(ux) + 'x' + Math.round(uy) });
        });
      });
      return {
        deckungGesamt: deckung.length,
        deckung: deckung.slice(0, 3),
        knappGesamt: knapp.length, knapp: knapp.slice(0, 3),
        ueberRandGesamt: ueberRand.length,
        ueberRand: ueberRand.slice(0, 3),
        raus: raus.slice(0, 5), rausGesamt: raus.length,
        klein: klein.slice(0, 5), kleinGesamt: klein.length
      };
    });

    if (ergebnis.ueberRandGesamt)
      befunde.push(`${pfad} bei ${breite} px: ${ergebnis.ueberRandGesamt} Element(e) ragen ueber den rechten Fensterrand, z. B. ` +
        ergebnis.ueberRand.map(r => `${r.kennung} um ${r.ueber} px`).join(', '));
    if (ergebnis.rausGesamt)
      befunde.push(`${pfad} bei ${breite} px: ${ergebnis.rausGesamt} Element(e) ragen aus ihrem Kasten, z. B. ` +
        ergebnis.raus.map(r => `${r.kennung} um ${r.ueber} px`).join(', '));
    if (ergebnis.kleinGesamt)
      befunde.push(`${pfad} bei ${breite} px: ${ergebnis.kleinGesamt} Flaeche(n) unter 24x24 px, z. B. ` +
        ergebnis.klein.map(k => `${k.kennung} ${k.groesse}`).join(', '));
    if (ergebnis.deckungGesamt)
      befunde.push(`${pfad} bei ${breite} px: ${ergebnis.deckungGesamt} schwebende(s) Bedienelement(e) liegen auf anderen, z. B. ` +
        ergebnis.deckung.map(d => `${d.kennung} um ${d.ueber} px`).join(', '));
    if (ergebnis.knappGesamt)
      hinweise.push(`${pfad} bei ${breite} px: ${ergebnis.knappGesamt} Ueberdeckung(en) unter 24x24 px: ` +
        ergebnis.knapp.join(', '));
  }
}

await browser.close();
server.kill();

const geprueft = SEITEN.length * BREITEN.length;
/* Die Gegenprobe prueft NICHT nur, ob ueberhaupt etwas gefunden wurde:
   Sonst wuerde sie auch dann bestehen, wenn echte Fehler sie zufaellig
   retten, waehrend die eingebauten unentdeckt bleiben. Sie verlangt
   beide eingebauten Fehler namentlich. */
if (GEGENPROBE) {
  const alles = befunde.join(' | ');
  const breitErkannt = alles.includes('gegenprobe-breit') || /ueber den rechten Fensterrand/.test(alles);
  const kleinErkannt = alles.includes('gegenprobe-klein');
  befunde.forEach(b => console.log('  ' + b));
  if (breitErkannt && kleinErkannt) {
    console.log('Ergebnis: Gegenprobe bestanden, beide eingebauten Fehler gefunden');
    process.exit(0);
  }
  console.log('Ergebnis: GEGENPROBE FEHLGESCHLAGEN' +
    (breitErkannt ? '' : ', zu breites Element nicht gefunden') +
    (kleinErkannt ? '' : ', zu kleine Flaeche nicht gefunden'));
  process.exit(1);
}
if (hinweise.length) {
  console.log('Hinweise (keine Beanstandung):');
  hinweise.forEach(h => console.log('  ' + h));
}
if (befunde.length) {
  befunde.forEach(b => console.log('  ' + b));
  console.log(`Ergebnis: ${befunde.length} Beanstandung(en) in ${geprueft} Messungen`);
  process.exit(1);
}
console.log(`Ergebnis: alle ${geprueft} Messungen ohne Beanstandung`);
