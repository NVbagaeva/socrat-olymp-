#!/usr/bin/env node
/* scripts/check-ves12-site.mjs — «Весь №12» в браузере, на собранном
   сайте (out/, после pnpm build).

     • Окно «Выберите тип функции»: в покое у карточек нет галочек,
       синей рамки и стрелки; при наведении мышью — синяя рамка и
       стрелка «→». Над типами — блок «Весь раздел» с двумя карточками.
     • Телефон 390 (касание, без наведения): стрелка видна всегда,
       после касания подсветка не остаётся.
     • Строка «N прототипов · M заданий» не рвёт число и слово.
     • Блок «Весь раздел» — на странице №12 и первым пунктом меню
       «Все разделы».
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

async function openDialog(page) {
  await page.goto(BASE + '/zadaniya/', { waitUntil: 'networkidle' });
  await page
    .locator('.tasks-grid button, .tasks-grid [role=button]')
    .filter({ hasText: /Графики функций/ })
    .first()
    .click();
  await page.waitForSelector('.subtopic-modal');
  await page.waitForTimeout(500);
}

/** Как выглядит карточка: рамка, фон, видна ли стрелка, есть ли галочка. */
async function cardLook(page, selector, index) {
  return page.evaluate(
    ([sel, i]) => {
      const card = document.querySelectorAll(sel)[i];
      const go = card.querySelector('[class*="__go"]');
      const style = getComputedStyle(card);
      return {
        border: style.borderTopColor,
        background: style.backgroundColor,
        arrow: go ? Number(getComputedStyle(go).opacity) : -1,
        checks: card.querySelectorAll('[class*="__check"]').length,
      };
    },
    [selector, index],
  );
}

/* ── Компьютер: покой и наведение ───────────────────────────────── */
{
  const ctx = await context(1440, 900, false);
  const page = await ctx.newPage();
  await openDialog(page);
  const rest = await cardLook(page, 'a.subtopic-card', 1);
  check(rest.checks === 0, 'окно: у карточки в покое есть галочка');
  check(rest.arrow === 0, `окно: стрелка видна без наведения (opacity ${rest.arrow})`);
  const allChecks = await page.locator('.subtopic-modal .subtopic-card__check').count();
  check(allChecks === 0, `окно: галочек на карточках ${allChecks}`);
  check((await page.locator('.subtopic-modal .ves-card').count()) === 2, 'окно: нет двух карточек «Весь раздел»');
  check((await page.locator('.subtopic-modal .ves-or').count()) === 1, 'окно: нет заголовка «Или выберите тип функции»');
  await shot(page, 'okno-pokoy-1440');
  await page.locator('a.subtopic-card').nth(1).hover();
  await page.waitForTimeout(400);
  const hover = await cardLook(page, 'a.subtopic-card', 1);
  check(hover.arrow === 1, `окно: при наведении стрелка не видна (opacity ${hover.arrow})`);
  check(hover.border !== rest.border, 'окно: при наведении рамка не меняется');
  check(hover.background !== rest.background, 'окно: при наведении фон не меняется');
  const other = await cardLook(page, 'a.subtopic-card', 0);
  check(other.arrow === 0 && other.border === rest.border, 'окно: подсвечена карточка не под мышью');
  await shot(page, 'okno-navedenie-1440');

  /* Строка счёта: число и слово не разорваны. */
  const counts = await page.$$eval('.subtopic-card__count', (nodes) => nodes.map((n) => n.textContent));
  check(
    counts.length > 0 && counts.every((text) => /^\d+ \S+ · \d+ \S+$/.test(text)),
    `окно: строка счёта без неразрывных пробелов: ${counts[0]}`,
  );

  /* Страница №12 и меню «Все разделы». */
  await page.goto(BASE + '/zadaniya/12/', { waitUntil: 'networkidle' });
  check((await page.locator('.ves-razdel--page .ves-card').count()) === 2, 'страница №12: нет блока «Весь раздел»');
  await page.locator('.ves-razdel--page').scrollIntoViewIfNeeded();
  await shot(page, 'stranica-12-1440');
  await page.goto(BASE + '/zadaniya/12/linear/', { waitUntil: 'networkidle' });
  const plashka = page.locator('.razdely-plashka');
  if ((await plashka.count()) > 0) {
    await plashka.first().click();
    await page.waitForSelector('.razdely-menu');
    const first = await page.$eval('.razdely-menu__list > li', (li) => li.classList.contains('razdely-menu__ves'));
    check(first, 'меню «Все разделы»: «Весь раздел» не первым пунктом');
    check((await page.locator('.razdely-menu .ves-card').count()) === 2, 'меню: нет двух карточек «Весь раздел»');
    await page.waitForTimeout(400);
    await shot(page, 'menu-1440');
  }
  await ctx.close();
}

/* ── Телефон: стрелка видна, подсветка не залипает ──────────────── */
{
  const ctx = await context(390, 844, true);
  const page = await ctx.newPage();
  await openDialog(page);
  const rest = await cardLook(page, 'a.subtopic-card', 1);
  check(rest.arrow === 1, `390: стрелка не видна без наведения (opacity ${rest.arrow})`);
  check(rest.checks === 0, '390: у карточки есть галочка');
  await shot(page, 'okno-390');
  /* Касание без перехода: после него карточка такая же, как до. */
  await page.evaluate(() =>
    document.querySelectorAll('a.subtopic-card').forEach((a) => a.addEventListener('click', (e) => e.preventDefault())),
  );
  await page.locator('a.subtopic-card').nth(1).tap();
  await page.waitForTimeout(400);
  const after = await cardLook(page, 'a.subtopic-card', 1);
  check(
    after.background === rest.background && after.border === rest.border,
    '390: подсветка осталась после касания',
  );
  await ctx.close();
}

