#!/usr/bin/env node
/* scripts/check-ves12-site.mjs — «Весь №12» в браузере, на собранном
   сайте (out/, после pnpm build).

     • Карточка №12 в банке — обычная ссылка, как у остальных: тап
       сразу открывает страницу раздела, промежуточного окна нет.
     • Лента раздела №12 — та же, что у №9–11: «О задании», «Тренажёр»,
       «Генератор» и последней «Зачётная работа»; без дублей. На
       «О задании» — выбор типа функции.
     • Блок «Весь раздел» — первым пунктом меню «Все разделы» подтемы.
     • Зачётная: «ФИПИ + аналоги», 2 варианта → лист учеников (оба
       варианта) и лист учителя (таблица ответов, шкала) → онлайн по
       ссылке: вариант, ответы, «Завершить» → оценка и итоги по типам.
     • Лист генератора по всем типам собирается.

   node scripts/check-ves12-site.mjs [--shots DIR] — DIR: снимки 390 и 1440. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}
const SHOTS = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
if (SHOTS) {
  fs.mkdirSync(SHOTS, { recursive: true });
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

let checks = 0;
const errors = [];
function check(ok, text) {
  checks += 1;
  if (!ok) {
    errors.push(text);
  }
}

const browser = await chromium.launch();
async function context(width, height, mobile) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('budetege:cookie-notice:v1', JSON.stringify({ seen: true }));
      /* И окно «Впервые здесь?»: иначе через 2,5 с оно закроет кнопки. */
      localStorage.setItem('budetege:onboarding:v1', JSON.stringify({ welcomeSeen: true }));
    } catch {
      /* без хранилища баннер просто покажется */
    }
    window.print = () => {};
  });
  return ctx;
}
async function shot(page, name, full = false) {
  if (SHOTS) {
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
  }
}

/** Тап (или клик) по карточке №12 в банке: сразу страница раздела. */
async function openRazdel(page, mobile) {
  await page.goto(BASE + '/zadaniya/', { waitUntil: 'networkidle' });
  const card = page.locator('.tasks-grid a').filter({ hasText: /Графики функций/ }).first();
  await card.scrollIntoViewIfNeeded();
  await (mobile ? card.tap() : card.click());
  await page.waitForURL('**/zadaniya/12/');
  await page.waitForLoadState('networkidle');
}

const VKLADKI_12 = ['О задании', 'Тренажёр', 'Генератор', 'Зачётная работа'];

for (const [width, height, mobile] of [
  [1440, 900, false],
  [390, 844, true],
]) {
  const ctx = await context(width, height, mobile);
  const page = await ctx.newPage();
  const where = (text) => `${width}: ${text}`;

  await openRazdel(page, mobile);
  check((await page.locator('.modal, .subtopic-modal').count()) === 0, where('после тапа по №12 открылось окно'));
  const vkladki = (await page.locator('.topic-tabs .tabs--lenta [role=tab]').allInnerTexts())
    .map((t) => t.trim())
    .filter(Boolean);
  const unique = [...new Set(vkladki)];
  check(
    JSON.stringify(unique) === JSON.stringify(VKLADKI_12),
    where(`лента №12: ${unique.join(' | ')}`),
  );
  check(
    (await page.locator('.subtopics-grid a.subtopic').count()) > 0 ||
      (await page.locator('.subtopics-grid a').count()) > 0,
    where('«О задании» №12: нет выбора типа функции'),
  );
  await shot(page, `stranica-12-${width}`);

  const zachyot = page.locator('.topic-tabs .tabs--lenta a', { hasText: 'Зачётная работа' }).first();
  await (mobile ? zachyot.tap() : zachyot.click());
  await page.waitForURL('**/zadaniya/12/zachyot/**');
  await page.waitForSelector('.steps');
  check((await page.locator('.tabs--lenta').count()) > 0, where('зачётная работа — не во вкладке раздела'));

  if (!mobile) {
    await page.goto(BASE + '/zadaniya/12/linear/', { waitUntil: 'networkidle' });
    const plashka = page.locator('.razdely-plashka');
    if ((await plashka.count()) > 0) {
      await plashka.first().click();
      await page.waitForSelector('.razdely-menu');
      const first = await page.$eval('.razdely-menu__list > li', (li) => li.classList.contains('razdely-menu__ves'));
      check(first, 'меню «Все разделы»: «Весь раздел» не первым пунктом');
      check((await page.locator('.razdely-menu .ves-card').count()) === 3, 'меню: нет трёх карточек «Весь раздел»');
      await page.waitForTimeout(400);
      await shot(page, 'menu-1440');
    }
  }
  await ctx.close();
}

