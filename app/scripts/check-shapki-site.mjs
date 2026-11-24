#!/usr/bin/env node
/* scripts/check-shapki-site.mjs — шапки разделов в собранном сайте.

   Запуск: pnpm build && pnpm test:shapki-site

   Для каждого задания действующей структуры (src/content/struktura.js):

   В разметке сборки: заголовок «Задание №N. Название» по ЕГЭ-2027,
   картинка шапки — <picture> с WebP 280 для телефона и 560 для
   компьютера, width/height, без loading="lazy", с fetchpriority="high".

   В Chromium (1440 и телефон 390 с касаниями):
     — шапки одной высоты на компьютере (300–360 px), заголовок не
       налезает на описание;
     — картинка не сдвигает вёрстку: высота шапки до и после загрузки
       картинки одна;
     — кольцо прогресса жесты не ловит (pointer-events: none), подпись
       у гостя — «Войдите — прогресс будет сохраняться»;
     — по нажатию картинка сменяется живым чертежом, код чертежа
       грузится отдельным файлом (не в разметке страницы);
     — с клавиатуры: Tab доходит до картинки, Enter оживляет её, фокус
       переходит на чертёж;
     — телефон: палец по картинке и по живому чертежу вертикально —
       страница прокручивается. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}
const { zadaniyaEge, razdel, nomerRazdela } = requireSrc('content/struktura.js');
const { vseRazdely } = requireSrc('content/tasks.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const RAZDELY = zadaniyaEge().map(({ kod }) => {
  const t = vseRazdely.find((x) => x.kod === kod);
  return { kod, hranenie: razdel(kod).hranenie, nomer: nomerRazdela(kod), name: t.name };
});

/* ── Разметка ───────────────────────────────────────────────── */
for (const r of RAZDELY) {
  const where = `/zadaniya/${r.kod}/`;
  const file = path.join(OUT, 'zadaniya', r.kod, 'index.html');
  check(fs.existsSync(file), `${where}: нет страницы`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  check(
    html.includes(`>Задание №${r.nomer}. ${r.name}<`),
    `${where}: нет заголовка «Задание №${r.nomer}. ${r.name}»`,
  );
  const pic = html.match(/<picture>[\s\S]*?<\/picture>/)?.[0] ?? '';
  check(pic !== '', `${where}: нет картинки шапки`);
  check(
    /<source media="\(max-width: 1023\.98px\)"[^>]*-280\.webp|<source media="\(max-width: 1023\.98px\)"[^>]*kub-shar/.test(
      pic,
    ),
    `${where}: нет WebP 280 для телефона`,
  );
  check(/<img[^>]*(-560\.webp|kub-shar-560\.webp)/.test(pic), `${where}: нет WebP 560`);
  check(/width="260"/.test(pic) && /height="260"/.test(pic), `${where}: у картинки нет размеров`);
  check(!/loading="lazy"/.test(pic), `${where}: картинка шапки с loading="lazy"`);
  check(/fetchPriority="high"|fetchpriority="high"/i.test(pic), `${where}: нет fetchpriority`);
}

/* ── Браузер ────────────────────────────────────────────────── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
/* Картинки шапки можно придержать: так видно, сдвигает ли их загрузка вёрстку. */
let zaderzhka = 0;
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const otdat = () => {
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  };
  if (zaderzhka > 0 && /\/images\/(shapki|zadaniya\/3)\//.test(req.url))
    setTimeout(otdat, zaderzhka);
  else otdat();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

/* Компьютер. */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const r of RAZDELY) {
    const where = `1440 /zadaniya/${r.kod}/`;
    zaderzhka = 1500;
    await page.goto(`${BASE}/zadaniya/${r.kod}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.shapka');
    const doKartinki = await page.$eval('.shapka', (e) => e.getBoundingClientRect().height);
    await page.waitForFunction(
      () => document.querySelector('.zhk__poster img')?.complete === true,
      null,
      { timeout: 15000 },
    );
    zaderzhka = 0;
    const m = await page.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const title = r('.shapka__title');
      const lead = r('.shapka__lead');
      const svg = document.querySelector('.koltso__svg');
      return {
        h: r('.shapka').height,
        nalez: title !== undefined && lead !== undefined && title.bottom > lead.top + 1,
        pe: svg === null ? '' : getComputedStyle(svg).pointerEvents,
        gost: document.querySelector('.koltso__tekst--gost')?.textContent?.trim() ?? '',
        img: r('.zhk__poster img'),
      };
    });
    check(m.h >= 300 && m.h <= 360, `${where}: высота шапки ${Math.round(m.h)} px`);
    check(
      Math.abs(m.h - doKartinki) < 1,
      `${where}: картинка сдвинула вёрстку (${doKartinki} → ${m.h})`,
    );
    check(!m.nalez, `${where}: заголовок налезает на описание`);
    check(m.pe === 'none', `${where}: кольцо ловит жесты (${m.pe})`);
    check(m.gost === 'Войдите — прогресс будет сохраняться', `${where}: подпись гостя «${m.gost}»`);
    check(
      m.img.width >= 230 && m.img.width <= 280,
      `${where}: картинка ${Math.round(m.img.width)} px`,
    );

    /* Клавиатура: фокус на картинку, Enter — живой чертёж с фокусом. */
    await page.focus('.zhk__poster');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.zhk.is-zhivoy', { timeout: 15000 }).catch(() => {});
    const zhivoy = await page.evaluate(() => ({
      est: document.querySelector('.zhk.is-zhivoy .zhk__zhivoy') !== null,
      fokus: document.activeElement?.closest('.zhk__zhivoy') !== null,
    }));
    check(zhivoy.est, `${where}: Enter не оживил картинку`);
    check(zhivoy.fokus, `${where}: фокус не перешёл на живой чертёж`);
  }
  await page.close();
}

/* Телефон: вертикальный жест по шапке — прокрутка страницы. */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const palcem = async (sel) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const bb = await (await page.$(sel)).boundingBox();
    const x = Math.round(bb.x + bb.width / 2);
    let y = Math.round(bb.y + bb.height * 0.6);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let k = 0; k < 10; k += 1) {
      y -= 15;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (k % 2), y }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(400);
    return page.evaluate(() => window.scrollY);
  };
  for (const r of RAZDELY) {
    const where = `390 /zadaniya/${r.kod}/`;
    await page.goto(`${BASE}/zadaniya/${r.kod}/`, { waitUntil: 'load' });
    await page.waitForSelector('.zhk__poster');
    const t = await page.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const title = r('.shapka__title');
      return { nalez: title.bottom > r('.shapka__chipy').top + 1, media: r('.koltso__krug').width };
    });
    check(!t.nalez, `${where}: заголовок налезает на чипы`);
    check(t.media >= 100 && t.media <= 124, `${where}: кольцо ${Math.round(t.media)} px`);
    check((await palcem('.zhk__poster')) > 80, `${where}: по картинке страница не прокручивается`);
    check(
      !(await page.evaluate(() => document.querySelector('.zhk.is-zhivoy') !== null)),
      `${where}: прокрутка по картинке оживила её`,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.tap('.zhk__poster');
    await page.waitForSelector('.zhk.is-zhivoy', { timeout: 15000 }).catch(() => {});
    check(
      (await palcem('.zhk__zhivoy')) > 80,
      `${where}: по живому чертежу страница не прокручивается`,
    );
  }
  await ctx.close();
}

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(`check-shapki-site: ${failures.length} из ${checks} не прошли`);
  for (const f of failures) console.error(`  — ${f}`);
  process.exit(1);
}
console.log(`check-shapki-site: ok (${checks} проверок, разделов ${RAZDELY.length})`);