/* ── Зачётная работа: от настройки до итогов ───────────────────── */
for (const [width, height, mobile] of [
  [1440, 900, false],
  [390, 844, true],
]) {
  const ctx = await context(width, height, mobile);
  const page = await ctx.newPage();
  const where = (text) => `${width}: ${text}`;
  await page.goto(BASE + '/zadaniya/12/zachyot/', { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: /ФИПИ \+ аналоги/ }).click();
  /* Типы: прямая, парабола и показательная. */
  /* «Выбрать все» / «Снять все» — до пустого выбора. */
  const all = page.locator('.type-picker__all');
  if (!/Снять/.test((await all.textContent()) ?? '')) {
    await all.click();
  }
  await all.click();
  for (const name of ['Линейная функция', 'Квадратичная функция', 'Показательная функция']) {
    await page.getByRole('checkbox', { name, exact: true }).click();
  }
  await page.locator('[aria-labelledby$="-v"] .cfg-opt').filter({ hasText: /^2$/ }).click();
  await page.getByLabel('Учитель').fill('Иванова А. Б.');
  await page.waitForTimeout(300);
  const count = await page.textContent('[data-testid=zachyot-count]');
  check(/6 задач/.test(count ?? '') && /2 варианта/.test(count ?? ''), where(`сводка: «${count}»`));
  await shot(page, `zachyot-nastroyka-${width}`, true);

  const studentHref = await page.getAttribute('[data-testid=zachyot-print-student]', 'href');
  const teacherHref = await page.getAttribute('[data-testid=zachyot-print-teacher]', 'href');
  const runHref = await page.getAttribute('[data-testid=zachyot-link]', 'href');
  check(studentHref !== null && teacherHref !== null && runHref !== null, where('нет ссылок на листы и онлайн'));

  const texts = [];
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
    } else {
      check(!/Ответы/.test(info.text.replace(/Ответ:/g, '')), where('лист ученика: в нём ответы'));
    }
    texts.push(info.text);
    await sheet.evaluate(() => window.scrollTo(0, 0));
    await shot(sheet, `zachyot-list-${kind}-${width}`);
    if (kind === 'uchitel' && SHOTS) {
      /* Страница с таблицей ответов всех вариантов и шкалой. */
      await sheet
        .locator('#sheet-pages .sheet-page', { has: sheet.locator('.sheet-work-key') })
        .first()
        .screenshot({ path: path.join(SHOTS, `zachyot-list-uchitel-otvety-${width}.png`) });
    }
    await sheet.close();
  }

  /* Онлайн: вариант 2, ответ на первую задачу, остальные пропущены. */
  await page.goto(BASE + runHref, { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: 'Вариант 2' }).click();
  await page.click('[data-testid=exam-start]');
  await page.waitForSelector('.exam__task', { timeout: 60000 });
  const navCount = await page.locator('.exam__no').count();
  check(navCount === 6, where(`онлайн: номеров задач ${navCount}, а не 6`));
  check((await page.locator('.exam .psol, .exam [class*="hint"]').count()) === 0, where('онлайн: на экране подсказка'));
  const input = page.locator('[data-testid=exam-input]');
  if ((await input.count()) > 0) {
    await input.fill('1');
  }
  await page.click('[data-testid=exam-skip]');
  await page.locator('.exam__no').first().click();
  const kept = (await input.count()) > 0 ? await input.inputValue() : '1';
  check(kept === '1', where(`онлайн: ответ не сохранился при возврате («${kept}»)`));
  await shot(page, `zachyot-onlayn-${width}`, true);
  await page.click('[data-testid=exam-finish]');
  await page.click('[data-testid=exam-confirm]');
  await page.waitForSelector('[data-testid=exam-result]', { timeout: 30000 });
  const grade = await page.textContent('[data-testid=exam-grade]');
  check(['2', '3', '4', '5'].includes((grade ?? '').trim()), where(`итоги: оценка «${grade}»`));
  const kinds = await page.locator('.tkind').count();
  check(kinds === 3, where(`итоги: строк по типам ${kinds}, а типов 3`));
  await shot(page, `zachyot-itogi-${width}`, true);
  await ctx.close();
}

/* ── Генератор по всем типам: лист ─────────────────────────────── */
{
  const ctx = await context(1440, 900, false);
  const page = await ctx.newPage();
  await page.goto(BASE + '/zadaniya/12/generator/', { waitUntil: 'networkidle' });
  await shot(page, 'generator-1440', true);
  const href = await page.locator('.kit-bar a, .kit a').filter({ hasText: /Лист ученика/ }).first().getAttribute('href');
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
    check(info.tasks === 14, `генератор: задач на листе ${info.tasks}, а заказано 14`);
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
console.log(`«Весь №12» на сайте: проверок ${checks}, расхождений нет.`);