/* ── Зачётная работа: экран настройки ──────────────────────────── */

/** Нажатие с подсчётом: в отчёт идёт число нажатий типового сценария. */
let clicks = 0;
async function press(locator) {
  clicks += 1;
  await locator.click();
}
async function counts(page) {
  return page.$$eval('.sostav-counter', (nodes) =>
    Object.fromEntries(nodes.map((n) => [n.dataset.row, Number(n.getAttribute('aria-valuenow'))])),
  );
}
const mainButton = (page, mobile) =>
  page.locator(mobile ? '.zs-bar [data-testid=zachyot-main]' : '.zs-sum [data-testid=zachyot-main]');

for (const [width, height, mobile] of [
  [1440, 900, false],
  [390, 844, true],
]) {
  const ctx = await context(width, height, mobile);
  const page = await ctx.newPage();
  const where = (text) => `${width}: ${text}`;

  /* Типовой сценарий: «Весь №12, как на ЕГЭ» → «Собрать работу». */
  await page.goto(BASE + '/zadaniya/12/zachyot/', { waitUntil: 'networkidle' });
  await shot(page, `zachyot-shag1-${width}`, true);
  clicks = 0;
  await press(page.locator('[data-template=ege]'));
  await press(mainButton(page, mobile));
  await page.waitForSelector('[data-testid=zachyot-out]', { timeout: 60000 });
  check(clicks === 2, where(`«Весь №12» → «Собрать»: нажатий ${clicks}`));
  const main = await mainButton(page, mobile).getAttribute('data-main');
  check(main === 'download', where(`после сборки главная кнопка не «Скачать для печати» (${main})`));
  check(
    (await page.locator('.zs-preview__task').count()) > 0,
    where('после сборки в превью нет задач первой страницы'),
  );
  await shot(page, `zachyot-shag3-${width}`, true);

  /* Изменили настройки — код «устарел», кнопка снова «Собрать работу». */
  await page.locator('.steps__item').nth(1).click();
  await page.getByRole('radio', { name: '2' }).first().click();
  await page.locator('.steps__item').nth(2).click();
  check((await page.locator('[data-testid=zachyot-stale]').count()) === 1, where('после изменения код не помечен «устарел»'));
  check((await mainButton(page, mobile).getAttribute('data-main')) === 'build', where('после изменения кнопка не «Собрать работу»'));

  /* «Свой состав»: три типа с разным числом задач, у одного выключен прототип. */
  await page.locator('.steps__item').nth(0).click();
  await page.locator('[data-template=own]').click();
  for (const [row, n] of [['linear', 1], ['quadratic', 2], ['exponential', 3]]) {
    for (let i = 0; i < n; i += 1) {
      await page.locator(`.sostav-counter[data-row=${row}] button[aria-label="Больше"]`).click();
    }
  }
  const expRow = page.locator('.sostav-row').filter({ has: page.locator('.sostav-counter[data-row=exponential]') });
  await expRow.locator('.sostav-row__more').click();
  await expRow.locator('.sostav-set').nth(3).click();
  await shot(page, `zachyot-prototipy-${width}`, true);
  const own = await counts(page);
  check(own.linear === 1 && own.quadratic === 2 && own.exponential === 3 && own.trigonometric === 0, where(`«Свой состав»: ${JSON.stringify(own)}`));
  check(/3 из 4/.test((await expRow.locator('.sostav-row__sets').textContent()) ?? ''), where('нет «3 из 4 прототипов»'));
  const total = await page.locator(mobile ? '.zs-bar__text b' : '[data-testid=zachyot-total]').first().textContent();
  check(/6/.test(total ?? ''), where(`сводка: задач «${total}», а нужно 6`));
  check(/off=12E\.D/.test(decodeURIComponent(page.url())), where('выключенный прототип не попал в адрес'));

  /* Нехватка: тригонометрия 4 задачи × 2 варианта по ФИПИ. */
  await page.locator('[data-template=own]').click();
  for (let i = 0; i < 4; i += 1) {
    await page.locator('.sostav-counter[data-row=trigonometric] button[aria-label="Больше"]').click();
  }
  await page.locator('.steps__item').nth(1).click();
  await page.getByRole('radio', { name: 'Только ФИПИ' }).click();
  check((await page.locator('[data-testid=zachyot-shortage]').count()) === 1, where('нет плашки нехватки задач ФИПИ'));
  check((await mainButton(page, mobile).isDisabled()), where('при нехватке главная кнопка активна'));
  await shot(page, `zachyot-shag2-${width}`, true);
  await page.click('[data-testid=zachyot-add-analogs]');
  check((await page.locator('[data-testid=zachyot-shortage]').count()) === 0, where('после «Добавить аналоги» плашка осталась'));

  /* Ссылка на настройку открывает тот же набор. */
  const shared = page.url().replace(/&kod=[^&]*/, '');
  const other = await ctx.newPage();
  await other.goto(shared, { waitUntil: 'networkidle' });
  const again = await counts(other);
  check(again.trigonometric === 4 && again.linear === 0, where(`ссылка с настройками: ${JSON.stringify(again)}`));
  await other.close();

  /* «Как в прошлый раз» — после сборки, на чистой странице. */
  await page.locator('.steps__item').nth(0).click();
  await page.locator('[data-template=ege]').click();
  await mainButton(page, mobile).click();
  await page.waitForSelector('[data-testid=zachyot-out]', { timeout: 60000 });
  await page.goto(BASE + '/zadaniya/12/zachyot/', { waitUntil: 'networkidle' });
  await page.locator('[data-template=own]').click();
  check((await page.locator('[data-template=last]').count()) === 1, where('нет плитки «Как в прошлый раз»'));
  await page.locator('[data-template=last]').click();
  const restored = await counts(page);
  check(Object.values(restored).every((n) => n === 2), where(`«Как в прошлый раз»: ${JSON.stringify(restored)}`));
  await ctx.close();
}

