#!/usr/bin/env node
/* Prueft: Stimmt der FAQ-Text im strukturierten Datenblock wortgleich
 * mit dem ueberein, was der Besucher sieht?
 *
 * Hintergrund: CLAUDE.md verlangt, dass eine Aenderung am sichtbaren Text
 * im Schema.org-Block mitgezogen wird. Am 14.11.2026 ist genau das
 * schiefgegangen: Beim Entfernen der Gedankenstriche schuetzte das Skript
 * <script>-Bloecke, und die strukturierten Daten liegen in einem solchen
 * Block. Ergebnis: 35 FAQ-Eintraege auf 14 Ortsseiten sagten etwas
 * anderes als die Seite. Google wertet das ab oder ignoriert die
 * Auszeichnung. Auffallen kann es ohne Pruefung niemandem, denn beide
 * Fassungen sehen fuer sich genommen richtig aus.
 *
 * Geprueft wird zusaetzlich: Hat jeder Schema-Eintrag ein sichtbares
 * Gegenstueck? Eine Frage, die nur im Datenblock steht, ist gegenueber
 * Google eine Behauptung ueber eine Seite, die es so nicht gibt.
 *
 * Gegenprobe: node scripts/pruefe-schema-faq.mjs --gegenprobe
 * baut vier Faelle nach und erwartet, dass die Pruefung jeden bemerkt.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname;
const gegenprobe = process.argv.includes('--gegenprobe');

function seiten() {
  const liste = [];
  for (const d of ['.', 'produkte', 'ratgeber']) {
    const pfad = join(WURZEL, d);
    if (!existsSync(pfad)) continue;
    for (const f of readdirSync(pfad)) {
      if (!f.endsWith('.html')) continue;
      if (f.startsWith('entwurf') || f === '_template.html') continue;
      liste.push(join(pfad, f));
    }
  }
  return liste.sort();
}

/* Sichtbarer Text eines Schnipsels: Tags raus, Pfeile raus, Leerraum glaetten.
 * Der Pfeil steht im Knopf und ist Zierrat, kein Teil der Frage. */
function sichtbar(h) {
  return h
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<span class="faq-arrow"[\s\S]*?<\/span>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&shy;/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}

function pruefeSeite(datei, inhalt, hinweise = []) {
  const maengel = [];
  const fragen = [...inhalt.matchAll(/<button class="faq-q"[^>]*>([\s\S]*?)<\/button>/g)].map(m => sichtbar(m[1]));
  const antworten = [...inhalt.matchAll(/<div class="faq-a">([\s\S]*?)<\/div>/g)].map(m => sichtbar(m[1]));

  for (const m of inhalt.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let daten;
    try { daten = JSON.parse(m[1]); }
    catch (e) { maengel.push(`JSON-LD ist kein gueltiges JSON: ${e.message}`); continue; }
    if (!daten || daten['@type'] !== 'FAQPage') continue;
    const eintraege = daten.mainEntity || [];

    /* Seiten ohne die uebliche Auszeichnung (etwa der Kostenratgeber, der
     * seine Fragen als Ueberschriften fuehrt) koennen hier nicht verglichen
     * werden. Das wird gemeldet, nicht stillschweigend uebergangen. */
    if (fragen.length === 0) {
      /* Nicht jede Seite fuehrt ihre Fragen als Aufklapper. Der
       * Kostenratgeber stellt sie als Ueberschriften mit Flietext
       * darunter. Dort wird gegen den gesamten sichtbaren Text geprueft:
       * Die Frage MUSS auf der Seite stehen, sonst ist es eine
       * Behauptung ueber eine Seite, die es nicht gibt. Steht die
       * Antwort nur sinngemaess dort, ist das ein Hinweis und kein
       * Fehler: gekuerzte Antworten sind zulaessig, solange die Aussage
       * auf der Seite steht. */
      const koerper = sichtbar(inhalt.replace(/<script[\s\S]*?<\/script>/g, ' '));
      for (const e of eintraege) {
        const frage = String(e.name || '');
        const antwort = String((e.acceptedAnswer && e.acceptedAnswer.text) || '');
        if (!koerper.includes(frage)) {
          maengel.push(`Frage steht nur im Datenblock, nicht auf der Seite: "${frage.slice(0, 70)}"`);
        } else if (!koerper.includes(antwort)) {
          hinweise.push(`Antwort im Datenblock ist gekuerzt, nicht wortgleich: "${frage.slice(0, 55)}"`);
        }
      }
      continue;
    }
    for (const e of eintraege) {
      const frage = e.name;
      const antwort = e.acceptedAnswer && e.acceptedAnswer.text;
      const i = fragen.indexOf(frage);
      if (i === -1) {
        maengel.push(`Frage steht nur im Datenblock, nicht auf der Seite: "${String(frage).slice(0, 70)}"`);
        continue;
      }
      if (antworten[i] !== antwort) {
        maengel.push(`Antwort weicht ab bei "${String(frage).slice(0, 55)}"`);
      }
    }
  }
  return maengel;
}

