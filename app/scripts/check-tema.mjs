#!/usr/bin/env node
/* scripts/check-tema.mjs — тёмная тема «ночное стекло» (lib/tema.ts).

   Запуск: pnpm build && pnpm test:tema

   1. Первый кадр: тема из localStorage стоит на <html> до первой
      отрисовки — скрипты страницы задержаны, а фон уже тёмный.
   2. Печать при тёмной теме — светлая (тёмные значения только в
      @media screen).
   3. Переключатель: ?tema=dark показывает его (пока тема на проверке),
      щелчок меняет data-tema, aria-checked, localStorage и meta
      theme-color / color-scheme; выбор переживает перезагрузку. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const { href, ZADANIYA } = requireSrc('lib/paths.ts');
const { THEME_COLOR, TEMA_KEY } = requireSrc('lib/tema.ts');

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
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

const failures = [];
let checks = 0;
const check = (ok, what) => {
  checks += 1;
  if (!ok) failures.push(what);
};
/* Светлота цвета 0…255 по rgb(…) из getComputedStyle. */
const svetlota = (rgb) => {
  const [r, g, b] = rgb.match(/[\d.]+/g).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const PAGES = ['/', href(ZADANIYA), href(ZADANIYA, 1), href(ZADANIYA, 1, 'teoriya')];
const browser = await chromium.launch({ args: ['--no-sandbox'] });

/* 1. Первый кадр уже тёмный. */
for (const url of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((key) => {
    try {
      localStorage.setItem(key, 'dark');
    } catch {}
  }, TEMA_KEY);
  /* Скрипты Next.js задерживаем: до них страница уже должна быть тёмной. */
  await ctx.route('**/_next/static/chunks/**', async (route) => {
    await new Promise((r) => setTimeout(r, 3000));
    await route.continue();
  });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  const z = await page.evaluate(() => ({
    tema: document.documentElement.getAttribute('data-tema'),
    bg: getComputedStyle(document.body).backgroundColor,
    scheme: document.querySelector('meta[name=color-scheme]')?.content,
    theme: document.querySelector('meta[name=theme-color]')?.content,
  }));
  check(z.tema === 'dark', `${url}: до скриптов data-tema="${z.tema}", нужно dark`);
  check(svetlota(z.bg) < 60, `${url}: первый кадр светлый (фон ${z.bg})`);
  check(z.scheme === 'only dark', `${url}: meta color-scheme «${z.scheme}»`);
  check(z.theme === THEME_COLOR.dark, `${url}: meta theme-color ${z.theme}`);
  /* 2. Печать — светлая. */
  await page.emulateMedia({ media: 'print' });
  const pechat = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(svetlota(pechat) > 200, `${url}: печать при тёмной теме не светлая (${pechat})`);
  await ctx.close();
}

/* 3. Переключатель. */
for (const width of [1440, 375]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + href(ZADANIYA, 1) + '?tema=light', { waitUntil: 'networkidle' });
  const sw = page.locator('.site-head .tema-switch');
  check(await sw.isVisible(), `${width}: переключатель не виден в шапке`);
  const box = await sw.boundingBox();
  check(box && box.width >= 44 && box.height >= 44, `${width}: область нажатия меньше 44×44`);
  check((await sw.getAttribute('role')) === 'switch', `${width}: нет role="switch"`);
  check((await sw.getAttribute('aria-label')) === 'Тёмная тема', `${width}: aria-label`);
  check(
    (await sw.getAttribute('aria-checked')) === 'false',
    `${width}: светлая — aria-checked не false`,
  );
  check(
    (await sw.getAttribute('title')) === 'Включить тёмную тему',
    `${width}: подсказка в светлой`,
  );
  await sw.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const z = await page.evaluate(
    (key) => ({
      tema: document.documentElement.getAttribute('data-tema'),
      stored: localStorage.getItem(key),
      theme: document.querySelector('meta[name=theme-color]')?.content,
      scheme: document.querySelector('meta[name=color-scheme]')?.content,
    }),
    TEMA_KEY,
  );
  check(z.tema === 'dark' && z.stored === 'dark', `${width}: Enter не включил тёмную тему`);
  check(z.theme === THEME_COLOR.dark && z.scheme === 'only dark', `${width}: meta не сменились`);
  check(
    (await sw.getAttribute('aria-checked')) === 'true',
    `${width}: тёмная — aria-checked не true`,
  );
  check(
    (await sw.getAttribute('title')) === 'Включить светлую тему',
    `${width}: подсказка в тёмной`,
  );
  /* Заново — без ?tema: выбор должен прийти из localStorage. */
  await page.goto(BASE + href(ZADANIYA, 1), { waitUntil: 'networkidle' });
  check(
    (await page.evaluate(() => document.documentElement.getAttribute('data-tema'))) === 'dark',
    `${width}: после перезагрузки тема не тёмная`,
  );
  await page.locator('.site-head .tema-switch').click();
  await page.waitForTimeout(300);
  check(
    (await page.evaluate(() => document.documentElement.hasAttribute('data-tema'))) === false,
    `${width}: щелчок не вернул светлую тему`,
  );
  await ctx.close();
}

/* Без ?tema переключателя пока нет (тема на проверке, PR 1). */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + href(ZADANIYA), { waitUntil: 'networkidle' });
  check(!(await page.locator('.tema-switch').first().isVisible()), 'без ?tema переключатель виден');
  check(
    (await page.evaluate(() => document.documentElement.hasAttribute('data-tema'))) === false,
    'по умолчанию тема не светлая',
  );
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length > 0) {
  console.error(`Тёмная тема: ${failures.length} из ${checks} проверок не прошли:`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Тёмная тема: проверок ${checks}, ошибок нет.`);
