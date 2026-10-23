#!/usr/bin/env node
/* scripts/probe-sticky-tabs.mjs — замер перехода «плитки → липкая лента».

   Запуск: pnpm build && node scripts/probe-sticky-tabs.mjs <папка> [адрес] [phone|desktop] [шаг] [до] [от]
   Переменные: ENGINE=webkit — движок Safari (нужен `npx playwright install webkit`);
               EXTRA_CSS='html{overflow-anchor:none}' — вставить CSS для проверки гипотез.

   Собранный сайт открывается на профиле iPhone 13 (390×844, DPR 3) или
   1280×800 и прокручивается шагами. На каждом шаге пишутся: scrollY,
   класс is-stuck, верх и высота строки .topic-tabs-row, её margin-bottom,
   положение первого блока под лентой (в документе и в окне), зазор между
   лентой и этим блоком, сумма layout-shift (Chromium), — плюс кадр и
   видео. Отчёт: docs/layout/01-sticky-tabs.md. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit, devices } from 'playwright';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'out');
const DIR = process.argv[2];
if (!DIR) {
  console.error('Укажите папку для кадров: node scripts/probe-sticky-tabs.mjs <папка>');
  process.exit(1);
}
const URL_PATH = process.argv[3] ?? '/zadaniya/11/generator/';
const PROFILE = process.argv[4] ?? 'phone';
const STEP = Number(process.argv[5] ?? 50);
const MAX = Number(process.argv[6] ?? 800);
const FROM = Number(process.argv[7] ?? STEP);
fs.mkdirSync(DIR, { recursive: true });

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

const browser =
  process.env.ENGINE === 'webkit'
    ? await webkit.launch()
    : await chromium.launch(
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      );
const size = PROFILE === 'phone' ? { width: 390, height: 844 } : { width: 1280, height: 800 };
const context = await browser.newContext({
  ...(PROFILE === 'phone' ? devices['iPhone 13'] : { viewport: size, deviceScaleFactor: 1 }),
  recordVideo: { dir: DIR, size },
});
await context.addInitScript(() => {
  try {
    localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
    localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
  } catch {
    /* без хранилища баннеров и так нет */
  }
  window.__cls = 0;
  window.__shifts = [];
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__cls += e.value;
          window.__shifts.push({
            value: e.value,
            t: Math.round(e.startTime),
            sy: window.scrollY,
            sources: (e.sources ?? []).map((s) =>
              String(s.node?.className ?? s.node?.nodeName).slice(0, 40),
            ),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* WebKit: layout-shift не поддерживается */
    }
  }
});
const page = await context.newPage();
await page.goto(BASE + URL_PATH, { waitUntil: 'networkidle' });
if (process.env.EXTRA_CSS) {
  await page.addStyleTag({ content: process.env.EXTRA_CSS });
}
await page.waitForTimeout(800);

const measure = () =>
  page.evaluate(() => {
    const row = document.querySelector('.topic-tabs-row');
    const strip = document.querySelector('.topic-tabs');
    const body = row.nextElementSibling;
    const r = row.getBoundingClientRect();
    const b = body?.getBoundingClientRect();
    const tops = Array.from(strip.querySelectorAll('[role=tab], .topic-tabs__more')).map((t) =>
      Math.round(t.getBoundingClientRect().top),
    );
    return {
      sy: Math.round(window.scrollY),
      stuck: row.classList.contains('is-stuck'),
      rowTop: Math.round(r.top),
      rowH: Math.round(r.height),
      rowMarginBottom: row.style.marginBottom,
      bodyTopDoc: b ? Math.round(b.top + window.scrollY) : null,
      bodyTopVp: b ? Math.round(b.top) : null,
      gapBelowRow: b ? Math.round(b.top - r.bottom) : null,
      tileRows: new Set(tops).size,
      stickyTop: getComputedStyle(document.querySelector('.app-main'))
        .getPropertyValue('--topic-sticky-top')
        .trim(),
      cls: window.__cls,
      shifts: window.__shifts.length,
    };
  });

const log = [];
const start = await measure();
log.push(start);
console.log('start', JSON.stringify(start));
await page.screenshot({ path: path.join(DIR, 'f-0000.png') });
let before = start;
for (let y = FROM; y <= MAX; y += STEP) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  await page.waitForTimeout(120);
  const m = await measure();
  log.push(m);
  await page.screenshot({ path: path.join(DIR, `f-${String(y).padStart(4, '0')}.png`) });
  const mark = m.stuck !== before.stuck ? ' <-- переключение' : '';
  console.log(
    `scrollTo=${String(y).padStart(4)} sy=${String(m.sy).padStart(4)} stuck=${m.stuck ? 1 : 0} rowTop=${m.rowTop} rowH=${m.rowH} mb=${m.rowMarginBottom || '-'} bodyTopDoc=${m.bodyTopDoc} bodyTopVp=${m.bodyTopVp} gap=${m.gapBelowRow} cls=${m.cls.toFixed(4)}${mark}`,
  );
  before = m;
}
fs.writeFileSync(path.join(DIR, 'log.json'), JSON.stringify(log, null, 2));
const shifts = await page.evaluate(() => window.__shifts);
console.log(
  'CLS total',
  (await page.evaluate(() => window.__cls)).toFixed(4),
  'shifts',
  JSON.stringify(shifts),
);
const video = page.video();
await page.close();
await context.close();
await browser.close();
if (video) {
  fs.renameSync(await video.path(), path.join(DIR, 'scroll.webm'));
}
server.close();
