import { chromium } from 'playwright';
const B = 'http://localhost:4321';
const puti = [
  '/zadaniya/4/', '/zadaniya/4/teoriya/', '/zadaniya/4/metody/', '/zadaniya/4/opornye-zadachi/',
  '/zadaniya/4/trenazher/', '/zadaniya/4/generator/', '/zadaniya/4/dlya-repetitorov/',
  '/zadaniya/5/', '/zadaniya/5/metody/', '/zadaniya/5/opornye-zadachi/',
  '/zadaniya/5/trenazher/', '/zadaniya/5/generator/', '/zadaniya/5/dlya-repetitorov/',
  '/zadaniya/8/', '/zadaniya/8/teoriya/', '/zadaniya/8/opornye-zadachi/',
  '/zadaniya/8/trenazher/', '/zadaniya/8/generator/',
  '/zadaniya/3/', '/zadaniya/3/trenazher/',
  '/zadaniya/3/konus/', '/zadaniya/3/konus/opornye-zadachi/', '/zadaniya/3/konus/trenazher/',
  '/zadaniya/12/', '/zadaniya/12/linear/', '/zadaniya/12/linear/opornye-zadachi/',
  '/zadaniya/12/linear/trenazher/', '/zadaniya/12/linear/dlya-repetitorov/',
];
const shirin = [360, 768, 1024, 1280, 1440];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
let bed = 0;
for (const put of puti) {
  const stroki = [];
  for (const w of shirin) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    const oshibki = [];
    p.on('pageerror', (e) => oshibki.push(String(e)));
    const r = await p.goto(B + put, { waitUntil: 'networkidle' });
    const m = await p.evaluate(() => {
      const d = document.documentElement;
      const lenta = document.querySelector('.topic-tabs, .tabs--lenta');
      const aktiv = document.querySelector('[aria-selected="true"], [aria-current="page"]');
      const panel = document.querySelector('.section-panel, .topic-panel, main');
      return {
        scroll: d.scrollWidth, client: d.clientWidth,
        lenta: lenta !== null,
        aktiv: aktiv?.textContent?.trim().slice(0, 28) ?? null,
        telo: (panel?.textContent?.trim().length ?? 0),
      };
    });
    const beda = [];
    if (r.status() !== 200) beda.push('HTTP ' + r.status());
    if (m.scroll > m.client) beda.push(`прокрутка вбок ${m.scroll}>${m.client}`);
    if (!m.lenta) beda.push('ленты нет');
    if (m.aktiv === null) beda.push('активной вкладки нет');
    if (m.telo < 200) beda.push('содержимое пустое ' + m.telo);
    if (oshibki.length) beda.push('JS: ' + oshibki[0].slice(0, 80));
    if (beda.length) { stroki.push(`  ${w}: ${beda.join('; ')}`); bed++; }
    await p.close();
  }
  console.log((stroki.length ? 'ПЛОХО ' : 'ок    ') + put + (stroki.length ? '\n' + stroki.join('\n') : ''));
}
console.log(bed === 0 ? '\nВсе страницы чисты.' : `\nНарушений: ${bed}`);
await b.close();