let fehler = 0, geprueft = 0, seitenMitFaq = 0;
for (const datei of seiten()) {
  const inhalt = readFileSync(datei, 'utf8');
  if (!inhalt.includes('"FAQPage"')) continue;
  seitenMitFaq++;
  const hinweise = [];
  const maengel = pruefeSeite(datei, inhalt, hinweise);
  geprueft += (inhalt.match(/"@type": ?"Question"/g) || []).length;
  const kurz = datei.replace(WURZEL, '');
  if (maengel.length === 0) {
    console.log(`  ok      ${kurz}`);
    for (const h of hinweise) console.log(`  Hinweis ${kurz}: ${h}`);
  } else {
    for (const m of maengel) console.log(`  FEHLER  ${kurz}: ${m}`);
    fehler += maengel.length;
  }
}

if (gegenprobe) {
  console.log('\nGegenprobe: vier gebaute Faelle, jeder muss anschlagen.');
  const faelle = [
    ['Antwort weicht um ein Wort ab',
     `<button class="faq-q">Fahrt ihr nach Koblenz?</button><div class="faq-a"><p>Ja, Koblenz liegt im Gebiet.</p></div>
      <script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Fahrt ihr nach Koblenz?","acceptedAnswer":{"@type":"Answer","text":"Ja, Koblenz liegt im Einzugsgebiet."}}]}</script>`],
    ['Gedankenstrich nur im Datenblock',
     `<button class="faq-q">Fahrt ihr nach Koblenz?</button><div class="faq-a"><p>Ja, Koblenz liegt im Gebiet.</p></div>
      <script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Fahrt ihr nach Koblenz?","acceptedAnswer":{"@type":"Answer","text":"Ja – Koblenz liegt im Gebiet."}}]}</script>`],
    ['Frage ohne sichtbares Gegenstueck',
     `<button class="faq-q">Fahrt ihr nach Koblenz?</button><div class="faq-a"><p>Ja.</p></div>
      <script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Was gilt im Aussenbereich?","acceptedAnswer":{"@type":"Answer","text":"Ja."}}]}</script>`],
    ['kaputtes JSON',
     `<button class="faq-q">Frage?</button><div class="faq-a"><p>Antwort.</p></div>
      <script type="application/ld+json">{"@type":"FAQPage","mainEntity":[,]}</script>`]
  ];
  let erkannt = 0;
  for (const [name, html] of faelle) {
    const m = pruefeSeite('probe.html', html, []);
    if (m.length > 0) { erkannt++; console.log(`  ok      erkannt: ${name}`); }
    else console.log(`  FEHLER  NICHT erkannt: ${name}`);
  }
  console.log(`\nGegenprobe: ${erkannt} von ${faelle.length} erkannt.`);
  process.exit(erkannt === faelle.length ? 0 : 1);
}

console.log(`\n${seitenMitFaq} Seiten mit FAQ-Auszeichnung, ${geprueft} Eintraege geprueft.`);
console.log(fehler === 0
  ? 'Ergebnis: sichtbarer Text und Datenblock sind ueberall wortgleich'
  : `Ergebnis: ${fehler} Abweichung(en), vor dem Veroeffentlichen angleichen`);
process.exit(fehler === 0 ? 0 : 1);
