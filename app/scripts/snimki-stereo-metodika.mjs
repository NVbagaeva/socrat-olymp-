#!/usr/bin/env node
/* scripts/snimki-stereo-metodika.mjs — снимки пилота новой методики №3
   для PR: компьютер (1440) и телефон (390).

   Запуск: pnpm build && node scripts/snimki-stereo-metodika.mjs

   Снимки — в docs/stereometry-snimki/metodika-1/:
     teoriya-verh, dve-paneli, lovushka, bloki, nazhmi, podskazka, itog. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
const DIR = path.join(APP, '..', 'docs', 'stereometry-snimki', 'metodika-1');
fs.mkdirSync(DIR, { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(OUT) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const ids = requireSrc('lib/stereo/opornye3/blok2.ts').zadachiBloka2().map((z) => z.id);

async function k(p, selector, nth = 0) {
  await p.evaluate(
    ([sel, n]) => {
      const el = document.querySelectorAll(sel)[n];
      const top = el?.getBoundingClientRect().top ?? 0;
      window.scrollTo(0, window.scrollY + top - (window.innerWidth < 760 ? 90 : 250));
    },
    [selector, nth],
  );
  await p.waitForTimeout(400);
}

for (const [tag, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await welcomeSeen(ctx);
  const shot = (p, name) => p.screenshot({ path: path.join(DIR, `${tag}-${name}.jpg`), type: 'jpeg', quality: 82 });

  const t = await ctx.newPage();
  await t.goto(`${BASE}/zadaniya/3/teoriya/#teoriya-treugolnik`, { waitUntil: 'load' });
  await t.waitForTimeout(800);
  await k(t, '#teoriya-treugolnik');
  await shot(t, '1-teoriya-verh');
  await k(t, '.stereo-dve');
  await shot(t, '2-dve-paneli');
  await k(t, '.ramka--lovushka');
  await shot(t, '3-lovushka');

  const b = await ctx.newPage();
  await b.goto(`${BASE}/zadaniya/3/opornye-zadachi/`, { waitUntil: 'load' });
  await b.waitForTimeout(500);
  await k(b, '.o3-karty');
  await shot(b, '4-bloki');

  const z = await ctx.newPage();
  await z.goto(`${BASE}/zadaniya/3/opornye-zadachi/prostranstvo-treugolnik/`, { waitUntil: 'load' });
  await z.waitForTimeout(500);
  /* Первая задача — «нажми»: выбираем цель на чертеже. */
  await z.locator('.o3-nazhmi__ris [data-cel]').last().click({ force: true });
  await k(z, '.o3-card');
  await shot(z, '5-nazhmi');
  await z.getByRole('button', { name: 'Подсказка по шагам' }).click();
  await z.waitForTimeout(300);
  await k(z, '.z11-hint');
  await shot(z, '6-podskazka');

  /* Итог блока: все задачи закрыты (две — с ошибкой). */
  const outcomes = Object.fromEntries(ids.map((id, i) => [id, i === 2 || i === 6 ? 'wrong' : 'right']));
  await z.evaluate((o) => {
    localStorage.setItem('budetege:zadanie-3:opornye:v1', JSON.stringify({ kinds: {}, mistakes: [], outcomes: o }));
  }, outcomes);
  await z.reload({ waitUntil: 'load' });
  await z.waitForTimeout(600);
  await k(z, '.o3-itog');
  await shot(z, '7-itog');
  await ctx.close();
}

await browser.close();
server.close();
console.log(`Снимки: ${path.relative(process.cwd(), DIR)}`);
