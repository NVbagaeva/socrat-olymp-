import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const metody = ['nesovmestnye', 'protivopolozhnoe', 'koordinatnaya', 'sovmestnye', 'uslovnaya', 'nezavisimye', 'hotya-by', 'dva-predmeta', 'polnaya', 'do-uspeha'];
const svod = {};
for (const w of [360, 500, 768, 1440]) {
  for (const m of metody) {
    const page = await b.newPage({ viewport: { width: w, height: 1100 } });
    await page.goto(`http://localhost:4173/zadaniya/5/trenazher/${m}/`, { waitUntil: 'networkidle' });
    const start = page.getByRole('button', { name: 'Начать тренировку' });
    if (await start.count() === 0) { console.log(`@${w} ${m}: нет старта`); await page.close(); continue; }
    await start.click();
    await page.waitForSelector('.pc');
    let shire = [], stran = 0, vsego = 0;
    for (let zad = 0; zad < 4; zad++) {
      const knopka = page.getByRole('button', { name: /Показать решение|Открыть решение/ }).first();
      if (await knopka.count() === 0) break;
      await knopka.click();
      for (let i = 0; i < 8; i++) { const sh = page.getByRole('button', { name: /^Шаг \d|^Ответ$/ }).first(); if (await sh.count() === 0) break; await sh.click(); }
      await page.waitForTimeout(120);
      const r = await page.evaluate(() => {
        const R = (el) => el.getBoundingClientRect().width;
        const out = [];
        for (const v of document.querySelectorAll('.pc-step__formula')) {
          const dost = R(v.parentElement);
          for (const s of v.querySelectorAll('.vykladka__stroka')) if (R(s) > dost + 0.5) out.push(`${Math.round(R(s))}/${Math.round(dost)} «${s.querySelector('annotation')?.textContent.slice(0, 40)}»`);
        }
        return { out, n: document.querySelectorAll('.pc-step__formula').length, stran: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      shire.push(...r.out); vsego += r.n; stran = Math.max(stran, r.stran);
      const dalshe = page.getByRole('button', { name: /Дальше|Следующая|Далее/ }).first();
      if (await dalshe.count() === 0) break;
      await dalshe.click(); await page.waitForTimeout(120);
    }
    svod[`${w} ${m}`] = `формул ${vsego}, шире колонки ${shire.length}${shire.length ? ': ' + [...new Set(shire)].join('; ') : ''}, страница ${stran}px`;
    await page.close();
  }
}
for (const [k, v] of Object.entries(svod)) console.log(k, '→', v);
await b.close();