/* ── Зачётная работа: листы и онлайн ───────────────────────────── */
{
  const width = 1440;
  const ctx = await context(1440, 900, false);
  const page = await ctx.newPage();
  const where = (text) => `${width}: ${text}`;
  /* Прямая, парабола и показательная по 2, ФИПИ + аналоги, 2 варианта. */
  await page.goto(
    BASE + '/zadaniya/12/zachyot/?c=linear:2,quadratic:2,exponential:2&v=2&src=all&u=Иванова А. Б.',
    { waitUntil: 'networkidle' },
  );
  await page.locator('.zs-sum [data-testid=zachyot-main]').click();
  await page.waitForSelector('[data-testid=zachyot-out]', { timeout: 60000 });
  const studentHref = await page.getAttribute('[data-testid=zachyot-print-student]', 'href');
  const teacherHref = await page.getAttribute('[data-testid=zachyot-print-teacher]', 'href');
  const runHref = await page.getAttribute('[data-testid=zachyot-link]', 'href');
  check(studentHref !== null && teacherHref !== null && runHref !== null, where('нет ссылок на листы и онлайн'));

  for (const [kind, url] of [
    ['uchenik', studentHref],
    ['uchitel', teacherHref],
  ]) {
    const sheet = await ctx.newPage();
    await sheet.goto(BASE + url, { waitUntil: 'networkidle' });
    await sheet.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 90000 });
    const error = await sheet.evaluate(() => window.sheetPagination.error);
    check(error === undefined, where(`лист ${kind}: набор не удался — ${error}`));
    const info = await sheet.evaluate(() => ({
      tasks: document.querySelectorAll('#sheet-pages .sheet-task').length,
      variants: Array.from(document.querySelectorAll('#sheet-pages .sheet-variant')).map((n) => n.textContent),
      key: document.querySelectorAll('#sheet-pages .sheet-work-key').length,
      text: document.querySelector('#sheet-pages')?.textContent ?? '',
    }));
    check(info.tasks === 12, where(`лист ${kind}: задач ${info.tasks}, а в двух вариантах 12`));
    check(info.variants.includes('Вариант 1') && info.variants.includes('Вариант 2'), where(`лист ${kind}: нет двух вариантов`));
    if (kind === 'uchitel') {
      check(info.key > 0, where('лист учителя: нет таблицы ответов вариантов'));
      check(/Шкала оценок/.test(info.text), where('лист учителя: нет шкалы оценок'));
      if (SHOTS) {
        await sheet
          .locator('#sheet-pages .sheet-page', { has: sheet.locator('.sheet-work-key') })
          .first()
          .screenshot({ path: path.join(SHOTS, `zachyot-list-uchitel-otvety-${width}.png`) });
      }
    } else {
      check(!/Ответы/.test(info.text.replace(/Ответ:/g, '')), where('лист ученика: в нём ответы'));
    }
    await sheet.evaluate(() => window.scrollTo(0, 0));
    await shot(sheet, `zachyot-list-${kind}-${width}`);
    await sheet.close();
  }

  /* Онлайн: вариант 2, ответ на первую задачу, остальные пропущены. */
  await page.goto(BASE + runHref, { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: 'Вариант 2' }).click();
  await page.click('[data-testid=exam-start]');
  await page.waitForSelector('.exam__task', { timeout: 60000 });
  check((await page.locator('.exam__no').count()) === 6, where('онлайн: задач не 6'));
  const input = page.locator('[data-testid=exam-input]');
  if ((await input.count()) > 0) {
    await input.fill('1');
  }
  await page.click('[data-testid=exam-skip]');
  await page.locator('.exam__no').first().click();
  const kept = (await input.count()) > 0 ? await input.inputValue() : '1';
  check(kept === '1', where(`онлайн: ответ не сохранился при возврате («${kept}»)`));
  await page.click('[data-testid=exam-finish]');
  await page.click('[data-testid=exam-confirm]');
  await page.waitForSelector('[data-testid=exam-result]', { timeout: 30000 });
  const grade = await page.textContent('[data-testid=exam-grade]');
  check(['2', '3', '4', '5'].includes((grade ?? '').trim()), where(`итоги: оценка «${grade}»`));
  check((await page.locator('.tkind').count()) === 3, where('итоги: строк по типам не 3'));
  await shot(page, `zachyot-itogi-${width}`, true);
  await ctx.close();
}

