#!/usr/bin/env node
/* scripts/audit-prodazhi-shots.mjs — снимки для аудита продаж
   (docs/audit-prodazhi.md). Поднимает собранный app/out и снимает
   страницы на 390 и 1440 px глазами нового посетителя: без тарифа,
   баннер cookie и приветствие уже видел (кроме отдельного снимка
   первого визита).

   Запуск: node scripts/audit-prodazhi-shots.mjs [папка] [фильтр] */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'out');
const DIR = path.resolve(
  process.argv[2] ?? path.join(root, '..', 'docs', 'audit-prodazhi', 'snimki'),
);
const FILTR = process.argv[3] ?? '';
const PORT = 4190;
fs.mkdirSync(DIR, { recursive: true });

const TIPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
};

const server = http.createServer((req, res) => {
  const put = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, put);
  if (!file.startsWith(OUT)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': TIPY['.html'] });
    return res.end(fs.readFileSync(path.join(OUT, '404.html')));
  }
  res.writeHead(200, { 'content-type': TIPY[path.extname(file)] ?? 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
const BASE = process.env.AUDIT_BASE ?? `http://127.0.0.1:${PORT}`;
if (!process.env.AUDIT_BASE) await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

/* Посетитель, который уже закрыл баннер cookie и приветствие. Без ключа
   проверок генераторов — видит замки, как живой человек. */
function bylZdes() {
  try {
    localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
    localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
  } catch {
    /* нет хранилища */
  }
}

const SHIRINY = [
  { id: '390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { id: '1440', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
];

/* [имя, адрес, полная страница?] */
const STRANITSY = [
  ['01-glavnaya', '/', true],
  ['02-bank', '/zadaniya/', true],
  ['03-z9-o-zadanii', '/zadaniya/9/', true],
  ['04-z9-teoriya', '/zadaniya/9/teoriya/', false],
  ['05-z9-opornye', '/zadaniya/9/opornye-zadachi/', false],
  ['06-z9-trenazher', '/zadaniya/9/trenazher/', false],
  ['07-z9-generator', '/zadaniya/9/generator/', false],
  ['08-z11-o-zadanii', '/zadaniya/11/', true],
  ['09-z11-teoriya', '/zadaniya/11/teoriya/', false],
  ['10-z11-trenazher', '/zadaniya/11/trenazher/', false],
  ['11-z11-generator', '/zadaniya/11/generator/', false],
  ['12-z18-o-zadanii', '/zadaniya/18/', true],
  ['13-z18-teoriya', '/zadaniya/18/teoriya/', false],
  ['14-z18-generator', '/zadaniya/18/generator/', false],
  ['15-sobrat-variant', '/variant/', true],
  ['16-povyshennye', '/povyshennye/', true],
  ['17-tarify', '/tarify/', true],
  ['18-about', '/about/', true],
  ['19-voyti', '/voyti/', false],
  ['20-kak-polzovatsya', '/kak-polzovatsya/', true],
  ['21-z18-dlya-repetitorov', '/zadaniya/18/dlya-repetitorov/', false],
  ['22-styleguide-tarify', '/styleguide/tarify/', true],
];

const MAX_H = 9000;

async function snyat(page, imya, polnaya) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DIR, `${imya}.jpg`), type: 'jpeg', quality: 72 });
  if (polnaya) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    /* Прокрутка до низа, чтобы ленивые картинки успели загрузиться. */
    for (let y = 0; y < Math.min(h, MAX_H); y += 700) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const vp = page.viewportSize();
    await page.screenshot({
      path: path.join(DIR, `${imya}-full.jpg`),
      type: 'jpeg',
      quality: 62,
      fullPage: h <= MAX_H,
      clip: h > MAX_H ? { x: 0, y: 0, width: vp.width, height: MAX_H } : undefined,
    });
  }
}

