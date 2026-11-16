#!/usr/bin/env node
/* scripts/glavnaya/snimki-vecher.mjs — снимки настоящих листов сайта для
   блока главной «Мы взяли на себя то, что обычно забирает ваш вечер»
   (components/landing/sumerki/VecherKartochki.tsx).

   Снимает страницы печати генераторов из собранного сайта (app/out) —
   те же листы, что получает учитель, с фиксированным зерном (seed), так
   что при пересборке снимки не меняются. Имён учеников и личных данных
   на листах нет: строка «Фамилия, имя» пустая, в шапке — автор сайта.

   Генераторы большинства заданий без тарифа закрыты (lib/tarify/
   dostup.ts), поэтому браузер съёмки ставит ключ проверок
   budetege:dostup:proverka — он действует только на 127.0.0.1.

   Выход: public/images/glavnaya/vecher-<имя>-{520,1040}.webp — верх
   страницы A4 (шапка листа и первые задачи), 1x и 2x, для карточек;
   vecher-<имя>-list-{1200,1588}.webp — страница целиком, для просмотра
   (грузится только когда просмотр открыли).

   Запуск (после сборки): node scripts/glavnaya/snimki-vecher.mjs */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(APP, 'out');
const DIR = path.join(APP, 'public/images/glavnaya');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
fs.mkdirSync(DIR, { recursive: true });

/* Наборы. Зёрна фиксированы — листы те же при каждой съёмке. */
const PLANIMETRIYA = 's=p01%3A1%2Cp05%3A1%2Cp13%3A1&seed=GLAVNAYA1';
const SAMOSTOYATELNAYA = `/zadaniya/1/pechat/?m=v&i=m&ps=2&${PLANIMETRIYA}&v=3&vr=sr`;
const OTVETY = `/zadaniya/1/pechat/otvety/?m=v&i=m&ps=2&${PLANIMETRIYA}&v=3&vr=sr`;
const DOMASHNYAYA =
  '/zadaniya/11/pechat/?m=v&i=m&ps=2&s=PR-04%3A1%2CSM-04%3A1%2CDP-07%3A1&v=1&seed=GLAVNAYA2&tr=1&pr=1&vr=dz';
const SPRAVOCHNIK = '/zadaniya/1/pechat/spravochnik/';

/**
 * Что снимать: страница печати, какая страница листа (по счёту или по
 * тексту на ней) и сколько сверху взять — в долях высоты A4.
 */
const SNIMKI = [
  {
    imya: 'samostoyatelnaya-v1',
    put: SAMOSTOYATELNAYA,
    stranica: { tekst: 'Вариант 1', pervaya: true },
    verh: 0.56,
  },
  {
    imya: 'samostoyatelnaya-v2',
    put: SAMOSTOYATELNAYA,
    stranica: { tekst: 'Вариант 2', pervaya: true },
    verh: 0.56,
  },
  {
    imya: 'samostoyatelnaya-v3',
    put: SAMOSTOYATELNAYA,
    stranica: { tekst: 'Вариант 3', pervaya: true },
    verh: 0.56,
  },
  { imya: 'domashnyaya', put: DOMASHNYAYA, stranica: { nomer: 0 }, verh: 0.62 },
  { imya: 'domashnyaya-2', put: DOMASHNYAYA, stranica: { nomer: 1 }, verh: 0.62 },
  { imya: 'proverka-razbor', put: OTVETY, stranica: { nomer: 0 }, verh: 0.56 },
  { imya: 'proverka-otvety', put: OTVETY, stranica: { tekst: 'Ответы' }, verh: 0.56 },
  { imya: 'materialy-spravochnik', put: SPRAVOCHNIK, stranica: { nomer: 2 }, verh: 0.62 },
  { imya: 'materialy-oblozhka', put: SPRAVOCHNIK, stranica: { nomer: 0 }, verh: 0.56 },
];

const TIPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (!file.startsWith(OUT)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TIPY[path.extname(file)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1100, height: 1400 },
  deviceScaleFactor: 2,
});
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
    localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
    /* Только для съёмки: открывает генераторы на 127.0.0.1. */
    localStorage.setItem('budetege:dostup:proverka', 'true');
  } catch {
    /* без хранилища */
  }
});
const page = await ctx.newPage();
let otkryto = '';
try {
  for (const s of SNIMKI) {
    if (otkryto !== s.put) {
      const otvet = await page.goto(BASE + s.put, { waitUntil: 'networkidle' });
      if (!otvet || otvet.status() !== 200) throw new Error(`${s.put}: ${otvet?.status()}`);
      await page.waitForSelector('.sheet-page', { timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      otkryto = s.put;
    }
    const stranicy = page.locator('.sheet-page');
    let i = s.stranica.nomer ?? -1;
    if (s.stranica.tekst !== undefined) {
      const teksty = await stranicy.evaluateAll((els) => els.map((e) => e.innerText));
      i = teksty.findIndex(
        (t) => t.includes(s.stranica.tekst) && (!s.stranica.pervaya || t.includes('Фамилия')),
      );
    }
    if (i < 0) throw new Error(`${s.imya}: не нашлась страница`);
    const el = stranicy.nth(i);
    await el.scrollIntoViewIfNeeded();
    const box = await el.boundingBox();
    const list = await page.screenshot({
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
    const { width: W, height: H } = await sharp(list).metadata();
    const verh = await sharp(list)
      .extract({ left: 0, top: 0, width: W, height: Math.round(H * s.verh) })
      .toBuffer();
    const vyhody = [
      ...[520, 1040].map((w) => ({ w, src: verh, file: `vecher-${s.imya}-${w}.webp`, q: 80 })),
      ...[1200, 1588].map((w) => ({
        w,
        src: list,
        file: `vecher-${s.imya}-list-${w}.webp`,
        q: 82,
      })),
    ];
    for (const v of vyhody) {
      const file = path.join(DIR, v.file);
      const info = await sharp(v.src).resize(v.w).webp({ quality: v.q, effort: 6 }).toFile(file);
      console.log(
        path.relative(APP, file),
        `${info.width}×${info.height}`,
        `${Math.round(info.size / 1024)} КБ`,
      );
    }
  }
} finally {
  await browser.close();
  server.close();
}
