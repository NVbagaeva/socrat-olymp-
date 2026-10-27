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
     5. Часть 2 (вариант 1): лента 1–20 из двух частей, кнопки перехода,
        плашки баллов, решение со ссылкой на теорему (окно), самооценка
        по критериям → итог из 33 и тестовый балл; на 320 и 375 px нет
        прокрутки вбок; на листах часть 2 — с новой страницы, плашки,
        место для решения, критерии и теоремы у учителя.
     6. Часть 2 остальных вариантов (S_CHAST2): решения 14–20 открываются,
        формулы набраны, у 15 и 18 ссылки на теоремы; на 320 px у 15, 18, 19
        нет прокрутки вбок; лист ученика — задания 14–20 по странице с
        клеткой, у учителя — критерии.

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
const { GOTOVY, S_CHAST2 } = requireSrc('lib/povyshennye/dannye/index');
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
ok((await page.locator('.vo-strip__no').count()) === 20, 'лента 1–20 (две части)', 'нет');
ok(
  (await page.locator('.vo-strip__label').allTextContents()).join('|') === 'Часть 1|Часть 2',
  'подписи «Часть 1» / «Часть 2»',
  'нет',
);
ok(
  (await page.locator('.vo-card .ball-plashka').textContent()) === '1 балл',
  'плашка «1 балл» у задания части 1',
  (await page.locator('.vo-card .ball-plashka').textContent()) ?? '',
);
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
  (await page.getByTestId('vo-part1').textContent())?.includes('12 из 13') === true,
  'часть 1: 12 из 13',
  (await page.getByTestId('vo-part1').textContent()) ?? '',
);
ok(
  (await page.getByTestId('vo-part2').textContent())?.includes('на проверке') === true,
  'часть 2: на проверке',
  (await page.getByTestId('vo-part2').textContent()) ?? '',
);
ok(
  (await page.getByTestId('vo-test').count()) === 0,
  'тестовый балл скрыт до проверки части 2',
  'есть',
);
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
  (await v11.textContent())?.includes('Часть 1: 12/13 · Часть 2: на проверке') === true,
  'у версии баллы по частям',
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

