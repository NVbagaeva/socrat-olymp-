/* scripts/snimki-planimetry-hints.mjs — снимки подсказок задания №1.

   node scripts/snimki-planimetry-hints.mjs --base http://localhost:4173 --out папка
        [--proto 6,7,8] [--vid telefon|kompyuter] [--stranica]

   По одной задаче каждого прототипа (первая в банке или первый аналог):
   открывает задачу в тренажёре, раскрывает подсказку и проходит все её
   шаги. На каждом шаге — снимок блока подсказки (чертёж шага и вопрос)
   и снимок открытой карточки «Показать свойство». Верная кнопка
   находится перебором: заодно видно подсветку кнопки факта после
   неверного ответа.

   --stranica — снимок всей страницы на каждом шаге (пары «было/стало»:
   годится и для сборки без чертежей в шагах).

   Сайт должен быть собран и роздан (out/): адрес — в --base. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { planyTrenazhera, PROTOTIPY } from './lib/planimetry-hints.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const arg = (imya, zapas) => {
  const i = args.indexOf(`--${imya}`);
  return i >= 0 ? args[i + 1] : zapas;
};
const BASE = arg('base', 'http://localhost:4173');
const OUT = arg('out', 'snimki-planimetry-hints');
const TOLKO = arg('proto', '');
const VID = arg('vid', '');
const STRANICA = args.includes('--stranica');

const VIDY = [
  { imya: 'telefon', viewport: { width: 375, height: 760 }, deviceScaleFactor: 2 },
  { imya: 'kompyuter', viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 },
].filter((v) => VID === '' || v.imya === VID);

const nuzhnye = TOLKO === '' ? null : new Set(TOLKO.split(',').map(Number));
const plany = planyTrenazhera(0);
const zadachi = PROTOTIPY.filter((p) => nuzhnye === null || nuzhnye.has(p.id)).map((p) => {
  const id = `p${String(p.id).padStart(2, '0')}`;
  const plan = plany.find((x) => x.id === id);
  return { proto: p.id, klyuch: `${id}|${plan.vid === 'bank' ? 'b' : 'a'}${plan.no}` };
});

fs.mkdirSync(OUT, { recursive: true });
const zhurnal = [];
const browser = await chromium.launch();

for (const vid of VIDY) {
  const ctx = await browser.newContext({
    viewport: vid.viewport,
    deviceScaleFactor: vid.deviceScaleFactor,
    locale: 'ru-RU',
  });
  /* Плашка cookie не закрывает экран: согласие уже записано. */
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('cookie-consent', 'yes');
      localStorage.setItem('cookies', 'accepted');
    } catch {
      /* без хранилища — как есть */
    }
  });
  const page = await ctx.newPage();
  const oshibki = [];
  page.on('pageerror', (e) => oshibki.push(String(e.message)));

  for (const z of zadachi) {
    /* Чистое хранилище: иначе тренажёр возобновит прежнюю тренировку. */
    await page.goto(`${BASE}/404.html`).catch(() => {});
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* без хранилища — как есть */
      }
    });
    const imya = (hvost) =>
      path.join(OUT, `p${String(z.proto).padStart(2, '0')}-${vid.imya}-${hvost}.png`);
    const snimok = async (hvost, lokator) => {
      if (STRANICA || lokator === null) await page.screenshot({ path: imya(hvost), fullPage: STRANICA });
      else await lokator.screenshot({ path: imya(hvost) });
    };
    try {
      await page.goto(`${BASE}/zadaniya/1/trenazher/?zadacha=${encodeURIComponent(z.klyuch)}`);
      const knopka = page.locator('.trn-podskazka-knopka');
      await knopka.waitFor({ timeout: 30000 });
      /* Плашки поверх экрана (cookie) — убрать, если есть. */
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('[class*="cookie" i]')) el.remove();
      });
      if (STRANICA) await snimok('0-uslovie', null);
      await knopka.click();
      await page.locator('.trn-voprosy').waitFor();
      let shag = 0;
      for (;;) {
        const voprosy = page.locator('.trn-vopros');
        const n = await voprosy.count();
        if (n <= shag) break;
        shag = n;
        const tek = voprosy.nth(n - 1);
        await tek.scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        await snimok(`shag${shag}`, tek);
        const fakt = tek.locator('.fakt1-knopka');
        if ((await fakt.count()) > 0) {
          await fakt.first().click();
          await page.locator('.fakt1-okno .fakt1').waitFor({ timeout: 30000 });
          await page.waitForTimeout(300);
          await page.screenshot({ path: imya(`shag${shag}-fakt`) });
          zhurnal.push({ proto: z.proto, vid: vid.imya, shag, fakt: await fakt.first().getAttribute('data-fakt') });
          await page.keyboard.press('Escape');
          await page.locator('.fakt1-okno').waitFor({ state: 'detached' });
        } else zhurnal.push({ proto: z.proto, vid: vid.imya, shag, fakt: null });
        /* Верная кнопка — перебором. */
        const knopki = tek.locator('.trn-vopros__knopka');
        const vsego = await knopki.count();
        let dalshe = false;
        for (let j = 0; j < vsego && !dalshe; j += 1) {
          if (await knopki.nth(j).isDisabled()) continue;
          await knopki.nth(j).click();
          await page.waitForTimeout(120);
          dalshe =
            (await page.locator('.trn-vopros').count()) > n ||
            (await page.locator('.trn-voprosy__gotovo').count()) > 0;
        }
        if ((await page.locator('.trn-voprosy__gotovo').count()) > 0) break;
        if (!dalshe) throw new Error(`шаг ${shag}: верная кнопка не нашлась`);
      }
      if (STRANICA) await snimok('9-vse-shagi', null);
      else await page.locator('.trn-voprosy').screenshot({ path: imya('vse-shagi') });
    } catch (e) {
      zhurnal.push({ proto: z.proto, vid: vid.imya, oshibka: String(e.message ?? e).split('\n')[0] });
    }
  }
  if (oshibki.length > 0) zhurnal.push({ vid: vid.imya, oshibkiStranicy: [...new Set(oshibki)] });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'zhurnal.json'), `${JSON.stringify(zhurnal, null, 1)}\n`);
const sboi = zhurnal.filter((x) => x.oshibka !== undefined || x.oshibkiStranicy !== undefined);
console.log(`Снимки: ${OUT}; шагов ${zhurnal.filter((x) => x.shag !== undefined).length}, сбоев ${sboi.length}`);
for (const x of sboi) console.log('  ', JSON.stringify(x));