/* ── Генератор по всем типам: лист ─────────────────────────────── */
{
  const ctx = await context(1440, 900, false);
  const page = await ctx.newPage();
  await page.goto(BASE + '/zadaniya/12/generator/', { waitUntil: 'networkidle' });
  await shot(page, 'generator-1440', true);
  /* Общий генератор: «Сгенерировать» по пресету «По задаче на тип», в
     «Дополнительно» — рамка «Запомни» и один пример, затем «Скачать PDF». */
  await page.getByRole('button', { name: /Сгенерировать/ }).first().click();
  await page.waitForSelector('.gen-paper.is-live .gen-task', { timeout: 90000 });
  await page.locator('.gen-dop__head').first().click();
  /* Памятка и пример по умолчанию зависят от вида работы: включаем
     явно, если выключены, и ставим один пример на тип. */
  for (const name of ['Памятка на листе', 'Разобранный пример на листе']) {
    const sw = page.getByRole('switch', { name });
    if ((await sw.getAttribute('aria-checked')) !== 'true') await sw.click();
  }
  await page.getByRole('group', { name: 'Примеров на тип' }).getByRole('button', { name: '1' }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('.gen-paper.is-live .gen-recap').length > 0,
    null,
    { timeout: 90000 },
  );
  const href = await page.locator('a.gen-pv__pdf[href]').first().getAttribute('href');
  check(href !== null, 'генератор: нет ссылки на лист ученика');
  if (href !== null) {
    const sheet = await ctx.newPage();
    await sheet.goto(new URL(href, BASE).href, { waitUntil: 'networkidle' });
    await sheet.waitForFunction(() => window.sheetPagination !== undefined, null, { timeout: 90000 });
    const info = await sheet.evaluate(() => ({
      tasks: document.querySelectorAll('#sheet-pages .sheet-task').length,
      recaps: document.querySelectorAll('#sheet-pages .sheet-recap').length,
      examples: document.querySelectorAll('#sheet-pages .sheet-example').length,
    }));
    check(info.tasks === 7, `генератор: задач на листе ${info.tasks}, а «По задаче на тип» — 7`);
    check(info.recaps === 7, `генератор: рамок «Запомни» ${info.recaps}, а типов 7`);
    check(info.examples === 7, `генератор: разобранных примеров ${info.examples}, а типов 7`);
    await shot(sheet, 'generator-list-1440');
    await sheet.close();
  }
  await ctx.close();
}

await browser.close();
server.close();
if (errors.length > 0) {
  console.error(`«Весь №12» на сайте — расхождения (${errors.length} из ${checks}):`);
  errors.forEach((line) => console.error('  ✗ ' + line));
  process.exit(1);
}
console.log(
  `«Весь №12» на сайте: проверок ${checks}, расхождений нет. ` +
    'Типовой сценарий «Весь №12, как на ЕГЭ» → «Собрать работу»: 2 нажатия.',
);
