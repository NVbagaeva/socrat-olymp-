#!/usr/bin/env node
/* scripts/check-progress-perevod-site.mjs — перевод разделов на журнал
   попыток на собранном сайте.

   Запуск: pnpm test:progress-perevod-site (после pnpm build).

   В браузер кладутся настоящие записи прежнего формата
   (scripts/fixtures/progress-legacy.json), затем открываются тренажёры
   всех переведённых разделов. Проверяется, что:
     • страница открылась без ошибок сценариев;
     • журнал раздела собран из прежнего ключа и итог в нём тот же;
     • прежний ключ остался байт в байт;
     • тренажёр №10 пишет первую попытку в свой новый журнал. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import { metkaAdministratora } from './lib/metka-skrytyh.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}
const FIXTURES = JSON.parse(
  fs.readFileSync(path.join(APP, 'scripts', 'fixtures', 'progress-legacy.json'), 'utf8'),
);
const L = requireSrc('lib/progressLog/model.ts');

/* Страница тренажёра → прежний ключ → журнал. */
const RAZDELY = [
  ['/zadaniya/1/trenazher/', 'budetege:planimetriya-1:v1', 'budetege:planimetriya-1:log:v1'],
  ['/zadaniya/2/trenazher/', 'budetege:vektory-2:v1', 'budetege:vektory-2:log:v1'],
  ['/zadaniya/4/trenazher/', 'budetege:veroyatnost-4:v2', 'budetege:veroyatnost-4:log:v1'],
  ['/zadaniya/5/trenazher/', 'budetege:veroyatnost-5:v2', 'budetege:veroyatnost-5:log:v1'],
  ['/zadaniya/6/trenazher/', 'budetege:zadanie-6:v1', 'budetege:zadanie-6:log:v1'],
  ['/zadaniya/7/trenazher/', 'budetege:zadanie-7:v1', 'budetege:zadanie-7:log:v1'],
  ['/zadaniya/9/trenazher/', 'budetege:proizvodnaya-9:v1', 'budetege:proizvodnaya-9:log:v1'],
  ['/zadaniya/11/trenazher/', 'budetege:zadanie-11:v1', 'budetege:zadanie-11:log:v1'],
  ['/zadaniya/12/trenazher/', 'budetege:trainer:v1', 'budetege:zadanie-12:log:v1'],
  ['/zadaniya/13/trenazher/', 'budetege:zadanie-13:v1', 'budetege:zadanie-13:log:v1'],
  ['/zadaniya/14/trenazher/', 'budetege:zadanie-14:v1', 'budetege:zadanie-14:log:v1'],
  ['/zadaniya/18/trenazher/', 'budetege:zadanie-18:trenazher:v1', 'budetege:zadanie-18:log:v1'],
];

/* Тренажёры, которые не показывают прогресс на первом экране. */
const LENIVYE = ['budetege:zadanie-7:log:v1', 'budetege:zadanie-14:log:v1'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (!file.startsWith(OUT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}

const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await welcomeSeen(ctx);
/* Скрытый раздел (№6 в ЕГЭ-2027) — как у администратора. */
await metkaAdministratora(ctx);
/* Прежние записи — как у ученика, который решал до перевода. */
await ctx.addInitScript(
  (fixtures) => {
    for (const [key, value] of Object.entries(fixtures)) {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    }
  },
  Object.fromEntries(Object.entries(FIXTURES).map(([k, v]) => [k, JSON.stringify(v)])),
);

const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

for (const [url, old, logKey] of RAZDELY) {
  errors.length = 0;
  const response = await page.goto(BASE + url, { waitUntil: 'networkidle' });
  check(response?.status() === 200, `${url}: страница открылась`);
  check(errors.length === 0, `${url}: без ошибок сценариев ${errors.join(' | ')}`);
  const got = await page.evaluate(
    ([a, b]) => [localStorage.getItem(a), localStorage.getItem(b)],
    [old, logKey],
  );
  check(got[0] === JSON.stringify(FIXTURES[old]), `${old}: прежний ключ не изменился`);
  if (got[1] === null) {
    /* Страница не читает прогресс при открытии (№7, №14): журнал соберётся
       при первой записи попытки или чтении — это проверяет test:progress-perevod. */
    check(LENIVYE.includes(logKey), `${logKey}: журнала ещё нет — раздел читает прогресс позже`);
    continue;
  }
  const log = L.parseLog(JSON.parse(got[1]));
  const t = L.totals(log);
  const done = Object.values(FIXTURES[old].kinds).reduce((n, k) => n + k.done, 0);
  const right = Object.values(FIXTURES[old].kinds).reduce((n, k) => n + k.right, 0);
  check(
    t.done === done && t.right === right,
    `${logKey}: журнал собран, решено ${t.done} (ждали ${done}), верно ${t.right} (ждали ${right})`,
  );
}

/* №10: прогресса раньше не было — первая попытка заводит журнал. */
{
  errors.length = 0;
  /* Тип задач выбран адресом — как по ссылке из «О задании». */
  await page.goto(BASE + '/zadaniya/10/trenazher/?tipy=P22', { waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: /Начать/ })
    .first()
    .click();
  const pole = page.locator('.z10-otvet input');
  await pole.waitFor({ timeout: 20000 });
  await pole.fill('123456');
  await page.getByRole('button', { name: 'Проверить' }).click();
  await page.waitForFunction(() => localStorage.getItem('budetege:zadanie-10:log:v1') !== null);
  const log = L.parseLog(
    JSON.parse(await page.evaluate(() => localStorage.getItem('budetege:zadanie-10:log:v1'))),
  );
  const a = log.attempts[0];
  check(
    log.attempts.length === 1 && a.outcome === 'wrong' && /^P\d+/.test(a.kind) && a.task !== '',
    `№10: попытка в журнале — ${JSON.stringify(a)}`,
  );
  check(errors.length === 0, `№10: без ошибок сценариев ${errors.join(' | ')}`);
}

await browser.close();
server.close();
console.log(`\nПроверок: ${checks}, не прошло: ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
