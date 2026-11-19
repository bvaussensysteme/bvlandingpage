import {chromium} from 'playwright';
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
const p=await c.newPage();
let imgs=new Set(),bytes=0,tot={};
p.on('response',async r=>{try{const u=r.url();const l=(await r.body()).length;bytes+=l;if(u.includes('/portfolio/'))imgs.add(u);}catch{}});
await p.addInitScript(()=>{window.cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.cls+=e.value}).observe({type:'layout-shift',buffered:true});});
await p.goto('http://localhost:8821/produkte/terrassenueberdachung.html',{waitUntil:'load'});
await p.waitForTimeout(1500);
console.log('load',bytes,'portfolio imgs',imgs.size);
const sw=await p.evaluate(()=>[document.documentElement.scrollWidth,document.querySelector('.galerie-streifen').scrollWidth,document.querySelector('.galerie-kachel img').getBoundingClientRect().width,document.querySelector('.galerie-kachel img').getBoundingClientRect().height]);
console.log(sw);
await p.evaluate(()=>document.querySelector('.galerie-streifen').scrollIntoView());
await p.waitForTimeout(1500);
console.log('after vertical scroll',bytes,imgs.size);
for(let i=0;i<8;i++){await p.evaluate(()=>{const s=document.querySelector('.galerie-streifen');s.scrollLeft+=300});await p.waitForTimeout(300);}
await p.waitForTimeout(1000);
console.log('after h-scroll 2400px',bytes,imgs.size,'cls',await p.evaluate(()=>window.cls));
await b.close();