console.log('5. Часть 2');
const OZHIDAEM = {
  14: '2 балла',
  15: '3 балла',
  16: '2 балла',
  17: '2 балла',
  18: '3 балла',
  19: '4 балла',
  20: '4 балла',
};
await page.goto(`${BASE}/variant/reshat/?kod=PV-01&v=3&r=t&tm=0&w=ege`);
await page.getByTestId('vo-begin').click({ timeout: 60_000 });
await page.getByTestId('vo-card').waitFor();
await page.locator('.vo-strip__no').nth(12).click();
ok(
  (await page.getByTestId('vo-to-part2').count()) === 1,
  'после №13 — «Перейти ко второй части»',
  'нет',
);
await page.getByTestId('vo-to-part2').click();
ok(
  (await page.getByTestId('vo-part2-head').count()) === 1,
  'заголовок и инструкция части 2',
  'нет',
);
ok(
  (await page.getByTestId('vo-part2-head').textContent())?.includes(
    'Максимум за часть 2 — 20 баллов',
  ) === true,
  '«Максимум за часть 2 — 20 баллов»',
  'нет',
);
let summa2 = 0;
for (const no of [14, 15, 16, 17, 18, 19, 20]) {
  await page
    .locator('[data-testid=vo-strip-part2] .vo-strip__no', { hasText: new RegExp(`^${no}$`) })
    .click();
  const pl = (await page.locator('.vo-card__title .ball-plashka').textContent()) ?? '';
  ok(pl === OZHIDAEM[no], `плашка №${no}: ${OZHIDAEM[no]}`, pl);
  await page.getByTestId(`c2-${no}-reshenie`).click();
  await page.getByTestId(`c2-${no}-reshenie-ok`).click();
  await page.getByTestId(`c2-${no}-reshenie-telo`).waitFor();
  if (no === 15 || no === 18) {
    const n = await page.locator('.teor-ssylka').count();
    ok(n >= 3, `№${no}: ссылки на теоремы (${n})`, 'мало');
    await page.locator('.teor-ssylka').first().click();
    await page.getByTestId('teorema-okno').waitFor({ timeout: 30_000 });
    const t = (await page.getByTestId('teorema-okno').textContent()) ?? '';
    ok(
      t.includes('Доказательство') || t.includes('Почему'),
      `№${no}: окно теоремы с доказательством`,
      t.slice(0, 80),
    );
    ok(
      (await page.locator('[data-testid=teorema-okno] svg').count()) === 1,
      `№${no}: в окне чертёж`,
      'нет',
    );
    await page.keyboard.press('Escape');
  }
  /* Самооценка: максимум у 14, у остальных 1 балл. */
  const b = no === 14 ? 2 : 1;
  summa2 += b;
  await page.getByTestId(`c2-${no}-ball-${b}`).click();
}
await page.getByTestId('vo-to-part1').click();
ok(
  (await page.locator('.vo-strip__no.is-current').textContent()) === '1',
  '«Вернуться к первой части»',
  'нет',
);
await page.getByTestId('vo-finish').click();
await page.getByTestId('vo-confirm').click();
await page.getByTestId('vo-itog2').waitFor({ timeout: 60_000 });
ok(
  (await page.getByTestId('vo-part2').textContent())?.includes(`${summa2} из 20`) === true,
  `часть 2: ${summa2} из 20`,
  (await page.getByTestId('vo-part2').textContent()) ?? '',
);
ok(
  (await page.getByTestId('vo-total').textContent())?.includes(`${summa2} из 33`) === true,
  `всего: ${summa2} из 33`,
  (await page.getByTestId('vo-total').textContent()) ?? '',
);
ok(
  (await page.getByTestId('vo-test').count()) === 1,
  'тестовый балл после проверки части 2',
  'нет',
);
await shot(page, 'chast2-itogi-kompyuter');

for (const w of [320, 375]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: 800 },
    isMobile: true,
    hasTouch: true,
  });
  await welcomeSeen(ctx);
  const m = await ctx.newPage();
  m.on('pageerror', (e) => errors.push(String(e)));
  await m.goto(`${BASE}/variant/reshat/?kod=PV-01&v=4&r=t&tm=0&w=ege`);
  await m.getByTestId('vo-begin').click({ timeout: 60_000 });
  for (const no of [15, 18, 19]) {
    await m
      .locator('[data-testid=vo-strip-part2] .vo-strip__no', { hasText: new RegExp(`^${no}$`) })
      .click();
    await m.getByTestId(`c2-${no}-reshenie`).click();
    await m.getByTestId(`c2-${no}-reshenie-ok`).click();
    await m.getByTestId(`c2-${no}-reshenie-telo`).waitFor();
    const sx = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(sx <= 0, `${w} px, №${no} с решением: нет прокрутки вбок`, String(sx));
  }
  await ctx.close();
}

