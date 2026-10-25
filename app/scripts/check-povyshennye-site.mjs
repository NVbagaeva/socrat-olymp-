#!/usr/bin/env node
/* scripts/check-povyshennye-site.mjs — раздел «Варианты повышенной
   сложности» в браузере, на собранном сайте (app/out).

   Запуск: pnpm build && pnpm test:povyshennye-site [--shots]

     1. /povyshennye/: 36 карточек, у готового варианта шесть версий
        кнопками, остальные (не из GOTOVY) — «Готовится»; фильтры работают.
     2. Версия 1.1 открывается в общем онлайн-режиме «Собрать вариант»:
        лента 1–13, проверка ответа, итоги с первичным и тестовым баллом.
     3. После завершения у версии на экране раздела — «завершён» и балл;
        фильтр «С ошибками» показывает её, «Нерешённые» — прячет.
     4. Листы версии (ученик, учитель, разбор) раскладываются на страницы.

   --shots — снимки в docs/povyshennye-snimki/ (компьютер и телефон). */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { requireSrc, APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium);

const SHOTS = process.argv.includes('--shots');
const OUT = path.join(APP, 'out');
const SHOT_DIR = path.join(APP, '..', 'docs', 'povyshennye-snimki');
if (!fs.existsSync(path.join(OUT, 'povyshennye', 'index.html'))) {
  console.error('Нет сборки out/povyshennye/ — сначала pnpm build.');
  process.exit(1);
}

const warn = console.warn;
console.warn = (...a) => (String(a[0]).includes('LaTeX-incompatible') ? undefined : warn(...a));

