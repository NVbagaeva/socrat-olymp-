#!/usr/bin/env node
/* scripts/check-zadanie15-vitrina.mjs — чертёж задания №15 на сайте.

   Запуск: pnpm build && pnpm test:zadanie15-vitrina

   1. Вес (по собранному сайту): three.js лежит отдельным файлом и не
      подключён ни к одной странице сразу; на страницах вне
      /zadaniya/15/ он не грузится и в браузере.
   2. Витрина /zadaniya/15/vitrina/ закрыта от поиска (noindex) и не
      связана ссылками с другими страницами (меню, сайдбар).
   3. Телефон 390 px, касания (Chromium): чертёж появляется, есть
      сплошные и штриховые линии и подписи; поворот пальцем меняет
      картинку и пересчитывает штрихи; щипок меняет масштаб; режимы
      «3D» и «Школьный чертёж» переключаются без ошибок; ошибок в
      консоли нет.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const failures = [];
let checks = 0;
const check = (ok, what) => {
  checks += 1;
  if (!ok) failures.push(what);
};

const VITRINA = '/zadaniya/15/vitrina/';
/** Признак файла three.js: имя класса рендерера есть в его коде. */
const THREE_MARK = 'WebGLRenderer';

/* ── 1. Вес ──────────────────────────────────────────────── */

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(OUT);
const chunks = files.filter((f) => f.endsWith('.js'));
const threeChunks = chunks.filter((f) => fs.readFileSync(f, 'utf8').includes(THREE_MARK));
check(threeChunks.length > 0, 'в сборке нет файла с three.js');
const threeNames = threeChunks.map((f) => path.basename(f));
const pages = files.filter((f) => f.endsWith('.html'));
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = '/' + path.relative(OUT, f).replace(/index\.html$/, '');
  for (const n of threeNames) {
    check(!html.includes(n), `${rel}: three.js подключён к странице сразу (${n})`);
  }
  if (!rel.startsWith('/zadaniya/15/vitrina/')) {
    check(!html.includes('/zadaniya/15/vitrina'), `${rel}: ссылка на служебную витрину`);
  }
}

/* ── 2. noindex ─────────────────────────────────────────── */

const vitrinaHtml = fs.readFileSync(path.join(OUT, 'zadaniya/15/vitrina/index.html'), 'utf8');
check(/<meta name="robots" content="noindex, ?nofollow"/.test(vitrinaHtml), 'витрина без noindex');

/* ── 3. Браузер ─────────────────────────────────────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
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

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);

// three.js не грузится на обычных страницах.
for (const url of ['/', '/zadaniya/', '/zadaniya/11/', '/zadaniya/15/']) {
  const page = await browser.newPage();
  const loaded = [];
  page.on('response', (r) => loaded.push(path.basename(new URL(r.url()).pathname)));
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  for (const n of threeNames) {
    check(!loaded.includes(n), `${url}: в браузере загрузился three.js (${n})`);
  }
  await page.close();
}

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
await page.goto(BASE + VITRINA, { waitUntil: 'networkidle' });
const ok = await page
  .waitForSelector('.z15-ch svg line', { timeout: 20000 })
  .then(() => true)
  .catch(() => false);
check(ok, 'витрина: чертёж не появился');

const zamer = () =>
  page.evaluate(() => {
    const lines = [...document.querySelectorAll('.z15-ch svg line')];
    const labels = [...document.querySelectorAll('.z15-ch__label')].map((l) =>
      l.getBoundingClientRect(),
    );
    const span =
      labels.length > 1
        ? Math.max(...labels.map((r) => r.x)) - Math.min(...labels.map((r) => r.x))
        : 0;
    return {
      lines: lines.length,
      dashed: lines.filter((l) => l.getAttribute('stroke-dasharray')).length,
      sig: lines
        .map(
          (l) =>
            `${l.getAttribute('x1')},${l.getAttribute('y1')},${l.getAttribute('stroke-dasharray')}`,
        )
        .join('|'),
      dashSig: lines
        .filter((l) => l.getAttribute('stroke-dasharray'))
        .map((l) => `${Math.round(Number(l.getAttribute('x1')) / 20)}`)
        .sort()
        .join(','),
      labels: labels.length,
      span,
      width: document.querySelector('.z15-ch')?.getBoundingClientRect().width ?? 0,
      scrollW: document.documentElement.scrollWidth,
    };
  });

if (ok) {
  await page.waitForTimeout(1200);
  const a = await zamer();
  check(a.lines >= 12 && a.dashed >= 3, `витрина: линий ${a.lines}, штриховых ${a.dashed}`);
  check(a.labels >= 8, `витрина: подписей ${a.labels}`);
  check(a.scrollW <= 390, `витрина на 390 px: страница шире экрана (${a.scrollW})`);

  const box = await page.locator('.z15-ch').boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  const touch = async (type, pts) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: pts.map(([x, y], id) => ({ x, y, id })),
    });

  // Поворот пальцем.
  await touch('touchStart', [[cx, cy]]);
  for (let i = 1; i <= 12; i += 1) {
    await touch('touchMove', [[cx + i * 14, cy + i * 3]]);
  }
  await touch('touchEnd', []);
  await page.waitForTimeout(1500);
  const b = await zamer();
  check(a.sig !== b.sig, 'поворот пальцем не изменил чертёж');
  check(b.dashed >= 3, `после поворота штриховых линий ${b.dashed}`);

  // Ещё поворот — пересчёт штрихов: невидимые линии другие.
  await touch('touchStart', [[cx, cy]]);
  for (let i = 1; i <= 16; i += 1) {
    await touch('touchMove', [[cx - i * 16, cy - i * 6]]);
  }
  await touch('touchEnd', []);
  await page.waitForTimeout(1500);
  const c = await zamer();
  check(c.dashSig !== a.dashSig, 'штрихи не пересчитались после поворота');

  // Щипок: пальцы расходятся — фигура крупнее.
  await touch('touchStart', [
    [cx - 30, cy],
    [cx + 30, cy],
  ]);
  for (let i = 1; i <= 10; i += 1) {
    await touch('touchMove', [
      [cx - 30 - i * 8, cy],
      [cx + 30 + i * 8, cy],
    ]);
  }
  await touch('touchEnd', []);
  await page.waitForTimeout(1500);
  const d = await zamer();
  check(
    d.span > c.span * 1.1,
    `щипок не увеличил чертёж (${c.span.toFixed(0)} → ${d.span.toFixed(0)})`,
  );

  // Режимы.
  await page.getByRole('button', { name: '3D' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Школьный чертёж' }).click();
  await page.waitForTimeout(1200);
  const e = await zamer();
  check(e.lines >= 12, 'после смены режимов чертёж пропал');
}
check(errors.length === 0, `ошибки в консоли витрины: ${errors.slice(0, 3).join('; ')}`);

await browser.close();
server.close();

console.log(`Проверок чертежа №15 на сайте: ${checks}`);
if (failures.length > 0) {
  console.log(`проблем: ${failures.length}`);
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log('проблем: 0');