for (const list of ['uchenik', 'uchitel']) {
  const p = await desk.newPage();
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.addInitScript(() => {
    window.print = () => {};
  });
  await p.setViewportSize({ width: 900, height: 1200 });
  await p.goto(`${BASE}/variant/pechat/?kod=PV-01&v=1&list=${list}`);
  await p.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 120_000 });
  const r = await p.evaluate(() => {
    const head = document.querySelector('#sheet-pages .var-part2-head');
    const page = head?.closest('.sheet-page');
    const first = page?.querySelector('.sheet-flow')?.firstElementChild;
    return {
      head: head !== null,
      pervyy: first !== null && first !== undefined && first.contains(head),
      plashki: [...document.querySelectorAll('#sheet-pages .ball-plashka')].map(
        (e) => e.textContent,
      ),
      /* Часть 2 «по странице на задание»: карточка задачи — первый кусок
         страницы (у №14 — сразу под заголовком части), поле в клетку
         до нижнего поля с допуском меньше клетки, клеток целое число. */
      stranicy: [...document.querySelectorAll('#sheet-pages .sheet-tasks--page')].map((card) => {
        const page = card.closest('.sheet-page');
        const flow = page.querySelector('.sheet-flow');
        const kids = [...flow.children];
        const fill = page.querySelector('.sheet-fill');
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;height:50mm';
        flow.appendChild(probe);
        const cell = probe.getBoundingClientRect().height / 10;
        probe.remove();
        const fb = fill.getBoundingClientRect();
        const rows = Number(fill.dataset.rows);
        const cols = Number(fill.dataset.cols);
        return {
          no: Number(card.querySelector('.sheet-task-no').textContent),
          pervaya:
            kids.indexOf(card) === 0 ||
            (kids.indexOf(card) === 1 && kids[0].classList.contains('var-part2-head')),
          zazor: (flow.getBoundingClientRect().bottom - fb.bottom) / cell,
          celye:
            Math.abs(fb.height - 2 - rows * cell) < 1 && Math.abs(fb.width - 2 - cols * cell) < 1,
          rows,
          stroka: page.querySelector('.sheet-answer-line') === null,
        };
      }),
      stranic1: (() => {
        const pages = [...document.querySelectorAll('#sheet-pages .sheet-page')];
        return pages.findIndex((pg) => pg.querySelector('.var-part2-head') !== null);
      })(),
      krit: document.querySelectorAll('#sheet-pages .c2-krit-print').length,
      teor: document.querySelectorAll('#sheet-pages .var-teor .teor').length,
    };
  });
  ok(
    r.head && r.pervyy,
    `лист «${list}»: часть 2 с новой страницы`,
    JSON.stringify(r).slice(0, 120),
  );
  ok(r.plashki.length === 20, `лист «${list}»: 20 плашек баллов`, String(r.plashki.length));
  ok(
    r.plashki.slice(13).join(',') === Object.values(OZHIDAEM).join(','),
    `лист «${list}»: плашки 14–20`,
    r.plashki.slice(13).join(','),
  );
  if (list === 'uchenik') {
    ok(r.stranicy.length === 7, 'часть 2: семь заданий по странице', String(r.stranicy.length));
    for (const z of r.stranicy) {
      ok(z.pervaya, `№${z.no} — с новой страницы`, '');
      ok(
        z.zazor >= 0 && z.zazor < 1,
        `№${z.no}: клетка до нижнего поля (зазор ${z.zazor.toFixed(2)} клетки)`,
        '',
      );
      ok(z.celye && z.rows > 0, `№${z.no}: целое число клеток (${z.rows} строк)`, '');
      ok(z.stroka, `№${z.no}: без строки «Ответ:»`, '');
    }
    ok(
      r.stranic1 >= 1 && r.stranic1 <= 4,
      `часть 1 — ${r.stranic1} стр., как раньше`,
      String(r.stranic1),
    );
  }
  if (list === 'uchitel') {
    ok(r.krit === 7, 'критерии 14–20 у учителя', String(r.krit));
    ok(r.teor >= 10, `теоремы в конце листа учителя (${r.teor})`, 'мало');
  }
  await p.close();
}