const browser = await chromium.launch();
const zamery = [];
try {
  for (const sh of SHIRINY) {
    const ctx = await browser.newContext({
      viewport: sh.viewport,
      isMobile: sh.isMobile,
      hasTouch: sh.hasTouch,
      deviceScaleFactor: 1,
      locale: 'ru-RU',
    });
    await ctx.addInitScript(bylZdes);
    const page = await ctx.newPage();
    for (const [imya, adres, polnaya] of STRANITSY) {
      if (FILTR && !imya.includes(FILTR)) continue;
      const t0 = Date.now();
      try {
        await page.goto(BASE + adres, { waitUntil: 'load', timeout: 60000 });
      } catch (e) {
        console.error('goto', adres, e.message);
      }
      const t = Date.now() - t0;
      const perf = await page.evaluate(() => {
        const lcp = performance.getEntriesByType('largest-contentful-paint');
        return {
          title: document.title,
          desc: document.querySelector('meta[name=description]')?.getAttribute('content') ?? '',
          og: document.querySelectorAll('meta[property^="og:"]').length,
          h1: [...document.querySelectorAll('h1')].map((x) => x.textContent.trim()).join(' | '),
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          res: performance
            .getEntriesByType('resource')
            .reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0),
          lcp: lcp.length ? Math.round(lcp[lcp.length - 1].startTime) : null,
        };
      });
      zamery.push({ sh: sh.id, imya, adres, ms: t, ...perf });
      await snyat(page, `${imya}-${sh.id}`, polnaya);
      console.log(sh.id, imya, t, 'ms');
    }

    if (!FILTR || FILTR === 'extra') {
      /* Пробная генерация: №11 открыт, генерируем дважды. */
      try {
        await page.goto(BASE + '/zadaniya/11/generator/', { waitUntil: 'load' });
        await page.waitForTimeout(1500);
        const btn = page.getByRole('button', { name: /Сгенерировать/ }).first();
        await btn.click({ timeout: 5000 });
        await page.waitForTimeout(2500);
        await page.screenshot({
          path: path.join(DIR, `30-z11-generaciya-1-${sh.id}.jpg`),
          type: 'jpeg',
          quality: 72,
        });
        const again = page.getByRole('button', { name: /Сгенерировать|Перегенерировать/ }).first();
        await again.click({ timeout: 5000 });
        await page.waitForTimeout(1500);
        await page.screenshot({
          path: path.join(DIR, `31-probnaya-ispolzovana-${sh.id}.jpg`),
          type: 'jpeg',
          quality: 72,
        });
      } catch (e) {
        console.error('probnaya', e.message);
      }
      /* Бургер-меню на телефоне. */
      if (sh.id === '390') {
        try {
          await page.goto(BASE + '/', { waitUntil: 'load' });
          await page.waitForTimeout(1000);
          await page.getByRole('button', { name: /меню/i }).first().click({ timeout: 5000 });
          await page.waitForTimeout(900);
          await page.screenshot({
            path: path.join(DIR, `32-menu-390.jpg`),
            type: 'jpeg',
            quality: 72,
          });
        } catch (e) {
          console.error('menu', e.message);
        }
        /* Нижняя часть экрана раздела: нижнее меню. */
        try {
          await page.goto(BASE + '/zadaniya/9/', { waitUntil: 'load' });
          await page.waitForTimeout(800);
          await page.evaluate(() => window.scrollTo(0, 900));
          await page.waitForTimeout(800);
          await page.screenshot({
            path: path.join(DIR, `33-z9-prokrutka-390.jpg`),
            type: 'jpeg',
            quality: 72,
          });
        } catch (e) {
          console.error('scroll', e.message);
        }
      }
    }
    await ctx.close();
  }

  if (!FILTR || FILTR === 'intro') {
    /* Первый визит на телефоне: что видит человек в первые секунды. */
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(BASE + '/', { waitUntil: 'commit' });
    for (const ms of [700, 1500, 3000, 5000, 8000]) {
      await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
      await page.screenshot({
        path: path.join(DIR, `00-pervyy-vizit-${ms}ms-390.jpg`),
        type: 'jpeg',
        quality: 72,
      });
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  if (!process.env.AUDIT_BASE) server.close();
  fs.writeFileSync(path.join(DIR, 'zamery.json'), JSON.stringify(zamery, null, 2));
}
