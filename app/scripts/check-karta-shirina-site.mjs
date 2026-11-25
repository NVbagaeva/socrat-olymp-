#!/usr/bin/env node
/* scripts/check-karta-shirina-site.mjs — карта «О задании» во всю ширину.

   Запуск: pnpm build && pnpm test:karta-shirina-site
   Часть разделов: NOMERA=4,5 pnpm test:karta-shirina-site

   Было: класс картинки к задаче совпал с классом карты «О задании»
   (.kz), и правило картинки (float: right; width: 170px) сжимало карту
   в полоску у правого края. На №4/№5 — сразу, в остальных разделах —
   после перехода внутри сайта: стили посещённой страницы остаются
   загруженными.

   Для разделов №1–№13, №21 и скрытого №6 (адреса — razdelBase() из
   lib/paths.ts; №6 — с меткой администратора), в окне 1440, 1024 и 375 px:
     (а) прямой заход на «О задании»;
     (б) переход внутри сайта: «Тренажёр» раздела → вкладка «О задании»;
     (в) то же через «Опорные задачи» (у раздела без опорных — пропуск).
   Если страница, с которой уходим, не подгрузила стили картинок к
   задачам, сначала открывается тренажёр №4 (его стили картинок
   остаются), а к нужной странице идём переходом внутри сайта.

   Проверка: div.kz занимает всю ширину своей панели (±2 px), у него
   float: none, у страницы нет горизонтальной прокрутки. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import { metkaAdministratora } from './lib/metka-skrytyh.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}
const { razdelBase, href } = requireSrc('lib/paths.ts');
const { OPORNYE } = requireSrc('content/opornye.ts');

const NOMERA = process.env.NOMERA
  ? process.env.NOMERA.split(',').map(Number)
  : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 21];
const OKNA = [
  { w: 1440, h: 900 },
  { w: 1024, h: 800 },
  { w: 375, h: 760 },
];
const TRENAZHER = 'trenazher';

/** Страница есть в сборке: адрес → out/…/index.html. */
function estStranica(url) {
  return fs.existsSync(path.join(OUT, url, 'index.html'));
}

const failures = [];
const skipped = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* ── Сервер над out/ ─────────────────────────────────────────── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

/** На странице подгружены стили картинок к задачам. */
async function estStiliKartinok(page) {
  return page.evaluate(() =>
    [...document.styleSheets].some((sh) => {
      try {
        return [...sh.cssRules].some((r) => r.cssText.includes('kzad'));
      } catch {
        return false;
      }
    }),
  );
}

/** Переход внутри сайта, без перезагрузки: стили прежней страницы остаются. */
async function perekhod(page, url) {
  const ssylka = page.locator(`a[href="${url}"]`).first();
  if ((await ssylka.count()) > 0 && (await ssylka.isVisible())) {
    await ssylka.click();
  } else {
    await page.evaluate((u) => window.next.router.push(u), url);
  }
  await page.waitForURL((u) => u.pathname === url, { timeout: 20000 });
}

/** Клик по вкладке «О задании» (переход внутри сайта). */
async function kVkladkeOZadanii(page, url) {
  const tab = page
    .locator('[role=tab], a')
    .filter({ hasText: /^\s*О задании\s*$/ })
    .first();
  await tab.waitFor({ state: 'visible', timeout: 20000 });
  await tab.click();
  await page.waitForURL((u) => u.pathname === url, { timeout: 20000 });
}

async function izmerit(page) {
  await page.waitForSelector('div.kz', { state: 'visible', timeout: 20000 });
  /* Стили новой страницы доезжают после смены адреса. */
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const kz = document.querySelector('div.kz');
    const panel = kz.parentElement;
    const cs = getComputedStyle(panel);
    const vnutri = panel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return {
      klass: kz.className,
      shirina: kz.getBoundingClientRect().width,
      panel: vnutri,
      float: getComputedStyle(kz).float,
      prokrutka: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

function proverit(m, where) {
  check(
    Math.abs(m.shirina - m.panel) <= 2,
    `${where}: div.${m.klass.replace(/ /g, '.')} шириной ${Math.round(m.shirina)} px при панели ${Math.round(m.panel)} px`,
  );
  check(m.float === 'none', `${where}: float: ${m.float}`);
  check(m.prokrutka <= 0, `${where}: горизонтальная прокрутка ${m.prokrutka} px`);
}

const TRENAZHER4 = href(razdelBase(4), TRENAZHER);

for (const okno of OKNA) {
  const context = await browser.newContext({ viewport: { width: okno.w, height: okno.h } });
  /* Скрытый №6 — так, как его видит администратор (метка в cookie). */
  await metkaAdministratora(context, BASE);
  const page = await context.newPage();
  for (const n of NOMERA) {
    const about = href(razdelBase(n));
    const otkuda = [
      ['б', href(razdelBase(n), TRENAZHER), 'тренажёр'],
      ['в', href(razdelBase(n), OPORNYE.tail), 'опорные задачи'],
    ];
    if (!estStranica(about)) {
      failures.push(`${about}: нет страницы «О задании» в сборке`);
      continue;
    }

    /* (а) Прямой заход. */
    {
      const where = `${okno.w} №${n} (а) ${about}`;
      try {
        await page.goto(BASE + about, { waitUntil: 'load' });
        proverit(await izmerit(page), where);
      } catch (e) {
        failures.push(`${where}: ${e.message.split('\n')[0]}`);
      }
    }

    /* (б), (в) Переход внутри сайта. */
    for (const [bukva, start, nazvanie] of otkuda) {
      const where = `${okno.w} №${n} (${bukva}) ${start} → «О задании»`;
      if (!estStranica(start)) {
        skipped.push(`№${n} (${bukva}): у раздела нет вкладки «${nazvanie}»`);
        continue;
      }
      try {
        await page.goto(BASE + start, { waitUntil: 'load' });
        if (!(await estStiliKartinok(page))) {
          /* Тренажёр раздела картинок не грузит: сначала №4, оттуда сюда. */
          await page.goto(BASE + TRENAZHER4, { waitUntil: 'load' });
          check(
            await estStiliKartinok(page),
            `${okno.w} ${TRENAZHER4}: нет стилей картинок к задачам`,
          );
          await perekhod(page, start);
        }
        await kVkladkeOZadanii(page, about);
        proverit(await izmerit(page), where);
      } catch (e) {
        failures.push(`${where}: ${e.message.split('\n')[0]}`);
      }
    }
  }
  await context.close();
}

await browser.close();
server.close();

for (const s of skipped) console.log(`  пропуск: ${s}`);
if (failures.length > 0) {
  console.error(`\nКарта «О задании»: ${failures.length} ошибок из ${checks} проверок:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Карта «О задании» во всю ширину: ${checks} проверок пройдено.`);
