#!/usr/bin/env node
/* scripts/check-first-load.mjs — страница темы быстро «оживает» на слабой сети.

   Запуск: pnpm build && pnpm test:first-load

   1. Бюджет первой загрузки (по собранному сайту, без браузера): HTML и
      скрипты страниц тем №12 не вырастают выше порога, а тяжёлое
      (KaTeX, движок задач) в первую загрузку не попадает. На слабой LTE
      (1,5 Мбит/с ≈ 187 КБ/с) каждые 190 КБ — секунда до «оживания».
   2. Нажатие на вкладку до загрузки кода не теряется (Chromium): скрипты
      задерживаются, тап по «Опорным задачам» сразу подсвечивает вкладку и
      показывает ожидание, а когда страница ожила — вкладка открывается
      сама, повторно жать не нужно. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}
const gz = (buf) => zlib.gzipSync(buf, { level: 6 }).length;
const kb = (n) => Math.round(n / 1024);

/* ── 1. Бюджет ─────────────────────────────────────────────── */
/* Порог — текущее значение с запасом ≈ 20%: выросло сильнее — разбираться. */
const BUDGET = [
  { page: 'zadaniya/12/rational', htmlGz: 200 * 1024, scriptsGz: 200 * 1024 },
  { page: 'zadaniya/12/quadratic', htmlGz: 260 * 1024, scriptsGz: 200 * 1024 },
  { page: 'zadaniya/12/linear', htmlGz: 60 * 1024, scriptsGz: 200 * 1024 },
];
/* Признаки тяжёлого кода внутри скриптов первой загрузки. */
const HEAVY = [
  ['KaTeX', (text) => text.includes('KaTeX parse error')],
  /* Банк прототипов задач: в нём сотни вхождений идентификаторов наборов
     («12R.A» …); в мелких файлах это просто id навыков. */
  ['банк прототипов задач', (text) => (text.match(/12R\./g) ?? []).length >= 50],
];

for (const budget of BUDGET) {
  const html = fs.readFileSync(path.join(OUT, budget.page, 'index.html'), 'utf8');
  const htmlGz = gz(Buffer.from(html));
  /* polyfills — только для очень старых браузеров (noModule), их не качают. */
  const srcs = [
    ...new Set([...html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*>/g)].map((m) => m[1])),
  ].filter((src) => !src.includes('polyfills'));
  let scriptsGz = 0;
  const heavy = new Set();
  for (const src of srcs) {
    const file = path.join(OUT, decodeURIComponent(src.split('?')[0]));
    const buf = fs.readFileSync(file);
    scriptsGz += gz(buf);
    const text = buf.toString('utf8');
    for (const [name, isHeavy] of HEAVY) {
      if (isHeavy(text)) {
        heavy.add(name);
      }
    }
  }
  check(
    htmlGz <= budget.htmlGz,
    `${budget.page}: HTML ${kb(htmlGz)} КБ gz, порог ${kb(budget.htmlGz)} КБ`,
  );
  check(
    scriptsGz <= budget.scriptsGz,
    `${budget.page}: скрипты ${kb(scriptsGz)} КБ gz, порог ${kb(budget.scriptsGz)} КБ`,
  );
  check(
    heavy.size === 0,
    `${budget.page}: в первую загрузку попало тяжёлое: ${[...heavy].join(', ')}`,
  );
  console.log(
    `  ${budget.page.padEnd(24)} HTML ${String(kb(htmlGz)).padStart(4)} КБ gz | скрипты ${String(kb(scriptsGz)).padStart(4)} КБ gz`,
  );
}

/* ── 2. Тап до «оживания» ─────────────────────────────────── */
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/x-component',
  '.svg': 'image/svg+xml',
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

const browser = await chromium.launch({
  args: ['--no-sandbox'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await welcomeSeen(context);
const page = await context.newPage();
/* Код страницы «едет по сети»: каждый скрипт задержан на 2,5 с. */
await page.route('**/_next/static/chunks/**', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await route.continue();
});
await page.goto(`${BASE}/zadaniya/12/rational/`, { waitUntil: 'commit' });
await page.waitForFunction(() => window.__tabTapInit === 1);
const tab = page.getByRole('tab', { name: /Опорные задачи/ });
await tab.tap();
const before = await page.evaluate(() => ({
  selected: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent ?? '',
  busy: document.querySelector('[role="tab"][data-busy="true"]')?.textContent ?? '',
  pending: document.documentElement.hasAttribute('data-tabs-pending'),
  url: location.pathname,
}));
check(/Опорные задачи/.test(before.selected), 'до оживания: нажатая вкладка сразу выбрана');
check(/Опорные задачи/.test(before.busy), 'до оживания: на нажатой вкладке ожидание');
check(before.pending, 'до оживания: панель приглушена (метка на странице)');
check(before.url === '/zadaniya/12/rational/', 'до оживания: адрес ещё прежний');

/* Страница ожила — вкладка открывается сама, второго тапа не было. */
await page.waitForURL('**/opornye-zadachi/', { timeout: 30000 }).catch(() => {});
await page.waitForSelector('a.prep-card', { timeout: 30000 }).catch(() => {});
const after = await page.evaluate(() => ({
  url: location.pathname,
  cards: document.querySelectorAll('a.prep-card').length,
  busy: document.querySelectorAll('[data-busy="true"]').length,
  pending: document.documentElement.hasAttribute('data-tabs-pending'),
}));
check(
  after.url === '/zadaniya/12/rational/opornye-zadachi/',
  'после оживания: нажатие исполнилось, вкладка открыта сама',
);
check(after.cards > 0, 'после оживания: карточки навыков на экране');
check(after.busy === 0 && !after.pending, 'после оживания: ожидание снято');
await context.close();

/* Нажатие на вкладку, которая открывается на месте (теория): тоже не теряется. */
const context2 = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await welcomeSeen(context2);
const page2 = await context2.newPage();
await page2.route('**/_next/static/chunks/**', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await route.continue();
});
await page2.goto(`${BASE}/zadaniya/12/rational/`, { waitUntil: 'commit' });
await page2.waitForFunction(() => window.__tabTapInit === 1);
await page2.getByRole('tab', { name: /Теория/ }).tap();
await page2.waitForFunction(
  () =>
    document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.includes('Теория') &&
    !document.documentElement.hasAttribute('data-tabs-pending'),
  undefined,
  { timeout: 30000 },
);
check(
  (await page2.locator('[role="tab"][data-busy="true"]').count()) === 0,
  'теория: после оживания ожидание снято, вкладка открыта',
);
await context2.close();

await browser.close();
server.close();

console.log('Проверок первой загрузки: ' + checks);
if (failures.length > 0) {
  console.error('Не прошло:\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log('Расхождений нет.');
