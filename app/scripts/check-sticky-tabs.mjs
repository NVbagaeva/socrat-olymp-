#!/usr/bin/env node
/* scripts/check-sticky-tabs.mjs — лента вкладок раздела прилипает к
   верху окна и не повисает посреди страницы.

   Запуск: pnpm build && pnpm test:sticky-tabs

   Собранный сайт открывается в Chromium и (если установлен) в WebKit —
   движке Safari — на ширине компьютера и телефона. Каждая вкладка
   задания №11 (и для сравнения теория №2) прокручивается шагами до
   конца, и на каждом шаге:
     — пока лента в своём месте, её верх совпадает с местом под шапкой
       раздела;
     — как только она ушла бы за верх окна, она прилипает: верх ленты
       у верхнего края окна (с точностью до пикселя), класс is-stuck;
     — лента не закрывает собой середину экрана: её низ выше трети
       высоты окна.
   Отдельно — переход по подпункту «Содержания» теории №11: блок
   встаёт под лентой, а не под ней прячется. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}

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
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
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

const PAGES = [
  '/zadaniya/11/',
  '/zadaniya/11/teoriya/',
  '/zadaniya/11/opornye-zadachi/',
  '/zadaniya/11/opornye-zadachi/massa-veshchestva/',
  '/zadaniya/11/trenazher/',
  '/zadaniya/11/generator/',
  '/zadaniya/11/dlya-repetitorov/',
  '/zadaniya/2/teoriya/',
];
const SIZES = [
  { name: 'компьютер', width: 1280, height: 800, isMobile: false },
  { name: 'телефон', width: 390, height: 844, isMobile: true },
];

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

async function zamer(page) {
  return page.evaluate(() => {
    const row = document.querySelector('.topic-tabs-row');
    if (row === null) {
      return null;
    }
    const box = row.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      stuck: row.classList.contains('is-stuck'),
      sy: window.scrollY,
      vh: window.innerHeight,
      max: document.documentElement.scrollHeight - window.innerHeight,
    };
  });
}

/* Что не так с лентой после прокрутки; null — всё верно. */
function oshibka(z, home) {
  const expected = Math.max(0, home - z.sy);
  if (Math.abs(z.top - expected) > 1.5) {
    return `прокрутка ${Math.round(z.sy)}: верх ленты ${Math.round(z.top)} вместо ${Math.round(expected)}`;
  }
  if (z.sy > home + 2 && !z.stuck) {
    return `прокрутка ${Math.round(z.sy)}: лента у верха, но без is-stuck`;
  }
  if (z.sy > home + 2 && z.bottom > z.vh / 3) {
    return `прокрутка ${Math.round(z.sy)}: лента закрывает середину экрана`;
  }
  return null;
}

async function proverit(engine, browserType) {
  let browser;
  try {
    browser = await browserType.launch(
      engine === 'Chromium' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {},
    );
  } catch {
    console.log(`${engine} не установлен — пропущен (в CI он есть).`);
    return;
  }
  for (const size of SIZES) {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      isMobile: size.isMobile && engine === 'Chromium',
      hasTouch: size.isMobile,
    });
    for (const url of PAGES) {
      const page = await context.newPage();
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      const start = await zamer(page);
      const where = `${engine}, ${size.name}, ${url}`;
      check(start !== null, `${where}: нет ленты вкладок`);
      if (start === null) {
        await page.close();
        continue;
      }
      /* Место ленты в странице до прокрутки. */
      const home = start.top + start.sy;
      const bad = [];
      for (let y = 0; y <= start.max + 400; y += Math.round(size.height * 0.6)) {
        await page.evaluate((to) => window.scrollTo(0, to), y);
        /* Хук обновляет ленту в requestAnimationFrame; на тяжёлой
           странице в WebKit кадр приходит позже. Ждём, пока замер
           сойдётся, но не дольше полутора секунд. */
        let problem = null;
        for (let attempt = 0; attempt < 25; attempt += 1) {
          await page.waitForTimeout(60);
          problem = oshibka(await zamer(page), home);
          if (problem === null) {
            break;
          }
        }
        if (problem !== null) {
          bad.push(problem);
        }
      }
      check(bad.length === 0, `${where}: ${bad.slice(0, 3).join('; ')}`);
      await page.close();
    }

    /* Подпункт содержания теории №11: блок встаёт под лентой. */
    const page = await context.newPage();
    await page.goto(BASE + '/zadaniya/11/teoriya/', { waitUntil: 'networkidle' });
    if (size.isMobile) {
      await page.locator('.topic-open__btn').click();
    }
    const where = `${engine}, ${size.name}, содержание теории №11`;
    const smesi = page.locator('.contents-item', { hasText: 'Смеси и сплавы' }).last();
    await smesi.click();
    await page.waitForTimeout(900);
    if (size.isMobile) {
      await page.locator('.topic-open__btn').click();
    }
    const sub = page.locator('.contents-sub__item', { hasText: 'Таблица' }).last();
    check((await sub.count()) > 0, `${where}: у открытого раздела нет подпунктов`);
    if ((await sub.count()) > 0) {
      await sub.click();
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const row = document.querySelector('.topic-tabs-row').getBoundingClientRect();
        const node = document.getElementById('smesi-tablitsa').getBoundingClientRect();
        return { row: row.bottom, node: node.top };
      });
      check(
        r.node >= r.row - 1 && r.node < r.row + 160,
        `${where}: блок «Таблица» встал на ${Math.round(r.node)}, лента кончается на ${Math.round(r.row)}`,
      );
    }
    await page.close();
    await context.close();
  }
  await browser.close();
}

await proverit('Chromium', chromium);
await proverit('WebKit', webkit);
server.close();

console.log(`Липкая лента вкладок: проверок ${checks}, ошибок ${failures.length}.`);
for (const f of failures) {
  console.log(`  ✗ ${f}`);
}
if (failures.length > 0) {
  process.exitCode = 1;
}