console.log('6. Часть 2 остальных вариантов');
for (const k of S_CHAST2.filter((x) => x !== 1)) {
  const kod = `PV-${String(k).padStart(2, '0')}`;
  const v = ((k - 1) % 6) + 1;
  const p = await desk.newPage();
  p.on('pageerror', (e) => errors.push(`${kod}: ${String(e)}`));
  await p.goto(`${BASE}/variant/reshat/?kod=${kod}&v=${v}&r=t&tm=0&w=ege`);
  await p.getByTestId('vo-begin').click({ timeout: 60_000 });
  await p.getByTestId('vo-card').waitFor();
  for (const no of [14, 15, 16, 17, 18, 19, 20]) {
    await p
      .locator('[data-testid=vo-strip-part2] .vo-strip__no', { hasText: new RegExp(`^${no}$`) })
      .click();
    await p.getByTestId(`c2-${no}-reshenie`).click();
    await p.getByTestId(`c2-${no}-reshenie-ok`).click();
    const telo = p.getByTestId(`c2-${no}-reshenie-telo`);
    await telo.waitFor();
    const html = (await telo.innerHTML()) ?? '';
    ok(!html.includes('katex-error'), `${kod}.${v} №${no}: решение набрано`, 'katex-error');
    if (no === 15 || no === 18) {
      const n = await telo.locator('.teor-ssylka').count();
      ok(n >= 3, `${kod}.${v} №${no}: ссылки на теоремы (${n})`, 'мало');
      await telo.locator('.teor-ssylka').first().click();
      await p.getByTestId('teorema-okno').waitFor({ timeout: 30_000 });
      await p.keyboard.press('Escape');
    }
  }
  await shot(p, `chast2-${kod}-reshenie`);
  await p.close();

  const ctx = await browser.newContext({
    ...devices['iPhone 12'],
    viewport: { width: 320, height: 800 },
  });
  await welcomeSeen(ctx);
  const m = await ctx.newPage();
  m.on('pageerror', (e) => errors.push(`${kod} 320: ${String(e)}`));
  await m.goto(`${BASE}/variant/reshat/?kod=${kod}&v=${v}&r=t&tm=0&w=ege`);
  await m.getByTestId('vo-begin').click({ timeout: 60_000 });
  for (const no of [15, 18, 19]) {
    await m
      .locator('[data-testid=vo-strip-part2] .vo-strip__no', { hasText: new RegExp(`^${no}$`) })
      .click();
    await m.getByTestId(`c2-${no}-reshenie`).click();
    await m.getByTestId(`c2-${no}-reshenie-ok`).click();
    await m.getByTestId(`c2-${no}-reshenie-telo`).waitFor();
    const sx = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(sx <= 0, `${kod}.${v}, 320 px, №${no}: нет прокрутки вбок`, String(sx));
  }
  await ctx.close();

  for (const list of ['uchenik', 'uchitel']) {
    const q = await desk.newPage();
    q.on('pageerror', (e) => errors.push(`${kod} ${list}: ${String(e)}`));
    await q.addInitScript(() => {
      window.print = () => {};
    });
    await q.setViewportSize({ width: 900, height: 1200 });
    await q.goto(`${BASE}/variant/pechat/?kod=${kod}&v=${v}&list=${list}`);
    await q.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 120_000 });
    const r = await q.evaluate(() => ({
      stranicy: [...document.querySelectorAll('#sheet-pages .sheet-tasks--page')].map((card) => {
        const page = card.closest('.sheet-page');
        const fill = page.querySelector('.sheet-fill');
        return {
          no: Number(card.querySelector('.sheet-task-no').textContent),
          rows: Number(fill?.dataset.rows ?? 0),
        };
      }),
      krit: document.querySelectorAll('#sheet-pages .c2-krit-print').length,
      oshibki: document.querySelectorAll('#sheet-pages .katex-error').length,
    }));
    ok(r.oshibki === 0, `${kod}.${v} лист «${list}»: формулы набраны`, String(r.oshibki));
    if (list === 'uchenik') {
      ok(
        r.stranicy.length === 7 && r.stranicy.every((z) => z.rows > 0),
        `${kod}.${v}: задания 14–20 по странице с клеткой`,
        JSON.stringify(r.stranicy),
      );
    } else ok(r.krit === 7, `${kod}.${v}: критерии 14–20 у учителя`, String(r.krit));
    await q.close();
  }
}

ok(errors.length === 0, 'ошибок на страницах нет', errors.join('\n'));
await browser.close();
server.close();
console.log(failures === 0 ? '\nВсё в порядке.' : `\nОшибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