let failures = 0;
function ok(cond, where, message) {
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${where}: ${message}`);
  } else {
    console.log(`  ✓ ${where}`);
  }
}

/* Верные ответы версии 1.1 — тот же набор, что соберёт браузер. */
const { povSetIz } = requireSrc('lib/povyshennye/set');
const { VARIANT } = requireSrc('lib/povyshennye/dannye/v01');
const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const { normalizeAnswer } = requireSrc('lib/variant/online/normalize');
const SET = povSetIz(1, VARIANT.versii);
const answerOf = (v, i) =>
  normalizeAnswer(SET.variants[v - 1].tasks[i].answer).value.replace('.', ',');

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
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (!file.startsWith(OUT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    fs.createReadStream(path.join(OUT, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.PW_CHROMIUM ?? process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

async function shot(page, name, fullPage = false) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage });
  console.log(`  снимок ${name}.png`);
}

const errors = [];
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await welcomeSeen(desk);
const page = await desk.newPage();
page.on('pageerror', (e) => errors.push(String(e)));

console.log('1. Экран раздела');
await page.goto(`${BASE}/povyshennye/`);
await page.getByTestId('pov-grid').waitFor({ timeout: 60_000 });
ok(
  (await page.locator('.pov-card').count()) === 36,
  '36 карточек',
  String(await page.locator('.pov-card').count()),
);
ok(
  (await page.locator('[data-testid="pov-card-1"] .pov-v').count()) === 6,
  'у варианта 1 шесть версий',
  'нет',
);
ok(
  (await page.locator('.pov-card.is-soon').count()) === 36 - GOTOVY.length,
  `остальные ${36 - GOTOVY.length} — «Готовится»`,
  String(await page.locator('.pov-card.is-soon').count()),
);
await shot(page, 'razdel-kompyuter');

console.log('2. Версия 1.1 онлайн');
await page.getByTestId('pov-v-1.1').click();
await page.getByTestId('vo-begin').click({ timeout: 60_000 });
await page.getByTestId('vo-card').waitFor();
ok((await page.locator('.vo-strip__no').count()) === 13, 'лента 1–13', 'нет');
ok((await page.locator('.vo-start__title, h2').first().textContent()) !== null, 'заголовок', '');
/* Верно — задания 1–12, №13 — неверно: получится «с ошибками». */
for (let i = 0; i < 12; i += 1) {
  await page.locator('.vo-strip__no').nth(i).click();
  await page.getByTestId('vo-input').fill(answerOf(1, i));
  await page.getByTestId('vo-check').click();
  await page.locator('.vo-verdict.is-right').first().waitFor({ timeout: 30_000 });
}
await page.locator('.vo-strip__no').nth(8).click();
await shot(page, 'versiya-1-1-zadanie-9-kompyuter');
await page.locator('.vo-strip__no').nth(11).click();
await shot(page, 'versiya-1-1-zadanie-12-kompyuter');
await page.locator('.vo-strip__no').nth(12).click();
await page.getByTestId('vo-input').fill('1');
await page.getByTestId('vo-check').click();
await page.locator('.vo-verdict.is-wrong').first().waitFor();
await shot(page, 'versiya-1-1-podskazka-kompyuter');
await page.getByTestId('vo-finish').click();
await page.getByTestId('vo-confirm').click();
await page.getByTestId('vo-result').waitFor({ timeout: 60_000 });
ok(
  (await page.getByTestId('vo-primary').textContent())?.includes('12 из 13') === true,
  'первичный балл 12 из 13',
  (await page.getByTestId('vo-primary').textContent()) ?? '',
);
ok((await page.getByTestId('vo-test').count()) === 1, 'тестовый балл', 'нет');
await shot(page, 'versiya-1-1-itogi-kompyuter');

console.log('3. Статус версии на экране раздела');
await page.goto(`${BASE}/povyshennye/`);
await page.getByTestId('pov-grid').waitFor({ timeout: 60_000 });
const v11 = page.getByTestId('pov-v-1.1');
ok(
  (await v11.getAttribute('class'))?.includes('is-done') === true,
  'версия 1.1 — завершена',
  (await v11.getAttribute('class')) ?? '',
);
ok(
  (await v11.textContent())?.includes('12 из 13') === true,
  'у версии балл',
  (await v11.textContent()) ?? '',
);
await page.getByRole('radio', { name: 'С ошибками' }).click();
ok(
  (await page.getByTestId('pov-v-1.1').count()) === 1 &&
    (await page.getByTestId('pov-v-1.2').count()) === 0,
  'фильтр «С ошибками»',
  'не так',
);
await page.getByRole('radio', { name: 'Нерешённые' }).click();
ok(
  (await page.getByTestId('pov-v-1.1').count()) === 0 &&
    (await page.getByTestId('pov-v-1.2').count()) === 1,
  'фильтр «Нерешённые»',
  'не так',
);
await page.getByRole('radio', { name: 'Все' }).click();
await page.locator('[data-testid="pov-card-1"] .pov-print__toggle').click();
await shot(page, 'razdel-posle-resheniya-kompyuter');
await page.locator('.pov-stats').scrollIntoViewIfNeeded();
await shot(page, 'statistika-razdela-kompyuter');

const phone = await browser.newContext({ ...devices['iPhone 13'] });
await welcomeSeen(phone);
const mob = await phone.newPage();
mob.on('pageerror', (e) => errors.push(String(e)));
await mob.goto(`${BASE}/povyshennye/`);
await mob.getByTestId('pov-grid').waitFor({ timeout: 60_000 });
const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(overflow <= 0, 'на телефоне нет прокрутки вбок', String(overflow));
await shot(mob, 'razdel-telefon');
await mob.goto(`${BASE}/variant/reshat/?kod=PV-01&v=2&r=t&tm=0&w=ege`);
await mob.getByTestId('vo-begin').click({ timeout: 60_000 });
await mob.locator('.vo-strip__no').nth(8).click();
await shot(mob, 'versiya-1-2-zadanie-9-telefon');

console.log('4. Листы версии');
for (const list of ['uchenik', 'uchitel', 'razbor']) {
  const p = await desk.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.addInitScript(() => {
    window.print = () => {};
  });
  await p.setViewportSize({ width: 900, height: 1200 });
  await p.goto(`${BASE}/variant/pechat/?kod=PV-01&v=1&list=${list}`);
  await p.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 120_000 });
  const n = await p.locator('#sheet-pages .sheet-page, #sheet-pages > *').count();
  ok(n >= 1, `лист «${list}»: страниц ${n}`, 'пусто');
  const txt = (await p.locator('#sheet-pages').textContent()) ?? '';
  ok(txt.includes('Вариант 1.1'), `лист «${list}»: подпись «Вариант 1.1»`, 'нет');
  await shot(p, `list-${list}`, true);
  await p.close();
}

ok(errors.length === 0, 'ошибок на страницах нет', errors.join('\n'));
await browser.close();
server.close();
console.log(failures === 0 ? '\nВсё в порядке.' : `\nОшибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
